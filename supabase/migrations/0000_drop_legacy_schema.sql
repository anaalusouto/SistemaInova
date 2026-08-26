-- ==============================================================================
-- Remove o schema antigo (colado na conversa antes de desenharmos o schema real
-- em 0001_init_schema.sql). Nada foi populado nele ainda — seguro de apagar.
-- Rode ESTE arquivo ANTES do 0001_init_schema.sql.
-- ==============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.historico_riscos CASCADE;
DROP TABLE IF EXISTS public.plano_riscos CASCADE;
DROP TABLE IF EXISTS public.orcamento_contrapartidas CASCADE;
DROP TABLE IF EXISTS public.orcamento_itens CASCADE;
DROP TABLE IF EXISTS public.etapas_meta CASCADE;
DROP TABLE IF EXISTS public.metas CASCADE;
DROP TABLE IF EXISTS public.equipe_projeto CASCADE;
DROP TABLE IF EXISTS public.projetos CASCADE;
DROP TABLE IF EXISTS public.comunidades CASCADE;
DROP TABLE IF EXISTS public.perfis_usuarios CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.eh_admin();
DROP FUNCTION IF EXISTS public.pode_editar();
DROP FUNCTION IF EXISTS public.handle_updated_at();

DROP TYPE IF EXISTS tipo_comunidade_enum;
DROP TYPE IF EXISTS severidade_risco_enum;
DROP TYPE IF EXISTS status_risco_enum;
DROP TYPE IF EXISTS categoria_risco_enum;
DROP TYPE IF EXISTS user_role_enum;
