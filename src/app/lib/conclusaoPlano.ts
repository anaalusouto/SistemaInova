import type { Activity, Goal } from '../data/mockData';

export type TipoConclusaoPlano = 'meta' | 'etapa' | 'atividade';
export interface ConclusaoPlanoInput {
  tipo: TipoConclusaoPlano;
  id: string;
  concluido: boolean;
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
