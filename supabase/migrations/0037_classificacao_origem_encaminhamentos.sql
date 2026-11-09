-- Classificação independente do vínculo; registros anteriores permanecem intactos.
ALTER TABLE public.encaminhamentos ADD COLUMN classificacao_origem text;
ALTER TABLE public.encaminhamentos ADD CONSTRAINT encaminhamentos_classificacao_origem_ck
  CHECK (classificacao_origem IS NULL OR classificacao_origem IN ('Plano de trabalho', 'Riscos', 'Outros'));
