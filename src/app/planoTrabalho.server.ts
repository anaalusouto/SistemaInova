/**
 * Escritas do Plano de Trabalho (RF-022 a RF-025).
 *
 * As validações de data (RN-014, RN-015, RN-016) vivem AQUI, e não só no
 * formulário. A regra do CA-02 vale para qualquer escrita: o que o navegador
 * checa é conveniência para quem digita; o que impede dado inconsistente de
 * entrar no banco é a checagem do servidor. Formulário e servidor chamam as
 * mesmas funções de src/app/lib/planoTrabalho.ts, então a mensagem que a
 * pessoa lê é exatamente a que o servidor aplicou.
 *
 * Fica em src/app/ com sufixo .server.ts pelo mesmo motivo dos outros módulos
 * — ver o cabeçalho de projetos.server.ts.
 */
import { createServerFn } from '@tanstack/react-start';
import {
  validarDatasDaAtividade, validarPeriodoDaEtapa, progressoParaStatus,
  type Periodo,
} from './lib/planoTrabalho';
import type { ActivityStatus, BudgetLink } from './data/mockData';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

// Import sob demanda: store.tsx roda no client e importa este módulo; um
// import estático de sessao.server.ts arrastaria os helpers de cookie do
// TanStack para o bundle do navegador.
async function exigirEscrita() {
  const m = await import('./sessao.server');
  return m.exigirEscrita();
}

/** Erro de validação de regra de negócio — a UI mostra a lista ao usuário. */
export class DadosInvalidos extends Error {
  erros: string[];
  constructor(erros: string[]) {
    super(erros.join(' '));
    this.name = 'DadosInvalidos';
    this.erros = erros;
  }
}

const vazioParaNulo = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

/**
 * Próxima posição numa lista de irmãos. Ordem é campo próprio e independente
 * do número exibido (RN-003), então acrescentar ao fim nunca renumera nada.
 */
async function proximaOrdem(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  tabela: 'atividades' | 'tarefas',
  colunaPai: 'etapa_id' | 'atividade_id',
  paiId: string,
): Promise<number> {
  const { data } = await supabaseAdmin.from(tabela).select('ordem').eq(colunaPai, paiId);
  const ordens = (data ?? []).map(r => Number(r.ordem) || 0);
  return ordens.length ? Math.max(...ordens) + 1 : 1;
}

/** Carrega a etapa com o que as validações precisam. */
async function carregarEtapa(supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>, etapaId: string) {
  const { data, error } = await supabaseAdmin
    .from('etapas')
    .select('id, nome, inicio_previsto, fim_previsto, inicio_realizado, fim_realizado')
    .eq('id', etapaId)
    .single();
  if (error || !data) throw new Error('Etapa não encontrada.');
  return {
    plannedStart: data.inicio_previsto ?? null,
    plannedEnd: data.fim_previsto ?? null,
    actualStart: data.inicio_realizado ?? null,
    actualEnd: data.fim_realizado ?? null,
  };
}

// ---------------------------------------------------------------------------
// Etapa — período (RF-022, RN-014, CA-08)
// ---------------------------------------------------------------------------

export interface PeriodoEtapaInput {
  etapaId: string;
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
  inicioRealizado: string | null;
  fimRealizado: string | null;
}

export const salvarPeriodoDaEtapa = createServerFn({ method: 'POST' })
  .validator((d: PeriodoEtapaInput) => d)
  .handler(async ({ data }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const { data: atividades, error: erroAtiv } = await supabaseAdmin
      .from('atividades')
      .select('nome, inicio_previsto, fim_previsto')
      .eq('etapa_id', data.etapaId)
      .is('excluido_em', null);
    if (erroAtiv) throw new Error(erroAtiv.message);

    // CA-08: encurtar a etapa abaixo do fim de uma atividade existente é
    // recusado, e a data anterior permanece salva.
    const previsto: Periodo = { inicio: data.inicioPrevisto, fim: data.fimPrevisto };
    const validacao = validarPeriodoDaEtapa(
      previsto,
      (atividades ?? []).map(a => ({
        name: a.nome, plannedStart: a.inicio_previsto ?? null, plannedEnd: a.fim_previsto ?? null,
      })),
    );
    if (!validacao.ok) throw new DadosInvalidos(validacao.erros);

    if (data.inicioRealizado && data.fimRealizado && data.inicioRealizado > data.fimRealizado) {
      throw new DadosInvalidos(['O início realizado não pode ser posterior ao fim realizado.']);
    }

    const { error } = await supabaseAdmin
      .from('etapas')
      .update({
        inicio_previsto: data.inicioPrevisto,
        fim_previsto: data.fimPrevisto,
        inicio_realizado: data.inicioRealizado,
        fim_realizado: data.fimRealizado,
      })
      .eq('id', data.etapaId);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Atividade (RF-023, RF-024, RN-015, RN-016)
// ---------------------------------------------------------------------------

export interface AtividadeInput {
  etapaId: string;
  nome: string;
  responsavel: string;
  status: ActivityStatus;
  progresso: number;
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
  inicioRealizado: string | null;
  fimRealizado: string | null;
  justificativaAtraso: string;
  vinculoOrcamentario: BudgetLink;
  observacoes: string;
  proximoPasso: string;
  proximoPassoResponsavel: string;
  proximoPassoPrazo: string | null;
  /** Preenchido quando a atividade é ação de resposta a um risco (RN-020). */
  riscoOrigemId?: string | null;
}

/** Validações comuns a criar e editar. */
async function validarAtividade(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  data: AtividadeInput,
): Promise<void> {
  const erros: string[] = [];
  if (!data.nome.trim()) erros.push('Informe o título da atividade.');
  if (!data.inicioPrevisto || !data.fimPrevisto) {
    erros.push('Informe o início e o fim previstos da atividade.');
  }
  if (erros.length) throw new DadosInvalidos(erros);

  const etapa = await carregarEtapa(supabaseAdmin, data.etapaId);
  const validacao = validarDatasDaAtividade(
    {
      plannedStart: data.inicioPrevisto, plannedEnd: data.fimPrevisto,
      actualStart: data.inicioRealizado, actualEnd: data.fimRealizado,
    },
    etapa,
  );
  if (!validacao.ok) throw new DadosInvalidos(validacao.erros);

  // RN-010: divergência entre previsto e realizado exige justificativa.
  const divergeInicio = !!data.inicioRealizado && !!data.inicioPrevisto && data.inicioRealizado !== data.inicioPrevisto;
  const divergeFim = !!data.fimRealizado && !!data.fimPrevisto && data.fimRealizado !== data.fimPrevisto;
  if ((divergeInicio || divergeFim) && !data.justificativaAtraso.trim()) {
    throw new DadosInvalidos([
      'As datas realizadas divergem das previstas. Informe a justificativa antes de salvar.',
    ]);
  }
}

function linhaAtividade(data: AtividadeInput) {
  return {
    etapa_id: data.etapaId,
    nome: data.nome.trim(),
    responsavel: vazioParaNulo(data.responsavel),
    status: data.status,
    // RN-009: o progresso é normalizado contra o status, nunca aceito cru.
    progresso: progressoParaStatus(data.status, data.progresso),
    inicio_previsto: data.inicioPrevisto,
    fim_previsto: data.fimPrevisto,
    inicio_realizado: data.inicioRealizado,
    fim_realizado: data.fimRealizado,
    justificativa_atraso: vazioParaNulo(data.justificativaAtraso),
    vinculo_orcamentario: data.vinculoOrcamentario,
    observacoes: vazioParaNulo(data.observacoes),
    proximo_passo: vazioParaNulo(data.proximoPasso),
    proximo_passo_responsavel: vazioParaNulo(data.proximoPassoResponsavel),
    proximo_passo_prazo: data.proximoPassoPrazo,
    risco_origem_id: data.riscoOrigemId ?? null,
  };
}

export const criarAtividade = createServerFn({ method: 'POST' })
  .validator((d: AtividadeInput) => d)
  .handler(async ({ data }): Promise<string> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    await validarAtividade(supabaseAdmin, data);

    const ordem = await proximaOrdem(supabaseAdmin, 'atividades', 'etapa_id', data.etapaId);
    const { data: criada, error } = await supabaseAdmin
      .from('atividades')
      .insert({ ...linhaAtividade(data), ordem })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return criada.id as string;
  });

export const atualizarAtividade = createServerFn({ method: 'POST' })
  .validator((d: { atividadeId: string; dados: AtividadeInput }) => d)
  .handler(async ({ data: { atividadeId, dados } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    await validarAtividade(supabaseAdmin, dados);

    const { error } = await supabaseAdmin
      .from('atividades')
      .update(linhaAtividade(dados))
      .eq('id', atividadeId);
    if (error) throw new Error(error.message);
  });

/**
 * Exclusão de atividade (RN-005).
 *
 * Marca `excluido_em` em vez de apagar a linha: o histórico e os anexos
 * continuam recuperáveis conforme a política de retenção, e nenhum vínculo é
 * rompido. A confirmação acontece na interface, antes de chegar aqui.
 */
export const excluirAtividade = createServerFn({ method: 'POST' })
  .validator((d: { atividadeId: string }) => d)
  .handler(async ({ data: { atividadeId } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('atividades')
      .update({ excluido_em: new Date().toISOString() })
      .eq('id', atividadeId);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Tarefas (RF-025)
// ---------------------------------------------------------------------------

export const criarTarefa = createServerFn({ method: 'POST' })
  .validator((d: { atividadeId: string; titulo: string }) => d)
  .handler(async ({ data: { atividadeId, titulo } }): Promise<void> => {
    await exigirEscrita();
    if (!titulo.trim()) throw new DadosInvalidos(['Informe o título da tarefa.']);
    const supabaseAdmin = await getAdmin();
    const ordem = await proximaOrdem(supabaseAdmin, 'tarefas', 'atividade_id', atividadeId);
    const { error } = await supabaseAdmin
      .from('tarefas')
      .insert({ atividade_id: atividadeId, titulo: titulo.trim(), ordem });
    if (error) throw new Error(error.message);
  });

export const renomearTarefa = createServerFn({ method: 'POST' })
  .validator((d: { tarefaId: string; titulo: string }) => d)
  .handler(async ({ data: { tarefaId, titulo } }): Promise<void> => {
    await exigirEscrita();
    if (!titulo.trim()) throw new DadosInvalidos(['Informe o título da tarefa.']);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('tarefas')
      .update({ titulo: titulo.trim() })
      .eq('id', tarefaId);
    if (error) throw new Error(error.message);
  });

export const excluirTarefa = createServerFn({ method: 'POST' })
  .validator((d: { tarefaId: string }) => d)
  .handler(async ({ data: { tarefaId } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('tarefas').delete().eq('id', tarefaId);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Risco da etapa (RF-022, RF-028)
// ---------------------------------------------------------------------------

export interface RiscoInput {
  projetoId: number;
  etapaId: string;
  titulo: string;
  descricao: string;
  categoria: string;
  responsavel: string;
  probabilidade: number;
  impacto: number;
  status: 'Aberto' | 'Em mitigação' | 'Monitorando' | 'Encerrado';
  estrategiaResposta: string;
  especificacao: string;
}

function validarRisco(data: RiscoInput): void {
  const erros: string[] = [];
  if (!data.titulo.trim()) erros.push('Informe o título do risco.');
  if (!data.categoria.trim()) erros.push('Informe a categoria.');
  if (!data.responsavel.trim()) erros.push('Informe o responsável.');
  if (!data.descricao.trim()) erros.push('Informe a descrição.');
  if (!(data.probabilidade >= 1 && data.probabilidade <= 5)) erros.push('A probabilidade deve ficar entre 1 e 5.');
  if (!(data.impacto >= 1 && data.impacto <= 5)) erros.push('O impacto deve ficar entre 1 e 5.');
  // RN-028: risco NOVO sempre nasce preso a uma etapa. Só as linhas legadas
  // ficaram sem vínculo, e elas não passam por aqui.
  if (!data.etapaId) erros.push('O risco precisa pertencer a uma etapa.');
  if (erros.length) throw new DadosInvalidos(erros);
}

export const criarRisco = createServerFn({ method: 'POST' })
  .validator((d: RiscoInput) => d)
  .handler(async ({ data }): Promise<void> => {
    await exigirEscrita();
    validarRisco(data);
    const supabaseAdmin = await getAdmin();

    // meta_id é derivada da etapa, nunca informada à parte: duas fontes para o
    // mesmo vínculo acabariam discordando.
    const { data: etapa, error: erroEtapa } = await supabaseAdmin
      .from('etapas').select('meta_id').eq('id', data.etapaId).single();
    if (erroEtapa || !etapa) throw new Error('Etapa não encontrada.');

    const { error } = await supabaseAdmin.from('plano_riscos').insert({
      projeto_id: data.projetoId,
      etapa_id: data.etapaId,
      meta_id: etapa.meta_id,
      titulo: data.titulo.trim(),
      descricao: data.descricao.trim(),
      categoria: vazioParaNulo(data.categoria),
      responsavel: vazioParaNulo(data.responsavel),
      probabilidade: data.probabilidade,
      impacto: data.impacto,
      status: data.status,
      estrategia_mitigacao: vazioParaNulo(data.estrategiaResposta),
      especificacao: vazioParaNulo(data.especificacao),
    });
    if (error) throw new Error(error.message);
  });

export const atualizarRisco = createServerFn({ method: 'POST' })
  .validator((d: { riscoId: string; dados: RiscoInput }) => d)
  .handler(async ({ data: { riscoId, dados } }): Promise<void> => {
    await exigirEscrita();
    validarRisco(dados);
    const supabaseAdmin = await getAdmin();

    const { data: etapa } = await supabaseAdmin
      .from('etapas').select('meta_id').eq('id', dados.etapaId).single();

    const { error } = await supabaseAdmin.from('plano_riscos').update({
      etapa_id: dados.etapaId,
      meta_id: etapa?.meta_id ?? null,
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
      categoria: vazioParaNulo(dados.categoria),
      responsavel: vazioParaNulo(dados.responsavel),
      probabilidade: dados.probabilidade,
      impacto: dados.impacto,
      status: dados.status,
      estrategia_mitigacao: vazioParaNulo(dados.estrategiaResposta),
      especificacao: vazioParaNulo(dados.especificacao),
    }).eq('id', riscoId);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Parecer técnico (RF-034, RF-036, RN-026, RN-029)
// ---------------------------------------------------------------------------

export interface AcaoParecerInput {
  /** Presente ao editar; ausente numa linha nova. Manter o id é o que faz
   *  editar uma linha não mexer nas outras (RN-029). */
  id?: string;
  descricao: string;
  responsavel: string;
  prazo: string | null;
  status: ActivityStatus;
}

export interface ParecerInput {
  projetoId: number;
  data: string;
  origem: string;
  autor: string;
  pontosObservados: string;
  itensCriticos: string;
  limitacoesOrcamentarias: string;
  recomendacao: string;
  logComunicacaoId: string | null;
  acoes: AcaoParecerInput[];
}

/** Linha totalmente em branco não vira ação (RF-036). */
function linhaVazia(a: AcaoParecerInput): boolean {
  return !a.descricao.trim() && !a.responsavel.trim() && !a.prazo;
}

function validarParecer(data: ParecerInput): AcaoParecerInput[] {
  const erros: string[] = [];
  if (!data.data) erros.push('Informe a data da visita ou reunião.');
  if (!data.origem) erros.push('Informe a origem do registro.');
  if (!data.autor.trim()) erros.push('Informe o responsável pelo registro.');
  if (!data.pontosObservados.trim()) erros.push('Informe os pontos observados.');

  // Linhas em branco somem; linha com responsável ou prazo mas sem descrição é
  // erro, não descarte — alguém começou a preencher e a informação se perderia
  // em silêncio (RF-036, CA-26).
  const acoes = data.acoes.filter(a => !linhaVazia(a));
  if (acoes.some(a => !a.descricao.trim())) {
    erros.push('Há ação com responsável ou prazo e sem descrição. Informe a descrição ou limpe a linha.');
  }

  if (erros.length) throw new DadosInvalidos(erros);
  return acoes;
}

/**
 * Reconcilia as ações de um parecer preservando os ids existentes (RN-029).
 *
 * Não apaga tudo e reinsere: isso trocaria os ids de linhas que a pessoa nem
 * tocou, quebrando qualquer referência e o histórico. Atualiza as que vieram
 * com id, insere as novas e remove apenas as que sumiram da lista.
 */
async function reconciliarAcoes(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  parecerId: string,
  acoes: AcaoParecerInput[],
): Promise<void> {
  const { data: existentes, error: erroLer } = await supabaseAdmin
    .from('parecer_acoes').select('id').eq('parecer_id', parecerId);
  if (erroLer) throw new Error(erroLer.message);

  const idsMantidos = new Set(acoes.map(a => a.id).filter(Boolean) as string[]);
  const paraRemover = (existentes ?? []).map(r => r.id as string).filter(id => !idsMantidos.has(id));

  if (paraRemover.length) {
    const { error } = await supabaseAdmin.from('parecer_acoes').delete().in('id', paraRemover);
    if (error) throw new Error(error.message);
  }

  for (const [i, acao] of acoes.entries()) {
    const linha = {
      parecer_id: parecerId,
      ordem: i + 1,
      descricao: acao.descricao.trim(),
      responsavel: vazioParaNulo(acao.responsavel),
      prazo: acao.prazo,
      status: acao.status,
    };
    const { error } = acao.id
      ? await supabaseAdmin.from('parecer_acoes').update(linha).eq('id', acao.id)
      : await supabaseAdmin.from('parecer_acoes').insert(linha);
    if (error) throw new Error(error.message);
  }
}

function linhaParecer(data: ParecerInput) {
  return {
    projeto_id: data.projetoId,
    data: data.data,
    origem: data.origem,
    autor: data.autor.trim(),
    pontos_observados: data.pontosObservados.trim(),
    itens_criticos: vazioParaNulo(data.itensCriticos),
    limitacoes_orcamentarias: vazioParaNulo(data.limitacoesOrcamentarias),
    recomendacao: vazioParaNulo(data.recomendacao),
    log_comunicacao_id: data.logComunicacaoId,
  };
}

export const criarParecer = createServerFn({ method: 'POST' })
  .validator((d: ParecerInput) => d)
  .handler(async ({ data }): Promise<string> => {
    const sessao = await exigirEscrita();
    const acoes = validarParecer(data);
    const supabaseAdmin = await getAdmin();

    // O autor do registro é o que a pessoa digitou (pode ser quem fez a
    // visita, não quem digitou); a AUTORIA da escrita vai para a auditoria,
    // vinda da sessão (RN-027).
    const { data: criado, error } = await supabaseAdmin
      .from('pareceres_tecnicos')
      .insert({ ...linhaParecer(data), autor: data.autor.trim() || sessao.displayName })
      .select('id').single();
    if (error) throw new Error(error.message);

    await reconciliarAcoes(supabaseAdmin, criado.id as string, acoes);
    return criado.id as string;
  });

export const atualizarParecer = createServerFn({ method: 'POST' })
  .validator((d: { parecerId: string; dados: ParecerInput }) => d)
  .handler(async ({ data: { parecerId, dados } }): Promise<void> => {
    await exigirEscrita();
    const acoes = validarParecer(dados);
    const supabaseAdmin = await getAdmin();

    const { error } = await supabaseAdmin
      .from('pareceres_tecnicos').update(linhaParecer(dados)).eq('id', parecerId);
    if (error) throw new Error(error.message);

    await reconciliarAcoes(supabaseAdmin, parecerId, acoes);
  });

/**
 * Exclui o parecer. As ações vão junto por CASCADE — cada ação pertence a
 * exatamente um parecer (RN-029), então não há o que preservar fora dele.
 *
 * RN-026: excluir parecer NÃO mexe em orçamento, riscos ou percentuais. O
 * parecer registra análise e encaminhamento; nada nele altera outro módulo
 * automaticamente.
 */
export const excluirParecer = createServerFn({ method: 'POST' })
  .validator((d: { parecerId: string }) => d)
  .handler(async ({ data: { parecerId } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('pareceres_tecnicos').delete().eq('id', parecerId);
    if (error) throw new Error(error.message);
  });

/**
 * Troca só o responsável da atividade (RF-020).
 *
 * Existe separado de `atualizarAtividade` porque arrastar um cartão entre
 * colunas de responsável não deve reexecutar a validação de datas: a pessoa
 * não tocou em data nenhuma, e recusar o arraste por causa de uma divergência
 * preexistente seria incompreensível para quem só queria reatribuir a tarefa.
 */
export const definirResponsavel = createServerFn({ method: 'POST' })
  .validator((d: { atividadeId: string; responsavel: string }) => d)
  .handler(async ({ data: { atividadeId, responsavel } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('atividades')
      .update({ responsavel: vazioParaNulo(responsavel) })
      .eq('id', atividadeId);
    if (error) throw new Error(error.message);
  });
