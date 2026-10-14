import { arredondar, chaveDeOrigem, type ItemOrcamento } from './orcamento';

export interface PlanejadoInput {
  metaId: string | null;
  grupo: string;
  categoria: string;
  descricao: string;
  qtd: number;
  unidade: string;
  qtdUnidades: number;
  valorUnitario: number;
  valorProposto: number;
}

/** Campos da proposta; notas, execução e riscos nunca entram na revisão. */
export function planejadoDoItem(i: PlanejadoInput | ItemOrcamento): PlanejadoInput {
  return { metaId: i.metaId ?? null, grupo: i.grupo, categoria: i.categoria, descricao: i.descricao,
    qtd: i.qtd, unidade: i.unidade, qtdUnidades: i.qtdUnidades,
    valorUnitario: i.valorUnitario, valorProposto: i.valorProposto };
}

export function validarPlanejado(i: PlanejadoInput): string[] {
  const erros: string[] = [];
  if (!i.descricao?.trim()) erros.push('Informe a descrição do item.');
  if (!i.metaId) erros.push('Selecione a meta do projeto.');
  for (const [nome, valor] of [['Quantidade', i.qtd], ['Quantidade de unidades', i.qtdUnidades],
    ['Valor unitário', i.valorUnitario], ['Total proposto', i.valorProposto]] as const) {
    if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0) erros.push(`${nome} deve ser um número maior ou igual a zero.`);
  }
  return erros;
}

export function camposPlanejados(i: PlanejadoInput) {
  return { meta_id: i.metaId, grupo: i.grupo.trim(), categoria: i.categoria.trim(), item: i.descricao.trim(),
    qtd: i.qtd, unidade: i.unidade.trim(), qtd_unidades: i.qtdUnidades,
    valor_unitario: i.valorUnitario, valor_proposto: arredondar(i.valorProposto),
    chave_origem: chaveDeOrigem(i.grupo, i.categoria, i.descricao) };
}
