-- Caderno de Instrumentos CRIA, revisão 22/10/2026. Adição sem conversão de respostas.
-- Histórico 0000–0033 lido e validado em PostgreSQL isolado antes desta migração.
CREATE TABLE IF NOT EXISTS public.diagnostico_caderno_respostas (
  diagnostico_id uuid NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  contexto text NOT NULL DEFAULT '',
  produto_id uuid REFERENCES public.diagnostico_produtos(id) ON DELETE CASCADE,
  resposta jsonb NOT NULL,
  versao integer NOT NULL DEFAULT 1 CHECK (versao > 0),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por text NOT NULL,
  PRIMARY KEY (diagnostico_id,codigo,contexto),
  CHECK (jsonb_typeof(resposta)='object' AND pg_column_size(resposta)<=100000),
  CHECK (
    (produto_id IS NOT NULL AND contexto=produto_id::text AND codigo ~ '^(CP(0[1-9]|1[0-9])|C(0[1-9]|1[0-2])|PR_(CODIGO|OPERACAO|SITUACAO|PAPEL))$') OR
    (produto_id IS NULL AND codigo ~ '^IM0[1-7]$' AND contexto ~ '^OP[0-9]{2,4}$') OR
    (produto_id IS NULL AND contexto='' AND codigo ~ '^(ID0[1-3]|Q(0[1-9]|1[0-9]|2[0-5])|F(0[1-9]|1[0-9]|2[01])|[PDTS]0[12]|E0[1-3]|PRIO[1-3]|EV0[1-8]|ANOTACOES)$')
  )
);
-- IF NOT EXISTS não presume compatibilidade de uma instalação parcial/preexistente.
DO $$ DECLARE faltas text; BEGIN
 SELECT string_agg(e.nome,', ') INTO faltas FROM (VALUES
  ('diagnostico_id','uuid'),('codigo','text'),('contexto','text'),('produto_id','uuid'),('resposta','jsonb'),
  ('versao','int4'),('atualizado_em','timestamptz'),('atualizado_por','text')) e(nome,tipo)
 LEFT JOIN information_schema.columns c ON c.table_schema='public' AND c.table_name='diagnostico_caderno_respostas' AND c.column_name=e.nome
 WHERE c.udt_name IS DISTINCT FROM e.tipo;
 IF faltas IS NOT NULL THEN RAISE EXCEPTION 'Estrutura do caderno incompatível: %',faltas; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.diagnostico_caderno_respostas'::regclass AND contype='p'
   AND pg_get_constraintdef(oid)='PRIMARY KEY (diagnostico_id, codigo, contexto)') THEN RAISE EXCEPTION 'Chave do caderno incompatível'; END IF;
END $$;
CREATE INDEX IF NOT EXISTS diagnostico_caderno_produto_idx ON public.diagnostico_caderno_respostas(produto_id) WHERE produto_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS diagnostico_caderno_codigo_produto_idx ON public.diagnostico_caderno_respostas(diagnostico_id,(resposta->>'valor')) WHERE codigo='PR_CODIGO' AND resposta->>'valor' IS NOT NULL;
ALTER TABLE public.diagnostico_caderno_respostas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.diagnostico_caderno_respostas FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.diagnostico_caderno_respostas TO service_role;
GRANT SELECT ON public.diagnostico_produtos TO service_role;
DROP TRIGGER IF EXISTS diagnostico_editavel_guard ON public.diagnostico_caderno_respostas;
CREATE TRIGGER diagnostico_editavel_guard BEFORE INSERT OR UPDATE OR DELETE ON public.diagnostico_caderno_respostas
 FOR EACH ROW EXECUTE FUNCTION public.validar_diagnostico_editavel();

CREATE OR REPLACE FUNCTION public.salvar_resposta_caderno_cria(p_organizacao uuid,p_diagnostico uuid,p_codigo text,p_contexto text,p_resposta jsonb,p_versao integer,p_autor text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE estado text; anterior public.diagnostico_caderno_respostas%ROWTYPE; resultado public.diagnostico_caderno_respostas%ROWTYPE; produto uuid; situacao text;
BEGIN
 SELECT status INTO estado FROM public.diagnosticos WHERE id=p_diagnostico AND comunidade_id=p_organizacao FOR UPDATE;
 IF NOT FOUND OR estado<>'em_edicao' THEN RAISE EXCEPTION 'Organização/aplicação inválida ou mapeamento concluído'; END IF;
 IF p_versao IS NULL OR p_versao<0 OR nullif(trim(p_autor),'') IS NULL OR jsonb_typeof(p_resposta) IS DISTINCT FROM 'object' OR pg_column_size(p_resposta)>100000 THEN RAISE EXCEPTION 'Resposta do caderno inválida'; END IF;
 IF NOT (p_resposta ?& ARRAY['valor','selecoes','relato','fonte','respondentes'])
   OR jsonb_typeof(p_resposta->'valor') NOT IN ('string','null') OR jsonb_typeof(p_resposta->'selecoes') IS DISTINCT FROM 'array'
   OR jsonb_typeof(p_resposta->'relato') IS DISTINCT FROM 'string' OR jsonb_typeof(p_resposta->'fonte') IS DISTINCT FROM 'string'
   OR jsonb_typeof(p_resposta->'respondentes') IS DISTINCT FROM 'string'
   OR length(p_resposta->>'relato')>20000 OR length(p_resposta->>'fonte')>20000 OR length(p_resposta->>'respondentes')>20000 OR length(p_resposta->>'valor')>20000 THEN RAISE EXCEPTION 'Campos do caderno inválidos'; END IF;
 IF (p_codigo ~ '^Q' AND p_resposta->>'valor' NOT IN ('1','2','3','4','NS','NC','NA','D'))
   OR (p_codigo ~ '^F' AND p_resposta->>'valor' NOT IN ('1','2','3','4','NA','NC'))
   OR (p_codigo ~ '^C[0-9]' AND p_resposta->>'valor' NOT IN ('1','2','3','4','NS','NC','NA','D','H'))
   OR (p_codigo ~ '^IM' AND p_resposta->>'valor' NOT IN ('Disponível','Em andamento','Ainda não iniciado','Não informado','N/A'))
   OR (p_codigo='PR_SITUACAO' AND p_resposta->>'valor' NOT IN ('Funcionamento','Implantação','Futuro'))
   OR (p_codigo='PR_PAPEL' AND p_resposta->>'valor' NOT IN ('Executa','Viabiliza','Não participa'))
   OR (p_codigo='PR_CODIGO' AND p_resposta->>'valor' !~ '^PR[0-9]{2,4}$')
   OR (p_codigo='PR_OPERACAO' AND p_resposta->>'valor' !~ '^OP[0-9]{2,4}$') THEN RAISE EXCEPTION 'Alternativa não pertence ao caderno'; END IF;
 IF p_resposta->>'valor' IN ('NA','N/A','D','H') AND nullif(trim(p_resposta->>'relato'),'') IS NULL THEN RAISE EXCEPTION 'Justifique a não pertinência ou as diferenças no relato'; END IF;
 IF p_codigo ~ '^(CP|C[0-9]|PR_)' THEN
   SELECT id INTO produto FROM public.diagnostico_produtos WHERE id::text=p_contexto AND diagnostico_id=p_diagnostico;
   IF NOT FOUND THEN RAISE EXCEPTION 'Produto não pertence a esta aplicação'; END IF;
   IF p_codigo ~ '^(CP|C[0-9])' THEN
     SELECT resposta->>'valor' INTO situacao FROM public.diagnostico_caderno_respostas WHERE diagnostico_id=p_diagnostico AND codigo='PR_SITUACAO' AND contexto=p_contexto;
     IF situacao IS DISTINCT FROM 'Funcionamento' THEN RAISE EXCEPTION 'Perfil e avaliação só se aplicam a produtos em funcionamento; não pontuar implantação ou futuro'; END IF;
   END IF;
 ELSIF p_codigo ~ '^IM' THEN
   IF NOT EXISTS (SELECT 1 FROM public.diagnostico_caderno_respostas o JOIN public.diagnostico_caderno_respostas s ON s.diagnostico_id=o.diagnostico_id AND s.contexto=o.contexto AND s.codigo='PR_SITUACAO'
     WHERE o.diagnostico_id=p_diagnostico AND o.codigo='PR_OPERACAO' AND o.resposta->>'valor'=p_contexto AND s.resposta->>'valor'='Implantação') THEN RAISE EXCEPTION 'A preparação exige uma operação em implantação vinculada ao portfólio'; END IF;
 END IF;
 SELECT * INTO anterior FROM public.diagnostico_caderno_respostas WHERE diagnostico_id=p_diagnostico AND codigo=p_codigo AND contexto=p_contexto FOR UPDATE;
 IF coalesce(anterior.versao,0)<>p_versao THEN RAISE EXCEPTION 'Esta resposta foi alterada por outra pessoa. Recarregue e confira antes de salvar'; END IF;
 INSERT INTO public.diagnostico_caderno_respostas(diagnostico_id,codigo,contexto,produto_id,resposta,versao,atualizado_por)
 VALUES(p_diagnostico,p_codigo,p_contexto,produto,p_resposta,p_versao+1,p_autor)
 ON CONFLICT(diagnostico_id,codigo,contexto) DO UPDATE SET resposta=EXCLUDED.resposta,versao=EXCLUDED.versao,atualizado_em=now(),atualizado_por=EXCLUDED.atualizado_por
 RETURNING * INTO resultado;
 UPDATE public.diagnosticos SET atualizado_em=now() WHERE id=p_diagnostico;
 RETURN to_jsonb(resultado);
END $$;
REVOKE ALL ON FUNCTION public.salvar_resposta_caderno_cria(uuid,uuid,text,text,jsonb,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_resposta_caderno_cria(uuid,uuid,text,text,jsonb,integer,text) TO service_role;
COMMENT ON TABLE public.diagnostico_caderno_respostas IS 'Respostas canônicas CRIA 22/10/2026, independentes do IEO/Cesta legados. Implantação por OP; demais campos de produto por UUID.';
