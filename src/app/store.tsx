import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  projects as seedProjects,
  type Project,
  type Risk,
  type Change,
  type FinancialItem,
  type ContrapartidaItem,
  type Evidence,
  type ActivityStatus,
} from './data/mockData';

const STORAGE_KEY = 'pp-portfolio-v2';

type Ctx = {
  projects: Project[];
  getProject: (id: number) => Project | undefined;
  addProject: (p: Omit<Project, 'id' | 'goals' | 'financialItems' | 'risks' | 'changes' | 'evidences' | 'contrapartidas' | 'team'> & { team?: string[] }) => Project;
  updateProject: (id: number, patch: Partial<Project>) => void;
  deleteProject: (id: number) => void;

  addRisk: (projectId: number, r: Omit<Risk, 'id' | 'severity'>) => void;
  deleteRisk: (projectId: number, riskId: number) => void;

  addChange: (projectId: number, c: Omit<Change, 'id'>) => void;
  updateChangeApproval: (projectId: number, changeId: number, approval: Change['approval']) => void;
  deleteChange: (projectId: number, changeId: number) => void;

  addFinancial: (projectId: number, f: Omit<FinancialItem, 'id'>) => void;
  updateFinancialExecuted: (projectId: number, itemId: number, executedValue: number, date?: string, supplier?: string, document?: string) => void;
  deleteFinancial: (projectId: number, itemId: number) => void;

  addContrapartida: (projectId: number, c: Omit<ContrapartidaItem, 'id'>) => void;
  deleteContrapartida: (projectId: number, itemId: number) => void;

  addEvidence: (projectId: number, e: Omit<Evidence, 'id'>) => void;
  deleteEvidence: (projectId: number, evId: number) => void;

  updateActivityStatus: (projectId: number, activityId: number, status: ActivityStatus, progress?: number) => void;

  resetToSeed: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

function loadInitial(): Project[] {
  if (typeof window === 'undefined') return seedProjects;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedProjects;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as Project[];
  } catch {
    // ignore
  }
  return seedProjects;
}

function recalcProject(p: Project): Project {
  const allActivities = p.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));
  const progress = allActivities.length
    ? Math.round(allActivities.reduce((a, x) => a + x.progress, 0) / allActivities.length)
    : p.progress;
  const budgetExecuted = p.financialItems.length
    ? p.financialItems.reduce((a, i) => a + i.executedValue, 0)
    : p.budgetExecuted;
  return { ...p, progress, budgetExecuted };
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProjects(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [projects, hydrated]);

  const patch = useCallback((id: number, fn: (p: Project) => Project) => {
    setProjects(prev => prev.map(p => (p.id === id ? recalcProject(fn(p)) : p)));
  }, []);

  const value = useMemo<Ctx>(() => ({
    projects,
    getProject: (id) => projects.find(p => p.id === id),

    addProject: (data) => {
      const nextId = projects.reduce((m, p) => Math.max(m, p.id), 0) + 1;
      const year = new Date().getFullYear();
      const seq = projects.filter(p => (p.code ?? '').endsWith(`-${year}`)).length + 1;
      const internalCode = `${String(seq).padStart(2, '0')}-${year}`;
      const p: Project = {
        id: nextId,
        team: data.team ?? [],
        goals: [],
        financialItems: [],
        contrapartidas: [],
        risks: [],
        changes: [],
        evidences: [],
        ...data,
        code: internalCode,
      } as Project;
      setProjects(prev => [...prev, p]);
      return p;
    },

    updateProject: (id, patchData) => {
      setProjects(prev => prev.map(p => (p.id === id ? recalcProject({ ...p, ...patchData }) : p)));
    },

    deleteProject: (id) => {
      setProjects(prev => prev.filter(p => p.id !== id));
    },

    addRisk: (projectId, r) => {
      patch(projectId, p => {
        const nextId = p.risks.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        return { ...p, risks: [...p.risks, { ...r, id: nextId, severity: r.probability * r.impact }] };
      });
    },
    deleteRisk: (projectId, riskId) => {
      patch(projectId, p => ({ ...p, risks: p.risks.filter(r => r.id !== riskId) }));
    },

    addChange: (projectId, c) => {
      patch(projectId, p => {
        const nextId = p.changes.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        return { ...p, changes: [...p.changes, { ...c, id: nextId }] };
      });
    },
    updateChangeApproval: (projectId, changeId, approval) => {
      patch(projectId, p => ({
        ...p,
        changes: p.changes.map(c => (c.id === changeId ? { ...c, approval } : c)),
      }));
    },
    deleteChange: (projectId, changeId) => {
      patch(projectId, p => ({ ...p, changes: p.changes.filter(c => c.id !== changeId) }));
    },

    addFinancial: (projectId, f) => {
      patch(projectId, p => {
        const nextId = p.financialItems.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        return { ...p, financialItems: [...p.financialItems, { ...f, id: nextId }] };
      });
    },
    updateFinancialExecuted: (projectId, itemId, executedValue, date, supplier, document) => {
      patch(projectId, p => ({
        ...p,
        financialItems: p.financialItems.map(i => i.id === itemId ? {
          ...i,
          executedValue,
          date: date ?? i.date,
          supplier: supplier ?? i.supplier,
          document: document ?? i.document,
        } : i),
      }));
    },
    deleteFinancial: (projectId, itemId) => {
      patch(projectId, p => ({ ...p, financialItems: p.financialItems.filter(i => i.id !== itemId) }));
    },

    addContrapartida: (projectId, c) => {
      patch(projectId, p => {
        const list = p.contrapartidas ?? [];
        const nextId = list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        return { ...p, contrapartidas: [...list, { ...c, id: nextId }] };
      });
    },
    deleteContrapartida: (projectId, itemId) => {
      patch(projectId, p => ({ ...p, contrapartidas: (p.contrapartidas ?? []).filter(i => i.id !== itemId) }));
    },

    addEvidence: (projectId, e) => {
      patch(projectId, p => {
        const nextId = p.evidences.reduce((m, x) => Math.max(m, x.id), 0) + 1;
        return { ...p, evidences: [...p.evidences, { ...e, id: nextId }] };
      });
    },
    deleteEvidence: (projectId, evId) => {
      patch(projectId, p => ({ ...p, evidences: p.evidences.filter(e => e.id !== evId) }));
    },

    updateActivityStatus: (projectId, activityId, status, progress) => {
      patch(projectId, p => ({
        ...p,
        goals: p.goals.map(g => ({
          ...g,
          deliverables: g.deliverables.map(d => ({
            ...d,
            activities: d.activities.map(a =>
              a.id === activityId
                ? {
                    ...a,
                    status,
                    progress: progress ?? (status === 'Concluído' ? 100 : status === 'Não iniciado' ? 0 : a.progress),
                    conclusionDate: status === 'Concluído' ? new Date().toLocaleDateString('pt-BR') : a.conclusionDate,
                  }
                : a,
            ),
          })),
        })),
      }));
    },

    resetToSeed: () => {
      setProjects(seedProjects);
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    },
  }), [projects, patch]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within ProjectsProvider');
  return ctx;
}
