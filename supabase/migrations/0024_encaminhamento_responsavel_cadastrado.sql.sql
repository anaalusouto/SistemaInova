-- Vínculo explícito com a conta cadastrada; o nome legado permanece como histórico.
-- Não associa registros antigos automaticamente: há nomes iguais e abreviações.
ALTER TABLE public.encaminhamentos
  ADD COLUMN IF NOT EXISTS responsavel_usuario_id uuid
  REFERENCES public.usuarios(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_responsavel_usuario
  ON public.encaminhamentos(responsavel_usuario_id);
