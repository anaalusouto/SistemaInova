import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, CalendarDays, Route as RouteIcon, X, ChevronLeft, ChevronRight, MapPin, Filter, GanttChart, ChevronDown, MessageSquare } from 'lucide-react';
import { useStore } from '../store';
import { useAuth, APP_PEOPLE } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';
import { tipoComunidadeColors, type CalendarEventType, type RotaItem, type CalendarEvent } from '../data/rotas';
import { ganttStatusColors, type GanttBloco, type GanttStatus } from '../data/cronogramaExecutivo';
import 'leaflet/dist/leaflet.css';

const GANTT_STATUS_LIST: GanttStatus[] = ['Não iniciado', 'No prazo', 'Em andamento', 'Entregue', 'Atrasado'];

const eventTypes: CalendarEventType[] = ['Visita técnica', 'Prazo', 'Logística', 'Reunião', 'Capacitação', 'Outro'];
const typeColors: Record<CalendarEventType, string> = {
  'Visita técnica': '#2E7D52',
  'Prazo': '#EF4444',
  'Logística': '#0D6E8A',
  'Reunião': '#7C3AED',
  'Capacitação': '#F59E0B',
  'Outro': '#6B7280',
};
const statusColors: Record<string, string> = {
  'Operacional': '#22C55E',
  'Atenção': '#F59E0B',
  'Crítico': '#EF4444',
};
const DEFAULT_TIPO_COLOR = '#64748B';
const colorForTipo = (t: string) => tipoComunidadeColors[t] ?? DEFAULT_TIPO_COLOR;


export function CronogramaPage() {
  const [tab, setTab] = useState<'rotas' | 'calendario' | 'executivo'>('executivo');
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-5">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.4rem' }}>Cronograma 2026</h1>
          <p className="text-sm text-muted-foreground">Cronograma executivo, rotas de campo e calendário anual — INOVA FAS/FUNBIO</p>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            { id: 'executivo', label: 'Cronograma Executivo', icon: GanttChart },
            { id: 'rotas', label: 'Rotas', icon: RouteIcon },
            { id: 'calendario', label: 'Calendário 2026', icon: CalendarDays },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md transition-colors"
                style={{ background: active ? 'var(--primary)' : 'var(--card)', color: active ? '#fff' : 'var(--foreground)', border: '1px solid var(--border)', fontWeight: active ? 600 : 400 }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === 'executivo' && <CronogramaExecutivoTab />}
        {tab === 'rotas' && <RotasTab />}
        {tab === 'calendario' && <CalendarioTab />}
      </div>
    </div>
  );
}

/* ============================================================
   CRONOGRAMA EXECUTIVO — Gantt funcional
   ============================================================ */
function CronogramaExecutivoTab() {
  const {
    gantt, updateGanttEntrega, updateGanttAtividade,
    addGanttAtividade, deleteGanttAtividade, restoreGanttAtividade,
  } = useStore();
  const { user, isAdmin } = useAuth();
  const { log } = useAudit();
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(gantt.flatMap(b => b.entregas.map(e => e.id))));
  const [editing, setEditing] = useState<{ kind: 'entrega' | 'atividade'; id: number } | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [novaAtividade, setNovaAtividade] = useState('');

  const audit = (action: string, detail: string) =>
    log({ userLogin: user?.login ?? '—', area: 'cronograma executivo', action, detail });

  // Timeline: menor início até maior fim (arredondado por semana)
  const { minDate, maxDate, weeks } = useMemo(() => {
    let min = new Date('2100-01-01'); let max = new Date('1970-01-01');
    gantt.forEach(b => b.entregas.forEach(en => {
      const ini = new Date(en.inicio); const fim = new Date(en.fim);
      if (ini < min) min = ini; if (fim > max) max = fim;
      en.atividades.forEach(a => {
        const ai = new Date(a.inicio); const af = new Date(a.fim);
        if (ai < min) min = ai; if (af > max) max = af;
      });
    }));
    // arredonda min para segunda-feira e max para domingo
    const start = new Date(min); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const end = new Date(max); end.setDate(end.getDate() + (7 - end.getDay()) % 7);
    const weekList: Date[] = [];
    const cur = new Date(start);
    while (cur <= end) { weekList.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }
    return { minDate: start, maxDate: end, weeks: weekList };
  }, [gantt]);

  const totalDays = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / 86400000));
  const DAY_PX = 14; // largura de 1 dia
  const timelineWidth = totalDays * DAY_PX;
  const LEFT_COL = 420;

  const pctPos = (dateStr: string) => {
    const d = new Date(dateStr);
    const days = Math.round((d.getTime() - minDate.getTime()) / 86400000);
    return days * DAY_PX;
  };
  const barWidth = (ini: string, fim: string) => {
    const days = Math.max(1, Math.round((new Date(fim).getTime() - new Date(ini).getTime()) / 86400000) + 1);
    return days * DAY_PX;
  };

  const toggle = (id: number) => setExpanded(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  // KPIs
  const kpis = useMemo(() => {
    const entregas = gantt.flatMap(b => b.entregas);
    const total = entregas.length;
    const entregues = entregas.filter(e => e.status === 'Entregue').length;
    const atrasadas = entregas.filter(e => e.status === 'Atrasado').length;
    const progAvg = total ? Math.round(entregas.reduce((s, e) => s + e.progress, 0) / total) : 0;
    return { total, entregues, atrasadas, progAvg };
  }, [gantt]);

  // Marcador de hoje
  const todayPx = (() => {
    const t = new Date();
    if (t < minDate || t > maxDate) return null;
    return Math.round((t.getTime() - minDate.getTime()) / 86400000) * DAY_PX;
  })();

  const handleToggleDone = (a: { id: number; atividade: string; status: GanttStatus }) => {
    const done = a.status === 'Entregue';
    updateGanttAtividade(a.id, { status: done ? 'Não iniciado' : 'Entregue', progress: done ? 0 : 100 });
    audit(done ? 'desmarcar atividade' : 'concluir atividade', a.atividade);
  };

  const handleDelete = (a: { id: number; atividade: string }) => {
    const removed = deleteGanttAtividade(a.id);
    if (!removed) return;
    audit('remover atividade', a.atividade);
    toast.error(`Atividade removida: ${a.atividade}`, {
      duration: 6000,
      action: {
        label: 'Desfazer',
        onClick: () => {
          restoreGanttAtividade(removed.entregaId, removed.index, removed.atividade);
          audit('desfazer remoção', a.atividade);
        },
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Entregas totais" value={kpis.total} color="#1A5C3A" />
        <Kpi label="Concluídas" value={kpis.entregues} color="#22C55E" />
        <Kpi label="Em atraso" value={kpis.atrasadas} color="#EF4444" />
        <Kpi label="Progresso médio" value={`${kpis.progAvg}%`} color="#0D6E8A" />
      </div>

      <div className="text-[11px] text-muted-foreground">
        {isAdmin
          ? 'Perfil administrativo: você pode adicionar, editar e remover atividades.'
          : 'Perfil estagiário: você pode editar as entregas e marcar/desmarcar as atividades como concluídas.'}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>
            <GanttChart size={14} className="inline mr-1.5" />Cronograma Executivo — INOVA SOCIOBIO II
          </h3>
          <div className="flex gap-3 text-[11px] flex-wrap">
            {GANTT_STATUS_LIST.map(s => (
              <span key={s} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: ganttStatusColors[s] }} />
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
          <div style={{ minWidth: LEFT_COL + timelineWidth }}>
            {/* Header timeline */}
            <div className="sticky top-0 z-10 flex text-[10px]" style={{ background: '#F1F5F9', borderBottom: '1px solid var(--border)' }}>
              <div className="shrink-0 px-3 py-2 font-semibold" style={{ width: LEFT_COL, borderRight: '1px solid var(--border)' }}>
                Bloco / Entrega / Atividade
              </div>
              <div className="relative" style={{ width: timelineWidth, height: 32 }}>
                {weeks.map((w, i) => (
                  <div key={i} className="absolute top-0 bottom-0 flex items-center justify-start pl-1 text-slate-500"
                    style={{ left: pctPos(fmtDate(w)), width: 7 * DAY_PX, borderLeft: '1px solid #E2E8F0' }}>
                    {String(w.getDate()).padStart(2, '0')}/{String(w.getMonth() + 1).padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            {gantt.map(b => (
              <div key={b.id}>
                <div className="flex" style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                  <div className="px-3 py-2 text-xs font-bold text-slate-700 shrink-0" style={{ width: LEFT_COL, borderRight: '1px solid var(--border)' }}>
                    {b.bloco}
                  </div>
                  <div style={{ width: timelineWidth }} />
                </div>
                {b.entregas.map(en => {
                  const isOpen = expanded.has(en.id);
                  return (
                    <div key={en.id}>
                      {/* Linha entrega */}
                      <div className="flex hover:bg-slate-50 group" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="px-3 py-2 shrink-0 flex items-start gap-1.5" style={{ width: LEFT_COL, borderRight: '1px solid var(--border)' }}>
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
                              {en.status} · {en.responsavel} · {en.progress}%
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
                        <div className="relative" style={{ width: timelineWidth, minHeight: 44 }}>
                          {todayPx != null && <div className="absolute top-0 bottom-0" style={{ left: todayPx, width: 1, background: '#EF4444', opacity: 0.5 }} />}
                          {weeks.map((w, i) => (
                            <div key={i} className="absolute top-0 bottom-0" style={{ left: pctPos(fmtDate(w)), width: 1, background: '#F1F5F9' }} />
                          ))}
                          <GanttBar
                            left={pctPos(en.inicio)}
                            width={barWidth(en.inicio, en.fim)}
                            color={ganttStatusColors[en.status]}
                            progress={en.progress}
                            label={`${new Date(en.inicio).toLocaleDateString('pt-BR')} – ${new Date(en.fim).toLocaleDateString('pt-BR')}`}
                            bold
                            onClick={() => setEditing({ kind: 'entrega', id: en.id })}
                          />
                        </div>
                      </div>

                      {/* Atividades */}
                      {isOpen && en.atividades.map(a => {
                        const done = a.status === 'Entregue';
                        return (
                          <div key={a.id} className="flex hover:bg-slate-50 group" style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <div className="pl-9 pr-3 py-1.5 shrink-0 flex items-start gap-2" style={{ width: LEFT_COL, borderRight: '1px solid var(--border)' }}>
                              <input type="checkbox" checked={done} onChange={() => handleToggleDone(a)}
                                title={done ? 'Desmarcar como concluída' : 'Marcar como concluída'} className="mt-0.5" />
                              <div className="flex-1 min-w-0">
                                {isAdmin ? (
                                  <button onClick={() => setEditing({ kind: 'atividade', id: a.id })}
                                    className="text-[11px] text-left leading-tight text-slate-700 hover:text-primary block"
                                    style={{ textDecoration: done ? 'line-through' : 'none' }}>
                                    {a.atividade}
                                  </button>
                                ) : (
                                  <span className="text-[11px] leading-tight text-slate-700 block" style={{ textDecoration: done ? 'line-through' : 'none' }}>
                                    {a.atividade}
                                  </span>
                                )}
                                <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                  {a.responsavel} · {a.progress}%
                                  {a.comentario && <MessageSquare size={10} className="text-slate-400" />}
                                </div>
                              </div>
                              {isAdmin && (
                                <button onClick={() => handleDelete(a)} title="Remover atividade"
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 mt-0.5">
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                            <div className="relative" style={{ width: timelineWidth, minHeight: 34 }}>
                              {todayPx != null && <div className="absolute top-0 bottom-0" style={{ left: todayPx, width: 1, background: '#EF4444', opacity: 0.5 }} />}
                              <GanttBar
                                left={pctPos(a.inicio)}
                                width={barWidth(a.inicio, a.fim)}
                                color={ganttStatusColors[a.status]}
                                progress={a.progress}
                                label={`${new Date(a.inicio).toLocaleDateString('pt-BR')} – ${new Date(a.fim).toLocaleDateString('pt-BR')}`}
                                onClick={() => isAdmin && setEditing({ kind: 'atividade', id: a.id })}
                              />
                            </div>
                          </div>
                        );
                      })}
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
            item={{ nome: en.entrega, inicio: en.inicio, fim: en.fim, responsavel: en.responsavel, status: en.status, progress: en.progress, comentario: en.comentario ?? '' }}
            onClose={() => setEditing(null)}
            onSave={(v) => {
              updateGanttEntrega(en.id, isAdmin ? { ...v, entrega: v.nome } : v);
              audit('editar entrega', en.entrega);
              toast.success('Entrega atualizada.');
              setEditing(null);
            }}
          />;
        }
        const a = gantt.flatMap(b => b.entregas.flatMap(e => e.atividades)).find(x => x.id === editing.id);
        if (!a) return null;
        return <GanttEditModal
          title="Editar atividade"
          canRename={isAdmin}
          item={{ nome: a.atividade, inicio: a.inicio, fim: a.fim, responsavel: a.responsavel, status: a.status, progress: a.progress, comentario: a.comentario ?? '' }}
          onClose={() => setEditing(null)}
          onSave={(v) => {
            updateGanttAtividade(a.id, isAdmin ? { ...v, atividade: v.nome } : v);
            audit('editar atividade', a.atividade);
            toast.success('Atividade atualizada.');
            setEditing(null);
          }}
        />;
      })()}
    </div>
  );
}

function GanttBar({ left, width, color, progress, label, bold, onClick }: {
  left: number; width: number; color: string; progress: number; label: string; bold?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} title={`${label} · ${progress}%`}
      className="absolute rounded-md overflow-hidden text-left"
      style={{
        left, width, top: bold ? 10 : 8, height: bold ? 22 : 16,
        background: `${color}33`, border: `1px solid ${color}`,
        cursor: 'pointer',
      }}>
      <div style={{ width: `${progress}%`, height: '100%', background: color, opacity: 0.85, transition: 'width 200ms' }} />
      <div className="absolute inset-0 flex items-center px-1.5 text-[9px] font-semibold text-white mix-blend-luminosity" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
        {progress}%
      </div>
    </button>
  );
}

interface GanttFormValue {
  nome: string; inicio: string; fim: string; responsavel: string; status: GanttStatus; progress: number; comentario: string;
}

function GanttEditModal({ title, item, canRename, onSave, onClose }: {
  title: string;
  item: GanttFormValue;
  canRename: boolean;
  onSave: (v: GanttFormValue) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState(item);
  const responsaveis = useMemo(() => {
    const base = APP_PEOPLE.map(p => p.name);
    return Array.from(new Set([...base, 'CESUPA', 'SEMAS', item.responsavel].filter(Boolean)));
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
            ) : (
              <div className="text-sm text-slate-700">{f.nome}</div>
            )}
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
              {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Status</label>
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value as GanttStatus })}
              className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
              {GANTT_STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Progresso: <span className="font-mono">{f.progress}%</span></label>
            <input type="range" min={0} max={100} step={5} value={f.progress}
              onChange={e => setF({ ...f, progress: Number(e.target.value) })} className="w-full" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1 flex items-center gap-1"><MessageSquare size={12} /> Comentários</label>
            <textarea value={f.comentario} onChange={e => setF({ ...f, comentario: e.target.value })} rows={3}
              placeholder="Observações, pendências, encaminhamentos…"
              className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md" style={{ border: '1px solid var(--border)' }}>Cancelar</button>
          <button onClick={() => onSave(f)}
            className="px-4 py-2 text-sm text-white rounded-md flex items-center gap-1" style={{ background: 'var(--primary)' }}>
            <Save size={13} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}



/* ============================================================
   ROTAS TAB — Interactive map + filterable table
   ============================================================ */
function RotasTab() {
  const { routes, updateRoute, addRoute, deleteRoute } = useStore();
  const [selectedRota, setSelectedRota] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const rotasUnicas = useMemo(() => Array.from(new Set(routes.map(r => r.rota))).sort(), [routes]);
  const filtered = useMemo(
    () => (selectedRota === 'all' ? routes : routes.filter(r => r.rota === selectedRota)),
    [routes, selectedRota]
  );

  const kpis = useMemo(() => {
    const total = filtered.length;
    const dias = filtered.reduce((a, r) => a + (r.diasAtuacao ?? 0), 0);
    const atencao = filtered.filter(r => r.status === 'Atenção' || r.status === 'Crítico').length;
    const tipos = new Set(filtered.map(r => r.tipoComunidade)).size;
    return { total, dias, atencao, tipos };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <Filter size={14} className="text-muted-foreground" />
          <select value={selectedRota} onChange={e => setSelectedRota(e.target.value)}
            className="text-sm bg-transparent outline-none">
            <option value="all">Todas as rotas</option>
            {rotasUnicas.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button onClick={() => addRoute({ rota: 'ROTA NOVA', organizacao: '', municipio: '', uf: 'PA', diasAtuacao: 2, modalAcesso: '', tipoComunidade: '', notasLogisticas: '', status: 'Operacional' })}
          className="flex items-center gap-1 text-xs px-3 py-2 rounded-md text-white ml-auto" style={{ background: 'var(--primary)' }}>
          <Plus size={12} /> Adicionar rota
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Organizações" value={kpis.total} color="#1A5C3A" />
        <Kpi label="Dias de campo" value={kpis.dias} color="#0D6E8A" />
        <Kpi label="Pontos de atenção" value={kpis.atencao} color="#F59E0B" />
        <Kpi label="Tipos de comunidade" value={kpis.tipos} color="#7C3AED" />
      </div>

      {/* Map + Legend */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>
            <MapPin size={14} className="inline mr-1.5" />Mapa das Rotas — Pará
          </h3>
          <div className="flex gap-3 text-xs flex-wrap">
            {Object.entries(tipoComunidadeColors).map(([s, c]) => (
              <span key={s} className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                {s}
              </span>
            ))}
            <span className="flex items-center gap-1 pl-2 ml-1 border-l" style={{ borderColor: 'var(--border)' }}>
              {Object.entries(statusColors).map(([s, c]) => (
                <span key={s} className="flex items-center gap-1 ml-2">
                  <span className="inline-block w-2 h-2 rounded-full border-2" style={{ borderColor: c, background: 'transparent' }} />
                  <span className="text-[11px] text-muted-foreground">{s}</span>
                </span>
              ))}
            </span>
          </div>
        </div>
        <RotasMap routes={filtered} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem' }}>Organizações & logística</h3>
        </div>
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--muted)', position: 'sticky', top: 0, zIndex: 1 }}>
              <tr className="text-left text-xs">
                <th className="px-3 py-2">Rota</th>
                <th className="px-3 py-2">Organização</th>
                <th className="px-3 py-2">Município/UF</th>
                <th className="px-3 py-2">Dias</th>
                <th className="px-3 py-2">Modal</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Notas</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="border-t cursor-pointer"
                  style={{ borderColor: 'var(--border)', background: selectedId === r.id ? '#EFF6FF' : undefined }}>
                  <Td><input className="cell" value={r.rota} onChange={e => updateRoute(r.id, { rota: e.target.value })} /></Td>
                  <Td><input className="cell" value={r.organizacao} onChange={e => updateRoute(r.id, { organizacao: e.target.value })} /></Td>
                  <Td>
                    <div className="flex gap-1">
                      <input className="cell" style={{ flex: 1 }} value={r.municipio} onChange={e => updateRoute(r.id, { municipio: e.target.value })} />
                      <input className="cell" style={{ width: 48 }} value={r.uf} onChange={e => updateRoute(r.id, { uf: e.target.value })} />
                    </div>
                  </Td>
                  <Td><input type="number" className="cell" style={{ width: 60 }} value={r.diasAtuacao} onChange={e => updateRoute(r.id, { diasAtuacao: Number(e.target.value) })} /></Td>
                  <Td><input className="cell" value={r.modalAcesso} onChange={e => updateRoute(r.id, { modalAcesso: e.target.value })} /></Td>
                  <Td><input className="cell" value={r.tipoComunidade} onChange={e => updateRoute(r.id, { tipoComunidade: e.target.value })} /></Td>
                  <Td>
                    <select className="cell" value={r.status ?? 'Operacional'} onChange={e => updateRoute(r.id, { status: e.target.value as RotaItem['status'] })}>
                      <option value="Operacional">Operacional</option>
                      <option value="Atenção">Atenção</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </Td>
                  <Td><input className="cell" value={r.notasLogisticas} onChange={e => updateRoute(r.id, { notasLogisticas: e.target.value })} /></Td>
                  <Td>
                    <button onClick={(ev) => { ev.stopPropagation(); if (confirm(`Excluir ${r.rota} — ${r.organizacao}?`)) { deleteRoute(r.id); toast.success('Rota excluída'); } }} className="p-1.5 rounded hover:bg-red-50">
                      <Trash2 size={13} className="text-red-500" />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style>{`.cell{border:1px solid transparent;border-radius:6px;padding:4px 8px;font-size:12.5px;background:transparent;width:100%;color:#0F172A}
          .cell:focus{border-color:var(--primary);background:#fff;outline:none}
          .cell:hover{background:#fff}`}</style>
      </div>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}

/* Leaflet map with route grouping — loaded only on the client */
function RotasMap({ routes, selectedId, onSelect }: { routes: RotaItem[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let map: any = null;

    import('leaflet').then((LModule) => {
      const L = (LModule as any).default || LModule;
      if (!mounted || !containerRef.current || mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      map = L.map(containerRef.current, { center: [-3.5, -51], zoom: 5, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      leafletRef.current = L;
      setReady(true);
    });

    return () => {
      mounted = false;
      if (map) { map.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const L = leafletRef.current;
    const map = mapRef.current, layer = layerRef.current;
    if (!L || !map || !layer) return;
    layer.clearLayers();

    // Group by rota name for polylines connecting stops
    const groups: Record<string, RotaItem[]> = {};
    routes.forEach(r => { if (r.lat != null && r.lng != null) (groups[r.rota] ??= []).push(r); });

    const palette = ['#1A5C3A', '#0D6E8A', '#F59E0B', '#EF4444', '#7C3AED', '#DB2777', '#059669', '#2563EB', '#B45309', '#0891B2', '#65A30D', '#DC2626'];
    let idx = 0;
    const bounds: [number, number][] = [];

    Object.entries(groups).forEach(([rotaName, items]) => {
      const color = palette[idx++ % palette.length];
      const coords: [number, number][] = items.map(r => [r.lat!, r.lng!]);
      if (coords.length > 1) {
        L.polyline(coords, { color, weight: 3, opacity: 0.7, dashArray: '6 6' }).addTo(layer);
      }
      items.forEach(r => {
        bounds.push([r.lat!, r.lng!]);
        const st = statusColors[r.status ?? 'Operacional'];
        const tipoCor = colorForTipo(r.tipoComunidade);
        const isSel = r.id === selectedId;
        const marker = L.circleMarker([r.lat!, r.lng!], {
          radius: isSel ? 12 : 8,
          color: st,
          weight: isSel ? 4 : 3,
          fillColor: tipoCor,
          fillOpacity: 0.95,
        }).addTo(layer);
        marker.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:220px">
            <div style="font-weight:700;color:${color};font-size:12px">${rotaName}</div>
            <div style="font-weight:600;font-size:13px;margin-top:2px">${r.organizacao}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">${r.municipio}/${r.uf}</div>
            <div style="margin-top:6px;display:flex;gap:4px;flex-wrap:wrap">
              <span style="background:${tipoCor};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">${r.tipoComunidade}</span>
              <span style="background:${st};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px">${r.status ?? 'Operacional'}</span>
            </div>
            <div style="font-size:11px;margin-top:6px"><b>Modal:</b> ${r.modalAcesso}</div>
            <div style="font-size:11px"><b>Dias:</b> ${r.diasAtuacao}</div>
            <div style="font-size:11px"><b>Coord.:</b> ${r.lat!.toFixed(4)}, ${r.lng!.toFixed(4)}</div>
            ${r.notasLogisticas ? `<div style="font-size:10.5px;color:#92400E;background:#FFFBEB;padding:4px 6px;border-radius:4px;margin-top:6px">${r.notasLogisticas}</div>` : ''}
          </div>
        `);
        marker.on('click', () => onSelect(r.id));
      });
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as any, { padding: [40, 40], maxZoom: 8 });
    }
  }, [routes, selectedId, onSelect, ready]);

  return <div ref={containerRef} style={{ height: 460, width: '100%', zIndex: 0 }} />;
}

/* ============================================================
   CALENDÁRIO TAB — Google Calendar-like (month / week / day)
   ============================================================ */
type CalView = 'month' | 'week' | 'day';

function CalendarioTab() {
  const { events, addEvent, updateEvent, deleteEvent, routes, communities } = useStore();
  const [view, setView] = useState<CalView>('month');
  const [cursor, setCursor] = useState<Date>(new Date(2026, 0, 1));
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | null>(null);

  const openNew = (date?: string) => { setEditing(null); setPrefillDate(date ?? null); setShowForm(true); };
  const openEdit = (id: number) => { setEditing(id); setPrefillDate(null); setShowForm(true); };

  const goPrev = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCursor(d);
  };
  const goNext = () => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCursor(d);
  };
  const goToday = () => setCursor(new Date());

  const title = useMemo(() => {
    if (view === 'month') return cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (view === 'day') return cursor.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const start = startOfWeek(cursor);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }, [cursor, view]);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-wrap gap-2" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="text-xs px-3 py-1.5 rounded-md" style={{ border: '1px solid var(--border)', background: '#fff' }}>Hoje</button>
          <button onClick={goPrev} className="p-1.5 rounded-md hover:bg-slate-100"><ChevronLeft size={16} /></button>
          <button onClick={goNext} className="p-1.5 rounded-md hover:bg-slate-100"><ChevronRight size={16} /></button>
          <div className="text-sm font-semibold ml-2 capitalize">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {(['day', 'week', 'month'] as CalView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="text-xs px-3 py-1.5 capitalize"
                style={{ background: view === v ? 'var(--primary)' : '#fff', color: view === v ? '#fff' : '#0F172A', fontWeight: view === v ? 600 : 400 }}>
                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          <button onClick={() => openNew()} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md text-white" style={{ background: 'var(--primary)' }}>
            <Plus size={12} /> Novo
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-4 py-2 border-b text-[11px]" style={{ borderColor: 'var(--border)' }}>
        {eventTypes.map(t => (
          <span key={t} className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: typeColors[t] }} /> {t}
          </span>
        ))}
      </div>

      {view === 'month' && <MonthView cursor={cursor} events={events} onNew={openNew} onEdit={openEdit} />}
      {view === 'week' && <WeekView cursor={cursor} events={events} onNew={openNew} onEdit={openEdit} />}
      {view === 'day' && <DayView cursor={cursor} events={events} onNew={openNew} onEdit={openEdit} />}

      {showForm && (
        <EventForm
          initial={editing != null ? events.find(x => x.id === editing) : undefined}
          prefillDate={prefillDate}
          routes={routes}
          communities={communities}
          onClose={() => setShowForm(false)}
          onSave={(data) => {
            if (editing != null) { updateEvent(editing, data); toast.success('Evento atualizado.'); }
            else { addEvent(data); toast.success('Evento criado.'); }
            setShowForm(false);
          }}
          onDelete={editing != null ? () => { deleteEvent(editing); toast.success('Evento excluído.'); setShowForm(false); } : undefined}
        />
      )}
    </div>
  );
}

/* ---- helpers ---- */
function fmtDate(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function startOfWeek(d: Date): Date {
  const x = new Date(d); const dow = x.getDay(); x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* ---- Month view ---- */
function MonthView({ cursor, events, onNew, onEdit }: { cursor: Date; events: CalendarEvent[]; onNew: (d: string) => void; onEdit: (id: number) => void }) {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const today = new Date();

  return (
    <div>
      <div className="grid grid-cols-7 border-b text-[11px] font-semibold text-muted-foreground" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        {weekDays.map(w => <div key={w} className="px-2 py-1.5 text-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[110px] border-b border-r" style={{ borderColor: 'var(--border)', background: '#FAFAFA' }} />;
          const key = fmtDate(d);
          const list = events.filter(e => e.date === key);
          const isToday = isSameDay(d, today);
          return (
            <div key={i}
              onDoubleClick={() => onNew(key)}
              className="min-h-[110px] border-b border-r p-1.5 cursor-pointer"
              style={{ borderColor: 'var(--border)' }}>
              <div className={`text-[11px] font-semibold mb-1 flex items-center justify-between ${isToday ? '' : 'text-slate-700'}`}>
                <span style={isToday ? { background: 'var(--primary)', color: '#fff', width: 20, height: 20, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 } : {}}>{d.getDate()}</span>
                <button onClick={(ev) => { ev.stopPropagation(); onNew(key); }} className="text-slate-300 hover:text-slate-600"><Plus size={11} /></button>
              </div>
              <div className="space-y-0.5">
                {list.slice(0, 3).map(e => (
                  <button key={e.id} onClick={(ev) => { ev.stopPropagation(); onEdit(e.id); }}
                    className="w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate text-white"
                    title={e.title}
                    style={{ background: typeColors[e.type] }}>
                    {e.startTime ? `${e.startTime} ` : ''}{e.title}
                  </button>
                ))}
                {list.length > 3 && <div className="text-[10px] text-muted-foreground pl-1">+{list.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Week view ---- */
function WeekView({ cursor, events, onNew, onEdit }: { cursor: Date; events: CalendarEvent[]; onNew: (d: string) => void; onEdit: (id: number) => void }) {
  const start = startOfWeek(cursor);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const today = new Date();
  return (
    <div className="grid grid-cols-7">
      {days.map(d => {
        const key = fmtDate(d);
        const list = events.filter(e => e.date === key).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
        const isToday = isSameDay(d, today);
        return (
          <div key={key} className="border-r min-h-[500px]" style={{ borderColor: 'var(--border)' }}>
            <div className="text-center py-2 border-b" style={{ borderColor: 'var(--border)', background: isToday ? '#EFF6FF' : '#F8FAFC' }}>
              <div className="text-[10px] uppercase text-muted-foreground">{weekDays[d.getDay()]}</div>
              <div className="text-lg font-bold" style={{ color: isToday ? 'var(--primary)' : undefined }}>{d.getDate()}</div>
            </div>
            <div className="p-2 space-y-1.5" onDoubleClick={() => onNew(key)}>
              {list.length === 0 && <div className="text-[10px] text-muted-foreground italic text-center pt-4">—</div>}
              {list.map(e => (
                <button key={e.id} onClick={() => onEdit(e.id)}
                  className="w-full text-left rounded p-1.5"
                  style={{ background: typeColors[e.type], color: '#fff' }}>
                  <div className="text-[10px] font-mono opacity-90">{e.startTime ?? 'todo o dia'}</div>
                  <div className="text-[11px] font-semibold leading-tight">{e.title}</div>
                  {e.responsavel && <div className="text-[10px] opacity-90 truncate">{e.responsavel}</div>}
                </button>
              ))}
              <button onClick={() => onNew(key)} className="w-full text-[10px] py-1 rounded hover:bg-slate-100 text-slate-400 border border-dashed" style={{ borderColor: 'var(--border)' }}>
                <Plus size={10} className="inline" /> adicionar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- Day view ---- */
function DayView({ cursor, events, onNew, onEdit }: { cursor: Date; events: CalendarEvent[]; onNew: (d: string) => void; onEdit: (id: number) => void }) {
  const key = fmtDate(cursor);
  const list = events.filter(e => e.date === key).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="grid grid-cols-[60px_1fr] max-h-[600px] overflow-y-auto">
      {hours.map(h => {
        const hh = String(h).padStart(2, '0');
        const bucket = list.filter(e => (e.startTime ?? '').startsWith(hh));
        return (
          <div key={h} className="contents">
            <div className="text-[10px] text-right pr-2 pt-1 text-muted-foreground border-r border-b" style={{ borderColor: 'var(--border)' }}>{hh}:00</div>
            <div className="border-b p-1 min-h-[48px] hover:bg-slate-50 cursor-pointer" style={{ borderColor: 'var(--border)' }}
              onDoubleClick={() => onNew(key)}>
              {bucket.map(e => (
                <button key={e.id} onClick={() => onEdit(e.id)} className="block w-full text-left rounded p-1.5 mb-1 text-white"
                  style={{ background: typeColors[e.type] }}>
                  <div className="text-[10px] font-mono">{e.startTime}{e.endTime ? ` – ${e.endTime}` : ''}</div>
                  <div className="text-xs font-semibold">{e.title}</div>
                  {e.responsavel && <div className="text-[10px] opacity-90">{e.responsavel}</div>}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {list.length === 0 && (
        <div className="col-span-2 text-center py-8 text-sm text-muted-foreground">
          Sem eventos neste dia. <button onClick={() => onNew(key)} className="text-primary underline">Criar evento</button>
        </div>
      )}
    </div>
  );
}

/* ---- Event form modal ---- */
function EventForm({ initial, prefillDate, routes, communities, onSave, onClose, onDelete }: {
  initial?: CalendarEvent;
  prefillDate?: string | null;
  routes: RotaItem[];
  communities: { id: number; nome: string }[];
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    date: initial?.date ?? prefillDate ?? '2026-01-01',
    startTime: initial?.startTime ?? '',
    endTime: initial?.endTime ?? '',
    type: initial?.type ?? 'Reunião' as CalendarEventType,
    rotaId: initial?.rotaId ?? null,
    comunidadeId: initial?.comunidadeId ?? null,
    responsavel: initial?.responsavel ?? '',
    observacoes: initial?.observacoes ?? '',
  });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">{initial ? 'Editar evento' : 'Novo evento'}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Título</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">Data</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Início</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Fim</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-2 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as CalendarEventType })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                {eventTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Responsável</label>
              <input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Rota</label>
              <select value={form.rotaId ?? ''} onChange={e => setForm({ ...form, rotaId: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                <option value="">—</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.rota} · {r.organizacao}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Comunidade</label>
              <select value={form.comunidadeId ?? ''} onChange={e => setForm({ ...form, comunidadeId: e.target.value ? Number(e.target.value) : null })} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }}>
                <option value="">—</option>
                {communities.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Observações</label>
            <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-md text-sm" style={{ border: '1px solid var(--border)' }} />
          </div>
        </div>
        <div className="flex justify-between mt-5">
          {onDelete ? <button onClick={onDelete} className="text-xs text-red-600 flex items-center gap-1"><Trash2 size={12} />Excluir evento</button> : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-md" style={{ border: '1px solid var(--border)' }}>Cancelar</button>
            <button onClick={() => { if (!form.title) { toast.error('Informe o título'); return; } onSave(form); }} className="px-4 py-2 text-sm text-white rounded-md flex items-center gap-1" style={{ background: 'var(--primary)' }}>
              <Save size={13} /> Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Td({ children }: { children: React.ReactNode }) { return <td className="px-3 py-2 align-middle">{children}</td>; }
