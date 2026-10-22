-- Rascunho da importação e decisões de conferência pertencem à aplicação selecionada.
-- Nenhuma resposta da Matriz, IEO ou Cesta é preenchida ao registrar o PDF.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public'
    AND table_name='diagnostico_matriz' AND column_name='origem_pdf' AND udt_name<>'jsonb') THEN
    RAISE EXCEPTION 'diagnostico_matriz.origem_pdf possui tipo incompatível';
  END IF;
END $$;
ALTER TABLE public.diagnostico_matriz ADD COLUMN IF NOT EXISTS origem_pdf jsonb;
CREATE TABLE IF NOT EXISTS public.diagnostico_matriz_importacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  origem jsonb NOT NULL,
  dados jsonb NOT NULL,
  pendentes text[] NOT NULL,
  conferencias jsonb NOT NULL DEFAULT '{}',
  estado text NOT NULL CHECK (estado IN ('pendente','conferida','descartada')),
  criado_por text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE faltas text; BEGIN
  SELECT string_agg(e.nome,', ') INTO faltas FROM (VALUES
    ('id','uuid'),('diagnostico_id','uuid'),('origem','jsonb'),('dados','jsonb'),('pendentes','_text'),
    ('conferencias','jsonb'),('estado','text'),('criado_por','text'),('criado_em','timestamptz'),('atualizado_em','timestamptz')) e(nome,tipo)
  LEFT JOIN information_schema.columns c ON c.table_schema='public' AND c.table_name='diagnostico_matriz_importacoes' AND c.column_name=e.nome
  WHERE c.udt_name IS DISTINCT FROM e.tipo;
  IF faltas IS NOT NULL THEN RAISE EXCEPTION 'Tabela de importações incompatível: %',faltas; END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS diagnostico_matriz_importacao_pendente_idx
  ON public.diagnostico_matriz_importacoes(diagnostico_id) WHERE estado='pendente';
ALTER TABLE public.diagnostico_matriz_importacoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.diagnostico_matriz_importacoes FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.diagnostico_matriz_importacoes TO service_role;
DROP TRIGGER IF EXISTS diagnostico_editavel_guard ON public.diagnostico_matriz_importacoes;
CREATE TRIGGER diagnostico_editavel_guard BEFORE INSERT OR UPDATE OR DELETE ON public.diagnostico_matriz_importacoes
  FOR EACH ROW EXECUTE FUNCTION public.validar_diagnostico_editavel();

CREATE OR REPLACE FUNCTION public.registrar_importacao_matriz(p_organizacao uuid,p_diagnostico uuid,p_origem jsonb,p_dados jsonb,p_autor text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE status_pai text; ids text[]; r public.diagnostico_matriz_importacoes%ROWTYPE; codigo text;
BEGIN
  SELECT status INTO status_pai FROM public.diagnosticos WHERE id=p_diagnostico AND comunidade_id=p_organizacao FOR UPDATE;
  IF NOT FOUND OR status_pai<>'em_edicao' THEN RAISE EXCEPTION 'Organização/aplicação inválida ou mapeamento concluído'; END IF;
  IF jsonb_typeof(p_origem) IS DISTINCT FROM 'object' OR nullif(trim(p_origem->>'nomeArquivo'),'') IS NULL
    OR length(p_origem->>'nomeArquivo')>255 OR (p_origem->>'sha256') IS NULL OR (p_origem->>'sha256') !~ '^[a-f0-9]{64}$'
    OR (p_origem->>'tamanho') IS NULL OR (p_origem->>'tamanho')::bigint NOT BETWEEN 1 AND 10485760
    OR nullif(trim(p_autor),'') IS NULL OR jsonb_typeof(p_dados->'conferencia') IS DISTINCT FROM 'object'
    OR pg_column_size(p_dados)>600000 THEN RAISE EXCEPTION 'Origem ou conteúdo da importação inválido'; END IF;
  FOR codigo IN SELECT jsonb_object_keys(p_dados->'conferencia') LOOP
    IF codigo !~ '^F(0[1-9]|1[0-9]|2[01])$' THEN RAISE EXCEPTION 'Função da importação inválida'; END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM public.diagnostico_matriz_importacoes WHERE diagnostico_id=p_diagnostico AND estado='pendente') THEN
    RAISE EXCEPTION 'Conclua ou descarte a importação pendente antes de importar outro PDF';
  END IF;
  SELECT coalesce(array_agg(k ORDER BY k),'{}') INTO ids FROM jsonb_object_keys(p_dados->'conferencia') k
    WHERE NOT EXISTS (SELECT 1 FROM public.diagnostico_matriz WHERE diagnostico_id=p_diagnostico AND funcao_id=k);
  INSERT INTO public.diagnostico_matriz_importacoes(diagnostico_id,origem,dados,pendentes,estado,criado_por)
    VALUES(p_diagnostico,p_origem,p_dados,ids,CASE WHEN cardinality(ids)>0 THEN 'pendente' ELSE 'conferida' END,p_autor) RETURNING * INTO r;
  RETURN to_jsonb(r);
END $$;

CREATE OR REPLACE FUNCTION public.confirmar_importacao_matriz(p_organizacao uuid,p_diagnostico uuid,p_importacao uuid,p_funcao text,
  p_resposta jsonb,p_decisoes jsonb,p_confirmado boolean,p_autor text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE i public.diagnostico_matriz_importacoes%ROWTYPE; status_pai text; campo text; decisao text; comprovante jsonb; resultado jsonb;
BEGIN
  SELECT status INTO status_pai FROM public.diagnosticos WHERE id=p_diagnostico AND comunidade_id=p_organizacao FOR UPDATE;
  IF NOT FOUND OR status_pai<>'em_edicao' THEN RAISE EXCEPTION 'Organização/aplicação inválida ou mapeamento concluído'; END IF;
  SELECT * INTO i FROM public.diagnostico_matriz_importacoes WHERE id=p_importacao AND diagnostico_id=p_diagnostico FOR UPDATE;
  IF NOT FOUND OR i.estado<>'pendente' OR NOT (p_funcao=ANY(i.pendentes)) THEN RAISE EXCEPTION 'Função não pertence a esta importação pendente'; END IF;
  IF p_confirmado IS DISTINCT FROM true OR nullif(trim(p_autor),'') IS NULL THEN RAISE EXCEPTION 'Confirme a conferência antes de salvar'; END IF;
  FOREACH campo IN ARRAY ARRAY['atuacao','experiencia','criticidade','interesse','observacoes','externo'] LOOP
    IF i.dados #>> ARRAY['conferencia',p_funcao,'campos',campo] = 'ambiguo' THEN
      decisao:=p_decisoes->>campo;
      IF decisao='nao_identificado' AND (p_resposta->>campo) IS NULL THEN CONTINUE; END IF;
      IF decisao='corrigido' AND nullif(trim(p_resposta->>campo),'') IS NOT NULL THEN CONTINUE; END IF;
      RAISE EXCEPTION 'Resolva a ambiguidade do campo % antes de salvar',campo;
    END IF;
  END LOOP;
  -- Retira a pendência sob o mesmo bloqueio. Qualquer falha na resposta desfaz ambas as gravações.
  UPDATE public.diagnostico_matriz_importacoes SET pendentes=array_remove(pendentes,p_funcao),atualizado_em=now(),
    estado=CASE WHEN cardinality(pendentes)=1 THEN 'conferida' ELSE 'pendente' END WHERE id=i.id;
  resultado:=public.salvar_matriz_prototipo(p_organizacao,p_diagnostico,p_funcao,p_resposta->>'nomeFuncao',p_resposta->>'atuacao',
    p_resposta->>'experiencia',p_resposta->>'criticidade',p_resposta->>'interesse',p_resposta->>'observacoes',p_resposta->>'externo');
  comprovante:=jsonb_build_object('importacaoId',i.id,'nomeArquivo',i.origem->>'nomeArquivo','sha256',i.origem->>'sha256',
    'importadoEm',i.criado_em,'conferidoEm',now(),'conferidoPor',p_autor,'estado','conferida','decisoes',p_decisoes);
  UPDATE public.diagnostico_matriz SET origem_pdf=comprovante WHERE diagnostico_id=p_diagnostico AND funcao_id=p_funcao;
  UPDATE public.diagnostico_matriz_importacoes SET conferencias=conferencias||jsonb_build_object(p_funcao,comprovante) WHERE id=i.id;
  RETURN resultado||jsonb_build_object('origem_pdf',comprovante);
END $$;

CREATE OR REPLACE FUNCTION public.descartar_importacao_matriz(p_organizacao uuid,p_diagnostico uuid,p_importacao uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE status_pai text;
BEGIN
  SELECT status INTO status_pai FROM public.diagnosticos WHERE id=p_diagnostico AND comunidade_id=p_organizacao FOR UPDATE;
  IF NOT FOUND OR status_pai<>'em_edicao' THEN RAISE EXCEPTION 'Organização/aplicação inválida ou mapeamento concluído'; END IF;
  UPDATE public.diagnostico_matriz_importacoes SET estado='descartada',pendentes='{}',atualizado_em=now()
    WHERE id=p_importacao AND diagnostico_id=p_diagnostico AND estado='pendente';
  IF NOT FOUND THEN RAISE EXCEPTION 'Importação pendente não encontrada'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.registrar_importacao_matriz(uuid,uuid,jsonb,jsonb,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.confirmar_importacao_matriz(uuid,uuid,uuid,text,jsonb,jsonb,boolean,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.descartar_importacao_matriz(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_importacao_matriz(uuid,uuid,jsonb,jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.confirmar_importacao_matriz(uuid,uuid,uuid,text,jsonb,jsonb,boolean,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.descartar_importacao_matriz(uuid,uuid,uuid) TO service_role;

-- A gravação manual não pode contornar a conferência de uma importação pendente.
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
  IF EXISTS (SELECT 1 FROM public.diagnostico_matriz_importacoes imp WHERE imp.diagnostico_id=p_diagnostico AND imp.estado='pendente' AND p_funcao=ANY(imp.pendentes)) THEN
    RAISE EXCEPTION 'Esta função possui importação pendente; confirme a conferência antes de salvar';
  END IF;
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
