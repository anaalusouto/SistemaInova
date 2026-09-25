export type ProjectStatus = 'Em andamento' | 'Concluído' | 'Atrasado' | 'Não iniciado' | 'Suspenso';
export type RiskLevel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico' | '—';
// RN-009: exatamente três estados. 'Atrasado' não é estado armazenado —
// atraso é derivado do fim previsto contra a data corrente (RN-010), para
// não ficar preso num registro que já foi concluído depois.
export type ActivityStatus = 'A iniciar' | 'Em andamento' | 'Concluído';
export type ApprovalStatus = 'Aprovado' | 'Pendente' | 'Reprovado';
export type ChangeType = 'Escopo' | 'Prazo' | 'Financeiro' | 'Equipe' | 'Técnico';
export type RiskStatus = 'Aberto' | 'Em mitigação' | 'Monitorando' | 'Encerrado';

/** Vínculo orçamentário da atividade (RN-022) — trivalente de propósito:
 *  ausência de informação não é "Não". */
export type BudgetLink = 'Sim' | 'Não' | 'Não informado';

/** Tarefa (RF-025). Nesta entrega tem só título e vínculo com a atividade — a
 *  seção 17 do documento deixa responsável/datas/status como decisão pendente. */
export interface Task {
  id: string;
  title: string;
  order: number;
}

export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Activity {
  id: string;
  name: string;
  responsible: string;
  progress: number;
  status: ActivityStatus;
  observations: string;
  order: number;

  /** As quatro datas (RF-015), em 'AAAA-MM-DD'. Realizado só é preenchido
   *  quando a equipe PMO informa explicitamente — nunca derivado do previsto
   *  (RN-013). Use formatDateOnly() para exibir. */
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;

  /** Obrigatória quando há divergência entre previsto e realizado (RN-010). */
  delayJustification: string;
  budgetLink: BudgetLink;

  /** Ação a executar, distinta de observação (RF-005). */
  nextStep: string;
  nextStepOwner: string;
  nextStepDue: string | null;

  /** Preenchido quando a atividade é uma ação de resposta a risco (RN-020).
   *  Continua sendo atividade comum: entra na numeração e nas três visões. */
  riskOriginId?: string;

  tasks: Task[];
  attachment?: Attachment | null;

  /** Colunas TEXT legadas do schema de 3 níveis. Mantidas até que a leitura
   *  nova esteja validada em produção (ver migration 0011); não usar em código
   *  novo — prefira plannedEnd/actualStart/actualEnd. */
  plannedDate: string;
  startDate: string | null;
  conclusionDate: string | null;
}

/** Etapa — o nível que o schema chamava de "entrega" até a migration 0011. */
export interface Deliverable {
  id: string;
  name: string;
  expectedResult: string;
  activities: Activity[];
  order: number;

  /** Período próprio da etapa (RN-014): base dos limites de data da atividade
   *  (RN-015) e do intervalo calculado da meta (RN-017). */
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
}

export interface Goal {
  id: string;
  name: string;
  /** Etapas da meta. O nome do campo acompanha o tipo Deliverable e será
   *  renomeado junto com ele quando as abas antigas saírem. */
  deliverables: Deliverable[];
  order: number;
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
  /** Título curto do risco (RF-028) — obrigatório nos registros novos. */
  title: string;
  /** Etapa dona do risco (RF-027, RN-028). Obrigatório nos registros NOVOS;
   *  fica indefinido apenas em linhas legadas que a migration 0011 não
   *  conseguiu reconciliar sem ambiguidade. */
  stageId?: string;
  /** Especificação/resultado vinculado. */
  specification?: string;
  /** Meta (Goal) à qual o risco está vinculado — derivada da etapa nos novos. */
  goalId?: string;
  /** Nome da etapa em texto livre, só em registros legados. */
  stage?: string;
  /** @deprecated use `specification`. */
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

