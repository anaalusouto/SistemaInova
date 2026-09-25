-- ==============================================================================
-- Plano de Trabalho (REQUISITOS-INOVA-PROJETOS, 24/09/2026)
--
-- Leva o schema da hierarquia de 3 níveis (meta > entrega > atividade) para a
-- de 4 níveis exigida pelo documento:
--
--     Organização > Projeto > Meta > Etapa > Atividade > Tarefa
--
-- com Risco pendurado na Etapa (RN-028) e ação de resposta a risco modelada
-- como atividade comum com referência à origem (RN-020).
--
-- Idempotente de ponta a ponta (mesmo cuidado da 0009 — ver commit dc3c55f):
-- cada bloco confere o estado antes de agir, e nenhum passo descarta dado
-- existente. Renomeações preservam a linha; conversões de tipo preservam o
-- valor; colunas legadas continuam no lugar até que a leitura nova esteja
-- validada em produção.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Auxiliar: datas legadas chegaram como TEXT em dois formatos diferentes
--    ('DD/MM/AAAA' de toLocaleDateString('pt-BR') e 'AAAA-MM-DD' de coluna DATE).
--    As colunas novas são DATE de verdade (ver src/app/lib/dateOnly.ts para o
--    porquê de nunca passar por `new Date()` na exibição).
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.parse_data_legada(v TEXT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
BEGIN
  IF v IS NULL OR btrim(v) = '' THEN RETURN NULL; END IF;
  IF v ~ '^\d{4}-\d{2}-\d{2}' THEN RETURN substring(v from 1 for 10)::DATE; END IF;
  IF v ~ '^\d{2}/\d{2}/\d{4}$' THEN RETURN to_date(v, 'DD/MM/YYYY'); END IF;
  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$fn$;

-- ==============================================================================
-- 1. ENTREGAS -> ETAPAS
-- O documento chama de "Etapa" o nível que o banco chamava de "entrega".
-- Renomeia tabela, coluna de FK e índices para que banco e especificação usem
-- o mesmo vocabulário. `cronograma_entregas` é outro conceito (Cronograma
-- Executivo) e não é tocada aqui.
-- ==============================================================================
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'entregas')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_name = 'etapas') THEN
    ALTER TABLE public.entregas RENAME TO etapas;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'atividades' AND column_name = 'entrega_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = 'public' AND table_name = 'atividades' AND column_name = 'etapa_id') THEN
    ALTER TABLE public.atividades RENAME COLUMN entrega_id TO etapa_id;
  END IF;
END $$;

ALTER INDEX IF EXISTS public.idx_entregas_meta RENAME TO idx_etapas_meta;
ALTER INDEX IF EXISTS public.idx_atividades_entrega RENAME TO idx_atividades_etapa;

-- ==============================================================================
-- 2. STATUS DE ATIVIDADE — exatamente três estados (RN-009)
-- 'Atrasado' deixa de ser estado armazenado: atraso é derivado da comparação
-- entre fim previsto e data corrente (RN-010), então nunca fica preso num
-- registro que já foi concluído depois.
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE status_plano_enum AS ENUM ('A iniciar','Em andamento','Concluído');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'atividades'
      AND column_name = 'status' AND udt_name = 'status_atividade_enum'
  ) THEN
    ALTER TABLE public.atividades ALTER COLUMN status DROP DEFAULT;
    ALTER TABLE public.atividades
      ALTER COLUMN status TYPE status_plano_enum
      USING (CASE status::TEXT
               WHEN 'Não iniciado' THEN 'A iniciar'
               WHEN 'Atrasado'     THEN 'Em andamento'
               WHEN 'Concluído'    THEN 'Concluído'
               ELSE 'Em andamento'
             END)::status_plano_enum;
    ALTER TABLE public.atividades ALTER COLUMN status SET DEFAULT 'A iniciar';
  END IF;
END $$;

-- ==============================================================================
-- 3. PERÍODOS PREVISTO E REALIZADO
-- A etapa passa a ter período próprio (RN-014), base dos limites de data da
-- atividade (RN-015) e do intervalo calculado da meta (RN-017).
-- ==============================================================================
ALTER TABLE public.etapas ADD COLUMN IF NOT EXISTS inicio_previsto  DATE;
ALTER TABLE public.etapas ADD COLUMN IF NOT EXISTS fim_previsto     DATE;
ALTER TABLE public.etapas ADD COLUMN IF NOT EXISTS inicio_realizado DATE;
ALTER TABLE public.etapas ADD COLUMN IF NOT EXISTS fim_realizado    DATE;

ALTER TABLE public.etapas DROP CONSTRAINT IF EXISTS etapas_periodo_previsto_ck;
ALTER TABLE public.etapas ADD CONSTRAINT etapas_periodo_previsto_ck
  CHECK (inicio_previsto IS NULL OR fim_previsto IS NULL OR inicio_previsto <= fim_previsto);
ALTER TABLE public.etapas DROP CONSTRAINT IF EXISTS etapas_periodo_realizado_ck;
ALTER TABLE public.etapas ADD CONSTRAINT etapas_periodo_realizado_ck
  CHECK (inicio_realizado IS NULL OR fim_realizado IS NULL OR inicio_realizado <= fim_realizado);

-- As quatro datas da atividade (RF-015). As colunas TEXT legadas
-- (data_planejada/data_inicio/data_conclusao) permanecem intactas: a leitura
-- nova usa as colunas DATE, e o legado só é descartado em migration posterior,
-- depois que a nova leitura estiver validada.
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS inicio_previsto  DATE;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS fim_previsto     DATE;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS inicio_realizado DATE;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS fim_realizado    DATE;

-- Backfill conservador. RN-013: as datas das capturas de origem são PREVISTAS;
-- realizado só existe quando a equipe PMO informou explicitamente. Por isso
-- data_planejada vira fim_previsto e data_inicio/data_conclusao viram as
-- realizadas — nunca o contrário, e nunca preenchendo realizado a partir de
-- previsto. Roda uma vez só (WHERE ... IS NULL protege reexecução).
UPDATE public.atividades
   SET fim_previsto = public.parse_data_legada(data_planejada)
 WHERE fim_previsto IS NULL AND public.parse_data_legada(data_planejada) IS NOT NULL;
UPDATE public.atividades
   SET inicio_realizado = public.parse_data_legada(data_inicio)
 WHERE inicio_realizado IS NULL AND public.parse_data_legada(data_inicio) IS NOT NULL;
UPDATE public.atividades
   SET fim_realizado = public.parse_data_legada(data_conclusao)
 WHERE fim_realizado IS NULL AND public.parse_data_legada(data_conclusao) IS NOT NULL;

ALTER TABLE public.atividades DROP CONSTRAINT IF EXISTS atividades_periodo_previsto_ck;
ALTER TABLE public.atividades ADD CONSTRAINT atividades_periodo_previsto_ck
  CHECK (inicio_previsto IS NULL OR fim_previsto IS NULL OR inicio_previsto <= fim_previsto);
ALTER TABLE public.atividades DROP CONSTRAINT IF EXISTS atividades_periodo_realizado_ck;
ALTER TABLE public.atividades ADD CONSTRAINT atividades_periodo_realizado_ck
  CHECK (inicio_realizado IS NULL OR fim_realizado IS NULL OR inicio_realizado <= fim_realizado);

-- Backfill do período da etapa a partir das atividades que ela já contém, para
-- que etapas antigas não caiam na regra "etapa sem período previsto impede
-- criação de atividade" (CA-07) por falta de dado histórico.
WITH limites AS (
  SELECT etapa_id,
         MIN(COALESCE(inicio_previsto, fim_previsto)) AS ini,
         MAX(fim_previsto)                            AS fim
    FROM public.atividades
   WHERE excluido_em IS NULL
   GROUP BY etapa_id
  HAVING MAX(fim_previsto) IS NOT NULL
)
UPDATE public.etapas e
   SET inicio_previsto = COALESCE(e.inicio_previsto, limites.ini),
       fim_previsto    = COALESCE(e.fim_previsto, limites.fim)
  FROM limites
 WHERE e.id = limites.etapa_id
   AND (e.inicio_previsto IS NULL OR e.fim_previsto IS NULL);

-- ==============================================================================
-- 4. DEMAIS CAMPOS DA ATIVIDADE (RF-023, RF-024)
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE vinculo_orcamentario_enum AS ENUM ('Sim','Não','Não informado');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS justificativa_atraso TEXT;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS vinculo_orcamentario vinculo_orcamentario_enum NOT NULL DEFAULT 'Não informado';
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS proximo_passo TEXT;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS proximo_passo_responsavel TEXT;
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS proximo_passo_prazo DATE;

-- Progresso coerente com o status (RN-009): 0% a iniciar, 100% concluído,
-- 1–99% em andamento. Validado também no servidor; aqui é a rede de segurança.
ALTER TABLE public.atividades DROP CONSTRAINT IF EXISTS atividades_progresso_status_ck;
ALTER TABLE public.atividades ADD CONSTRAINT atividades_progresso_status_ck
  CHECK (
    (status = 'A iniciar'    AND progresso = 0)   OR
    (status = 'Concluído'    AND progresso = 100) OR
    (status = 'Em andamento' AND progresso >= 0 AND progresso <= 100)
  );

-- ==============================================================================
-- 5. TAREFAS (RF-025)
-- Nesta entrega a tarefa tem apenas título e vínculo com a atividade — a
-- seção 17 do documento deixa responsável/datas/status/anexo como decisão
-- pendente, então não são inventados aqui.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  ordem NUMERIC NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_tarefas_atividade ON public.tarefas(atividade_id);
DROP TRIGGER IF EXISTS set_tarefas_updated_at ON public.tarefas;
CREATE TRIGGER set_tarefas_updated_at BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 6. RISCO PERTENCE À ETAPA (RF-027, RN-028)
-- etapa_id entra como NULLABLE de propósito: linhas legadas só têm meta_id e o
-- nome da etapa em texto livre (etapa_nome_legado), e nem sempre casam com uma
-- etapa real. Tornar NOT NULL agora apagaria ou bloquearia esses registros. O
-- servidor exige etapa_id em todo risco NOVO; o backfill abaixo resolve o que
-- é resolvível sem ambiguidade, e o que sobrar é reconciliado pela equipe PMO.
-- ==============================================================================
ALTER TABLE public.plano_riscos ADD COLUMN IF NOT EXISTS etapa_id UUID REFERENCES public.etapas(id) ON DELETE RESTRICT;
ALTER TABLE public.plano_riscos ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.plano_riscos ADD COLUMN IF NOT EXISTS especificacao TEXT;

-- Backfill: só quando o nome legado casa com exatamente UMA etapa da meta —
-- correspondência ambígua fica para conciliação manual.
WITH unico AS (
  SELECT r.id AS risco_id, MIN(e.id::TEXT)::UUID AS etapa_id
    FROM public.plano_riscos r
    JOIN public.etapas e ON e.meta_id = r.meta_id
   WHERE r.etapa_id IS NULL
     AND r.etapa_nome_legado IS NOT NULL
     AND lower(btrim(e.nome)) = lower(btrim(r.etapa_nome_legado))
   GROUP BY r.id
  HAVING COUNT(*) = 1
)
UPDATE public.plano_riscos r SET etapa_id = unico.etapa_id
  FROM unico WHERE r.id = unico.risco_id;

-- Título: o modelo antigo só tinha `descricao`. Usa a especificação legada
-- quando existe, senão o início da descrição — sem perder o texto original.
UPDATE public.plano_riscos
   SET titulo = COALESCE(NULLIF(btrim(especificacao_legado), ''), left(btrim(descricao), 120))
 WHERE titulo IS NULL AND btrim(COALESCE(descricao, '')) <> '';

UPDATE public.plano_riscos
   SET especificacao = especificacao_legado
 WHERE especificacao IS NULL AND especificacao_legado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_plano_riscos_etapa ON public.plano_riscos(etapa_id);

-- Ação de resposta ao risco é uma atividade comum da mesma etapa, com
-- referência à origem (RN-020) — nunca uma entidade separada.
ALTER TABLE public.atividades ADD COLUMN IF NOT EXISTS risco_origem_id UUID REFERENCES public.plano_riscos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_atividades_risco_origem ON public.atividades(risco_origem_id);

-- ==============================================================================
-- 7. PARECER TÉCNICO DO PROJETO (RF-033, RF-034, RF-036, RN-029)
-- Não confundir com `diagnostico_parecer` (0009), que é o parecer do
-- Diagnóstico da organização — outro contexto, outro ciclo de vida.
-- ==============================================================================
DO $$ BEGIN
  CREATE TYPE origem_parecer_enum AS ENUM ('Visita técnica','Reunião de acompanhamento','Outro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.pareceres_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  -- Vínculo opcional com um registro da tela Contato do mesmo projeto (RF-034).
  log_comunicacao_id UUID REFERENCES public.logs_comunicacao(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  origem origem_parecer_enum NOT NULL,
  autor TEXT NOT NULL,
  pontos_observados TEXT NOT NULL,
  -- Em branco significa "sem registro", nunca "sem problema" (RN-026).
  itens_criticos TEXT,
  limitacoes_orcamentarias TEXT,
  recomendacao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.pareceres_tecnicos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_pareceres_projeto ON public.pareceres_tecnicos(projeto_id, data DESC);
DROP TRIGGER IF EXISTS set_pareceres_updated_at ON public.pareceres_tecnicos;
CREATE TRIGGER set_pareceres_updated_at BEFORE UPDATE ON public.pareceres_tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Cada ação com id estável e ordem própria, para que editar uma linha não
-- afete as demais e remover uma retire só a correspondente (RN-029).
CREATE TABLE IF NOT EXISTS public.parecer_acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parecer_id UUID NOT NULL REFERENCES public.pareceres_tecnicos(id) ON DELETE CASCADE,
  ordem NUMERIC NOT NULL DEFAULT 0,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  prazo DATE,
  status status_plano_enum NOT NULL DEFAULT 'A iniciar',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.parecer_acoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_parecer_acoes_parecer ON public.parecer_acoes(parecer_id, ordem);
DROP TRIGGER IF EXISTS set_parecer_acoes_updated_at ON public.parecer_acoes;
CREATE TRIGGER set_parecer_acoes_updated_at BEFORE UPDATE ON public.parecer_acoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. ANEXOS DE ATIVIDADE E DE CONTATO (RF-009, RF-026, RF-032, RN-002)
-- Mesmo padrão já usado pelo Diagnóstico (0009): bucket privado, acesso só por
-- URL assinada gerada sob demanda no servidor. A autorização de leitura do
-- anexo segue a do registro pai — por isso projeto_id fica denormalizado aqui,
-- para checar permissão sem depender de join na hora do download.
-- ==============================================================================
-- O pai é apontado por FK explícita, uma coluna por tipo de pai, e não por par
-- (tipo, id) genérico: FK de verdade dá integridade referencial, faz o ON
-- DELETE CASCADE limpar anexo órfão sozinho (RN-005) e é o que permite trazer
-- o anexo junto da atividade numa consulta só — PostgREST não relaciona tabelas
-- sem FK declarada. O CHECK garante exatamente um pai por linha.
CREATE TABLE IF NOT EXISTS public.projeto_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  atividade_id UUID REFERENCES public.atividades(id) ON DELETE CASCADE,
  log_comunicacao_id UUID REFERENCES public.logs_comunicacao(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_mime TEXT,
  tamanho_bytes BIGINT,
  enviado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT projeto_anexos_um_pai_ck CHECK (
    (atividade_id IS NOT NULL)::INT + (log_comunicacao_id IS NOT NULL)::INT = 1
  )
);
ALTER TABLE public.projeto_anexos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_projeto_anexos_atividade ON public.projeto_anexos(atividade_id);
CREATE INDEX IF NOT EXISTS idx_projeto_anexos_log ON public.projeto_anexos(log_comunicacao_id);
CREATE INDEX IF NOT EXISTS idx_projeto_anexos_projeto ON public.projeto_anexos(projeto_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('projeto-anexos', 'projeto-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 9. SESSÕES — autorização de verdade no servidor (RN-001, CA-02)
-- Até aqui o papel do usuário chegava ao servidor dentro do payload da própria
-- chamada (`author.isAdmin` em projetos.server.ts), o que uma chamada direta à
-- API podia simplesmente declarar. O CA-02 exige que a SEMAS não consiga
-- escrever nem assim. A sessão passa a ser um token opaco guardado só como
-- hash: quem lê o banco não consegue reconstruir o cookie.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expira_em TIMESTAMPTZ NOT NULL,
  ultimo_uso TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON public.sessoes(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON public.sessoes(expira_em);

-- ==============================================================================
-- 10. REALTIME — registra as tabelas novas no canal "projetos-sync" (0002).
-- A renomeação entregas->etapas preserva o trigger existente, mas o nome da
-- tabela no payload muda: quem escuta deve tratar 'etapas'.
-- ==============================================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'etapas', 'tarefas', 'pareceres_tecnicos', 'parecer_acoes', 'projeto_anexos'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS broadcast_change ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
      'FOR EACH ROW EXECUTE FUNCTION public.broadcast_projetos_change()', t
    );
  END LOOP;
END $$;
