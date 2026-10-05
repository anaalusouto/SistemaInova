-- Não exclui, associa ou corrige registros legados automaticamente.
-- A 0018 deve estar aplicada: garante exclusividade inclusive entre criações
-- simultâneas. A guarda abaixo exige vínculo em novos projetos e o congela.
CREATE OR REPLACE FUNCTION public.proteger_vinculo_projeto()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.comunidade_id IS NULL THEN
      RAISE EXCEPTION 'Projeto novo exige vínculo com uma organização.' USING ERRCODE = '23514';
    END IF;
  ELSIF NEW.comunidade_id IS DISTINCT FROM OLD.comunidade_id THEN
    RAISE EXCEPTION 'O vínculo com a organização não pode ser alterado após a criação. Projeto: %', OLD.id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteger_vinculo_projeto ON public.projetos;
CREATE TRIGGER proteger_vinculo_projeto BEFORE INSERT OR UPDATE OF comunidade_id
ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.proteger_vinculo_projeto();

-- Links para documentos externos; não introduzem formulários de avaliação.
ALTER TABLE public.comunidades ADD COLUMN IF NOT EXISTS mapeamento_relatorio_url TEXT;
ALTER TABLE public.comunidades ADD COLUMN IF NOT EXISTS parecer_relatorio_url TEXT;
