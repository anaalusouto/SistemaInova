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
  validarDatasDaAtividade, validarPeriodoDaEtapa, validarMeta, motivoParaNaoRemoverEtapa, progressoParaStatus,
  type MetaInput, type Periodo,
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
// Meta e suas etapas (RF04.1)
//
// Edição direta para quem tem escrita, sem fila de aprovação (decisão da
// equipe, 29/09/2026). Cada alteração vai para log_alteracoes_meta, o mesmo
// histórico que o fluxo de aprovação já alimenta.
// ---------------------------------------------------------------------------

type Sessao = Awaited<ReturnType<typeof exigirEscrita>>;

interface Registro {
  projetoId: number;
  entidade: 'meta' | 'etapa';
  acao: 'criar' | 'editar' | 'excluir';
  alvoId: string | null;
  paiId: string | null;
  caminho: string;
  campo?: string;
  de?: string | null;
  para?: string | null;
  payload?: Record<string, unknown>;
}

async function registrar(supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>, sessao: Sessao, r: Registro) {
  const { error } = await supabaseAdmin.from('log_alteracoes_meta').insert({
    projeto_id: r.projetoId, entidade: r.entidade, acao: r.acao, target_id: r.alvoId, parent_id: r.paiId,
    target_path: r.caminho, campo: r.campo ?? null, de_valor: r.de ?? null, para_valor: r.para ?? null,
    payload: r.payload ?? null, autor: sessao.displayName, autor_papel: sessao.role, aprovado_por: sessao.displayName,
  });
  if (error) throw new Error(error.message);
}

async function carregarMeta(supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>, metaId: string) {
  const { data, error } = await supabaseAdmin
    .from('metas')
    .select('id, projeto_id, nome, responsavel, inicio_previsto, fim_previsto')
    .eq('id', metaId)
    .single();
  if (error || !data) throw new Error('Meta não encontrada.');
  return data;
}

export interface SalvarMetaInput extends MetaInput {
  metaId: string;
}

export const salvarMeta = createServerFn({ method: 'POST' })
  .validator((d: SalvarMetaInput) => d)
  .handler(async ({ data }): Promise<void> => {
    const sessao = await exigirEscrita();
    const validacao = validarMeta(data);
    if (!validacao.ok) throw new DadosInvalidos(validacao.erros);
    const supabaseAdmin = await getAdmin();
    const antes = await carregarMeta(supabaseAdmin, data.metaId);

    const depois = {
      nome: data.nome.trim(),
      responsavel: vazioParaNulo(data.responsavel),
      inicio_previsto: data.inicioPrevisto || null,
      fim_previsto: data.fimPrevisto || null,
    };
    const { error } = await supabaseAdmin.from('metas').update(depois).eq('id', data.metaId);
    if (error) throw new Error(error.message);

    // Uma linha de histórico por campo alterado, como no fluxo de aprovação.
    const rotulos: Record<keyof typeof depois, string> = {
      nome: 'nome', responsavel: 'responsável', inicio_previsto: 'início previsto', fim_previsto: 'fim previsto',
    };
    for (const k of Object.keys(depois) as (keyof typeof depois)[]) {
      if ((antes[k] ?? null) === depois[k]) continue;
      await registrar(supabaseAdmin, sessao, {
        projetoId: antes.projeto_id, entidade: 'meta', acao: 'editar', alvoId: antes.id, paiId: null,
        caminho: `Meta ${depois.nome}`, campo: rotulos[k], de: antes[k] ?? null, para: depois[k],
      });
    }
  });

export const criarEtapaDaMeta = createServerFn({ method: 'POST' })
  .validator((d: { metaId: string; nome: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const sessao = await exigirEscrita();
    const nome = data.nome.trim();
    if (!nome) throw new DadosInvalidos(['Informe o nome da etapa.']);
    const supabaseAdmin = await getAdmin();
    const meta = await carregarMeta(supabaseAdmin, data.metaId);

    const { data: irmas } = await supabaseAdmin.from('etapas').select('ordem').eq('meta_id', meta.id);
    const ordens = (irmas ?? []).map(r => Number(r.ordem) || 0);
    const { data: nova, error } = await supabaseAdmin
      .from('etapas')
      .insert({ meta_id: meta.id, nome, ordem: ordens.length ? Math.max(...ordens) + 1 : 1 })
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    await registrar(supabaseAdmin, sessao, {
      projetoId: meta.projeto_id, entidade: 'etapa', acao: 'criar', alvoId: nova.id, paiId: meta.id,
      caminho: `Meta ${meta.nome} › ${nome}`, para: nome,
    });
  });

export const renomearEtapa = createServerFn({ method: 'POST' })
  .validator((d: { etapaId: string; nome: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const sessao = await exigirEscrita();
    const nome = data.nome.trim();
    if (!nome) throw new DadosInvalidos(['Informe o nome da etapa.']);
    const supabaseAdmin = await getAdmin();
    const { data: etapa, error: e1 } = await supabaseAdmin
      .from('etapas').select('id, nome, meta_id').eq('id', data.etapaId).single();
    if (e1 || !etapa) throw new Error('Etapa não encontrada.');
    if (etapa.nome === nome) return;
    const meta = await carregarMeta(supabaseAdmin, etapa.meta_id);

    const { error } = await supabaseAdmin.from('etapas').update({ nome }).eq('id', etapa.id);
    if (error) throw new Error(error.message);
    await registrar(supabaseAdmin, sessao, {
      projetoId: meta.projeto_id, entidade: 'etapa', acao: 'editar', alvoId: etapa.id, paiId: meta.id,
      caminho: `Meta ${meta.nome} › ${nome}`, campo: 'nome', de: etapa.nome, para: nome,
    });
  });

/**
 * Remove uma etapa. Só etapa sem atividade ativa e sem risco: apagar uma etapa
 * com conteúdo levaria junto atividades e anexos (ON DELETE CASCADE), e o
 * banco já recusa etapa com risco (ON DELETE RESTRICT). A mensagem diz o que
 * mover ou excluir antes.
 */
export const excluirEtapa = createServerFn({ method: 'POST' })
  .validator((d: { etapaId: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { data: etapa, error: e1 } = await supabaseAdmin
      .from('etapas').select('id, nome, meta_id').eq('id', data.etapaId).single();
    if (e1 || !etapa) throw new Error('Etapa não encontrada.');

    const [ativs, riscos] = await Promise.all([
      supabaseAdmin.from('atividades').select('id', { count: 'exact', head: true }).eq('etapa_id', etapa.id).is('excluido_em', null),
      supabaseAdmin.from('plano_riscos').select('id', { count: 'exact', head: true }).eq('etapa_id', etapa.id),
    ]);
    if (ativs.error) throw new Error(ativs.error.message);
    if (riscos.error) throw new Error(riscos.error.message);
    const motivo = motivoParaNaoRemoverEtapa(etapa.nome, ativs.count ?? 0, riscos.count ?? 0);
    if (motivo) throw new DadosInvalidos([motivo]);

    const meta = await carregarMeta(supabaseAdmin, etapa.meta_id);
    const { error } = await supabaseAdmin.from('etapas').delete().eq('id', etapa.id);
    if (error) throw new Error(error.message);
    await registrar(supabaseAdmin, sessao, {
      projetoId: meta.projeto_id, entidade: 'etapa', acao: 'excluir', alvoId: etapa.id, paiId: meta.id,
      caminho: `Meta ${meta.nome} › ${etapa.nome}`, de: etapa.nome,
    });
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
// Parecer técnico (RF-034, RN-026)
//
// As "ações derivadas" (RF-036, RN-029) saíram do parecer: o RC-04 as
// substitui pelos Encaminhamentos da organização (organizacoes.server.ts),
// que valem para qualquer origem e não só para um parecer.
// ---------------------------------------------------------------------------

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
}

function validarParecer(data: ParecerInput): void {
  const erros: string[] = [];
  if (!data.data) erros.push('Informe a data da visita ou reunião.');
  if (!data.origem) erros.push('Informe a origem do registro.');
  if (!data.autor.trim()) erros.push('Informe o responsável pelo registro.');
  if (!data.pontosObservados.trim()) erros.push('Informe os pontos observados.');
  if (erros.length) throw new DadosInvalidos(erros);
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
    validarParecer(data);
    const supabaseAdmin = await getAdmin();

    // O autor do registro é o que a pessoa digitou (pode ser quem fez a
    // visita, não quem digitou); a AUTORIA da escrita vai para a auditoria,
    // vinda da sessão (RN-027).
    const { data: criado, error } = await supabaseAdmin
      .from('pareceres_tecnicos')
      .insert({ ...linhaParecer(data), autor: data.autor.trim() || sessao.displayName })
      .select('id').single();
    if (error) throw new Error(error.message);
    return criado.id as string;
  });

export const atualizarParecer = createServerFn({ method: 'POST' })
  .validator((d: { parecerId: string; dados: ParecerInput }) => d)
  .handler(async ({ data: { parecerId, dados } }): Promise<void> => {
    await exigirEscrita();
    validarParecer(dados);
    const supabaseAdmin = await getAdmin();

    const { error } = await supabaseAdmin
      .from('pareceres_tecnicos').update(linhaParecer(dados)).eq('id', parecerId);
    if (error) throw new Error(error.message);
  });

/**
 * Exclui o parecer.
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
