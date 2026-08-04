import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type UserRole = 'admin' | 'estagiario';
export interface AuthUser {
  login: string;          // e-mail (ou identificador) usado no acesso
  displayName: string;
  role: UserRole;
  /** Estagiário com poderes administrativos (ex.: Ana Paula). */
  adminOverride?: boolean;
}

interface UserRecord { password: string; user: AuthUser }

const USER_LIST: UserRecord[] = [
  // ===== Administradores =====
  { password: '12332145+', user: { login: 'LJCRIA', displayName: 'LJCRIA (Administrador)', role: 'admin' } },
  { password: '09230047', user: { login: 'suze.oliveira@cesupa.br', displayName: 'Suze Oliveira', role: 'admin' } },
  { password: '010203', user: { login: 'monica.silva@cesupa.br', displayName: 'Mônica Silva', role: 'admin' } },
  { password: '91049303', user: { login: 'gaby', displayName: 'Gaby', role: 'admin' } },

  // ===== Estagiários =====
  { password: 'Pipa123', user: { login: 'caio25230026@aluno.cesupa.br', displayName: 'Caio Fiuza', role: 'estagiario' } },
  { password: '310718', user: { login: 'flavia2414310@aluno.cesupa.br', displayName: 'Flávia Cascaes', role: 'estagiario' } },
  { password: '120604', user: { login: 'pedro25230037@aluno.cesupa.br', displayName: 'Pedro Henrique', role: 'estagiario' } },
  { password: '35trcpz@!769A', user: { login: 'ana23070210@aluno.cesupa.br', displayName: 'Ana Luiza Souto', role: 'estagiario' } },
  // Estagiária com acesso administrativo
  { password: '235010', user: { login: 'ana23330012@aluno.cesupa.br', displayName: 'Ana Paula', role: 'estagiario', adminOverride: true } },
];

const USERS: Record<string, UserRecord> = USER_LIST.reduce((acc, r) => {
  acc[r.user.login.toLowerCase()] = r;
  return acc;
}, {} as Record<string, UserRecord>);

/** Lista de pessoas para seleção de responsáveis (sem senhas). */
export const APP_PEOPLE = USER_LIST
  .filter(r => r.user.login !== 'LJCRIA')
  .map(r => ({ name: r.user.displayName, role: r.user.role, login: r.user.login }));

/** Um usuário tem poderes administrativos se for admin ou estagiário com override. */
export const hasAdminPowers = (u: AuthUser | null) => !!u && (u.role === 'admin' || !!u.adminOverride);

interface Ctx {
  user: AuthUser | null;
  isAdmin: boolean;
  signIn: (login: string, password: string, remember?: boolean) => AuthUser | null;
  signOut: () => void;
  /** Validate admin credentials without changing the current session (used for locked actions). */
  verifyAdmin: (login: string, password: string) => boolean;
}

const AuthContext = createContext<Ctx | null>(null);
const KEY = 'pp-auth-user-v2';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [remember, setRemember] = useState(false);

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

  const signIn = useCallback((login: string, password: string, rememberMe = false) => {
    const entry = USERS[login.trim().toLowerCase()];
    if (!entry || entry.password !== password) return null;
    setRemember(rememberMe);
    setUser(entry.user);
    return entry.user;
  }, []);

  const signOut = useCallback(() => { setRemember(false); setUser(null); }, []);

  const verifyAdmin = useCallback((login: string, password: string) => {
    const entry = USERS[login.trim().toLowerCase()];
    return !!entry && entry.password === password && hasAdminPowers(entry.user);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ user, isAdmin: hasAdminPowers(user), signIn, signOut, verifyAdmin }),
    [user, signIn, signOut, verifyAdmin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
