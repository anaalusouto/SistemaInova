import { useMemo, useState, type ReactNode } from 'react';
import {
  ChevronDown, ChevronRight, Info, Target, Pencil, Check, X, Plus, Trash2,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type ActivityStatus } from '../../data/mockData';
import { useStore, type MetaEdit } from '../../store';
import { APP_PEOPLE, useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { ApprovalsBanner, useOpAuthor } from './ApprovalsBanner';

const statusConfig: Record<ActivityStatus, { color: string; bg: string; dot: string }> = {
  'Não iniciado': { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
  'Em andamento': { color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
  'Concluído':    { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  'Atrasado':     { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
};

/** Ciclo do check: Não iniciado → Em andamento → Concluído → Não iniciado. */
const nextStatus = (s: ActivityStatus): ActivityStatus =>
  s === 'Concluído' ? 'Não iniciado' : s === 'Em andamento' ? 'Concluído' : 'Em andamento';

interface Props { project: Project }

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.06em' }}>
      {children}
    </div>
  );
}

/** Campo de texto editável em linha (salva no blur / Enter). */
function CellInput({ value, onSave, placeholder, mono }: { value: string; onSave: (v: string) => void; placeholder?: string; mono?: boolean }) {
  const [v, setV] = useState(value);
  const [focused, setFocused] = useState(false);
  if (!focused && v !== value) setV(value);
  return (
    <input
      value={v}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onChange={e => setV(e.target.value)}
      onBlur={() => { setFocused(false); if (v !== value) onSave(v); }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className="w-full bg-transparent rounded px-1.5 py-1 border border-transparent hover:border-slate-200 focus:border-blue-300 focus:bg-white outline-none"
      style={{ fontSize: '0.7rem', color: '#475569', fontFamily: mono ? 'var(--font-mono)' : undefined }}
    />
  );
}

export function TabMetas({ project }: Props) {
  const { submitMetaEdit, getProject } = useStore();
  const { author, isAdmin } = useOpAuthor();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const p = getProject(project.id) ?? (project as never);
  const [open, setOpen] = useState<number[]>(project.goals.map(g => g.id));
  const [openStep, setOpenStep] = useState<number[]>(project.goals.flatMap(g => g.deliverables.map(d => d.id)));
  const [infoGoal, setInfoGoal] = useState<number | null>(null);
  const [editing, setEditing] = useState<{ key: string; value: string } | null>(null);

  const log = p.metaLog ?? [];

  const submit = (edit: MetaEdit, silent = false) => {
    const result = submitMetaEdit(project.id, edit, author);
    audit({
      userLogin: user?.login ?? '—',
      area: 'metas',
      action: `${edit.action} ${edit.entity}`,
      detail: edit.field
        ? `${edit.targetPath} · ${edit.field}: ${edit.from ?? '—'} → ${edit.to ?? '—'}`
        : `${edit.targetPath}${edit.to ? ` · ${edit.to}` : ''}`,
      projectId: project.id, projectName: project.name,
      kind: result === 'pendente' ? 'pendencia' : 'alteracao',
    });
    setEditing(null);
    if (silent) return;
    if (result === 'pendente') toast.info('Alteração enviada para validação de um administrador.');
    else toast.success('Alteração registrada.');
  };

  const submitRename = (edit: MetaEdit) => {
    if (!edit.to?.trim() || edit.to === edit.from) { setEditing(null); return; }
    submit(edit);
  };

  const askCreate = (label: string, base: Omit<MetaEdit, 'to' | 'action'>) => {
    const name = window.prompt(label);
    if (!name || !name.trim()) return;
    submit({ ...base, action: 'criar', to: name.trim(), payload: { name: name.trim() } });
  };

  const askDelete = (label: string, base: Omit<MetaEdit, 'action'>) => {
    if (!window.confirm(label)) return;
    submit({ ...base, action: 'excluir' });
  };

  const goalProgress = useMemo(() => {
    const map: Record<number, number> = {};
    p.goals.forEach(g => {
      const acts = g.deliverables.flatMap(d => d.activities);
      map[g.id] = acts.length ? Math.round(acts.reduce((s, a) => s + a.progress, 0) / acts.length) : 0;
    });
    return map;
  }, [p.goals]);

  const header = (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
          Monitoramento de Metas
        </h2>
        <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
          Cronograma físico — {p.goals.length} metas ·{' '}
          {p.goals.flatMap(g => g.deliverables).length} etapas ·{' '}
          {p.goals.flatMap(g => g.deliverables.flatMap(d => d.activities)).length} especificações
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => askCreate('Nome da nova meta:', { entity: 'meta', targetPath: 'Nova meta' })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={13} /> Nova meta
        </button>
      </div>
    </div>
  );

  if (p.goals.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
        {header}
        <ApprovalsBanner projectId={project.id} approvals={p.approvals ?? []} entities={['meta', 'etapa', 'especificacao']} />
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Target size={44} color="#CBD5E1" />
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>
            Nenhuma meta cadastrada. Use “Nova meta” para começar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
      {header}
      <ApprovalsBanner projectId={project.id} approvals={p.approvals ?? []} entities={['meta', 'etapa', 'especificacao']} />

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
                      <button onClick={() => submitRename({ entity: 'meta', action: 'editar', targetId: g.id, targetPath: `Meta ${gi + 1}`, field: 'nome', from: g.name, to: editing.value })}>
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
                      <button
                        onClick={() => askDelete(`Excluir a Meta ${gi + 1}?`, { entity: 'meta', targetId: g.id, targetPath: `Meta ${gi + 1}`, from: g.name })}
                        title="Excluir meta"
                      >
                        <Trash2 size={12} color="#DC2626" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-2 rounded-full flex-1" style={{ background: '#E2E8F0' }}>
                    <div className="h-full rounded-full" style={{ width: `${prog}%`, background: prog === 100 ? '#10B981' : '#2563EB' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{prog}%</span>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{g.deliverables.length} etapas</span>
                </div>
              </div>
              <button
                onClick={() => askCreate('Nome da nova etapa:', { entity: 'etapa', parentId: g.id, targetPath: `Meta ${gi + 1}` })}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border"
                style={{ borderColor: 'var(--border)', color: '#475569' }}
              >
                <Plus size={11} /> Etapa
              </button>
              <button onClick={() => setInfoGoal(g.id)} title="Mais informações" className="p-1 rounded-full hover:bg-blue-50">
                <Info size={17} color="#2563EB" />
              </button>
            </div>

            {isOpen && (
              <div className="p-4 flex flex-col gap-3">
                {g.deliverables.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Nenhuma etapa cadastrada nesta meta.</div>
                )}
                {g.deliverables.map((d, di) => {
                  const stepOpen = openStep.includes(d.id);
                  const acts = d.activities;
                  const dProg = acts.length ? Math.round(acts.reduce((s, a) => s + a.progress, 0) / acts.length) : 0;
                  const dKey = `etapa-${d.id}`;
                  const dPath = `Meta ${gi + 1} › Etapa ${gi + 1}.${di + 1}`;
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
                            <button onClick={() => submitRename({ entity: 'etapa', action: 'editar', targetId: d.id, targetPath: dPath, field: 'nome', from: d.name, to: editing.value })}>
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
                            <button
                              onClick={() => askDelete(`Excluir a Etapa ${gi + 1}.${di + 1}?`, { entity: 'etapa', targetId: d.id, targetPath: dPath, from: d.name })}
                              title="Excluir etapa"
                            >
                              <Trash2 size={11} color="#DC2626" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => askCreate('Nome da nova especificação (atividade):', { entity: 'especificacao', parentId: d.id, targetPath: dPath })}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border"
                          style={{ borderColor: 'var(--border)', color: '#475569' }}
                        >
                          <Plus size={10} /> Especificação
                        </button>
                        <div className="w-24 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                          <div className="h-full rounded-full" style={{ width: `${dProg}%`, background: dProg === 100 ? '#10B981' : '#2563EB' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{dProg}%</span>
                      </div>

                      {stepOpen && (
                        <div className="border-t overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
                          {acts.length === 0 ? (
                            <div className="px-4 py-3" style={{ fontSize: '0.73rem', color: '#94A3B8' }}>Sem especificações cadastradas.</div>
                          ) : (
                            <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 940 }}>
                              <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                  {['', 'Especificação', 'Responsável', 'Previsto', 'Início', 'Conclusão', 'Progresso', 'Status', 'Observações'].map((h, i) => (
                                    <th key={i} className="px-3 py-2 text-left" style={{ fontSize: '0.64rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {acts.map((a, ai) => {
                                  const cfg = statusConfig[a.status];
                                  const aKey = `esp-${a.id}`;
                                  const done = a.status === 'Concluído';
                                  const doing = a.status === 'Em andamento';
                                  const path = `${dPath} › Esp. ${ai + 1}`;
                                  const field = (f: string, from: string, to: string) =>
                                    submit({ entity: 'especificacao', action: 'editar', targetId: a.id, targetPath: path, field: f, from, to }, true);
                                  return (
                                    <tr key={a.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td className="px-3 py-2 w-9">
                                        <button
                                          title="1 clique: em andamento · 2 cliques: concluído · 3: não iniciado"
                                          onClick={() => submit({
                                            entity: 'especificacao', action: 'editar', targetId: a.id, targetPath: path, field: 'status',
                                            from: a.status, to: nextStatus(a.status),
                                          })}
                                          className="w-4 h-4 rounded flex items-center justify-center border"
                                          style={{
                                            borderColor: done ? '#10B981' : doing ? '#2563EB' : '#CBD5E1',
                                            background: done ? '#10B981' : doing ? '#DBEAFE' : '#fff',
                                          }}
                                        >
                                          {done ? <Check size={11} color="#fff" /> : doing ? <Minus size={11} color="#2563EB" /> : null}
                                        </button>
                                      </td>
                                      <td className="px-3 py-2 min-w-[240px]">
                                        {editing?.key === aKey ? (
                                          <div className="flex items-center gap-1.5">
                                            <input
                                              autoFocus
                                              className="flex-1 border rounded-md px-2 py-1 text-[12px]"
                                              style={{ borderColor: 'var(--border)' }}
                                              value={editing.value}
                                              onChange={e => setEditing({ key: aKey, value: e.target.value })}
                                            />
                                            <button onClick={() => submitRename({ entity: 'especificacao', action: 'editar', targetId: a.id, targetPath: path, field: 'nome', from: a.name, to: editing.value })}>
                                              <Check size={13} color="#059669" />
                                            </button>
                                            <button onClick={() => setEditing(null)}><X size={13} color="#DC2626" /></button>
                                          </div>
                                        ) : (
                                          <div className="flex items-start gap-1.5">
                                            <span style={{ fontSize: '0.76rem', color: '#334155', textDecoration: done ? 'line-through' : 'none' }}>
                                              <span style={{ fontFamily: 'var(--font-mono)', color: '#94A3B8', marginRight: 6 }}>{gi + 1}.{di + 1}.{ai + 1}</span>
                                              {a.name}
                                            </span>
                                            <button onClick={() => setEditing({ key: aKey, value: a.name })} title="Editar especificação">
                                              <Pencil size={11} color="#CBD5E1" />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-2 py-2 w-40">
                                        <select
                                          value={a.responsible || ''}
                                          onChange={e => field('responsável', a.responsible || '', e.target.value)}
                                          className="w-full bg-transparent rounded px-1 py-1 border border-transparent hover:border-slate-200 focus:border-blue-300 outline-none"
                                          style={{ fontSize: '0.7rem', color: '#475569' }}
                                        >
                                          <option value="">—</option>
                                          {APP_PEOPLE.map(pp => <option key={pp.login} value={pp.name}>{pp.name}</option>)}
                                          {a.responsible && !APP_PEOPLE.some(pp => pp.name === a.responsible) && (
                                            <option value={a.responsible}>{a.responsible}</option>
                                          )}
                                        </select>
                                      </td>
                                      <td className="px-2 py-2 w-32">
                                        <CellInput mono value={a.plannedDate || ''} placeholder="previsto" onSave={v => field('previsto', a.plannedDate || '', v)} />
                                      </td>
                                      <td className="px-2 py-2 w-28">
                                        <CellInput mono value={a.startDate || ''} placeholder="dd/mm/aaaa" onSave={v => field('início', a.startDate || '', v)} />
                                      </td>
                                      <td className="px-2 py-2 w-28">
                                        <CellInput mono value={a.conclusionDate || ''} placeholder="dd/mm/aaaa" onSave={v => field('conclusão', a.conclusionDate || '', v)} />
                                      </td>
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
                                      <td className="px-2 py-2 min-w-[140px]">
                                        <CellInput value={a.observations || ''} placeholder="—" onSave={v => field('observações', a.observations || '', v)} />
                                      </td>
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

      {!isAdmin && (
        <p style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
          Você está como estagiário: criações, edições e exclusões só passam a valer após a aprovação de um administrador.
        </p>
      )}

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
                <section>
                  <SectionTitle>Indicadores gerais</SectionTitle>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Etapas', value: String(g.deliverables.length) },
                      { label: 'Especificações', value: String(acts.length) },
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

                <section>
                  <SectionTitle>Etapas da meta</SectionTitle>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['#', 'Etapa', 'Resultado esperado', 'Especificações', 'Progresso'].map(h => (
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

                <section>
                  <SectionTitle>Especificações / cronograma físico</SectionTitle>
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC' }}>
                          {['Cód.', 'Especificação', 'Etapa', 'Responsável', 'Previsto', 'Início', 'Conclusão', 'Status', 'Observações'].map(h => (
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

    </div>
  );
}
