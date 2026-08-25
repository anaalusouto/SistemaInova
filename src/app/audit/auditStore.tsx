import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** Tipo de registro: acesso (telas abertas), alteração (mudanças) ou pendência. */
export type AuditKind = 'acesso' | 'alteracao' | 'pendencia';

export interface AuditEntry {
  id: string;
  userLogin: string;
  timestamp: string;
  area: string;
  action: string;
  detail?: string;
  /** Projeto relacionado (quando houver). */
  projectId?: number;
  projectName?: string;
  kind?: AuditKind;
}

interface Ctx {
  entries: AuditEntry[];
  log: (e: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  clear: () => void;
}

const AuditContext = createContext<Ctx | null>(null);
const KEY = 'pp-audit-log-v2';
const MAX = 2000;

export function AuditProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* ignore */ }
  }, [entries, hydrated]);

  const log = useCallback((e: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const entry: AuditEntry = {
      kind: 'acesso',
      ...e,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setEntries(prev => [entry, ...prev].slice(0, MAX));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo<Ctx>(() => ({ entries, log, clear }), [entries, log, clear]);
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit(): Ctx {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error('useAudit must be used within AuditProvider');
  return ctx;
}
