import { type Project } from '../../data/mockData';
import { useStore } from '../../store';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

export function TabResumo({ project }: { project: Project }) {
  const { getProject } = useStore();
  const p = getProject(project.id) ?? (project as never);

  const metas = p.goals.length;
  const etapas = p.goals.flatMap(g => g.deliverables).length;
  const atividades = p.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));
  const concluidas = atividades.filter(a => a.status === 'Concluído').length;
  const progresso = atividades.length ? Math.round(atividades.reduce((s, a) => s + a.progress, 0) / atividades.length) : 0;
  const pendentes = (p.approvals ?? []).filter(a => a.status === 'Pendente').length;
  const alteracoes = (p.metaLog ?? []).length;

  const cards = [
    { label: 'Metas', value: String(metas), sub: `${etapas} etapas` },
    { label: 'Atividades', value: String(atividades.length), sub: `${concluidas} concluídas` },
    { label: 'Riscos', value: String(p.risks.length), sub: `${p.risks.filter(r => r.status === 'Aberto').length} abertos` },
    { label: 'Mudanças', value: String(p.changes.length), sub: `${p.changes.filter(c => c.approval === 'Pendente').length} pendentes` },
    { label: 'Alterações registradas', value: String(alteracoes), sub: `${pendentes} aguardando validação` },
    { label: 'Orçamento aprovado', value: fmt(p.budgetApproved), sub: `executado ${fmt(p.budgetExecuted)}` },
  ];

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
          Dashboard do Projeto
        </h2>
        <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4 }}>{p.objective}</p>
        <div className="flex items-center gap-3 mt-4">
          <div className="h-2.5 rounded-full flex-1" style={{ background: '#E2E8F0' }}>
            <div className="h-full rounded-full" style={{ width: `${progresso}%`, background: progresso === 100 ? '#10B981' : '#2563EB' }} />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{progresso}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-card rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.label}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0F172A', marginTop: 4 }}>{c.value}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', marginBottom: 10 }}>
          Progresso por meta
        </h3>
        <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
          {p.goals.map((g, i) => {
            const acts = g.deliverables.flatMap(d => d.activities);
            const prog = acts.length ? Math.round(acts.reduce((s, a) => s + a.progress, 0) / acts.length) : 0;
            return (
              <div key={g.id} className="flex items-center gap-3">
                <span className="truncate" style={{ fontSize: '0.75rem', color: '#334155', width: 320 }}>{i + 1}. {g.name}</span>
                <div className="h-2 rounded-full flex-1" style={{ background: '#E2E8F0' }}>
                  <div className="h-full rounded-full" style={{ width: `${prog}%`, background: prog === 100 ? '#10B981' : '#2563EB' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#475569', width: 38, textAlign: 'right' }}>{prog}%</span>
              </div>
            );
          })}
          {p.goals.length === 0 && <span style={{ fontSize: '0.76rem', color: '#94A3B8' }}>Sem metas cadastradas.</span>}
        </div>
      </div>
    </div>
  );
}
