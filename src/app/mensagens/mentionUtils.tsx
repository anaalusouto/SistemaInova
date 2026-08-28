import { Hash, CheckSquare } from 'lucide-react';
import type { ProjectExt } from '../store';

export interface MentionOption {
  kind: 'proj' | 'tarefa';
  id: string;
  label: string;
  projectId: number;
  sublabel?: string;
}

/** Todos os projetos e tarefas (atividades) disponíveis pra referenciar com @. */
export function buildMentionOptions(projects: ProjectExt[]): MentionOption[] {
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

const MENTION_RE = /@\[([^\]]*)\]\((proj|tarefa):([^)]+)\)/g;

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
    const [, label, kind, id] = m as unknown as [string, string, 'proj' | 'tarefa', string];
    const resolved = byKindId.get(`${kind}:${id}`);
    const displayLabel = resolved?.label ?? label;
    const projectId = resolved?.projectId ?? (kind === 'proj' ? Number(id) : undefined);
    const Icon = kind === 'proj' ? Hash : CheckSquare;
    parts.push(
      <button
        key={`mention-${key++}`}
        type="button"
        onClick={() => { if (projectId != null && !Number.isNaN(projectId)) onNavigateProject(projectId); }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.8em] font-medium align-baseline"
        style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
        title={kind === 'proj' ? 'Abrir projeto' : 'Abrir projeto da tarefa'}
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
