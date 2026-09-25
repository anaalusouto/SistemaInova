/**
 * Escritas do Orçamento (RF-030, RF-039, RF-040, RF-041, RN-032, RN-033).
 *
 * O que a equipe PMO informa na rotina normal é só execução: valor, data da
 * compra e a justificativa exigida quando o executado difere do proposto. Os
 * dados planejados do item são somente leitura (RF-030) — corrigi-los é papel
 * de uma nova versão da planilha, com prévia e reconciliação, não de digitação
 * na tela de execução.
 *
 * Toda alteração entra no histórico do item com valor anterior e novo (RN-033).
 * Sem isso, "por que este item mudou de R$ 8.000 para R$ 12.000?" vira uma
 * pergunta sem resposta três meses depois.
 */
import { createServerFn } from '@tanstack/react-start';
import { arredondar } from './lib/orcamento';

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
  | 'justificativa' | 'exclusão' | 'reversão' | 'vínculo de risco';

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

const dinheiro = (v: number | null | undefined) =>
  v === null || v === undefined ? null : arredondar(Number(v)).toFixed(2);

// ---------------------------------------------------------------------------
// Execução do item (RF-030, RF-039)
// ---------------------------------------------------------------------------

export interface ExecucaoInput {
  itemId: string;
  /** null limpa a execução — volta a ser "Não informado", não zero (RF-029). */
  valorExecutado: number | null;
  dataCompra: string | null;
  justificativa: string;
}

export const registrarExecucao = createServerFn({ method: 'POST' })
  .validator((d: ExecucaoInput) => d)
  .handler(async ({ data }): Promise<void> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const { data: item, error: erroLer } = await supabaseAdmin
      .from('orcamento_itens')
      .select('id, situacao, valor_proposto, valor_executado, data_compra, justificativa_diferenca')
      .eq('id', data.itemId)
      .single();
    if (erroLer || !item) throw new Error('Item de orçamento não encontrado.');

    if (item.situacao === 'Excluído') {
      throw new OrcamentoInvalido([
        'Este item está excluído do plano. Reverta a exclusão antes de registrar execução.',
      ]);
    }

    if (data.valorExecutado !== null && !Number.isFinite(data.valorExecutado)) {
      throw new OrcamentoInvalido(['O valor executado não é um número válido.']);
    }
    if (data.valorExecutado !== null && data.valorExecutado < 0) {
      throw new OrcamentoInvalido(['O valor executado não pode ser negativo.']);
    }

    // RF-039: diferença exige justificativa específica do item, inclusive
    // quando o executado é MENOR — gastar menos também é um desvio do plano e
    // precisa de explicação registrada.
    const proposto = arredondar(Number(item.valor_proposto ?? 0));
    const executado = data.valorExecutado === null ? null : arredondar(data.valorExecutado);
    if (executado !== null && executado !== proposto && !data.justificativa.trim()) {
      throw new OrcamentoInvalido([
        `O valor executado difere do proposto. Informe a justificativa desta diferença.`,
      ]);
    }

    const { error } = await supabaseAdmin
      .from('orcamento_itens')
      .update({
        valor_executado: executado,
        data_compra: data.dataCompra,
        justificativa_diferenca: data.justificativa.trim() || null,
      })
      .eq('id', data.itemId);
    if (error) throw new Error(error.message);

    const antesExec = dinheiro(item.valor_executado as number | null);
    const depoisExec = dinheiro(executado);
    if (antesExec !== depoisExec) {
      await registrar(supabaseAdmin, data.itemId, 'valor executado', sessao.displayName, antesExec, depoisExec);
    }
    if ((item.data_compra ?? null) !== data.dataCompra) {
      await registrar(supabaseAdmin, data.itemId, 'data da compra', sessao.displayName,
        (item.data_compra as string) ?? null, data.dataCompra);
    }
    const antesJust = (item.justificativa_diferenca as string) ?? null;
    const depoisJust = data.justificativa.trim() || null;
    if (antesJust !== depoisJust) {
      // RN-033: nenhuma substituição silenciosa da justificativa anterior.
      await registrar(supabaseAdmin, data.itemId, 'justificativa', sessao.displayName, antesJust, depoisJust);
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
