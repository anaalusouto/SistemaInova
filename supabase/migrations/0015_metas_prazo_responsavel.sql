-- ==============================================================================
-- 0015 — Editar meta (RF04.1): prazo previsto e responsável próprios da meta
--
-- Até aqui o período da meta era só CALCULADO a partir das etapas (RN-012,
-- RN-017). Por decisão da equipe (29/09/2026) a meta passa a ter prazo
-- próprio, editável. As colunas começam vazias: meta sem prazo próprio
-- continua mostrando o período calculado, então nada muda na tela para as
-- metas que ninguém editar.
--
-- O prazo da meta NÃO restringe as etapas no banco: quando uma etapa sai do
-- prazo da meta, a tela avisa (lib/planoTrabalho.ts, divergenciaDaMeta), mas
-- não bloqueia — bloquear travaria a edição de etapas antigas que já estão
-- fora de qualquer prazo que se venha a definir.
--
-- Idempotente: pode rodar mais de uma vez.
-- ==============================================================================

ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS responsavel     TEXT;
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS inicio_previsto DATE;
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS fim_previsto    DATE;

ALTER TABLE public.metas DROP CONSTRAINT IF EXISTS metas_periodo_previsto_ck;
ALTER TABLE public.metas ADD CONSTRAINT metas_periodo_previsto_ck
  CHECK (inicio_previsto IS NULL OR fim_previsto IS NULL OR inicio_previsto <= fim_previsto);

-- Realtime: `metas` já está no canal "projetos-sync" desde a 0002.
