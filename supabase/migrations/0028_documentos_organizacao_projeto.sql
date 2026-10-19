-- PDF de demandas de 13/10/2026, p.6: arquivos próprios de projeto, mapeamento e parecer.
CREATE TABLE public.documentos_registro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL CHECK (area IN ('projeto','mapeamento','parecer')),
  projeto_id BIGINT REFERENCES public.projetos(id) ON DELETE RESTRICT,
  comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE RESTRICT,
  storage_path TEXT NOT NULL UNIQUE,
  nome_arquivo TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  tamanho_bytes BIGINT NOT NULL CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 3145728),
  enviado_por TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT documento_registro_pai_ck CHECK (
    (area = 'projeto' AND projeto_id IS NOT NULL AND comunidade_id IS NULL)
    OR (area IN ('mapeamento','parecer') AND comunidade_id IS NOT NULL AND projeto_id IS NULL)
  )
);
CREATE INDEX documentos_registro_projeto_idx ON public.documentos_registro(projeto_id) WHERE projeto_id IS NOT NULL;
CREATE INDEX documentos_registro_org_idx ON public.documentos_registro(comunidade_id,area) WHERE comunidade_id IS NOT NULL;
ALTER TABLE public.documentos_registro ENABLE ROW LEVEL SECURITY;
-- A sessão httpOnly do Inova é validada nas server functions; não usa Supabase Auth.
REVOKE ALL ON public.documentos_registro FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,DELETE ON public.documentos_registro TO service_role;
-- Reaproveita o bucket privado existente, sem política de acesso público.

-- Instrumentos publicados pela ficha da organização continuam imutáveis depois de concluídos.
CREATE FUNCTION public.validar_diagnostico_editavel() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_id uuid; v_status text;
BEGIN
  v_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.diagnostico_id ELSE NEW.diagnostico_id END;
  SELECT status INTO v_status FROM public.diagnosticos WHERE id = v_id FOR UPDATE;
  -- Preserva as cascatas já previstas no modelo quando o próprio pai foi removido.
  IF TG_OP = 'DELETE' AND NOT FOUND THEN RETURN OLD; END IF;
  IF v_status IS DISTINCT FROM 'em_edicao' THEN
    RAISE EXCEPTION 'Diagnóstico concluído ou inexistente: instrumento somente leitura';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.validar_diagnostico_editavel() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.validar_diagnostico_editavel() TO service_role;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['diagnostico_matriz','diagnostico_ieo','diagnostico_produtos','diagnostico_parecer','diagnostico_checklist_itens','diagnostico_anexos'] LOOP
    EXECUTE format('CREATE TRIGGER diagnostico_editavel_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.validar_diagnostico_editavel()',t);
  END LOOP;
END $$;
