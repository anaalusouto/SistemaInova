import type { Risk } from '../data/mockData';
import type { RiscoInput } from '../planoTrabalho.server';

export function dadosDoRisco(projetoId: number, risco: Risk): RiscoInput {
  return {
    projetoId, etapaId: risco.stageId ?? '', titulo: risco.title ?? '', descricao: risco.description ?? '',
    categoria: risco.category ?? '', responsavel: risco.responsible ?? '',
    probabilidade: risco.probability, impacto: risco.impact, status: risco.status,
    estrategiaResposta: risco.responseStrategy ?? '', especificacao: risco.specification ?? '',
  };
}

export function errosDaEdicaoRisco(dados: RiscoInput, risco: Risk): string[] {
  const erros: string[] = [];
  if (!dados.titulo.trim()) erros.push('Informe o título do risco.');
  if (!dados.descricao.trim()) erros.push('Informe a descrição.');
  if (!dados.categoria.trim()) erros.push('Informe a categoria.');
  if (!dados.responsavel.trim()) erros.push('Informe o responsável.');
  if (!dados.etapaId && risco.stageId) erros.push('Selecione a etapa do risco.');
  if (!Number.isInteger(dados.probabilidade) || dados.probabilidade < 1 || dados.probabilidade > 5)
    erros.push('A probabilidade deve ser um inteiro entre 1 e 5.');
  if (!Number.isInteger(dados.impacto) || dados.impacto < 1 || dados.impacto > 5)
    erros.push('O impacto deve ser um inteiro entre 1 e 5.');
  if (!['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'].includes(dados.status)) erros.push('Status de risco inválido.');
  return erros;
}
