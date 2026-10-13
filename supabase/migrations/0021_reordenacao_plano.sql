-- Ordem manual de irmãos. A transação altera somente ordem e registra o histórico.
CREATE OR REPLACE FUNCTION public.reordenar_plano(
  p_nivel text, p_pai text, p_antes jsonb, p_ids uuid[], p_autor text, p_papel text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  tabela text;
  coluna text;
  tipo_pai text;
  filtro text := '';
  projeto bigint;
  entidade public.entidade_operacao_enum;
  atual jsonb;
  esperado jsonb;
  atuais uuid[];
  novos uuid[];
BEGIN
  IF p_nivel = 'meta' THEN
    SELECT id INTO projeto FROM public.projetos WHERE id = p_pai::bigint FOR UPDATE;
    tabela := 'metas'; coluna := 'projeto_id'; tipo_pai := 'bigint'; entidade := 'meta';
  ELSIF p_nivel = 'etapa' THEN
    SELECT projeto_id INTO projeto FROM public.metas WHERE id = p_pai::uuid FOR UPDATE;
    tabela := 'etapas'; coluna := 'meta_id'; tipo_pai := 'uuid'; entidade := 'etapa';
  ELSIF p_nivel = 'atividade' THEN
    SELECT m.projeto_id INTO projeto FROM public.etapas e JOIN public.metas m ON m.id = e.meta_id
      WHERE e.id = p_pai::uuid FOR UPDATE OF e;
    tabela := 'atividades'; coluna := 'etapa_id'; tipo_pai := 'uuid'; entidade := 'especificacao';
    filtro := ' AND excluido_em IS NULL';
  ELSE
    RAISE EXCEPTION 'Nível do plano inválido.';
  END IF;
  IF projeto IS NULL THEN RAISE EXCEPTION 'Origem do plano não encontrada.'; END IF;
  IF p_antes IS NULL OR jsonb_typeof(p_antes) <> 'array' OR p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    RAISE EXCEPTION 'Informe a lista completa de itens.';
  END IF;
  -- Também protege contra edição/exclusão dos irmãos durante esta transação.
  EXECUTE format('SELECT id FROM public.%I WHERE %I = $1::%s%s ORDER BY id FOR UPDATE', tabela, coluna, tipo_pai, filtro) USING p_pai;
  EXECUTE format('SELECT coalesce(jsonb_agg(jsonb_build_object(''id'', id, ''order'', ordem) ORDER BY id), ''[]''::jsonb), array_agg(id ORDER BY id) FROM public.%I WHERE %I = $1::%s%s', tabela, coluna, tipo_pai, filtro)
    INTO atual, atuais USING p_pai;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', r.id, 'order', r."order") ORDER BY r.id), '[]'::jsonb)
    INTO esperado FROM jsonb_to_recordset(p_antes) AS r(id uuid, "order" numeric);
  IF atual IS DISTINCT FROM esperado THEN
    RAISE EXCEPTION 'A lista foi alterada por outra pessoa. Atualize o plano e tente novamente.';
  END IF;
  SELECT array_agg(id ORDER BY id) INTO novos FROM unnest(p_ids) AS t(id);
  IF atuais IS DISTINCT FROM novos OR EXISTS (SELECT 1 FROM unnest(p_ids) AS t(id) GROUP BY id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'A reordenação deve manter todos os itens da mesma origem, sem duplicações.';
  END IF;
  EXECUTE format('UPDATE public.%I AS item SET ordem = nova.posicao FROM unnest($1::uuid[]) WITH ORDINALITY AS nova(id, posicao) WHERE item.id = nova.id AND item.%I = $2::%s%s', tabela, coluna, tipo_pai, filtro)
    USING p_ids, p_pai;
  INSERT INTO public.log_alteracoes_meta (projeto_id, entidade, acao, parent_id, target_path, campo, de_valor, para_valor, payload, autor, autor_papel, aprovado_por)
    VALUES (projeto, entidade, 'editar', CASE WHEN p_nivel = 'meta' THEN NULL ELSE p_pai::uuid END,
      'Ordenação de ' || tabela, 'ordem', atual::text, to_jsonb(p_ids)::text,
      jsonb_build_object('antes', atual, 'ids', p_ids), p_autor, p_papel, p_autor);
END;
$$;
-- A sessão e a permissão de escrita são verificadas no handler do servidor.
REVOKE ALL ON FUNCTION public.reordenar_plano(text, text, jsonb, uuid[], text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reordenar_plano(text, text, jsonb, uuid[], text, text) TO service_role;
