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
import { camposPlanejados } from './lib/orcamentoRevisao';
import { vincularMetasDoOrcamento, type MetaDoOrcamento, type VinculoMeta } from './lib/orcamentoMetas';
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
  metas: MetaDoOrcamento[];
  vinculosMetas: VinculoMeta[];
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
  antes: string;
}

/**
 * Lê o arquivo e monta a prévia. NÃO grava nada.
 */
export const lerPlanilha = createServerFn({ method: 'POST' })
  .validator((d: { projetoId: number; dataUrl: string; aba?: string; mapeamento?: MapeamentoColunas; metasPorLinha?: Record<string, string> }) => d)
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
    const { data: metasRaw, error: erroMetas } = await supabaseAdmin.from('metas')
      .select('id,nome,ordem').eq('projeto_id', data.projetoId).order('ordem', { ascending: true }).order('criado_em', { ascending: true });
    if (erroMetas) throw new Error(erroMetas.message);
    const metas = (metasRaw ?? []).map((m, i) => ({ id: m.id, nome: m.nome, numero: i + 1 }));
    const vinculosMetas = vincularMetasDoOrcamento(previa.itens, metas, data.metasPorLinha);
    previa.itens.forEach((item, i) => { item.metaId = vinculosMetas[i].metaId; });
    const { data: existentesRaw, error: erroExistentes } = await supabaseAdmin
      .from('orcamento_itens')
      .select('*')
      .eq('projeto_id', data.projetoId).eq('vigente', true).order('id');

    if (erroExistentes) throw new Error(`Não foi possível conferir os vínculos do orçamento. Verifique a migração 0020. ${erroExistentes.message}`);
    const existentes: ItemExistente[] = (existentesRaw ?? []).map(i => ({
      id: i.id as string,
      metaId: i.meta_id ?? null,
      chave: i.chave_origem || chaveDeOrigem(i.grupo ?? '', i.categoria ?? '', i.item ?? ''),
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
      antes: JSON.stringify(existentesRaw ?? []),
      metas, vinculosMetas,
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
  metasPorLinha?: Record<string, string>;
  projetoId: number;
  nomeArquivo: string;
  aba: string;
  dataUrl: string;
  mapeamento: MapeamentoColunas;
  linhaCabecalho: number;
  /** Snapshot da prévia para detectar revisões concorrentes. */
  antes: string;
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
 * A confirmação substitui a proposta vigente. Itens ausentes são arquivados,
 * preservando notas, execução e histórico fora do total proposto atual.
 */
export const aplicarImportacao = createServerFn({ method: 'POST' })
  .validator((d: AplicarInput) => d)
  .handler(async ({ data }): Promise<{ incluidos: number; alterados: number; ausentes: number; versao: number }> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    if (typeof data.antes !== 'string') throw new PlanilhaInvalida('Reabra a prévia do orçamento antes de confirmar a substituição.');

    const workbook = await abrirPlanilha(data.dataUrl);
    const matriz = await matrizDaAba(workbook, data.aba);
    const previa = montarPrevia(matriz, data.mapeamento, data.linhaCabecalho + 1);

    if (previa.itens.length === 0) {
      throw new PlanilhaInvalida('Nenhum item válido foi encontrado nesta aba com o mapeamento informado.');
    }
    if (previa.duplicadas.length > 0) {
      throw new PlanilhaInvalida('Há itens repetidos na nova planilha. Corrija as linhas antes de substituir o orçamento.');
    }
    if (previa.rejeitadas.length > 0) {
      throw new PlanilhaInvalida('Há linhas rejeitadas. Corrija a planilha antes de substituir o orçamento para não retirar itens por uma falha de leitura.');
    }
    if ((previa.desacordoDeTotal || previa.itens.some(i => i.divergencias.length > 0)) && !data.decisaoJustificada.trim()) {
      throw new PlanilhaInvalida('Corrija as divergências nos valores ou registre a decisão de importação antes de confirmar.');
    }

    // Releitura e resolução no servidor: nenhum ID da prévia é confiado
    // sem conferir que a meta pertence ao projeto que recebe o orçamento.
    const { data: metasRaw, error: erroMetas } = await supabaseAdmin.from('metas')
      .select('id,nome,ordem').eq('projeto_id', data.projetoId).order('ordem', { ascending: true }).order('criado_em', { ascending: true });
    if (erroMetas) throw new Error(erroMetas.message);
    const metas = (metasRaw ?? []).map((m, i) => ({ id: m.id, nome: m.nome, numero: i + 1 }));
    const vinculos = vincularMetasDoOrcamento(previa.itens, metas, data.metasPorLinha);
    const pendentes = vinculos.filter(v => v.motivo);
    if (pendentes.length) throw new PlanilhaInvalida(pendentes.map(v => `Linha ${v.linhaPlanilha}: ${v.motivo}`).join(' '));

    const { data: existentesRaw, error: erroExistentes } = await supabaseAdmin
      .from('orcamento_itens')
      .select('*')
      .eq('projeto_id', data.projetoId).eq('vigente', true).order('id');

    if (erroExistentes) throw new Error(`Não foi possível conferir os vínculos do orçamento. Verifique a migração 0020. ${erroExistentes.message}`);
    const existentes: ItemExistente[] = (existentesRaw ?? []).map(i => ({
      id: i.id as string,
      metaId: i.meta_id ?? null,
      chave: i.chave_origem || chaveDeOrigem(i.grupo ?? '', i.categoria ?? '', i.item ?? ''),
      descricao: (i.item as string) ?? '',
      valorProposto: Number(i.valor_proposto ?? 0),
      temExecucao: i.valor_executado !== null && Number(i.valor_executado) > 0,
      excluido: i.situacao === 'Excluído',
    }));

    previa.itens.forEach((item, i) => { item.metaId = vinculos[i].metaId; });
    const plano = reconciliar(existentes, previa.itens);

    const porChave = new Map(existentes.map(i => [i.chave, i]));
    const itens = previa.itens.map((i, indice) => ({
      ...camposPlanejados({ ...i, metaId: i.metaId ?? null, valorProposto: i.totalDeclarado }),
      ...(vinculos[indice].criarMeta ? { meta_nova: vinculos[indice].criarMeta } : {}),
      id: plano.ambiguos.some(a => a.chave === i.chave) ? null : porChave.get(i.chave)?.id ?? null,
    }));
    const { data: resultado, error } = await supabaseAdmin.rpc('salvar_versao_orcamento', {
      p_projeto: data.projetoId,
      p_antes: JSON.parse(data.antes),
      p_itens: itens,
      p_autor: sessao.displayName,
      p_importacao: {
        nome_arquivo: data.nomeArquivo, aba: data.aba,
        resumo: { incluidos: plano.incluidos.length, alterados: plano.alterados.length,
          ausentes: plano.ausentes.length, inalterados: plano.inalterados,
          decisaoJustificada: data.decisaoJustificada.trim() || null,
          acaoAusentes: 'substituir', vinculosMetas: vinculos },
      },
    });
    if (error) {
      const esquemaAusente = ['PGRST202', 'PGRST204', 'PGRST205', '42883', '42703', '42P01'].includes(error.code ?? '');
      throw new Error(`Não foi possível atualizar o orçamento. ${esquemaAusente ? 'A estrutura do banco precisa ser atualizada com as migrações do orçamento. ' : ''}${error.message}`);
    }
    return resultado as { incluidos: number; alterados: number; ausentes: number; versao: number };
  });
