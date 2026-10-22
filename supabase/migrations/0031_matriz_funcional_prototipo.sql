-- Acréscimo compatível. Não transforma nem remove respostas do catálogo legado.
DO $$ DECLARE c text; BEGIN
  FOREACH c IN ARRAY ARRAY['funcao_nome','experiencia','externo'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='diagnostico_matriz' AND column_name=c AND udt_name<>'text') THEN
      RAISE EXCEPTION 'Coluna % da Matriz tem tipo incompatível. Nenhum dado foi convertido.',c;
    END IF;
  END LOOP;
END $$;
ALTER TABLE public.diagnostico_matriz ADD COLUMN IF NOT EXISTS funcao_nome text;
ALTER TABLE public.diagnostico_matriz ADD COLUMN IF NOT EXISTS experiencia text;
ALTER TABLE public.diagnostico_matriz ADD COLUMN IF NOT EXISTS externo text;

CREATE OR REPLACE FUNCTION public.salvar_matriz_prototipo(
  p_organizacao uuid,p_diagnostico uuid,p_funcao text,p_nome text,p_atuacao text,
  p_experiencia text,p_criticidade text,p_interesse text,p_observacao text,p_externo text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE estado text; resultado public.diagnostico_matriz%ROWTYPE;
BEGIN
  IF p_organizacao IS NULL OR p_diagnostico IS NULL OR p_funcao IS NULL OR p_funcao !~ '^F(0[1-9]|1[0-9]|2[01])$'
    OR nullif(trim(p_nome),'') IS NULL OR length(p_nome)>500 THEN RAISE EXCEPTION 'Organização, aplicação ou função da Matriz inválida.'; END IF;
  IF (p_atuacao IS NOT NULL AND p_atuacao NOT IN ('Não realiza','Executa','Viabiliza','Viabiliza e executa'))
    OR (p_experiencia IS NOT NULL AND p_experiencia NOT IN ('Não está acontecendo','Inicial','Recorrente'))
    OR (p_criticidade IS NOT NULL AND p_criticidade NOT IN ('1','2','3','4'))
    OR (p_interesse IS NOT NULL AND p_interesse NOT IN ('1','2','3','4'))
    OR length(p_observacao)>20000 OR length(p_externo)>20000 THEN RAISE EXCEPTION 'Opções ou textos da Matriz inválidos.'; END IF;
  -- A linha pai é bloqueada antes da escrita, inclusive contra conclusão concorrente.
  SELECT status INTO estado FROM public.diagnosticos WHERE id=p_diagnostico AND comunidade_id=p_organizacao FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'A aplicação não pertence à organização selecionada.'; END IF;
  IF estado<>'em_edicao' THEN RAISE EXCEPTION 'Diagnóstico concluído: crie uma nova versão para alterar.'; END IF;
  INSERT INTO public.diagnostico_matriz(diagnostico_id,funcao_id,funcao_nome,atuacao,experiencia,criticidade,interesse,observacoes,externo,atualizado_em)
    VALUES(p_diagnostico,p_funcao,trim(p_nome),CASE WHEN p_atuacao IS NULL THEN '{}'::text[] ELSE ARRAY[p_atuacao] END,
      p_experiencia,p_criticidade,p_interesse,p_observacao,p_externo,now())
    ON CONFLICT(diagnostico_id,funcao_id) DO UPDATE SET funcao_nome=EXCLUDED.funcao_nome,atuacao=EXCLUDED.atuacao,
      experiencia=EXCLUDED.experiencia,criticidade=EXCLUDED.criticidade,interesse=EXCLUDED.interesse,
      observacoes=EXCLUDED.observacoes,externo=EXCLUDED.externo,atualizado_em=EXCLUDED.atualizado_em
    RETURNING * INTO resultado;
  UPDATE public.diagnosticos SET atualizado_em=now() WHERE id=p_diagnostico;
  RETURN to_jsonb(resultado);
END $$;
REVOKE ALL ON FUNCTION public.salvar_matriz_prototipo(uuid,uuid,text,text,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_matriz_prototipo(uuid,uuid,text,text,text,text,text,text,text,text) TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.diagnostico_matriz TO service_role;
GRANT SELECT,UPDATE ON public.diagnosticos TO service_role;
