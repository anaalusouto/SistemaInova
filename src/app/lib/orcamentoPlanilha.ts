/**
 * Leitura da planilha de orçamento (RF-037, RN-030, RN-031).
 *
 * Funções puras sobre uma matriz de células — a leitura do arquivo .xlsx em si
 * acontece no servidor (orcamentoImportacao.server.ts). Separar assim permite
 * exercitar as regras difíceis (detectar subtotal, reconhecer cabeçalho,
 * interpretar moeda brasileira, reconciliar versões) sem depender de arquivo
 * binário em teste.
 *
 * O princípio que o RN-030 impõe: **relatar, nunca corrigir em silêncio**. Uma
 * planilha cujo total não fecha com a conta é um problema a resolver no
 * arquivo, não um arredondamento a aplicar por conta própria.
 */
import { arredondar, chaveDeOrigem, conferirLinha, type DivergenciaLinha } from './orcamento';

/** Célula crua: número, texto ou vazio. */
export type Celula = string | number | null | undefined;

export interface MapeamentoColunas {
  grupo: number;
  categoria: number;
  descricao: number;
  qtd: number;
  unidade: number;
  qtdUnidades: number;
  valorUnitario: number;
  total: number;
}

/**
 * Interpreta um valor de célula como número, aceitando moeda brasileira.
 *
 * "R$ 1.234,56" e 1234.56 precisam dar o mesmo resultado: a planilha pode ter
 * a coluna formatada como texto, e recusar isso rejeitaria arquivos válidos.
 * Devolve NaN quando não reconhece — que é o que a conferência sinaliza,
 * em vez de assumir zero e fazer a linha "fechar" por acidente.
 */
export function numeroBR(v: Celula): number {
  if (v === null || v === undefined || v === '') return NaN;
  if (typeof v === 'number') return v;

  const texto = String(v).trim();
  if (!texto) return NaN;

  // Remove símbolo de moeda e espaços (inclusive o não-separável do pt-BR).
  let limpo = texto.replace(/R\$/gi, '').replace(/[\s ]/g, '');
  const negativo = /^\(.*\)$/.test(limpo); // contabilidade usa parênteses
  if (negativo) limpo = limpo.slice(1, -1);

  // Decide o separador decimal pelo ÚLTIMO separador presente: "1.234,56" é
  // brasileiro e "1,234.56" é americano. Planilhas reais trazem os dois.
  const ultimaVirgula = limpo.lastIndexOf(',');
  const ultimoPonto = limpo.lastIndexOf('.');
  if (ultimaVirgula > ultimoPonto) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (ultimoPonto > ultimaVirgula) {
    limpo = limpo.replace(/,/g, '');
  } else {
    limpo = limpo.replace(',', '.');
  }

  const n = Number(limpo);
  if (!Number.isFinite(n)) return NaN;
  return negativo ? -n : n;
}

export function texto(v: Celula): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[\s ]+/g, ' ').trim();
}

/**
 * Linhas de controle — subtotais e total geral — NÃO viram itens (RF-037).
 *
 * Reconhecidas pelo texto da linha, não pela posição: planilhas reais põem
 * subtotal no fim de cada bloco, no início, ou em coluna própria. Cadastrar um
 * subtotal como item dobraria o valor do grupo no total do projeto, que é o
 * erro mais caro que esta importação pode cometer.
 */
const PADRAO_CONTROLE = /^(sub\s*-?\s*total|total\s+geral|total\s+do\s+grupo|total\s+da\s+etapa|total|somat[óo]rio|acumulado)\b/i;

export function ehLinhaDeControle(celulas: Celula[]): boolean {
  const textos = celulas.map(texto).filter(Boolean);
  if (textos.length === 0) return false;
  return textos.some(t => PADRAO_CONTROLE.test(t));
}

export function ehLinhaVazia(celulas: Celula[]): boolean {
  return celulas.every(c => texto(c) === '' && !(typeof c === 'number'));
}

/**
 * Procura a linha de cabeçalho e mapeia as colunas do modelo COOPAVISEU.
 *
 * Aceita variações de escrita porque cada planilha escreve o cabeçalho de um
 * jeito ("Qtd.", "QTDE", "Quantidade"). Devolve null quando não reconhece o
 * suficiente — melhor pedir mapeamento manual do que adivinhar a coluna errada
 * e importar valores trocados.
 */
const SINONIMOS: Record<keyof MapeamentoColunas, RegExp> = {
  grupo: /^(grupo|etapa\s*or[çc]ament[áa]ria|etapa|bloco|rubrica)$/i,
  categoria: /^(categoria|classifica[çc][ãa]o|tipo)$/i,
  descricao: /^(descri[çc][ãa]o|item|especifica[çc][ãa]o|discrimina[çc][ãa]o)$/i,
  qtd: /^(qtd\.?|qtde\.?|quantidade)$/i,
  unidade: /^(unidade|un\.?|und\.?|medida)$/i,
  qtdUnidades: /^(qtd\.?\s*(de\s*)?unidade[s]?|quantidade\s*(de\s*)?unidade[s]?|qtd\.?\s*un\.?)$/i,
  valorUnitario: /^(valor\s*unit[áa]rio.*|vl\.?\s*unit.*|pre[çc]o\s*unit[áa]rio.*)$/i,
  total: /^(total.*|valor\s*total.*|vl\.?\s*total.*)$/i,
};

export interface CabecalhoEncontrado {
  linha: number;
  mapeamento: MapeamentoColunas;
  /** Colunas que não foram reconhecidas e precisam de mapeamento manual. */
  faltando: (keyof MapeamentoColunas)[];
}

export function detectarCabecalho(matriz: Celula[][], limite = 20): CabecalhoEncontrado | null {
  let melhor: CabecalhoEncontrado | null = null;

  for (let i = 0; i < Math.min(matriz.length, limite); i++) {
    const linha = matriz[i] ?? [];
    const mapeamento: Partial<MapeamentoColunas> = {};

    for (const [campo, padrao] of Object.entries(SINONIMOS) as [keyof MapeamentoColunas, RegExp][]) {
      const idx = linha.findIndex(c => padrao.test(texto(c)));
      if (idx >= 0 && mapeamento[campo] === undefined) mapeamento[campo] = idx;
    }

    // "Qtd." e "Qtd. de unidade" competem pelo mesmo padrão inicial; se as duas
    // caíram na mesma coluna, a segunda ocorrência é a de unidades.
    if (mapeamento.qtd !== undefined && mapeamento.qtd === mapeamento.qtdUnidades) {
      const segunda = linha.findIndex((c, j) => j > mapeamento.qtd! && SINONIMOS.qtdUnidades.test(texto(c)));
      if (segunda >= 0) mapeamento.qtdUnidades = segunda;
      else delete mapeamento.qtdUnidades;
    }

    const campos = Object.keys(SINONIMOS) as (keyof MapeamentoColunas)[];
    const encontrados = campos.filter(c => mapeamento[c] !== undefined);
    // Descrição e total são o mínimo para a linha significar alguma coisa.
    if (mapeamento.descricao === undefined || mapeamento.total === undefined) continue;

    const candidato: CabecalhoEncontrado = {
      linha: i,
      mapeamento: {
        grupo: mapeamento.grupo ?? -1,
        categoria: mapeamento.categoria ?? -1,
        descricao: mapeamento.descricao,
        qtd: mapeamento.qtd ?? -1,
        unidade: mapeamento.unidade ?? -1,
        qtdUnidades: mapeamento.qtdUnidades ?? -1,
        valorUnitario: mapeamento.valorUnitario ?? -1,
        total: mapeamento.total,
      },
      faltando: campos.filter(c => mapeamento[c] === undefined),
    };

    if (!melhor || encontrados.length > (campos.length - melhor.faltando.length)) melhor = candidato;
  }

  return melhor;
}

// ---------------------------------------------------------------------------
// Prévia (RF-037, RN-030)
// ---------------------------------------------------------------------------

export interface LinhaLida {
  /** Número da linha na planilha, 1-based — é como a pessoa vai procurar no Excel. */
  linhaPlanilha: number;
  grupo: string;
  categoria: string;
  descricao: string;
  qtd: number;
  unidade: string;
  qtdUnidades: number;
  valorUnitario: number;
  totalDeclarado: number;
  chave: string;
  divergencias: DivergenciaLinha[];
}

export interface LinhaDeControle {
  linhaPlanilha: number;
  rotulo: string;
  valor: number;
}

export interface Previa {
  itens: LinhaLida[];
  controle: LinhaDeControle[];
  vazias: number;
  /** Linhas que não puderam virar item, com o motivo (RF-037). */
  rejeitadas: { linhaPlanilha: number; motivo: string }[];
  /** Soma dos totais declarados dos itens. */
  somaDosItens: number;
  /** Divergência entre a soma dos itens e o total geral declarado, se houver. */
  desacordoDeTotal: { declarado: number; somado: number } | null;
  duplicadas: { chave: string; linhas: number[] }[];
}

/**
 * Lê a matriz aplicando o mapeamento e devolve a prévia.
 *
 * Nada é gravado aqui: a prévia existe para que a equipe PMO veja o que
 * entraria ANTES de entrar, incluindo o que seria rejeitado. O documento é
 * explícito em nunca concluir importação parcial sem informar as linhas
 * rejeitadas — por isso elas saem nomeadas e numeradas, não contadas.
 */
export function montarPrevia(
  matriz: Celula[][],
  mapeamento: MapeamentoColunas,
  primeiraLinhaDados: number,
): Previa {
  const itens: LinhaLida[] = [];
  const controle: LinhaDeControle[] = [];
  const rejeitadas: { linhaPlanilha: number; motivo: string }[] = [];
  let vazias = 0;
  let grupoCorrente = '';

  const celula = (linha: Celula[], idx: number): Celula => (idx >= 0 ? linha[idx] : undefined);

  for (let i = primeiraLinhaDados; i < matriz.length; i++) {
    const linha = matriz[i] ?? [];
    const numero = i + 1;

    if (ehLinhaVazia(linha)) { vazias++; continue; }

    if (ehLinhaDeControle(linha)) {
      const rotulo = linha.map(texto).find(t => PADRAO_CONTROLE.test(t)) ?? 'total';
      const valor = numeroBR(celula(linha, mapeamento.total));
      controle.push({ linhaPlanilha: numero, rotulo, valor: Number.isFinite(valor) ? valor : NaN });
      continue;
    }

    const descricao = texto(celula(linha, mapeamento.descricao));
    const grupoDaLinha = texto(celula(linha, mapeamento.grupo));

    // Planilhas reais escrevem o grupo só na primeira linha do bloco e deixam
    // as demais em branco. Herdar o último grupo visto é o comportamento que
    // preserva o agrupamento de origem (RF-030).
    if (grupoDaLinha) grupoCorrente = grupoDaLinha;

    if (!descricao) {
      rejeitadas.push({ linhaPlanilha: numero, motivo: 'Linha sem descrição — não é item nem linha de controle reconhecida.' });
      continue;
    }

    const qtd = mapeamento.qtd >= 0 ? numeroBR(celula(linha, mapeamento.qtd)) : 1;
    const qtdUnidades = mapeamento.qtdUnidades >= 0 ? numeroBR(celula(linha, mapeamento.qtdUnidades)) : 1;
    const valorUnitario = mapeamento.valorUnitario >= 0 ? numeroBR(celula(linha, mapeamento.valorUnitario)) : NaN;
    const totalDeclarado = numeroBR(celula(linha, mapeamento.total));

    if (!Number.isFinite(totalDeclarado)) {
      rejeitadas.push({ linhaPlanilha: numero, motivo: `Total da linha ilegível: "${texto(celula(linha, mapeamento.total))}".` });
      continue;
    }

    const categoria = texto(celula(linha, mapeamento.categoria));
    const registro: LinhaLida = {
      linhaPlanilha: numero,
      grupo: grupoCorrente,
      categoria,
      descricao,
      qtd: Number.isFinite(qtd) ? qtd : 1,
      unidade: texto(celula(linha, mapeamento.unidade)),
      qtdUnidades: Number.isFinite(qtdUnidades) ? qtdUnidades : 1,
      valorUnitario: Number.isFinite(valorUnitario) ? valorUnitario : NaN,
      totalDeclarado,
      chave: chaveDeOrigem(grupoCorrente, categoria, descricao),
      divergencias: [],
    };

    registro.divergencias = Number.isFinite(valorUnitario)
      ? conferirLinha({
          grupo: registro.grupo, categoria: registro.categoria, descricao: registro.descricao,
          qtd: registro.qtd, qtdUnidades: registro.qtdUnidades,
          valorUnitario: registro.valorUnitario, totalDeclarado: registro.totalDeclarado,
        })
      : [{ tipo: 'número', mensagem: 'Valor unitário ausente ou ilegível — a conferência da fórmula não pôde ser feita.' }];

    itens.push(registro);
  }

  // Duplicidade de chave: a reimportação não conseguiria dizer qual linha
  // corresponde a qual item, então é conciliação manual (RN-031).
  const porChave = new Map<string, number[]>();
  for (const item of itens) {
    if (!porChave.has(item.chave)) porChave.set(item.chave, []);
    porChave.get(item.chave)!.push(item.linhaPlanilha);
  }
  const duplicadas = [...porChave.entries()]
    .filter(([, linhas]) => linhas.length > 1)
    .map(([chave, linhas]) => ({ chave, linhas }));

  for (const d of duplicadas) {
    for (const item of itens) {
      if (item.chave === d.chave) {
        item.divergencias.push({
          tipo: 'duplicidade',
          mensagem: `Grupo, categoria e descrição repetidos nas linhas ${d.linhas.join(', ')}.`,
        });
      }
    }
  }

  const somaDosItens = arredondar(itens.reduce((s, i) => s + i.totalDeclarado, 0));
  const totalGeral = controle.find(c => /total\s+geral/i.test(c.rotulo));
  const desacordoDeTotal =
    totalGeral && Number.isFinite(totalGeral.valor) && arredondar(totalGeral.valor) !== somaDosItens
      ? { declarado: arredondar(totalGeral.valor), somado: somaDosItens }
      : null;

  return { itens, controle, vazias, rejeitadas, somaDosItens, desacordoDeTotal, duplicadas };
}

// ---------------------------------------------------------------------------
// Reconciliação entre versões (RN-031)
// ---------------------------------------------------------------------------

export interface ItemExistente {
  id: string;
  chave: string | null;
  descricao: string;
  valorProposto: number;
  temExecucao: boolean;
  excluido: boolean;
}

export interface Reconciliacao {
  incluidos: LinhaLida[];
  alterados: { existente: ItemExistente; novo: LinhaLida; de: number; para: number }[];
  /** Presentes na versão anterior e ausentes na nova — decisão humana (RN-031). */
  ausentes: ItemExistente[];
  /** Iguais em tudo: nem entram no resumo de mudanças. */
  inalterados: number;
  /** Chaves que casam com mais de um item existente — exigem conciliação manual. */
  ambiguos: { chave: string; quantidade: number }[];
}

/**
 * Compara a planilha nova com o que já está no projeto.
 *
 * O documento exige preservar execução, datas, justificativas, exclusões e
 * riscos por correspondência inequívoca — e exigir conciliação manual quando a
 * correspondência é ambígua. Por isso a função NÃO decide sozinha: ela
 * classifica, e quem confirma é a equipe PMO, vendo o resumo.
 *
 * Repetir a MESMA planilha resulta em tudo inalterado, sem duplicar item
 * (RF-037) — é o mesmo caminho, não um caso especial.
 */
export function reconciliar(existentes: ItemExistente[], novos: LinhaLida[]): Reconciliacao {
  const porChave = new Map<string, ItemExistente[]>();
  for (const e of existentes) {
    if (!e.chave) continue;
    if (!porChave.has(e.chave)) porChave.set(e.chave, []);
    porChave.get(e.chave)!.push(e);
  }

  const incluidos: LinhaLida[] = [];
  const alterados: Reconciliacao['alterados'] = [];
  const ambiguos: { chave: string; quantidade: number }[] = [];
  const casados = new Set<string>();
  let inalterados = 0;

  for (const novo of novos) {
    const candidatos = porChave.get(novo.chave) ?? [];

    if (candidatos.length === 0) { incluidos.push(novo); continue; }
    if (candidatos.length > 1) {
      ambiguos.push({ chave: novo.chave, quantidade: candidatos.length });
      continue;
    }

    const existente = candidatos[0];
    casados.add(existente.id);
    if (arredondar(existente.valorProposto) !== arredondar(novo.totalDeclarado)) {
      alterados.push({ existente, novo, de: arredondar(existente.valorProposto), para: arredondar(novo.totalDeclarado) });
    } else {
      inalterados++;
    }
  }

  const ausentes = existentes.filter(e => !casados.has(e.id) && !!e.chave);

  return { incluidos, alterados, ausentes, inalterados, ambiguos };
}
