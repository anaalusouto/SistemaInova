import { createServerFn } from '@tanstack/react-start';
import { analisarRotas, corrigirLinha, validarDadosRotas, type DadosRotas } from './lib/cronogramaRotas';

export interface CronogramaRotasSalvo { versao: number; dados: DadosRotas; atualizadoEm: string; autor: string }
async function banco() { return (await import('../integrations/supabase/client.server')).supabaseAdmin; }
async function sessao(escrita = false) {
  const s = await import('./sessao.server');
  return escrita ? s.exigirEscrita() : s.exigirSessao();
}
async function lerAtual(): Promise<CronogramaRotasSalvo | null> {
  const db = await banco();
  const { data, error } = await db.from('cronograma_rotas').select('*').eq('id', 'principal').maybeSingle();
  if (error) throw new Error(`Não foi possível ler o cronograma de rotas. ${error.message}`);
  return data ? { versao: Number(data.versao), dados: data.dados as DadosRotas, atualizadoEm: data.atualizado_em, autor: data.autor } : null;
}
export const obterCronogramaRotas = createServerFn({ method: 'GET' }).handler(async () => {
  await sessao(); return lerAtual();
});

export const preverImportacaoRotas = createServerFn({ method: 'POST' })
  .validator((d: { dataUrl: string; nomeArquivo: string }) => d)
  .handler(async ({ data }) => {
    await sessao(true);
    if (typeof data.dataUrl !== 'string' || data.dataUrl.length > 14000000 || !/\.xlsx?$/i.test(data.nomeArquivo)) throw new Error('Selecione um arquivo Excel .xlsx ou .xls de até 10 MB.');
    const buffer = Buffer.from(data.dataUrl.includes(',') ? data.dataUrl.slice(data.dataUrl.indexOf(',') + 1) : data.dataUrl, 'base64');
    if (!buffer.length || buffer.length > 10 * 1024 * 1024) throw new Error('O arquivo está vazio ou excede 10 MB.');
    const XLSX = await import('xlsx');
    let workbook;
    try { workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false, dateNF: 'dd/mm/yyyy', dense: true, sheetRows: 2001 }); }
    catch { throw new Error('Não foi possível ler o arquivo como uma planilha Excel.'); }
    if (workbook.SheetNames.length > 50) throw new Error('A planilha excede o limite de 50 abas.');
    const abas = workbook.SheetNames.map((nome, i) => {
      const folha = workbook.Sheets[nome];
      if (folha['!fullref'] && folha['!fullref'] !== folha['!ref']) throw new Error(`A aba ${nome} excede o limite de 2.000 linhas.`);
      const linhas = (XLSX.utils.sheet_to_json(folha, { header: 1, raw: false, defval: '', blankrows: true }) as unknown[][]).map(row => row.map(v => v == null ? '' : String(v)));
      // Remove somente linhas vazias no final; coordenadas internas são preservadas.
      while (linhas.length && !linhas[linhas.length - 1].some(v => v.trim())) linhas.pop();
      return { nome, oculta: !!workbook.Workbook?.Sheets?.[i]?.Hidden, linhas };
    });
    const dados = validarDadosRotas({ schema: 1, arquivo: data.nomeArquivo, abas });
    const analise = analisarRotas(dados);
    const atual = await lerAtual();
    return { dados, versaoAtual: atual?.versao ?? 0, resumo: { rotas: analise.numeros.length, visitas: analise.visitas.length, dias: analise.dias.length, avisos: analise.avisos } };
  });

async function gravar(versao: number, dados: DadosRotas, autor: string, motivo: string) {
  if (!Number.isSafeInteger(versao) || versao < 0) throw new Error('Versão inválida. Recarregue o cronograma.');
  const db = await banco();
  const { error } = await db.rpc('salvar_cronograma_rotas', { p_versao: versao, p_dados: dados, p_autor: autor, p_motivo: motivo });
  if (error) throw new Error(error.message);
  return lerAtual();
}
export const confirmarImportacaoRotas = createServerFn({ method: 'POST' })
  .validator((d: { versao: number; dados: DadosRotas }) => d)
  .handler(async ({ data }) => {
    const s = await sessao(true);
    return gravar(data.versao, validarDadosRotas(data.dados), s.displayName, `Importação: ${data.dados.arquivo}`);
  });

export const salvarLinhaRotas = createServerFn({ method: 'POST' })
  .validator((d: { versao: number; aba: string; linha: number; alteracoes: Record<string, string> }) => d)
  .handler(async ({ data }) => {
    const s = await sessao(true);
    const atual = await lerAtual();
    if (!atual || atual.versao !== data.versao) throw new Error('O cronograma foi alterado por outra pessoa. Recarregue antes de salvar.');
    const dados = corrigirLinha(atual.dados, data.aba, data.linha, data.alteracoes);
    return gravar(data.versao, dados, s.displayName, `Correção: ${data.aba}, linha ${data.linha + 1}`);
  });
