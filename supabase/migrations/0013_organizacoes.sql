-- ==============================================================================
-- 0013 — Organizações (RC-01 a RC-04)
--
-- A Organização já existia como a tabela `comunidades` (é a entidade que o
-- Diagnóstico usa desde a 0009). Esta migration faz dela o dono de três coisas
-- que até aqui moravam no projeto ou não existiam:
--
--   1. o tipo (Associação / Cooperativa), que não tinha coluna;
--   2. o histórico de contatos (logs_comunicacao), que era por projeto;
--   3. os encaminhamentos, que substituem as "ações derivadas" do parecer
--      técnico (parecer_acoes).
--
-- Também liga cada projeto à sua organização: `projetos.comunidade_id` existe
-- desde a 0001, mas nunca foi preenchido — o projeto guardava só a sigla em
-- texto (`projetos.org`). Sem esse vínculo não há como transferir o histórico.
--
-- Idempotente: pode rodar mais de uma vez sem duplicar nem perder dado.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Tipo da organização (RC-01)
-- Nulo significa "não informado" (RC-02), nunca um tipo padrão. Só é preenchido
-- quando o próprio nome diz — adivinhar pela sigla ("COO…") erraria sem que
-- ninguém percebesse.
-- ------------------------------------------------------------------------------
ALTER TABLE public.comunidades ADD COLUMN IF NOT EXISTS tipo TEXT;
DO $$ BEGIN
  ALTER TABLE public.comunidades
    ADD CONSTRAINT comunidades_tipo_ck CHECK (tipo IS NULL OR tipo IN ('Associação', 'Cooperativa'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

UPDATE public.comunidades SET tipo = 'Associação'
 WHERE tipo IS NULL AND nome ILIKE 'Associação%';
UPDATE public.comunidades SET tipo = 'Cooperativa'
 WHERE tipo IS NULL AND nome ILIKE 'Cooperativa%';

-- ------------------------------------------------------------------------------
-- 2. Organização que faltava e duplicata que sobrava
-- O projeto 14-2026 (RIKTIKO) não tinha organização cadastrada. E
-- "CAANP-AGROMEL (2ª rota)" é uma segunda rota de visita à mesma CAANP AGROMEL,
-- não outra organização: os diagnósticos feitos nela passam para a CAANP AGROMEL
-- e o registro sai. Decisão da equipe em 28/09/2026.
-- ------------------------------------------------------------------------------
INSERT INTO public.comunidades (code, nome, segmento_social, status)
SELECT '21-2026', 'RIKTIKO', 'Indígena', 'Ativa'
 WHERE NOT EXISTS (SELECT 1 FROM public.comunidades WHERE nome = 'RIKTIKO');

DO $$
DECLARE
  principal UUID;
  duplicata UUID;
BEGIN
  SELECT id INTO principal FROM public.comunidades
   WHERE nome = 'Cooperativa dos Agricultores e Apicultores no Nordeste Paraense (CAANP AGROMEL)';
  SELECT id INTO duplicata FROM public.comunidades WHERE nome = 'CAANP-AGROMEL (2ª rota)';
  IF principal IS NOT NULL AND duplicata IS NOT NULL THEN
    UPDATE public.diagnosticos       SET comunidade_id = principal WHERE comunidade_id = duplicata;
    UPDATE public.eventos_calendario SET comunidade_id = principal WHERE comunidade_id = duplicata;
    UPDATE public.projetos           SET comunidade_id = principal WHERE comunidade_id = duplicata;
    UPDATE public.comunidade_pessoas SET comunidade_id = principal WHERE comunidade_id = duplicata;
    DELETE FROM public.comunidades WHERE id = duplicata;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Vínculo projeto → organização
-- Pelo código do projeto, que é estável, e pelo nome completo da organização.
-- Casar pela sigla em `projetos.org` não bastaria: quatro siglas não aparecem
-- no nome da organização (AMIG, MEBENKOKRE, TAUARI, COOPASMIG) e foram
-- conferidas uma a uma pela equipe.
-- ------------------------------------------------------------------------------
UPDATE public.projetos p
   SET comunidade_id = c.id
  FROM (VALUES
    ('01-2026', 'ACREPAF — Jacundá'),
    ('02-2026', 'MALUNGU — Coordenação das Associações Quilombolas do Pará'),
    ('03-2026', 'Associação Mulheres Indígenas do Gurupi'),
    ('04-2026', 'Associação de Desenvolvimento Comunitário de Santa Maria do Pará (ADESC/PA)'),
    ('05-2026', 'Associação Mebengokre Yte Kayapo'),
    ('06-2026', 'Associação das Comunidades Remanescentes de Quilombos de Oriximiná (ARQMO)'),
    ('07-2026', 'ATAIC — Associação de Trabalhadores Agroextrativistas'),
    ('08-2026', 'ARQUIA — Abaetetuba'),
    ('09-2026', 'COOPAFS — Santarém'),
    ('10-2026', 'COOMAP — Oeiras do Pará'),
    ('11-2026', 'Turiwara-Ka''i'),
    ('12-2026', 'Cooperativa dos Agricultores e Apicultores no Nordeste Paraense (CAANP AGROMEL)'),
    ('13-2026', 'COPASMIG — São Miguel do Guamá'),
    ('14-2026', 'RIKTIKO'),
    ('15-2026', 'MANEJAÍ — Portel'),
    ('16-2026', 'Associação de Trabalhadores Rurais de Tauari (ATRT)'),
    ('17-2026', 'AIKATUK — Oriximiná'),
    ('18-2026', 'Associação Agroextrativista Sementes da Floresta (AASFLOR)'),
    ('19-2026', 'Cooperativa Amazônia Agroindustrial Viseu Pará (COOPAVISEU)'),
    ('20-2026', 'Nova Betel')
  ) AS m(codigo, nome_org)
  JOIN public.comunidades c ON c.nome = m.nome_org
 WHERE p.code = m.codigo
   AND p.comunidade_id IS NULL;

-- ------------------------------------------------------------------------------
-- 4. Registros de contato passam a pertencer à organização (RC-03)
--
-- O registro segue o RC-03: data, participantes, assunto, resumo e, quando
-- houver, meio. `projeto_id` fica, agora opcional: diz de qual projeto o
-- registro veio, o que ainda é informação útil, mas não é mais o dono.
--
-- Participantes absorve "representante" (quem falou pela organização) e "quem
-- realizou" (quem falou pela equipe). "Instituição" some — é a própria
-- organização. "Saída" vira um encaminhamento com origem neste registro (seção
-- 6), que é exatamente o que a saída tentava ser em texto livre.
-- ------------------------------------------------------------------------------
ALTER TABLE public.logs_comunicacao
  ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS participantes TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assunto TEXT,
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

ALTER TABLE public.logs_comunicacao ALTER COLUMN projeto_id DROP NOT NULL;
ALTER TABLE public.logs_comunicacao ALTER COLUMN meio DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.logs_comunicacao RENAME COLUMN registro TO resumo;
EXCEPTION WHEN undefined_column THEN null; END $$;

UPDATE public.logs_comunicacao l
   SET comunidade_id = p.comunidade_id
  FROM public.projetos p
 WHERE l.projeto_id = p.id AND l.comunidade_id IS NULL;

-- Participantes a partir das colunas antigas, se elas ainda existirem.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'logs_comunicacao'
                AND column_name = 'representante') THEN
    EXECUTE $q$
      UPDATE public.logs_comunicacao
         SET participantes = ARRAY(
               SELECT btrim(x) FROM unnest(ARRAY[quem_realizou, representante]) AS x
                WHERE x IS NOT NULL AND btrim(x) <> ''
             )
       WHERE cardinality(participantes) = 0
    $q$;
  END IF;
END $$;

-- Um registro sem organização não teria onde aparecer depois que a aba sai do
-- projeto. Se sobrar algum (projeto sem organização), a migration para aqui em
-- vez de esconder o registro.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.logs_comunicacao WHERE comunidade_id IS NULL) THEN
    RAISE EXCEPTION 'Há registro de contato cujo projeto não tem organização. Vincule o projeto antes de rodar esta migration.';
  END IF;
END $$;
ALTER TABLE public.logs_comunicacao ALTER COLUMN comunidade_id SET NOT NULL;

-- Chave composta para o encaminhamento poder exigir que a origem seja um
-- registro da MESMA organização (RC-04) no próprio banco.
DO $$ BEGIN
  ALTER TABLE public.logs_comunicacao
    ADD CONSTRAINT logs_comunicacao_id_org_uk UNIQUE (id, comunidade_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_logs_comunicacao_org ON public.logs_comunicacao(comunidade_id, data DESC);
DROP TRIGGER IF EXISTS set_logs_comunicacao_updated_at ON public.logs_comunicacao;
CREATE TRIGGER set_logs_comunicacao_updated_at BEFORE UPDATE ON public.logs_comunicacao
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Anexo de registro de contato não tem mais projeto obrigatório.
ALTER TABLE public.projeto_anexos ALTER COLUMN projeto_id DROP NOT NULL;
ALTER TABLE public.projeto_anexos
  ADD COLUMN IF NOT EXISTS comunidade_id UUID REFERENCES public.comunidades(id) ON DELETE CASCADE;
UPDATE public.projeto_anexos a
   SET comunidade_id = l.comunidade_id
  FROM public.logs_comunicacao l
 WHERE a.log_comunicacao_id = l.id AND a.comunidade_id IS NULL;

-- ------------------------------------------------------------------------------
-- 5. Encaminhamentos (RC-04)
--
-- A origem é um registro de contato da mesma organização OU um texto livre,
-- nunca os dois. O vínculo é pelo id: se o assunto ou a data do registro
-- mudarem, o encaminhamento continua apontando para ele e a tela mostra o
-- texto novo. Se o registro for excluído, o encaminhamento fica — perde só a
-- origem (SET NULL apenas da coluna do registro, não da organização).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.encaminhamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES public.comunidades(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  data_inicio DATE,
  data_fim DATE,
  status status_plano_enum NOT NULL DEFAULT 'A iniciar',
  log_comunicacao_id UUID,
  origem_texto TEXT,
  criado_por TEXT,
  atualizado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT encaminhamentos_descricao_ck CHECK (btrim(descricao) <> ''),
  CONSTRAINT encaminhamentos_datas_ck CHECK (data_inicio IS NULL OR data_fim IS NULL OR data_fim >= data_inicio),
  CONSTRAINT encaminhamentos_uma_origem_ck CHECK (log_comunicacao_id IS NULL OR origem_texto IS NULL),
  CONSTRAINT encaminhamentos_origem_mesma_org_fk
    FOREIGN KEY (log_comunicacao_id, comunidade_id)
    REFERENCES public.logs_comunicacao(id, comunidade_id)
    ON DELETE SET NULL (log_comunicacao_id)
);
ALTER TABLE public.encaminhamentos ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_org ON public.encaminhamentos(comunidade_id);
CREATE INDEX IF NOT EXISTS idx_encaminhamentos_log ON public.encaminhamentos(log_comunicacao_id);
DROP TRIGGER IF EXISTS set_encaminhamentos_updated_at ON public.encaminhamentos;
CREATE TRIGGER set_encaminhamentos_updated_at BEFORE UPDATE ON public.encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Dados que viram encaminhamento
-- ------------------------------------------------------------------------------
-- 6a. A "saída" de cada registro de contato, com origem no próprio registro.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'logs_comunicacao'
                AND column_name = 'retorno') THEN
    EXECUTE $q$
      INSERT INTO public.encaminhamentos (comunidade_id, descricao, responsavel, data_inicio, log_comunicacao_id, criado_por)
      SELECT l.comunidade_id, btrim(l.retorno), l.quem_realizou, l.data::date, l.id, l.quem_realizou
        FROM public.logs_comunicacao l
       WHERE l.retorno IS NOT NULL AND btrim(l.retorno) <> ''
         AND NOT EXISTS (SELECT 1 FROM public.encaminhamentos e WHERE e.log_comunicacao_id = l.id)
    $q$;
  END IF;
END $$;

-- 6b. As ações derivadas do parecer técnico, que o RC-04 substitui. A origem
--     vira texto, porque o parecer é do projeto e não um registro de contato.
DO $$ BEGIN
  IF to_regclass('public.parecer_acoes') IS NOT NULL THEN
    INSERT INTO public.encaminhamentos (comunidade_id, descricao, responsavel, data_fim, status, origem_texto, criado_em)
    SELECT pr.comunidade_id, a.descricao, a.responsavel, a.prazo, a.status,
           'Parecer técnico de ' || to_char(pt.data, 'DD/MM/YYYY') || ' — projeto ' || pr.code,
           a.criado_em
      FROM public.parecer_acoes a
      JOIN public.pareceres_tecnicos pt ON pt.id = a.parecer_id
      JOIN public.projetos pr ON pr.id = pt.projeto_id
     WHERE pr.comunidade_id IS NOT NULL;
    IF EXISTS (
      SELECT 1 FROM public.parecer_acoes a
        JOIN public.pareceres_tecnicos pt ON pt.id = a.parecer_id
        JOIN public.projetos pr ON pr.id = pt.projeto_id
       WHERE pr.comunidade_id IS NULL
    ) THEN
      RAISE EXCEPTION 'Há ação de parecer em projeto sem organização. Vincule o projeto antes de rodar esta migration.';
    END IF;
    DROP TABLE public.parecer_acoes;
  END IF;
END $$;

-- 6c. Colunas antigas do registro de contato, já convertidas acima.
ALTER TABLE public.logs_comunicacao
  DROP COLUMN IF EXISTS instituicao,
  DROP COLUMN IF EXISTS representante,
  DROP COLUMN IF EXISTS quem_realizou,
  DROP COLUMN IF EXISTS retorno;

-- ------------------------------------------------------------------------------
-- 7. Realtime: as telas de Organização também reagem a mudanças de outras pessoas.
-- ------------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['comunidades', 'comunidade_pessoas', 'encaminhamentos']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS broadcast_change ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER broadcast_change AFTER INSERT OR UPDATE OR DELETE ON public.%I ' ||
      'FOR EACH ROW EXECUTE FUNCTION public.broadcast_projetos_change()', t
    );
  END LOOP;
END $$;
