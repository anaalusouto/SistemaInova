/** Tipos complementares dos projetos: contatos, registro de alterações e aprovações. */

export interface Contact {
  id: string;
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

/** Valor serializável (JSON) — usado no payload de criação, que atravessa server functions. */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export interface ProjectOp {
  entity: OpEntity;
  action: OpAction;
  /** id do item alvo (editar/excluir) */
  targetId?: string;
  /** id do pai: meta (para etapa) ou etapa (para especificação) */
  parentId?: string;
  /** caminho legível, ex.: "Meta 1 › Etapa 1.2" */
  targetPath: string;
  field?: string;
  from?: string;
  to?: string;
  /** dados para criação */
  payload?: Record<string, JsonValue>;
}

/** Registro imutável de "de X para Y". */
export interface MetaChangeLog extends ProjectOp {
  id: string;
  author: string;
  authorRole: string;
  date: string;         // ISO
  approvedBy?: string | null;
  /** legado */
  kind?: MetaNodeKind;
}

/** Solicitação feita por estagiário, aguardando validação de admin. */
export interface PendingApproval extends ProjectOp {
  id: string;
  author: string;
  authorRole: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  reviewedBy?: string | null;
  /** legado */
  kind?: MetaNodeKind;
}

/** Meio de comunicação usado no contato com a instituição. */
export type CommMeio = 'Ligação' | 'Meet (video chamada)' | 'Whatsapp (msg)' | 'E-mail' | 'Presencial' | 'Outro';
export const COMM_MEIOS: CommMeio[] = ['Ligação', 'Meet (video chamada)', 'Whatsapp (msg)', 'E-mail', 'Presencial', 'Outro'];

/** Linha do registro de comunicação (área de Contatos de cada projeto). */
export interface CommLog {
  id: string;
  data: string;          // YYYY-MM-DD
  hora: string;          // HH:MM
  instituicao: string;
  representante: string;
  meio: CommMeio | string;
  quemRealizou: string;
  registro: string;      // Registro de comunicação
  saida: string;         // Encaminhamento / saída
}
