-- Adiciona ordenação manual (inserir "no meio") a Metas/Etapas/Atividades e
-- exclusão lógica (soft delete) a Atividades — hoje a exclusão de atividade
-- era bloqueada de propósito (ver comentário antigo em projetos.server.ts:
-- "exclusão de atividade não é permitida — apenas registro"); passa a ser
-- permitida, mas preservando o registro (excluido_em) em vez de um DELETE.
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS ordem NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS ordem NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS ordem NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ;

-- Backfill: preserva a ordem atual (por data de criação) como ponto de
-- partida, uma sequência por "pai" (projeto/meta/entrega).
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY projeto_id ORDER BY criado_em) AS rn
  FROM public.metas
)
UPDATE public.metas m SET ordem = ranked.rn FROM ranked WHERE m.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY meta_id ORDER BY criado_em) AS rn
  FROM public.entregas
)
UPDATE public.entregas e SET ordem = ranked.rn FROM ranked WHERE e.id = ranked.id;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY entrega_id ORDER BY criado_em) AS rn
  FROM public.atividades
)
UPDATE public.atividades a SET ordem = ranked.rn FROM ranked WHERE a.id = ranked.id;
