const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const XLSX = require('xlsx');

function ambiente({ metas = [], itens = [], consulta = false, semMigracao = false } = {}) {
  const tabelas = { metas: structuredClone(metas), orcamento_itens: structuredClone(itens), orcamento_importacoes: [], orcamento_item_historico: [] };
  const escritas = [];
  const cache = new Map(); let sequencia = 0;
  const db = { from(tabela) {
    const filtros = []; let operacao; let payload; let limite; let singular = false;
    const resposta = () => {
      if (tabela === 'orcamento_itens' && semMigracao) return { data: null, error: { message: 'meta_id não existe' } };
      const rows = tabelas[tabela] ?? [];
      let encontrados = rows.filter(r => filtros.every(([k, v]) => r[k] === v));
      if (operacao === 'insert') {
        encontrados = (Array.isArray(payload) ? payload : [payload]).map(p => ({ id: `id-${++sequencia}`, ...structuredClone(p) }));
        rows.push(...encontrados); escritas.push({ tabela, operacao, payload: structuredClone(payload) });
      } else if (operacao === 'update') {
        encontrados.forEach(r => Object.assign(r, structuredClone(payload))); escritas.push({ tabela, operacao, payload: structuredClone(payload) });
      }
      if (limite) encontrados = encontrados.slice(-limite);
      return { data: singular ? encontrados[0] : structuredClone(encontrados), error: null };
    };
    const builder = {
      select() { return this; }, eq(k, v) { filtros.push([k, v]); return this; }, order() { return this; },
      limit(n) { limite = n; return this; }, insert(p) { operacao = 'insert'; payload = p; return this; },
      update(p) { operacao = 'update'; payload = p; return this; }, single() { singular = true; return Promise.resolve(resposta()); },
      then(resolve, reject) { return Promise.resolve(resposta()).then(resolve, reject); },
    }; return builder;
  } };
  function carregar(arquivo) {
    const absoluto = path.resolve(__dirname, '..', arquivo.endsWith('.ts') ? arquivo : `${arquivo}.ts`);
    if (cache.has(absoluto)) return cache.get(absoluto).exports;
    const mod = { exports: {} }; cache.set(absoluto, mod);
    const code = ts.transpileModule(fs.readFileSync(absoluto, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function('require', 'module', 'exports', code)(request => {
      if (request === 'xlsx') return XLSX;
      if (request === '@tanstack/react-start') return { createServerFn: () => {
        const fn = { validator() { return fn; }, handler(h) { return args => h(args); } }; return fn;
      } };
      if (request.endsWith('/client.server')) return { supabaseAdmin: db };
      if (request === './sessao.server') return { exigirEscrita: async () => { if (consulta) throw new Error('Sem permissão'); return { displayName: 'Teste' }; } };
      return carregar(path.resolve(path.dirname(absoluto), request));
    }, mod, mod.exports); return mod.exports;
  }
  return { api: carregar('src/app/orcamentoImportacao.server'), carregar, tabelas, escritas };
}
function arquivo(linhas) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Meta', 'Grupo', 'Categoria', 'Descrição', 'Qtd.', 'Unidade', 'Qtd. de unidades', 'Valor unitário', 'Total'], ...linhas]), 'Orçamento');
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}
const linha = (meta, descricao) => [meta, 'Materiais', 'Consumo', descricao, 1, 'un', 1, 10, 10];
async function importar(a, dataUrl, metasPorLinha) {
  const previa = await a.api.lerPlanilha({ data: { projetoId: 7, dataUrl, metasPorLinha } });
  const resultado = await a.api.aplicarImportacao({ data: { projetoId: 7, dataUrl, nomeArquivo: 'teste.xlsx', aba: previa.aba, mapeamento: previa.mapeamento, linhaCabecalho: previa.linhaCabecalho, acaoAusentes: 'manter', decisaoJustificada: '', metasPorLinha } });
  return resultado;
}

test('leitura XLSX liga meta existente e anuncia nova meta sem escrever; confirmação cria uma vez e vincula todos os itens', async () => {
  const a = ambiente({ metas: [{ id: 'meta-a', projeto_id: 7, nome: 'Estruturação', ordem: 1 }] });
  const dataUrl = arquivo([linha('Meta 1', 'Computador'), linha('Meta 2 — Capacitação', 'Curso'), linha('', 'Material do curso')]);
  const previa = await a.api.lerPlanilha({ data: { projetoId: 7, dataUrl } });
  assert.equal(previa.vinculosMetas[0].metaId, 'meta-a');
  assert.equal(previa.vinculosMetas[1].criarMeta, 'Meta 2 — Capacitação');
  assert.equal(previa.vinculosMetas[2].criarMeta, 'Meta 2 — Capacitação');
  assert.deepEqual(a.escritas, []);
  await importar(a, dataUrl);
  assert.equal(a.tabelas.metas.length, 2);
  assert.equal(a.tabelas.orcamento_itens[0].meta_id, 'meta-a');
  assert.equal(a.tabelas.orcamento_itens[1].meta_id, a.tabelas.metas[1].id);
  assert.equal(a.tabelas.orcamento_itens[2].meta_id, a.tabelas.metas[1].id);
  const repetida = await importar(a, dataUrl);
  assert.equal(repetida.incluidos, 0); assert.equal(repetida.alterados, 0);
  assert.equal(a.tabelas.metas.length, 2); assert.equal(a.tabelas.orcamento_itens.length, 3);
});

test('reimportação vincula item legado mesmo sem mudança de valor e preserva execução e notas', async () => {
  const a = ambiente({ metas: [{ id: 'meta-a', projeto_id: 7, nome: 'Estruturação', ordem: 1 }], itens: [{ id: 'item-a', projeto_id: 7, chave_origem: 'materiais|consumo|computador', item: 'Computador', valor_proposto: 10, valor_executado: 5, situacao: 'Ativo', data_compra: '2026-10-01', justificativa_diferenca: 'Compra parcial', risco_id: 'risco-a', meta_id: null }] });
  const resultado = await importar(a, arquivo([linha('Meta 1', 'Computador')]));
  assert.equal(resultado.alterados, 1);
  const item = a.tabelas.orcamento_itens[0];
  assert.equal(item.meta_id, 'meta-a'); assert.equal(item.valor_executado, 5);
  assert.equal(item.data_compra, '2026-10-01'); assert.equal(item.justificativa_diferenca, 'Compra parcial'); assert.equal(item.risco_id, 'risco-a');
});

test('ID de meta de outro projeto, referência ausente e falta da migração recusam antes de qualquer escrita', async () => {
  for (const caso of ['outro-projeto', 'sem-referencia', 'sem-migracao']) {
    const a = ambiente({ metas: [], semMigracao: caso === 'sem-migracao' });
    const dataUrl = arquivo([linha(caso === 'sem-referencia' ? '' : 'Meta 1', 'Computador')]);
    const executar = caso === 'outro-projeto' ? () => importar(a, dataUrl, { 2: 'meta-de-outro-projeto' }) : () => importar(a, dataUrl);
    await assert.rejects(executar(), /meta|migração/i); assert.deepEqual(a.escritas, []);
  }
});

test('nomes ambíguos não escolhem a primeira meta e perfil de consulta não importa', async () => {
  const a = ambiente({ metas: [{ id: 'a', projeto_id: 7, nome: 'Capacitação', ordem: 1 }, { id: 'b', projeto_id: 7, nome: 'Capacitação', ordem: 2 }] });
  await assert.rejects(() => importar(a, arquivo([linha('Capacitação', 'Curso')])), /Mais de uma meta/);
  assert.deepEqual(a.escritas, []);
  const conflitante = ambiente();
  await assert.rejects(() => importar(conflitante, arquivo([linha('Meta 2 — Curso', 'Curso'), linha('Meta 2 — Infraestrutura', 'Material')])), /nomes diferentes/);
  assert.deepEqual(conflitante.escritas, []);
  const consulta = ambiente({ consulta: true });
  await assert.rejects(() => importar(consulta, arquivo([linha('Meta 1', 'Curso')])), /Sem permissão/);
  assert.deepEqual(consulta.escritas, []);
});
