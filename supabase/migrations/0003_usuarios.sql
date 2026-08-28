-- ==============================================================================
-- Usuários e papéis (admin/estagiário/visualizador) — migra a autenticação da
-- lista fixa em src/app/auth/authStore.tsx para uma tabela real, para que
-- administradores possam criar contas e trocar papéis pela própria UI.
--
-- Senhas ficam com hash (scrypt, feito em Node em src/app/usuarios.server.ts)
-- — nunca em texto puro. Sem Supabase Auth ainda: mesma decisão de
-- 0001_init_schema.sql, checagem de papel feita nos server functions.
-- ==============================================================================
DO $$ BEGIN CREATE TYPE papel_usuario_enum AS ENUM ('admin','estagiario','visualizador'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login TEXT NOT NULL,
  senha_hash TEXT NOT NULL,
  nome_exibicao TEXT NOT NULL,
  papel papel_usuario_enum NOT NULL DEFAULT 'estagiario',
  -- Estagiário com poderes administrativos (ex.: Ana Paula) — ver hasAdminPowers.
  admin_override BOOLEAN NOT NULL DEFAULT false,
  email TEXT,
  notif_email BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_login ON public.usuarios (lower(login));

DROP TRIGGER IF EXISTS set_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER set_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
