/**
 * Importação da planilha de orçamento (RF-037, RN-031).
 *
 * O arquivo é lido NO SERVIDOR, não no navegador. Um .xlsx é um zip com XML e
 * pode ser malformado de propósito; processá-lo no cliente tornaria a máquina
 * de quem usa o sistema a superfície de ataque, e ainda deixaria o resultado do
 * parsing sujeito a adulteração antes de chegar ao banco.
 *
 * A biblioteca é a `xlsx` 0.20.3, instalada da CDN da SheetJS — a versão
 * publicada no npm parou na 0.18.5 (2022) e carrega CVEs de prototype
 * pollution e ReDoS corrigidos depois. Processando arquivo de terceiro, essa
 * diferença importa.
 *
 * O fluxo tem dois passos separados de propósito: `lerPlanilha` devolve a
 * prévia sem gravar nada, e `aplicarImportacao` só roda depois da confirmação.
 * O documento exige que a equipe PMO veja o que entraria — incluindo o que
 * seria rejeitado — antes de entrar.
 */
import { createServerFn } from '@tanstack/react-start';
import { chaveDeOrigem } from './lib/orcamento';
import {
  detectarCabecalho, montarPrevia, reconciliar,
  type Celula, type MapeamentoColunas, type Previa, type Reconciliacao, type ItemExistente,
} from './lib/orcamentoPlanilha';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}
async function exigirEscrita() {
  const m = await import('./sessao.server');
  return m.exigirEscrita();
}

export class PlanilhaInvalida extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'PlanilhaInvalida';
  }
}

/** Teto do arquivo. Planilha de orçamento real não chega perto disso. */
const LIMITE_BYTES = 10 * 1024 * 1024;

async function abrirPlanilha(dataUrl: string) {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength === 0) throw new PlanilhaInvalida('O arquivo está vazio.');
  if (buffer.byteLength > LIMITE_BYTES) {
    throw new PlanilhaInvalida(`O arquivo tem ${(buffer.byteLength / 1048576).toFixed(1)} MB e o limite é 10 MB.`);
  }

  const XLSX = await import('xlsx');
  try {
    // cellDates/cellNF desligados: só interessam valores. `dense` reduz memória
    // em planilhas com muitas linhas vazias, comuns em orçamento.
    return XLSX.read(buffer, { type: 'buffer', dense: true });
  } catch (e) {
    throw new PlanilhaInvalida(
      `Não foi possível ler o arquivo como planilha. ${e instanceof Error ? e.message : ''}`.trim(),
    );
  }
}

async function matrizDaAba(workbook: any, aba: string): Promise<Celula[][]> {
  const folha = workbook.Sheets[aba];
  if (!folha) throw new PlanilhaInvalida(`A aba "${aba}" não existe neste arquivo.`);
  // header:1 devolve matriz de linhas; defval mantém as colunas alinhadas
  // mesmo quando a célula está vazia, senão os índices do mapeamento escorregam.
  const XLSX = await import('xlsx');
  return XLSX.utils.sheet_to_json(folha, { header: 1, defval: null, blankrows: true }) as Celula[][];
}

export interface PreviaImportacao {
  abas: string[];
  aba: string;
  /** Mapeamento detectado; a UI permite corrigir antes de confirmar (RF-037). */
  mapeamento: MapeamentoColunas;
  linhaCabecalho: number;
  colunasNaoReconhecidas: string[];
  previa: Previa;
  reconciliacao: Reconciliacao;
  /** Amostra das primeiras linhas, para a pessoa conferir o alinhamento. */
  amostra: Celula[][];
  versaoAtual: number;
}

/**
 * Lê o arquivo e monta a prévia. NÃO grava nada.
 */
export const lerPlanilha = createServerFn({ method: 'POST' })
  .validator((d: { projetoId: number; dataUrl: string; aba?: string; mapeamento?: MapeamentoColunas }) => d)
  .handler(async ({ data }): Promise<PreviaImportacao> => {
    await exigirEscrita();

    const workbook = await abrirPlanilha(data.dataUrl);
    const abas: string[] = workbook.SheetNames ?? [];
    if (abas.length === 0) throw new PlanilhaInvalida('O arquivo não tem nenhuma aba.');

    const aba = data.aba && abas.includes(data.aba) ? data.aba : abas[0];
    const matriz = await matrizDaAba(workbook, aba);
    if (matriz.length === 0) throw new PlanilhaInvalida(`A aba "${aba}" está vazia.`);

    const detectado = detectarCabecalho(matriz);
    if (!detectado && !data.mapeamento) {
      throw new PlanilhaInvalida(
        'Não foi possível reconhecer o cabeçalho da planilha. ' +
        'Verifique se a aba tem as colunas de descrição e total, ou informe o mapeamento manualmente.',
      );
    }

    const mapeamento = data.mapeamento ?? detectado!.mapeamento;
    const linhaCabecalho = detectado?.linha ?? 0;
    const previa = montarPrevia(matriz, mapeamento, linhaCabecalho + 1);

    const supabaseAdmin = await getAdmin();
    const { data: existentesRaw } = await supabaseAdmin
      .from('orcamento_itens')
      .select('id, chave_origem, item, valor_proposto, valor_executado, situacao')
      .eq('projeto_id', data.projetoId);

    const existentes: ItemExistente[] = (existentesRaw ?? []).map(i => ({
      id: i.id as string,
      chave: (i.chave_origem as string) ?? null,
      descricao: (i.item as string) ?? '',
      valorProposto: Number(i.valor_proposto ?? 0),
      temExecucao: i.valor_executado !== null && Number(i.valor_executado) > 0,
      excluido: i.situacao === 'Excluído',
    }));

    const { data: ultima } = await supabaseAdmin
      .from('orcamento_importacoes')
      .select('versao')
      .eq('projeto_id', data.projetoId)
      .order('versao', { ascending: false })
      .limit(1);

    return {
      abas,
      aba,
      mapeamento,
      linhaCabecalho,
      colunasNaoReconhecidas: detectado?.faltando ?? [],
      previa,
      reconciliacao: reconciliar(existentes, previa.itens),
      amostra: matriz.slice(0, Math.min(matriz.length, linhaCabecalho + 6)),
      versaoAtual: ultima?.length ? Number(ultima[0].versao) : 0,
    };
  });

// ---------------------------------------------------------------------------
// Aplicação (RF-037, RN-031)
// ---------------------------------------------------------------------------

export interface AplicarInput {
  projetoId: number;
  nomeArquivo: string;
  aba: string;
  dataUrl: string;
  mapeamento: MapeamentoColunas;
  linhaCabecalho: number;
  /** Decisão explícita sobre itens ausentes na nova versão (RN-031). */
  acaoAusentes: 'manter' | 'excluir';
  /** Registro da decisão quando há divergências não resolvidas no arquivo. */
  decisaoJustificada: string;
}

/**
 * Aplica a importação preservando o que é da execução.
 *
 * O que NUNCA é sobrescrito: valor executado, data da compra, justificativa,
 * situação de exclusão e risco vinculado (RN-031). A planilha manda no
 * planejado; a execução é do sistema, e uma reimportação que apagasse isso
 * destruiria meses de registro a cada correção de preço na origem.
 *
 * Item ausente na nova versão não some sozinho: ou permanece, ou é marcado
 * conforme decisão explícita de quem importa.
 */
export const aplicarImportacao = createServerFn({ method: 'POST' })
  .validator((d: AplicarInput) => d)
  .handler(async ({ data }): Promise<{ incluidos: number; alterados: number; ausentes: number; versao: number }> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const workbook = await abrirPlanilha(data.dataUrl);
    const matriz = await matrizDaAba(workbook, data.aba);
    const previa = montarPrevia(matriz, data.mapeamento, data.linhaCabecalho + 1);

    if (previa.itens.length === 0) {
      throw new PlanilhaInvalida('Nenhum item válido foi encontrado nesta aba com o mapeamento informado.');
    }
    // RN-031: ambiguidade exige conciliação manual, não decisão automática.
    if (previa.duplicadas.length > 0 && !data.decisaoJustificada.trim()) {
      throw new PlanilhaInvalida(
        'Há linhas com grupo, categoria e descrição repetidos. ' +
        'Corrija a planilha ou registre a decisão de importação antes de confirmar.',
      );
    }

    const { data: existentesRaw } = await supabaseAdmin
      .from('orcamento_itens')
      .select('id, chave_origem, item, valor_proposto, valor_executado, situacao')
      .eq('projeto_id', data.projetoId);

    const existentes: ItemExistente[] = (existentesRaw ?? []).map(i => ({
      id: i.id as string,
      chave: (i.chave_origem as string) ?? null,
      descricao: (i.item as string) ?? '',
      valorProposto: Number(i.valor_proposto ?? 0),
      temExecucao: i.valor_executado !== null && Number(i.valor_executado) > 0,
      excluido: i.situacao === 'Excluído',
    }));

    const plano = reconciliar(existentes, previa.itens);
    if (plano.ambiguos.length > 0 && !data.decisaoJustificada.trim()) {
      throw new PlanilhaInvalida(
        'A correspondência com itens já cadastrados é ambígua. Registre a decisão antes de confirmar.',
      );
    }

    const { data: ultima } = await supabaseAdmin
      .from('orcamento_importacoes')
      .select('versao').eq('projeto_id', data.projetoId).order('versao', { ascending: false }).limit(1);
    const versao = (ultima?.length ? Number(ultima[0].versao) : 0) + 1;

    const { data: importacao, error: erroImp } = await supabaseAdmin
      .from('orcamento_importacoes')
      .insert({
        projeto_id: data.projetoId,
        nome_arquivo: data.nomeArquivo,
        aba: data.aba,
        versao,
        autor: sessao.displayName,
        resumo: {
          incluidos: plano.incluidos.length,
          alterados: plano.alterados.length,
          ausentes: plano.ausentes.length,
          inalterados: plano.inalterados,
          rejeitadas: previa.rejeitadas,
          duplicadas: previa.duplicadas,
          desacordoDeTotal: previa.desacordoDeTotal,
          decisaoJustificada: data.decisaoJustificada.trim() || null,
          acaoAusentes: data.acaoAusentes,
        },
      })
      .select('id')
      .single();
    if (erroImp) throw new Error(erroImp.message);

    const historico: any[] = [];

    // Alterados: só o PLANEJADO muda. Execução e exclusão ficam como estão.
    for (const alt of plano.alterados) {
      const { error } = await supabaseAdmin
        .from('orcamento_itens')
        .update({
          grupo: alt.novo.grupo,
          categoria: alt.novo.categoria,
          item: alt.novo.descricao,
          qtd: alt.novo.qtd,
          unidade: alt.novo.unidade,
          qtd_unidades: alt.novo.qtdUnidades,
          valor_unitario: Number.isFinite(alt.novo.valorUnitario) ? alt.novo.valorUnitario : 0,
          valor_proposto: alt.novo.totalDeclarado,
          chave_origem: alt.novo.chave,
          importacao_id: importacao.id,
        })
        .eq('id', alt.existente.id);
      if (error) throw new Error(error.message);

      historico.push({
        item_id: alt.existente.id, evento: 'correção de origem', autor: sessao.displayName,
        valor_anterior: alt.de.toFixed(2), valor_novo: alt.para.toFixed(2),
        detalhe: `Versão ${versao} da planilha (${data.nomeArquivo}).`,
      });
    }

    // Incluídos: entram no fim, preservando a ordem de leitura da planilha.
    const { data: maiorOrdem } = await supabaseAdmin
      .from('orcamento_itens').select('ordem').eq('projeto_id', data.projetoId).order('ordem', { ascending: false }).limit(1);
    let ordem = maiorOrdem?.length ? Number(maiorOrdem[0].ordem) : 0;

    for (const novo of plano.incluidos) {
      ordem += 1;
      const { data: criado, error } = await supabaseAdmin
        .from('orcamento_itens')
        .insert({
          projeto_id: data.projetoId,
          grupo: novo.grupo,
          categoria: novo.categoria,
          item: novo.descricao,
          qtd: novo.qtd,
          unidade: novo.unidade,
          qtd_unidades: novo.qtdUnidades,
          valor_unitario: Number.isFinite(novo.valorUnitario) ? novo.valorUnitario : 0,
          valor_proposto: novo.totalDeclarado,
          // Execução nasce ausente, nunca zero (RF-029).
          valor_executado: null,
          chave_origem: novo.chave,
          importacao_id: importacao.id,
          ordem,
          situacao: 'Ativo',
        })
        .select('id')
        .single();
      if (error) throw new Error(error.message);

      historico.push({
        item_id: criado.id, evento: 'importação', autor: sessao.displayName,
        valor_anterior: null, valor_novo: novo.totalDeclarado.toFixed(2),
        detalhe: `Versão ${versao} da planilha (${data.nomeArquivo}), linha ${novo.linhaPlanilha}.`,
      });
    }

    // Ausentes: nunca apagados. Só marcados, e só com decisão explícita.
    if (data.acaoAusentes === 'excluir') {
      for (const ausente of plano.ausentes) {
        if (ausente.excluido) continue;
        if (ausente.temExecucao) continue; // RN-032 vale aqui também
        const { error } = await supabaseAdmin
          .from('orcamento_itens')
          .update({
            situacao: 'Excluído',
            motivo_exclusao: `Ausente na versão ${versao} da planilha (${data.nomeArquivo}).`,
            excluido_em: new Date().toISOString(),
            excluido_por: sessao.displayName,
          })
          .eq('id', ausente.id);
        if (error) throw new Error(error.message);

        historico.push({
          item_id: ausente.id, evento: 'exclusão', autor: sessao.displayName,
          valor_anterior: 'Ativo', valor_novo: 'Excluído',
          detalhe: `Ausente na versão ${versao} da planilha.`,
        });
      }
    }

    if (historico.length) {
      const { error } = await supabaseAdmin.from('orcamento_item_historico').insert(historico);
      if (error) console.error('[orçamento] histórico da importação não gravado:', error.message);
    }

    return {
      incluidos: plano.incluidos.length,
      alterados: plano.alterados.length,
      ausentes: plano.ausentes.length,
      versao,
    };
  });
