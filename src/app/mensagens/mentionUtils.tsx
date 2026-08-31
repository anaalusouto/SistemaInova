import { Hash, CheckSquare, User } from 'lucide-react';
import type { ProjectExt } from '../store';

export interface MentionOption {
  kind: 'proj' | 'tarefa' | 'pessoa';
  id: string;
  label: string;
  /** Ausente para pessoas — elas não abrem projeto ao clicar no chip. */
  projectId?: number;
  sublabel?: string;
}

export interface MentionPerson {
  login: string;
  name: string;
}

/** Todos os projetos, tarefas (atividades) e pessoas disponíveis pra referenciar com @. */
export function buildMentionOptions(projects: ProjectExt[], pessoas: MentionPerson[] = []): MentionOption[] {
  const options: MentionOption[] = [];
  for (const p of projects) {
    options.push({ kind: 'proj', id: String(p.id), label: p.name, projectId: p.id, sublabel: p.code });
    for (const g of p.goals ?? []) {
      for (const d of g.deliverables ?? []) {
        for (const a of d.activities ?? []) {
          options.push({ kind: 'tarefa', id: a.id, label: a.name, projectId: p.id, sublabel: `${p.code} · ${p.name}` });
        }
      }
    }
  }
  for (const pessoa of pessoas) {
    options.push({ kind: 'pessoa', id: pessoa.login, label: pessoa.name, sublabel: 'Mencionar pessoa' });
  }
  return options;
}

export function searchMentionOptions(options: MentionOption[], query: string, limit = 8): MentionOption[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter(o => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q))
    : options;
  return filtered.slice(0, limit);
}

export function mentionToken(o: MentionOption): string {
  return `@[${o.label}](${o.kind}:${o.id})`;
}

/**
 * Se o cursor estiver em uma menção "@algo" sendo digitada, retorna onde ela começa e o texto
 * já digitado depois do @. Nomes de projeto/tarefa têm espaços (às vezes até parênteses), então
 * só encerramos a menção em quebra de linha, texto muito longo, ou ao cruzar um token já inserido
 * — reconhecido pela sequência "](" que só aparece em @[Nome](kind:id).
 */
export function getMentionQuery(value: string, cursor: number): { start: number; query: string } | null {
  const upTo = value.slice(0, cursor);
  const at = upTo.lastIndexOf('@');
  if (at === -1) return null;
  const between = upTo.slice(at + 1);
  if (between.includes('\n') || between.includes('](') || between.length > 60) return null;
  return { start: at, query: between };
}

const MENTION_RE = /@\[([^\]]*)\]\((proj|tarefa|pessoa):([^)]+)\)/g;

/** Renderiza o texto da mensagem trocando os tokens @[Nome](kind:id) por chips clicáveis. */
export function renderMessageText(
  texto: string,
  options: MentionOption[],
  onNavigateProject: (projectId: number) => void,
) {
  const byKindId = new Map(options.map(o => [`${o.kind}:${o.id}`, o]));
  const parts: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  const re = new RegExp(MENTION_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (m.index > last) parts.push(texto.slice(last, m.index));
    const [, label, kind, id] = m as unknown as [string, string, 'proj' | 'tarefa' | 'pessoa', string];
    const resolved = byKindId.get(`${kind}:${id}`);
    const displayLabel = resolved?.label ?? label;
    const projectId = resolved?.projectId ?? (kind === 'proj' ? Number(id) : undefined);
    const Icon = kind === 'proj' ? Hash : kind === 'pessoa' ? User : CheckSquare;
    const title = kind === 'proj' ? 'Abrir projeto' : kind === 'pessoa' ? 'Pessoa mencionada — recebeu uma notificação' : 'Abrir projeto da tarefa';
    parts.push(
      <button
        key={`mention-${key++}`}
        type="button"
        onClick={() => { if (projectId != null && !Number.isNaN(projectId)) onNavigateProject(projectId); }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.8em] font-medium align-baseline"
        style={{
          background: kind === 'pessoa' ? 'var(--warning-soft)' : 'var(--brand-soft)',
          color: kind === 'pessoa' ? 'var(--warning-strong-text)' : 'var(--brand)',
          cursor: projectId != null ? 'pointer' : 'default',
        }}
        title={title}
      >
        <Icon size={11} />
        {displayLabel}
      </button>,
    );
    last = m.index + m[0].length;
  }
  if (last < texto.length) parts.push(texto.slice(last));
  return parts;
}

/** Versão em texto puro (sem chips) — troca @[Nome](kind:id) por @Nome. Usado em contextos
 * fora do mural, como a citação da mensagem original na Agenda. */
export function mentionTextOnly(texto: string): string {
  return texto.replace(MENTION_RE, (_m, label) => `@${label}`);
}

/**
 * Logins de todas as pessoas mencionadas na mensagem, com ou sem tarefa junto — ao
 * contrário de extractAssignments (que só entra em ação quando tarefa+pessoa aparecem
 * juntas), qualquer @menção de pessoa conta aqui. Usado pra notificar quem foi citado
 * (ver useMentionToasts).
 */
export function extractMentionedLogins(texto: string): string[] {
  const logins = new Set<string>();
  const re = new RegExp(MENTION_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const [, , kind, id] = m as unknown as [string, string, 'proj' | 'tarefa' | 'pessoa', string];
    if (kind === 'pessoa') logins.add(id);
  }
  return [...logins];
}

export interface ExtractedAssignment {
  atividadeId: string;
  pessoaLogin: string;
  pessoaNome: string;
}

/**
 * Se a mensagem menciona ao menos uma tarefa e ao menos uma pessoa, considera isso
 * uma atribuição: gera um vínculo pra cada combinação tarefa×pessoa mencionada
 * (até 20 combinações, pra evitar um fan-out acidental gigante).
 */
export function extractAssignments(texto: string, options: MentionOption[]): ExtractedAssignment[] {
  const byKindId = new Map(options.map(o => [`${o.kind}:${o.id}`, o]));
  const tarefaIds = new Set<string>();
  const pessoas = new Map<string, string>();
  const re = new RegExp(MENTION_RE);
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const [, label, kind, id] = m as unknown as [string, string, 'proj' | 'tarefa' | 'pessoa', string];
    if (kind === 'tarefa' && byKindId.has(`tarefa:${id}`)) tarefaIds.add(id);
    if (kind === 'pessoa') pessoas.set(id, byKindId.get(`pessoa:${id}`)?.label ?? label);
  }
  if (tarefaIds.size === 0 || pessoas.size === 0) return [];
  const out: ExtractedAssignment[] = [];
  for (const atividadeId of tarefaIds) {
    for (const [pessoaLogin, pessoaNome] of pessoas) {
      out.push({ atividadeId, pessoaLogin, pessoaNome });
      if (out.length >= 20) return out;
    }
  }
  return out;
}
