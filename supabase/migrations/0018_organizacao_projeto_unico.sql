-- Cada organização possui no máximo um projeto vinculado.
-- Não remove nem altera projetos existentes; duplicidades precisam ser conciliadas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_projetos_organizacao_unica
  ON public.projetos (comunidade_id)
  WHERE comunidade_id IS NOT NULL;
