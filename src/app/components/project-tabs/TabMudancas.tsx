import { useMemo, useState } from 'react';
import { Plus, GitBranch, CheckCircle2, Clock, XCircle, X, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type Change, type ApprovalStatus, type ChangeType, type ChangeNature, type Goal } from '../../data/mockData';
import type { JsonValue } from '../../data/projectExtras';
import { usePeople, useAuth } from '../../auth/authStore';
import { useStore, type ProjectExt } from '../../store';
import { useAudit } from '../../audit/auditStore';
import { ApprovalsBanner, useOpAuthor } from './ApprovalsBanner';

const CHANGE_TYPES: ChangeType[] = ['Escopo', 'Prazo', 'Financeiro', 'Equipe', 'Técnico'];

const approvalConfig: Record<ApprovalStatus, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  'Aprovado':  { color: 'var(--success)', bg: 'var(--success-soft)', icon: CheckCircle2 },
  'Pendente':  { color: 'var(--warning)', bg: 'var(--warning-soft)', icon: Clock },
  'Reprovado': { color: 'var(--danger)', bg: 'var(--danger-soft)', icon: XCircle },
};

const typeColors: Record<ChangeType, { color: string; bg: string }> = {
  'Escopo':     { color: 'var(--info)', bg: 'var(--info-soft)' },
  'Prazo':      { color: 'var(--brand)', bg: 'var(--brand-soft)' },
  'Financeiro': { color: 'var(--warning)', bg: 'var(--warning-soft)' },
  'Equipe':     { color: 'var(--success)', bg: 'var(--success-soft)' },
  'Técnico':    { color: 'var(--ink-4)', bg: 'var(--surface-2)' },
};

interface Props { project: Project }

export function TabMudancas({ project }: Props) {
  const { submitMetaEdit, getProject } = useStore();
  const { author, isAdmin } = useOpAuthor();
  const { user } = useAuth();
  const APP_PEOPLE = usePeople();
  const { log: audit } = useAudit();
  const p = getProject(project.id) ?? (project as ProjectExt);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const record = (action: string, detail: string, kind: 'alteracao' | 'pendencia' = 'alteracao') =>
    audit({
      userLogin: user?.login ?? '—', area: 'mudanças', action, detail,
      projectId: project.id, projectName: project.name, kind,
    });

  const notify = (r: 'aplicado' | 'pendente') =>
    r === 'pendente'
      ? toast.info('Solicitação enviada para validação de um administrador.')
      : toast.success('Registro atualizado.');

  const edit = async (c: Change, field: string, from: string, to: string) => {
    if (from === to) return;
    const result = await submitMetaEdit(project.id, {
      entity: 'mudanca', action: 'editar', targetId: c.id,
      targetPath: `Mudança: ${c.description.slice(0, 40)}`, field, from, to,
    }, author);
    notify(result);
    record('editar mudança', `${field}: ${from} → ${to} · ${c.description.slice(0, 40)}`, result === 'pendente' ? 'pendencia' : 'alteracao');
  };

  const remove = async (c: Change) => {
    if (!window.confirm('Excluir esta mudança?')) return;
    const result = await submitMetaEdit(project.id, {
      entity: 'mudanca', action: 'excluir', targetId: c.id,
      targetPath: `Mudança: ${c.description.slice(0, 40)}`, from: c.description,
    }, author);
    notify(result);
    record('excluir mudança', c.description.slice(0, 40), result === 'pendente' ? 'pendencia' : 'alteracao');
  };

  const create = async (payload: Record<string, JsonValue>) => {
    const result = await submitMetaEdit(project.id, {
      entity: 'mudanca', action: 'criar', targetPath: 'Nova mudança',
      to: String(payload.description ?? ''), payload,
    }, author);
    notify(result);
    record('registrar mudança', String(payload.description ?? ''), result === 'pendente' ? 'pendencia' : 'alteracao');
    setShowForm(false);
  };

  const pending  = p.changes.filter(c => c.approval === 'Pendente').length;
  const approved = p.changes.filter(c => c.approval === 'Aprovado').length;
  const rejected = p.changes.filter(c => c.approval === 'Reprovado').length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return p.changes.filter(c => !q || `${c.description} ${c.justification} ${c.responsible} ${c.type}`.toLowerCase().includes(q));
  }, [p.changes, query]);

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
            Gestão de Mudanças
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 2 }}>
            {p.changes.length} mudanças registradas
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={12} /> Registrar Mudança
        </button>
      </div>

      <ApprovalsBanner projectId={project.id} approvals={p.approvals ?? []} entities={['mudanca']} />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
          <Search size={13} color="var(--ink-5)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar mudança…"
            className="outline-none bg-transparent"
            style={{ fontSize: '0.78rem', width: 240, color: 'var(--ink-1)' }}
          />
        </div>
        {[
          { label: 'Pendentes', count: pending, color: 'var(--warning)', bg: 'var(--warning-soft)' },
          { label: 'Aprovadas', count: approved, color: 'var(--success)', bg: 'var(--success-soft)' },
          { label: 'Reprovadas', count: rejected, color: 'var(--danger)', bg: 'var(--danger-soft)' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: s.bg }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>{s.count}</span>
            <span style={{ fontSize: '0.75rem', color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <GitBranch size={40} color="var(--line-2)" />
          <p style={{ color: 'var(--ink-5)', fontSize: '0.875rem' }}>Nenhuma mudança registrada.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(change => {
            const aCfg = approvalConfig[change.approval];
            const tCfg = typeColors[change.type] ?? typeColors['Técnico'];
            const ApprIcon = aCfg.icon;
            const isOpen = expanded === change.id;
            return (
              <div key={change.id} className="bg-card rounded-xl border" style={{ borderColor: isOpen ? 'var(--brand-soft-border)' : 'var(--border)' }}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpanded(isOpen ? null : change.id)}>
                    {isOpen ? <ChevronDown size={15} color="var(--ink-4)" /> : <ChevronRight size={15} color="var(--ink-4)" />}
                  </button>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
                    <GitBranch size={13} color="var(--brand)" />
                  </div>
                  <span className="flex-1 min-w-0 truncate" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-1)' }}>{change.description}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0" style={{ color: tCfg.color, background: tCfg.bg }}>{change.type}</span>
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0" style={{ color: aCfg.color, background: aCfg.bg }}>
                    <ApprIcon size={10} /> {change.approval}
                  </span>
                  <button onClick={() => remove(change)} className="p-1 rounded hover:bg-red-50 flex-shrink-0" title="Excluir mudança">
                    <Trash2 size={13} color="var(--danger)" />
                  </button>
                </div>

                {isOpen && (
                  <div className="px-5 pb-4 pt-1 border-t grid grid-cols-2 gap-3" style={{ borderColor: 'var(--border)' }}>
                    <Field label="Descrição" full>
                      <input className="ipt" defaultValue={change.description} onBlur={e => edit(change, 'descrição', change.description, e.target.value)} />
                    </Field>
                    <Field label="Meta vinculada">
                      <select className="ipt" value={change.goalId ?? ''} onChange={e => edit(change, 'meta', String(change.goalId ?? ''), e.target.value)}>
                        <option value="">—</option>
                        {p.goals.map((g, i) => <option key={g.id} value={g.id}>{`Meta ${i + 1} — ${g.name.slice(0, 50)}`}</option>)}
                      </select>
                    </Field>
                    <Field label="Natureza">
                      <select className="ipt" value={change.nature ?? 'Adaptação'} onChange={e => edit(change, 'natureza', change.nature ?? '', e.target.value)}>
                        <option value="Radical">Radical — a meta foi completamente alterada</option>
                        <option value="Adaptação">Adaptação — a meta foi adaptada a outro contexto</option>
                        <option value="Exclusão">Exclusão — a meta não faz mais sentido</option>
                      </select>
                    </Field>
                    <Field label="Tipo">
                      <select className="ipt" value={change.type} onChange={e => edit(change, 'tipo', change.type, e.target.value)}>
                        {CHANGE_TYPES.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                    <Field label="Data">
                      <input className="ipt" defaultValue={change.date} onBlur={e => edit(change, 'data', change.date, e.target.value)} />
                    </Field>
                    <Field label="Responsável">
                      <select className="ipt" value={change.responsible} onChange={e => edit(change, 'responsável', change.responsible, e.target.value)}>
                        <option value="">—</option>
                        {APP_PEOPLE.map(pp => <option key={pp.login} value={pp.name}>{`${pp.name} (${pp.role})`}</option>)}
                        {change.responsible && !APP_PEOPLE.some(pp => pp.name === change.responsible) && <option>{change.responsible}</option>}
                      </select>
                    </Field>
                    <Field label="Situação da aprovação">
                      <select className="ipt" value={change.approval} onChange={e => edit(change, 'aprovação', change.approval, e.target.value)} disabled={!isAdmin}>
                        {(['Pendente', 'Aprovado', 'Reprovado'] as ApprovalStatus[]).map(o => <option key={o}>{o}</option>)}
                      </select>
                    </Field>
                    <Field label="Justificativa" full>
                      <textarea className="ipt min-h-[60px]" defaultValue={change.justification} onBlur={e => edit(change, 'justificativa', change.justification, e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        onClick={() => setShowForm(true)}
        className="rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300 transition-colors"
        style={{ borderColor: 'var(--line-2)' }}
      >
        <Plus size={20} color="var(--ink-5)" />
        <span style={{ fontSize: '0.825rem', color: 'var(--ink-5)' }}>Registrar nova mudança</span>
      </div>

      {!isAdmin && (
        <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
          Criações, edições e exclusões feitas por estagiários passam a valer após a aprovação de um administrador.
        </p>
      )}

      {showForm && <ChangeForm goals={p.goals} onClose={() => setShowForm(false)} onSave={create} />}

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

function ChangeForm({ goals, onClose, onSave }: {
  goals: Goal[];
  onClose: () => void;
  onSave: (c: Record<string, JsonValue>) => void;
}) {
  const APP_PEOPLE = usePeople();
  const [f, setF] = useState({
    description: '',
    type: 'Escopo' as ChangeType,
    date: new Date().toLocaleDateString('pt-BR'),
    justification: '',
    approval: 'Pendente' as ApprovalStatus,
    responsible: APP_PEOPLE[0]?.name ?? '',
    goalId: goals[0]?.id ?? '',
    nature: 'Adaptação' as ChangeNature,
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.description.trim()) { toast.error('Descreva a mudança.'); return; }
    if (!f.goalId) { toast.error('Vincule a mudança a uma meta.'); return; }
    onSave(f);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Registrar Mudança</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Meta vinculada *" full>
            <select className="ipt" value={f.goalId} onChange={e => setF({ ...f, goalId: e.target.value })}>
              {goals.length === 0 && <option value="">Nenhuma meta cadastrada</option>}
              {goals.map((g, i) => <option key={g.id} value={g.id}>{`Meta ${i + 1} — ${g.name}`}</option>)}
            </select>
          </Field>
          <Field label="É uma mudança *">
            <select className="ipt" value={f.nature} onChange={e => setF({ ...f, nature: e.target.value as ChangeNature })}>
              <option value="Radical">Radical — a meta foi completamente alterada</option>
              <option value="Adaptação">Adaptação — a meta foi adaptada a outro contexto</option>
              <option value="Exclusão">Exclusão — a meta não faz mais sentido</option>
            </select>
          </Field>
          <Field label="Descrição *" full><input className="ipt" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Tipo">
            <select className="ipt" value={f.type} onChange={e => setF({ ...f, type: e.target.value as ChangeType })}>
              {CHANGE_TYPES.map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Data"><input className="ipt" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Responsável" full>
            <select className="ipt" value={f.responsible} onChange={e => setF({ ...f, responsible: e.target.value })}>
              {APP_PEOPLE.map(pp => <option key={pp.login} value={pp.name}>{`${pp.name} (${pp.role})`}</option>)}
            </select>
          </Field>
          <Field label="Justificativa" full><textarea className="ipt min-h-[70px]" value={f.justification} onChange={e => setF({ ...f, justification: e.target.value })} /></Field>
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
