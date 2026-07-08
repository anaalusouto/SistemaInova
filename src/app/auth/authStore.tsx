import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type UserRole = 'admin' | 'user';
export interface AuthUser {
  login: string;
  displayName: string;
  role: UserRole;
}

const USERS: Record<string, { password: string; user: AuthUser }> = {
  CRIA: {
    password: 'INOVA',
    user: { login: 'CRIA', displayName: 'CRIA (Apresentação)', role: 'user' },
  },
  LJCRIA: {
    password: '12332145+',
    user: { login: 'LJCRIA', displayName: 'LJCRIA (Administrador)', role: 'admin' },
  },
};

interface Ctx {
  user: AuthUser | null;
  signIn: (login: string, password: string) => AuthUser | null;
  signOut: () => void;
  /** Validate admin credentials without changing the current session (used for locked actions). */
  verifyAdmin: (login: string, password: string) => boolean;
}

const AuthContext = createContext<Ctx | null>(null);
const KEY = 'pp-auth-user-v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
      else window.localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, [user, hydrated]);

  const signIn = useCallback((login: string, password: string) => {
    const entry = USERS[login.trim().toUpperCase()];
    if (!entry || entry.password !== password) return null;
    setUser(entry.user);
    return entry.user;
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const verifyAdmin = useCallback((login: string, password: string) => {
    const entry = USERS[login.trim().toUpperCase()];
    return !!entry && entry.password === password && entry.user.role === 'admin';
  }, []);

  const value = useMemo<Ctx>(() => ({ user, signIn, signOut, verifyAdmin }), [user, signIn, signOut, verifyAdmin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
