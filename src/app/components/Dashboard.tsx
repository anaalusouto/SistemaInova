import {
  FolderKanban,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ShieldAlert,
  GitBranch,
  Clock,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { upcomingDeadlines, monthlyFinancial, buildKpi } from '../data/mockData';
import { type Project } from '../data/mockData';
import { useStore } from '../store';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  'Em andamento': { color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
  'Concluído':    { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  'Atrasado':     { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
  'Não iniciado': { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
  'Suspenso':     { color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
};

const riskConfig: Record<string, { color: string; bg: string }> = {
  'Baixo':   { color: '#059669', bg: '#ECFDF5' },
  'Médio':   { color: '#D97706', bg: '#FFFBEB' },
  'Alto':    { color: '#DC2626', bg: '#FEF2F2' },
  'Crítico': { color: '#7C3AED', bg: '#F5F3FF' },
  '—':       { color: '#6B7280', bg: '#F3F4F6' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const cfg = riskConfig[level] ?? { color: '#6B7280', bg: '#F3F4F6' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {level}
    </span>
  );
}

function ProgressBar({ value, color = '#2563EB' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-medium w-8 text-right" style={{ color: '#64748B', fontFamily: 'var(--font-mono)' }}>
        {value}%
      </span>
    </div>
  );
}

interface DashboardProps {
  onSelectProject: (project: Project) => void;
  onGoToProjects?: () => void;
}

export function Dashboard({ onSelectProject, onGoToProjects }: DashboardProps) {
  const { projects } = useStore();
  const kpiData = buildKpi(projects);
  const pieData = [
    { name: 'Em andamento', value: kpiData.inProgress, color: '#2563EB' },
    { name: 'Concluído',    value: kpiData.concluded,  color: '#10B981' },
    { name: 'Atrasado',     value: kpiData.delayed,    color: '#EF4444' },
    { name: 'Não iniciado', value: kpiData.notStarted, color: '#94A3B8' },
  ];
  const saldo = kpiData.totalBudget - kpiData.totalExecuted;
  const pctExecutado = kpiData.totalBudget > 0 ? Math.round((kpiData.totalExecuted / kpiData.totalBudget) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-7 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: '#0F172A', lineHeight: 1.3 }}>
            Dashboard Executivo
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.825rem', marginTop: 2 }}>
            Visão consolidada · Exercício 2025–2026
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Projetos',
            value: kpiData.totalProjects,
            sub: `${kpiData.inProgress} em andamento`,
            icon: FolderKanban,
            iconBg: '#EFF6FF',
            iconColor: '#2563EB',
            trend: null,
          },
          {
            label: 'Execução Média',
            value: `${kpiData.avgProgress}%`,
            sub: 'Progresso geral',
            icon: TrendingUp,
            iconBg: '#ECFDF5',
            iconColor: '#059669',
            trend: '+4% vs mês anterior',
            trendUp: true,
          },
          {
            label: 'Projetos Atrasados',
            value: kpiData.delayed,
            sub: 'Requerem atenção',
            icon: AlertTriangle,
            iconBg: '#FEF2F2',
            iconColor: '#DC2626',
            trend: null,
          },
          {
            label: 'Projetos Concluídos',
            value: kpiData.concluded,
            sub: `de ${kpiData.totalProjects} total`,
            icon: CheckCircle2,
            iconBg: '#F0FDF4',
            iconColor: '#16A34A',
            trend: null,
          },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card rounded-xl p-5 border flex flex-col gap-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: card.iconBg }}
                >
                  <Icon size={17} color={card.iconColor} />
                </div>
                {card.trend && (
                  <span
                    className="flex items-center gap-0.5 text-[11px] font-medium"
                    style={{ color: card.trendUp ? '#059669' : '#DC2626' }}
                  >
                    {card.trendUp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {card.trend}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#0F172A', lineHeight: 1.1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3 }}>{card.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 1 }}>{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Valor Previsto Total', value: fmt(kpiData.totalBudget), sub: '6 projetos ativos', icon: DollarSign, color: '#2563EB', bg: '#EFF6FF' },
          { label: 'Valor Executado', value: fmt(kpiData.totalExecuted), sub: `${pctExecutado}% do previsto`, icon: TrendingUp, color: '#059669', bg: '#ECFDF5' },
          { label: 'Saldo Disponível', value: fmt(saldo), sub: `${100 - pctExecutado}% restante`, icon: DollarSign, color: '#D97706', bg: '#FFFBEB' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-card rounded-xl p-5 border flex items-center gap-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: card.bg }}
              >
                <Icon size={18} color={card.color} />
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{card.label}</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle row: Chart + Pie + Alerts */}
      <div className="grid grid-cols-12 gap-4">
        {/* Area Chart */}
        <div
          className="col-span-7 bg-card rounded-xl p-5 border"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                Execução Financeira Acumulada
              </h3>
              <p style={{ fontSize: '0.73rem', color: '#94A3B8', marginTop: 2 }}>Previsto vs. Realizado · 2025</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#94A3B8' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#BFDBFE' }} /> Previsto
              </span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#94A3B8' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: '#2563EB' }} /> Executado
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyFinancial} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="previsto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BFDBFE" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#BFDBFE" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="executado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(v: number) => [fmt(v), '']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="previsto" stroke="#BFDBFE" strokeWidth={1.5} fill="url(#previsto)" dot={false} />
              <Area type="monotone" dataKey="executado" stroke="#2563EB" strokeWidth={2} fill="url(#executado)" dot={{ fill: '#2563EB', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + Risk Alerts */}
        <div className="col-span-5 flex flex-col gap-4">
          {/* Pie */}
          <div
            className="bg-card rounded-xl p-5 border flex-1"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', marginBottom: 12 }}>
              Status dos Projetos
            </h3>
            <div className="flex items-center gap-3">
              <PieChart width={90} height={90}>
                <Pie data={pieData} cx={40} cy={40} innerRadius={26} outerRadius={42} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex flex-col gap-1.5 flex-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: '#475569' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: '#0F172A' }}>
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div
            className="bg-card rounded-xl p-5 border"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={14} color="#DC2626" />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                Alertas
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#FEF2F2' }}>
                <AlertTriangle size={12} color="#DC2626" />
                <span style={{ fontSize: '0.73rem', color: '#7F1D1D' }}>
                  {kpiData.criticalRisks} riscos críticos abertos
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#FFFBEB' }}>
                <GitBranch size={12} color="#D97706" />
                <span style={{ fontSize: '0.73rem', color: '#78350F' }}>
                  {kpiData.pendingChanges} mudanças aguardando aprovação
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: '#FEF2F2' }}>
                <AlertTriangle size={12} color="#DC2626" />
                <span style={{ fontSize: '0.73rem', color: '#7F1D1D' }}>
                  1 projeto em atraso crítico
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Project Table + Deadlines */}
      <div className="grid grid-cols-12 gap-4">
        {/* Project Table */}
        <div
          className="col-span-8 bg-card rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
              Portfólio de Projetos
            </h3>
            <button
              onClick={() => onGoToProjects?.()}
              className="flex items-center gap-1 text-[12px]"
              style={{ color: 'var(--primary)' }}
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Projeto', 'Coordenador', 'Status', 'Progresso', 'Financeiro', 'Prazo', 'Risco'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left"
                    style={{ fontSize: '0.71rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((p: Project) => {
                const pctExec = p.budgetApproved > 0 ? Math.round((p.budgetExecuted / p.budgetApproved) * 100) : 0;
                const progressColor =
                  p.status === 'Atrasado' ? '#EF4444' :
                  p.status === 'Concluído' ? '#10B981' : '#2563EB';
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => onSelectProject(p)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0F172A' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 1 }}>{p.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ background: '#EFF6FF', color: '#2563EB' }}
                        >
                          {p.coordinator.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#334155' }}>{p.coordinator}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 w-32">
                      <ProgressBar value={p.progress} color={progressColor} />
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#0F172A', fontWeight: 500 }}>
                        {fmt(p.budgetExecuted)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{pctExec}% de {fmt(p.budgetApproved)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.78rem', color: '#334155' }}>{p.endDate}</span>
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={p.riskLevel} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Upcoming Deadlines */}
        <div
          className="col-span-4 bg-card rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-2 px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <Clock size={14} color="#64748B" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
              Próximos Prazos
            </h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {upcomingDeadlines.map((d, i) => {
              const isLate = d.status === 'Atrasado';
              const isUrgent = d.daysLeft <= 60;
              return (
                <div
                  key={i}
                  className="flex flex-col gap-1 p-3 rounded-lg"
                  style={{ background: isLate ? '#FEF2F2' : isUrgent ? '#FFFBEB' : '#F8FAFC' }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 500,
                        color: isLate ? '#DC2626' : '#0F172A',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {d.date}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: isLate ? '#FECACA' : isUrgent ? '#FDE68A' : '#E2E8F0',
                        color: isLate ? '#DC2626' : isUrgent ? '#92400E' : '#475569',
                      }}
                    >
                      {d.daysLeft}d
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1E293B' }}>{d.milestone}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{d.project}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
