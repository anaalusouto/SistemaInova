import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { autenticar, verificarAdmin, listarPessoas, atualizarPreferenciasNotificacao, atualizarNomeExibicao, type PublicUser, type UserRole as ServerUserRole } from '../usuarios.server';

export type UserRole = ServerUserRole;
export interface AuthUser {
  login: string;          // e-mail (ou identificador) usado no acesso
  displayName: string;
  role: UserRole;
  /** Estagiário com poderes administrativos (ex.: Ana Paula). */
  adminOverride?: boolean;
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

const PRESENCE_KEY = 'pp-presence-v1';
const PRESENCE_TTL = 2 * 60 * 1000;

function readPresence(): Record<string, number> {
  try { return JSON.parse(window.localStorage.getItem(PRESENCE_KEY) ?? '{}'); } catch { return {}; }
}

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
  /** Logins ativos na plataforma nos últimos minutos. */
  onlineLogins: string[];
  /** Pessoas cadastradas (para seleção de responsáveis) — sem senhas. */
  people: PublicUser[];
  /** Recarrega a lista de pessoas (chamar depois de criar/editar/excluir usuário). */
  refreshPeople: () => Promise<void>;
  /** Salva e-mail e preferência de notificação do próprio usuário (exige a senha atual). */
  updateNotificationPrefs: (password: string, email: string, notifEmail: boolean) => Promise<boolean>;
  /** Altera o nome de exibição do próprio usuário (exige a senha atual). */
  updateDisplayName: (password: string, newName: string) => Promise<boolean>;
}

const AuthContext = createContext<Ctx | null>(null);
const KEY = 'pp-auth-user-v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [remember, setRemember] = useState(false);
  const [onlineLogins, setOnlineLogins] = useState<string[]>([]);
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

  useEffect(() => {
    if (!hydrated || !user) return;
    refreshPeople();
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

  // Heartbeat de presença (para "ativo agora" na área de Equipe).
  useEffect(() => {
    if (!hydrated) return;
    const beat = () => {
      try {
        const map = readPresence();
        if (user) map[user.login] = Date.now();
        const now = Date.now();
        const alive = Object.entries(map).filter(([, t]) => now - t < PRESENCE_TTL);
        window.localStorage.setItem(PRESENCE_KEY, JSON.stringify(Object.fromEntries(alive)));
        setOnlineLogins(alive.map(([l]) => l));
      } catch { /* ignore */ }
    };
    beat();
    const t = window.setInterval(beat, 30000);
    return () => window.clearInterval(t);
  }, [user, hydrated]);

  const signIn = useCallback(async (login: string, password: string, rememberMe = false) => {
    const found = await autenticar({ data: { login, senha: password } });
    if (!found) return null;
    const authUser: AuthUser = { login: found.login, displayName: found.displayName, role: found.role, adminOverride: found.adminOverride };
    setRemember(rememberMe);
    setUser(authUser);
    return authUser;
  }, []);

  const signOut = useCallback(() => {
    try {
      const map = readPresence();
      if (user) delete map[user.login];
      window.localStorage.setItem(PRESENCE_KEY, JSON.stringify(map));
    } catch { /* ignore */ }
    setRemember(false);
    setUser(null);
  }, [user]);

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

  const value = useMemo<Ctx>(
    () => ({
      user,
      isAdmin: hasAdminPowers(user),
      readOnly: isReadOnly(user),
      signIn, signOut, verifyAdmin, verifyOwnPassword, onlineLogins,
      people, refreshPeople, updateNotificationPrefs, updateDisplayName,
    }),
    [user, signIn, signOut, verifyAdmin, verifyOwnPassword, onlineLogins, people, refreshPeople, updateNotificationPrefs, updateDisplayName],
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
      .map(p => ({ name: p.displayName, role: p.role, login: p.login })),
    [people],
  );
}
