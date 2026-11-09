-- Vínculo opcional, sem converter ou modificar os registros anteriores.
ALTER TABLE public.plano_riscos ADD COLUMN estrategia_resposta_historica text;
UPDATE public.plano_riscos SET estrategia_resposta_historica = estrategia_mitigacao WHERE estrategia_mitigacao IS NOT NULL;
ALTER TABLE public.encaminhamentos ADD COLUMN risco_origem_id uuid REFERENCES public.plano_riscos(id) ON DELETE SET NULL;
ALTER TABLE public.encaminhamentos ADD COLUMN risco_origem_referencia uuid;
ALTER TABLE public.encaminhamentos ADD COLUMN risco_origem_identificacao text;
ALTER TABLE public.encaminhamentos ADD COLUMN risco_origem_excluido boolean NOT NULL DEFAULT false;
ALTER TABLE public.encaminhamentos ADD CONSTRAINT encaminhamentos_risco_origem_ck CHECK (
  (risco_origem_id IS NULL OR (log_comunicacao_id IS NULL AND origem_texto IS NULL AND risco_origem_identificacao IS NOT NULL))
  AND (risco_origem_identificacao IS NULL OR (log_comunicacao_id IS NULL AND origem_texto IS NULL))
);
CREATE INDEX idx_encaminhamentos_risco_origem ON public.encaminhamentos(risco_origem_id);

CREATE FUNCTION public.validar_origem_risco_encaminhamento() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE identificacao text;
BEGIN
  IF NEW.risco_origem_id IS NOT NULL THEN
    SELECT coalesce(nullif(btrim(r.titulo), ''), r.descricao) INTO identificacao
      FROM public.plano_riscos r JOIN public.projetos p ON p.id = r.projeto_id
      WHERE r.id = NEW.risco_origem_id AND p.comunidade_id = NEW.comunidade_id;
    IF identificacao IS NULL THEN RAISE EXCEPTION 'Risco de origem não pertence à organização'; END IF;
    NEW.risco_origem_identificacao := identificacao;
    NEW.risco_origem_referencia := NEW.risco_origem_id;
    NEW.risco_origem_excluido := false;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validar_origem_risco_encaminhamento BEFORE INSERT OR UPDATE OF risco_origem_id, comunidade_id
  ON public.encaminhamentos FOR EACH ROW EXECUTE FUNCTION public.validar_origem_risco_encaminhamento();

CREATE FUNCTION public.preservar_origem_risco_encaminhamento() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.encaminhamentos SET risco_origem_identificacao = coalesce(nullif(btrim(OLD.titulo), ''), OLD.descricao),
    risco_origem_excluido = true WHERE risco_origem_id = OLD.id;
  RETURN OLD;
END $$;
CREATE TRIGGER preservar_origem_risco_encaminhamento BEFORE DELETE ON public.plano_riscos
  FOR EACH ROW EXECUTE FUNCTION public.preservar_origem_risco_encaminhamento();
