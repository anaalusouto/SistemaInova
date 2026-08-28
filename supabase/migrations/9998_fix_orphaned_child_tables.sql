-- Corrige TODAS as tabelas "filhas" que sobreviveram ao 0000 rodado 2x sem
-- terem sido recriadas (perderam a foreign key com projetos/metas/comunidades
-- quando essas tabelas-pai foram derrubadas e recriadas). Todas estão vazias
-- (nenhuma tem dado real de uso ainda) — sem risco. Depois disso, rode
-- 0001_init_schema.sql de novo pra recriar todas com a FK correta.
DROP TABLE IF EXISTS public.projeto_equipe CASCADE;
DROP TABLE IF EXISTS public.mudancas CASCADE;
DROP TABLE IF EXISTS public.evidencias CASCADE;
DROP TABLE IF EXISTS public.aportes CASCADE;
DROP TABLE IF EXISTS public.contatos CASCADE;
DROP TABLE IF EXISTS public.logs_comunicacao CASCADE;
DROP TABLE IF EXISTS public.log_alteracoes_meta CASCADE;
DROP TABLE IF EXISTS public.aprovacoes_pendentes CASCADE;
DROP TABLE IF EXISTS public.comunidade_pessoas CASCADE;
DROP TABLE IF EXISTS public.comunidade_produtos CASCADE;
DROP TABLE IF EXISTS public.comunidade_fornecedores CASCADE;
DROP TABLE IF EXISTS public.comunidade_capacitacoes CASCADE;
DROP TABLE IF EXISTS public.eventos_calendario CASCADE;
DROP TABLE IF EXISTS public.cronograma_atividade_projetos CASCADE;
DROP TABLE IF EXISTS public.cronograma_tracking CASCADE;
DROP TABLE IF EXISTS public.diagnosticos CASCADE;
