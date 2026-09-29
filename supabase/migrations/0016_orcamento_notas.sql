-- ==============================================================================
-- 0016 — Notas fiscais / comprovantes do orçamento (RF04.3)
--
-- Decisões da equipe (29/09/2026):
--   1. Várias notas por item; o executado do item passa a ser a SOMA das notas.
--   2. A nota pertence ao projeto e o item é OPCIONAL: hoje nenhum projeto tem
--      planilha importada, e a equipe precisa lançar notas já. Nota sem item
--      conta no executado do projeto e pode ser vinculada a um item depois.
--   3. O arquivo do comprovante é opcional; nota sem arquivo aparece
--      sinalizada como "sem comprovante".
--   4. A justificativa de diferença passa a ser exigida quando a soma passa do
--      proposto, ou quando o item é marcado como execução concluída com soma
--      diferente do proposto (regra na aplicação, lib/orcamento.ts).
--
-- `orcamento_itens.valor_executado` e `data_compra` continuam existindo, mas
-- passam a ser escritos SÓ pelo trigger desta migration — espelho da soma das
-- notas e da data da nota mais recente. Assim a importação, o cabeçalho do
-- projeto e a visão antiga continuam lendo a mesma coluna sem mudar, e a
-- coluna não tem como divergir das notas.
--
-- Idempotente: pode rodar mais de uma vez.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Notas
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orcamento_notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  -- SET NULL: item sai, a nota fica (o dinheiro foi gasto de qualquer forma).
  item_id UUID REFERENCES public.orcamento_itens(id) ON DELETE SET NULL,
  numero TEXT,
  fornecedor TEXT,
  data_emissao DATE NOT NULL,
  valor NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  descricao TEXT,
  criado_por TEXT NOT NULL,
  atualizado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.orcamento_notas ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_orcamento_notas_projeto ON public.orcamento_notas(projeto_id, data_emissao DESC);
CREATE INDEX IF NOT EXISTS idx_orcamento_notas_item ON public.orcamento_notas(item_id);

DROP TRIGGER IF EXISTS set_orcamento_notas_updated_at ON public.orcamento_notas;
CREATE TRIGGER set_orcamento_notas_updated_at BEFORE UPDATE ON public.orcamento_notas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 2. Item: marca de execução concluída
-- ------------------------------------------------------------------------------
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS execucao_concluida BOOLEAN NOT NULL DEFAULT false;

-- ------------------------------------------------------------------------------
-- 3. Comprovante: anexo com um terceiro "pai" possível, a nota
-- ------------------------------------------------------------------------------
ALTER TABLE public.projeto_anexos
  ADD COLUMN IF NOT EXISTS orcamento_nota_id UUID REFERENCES public.orcamento_notas(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_projeto_anexos_nota ON public.projeto_anexos(orcamento_nota_id);

ALTER TABLE public.projeto_anexos DROP CONSTRAINT IF EXISTS projeto_anexos_um_pai_ck;
ALTER TABLE public.projeto_anexos ADD CONSTRAINT projeto_anexos_um_pai_ck CHECK (
  (atividade_id IS NOT NULL)::INT + (log_comunicacao_id IS NOT NULL)::INT + (orcamento_nota_id IS NOT NULL)::INT = 1
);

-- ------------------------------------------------------------------------------
-- 4. Espelho do executado do item
--
-- Sem nota nenhuma o executado volta a NULL ("Não informado"), nunca a zero
-- (RF-029).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recalcular_execucao_item(p_item UUID)
RETURNS void LANGUAGE sql AS $$
  UPDATE public.orcamento_itens i
     SET valor_executado = s.total,
         data_compra     = s.ultima
    FROM (SELECT SUM(valor) AS total, MAX(data_emissao) AS ultima
            FROM public.orcamento_notas WHERE item_id = p_item) s
   WHERE i.id = p_item;
$$;

CREATE OR REPLACE FUNCTION public.orcamento_notas_recalcular()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.item_id IS NOT NULL THEN
    PERFORM public.recalcular_execucao_item(OLD.item_id);
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.item_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.item_id IS DISTINCT FROM OLD.item_id OR NEW.valor <> OLD.valor
          OR NEW.data_emissao <> OLD.data_emissao) THEN
    PERFORM public.recalcular_execucao_item(NEW.item_id);
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS recalcular_execucao ON public.orcamento_notas;
CREATE TRIGGER recalcular_execucao AFTER INSERT OR UPDATE OR DELETE ON public.orcamento_notas
  FOR EACH ROW EXECUTE FUNCTION public.orcamento_notas_recalcular();

-- ------------------------------------------------------------------------------
-- 5. Conversão: execução já registrada vira a primeira nota do item
--
-- Em 29/09/2026 não há nenhum item de orçamento no banco, então isto não muda
-- nada hoje; fica para o caso de a migration rodar num banco com dados.
-- Só converte item que ainda não tem nota (idempotente).
-- ------------------------------------------------------------------------------
INSERT INTO public.orcamento_notas (projeto_id, item_id, data_emissao, valor, descricao, criado_por)
SELECT i.projeto_id, i.id, COALESCE(i.data_compra, i.criado_em::date), i.valor_executado,
       'Execução registrada antes das notas fiscais', 'migração 0016'
  FROM public.orcamento_itens i
 WHERE i.valor_executado IS NOT NULL AND i.valor_executado > 0
   AND NOT EXISTS (SELECT 1 FROM public.orcamento_notas n WHERE n.item_id = i.id);

-- ------------------------------------------------------------------------------
-- 6. Histórico do item: eventos novos
-- ------------------------------------------------------------------------------
ALTER TYPE evento_item_orcamento ADD VALUE IF NOT EXISTS 'nota fiscal';
ALTER TYPE evento_item_orcamento ADD VALUE IF NOT EXISTS 'conclusão';

-- ------------------------------------------------------------------------------
-- 7. Realtime — a tabela nova entra no canal "projetos-sync" (0002)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS broadcast_change ON public.orcamento_notas;
CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.orcamento_notas
  FOR EACH ROW EXECUTE FUNCTION public.broadcast_projetos_change();
