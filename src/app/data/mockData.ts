export type ProjectStatus = 'Em andamento' | 'Concluído' | 'Atrasado' | 'Não iniciado' | 'Suspenso';
export type RiskLevel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico' | '—';
export type ActivityStatus = 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Atrasado';
export type ApprovalStatus = 'Aprovado' | 'Pendente' | 'Reprovado';
export type ChangeType = 'Escopo' | 'Prazo' | 'Financeiro' | 'Equipe' | 'Técnico';
export type RiskStatus = 'Aberto' | 'Em mitigação' | 'Monitorando' | 'Encerrado';

export interface Activity {
  id: string;
  name: string;
  responsible: string;
  plannedDate: string;
  startDate: string | null;
  conclusionDate: string | null;
  progress: number;
  status: ActivityStatus;
  observations: string;
}

export interface Deliverable {
  id: string;
  name: string;
  expectedResult: string;
  activities: Activity[];
}

export interface Goal {
  id: string;
  name: string;
  deliverables: Deliverable[];
}

export type BudgetCategory =
  | 'Despesas com pessoal'
  | 'Serviços de terceiros'
  | 'Materiais de consumo'
  | 'Material permanente/equipamentos'
  | 'Custos administrativos';

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  'Despesas com pessoal',
  'Serviços de terceiros',
  'Materiais de consumo',
  'Material permanente/equipamentos',
  'Custos administrativos',
];

/** Valor executado: Sim = igual ao previsto, Não = nada executado, Parcial = valor digitado. */
export type ExecutedFlag = 'Não' | 'Sim' | 'Parcial';

export type AccountabilityStatus =
  | 'Não enviado'
  | 'Enviado'
  | 'Aprovado pela FAS'
  | 'Devolvido para ajuste'
  | 'Reprovado';

export const ACCOUNTABILITY_STATUSES: AccountabilityStatus[] = [
  'Não enviado', 'Enviado', 'Aprovado pela FAS', 'Devolvido para ajuste', 'Reprovado',
];

export type ChangeRecord =
  | 'Conforme planejado'
  | 'Alterado parcialmente'
  | 'Alterado totalmente'
  | 'Novo item';

export const CHANGE_RECORDS: ChangeRecord[] = [
  'Conforme planejado', 'Alterado parcialmente', 'Alterado totalmente', 'Novo item',
];

export interface FinancialItem {
  id: string;
  meta: string;               // Ex: "Meta 1"
  category: string;           // BudgetCategory (string p/ retrocompat)
  relatedGoal: string;        // legado — mantido p/ compatibilidade
  item: string;               // Descrição
  qtd: number;                // Qtd.
  unidade: string;            // Unidade (ex: diária, mês, unidade)
  qtdUnidades: number;        // Qtd. de Unidades
  valorUnitario: number;      // Valor Unitário (R$)
  plannedValue: number;       // = qtd × qtdUnidades × valorUnitario
  executedValue: number;
  date: string;
  supplier: string;
  document: string;
  /** Foi executado? Sim / Não / Parcial */
  executedFlag?: ExecutedFlag;
  /** Status da prestação de contas */
  accountability?: AccountabilityStatus;
  /** Registro de alterações da linha */
  changeRecord?: ChangeRecord;
}


export type ContrapartidaTipo = 'Financeira' | 'Econômica';

export interface ContrapartidaItem {
  id: string;
  meta: string;
  descricao: string;
  tipo: ContrapartidaTipo;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
}

export type ChangeNature = 'Radical' | 'Adaptação' | 'Exclusão';

export interface Risk {
  id: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  severity: number;
  responseStrategy: string;
  responsible: string;
  status: RiskStatus;
  /** Meta (Goal) à qual o risco está vinculado — obrigatório nos novos registros. */
  goalId?: string;
  /** Etapa da meta em que o risco foi identificado. */
  stage?: string;
  /** Especificação/métrica da etapa (números e resultados esperados). */
  spec?: string;
}

export interface Change {
  id: string;
  description: string;
  type: ChangeType;
  date: string;
  justification: string;
  approval: ApprovalStatus;
  responsible: string;
  /** Meta (Goal) à qual a mudança está vinculada — obrigatório nos novos registros. */
  goalId?: string;
  /** Natureza da mudança em relação à meta. */
  nature?: ChangeNature;
}

export interface Evidence {
  id: string;
  name: string;
  type: 'PDF' | 'Imagem' | 'Vídeo' | 'Link' | 'Documento';
  relatedActivity: string;
  uploadDate: string;
  size: string;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  coordinator: string;
  team: string[];
  financier: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  budgetApproved: number;
  budgetExecuted: number;
  riskLevel: RiskLevel;
  goals: Goal[];
  financialItems: FinancialItem[];
  contrapartidas: ContrapartidaItem[];
  risks: Risk[];
  changes: Change[];
  evidences: Evidence[];
}

// -----------------------------------------------------------------------------
// Derivados usados pelo Dashboard e demais telas.
// Os dados reais dos 20 Planos de Trabalho vêm de src/app/data/inovaProjetos.ts
// (mesclado com metasProjetos.ts/riscosProjetos.ts em store.tsx) — computeKpi/
// buildKpi são chamados com essa lista real, vinda do Supabase.
// -----------------------------------------------------------------------------

function computeKpi(list: Project[]) {
  const cadastrados = list.filter(p => p.name && !p.name.includes('a cadastrar'));
  const base = cadastrados.length > 0 ? cadastrados : list;
  return {
    totalProjects: list.length,
    cadastrados: cadastrados.length,
    inProgress: list.filter(p => p.status === 'Em andamento').length,
    concluded: list.filter(p => p.status === 'Concluído').length,
    delayed: list.filter(p => p.status === 'Atrasado').length,
    notStarted: list.filter(p => p.status === 'Não iniciado').length,
    avgProgress: list.length ? Math.round(base.reduce((a, p) => a + p.progress, 0) / base.length) : 0,
    totalBudget: list.reduce((a, p) => a + p.budgetApproved, 0),
    totalExecuted: list.reduce((a, p) => a + p.budgetExecuted, 0),
    criticalRisks: list.reduce((a, p) => a + p.risks.filter(r => r.severity >= 15).length, 0),
    pendingChanges: list.reduce((a, p) => a + p.changes.filter(c => c.approval === 'Pendente').length, 0),
  };
}

export function buildKpi(list: Project[]) {
  return computeKpi(list);
}

