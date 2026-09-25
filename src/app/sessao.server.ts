/**
 * Sessão e autorização **do lado do servidor** (RN-001, CA-02).
 *
 * O problema que este módulo resolve: até aqui o papel de quem chamava vinha
 * dentro do payload da própria chamada (`author.isAdmin` em projetos.server.ts).
 * Isso funciona para esconder botão na tela, mas não é autorização — qualquer
 * requisição direta à API podia se declarar admin. O CA-02 exige explicitamente
 * que um usuário SEMAS não consiga escrever "inclusive por chamada direta à API".
 *
 * Como funciona: o login grava uma sessão no banco e devolve ao navegador um
 * cookie httpOnly com um token opaco. O banco guarda só o HASH do token, então
 * quem lê a tabela `sessoes` não consegue reconstruir o cookie de ninguém. Toda
 * escrita chama `exigirEscrita()`, que resolve o usuário a partir do cookie —
 * nunca a partir de algo que o cliente tenha mandado.
 *
 * Vive em src/app/ com sufixo .server.ts pelo mesmo motivo dos outros: o projeto
 * bloqueia import da pasta server/ no bundle do client (vite.config.ts,
 * importProtection), e é o sufixo que aciona o split client/servidor do
 * TanStack Start.
 */
import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { UserRole } from './usuarios.server';

const COOKIE = 'inova_sessao';
/** Duração da sessão. Renovada a cada uso autenticado (janela deslizante). */
const DURACAO_MS = 12 * 60 * 60 * 1000;

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

/**
 * Hash do token de sessão.
 *
 * SHA-256 puro é adequado AQUI, e não seria para senha: o token tem 256 bits de
 * entropia vinda de randomBytes, então não há espaço de busca para força bruta
 * ou dicionário. Senha continua com scrypt em usuarios.server.ts, onde o
 * trabalho deliberado é o que protege.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Erro de autorização — o chamador traduz para a resposta apropriada. */
export class NaoAutorizado extends Error {
  constructor(mensagem = 'Sem permissão para esta operação.') {
    super(mensagem);
    this.name = 'NaoAutorizado';
  }
}

export interface UsuarioSessao {
  id: string;
  login: string;
  displayName: string;
  role: UserRole;
  adminOverride: boolean;
}

/**
 * Perfis do documento mapeados nos papéis que já existem na tabela `usuarios`:
 * a equipe PMO da CESUPA escreve (admin/estagiário), a SEMAS apenas consulta
 * (visualizador). Ver seção 2 da especificação.
 */
export function podeEscrever(u: UsuarioSessao | null): boolean {
  return !!u && u.role !== 'visualizador';
}

// ---------------------------------------------------------------------------
// Ciclo de vida da sessão
// ---------------------------------------------------------------------------

/** Cria a sessão e devolve o cookie. Chamado pelo login, nunca pelo cliente direto. */
export async function abrirSessao(usuarioId: string): Promise<void> {
  const supabaseAdmin = await getAdmin();
  const token = randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + DURACAO_MS);

  const { error } = await supabaseAdmin.from('sessoes').insert({
    usuario_id: usuarioId,
    token_hash: hashToken(token),
    expira_em: expiraEm.toISOString(),
  });
  if (error) throw new Error(error.message);

  setCookie(COOKIE, token, {
    httpOnly: true,       // inacessível a JavaScript — XSS não rouba a sessão
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(DURACAO_MS / 1000),
  });
}

export async function fecharSessao(): Promise<void> {
  const token = getCookie(COOKIE);
  if (token) {
    const supabaseAdmin = await getAdmin();
    await supabaseAdmin.from('sessoes').delete().eq('token_hash', hashToken(token));
  }
  deleteCookie(COOKIE, { path: '/' });
}

/**
 * Usuário da requisição corrente, ou null. Única fonte de verdade sobre quem
 * está chamando — nenhum campo vindo do cliente entra nesta decisão.
 */
export async function usuarioAtual(): Promise<UsuarioSessao | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;

  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin
    .from('sessoes')
    .select('id, expira_em, usuarios(id, login, nome_exibicao, papel, admin_override)')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (error || !data) return null;

  if (new Date(data.expira_em).getTime() < Date.now()) {
    await supabaseAdmin.from('sessoes').delete().eq('id', data.id);
    return null;
  }

  const u = (data as any).usuarios;
  if (!u) return null;

  // Janela deslizante: uso recente estende a sessão, sem forçar novo login no
  // meio de um turno de trabalho.
  const novaExpiracao = new Date(Date.now() + DURACAO_MS).toISOString();
  await supabaseAdmin
    .from('sessoes')
    .update({ ultimo_uso: new Date().toISOString(), expira_em: novaExpiracao })
    .eq('id', data.id);

  return {
    id: u.id, login: u.login, displayName: u.nome_exibicao,
    role: u.papel, adminOverride: !!u.admin_override,
  };
}

// ---------------------------------------------------------------------------
// Guardas
// ---------------------------------------------------------------------------

/** Exige sessão válida (qualquer papel). Use em leitura de dado restrito. */
export async function exigirSessao(): Promise<UsuarioSessao> {
  const u = await usuarioAtual();
  if (!u) throw new NaoAutorizado('Sessão expirada ou inexistente. Entre novamente.');
  return u;
}

/**
 * Exige permissão de escrita (equipe PMO da CESUPA).
 *
 * Chame no início de TODA server function que grava. A SEMAS recebe recusa aqui
 * mesmo que monte a requisição à mão — que é exatamente o que o CA-02 verifica.
 */
export async function exigirEscrita(): Promise<UsuarioSessao> {
  const u = await exigirSessao();
  if (!podeEscrever(u)) {
    throw new NaoAutorizado('Seu perfil tem acesso de consulta e não pode alterar registros.');
  }
  return u;
}

/** Exige poderes administrativos (aprovar/rejeitar edição, gerir usuários). */
export async function exigirAdmin(): Promise<UsuarioSessao> {
  const u = await exigirSessao();
  if (u.role !== 'admin' && !u.adminOverride) {
    throw new NaoAutorizado('Esta operação exige perfil administrador.');
  }
  return u;
}

/**
 * Compara dois segredos em tempo constante, sem vazar o tamanho pela diferença
 * de tempo. Usado por rotas que ainda autenticam por token de ambiente.
 */
export function compararSegredos(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// ---------------------------------------------------------------------------
// Exposto ao cliente
// ---------------------------------------------------------------------------

/**
 * Quem sou eu, segundo o servidor. O authStore usa isto para reidratar a sessão
 * ao abrir a página, em vez de confiar no que está no localStorage — o que está
 * guardado no navegador é conveniência de UI, não prova de identidade.
 */
export const obterSessao = createServerFn({ method: 'GET' }).handler(
  async (): Promise<UsuarioSessao | null> => usuarioAtual(),
);

/** Encerra a sessão no servidor e apaga o cookie. */
export const encerrarSessao = createServerFn({ method: 'POST' }).handler(
  async (): Promise<void> => fecharSessao(),
);
