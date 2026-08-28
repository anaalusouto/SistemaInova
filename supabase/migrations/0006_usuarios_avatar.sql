-- Foto de perfil: guardada como data URL já redimensionada/comprimida no
-- cliente (ver AvatarEditor em ConfiguracoesPage.tsx) — sem bucket de
-- Storage novo, o app ainda não tinha upload de arquivo nenhum.
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS avatar_data_url TEXT;
