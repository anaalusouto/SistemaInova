-- Corrige somente a validação da revisão: não exclui, mescla nem altera itens existentes.
CREATE OR REPLACE FUNCTION public.salvar_versao_orcamento(
  p_projeto bigint, p_antes jsonb, p_itens jsonb, p_autor text, p_importacao jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  atual jsonb; linha jsonb; anterior public.orcamento_itens%ROWTYPE;
  item_id uuid; v_importacao_id uuid; versao integer := 0;
  incluidos integer := 0; alterados integer := 0; arquivados integer := 0;
  ids uuid[] := ARRAY[]::uuid[]; posicao integer := 0;
  nova_meta uuid; quantidade_metas integer; metas_criadas uuid[] := ARRAY[]::uuid[];
BEGIN
  PERFORM 1 FROM public.projetos WHERE id = p_projeto FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Projeto não encontrado.'; END IF;
  PERFORM 1 FROM public.orcamento_itens WHERE projeto_id = p_projeto ORDER BY id FOR UPDATE;
  SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY o.id), '[]'::jsonb) INTO atual
    FROM public.orcamento_itens o WHERE projeto_id = p_projeto AND vigente;
  IF atual IS DISTINCT FROM p_antes THEN
    RAISE EXCEPTION 'O orçamento foi alterado por outra pessoa. Reabra a prévia e tente novamente.';
  END IF;
  IF jsonb_typeof(p_itens) IS DISTINCT FROM 'array' OR jsonb_array_length(p_itens) = 0 THEN
    RAISE EXCEPTION 'Informe pelo menos um item de orçamento.';
  END IF;
  -- Na edição manual, repetições já existentes não impedem corrigir outros
  -- campos. Todos os membros repetidos devem conservar o próprio ID e chave.
  -- Importações e novos membros repetidos continuam recusados.
  IF EXISTS (
    WITH repetidas AS (
      SELECT x->>'chave_origem' AS chave FROM jsonb_array_elements(p_itens) x
      GROUP BY x->>'chave_origem' HAVING count(*) > 1
    )
    SELECT 1 FROM jsonb_array_elements(p_itens) x
    JOIN repetidas r ON r.chave IS NOT DISTINCT FROM x->>'chave_origem'
    WHERE p_importacao IS NOT NULL OR NOT EXISTS (
      SELECT 1 FROM public.orcamento_itens o
      WHERE o.id = (x->>'id')::uuid AND o.projeto_id = p_projeto AND o.vigente
        AND (
          o.chave_origem IS NOT DISTINCT FROM x->>'chave_origem'
          OR (nullif(trim(o.chave_origem), '') IS NULL
            AND trim(coalesce(o.grupo, '')) = coalesce(x->>'grupo', '')
            AND trim(coalesce(o.categoria, '')) = coalesce(x->>'categoria', '')
            AND trim(o.item) = x->>'item')
        )
    )
  ) THEN
    RAISE EXCEPTION 'Há itens repetidos. Corrija a correspondência antes de salvar.';
  END IF;
  IF p_importacao IS NOT NULL THEN
    SELECT coalesce(max(o.versao), 0) + 1 INTO versao FROM public.orcamento_importacoes o WHERE projeto_id = p_projeto;
    INSERT INTO public.orcamento_importacoes(projeto_id, nome_arquivo, aba, versao, autor, resumo)
      VALUES(p_projeto, p_importacao->>'nome_arquivo', p_importacao->>'aba', versao, p_autor, p_importacao->'resumo')
      RETURNING id INTO v_importacao_id;
  END IF;
  FOR linha IN SELECT value FROM jsonb_array_elements(p_itens) LOOP
    posicao := posicao + 1;
    IF nullif(trim(linha->>'meta_nova'), '') IS NOT NULL THEN
      SELECT count(*), (array_agg(id))[1] INTO quantidade_metas, nova_meta FROM public.metas
        WHERE projeto_id = p_projeto AND nome = linha->>'meta_nova';
      IF quantidade_metas > 1 THEN RAISE EXCEPTION 'Mais de uma meta corresponde ao nome informado.'; END IF;
      IF quantidade_metas = 0 THEN
        INSERT INTO public.metas(projeto_id, nome, ordem)
          SELECT p_projeto, linha->>'meta_nova', coalesce(max(ordem), 0) + 1 FROM public.metas WHERE projeto_id = p_projeto
          RETURNING id INTO nova_meta;
        metas_criadas := array_append(metas_criadas, nova_meta);
      END IF;
      linha := (linha - 'meta_nova') || jsonb_build_object('meta_id', nova_meta);
    END IF;
    IF p_importacao IS NOT NULL AND nullif(linha->>'meta_id', '') IS NULL THEN
      RAISE EXCEPTION 'Item % (%): selecione uma meta do projeto antes de importar.', posicao, linha->>'item';
    END IF;
    IF (linha->>'meta_id' IS NOT NULL OR linha->>'id' IS NULL) AND NOT EXISTS (SELECT 1 FROM public.metas WHERE id = (linha->>'meta_id')::uuid AND projeto_id = p_projeto) THEN
      RAISE EXCEPTION 'A meta não pertence ao projeto.';
    END IF;
    IF coalesce(trim(linha->>'item'), '') = '' OR
      (linha->>'qtd')::numeric < 0 OR (linha->>'qtd_unidades')::numeric < 0 OR
      (linha->>'valor_unitario')::numeric < 0 OR (linha->>'valor_proposto')::numeric < 0 THEN
      RAISE EXCEPTION 'Os dados planejados do item são inválidos.';
    END IF;
    item_id := (linha->>'id')::uuid;
    IF item_id IS NOT NULL THEN
      IF item_id = ANY(ids) THEN RAISE EXCEPTION 'Item repetido na revisão.'; END IF;
      SELECT * INTO anterior FROM public.orcamento_itens WHERE id = item_id AND projeto_id = p_projeto AND vigente;
      IF NOT FOUND THEN RAISE EXCEPTION 'Item não pertence ao orçamento vigente deste projeto.'; END IF;
      -- A edição envia o orçamento inteiro. Não regravar linhas sem mudança:
      -- importados antigos sem meta podem ser regularizados individualmente.
      IF p_importacao IS NULL AND NOT EXISTS (
        SELECT 1 FROM jsonb_each(linha - 'id') e WHERE to_jsonb(anterior)->e.key IS DISTINCT FROM e.value
      ) THEN
        ids := array_append(ids, item_id);
        CONTINUE;
      END IF;
      IF nullif(linha->>'meta_id', '') IS NULL THEN
        RAISE EXCEPTION 'Item % (%): selecione uma meta do projeto antes de salvar.', posicao, linha->>'item';
      END IF;
      IF EXISTS (SELECT 1 FROM jsonb_each(linha - 'id') e WHERE to_jsonb(anterior)->e.key IS DISTINCT FROM e.value) THEN
        alterados := alterados + 1;
        INSERT INTO public.orcamento_item_historico(item_id, evento, autor, valor_anterior, valor_novo, detalhe)
          VALUES(item_id, 'correção de origem', p_autor, anterior.valor_proposto::text,
            linha->>'valor_proposto', jsonb_build_object('origem', coalesce(p_importacao->>'nome_arquivo', 'Edição na plataforma'),
            'antes', to_jsonb(anterior), 'depois', linha)::text);
      END IF;
      UPDATE public.orcamento_itens SET meta_id = (linha->>'meta_id')::uuid,
        grupo = linha->>'grupo', categoria = linha->>'categoria', item = linha->>'item',
        qtd = (linha->>'qtd')::numeric, unidade = linha->>'unidade', qtd_unidades = (linha->>'qtd_unidades')::numeric,
        valor_unitario = (linha->>'valor_unitario')::numeric, valor_proposto = (linha->>'valor_proposto')::numeric,
        chave_origem = linha->>'chave_origem', ordem = posicao, importacao_id = coalesce(v_importacao_id, orcamento_itens.importacao_id)
        WHERE id = item_id;
    ELSE
      INSERT INTO public.orcamento_itens(projeto_id, meta_id, grupo, categoria, item, qtd, unidade,
        qtd_unidades, valor_unitario, valor_proposto, chave_origem, ordem, importacao_id, situacao, valor_executado)
      VALUES(p_projeto, (linha->>'meta_id')::uuid, linha->>'grupo', linha->>'categoria', linha->>'item',
        (linha->>'qtd')::numeric, linha->>'unidade', (linha->>'qtd_unidades')::numeric,
        (linha->>'valor_unitario')::numeric, (linha->>'valor_proposto')::numeric,
        linha->>'chave_origem', posicao, v_importacao_id, 'Ativo', NULL) RETURNING id INTO item_id;
      incluidos := incluidos + 1;
      INSERT INTO public.orcamento_item_historico(item_id, evento, autor, valor_novo, detalhe)
        VALUES(item_id, 'importação', p_autor, linha->>'valor_proposto',
          coalesce(p_importacao->>'nome_arquivo', 'Inclusão na plataforma'));
    END IF;
    ids := array_append(ids, item_id);
  END LOOP;
  FOR anterior IN SELECT * FROM public.orcamento_itens WHERE projeto_id = p_projeto AND vigente AND NOT (id = ANY(ids)) LOOP
    UPDATE public.orcamento_itens SET vigente = false WHERE id = anterior.id;
    arquivados := arquivados + 1;
    INSERT INTO public.orcamento_item_historico(item_id, evento, autor, valor_anterior, valor_novo, detalhe)
      VALUES(anterior.id, 'correção de origem', p_autor, anterior.valor_proposto::text, NULL,
        'Item substituído na nova versão do orçamento. Notas e execução preservadas.');
  END LOOP;
  IF v_importacao_id IS NOT NULL THEN
    UPDATE public.orcamento_importacoes SET resumo = coalesce(resumo, '{}'::jsonb) ||
      jsonb_build_object('incluidos', incluidos, 'alterados', alterados, 'ausentes', arquivados, 'metasCriadas', metas_criadas)
      WHERE id = v_importacao_id;
  END IF;
  RETURN jsonb_build_object('incluidos', incluidos, 'alterados', alterados, 'ausentes', arquivados, 'versao', versao);
END $$;
REVOKE ALL ON FUNCTION public.salvar_versao_orcamento(bigint,jsonb,jsonb,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_versao_orcamento(bigint,jsonb,jsonb,text,jsonb) TO service_role;
