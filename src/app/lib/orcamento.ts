/**
 * Cálculos do Orçamento (RN-021, RN-030).
 *
 * O fio condutor destas funções é uma distinção só: **ausência não é zero**.
 * Um item sem valor executado informado não executou R$ 0,00 — ninguém disse
 * quanto executou. Somar esses itens como zero produziria um "total executado"
 * que parece pequeno por causa de dado faltando, e não por causa de economia,
 * e é exatamente a leitura que faria alguém concluir que sobra orçamento onde
 * não sobra.
 *
 * Por isso `valorExecutado` é `number | null` em todo lugar, e as funções
 * devolvem `null` quando não há base para calcular, em vez de devolver zero.
 */

export const NAO_INFORMADO = 'Não informado' as const;

export type SituacaoItem = 'Ativo' | 'Excluído';

export interface ItemOrcamento {
  id: string;
  grupo: string;
  ordem: number;
  categoria: string;
  descricao: string;
  qtd: number;
  unidade: string;
  qtdUnidades: number;
  valorUnitario: number;
  /** Total do item como a planilha declarou (RF-029). */
  valorProposto: number;
  /** Fórmula qtd × qtdUnidades × valorUnitario, calculada pelo banco (RN-030). */
  valorPlanejado: number;
  /** null = sem registro de execução. NUNCA zero por ausência (RF-029). */
  valorExecutado: number | null;
  dataCompra: string | null;
  justificativaDiferenca: string;
  situacao: SituacaoItem;
  motivoExclusao: string | null;
  riscoId: string | null;
}

// ---------------------------------------------------------------------------
// Diferença por item (RF-039, RN-021)
// ---------------------------------------------------------------------------

/**
 * Proposto − Executado, só quando os DOIS existem.
 *
 * Devolve null quando não há execução informada: a tela mostra travessão, e
 * não uma diferença igual ao proposto inteiro, que faria parecer que o item
 * economizou tudo. Item excluído também não tem diferença — seu total saiu do
 * plano ativo, não foi "executado a zero" (RN-021).
 *
 * Valor negativo indica execução ACIMA do proposto, e é informação que precisa
 * aparecer com sinal, não em módulo.
 */
export function diferencaDoItem(item: Pick<ItemOrcamento, 'valorProposto' | 'valorExecutado' | 'situacao'>): number | null {
  if (item.situacao === 'Excluído') return null;
  if (item.valorExecutado === null) return null;
  return arredondar(item.valorProposto - item.valorExecutado);
}

/** Arredondamento monetário a centavos (RN-030). */
export function arredondar(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Diferença entre o executado e o proposto exige justificativa (RF-039). */
export function exigeJustificativa(
  item: Pick<ItemOrcamento, 'valorProposto' | 'valorExecutado'>,
): boolean {
  if (item.valorExecutado === null) return false;
  return arredondar(item.valorExecutado) !== arredondar(item.valorProposto);
}

// ---------------------------------------------------------------------------
// Totais (RN-021)
// ---------------------------------------------------------------------------

export interface TotaisOrcamento {
  /** Soma dos totais originais importados, INCLUSIVE de itens depois excluídos. */
  proposto: number;
  /** Soma dos itens não excluídos — indicador derivado, não substitui o proposto. */
  ativo: number;
  /** Soma dos executados informados em itens ativos. null = nenhum informado. */
  executadoConhecido: number | null;
  /** Quantos itens ativos ainda não têm execução informada. */
  itensSemExecucao: number;
  itensExcluidos: number;
  totalExcluido: number;
}

/**
 * Totais do projeto ou de um grupo.
 *
 * `proposto` inclui os itens excluídos de propósito (RF-029): o valor original
 * da proposta não muda porque a equipe decidiu não comprar algo — o que muda é
 * o plano ativo, que aparece separado. Misturar os dois faria o orçamento
 * aprovado "encolher" no relatório, o que não é verdade.
 */
export function totaisDoOrcamento(itens: ItemOrcamento[]): TotaisOrcamento {
  const ativos = itens.filter(i => i.situacao === 'Ativo');
  const excluidos = itens.filter(i => i.situacao === 'Excluído');
  const comExecucao = ativos.filter(i => i.valorExecutado !== null);

  return {
    proposto: arredondar(itens.reduce((s, i) => s + i.valorProposto, 0)),
    ativo: arredondar(ativos.reduce((s, i) => s + i.valorProposto, 0)),
    // null, e não zero: "ninguém informou execução" é diferente de "executou zero".
    executadoConhecido: comExecucao.length
      ? arredondar(comExecucao.reduce((s, i) => s + (i.valorExecutado ?? 0), 0))
      : null,
    itensSemExecucao: ativos.length - comExecucao.length,
    itensExcluidos: excluidos.length,
    totalExcluido: arredondar(excluidos.reduce((s, i) => s + i.valorProposto, 0)),
  };
}

/** Agrupa preservando a ordem de origem da planilha (RF-030, RF-038). */
export function agruparPorGrupo(itens: ItemOrcamento[]): { grupo: string; itens: ItemOrcamento[]; totais: TotaisOrcamento }[] {
  const ordemDosGrupos: string[] = [];
  const mapa = new Map<string, ItemOrcamento[]>();

  for (const item of [...itens].sort((a, b) => a.ordem - b.ordem)) {
    const chave = item.grupo || 'Sem grupo';
    if (!mapa.has(chave)) { mapa.set(chave, []); ordemDosGrupos.push(chave); }
    mapa.get(chave)!.push(item);
  }

  return ordemDosGrupos.map(grupo => ({
    grupo,
    itens: mapa.get(grupo)!,
    totais: totaisDoOrcamento(mapa.get(grupo)!),
  }));
}

// ---------------------------------------------------------------------------
// Formatação
// ---------------------------------------------------------------------------

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Moeda, ou "Não informado" quando o valor não existe (RF-029). */
export function moeda(v: number | null | undefined): string {
  return v === null || v === undefined ? NAO_INFORMADO : BRL.format(v);
}

/** Diferença com sinal explícito; travessão quando não há o que calcular (RF-039). */
export function moedaComSinal(v: number | null): string {
  if (v === null) return '—';
  if (v === 0) return BRL.format(0);
  return `${v > 0 ? '+' : '−'}${BRL.format(Math.abs(v))}`;
}

// ---------------------------------------------------------------------------
// Conferência da linha importada (RN-030)
// ---------------------------------------------------------------------------

export interface DivergenciaLinha {
  tipo: 'fórmula' | 'descrição' | 'número' | 'duplicidade';
  mensagem: string;
}

/**
 * Confere uma linha da planilha contra a fórmula e as regras mínimas.
 *
 * RN-030 é explícito em NÃO corrigir números silenciosamente: a função apenas
 * relata, e quem decide é a equipe PMO, no arquivo ou registrando a decisão.
 * Arredondar a diferença para que "feche" seria esconder um erro de planilha
 * que pode custar dinheiro.
 */
export function conferirLinha(linha: {
  grupo: string; categoria: string; descricao: string;
  qtd: number; qtdUnidades: number; valorUnitario: number; totalDeclarado: number;
}): DivergenciaLinha[] {
  const problemas: DivergenciaLinha[] = [];

  if (!linha.descricao.trim()) {
    problemas.push({ tipo: 'descrição', mensagem: 'Descrição vazia.' });
  }
  for (const [rotulo, valor] of [['Qtd.', linha.qtd], ['Qtd. de unidade', linha.qtdUnidades], ['valor unitário', linha.valorUnitario]] as const) {
    if (!Number.isFinite(valor)) {
      problemas.push({ tipo: 'número', mensagem: `${rotulo} não é um número válido.` });
    } else if (valor < 0) {
      problemas.push({ tipo: 'número', mensagem: `${rotulo} é negativo.` });
    }
  }

  const esperado = arredondar(linha.qtd * linha.qtdUnidades * linha.valorUnitario);
  const declarado = arredondar(linha.totalDeclarado);
  if (Number.isFinite(esperado) && Number.isFinite(declarado) && esperado !== declarado) {
    problemas.push({
      tipo: 'fórmula',
      mensagem: `Total declarado ${moeda(declarado)} difere da conta ${moeda(esperado)} (${linha.qtd} × ${linha.qtdUnidades} × ${moeda(linha.valorUnitario)}).`,
    });
  }

  return problemas;
}

/**
 * Chave de correspondência entre versões da planilha (RN-031).
 *
 * Grupo + categoria + descrição, normalizados. Não inclui valores: item cujo
 * preço mudou continua sendo o mesmo item, e é justamente essa mudança que a
 * reimportação precisa mostrar como "alterado" em vez de "removido e incluído".
 */
export function chaveDeOrigem(grupo: string, categoria: string, descricao: string): string {
  const limpar = (v: string) =>
    v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  return [limpar(grupo), limpar(categoria), limpar(descricao)].join('|');
}
