/** Controle Interno: atividades macro (comuns a todos os projetos) e suas subtarefas. */

export type InternalStatus = 'Não iniciado' | 'Validação pendente' | 'No prazo' | 'Entregue' | 'Atrasado';

export const INTERNAL_STATUSES: InternalStatus[] = ['Não iniciado', 'Validação pendente', 'No prazo', 'Entregue', 'Atrasado'];

export const internalStatusColors: Record<InternalStatus, { bg: string; color: string }> = {
  'Não iniciado': { bg: '#F1F5F9', color: '#475569' },
  'Validação pendente': { bg: '#EFF6FF', color: '#2563EB' },
  'No prazo': { bg: '#FEFCE8', color: '#A16207' },
  'Entregue': { bg: '#ECFDF5', color: '#059669' },
  'Atrasado': { bg: '#FEF2F2', color: '#DC2626' },
};

export interface InternalSubtask {
  id: number;
  taskId: number;
  titulo: string;
  descricao?: string;
  inicio?: string;
  fim?: string;
  responsavel?: string;
  apoio?: string;
}

export interface InternalTask {
  id: number;
  titulo: string;
  descricao?: string;
}

/** Acompanhamento por subtarefa x projeto. Chave: `${subtaskId}:${projectId}`. */
export interface InternalTracking {
  status: InternalStatus;
  inicio?: string;
  fim?: string;
  responsavel?: string;
  observacao?: string;
}

export const internalTasksSeed: InternalTask[] = [
  { id: 1, titulo: 'Análise de riscos das metas e atividades dos planos de trabalho' },
  { id: 2, titulo: 'Avaliar demais parâmetros do plano de trabalho' },
  { id: 3, titulo: 'Verificar se as instituições atualizaram os planos de trabalho (reunião idv)' },
  { id: 4, titulo: 'Adicionar análises de risco do plano de trabalho à aba no sistema' },
  { id: 5, titulo: 'Realizar primeira reunião de alinhamento' },
  { id: 6, titulo: 'Validar informações cadastrais da instituição' },
  { id: 7, titulo: 'Identificar necessidades e prioridades da instituição pré-visita' },
  { id: 8, titulo: 'Consolidar informações preliminares' },
  { id: 9, titulo: 'Elaborar roteiro específico de cada visita' },
  { id: 10, titulo: 'Reservar hotéis e transportes de cada viagem' },
  { id: 11, titulo: 'Contratar seguro-viagem' },
  { id: 12, titulo: 'Alinhar procedimentos de atuação em campo' },
];

export const internalSubtasksSeed: InternalSubtask[] = [
  { id: 1, taskId: 1, titulo: 'Elencar os riscos do plano de trabalho', fim: '13/08/2026', responsavel: 'Equipe' },
  { id: 2, taskId: 2, titulo: 'Avaliar governança, equipe e financeiro', descricao: 'Para além da análise de riscos, quais são as avaliações dos planos de trabalho que devem ser feitas, como governança, equipe, financeiro', fim: '27/08/2026' },
  { id: 3, taskId: 3, titulo: 'Conferir atualização do plano na reunião IDV', fim: '14/08/2026', responsavel: 'Equipe' },
  { id: 4, taskId: 4, titulo: 'Lançar análises de risco na aba do sistema', fim: '14/08/2026', responsavel: 'Equipe + João Marcelo' },
  { id: 5, taskId: 5, titulo: 'Agendar e realizar a reunião de alinhamento', fim: '21/08/2026', responsavel: 'Equipe' },
  { id: 6, taskId: 6, titulo: 'Conferir dados cadastrais da instituição', fim: '21/08/2026', responsavel: 'CESUPA / Instituições' },
  { id: 7, taskId: 7, titulo: 'Levantar necessidades e prioridades pré-visita', fim: '21/08/2026', responsavel: 'CESUPA' },
  { id: 8, taskId: 8, titulo: 'Consolidar informações preliminares da instituição', fim: '12/08/2026', responsavel: 'Equipe' },
  { id: 9, taskId: 9, titulo: 'Montar roteiro da visita', fim: '17/08/2026', responsavel: 'Equipe', apoio: 'Coordenação' },
  { id: 10, taskId: 10, titulo: 'Reservar hospedagem e transporte' },
  { id: 11, taskId: 11, titulo: 'Contratar seguro-viagem' },
  { id: 12, taskId: 12, titulo: 'Alinhar procedimentos de atuação em campo', fim: '25/08/2026', responsavel: 'CESUPA' },
];
