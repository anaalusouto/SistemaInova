import type { ProjectExt } from '../store';
import type { ProjectStatus } from '../data/mockData';

export interface MonthYear {
  year: number;
  month: number; // 1-12
}

export const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const STATUS_OPTIONS: ProjectStatus[] = ['Não iniciado', 'Em andamento', 'Atrasado', 'Concluído', 'Suspenso'];

/** Converte "MM/AAAA", "DD/MM/AAAA" ou "AAAA-MM[-DD]" em {year, month}. Retorna null se não reconhecer. */
export function parseMonthYear(value: string | null | undefined): MonthYear | null {
  if (!value) return null;
  const s = value.trim();

  const mmYYYY = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (mmYYYY) {
    const month = Number(mmYYYY[1]);
    const year = Number(mmYYYY[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }

  const ddMMYYYY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (ddMMYYYY) {
    const month = Number(ddMMYYYY[2]);
    const year = Number(ddMMYYYY[3]);
    if (month >= 1 && month <= 12) return { year, month };
  }

  const iso = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/.exec(s);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }

  return null;
}

export function monthKey(m: MonthYear): number {
  return m.year * 12 + (m.month - 1);
}

export function monthYearFromKey(key: number): MonthYear {
  return { year: Math.floor(key / 12), month: (key % 12) + 1 };
}

export function formatMonthYear(m: MonthYear): string {
  return `${MONTH_LABELS[m.month - 1]}/${m.year}`;
}

export function enumerateMonths(min: MonthYear, max: MonthYear): MonthYear[] {
  const minK = monthKey(min);
  const maxK = monthKey(max);
  const out: MonthYear[] = [];
  for (let k = minK; k <= maxK; k++) out.push(monthYearFromKey(k));
  return out;
}

export interface Exercicio {
  /** Chave estável: "anoInicio-anoFim" (ex.: "2025-2026"). */
  key: string;
  label: string;
  minMonth: MonthYear;
  maxMonth: MonthYear;
}

/** Deriva os "exercícios" disponíveis a partir do intervalo início/fim de cada projeto. */
export function getExercicios(projects: ProjectExt[]): Exercicio[] {
  const map = new Map<string, Exercicio>();
  for (const p of projects) {
    const start = parseMonthYear(p.startDate);
    const end = parseMonthYear(p.endDate);
    if (!start || !end) continue;
    const key = `${start.year}-${end.year}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        label: start.year === end.year ? `${start.year}` : `${start.year}–${end.year}`,
        minMonth: start,
        maxMonth: end,
      });
    } else {
      if (monthKey(start) < monthKey(existing.minMonth)) existing.minMonth = start;
      if (monthKey(end) > monthKey(existing.maxMonth)) existing.maxMonth = end;
    }
  }
  return Array.from(map.values()).sort((a, b) => monthKey(a.minMonth) - monthKey(b.minMonth));
}

/** Exercício cujo intervalo contém a data atual; senão, o mais recente. */
export function getDefaultExercicio(exercicios: Exercicio[]): Exercicio | null {
  if (exercicios.length === 0) return null;
  const now = new Date();
  const nowKey = monthKey({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const containing = exercicios.find(e => monthKey(e.minMonth) <= nowKey && nowKey <= monthKey(e.maxMonth));
  return containing ?? exercicios[exercicios.length - 1];
}

export function getOrgOptions(projects: ProjectExt[]): string[] {
  return Array.from(new Set(projects.map(p => p.org).filter((v): v is string => !!v && v.trim() !== '')))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function getClassificacaoOptions(projects: ProjectExt[]): string[] {
  return Array.from(new Set(projects.map(p => p.segmento).filter((v): v is string => !!v && v.trim() !== '')))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export interface PortfolioFilterValues {
  exercicioKey: string | null;
  periodStart: MonthYear | null;
  periodEnd: MonthYear | null;
  status: string[];
  org: string[];
  classificacao: string[];
}

export function emptyPortfolioFilters(): PortfolioFilterValues {
  return { exercicioKey: null, periodStart: null, periodEnd: null, status: [], org: [], classificacao: [] };
}

export function applyPortfolioFilters(projects: ProjectExt[], filters: PortfolioFilterValues): ProjectExt[] {
  return projects.filter(p => {
    if (filters.exercicioKey) {
      const start = parseMonthYear(p.startDate);
      const end = parseMonthYear(p.endDate);
      if (!start || !end || `${start.year}-${end.year}` !== filters.exercicioKey) return false;
    }
    if (filters.periodStart && filters.periodEnd) {
      const start = parseMonthYear(p.startDate);
      const end = parseMonthYear(p.endDate);
      if (!start || !end) return false;
      const pStart = monthKey(start);
      const pEnd = monthKey(end);
      const fStart = monthKey(filters.periodStart);
      const fEnd = monthKey(filters.periodEnd);
      if (pEnd < fStart || pStart > fEnd) return false;
    }
    if (filters.status.length > 0 && !filters.status.includes(p.status)) return false;
    if (filters.org.length > 0 && !filters.org.includes(p.org ?? '')) return false;
    if (filters.classificacao.length > 0 && !filters.classificacao.includes(p.segmento ?? '')) return false;
    return true;
  });
}
