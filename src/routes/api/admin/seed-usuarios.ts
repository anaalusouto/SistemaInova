import { createFileRoute } from '@tanstack/react-router';
import { randomBytes, scryptSync } from 'node:crypto';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/** Snapshot único da antiga lista fixa (src/app/auth/authStore.tsx) — só usado nesta semeadura. */
const USERS = [
  { login: 'LJCRIA', senha: '12332145+', nome: 'LJCRIA (Administrador)', papel: 'admin', override: false, email: null },
  { login: 'suze.oliveira@cesupa.br', senha: '09230047', nome: 'Suze Oliveira', papel: 'admin', override: false, email: 'suze.oliveira@cesupa.br' },
  { login: 'monica.silva@cesupa.br', senha: '010203', nome: 'Mônica Silva', papel: 'admin', override: false, email: 'monica.silva@cesupa.br' },
  { login: 'gaby', senha: '91049303', nome: 'Gaby', papel: 'admin', override: false, email: null },
  { login: 'ADMCRIA', senha: 'ADMCRIA123', nome: 'ADMCRIA (Administrador)', papel: 'admin', override: false, email: null },
  { login: 'caio25230026@aluno.cesupa.br', senha: 'Pipa123', nome: 'Caio Fiuza', papel: 'estagiario', override: false, email: 'caio25230026@aluno.cesupa.br' },
  { login: 'flavia2414310@aluno.cesupa.br', senha: '310718', nome: 'Flávia Cascaes', papel: 'estagiario', override: false, email: 'flavia2414310@aluno.cesupa.br' },
  { login: 'pedro25230037@aluno.cesupa.br', senha: '120604', nome: 'Pedro Henrique', papel: 'estagiario', override: false, email: 'pedro25230037@aluno.cesupa.br' },
  { login: 'ana23070210@aluno.cesupa.br', senha: '35trcpz@!769A', nome: 'Ana Luiza Souto', papel: 'estagiario', override: false, email: 'ana23070210@aluno.cesupa.br' },
  { login: 'ana23330012@aluno.cesupa.br', senha: '235010', nome: 'Ana Paula', papel: 'estagiario', override: true, email: 'ana23330012@aluno.cesupa.br' },
  { login: 'fas', senha: 'FAS2026', nome: 'FAS', papel: 'visualizador', override: false, email: null },
  { login: 'funbio', senha: 'FUNBIO2026', nome: 'FUNBIO', papel: 'visualizador', override: false, email: null },
  { login: 'semas', senha: 'SEMAS2026', nome: 'SEMAS', papel: 'visualizador', override: false, email: null },
] as const;

export const Route = createFileRoute('/api/admin/seed-usuarios')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = process.env.SEED_TOKEN;
        if (!expected) {
          return Response.json({ ok: false, error: 'SEED_TOKEN não configurado no ambiente do servidor.' }, { status: 500 });
        }
        const token = new URL(request.url).searchParams.get('token');
        if (token !== expected) {
          return Response.json({ ok: false, error: 'Token inválido ou ausente.' }, { status: 401 });
        }

        const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

        const { count, error: countError } = await supabaseAdmin.from('usuarios').select('*', { count: 'exact', head: true });
        if (countError) return Response.json({ ok: false, error: countError.message }, { status: 500 });
        if ((count ?? 0) > 0) {
          return Response.json({ ok: false, error: `Já existem ${count} usuário(s). Rode TRUNCATE em public.usuarios antes de semear de novo.` }, { status: 409 });
        }

        const rows = USERS.map(u => ({
          login: u.login, senha_hash: hashPassword(u.senha), nome_exibicao: u.nome,
          papel: u.papel, admin_override: u.override, email: u.email,
        }));
        const { error } = await supabaseAdmin.from('usuarios').insert(rows);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

        return Response.json({ ok: true, criados: rows.length });
      },
    },
  },
});
