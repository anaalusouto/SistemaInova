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
import type { Activity, Deliverable, Goal, Risk, RiskLevel } from '../data/mockData';

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
