import { useMemo, useState, type ReactNode } from 'react';
import {
  ChevronDown, ChevronRight, Info, Target, Pencil, Check, X,
  History, ShieldCheck, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type ActivityStatus } from '../../data/mockData';
import { useStore, type MetaEdit } from '../../store';
import { useAuth, hasAdminPowers } from '../../auth/authStore';

const statusConfig: Record<ActivityStatus, { color: string; bg: string; dot: string }> = {
  'Não iniciado': { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
  'Em andamento': { color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
  'Concluído':    { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  'Atrasado':     { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
};

interface Props { project: Project }

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em' }}>
      {children}
    </div>
  );
}

export function TabMetas({ project }: Props) {
  const { submitMetaEdit, approveMetaEdit, rejectMetaEdit, getProject } = useStore();
  const { user } = useAuth();
  const isAdmin = hasAdminPowers(user);
  const p = getProject(project.id) ?? (project as never);
  const [open, setOpen] = useState<number[]>(project.goals.map(g => g.id));
  const [openStep, setOpenStep] = useState<number[]>(project.goals.flatMap(g => g.deliverables.map(d => d.id)));
  const [infoGoal, setInfoGoal] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ key: string; value: string } | null>(null);
  const [showLog, setShowLog] = useState(false);

  const pending = (p.approvals ?? []).filter(a => a.status === 'Pendente');
  const log = p.metaLog ?? [];

  const author = {
    name: user?.displayName ?? 'Desconhecido',
    role: user?.role ?? 'estagiario',
    isAdmin,
  };

  const submit = (edit: MetaEdit) => {
    if (!edit.to.trim() || edit.to === edit.from) { setEditing(null); return; }
    const result = submitMetaEdit(project.id, edit, author);
    setEditing(null);
    if (result === 'pendente') toast.info('Alteração enviada para validação de um administrador.');
    else toast.success('Alteração registrada.');
  };

  const goalProgress = useMemo(() => {
    const map: Record<number, number> = {};
    p.goals.forEach(g => {
      const acts = g.deliverables.flatMap(d => d.activities);
      map[g.id] = acts.length ? Math.round(acts.reduce((s, a) => s + a.progress, 0) / acts.length) : 0;
    });
    return map;
  }, [p.goals]);

  if (p.goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Target size={44} color="#CBD5E1" />
        <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
          Nenhuma meta cadastrada. Consulte o Plano de Trabalho no Drive.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            Monitoramento de Metas
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            Cronograma físico — {p.goals.length} metas ·{' '}
            {p.goals.flatMap(g => g.deliverables).length} etapas ·{' '}
            {p.goals.flatMap(g => g.deliverables.flatMap(d => d.activities)).length} especializações
          </p>
        </div>
        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
          style={{ borderColor: 'var(--border)', color: '#475569' }}
        >
          <History size={13} /> Registro de alterações ({log.length})
        </button>
      </div>

      {/* Aprovações pendentes */}
      {pending.length > 0 && (
        <div className="rounded-xl border p-4" style={{ borderColor: '#FCD34D', background: '#FFFBEB' }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} color="#B45309" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#B45309' }}>
              {pending.length} alteração(ões) aguardando validação de administrador
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pending.map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 bg-white rounded-lg border px-3 py-2" style={{ borderColor: '#FDE68A' }}>
                <div style={{ fontSize: '0.75rem', color: '#0F172A' }}>
                  <strong>{a.author}</strong> · {a.targetPath} · {a.field}:{' '}
                  <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{a.from || '—'}</span>{' → '}
                  <span style={{ color: '#059669' }}>{a.to}</span>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { approveMetaEdit(project.id, a.id, author.name); toast.success('Alteração aprovada.'); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-white"
                      style={{ background: '#059669' }}
                    ><Check size={11} /> Aprovar</button>
                    <button
                      onClick={() => { rejectMetaEdit(project.id, a.id, author.name); toast.error('Alteração recusada.'); }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border"
                      style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                    ><X size={11} /> Recusar</button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: '#B45309' }}>Aguardando administrador</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de meta */}
      {p.goals.map((g, gi) => {
        const isOpen = open.includes(g.id);
        const prog = goalProgress[g.id] ?? 0;
        const editKey = `meta-${g.id}`;
        return (
          <div key={g.id} className="bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-start gap-3 px-5 py-4 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
              <button onClick={() => setOpen(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])} className="mt-0.5">
                {isOpen ? <ChevronDown size={16} color="#64748B" /> : <ChevronRight size={16} color="#64748B" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                    META {gi + 1}
                  </span>
                  {editing?.key === editKey ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        autoFocus
                        className="flex-1 border rounded-md px-2 py-1 text-[13px]"
                        style={{ borderColor: 'var(--border)' }}
                        value={editing.value}
                        onChange={e => setEditing({ key: editKey, value: e.target.value })}
                      />
                      <button onClick={() => submit({ kind: 'meta', targetId: g.id, targetPath: `Meta ${gi + 1}`, field: 'nome', from: g.name, to: editing.value })}>
                        <Check size={15} color="#059669" />
                      </button>
                      <button onClick={() => setEditing(null)}><X size={15} color="#DC2626" /></button>
                    </div>
                  ) : (
                    <>
                      <h3 className="truncate" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.92rem', color: '#0F172A' }}>
                        {g.name}
                      </h3>
                      <button onClick={() => setEditing({ key: editKey, value: g.name })} title="Editar meta">
                        <Pencil size={12} color="#94A3B8" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-2 rounded-full flex-1" style={{ background: '#E2E8F0' }}>
                    <div className="h-full rounded-full" style={{ width: `${prog}%`, background: prog === 100 ? '#10B981' : '#2563EB' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{prog}%</span>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                    {g.deliverables.length} etapas
                  </span>
                </div>
              </div>
              <button onClick={() => setInfoGoal(g.id)} title="Mais informações" className="p-1 rounded-full hover:bg-blue-50">
                <Info size={17} color="#2563EB" />
              </button>
            </div>

            {isOpen && (
              <div className="p-4 flex flex-col gap-3">
                {g.deliverables.map((d, di) => {
                  const stepOpen = openStep.includes(d.id);
                  const acts = d.activities;
                  const dProg = acts.length ? Math.round(acts.reduce((s, a) => s + a.progress, 0) / acts.length) : 0;
                  const dKey = `etapa-${d.id}`;
                  return (
                    <div key={d.id} className="rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2 px-4 py-2.5">
                        <button onClick={() => setOpenStep(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}>
                          {stepOpen ? <ChevronDown size={14} color="#64748B" /> : <ChevronRight size={14} color="#64748B" />}
                        </button>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#F1F5F9', color: '#475569' }}>
                          ETAPA {gi + 1}.{di + 1}
                        </span>
                        {editing?.key === dKey ? (
                          <div className="flex items-center gap-1.5 flex-1">
                            <input
                              autoFocus
                              className="flex-1 border rounded-md px-2 py-1 text-[12.5px]"
                              style={{ borderColor: 'var(--border)' }}
                              value={editing.value}
                              onChange={e => setEditing({ key: dKey, value: e.target.value })}
                            />
                            <button onClick={() => submit({ kind: 'etapa', targetId: d.id, targetPath: `Meta ${gi + 1} › Etapa ${gi + 1}.${di + 1}`, field: 'nome', from: d.name, to: editing.value })}>
                              <Check size={14} color="#059669" />
                            </button>
                            <button onClick={() => setEditing(null)}><X size={14} color="#DC2626" /></button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1 truncate" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>{d.name}</span>
                            <button onClick={() => setEditing({ key: dKey, value: d.name })} title="Editar etapa">
                              <Pencil size={11} color="#94A3B8" />
                            </button>
                          </>
                        )}
                        <div className="w-24 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                          <div className="h-full rounded-full" style={{ width: `${dProg}%`, background: dProg === 100 ? '#10B981' : '#2563EB' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{dProg}%</span>
                      </div>

                      {stepOpen && (
                        <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                          {acts.length === 0 ? (
                            <div className="px-4 py-3" style={{ fontSize: '0.73rem', color: '#94A3B8' }}>Sem especializações cadastradas.</div>
                          ) : (
                            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                  {['', 'Especialização', 'Responsável', 'Início', 'Conclusão', 'Progresso', 'Status', ''].map((h, i) => (
                                    <th key={i} className="px-3 py-2 text-left" style={{ fontSize: '0.64rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {acts.map((a, ai) => {
                                  const cfg = statusConfig[a.status];
                                  const aKey = `esp-${a.id}`;
                                  const done = a.status === 'Concluído';
                                  const path = `Meta ${gi + 1} › Etapa ${gi + 1}.${di + 1} › Esp. ${ai + 1}`;
                                  return (
                                    <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td className="px-3 py-2 w-8">
                                        <input
                                          type="checkbox"
                                          checked={done}
                                          onChange={() => submit({
                                            kind: 'especializacao', targetId: a.id, targetPath: path, field: 'status',
                                            from: a.status, to: done ? 'Em andamento' : 'Concluído',
                                          })}
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        {editing?.key === aKey ? (
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              autoFocus
                                              className="flex-1 border rounded-md px-2 py-1 text-[12px]"
                                              style={{ borderColor: 'var(--border)' }}
                                              value={editing.value}
                                              onChange={e => setEditing({ key: aKey, value: e.target.value })}
                                            />
                                            <button onClick={() => submit({ kind: 'especializacao', targetId: a.id, targetPath: path, field: 'nome', from: a.name, to: editing.value })}>
                                              <Check size={13} color="#059669" />
                                            </button>
                                            <button onClick={() => setEditing(null)}><X size={13} color="#DC2626" /></button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <span style={{ fontSize: '0.76rem', color: '#334155', textDecoration: done ? 'line-through' : 'none' }}>
                                              <span style={{ fontFamily: 'var(--font-mono)', color: '#94A3B8', marginRight: 6 }}>{gi + 1}.{di + 1}.{ai + 1}</span>
                                              {a.name}
                                            </span>
                                            <button onClick={() => setEditing({ key: aKey, value: a.name })} title="Editar especialização">
                                              <Pencil size={11} color="#CBD5E1" />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-3 py-2" style={{ fontSize: '0.7rem', color: '#64748B' }}>{a.responsible || '—'}</td>
                                      <td className="px-3 py-2" style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>{a.startDate || '—'}</td>
                                      <td className="px-3 py-2" style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>{a.conclusionDate || '—'}</td>
                                      <td className="px-3 py-2 w-28">
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                                            <div className="h-full rounded-full" style={{ width: `${a.progress}%`, background: cfg.dot }} />
                                          </div>
                                          <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>{a.progress}%</span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap" style={{ color: cfg.color, background: cfg.bg }}>
                                          {a.status}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2" style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{a.observations || ''}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal de informações da meta */}
      {infoGoal !== null && (() => {
        const g = p.goals.find(x => x.id === infoGoal);
        if (!g) return null;
        const acts = g.deliverables.flatMap(d => d.activities);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setInfoGoal(null)}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border w-full max-w-4xl max-h-[85vh] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-4 px-6 py-4 border-b sticky top-0 bg-white" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.66rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '.06em' }}>Informações da meta</div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{g.name}</h3>
                </div>
                <button onClick={() => setInfoGoal(null)}><X size={16} /></button>
              </div>

              <div className="p-6 flex flex-col gap-5">
                {/* Indicadores */}
                <section>
                  <SectionTitle>Indicadores gerais</SectionTitle>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Etapas', value: String(g.deliverables.length) },
                      { label: 'Especializações', value: String(acts.length) },
                      { label: 'Concluídas', value: `${acts.filter(a => a.status === 'Concluído').length}/${acts.length}` },
                      { label: 'Progresso', value: `${goalProgress[g.id] ?? 0}%` },
                    ].map(kv => (
                      <div key={kv.label} className="rounded-lg p-3 border" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
                        <div style={{ fontSize: '0.63rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em' }}>{kv.label}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{kv.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Etapas em planilha */}
                <section>
                  <SectionTitle>Etapas da meta</SectionTitle>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['#', 'Etapa', 'Resultado esperado', 'Especializações', 'Progresso'].map(h => (
                            <th key={h} className="px-3 py-2 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.deliverables.map((d, di) => {
                          const dActs = d.activities;
                          const dp = dActs.length ? Math.round(dActs.reduce((s, a) => s + a.progress, 0) / dActs.length) : 0;
                          return (
                            <tr key={d.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td className="px-3 py-2" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{di + 1}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 500 }}>{d.name}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.72rem', color: '#64748B' }}>{d.expectedResult || '—'}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.72rem', color: '#64748B' }}>{dActs.length}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#2563EB', fontWeight: 600 }}>{dp}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Especializações em planilha */}
                <section>
                  <SectionTitle>Especializações / cronograma físico</SectionTitle>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Cód.', 'Especialização', 'Etapa', 'Responsável', 'Previsto', 'Início', 'Conclusão', 'Status', 'Observações'].map(h => (
                            <th key={h} className="px-3 py-2 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.deliverables.flatMap((d, di) => d.activities.map((a, ai) => {
                          const cfg = statusConfig[a.status];
                          return (
                            <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td className="px-3 py-2" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{di + 1}.{ai + 1}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.73rem', color: '#0F172A' }}>{a.name}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.7rem', color: '#64748B' }}>{d.name}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.7rem', color: '#64748B' }}>{a.responsible || '—'}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>{a.plannedDate || '—'}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>{a.startDate || '—'}</td>
                              <td className="px-3 py-2" style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#64748B' }}>{a.conclusionDate || '—'}</td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap" style={{ color: cfg.color, background: cfg.bg }}>{a.status}</span>
                              </td>
                              <td className="px-3 py-2" style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{a.observations || '—'}</td>
                            </tr>
                          );
                        }))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Registro de alterações */}
      {showLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setShowLog(false)}>
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>Registro de alterações</h3>
              <button onClick={() => setShowLog(false)}><X size={16} /></button>
            </div>
            {log.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Nenhuma alteração registrada ainda.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {log.map(l => (
                  <div key={l.id} className="rounded-lg border p-3" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase" style={{ background: '#F1F5F9', color: '#475569' }}>{l.kind}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{l.targetPath} · {l.field}</span>
                      <span className="ml-auto" style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {new Date(l.date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem' }}>
                      <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{l.from || '—'}</span>
                      {' → '}
                      <span style={{ color: '#059669' }}>{l.to}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1" style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      <span>por <strong>{l.author}</strong> ({l.authorRole})</span>
                      {l.approvedBy && (
                        <span className="flex items-center gap-1" style={{ color: '#059669' }}>
                          <ShieldCheck size={11} /> validado por {l.approvedBy}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
