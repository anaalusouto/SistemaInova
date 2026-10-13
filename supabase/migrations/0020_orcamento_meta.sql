-- Vínculo real do item à meta do mesmo projeto. Não associa o legado por chute.
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS meta_id UUID
  REFERENCES public.metas(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_meta ON public.orcamento_itens(meta_id);

CREATE OR REPLACE FUNCTION public.validar_meta_orcamento() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.importacao_id IS NOT NULL AND NEW.meta_id IS NULL THEN
    RAISE EXCEPTION 'Todo item importado deve estar vinculado a uma meta.' USING ERRCODE = '23514';
  END IF;
  IF NEW.meta_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.metas m WHERE m.id = NEW.meta_id AND m.projeto_id = NEW.projeto_id
  ) THEN
    RAISE EXCEPTION 'A meta do orçamento deve pertencer ao mesmo projeto.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validar_meta_orcamento ON public.orcamento_itens;
CREATE TRIGGER validar_meta_orcamento BEFORE INSERT OR UPDATE OF meta_id, projeto_id, importacao_id
  ON public.orcamento_itens FOR EACH ROW EXECUTE FUNCTION public.validar_meta_orcamento();
