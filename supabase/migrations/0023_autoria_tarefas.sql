-- Autoria é distinta de responsabilidade. Nunca inferir criador pelo responsável.
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS criado_por text;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS criado_por_login text;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS proximo_passo_criado_por text;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS proximo_passo_criado_por_login text;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS criado_por text;
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS criado_por_login text;
ALTER TABLE public.plano_riscos ADD COLUMN IF NOT EXISTS criado_por text;
ALTER TABLE public.plano_riscos ADD COLUMN IF NOT EXISTS criado_por_login text;
ALTER TABLE public.plano_riscos ADD COLUMN IF NOT EXISTS resposta_criada_por text;
ALTER TABLE public.plano_riscos ADD COLUMN IF NOT EXISTS resposta_criada_por_login text;
