/** Tipos complementares dos projetos: contatos, registro de alterações e aprovações. */

export interface Contact {
  id: number;
  name: string;
  role: string;
  org: string;
  phone: string;
  email: string;
  notes: string;
}

/** Entidade alvo de uma operação sujeita a registro/validação. */
export type OpEntity = 'meta' | 'etapa' | 'especificacao' | 'risco' | 'mudanca' | 'financeiro';
export type OpAction = 'criar' | 'editar' | 'excluir';

/** Compat: kinds antigos usados no monitoramento de metas. */
export type MetaNodeKind = 'meta' | 'etapa' | 'especializacao' | 'especificacao';

export interface ProjectOp {
  entity: OpEntity;
  action: OpAction;
  /** id do item alvo (editar/excluir) */
  targetId?: number;
  /** id do pai: meta (para etapa) ou etapa (para especificação) */
  parentId?: number;
  /** caminho legível, ex.: "Meta 1 › Etapa 1.2" */
  targetPath: string;
  field?: string;
  from?: string;
  to?: string;
  /** dados para criação */
  payload?: Record<string, unknown>;
}

/** Registro imutável de "de X para Y". */
export interface MetaChangeLog extends ProjectOp {
  id: number;
  author: string;
  authorRole: string;
  date: string;         // ISO
  approvedBy?: string | null;
  /** legado */
  kind?: MetaNodeKind;
}

/** Solicitação feita por estagiário, aguardando validação de admin. */
export interface PendingApproval extends ProjectOp {
  id: number;
  author: string;
  authorRole: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  reviewedBy?: string | null;
  /** legado */
  kind?: MetaNodeKind;
}
