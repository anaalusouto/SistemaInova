-- Guarda o último acesso de cada usuário para exibir status de presença
-- (Ativo agora / Inativo desde ...) na área de Equipe. Atualizado por um
-- heartbeat do cliente enquanto a aba está aberta (ver registrarPresenca em
-- src/app/usuarios.server.ts) — antes disso era só localStorage, que não
-- refletia o status entre usuários/dispositivos diferentes.
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMPTZ;
