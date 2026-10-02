import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
  BarChart,
  Bar,
  Legend,
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
import { portfolioDemo, DEMO_REFERENCE_DATE } from '../data/portfolioDemo';
import { buildDecisionCharts } from '../lib/portfolioDecisions';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

/** Filtros preservados enquanto a sessão estiver aberta. */
type DataSource = 'demo' | 'real';
const filterMemory: Record<DataSource, PortfolioFilterValues & { initialized: boolean }> = {
  demo: { ...emptyPortfolioFilters(), initialized: false },
  real: { ...emptyPortfolioFilters(), initialized: false },
};

export function PortfolioView() {
  const { projects: realProjects, projectsLoading } = useStore();
  const [source, setSource] = useState<DataSource>('demo');
  const projects = source === 'demo' ? portfolioDemo : realProjects;
  const portfolioFilterMemory = filterMemory[source];
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
  }, [exercicios, portfolioFilterMemory]);

  const changeSource = (next: DataSource) => {
    setSource(next);
    setFiltersState(filterMemory[next]);
  };

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
  const decisions = useMemo(() => buildDecisionCharts(
    filteredProjects, source === 'demo' ? new Date(`${DEMO_REFERENCE_DATE}T12:00:00`) : new Date(),
  ), [filteredProjects, source]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)', lineHeight: 1.3 }}>
            Visão Geral
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
            Visão consolidada do portfólio{selectedExercicio ? ` · Exercício ${selectedExercicio.label}` : ''}
          </p>
        </div>
        <div className="flex rounded-lg border p-1 gap-1" style={{ borderColor: 'var(--border)' }} role="group" aria-label="Fonte dos gráficos">
          {([{ id: 'demo', label: 'Demonstrativo' }, { id: 'real', label: 'Dados reais' }] as const).map(option => (
            <button key={option.id} type="button" aria-pressed={source === option.id} onClick={() => changeSource(option.id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{ background: source === option.id ? 'var(--brand-soft)' : 'transparent', color: source === option.id ? 'var(--brand)' : 'var(--ink-4)' }}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {source === 'demo' && (
        <p className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}>
          Dados simulados para visualizar cenários de decisão · referência: 02/10/2026 · um projeto por organização.
        </p>
      )}

      <PortfolioFilters
        exercicios={exercicios}
        statusOptions={STATUS_OPTIONS}
        orgOptions={orgOptions}
        classificacaoOptions={classificacaoOptions}
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
      />

      {source === 'real' && projectsLoading ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--ink-4)' }}>Carregando dados reais…</p>
      ) : filteredProjects.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--ink-4)' }}>Nenhum projeto encontrado para os filtros selecionados.</p>
      ) : <>

      {/* Gráficos do portfólio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 bg-card rounded-xl p-5 border" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
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
            <ResponsiveContainer width="100%" height={240}>
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
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: 8, border: '1px solid var(--line-1)', fontSize: 12 }} />
                <Area name="Previsto" type="monotone" dataKey="previsto" stroke="var(--brand-soft-border)" strokeWidth={1.5} fill="url(#previsto)" dot={false} />
                <Area name="Executado" type="monotone" dataKey="executado" stroke="var(--brand)" strokeWidth={2} fill="url(#executado)" dot={{ fill: 'var(--brand)', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-card rounded-xl p-5 border flex-1" style={{ borderColor: 'var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)', marginBottom: 12 }}>
              Status dos Projetos
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--ink-5)' }}>Direcione acompanhamento para projetos atrasados ou suspensos.</p>
            <div className="flex flex-wrap items-center gap-3">
              <PieChart width={170} height={170}>
                <Pie data={pieData} cx={80} cy={80} innerRadius={48} outerRadius={75} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Orçamento por organização" description="As 8 maiores dotações. Compare o gasto realizado com o orçamento total para planejar recursos.">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={decisions.budgets} layout="vertical" margin={{ left: 5, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tickFormatter={moneyAxis} tick={axisTick} />
              <YAxis type="category" dataKey="name" width={110} tick={axisTick} />
              <Tooltip formatter={(value: number) => fmt(value)} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="Orçamento" dataKey="previsto" fill="var(--brand-soft-border)" radius={[0, 4, 4, 0]} />
              <Bar name="Executado" dataKey="executado" fill="var(--brand)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Avanço físico × execução financeira" description="As 8 maiores diferenças em pontos percentuais. Investigue gastos à frente das entregas; a diferença sozinha não indica ineficiência.">
          {decisions.progress.length === 0 ? <ChartEmpty /> : <ResponsiveContainer width="100%" height={320}>
            <BarChart data={decisions.progress} layout="vertical" margin={{ left: 5, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={v => `${v}%`} tick={axisTick} />
              <YAxis type="category" dataKey="name" width={110} tick={axisTick} />
              <Tooltip formatter={(value: number) => `${value}%`} contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="Avanço físico" dataKey="fisico" fill="var(--success)" radius={[0, 4, 4, 0]} />
              <Bar name="Orçamento executado" dataKey="financeiro" fill="var(--brand)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>}
        </ChartCard>
        <ChartCard title="Riscos em aberto por categoria" description="Priorize planos de resposta nas categorias com mais riscos altos e críticos. Riscos encerrados ficam fora da contagem.">
          {decisions.risks.length === 0 ? <ChartEmpty text="Nenhum risco em aberto neste recorte." /> : <ResponsiveContainer width="100%" height={300}>
            <BarChart data={decisions.risks} layout="vertical" margin={{ left: 5, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={axisTick} />
              <YAxis type="category" dataKey="name" width={110} tick={axisTick} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar name="Baixo" dataKey="baixo" stackId="risks" fill="var(--success)" />
              <Bar name="Médio" dataKey="medio" stackId="risks" fill="var(--warning)" />
              <Bar name="Alto" dataKey="alto" stackId="risks" fill="var(--alert)" />
              <Bar name="Crítico" dataKey="critico" stackId="risks" fill="var(--danger)" radius={[0, 4, 4, 0]} />
              {decisions.risks.some(r => r.semNivel > 0) && <Bar name="Sem classificação" dataKey="semNivel" stackId="risks" fill="var(--ink-5)" />}
            </BarChart>
          </ResponsiveContainer>}
        </ChartCard>
        <ChartCard title="Prazos dos projetos não concluídos" description="Organize a agenda de acompanhamento pelos vencimentos. Prazos informados só com mês e ano usam o último dia do mês.">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={decisions.deadlines} margin={{ left: 0, right: 10, bottom: 22 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={axisTick} angle={-20} textAnchor="end" interval={0} height={58} />
              <YAxis allowDecimals={false} tick={axisTick} width={30} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar name="Projetos" dataKey="projetos" radius={[4, 4, 0, 0]}>
                {decisions.deadlines.map((row, i) => <Cell key={row.name} fill={i === 0 ? 'var(--danger)' : i === 1 ? 'var(--alert)' : 'var(--brand)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      </>}
    </div>
  );
}

const axisTick = { fontSize: 11, fill: 'var(--ink-4)' };
const tooltipStyle = { borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, background: 'var(--surface-1)', color: 'var(--ink-1)' };
const moneyAxis = (v: number) => v >= 1000000 ? `R$ ${(v / 1000000).toFixed(1)} mi` : `R$ ${(v / 1000).toFixed(0)} mil`;

function ChartCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="bg-card rounded-xl p-4 sm:p-5 border min-w-0" style={{ borderColor: 'var(--border)' }}>
    <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink-1)' }}>{title}</h2>
    <p className="text-xs mt-1 mb-4" style={{ color: 'var(--ink-5)', lineHeight: 1.6 }}>{description}</p>
    {children}
  </section>;
}

function ChartEmpty({ text = 'Sem dados suficientes para este gráfico.' }: { text?: string }) {
  return <div className="h-64 flex items-center justify-center text-xs" style={{ color: 'var(--ink-4)' }}>{text}</div>;
}
