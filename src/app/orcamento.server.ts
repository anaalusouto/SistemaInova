/**
 * Escritas do Orçamento (RF-030, RF-039, RF-040, RF-041, RN-032, RN-033).
 *
 * O que a equipe PMO informa na rotina normal é só execução: as notas fiscais
 * (RF04.3 — o executado do item é a soma delas) e a justificativa exigida
 * quando o executado difere do proposto. Os
 * dados planejados do item são somente leitura (RF-030) — corrigi-los é papel
 * de uma nova versão da planilha, com prévia e reconciliação, não de digitação
 * na tela de execução.
 *
 * Toda alteração entra no histórico do item com valor anterior e novo (RN-033).
 * Sem isso, "por que este item mudou de R$ 8.000 para R$ 12.000?" vira uma
 * pergunta sem resposta três meses depois.
 */
import { createServerFn } from '@tanstack/react-start';
import {
  arredondar, exigeJustificativa, validarNota, moeda, type NotaInput,
} from './lib/orcamento';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}
async function exigirEscrita() {
  const m = await import('./sessao.server');
  return m.exigirEscrita();
}

export class OrcamentoInvalido extends Error {
  erros: string[];
  constructor(erros: string[]) {
    super(erros.join(' '));
    this.name = 'OrcamentoInvalido';
    this.erros = erros;
  }
}

type Evento =
  | 'importação' | 'correção de origem' | 'valor executado' | 'data da compra'
  | 'justificativa' | 'exclusão' | 'reversão' | 'vínculo de risco'
  | 'nota fiscal' | 'conclusão';

async function registrar(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  itemId: string,
  evento: Evento,
  autor: string,
  anterior: string | null,
  novo: string | null,
  detalhe?: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from('orcamento_item_historico').insert({
    item_id: itemId, evento, autor,
    valor_anterior: anterior, valor_novo: novo, detalhe: detalhe ?? null,
  });
  // Falha de histórico não derruba a operação que o usuário pediu, mas não
  // pode passar em branco: é a trilha que o RN-033 exige.
  if (error) console.error('[orçamento] histórico não gravado:', { itemId, evento, erro: error.message });
}

// ---------------------------------------------------------------------------
// Execução do item (RF-030, RF-039, RF04.3)
//
// Desde a 0016 o valor executado e a data da compra do item vêm das NOTAS —
// o banco mantém a soma (trigger recalcular_execucao). O que a equipe informa
// aqui é a justificativa e se a execução do item está concluída.
// ---------------------------------------------------------------------------

export interface ExecucaoInput {
  itemId: string;
  justificativa: string;
  execucaoConcluida: boolean;
}

export const registrarExecucao = createServerFn({ method: 'POST' })
  .validator((d: ExecucaoInput) => d)
  .handler(async ({ data }): Promise<void> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const { data: item, error: erroLer } = await supabaseAdmin
      .from('orcamento_itens')
      .select('id, situacao, valor_proposto, valor_executado, justificativa_diferenca, execucao_concluida')
      .eq('id', data.itemId)
      .single();
    if (erroLer || !item) throw new Error('Item de orçamento não encontrado.');

    if (item.situacao === 'Excluído') {
      throw new OrcamentoInvalido([
        'Este item está excluído do plano. Reverta a exclusão antes de registrar execução.',
      ]);
    }

    const precisa = exigeJustificativa({
      valorProposto: Number(item.valor_proposto ?? 0),
      valorExecutado: item.valor_executado === null ? null : Number(item.valor_executado),
      execucaoConcluida: data.execucaoConcluida,
    });
    if (precisa && !data.justificativa.trim()) {
      throw new OrcamentoInvalido([
        'O executado difere do proposto. Informe a justificativa desta diferença.',
      ]);
    }

    const depoisJust = data.justificativa.trim() || null;
    const { error } = await supabaseAdmin
      .from('orcamento_itens')
      .update({ justificativa_diferenca: depoisJust, execucao_concluida: data.execucaoConcluida })
      .eq('id', data.itemId);
    if (error) throw new Error(error.message);

    const antesJust = (item.justificativa_diferenca as string) ?? null;
    if (antesJust !== depoisJust) {
      // RN-033: nenhuma substituição silenciosa da justificativa anterior.
      await registrar(supabaseAdmin, data.itemId, 'justificativa', sessao.displayName, antesJust, depoisJust);
    }
    if (Boolean(item.execucao_concluida) !== data.execucaoConcluida) {
      await registrar(supabaseAdmin, data.itemId, 'conclusão', sessao.displayName,
        item.execucao_concluida ? 'concluída' : 'em andamento',
        data.execucaoConcluida ? 'concluída' : 'em andamento');
    }
  });

// ---------------------------------------------------------------------------
// Notas fiscais / comprovantes (RF04.3)
//
// Nota não é bloqueada por passar do proposto: ela registra um gasto que
// aconteceu. O item fica sinalizado com justificativa pendente até alguém
// explicar a diferença (justificativaPendente, lib/orcamento.ts).
// ---------------------------------------------------------------------------

/** O item precisa ser do mesmo projeto e estar ativo. */
async function conferirItemDaNota(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  projetoId: number,
  itemId: string | null,
): Promise<void> {
  if (!itemId) return;
  const { data: item } = await supabaseAdmin
    .from('orcamento_itens').select('projeto_id, situacao').eq('id', itemId).maybeSingle();
  if (!item || Number(item.projeto_id) !== projetoId) {
    throw new OrcamentoInvalido(['O item escolhido não pertence a este projeto.']);
  }
  if (item.situacao === 'Excluído') {
    throw new OrcamentoInvalido(['O item escolhido está excluído do plano. Reverta a exclusão ou lance a nota sem item.']);
  }
}

const textoOuNulo = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

function resumoNota(n: { numero: string | null; valor: number }): string {
  return `${n.numero ? `NF ${n.numero}` : 'Nota sem número'} · ${moeda(n.valor)}`;
}

export const criarNota = createServerFn({ method: 'POST' })
  .validator((d: NotaInput) => d)
  .handler(async ({ data }): Promise<string> => {
    const sessao = await exigirEscrita();
    const erros = validarNota(data);
    if (erros.length) throw new OrcamentoInvalido(erros);
    const supabaseAdmin = await getAdmin();
    await conferirItemDaNota(supabaseAdmin, data.projetoId, data.itemId);

    const valor = arredondar(data.valor!);
    const { data: nova, error } = await supabaseAdmin
      .from('orcamento_notas')
      .insert({
        projeto_id: data.projetoId, item_id: data.itemId,
        numero: textoOuNulo(data.numero), fornecedor: textoOuNulo(data.fornecedor),
        data_emissao: data.dataEmissao, valor, descricao: textoOuNulo(data.descricao),
        criado_por: sessao.displayName,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);

    if (data.itemId) {
      await registrar(supabaseAdmin, data.itemId, 'nota fiscal', sessao.displayName, null,
        resumoNota({ numero: textoOuNulo(data.numero), valor }), 'nota lançada');
    }
    return nova.id as string;
  });

export const atualizarNota = createServerFn({ method: 'POST' })
  .validator((d: { notaId: string; dados: NotaInput }) => d)
  .handler(async ({ data: { notaId, dados } }): Promise<void> => {
    const sessao = await exigirEscrita();
    const erros = validarNota(dados);
    if (erros.length) throw new OrcamentoInvalido(erros);
    const supabaseAdmin = await getAdmin();

    const { data: antes, error: e1 } = await supabaseAdmin
      .from('orcamento_notas').select('projeto_id, item_id, numero, valor').eq('id', notaId).single();
    if (e1 || !antes) throw new Error('Nota não encontrada.');
    // O projeto sai do banco, não do cliente: a nota não muda de projeto.
    const projetoId = Number(antes.projeto_id);
    await conferirItemDaNota(supabaseAdmin, projetoId, dados.itemId);

    const valor = arredondar(dados.valor!);
    const { error } = await supabaseAdmin
      .from('orcamento_notas')
      .update({
        item_id: dados.itemId,
        numero: textoOuNulo(dados.numero), fornecedor: textoOuNulo(dados.fornecedor),
        data_emissao: dados.dataEmissao, valor, descricao: textoOuNulo(dados.descricao),
        atualizado_por: sessao.displayName,
      })
      .eq('id', notaId);
    if (error) throw new Error(error.message);

    const de = resumoNota({ numero: antes.numero ?? null, valor: Number(antes.valor) });
    const para = resumoNota({ numero: textoOuNulo(dados.numero), valor });
    if (antes.item_id && antes.item_id !== dados.itemId) {
      await registrar(supabaseAdmin, antes.item_id, 'nota fiscal', sessao.displayName, de, null, 'nota movida para outro item');
    }
    if (dados.itemId) {
      const mudouDeItem = antes.item_id !== dados.itemId;
      if (mudouDeItem || de !== para) {
        await registrar(supabaseAdmin, dados.itemId, 'nota fiscal', sessao.displayName,
          mudouDeItem ? null : de, para, mudouDeItem ? 'nota vinculada a este item' : 'nota alterada');
      }
    }
  });

export const excluirNota = createServerFn({ method: 'POST' })
  .validator((d: { notaId: string }) => d)
  .handler(async ({ data: { notaId } }): Promise<void> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const { data: nota, error: e1 } = await supabaseAdmin
      .from('orcamento_notas').select('item_id, numero, valor, projeto_anexos(storage_path)').eq('id', notaId).single();
    if (e1 || !nota) throw new Error('Nota não encontrada.');

    // O CASCADE apaga a linha do anexo, mas não o arquivo no storage.
    const caminhos = ((nota.projeto_anexos ?? []) as { storage_path: string }[]).map(a => a.storage_path);
    if (caminhos.length) {
      const { error: erroStorage } = await supabaseAdmin.storage.from('projeto-anexos').remove(caminhos);
      if (erroStorage) console.error('[orçamento] comprovante não removido do storage:', { caminhos, erro: erroStorage.message });
    }

    const { error } = await supabaseAdmin.from('orcamento_notas').delete().eq('id', notaId);
    if (error) throw new Error(error.message);

    if (nota.item_id) {
      await registrar(supabaseAdmin, nota.item_id, 'nota fiscal', sessao.displayName,
        resumoNota({ numero: nota.numero ?? null, valor: Number(nota.valor) }), null, 'nota excluída');
    }
  });

// ---------------------------------------------------------------------------
// Exclusão lógica com risco (RF-040, RF-041, RN-032)
// ---------------------------------------------------------------------------

export interface ExclusaoInput {
  itemId: string;
  motivo: string;
  /** Etapa REAL do Plano de Trabalho — o grupo da planilha não serve (RF-041). */
  etapaId: string;
  responsavel: string;
  probabilidade: number;
  impacto: number;
}

export const excluirItemDoPlano = createServerFn({ method: 'POST' })
  .validator((d: ExclusaoInput) => d)
  .handler(async ({ data }): Promise<string> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const { data: item, error: erroLer } = await supabaseAdmin
      .from('orcamento_itens')
      .select('id, projeto_id, item, grupo, categoria, situacao, valor_proposto, valor_executado')
      .eq('id', data.itemId)
      .single();
    if (erroLer || !item) throw new Error('Item de orçamento não encontrado.');
    if (item.situacao === 'Excluído') throw new OrcamentoInvalido(['Este item já está excluído.']);

    // RN-032: item com execução financeira positiva não sai do plano por aqui.
    // Tirá-lo silenciosamente deixaria dinheiro gasto sem rubrica correspondente.
    const executado = Number(item.valor_executado ?? 0);
    if (item.valor_executado !== null && executado > 0) {
      throw new OrcamentoInvalido([
        'Este item já tem execução financeira registrada e não pode ser excluído diretamente.',
        'Trate a reversão ou a realocação contábil antes, registrando a decisão.',
      ]);
    }

    // RF-041: sem etapa real e dados de risco válidos, a exclusão é impedida e
    // os campos faltantes são explicados.
    const erros: string[] = [];
    if (!data.motivo.trim()) erros.push('Informe o motivo da exclusão.');
    if (!data.etapaId) erros.push('Selecione a etapa do Plano de Trabalho à qual o risco pertence.');
    if (!data.responsavel.trim()) erros.push('Informe o responsável pelo risco.');
    if (!(data.probabilidade >= 1 && data.probabilidade <= 5)) erros.push('A probabilidade deve ficar entre 1 e 5.');
    if (!(data.impacto >= 1 && data.impacto <= 5)) erros.push('O impacto deve ficar entre 1 e 5.');
    if (erros.length) throw new OrcamentoInvalido(erros);

    const { data: etapa, error: erroEtapa } = await supabaseAdmin
      .from('etapas').select('id, meta_id, nome').eq('id', data.etapaId).single();
    if (erroEtapa || !etapa) {
      throw new OrcamentoInvalido(['A etapa selecionada não existe neste projeto.']);
    }

    // O risco nasce Aberto e a faixa sai da matriz — o banco calcula
    // severidade = probabilidade × impacto. Nada aqui atribui "Crítico" por
    // padrão, que seria inflar a leitura de risco do projeto (RF-041).
    const { data: risco, error: erroRisco } = await supabaseAdmin
      .from('plano_riscos')
      .insert({
        projeto_id: item.projeto_id,
        etapa_id: data.etapaId,
        meta_id: etapa.meta_id,
        titulo: `Item excluído do orçamento: ${item.item}`,
        descricao: data.motivo.trim(),
        categoria: 'Financeiro',
        responsavel: data.responsavel.trim(),
        probabilidade: data.probabilidade,
        impacto: data.impacto,
        status: 'Aberto',
        especificacao: `${item.grupo ?? 'Sem grupo'} · ${item.categoria ?? ''}`.trim(),
      })
      .select('id')
      .single();
    if (erroRisco) throw new Error(`Não foi possível criar o risco: ${erroRisco.message}`);

    const { error } = await supabaseAdmin
      .from('orcamento_itens')
      .update({
        situacao: 'Excluído',
        motivo_exclusao: data.motivo.trim(),
        excluido_em: new Date().toISOString(),
        excluido_por: sessao.displayName,
        risco_id: risco.id,
      })
      .eq('id', data.itemId);
    if (error) {
      // Sem o item marcado, o risco ficaria solto falando de uma exclusão que
      // não aconteceu.
      await supabaseAdmin.from('plano_riscos').delete().eq('id', risco.id);
      throw new Error(error.message);
    }

    await registrar(supabaseAdmin, data.itemId, 'exclusão', sessao.displayName, 'Ativo', 'Excluído', data.motivo.trim());
    await registrar(supabaseAdmin, data.itemId, 'vínculo de risco', sessao.displayName, null, risco.id as string,
      `Risco na etapa ${etapa.nome}, probabilidade ${data.probabilidade} × impacto ${data.impacto}`);

    return risco.id as string;
  });

/**
 * Reverte a exclusão (RF-040).
 *
 * O item volta a Ativo mantendo a trilha: motivo original e risco vinculado
 * continuam no histórico. O risco NÃO é apagado — ele registra algo que de
 * fato aconteceu, e sua situação precisa de revisão explícita de quem conduz,
 * não de um apagamento automático.
 */
export const reverterExclusao = createServerFn({ method: 'POST' })
  .validator((d: { itemId: string; motivo: string }) => d)
  .handler(async ({ data: { itemId, motivo } }): Promise<void> => {
    const sessao = await exigirEscrita();
    if (!motivo.trim()) throw new OrcamentoInvalido(['Informe o motivo da reversão.']);
    const supabaseAdmin = await getAdmin();

    const { data: item } = await supabaseAdmin
      .from('orcamento_itens').select('situacao, motivo_exclusao, risco_id').eq('id', itemId).single();
    if (!item) throw new Error('Item de orçamento não encontrado.');
    if (item.situacao !== 'Excluído') throw new OrcamentoInvalido(['Este item não está excluído.']);

    const { error } = await supabaseAdmin
      .from('orcamento_itens')
      .update({ situacao: 'Ativo', motivo_exclusao: null, excluido_em: null, excluido_por: null })
      .eq('id', itemId);
    if (error) throw new Error(error.message);

    await registrar(supabaseAdmin, itemId, 'reversão', sessao.displayName, 'Excluído', 'Ativo', motivo.trim());
  });

// ---------------------------------------------------------------------------
// Histórico (RN-033)
// ---------------------------------------------------------------------------

export interface EventoHistorico {
  id: string;
  evento: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  detalhe: string | null;
  autor: string;
  criadoEm: string;
}

export const historicoDoItem = createServerFn({ method: 'POST' })
  .validator((d: { itemId: string }) => d)
  .handler(async ({ data: { itemId } }): Promise<EventoHistorico[]> => {
    // Leitura: a SEMAS consulta o histórico como consulta o resto (seção 2).
    const m = await import('./sessao.server');
    await m.exigirSessao();

    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from('orcamento_item_historico')
      .select('*')
      .eq('item_id', itemId)
      .order('criado_em', { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map(h => ({
      id: h.id as string,
      evento: h.evento as string,
      valorAnterior: (h.valor_anterior as string) ?? null,
      valorNovo: (h.valor_novo as string) ?? null,
      detalhe: (h.detalhe as string) ?? null,
      autor: h.autor as string,
      criadoEm: h.criado_em as string,
    }));
  });
