import type {
  Activity, ActivityStatus, Change, Deliverable, FinancialItem, Goal, Project, Risk,
} from './mockData';
import type { ProjectOp } from './projectExtras';

const num = (v: unknown, fb = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || fb);
const str = (v: unknown, fb = '') => (typeof v === 'string' ? v : fb);

export const nextGoalId = (p: Project) => p.goals.reduce((m, g) => Math.max(m, g.id), 0) + 1;
export const nextDeliverableId = (p: Project) =>
  p.goals.flatMap(g => g.deliverables).reduce((m, d) => Math.max(m, d.id), 0) + 1;
export const nextActivityId = (p: Project) =>
  p.goals.flatMap(g => g.deliverables.flatMap(d => d.activities)).reduce((m, a) => Math.max(m, a.id), 0) + 1;

function newActivity(id: number, payload: Record<string, unknown> = {}): Activity {
  return {
    id,
    name: str(payload.name, 'Nova atividade'),
    responsible: str(payload.responsible),
    plannedDate: str(payload.plannedDate),
    startDate: payload.startDate ? String(payload.startDate) : null,
    conclusionDate: payload.conclusionDate ? String(payload.conclusionDate) : null,
    progress: num(payload.progress, 0),
    status: (str(payload.status, 'Não iniciado') as ActivityStatus),
    observations: str(payload.observations),
  };
}

/** Aplica alterações campo a campo em uma atividade (especificação). */
function patchActivity(a: Activity, field: string, to: string): Activity {
  switch (field) {
    case 'status': {
      const status = to as ActivityStatus;
      const progress = status === 'Concluído' ? 100 : status === 'Em andamento' ? (a.progress > 0 && a.progress < 100 ? a.progress : 50) : 0;
      return {
        ...a,
        status,
        progress,
        startDate: status === 'Não iniciado' ? null : (a.startDate || new Date().toLocaleDateString('pt-BR')),
        conclusionDate: status === 'Concluído' ? (a.conclusionDate || new Date().toLocaleDateString('pt-BR')) : null,
      };
    }
    case 'progresso':      return { ...a, progress: Math.max(0, Math.min(100, Number(to) || 0)) };
    case 'responsável':    return { ...a, responsible: to };
    case 'início':         return { ...a, startDate: to || null };
    case 'conclusão':      return { ...a, conclusionDate: to || null };
    case 'previsto':       return { ...a, plannedDate: to };
    case 'observações':    return { ...a, observations: to };
    default:               return { ...a, name: to };
  }
}

function patchRisk(r: Risk, field: string, to: string): Risk {
  const next: Risk = { ...r };
  switch (field) {
    case 'descrição':     next.description = to; break;
    case 'categoria':     next.category = to; break;
    case 'probabilidade': next.probability = Math.max(1, Math.min(5, Number(to) || 1)); break;
    case 'impacto':       next.impact = Math.max(1, Math.min(5, Number(to) || 1)); break;
    case 'estratégia':    next.responseStrategy = to; break;
    case 'responsável':   next.responsible = to; break;
    case 'status':        next.status = to as Risk['status']; break;
    case 'meta':          next.goalId = Number(to) || undefined; break;
    default: break;
  }
  next.severity = next.probability * next.impact;
  return next;
}

function patchChange(c: Change, field: string, to: string): Change {
  switch (field) {
    case 'descrição':     return { ...c, description: to };
    case 'tipo':          return { ...c, type: to as Change['type'] };
    case 'data':          return { ...c, date: to };
    case 'justificativa': return { ...c, justification: to };
    case 'aprovação':     return { ...c, approval: to as Change['approval'] };
    case 'responsável':   return { ...c, responsible: to };
    case 'natureza':      return { ...c, nature: to as Change['nature'] };
    case 'meta':          return { ...c, goalId: Number(to) || undefined };
    default:              return c;
  }
}

const lineTotal = (i: Pick<FinancialItem, 'qtd' | 'qtdUnidades' | 'valorUnitario'>) =>
  (Number(i.qtd) || 0) * (Number(i.qtdUnidades) || 0) * (Number(i.valorUnitario) || 0);

function patchFinancial(i: FinancialItem, field: string, to: string): FinancialItem {
  let next: FinancialItem = { ...i };
  switch (field) {
    case 'categoria':        next.category = to; break;
    case 'descrição':        next.item = to; break;
    case 'meta':             next.meta = to; next.relatedGoal = to; break;
    case 'qtd':              next.qtd = Number(to) || 0; break;
    case 'unidade':          next.unidade = to; break;
    case 'qtd. de unidades': next.qtdUnidades = Number(to) || 0; break;
    case 'valor unitário':   next.valorUnitario = Number(to) || 0; break;
    case 'valor executado':  next.executedValue = Number(to) || 0; break;
    case 'executado':        next.executedFlag = to as FinancialItem['executedFlag']; break;
    case 'prestação de contas': next.accountability = to as FinancialItem['accountability']; break;
    case 'registro de alterações': next.changeRecord = to as FinancialItem['changeRecord']; break;
    case 'fornecedor':       next.supplier = to; break;
    case 'documento':        next.document = to; break;
    case 'data':             next.date = to; break;
    default: break;
  }
  next.plannedValue = lineTotal(next);
  if (field === 'executado') {
    if (next.executedFlag === 'Sim') next.executedValue = next.plannedValue;
    if (next.executedFlag === 'Não') next.executedValue = 0;
  }
  if (field === 'valor executado' && next.executedFlag !== 'Parcial' && next.executedValue !== next.plannedValue) {
    next = { ...next, executedFlag: next.executedValue === 0 ? 'Não' : 'Parcial' };
  }
  return next;
}

/** Aplica uma operação (criar/editar/excluir) na estrutura do projeto. */
export function applyOp<P extends Project>(p: P, op: ProjectOp): P {
  const field = op.field ?? 'nome';
  const to = op.to ?? '';

  switch (op.entity) {
    // ---------------- Metas ----------------
    case 'meta': {
      if (op.action === 'criar') {
        const g: Goal = { id: nextGoalId(p), name: str(op.payload?.name, to || 'Nova meta'), deliverables: [] };
        return { ...p, goals: [...p.goals, g] };
      }
      if (op.action === 'excluir') return { ...p, goals: p.goals.filter(g => g.id !== op.targetId) };
      return { ...p, goals: p.goals.map(g => (g.id === op.targetId ? { ...g, name: to } : g)) };
    }

    // ---------------- Etapas ----------------
    case 'etapa': {
      if (op.action === 'criar') {
        const d: Deliverable = {
          id: nextDeliverableId(p),
          name: str(op.payload?.name, to || 'Nova etapa'),
          expectedResult: str(op.payload?.expectedResult),
          activities: [],
        };
        return { ...p, goals: p.goals.map(g => (g.id === op.parentId ? { ...g, deliverables: [...g.deliverables, d] } : g)) };
      }
      if (op.action === 'excluir') {
        return { ...p, goals: p.goals.map(g => ({ ...g, deliverables: g.deliverables.filter(d => d.id !== op.targetId) })) };
      }
      return {
        ...p,
        goals: p.goals.map(g => ({
          ...g,
          deliverables: g.deliverables.map(d => (d.id === op.targetId
            ? (field === 'resultado esperado' ? { ...d, expectedResult: to } : { ...d, name: to })
            : d)),
        })),
      };
    }

    // ------------- Especificações (atividades) -------------
    case 'especificacao': {
      if (op.action === 'criar') {
        const a = newActivity(nextActivityId(p), { name: to, ...(op.payload ?? {}) });
        return {
          ...p,
          goals: p.goals.map(g => ({
            ...g,
            deliverables: g.deliverables.map(d => (d.id === op.parentId ? { ...d, activities: [...d.activities, a] } : d)),
          })),
        };
      }
      // exclusão de atividade não é permitida — apenas registro
      if (op.action === 'excluir') return p;
      return {
        ...p,
        goals: p.goals.map(g => ({
          ...g,
          deliverables: g.deliverables.map(d => ({
            ...d,
            activities: d.activities.map(a => (a.id === op.targetId ? patchActivity(a, field, to) : a)),
          })),
        })),
      };
    }

    // ---------------- Riscos ----------------
    case 'risco': {
      if (op.action === 'criar') {
        const pay = op.payload ?? {};
        const prob = num(pay.probability, 3);
        const imp = num(pay.impact, 3);
        const r: Risk = {
          id: p.risks.reduce((m, x) => Math.max(m, x.id), 0) + 1,
          description: str(pay.description),
          category: str(pay.category, 'Operacional'),
          probability: prob,
          impact: imp,
          severity: prob * imp,
          responseStrategy: str(pay.responseStrategy),
          responsible: str(pay.responsible),
          status: (str(pay.status, 'Aberto') as Risk['status']),
          goalId: pay.goalId ? Number(pay.goalId) : undefined,
        };
        return { ...p, risks: [...p.risks, r] };
      }
      if (op.action === 'excluir') return { ...p, risks: p.risks.filter(r => r.id !== op.targetId) };
      return { ...p, risks: p.risks.map(r => (r.id === op.targetId ? patchRisk(r, field, to) : r)) };
    }

    // ---------------- Mudanças ----------------
    case 'mudanca': {
      if (op.action === 'criar') {
        const pay = op.payload ?? {};
        const c: Change = {
          id: p.changes.reduce((m, x) => Math.max(m, x.id), 0) + 1,
          description: str(pay.description),
          type: (str(pay.type, 'Escopo') as Change['type']),
          date: str(pay.date, new Date().toLocaleDateString('pt-BR')),
          justification: str(pay.justification),
          approval: (str(pay.approval, 'Pendente') as Change['approval']),
          responsible: str(pay.responsible),
          goalId: pay.goalId ? Number(pay.goalId) : undefined,
          nature: pay.nature ? (String(pay.nature) as Change['nature']) : undefined,
        };
        return { ...p, changes: [...p.changes, c] };
      }
      if (op.action === 'excluir') return { ...p, changes: p.changes.filter(c => c.id !== op.targetId) };
      return { ...p, changes: p.changes.map(c => (c.id === op.targetId ? patchChange(c, field, to) : c)) };
    }

    // ---------------- Financeiro ----------------
    case 'financeiro': {
      if (op.action === 'criar') {
        const pay = op.payload ?? {};
        const base = {
          qtd: num(pay.qtd, 1),
          qtdUnidades: num(pay.qtdUnidades, 1),
          valorUnitario: num(pay.valorUnitario, 0),
        };
        const total = lineTotal(base);
        const flag = (str(pay.executedFlag, 'Não') as FinancialItem['executedFlag']);
        const item: FinancialItem = {
          id: p.financialItems.reduce((m, x) => Math.max(m, x.id), 0) + 1,
          meta: str(pay.meta, 'Meta 1'),
          category: str(pay.category, 'Materiais de consumo'),
          relatedGoal: str(pay.meta, 'Meta 1'),
          item: str(pay.item),
          unidade: str(pay.unidade, 'unidade'),
          ...base,
          plannedValue: total,
          executedValue: flag === 'Sim' ? total : num(pay.executedValue, 0),
          date: str(pay.date),
          supplier: str(pay.supplier),
          document: str(pay.document),
          executedFlag: flag,
          accountability: (str(pay.accountability, 'Não enviado') as FinancialItem['accountability']),
          changeRecord: (str(pay.changeRecord, 'Novo item') as FinancialItem['changeRecord']),
        };
        return { ...p, financialItems: [...p.financialItems, item] };
      }
      if (op.action === 'excluir') return { ...p, financialItems: p.financialItems.filter(i => i.id !== op.targetId) };
      return { ...p, financialItems: p.financialItems.map(i => (i.id === op.targetId ? patchFinancial(i, field, to) : i)) };
    }

    default:
      return p;
  }
}
