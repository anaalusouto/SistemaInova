import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Plus, Trash2, Search, ListChecks } from 'lucide-react';
import { useStore } from '../store';
import { useAuth, APP_PEOPLE } from '../auth/authStore';
import { INTERNAL_STATUSES, internalStatusColors, type InternalStatus, type InternalSubtask } from '../data/controleInterno';

interface Props {
  /** Quando informado, a página mostra apenas o acompanhamento desse projeto. */
  projectId?: number;
  embedded?: boolean;
}

export function ControleInternoPage({ projectId, embedded }: Props) {
  const {
    projects, internalTasks, internalSubtasks, internalTracking,
    addInternalTask, updateInternalTask, deleteInternalTask,
    addInternalSubtask, updateInternalSubtask, deleteInternalSubtask,
    setInternalTracking,
  } = useStore();
  const { isAdmin } = useAuth();

  const [filterProject, setFilterProject] = useState<number | 'all'>(projectId ?? 'all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<number[]>([]);

  const activeProject = projectId ?? (filterProject === 'all' ? null : filterProject);
  const scopeProjects = activeProject != null ? projects.filter(p => p.id === activeProject) : projects;

  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const tasks = useMemo(() => {
    if (!search) return internalTasks;
    const q = norm(search);
    return internalTasks.filter(t =>
      norm(t.titulo).includes(q) ||
      internalSubtasks.some(s => s.taskId === t.id && norm(s.titulo).includes(q)));
  }, [internalTasks, internalSubtasks, search]);

  const track = (sid: number, pid: number) => internalTracking[`${sid}:${pid}`] ?? { status: 'Não iniciado' as InternalStatus };

  const taskProgress = (taskId: number) => {
    const subs = internalSubtasks.filter(s => s.taskId === taskId);
    const total = subs.length * scopeProjects.length;
    if (!total) return 0;
    const done = subs.reduce((acc, s) =>
      acc + scopeProjects.filter(p => track(s.id, p.id).status === 'Entregue').length, 0);
    return Math.round((done / total) * 100);
  };

  const toggle = (id: number) => setOpen(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto">
        {!embedded && (
          <div className="mb-5">
            <h1 className="mb-1" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem' }}>Controle Interno</h1>
            <p className="text-sm text-muted-foreground">
              Atividades macro e subtarefas acompanhadas em todos os projetos
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar atividade ou subtarefa..."
              className="w-full pl-9 pr-3 py-2 rounded-md text-sm"
              style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }} />
          </div>
          {projectId == null && (
            <select value={String(filterProject)} onChange={e => setFilterProject(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)', background: '#fff' }}>
              <option value="all">Todos os projetos ({projects.length})</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.org ? `${p.org} · ` : ''}{p.name}</option>)}
            </select>
          )}
          {isAdmin && projectId == null && (
            <button
              onClick={() => {
                const titulo = window.prompt('Nova atividade macro:');
                if (titulo?.trim()) { addInternalTask(titulo.trim()); toast.success('Atividade criada.'); }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-md" style={{ background: 'var(--primary)' }}>
              <Plus size={13} /> Atividade
            </button>
          )}
        </div>

        <div className="space-y-3">
          {tasks.map(t => {
            const subs = internalSubtasks.filter(s => s.taskId === t.id);
            const isOpen = open.includes(t.id);
            const pct = taskProgress(t.id);
            return (
              <div key={t.id} className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="w-full flex items-center gap-3 px-4 py-3" style={{ background: '#ECFEFF' }}>
                  <button onClick={() => toggle(t.id)} className="flex items-center gap-2 flex-1 text-left min-w-0">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <ListChecks size={14} className="flex-shrink-0" style={{ color: '#0E7490' }} />
                    <span className="truncate" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.88rem' }}>{t.titulo}</span>
                    <span className="text-[11px] text-muted-foreground flex-shrink-0">{subs.length} subtarefa(s)</span>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-24 h-1.5 rounded-full" style={{ background: '#CBD5E1' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#0891B2' }} />
                    </div>
                    <span className="text-[11px] font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                    {isAdmin && projectId == null && (
                      <>
                        <button
                          onClick={() => {
                            const titulo = window.prompt('Renomear atividade:', t.titulo);
                            if (titulo?.trim()) updateInternalTask(t.id, { titulo: titulo.trim() });
                          }}
                          className="text-[11px] px-2 py-1 rounded" style={{ border: '1px solid var(--border)', background: '#fff' }}>Editar</button>
                        <button onClick={() => { if (confirm('Excluir esta atividade e suas subtarefas?')) { deleteInternalTask(t.id); toast.success('Atividade excluída.'); } }}
                          className="p-1 rounded hover:bg-red-50"><Trash2 size={13} className="text-red-500" /></button>
                      </>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="p-4 space-y-4">
                    {subs.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma subtarefa cadastrada.</p>}
                    {subs.map(s => (
                      <SubtaskBlock
                        key={s.id}
                        subtask={s}
                        projects={scopeProjects}
                        track={track}
                        onTrack={setInternalTracking}
                        isAdmin={isAdmin}
                        singleProject={activeProject != null}
                        onEdit={patch => updateInternalSubtask(s.id, patch)}
                        onDelete={() => { deleteInternalSubtask(s.id); toast.success('Subtarefa excluída.'); }}
                      />
                    ))}
                    {isAdmin && projectId == null && (
                      <button
                        onClick={() => {
                          const titulo = window.prompt('Nova subtarefa:');
                          if (titulo?.trim()) { addInternalSubtask(t.id, { titulo: titulo.trim() }); toast.success('Subtarefa criada.'); }
                        }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md" style={{ border: '1px solid var(--border)', color: '#475569' }}>
                        <Plus size={12} /> Adicionar subtarefa
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SubtaskBlock({ subtask, projects, track, onTrack, isAdmin, singleProject, onEdit, onDelete }: {
  subtask: InternalSubtask;
  projects: { id: number; name: string; org?: string }[];
  track: (sid: number, pid: number) => { status: InternalStatus; inicio?: string; fim?: string; responsavel?: string; observacao?: string };
  onTrack: (sid: number, pid: number, patch: Partial<{ status: InternalStatus; inicio: string; fim: string; responsavel: string; observacao: string }>) => void;
  isAdmin: boolean;
  singleProject: boolean;
  onEdit: (patch: Partial<InternalSubtask>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(singleProject);
  const done = projects.filter(p => track(subtask.id, p.id).status === 'Entregue').length;

  return (
    <div className="rounded-lg" style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3 px-3 py-2" style={{ background: '#F8FAFC' }}>
        <button onClick={() => setExpanded(v => !v)} className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="text-[13px] font-medium">{subtask.titulo}</span>
            <span className="text-[11px] text-muted-foreground">{done}/{projects.length} entregues</span>
          </div>
          {subtask.descricao && <p className="text-[11px] text-muted-foreground mt-1 pl-5">{subtask.descricao}</p>}
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-1 pl-5">
            {subtask.inicio && <span>Início: {subtask.inicio}</span>}
            {subtask.fim && <span>Prazo: {subtask.fim}</span>}
            {subtask.responsavel && <span>Responsável: {subtask.responsavel}</span>}
            {subtask.apoio && <span>Apoio: {subtask.apoio}</span>}
          </div>
        </button>
        {isAdmin && !singleProject && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => {
                const titulo = window.prompt('Título da subtarefa:', subtask.titulo);
                if (titulo == null) return;
                const fim = window.prompt('Prazo (DD/MM/AAAA):', subtask.fim ?? '') ?? subtask.fim;
                const responsavel = window.prompt('Responsável:', subtask.responsavel ?? '') ?? subtask.responsavel;
                onEdit({ titulo: titulo.trim() || subtask.titulo, fim: fim ?? undefined, responsavel: responsavel ?? undefined });
              }}
              className="text-[11px] px-2 py-1 rounded" style={{ border: '1px solid var(--border)', background: '#fff' }}>Editar</button>
            <button onClick={() => { if (confirm('Excluir subtarefa?')) onDelete(); }} className="p-1 rounded hover:bg-red-50">
              <Trash2 size={12} className="text-red-500" />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: '#fff', borderTop: '1px solid var(--border)' }}>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B' }}>Projeto / Comunidade</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B', width: 150 }}>Status</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B', width: 130 }}>Prazo</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B', width: 160 }}>Responsável</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B' }}>Observação</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const t = track(subtask.id, p.id);
                const c = internalStatusColors[t.status];
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-3 py-1.5">
                      {p.org && <span className="text-[10px] font-bold mr-1.5" style={{ color: '#1D4ED8' }}>{p.org}</span>}
                      <span>{p.name}</span>
                    </td>
                    <td className="px-3 py-1.5">
                      <select value={t.status} onChange={e => onTrack(subtask.id, p.id, { status: e.target.value as InternalStatus })}
                        className="w-full text-[11px] px-2 py-1 rounded font-medium"
                        style={{ background: c.bg, color: c.color, border: '1px solid var(--border)' }}>
                        {INTERNAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input value={t.fim ?? subtask.fim ?? ''} onChange={e => onTrack(subtask.id, p.id, { fim: e.target.value })}
                        placeholder="DD/MM/AAAA" className="w-full text-[11px] px-2 py-1 rounded"
                        style={{ border: '1px solid var(--border)' }} />
                    </td>
                    <td className="px-3 py-1.5">
                      <select value={t.responsavel ?? subtask.responsavel ?? ''} onChange={e => onTrack(subtask.id, p.id, { responsavel: e.target.value })}
                        className="w-full text-[11px] px-2 py-1 rounded"
                        style={{ border: '1px solid var(--border)', background: '#fff' }}>
                        <option value="">—</option>
                        {APP_PEOPLE.map(pe => <option key={pe.login} value={pe.name}>{pe.name}</option>)}
                        {t.responsavel && !APP_PEOPLE.some(pe => pe.name === t.responsavel) && (
                          <option value={t.responsavel}>{t.responsavel}</option>
                        )}
                      </select>
                    </td>
                    <td className="px-3 py-1.5">
                      <input value={t.observacao ?? ''} onChange={e => onTrack(subtask.id, p.id, { observacao: e.target.value })}
                        placeholder="—" className="w-full text-[11px] px-2 py-1 rounded"
                        style={{ border: '1px solid var(--border)' }} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
