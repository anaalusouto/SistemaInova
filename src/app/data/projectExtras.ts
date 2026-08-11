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

export type MetaNodeKind = 'meta' | 'etapa' | 'especializacao';

/** Registro imutável de "de X para Y" nas metas/etapas/especializações. */
export interface MetaChangeLog {
  id: number;
  kind: MetaNodeKind;
  targetId: number;
  targetPath: string;   // ex.: "Meta 1 › Etapa 2"
  field: string;        // "nome", "status", ...
  from: string;
  to: string;
  author: string;
  authorRole: string;
  date: string;         // ISO
  approvedBy?: string | null;
}

/** Solicitação de alteração feita por estagiário, aguardando validação de admin. */
export interface PendingApproval {
  id: number;
  kind: MetaNodeKind;
  targetId: number;
  targetPath: string;
  field: string;
  from: string;
  to: string;
  author: string;
  authorRole: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  reviewedBy?: string | null;
}
