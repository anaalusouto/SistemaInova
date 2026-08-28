import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  autenticar, verificarAdmin, listarPessoas, atualizarPreferenciasNotificacao, atualizarNomeExibicao, registrarPresenca,
  atualizarLogin, atualizarEmail, atualizarSenha, atualizarAvatar,
  type PublicUser, type UserRole as ServerUserRole,
} from '../usuarios.server';

export type UserRole = ServerUserRole;
export interface AuthUser {
  login: string;          // e-mail (ou identificador) usado no acesso
  displayName: string;
  role: UserRole;
  /** Estagiário com poderes administrativos (ex.: Ana Paula). */
  adminOverride?: boolean;
  email: string | null;
  notifEmail: boolean;
  avatarUrl: string | null;
}

/** Um usuário tem poderes administrativos se for admin ou estagiário com override. */
export const hasAdminPowers = (u: AuthUser | null) => !!u && (u.role === 'admin' || !!u.adminOverride);
/** Visualizadores (FAS/FUNBIO) não editam nada — apenas leem e comentam. */
export const isReadOnly = (u: AuthUser | null) => !!u && u.role === 'visualizador';

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  estagiario: 'Estagiário',
  visualizador: 'Visualizador',
};

/** Considerado "ativo agora" se o último heartbeat foi há menos que isso (mesmo intervalo do heartbeat, com folga). */
export const PRESENCE_ACTIVE_MS = 2 * 60 * 1000;
const PRESENCE_HEARTBEAT_MS = 30 * 1000;

interface Ctx {
  user: AuthUser | null;
  isAdmin: boolean;
  readOnly: boolean;
  signIn: (login: string, password: string, remember?: boolean) => Promise<AuthUser | null>;
  signOut: () => void;
  /** Validate admin credentials without changing the current session (used for locked actions). */
  verifyAdmin: (login: string, password: string) => Promise<boolean>;
  /** Confere a senha do usuário logado (usado para desbloquear Registros). */
  verifyOwnPassword: (password: string) => Promise<boolean>;
  /** Pessoas cadastradas (para seleção de responsáveis) — sem senhas. */
  people: PublicUser[];
  /** Recarrega a lista de pessoas (chamar depois de criar/editar/excluir usuário). */
  refreshPeople: () => Promise<void>;
  /** Salva e-mail e preferência de notificação do próprio usuário (exige a senha atual). */
  updateNotificationPrefs: (password: string, email: string, notifEmail: boolean) => Promise<boolean>;
  /** Altera o nome de exibição do próprio usuário (exige a senha atual). */
  updateDisplayName: (password: string, newName: string) => Promise<boolean>;
  /** Altera o login do próprio usuário (exige a senha atual). */
  updateLogin: (password: string, newLogin: string) => Promise<boolean>;
  /** Altera o e-mail de contato do próprio usuário (exige a senha atual). */
  updateEmail: (password: string, newEmail: string) => Promise<boolean>;
  /** Altera a senha do próprio usuário (exige a senha atual). */
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  /** Define ou remove (null) a foto de perfil do próprio usuário (exige a senha atual). */
  updateAvatar: (password: string, avatarDataUrl: string | null) => Promise<boolean>;
}

const AuthContext = createContext<Ctx | null>(null);
const KEY = 'pp-auth-user-v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [remember, setRemember] = useState(false);
  const [people, setPeople] = useState<PublicUser[]>([]);

  useEffect(() => {
    try {
      // "Lembrar de mim" => localStorage (persiste entre acessos no mesmo computador).
      // Sem lembrar => sessionStorage (login obrigatório a cada novo acesso).
      const raw = window.localStorage.getItem(KEY) ?? window.sessionStorage.getItem(KEY);
      if (raw) {
        setUser(JSON.parse(raw));
        setRemember(!!window.localStorage.getItem(KEY));
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const refreshPeople = useCallback(async () => {
    try { setPeople(await listarPessoas()); } catch { /* ignore */ }
  }, []);

  // Heartbeat de presença: avisa o servidor que este login está ativo, e recarrega
  // a lista de pessoas para refletir o status (próprio e de todos os outros).
  useEffect(() => {
    if (!hydrated || !user) return;
    const beat = async () => {
      try { await registrarPresenca({ data: { login: user.login } }); } catch { /* ignore */ }
      refreshPeople();
    };
    beat();
    const t = window.setInterval(beat, PRESENCE_HEARTBEAT_MS);
    return () => window.clearInterval(t);
  }, [hydrated, user, refreshPeople]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (user) {
        const store = remember ? window.localStorage : window.sessionStorage;
        const other = remember ? window.sessionStorage : window.localStorage;
        other.removeItem(KEY);
        store.setItem(KEY, JSON.stringify(user));
      } else {
        window.localStorage.removeItem(KEY);
        window.sessionStorage.removeItem(KEY);
      }
    } catch { /* ignore */ }
  }, [user, remember, hydrated]);

  const signIn = useCallback(async (login: string, password: string, rememberMe = false) => {
    const found = await autenticar({ data: { login, senha: password } });
    if (!found) return null;
    const authUser: AuthUser = {
      login: found.login, displayName: found.displayName, role: found.role, adminOverride: found.adminOverride,
      email: found.email, notifEmail: found.notifEmail, avatarUrl: found.avatarUrl,
    };
    setRemember(rememberMe);
    setUser(authUser);
    return authUser;
  }, []);

  const signOut = useCallback(() => {
    setRemember(false);
    setUser(null);
  }, []);

  const verifyAdmin = useCallback(async (login: string, password: string) => {
    return verificarAdmin({ data: { login, senha: password } });
  }, []);

  const verifyOwnPassword = useCallback(async (password: string) => {
    if (!user) return false;
    const found = await autenticar({ data: { login: user.login, senha: password } });
    return !!found;
  }, [user]);

  const updateNotificationPrefs = useCallback(async (password: string, email: string, notifEmail: boolean) => {
    if (!user) return false;
    try {
      await atualizarPreferenciasNotificacao({ data: { login: user.login, senha: password, email, notifEmail } });
      setUser(u => (u ? { ...u, email: email.trim() || null, notifEmail } : u));
      return true;
    } catch { return false; }
  }, [user]);

  const updateDisplayName = useCallback(async (password: string, newName: string) => {
    if (!user) return false;
    try {
      await atualizarNomeExibicao({ data: { login: user.login, senha: password, novoNome: newName } });
      setUser(u => (u ? { ...u, displayName: newName.trim() } : u));
      refreshPeople();
      return true;
    } catch { return false; }
  }, [user, refreshPeople]);

  const updateLogin = useCallback(async (password: string, newLogin: string) => {
    if (!user) return false;
    try {
      await atualizarLogin({ data: { login: user.login, senha: password, novoLogin: newLogin } });
      setUser(u => (u ? { ...u, login: newLogin.trim() } : u));
      refreshPeople();
      return true;
    } catch { return false; }
  }, [user, refreshPeople]);

  const updateEmail = useCallback(async (password: string, newEmail: string) => {
    if (!user) return false;
    try {
      await atualizarEmail({ data: { login: user.login, senha: password, novoEmail: newEmail } });
      setUser(u => (u ? { ...u, email: newEmail.trim() || null } : u));
      return true;
    } catch { return false; }
  }, [user]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) return false;
    try {
      await atualizarSenha({ data: { login: user.login, senhaAtual: currentPassword, novaSenha: newPassword } });
      return true;
    } catch { return false; }
  }, [user]);

  const updateAvatar = useCallback(async (password: string, avatarDataUrl: string | null) => {
    if (!user) return false;
    try {
      await atualizarAvatar({ data: { login: user.login, senha: password, avatarDataUrl } });
      setUser(u => (u ? { ...u, avatarUrl: avatarDataUrl } : u));
      refreshPeople();
      return true;
    } catch { return false; }
  }, [user, refreshPeople]);

  const value = useMemo<Ctx>(
    () => ({
      user,
      isAdmin: hasAdminPowers(user),
      readOnly: isReadOnly(user),
      signIn, signOut, verifyAdmin, verifyOwnPassword,
      people, refreshPeople, updateNotificationPrefs, updateDisplayName,
      updateLogin, updateEmail, updatePassword, updateAvatar,
    }),
    [
      user, signIn, signOut, verifyAdmin, verifyOwnPassword, people, refreshPeople, updateNotificationPrefs, updateDisplayName,
      updateLogin, updateEmail, updatePassword, updateAvatar,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Lista de pessoas para seleção de responsáveis (sem senhas) — vem do banco agora. */
export function usePeople() {
  const { people } = useAuth();
  return useMemo(
    () => people
      .filter(p => p.login !== 'LJCRIA' && p.login !== 'ADMCRIA')
      .map(p => ({ name: p.displayName, role: p.role, login: p.login, ultimoAcesso: p.ultimoAcesso, avatarUrl: p.avatarUrl })),
    [people],
  );
}
