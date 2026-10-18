-- Reclassificação explícita, com redistribuição individual dos vínculos.
-- Nenhum registro operacional é alterado na instalação destas funções.
CREATE OR REPLACE FUNCTION public.registros_reclassificacao_plano(p_projeto bigint)
RETURNS TABLE(tipo text,id uuid,nome text,pai uuid,dados jsonb)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, pg_temp AS $$
  SELECT 'meta',m.id,m.nome,NULL::uuid,to_jsonb(m) FROM public.metas m WHERE m.projeto_id=p_projeto
  UNION ALL
  SELECT 'etapa',e.id,e.nome,e.meta_id,to_jsonb(e) FROM public.etapas e JOIN public.metas m ON m.id=e.meta_id WHERE m.projeto_id=p_projeto
  UNION ALL
  SELECT 'atividade',a.id,a.nome,a.etapa_id,to_jsonb(a) FROM public.atividades a
    JOIN public.etapas e ON e.id=a.etapa_id JOIN public.metas m ON m.id=e.meta_id WHERE m.projeto_id=p_projeto;
$$;

CREATE OR REPLACE FUNCTION public.previa_reclassificacao_plano(p_tipo text,p_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  projeto bigint; origem jsonb; registros jsonb; opcoes jsonb;
  dependencias jsonb := '[]'::jsonb; linhas jsonb; spec record; tabela text;
BEGIN
  IF p_tipo='meta' THEN
    SELECT m.projeto_id INTO projeto FROM public.metas m WHERE m.id=p_id;
    tabela := 'metas';
  ELSIF p_tipo='etapa' THEN
    SELECT m.projeto_id INTO projeto FROM public.etapas e JOIN public.metas m ON m.id=e.meta_id WHERE e.id=p_id;
    tabela := 'etapas';
  ELSIF p_tipo='atividade' THEN
    SELECT m.projeto_id INTO projeto FROM public.atividades a JOIN public.etapas e ON e.id=a.etapa_id
      JOIN public.metas m ON m.id=e.meta_id WHERE a.id=p_id AND a.excluido_em IS NULL;
    tabela := 'atividades';
  ELSE RAISE EXCEPTION 'Tipo do plano inválido.';
  END IF;
  IF projeto IS NULL THEN RAISE EXCEPTION 'Registro não encontrado.'; END IF;
  SELECT r.dados INTO origem FROM public.registros_reclassificacao_plano(projeto) r WHERE r.tipo=p_tipo AND r.id=p_id;
  -- Todas as referências conhecidas são preservadas, inclusive itens excluídos.
  -- Uma FK nova e ainda não tratada bloqueia a conversão em vez de fazer CASCADE.
  IF EXISTS (
    SELECT 1 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.conkey[1]
    WHERE k.contype='f' AND k.confrelid=to_regclass('public.'||tabela)
      AND (n.nspname<>'public' OR cardinality(k.conkey)<>1 OR (c.relname,a.attname) NOT IN (
        ('etapas','meta_id'),('atividades','etapa_id'),('plano_riscos','meta_id'),('plano_riscos','etapa_id'),
        ('mudancas','meta_id'),('orcamento_itens','meta_id'),('tarefas','atividade_id'),
        ('projeto_anexos','atividade_id'),('mensagem_atribuicoes','atividade_id')))
  ) THEN RAISE EXCEPTION 'Há um vínculo novo ainda não suportado. A reclassificação foi bloqueada para preservar os dados.'; END IF;
  FOR spec IN SELECT * FROM (VALUES
    ('meta','etapas','meta_id','Etapa'),('meta','plano_riscos','meta_id','Risco'),
    ('meta','mudancas','meta_id','Mudança'),('meta','orcamento_itens','meta_id','Item de orçamento'),
    ('etapa','atividades','etapa_id','Atividade'),('etapa','plano_riscos','etapa_id','Risco'),
    ('atividade','tarefas','atividade_id','Tarefa'),('atividade','projeto_anexos','atividade_id','Anexo'),
    ('atividade','mensagem_atribuicoes','atividade_id','Encaminhamento')
  ) AS s(tipo,tabela,coluna,grupo) WHERE s.tipo=p_tipo LOOP
    EXECUTE format('SELECT coalesce(jsonb_agg(jsonb_build_object(''chave'', $2 || '':'' || t.id::text,
      ''tabela'', $2, ''coluna'', $3, ''id'', t.id, ''grupo'', $4,
      ''nome'', coalesce(to_jsonb(t)->>''nome'',to_jsonb(t)->>''item'',to_jsonb(t)->>''titulo'',
        to_jsonb(t)->>''nome_arquivo'',to_jsonb(t)->>''descricao'',to_jsonb(t)->>''acao'',$4),
      ''antes'',to_jsonb(t)) ORDER BY t.id),''[]''::jsonb) FROM public.%I t WHERE t.%I=$1', spec.tabela,spec.coluna)
      INTO linhas USING p_id,spec.tabela,spec.coluna,spec.grupo;
    dependencias := dependencias || linhas;
  END LOOP;
  SELECT jsonb_agg(r.dados || jsonb_build_object('tipo',r.tipo) ORDER BY r.tipo,r.id),
    jsonb_agg(jsonb_build_object('tipo',r.tipo,'id',r.id,'nome',r.nome,'pai',r.pai) ORDER BY r.tipo,r.nome,r.id)
      FILTER (WHERE r.id<>p_id AND (r.dados->>'excluido_em') IS NULL)
    INTO registros,opcoes FROM public.registros_reclassificacao_plano(projeto) r;
  RETURN jsonb_build_object('projeto',projeto,'tipo',p_tipo,'id',p_id,'nome',origem->>'nome',
    'origem',origem,'dependencias',dependencias,'registros',coalesce(opcoes,'[]'::jsonb),
    'token',md5(origem::text || dependencias::text || registros::text));
END $$;

CREATE OR REPLACE FUNCTION public.reclassificar_plano(
  p_tipo text,p_id uuid,p_novo_tipo text,p_pai uuid,p_token text,p_destinos jsonb,
  p_motivo text,p_autor text,p_papel text
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  previa jsonb; origem jsonb; vinculo jsonb; movimento jsonb; destino record; pai record;
  projeto bigint; tabela text; nova_tabela text; ordem numeric; meta uuid; nome text; entidade public.entidade_operacao_enum;
BEGIN
  IF p_tipo NOT IN ('meta','etapa','atividade') OR p_novo_tipo NOT IN ('meta','etapa','atividade') OR
    p_tipo IS NULL OR p_novo_tipo IS NULL OR p_tipo=p_novo_tipo OR nullif(trim(p_motivo),'') IS NULL OR
    length(p_motivo)>2000 OR nullif(trim(p_autor),'') IS NULL OR nullif(trim(p_papel),'') IS NULL OR
    jsonb_typeof(p_destinos) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Dados da reclassificação inválidos.'; END IF;
  -- Ordem fixa dos locks evita corrida com inserts, edições, exclusões e outras
  -- conversões. Os locks existem só durante esta chamada, nunca durante a prévia.
  LOCK TABLE public.atividades,public.etapas,public.mensagem_atribuicoes,public.metas,
    public.mudancas,public.orcamento_itens,public.plano_riscos,public.projeto_anexos,public.tarefas
    IN SHARE ROW EXCLUSIVE MODE;
  previa := public.previa_reclassificacao_plano(p_tipo,p_id);
  IF p_token IS DISTINCT FROM previa->>'token' THEN
    RAISE EXCEPTION 'O plano ou seus vínculos mudaram. Atualize a prévia e escolha os destinos novamente.';
  END IF;
  projeto := (previa->>'projeto')::bigint; origem := previa->'origem'; nome := origem->>'nome';
  IF jsonb_array_length(p_destinos)<>jsonb_array_length(previa->'dependencias') OR EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_destinos) x GROUP BY x->>'chave' HAVING count(*)<>1
  ) THEN RAISE EXCEPTION 'Escolha um destino para cada vínculo, sem repetições.'; END IF;
  IF p_novo_tipo='meta' THEN
    IF p_pai IS NOT NULL THEN RAISE EXCEPTION 'Meta pertence diretamente ao projeto.'; END IF;
  ELSE
    SELECT * INTO pai FROM public.registros_reclassificacao_plano(projeto) r
      WHERE r.id=p_pai AND r.id<>p_id AND r.tipo=CASE WHEN p_novo_tipo='etapa' THEN 'meta' ELSE 'etapa' END;
    IF NOT FOUND THEN RAISE EXCEPTION 'Escolha um destino válido dentro deste projeto.'; END IF;
  END IF;
  -- Valida a lista inteira ANTES de escrever. Tabela, coluna e ID vêm da
  -- prévia recalculada no banco, nunca de identificadores enviados pelo cliente.
  FOR vinculo IN SELECT value FROM jsonb_array_elements(previa->'dependencias') LOOP
    SELECT value INTO movimento FROM jsonb_array_elements(p_destinos) x WHERE x->>'chave'=vinculo->>'chave';
    SELECT * INTO destino FROM public.registros_reclassificacao_plano(projeto) r
      WHERE r.id=(movimento->>'destinoId')::uuid AND r.tipo=p_tipo AND r.id<>p_id AND (r.dados->>'excluido_em') IS NULL;
    IF NOT FOUND THEN RAISE EXCEPTION 'Escolha um destino válido para %.',vinculo->>'nome'; END IF;
  END LOOP;
  tabela := CASE p_tipo WHEN 'meta' THEN 'metas' WHEN 'etapa' THEN 'etapas' ELSE 'atividades' END;
  nova_tabela := CASE p_novo_tipo WHEN 'meta' THEN 'metas' WHEN 'etapa' THEN 'etapas' ELSE 'atividades' END;
  IF p_novo_tipo='meta' THEN
    SELECT coalesce(max(m.ordem),0)+1 INTO ordem FROM public.metas m WHERE m.projeto_id=projeto;
    INSERT INTO public.metas(id,projeto_id,nome,ordem,responsavel,inicio_previsto,fim_previsto,criado_em)
      VALUES(p_id,projeto,nome,ordem,origem->>'responsavel',(origem->>'inicio_previsto')::date,
        (origem->>'fim_previsto')::date,(origem->>'criado_em')::timestamptz);
  ELSIF p_novo_tipo='etapa' THEN
    SELECT coalesce(max(e.ordem),0)+1 INTO ordem FROM public.etapas e WHERE e.meta_id=p_pai;
    INSERT INTO public.etapas(id,meta_id,nome,ordem,resultado_esperado,inicio_previsto,fim_previsto,inicio_realizado,fim_realizado,criado_em)
      VALUES(p_id,p_pai,nome,ordem,origem->>'resultado_esperado',(origem->>'inicio_previsto')::date,
        (origem->>'fim_previsto')::date,(origem->>'inicio_realizado')::date,(origem->>'fim_realizado')::date,(origem->>'criado_em')::timestamptz);
  ELSE
    SELECT coalesce(max(a.ordem),0)+1 INTO ordem FROM public.atividades a WHERE a.etapa_id=p_pai;
    INSERT INTO public.atividades(id,etapa_id,nome,ordem,responsavel,observacoes,inicio_previsto,fim_previsto,inicio_realizado,fim_realizado,criado_em)
      VALUES(p_id,p_pai,nome,ordem,origem->>'responsavel',origem->>'resultado_esperado',(origem->>'inicio_previsto')::date,
        (origem->>'fim_previsto')::date,(origem->>'inicio_realizado')::date,(origem->>'fim_realizado')::date,(origem->>'criado_em')::timestamptz);
  END IF;
  FOR vinculo IN SELECT value FROM jsonb_array_elements(previa->'dependencias') LOOP
    SELECT value INTO movimento FROM jsonb_array_elements(p_destinos) x WHERE x->>'chave'=vinculo->>'chave';
    EXECUTE format('UPDATE public.%I SET %I=$1 WHERE id=$2 AND %I=$3',vinculo->>'tabela',vinculo->>'coluna',vinculo->>'coluna')
      USING (movimento->>'destinoId')::uuid,(vinculo->>'id')::uuid,p_id;
    IF vinculo->>'tabela' IN ('etapas','atividades','tarefas') THEN
      EXECUTE format('SELECT coalesce(max(ordem),0)+1 FROM public.%I WHERE %I=$1 AND id<>$2',vinculo->>'tabela',vinculo->>'coluna')
        INTO ordem USING (movimento->>'destinoId')::uuid,(vinculo->>'id')::uuid;
      EXECUTE format('UPDATE public.%I SET ordem=$1 WHERE id=$2',vinculo->>'tabela') USING ordem,(vinculo->>'id')::uuid;
    END IF;
  END LOOP;
  IF p_tipo='etapa' THEN
    UPDATE public.plano_riscos r SET meta_id=e.meta_id FROM public.etapas e
      WHERE e.id=r.etapa_id AND r.id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(previa->'dependencias') x WHERE x->>'tabela'='plano_riscos');
  END IF;
  -- Risco com etapa segue a meta da etapa. A escolha explícita de meta feita
  -- na prévia precisa concordar com essa hierarquia; nunca se corrige às cegas.
  IF EXISTS (SELECT 1 FROM public.plano_riscos r JOIN public.etapas e ON e.id=r.etapa_id
    JOIN public.metas m ON m.id=e.meta_id WHERE r.projeto_id=projeto AND r.meta_id IS DISTINCT FROM e.meta_id
    AND (r.id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(previa->'dependencias') x WHERE x->>'tabela'='plano_riscos')
      OR r.etapa_id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(previa->'dependencias') x WHERE x->>'tabela'='etapas'))) THEN
    RAISE EXCEPTION 'O destino do risco precisa corresponder à meta de sua etapa. Revise os destinos escolhidos.';
  END IF;
  -- Mantém os limites de data das atividades que foram deslocadas/criadas.
  IF EXISTS (SELECT 1 FROM public.atividades a JOIN public.etapas e ON e.id=a.etapa_id
    WHERE (a.id=p_id AND p_novo_tipo='atividade' OR a.id IN (
      SELECT (x->>'id')::uuid FROM jsonb_array_elements(previa->'dependencias') x WHERE x->>'tabela'='atividades'))
    AND (e.inicio_previsto IS NULL OR e.fim_previsto IS NULL OR
      a.inicio_previsto<e.inicio_previsto OR a.fim_previsto>e.fim_previsto OR
      a.inicio_realizado<coalesce(e.inicio_realizado,e.inicio_previsto) OR a.fim_realizado>coalesce(e.fim_realizado,e.fim_previsto))) THEN
    RAISE EXCEPTION 'Uma atividade fica fora do período da etapa escolhida. Ajuste o período ou escolha outra etapa.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.atividades a JOIN public.plano_riscos r ON r.id=a.risco_origem_id
    WHERE a.id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(previa->'dependencias') x WHERE x->>'tabela'='atividades')
      AND r.etapa_id IS DISTINCT FROM a.etapa_id) THEN
    RAISE EXCEPTION 'A atividade de resposta e seu risco precisam ficar na mesma etapa.';
  END IF;
  -- Só apaga o recipiente original quando todos os vínculos foram realocados.
  -- O conteúdo completo e todos os destinos ficam no histórico transacional.
  EXECUTE format('DELETE FROM public.%I WHERE id=$1',tabela) USING p_id;
  entidade := CASE p_novo_tipo WHEN 'meta' THEN 'meta' WHEN 'etapa' THEN 'etapa' ELSE 'especificacao' END;
  INSERT INTO public.log_alteracoes_meta(projeto_id,entidade,acao,target_id,parent_id,target_path,campo,de_valor,para_valor,payload,autor,autor_papel,aprovado_por)
    VALUES(projeto,entidade,'editar',p_id,p_pai,nome,'tipo do registro',p_tipo,p_novo_tipo,
      jsonb_build_object('motivo',trim(p_motivo),'origem',origem,'vinculos',previa->'dependencias','destinos',p_destinos),p_autor,p_papel,p_autor);
  RETURN p_id;
END $$;

REVOKE ALL ON FUNCTION public.registros_reclassificacao_plano(bigint),public.previa_reclassificacao_plano(text,uuid),
  public.reclassificar_plano(text,uuid,text,uuid,text,jsonb,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registros_reclassificacao_plano(bigint),public.previa_reclassificacao_plano(text,uuid),
  public.reclassificar_plano(text,uuid,text,uuid,text,jsonb,text,text,text) TO service_role;
