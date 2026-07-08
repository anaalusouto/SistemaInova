import { useState } from 'react';
import { Plus, GitBranch, CheckCircle2, Clock, XCircle, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type ApprovalStatus, type ChangeType } from '../../data/mockData';
import { useStore } from '../../store';

const approvalConfig: Record<ApprovalStatus, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  'Aprovado':  { color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
  'Pendente':  { color: '#D97706', bg: '#FFFBEB', icon: Clock },
  'Reprovado': { color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
};

const typeColors: Record<ChangeType, { color: string; bg: string }> = {
  'Escopo':     { color: '#7C3AED', bg: '#F5F3FF' },
  'Prazo':      { color: '#2563EB', bg: '#EFF6FF' },
  'Financeiro': { color: '#D97706', bg: '#FFFBEB' },
  'Equipe':     { color: '#059669', bg: '#ECFDF5' },
  'Técnico':    { color: '#6B7280', bg: '#F3F4F6' },
};

interface Props { project: Project; }

export function TabMudancas({ project }: Props) {
  const { addChange, updateChangeApproval, deleteChange } = useStore();
  const [showForm, setShowForm] = useState(false);

  const pending  = project.changes.filter(c => c.approval === 'Pendente').length;
  const approved = project.changes.filter(c => c.approval === 'Aprovado').length;
  const rejected = project.changes.filter(c => c.approval === 'Reprovado').length;

  const openForm = () => setShowForm(true);

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            Gestão de Mudanças
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            {project.changes.length} mudanças registradas
          </p>
        </div>
        <button
          onClick={openForm}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={12} /> Registrar Mudança
        </button>
      </div>

      {project.changes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <GitBranch size={40} color="#CBD5E1" />
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Nenhuma mudança registrada.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            {[
              { label: 'Pendentes', count: pending, color: '#D97706', bg: '#FFFBEB' },
              { label: 'Aprovadas', count: approved, color: '#059669', bg: '#ECFDF5' },
              { label: 'Reprovadas', count: rejected, color: '#DC2626', bg: '#FEF2F2' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: s.bg }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: s.color }}>{s.count}</span>
                <span style={{ fontSize: '0.78rem', color: s.color }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {project.changes.map(change => {
              const aCfg = approvalConfig[change.approval];
              const tCfg = typeColors[change.type];
              const ApprIcon = aCfg.icon;
              return (
                <div key={change.id} className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                        <GitBranch size={13} color="#2563EB" />
                      </div>
                      <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{change.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ color: tCfg.color, background: tCfg.bg }}>{change.type}</span>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium" style={{ color: aCfg.color, background: aCfg.bg }}>
                        <ApprIcon size={10} /> {change.approval}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm('Excluir esta mudança?')) {
                            deleteChange(project.id, change.id);
                            toast.success('Mudança excluída.');
                          }
                        }}
                        className="p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 size={12} color="#DC2626" />
                      </button>
                    </div>
                  </div>

                  <div className="px-5 py-4 grid grid-cols-3 gap-4">
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Data</div>
                      <span style={{ fontSize: '0.8rem', color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{change.date}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Responsável</div>
                      <span style={{ fontSize: '0.8rem', color: '#0F172A' }}>{change.responsible}</span>
                    </div>
                    <div />
                    <div className="col-span-3">
                      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Justificativa</div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>{change.justification}</p>
                    </div>
                  </div>

                  {change.approval === 'Pendente' && (
                    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t" style={{ borderColor: 'var(--border)', background: '#FAFBFD' }}>
                      <button
                        onClick={() => { updateChangeApproval(project.id, change.id, 'Reprovado'); toast.info('Mudança reprovada.'); }}
                        className="text-[12px] px-3 py-1 rounded-md font-medium"
                        style={{ background: '#FEF2F2', color: '#DC2626' }}
                      >Reprovar</button>
                      <button
                        onClick={() => { updateChangeApproval(project.id, change.id, 'Aprovado'); toast.success('Mudança aprovada.'); }}
                        className="text-[12px] px-3 py-1 rounded-md font-medium text-white"
                        style={{ background: '#059669' }}
                      >Aprovar</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div
        onClick={openForm}
        className="rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-300 transition-colors"
        style={{ borderColor: '#CBD5E1' }}
      >
        <Plus size={20} color="#94A3B8" />
        <span style={{ fontSize: '0.825rem', color: '#94A3B8' }}>Registrar nova mudança</span>
      </div>

      {showForm && (
        <ChangeForm
          onClose={() => setShowForm(false)}
          onSave={(c) => {
            addChange(project.id, c);
            toast.success('Mudança registrada.');
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function ChangeForm({ onClose, onSave }: {
  onClose: () => void;
  onSave: (c: { description: string; type: ChangeType; date: string; justification: string; approval: ApprovalStatus; responsible: string }) => void;
}) {
  const [f, setF] = useState({
    description: '',
    type: 'Escopo' as ChangeType,
    date: new Date().toLocaleDateString('pt-BR'),
    justification: '',
    approval: 'Pendente' as ApprovalStatus,
    responsible: '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.description.trim()) { toast.error('Descreva a mudança.'); return; }
    onSave(f);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Registrar Mudança</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Descrição *" full><input className="ipt" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></L>
          <L label="Tipo">
            <select className="ipt" value={f.type} onChange={e => setF({ ...f, type: e.target.value as ChangeType })}>
              {(['Escopo', 'Prazo', 'Financeiro', 'Equipe', 'Técnico'] as ChangeType[]).map(o => <option key={o}>{o}</option>)}
            </select>
          </L>
          <L label="Data"><input className="ipt" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></L>
          <L label="Responsável" full><input className="ipt" value={f.responsible} onChange={e => setF({ ...f, responsible: e.target.value })} /></L>
          <L label="Justificativa" full><textarea className="ipt min-h-[70px]" value={f.justification} onChange={e => setF({ ...f, justification: e.target.value })} /></L>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: '#475569' }}>Cancelar</button>
          <button type="submit" className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
        <style>{`.ipt{border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;width:100%;background:#F8FAFC;color:#0F172A}
.ipt:focus{border-color:var(--primary);background:#fff}`}</style>
      </form>
    </div>
  );
}

function L({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
      <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>{label}</span>
      {children}
    </label>
  );
}
