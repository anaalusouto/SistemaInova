import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  projects as seedProjectsLegacy,
  type Project,
  type Risk,
  type Change,
  type FinancialItem,
  type ContrapartidaItem,
  type Evidence,
  type ActivityStatus,
} from './data/mockData';
import { inovaProjetos } from './data/inovaProjetos';
import { comunidades as seedComunidades, type Comunidade } from './data/comunidades';
import { rotas as seedRotas, calendarSeed, type RotaItem, type CalendarEvent } from './data/rotas';
import { cronogramaExecutivoSeed, type GanttBloco, type GanttStatus, type GanttActivity } from './data/cronogramaExecutivo';
import type { Contact, MetaChangeLog, MetaNodeKind, PendingApproval } from './data/projectExtras';

// Seed = 19 propostas importadas (Planos de Trabalho preenchidos).
const seedProjects = inovaProjetos;
void seedProjectsLegacy;


const STORAGE_KEY = 'pp-portfolio-v8';

/** Campos extras do plano de trabalho (todos opcionais e editáveis). */
export interface PlanoTrabalho {
  problematica?: string;
  justificativa?: string;
  localizacaoAbrangencia?: string;
  diversidade?: string;
  saberesLocais?: string;
  experienciaPrevia?: string;
  capacidadeTecnica?: string;
  estrategia?: string;
  cronogramaFisico?: string;
  detalhamentoRecursos?: string;
  contrapartida?: string;
  justificativaContrapartida?: string;
  resultadosImpactos?: string;
  publicoAlvo?: string;
  beneficiadosDiretos?: number;
  beneficiadosIndiretos?: number;
  formaAcompanhamento?: string;
  potencialReplicabilidade?: string;
  potencialAmpliacao?: string;
  // extras da planilha
  pilares?: string;
  metasTexto?: string;
  detalhamentoPlano?: string;
  compradores?: string;
  garantiaVenda?: string;
  destinacao?: string;
  ativacoes?: string;
  oportunidades?: string;
  receitaFaixa?: string;
  valorRepasse?: string;
  formaRepasse?: string;
  statusRepasse?: string;
  dataRepasse?: string;
  observacoes?: string;
  planoArquivo?: string;
}
export type ProjectExt = Project & {
  communityId?: number | null;
  plano?: PlanoTrabalho;
  /** Link do Google Drive com o Plano de Trabalho mais atualizado. */
  driveLink?: string;
  contacts?: Contact[];
  metaLog?: MetaChangeLog[];
  approvals?: PendingApproval[];
};

export interface MetaEdit {
  kind: MetaNodeKind;
  targetId: number;
  targetPath: string;
  field: string;
  from: string;
  to: string;
}
export interface EditAuthor { name: string; role: string; isAdmin: boolean }

type Ctx = {
  projects: ProjectExt[];
  getProject: (id: number) => ProjectExt | undefined;
  addProject: (p: Omit<ProjectExt, 'id' | 'goals' | 'financialItems' | 'risks' | 'changes' | 'evidences' | 'contrapartidas' | 'team'> & { team?: string[] }) => ProjectExt;
  updateProject: (id: number, patch: Partial<ProjectExt>) => void;
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

  // Contatos do projeto
  addContact: (projectId: number, c: Omit<Contact, 'id'>) => void;
  updateContact: (projectId: number, id: number, patch: Partial<Contact>) => void;
  deleteContact: (projectId: number, id: number) => void;

  // Metas: edição com registro e validação de administrador
  submitMetaEdit: (projectId: number, edit: MetaEdit, author: EditAuthor) => 'aplicado' | 'pendente';
  approveMetaEdit: (projectId: number, approvalId: number, adminName: string) => void;
  rejectMetaEdit: (projectId: number, approvalId: number, adminName: string) => void;



  // Comunidades
  communities: Comunidade[];
  getCommunity: (id: number) => Comunidade | undefined;
  updateCommunity: (id: number, patch: Partial<Comunidade>) => void;

  // Rotas / Calendário
  routes: RotaItem[];
  updateRoute: (id: number, patch: Partial<RotaItem>) => void;
  addRoute: (r: Omit<RotaItem, 'id'>) => void;
  deleteRoute: (id: number) => void;

  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: number, patch: Partial<CalendarEvent>) => void;
  deleteEvent: (id: number) => void;

  // Cronograma Executivo (Gantt)
  gantt: GanttBloco[];
  updateGanttEntrega: (entregaId: number, patch: { status?: GanttStatus; progress?: number; inicio?: string; fim?: string; responsavel?: string; entrega?: string; comentario?: string }) => void;
  updateGanttAtividade: (atividadeId: number, patch: { status?: GanttStatus; progress?: number; inicio?: string; fim?: string; responsavel?: string; atividade?: string; comentario?: string }) => void;
  addGanttAtividade: (entregaId: number, atividade: string) => void;
  deleteGanttAtividade: (atividadeId: number) => { entregaId: number; index: number; atividade: GanttActivity } | null;
  restoreGanttAtividade: (entregaId: number, index: number, atividade: GanttActivity) => void;


  resetToSeed: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

type Persisted = { projects: ProjectExt[]; communities: Comunidade[]; routes: RotaItem[]; events: CalendarEvent[]; gantt: GanttBloco[] };

function loadInitial(): Persisted {
  const fallback: Persisted = {
    projects: seedProjects as ProjectExt[],
    communities: seedComunidades,
    routes: seedRotas,
    events: calendarSeed,
    gantt: cronogramaExecutivoSeed,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      projects: parsed.projects?.length ? parsed.projects : fallback.projects,
      communities: parsed.communities?.length ? parsed.communities : fallback.communities,
      routes: parsed.routes?.length ? parsed.routes : fallback.routes,
      events: parsed.events?.length ? parsed.events : fallback.events,
      gantt: parsed.gantt?.length ? parsed.gantt : fallback.gantt,
    };
  } catch { return fallback; }
}

function recalcProject(p: ProjectExt): ProjectExt {
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
  const [projects, setProjects] = useState<ProjectExt[]>(seedProjects as ProjectExt[]);
  const [communities, setCommunities] = useState<Comunidade[]>(seedComunidades);
  const [routes, setRoutes] = useState<RotaItem[]>(seedRotas);
  const [events, setEvents] = useState<CalendarEvent[]>(calendarSeed);
  const [gantt, setGantt] = useState<GanttBloco[]>(cronogramaExecutivoSeed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = loadInitial();
    setProjects(p.projects); setCommunities(p.communities); setRoutes(p.routes); setEvents(p.events); setGantt(p.gantt);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ projects, communities, routes, events, gantt } as Persisted)); } catch { /* ignore */ }
  }, [projects, communities, routes, events, gantt, hydrated]);

  const patch = useCallback((id: number, fn: (p: ProjectExt) => ProjectExt) => {
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
      const p: ProjectExt = {
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
      } as ProjectExt;
      setProjects(prev => [...prev, p]);
      return p;
    },
    updateProject: (id, patchData) => {
      setProjects(prev => prev.map(p => (p.id === id ? recalcProject({ ...p, ...patchData }) : p)));
    },
    deleteProject: (id) => setProjects(prev => prev.filter(p => p.id !== id)),

    addRisk: (projectId, r) => patch(projectId, p => {
      const nextId = p.risks.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      return { ...p, risks: [...p.risks, { ...r, id: nextId, severity: r.probability * r.impact }] };
    }),
    deleteRisk: (projectId, riskId) => patch(projectId, p => ({ ...p, risks: p.risks.filter(r => r.id !== riskId) })),

    addChange: (projectId, c) => patch(projectId, p => {
      const nextId = p.changes.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      return { ...p, changes: [...p.changes, { ...c, id: nextId }] };
    }),
    updateChangeApproval: (projectId, changeId, approval) =>
      patch(projectId, p => ({ ...p, changes: p.changes.map(c => (c.id === changeId ? { ...c, approval } : c)) })),
    deleteChange: (projectId, changeId) => patch(projectId, p => ({ ...p, changes: p.changes.filter(c => c.id !== changeId) })),

    addFinancial: (projectId, f) => patch(projectId, p => {
      const nextId = p.financialItems.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      return { ...p, financialItems: [...p.financialItems, { ...f, id: nextId }] };
    }),
    updateFinancialExecuted: (projectId, itemId, executedValue, date, supplier, document) =>
      patch(projectId, p => ({
        ...p,
        financialItems: p.financialItems.map(i => i.id === itemId ? {
          ...i, executedValue,
          date: date ?? i.date,
          supplier: supplier ?? i.supplier,
          document: document ?? i.document,
        } : i),
      })),
    deleteFinancial: (projectId, itemId) => patch(projectId, p => ({ ...p, financialItems: p.financialItems.filter(i => i.id !== itemId) })),

    addContrapartida: (projectId, c) => patch(projectId, p => {
      const list = p.contrapartidas ?? [];
      const nextId = list.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      return { ...p, contrapartidas: [...list, { ...c, id: nextId }] };
    }),
    deleteContrapartida: (projectId, itemId) => patch(projectId, p => ({ ...p, contrapartidas: (p.contrapartidas ?? []).filter(i => i.id !== itemId) })),

    addEvidence: (projectId, e) => patch(projectId, p => {
      const nextId = p.evidences.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      return { ...p, evidences: [...p.evidences, { ...e, id: nextId }] };
    }),
    deleteEvidence: (projectId, evId) => patch(projectId, p => ({ ...p, evidences: p.evidences.filter(e => e.id !== evId) })),

    updateActivityStatus: (projectId, activityId, status, progress) => patch(projectId, p => ({
      ...p,
      goals: p.goals.map(g => ({
        ...g,
        deliverables: g.deliverables.map(d => ({
          ...d,
          activities: d.activities.map(a => a.id === activityId ? {
            ...a, status,
            progress: progress ?? (status === 'Concluído' ? 100 : status === 'Não iniciado' ? 0 : a.progress),
            conclusionDate: status === 'Concluído' ? new Date().toLocaleDateString('pt-BR') : a.conclusionDate,
          } : a),
        })),
      })),
    })),

    // Comunidades
    communities,
    getCommunity: (id) => communities.find(c => c.id === id),
    updateCommunity: (id, p) => setCommunities(prev => prev.map(c => (c.id === id ? { ...c, ...p } : c))),

    // Rotas
    routes,
    updateRoute: (id, p) => setRoutes(prev => prev.map(r => (r.id === id ? { ...r, ...p } : r))),
    addRoute: (r) => setRoutes(prev => [...prev, { ...r, id: prev.reduce((m, x) => Math.max(m, x.id), 0) + 1 }]),
    deleteRoute: (id) => setRoutes(prev => prev.filter(r => r.id !== id)),

    // Eventos
    events,
    addEvent: (e) => setEvents(prev => [...prev, { ...e, id: prev.reduce((m, x) => Math.max(m, x.id), 0) + 1 }]),
    updateEvent: (id, p) => setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...p } : e))),
    deleteEvent: (id) => setEvents(prev => prev.filter(e => e.id !== id)),

    // Gantt (cronograma executivo)
    gantt,
    updateGanttEntrega: (entregaId, patchData) => setGantt(prev => prev.map(b => ({
      ...b,
      entregas: b.entregas.map(en => en.id === entregaId ? {
        ...en, ...patchData,
        progress: patchData.progress ?? en.progress,
      } : en),
    }))),
    updateGanttAtividade: (atividadeId, patchData) => setGantt(prev => prev.map(b => ({
      ...b,
      entregas: b.entregas.map(en => {
        const nextAtividades = en.atividades.map(a => a.id === atividadeId ? {
          ...a, ...patchData,
          progress: patchData.progress ?? a.progress,
        } : a);
        // Se a atividade pertence a essa entrega, recalcula progresso da entrega como média
        const changed = nextAtividades.some((a, i) => a !== en.atividades[i]);
        if (!changed) return { ...en, atividades: nextAtividades };
        const avg = Math.round(nextAtividades.reduce((s, a) => s + a.progress, 0) / nextAtividades.length);
        return { ...en, atividades: nextAtividades, progress: avg };
      }),
    }))),
    addGanttAtividade: (entregaId, atividade) => setGantt(prev => {
      const allIds = prev.flatMap(b => b.entregas.flatMap(e => e.atividades.map(a => a.id)));
      const nextId = allIds.reduce((m, x) => Math.max(m, x), 0) + 1;
      return prev.map(b => ({
        ...b,
        entregas: b.entregas.map(en => en.id !== entregaId ? en : {
          ...en,
          atividades: [...en.atividades, {
            id: nextId, atividade, inicio: en.inicio, fim: en.fim,
            responsavel: en.responsavel, status: 'Não iniciado' as GanttStatus, progress: 0,
          }],
        }),
      }));
    }),
    deleteGanttAtividade: (atividadeId) => {
      let found: { entregaId: number; index: number; atividade: GanttActivity } | null = null;
      gantt.forEach(b => b.entregas.forEach(en => {
        const idx = en.atividades.findIndex(a => a.id === atividadeId);
        if (idx >= 0) found = { entregaId: en.id, index: idx, atividade: en.atividades[idx] };
      }));
      if (!found) return null;
      setGantt(prev => prev.map(b => ({
        ...b,
        entregas: b.entregas.map(en => ({ ...en, atividades: en.atividades.filter(a => a.id !== atividadeId) })),
      })));
      return found;
    },
    restoreGanttAtividade: (entregaId, index, atividade) => setGantt(prev => prev.map(b => ({
      ...b,
      entregas: b.entregas.map(en => {
        if (en.id !== entregaId) return en;
        const list = [...en.atividades];
        list.splice(Math.min(index, list.length), 0, atividade);
        return { ...en, atividades: list };
      }),
    }))),



    resetToSeed: () => {
      setProjects(seedProjects as ProjectExt[]);
      setCommunities(seedComunidades);
      setRoutes(seedRotas);
      setEvents(calendarSeed);
      setGantt(cronogramaExecutivoSeed);
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    },
  }), [projects, communities, routes, events, gantt, patch]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within ProjectsProvider');
  return ctx;
}
