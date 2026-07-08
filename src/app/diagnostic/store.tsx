import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DiagnosticProduct } from './schema';

const STORAGE_KEY = 'pp-diagnostics-v1';

export type DiagnosticStatus = 'Rascunho' | 'Em preenchimento' | 'Concluído';

export interface Diagnostic {
  id: number;
  title: string;
  organizationName: string;
  projectId: number | null;
  createdAt: string;
  updatedAt: string;
  status: DiagnosticStatus;
  answers: Record<string, string | string[] | number>;
  maturity: Record<string, number>; // key: axisId.indicatorId -> 1..5
  products: DiagnosticProduct[];
  notes: string;
}

type Ctx = {
  diagnostics: Diagnostic[];
  getDiagnostic: (id: number) => Diagnostic | undefined;
  createDiagnostic: (data: { title: string; organizationName: string; projectId: number | null }) => Diagnostic;
  updateDiagnostic: (id: number, patch: Partial<Diagnostic>) => void;
  deleteDiagnostic: (id: number) => void;
  setAnswer: (id: number, questionId: string, value: string | string[] | number) => void;
  setMaturity: (id: number, key: string, value: number) => void;
  addProduct: (id: number, p: Omit<DiagnosticProduct, 'id'>) => void;
  deleteProduct: (id: number, productId: number) => void;
};

const DiagnosticContext = createContext<Ctx | null>(null);

function load(): Diagnostic[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Diagnostic[];
  } catch { return []; }
}

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setDiagnostics(load()); setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(diagnostics)); } catch { /* noop */ }
  }, [diagnostics, hydrated]);

  const patch = useCallback((id: number, fn: (d: Diagnostic) => Diagnostic) => {
    setDiagnostics(prev => prev.map(d => d.id === id ? { ...fn(d), updatedAt: new Date().toISOString() } : d));
  }, []);

  const value = useMemo<Ctx>(() => ({
    diagnostics,
    getDiagnostic: (id) => diagnostics.find(d => d.id === id),
    createDiagnostic: ({ title, organizationName, projectId }) => {
      const nextId = diagnostics.reduce((m, d) => Math.max(m, d.id), 0) + 1;
      const now = new Date().toISOString();
      const d: Diagnostic = {
        id: nextId, title, organizationName, projectId,
        createdAt: now, updatedAt: now, status: 'Rascunho',
        answers: {}, maturity: {}, products: [], notes: '',
      };
      setDiagnostics(prev => [...prev, d]);
      return d;
    },
    updateDiagnostic: (id, p) => patch(id, d => ({ ...d, ...p })),
    deleteDiagnostic: (id) => setDiagnostics(prev => prev.filter(d => d.id !== id)),
    setAnswer: (id, qid, v) => patch(id, d => ({ ...d, answers: { ...d.answers, [qid]: v }, status: d.status === 'Rascunho' ? 'Em preenchimento' : d.status })),
    setMaturity: (id, key, v) => patch(id, d => ({ ...d, maturity: { ...d.maturity, [key]: v } })),
    addProduct: (id, p) => patch(id, d => {
      const nextId = d.products.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      return { ...d, products: [...d.products, { ...p, id: nextId }] };
    }),
    deleteProduct: (id, pid) => patch(id, d => ({ ...d, products: d.products.filter(p => p.id !== pid) })),
  }), [diagnostics, patch]);

  return <DiagnosticContext.Provider value={value}>{children}</DiagnosticContext.Provider>;
}

export function useDiagnostics(): Ctx {
  const ctx = useContext(DiagnosticContext);
  if (!ctx) throw new Error('useDiagnostics must be used within DiagnosticProvider');
  return ctx;
}
