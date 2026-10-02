import { useEffect, useMemo, useState } from 'react';
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
import { buildKpi } from '../data/mockData';
import { useStore } from '../store';
import { PortfolioFilters } from './portfolio/PortfolioFilters';
import {
  applyPortfolioFilters,
  emptyPortfolioFilters,
  getClassificacaoOptions,
  getDefaultExercicio,
  getExercicios,
  getOrgOptions,
  STATUS_OPTIONS,
  type PortfolioFilterValues,
} from '../lib/portfolioFilters';
import { buildFinancialTimeline } from '../lib/financialTimeline';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

/** Filtros preservados enquanto a sessão estiver aberta. */
const portfolioFilterMemory: PortfolioFilterValues & { initialized: boolean } = {
  ...emptyPortfolioFilters(),
  initialized: false,
};

export function PortfolioView() {
  const { projects } = useStore();
  const [filters, setFiltersState] = useState<PortfolioFilterValues>(portfolioFilterMemory);

  const exercicios = useMemo(() => getExercicios(projects), [projects]);
  const orgOptions = useMemo(() => getOrgOptions(projects), [projects]);
  const classificacaoOptions = useMemo(() => getClassificacaoOptions(projects), [projects]);

  // Na primeira carga (por sessão), seleciona o exercício vigente como padrão.
  useEffect(() => {
    if (portfolioFilterMemory.initialized || exercicios.length === 0) return;
    const def = getDefaultExercicio(exercicios);
    const next: PortfolioFilterValues = {
      ...emptyPortfolioFilters(),
      exercicioKey: def?.key ?? null,
      periodStart: def?.minMonth ?? null,
      periodEnd: def?.maxMonth ?? null,
    };
    Object.assign(portfolioFilterMemory, next, { initialized: true });
    setFiltersState(next);
  }, [exercicios]);

  const setFilters = (next: PortfolioFilterValues) => {
    Object.assign(portfolioFilterMemory, next);
    setFiltersState(next);
  };

  const clearFilters = () => {
    const next = emptyPortfolioFilters();
    Object.assign(portfolioFilterMemory, next, { initialized: true });
    setFiltersState(next);
  };

  const filteredProjects = useMemo(() => applyPortfolioFilters(projects, filters), [projects, filters]);
  const kpiData = buildKpi(filteredProjects);
  const timeline = useMemo(
    () =>
      buildFinancialTimeline(
        filteredProjects,
        filters.periodStart && filters.periodEnd ? { start: filters.periodStart, end: filters.periodEnd } : null,
      ),
    [filteredProjects, filters.periodStart, filters.periodEnd],
  );

  const suspended = filteredProjects.filter(p => p.status === 'Suspenso').length;
  const pieData = [
    { name: 'Em andamento', value: kpiData.inProgress, color: 'var(--brand)' },
    { name: 'Concluído',    value: kpiData.concluded,  color: 'var(--success)' },
    { name: 'Atrasado',     value: kpiData.delayed,    color: 'var(--alert)' },
    { name: 'Não iniciado', value: kpiData.notStarted, color: 'var(--ink-5)' },
    ...(suspended > 0 ? [{ name: 'Suspenso', value: suspended, color: 'var(--warning)' }] : []),
  ];

  const selectedExercicio = exercicios.find(e => e.key === filters.exercicioKey);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)', lineHeight: 1.3 }}>
            Visão Geral
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
            Visão consolidada do portfólio{selectedExercicio ? ` · Exercício ${selectedExercicio.label}` : ''}
          </p>
        </div>
      </div>

      <PortfolioFilters
        exercicios={exercicios}
        statusOptions={STATUS_OPTIONS}
        orgOptions={orgOptions}
        classificacaoOptions={classificacaoOptions}
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
      />

      {/* Gráficos do portfólio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-card rounded-xl p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)' }}>
                Execução Financeira Acumulada
              </h3>
              <p style={{ fontSize: '0.73rem', color: 'var(--ink-5)', marginTop: 2 }}>Previsto vs. Realizado</p>
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
          {timeline.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: 180, color: 'var(--ink-5)', fontSize: '0.8rem' }}>
              Sem itens de orçamento com data reconhecível no período selecionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={timeline} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ borderRadius: 8, border: '1px solid var(--line-1)', fontSize: 12 }} />
                <Area type="monotone" dataKey="previsto" stroke="var(--brand-soft-border)" strokeWidth={1.5} fill="url(#previsto)" dot={false} />
                <Area type="monotone" dataKey="executado" stroke="var(--brand)" strokeWidth={2} fill="url(#executado)" dot={{ fill: 'var(--brand)', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-card rounded-xl p-5 border flex-1" style={{ borderColor: 'var(--border)' }}>
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
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-1)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
