-- ==============================================================================
-- Sistema Inova — schema inicial (onda 1: Projetos e tudo dentro de um projeto)
-- + stubs das ondas 2-5 (Comunidades/Rotas/Calendário, Cronograma, Diagnóstico, Auditoria)
--
-- Sem RLS por papel de usuário: autenticação continua fora do Supabase Auth por
-- agora (lista fixa em src/app/auth/authStore.tsx). RLS fica HABILITADO em toda
-- tabela SEM nenhuma policy — isso nega leitura/escrita pra chave pública (anon)
-- mesmo que ela vaze. Todo acesso real passa pela service-role key, usada só em
-- server functions (src/integrations/supabase/client.server.ts), com a checagem
-- de papel (admin/estagiário/visualizador) feita no server function.
-- ==============================================================================

-- ==============================================================================
-- 1. ENUMS
-- ==============================================================================
DO $$ BEGIN CREATE TYPE status_projeto_enum AS ENUM ('Em andamento','Concluído','Atrasado','Não iniciado','Suspenso'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE nivel_risco_enum AS ENUM ('Baixo','Médio','Alto','Crítico','—'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE status_atividade_enum AS ENUM ('Não iniciado','Em andamento','Concluído','Atrasado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE status_risco_enum AS ENUM ('Aberto','Em mitigação','Monitorando','Encerrado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE status_aprovacao_enum AS ENUM ('Aprovado','Pendente','Reprovado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tipo_mudanca_enum AS ENUM ('Escopo','Prazo','Financeiro','Equipe','Técnico'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE natureza_mudanca_enum AS ENUM ('Radical','Adaptação','Exclusão'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE executado_flag_enum AS ENUM ('Não','Sim','Parcial'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE status_prestacao_contas_enum AS ENUM ('Não enviado','Enviado','Aprovado pela FAS','Devolvido para ajuste','Reprovado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE registro_alteracao_enum AS ENUM ('Conforme planejado','Alterado parcialmente','Alterado totalmente','Novo item'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tipo_contrapartida_enum AS ENUM ('Financeira','Econômica'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tipo_evidencia_enum AS ENUM ('PDF','Imagem','Vídeo','Link','Documento'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE tipo_aporte_enum AS ENUM ('Entrada','Saída'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE entidade_operacao_enum AS ENUM ('meta','etapa','especificacao','risco','mudanca','financeiro'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE acao_operacao_enum AS ENUM ('criar','editar','excluir'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE status_aprovacao_pendente_enum AS ENUM ('Pendente','Aprovado','Recusado'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE status_comunidade_enum AS ENUM ('Ativa','Em execução','Concluída','Pausada','Prospectada'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE papel_fornecedor_enum AS ENUM ('Fornecedor','Comprador'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE status_capacitacao_enum AS ENUM ('Prevista','Em curso','Concluída'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==============================================================================
-- 2. FUNÇÃO AUXILIAR DE TIMESTAMP (reaproveitada do padrão trazido pelo usuário)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. COMUNIDADES (tabela + seções aninhadas) — CRUD completo é onda 2,
--    mas a tabela precisa existir agora por causa da FK de projetos.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.comunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  nome TEXT NOT NULL,
  responsavel_tecnico TEXT,
  segmento_social TEXT,
  eixo_principal TEXT,
  classificacao TEXT,
  localizacao TEXT,
  municipio TEXT,
  uf TEXT,
  financiador TEXT,
  objetivo TEXT,
  valor_total NUMERIC(14,2),
  forma_repasse TEXT,
  status_repasse TEXT,
  data_repasse TEXT,
  inicio_previsto TEXT,
  final_previsto TEXT,
  status status_comunidade_enum NOT NULL DEFAULT 'Prospectada',
  categorias_tematicas TEXT,
  compradores TEXT,
  garantia_venda TEXT,
  destinacao TEXT,
  ativacoes TEXT,
  oportunidades TEXT,
  total_beneficiados_diretos INTEGER DEFAULT 0,
  total_beneficiados_indiretos INTEGER DEFAULT 0,
  mulheres_beneficiadas INTEGER,
  receita_faixa TEXT,
  observacoes TEXT,
  plano_trabalho_arquivo TEXT,
  detalhamento TEXT,
  justificativa TEXT,
  produto_texto TEXT,
  infraestrutura TEXT,
  certificacao TEXT,
  territorio TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
DROP TRIGGER IF EXISTS set_comunidades_updated_at ON public.comunidades;
CREATE TRIGGER set_comunidades_updated_at BEFORE UPDATE ON public.comunidades FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.comunidade_pessoas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES public.comunidades(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, funcao TEXT, contato TEXT
);
CREATE TABLE IF NOT EXISTS public.comunidade_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES public.comunidades(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, categoria TEXT, observacao TEXT
);
CREATE TABLE IF NOT EXISTS public.comunidade_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES public.comunidades(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, papel papel_fornecedor_enum NOT NULL, detalhe TEXT
);
CREATE TABLE IF NOT EXISTS public.comunidade_capacitacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES public.comunidades(id) ON DELETE CASCADE,
  tema TEXT NOT NULL, publico TEXT, status status_capacitacao_enum
);

-- ==============================================================================
-- 4. PROJETOS (core + PlanoTrabalho flattenado) + EQUIPE
--
-- id fica BIGINT (não UUID) de propósito: Project.id ainda é referenciado como
-- number por módulos que NÃO migram nesta onda (Gantt/cronograma executivo via
-- projetoIds, Diagnóstico via projectId, seleção de projeto em App.tsx/Dashboard).
-- Manter o tipo evita ter que tocar nesses módulos antes da hora. As entidades
-- aninhadas (metas/riscos/mudanças/etc.) só existem dentro de um projeto e não
-- são referenciadas por nenhum módulo ainda-não-migrado — por isso essas usam UUID.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projetos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  org TEXT,
  segmento TEXT,
  code TEXT NOT NULL,
  coordenador TEXT,
  financiador TEXT,
  objetivo TEXT,
  data_inicio TEXT,
  data_fim TEXT,
  status status_projeto_enum NOT NULL DEFAULT 'Não iniciado',
  -- progresso/orcamento_executado: valor de fallback usado só quando não há
  -- atividades/itens financeiros ainda — quando existem, a leitura calcula
  -- média/soma em tempo real (ver src/server/projetos.server.ts).
  progresso NUMERIC(5,2) NOT NULL DEFAULT 0,
  orcamento_aprovado NUMERIC(14,2) NOT NULL DEFAULT 0,
  orcamento_executado NUMERIC(14,2) NOT NULL DEFAULT 0,
  nivel_risco nivel_risco_enum NOT NULL DEFAULT '—',
  drive_link TEXT,
  budget_link TEXT,
  termo_fomento_link TEXT,
  -- PlanoTrabalho (todos opcionais)
  problematica TEXT, justificativa TEXT, localizacao_abrangencia TEXT, diversidade TEXT,
  saberes_locais TEXT, experiencia_previa TEXT, capacidade_tecnica TEXT, estrategia TEXT,
  cronograma_fisico TEXT, detalhamento_recursos TEXT, contrapartida TEXT,
  justificativa_contrapartida TEXT, resultados_impactos TEXT, publico_alvo TEXT,
  beneficiados_diretos INTEGER, beneficiados_indiretos INTEGER, forma_acompanhamento TEXT,
  potencial_replicabilidade TEXT, potencial_ampliacao TEXT, pilares TEXT, metas_texto TEXT,
  detalhamento_plano TEXT, compradores TEXT, garantia_venda TEXT, destinacao TEXT,
  ativacoes TEXT, oportunidades TEXT, receita_faixa TEXT, valor_repasse TEXT,
  forma_repasse TEXT, status_repasse TEXT, data_repasse TEXT, observacoes TEXT, plano_arquivo TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
DROP TRIGGER IF EXISTS set_projetos_updated_at ON public.projetos;
CREATE TRIGGER set_projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.projeto_equipe (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL
);

-- ==============================================================================
-- 5. METAS → ENTREGAS → ATIVIDADES (hierarquia de 3 níveis: Goal→Deliverable→Activity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  resultado_esperado TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID NOT NULL REFERENCES public.entregas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  responsavel TEXT,
  data_planejada TEXT,
  data_inicio TEXT,
  data_conclusao TEXT,
  progresso NUMERIC(5,2) NOT NULL DEFAULT 0,
  status status_atividade_enum NOT NULL DEFAULT 'Não iniciado',
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. RISCOS E MUDANÇAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.plano_riscos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  meta_id UUID REFERENCES public.metas(id) ON DELETE SET NULL,
  -- textos legados denormalizados (exibição apenas — não editáveis via UI hoje)
  etapa_nome_legado TEXT,
  especificacao_legado TEXT,
  descricao TEXT NOT NULL,
  categoria TEXT,
  probabilidade INTEGER NOT NULL CHECK (probabilidade BETWEEN 1 AND 5),
  impacto INTEGER NOT NULL CHECK (impacto BETWEEN 1 AND 5),
  severidade INTEGER GENERATED ALWAYS AS (probabilidade * impacto) STORED,
  estrategia_mitigacao TEXT,
  responsavel TEXT,
  status status_risco_enum NOT NULL DEFAULT 'Aberto',
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
DROP TRIGGER IF EXISTS set_riscos_updated_at ON public.plano_riscos;
CREATE TRIGGER set_riscos_updated_at BEFORE UPDATE ON public.plano_riscos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.mudancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  meta_id UUID REFERENCES public.metas(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  tipo tipo_mudanca_enum NOT NULL,
  data TEXT,
  justificativa TEXT,
  aprovacao status_aprovacao_enum NOT NULL DEFAULT 'Pendente',
  responsavel TEXT,
  natureza natureza_mudanca_enum,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. ORÇAMENTO (itens + contrapartidas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  meta_texto TEXT,       -- ex.: "Meta 1" (texto livre — não é FK, espelha Project.financialItems[].meta/relatedGoal)
  categoria TEXT,
  item TEXT NOT NULL,
  qtd NUMERIC(10,2) NOT NULL DEFAULT 1,
  unidade TEXT,
  qtd_unidades NUMERIC(10,2) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_planejado NUMERIC(14,2) GENERATED ALWAYS AS (qtd * qtd_unidades * valor_unitario) STORED,
  valor_executado NUMERIC(14,2) NOT NULL DEFAULT 0,
  data TEXT,
  fornecedor TEXT,
  documento TEXT,
  executado_flag executado_flag_enum,
  prestacao_contas status_prestacao_contas_enum,
  registro_alteracao registro_alteracao_enum,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.orcamento_contrapartidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  meta_texto TEXT,
  descricao TEXT NOT NULL,
  tipo tipo_contrapartida_enum NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  unidade TEXT,
  valor_unitario NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(14,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. EVIDÊNCIAS, APORTES, CONTATOS, LOG DE COMUNICAÇÃO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo tipo_evidencia_enum NOT NULL,
  atividade_relacionada TEXT,
  data_upload TEXT,
  tamanho TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.aportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  tipo tipo_aporte_enum NOT NULL,
  origem TEXT,
  descricao TEXT,
  valor NUMERIC(14,2) NOT NULL DEFAULT 0,
  registrado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT,
  organizacao TEXT,
  telefone TEXT,
  email TEXT,
  notas TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.logs_comunicacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  hora TEXT,
  instituicao TEXT,
  representante TEXT,
  meio TEXT,
  quem_realizou TEXT,
  registro TEXT,
  retorno TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. LOG DE ALTERAÇÕES DE META E APROVAÇÕES PENDENTES (espelha ProjectOp/MetaChangeLog/PendingApproval)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.log_alteracoes_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  entidade entidade_operacao_enum NOT NULL,
  acao acao_operacao_enum NOT NULL,
  target_id UUID,
  parent_id UUID,
  target_path TEXT NOT NULL,
  campo TEXT,
  de_valor TEXT,
  para_valor TEXT,
  payload JSONB,
  autor TEXT NOT NULL,
  autor_papel TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  aprovado_por TEXT
);
CREATE TABLE IF NOT EXISTS public.aprovacoes_pendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  entidade entidade_operacao_enum NOT NULL,
  acao acao_operacao_enum NOT NULL,
  target_id UUID,
  parent_id UUID,
  target_path TEXT NOT NULL,
  campo TEXT,
  de_valor TEXT,
  para_valor TEXT,
  payload JSONB,
  autor TEXT NOT NULL,
  autor_papel TEXT NOT NULL,
  data TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  status status_aprovacao_pendente_enum NOT NULL DEFAULT 'Pendente',
  revisado_por TEXT
);

-- ==============================================================================
-- 10. STUBS DAS PRÓXIMAS ONDAS (schema criado agora, sem UI ainda)
-- ==============================================================================
-- Onda 2: Comunidades (CRUD completo), Rotas / Calendário
CREATE TABLE IF NOT EXISTS public.rotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rota TEXT NOT NULL,
  organizacao TEXT,
  municipio TEXT,
  uf TEXT,
  dias_atuacao INTEGER,
  modal_acesso TEXT,
  tipo_comunidade TEXT,
  notas_logisticas TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.eventos_calendario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  data TEXT NOT NULL,
  hora_inicio TEXT,
  hora_fim TEXT,
  tipo TEXT NOT NULL,
  rota_id UUID REFERENCES public.rotas(id) ON DELETE SET NULL,
  comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL,
  responsavel TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Onda 3: Cronograma Executivo (Gantt)
CREATE TABLE IF NOT EXISTS public.cronograma_blocos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS public.cronograma_entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_id UUID NOT NULL REFERENCES public.cronograma_blocos(id) ON DELETE CASCADE,
  entrega TEXT NOT NULL,
  data_inicio TEXT, data_fim TEXT, responsavel TEXT,
  status TEXT, progresso NUMERIC(5,2) DEFAULT 0, comentario TEXT
);
CREATE TABLE IF NOT EXISTS public.cronograma_atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrega_id UUID NOT NULL REFERENCES public.cronograma_entregas(id) ON DELETE CASCADE,
  atividade_pai_id UUID REFERENCES public.cronograma_atividades(id) ON DELETE CASCADE,
  atividade TEXT NOT NULL,
  grupo TEXT, descricao TEXT, data_inicio TEXT, data_fim TEXT,
  responsavel TEXT, aprovador TEXT, status TEXT, observacao TEXT, comentario TEXT,
  progresso NUMERIC(5,2) DEFAULT 0, vinculavel BOOLEAN DEFAULT false
);
CREATE TABLE IF NOT EXISTS public.cronograma_atividade_projetos (
  atividade_id UUID NOT NULL REFERENCES public.cronograma_atividades(id) ON DELETE CASCADE,
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  PRIMARY KEY (atividade_id, projeto_id)
);
CREATE TABLE IF NOT EXISTS public.cronograma_tracking (
  atividade_id UUID NOT NULL REFERENCES public.cronograma_atividades(id) ON DELETE CASCADE,
  projeto_id BIGINT NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Não iniciado',
  inicio TEXT, fim TEXT, responsavel TEXT, observacao TEXT,
  PRIMARY KEY (atividade_id, projeto_id)
);

-- Onda 4: Diagnóstico
CREATE TABLE IF NOT EXISTS public.diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projeto_id BIGINT REFERENCES public.projetos(id) ON DELETE SET NULL,
  comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE SET NULL,
  status TEXT, rodada INTEGER,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  maturidade JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE TABLE IF NOT EXISTS public.diagnostico_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  detalhes JSONB
);

-- Onda 5: Auditoria
CREATE TABLE IF NOT EXISTS public.log_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_login TEXT NOT NULL,
  area TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  projeto_id BIGINT,
  projeto_nome TEXT,
  kind TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. ÍNDICES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projetos_comunidade ON public.projetos(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_metas_projeto ON public.metas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_entregas_meta ON public.entregas(meta_id);
CREATE INDEX IF NOT EXISTS idx_atividades_entrega ON public.atividades(entrega_id);
CREATE INDEX IF NOT EXISTS idx_riscos_projeto ON public.plano_riscos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_mudancas_projeto ON public.mudancas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_projeto ON public.orcamento_itens(projeto_id);
CREATE INDEX IF NOT EXISTS idx_contrapartidas_projeto ON public.orcamento_contrapartidas(projeto_id);
CREATE INDEX IF NOT EXISTS idx_evidencias_projeto ON public.evidencias(projeto_id);
CREATE INDEX IF NOT EXISTS idx_aportes_projeto ON public.aportes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_contatos_projeto ON public.contatos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_logs_comunicacao_projeto ON public.logs_comunicacao(projeto_id);
CREATE INDEX IF NOT EXISTS idx_log_alteracoes_projeto ON public.log_alteracoes_meta(projeto_id);
CREATE INDEX IF NOT EXISTS idx_aprovacoes_projeto ON public.aprovacoes_pendentes(projeto_id);
CREATE INDEX IF NOT EXISTS idx_eventos_rota ON public.eventos_calendario(rota_id);
CREATE INDEX IF NOT EXISTS idx_eventos_comunidade ON public.eventos_calendario(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_entregas_bloco ON public.cronograma_entregas(bloco_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_atividades_entrega ON public.cronograma_atividades(entrega_id);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_projeto ON public.diagnosticos(projeto_id);
CREATE INDEX IF NOT EXISTS idx_log_auditoria_projeto ON public.log_auditoria(projeto_id);

-- ==============================================================================
-- 12. ROW LEVEL SECURITY — habilitado em tudo, sem policies (nega anon/authenticated;
--     service-role sempre ignora RLS, então as server functions continuam funcionando).
-- ==============================================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
