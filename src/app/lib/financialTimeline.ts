import type { ProjectExt } from '../store';
import { enumerateMonths, formatMonthYear, monthKey, monthYearFromKey, parseMonthYear, type MonthYear } from './portfolioFilters';

export interface FinancialMonthPoint {
  month: string;
  previsto: number;
  executado: number;
}

/**
 * Agrega os itens de orçamento reais (financialItems) dos projetos por mês,
 * acumulando previsto/executado ao longo do intervalo. Itens sem data reconhecível
 * (formato MM/AAAA, DD/MM/AAAA ou AAAA-MM) são ignorados no eixo temporal.
 */
export function buildFinancialTimeline(
  projects: ProjectExt[],
  period: { start: MonthYear; end: MonthYear } | null,
): FinancialMonthPoint[] {
  const items = projects.flatMap(p => p.financialItems ?? []);
  const parsed = items
    .map(i => ({ date: parseMonthYear(i.date), planned: i.plannedValue, executed: i.executedValue }))
    .filter((x): x is { date: MonthYear; planned: number; executed: number } => x.date !== null);

  let rangeStart = period?.start;
  let rangeEnd = period?.end;
  if (!rangeStart || !rangeEnd) {
    if (parsed.length === 0) return [];
    const keys = parsed.map(x => monthKey(x.date));
    rangeStart = monthYearFromKey(Math.min(...keys));
    rangeEnd = monthYearFromKey(Math.max(...keys));
  }

  const months = enumerateMonths(rangeStart, rangeEnd);
  let cumPrevisto = 0;
  let cumExecutado = 0;

  return months.map(m => {
    const key = monthKey(m);
    const inMonth = parsed.filter(x => monthKey(x.date) === key);
    cumPrevisto += inMonth.reduce((a, x) => a + x.planned, 0);
    cumExecutado += inMonth.reduce((a, x) => a + x.executed, 0);
    return { month: formatMonthYear(m), previsto: cumPrevisto, executado: cumExecutado };
  });
}
