import { useState } from 'react';
import { Plus, ShieldAlert, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type RiskStatus } from '../../data/mockData';
import { useStore } from '../../store';

const statusConfig: Record<RiskStatus, { color: string; bg: string }> = {
  'Aberto':       { color: '#DC2626', bg: '#FEF2F2' },
  'Em mitigação': { color: '#D97706', bg: '#FFFBEB' },
  'Monitorando':  { color: '#2563EB', bg: '#EFF6FF' },
  'Encerrado':    { color: '#059669', bg: '#ECFDF5' },
};

function getSeverityColor(severity: number) {
  if (severity >= 15) return { bg: '#DC2626', text: '#fff', label: 'Crítico' };
  if (severity >= 9)  return { bg: '#F59E0B', text: '#fff', label: 'Alto' };
  if (severity >= 4)  return { bg: '#FCD34D', text: '#92400E', label: 'Médio' };
  return { bg: '#86EFAC', text: '#14532D', label: 'Baixo' };
}

interface TabRiscosProps {
  project: Project;
}

// 5x5 risk matrix
const PROB_LABELS = ['Muito Baixa', 'Baixa', 'Média', 'Alta', 'Muito Alta'];
const IMPACT_LABELS = ['Muito Baixo', 'Baixo', 'Médio', 'Alto', 'Muito Alto'];

function matrixColor(p: number, i: number) {
  const val = p * i;
  if (val >= 15) return '#FEE2E2';
  if (val >= 9)  return '#FEF3C7';
  if (val >= 4)  return '#FEF9C3';
  return '#DCFCE7';
}

export function TabRiscos({ project }: TabRiscosProps) {
  const { addRisk, deleteRisk } = useStore();
  const [showForm, setShowForm] = useState(false);

  if (project.risks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <ShieldAlert size={48} color="#CBD5E1" />
        <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Nenhum risco cadastrado neste projeto.</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={14} /> Cadastrar Risco
        </button>
        {showForm && (
          <RiskForm
            onClose={() => setShowForm(false)}
            onSave={(r) => {
              addRisk(project.id, r);
              toast.success('Risco cadastrado.');
              setShowForm(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
          Gestão de Riscos
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={12} /> Novo Risco
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3">
        {['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'].map(s => {
          const count = project.risks.filter(r => r.status === s).length;
          const cfg = statusConfig[s as RiskStatus];
          return (
            <span
              key={s}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium"
              style={{ color: cfg.color, background: cfg.bg }}
            >
              {count} {s}
            </span>
          );
        })}
        <span className="ml-auto text-[12px]" style={{ color: '#94A3B8' }}>
          {project.risks.filter(r => r.severity >= 15).length} riscos críticos
        </span>
      </div>

      {/* Matrix + Table */}
      <div className="grid grid-cols-12 gap-4">
        {/* Risk Matrix */}
        <div
          className="col-span-5 bg-card rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: 14 }}>
            Matriz de Risco
          </h3>
          <div className="relative">
            {/* Y axis label */}
            <div
              className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-medium"
              style={{ color: '#94A3B8', transformOrigin: 'center' }}
            >
              Probabilidade
            </div>

            <div className="ml-4">
              <div className="flex flex-col-reverse gap-0.5">
                {[1, 2, 3, 4, 5].map(prob => (
                  <div key={prob} className="flex items-center gap-0.5">
                    <span className="text-[9px] w-16 text-right pr-1" style={{ color: '#94A3B8' }}>
                      {PROB_LABELS[prob - 1]}
                    </span>
                    {[1, 2, 3, 4, 5].map(impact => {
                      const cell = project.risks.filter(r => r.probability === prob && r.impact === impact);
                      return (
                        <div
                          key={impact}
                          className="w-9 h-9 rounded flex items-center justify-center text-[10px] font-bold relative group"
                          style={{ background: matrixColor(prob, impact) }}
                          title={cell.map(r => r.description).join(', ')}
                        >
                          {cell.length > 0 && (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                              style={{ background: getSeverityColor(prob * impact).bg === '#86EFAC' ? '#22C55E' : getSeverityColor(prob * impact).bg }}
                            >
                              {cell.length}
                            </span>
                          )}
                          <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: '0.6rem' }}>
                            {cell.length === 0 ? prob * impact : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* X axis labels */}
              <div className="flex gap-0.5 mt-1 ml-[68px]">
                {IMPACT_LABELS.map(l => (
                  <span key={l} className="w-9 text-center" style={{ fontSize: '0.55rem', color: '#94A3B8' }}>
                    {l.split(' ').pop()}
                  </span>
                ))}
              </div>
              <div className="text-center mt-1 ml-16" style={{ fontSize: '10px', color: '#94A3B8' }}>
                Impacto
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { color: '#DCFCE7', label: 'Baixo (1–3)' },
              { color: '#FEF9C3', label: 'Médio (4–8)' },
              { color: '#FEF3C7', label: 'Alto (9–14)' },
              { color: '#FEE2E2', label: 'Crítico (≥15)' },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1 text-[10px]" style={{ color: '#475569' }}>
                <span className="w-3 h-3 rounded" style={{ background: l.color, border: '1px solid rgba(0,0,0,0.1)' }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Risk table */}
        <div
          className="col-span-7 bg-card rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Risco', 'Categoria', 'P', 'I', 'Sev.', 'Estratégia', 'Responsável', 'Status', ''].map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left"
                    style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project.risks.sort((a, b) => b.severity - a.severity).map(risk => {
                const sevColor = getSeverityColor(risk.severity);
                const sCfg = statusConfig[risk.status];
                return (
                  <tr
                    key={risk.id}
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-3 py-2.5 max-w-[160px]">
                      <span style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 500 }}>
                        {risk.description}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: '#F1F5F9', color: '#475569' }}
                      >
                        {risk.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>
                        {risk.probability}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>
                        {risk.impact}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold"
                        style={{ background: sevColor.bg, color: sevColor.text }}
                      >
                        {risk.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[140px]">
                      <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                        {risk.responseStrategy.length > 60
                          ? risk.responseStrategy.slice(0, 60) + '…'
                          : risk.responseStrategy}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span style={{ fontSize: '0.73rem', color: '#475569' }}>{risk.responsible}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                        style={{ color: sCfg.color, background: sCfg.bg }}
                      >
                        {risk.status}
                      </span>
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => {
                          if (window.confirm('Excluir este risco?')) {
                            deleteRisk(project.id, risk.id);
                            toast.success('Risco excluído.');
                          }
                        }}
                        className="p-1 rounded hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 size={12} color="#DC2626" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <RiskForm
          onClose={() => setShowForm(false)}
          onSave={(r) => {
            addRisk(project.id, r);
            toast.success('Risco cadastrado.');
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function RiskForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (r: {
    description: string;
    category: string;
    probability: number;
    impact: number;
    responseStrategy: string;
    responsible: string;
    status: RiskStatus;
  }) => void;
}) {
  const [f, setF] = useState({
    description: '',
    category: 'Operacional',
    probability: 3,
    impact: 3,
    responseStrategy: '',
    responsible: '',
    status: 'Aberto' as RiskStatus,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.description.trim()) {
      toast.error('Descreva o risco.');
      return;
    }
    onSave(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Cadastrar Risco</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <L label="Descrição *" full><textarea className="ipt min-h-[60px]" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></L>
          <L label="Categoria">
            <select className="ipt" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>
              {['Operacional', 'Técnico', 'Financeiro', 'Externo', 'Estratégico'].map(o => <option key={o}>{o}</option>)}
            </select>
          </L>
          <L label="Responsável"><input className="ipt" value={f.responsible} onChange={e => setF({ ...f, responsible: e.target.value })} /></L>
          <L label="Probabilidade (1-5)"><input type="number" min={1} max={5} className="ipt" value={f.probability} onChange={e => setF({ ...f, probability: Number(e.target.value) })} /></L>
          <L label="Impacto (1-5)"><input type="number" min={1} max={5} className="ipt" value={f.impact} onChange={e => setF({ ...f, impact: Number(e.target.value) })} /></L>
          <L label="Estratégia de resposta" full><textarea className="ipt min-h-[50px]" value={f.responseStrategy} onChange={e => setF({ ...f, responseStrategy: e.target.value })} /></L>
          <L label="Status">
            <select className="ipt" value={f.status} onChange={e => setF({ ...f, status: e.target.value as RiskStatus })}>
              {['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'].map(o => <option key={o}>{o}</option>)}
            </select>
          </L>
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
