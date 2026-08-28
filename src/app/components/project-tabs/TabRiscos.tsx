import { useMemo, useState } from 'react';
import { Plus, ShieldAlert, Trash2, X, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type Risk, type RiskStatus, type Goal } from '../../data/mockData';
import type { JsonValue } from '../../data/projectExtras';
import { APP_PEOPLE, useAuth } from '../../auth/authStore';
import { useStore } from '../../store';
import type { ProjectExt } from '../../store';
import { useAudit } from '../../audit/auditStore';
import { ApprovalsBanner, useOpAuthor } from './ApprovalsBanner';

const RISK_STATUSES: RiskStatus[] = ['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'];
const RISK_CATEGORIES = ['Operacional', 'Técnico', 'Financeiro', 'Externo', 'Estratégico'];

const statusConfig: Record<RiskStatus, { color: string; bg: string }> = {
  'Aberto':       { color: 'var(--danger)', bg: 'var(--danger-soft)' },
  'Em mitigação': { color: 'var(--warning)', bg: 'var(--warning-soft)' },
  'Monitorando':  { color: 'var(--brand)', bg: 'var(--brand-soft)' },
  'Encerrado':    { color: 'var(--success)', bg: 'var(--success-soft)' },
};

function getSeverityColor(severity: number) {
  if (severity >= 15) return { bg: 'var(--danger)', text: 'var(--primary-foreground)', label: 'Crítico' };
  if (severity >= 9)  return { bg: 'var(--warning)', text: 'var(--primary-foreground)', label: 'Alto' };
  if (severity >= 4)  return { bg: 'var(--warning-soft-border)', text: 'var(--warning-strong-text)', label: 'Médio' };
  return { bg: 'var(--success-soft-border)', text: 'var(--success-strong-text)', label: 'Baixo' };
}

const PROB_LABELS = ['Muito Baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'];
const IMPACT_LABELS = ['Muito Baixo', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];

function matrixColor(p: number, i: number) {
  const val = p * i;
  if (val >= 15) return 'var(--danger-soft)';
  if (val >= 9)  return 'var(--warning-soft)';
  if (val >= 4)  return 'var(--warning-soft)';
  return 'var(--success-soft)';
}

interface TabRiscosProps { project: Project }

export function TabRiscos({ project }: TabRiscosProps) {
  const { submitMetaEdit, getProject } = useStore();
  const { author, isAdmin } = useOpAuthor();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const p = getProject(project.id) ?? (project as ProjectExt);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | RiskStatus>('Todos');
  const [expanded, setExpanded] = useState<string | null>(null);

  const record = (action: string, detail: string, kind: 'alteracao' | 'pendencia' = 'alteracao') =>
    audit({
      userLogin: user?.login ?? '—', area: 'riscos', action, detail,
      projectId: project.id, projectName: project.name, kind,
    });

  const notify = (r: 'aplicado' | 'pendente') =>
    r === 'pendente'
      ? toast.info('Solicitação enviada para validação de um administrador.')
      : toast.success('Registro atualizado.');

  const edit = async (risk: Risk, field: string, from: string, to: string) => {
    if (from === to) return;
    const result = await submitMetaEdit(project.id, {
      entity: 'risco', action: 'editar', targetId: risk.id,
      targetPath: `Risco: ${risk.description.slice(0, 40)}`, field, from, to,
    }, author);
    notify(result);
    record('editar risco', `${field}: ${from} → ${to} · ${risk.description.slice(0, 40)}`, result === 'pendente' ? 'pendencia' : 'alteracao');
  };

  const remove = async (risk: Risk) => {
    if (!window.confirm('Excluir este risco?')) return;
    const result = await submitMetaEdit(project.id, {
      entity: 'risco', action: 'excluir', targetId: risk.id,
      targetPath: `Risco: ${risk.description.slice(0, 40)}`, from: risk.description,
    }, author);
    notify(result);
    record('excluir risco', risk.description.slice(0, 40), result === 'pendente' ? 'pendencia' : 'alteracao');
  };

  const create = async (payload: Record<string, JsonValue>) => {
    const result = await submitMetaEdit(project.id, {
      entity: 'risco', action: 'criar',
      targetPath: 'Novo risco', to: String(payload.description ?? ''), payload,
    }, author);
    notify(result);
    record('cadastrar risco', String(payload.description ?? ''), result === 'pendente' ? 'pendencia' : 'alteracao');
    setShowForm(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...p.risks]
      .filter(r => statusFilter === 'Todos' || r.status === statusFilter)
      .filter(r => !q || `${r.description} ${r.category} ${r.responsible} ${r.responseStrategy}`.toLowerCase().includes(q))
      .sort((a, b) => b.severity - a.severity);
  }, [p.risks, query, statusFilter]);

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
            Gestão de Riscos
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 2 }}>
            {p.risks.length} riscos · {p.risks.filter(r => r.severity >= 15).length} críticos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={12} /> Novo Risco
        </button>
      </div>

      <ApprovalsBanner projectId={project.id} approvals={p.approvals ?? []} entities={['risco']} />

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
          <Search size={13} color="var(--ink-5)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar risco, responsável, estratégia…"
            className="outline-none bg-transparent"
            style={{ fontSize: '0.78rem', width: 260, color: 'var(--ink-1)' }}
          />
        </div>
        {(['Todos', ...RISK_STATUSES] as const).map(s => {
          const active = statusFilter === s;
          const count = s === 'Todos' ? p.risks.length : p.risks.filter(r => r.status === s).length;
          const cfg = s === 'Todos' ? { color: 'var(--ink-3)', bg: 'var(--surface-2)' } : statusConfig[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium border"
              style={{
                color: cfg.color,
                background: cfg.bg,
                borderColor: active ? cfg.color : 'transparent',
              }}
            >
              {count} {s}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Matriz */}
        <div className="col-span-4 bg-card rounded-xl border p-5 sticky top-0" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)', marginBottom: 14 }}>
            Matriz de Risco
          </h3>
          <div className="relative">
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium" style={{ color: 'var(--ink-5)', transformOrigin: 'center' }}>
              Probabilidade
            </div>
            <div className="ml-4">
              <div className="flex flex-col-reverse gap-0.5">
                {[1, 2, 3, 4, 5].map(prob => (
                  <div key={prob} className="flex items-center gap-0.5">
                    <span className="text-[9px] w-16 text-right pr-1" style={{ color: 'var(--ink-5)' }}>{PROB_LABELS[prob - 1]}</span>
                    {[1, 2, 3, 4, 5].map(impact => {
                      const cell = p.risks.filter(r => r.probability === prob && r.impact === impact);
                      return (
                        <div
                          key={impact}
                          className="w-9 h-9 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{ background: matrixColor(prob, impact) }}
                          title={cell.map(r => r.description).join(', ')}
                        >
                          {cell.length > 0 ? (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ background: getSeverityColor(prob * impact).bg === 'var(--success-soft-border)' ? 'var(--success)' : getSeverityColor(prob * impact).bg }}
                            >{cell.length}</span>
                          ) : (
                            <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '0.6rem' }}>{prob * impact}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex gap-0.5 mt-1 ml-[68px]">
                {IMPACT_LABELS.map(l => (
                  <span key={l} className="w-9 text-center" style={{ fontSize: '0.55rem', color: 'var(--ink-5)' }}>{l.split(' ').pop()}</span>
                ))}
              </div>
              <div className="text-center mt-1 ml-16" style={{ fontSize: '10px', color: 'var(--ink-5)' }}>Impacto</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { color: 'var(--success-soft)', label: 'Baixo (1–3)' },
              { color: 'var(--warning-soft)', label: 'Médio (4–8)' },
              { color: 'var(--warning-soft)', label: 'Alto (9–14)' },
              { color: 'var(--danger-soft)', label: 'Crítico (≥15)' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--ink-3)' }}>
                <span className="w-3 h-3 rounded" style={{ background: l.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Lista fluida de riscos */}
        <div className="col-span-8 flex flex-col gap-2">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
              <ShieldAlert size={40} color="var(--line-2)" />
              <p style={{ color: 'var(--ink-5)', fontSize: '0.85rem' }}>Nenhum risco encontrado.</p>
            </div>
          )}
          {filtered.map(risk => {
            const sev = getSeverityColor(risk.severity);
            const sCfg = statusConfig[risk.status];
            const isOpen = expanded === risk.id;
            const goal = p.goals.find(g => g.id === risk.goalId);
            return (
              <div key={risk.id} className="bg-card rounded-xl border" style={{ borderColor: isOpen ? 'var(--brand-soft-border)' : 'var(--border)' }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpanded(isOpen ? null : risk.id)}>
                    {isOpen ? <ChevronDown size={15} color="var(--ink-4)" /> : <ChevronRight size={15} color="var(--ink-4)" />}
                  </button>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold flex-shrink-0" style={{ background: sev.bg, color: sev.text }}>
                    {risk.severity}
                  </span>
                  <span className="flex-1 min-w-0 truncate" style={{ fontSize: '0.82rem', color: 'var(--ink-1)', fontWeight: 500 }}>
                    {risk.description}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                    {risk.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 whitespace-nowrap" style={{ color: sCfg.color, background: sCfg.bg }}>
                    {risk.status}
                  </span>
                  <button onClick={() => remove(risk)} className="p-1 rounded hover:bg-red-50 flex-shrink-0" title="Excluir risco">
                    <Trash2 size={13} color="var(--danger)" />
                  </button>
                </div>

                {isOpen && (
                  <div className="px-5 pb-4 pt-1 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
                    {(risk.stage || risk.spec) && (
                      <div className="col-span-2 rounded-lg border p-3 grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
                        <div>
                          <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ink-5)' }}>Etapa vinculada</span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--ink-1)' }}>{risk.stage || '—'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold uppercase" style={{ color: 'var(--ink-5)' }}>Especificação (métricas e resultados)</span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--ink-1)' }}>{risk.spec || '—'}</p>
                        </div>
                      </div>
                    )}
                    <Field label="Descrição" full>
                      <textarea
                        defaultValue={risk.description}
                        onBlur={e => edit(risk, 'descrição', risk.description, e.target.value)}
                        className="ipt min-h-[52px]"
                      />
                    </Field>
                    <Field label="Meta vinculada">
                      <select className="ipt" value={risk.goalId ?? ''} onChange={e => edit(risk, 'meta', String(risk.goalId ?? ''), e.target.value)}>
                        <option value="">—</option>
                        {p.goals.map((g, i) => <option key={g.id} value={g.id}>{`Meta ${i + 1} — ${g.name.slice(0, 50)}`}</option>)}
                      </select>
                      {goal && <span style={{ fontSize: '0.66rem', color: 'var(--ink-5)' }}>{goal.name}</span>}
                    </Field>
                    <Field label="Categoria">
                      <select className="ipt" value={risk.category} onChange={e => edit(risk, 'categoria', risk.category, e.target.value)}>
                        {RISK_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        {!RISK_CATEGORIES.includes(risk.category) && <option>{risk.category}</option>}
                      </select>
                    </Field>
                    <Field label="Probabilidade (1-5)">
                      <input type="number" min={1} max={5} className="ipt" defaultValue={risk.probability}
                        onBlur={e => edit(risk, 'probabilidade', String(risk.probability), e.target.value)} />
                    </Field>
                    <Field label="Impacto (1-5)">
                      <input type="number" min={1} max={5} className="ipt" defaultValue={risk.impact}
                        onBlur={e => edit(risk, 'impacto', String(risk.impact), e.target.value)} />
                    </Field>
                    <Field label="Responsável">
                      <select className="ipt" value={risk.responsible} onChange={e => edit(risk, 'responsável', risk.responsible, e.target.value)}>
                        <option value="">—</option>
                        {APP_PEOPLE.map(pp => <option key={pp.login} value={pp.name}>{`${pp.name} (${pp.role})`}</option>)}
                        {risk.responsible && !APP_PEOPLE.some(pp => pp.name === risk.responsible) && <option>{risk.responsible}</option>}
                      </select>
                    </Field>
                    <Field label="Status">
                      <select className="ipt" value={risk.status} onChange={e => edit(risk, 'status', risk.status, e.target.value)}>
                        {RISK_STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </Field>
                    <Field label="Estratégia de resposta" full>
                      <textarea
                        defaultValue={risk.responseStrategy}
                        onBlur={e => edit(risk, 'estratégia', risk.responseStrategy, e.target.value)}
                        className="ipt min-h-[52px]"
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
          {!isAdmin && (
            <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
              Criações, edições e exclusões feitas por estagiários passam a valer após a aprovação de um administrador.
            </p>
          )}
        </div>
      </div>

      {showForm && <RiskForm goals={p.goals} onClose={() => setShowForm(false)} onSave={create} />}

      <style>{`.ipt{border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
.ipt:focus{border-color:var(--primary);background:var(--surface-0)}`}</style>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
      <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>{label}</span>
      {children}
    </label>
  );
}

function RiskForm({ goals, onClose, onSave }: {
  goals: Goal[];
  onClose: () => void;
  onSave: (r: Record<string, JsonValue>) => void;
}) {
  const [f, setF] = useState({
    goalId: goals[0]?.id ?? '',
    description: '',
    category: 'Operacional',
    probability: 3,
    impact: 3,
    responseStrategy: '',
    responsible: APP_PEOPLE[0]?.name ?? '',
    status: 'Aberto' as RiskStatus,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.description.trim()) { toast.error('Descreva o risco.'); return; }
    if (!f.goalId) { toast.error('Vincule o risco a uma meta.'); return; }
    onSave(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Cadastrar Risco</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Meta vinculada *" full>
            <select className="ipt" value={f.goalId} onChange={e => setF({ ...f, goalId: e.target.value })}>
              {goals.length === 0 && <option value="">Nenhuma meta cadastrada</option>}
              {goals.map((g, i) => <option key={g.id} value={g.id}>{`Meta ${i + 1} — ${g.name}`}</option>)}
            </select>
          </Field>
          <Field label="Descrição *" full><textarea className="ipt min-h-[60px]" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Categoria">
            <select className="ipt" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
              {RISK_CATEGORIES.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Responsável">
            <select className="ipt" value={f.responsible} onChange={e => setF({ ...f, responsible: e.target.value })}>
              {APP_PEOPLE.map(pp => <option key={pp.login} value={pp.name}>{`${pp.name} (${pp.role})`}</option>)}
            </select>
          </Field>
          <Field label="Probabilidade (1-5)"><input type="number" min={1} max={5} className="ipt" value={f.probability} onChange={e => setF({ ...f, probability: Number(e.target.value) })} /></Field>
          <Field label="Impacto (1-5)"><input type="number" min={1} max={5} className="ipt" value={f.impact} onChange={e => setF({ ...f, impact: Number(e.target.value) })} /></Field>
          <Field label="Estratégia de resposta" full><textarea className="ipt min-h-[50px]" value={f.responseStrategy} onChange={e => setF({ ...f, responseStrategy: e.target.value })} /></Field>
          <Field label="Status">
            <select className="ipt" value={f.status} onChange={e => setF({ ...f, status: e.target.value as RiskStatus })}>
              {RISK_STATUSES.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Cancelar</button>
          <button type="submit" className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
        <style>{`.ipt{border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
.ipt:focus{border-color:var(--primary);background:var(--surface-0)}`}</style>
      </form>
    </div>
  );
}
