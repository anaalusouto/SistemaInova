import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, FileText, Calendar } from 'lucide-react';
import { type Project } from '../../data/mockData';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

interface TabRelatoriosProps {
  project: Project;
}

export function TabRelatorios({ project }: TabRelatoriosProps) {
  const printReport = () => { toast.info('Abrindo diálogo de impressão…'); setTimeout(() => window.print(), 200); };
  const exportProjectCsv = (label: string) => {
    const rows = [
      ['Seção', 'Item', 'Valor'],
      ['Projeto', 'Nome', project.name],
      ['Projeto', 'Código', project.code],
      ['Projeto', 'Coordenador', project.coordinator],
      ['Projeto', 'Financiador', project.financier],
      ['Projeto', 'Status', project.status],
      ['Projeto', 'Progresso %', project.progress],
      ['Financeiro', 'Aprovado', project.budgetApproved],
      ['Financeiro', 'Executado', project.budgetExecuted],
      ...project.risks.map(r => ['Risco', r.description, `${r.severity} (${r.status})`]),
      ...project.changes.map(c => ['Mudança', c.description, `${c.type} · ${c.approval}`]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${label}-${project.code}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV gerado.');
  };
  const allActivities = project.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));

  const activityStatusData = [
    { name: 'Concluídas', value: allActivities.filter(a => a.status === 'Concluído').length, color: '#10B981' },
    { name: 'Em andamento', value: allActivities.filter(a => a.status === 'Em andamento').length, color: '#2563EB' },
    { name: 'Atrasadas', value: allActivities.filter(a => a.status === 'Atrasado').length, color: '#EF4444' },
    { name: 'Não iniciadas', value: allActivities.filter(a => a.status === 'Não iniciado').length, color: '#94A3B8' },
  ].filter(d => d.value > 0);

  const goalProgressData = project.goals.map(g => {
    const acts = g.deliverables.flatMap(d => d.activities);
    const pct = acts.length > 0 ? Math.round(acts.reduce((a, act) => a + act.progress, 0) / acts.length) : 0;
    return { name: g.name.split(' — ')[0] || g.name.split(' ').slice(0, 3).join(' '), progresso: pct };
  });

  const financialData = [
    { name: 'Aprovado', value: project.budgetApproved, fill: '#BFDBFE' },
    { name: 'Executado', value: project.budgetExecuted, fill: '#2563EB' },
    { name: 'Saldo', value: project.budgetApproved - project.budgetExecuted, fill: '#A7F3D0' },
  ];

  const riskData = [
    { name: 'Baixo', value: project.risks.filter(r => r.severity < 4).length, color: '#10B981' },
    { name: 'Médio', value: project.risks.filter(r => r.severity >= 4 && r.severity < 9).length, color: '#F59E0B' },
    { name: 'Alto', value: project.risks.filter(r => r.severity >= 9 && r.severity < 15).length, color: '#EF4444' },
    { name: 'Crítico', value: project.risks.filter(r => r.severity >= 15).length, color: '#7C3AED' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            Relatórios do Projeto
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            {project.name} · {project.code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={printReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: '#475569', background: '#fff' }}
          >
            <Download size={12} /> PDF
          </button>
          <button
            onClick={() => exportProjectCsv("relatorio")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Execução Física', value: `${project.progress}%`, color: project.status === 'Atrasado' ? '#DC2626' : '#2563EB' },
          { label: 'Execução Financeira', value: `${project.budgetApproved > 0 ? Math.round((project.budgetExecuted / project.budgetApproved) * 100) : 0}%`, color: '#059669' },
          { label: 'Riscos Abertos', value: project.risks.filter(r => r.status !== 'Encerrado').length, color: '#D97706' },
          { label: 'Mudanças Pendentes', value: project.changes.filter(c => c.approval === 'Pendente').length, color: '#7C3AED' },
        ].map(k => (
          <div
            key={k.label}
            className="bg-card rounded-xl border p-4 text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: k.color }}>
              {k.value}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Financial */}
        <div
          className="bg-card rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: 14 }}>
            Resumo Financeiro
          </h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {financialData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity status */}
        {activityStatusData.length > 0 ? (
          <div
            className="bg-card rounded-xl border p-5"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: 14 }}>
              Status das Atividades
            </h3>
            <div className="flex items-center gap-4">
              <PieChart width={130} height={130}>
                <Pie data={activityStatusData} cx={60} cy={60} outerRadius={58} innerRadius={32} dataKey="value" strokeWidth={0}>
                  {activityStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-2">
                {activityStatusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: '#475569' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="bg-card rounded-xl border p-5 flex items-center justify-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <p style={{ color: '#94A3B8', fontSize: '0.825rem' }}>Sem atividades para visualizar</p>
          </div>
        )}
      </div>

      {/* Goal progress + Risks */}
      {(goalProgressData.length > 0 || riskData.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {goalProgressData.length > 0 && (
            <div
              className="bg-card rounded-xl border p-5"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: 14 }}>
                Progresso por Meta
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={goalProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Progresso']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="progresso" fill="#2563EB" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {riskData.length > 0 && (
            <div
              className="bg-card rounded-xl border p-5"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: 14 }}>
                Distribuição de Riscos
              </h3>
              <div className="flex items-center gap-4">
                <PieChart width={120} height={120}>
                  <Pie data={riskData} cx={55} cy={55} outerRadius={52} dataKey="value" strokeWidth={0}>
                    {riskData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="flex flex-col gap-2.5">
                  {riskData.map(d => (
                    <div key={d.name} className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-[12px]" style={{ color: '#475569' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export options */}
      <div
        className="bg-card rounded-xl border p-5"
        style={{ borderColor: 'var(--border)' }}
      >
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', marginBottom: 14 }}>
          Exportações
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Relatório de Acompanhamento', format: 'PDF', icon: FileText },
            { label: 'Planilha de Atividades', format: 'XLSX', icon: FileText },
            { label: 'Relatório Financeiro', format: 'PDF', icon: FileText },
            { label: 'Cronograma', format: 'PDF', icon: Calendar },
            { label: 'Matriz de Riscos', format: 'PDF', icon: FileText },
            { label: 'Prestação de Contas', format: 'PDF', icon: FileText },
          ].map(r => {
            const Icon = r.icon;
            return (
              <button
                key={r.label}
                onClick={() => exportProjectCsv(r.label.toLowerCase().replace(/\s+/g, "-"))}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left hover:border-blue-300 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                  <Icon size={13} color="#2563EB" />
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#0F172A' }}>{r.label}</div>
                  <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{r.format}</div>
                </div>
                <Download size={12} color="#94A3B8" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
