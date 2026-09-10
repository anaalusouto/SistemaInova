import { useMemo, useState, type FormEvent, type ReactNode, type DragEvent } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, usePeople } from '../auth/authStore';
import { useStore } from '../store';
import { useGestaoTarefas } from '../gestao/useGestaoTarefas';
import type { TarefaGestao, TarefaGestaoStatus } from '../tarefasGestao.server';

const STATUS_LABEL: Record<TarefaGestaoStatus, string> = {
  nao_iniciado: 'Não iniciado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
};

function isOverdue(t: TarefaGestao): boolean {
  if (t.status === 'concluido') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${t.dataLimite}T00:00:00`) < today;
}

function cardVisual(t: TarefaGestao) {
  if (t.status === 'concluido') {
    return { label: 'Concluída', color: 'var(--success)', bg: 'var(--success-soft)', border: 'var(--success-soft-border)' };
  }
  if (isOverdue(t)) {
    return { label: 'Atrasada', color: 'var(--danger)', bg: 'var(--danger-soft)', border: 'var(--danger-soft-border)' };
  }
  if (t.status === 'em_andamento') {
    return { label: 'Em andamento', color: 'var(--warning)', bg: 'var(--warning-soft)', border: 'var(--warning-soft-border)' };
  }
  return { label: 'Não iniciado', color: 'var(--ink-4)', bg: 'var(--surface-2)', border: 'var(--line-2)' };
}

function priorityVisual(c: number) {
  if (c >= 8) return { color: 'var(--danger)', bg: 'var(--danger-soft)' };
  if (c >= 4) return { color: 'var(--warning)', bg: 'var(--warning-soft)' };
  return { color: 'var(--ink-4)', bg: 'var(--surface-2)' };
}

const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('pt-BR');
const todayIso = () => new Date().toISOString().slice(0, 10);

type FormState =
  | { mode: 'create'; defaultLogin?: string }
  | { mode: 'edit'; task: TarefaGestao };

export function GestaoPage() {
  const { user } = useAuth();
  const allPeople = usePeople();
  const people = useMemo(() => allPeople.filter(p => p.role === 'admin' || p.role === 'estagiario'), [allPeople]);
  const { projects } = useStore();
  const { tarefas, loading, create, edit, move, setStatus, remove } = useGestaoTarefas();

  const [formState, setFormState] = useState<FormState | null>(null);
  const [dragOverLogin, setDragOverLogin] = useState<string | null>(null);

  const byLogin = useMemo(() => {
    const map = new Map<string, TarefaGestao[]>();
    for (const t of tarefas) {
      const arr = map.get(t.atribuidoParaLogin) ?? [];
      arr.push(t);
      map.set(t.atribuidoParaLogin, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => b.criticidade - a.criticidade || a.dataLimite.localeCompare(b.dataLimite));
    }
    return map;
  }, [tarefas]);

  const handleDrop = async (login: string, name: string, e: DragEvent) => {
    e.preventDefault();
    setDragOverLogin(null);
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;
    const task = tarefas.find(t => t.id === id);
    if (!task || task.atribuidoParaLogin === login) return;
    try {
      await move(id, login, name);
      toast.success(`Tarefa movida para ${name}.`);
    } catch {
      toast.error('Não foi possível mover a tarefa.');
    }
  };

  const handleDelete = async (t: TarefaGestao) => {
    if (!window.confirm(`Excluir a tarefa "${t.titulo}"?`)) return;
    try {
      await remove(t.id);
      toast.success('Tarefa excluída.');
    } catch {
      toast.error('Não foi possível excluir a tarefa.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-7 h-full">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)' }}>
            Gestão Interna
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
            Quadro de tarefas por pessoa — arraste um card ou use o seletor para reatribuir.
          </p>
        </div>
        <button
          onClick={() => setFormState({ mode: 'create' })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-white flex-shrink-0"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={13} /> Nova tarefa
        </button>
      </div>

      {people.length === 0 ? (
        <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--ink-5)', fontSize: '0.85rem' }}>
          Nenhum estagiário ou administrador cadastrado ainda.
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-2">
          {people.map(person => {
            const list = byLogin.get(person.login) ?? [];
            const isOver = dragOverLogin === person.login;
            return (
              <div
                key={person.login}
                onDragOver={e => { e.preventDefault(); setDragOverLogin(person.login); }}
                onDragLeave={() => setDragOverLogin(prev => (prev === person.login ? null : prev))}
                onDrop={e => handleDrop(person.login, person.name, e)}
                className="flex flex-col flex-shrink-0 rounded-xl border"
                style={{
                  width: 280,
                  borderColor: isOver ? 'var(--brand)' : 'var(--border)',
                  background: isOver ? 'var(--brand-soft)' : 'var(--surface-1)',
                  transition: 'background 120ms, border-color 120ms',
                }}
              >
                <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
                      style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}
                    >
                      {person.name.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="truncate" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-1)' }}>{person.name}</span>
                  </div>
                  <span
                    className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'var(--surface-2)', color: 'var(--ink-4)' }}
                  >
                    {list.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 p-2.5 overflow-y-auto" style={{ minHeight: 120 }}>
                  {list.length === 0 && (
                    <p className="text-center py-4" style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
                      {loading ? 'Carregando…' : 'Nenhuma tarefa'}
                    </p>
                  )}
                  {list.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      people={people}
                      onEdit={() => setFormState({ mode: 'edit', task: t })}
                      onDelete={() => handleDelete(t)}
                      onMove={(login, name) => move(t.id, login, name)}
                      onStatus={s => setStatus(t.id, s)}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setFormState({ mode: 'create', defaultLogin: person.login })}
                  className="flex items-center justify-center gap-1.5 py-2 text-[11px] border-t hover:bg-black/5 flex-shrink-0"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-4)' }}
                >
                  <Plus size={11} /> Adicionar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {formState && (
        <TaskForm
          people={people}
          projects={projects}
          currentUser={user}
          initial={formState.mode === 'edit' ? formState.task : undefined}
          defaultLogin={formState.mode === 'create' ? formState.defaultLogin : undefined}
          onClose={() => setFormState(null)}
          onCreate={create}
          onEdit={edit}
        />
      )}
    </div>
  );
}

interface CardPerson { login: string; name: string }

function TaskCard({ task, people, onEdit, onDelete, onMove, onStatus }: {
  task: TarefaGestao;
  people: CardPerson[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (login: string, name: string) => void;
  onStatus: (status: TarefaGestaoStatus) => void;
}) {
  const visual = cardVisual(task);
  const pv = priorityVisual(task.criticidade);

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('text/plain', task.id)}
      className="rounded-lg border p-2.5 flex flex-col gap-2 cursor-grab active:cursor-grabbing"
      style={{ borderColor: visual.border, background: 'var(--surface-0)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onEdit} className="text-left flex-1 min-w-0">
          <span className="block" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.3 }}>{task.titulo}</span>
        </button>
        <button type="button" onClick={onDelete} className="flex-shrink-0 p-0.5 rounded hover:bg-red-50" title="Excluir tarefa">
          <Trash2 size={12} color="var(--ink-5)" />
        </button>
      </div>

      {task.projetos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.projetos.map(p => (
            <span
              key={p.id}
              className="px-1.5 py-0.5 rounded text-[9.5px] font-medium"
              style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}
              title={p.nome}
            >
              {p.code}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold"
          style={{ background: visual.bg, color: visual.color, border: `1px solid ${visual.border}` }}
        >
          {visual.label}
        </span>
        <span
          className="px-1.5 py-0.5 rounded-full text-[9.5px] font-semibold"
          style={{ background: pv.bg, color: pv.color }}
          title="Criticidade (0-10)"
        >
          P{task.criticidade}
        </span>
      </div>

      <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>
        {fmtDate(task.dataEntrada)} → {fmtDate(task.dataLimite)}
      </div>
      <div className="truncate" style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>
        Atribuída por {task.atribuidoPorNome}
      </div>

      <div className="flex items-center gap-1.5">
        <select
          className="flex-1 min-w-0"
          style={{ fontSize: '0.68rem', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 4px', background: 'var(--surface-1)', color: 'var(--ink-2)' }}
          value={task.status}
          onChange={e => onStatus(e.target.value as TarefaGestaoStatus)}
        >
          {(Object.keys(STATUS_LABEL) as TarefaGestaoStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select
          className="flex-1 min-w-0"
          style={{ fontSize: '0.68rem', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 4px', background: 'var(--surface-1)', color: 'var(--ink-2)' }}
          value={task.atribuidoParaLogin}
          title="Mover para"
          onChange={e => {
            const p = people.find(pp => pp.login === e.target.value);
            if (p) onMove(p.login, p.name);
          }}
        >
          {people.map(p => <option key={p.login} value={p.login}>{p.name}</option>)}
        </select>
      </div>
    </div>
  );
}

interface FormProject { id: number; name: string; code: string }

function TaskForm({ people, projects, currentUser, initial, defaultLogin, onClose, onCreate, onEdit }: {
  people: CardPerson[];
  projects: FormProject[];
  currentUser: { login: string; displayName: string } | null;
  initial?: TarefaGestao;
  defaultLogin?: string;
  onClose: () => void;
  onCreate: (input: {
    titulo: string; atribuidoParaLogin: string; atribuidoParaNome: string;
    atribuidoPorLogin: string; atribuidoPorNome: string;
    dataEntrada: string; dataLimite: string; criticidade: number; projetoIds: number[];
  }) => Promise<void>;
  onEdit: (input: { id: string; titulo: string; dataEntrada: string; dataLimite: string; criticidade: number; projetoIds: number[] }) => Promise<void>;
}) {
  const isEdit = !!initial;
  const [titulo, setTitulo] = useState(initial?.titulo ?? '');
  const [atribuidoParaLogin, setAtribuidoParaLogin] = useState(initial?.atribuidoParaLogin ?? defaultLogin ?? people[0]?.login ?? '');
  const [dataEntrada, setDataEntrada] = useState(initial?.dataEntrada ?? todayIso());
  const [dataLimite, setDataLimite] = useState(initial?.dataLimite ?? todayIso());
  const [criticidade, setCriticidade] = useState(initial?.criticidade ?? 5);
  const [projetoIds, setProjetoIds] = useState<number[]>(initial?.projetos.map(p => p.id) ?? []);
  const [saving, setSaving] = useState(false);

  const toggleProjeto = (id: number) => setProjetoIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) { toast.error('Dê um título para a tarefa.'); return; }
    if (projetoIds.length === 0) { toast.error('Selecione ao menos um projeto.'); return; }
    if (dataLimite < dataEntrada) { toast.error('A data limite não pode ser antes da data de entrada.'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await onEdit({ id: initial!.id, titulo: titulo.trim(), dataEntrada, dataLimite, criticidade, projetoIds });
        toast.success('Tarefa atualizada.');
      } else {
        const person = people.find(p => p.login === atribuidoParaLogin);
        await onCreate({
          titulo: titulo.trim(),
          atribuidoParaLogin,
          atribuidoParaNome: person?.name ?? atribuidoParaLogin,
          atribuidoPorLogin: currentUser?.login ?? '—',
          atribuidoPorNome: currentUser?.displayName ?? '—',
          dataEntrada, dataLimite, criticidade, projetoIds,
        });
        toast.success('Tarefa criada.');
      }
      onClose();
    } catch {
      toast.error('Não foi possível salvar a tarefa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>{isEdit ? 'Editar tarefa' : 'Nova tarefa'}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Título *">
            <input className="ipt" value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus />
          </Field>

          {!isEdit && (
            <Field label="Atribuir para *">
              <select className="ipt" value={atribuidoParaLogin} onChange={e => setAtribuidoParaLogin(e.target.value)}>
                {people.map(p => <option key={p.login} value={p.login}>{p.name}</option>)}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de entrada *">
              <input type="date" className="ipt" value={dataEntrada} onChange={e => setDataEntrada(e.target.value)} />
            </Field>
            <Field label="Data limite *">
              <input type="date" className="ipt" value={dataLimite} onChange={e => setDataLimite(e.target.value)} />
            </Field>
          </div>

          <Field label={`Criticidade: ${criticidade}/10`}>
            <input
              type="range" min={0} max={10} value={criticidade}
              onChange={e => setCriticidade(Number(e.target.value))}
              className="w-full"
            />
          </Field>

          <Field label="Projeto(s) *">
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto rounded-lg border p-2" style={{ borderColor: 'var(--border)' }}>
              {projects.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>Nenhum projeto cadastrado.</span>}
              {projects.map(p => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.78rem', color: 'var(--ink-1)' }}>
                  <input type="checkbox" checked={projetoIds.includes(p.id)} onChange={() => toggleProjeto(p.id)} />
                  <span className="truncate flex-1">{p.name}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{p.code}</span>
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white disabled:opacity-60" style={{ background: 'var(--primary)' }}>
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>

        <style>{`.ipt{border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
.ipt:focus{border-color:var(--primary);background:var(--surface-0)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>{label}</span>
      {children}
    </label>
  );
}
