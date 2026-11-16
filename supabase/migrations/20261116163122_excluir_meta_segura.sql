-- A trava da meta impede que novas referências por chave estrangeira sejam
-- inseridas entre a conferência e a exclusão. Histórico e exclusão são atômicos.
CREATE OR REPLACE FUNCTION public.excluir_meta_segura(p_meta uuid, p_autor text, p_papel text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp AS $$
DECLARE m public.metas%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.metas WHERE id = p_meta FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Meta não encontrada.'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint k
    JOIN pg_class c ON c.oid=k.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=k.conkey[1]
    WHERE k.contype='f' AND k.confrelid='public.metas'::regclass
      AND (n.nspname<>'public' OR cardinality(k.conkey)<>1 OR (c.relname,a.attname) NOT IN
        (('etapas','meta_id'),('plano_riscos','meta_id'),('mudancas','meta_id'),('orcamento_itens','meta_id')))
  ) THEN RAISE EXCEPTION 'Existe um tipo de vínculo ainda não suportado. Exclusão bloqueada para preservar os dados.'; END IF;
  IF EXISTS (SELECT 1 FROM public.etapas WHERE meta_id=p_meta)
    OR EXISTS (SELECT 1 FROM public.plano_riscos WHERE meta_id=p_meta)
    OR EXISTS (SELECT 1 FROM public.mudancas WHERE meta_id=p_meta)
    OR EXISTS (SELECT 1 FROM public.orcamento_itens WHERE meta_id=p_meta)
  THEN RAISE EXCEPTION 'Esta meta possui etapas, riscos, mudanças ou itens de orçamento vinculados. Remova ou transfira esses vínculos antes de excluí-la.'; END IF;
  INSERT INTO public.log_alteracoes_meta(projeto_id,entidade,acao,target_id,parent_id,target_path,de_valor,autor,autor_papel,aprovado_por)
    VALUES(m.projeto_id,'meta','excluir',m.id,NULL,'Meta '||m.nome,m.nome,p_autor,p_papel,p_autor);
  DELETE FROM public.metas WHERE id=m.id;
END;
$$;
REVOKE ALL ON FUNCTION public.excluir_meta_segura(uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.excluir_meta_segura(uuid,text,text) TO service_role;
