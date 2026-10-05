import type { Activity, ActivityStatus, Goal } from '../data/mockData';
import type { GanttActivity, GanttBloco, GanttStatus } from '../data/cronogramaExecutivo';
import type { AtividadeInput } from '../planoTrabalho.server';

export const idAdministrativo = (tipo: 'meta' | 'etapa' | 'atividade' | 'tarefa', id: number) => `administrativo:${tipo}:${id}`;
export const numeroAdministrativo = (id: string) => Number(id.split(':').at(-1));
export function statusDoPlano(status: GanttStatus): ActivityStatus {
  return status === 'Entregue' ? 'Concluído' : status === 'Não iniciado' ? 'A iniciar' : 'Em andamento';
}
export function statusDoCronograma(status: ActivityStatus): GanttStatus {
  return status === 'Concluído' ? 'Entregue' : status === 'A iniciar' ? 'Não iniciado' : 'No prazo';
}

// Projeção dos mesmos registros, sem gerar IDs novos, escrever no banco de
// projetos das organizações ou transformar datas previstas em realizadas.
export function metasAdministrativas(blocos: GanttBloco[]): Goal[] {
  return blocos.map((b, i) => ({
    ...b.plano, id: idAdministrativo('meta', b.id), name: b.bloco, order: i + 1,
    deliverables: b.entregas.map((e, j) => ({
      ...e.plano, id: idAdministrativo('etapa', e.id), name: e.entrega, order: j + 1,
      expectedResult: e.plano?.expectedResult ?? e.comentario ?? '',
      plannedStart: e.inicio || null, plannedEnd: e.fim || null,
      actualStart: e.plano?.actualStart ?? null, actualEnd: e.plano?.actualEnd ?? null,
      activities: e.atividades.map((a, k): Activity => ({
        ...a.plano, id: idAdministrativo('atividade', a.id), name: a.atividade, order: k + 1,
        responsible: a.responsavel ?? '', status: statusDoPlano(a.status),
        progress: a.status === 'Entregue' ? 100 : a.status === 'Não iniciado' ? 0 : Math.min(99, Math.max(0, a.progress ?? 0)),
        observations: a.observacao ?? a.plano?.observations ?? a.descricao ?? '',
        plannedStart: a.inicio || null, plannedEnd: a.fim || null,
        actualStart: a.plano?.actualStart ?? null, actualEnd: a.plano?.actualEnd ?? null,
        delayJustification: a.plano?.delayJustification ?? '', budgetLink: a.plano?.budgetLink ?? 'Não informado',
        nextStep: a.plano?.nextStep ?? '', nextStepOwner: a.plano?.nextStepOwner ?? '', nextStepDue: a.plano?.nextStepDue ?? null,
        tasks: (a.subatividades ?? []).map((t, n) => ({ id: idAdministrativo('tarefa', t.id), title: t.atividade, order: n + 1 })),
        plannedDate: a.fim, startDate: a.plano?.actualStart ?? null, conclusionDate: a.plano?.actualEnd ?? null,
      })),
    })),
  }));
}

export function patchAtividadeAdministrativa(form: AtividadeInput, atual: GanttActivity) {
  const status = statusDoPlano(atual.status) === form.status ? atual.status : statusDoCronograma(form.status);
  return {
    atividade: form.nome.trim(), responsavel: form.responsavel, inicio: form.inicioPrevisto ?? '', fim: form.fimPrevisto ?? '',
    status, progress: form.progresso, observacao: form.observacoes,
    plano: {
      ...atual.plano, actualStart: form.inicioRealizado, actualEnd: form.fimRealizado,
      delayJustification: form.justificativaAtraso, budgetLink: form.vinculoOrcamentario,
      nextStep: form.proximoPasso, nextStepOwner: form.proximoPassoResponsavel, nextStepDue: form.proximoPassoPrazo,
    },
  };
}
