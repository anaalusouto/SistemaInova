import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import {
  type Project, type Risk, type Change, type FinancialItem, type ContrapartidaItem, type Evidence, type ActivityStatus,
} from './data/mockData';
import { comunidades as seedComunidades, type Comunidade } from './data/comunidades';
import { rotas as seedRotas, calendarSeed, type RotaItem, type CalendarEvent } from './data/rotas';
import { cronogramaExecutivoSeed, type GanttBloco, type GanttStatus, type GanttActivity } from './data/cronogramaExecutivo';
import type { CommLog, Contact, ProjectOp, MetaChangeLog, PendingApproval, ParecerTecnico } from './data/projectExtras';
import type { InternalTracking } from './data/controleInterno';
import {
  listarProjetos, criarProjeto, atualizarProjeto, excluirProjeto,
  submeterEdicaoMeta, aprovarEdicaoMeta, rejeitarEdicaoMeta,
  addRisco, deleteRisco, addMudanca, updateMudancaAprovacao, deleteMudanca,
  addFinanceiro, updateFinanceiroExecutado, deleteFinanceiro,
  addContrapartida, deleteContrapartida, addEvidencia, deleteEvidencia, updateAtividadeStatus,
  addAporte, deleteAporte, addCommLog, updateCommLog, deleteCommLog,
  addContato, updateContato, deleteContato,
} from './projetos.server';
import {
  salvarPeriodoDaEtapa, criarAtividade, atualizarAtividade, excluirAtividade,
  criarTarefa, renomearTarefa, excluirTarefa, criarRisco, atualizarRisco,
  criarParecer, atualizarParecer, excluirParecer, definirResponsavel,
  type PeriodoEtapaInput, type AtividadeInput, type RiscoInput, type ParecerInput,
} from './planoTrabalho.server';
import { enviarAnexo, removerAnexo, type AnexoInput } from './anexos.server';
import {
  registrarExecucao, excluirItemDoPlano, reverterExclusao,
  type ExecucaoInput, type ExclusaoInput,
} from './orcamento.server';
import type { ItemOrcamento } from './lib/orcamento';

const STORAGE_KEY = 'pp-portfolio-v13';

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
  /** Sigla padronizada da instituição executora (ex.: ARQMO, COOPAFS). */
  org?: string;
  /** Segmento: comunidades quilombolas, indígenas, tradicionais ou agricultura familiar. */
  segmento?: string;
  plano?: PlanoTrabalho;
  /** Link do Google Drive com o Plano de Trabalho mais atualizado. */
  driveLink?: string;
  /** Link do Google Drive com o Orçamento Realizado. */
  budgetLink?: string;
  /** Link do Google Drive com o Termo de Fomento. */
  termoFomentoLink?: string;
  contacts?: Contact[];
  metaLog?: MetaChangeLog[];
  approvals?: PendingApproval[];
  /** Caderno de entradas e saídas de recursos adicionais (aportes). */
  aportes?: Aporte[];
  /** Registro de comunicação com a instituição (contatos). */
  commLogs?: CommLog[];
  /** Pareceres técnicos de acompanhamento (RF-033). */
  pareceres?: ParecerTecnico[];
  /** Itens do orçamento no modelo da seção 14 (execução opcional, exclusão lógica). */
  orcamentoItens?: ItemOrcamento[];
};

/** Lançamento simples de recurso adicional — entradas e saídas fora do orçamento aprovado. */
export interface Aporte {
  id: string;
  data: string;          // YYYY-MM-DD
  tipo: 'Entrada' | 'Saída';
  origem: string;        // quem aportou / destino
  descricao: string;
  valor: number;
  registradoPor?: string;
}

/** Operação sujeita a registro e (para estagiários) validação de administrador. */
export type MetaEdit = ProjectOp;
export interface EditAuthor { name: string; role: string; isAdmin: boolean }

type Ctx = {
  projects: ProjectExt[];
  projectsLoading: boolean;
  getProject: (id: number) => ProjectExt | undefined;
  addProject: (p: Partial<ProjectExt> & { team?: string[] }) => Promise<ProjectExt>;
  updateProject: (id: number, patch: Partial<ProjectExt>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  addRisk: (projectId: number, r: Omit<Risk, 'id' | 'severity'>) => Promise<void>;
  deleteRisk: (projectId: number, riskId: string) => Promise<void>;

  addChange: (projectId: number, c: Omit<Change, 'id'>) => Promise<void>;
  updateChangeApproval: (projectId: number, changeId: string, approval: Change['approval']) => Promise<void>;
  deleteChange: (projectId: number, changeId: string) => Promise<void>;

  addFinancial: (projectId: number, f: Omit<FinancialItem, 'id'>) => Promise<void>;
  updateFinancialExecuted: (projectId: number, itemId: string, executedValue: number, date?: string, supplier?: string, document?: string) => Promise<void>;
  deleteFinancial: (projectId: number, itemId: string) => Promise<void>;

  addContrapartida: (projectId: number, c: Omit<ContrapartidaItem, 'id'>) => Promise<void>;
  deleteContrapartida: (projectId: number, itemId: string) => Promise<void>;

  addEvidence: (projectId: number, e: Omit<Evidence, 'id'>) => Promise<void>;
  deleteEvidence: (projectId: number, evId: string) => Promise<void>;

  updateActivityStatus: (projectId: number, activityId: string, status: ActivityStatus, progress?: number) => Promise<void>;

  // Aportes (caderno financeiro paralelo)
  addAporte: (projectId: number, a: Omit<Aporte, 'id'>) => Promise<void>;
  deleteAporte: (projectId: number, id: string) => Promise<void>;

  // Registro de comunicação (contatos)
  addCommLog: (projectId: number, c: Omit<CommLog, 'id'>) => Promise<void>;
  updateCommLog: (projectId: number, id: string, patch: Partial<CommLog>) => Promise<void>;
  deleteCommLog: (projectId: number, id: string) => Promise<void>;

  // Plano de Trabalho — escritas com validação no servidor (RF-022 a RF-025).
  // Recebem o input já montado porque as regras de data moram no servidor: a
  // store só encaminha e revalida a lista.
  savePeriodoEtapa: (input: PeriodoEtapaInput) => Promise<void>;
  createAtividade: (input: AtividadeInput) => Promise<string>;
  updateAtividade: (atividadeId: string, input: AtividadeInput) => Promise<void>;
  deleteAtividade: (atividadeId: string) => Promise<void>;
  createTarefa: (atividadeId: string, titulo: string) => Promise<void>;
  renameTarefa: (tarefaId: string, titulo: string) => Promise<void>;
  deleteTarefa: (tarefaId: string) => Promise<void>;
  createRisco: (input: RiscoInput) => Promise<void>;
  updateRisco: (riscoId: string, input: RiscoInput) => Promise<void>;
  uploadAnexo: (input: AnexoInput) => Promise<string>;
  deleteAnexo: (anexoId: string) => Promise<void>;
  createParecer: (input: ParecerInput) => Promise<string>;
  updateParecer: (parecerId: string, input: ParecerInput) => Promise<void>;
  deleteParecer: (parecerId: string) => Promise<void>;
  setResponsavel: (atividadeId: string, responsavel: string) => Promise<void>;

  // Orçamento (RF-030, RF-039, RF-040, RF-041)
  saveExecucao: (input: ExecucaoInput) => Promise<void>;
  excluirItemOrcamento: (input: ExclusaoInput) => Promise<string>;
  reverterItemOrcamento: (itemId: string, motivo: string) => Promise<void>;

  // Contatos do projeto
  addContact: (projectId: number, c: Omit<Contact, 'id'>) => Promise<void>;
  updateContact: (projectId: number, id: string, patch: Partial<Contact>) => Promise<void>;
  deleteContact: (projectId: number, id: string) => Promise<void>;

  // Metas: edição com registro e validação de administrador
  submitMetaEdit: (projectId: number, edit: MetaEdit, author: EditAuthor) => Promise<'aplicado' | 'pendente'>;
  approveMetaEdit: (projectId: number, approvalId: string, adminName: string) => Promise<void>;
  rejectMetaEdit: (projectId: number, approvalId: string, adminName: string) => Promise<void>;

  // Comunidades
  communities: Comunidade[];
  getCommunity: (id: number) => Comunidade | undefined;
  updateCommunity: (id: number, patch: Partial<Comunidade>) => void;

  // Acompanhamento das atividades do cronograma por projeto
  ganttTracking: Record<string, InternalTracking>;
  setGanttTracking: (activityId: number, projectId: number, patch: Partial<InternalTracking>) => void;

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
  updateGanttBloco: (blocoId: number, bloco: string) => void;
  updateGanttAtividade: (atividadeId: number, patch: { status?: GanttStatus; progress?: number; inicio?: string; fim?: string; responsavel?: string; atividade?: string; comentario?: string; observacao?: string; projetoId?: number | null; projetoIds?: number[]; vinculavel?: boolean }) => void;
  addGanttBloco: (bloco: string) => void;
  addGanttEntrega: (blocoId: number, entrega: string) => void;
  addGanttAtividade: (entregaId: number, atividade: string) => void;
  addGanttSubatividade: (atividadeId: number, atividade: string) => void;
  deleteGanttAtividade: (atividadeId: number) => { entregaId: number; index: number; atividade: GanttActivity; parentId?: number } | null;
  restoreGanttAtividade: (entregaId: number, index: number, atividade: GanttActivity, parentId?: number) => void;

  resetToSeed: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

type PersistedLocal = {
  communities: Comunidade[]; routes: RotaItem[]; events: CalendarEvent[]; gantt: GanttBloco[];
  ganttTracking?: Record<string, InternalTracking>;
};

/**
 * Remove os vínculos pré-existentes entre atividades e projetos.
 * O vínculo passa a ser feito manualmente, atividade a atividade.
 */
function unlinkGantt(blocos: GanttBloco[]): GanttBloco[] {
  const clean = (a: GanttActivity): GanttActivity => ({
    ...a,
    projetoId: null,
    vinculavel: a.vinculavel ?? false,
    projetoIds: a.projetoIds ?? [],
    subatividades: (a.subatividades ?? []).map(clean),
  });
  return blocos.map(b => ({ ...b, entregas: b.entregas.map(en => ({ ...en, atividades: en.atividades.map(clean) })) }));
}

function loadInitialLocal(): PersistedLocal {
  const fallback: PersistedLocal = {
    communities: seedComunidades,
    routes: seedRotas,
    events: calendarSeed,
    gantt: unlinkGantt(cronogramaExecutivoSeed),
    ganttTracking: {},
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PersistedLocal>;
    return {
      communities: parsed.communities?.length ? parsed.communities : fallback.communities,
      routes: parsed.routes?.length ? parsed.routes : fallback.routes,
      events: parsed.events?.length ? parsed.events : fallback.events,
      gantt: parsed.gantt?.length ? parsed.gantt : fallback.gantt,
      ganttTracking: parsed.ganttTracking ?? {},
    };
  } catch { return fallback; }
}

function nextGanttId(blocos: GanttBloco[]): number {
  const ids = blocos.flatMap(b => [
    b.id,
    ...b.entregas.flatMap(e => [
      e.id,
      ...e.atividades.flatMap(a => [a.id, ...(a.subatividades ?? []).map(s => s.id)]),
    ]),
  ]);
  return ids.reduce((m, x) => Math.max(m, x), 0) + 1;
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const initialLocal = useMemo(loadInitialLocal, []);

  const [communities, setCommunities] = useState<Comunidade[]>(initialLocal.communities);
  const [routes, setRoutes] = useState<RotaItem[]>(initialLocal.routes);
  const [events, setEvents] = useState<CalendarEvent[]>(initialLocal.events);
  const [gantt, setGantt] = useState<GanttBloco[]>(initialLocal.gantt);
  const [ganttTracking, setGanttTrackingState] = useState<Record<string, InternalTracking>>(initialLocal.ganttTracking ?? {});

  const persistLocal = useCallback((next: Partial<PersistedLocal>) => {
    try {
      const merged = { communities, routes, events, gantt, ganttTracking, ...next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch { /* ignore */ }
  }, [communities, routes, events, gantt, ganttTracking]);

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['projetos'],
    queryFn: () => listarProjetos(),
  });

  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey: ['projetos'] }), [queryClient]);
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const result = await fn();
    await invalidate();
    return result;
  }, [invalidate]);

  // Realtime: qualquer mudança nas tabelas de projetos (feita por qualquer
  // pessoa, em qualquer aba) dispara um broadcast (ver migração
  // 0002_realtime_broadcast.sql) — aqui a gente só re-busca a lista via
  // server function; o canal nunca carrega o conteúdo da linha em si.
  useEffect(() => {
    const channel = supabase
      .channel('projetos-sync')
      .on('broadcast', { event: 'changed' }, () => {
        void invalidate();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [invalidate]);

  const value = useMemo<Ctx>(() => ({
    projects,
    projectsLoading,
    getProject: (id) => projects.find(p => p.id === id),

    addProject: (data) => run(() => criarProjeto({ data })),
    updateProject: (id, patch) => run(() => atualizarProjeto({ data: { id, patch } })),
    deleteProject: (id) => run(() => excluirProjeto({ data: { id } })),

    addRisk: (projectId, r) => run(() => addRisco({ data: { projectId, risco: r } })),
    deleteRisk: (_projectId, riskId) => run(() => deleteRisco({ data: { riskId } })),

    addChange: (projectId, c) => run(() => addMudanca({ data: { projectId, mudanca: c } })),
    updateChangeApproval: (_projectId, changeId, approval) => run(() => updateMudancaAprovacao({ data: { changeId, approval } })),
    deleteChange: (_projectId, changeId) => run(() => deleteMudanca({ data: { changeId } })),

    addFinancial: (projectId, f) => run(() => addFinanceiro({ data: { projectId, item: f } })),
    updateFinancialExecuted: (_projectId, itemId, executedValue, date, supplier, document) =>
      run(() => updateFinanceiroExecutado({ data: { itemId, executedValue, date, supplier, document } })),
    deleteFinancial: (_projectId, itemId) => run(() => deleteFinanceiro({ data: { itemId } })),

    addContrapartida: (projectId, c) => run(() => addContrapartida({ data: { projectId, item: c } })),
    deleteContrapartida: (_projectId, itemId) => run(() => deleteContrapartida({ data: { itemId } })),

    addEvidence: (projectId, e) => run(() => addEvidencia({ data: { projectId, evidencia: e } })),
    deleteEvidence: (_projectId, evId) => run(() => deleteEvidencia({ data: { evidenciaId: evId } })),

    updateActivityStatus: (_projectId, activityId, status, progress) =>
      run(() => updateAtividadeStatus({ data: { activityId, status, progress } })),

    addAporte: (projectId, a) => run(() => addAporte({ data: { projectId, aporte: a } })),
    deleteAporte: (_projectId, id) => run(() => deleteAporte({ data: { aporteId: id } })),

    addCommLog: (projectId, c) => run(() => addCommLog({ data: { projectId, log: c } })),
    updateCommLog: (_projectId, id, patch) => run(() => updateCommLog({ data: { logId: id, patch } })),
    deleteCommLog: (_projectId, id) => run(() => deleteCommLog({ data: { logId: id } })),

    addContact: (projectId, c) => run(() => addContato({ data: { projectId, contato: c } })),
    updateContact: (_projectId, id, patch) => run(() => updateContato({ data: { contatoId: id, patch } })),
    deleteContact: (_projectId, id) => run(() => deleteContato({ data: { contatoId: id } })),

    savePeriodoEtapa: input => run(() => salvarPeriodoDaEtapa({ data: input })),
    createAtividade: input => run(() => criarAtividade({ data: input })),
    updateAtividade: (atividadeId, input) => run(() => atualizarAtividade({ data: { atividadeId, dados: input } })),
    deleteAtividade: atividadeId => run(() => excluirAtividade({ data: { atividadeId } })),
    createTarefa: (atividadeId, titulo) => run(() => criarTarefa({ data: { atividadeId, titulo } })),
    renameTarefa: (tarefaId, titulo) => run(() => renomearTarefa({ data: { tarefaId, titulo } })),
    deleteTarefa: tarefaId => run(() => excluirTarefa({ data: { tarefaId } })),
    createRisco: input => run(() => criarRisco({ data: input })),
    updateRisco: (riscoId, input) => run(() => atualizarRisco({ data: { riscoId, dados: input } })),
    uploadAnexo: input => run(() => enviarAnexo({ data: input })),
    deleteAnexo: anexoId => run(() => removerAnexo({ data: { anexoId } })),
    createParecer: input => run(() => criarParecer({ data: input })),
    updateParecer: (parecerId, input) => run(() => atualizarParecer({ data: { parecerId, dados: input } })),
    deleteParecer: parecerId => run(() => excluirParecer({ data: { parecerId } })),
    setResponsavel: (atividadeId, responsavel) => run(() => definirResponsavel({ data: { atividadeId, responsavel } })),
    saveExecucao: input => run(() => registrarExecucao({ data: input })),
    excluirItemOrcamento: input => run(() => excluirItemDoPlano({ data: input })),
    reverterItemOrcamento: (itemId, motivo) => run(() => reverterExclusao({ data: { itemId, motivo } })),

    // author/adminName não são mais enviados: o servidor deriva quem está
    // chamando a partir da sessão (sessao.server.ts). A assinatura pública
    // mantém os parâmetros porque a UI ainda os usa para feedback otimista.
    submitMetaEdit: (projectId, edit) => run(() => submeterEdicaoMeta({ data: { projectId, edit } })),
    approveMetaEdit: (projectId, approvalId) => run(() => aprovarEdicaoMeta({ data: { projectId, approvalId } })),
    rejectMetaEdit: (_projectId, approvalId) => run(() => rejeitarEdicaoMeta({ data: { approvalId } })),

    // Comunidades — ainda local (migração onda 2)
    communities,
    getCommunity: (id) => communities.find(c => c.id === id),
    updateCommunity: (id, p) => setCommunities(prev => { const next = prev.map(c => (c.id === id ? { ...c, ...p } : c)); persistLocal({ communities: next }); return next; }),

    // Acompanhamento por projeto das atividades do cronograma — ainda local (onda 3)
    ganttTracking,
    setGanttTracking: (activityId, projectId, p) => setGanttTrackingState(prev => {
      const key = `${activityId}:${projectId}`;
      const cur = prev[key] ?? { status: 'Não iniciado' as const };
      const next = { ...prev, [key]: { ...cur, ...p } };
      persistLocal({ ganttTracking: next });
      return next;
    }),

    // Rotas — ainda local (onda 2)
    routes,
    updateRoute: (id, p) => setRoutes(prev => { const next = prev.map(r => (r.id === id ? { ...r, ...p } : r)); persistLocal({ routes: next }); return next; }),
    addRoute: (r) => setRoutes(prev => { const next = [...prev, { ...r, id: prev.reduce((m, x) => Math.max(m, x.id), 0) + 1 }]; persistLocal({ routes: next }); return next; }),
    deleteRoute: (id) => setRoutes(prev => { const next = prev.filter(r => r.id !== id); persistLocal({ routes: next }); return next; }),

    // Eventos — ainda local (onda 2)
    events,
    addEvent: (e) => setEvents(prev => { const next = [...prev, { ...e, id: prev.reduce((m, x) => Math.max(m, x.id), 0) + 1 }]; persistLocal({ events: next }); return next; }),
    updateEvent: (id, p) => setEvents(prev => { const next = prev.map(e => (e.id === id ? { ...e, ...p } : e)); persistLocal({ events: next }); return next; }),
    deleteEvent: (id) => setEvents(prev => { const next = prev.filter(e => e.id !== id); persistLocal({ events: next }); return next; }),

    // Gantt (cronograma executivo) — ainda local (onda 3)
    gantt,
    updateGanttEntrega: (entregaId, patchData) => setGantt(prev => {
      const next = prev.map(b => ({
        ...b,
        entregas: b.entregas.map(en => en.id === entregaId ? { ...en, ...patchData, progress: patchData.progress ?? en.progress } : en),
      }));
      persistLocal({ gantt: next });
      return next;
    }),
    updateGanttBloco: (blocoId, bloco) => setGantt(prev => { const next = prev.map(b => (b.id === blocoId ? { ...b, bloco } : b)); persistLocal({ gantt: next }); return next; }),
    addGanttBloco: (bloco) => setGantt(prev => {
      const nextId = nextGanttId(prev);
      const next = [...prev, { id: nextId, bloco, entregas: [] }];
      persistLocal({ gantt: next });
      return next;
    }),
    addGanttEntrega: (blocoId, entrega) => setGantt(prev => {
      const nextId = nextGanttId(prev);
      const hoje = new Date().toISOString().slice(0, 10);
      const next = prev.map(b => b.id !== blocoId ? b : {
        ...b,
        entregas: [...b.entregas, {
          id: nextId, entrega, inicio: hoje, fim: hoje,
          responsavel: '', status: 'Não iniciado' as GanttStatus, progress: 0, atividades: [],
        }],
      });
      persistLocal({ gantt: next });
      return next;
    }),
    updateGanttAtividade: (atividadeId, patchData) => setGantt(prev => {
      const next = prev.map(b => ({
        ...b,
        entregas: b.entregas.map(en => ({
          ...en,
          atividades: en.atividades.map(a => {
            const self = a.id === atividadeId ? { ...a, ...patchData } : a;
            return { ...self, subatividades: (self.subatividades ?? []).map(s => s.id === atividadeId ? { ...s, ...patchData } : s) };
          }),
        })),
      }));
      persistLocal({ gantt: next });
      return next;
    }),
    addGanttAtividade: (entregaId, atividade) => setGantt(prev => {
      const nextId = nextGanttId(prev);
      const next = prev.map(b => ({
        ...b,
        entregas: b.entregas.map(en => en.id !== entregaId ? en : {
          ...en,
          atividades: [...en.atividades, {
            id: nextId, atividade, inicio: en.inicio, fim: en.fim,
            responsavel: en.responsavel, status: 'Não iniciado' as GanttStatus, progress: 0,
            projetoId: null, subatividades: [],
          }],
        }),
      }));
      persistLocal({ gantt: next });
      return next;
    }),
    addGanttSubatividade: (atividadeId, atividade) => setGantt(prev => {
      const nextId = nextGanttId(prev);
      const next = prev.map(b => ({
        ...b,
        entregas: b.entregas.map(en => ({
          ...en,
          atividades: en.atividades.map(a => a.id !== atividadeId ? a : {
            ...a,
            subatividades: [...(a.subatividades ?? []), {
              id: nextId, atividade, inicio: a.inicio, fim: a.fim,
              responsavel: a.responsavel, status: 'Não iniciado' as GanttStatus, progress: 0,
              projetoId: a.projetoId ?? null, subatividades: [],
            }],
          }),
        })),
      }));
      persistLocal({ gantt: next });
      return next;
    }),
    deleteGanttAtividade: (atividadeId) => {
      let found: { entregaId: number; index: number; atividade: GanttActivity; parentId?: number } | null = null;
      gantt.forEach(b => b.entregas.forEach(en => {
        const idx = en.atividades.findIndex(a => a.id === atividadeId);
        if (idx >= 0) found = { entregaId: en.id, index: idx, atividade: en.atividades[idx] };
        en.atividades.forEach(a => {
          const si = (a.subatividades ?? []).findIndex(s => s.id === atividadeId);
          if (si >= 0) found = { entregaId: en.id, index: si, atividade: a.subatividades![si], parentId: a.id };
        });
      }));
      if (!found) return null;
      setGantt(prev => {
        const next = prev.map(b => ({
          ...b,
          entregas: b.entregas.map(en => ({
            ...en,
            atividades: en.atividades.filter(a => a.id !== atividadeId).map(a => ({ ...a, subatividades: (a.subatividades ?? []).filter(s => s.id !== atividadeId) })),
          })),
        }));
        persistLocal({ gantt: next });
        return next;
      });
      return found;
    },
    restoreGanttAtividade: (entregaId, index, atividade, parentId) => setGantt(prev => {
      const next = prev.map(b => ({
        ...b,
        entregas: b.entregas.map(en => {
          if (en.id !== entregaId) return en;
          if (parentId != null) {
            return {
              ...en,
              atividades: en.atividades.map(a => {
                if (a.id !== parentId) return a;
                const subs = [...(a.subatividades ?? [])];
                subs.splice(Math.min(index, subs.length), 0, atividade);
                return { ...a, subatividades: subs };
              }),
            };
          }
          const list = [...en.atividades];
          list.splice(Math.min(index, list.length), 0, atividade);
          return { ...en, atividades: list };
        }),
      }));
      persistLocal({ gantt: next });
      return next;
    }),

    resetToSeed: () => {
      setCommunities(seedComunidades);
      setRoutes(seedRotas);
      setEvents(calendarSeed);
      setGantt(unlinkGantt(cronogramaExecutivoSeed));
      setGanttTrackingState({});
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      void invalidate();
    },
  }), [projects, projectsLoading, communities, routes, events, gantt, ganttTracking, run, invalidate, persistLocal]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within ProjectsProvider');
  return ctx;
}
