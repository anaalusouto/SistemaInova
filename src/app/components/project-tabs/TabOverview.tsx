import { TrendingUp, DollarSign, ShieldAlert, GitBranch, Calendar, Users, Building2, Target } from 'lucide-react';
import { type Project } from '../../data/mockData';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  'Em andamento': { color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
  'Concluído':    { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  'Atrasado':     { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
  'Não iniciado': { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

interface TabOverviewProps {
  project: Project;
  onTabChange: (tab: string) => void;
}

export function TabOverview({ project, onTabChange }: TabOverviewProps) {
  const cfg = statusConfig[project.status] ?? { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' };
  const pctExec = project.budgetApproved > 0
    ? Math.round((project.budgetExecuted / project.budgetApproved) * 100)
    : 0;
  const saldo = project.budgetApproved - project.budgetExecuted;

  const progressColor =
    project.status === 'Atrasado' ? '#EF4444' :
    project.status === 'Concluído' ? '#10B981' : '#2563EB';

  const allActivities = project.goals.flatMap(g =>
    g.deliverables.flatMap(d => d.activities)
  );
  const totalActs = allActivities.length;
  const doneActs = allActivities.filter(a => a.status === 'Concluído').length;
  const lateActs = allActivities.filter(a => a.status === 'Atrasado').length;

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      {/* Project header info */}
      <div
        className="bg-card rounded-xl border p-6 flex flex-col gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                {project.status}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                {project.code}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, maxWidth: 600 }}>
              {project.objective}
            </p>
          </div>
          <div className="text-right">
            <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: progressColor, lineHeight: 1 }}>
              {project.progress}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>execução física</div>
          </div>
        </div>

        <div className="h-2 rounded-full" style={{ background: '#E2E8F0' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${project.progress}%`, background: progressColor }}
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Users, label: 'Coordenador', value: project.coordinator },
            { icon: Building2, label: 'Financiador', value: project.financier },
            { icon: Calendar, label: 'Vigência', value: `${project.startDate} → ${project.endDate}` },
            { icon: Users, label: 'Equipe', value: `${project.team.length} membros` },
          ].map(item => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-start gap-2">
                <Icon size={13} color="#94A3B8" className="mt-0.5 flex-shrink-0" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#0F172A' }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Valor Aprovado', value: fmt(project.budgetApproved), icon: DollarSign, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Valor Executado', value: `${fmt(project.budgetExecuted)} (${pctExec}%)`, icon: TrendingUp, color: '#059669', bg: '#ECFDF5' },
          { label: 'Saldo Disponível', value: fmt(saldo), icon: DollarSign, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Riscos Abertos', value: project.risks.filter(r => r.status !== 'Encerrado').length.toString(), icon: ShieldAlert, color: '#DC2626', bg: '#FEF2F2' },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-card rounded-xl border p-4 flex items-center gap-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: k.bg }}>
                <Icon size={16} color={k.color} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{k.label}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>{k.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle: activities + risks summary */}
      <div className="grid grid-cols-2 gap-4">
        {/* Activities summary */}
        <div
          className="bg-card rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
              Atividades
            </h3>
            <button
              onClick={() => onTabChange('monitoramento')}
              style={{ fontSize: '0.75rem', color: 'var(--primary)' }}
            >
              Ver detalhes →
            </button>
          </div>
          {totalActs === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Nenhuma atividade cadastrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {[
                { label: 'Concluídas', value: doneActs, color: '#10B981', bg: '#ECFDF5' },
                { label: 'Em andamento', value: allActivities.filter(a => a.status === 'Em andamento').length, color: '#2563EB', bg: '#EFF6FF' },
                { label: 'Atrasadas', value: lateActs, color: '#EF4444', bg: '#FEF2F2' },
                { label: 'Não iniciadas', value: allActivities.filter(a => a.status === 'Não iniciado').length, color: '#94A3B8', bg: '#F3F4F6' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span
                    className="min-w-[2rem] text-center py-0.5 rounded-md text-[12px] font-bold"
                    style={{ background: item.bg, color: item.color }}
                  >
                    {item.value}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>{item.label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${totalActs > 0 ? (item.value / totalActs) * 100 : 0}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risks summary */}
        <div
          className="bg-card rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
              Riscos e Mudanças
            </h3>
            <button
              onClick={() => onTabChange('riscos')}
              style={{ fontSize: '0.75rem', color: 'var(--primary)' }}
            >
              Ver detalhes →
            </button>
          </div>
          {project.risks.length === 0 && project.changes.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Nenhum risco ou mudança registrada.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {project.risks.slice(0, 3).map(r => {
                const sev = r.severity;
                const sevColor = sev >= 15 ? '#DC2626' : sev >= 9 ? '#D97706' : '#059669';
                const sevBg = sev >= 15 ? '#FEF2F2' : sev >= 9 ? '#FFFBEB' : '#ECFDF5';
                return (
                  <div
                    key={r.id}
                    className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ background: '#F8FAFC' }}
                  >
                    <div
                      className="px-2 py-0.5 rounded text-[11px] font-bold flex-shrink-0"
                      style={{ background: sevBg, color: sevColor }}
                    >
                      {r.severity}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#0F172A' }}>{r.description}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>{r.category} · {r.status}</div>
                    </div>
                  </div>
                );
              })}
              {project.changes.filter(c => c.approval === 'Pendente').map(ch => (
                <div
                  key={ch.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ background: '#FFFBEB' }}
                >
                  <GitBranch size={13} color="#D97706" className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#92400E' }}>
                      Mudança pendente: {ch.description}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#B45309', marginTop: 2 }}>{ch.type} · {ch.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Goals quick view */}
      {project.goals.length > 0 && (
        <div
          className="bg-card rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
              Metas do Projeto
            </h3>
            <button
              onClick={() => onTabChange('monitoramento')}
              style={{ fontSize: '0.75rem', color: 'var(--primary)' }}
            >
              Monitoramento completo →
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {project.goals.map(g => {
              const acts = g.deliverables.flatMap(d => d.activities);
              const done = acts.filter(a => a.status === 'Concluído').length;
              const pct = acts.length > 0 ? Math.round((done / acts.length) * 100) : 0;
              return (
                <div key={g.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Target size={13} color="#94A3B8" />
                    <span style={{ fontSize: '0.82rem', color: '#0F172A', fontWeight: 500 }}>{g.name}</span>
                  </div>
                  <div className="flex items-center gap-2 w-48">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#2563EB' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#64748B', width: 28, textAlign: 'right' }}>
                      {pct}%
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                    {done}/{acts.length} atividades
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
