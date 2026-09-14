-- RF-02 — Reestruturação do módulo Diagnóstico.
-- O modelo antigo (rodada INTEGER + respostas/maturidade JSONB genéricos) nunca
-- teve CRUD real ligado (o frontend usava só localStorage) e é incompatível com
-- os quatro instrumentos novos (Matriz Funcional, IEO, Cesta de Produtos, Parecer
-- Técnico) — dropamos e recriamos do zero. `comunidades` já existe com o schema
-- certo (onda 2, também stub) e vira a entidade "Organização"; só ganha dados
-- reais (seed) e CRUD (`comunidades.server.ts`) nesta migration/rodada.
--
-- Nota (2026-09-14): os `DROP TABLE` originais desta migration (que existiam
-- só para descartar o modelo antigo, uma única vez) foram removidos depois que
-- a migration já tinha rodado com sucesso em produção e os instrumentos novos
-- já tinham dados reais. Mantê-los faria o pipeline "Supabase Preview" do
-- GitHub (que reaplica migrations "pendentes" segundo seu próprio histórico,
-- desalinhado do nosso porque aplicamos isso via SQL Editor manual, não via
-- CLI) apagar diagnósticos reais toda vez que rodasse de novo. Toda a migration
-- agora é idempotente (IF NOT EXISTS / DROP...IF EXISTS antes de recriar).
--
-- ---------------------------------------------------------------------------
-- Cabeçalho do diagnóstico: Organização (comunidades) + Aplicação (data) +
-- versão. O versionamento é do diagnóstico completo — nunca por instrumento
-- isolado (RF-02.08). `diagnostico_anterior_id` encadeia o histórico de versões.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comunidade_id UUID NOT NULL REFERENCES public.comunidades(id) ON DELETE CASCADE,
  data_aplicacao DATE NOT NULL,
  versao INTEGER NOT NULL DEFAULT 1,
  diagnostico_anterior_id UUID REFERENCES public.diagnosticos(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'em_edicao' CHECK (status IN ('em_edicao', 'concluido')),
  concluido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_diagnosticos_comunidade ON public.diagnosticos(comunidade_id);
DROP TRIGGER IF EXISTS set_diagnosticos_updated_at ON public.diagnosticos;
CREATE TRIGGER set_diagnosticos_updated_at BEFORE UPDATE ON public.diagnosticos
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Matriz Funcional — uma linha por função avaliada (catálogo de 24 funções
-- fixo em src/app/diagnostic/catalog/matrizFuncional.ts, referenciado por
-- funcao_id). Função/Descrição/Exemplo são fixos no catálogo, não no banco.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_matriz (
  diagnostico_id UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  funcao_id TEXT NOT NULL,
  atuacao TEXT[] NOT NULL DEFAULT '{}',
  quem_executa TEXT,
  interesse TEXT,
  criticidade TEXT,
  abrangencia TEXT,
  observacoes TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (diagnostico_id, funcao_id)
);
ALTER TABLE public.diagnostico_matriz ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- IEO — uma linha por pergunta pontuável (catálogo em
-- src/app/diagnostic/catalog/ieo.ts, pergunta_id ex. "1.1.1"). Nível 1-4;
-- perguntas sem resposta simplesmente não têm linha (não contam como 0 no
-- cálculo — ver src/app/diagnostic/ieoCalculation.ts).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_ieo (
  diagnostico_id UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  pergunta_id TEXT NOT NULL,
  nivel SMALLINT NOT NULL CHECK (nivel BETWEEN 1 AND 4),
  observacao TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (diagnostico_id, pergunta_id)
);
ALTER TABLE public.diagnostico_ieo ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Cesta de Produtos — múltiplos produtos por diagnóstico. Campos usados em
-- listagem/resumo ficam em colunas; o restante dos ~40 campos dos 8 blocos
-- (catálogo em src/app/diagnostic/catalog/cestaProdutos.ts) fica em `respostas`
-- (chaveado por slug do campo), mesmo padrão de `answers` do diagnóstico antigo.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cadeia TEXT,
  status_preenchimento TEXT NOT NULL DEFAULT 'em_preenchimento' CHECK (status_preenchimento IN ('completo', 'em_preenchimento')),
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_diagnostico_produtos_diagnostico ON public.diagnostico_produtos(diagnostico_id);
ALTER TABLE public.diagnostico_produtos ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Parecer Técnico — 1:1 com o diagnóstico. Parte 1 (perguntas complementares,
-- catálogo em src/app/diagnostic/catalog/parecerComplementar.ts) em JSONB;
-- Parte 2 (análise técnica) tem 5 campos fixos, cada um vira coluna própria.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_parecer (
  diagnostico_id UUID PRIMARY KEY REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  respostas_complementares JSONB NOT NULL DEFAULT '{}'::jsonb,
  sintese TEXT,
  capacidades TEXT,
  fragilidades TEXT,
  pontos_prioritarios TEXT,
  consideracoes_tecnicas TEXT,
  evidencias_vinculadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.diagnostico_parecer ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Checklist documental (parte do Parecer) — 8 itens fixos (catálogo em
-- src/app/diagnostic/catalog/checklistDocumental.ts).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_checklist_itens (
  diagnostico_id UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  item_id SMALLINT NOT NULL,
  disponivel TEXT CHECK (disponivel IN ('Sim', 'Não', 'N/A')),
  observacoes TEXT,
  anexo_id UUID,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (diagnostico_id, item_id)
);
ALTER TABLE public.diagnostico_checklist_itens ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Anexos reais do checklist documental (Supabase Storage). Vinculado ao item
-- específico, à organização (via diagnóstico) e à versão do diagnóstico em que
-- foi enviado (RF-02.50) — cada versão nova reaponta pro mesmo anexo_id em vez
-- de reenviar o arquivo (é a mesma evidência).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diagnostico_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES public.diagnosticos(id) ON DELETE CASCADE,
  checklist_item_id SMALLINT,
  storage_path TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  tipo_mime TEXT,
  tamanho_bytes BIGINT,
  enviado_por TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.diagnostico_anexos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.diagnostico_checklist_itens
  DROP CONSTRAINT IF EXISTS diagnostico_checklist_itens_anexo_fk;
ALTER TABLE public.diagnostico_checklist_itens
  ADD CONSTRAINT diagnostico_checklist_itens_anexo_fk
  FOREIGN KEY (anexo_id) REFERENCES public.diagnostico_anexos(id) ON DELETE SET NULL;

-- Bucket privado de Storage para os anexos — acesso só via service-role
-- (URL assinada gerada sob demanda pelo server function), mesmo princípio de
-- "nunca client direto" já usado no resto do projeto.
INSERT INTO storage.buckets (id, name, public)
VALUES ('diagnostico-anexos', 'diagnostico-anexos', false)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed de Organizações reais (comunidades) — a tabela existia desde a onda 2
-- mas nunca tinha sido populada (frontend usava só o seed local em
-- src/app/data/comunidades.ts). Necessário pra Diagnóstico ter organizações
-- reais pra selecionar. "Classificação" da comunidade (Indígena/Quilombola/
-- Tradicional/Agricultura Familiar) mora em segmento_social, não na coluna
-- classificacao (que aqui guarda só "Projeto Estruturante" pra todas).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.comunidades) THEN
    INSERT INTO public.comunidades (code, nome, responsavel_tecnico, segmento_social, eixo_principal, classificacao, localizacao, municipio, uf, financiador, objetivo, valor_total, forma_repasse, status_repasse, data_repasse, inicio_previsto, final_previsto, status, categorias_tematicas, compradores, garantia_venda, destinacao, ativacoes, oportunidades, total_beneficiados_diretos, total_beneficiados_indiretos, mulheres_beneficiadas, receita_faixa, observacoes, plano_trabalho_arquivo, detalhamento, justificativa, produto_texto)
    VALUES
      ('01-2026', 'Associação de Desenvolvimento Comunitário de Santa Maria do Pará (ADESC/PA)', NULL, 'Comunidade Tradicional', 'Eixo 1', 'Projeto Estruturante', 'Santa Maria do Pará', 'Santa Maria do Pará', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecer cadeias locais da sociobiodiversidade em Santa Maria do Pará e Maracanã, integrando segurança alimentar, geração de renda e conservação ambiental via quintais agroecológicos e apicultura comunitária.', 164285.71, 'Parcela Única', 'Efetuado', '01/04/2026', '01/2026', '12/2026', 'Em execução', 'Alimentos e bebidas da sociobiodiversidade, Fortalecimento produtivo e organizacional territorial', 'Em feiras locais', 'Não identificado', 'Comércio e Varejo Local/Regional', NULL, 'Realizar imersões turísticas de forma transversal', 80, 1020, NULL, 'Até R$75k', 'Quintais produtivos, biodigestor e apicultura', 'AJUSTADO- Plano de Trabalho - ADESC 24.10.pdf', 'Fortalecer cadeias locais da sociobiodiversidade em Santa Maria do Pará/PA e Maracanã/PA, integrando segurança alimentar, geração de renda e conservação ambiental por meio da implantação de quintais agroecológicos produtivos e do fortalecimento de apicultura comunitária.', 'Fortalecimento dos sociobionegócios; valorização de saberes e promoção da segurança alimentar.', 'Santa Maria do Pará (Quintais agroecológicos; qualificação de resíduos orgânicos); Maracanã (1 apiário, 10 novas colmeias: apicultura, mel artesanal e derivados)'),
      ('02-2026', 'Associação de Trabalhadores Rurais de Tauari (ATRT)', NULL, 'Agricultura Familiar', 'Eixo 3', 'Projeto Estruturante', 'Capanema', 'Capanema', 'PA', 'INOVA FAS/FUNBIO', 'Implantar agroindústria comunitária de mandioca com certificação ADEPARÁ e novos derivados, gerando renda e capacitando 20 mulheres.', 164285.71, 'Parcela Única', 'Efetuado', '12/02/2026', '01/2026', '12/2026', 'Em execução', 'Alimentos e bebidas da sociobiodiversidade', 'Governo Federal (PAA/CONAB) e atravessadores locais', 'Com Fornecedor Fixo', 'Programas Governamentais, Atravessadores e Distribuidores', NULL, NULL, 20, 500, NULL, 'R$75k-R$250k', 'Agroindústria de mandioca', 'REAJUSTE - PROPOSTA DE PLANO DE TRABALHO TAUARI 21.10.25.pdf', 'Implantar agroindústria comunitária moderna para beneficiamento da mandioca com certificação ADEPARÁ; capacitar 20 mulheres em boas práticas de produção e gestão; desenvolver cinco novos produtos derivados; criar a marca Farinha Tauari Premium.', 'Implementação de agroindústria comunitária.', 'Farinha lavada, goma, tucupi, farinha de tapioca, farinha saborizada e farinha para farofa'),
      ('03-2026', 'Associação Agroextrativista Sementes da Floresta (AASFLOR)', NULL, 'Agricultura Familiar', 'Eixo 3', 'Projeto Estruturante', 'Uruará', 'Uruará', 'PA', 'INOVA FAS/FUNBIO', 'Ampliar e diversificar a capacidade produtiva das mini-usinas e farinheiras, dando suporte técnico à extração de sementes.', 164285.71, 'Parcela Única', 'Efetuado', '16/04/2026', '01/2026', '12/2026', 'Em execução', 'Alimentos e bebidas da sociobiodiversidade', 'Varejo e representantes comerciais em São Paulo, Belém, Altamira e Santarém', 'Garantia Parcial', 'Consumidor Final e Venda Direta', NULL, NULL, 100, 400, 16, 'R$75k-R$250k', 'Manejo, cultivo, extração de sementes, óleos e manteigas', 'SEMENTES DA FLORESTA PROPOSTA DE PLANO DE TRABALHO - AJUSTADO 23.10.docx', 'Contratar técnico de campo para capacitar comunidades, melhorar estruturas de mini-usina de extração de óleos e manteigas e criar estrutura de secagem, aumentando capacidade produtiva e qualidade.', 'Ampliação e diversificação da capacidade produtiva das mini-usinas e farinheiras.', 'Coleta de sementes, óleos e manteigas vegetais, castanha-do-pará, babaçu, andiroba, copaíba e farinha de mandioca'),
      ('04-2026', 'Associação das Comunidades Remanescentes de Quilombos de Oriximiná (ARQMO)', NULL, 'Quilombola', 'Eixo 1', 'Projeto Estruturante', 'Oriximiná', 'Oriximiná', 'PA', 'INOVA FAS/FUNBIO', 'Implantar 2 viveiros agroflorestais comunitários no território quilombola do Erepecuru com produção mínima de 5 mil mudas/ano por viveiro, reflorestando ao menos 30ha.', 200000, 'Parcela Única', 'NA', NULL, '01/2026', '11/2026', 'Prospectada', 'Manejo territorial e restauração agroflorestal', 'Santarém, Oriximiná e região', 'Garantia Parcial', 'Consumidor Final e Venda Direta', NULL, NULL, 50, 1000, NULL, 'Acima de R$1M', 'Manejo sustentável', 'ARQMO PROPOSTA DE PLANO DE TRABALHO 26.09.pdf', 'Implantar até novembro/2026, 2 viveiros comunitários agroflorestais com capacidade mínima de 5 mil mudas/ano, envolvendo 50 membros em capacitações práticas e reflorestamento de 30 ha.', 'Manejo inadequado das áreas agrícolas com perda de biodiversidade e degradação do solo.', 'Viveiro agroflorestal comunitário: mudas nativas e de uso tradicional; reflorestamento'),
      ('05-2026', 'Cooperativa Amazônia Agroindustrial Viseu Pará (COOPAVISEU)', NULL, 'Agricultura Familiar', 'Eixo 3', 'Projeto Estruturante', 'Viseu', 'Viseu', 'PA', 'INOVA FAS/FUNBIO', 'Estruturar a cadeia agroindustrial de frutas da sociobiodiversidade em Viseu com construção e operacionalização de agroindústria de polpas.', 164285.71, 'Parcela Única', 'Efetuado', '06/04/2026', '01/2026', '10/2026', 'Em execução', 'Alimentos e bebidas da sociobiodiversidade', 'Atravessadores locais, mercados regionais (Belém, Castanhal, Bragança), PNAE municipal', 'Com Fornecedor Fixo', 'Atravessadores, Programas Governamentais', 'Participação no MVP Laboratório Fábrica', NULL, 30, 600, NULL, 'R$75k-R$250k', 'Agroindústria de polpas', '[OFICIAL COOPAVISEU] Plano de Trabalho.docx - AJUSTADO.docx', 'Estruturar até outubro/2026 a cadeia agroindustrial de frutas com agroindústria de polpas em Viseu/PA, gerando renda para pelo menos 30 cooperados.', 'Estruturar a cadeia de beneficiamento.', 'Agroindústria de polpa; capacitação de cooperados e certificação sanitária; acesso a editais PNAE, PAA'),
      ('06-2026', 'Cooperativa dos Agricultores e Apicultores no Nordeste Paraense (CAANP AGROMEL)', NULL, 'Agricultura Familiar', 'Eixo 3', 'Projeto Estruturante', 'São João de Pirabas', 'São João de Pirabas', 'PA', 'INOVA FAS/FUNBIO', 'Modernizar a infraestrutura da AGROMEL com inovação, certificação sanitária e diversificação (mel e polpas).', 164285.71, 'Parcela Única', 'Efetuado', '10/03/2026', '01/2026', '12/2026', 'Em execução', 'Alimentos e bebidas da sociobiodiversidade', 'Governo Federal (PAA), atravessadores e consumidores locais', 'Com Fornecedor Fixo', 'Programas Governamentais, Atravessadores, Comércio Local/Regional', 'Participação no MVP Laboratório Fábrica', NULL, 25, 500, 16, 'R$75k-R$250k', 'Agroindústria de polpas', 'PROPOSTA DE PLANO DE TRABALHO CAANP AGROMEL', 'Construir casa de despolpar frutas, finalizar reforma do entreposto, adquirir equipamentos modernos, capacitar 25 cooperados em gestão, obter certificação ADEPARÁ e ampliar canais de venda.', 'Estruturar e modernizar a cadeia produtiva da AGROMEL.', 'Unidade de despolpa de frutas, entreposto próprio e casa de mel'),
      ('07-2026', 'COPASMIG — São Miguel do Guamá', NULL, 'Quilombola', 'Eixo 1', 'Projeto Estruturante', 'São Miguel do Guamá', 'São Miguel do Guamá', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecimento da cadeia produtiva comunitária quilombola.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Fortalecimento produtivo e organizacional territorial', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, 'Detalhamento a ser complementado pelo plano de trabalho.', NULL, NULL),
      ('08-2026', 'MALUNGU — Coordenação das Associações Quilombolas do Pará', NULL, 'Quilombola', 'Eixo 1', 'Projeto Estruturante', 'São Miguel do Guamá', 'São Miguel do Guamá', 'PA', 'INOVA FAS/FUNBIO', 'Floresta viva e negócios quilombolas sustentáveis.', 200000, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Manejo territorial e restauração agroflorestal', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('09-2026', 'CAANP-AGROMEL (2ª rota)', NULL, 'Agricultura Familiar', 'Eixo 3', 'Projeto Estruturante', 'São João de Pirabas', 'São João de Pirabas', 'PA', 'INOVA FAS/FUNBIO', 'Cadeia produtiva do mel e polpas.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Alimentos e bebidas da sociobiodiversidade', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('10-2026', 'Associação Mulheres Indígenas do Gurupi', NULL, 'Indígena', 'Eixo 2', 'Projeto Estruturante', 'Paragominas — Vila Caip', 'Paragominas', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecimento produtivo de mulheres indígenas do Gurupi.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Fortalecimento produtivo e organizacional territorial', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('11-2026', 'Nova Betel', NULL, 'Quilombola', 'Eixo 1', 'Projeto Estruturante', 'Tomé-Açu / Quatro Bocas', 'Tomé-Açu', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecimento comunitário quilombola.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Fortalecimento produtivo e organizacional territorial', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('12-2026', 'Turiwara-Ka''i', NULL, 'Indígena', 'Eixo 2', 'Projeto Estruturante', 'Tomé-Açu / Quatro Bocas', 'Tomé-Açu', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecimento indígena Turiwara-Ka''i.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Fortalecimento produtivo e organizacional territorial', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('13-2026', 'ARQUIA — Abaetetuba', NULL, 'Quilombola', 'Eixo 1', 'Projeto Estruturante', 'Abaetetuba', 'Abaetetuba', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecimento produtivo quilombola em Abaetetuba.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Fortalecimento produtivo e organizacional territorial', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('14-2026', 'COOMAP — Oeiras do Pará', NULL, 'Comunidade Tradicional', 'Eixo 3', 'Projeto Estruturante', 'Oeiras do Pará', 'Oeiras do Pará', 'PA', 'INOVA FAS/FUNBIO', 'Cadeia produtiva de comunidades tradicionais em Oeiras do Pará.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Alimentos e bebidas da sociobiodiversidade', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('15-2026', 'MANEJAÍ — Portel', NULL, 'Comunidade Tradicional', 'Eixo 1', 'Projeto Estruturante', 'Portel', 'Portel', 'PA', 'INOVA FAS/FUNBIO', 'Manejo comunitário em Portel.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Manejo territorial e restauração agroflorestal', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('16-2026', 'ATAIC — Associação de Trabalhadores Agroextrativistas', NULL, 'Comunidade Tradicional', 'Eixo 3', 'Projeto Estruturante', 'Operação via Macapá/Santana', 'Macapá', 'AP', 'INOVA FAS/FUNBIO', 'Fortalecimento agroextrativista.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Alimentos e bebidas da sociobiodiversidade', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('17-2026', 'COOPAFS — Santarém', NULL, 'Agricultura Familiar', 'Eixo 3', 'Projeto Estruturante', 'Santarém', 'Santarém', 'PA', 'INOVA FAS/FUNBIO', 'Cadeia produtiva de agricultores familiares em Santarém.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Alimentos e bebidas da sociobiodiversidade', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('18-2026', 'AIKATUK — Oriximiná', NULL, 'Indígena', 'Eixo 2', 'Projeto Estruturante', 'Oriximiná', 'Oriximiná', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecimento indígena em Oriximiná.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Fortalecimento produtivo e organizacional territorial', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('19-2026', 'Associação Mebengokre Yte Kayapo', NULL, 'Indígena', 'Eixo 2', 'Projeto Estruturante', 'Redenção', 'Redenção', 'PA', 'INOVA FAS/FUNBIO', 'Fortalecimento indígena Mebengokre.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Fortalecimento produtivo e organizacional territorial', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
      ('20-2026', 'ACREPAF — Jacundá', NULL, 'Comunidade Tradicional', 'Eixo 3', 'Projeto Estruturante', 'Jacundá', 'Jacundá', 'PA', 'INOVA FAS/FUNBIO', 'Cadeia produtiva tradicional em Jacundá.', 164285.71, 'Parcela Única', 'A definir', NULL, '01/2026', '12/2026', 'Ativa', 'Alimentos e bebidas da sociobiodiversidade', NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
  END IF;
END $$;
