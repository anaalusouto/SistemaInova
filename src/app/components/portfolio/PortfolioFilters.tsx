import { Check, X } from 'lucide-react';
import {
  enumerateMonths,
  formatMonthYear,
  monthKey,
  type Exercicio,
  type MonthYear,
  type PortfolioFilterValues,
} from '../../lib/portfolioFilters';

interface PortfolioFiltersProps {
  exercicios: Exercicio[];
  statusOptions: string[];
  orgOptions: string[];
  classificacaoOptions: string[];
  filters: PortfolioFilterValues;
  onChange: (filters: PortfolioFilterValues) => void;
  onClear: () => void;
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
      style={{
        background: active ? 'var(--primary)' : 'var(--surface-0)',
        color: active ? 'var(--primary-foreground)' : 'var(--ink-4)',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
      }}
    >
      <span
        className="inline-flex items-center justify-center rounded-sm"
        style={{ width: 12, height: 12, border: `1px solid ${active ? 'var(--surface-0)' : 'var(--line-2)'}`, background: active ? 'var(--surface-0)' : 'transparent' }}
      >
        {active && <Check size={9} color="var(--brand)" />}
      </span>
      {children}
    </button>
  );
}

export function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
    </div>
  );
}

export function PortfolioFilters({
  exercicios,
  statusOptions,
  orgOptions,
  classificacaoOptions,
  filters,
  onChange,
  onClear,
}: PortfolioFiltersProps) {
  const selectedExercicio = exercicios.find(e => e.key === filters.exercicioKey) ?? null;
  const monthOptions: MonthYear[] = selectedExercicio ? enumerateMonths(selectedExercicio.minMonth, selectedExercicio.maxMonth) : [];

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

  const handleExercicioChange = (key: string) => {
    const ex = exercicios.find(e => e.key === key) ?? null;
    onChange({
      ...filters,
      exercicioKey: ex?.key ?? null,
      periodStart: ex?.minMonth ?? null,
      periodEnd: ex?.maxMonth ?? null,
    });
  };

  const handlePeriodStart = (key: string) => {
    const m = monthOptions.find(mo => monthKey(mo) === Number(key));
    if (!m) return;
    onChange({ ...filters, periodStart: m });
  };

  const handlePeriodEnd = (key: string) => {
    const m = monthOptions.find(mo => monthKey(mo) === Number(key));
    if (!m) return;
    onChange({ ...filters, periodEnd: m });
  };

  const hasActiveFilters =
    !!filters.exercicioKey || filters.status.length > 0 || filters.org.length > 0 || filters.classificacao.length > 0;

  return (
    <div className="p-4 rounded-lg border bg-card flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
      <div className="flex flex-wrap items-start gap-5">
        <FilterGroup label="Exercício">
          <select
            value={filters.exercicioKey ?? ''}
            onChange={e => handleExercicioChange(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border text-[12px] bg-transparent"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
          >
            <option value="">Todos</option>
            {exercicios.map(ex => (
              <option key={ex.key} value={ex.key}>{ex.label}</option>
            ))}
          </select>
        </FilterGroup>

        {selectedExercicio && (
          <FilterGroup label="Período">
            <select
              value={filters.periodStart ? String(monthKey(filters.periodStart)) : ''}
              onChange={e => handlePeriodStart(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border text-[12px] bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
            >
              {monthOptions.map(m => (
                <option key={monthKey(m)} value={monthKey(m)}>{formatMonthYear(m)}</option>
              ))}
            </select>
            <span style={{ color: 'var(--ink-5)', fontSize: '0.75rem' }}>até</span>
            <select
              value={filters.periodEnd ? String(monthKey(filters.periodEnd)) : ''}
              onChange={e => handlePeriodEnd(e.target.value)}
              className="px-2.5 py-1.5 rounded-md border text-[12px] bg-transparent"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
            >
              {monthOptions.map(m => (
                <option key={monthKey(m)} value={monthKey(m)}>{formatMonthYear(m)}</option>
              ))}
            </select>
          </FilterGroup>
        )}

        <FilterGroup label="Status">
          {statusOptions.map(s => (
            <Chip key={s} active={filters.status.includes(s)} onClick={() => onChange({ ...filters, status: toggle(filters.status, s) })}>
              {s}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Organização">
          {orgOptions.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>—</span>}
          {orgOptions.map(o => (
            <Chip key={o} active={filters.org.includes(o)} onClick={() => onChange({ ...filters, org: toggle(filters.org, o) })}>
              {o}
            </Chip>
          ))}
        </FilterGroup>

        <FilterGroup label="Classificação">
          {classificacaoOptions.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>—</span>}
          {classificacaoOptions.map(c => (
            <Chip key={c} active={filters.classificacao.includes(c)} onClick={() => onChange({ ...filters, classificacao: toggle(filters.classificacao, c) })}>
              {c}
            </Chip>
          ))}
        </FilterGroup>

        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="flex items-center gap-1 text-[12px] px-2 py-1.5 rounded border ml-auto disabled:opacity-40"
          style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
        >
          <X size={11} /> Limpar filtros
        </button>
      </div>
    </div>
  );
}
