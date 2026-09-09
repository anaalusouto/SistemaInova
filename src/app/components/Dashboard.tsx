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
  'Em andamento': { color: 'var(--brand)', bg: 'var(--brand-soft)', dot: 'var(--brand)' },
  'Concluído':    { color: 'var(--success)', bg: 'var(--success-soft)', dot: 'var(--success)' },
  'Atrasado':     { color: 'var(--danger)', bg: 'var(--danger-soft)', dot: 'var(--danger)' },
  'Não iniciado': { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' },
  'Suspenso':     { color: 'var(--warning)', bg: 'var(--warning-soft)', dot: 'var(--warning)' },
};

const riskConfig: Record<string, { color: string; bg: string }> = {
  'Baixo':   { color: 'var(--success)', bg: 'var(--success-soft)' },
  'Médio':   { color: 'var(--warning)', bg: 'var(--warning-soft)' },
  'Alto':    { color: 'var(--danger)', bg: 'var(--danger-soft)' },
  'Crítico': { color: 'var(--info)', bg: 'var(--info-soft)' },
  '—':       { color: 'var(--ink-4)', bg: 'var(--surface-2)' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' };
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
  const cfg = riskConfig[level] ?? { color: 'var(--ink-4)', bg: 'var(--surface-2)' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {level}
    </span>
  );
}

function ProgressBar({ value, color = 'var(--brand)' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--line-1)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-medium w-8 text-right" style={{ color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
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
    { name: 'Em andamento', value: kpiData.inProgress, color: 'var(--brand)' },
    { name: 'Concluído',    value: kpiData.concluded,  color: 'var(--success)' },
    { name: 'Atrasado',     value: kpiData.delayed,    color: 'var(--danger)' },
    { name: 'Não iniciado', value: kpiData.notStarted, color: 'var(--ink-5)' },
  ];
  const saldo = kpiData.totalBudget - kpiData.totalExecuted;
  const pctExecutado = kpiData.totalBudget > 0 ? Math.round((kpiData.totalExecuted / kpiData.totalBudget) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-7 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)', lineHeight: 1.3 }}>
            Dashboard Executivo
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
            Visão consolidada · Exercício 2025–2026
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Projetos',
            value: kpiData.totalProjects,
            sub: `${kpiData.inProgress} em andamento`,
            icon: FolderKanban,
            iconBg: 'var(--brand-soft)',
            iconColor: 'var(--brand)',
            trend: null,
          },
          {
            label: 'Execução Média',
            value: `${kpiData.avgProgress}%`,
            sub: 'Progresso geral',
            icon: TrendingUp,
            iconBg: 'var(--success-soft)',
            iconColor: 'var(--success)',
            trend: '+4% vs mês anterior',
            trendUp: true,
          },
          {
            label: 'Projetos Atrasados',
            value: kpiData.delayed,
            sub: 'Requerem atenção',
            icon: AlertTriangle,
            iconBg: 'var(--danger-soft)',
            iconColor: 'var(--danger)',
            trend: null,
          },
          {
            label: 'Projetos Concluídos',
            value: kpiData.concluded,
            sub: `de ${kpiData.totalProjects} total`,
            icon: CheckCircle2,
            iconBg: 'var(--success-soft)',
            iconColor: 'var(--success)',
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
                    style={{ color: card.trendUp ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {card.trendUp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {card.trend}
                  </span>
                )}
              </div>
              <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--ink-1)', lineHeight: 1.1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginTop: 3 }}>{card.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-5)', marginTop: 1 }}>{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Valor Previsto Total', value: fmt(kpiData.totalBudget), sub: '6 projetos ativos', icon: DollarSign, color: 'var(--brand)', bg: 'var(--brand-soft)' },
          { label: 'Valor Executado', value: fmt(kpiData.totalExecuted), sub: `${pctExecutado}% do previsto`, icon: TrendingUp, color: 'var(--success)', bg: 'var(--success-soft)' },
          { label: 'Saldo Disponível', value: fmt(saldo), sub: `${100 - pctExecutado}% restante`, icon: DollarSign, color: 'var(--warning)', bg: 'var(--warning-soft)' },
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
                <div style={{ fontSize: '1.3rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-1)' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--ink-4)' }}>{card.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{card.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle row: Chart + Pie + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Area Chart */}
        <div
          className="lg:col-span-7 bg-card rounded-xl p-5 border"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)' }}>
                Execução Financeira Acumulada
              </h3>
              <p style={{ fontSize: '0.73rem', color: 'var(--ink-5)', marginTop: 2 }}>Previsto vs. Realizado · 2025</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-5)' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'var(--brand-soft-border)' }} /> Previsto
              </span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-5)' }}>
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'var(--brand)' }} /> Executado
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyFinancial} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="previsto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-soft-border)" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="var(--brand-soft-border)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="executado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-2)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--ink-5)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--ink-5)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                formatter={(v: number) => [fmt(v), '']}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--line-1)', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="previsto" stroke="var(--brand-soft-border)" strokeWidth={1.5} fill="url(#previsto)" dot={false} />
              <Area type="monotone" dataKey="executado" stroke="var(--brand)" strokeWidth={2} fill="url(#executado)" dot={{ fill: 'var(--brand)', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + Risk Alerts */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Pie */}
          <div
            className="bg-card rounded-xl p-5 border flex-1"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)', marginBottom: 12 }}>
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
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-1)' }}>
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
              <ShieldAlert size={14} color="var(--danger)" />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)' }}>
                Alertas
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--danger-soft)' }}>
                <AlertTriangle size={12} color="var(--danger)" />
                <span style={{ fontSize: '0.73rem', color: 'var(--danger-strong-text)' }}>
                  {kpiData.criticalRisks} riscos críticos abertos
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--warning-soft)' }}>
                <GitBranch size={12} color="var(--warning)" />
                <span style={{ fontSize: '0.73rem', color: 'var(--warning-strong-text)' }}>
                  {kpiData.pendingChanges} mudanças aguardando aprovação
                </span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--danger-soft)' }}>
                <AlertTriangle size={12} color="var(--danger)" />
                <span style={{ fontSize: '0.73rem', color: 'var(--danger-strong-text)' }}>
                  1 projeto em atraso crítico
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Project Table + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Project Table */}
        <div
          className="lg:col-span-8 bg-card rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)' }}>
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
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Projeto', 'Coordenador', 'Status', 'Progresso', 'Financeiro', 'Prazo', 'Risco'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left"
                    style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}
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
                  p.status === 'Atrasado' ? 'var(--danger)' :
                  p.status === 'Concluído' ? 'var(--success)' : 'var(--brand)';
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => onSelectProject(p)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink-1)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginTop: 1 }}>{p.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
                        >
                          {p.coordinator.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{p.coordinator}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 w-32">
                      <ProgressBar value={p.progress} color={progressColor} />
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-1)', fontWeight: 500 }}>
                        {fmt(p.budgetExecuted)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{pctExec}% de {fmt(p.budgetApproved)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{p.endDate}</span>
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
        </div>

        {/* Upcoming Deadlines */}
        <div
          className="lg:col-span-4 bg-card rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center gap-2 px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <Clock size={14} color="var(--ink-4)" />
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)' }}>
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
                  style={{ background: isLate ? 'var(--danger-soft)' : isUrgent ? 'var(--warning-soft)' : 'var(--surface-1)' }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontSize: '0.73rem',
                        fontWeight: 500,
                        color: isLate ? 'var(--danger)' : 'var(--ink-1)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {d.date}
                    </span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: isLate ? 'var(--danger-soft-border)' : isUrgent ? 'var(--warning-soft-border)' : 'var(--line-1)',
                        color: isLate ? 'var(--danger)' : isUrgent ? 'var(--warning-strong-text)' : 'var(--ink-3)',
                      }}
                    >
                      {d.daysLeft}d
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--ink-2)' }}>{d.milestone}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink-4)' }}>{d.project}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
