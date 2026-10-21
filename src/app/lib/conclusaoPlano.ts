import type { Activity, Goal } from '../data/mockData';

export type TipoConclusaoPlano = 'meta' | 'etapa' | 'atividade';
export interface ConclusaoPlanoInput {
  tipo: TipoConclusaoPlano;
  id: string;
  concluido: boolean;
  periodos?: PeriodoConclusao[];
}
export interface PeriodoConclusao {
  id: string;
  inicioRealizado: string;
  fimRealizado: string;
  antes: { inicioRealizado: string | null; fimRealizado: string | null };
}

export function dataConclusaoValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(valor)) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}
export function errosPeriodoConclusao(inicio: unknown, fim: unknown): string[] {
  const erros: string[] = [];
  if (!dataConclusaoValida(inicio)) erros.push('Início realizado: informe uma data válida.');
  if (!dataConclusaoValida(fim)) erros.push('Fim realizado: informe uma data válida.');
  if (!erros.length && (fim as string) < (inicio as string)) erros.push('O fim realizado não pode ser anterior ao início realizado.');
  return erros;
}
export function atividadesSemPeriodo(atividades: Activity[]): Activity[] {
  return atividades.filter(a => errosPeriodoConclusao(a.actualStart, a.actualEnd).length > 0);
}
export function validarConclusaoInput(d: ConclusaoPlanoInput): void {
  if (!d || !['meta','etapa','atividade'].includes(d.tipo) || typeof d.id !== 'string' || !d.id.trim() || typeof d.concluido !== 'boolean')
    throw new Error('Informe o registro e a conclusão desejada.');
  if (d.periodos !== undefined && (!Array.isArray(d.periodos) || (!d.concluido && d.periodos.length))) throw new Error('Períodos inválidos.');
  const ids = new Set<string>();
  for (const p of d.periodos ?? []) {
    if (!p || typeof p.id !== 'string' || !p.id || ids.has(p.id) || !p.antes ||
      !('inicioRealizado' in p.antes) || !('fimRealizado' in p.antes) ||
      errosPeriodoConclusao(p.inicioRealizado, p.fimRealizado).length) throw new Error('Informe cada atividade e seu período realizado válido, sem repetições.');
    ids.add(p.id);
  }
}
export interface ResumoConclusao {
  total: number;
  concluidas: number;
  concluido: boolean;
  parcial: boolean;
}

export function resumirConclusao(atividades: Pick<Activity, 'status'>[]): ResumoConclusao {
  const total = atividades.length;
  const concluidas = atividades.filter(a => a.status === 'Concluído').length;
  return { total, concluidas, concluido: total > 0 && concluidas === total, parcial: concluidas > 0 && concluidas < total };
}

/** Sempre recebe a árvore completa, para filtros não mudarem o check dos pais. */
export function indiceConclusao(metas: Goal[]): Map<string, ResumoConclusao> {
  const indice = new Map<string, ResumoConclusao>();
  for (const meta of metas) {
    const atividades = meta.deliverables.flatMap(e => e.activities);
    indice.set(`meta:${meta.id}`, resumirConclusao(atividades));
    for (const etapa of meta.deliverables) {
      indice.set(`etapa:${etapa.id}`, resumirConclusao(etapa.activities));
      for (const atividade of etapa.activities) indice.set(`atividade:${atividade.id}`, resumirConclusao([atividade]));
    }
  }
  return indice;
}
