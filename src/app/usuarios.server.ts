// Server functions de autenticação e gestão de usuários/papéis.
// Substitui a lista fixa que existia em src/app/auth/authStore.tsx pela tabela
// public.usuarios (ver supabase/migrations/0003_usuarios.sql). Sem Supabase Auth
// ainda — a checagem de papel é feita aqui, com a service-role key.
//
// Senhas nunca ficam em texto puro: hash com scrypt (Node nativo, sem
// dependência nova) — ver hashPassword/verifyPassword abaixo.
import { createServerFn } from '@tanstack/react-start';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { notificarNovaSolicitacao, notificarSolicitacaoDecidida } from './email.server';

export type UserRole = 'admin' | 'estagiario' | 'visualizador';

export interface PublicUser {
  login: string;
  displayName: string;
  role: UserRole;
  adminOverride: boolean;
  /** Timestamp ISO do último heartbeat de presença (null = nunca acessou). */
  ultimoAcesso: string | null;
}

export interface ManagedUser extends PublicUser {
  email: string | null;
  notifEmail: boolean;
  criadoEm: string;
}

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, 'hex');
  const candidateBuffer = scryptSync(password, salt, 64);
  return hashBuffer.length === candidateBuffer.length && timingSafeEqual(hashBuffer, candidateBuffer);
}

function toPublicUser(row: any): PublicUser {
  return {
    login: row.login, displayName: row.nome_exibicao, role: row.papel, adminOverride: row.admin_override,
    ultimoAcesso: row.ultimo_acesso ?? null,
  };
}

function hasAdminPowers(row: any): boolean {
  return row.papel === 'admin' || !!row.admin_override;
}

/** Autentica login+senha. Retorna o usuário público (sem hash) ou null. */
export const autenticar = createServerFn({ method: 'POST' })
  .validator((d: { login: string; senha: string }) => d)
  .handler(async ({ data: { login, senha } }): Promise<PublicUser | null> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .ilike('login', login.trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || !verifyPassword(senha, data.senha_hash)) return null;
    return toPublicUser(data);
  });

/** Confirma que login+senha pertencem a um admin (poderes administrativos). */
export const verificarAdmin = createServerFn({ method: 'POST' })
  .validator((d: { login: string; senha: string }) => d)
  .handler(async ({ data: { login, senha } }): Promise<boolean> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .ilike('login', login.trim())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return !!data && verifyPassword(senha, data.senha_hash) && hasAdminPowers(data);
  });

/** Heartbeat de presença — chamado periodicamente pelo cliente enquanto a aba está aberta. */
export const registrarPresenca = createServerFn({ method: 'POST' })
  .validator((d: { login: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .ilike('login', data.login.trim());
    if (error) throw new Error(error.message);
  });

/** Lista pública de pessoas (para seleção de responsáveis) — sem dados sensíveis. */
export const listarPessoas = createServerFn({ method: 'GET' }).handler(async (): Promise<PublicUser[]> => {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin.from('usuarios').select('*').order('nome_exibicao');
  if (error) throw new Error(error.message);
  return (data ?? []).map(toPublicUser);
});

interface AdminAction { actingLogin: string; actingSenha: string }

async function requireAdmin(actingLogin: string, actingSenha: string) {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .ilike('login', actingLogin.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !verifyPassword(actingSenha, data.senha_hash) || !hasAdminPowers(data)) {
    throw new Error('Credenciais administrativas inválidas.');
  }
  return supabaseAdmin;
}

/** Lista completa de usuários (tela de gestão) — só para admins. */
export const listarUsuarios = createServerFn({ method: 'POST' })
  .validator((d: AdminAction) => d)
  .handler(async ({ data: { actingLogin, actingSenha } }): Promise<ManagedUser[]> => {
    const supabaseAdmin = await requireAdmin(actingLogin, actingSenha);
    const { data, error } = await supabaseAdmin.from('usuarios').select('*').order('nome_exibicao');
    if (error) throw new Error(error.message);
    return (data ?? []).map(row => ({
      ...toPublicUser(row), email: row.email ?? null, notifEmail: row.notif_email, criadoEm: row.criado_em,
    }));
  });

/** Cria um novo usuário — só para admins. */
export const criarUsuario = createServerFn({ method: 'POST' })
  .validator((d: AdminAction & { login: string; senha: string; nomeExibicao: string; role: UserRole; adminOverride?: boolean; email?: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await requireAdmin(data.actingLogin, data.actingSenha);
    const login = data.login.trim();
    if (!login || !data.senha || !data.nomeExibicao.trim()) throw new Error('Preencha login, senha e nome de exibição.');
    const { data: existing } = await supabaseAdmin.from('usuarios').select('id').ilike('login', login).maybeSingle();
    if (existing) throw new Error('Já existe um usuário com esse login.');
    const { error } = await supabaseAdmin.from('usuarios').insert({
      login, senha_hash: hashPassword(data.senha), nome_exibicao: data.nomeExibicao.trim(),
      papel: data.role, admin_override: !!data.adminOverride, email: data.email?.trim() || null,
    });
    if (error) throw new Error(error.message);
  });

/** Atualiza papel/override/e-mail/senha de um usuário existente — só para admins. */
export const atualizarUsuario = createServerFn({ method: 'POST' })
  .validator((d: AdminAction & { alvoLogin: string; role?: UserRole; adminOverride?: boolean; email?: string | null; novaSenha?: string; nomeExibicao?: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await requireAdmin(data.actingLogin, data.actingSenha);
    const patch: Record<string, unknown> = {};
    if (data.role !== undefined) patch.papel = data.role;
    if (data.adminOverride !== undefined) patch.admin_override = data.adminOverride;
    if (data.email !== undefined) patch.email = data.email?.trim() || null;
    if (data.nomeExibicao !== undefined) patch.nome_exibicao = data.nomeExibicao.trim();
    if (data.novaSenha) patch.senha_hash = hashPassword(data.novaSenha);
    if (Object.keys(patch).length === 0) return;
    const { error } = await supabaseAdmin.from('usuarios').update(patch).ilike('login', data.alvoLogin.trim());
    if (error) throw new Error(error.message);
  });

/** Exclui um usuário — só para admins. Não permite excluir a si mesmo. */
export const excluirUsuario = createServerFn({ method: 'POST' })
  .validator((d: AdminAction & { alvoLogin: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    if (data.alvoLogin.trim().toLowerCase() === data.actingLogin.trim().toLowerCase()) {
      throw new Error('Você não pode excluir seu próprio usuário.');
    }
    const supabaseAdmin = await requireAdmin(data.actingLogin, data.actingSenha);
    const { error } = await supabaseAdmin.from('usuarios').delete().ilike('login', data.alvoLogin.trim());
    if (error) throw new Error(error.message);
  });

/** Atualiza o nome de exibição do próprio usuário logado (exige a senha atual). */
export const atualizarNomeExibicao = createServerFn({ method: 'POST' })
  .validator((d: { login: string; senha: string; novoNome: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { data: user, error: findError } = await supabaseAdmin
      .from('usuarios').select('*').ilike('login', data.login.trim()).maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!user || !verifyPassword(data.senha, user.senha_hash)) throw new Error('Sessão inválida.');
    const novoNome = data.novoNome.trim();
    if (!novoNome) throw new Error('O nome não pode ficar vazio.');
    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ nome_exibicao: novoNome })
      .eq('id', user.id);
    if (error) throw new Error(error.message);
  });

/** Lê e-mail e preferência de notificação do próprio usuário logado. */
export const obterPreferenciasNotificacao = createServerFn({ method: 'POST' })
  .validator((d: { login: string; senha: string }) => d)
  .handler(async ({ data }): Promise<{ email: string; notifEmail: boolean } | null> => {
    const supabaseAdmin = await getAdmin();
    const { data: user, error } = await supabaseAdmin
      .from('usuarios').select('*').ilike('login', data.login.trim()).maybeSingle();
    if (error) throw new Error(error.message);
    if (!user || !verifyPassword(data.senha, user.senha_hash)) return null;
    return { email: user.email ?? '', notifEmail: user.notif_email };
  });

/** Salva as preferências de notificação por e-mail do próprio usuário logado. */
export const atualizarPreferenciasNotificacao = createServerFn({ method: 'POST' })
  .validator((d: { login: string; senha: string; email: string; notifEmail: boolean }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { data: user, error: findError } = await supabaseAdmin
      .from('usuarios').select('*').ilike('login', data.login.trim()).maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!user || !verifyPassword(data.senha, user.senha_hash)) throw new Error('Sessão inválida.');
    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({ email: data.email.trim() || null, notif_email: data.notifEmail })
      .eq('id', user.id);
    if (error) throw new Error(error.message);
  });

/** Registra uma nova solicitação pendente e avisa os admins (in-app fica a cargo do realtime; aqui só o e-mail). */
export const avisarNovaSolicitacao = createServerFn({ method: 'POST' })
  .validator((d: { autorNome: string; projetoNome: string; resumo: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { data: admins, error } = await supabaseAdmin
      .from('usuarios').select('email').eq('papel', 'admin').eq('notif_email', true).not('email', 'is', null);
    if (error) throw new Error(error.message);
    const emails = (admins ?? []).map(a => a.email).filter((e): e is string => !!e);
    if (emails.length) await notificarNovaSolicitacao(emails, data.autorNome, data.projetoNome, data.resumo);
  });

/** Avisa o autor de uma solicitação que ela foi aprovada/recusada. */
export const avisarSolicitacaoDecidida = createServerFn({ method: 'POST' })
  .validator((d: { autorNome: string; aprovado: boolean; projetoNome: string; resumo: string; revisadoPor: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    // aprovacoes_pendentes guarda o nome de exibição do autor (não o login) — mesmo padrão do log de auditoria.
    const { data: user, error } = await supabaseAdmin
      .from('usuarios').select('email, notif_email').ilike('nome_exibicao', data.autorNome).maybeSingle();
    if (error) throw new Error(error.message);
    if (user?.email && user.notif_email) {
      await notificarSolicitacaoDecidida(user.email, data.aprovado, data.projetoNome, data.resumo, data.revisadoPor);
    }
  });
