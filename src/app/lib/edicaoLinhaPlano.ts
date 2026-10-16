import type { Activity, Deliverable } from '../data/mockData';
import type { AtividadeInput } from '../planoTrabalho.server';
import { validarDatasDaAtividade, validarJustificativaAtraso } from './planoTrabalho';

export function dadosDaAtividade(a: Activity, etapaId: string): AtividadeInput {
  return { etapaId, nome: a.name, responsavel: a.responsible, status: a.status, progresso: a.progress,
    inicioPrevisto: a.plannedStart, fimPrevisto: a.plannedEnd,
    inicioRealizado: a.actualStart, fimRealizado: a.actualEnd,
    justificativaAtraso: a.delayJustification, vinculoOrcamentario: a.budgetLink,
    observacoes: a.observations, proximoPasso: a.nextStep,
    proximoPassoResponsavel: a.nextStepOwner, proximoPassoPrazo: a.nextStepDue, riscoOrigemId: a.riskOriginId };
}

export function errosDaEdicao(d: AtividadeInput, etapa: Deliverable): string[] {
  const datas = { plannedStart: d.inicioPrevisto, plannedEnd: d.fimPrevisto,
    actualStart: d.inicioRealizado, actualEnd: d.fimRealizado };
  return [ ...(!d.inicioPrevisto || !d.fimPrevisto ? ['Informe o início e o fim previstos.'] : []),
    ...validarDatasDaAtividade(datas, etapa).erros,
    ...validarJustificativaAtraso(datas, d.justificativaAtraso).erros ];
}
