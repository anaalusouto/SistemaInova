-- ==============================================================================
-- Orçamento (REQUISITOS-INOVA-PROJETOS, seção 14)
--
-- Leva `orcamento_itens` do modelo antigo — item digitado à mão, executado
-- sempre numérico — para o que o documento define: itens que NASCEM de uma
-- planilha importada, com execução opcional, exclusão lógica e trilha de
-- alterações.
--
-- Idempotente, como as anteriores. Nenhum passo descarta valor existente.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXECUÇÃO PASSA A SER OPCIONAL (RF-029, RN-021)
--
-- Esta é a mudança mais importante do arquivo. A coluna era NOT NULL DEFAULT 0,
-- o que torna impossível distinguir "ainda não informaram quanto se gastou" de
-- "gastou-se exatamente zero". O documento é explícito em não converter
-- ausência em zero: sem registro, a tela mostra "Não informado".
--
-- Os zeros existentes vêm todos do DEFAULT — nenhuma tela do sistema jamais
-- ofereceu gravar execução zero deliberadamente. Por isso viram NULL. Um valor
-- de execução realmente igual a zero não é distinguível de ausência no modelo
-- antigo, e tratá-lo como ausência é a leitura conservadora: pede confirmação
-- humana em vez de afirmar que houve compra de R$ 0,00.
-- ------------------------------------------------------------------------------
ALTER TABLE public.orcamento_itens ALTER COLUMN valor_executado DROP DEFAULT;
ALTER TABLE public.orcamento_itens ALTER COLUMN valor_executado DROP NOT NULL;
UPDATE public.orcamento_itens SET valor_executado = NULL WHERE valor_executado = 0;

-- ------------------------------------------------------------------------------
-- 2. ORIGEM DA PLANILHA (RF-030, RF-037)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orcamento_importacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome_arquivo TEXT NOT NULL,
  aba TEXT,
  -- Sequencial por projeto: "versão 3 da planilha" é como a equipe fala disso.
  versao INTEGER NOT NULL,
  autor TEXT NOT NULL,
  -- Contagens e divergências da prévia, guardadas como decidido (RN-031).
  resumo JSONB,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.orcamento_importacoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_orcamento_importacoes_projeto
  ON public.orcamento_importacoes(projeto_id, versao DESC);

-- ------------------------------------------------------------------------------
-- 3. CAMPOS NOVOS DO ITEM
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE situacao_item_orcamento AS ENUM ('Ativo','Excluído');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS grupo TEXT;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS ordem NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS data_compra DATE;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS justificativa_diferenca TEXT;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS situacao situacao_item_orcamento NOT NULL DEFAULT 'Ativo';
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS motivo_exclusao TEXT;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS excluido_em TIMESTAMPTZ;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS excluido_por TEXT;
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS importacao_id UUID REFERENCES public.orcamento_importacoes(id) ON DELETE SET NULL;

-- Risco orçamentário criado ao excluir o item (RF-041). ON DELETE SET NULL, e
-- não CASCADE: apagar o risco não pode levar o item do orçamento junto.
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS risco_id UUID REFERENCES public.plano_riscos(id) ON DELETE SET NULL;

/*
 * `valor_proposto` é o total do item COMO A PLANILHA DECLAROU, depois da
 * decisão da equipe PMO sobre eventual divergência (RN-030).
 *
 * Não substitui `valor_planejado`, que continua sendo a fórmula
 * (qtd × qtd_unidades × valor_unitario) calculada pelo banco: é a comparação
 * entre os dois que permite à prévia sinalizar "o total declarado não bate com
 * a conta". Guardar só um dos dois apagaria a divergência em vez de mostrá-la.
 */
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS valor_proposto NUMERIC(14,2);
UPDATE public.orcamento_itens SET valor_proposto = valor_planejado WHERE valor_proposto IS NULL;

/*
 * Chave de correspondência entre versões da planilha (RN-031).
 *
 * Derivada de grupo + categoria + descrição normalizados. É o que permite
 * reconhecer "o mesmo item" numa reimportação e preservar execução,
 * justificativa, exclusão e risco. Quando duas linhas geram a mesma chave, a
 * correspondência é ambígua e o documento manda exigir conciliação manual —
 * por isso a chave NÃO é única no banco: duplicidade é um caso a tratar, não
 * um erro a bloquear.
 */
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS chave_origem TEXT;
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_chave ON public.orcamento_itens(projeto_id, chave_origem);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_projeto_ordem ON public.orcamento_itens(projeto_id, ordem);

-- Grupo e ordem dos registros antigos: o modelo anterior guardava o
-- agrupamento em `meta_texto`, e não havia ordem — a de criação é o melhor
-- palpite disponível e não inventa informação nova.
UPDATE public.orcamento_itens SET grupo = meta_texto WHERE grupo IS NULL AND meta_texto IS NOT NULL;
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY projeto_id ORDER BY criado_em) AS rn
  FROM public.orcamento_itens
)
UPDATE public.orcamento_itens o SET ordem = ranked.rn FROM ranked WHERE o.id = ranked.id AND o.ordem = 0;

-- Data da compra: a coluna antiga era TEXT livre.
UPDATE public.orcamento_itens
   SET data_compra = public.parse_data_legada(data)
 WHERE data_compra IS NULL AND public.parse_data_legada(data) IS NOT NULL;

-- Coerência da exclusão lógica: item Excluído precisa de motivo e data; item
-- Ativo não pode carregar marcas de exclusão.
ALTER TABLE public.orcamento_itens DROP CONSTRAINT IF EXISTS orcamento_itens_exclusao_ck;
ALTER TABLE public.orcamento_itens ADD CONSTRAINT orcamento_itens_exclusao_ck CHECK (
  (situacao = 'Ativo'    AND motivo_exclusao IS NULL AND excluido_em IS NULL) OR
  (situacao = 'Excluído' AND motivo_exclusao IS NOT NULL AND excluido_em IS NOT NULL)
);

-- ------------------------------------------------------------------------------
-- 4. TRILHA DE ALTERAÇÕES DO ITEM (RN-033)
--
-- Tabela própria, e não o log geral: o documento pede o histórico DO ITEM
-- exibido no painel de detalhes dele, com valor anterior e novo. Buscar isso
-- num log genérico por projeto seria caro e impreciso.
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE evento_item_orcamento AS ENUM (
    'importação','correção de origem','valor executado','data da compra',
    'justificativa','exclusão','reversão','vínculo de risco'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.orcamento_item_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.orcamento_itens(id) ON DELETE CASCADE,
  evento evento_item_orcamento NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  detalhe TEXT,
  autor TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.orcamento_item_historico ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_orcamento_historico_item
  ON public.orcamento_item_historico(item_id, criado_em DESC);

-- ------------------------------------------------------------------------------
-- 5. REALTIME — as tabelas novas entram no canal "projetos-sync" (0002).
-- ------------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['orcamento_importacoes', 'orcamento_item_historico']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS broadcast_change ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
      'FOR EACH ROW EXECUTE FUNCTION public.broadcast_projetos_change()', t
    );
  END LOOP;
END $$;
