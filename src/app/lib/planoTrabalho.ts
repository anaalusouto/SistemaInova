/**
 * Regras derivadas do Plano de Trabalho (REQUISITOS-INOVA-PROJETOS, seção 12).
 *
 * Tudo aqui é **calculado**, nunca armazenado: atraso, faixa de risco, período
 * da meta e andamento do projeto mudam sozinhos quando o dado de origem muda.
 * Guardar qualquer um deles numa coluna cria a classe de bug que o documento
 * evita explicitamente — um registro que continua "Atrasado" depois de
 * concluído, ou uma meta com datas divergentes das próprias etapas.
 *
 * As datas circulam como 'AAAA-MM-DD' e são comparadas como string, nunca via
 * `new Date()`: a comparação lexicográfica de ISO já é cronológica e não passa
 * por fuso horário (mesmo motivo documentado em ./dateOnly.ts).
 */
import type { Activity, Deliverable, Goal, Risk, RiskLevel, RiskStatus } from '../data/mockData';

// ---------------------------------------------------------------------------
// Data de referência
// ---------------------------------------------------------------------------

/**
 * "Hoje" na zona de referência do projeto, como 'AAAA-MM-DD'.
 *
 * A seção 17 do documento deixa o fuso do projeto como decisão pendente; até
 * que seja definido, usa-se a data local de quem está olhando a tela. Ponto
 * único de mudança quando a decisão sair — por isso nenhuma outra função aqui
 * chama `new Date()` diretamente.
 */
export function hojeISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// ---------------------------------------------------------------------------
// Atraso (RN-010)
// ---------------------------------------------------------------------------

/**
 * Atividade não concluída cujo fim previsto já passou.
 *
 * Atividade concluída nunca está atrasada, mesmo que tenha terminado depois do
 * previsto — isso é divergência entre previsto e realizado, tratada por
 * `temDivergenciaDeDatas`, e não estado corrente.
 */
export function estaAtrasada(a: Pick<Activity, 'status' | 'plannedEnd'>, hoje = hojeISO()): boolean {
  if (a.status === 'Concluído') return false;
  if (!a.plannedEnd) return false;
  return a.plannedEnd < hoje;
}

/**
 * Houve divergência entre o par previsto e o par realizado — o que torna a
 * justificativa obrigatória ao salvar (RN-010).
 */
export function temDivergenciaDeDatas(a: Activity): boolean {
  const divergeInicio = !!a.actualStart && !!a.plannedStart && a.actualStart !== a.plannedStart;
  const divergeFim = !!a.actualEnd && !!a.plannedEnd && a.actualEnd !== a.plannedEnd;
  return divergeInicio || divergeFim;
}

/**
 * Rótulo textual do estado exibido. O documento exige sinal textual/ícone além
 * da cor (RN-010, CA-14) — cor sozinha não é acessível e não sobrevive a
 * impressão em preto e branco.
 */
export function rotuloEstado(a: Activity, hoje = hojeISO()): string {
  return estaAtrasada(a, hoje) ? 'Atrasada' : a.status;
}

// ---------------------------------------------------------------------------
// Andamento (RN-018)
// ---------------------------------------------------------------------------

/** O documento distingue "0%" de "sem base para calcular" — nunca mostre 0% no segundo caso. */
export const NAO_CALCULADO = 'Não calculado' as const;

/**
 * Andamento do projeto: média aritmética simples do progresso das atividades
 * ativas, arredondada para inteiro.
 *
 * Tarefas não entram no denominador e valores de orçamento não influenciam o
 * resultado (RN-018, CA-13). Atividade excluída já não chega aqui — a leitura
 * filtra `excluido_em`.
 */
export function andamentoDoProjeto(atividades: Pick<Activity, 'progress'>[]): number | typeof NAO_CALCULADO {
  if (atividades.length === 0) return NAO_CALCULADO;
  const soma = atividades.reduce((acc, a) => acc + (Number(a.progress) || 0), 0);
  return Math.round(soma / atividades.length);
}

/** Progresso coerente com o status (RN-009). Usado na escrita e ao arrastar cartão no Kanban. */
export function progressoParaStatus(status: Activity['status'], progressoAtual = 0): number {
  if (status === 'A iniciar') return 0;
  if (status === 'Concluído') return 100;
  // Em andamento: preserva um valor intermediário já informado; senão, meio-termo.
  return progressoAtual > 0 && progressoAtual < 100 ? progressoAtual : 50;
}

/**
 * O inverso: status implicado por um percentual (RN-009). Usado quando a
 * pessoa edita o percentual diretamente — status e progresso não podem
 * divergir, então mexer num ajusta o outro.
 */
export function statusParaProgresso(progresso: number): Activity['status'] {
  if (progresso <= 0) return 'A iniciar';
  if (progresso >= 100) return 'Concluído';
  return 'Em andamento';
}

// ---------------------------------------------------------------------------
// Risco (RN-019)
// ---------------------------------------------------------------------------

/** Pontuação = probabilidade × impacto, de 1 a 25. */
export function pontuacaoRisco(probabilidade: number, impacto: number): number {
  return (Number(probabilidade) || 0) * (Number(impacto) || 0);
}

/** Faixas da matriz: Baixo 1–3, Médio 4–8, Alto 9–14, Crítico 15–25 (RN-019). */
export function faixaRisco(pontuacao: number): RiskLevel {
  if (pontuacao <= 0) return '—';
  if (pontuacao <= 3) return 'Baixo';
  if (pontuacao <= 8) return 'Médio';
  if (pontuacao <= 14) return 'Alto';
  return 'Crítico';
}

/**
 * Limiar do filtro "Risco relevante".
 *
 * RN-019 registra 15 como valor do protótipo e pede confirmação do critério
 * operacional antes da implantação — fica nomeado aqui para que a troca seja
 * de um número só, e não uma caçada por comparações soltas pelo código.
 */
export const PONTUACAO_RISCO_RELEVANTE = 15;

/** Risco em aberto = ainda pesa. Encerrado sai das contas da linha. */
export function riscoEmAberto(r: Pick<Risk, 'status'>): boolean {
  return r.status !== 'Encerrado';
}

export interface RiscoDaLinha {
  /** Maior pontuação entre os riscos abertos da etapa. */
  pontuacao: number;
  faixa: RiskLevel;
  /** Quantos riscos abertos a etapa tem. */
  quantidade: number;
}

/**
 * Nível de risco exibido na linha de uma atividade (RN-011).
 *
 * O risco pertence à ETAPA, não à atividade — então a linha reflete a maior
 * pontuação entre os riscos abertos da etapa que a contém. A tela precisa
 * deixar claro que é risco da etapa, e não algo exclusivo daquela atividade,
 * senão quem lê conclui que a atividade específica é que está em risco.
 */
export function riscoDaEtapa(riscos: Risk[], etapaId: string): RiscoDaLinha | null {
  const abertos = riscos.filter(r => r.stageId === etapaId && riscoEmAberto(r));
  if (abertos.length === 0) return null;
  const pontuacao = abertos.reduce((mx, r) => Math.max(mx, Number(r.severity) || 0), 0);
  return { pontuacao, faixa: faixaRisco(pontuacao), quantidade: abertos.length };
}

// ---------------------------------------------------------------------------
// Registro consolidado e matriz 5×5 (RF-035, RN-028)
// ---------------------------------------------------------------------------

export interface CelulaMatriz {
  probabilidade: number;
  impacto: number;
  pontuacao: number;
  faixa: RiskLevel;
  quantidade: number;
}

export interface MatrizRiscos {
  /** 5×5, indexado por [impacto-1][probabilidade-1] — impacto na vertical. */
  celulas: CelulaMatriz[][];
  /** Soma das células, respeitando os filtros aplicados à entrada. */
  totalNaMatriz: number;
}

/**
 * Matriz 5×5 de probabilidade × impacto com a contagem de cada célula.
 *
 * Conta SOMENTE riscos cadastrados (RN-028) — atividade nunca vira risco, nem
 * mesmo a ação de resposta, que é atividade comum com referência à origem
 * (RN-020). Probabilidade ou impacto fora de 1–5 fica de fora em vez de ser
 * ajustado para caber: um valor inválido é um dado a corrigir, não a
 * arredondar silenciosamente.
 */
export function matrizDeRiscos(riscos: Risk[]): MatrizRiscos {
  const celulas: CelulaMatriz[][] = [];
  for (let impacto = 5; impacto >= 1; impacto--) {
    const linha: CelulaMatriz[] = [];
    for (let probabilidade = 1; probabilidade <= 5; probabilidade++) {
      const pontuacao = pontuacaoRisco(probabilidade, impacto);
      linha.push({
        probabilidade, impacto, pontuacao,
        faixa: faixaRisco(pontuacao),
        quantidade: riscos.filter(r => r.probability === probabilidade && r.impact === impacto).length,
      });
    }
    celulas.push(linha);
  }
  const totalNaMatriz = celulas.flat().reduce((s, c) => s + c.quantidade, 0);
  return { celulas, totalNaMatriz };
}

export interface ResumoRiscos {
  /** Todos os riscos do projeto — não muda com filtro (RN-028). */
  total: number;
  totalCritico: number;
  porStatus: Record<RiskStatus, number>;
  /** Riscos legados que a migration 0011 não conseguiu vincular a uma etapa. */
  semEtapa: number;
}

/**
 * Contagem geral do projeto. Deliberadamente calculada sobre TODOS os
 * registros: o RN-028 separa "quantos riscos o projeto tem" de "quantos estão
 * aparecendo agora". Misturar as duas coisas faria um filtro parecer que o
 * projeto ficou menos arriscado.
 */
export function resumoDeRiscos(riscos: Risk[]): ResumoRiscos {
  const porStatus = { 'Aberto': 0, 'Em mitigação': 0, 'Monitorando': 0, 'Encerrado': 0 } as Record<RiskStatus, number>;
  for (const r of riscos) {
    if (r.status in porStatus) porStatus[r.status] += 1;
  }
  return {
    total: riscos.length,
    totalCritico: riscos.filter(r => faixaRisco(r.severity) === 'Crítico').length,
    porStatus,
    semEtapa: riscos.filter(r => !r.stageId).length,
  };
}

export interface CriteriosRisco {
  /** Texto livre: risco, etapa, responsável e categoria. */
  busca: string;
  status: RiskStatus[];
  /** Célula selecionada na matriz, como [probabilidade, impacto]. */
  celula: [number, number] | null;
}

export const CRITERIOS_RISCO_VAZIOS: CriteriosRisco = { busca: '', status: [], celula: null };

export function temFiltroDeRiscoAtivo(c: CriteriosRisco): boolean {
  return c.busca.trim() !== '' || c.status.length > 0 || c.celula !== null;
}

/**
 * Aplica busca, status e seleção de célula, combinados (RF-035, CA-23).
 * A lista sai ordenada por pontuação decrescente.
 */
export function filtrarRiscos(
  riscos: Risk[],
  criterios: CriteriosRisco,
  nomeDaEtapa: (stageId: string | undefined) => string,
): Risk[] {
  const termo = normalizar(criterios.busca);
  const status = new Set(criterios.status);

  return riscos
    .filter(r => {
      if (status.size > 0 && !status.has(r.status)) return false;
      if (criterios.celula) {
        const [prob, imp] = criterios.celula;
        if (r.probability !== prob || r.impact !== imp) return false;
      }
      if (termo !== '') {
        const alvo = [
          r.title ?? '', r.description ?? '', r.category ?? '',
          r.responsible ?? '', nomeDaEtapa(r.stageId),
        ].map(normalizar).join(' ');
        if (!alvo.includes(termo)) return false;
      }
      return true;
    })
    .sort((a, b) => (Number(b.severity) || 0) - (Number(a.severity) || 0));
}

// ---------------------------------------------------------------------------
// Períodos derivados (RN-012, RN-017)
// ---------------------------------------------------------------------------

function menor(datas: (string | null)[]): string | null {
  const validas = datas.filter((d): d is string => !!d);
  return validas.length ? validas.reduce((a, b) => (a < b ? a : b)) : null;
}
function maior(datas: (string | null)[]): string | null {
  const validas = datas.filter((d): d is string => !!d);
  return validas.length ? validas.reduce((a, b) => (a > b ? a : b)) : null;
}

export interface Periodo {
  inicio: string | null;
  fim: string | null;
}

/**
 * Período da meta: menor início e maior fim das etapas, calculado
 * separadamente para previsto e realizado (RN-012, RN-017).
 *
 * Quando um dos tipos não existe em nenhuma etapa, o resultado é nulo dos dois
 * lados — o Gantt não deve inventar uma barra para período inexistente.
 */
export function periodoDaMeta(etapas: Deliverable[]): { previsto: Periodo; realizado: Periodo } {
  return {
    previsto: {
      inicio: menor(etapas.map(e => e.plannedStart)),
      fim: maior(etapas.map(e => e.plannedEnd)),
    },
    realizado: {
      inicio: menor(etapas.map(e => e.actualStart)),
      fim: maior(etapas.map(e => e.actualEnd)),
    },
  };
}

// ---------------------------------------------------------------------------
// Ausência de dado (RF-002)
// ---------------------------------------------------------------------------

/**
 * O documento é explícito: dado ausente aparece como "Não informado", e nunca
 * como zero, traço mudo ou data inventada. Zero e ausência significam coisas
 * diferentes — principalmente em valor executado (RF-029).
 */
export const NAO_INFORMADO = 'Não informado' as const;

export function ouNaoInformado(v: string | null | undefined): string {
  return v && v.trim() ? v.trim() : NAO_INFORMADO;
}

// ---------------------------------------------------------------------------
// Próximo passo do projeto (RF-004, RF-005)
// ---------------------------------------------------------------------------

export interface ProximoPasso {
  acao: string;
  responsavel: string | null;
  prazo: string | null;
  /** Atividade de onde a ação veio, para o cabeçalho poder linkar. */
  atividadeId: string;
  atividadeNome: string;
}

/**
 * A ação a executar mais próxima entre as atividades ainda não concluídas.
 *
 * O cabeçalho do projeto mostra "próximo passo" (RF-004), mas o projeto não tem
 * campo próprio para isso: a ação real mora na atividade, onde a equipe PMO a
 * registra junto com responsável e prazo (RF-024). Derivar daqui evita um
 * segundo lugar para a mesma informação — que sairia de sincronia.
 *
 * Ordena por prazo; ação sem prazo vem depois das datadas, em vez de receber
 * uma data fictícia só para poder ser ordenada (RF-005).
 */
export function proximoPassoDoProjeto(
  atividades: Pick<Activity, 'id' | 'name' | 'status' | 'nextStep' | 'nextStepOwner' | 'nextStepDue'>[],
): ProximoPasso | null {
  const candidatas = atividades
    .filter(a => a.status !== 'Concluído' && a.nextStep.trim())
    .sort((a, b) => {
      if (a.nextStepDue && b.nextStepDue) return a.nextStepDue < b.nextStepDue ? -1 : 1;
      if (a.nextStepDue) return -1;
      if (b.nextStepDue) return 1;
      return 0;
    });

  const escolhida = candidatas[0];
  if (!escolhida) return null;
  return {
    acao: escolhida.nextStep.trim(),
    responsavel: escolhida.nextStepOwner.trim() || null,
    prazo: escolhida.nextStepDue,
    atividadeId: escolhida.id,
    atividadeNome: escolhida.name,
  };
}

// ---------------------------------------------------------------------------
// Divergência de cronograma (RN-008)
// ---------------------------------------------------------------------------

/**
 * Converte as datas soltas do cadastro do projeto ('MM/AAAA', 'DD/MM/AAAA' ou
 * 'AAAA-MM-DD') no último dia coberto, em ISO. Devolve null quando não
 * reconhece o formato — preferível a chutar uma data.
 */
export function fimDoPeriodoTexto(valor: string | null | undefined): string | null {
  if (!valor) return null;
  const v = valor.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dma = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
  if (dma) return `${dma[3]}-${dma[2]}-${dma[1]}`;

  const ma = /^(\d{2})\/(\d{4})$/.exec(v);
  if (ma) {
    const ano = Number(ma[2]);
    const mes = Number(ma[1]);
    if (mes < 1 || mes > 12) return null;
    // Dia 0 do mês seguinte = último dia deste mês, sem tabela de bissextos.
    const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    return `${ma[2]}-${ma[1]}-${String(ultimo).padStart(2, '0')}`;
  }

  return null;
}

export interface DivergenciaCronograma {
  /** Fim declarado na proposta do projeto. */
  fimDoProjeto: string;
  /** Data mais distante encontrada nas etapas/atividades previstas. */
  fimDoPlano: string;
  /** Quantas atividades passam do fim declarado. */
  atividadesAlemDoPrazo: number;
}

/**
 * Detecta a inconsistência que o RN-008 manda sinalizar: o texto da proposta
 * declara um término, mas há atividade prevista para depois dele.
 *
 * Deliberadamente só RELATA. O documento é explícito em não corrigir nenhuma
 * das fontes automaticamente — qual das duas está errada é decisão de quem
 * conduz o projeto, não do sistema.
 */
export function divergenciaDeCronograma(
  fimDeclarado: string | null | undefined,
  atividades: Pick<Activity, 'plannedEnd'>[],
): DivergenciaCronograma | null {
  const fimDoProjeto = fimDoPeriodoTexto(fimDeclarado);
  if (!fimDoProjeto) return null;

  const alem = atividades.filter(a => a.plannedEnd && a.plannedEnd > fimDoProjeto);
  if (alem.length === 0) return null;

  const fimDoPlano = alem.reduce((mx, a) => (a.plannedEnd! > mx ? a.plannedEnd! : mx), alem[0].plannedEnd!);
  return { fimDoProjeto, fimDoPlano, atividadesAlemDoPrazo: alem.length };
}

// ---------------------------------------------------------------------------
// Linha do tempo do Gantt (RF-017, RF-018, RN-012)
// ---------------------------------------------------------------------------

/**
 * Dias desde 1970 para uma data 'AAAA-MM-DD'.
 *
 * Usa Date.UTC a partir dos componentes já separados: passar a string direto
 * para `new Date()` a interpreta como meia-noite UTC e, em fusos atrás de UTC,
 * desloca o dia — o mesmo problema documentado em ./dateOnly.ts.
 */
export function diasDesdeEpoca(iso: string): number {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return Math.floor(Date.UTC(a, m - 1, d) / 86_400_000);
}

function isoDeDias(dias: number): string {
  const d = new Date(dias * 86_400_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export interface LimitesLinhaTempo {
  inicio: string;
  fim: string;
}

/**
 * Extremos da linha do tempo, tirados das datas das ETAPAS (RF-018).
 *
 * Considera previsto e realizado juntos: uma execução que passou do previsto
 * precisa caber na tela, senão a barra que mais importa fica fora do desenho.
 * Devolve null quando não há nenhuma data — aí não há linha do tempo a montar,
 * e inventar um intervalo arbitrário mostraria barras que não existem.
 */
export function limitesDaLinhaDoTempo(metas: Goal[]): LimitesLinhaTempo | null {
  const datas: string[] = [];
  for (const meta of metas) {
    for (const etapa of meta.deliverables) {
      for (const d of [etapa.plannedStart, etapa.plannedEnd, etapa.actualStart, etapa.actualEnd]) {
        if (d) datas.push(d);
      }
    }
  }
  if (datas.length === 0) return null;

  const inicio = datas.reduce((a, b) => (a < b ? a : b));
  const fim = datas.reduce((a, b) => (a > b ? a : b));

  // Arredonda para o primeiro dia do mês inicial e o último do mês final, para
  // que a grade comece e termine em colunas inteiras.
  const [ai, mi] = inicio.split('-').map(Number);
  const [af, mf] = fim.split('-').map(Number);
  const ultimoDia = new Date(Date.UTC(af, mf, 0)).getUTCDate();
  return {
    inicio: `${ai}-${String(mi).padStart(2, '0')}-01`,
    fim: `${af}-${String(mf).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

export type EscalaGantt = 'mes' | 'trimestre';

export interface ColunaGantt {
  chave: string;
  rotulo: string;
  inicio: string;
  fim: string;
}

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Colunas do cabeçalho na escala escolhida (RF-018).
 *
 * Cabeçalho e linhas usam a MESMA grade e a mesma origem, então as barras
 * ficam alinhadas às colunas em qualquer escala — o documento é explícito
 * nisso, e desenhar as duas coisas com contas separadas é a forma clássica de
 * elas saírem de registro.
 */
export function colunasDaLinhaDoTempo(limites: LimitesLinhaTempo, escala: EscalaGantt): ColunaGantt[] {
  const colunas: ColunaGantt[] = [];
  const [anoFim, mesFim] = limites.fim.split('-').map(Number);
  let [ano, mes] = limites.inicio.split('-').map(Number);

  if (escala === 'trimestre') {
    mes = Math.floor((mes - 1) / 3) * 3 + 1;
  }

  const passo = escala === 'mes' ? 1 : 3;

  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    const mesFinalDoBloco = mes + passo - 1;
    const ultimoDia = new Date(Date.UTC(ano, mesFinalDoBloco, 0)).getUTCDate();
    colunas.push({
      chave: `${ano}-${mes}`,
      rotulo: escala === 'mes'
        ? `${MESES_CURTOS[mes - 1]}/${String(ano).slice(2)}`
        : `T${Math.floor((mes - 1) / 3) + 1}/${String(ano).slice(2)}`,
      inicio: `${ano}-${String(mes).padStart(2, '0')}-01`,
      fim: `${ano}-${String(mesFinalDoBloco).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
    });
    mes += passo;
    if (mes > 12) { mes -= 12; ano += 1; }
  }

  return colunas;
}

export interface PosicaoBarra {
  /** Percentual da largura total onde a barra começa. */
  esquerda: number;
  /** Percentual da largura total que a barra ocupa. */
  largura: number;
}

/**
 * Onde uma barra começa e quanto ocupa, em percentual da linha do tempo.
 *
 * Devolve null quando falta qualquer uma das pontas: RN-012 é explícito em não
 * inventar barra para período que não existe. Uma etapa com início previsto e
 * sem fim não vira uma barra "até hoje" — vira ausência de barra, que é a
 * informação verdadeira.
 */
export function posicaoNaLinha(
  inicio: string | null,
  fim: string | null,
  limites: LimitesLinhaTempo,
): PosicaoBarra | null {
  if (!inicio || !fim) return null;

  const base = diasDesdeEpoca(limites.inicio);
  // +1 porque o dia final é inclusivo: 01/08 a 31/08 são 31 dias, não 30.
  const total = diasDesdeEpoca(limites.fim) - base + 1;
  if (total <= 0) return null;

  const inicioDias = Math.max(diasDesdeEpoca(inicio), base);
  const fimDias = Math.min(diasDesdeEpoca(fim), diasDesdeEpoca(limites.fim));
  if (fimDias < inicioDias) return null;

  return {
    esquerda: ((inicioDias - base) / total) * 100,
    largura: ((fimDias - inicioDias + 1) / total) * 100,
  };
}

/** Marcador de "hoje" na linha do tempo, ou null se hoje está fora dela. */
export function posicaoDeHoje(limites: LimitesLinhaTempo, hoje = hojeISO()): number | null {
  if (hoje < limites.inicio || hoje > limites.fim) return null;
  const base = diasDesdeEpoca(limites.inicio);
  const total = diasDesdeEpoca(limites.fim) - base + 1;
  return ((diasDesdeEpoca(hoje) - base) / total) * 100;
}

// ---------------------------------------------------------------------------
// Numeração hierárquica (RN-004)
// ---------------------------------------------------------------------------

/**
 * Código de exibição (1. / 1.1 / 1.1.1 / 1.1.1.1) calculado sobre a ordem
 * COMPLETA do projeto.
 *
 * Recebe sempre a lista inteira, nunca a filtrada: busca, filtro, recolhimento
 * e troca de visão não podem renumerar registro (RN-004, CA-03). Quem filtra,
 * filtra o resultado deste mapa — não a entrada.
 */
export function codigosHierarquicos(metas: Goal[]): Map<string, string> {
  const codigos = new Map<string, string>();
  metas.forEach((meta, iMeta) => {
    const cMeta = String(iMeta + 1);
    codigos.set(meta.id, cMeta);
    meta.deliverables.forEach((etapa, iEtapa) => {
      const cEtapa = `${cMeta}.${iEtapa + 1}`;
      codigos.set(etapa.id, cEtapa);
      etapa.activities.forEach((atividade, iAtiv) => {
        const cAtiv = `${cEtapa}.${iAtiv + 1}`;
        codigos.set(atividade.id, cAtiv);
        atividade.tasks.forEach((tarefa, iTarefa) => {
          codigos.set(tarefa.id, `${cAtiv}.${iTarefa + 1}`);
        });
      });
    });
  });
  return codigos;
}

// ---------------------------------------------------------------------------
// Busca e filtros (RF-012, CA-03)
// ---------------------------------------------------------------------------

export type FiltroRisco = 'qualquer' | 'com' | 'sem' | RiskLevel;

export interface CriteriosFiltro {
  /** Texto livre: atividade, tarefa, etapa, responsável e risco. */
  busca: string;
  metaIds: string[];
  etapaIds: string[];
  responsaveis: string[];
  /** Inclui 'Atrasada', que é derivado e não um status armazenado (RN-010). */
  status: (Activity['status'] | 'Atrasada')[];
  risco: FiltroRisco;
  vinculoOrcamentario: Activity['budgetLink'][];
}

export const CRITERIOS_VAZIOS: CriteriosFiltro = {
  busca: '', metaIds: [], etapaIds: [], responsaveis: [], status: [],
  risco: 'qualquer', vinculoOrcamentario: [],
};

export function temFiltroAtivo(c: CriteriosFiltro): boolean {
  return (
    c.busca.trim() !== '' || c.metaIds.length > 0 || c.etapaIds.length > 0 ||
    c.responsaveis.length > 0 || c.status.length > 0 || c.risco !== 'qualquer' ||
    c.vinculoOrcamentario.length > 0
  );
}

/** Normaliza para busca tolerante a acento e caixa. */
function normalizar(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function atividadeCasaBusca(a: Activity, termo: string): boolean {
  if (normalizar(a.name).includes(termo)) return true;
  if (a.responsible && normalizar(a.responsible).includes(termo)) return true;
  return a.tasks.some(t => normalizar(t.title).includes(termo));
}

/**
 * Aplica busca e filtros combinados por INTERSEÇÃO (RF-012): a atividade
 * precisa satisfazer todos os critérios ativos, não qualquer um deles.
 *
 * Devolve uma árvore nova com os mesmos objetos das folhas — nunca cópias
 * modificadas. Quem desenha continua recebendo as MESMAS atividades, e a
 * numeração segue vindo de `codigosHierarquicos` sobre a lista completa
 * (RN-004, CA-03): filtrar muda o que aparece, jamais o código de cada item.
 *
 * Etapa cujo nome casa com a busca é mantida inteira, com suas atividades —
 * quem procura pelo nome da etapa quer ver o que há dentro dela.
 */
export function filtrarPlano(metas: Goal[], riscos: Risk[], criterios: CriteriosFiltro): Goal[] {
  if (!temFiltroAtivo(criterios)) return metas;

  const termo = normalizar(criterios.busca);
  const metasPermitidas = new Set(criterios.metaIds);
  const etapasPermitidas = new Set(criterios.etapaIds);
  const responsaveis = new Set(criterios.responsaveis);
  const statusAceitos = new Set(criterios.status);
  const vinculos = new Set(criterios.vinculoOrcamentario);
  const hoje = hojeISO();

  // Risco casa por etapa, porque é da etapa que ele é (RN-011).
  const riscoPorEtapa = new Map<string, RiscoDaLinha | null>();
  const buscaCasaRiscoDaEtapa = new Map<string, boolean>();
  for (const meta of metas) {
    for (const etapa of meta.deliverables) {
      riscoPorEtapa.set(etapa.id, riscoDaEtapa(riscos, etapa.id));
      buscaCasaRiscoDaEtapa.set(
        etapa.id,
        termo !== '' && riscos.some(r =>
          r.stageId === etapa.id &&
          (normalizar(r.title ?? '').includes(termo) || normalizar(r.description ?? '').includes(termo))),
      );
    }
  }

  const resultado: Goal[] = [];

  for (const meta of metas) {
    if (metasPermitidas.size > 0 && !metasPermitidas.has(meta.id)) continue;

    const etapasMantidas: Deliverable[] = [];

    for (const etapa of meta.deliverables) {
      if (etapasPermitidas.size > 0 && !etapasPermitidas.has(etapa.id)) continue;

      const risco = riscoPorEtapa.get(etapa.id) ?? null;

      // Filtro de risco vale para a etapa inteira: o risco não é da atividade.
      if (criterios.risco === 'com' && !risco) continue;
      if (criterios.risco === 'sem' && risco) continue;
      if (criterios.risco !== 'qualquer' && criterios.risco !== 'com' && criterios.risco !== 'sem') {
        if (!risco || risco.faixa !== criterios.risco) continue;
      }

      const etapaCasaBusca =
        termo === '' ||
        normalizar(etapa.name).includes(termo) ||
        (buscaCasaRiscoDaEtapa.get(etapa.id) ?? false);

      const atividades = etapa.activities.filter(a => {
        if (responsaveis.size > 0 && !responsaveis.has(a.responsible || '')) return false;
        if (vinculos.size > 0 && !vinculos.has(a.budgetLink)) return false;
        if (statusAceitos.size > 0) {
          const atrasada = estaAtrasada(a, hoje);
          const casaStatus = statusAceitos.has(a.status);
          const casaAtraso = statusAceitos.has('Atrasada') && atrasada;
          if (!casaStatus && !casaAtraso) return false;
        }
        // A etapa já casou a busca: suas atividades entram sem precisar casar
        // de novo, senão procurar pelo nome da etapa devolveria etapa vazia.
        if (termo !== '' && !etapaCasaBusca && !atividadeCasaBusca(a, termo)) return false;
        return true;
      });

      // Etapa sem atividade sobrevivente só continua visível quando ela
      // própria casou a busca — caso contrário, some.
      if (atividades.length === 0 && !(etapaCasaBusca && termo !== '')) continue;

      etapasMantidas.push({ ...etapa, activities: atividades });
    }

    if (etapasMantidas.length > 0) {
      resultado.push({ ...meta, deliverables: etapasMantidas });
    }
  }

  return resultado;
}

/** Responsáveis presentes no plano, para alimentar o filtro sem inventar nomes. */
export function responsaveisDoPlano(metas: Goal[]): string[] {
  const nomes = new Set<string>();
  for (const meta of metas) {
    for (const etapa of meta.deliverables) {
      for (const a of etapa.activities) {
        if (a.responsible?.trim()) nomes.add(a.responsible.trim());
      }
    }
  }
  return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

// ---------------------------------------------------------------------------
// Limites de data da atividade (RN-014, RN-015)
// ---------------------------------------------------------------------------

export interface ValidacaoDatas {
  ok: boolean;
  /** Mensagens voltadas à pessoa que está editando — já prontas para exibição. */
  erros: string[];
}

/**
 * Valida as datas de uma atividade contra o período da etapa que a contém.
 *
 * Regras (RN-015): início previsto não pode ser anterior ao da etapa, fim
 * previsto não pode ultrapassar o da etapa, e início <= fim em cada par. Para
 * o par realizado, o teto é o fim realizado da etapa quando preenchido e, na
 * falta dele, o fim previsto.
 *
 * Etapa sem período previsto não aceita atividade (CA-07): o documento prefere
 * pedir o preenchimento do período a aceitar uma atividade sem limite algum.
 */
export function validarDatasDaAtividade(
  atividade: Pick<Activity, 'plannedStart' | 'plannedEnd' | 'actualStart' | 'actualEnd'>,
  etapa: Pick<Deliverable, 'plannedStart' | 'plannedEnd' | 'actualStart' | 'actualEnd'>,
): ValidacaoDatas {
  const erros: string[] = [];

  if (!etapa.plannedStart || !etapa.plannedEnd) {
    return {
      ok: false,
      erros: ['A etapa ainda não tem início e fim previstos. Preencha o período da etapa antes de criar atividades.'],
    };
  }

  const { plannedStart, plannedEnd, actualStart, actualEnd } = atividade;

  if (plannedStart && plannedEnd && plannedStart > plannedEnd) {
    erros.push('O início previsto não pode ser posterior ao fim previsto.');
  }
  if (actualStart && actualEnd && actualStart > actualEnd) {
    erros.push('O início realizado não pode ser posterior ao fim realizado.');
  }
  if (plannedStart && plannedStart < etapa.plannedStart) {
    erros.push('O início previsto não pode ser anterior ao início previsto da etapa.');
  }
  if (plannedEnd && plannedEnd > etapa.plannedEnd) {
    erros.push('O fim previsto não pode ultrapassar o fim previsto da etapa.');
  }

  // RN-016: o teto do realizado acompanha o realizado da etapa quando ele
  // existe. É isso que permite registrar um atraso de verdade — primeiro a
  // etapa estende o período realizado com justificativa, depois a atividade
  // recebe a data. Sem isso, a validação obrigaria a descartar a ocorrência.
  const tetoRealizado = etapa.actualEnd ?? etapa.plannedEnd;
  if (actualEnd && actualEnd > tetoRealizado) {
    erros.push(
      etapa.actualEnd
        ? 'O fim realizado não pode ultrapassar o fim realizado da etapa.'
        : 'O fim realizado ultrapassa o fim previsto da etapa. Atualize primeiro o período realizado da etapa, com justificativa.',
    );
  }

  return { ok: erros.length === 0, erros };
}

/**
 * Valida a redução do período de uma etapa contra as atividades que ela já
 * contém (RN-014, CA-08): encurtar a etapa não pode deixar atividade fora dos
 * limites. A data anterior permanece salva quando a validação recusa.
 */
export function validarPeriodoDaEtapa(
  novo: Periodo,
  atividades: Pick<Activity, 'name' | 'plannedStart' | 'plannedEnd'>[],
): ValidacaoDatas {
  const erros: string[] = [];

  if (novo.inicio && novo.fim && novo.inicio > novo.fim) {
    erros.push('O início da etapa não pode ser posterior ao fim.');
    return { ok: false, erros };
  }

  for (const a of atividades) {
    if (novo.inicio && a.plannedStart && a.plannedStart < novo.inicio) {
      erros.push(`A atividade "${a.name}" começa antes do novo início da etapa.`);
    }
    if (novo.fim && a.plannedEnd && a.plannedEnd > novo.fim) {
      erros.push(`A atividade "${a.name}" termina depois do novo fim da etapa.`);
    }
  }

  return { ok: erros.length === 0, erros };
}
