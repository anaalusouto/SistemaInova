import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, X, ChevronDown, MessageSquare, Link2, GanttChart, Search, ListChecks } from 'lucide-react';
import { useStore } from '../store';
import { useAuth, APP_PEOPLE } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';
import { ganttStatusColors, type GanttActivity, type GanttStatus } from '../data/cronogramaExecutivo';
import { INTERNAL_STATUSES, internalStatusColors } from '../data/controleInterno';

const STATUS_LIST: GanttStatus[] = INTERNAL_STATUSES;

const fmtDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const br = (s: string) => (s ? new Date(`${s}T00:00:00`).toLocaleDateString('pt-BR') : '—');

interface Props {
  /** Quando informado, o acompanhamento é restrito a esse projeto. */
  projectId?: number;
}

export function CronogramaExecutivoTab({ projectId }: Props) {
  const {
    projects, gantt, ganttTracking, setGanttTracking,
    updateGanttEntrega, updateGanttAtividade,
    addGanttAtividade, addGanttSubatividade, deleteGanttAtividade, restoreGanttAtividade,
  } = useStore();
  const { user, isAdmin } = useAuth();
  const { log } = useAudit();

  const [filterProject, setFilterProject] = useState<number | 'all'>(projectId ?? 'all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [openActivity, setOpenActivity] = useState<number | null>(null);
  const [showGantt, setShowGantt] = useState(false);
  const [editing, setEditing] = useState<{ kind: 'entrega' | 'atividade'; id: number } | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [novaAtividade, setNovaAtividade] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<number | null>(null);
  const [novaSub, setNovaSub] = useState('');

  const activeProject = projectId ?? (filterProject === 'all' ? null : filterProject);
  const scopeProjects = activeProject != null ? projects.filter(p => p.id === activeProject) : projects;

  const audit = (action: string, detail: string) =>
    log({ userLogin: user?.login ?? '—', area: 'cronograma executivo', action, detail });

  const track = (aid: number, pid: number) =>
    ganttTracking[`${aid}:${pid}`] ?? { status: 'Não iniciado' as GanttStatus };

  /** Projetos considerados no acompanhamento de uma atividade (vinculada = só o projeto atrelado). */
  const projectsFor = (a: GanttActivity) =>
    a.projetoId != null ? projects.filter(p => p.id === a.projetoId) : scopeProjects;

  /** Uma atividade pertence ao projeto quando está vinculada a ele (ou quando não há vínculo algum). */
  const belongsToProject = (a: GanttActivity, pid: number): boolean => {
    const links = [a.projetoId ?? null, ...(a.subatividades ?? []).map(s => s.projetoId ?? null)];
    if (links.every(l => l == null)) return true;
    return links.some(l => l === pid);
  };

  /** Progresso da atividade = % de projetos com a validação concluída (Entregue). */
  const activityProgress = (a: GanttActivity): number => {
    const subs = a.subatividades ?? [];
    if (subs.length) return Math.round(subs.reduce((s, x) => s + activityProgress(x), 0) / subs.length);
    const ps = projectsFor(a);
    if (!ps.length) return 0;
    const done = ps.filter(p => track(a.id, p.id).status === 'Entregue').length;
    return Math.round((done / ps.length) * 100);
  };
  const entregaProgress = (ats: GanttActivity[]) =>
    ats.length ? Math.round(ats.reduce((s, a) => s + activityProgress(a), 0) / ats.length) : 0;

  const projName = (pid?: number | null) => {
    if (pid == null) return null;
    const p = projects.find(x => x.id === pid);
    return p ? `${p.org ? `${p.org} · ` : ''}${p.name}` : null;
  };

  const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visibleGantt = useMemo(() => {
    const q = search.trim() ? norm(search) : null;
    const pid = activeProject;
    return gantt
      .map(b => ({
        ...b,
        entregas: b.entregas
          .map(en => ({
            ...en,
            atividades: en.atividades
              .filter(a => pid == null || belongsToProject(a, pid))
              .map(a => ({
                ...a,
                subatividades: (a.subatividades ?? []).filter(s =>
                  pid == null || s.projetoId == null || s.projetoId === pid),
              }))
              .filter(a => !q || norm(`${a.grupo ?? ''} ${a.atividade}`).includes(q)
                || (a.subatividades ?? []).some(s => norm(s.atividade).includes(q))),
          }))
          .filter(en => en.atividades.length || (q ? norm(en.entrega).includes(q) : false)),
      }))
      .filter(b => b.entregas.length || (q ? norm(b.bloco).includes(q) : false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gantt, search, activeProject]);


  // Linha do tempo (semanas) — recalculada sempre que as datas mudam
  const { minDate, maxDate, weeks } = useMemo(() => {
    let min = new Date('2100-01-01'); let max = new Date('1970-01-01');
    gantt.forEach(b => b.entregas.forEach(en => {
      [[en.inicio, en.fim], ...en.atividades.map(a => [a.inicio, a.fim])].forEach(([i, f]) => {
        if (!i || !f) return;
        const di = new Date(`${i}T00:00:00`); const df = new Date(`${f}T00:00:00`);
        if (di < min) min = di; if (df > max) max = df;
      });
    }));
    if (min > max) { min = new Date('2026-07-01'); max = new Date('2027-07-01'); }
    const start = new Date(min); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(max); end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
    const weekList: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) { weekList.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
    return { minDate: start, maxDate: end, weeks: weekList };
  }, [gantt]);

  const DAY_PX = 5;
  const totalDays = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / 86400000));
  const timelineWidth = showGantt ? totalDays * DAY_PX : 0;
  const LEFT_COL = showGantt ? 430 : 0;

  const pctPos = (dateStr: string) =>
    Math.round((new Date(`${dateStr}T00:00:00`).getTime() - minDate.getTime()) / 86400000) * DAY_PX;
  const barWidth = (ini: string, fim: string) =>
    Math.max(DAY_PX, (Math.round((new Date(`${fim}T00:00:00`).getTime() - new Date(`${ini}T00:00:00`).getTime()) / 86400000) + 1) * DAY_PX);

  const todayPx = (() => {
    const t = new Date();
    if (t < minDate || t > maxDate) return null;
    return Math.round((t.getTime() - minDate.getTime()) / 86400000) * DAY_PX;
  })();

  const toggle = (id: number) => setExpanded(prev => {
    const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n;
  });

  const kpis = useMemo(() => {
    const ats = gantt.flatMap(b => b.entregas.flatMap(e => e.atividades.flatMap(a => (a.subatividades?.length ? a.subatividades : [a]))));
    const prog = ats.length ? Math.round(ats.reduce((s, a) => s + activityProgress(a), 0) / ats.length) : 0;
    const concluidas = ats.filter(a => activityProgress(a) === 100).length;
    const atrasadas = ats.filter(a => a.fim && new Date(`${a.fim}T00:00:00`) < new Date() && activityProgress(a) < 100).length;
    return { entregas: gantt.flatMap(b => b.entregas).length, atividades: ats.length, concluidas, atrasadas, prog };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gantt, ganttTracking, scopeProjects]);

  const handleDelete = (a: GanttActivity) => {
    const removed = deleteGanttAtividade(a.id);
    if (!removed) return;
    audit('remover atividade', a.atividade);
    toast.error(`Removido: ${a.atividade}`, {
      duration: 6000,
      action: {
        label: 'Desfazer',
        onClick: () => { restoreGanttAtividade(removed.entregaId, removed.index, removed.atividade, removed.parentId); audit('desfazer remoção', a.atividade); },
      },
    });
  };

  const handleAdd = (entregaId: number) => {
    const nome = novaAtividade.trim();
    if (!nome) return;
    addGanttAtividade(entregaId, nome);
    audit('adicionar atividade', nome);
    toast.success('Atividade adicionada.');
    setNovaAtividade('');
    setAddingTo(null);
  };

  const handleAddSub = (atividadeId: number) => {
    const nome = novaSub.trim();
    if (!nome) return;
    addGanttSubatividade(atividadeId, nome);
    audit('adicionar subatividade', nome);
    toast.success('Subatividade adicionada.');
    setNovaSub('');
    setAddingSubTo(null);
  };

  const renderRow = (a: GanttActivity, depth: number) => {
    const subs = a.subatividades ?? [];
    const prog = activityProgress(a);
    const isTrackOpen = openActivity === a.id;
    const vinculo = projName(a.projetoId);
    return (
      <div key={a.id}>
        <div className="flex hover:bg-slate-50 group" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div className={`pr-3 py-1.5 flex items-start gap-2 ${showGantt ? 'shrink-0' : 'flex-1'}`}
            style={{ paddingLeft: 32 + depth * 20, width: showGantt ? LEFT_COL : undefined, borderRight: showGantt ? '1px solid var(--border)' : undefined }}>
            {!subs.length ? (
              <button onClick={() => setOpenActivity(isTrackOpen ? null : a.id)}
                title="Ver acompanhamento por projeto" className="mt-0.5 text-slate-400 hover:text-slate-700">
                <ListChecks size={12} />
              </button>
            ) : <span className="mt-0.5 text-slate-300"><ListChecks size={12} /></span>}
            <div className="flex-1 min-w-0">
              {a.grupo && <div className="text-[9px] uppercase tracking-wide text-slate-400 truncate">{a.grupo}</div>}
              <button onClick={() => setEditing({ kind: 'atividade', id: a.id })}
                className="text-[11px] text-left leading-tight text-slate-700 hover:text-primary block">
                {a.atividade}
              </button>
              <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
                {br(a.inicio)} → {br(a.fim)}{a.responsavel ? ` · ${a.responsavel}` : ''} · {prog}%
                {a.comentario && <MessageSquare size={10} className="text-slate-400" />}
                {vinculo && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium flex items-center gap-1"
                    style={{ background: '#EEF2FF', color: '#1D4ED8' }}>
                    <Link2 size={9} />{vinculo}
                  </span>
                )}
              </div>
              {isAdmin && depth === 0 && (
                addingSubTo === a.id ? (
                  <div className="flex items-center gap-1 mt-1.5">
                    <input autoFocus value={novaSub} onChange={e => setNovaSub(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddSub(a.id); if (e.key === 'Escape') { setAddingSubTo(null); setNovaSub(''); } }}
                      placeholder="Nome da subatividade"
                      className="flex-1 px-2 py-1 text-[11px] rounded" style={{ border: '1px solid var(--border)' }} />
                    <button onClick={() => handleAddSub(a.id)} className="text-[10px] px-2 py-1 rounded text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
                    <button onClick={() => { setAddingSubTo(null); setNovaSub(''); }} className="text-[10px] px-1.5 py-1 text-slate-500">Cancelar</button>
                  </div>
                ) : (
                  <button onClick={() => setAddingSubTo(a.id)}
                    className="mt-1 text-[10px] text-slate-500 hover:text-primary flex items-center gap-1">
                    <Plus size={10} /> Subatividade
                  </button>
                )
              )}
            </div>
            {isAdmin && projectId == null && (
              <button onClick={() => handleDelete(a)} title="Remover"
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 mt-0.5">
                <Trash2 size={12} />
              </button>
            )}
          </div>
          {showGantt && <div className="relative" style={{ width: timelineWidth, minHeight: 34 }}>
            {todayPx != null && <div className="absolute top-0 bottom-0" style={{ left: todayPx, width: 1, background: '#EF4444', opacity: 0.5 }} />}
            <GanttBar left={pctPos(a.inicio)} width={barWidth(a.inicio, a.fim)}
              color={ganttStatusColors[a.status]} progress={prog}
              label={`${br(a.inicio)} – ${br(a.fim)}`}
              onClick={() => setEditing({ kind: 'atividade', id: a.id })} />
          </div>}
        </div>

        {subs.map(s => renderRow(s, depth + 1))}

        {isTrackOpen && !subs.length && (
          <div className="flex" style={{ borderBottom: '1px solid var(--border)', background: '#FCFDFF' }}>
            <div className="px-3 py-3 sticky left-0" style={{ width: 'min(1100px, 100%)' }}>
              {a.descricao && <p className="text-[11px] text-muted-foreground mb-2">{a.descricao}</p>}
              <TrackingTable
                activityId={a.id}
                fallback={a}
                projects={projectsFor(a)}
                track={track}
                onTrack={(pid, p) => {
                  setGanttTracking(a.id, pid, p);
                  audit('acompanhamento', `${a.atividade} · projeto ${pid}`);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Entregas" value={kpis.entregas} color="#1A5C3A" />
        <Kpi label="Atividades" value={kpis.atividades} color="#0D6E8A" />
        <Kpi label="Validadas em todos" value={kpis.concluidas} color="#22C55E" />
        <Kpi label="Fora do prazo" value={kpis.atrasadas} color="#EF4444" />
        <Kpi label="Progresso" value={`${kpis.prog}%`} color="#7C3AED" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar entrega ou atividade..."
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
      </div>

      <div className="text-[11px] text-muted-foreground">
        O progresso de cada atividade vem da validação por projeto — só chega a 100% quando todos os projetos do escopo estão como “Entregue”.
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>
            <GanttChart size={14} className="inline mr-1.5" />Cronograma Executivo — INOVA SOCIOBIO II
          </h3>
          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            <button onClick={() => setShowGantt(v => !v)}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium"
              style={{ border: '1px solid var(--border)', background: showGantt ? 'var(--primary)' : '#fff', color: showGantt ? '#fff' : 'var(--foreground)' }}>
              <GanttChart size={11} className="inline mr-1" />{showGantt ? 'Ocultar Gantt' : 'Mostrar Gantt'}
            </button>
            {STATUS_LIST.map(s => (
              <span key={s} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: ganttStatusColors[s] }} />{s}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '72vh' }}>
          <div style={{ minWidth: showGantt ? LEFT_COL + timelineWidth : '100%' }}>
            {/* Cabeçalho da timeline */}
            <div className="sticky top-0 z-10 flex text-[10px]" style={{ background: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
              <div className={showGantt ? 'shrink-0 px-3 py-2 font-semibold' : 'flex-1 px-3 py-2 font-semibold'}
                style={{ width: showGantt ? LEFT_COL : undefined, borderRight: showGantt ? '1px solid var(--border)' : undefined }}>
                Bloco / Entrega / Atividade
              </div>
              {showGantt && <div className="relative" style={{ width: timelineWidth, height: 32 }}>
                {weeks.map((w, i) => (
                  <div key={i} className="absolute top-0 bottom-0 flex items-center pl-1 text-slate-500"
                    style={{ left: pctPos(fmtDate(w)), width: 7 * DAY_PX, borderLeft: '1px solid #E2E8F0' }}>
                    {i % 2 === 0 ? `${String(w.getDate()).padStart(2, '0')}/${String(w.getMonth() + 1).padStart(2, '0')}` : ''}
                  </div>
                ))}
              </div>}
            </div>

            {visibleGantt.map(b => (
              <div key={b.id}>
                <div className="flex" style={{ background: '#ECFEFF', borderBottom: '1px solid var(--border)' }}>
                  <div className={`px-3 py-2 text-xs font-bold text-slate-700 ${showGantt ? 'shrink-0' : 'flex-1'}`}
                    style={{ width: showGantt ? LEFT_COL : undefined, borderRight: showGantt ? '1px solid var(--border)' : undefined }}>
                    {b.bloco}
                  </div>
                  {showGantt && <div style={{ width: timelineWidth }} />}
                </div>

                {b.entregas.map(en => {
                  const isOpen = expanded.has(en.id);
                  const enProg = entregaProgress(en.atividades);
                  return (
                    <div key={en.id}>
                      <div className="flex hover:bg-slate-50" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className={`px-3 py-2 flex items-start gap-1.5 ${showGantt ? 'shrink-0' : 'flex-1'}`}
                          style={{ width: showGantt ? LEFT_COL : undefined, borderRight: showGantt ? '1px solid var(--border)' : undefined }}>
                          <button onClick={() => toggle(en.id)} className="mt-0.5 text-slate-400 hover:text-slate-700">
                            <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms' }} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <button onClick={() => setEditing({ kind: 'entrega', id: en.id })}
                              className="text-[12px] font-semibold text-left leading-tight text-slate-800 hover:text-primary block">
                              {en.entrega}
                            </button>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: ganttStatusColors[en.status] }} />
                              {br(en.inicio)} → {br(en.fim)} · {en.responsavel} · {enProg}%
                              {en.comentario && <MessageSquare size={10} className="text-slate-400" />}
                            </div>
                            {isAdmin && (
                              addingTo === en.id ? (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <input autoFocus value={novaAtividade} onChange={e => setNovaAtividade(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleAdd(en.id); if (e.key === 'Escape') { setAddingTo(null); setNovaAtividade(''); } }}
                                    placeholder="Nome da atividade"
                                    className="flex-1 px-2 py-1 text-[11px] rounded" style={{ border: '1px solid var(--border)' }} />
                                  <button onClick={() => handleAdd(en.id)} className="text-[10px] px-2 py-1 rounded text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
                                  <button onClick={() => { setAddingTo(null); setNovaAtividade(''); }} className="text-[10px] px-1.5 py-1 text-slate-500">Cancelar</button>
                                </div>
                              ) : (
                                <button onClick={() => { setAddingTo(en.id); setExpanded(prev => new Set(prev).add(en.id)); }}
                                  className="mt-1 text-[10px] text-slate-500 hover:text-primary flex items-center gap-1">
                                  <Plus size={10} /> Atividade
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        {showGantt && <div className="relative" style={{ width: timelineWidth, minHeight: 44 }}>
                          {todayPx != null && <div className="absolute top-0 bottom-0" style={{ left: todayPx, width: 1, background: '#EF4444', opacity: 0.5 }} />}
                          <GanttBar left={pctPos(en.inicio)} width={barWidth(en.inicio, en.fim)}
                            color={ganttStatusColors[en.status]} progress={enProg} bold
                            label={`${br(en.inicio)} – ${br(en.fim)}`}
                            onClick={() => setEditing({ kind: 'entrega', id: en.id })} />
                        </div>}
                      </div>

                      {isOpen && en.atividades.map(a => renderRow(a, 0))}

                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (() => {
        if (editing.kind === 'entrega') {
          const en = gantt.flatMap(b => b.entregas).find(x => x.id === editing.id);
          if (!en) return null;
          return <GanttEditModal
            title="Editar entrega"
            canRename={isAdmin}
            item={{ nome: en.entrega, inicio: en.inicio, fim: en.fim, responsavel: en.responsavel ?? '', status: en.status, comentario: en.comentario ?? '' }}
            onClose={() => setEditing(null)}
            onSave={(v) => {
              updateGanttEntrega(en.id, isAdmin ? { ...v, entrega: v.nome } : { inicio: v.inicio, fim: v.fim, responsavel: v.responsavel, status: v.status, comentario: v.comentario });
              audit('editar entrega', en.entrega);
              toast.success('Entrega atualizada.');
              setEditing(null);
            }}
          />;
        }
        const a = gantt.flatMap(b => b.entregas.flatMap(e => e.atividades.flatMap(x => [x, ...(x.subatividades ?? [])]))).find(x => x.id === editing.id);
        if (!a) return null;
        return <GanttEditModal
          title="Editar atividade"
          canRename={isAdmin}
          item={{ nome: a.atividade, inicio: a.inicio, fim: a.fim, responsavel: a.responsavel ?? '', status: a.status, comentario: a.comentario ?? '', projetoId: a.projetoId ?? null }}
          projectOptions={projects.map(p => ({ id: p.id, label: `${p.org ? `${p.org} · ` : ''}${p.name}` }))}
          onClose={() => setEditing(null)}
          onSave={(v) => {
            updateGanttAtividade(a.id, isAdmin
              ? { ...v, atividade: v.nome }
              : { inicio: v.inicio, fim: v.fim, responsavel: v.responsavel, status: v.status, comentario: v.comentario, projetoId: v.projetoId });
            audit('editar atividade', a.atividade);
            toast.success('Atividade atualizada.');
            setEditing(null);
          }}
        />;
      })()}
    </div>
  );
}

function TrackingTable({ activityId, fallback, projects, track, onTrack }: {
  activityId: number;
  fallback: GanttActivity;
  projects: { id: number; name: string; org?: string }[];
  track: (aid: number, pid: number) => { status: GanttStatus; inicio?: string; fim?: string; responsavel?: string; observacao?: string };
  onTrack: (pid: number, patch: Partial<{ status: GanttStatus; inicio: string; fim: string; responsavel: string; observacao: string }>) => void;
}) {
  void activityId;
  return (
    <div className="rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <table className="w-full text-[12px]">
        <thead>
          <tr style={{ background: '#F8FAFC' }}>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B' }}>Projeto / Comunidade</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B', width: 160 }}>Status</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B', width: 130 }}>Início</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B', width: 130 }}>Fim</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B', width: 170 }}>Responsável</th>
            <th className="text-left px-3 py-2 font-semibold" style={{ color: '#64748B' }}>Observação</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(p => {
            const t = track(fallback.id, p.id);
            const c = internalStatusColors[t.status];
            return (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border)', background: '#fff' }}>
                <td className="px-3 py-1.5">
                  {p.org && <span className="text-[10px] font-bold mr-1.5" style={{ color: '#1D4ED8' }}>{p.org}</span>}
                  <span>{p.name}</span>
                </td>
                <td className="px-3 py-1.5">
                  <select value={t.status} onChange={e => onTrack(p.id, { status: e.target.value as GanttStatus })}
                    className="w-full text-[11px] px-2 py-1 rounded font-medium"
                    style={{ background: c.bg, color: c.color, border: '1px solid var(--border)' }}>
                    {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input type="date" value={t.inicio ?? fallback.inicio ?? ''} onChange={e => onTrack(p.id, { inicio: e.target.value })}
                    className="w-full text-[11px] px-2 py-1 rounded" style={{ border: '1px solid var(--border)' }} />
                </td>
                <td className="px-3 py-1.5">
                  <input type="date" value={t.fim ?? fallback.fim ?? ''} onChange={e => onTrack(p.id, { fim: e.target.value })}
                    className="w-full text-[11px] px-2 py-1 rounded" style={{ border: '1px solid var(--border)' }} />
                </td>
                <td className="px-3 py-1.5">
                  <select value={t.responsavel ?? fallback.responsavel ?? ''} onChange={e => onTrack(p.id, { responsavel: e.target.value })}
                    className="w-full text-[11px] px-2 py-1 rounded" style={{ border: '1px solid var(--border)', background: '#fff' }}>
                    <option value="">—</option>
                    {APP_PEOPLE.map(pe => <option key={pe.login} value={pe.name}>{pe.name}</option>)}
                    {t.responsavel && !APP_PEOPLE.some(pe => pe.name === t.responsavel) && <option value={t.responsavel}>{t.responsavel}</option>}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input value={t.observacao ?? ''} onChange={e => onTrack(p.id, { observacao: e.target.value })}
                    placeholder="—" className="w-full text-[11px] px-2 py-1 rounded" style={{ border: '1px solid var(--border)' }} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GanttBar({ left, width, color, progress, label, bold, onClick }: {
  left: number; width: number; color: string; progress: number; label: string; bold?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} title={`${label} · ${progress}%`}
      className="absolute rounded-md overflow-hidden text-left"
      style={{ left, width, top: bold ? 10 : 8, height: bold ? 22 : 16, background: `${color}33`, border: `1px solid ${color}`, cursor: 'pointer' }}>
      <div style={{ width: `${progress}%`, height: '100%', background: color, opacity: 0.85, transition: 'width 200ms' }} />
    </button>
  );
}

interface GanttFormValue {
  nome: string; inicio: string; fim: string; responsavel: string; status: GanttStatus; comentario: string;
  projetoId?: number | null;
}

function GanttEditModal({ title, item, canRename, projectOptions, onSave, onClose }: {
  title: string; item: GanttFormValue; canRename: boolean;
  projectOptions?: { id: number; label: string }[];
  onSave: (v: GanttFormValue) => void; onClose: () => void;
}) {
  const [f, setF] = useState(item);
  const responsaveis = useMemo(() => {
    const base = APP_PEOPLE.map(p => p.name);
    return Array.from(new Set([...base, 'CESUPA', 'SEMAS', 'Equipe', 'Coordenação', item.responsavel].filter(Boolean)));
  }, [item.responsavel]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Nome</label>
            {canRename ? (
              <textarea value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} rows={2}
                className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            ) : <div className="text-sm text-slate-700">{f.nome}</div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Início</label>
              <input type="date" value={f.inicio} onChange={e => setF({ ...f, inicio: e.target.value })}
                className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Fim</label>
              <input type="date" value={f.fim} onChange={e => setF({ ...f, fim: e.target.value })}
                className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Responsável</label>
            <select value={f.responsavel} onChange={e => setF({ ...f, responsavel: e.target.value })}
              className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
              <option value="">—</option>
              {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Status</label>
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value as GanttStatus })}
              className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {projectOptions && (
            <div>
              <label className="text-xs font-medium block mb-1">Projeto / Comunidade vinculada</label>
              <select value={f.projetoId == null ? '' : String(f.projetoId)}
                onChange={e => setF({ ...f, projetoId: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                <option value="">Sem vínculo (geral — vale para todos)</option>
                {projectOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Ao vincular, o bloco, a entrega e esta atividade/subatividade passam a aparecer no cronograma do projeto escolhido.
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-medium mb-1 flex items-center gap-1"><MessageSquare size={12} /> Comentários</label>
            <textarea value={f.comentario} onChange={e => setF({ ...f, comentario: e.target.value })} rows={3}
              placeholder="Observações, pendências, encaminhamentos…"
              className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md" style={{ border: '1px solid var(--border)' }}>Cancelar</button>
          <button onClick={() => onSave(f)} className="px-4 py-2 text-sm text-white rounded-md flex items-center gap-1" style={{ background: 'var(--primary)' }}>
            <Save size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[11px] text-muted-foreground mb-1">{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.3rem', color }}>{value}</div>
    </div>
  );
}
