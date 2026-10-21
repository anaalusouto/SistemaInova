-- Não altera tabelas ou registros na instalação. As duas operações são transações
-- únicas, com autorização no servidor e execução restrita a service_role.
CREATE OR REPLACE FUNCTION public.concluir_plano_com_periodos(
  p_tipo text, p_id uuid, p_concluido boolean, p_periodos jsonb
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  ids uuid[]; item jsonb; atividade public.atividades%ROWTYPE;
  inicio date; fim date; pendentes text;
BEGIN
  IF p_tipo IS NULL OR p_tipo NOT IN ('meta','etapa','atividade') OR p_id IS NULL OR p_concluido IS NULL
    OR jsonb_typeof(p_periodos) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Informe o registro, a conclusão e os períodos.';
  END IF;
  LOCK TABLE public.atividades,public.etapas,public.metas IN SHARE ROW EXCLUSIVE MODE;
  IF NOT EXISTS (SELECT 1 FROM public.registros_reclassificacao_plano(
      CASE p_tipo WHEN 'meta' THEN (SELECT projeto_id FROM public.metas WHERE id=p_id)
      WHEN 'etapa' THEN (SELECT m.projeto_id FROM public.etapas e JOIN public.metas m ON m.id=e.meta_id WHERE e.id=p_id)
      ELSE (SELECT m.projeto_id FROM public.atividades a JOIN public.etapas e ON e.id=a.etapa_id JOIN public.metas m ON m.id=e.meta_id WHERE a.id=p_id AND a.excluido_em IS NULL) END
    ) r WHERE r.tipo=p_tipo AND r.id=p_id) THEN RAISE EXCEPTION 'Registro não encontrado.'; END IF;
  SELECT array_agg(a.id ORDER BY a.id) INTO ids FROM public.atividades a JOIN public.etapas e ON e.id=a.etapa_id
    WHERE a.excluido_em IS NULL AND CASE p_tipo WHEN 'meta' THEN e.meta_id=p_id WHEN 'etapa' THEN e.id=p_id ELSE a.id=p_id END;
  IF ids IS NULL THEN RAISE EXCEPTION 'Este item ainda não tem atividades para concluir.'; END IF;
  IF NOT p_concluido AND jsonb_array_length(p_periodos)>0 THEN RAISE EXCEPTION 'Reabrir não altera períodos.'; END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(p_periodos) x GROUP BY x->>'id' HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Informe cada atividade uma única vez.';
  END IF;
  -- Valida todo o lote antes de atualizar qualquer data ou status.
  FOR item IN SELECT value FROM jsonb_array_elements(p_periodos) LOOP
    IF (item->>'id') IS NULL OR NOT ((item->>'id')::uuid=ANY(ids)) THEN RAISE EXCEPTION 'Atividade fora do item selecionado.'; END IF;
    SELECT * INTO atividade FROM public.atividades WHERE id=(item->>'id')::uuid;
    IF jsonb_typeof(item->'antes') IS DISTINCT FROM 'object'
      OR NOT (item->'antes' ? 'inicioRealizado' AND item->'antes' ? 'fimRealizado')
      OR (item->'antes'->>'inicioRealizado') IS DISTINCT FROM atividade.inicio_realizado::text
      OR (item->'antes'->>'fimRealizado') IS DISTINCT FROM atividade.fim_realizado::text THEN
      RAISE EXCEPTION 'O período de % mudou. Atualize o plano e tente novamente.',atividade.nome;
    END IF;
    IF coalesce(item->>'inicioRealizado','') !~ '^\d{4}-\d{2}-\d{2}$' OR coalesce(item->>'fimRealizado','') !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'Preencha início e fim realizados de %.',atividade.nome;
    END IF;
    inicio := (item->>'inicioRealizado')::date; fim := (item->>'fimRealizado')::date;
    IF inicio>fim THEN RAISE EXCEPTION 'O fim realizado não pode ser anterior ao início de %.',atividade.nome; END IF;
  END LOOP;
  IF p_concluido THEN
    SELECT string_agg(a.nome, ', ' ORDER BY a.nome) INTO pendentes FROM public.atividades a
      LEFT JOIN jsonb_to_recordset(p_periodos) AS p(id uuid,"inicioRealizado" date,"fimRealizado" date) ON p.id=a.id
      WHERE a.id=ANY(ids) AND (coalesce(p."inicioRealizado",a.inicio_realizado) IS NULL
        OR coalesce(p."fimRealizado",a.fim_realizado) IS NULL
        OR coalesce(p."inicioRealizado",a.inicio_realizado)>coalesce(p."fimRealizado",a.fim_realizado));
    IF pendentes IS NOT NULL THEN RAISE EXCEPTION 'Preencha início e fim realizados válidos das atividades: %.',pendentes; END IF;
    UPDATE public.atividades a SET inicio_realizado=p."inicioRealizado",fim_realizado=p."fimRealizado"
      FROM jsonb_to_recordset(p_periodos) AS p(id uuid,"inicioRealizado" date,"fimRealizado" date)
      WHERE a.id=p.id AND a.id=ANY(ids);
    UPDATE public.atividades SET status='Concluído',progresso=100 WHERE id=ANY(ids) AND status<>'Concluído';
  ELSE
    UPDATE public.atividades SET status='Em andamento',progresso=50 WHERE id=ANY(ids) AND status='Concluído';
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.concluir_plano_com_periodos(text,uuid,boolean,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.concluir_plano_com_periodos(text,uuid,boolean,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.mover_etapa_plano(
  p_projeto bigint,p_etapa uuid,p_origem uuid,p_destino uuid,p_posicao integer,
  p_antes_origem jsonb,p_antes_destino jsonb,p_autor text,p_papel text
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE
  atual_origem jsonb; atual_destino jsonb; esperado_origem jsonb; esperado_destino jsonb;
  ids_destino uuid[]; quantidade integer;
BEGIN
  IF p_projeto IS NULL OR p_etapa IS NULL OR p_origem IS NULL OR p_destino IS NULL OR p_origem=p_destino
    OR p_posicao IS NULL OR nullif(trim(p_autor),'') IS NULL OR nullif(trim(p_papel),'') IS NULL
    OR jsonb_typeof(p_antes_origem) IS DISTINCT FROM 'array' OR jsonb_typeof(p_antes_destino) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Informe origem, destino e posição válidos.';
  END IF;
  LOCK TABLE public.etapas,public.metas,public.plano_riscos IN SHARE ROW EXCLUSIVE MODE;
  IF (SELECT count(*) FROM public.metas WHERE id IN (p_origem,p_destino) AND projeto_id=p_projeto)<>2 THEN
    RAISE EXCEPTION 'Origem e destino precisam pertencer ao mesmo projeto.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.etapas WHERE id=p_etapa AND meta_id=p_origem) THEN
    RAISE EXCEPTION 'A etapa mudou de origem. Atualize o plano e tente novamente.';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'order',ordem) ORDER BY id),'[]'::jsonb) INTO atual_origem FROM public.etapas WHERE meta_id=p_origem;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'order',ordem) ORDER BY id),'[]'::jsonb),array_agg(id ORDER BY ordem,id),count(*)
    INTO atual_destino,ids_destino,quantidade FROM public.etapas WHERE meta_id=p_destino;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'order',r."order") ORDER BY id),'[]'::jsonb)
    INTO esperado_origem FROM jsonb_to_recordset(p_antes_origem) AS r(id uuid,"order" numeric);
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'order',r."order") ORDER BY id),'[]'::jsonb)
    INTO esperado_destino FROM jsonb_to_recordset(p_antes_destino) AS r(id uuid,"order" numeric);
  IF atual_origem IS DISTINCT FROM esperado_origem OR atual_destino IS DISTINCT FROM esperado_destino THEN
    RAISE EXCEPTION 'A estrutura mudou. Atualize o plano e escolha o destino novamente.';
  END IF;
  IF p_posicao<1 OR p_posicao>quantidade+1 THEN RAISE EXCEPTION 'Posição de destino inválida.'; END IF;
  ids_destino := coalesce(ids_destino[1:p_posicao-1],'{}'::uuid[]) || ARRAY[p_etapa] || coalesce(ids_destino[p_posicao:quantidade],'{}'::uuid[]);
  -- Só o pai e a ordem mudam. UUID, períodos e todos os filhos são preservados.
  UPDATE public.etapas SET meta_id=p_destino WHERE id=p_etapa;
  WITH sequencia AS (SELECT id,row_number() OVER(ORDER BY ordem,id) pos FROM public.etapas WHERE meta_id=p_origem)
    UPDATE public.etapas e SET ordem=s.pos FROM sequencia s WHERE e.id=s.id;
  UPDATE public.etapas e SET ordem=s.pos FROM unnest(ids_destino) WITH ORDINALITY AS s(id,pos) WHERE e.id=s.id;
  UPDATE public.plano_riscos SET meta_id=p_destino WHERE etapa_id=p_etapa;
  INSERT INTO public.log_alteracoes_meta(projeto_id,entidade,acao,target_id,parent_id,target_path,campo,de_valor,para_valor,payload,autor,autor_papel,aprovado_por)
    VALUES(p_projeto,'etapa','editar',p_etapa,p_destino,'Movimentação de etapa','meta e posição',p_origem::text,p_destino::text,
      jsonb_build_object('origem',p_origem,'destino',p_destino,'posicao',p_posicao,'antesOrigem',atual_origem,'antesDestino',atual_destino),p_autor,p_papel,p_autor);
END $$;
REVOKE ALL ON FUNCTION public.mover_etapa_plano(bigint,uuid,uuid,uuid,integer,jsonb,jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.mover_etapa_plano(bigint,uuid,uuid,uuid,integer,jsonb,jsonb,text,text) TO service_role;
