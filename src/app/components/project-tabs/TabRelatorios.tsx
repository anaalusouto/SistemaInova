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
import { Download, FileText, FileCode2, Calendar } from 'lucide-react';
import { type Project } from '../../data/mockData';
import { buildReportModel, exportReportCsv, exportReportPdf, exportReportXml } from '../../lib/reportExport';

const ALL_FIELDS = ['cadastro', 'situacao', 'objetivo', 'equipe', 'metas', 'financeiro', 'contrapart', 'riscos', 'mudancas', 'evidencias'];

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

interface TabRelatoriosProps {
  project: Project;
}

export function TabRelatorios({ project }: TabRelatoriosProps) {
  const buildModel = () => buildReportModel(`Relatório — ${project.name}`, [project], ALL_FIELDS);

  const exportProjectPdf = () => {
    exportReportPdf(buildModel());
    toast.success('PDF gerado.');
  };
  const exportProjectCsv = () => {
    exportReportCsv(buildModel());
    toast.success('CSV gerado.');
  };
  const exportProjectXml = () => {
    exportReportXml(buildModel());
    toast.success('XML gerado.');
  };

  const allActivities = project.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));

  const activityStatusData = [
    { name: 'Concluídas', value: allActivities.filter(a => a.status === 'Concluído').length, color: 'var(--success)' },
    { name: 'Em andamento', value: allActivities.filter(a => a.status === 'Em andamento').length, color: 'var(--brand)' },
    { name: 'Atrasadas', value: allActivities.filter(a => a.status === 'Atrasado').length, color: 'var(--danger)' },
    { name: 'Não iniciadas', value: allActivities.filter(a => a.status === 'Não iniciado').length, color: 'var(--ink-5)' },
  ].filter(d => d.value > 0);

  const goalProgressData = project.goals.map(g => {
    const acts = g.deliverables.flatMap(d => d.activities);
    const pct = acts.length > 0 ? Math.round(acts.reduce((a, act) => a + act.progress, 0) / acts.length) : 0;
    return { name: g.name.split(' — ')[0] || g.name.split(' ').slice(0, 3).join(' '), progresso: pct };
  });

  const financialData = [
    { name: 'Aprovado', value: project.budgetApproved, fill: 'var(--brand-soft-border)' },
    { name: 'Executado', value: project.budgetExecuted, fill: 'var(--brand)' },
    { name: 'Saldo', value: project.budgetApproved - project.budgetExecuted, fill: 'var(--success-soft-border)' },
  ];

  const riskData = [
    { name: 'Baixo', value: project.risks.filter(r => r.severity < 4).length, color: 'var(--success)' },
    { name: 'Médio', value: project.risks.filter(r => r.severity >= 4 && r.severity < 9).length, color: 'var(--warning)' },
    { name: 'Alto', value: project.risks.filter(r => r.severity >= 9 && r.severity < 15).length, color: 'var(--danger)' },
    { name: 'Crítico', value: project.risks.filter(r => r.severity >= 15).length, color: 'var(--info)' },
  ].filter(d => d.value > 0);

  return (
    <div className="flex flex-col gap-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
            Relatórios do Projeto
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 2 }}>
            {project.name} · {project.code}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportProjectPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)', background: 'var(--surface-0)' }}
          >
            <FileText size={12} /> PDF
          </button>
          <button
            onClick={exportProjectXml}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)', background: 'var(--surface-0)' }}
          >
            <FileCode2 size={12} /> XML
          </button>
          <button
            onClick={exportProjectCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Download size={12} /> CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Execução Física', value: `${project.progress}%`, color: project.status === 'Atrasado' ? 'var(--danger)' : 'var(--brand)' },
          { label: 'Execução Financeira', value: `${project.budgetApproved > 0 ? Math.round((project.budgetExecuted / project.budgetApproved) * 100) : 0}%`, color: 'var(--success)' },
          { label: 'Riscos Abertos', value: project.risks.filter(r => r.status !== 'Encerrado').length, color: 'var(--warning)' },
          { label: 'Mudanças Pendentes', value: project.changes.filter(c => c.approval === 'Pendente').length, color: 'var(--info)' },
        ].map(k => (
          <div
            key={k.label}
            className="bg-card rounded-xl border p-4 text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: k.color }}>
              {k.value}
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--ink-4)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Financial */}
        <div
          className="bg-card rounded-xl border p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)', marginBottom: 14 }}>
            Resumo Financeiro
          </h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-2)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--ink-5)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--ink-5)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
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
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)', marginBottom: 14 }}>
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
                    <span className="flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-1)' }}>
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
            <p style={{ color: 'var(--ink-5)', fontSize: '0.825rem' }}>Sem atividades para visualizar</p>
          </div>
        )}
      </div>

      {/* Goal progress + Risks */}
      {(goalProgressData.length > 0 || riskData.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goalProgressData.length > 0 && (
            <div
              className="bg-card rounded-xl border p-5"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)', marginBottom: 14 }}>
                Progresso por Meta
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={goalProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-2)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--ink-5)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--ink-3)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Progresso']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="progresso" fill="var(--brand)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {riskData.length > 0 && (
            <div
              className="bg-card rounded-xl border p-5"
              style={{ borderColor: 'var(--border)' }}
            >
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)', marginBottom: 14 }}>
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
                      <span className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-1)' }}>
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
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)', marginBottom: 14 }}>
          Exportações
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Relatório de Acompanhamento', format: 'PDF' as const, icon: FileText },
            { label: 'Planilha de Atividades', format: 'CSV' as const, icon: FileText },
            { label: 'Relatório Financeiro', format: 'PDF' as const, icon: FileText },
            { label: 'Cronograma', format: 'PDF' as const, icon: Calendar },
            { label: 'Matriz de Riscos', format: 'PDF' as const, icon: FileText },
            { label: 'Prestação de Contas', format: 'CSV' as const, icon: FileText },
          ].map(r => {
            const Icon = r.icon;
            const onClick = r.format === 'PDF' ? exportProjectPdf : exportProjectCsv;
            return (
              <button
                key={r.label}
                onClick={onClick}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left hover:border-blue-300 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--brand-soft)' }}>
                  <Icon size={13} color="var(--brand)" />
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--ink-1)' }}>{r.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{r.format}</div>
                </div>
                <Download size={12} color="var(--ink-5)" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
