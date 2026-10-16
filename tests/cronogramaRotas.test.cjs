const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const XLSX = require('xlsx');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function carregar(file, mocks = {}, cache = new Map()) {
  const p = path.resolve(file);
  if (cache.has(p)) return cache.get(p).exports;
  const mod = { exports: {} }; cache.set(p, mod);
  const code = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(r => {
    if (mocks[r]) return mocks[r];
    if (!r.startsWith('.')) return require(r);
    const rel = path.resolve(path.dirname(p), r);
    return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks, cache);
  }, mod, mod.exports);
  return mod.exports;
}
const lib = carregar('src/app/lib/cronogramaRotas.ts');
function fonte() {
  return { schema: 1, arquivo: 'Rotas.xlsx', abas: [
    { nome: 'Instituições', oculta: false, linhas: [['Título'], ['N.ROTA','Rota','Data inicial\nROTA','Data Final\nROTA','Data inicial\nVISITA','Data Final\nVISITA','Status','Organização / Comunidade','Município / Localidade','Estado'],
      ['9','ROTA 3','06/10/2026','09/10/2026','07/10/2026','08/10/2026','Confirmada','AASFLOR','Uruará','PA']] },
    { nome: 'Cronograma', oculta: false, linhas: [['Título'], ['Data','Dia da Semana','Equipe SEMAS','Equipe','','Rota','Dia','Origem','Instituição','Atividade','Horário Saída','Horário Chegada/Fim','Tempo: Origem - Comunidade','Tempo: Comunidade - Destino/Local Pernoite','Almoço','Modal','Pernoite','Observações / Pontos de Atenção'],
      ['06/10/2026','terça-feira'], ['07/10/2026','quarta-feira','Mariana, Cláudia','Mônica, Gabi','','ROTA 3','Dia 2','Uruará','AASFLOR','Atuação','08h00','17h00','','','','Carro','Uruará']] },
    { nome: 'Rota 3 - Aasflor', oculta: true, linhas: [['ROTA 1'], ['Instituições','Cidade'], ['AASFLOR','Uruará'], [], ['ROTEIRO LOGÍSTICO DETALHADO'], ['TRECHO','DATA','DESTINO ESPECÍFICO'], ['1','07/10/2026','Comunidade'], [], ['Lista de Hotéis','','Lista de Restaurantes'], ['Nome','','Nome'], ['Hotel A','','Restaurante B'], [], ['Check','Descrição','','Responsável'], ['FALSE','Reservar hotel','','Ana']] },
    { nome: 'Cenário Semas', oculta: true, linhas: [['Cenário antigo'], ['Data','Rota'], ['01/01/2026','ROTA 99']] },
  ] };
}
test('importação usa Rota, não N.ROTA; mantém equipe SEMAS separada e não mistura cenário oculto', () => {
  const d = fonte(), a = lib.analisarRotas(d);
  assert.deepEqual(a.numeros, ['3']); assert.equal(a.visitas.length, 1); assert.equal(a.dias.length, 1);
  assert.equal(a.dias[0].linha, 3); assert.equal(a.dias[0].data, '2026-10-07');
  assert.equal(a.dias[0].equipeSemas, 'Mariana, Cláudia'); assert.equal(a.dias[0].equipe, 'Mônica, Gabi');
  const blocos = lib.blocosDaRota(d.abas[2]);
  assert.deepEqual(blocos.map(b => b.titulo), ['Dados da visita','Roteiro logístico','Hospedagem e alimentação','Checklist']);
  assert.equal(blocos[3].tabela.linhas[0].linha, 13);
  assert.deepEqual(blocos[2].tabela.linhas.at(-1).valores, ['Hotel A','','Restaurante B']);
});
test('correção mantém fonte, coordenadas de linhas e históricos; aceita duas datas na mesma gravação', () => {
  const d = fonte(), antes = structuredClone(d);
  const e = lib.corrigirLinha(d, 'Instituições', 2, { 2:'10/10/2026', 3:'12/10/2026' });
  assert.deepEqual(d, antes); assert.equal(e.abas[0].linhas[2][2], '10/10/2026');
  assert.throws(() => lib.corrigirLinha(d, 'Instituições', 2, { 2:'10/10/2026' }), /anterior/);
  assert.throws(() => lib.corrigirLinha(d, 'Cronograma', 3, { 0:'31/02/2026' }), /data válida/);
  assert.throws(() => lib.corrigirLinha(d, 'Cronograma', 1, { 0:'alterado' }), /Linha inválida/);
  assert.throws(() => lib.validarDadosRotas({ ...d, abas: [] }), /abas/);
  assert.throws(() => lib.validarDadosRotas({ ...d, abas: [...d.abas, d.abas[0]] }), /repetidas/);
  assert.equal(lib.dataDaPlanilha('29/02/2024'), '2024-02-29');
  assert.equal(lib.dataDaPlanilha('29/02/2026'), null);
  const outraData = lib.corrigirLinha(d, 'Cronograma', 3, { 0: '08/10/2026' });
  assert.equal(outraData.abas[1].linhas[3][1], 'quinta-feira');
});

function ambiente(consulta = false) {
  let atual = null; const historico = []; let leituras = 0;
  const db = { from() { leituras++; return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: atual, error: null }) }; },
    async rpc(nome, p) {
      assert.equal(nome, 'salvar_cronograma_rotas');
      if (p.p_versao !== (atual?.versao ?? 0)) return { error: { message:'Alterado por outra pessoa' } };
      atual = { versao:p.p_versao + 1, dados:structuredClone(p.p_dados), autor:p.p_autor, atualizado_em:'2026-10-16T18:00:00Z' };
      historico.push(structuredClone(atual)); return { data:atual.versao, error:null };
    } };
  const mocks = {
    '@tanstack/react-start': { createServerFn: () => { const f = { validator() { return f; }, handler(h) { return args => h({ data: args?.data }); } }; return f; } },
    './sessao.server': { exigirSessao: async () => ({ displayName:'Equipe' }), exigirEscrita: async () => { if (consulta) throw new Error('Consulta sem escrita'); return { displayName:'Autor da sessão' }; } },
    '../integrations/supabase/client.server': { supabaseAdmin:db },
  };
  return { api: carregar('src/app/cronogramaRotas.server.ts', mocks), historico, get leituras() { return leituras; } };
}
function excel() {
  const wb = XLSX.utils.book_new();
  for (const a of fonte().abas) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(a.linhas), a.nome);
  return XLSX.write(wb, { type:'base64', bookType:'xlsx' });
}
test('Excel → prévia sem gravação → importação → correção → releitura; reimportação não duplica e conflito preserva dados', async () => {
  const { api, historico } = ambiente();
  const p = await api.preverImportacaoRotas({ data: { dataUrl:excel(), nomeArquivo:'Rotas.xlsx' } });
  assert.equal(p.resumo.rotas, 1); assert.equal(historico.length, 0);
  let salvo = await api.confirmarImportacaoRotas({ data: { dados:p.dados, versao:p.versaoAtual } });
  assert.equal(salvo.versao, 1); assert.equal(salvo.autor, 'Autor da sessão');
  salvo = await api.salvarLinhaRotas({ data: { versao:1, aba:'Cronograma', linha:3, alteracoes:{ 2:'SEMAS corrigida', 3:'Equipe interna corrigida' } } });
  assert.equal(salvo.dados.abas[1].linhas[3][2], 'SEMAS corrigida');
  assert.equal((await api.obterCronogramaRotas()).versao, 2);
  await assert.rejects(api.salvarLinhaRotas({ data:{ versao:1, aba:'Cronograma', linha:3, alteracoes:{ 3:'Obsoleto' } } }), /outra pessoa/);
  assert.equal(historico.length, 2); assert.equal(historico[0].dados.abas[1].linhas[3][2], 'Mariana, Cláudia');
  salvo = await api.confirmarImportacaoRotas({ data:{ dados:p.dados, versao:2 } });
  assert.equal(lib.analisarRotas(salvo.dados).dias.length, 1);
  assert.equal(historico.length, 3);
});
test('perfil de consulta não importa nem corrige, inclusive por chamada direta ao servidor', async () => {
  const a = ambiente(true);
  await assert.rejects(a.api.preverImportacaoRotas({ data:{ dataUrl:excel(), nomeArquivo:'Rotas.xlsx' } }), /Consulta/);
  await assert.rejects(a.api.confirmarImportacaoRotas({ data:{ versao:0, dados:fonte() } }), /Consulta/);
  await assert.rejects(a.api.salvarLinhaRotas({ data:{ versao:1, aba:'Cronograma', linha:3, alteracoes:{ 3:'Teste' } } }), /Consulta/);
  assert.equal(a.historico.length, 0); assert.equal(a.leituras, 0);
});
test('interface mostra equipes distintas e dados da fonte; consulta não recebe edição nem importação', () => {
  for (const readOnly of [false, true]) {
    const d = fonte();
    const { CronogramaRotas } = carregar('src/app/components/rotas/CronogramaRotas.tsx', {
      '@tanstack/react-query': { useQuery: () => ({ data:{ dados:d, versao:1, autor:'Equipe', atualizadoEm:'2026-10-16T18:00:00Z' } }), useQueryClient: () => ({}) },
      '../../auth/authStore': { useAuth: () => ({ readOnly }), usePeople: () => [] },
      '../../cronogramaRotas.server': {},
      '../../../components/ui/dialog': { Dialog: () => null },
    });
    const html = renderToStaticMarkup(React.createElement(CronogramaRotas));
    assert.match(html, /Equipe SEMAS/); assert.match(html, /Nossa equipe/); assert.match(html, /Mariana/); assert.match(html, /Mônica/);
    assert.equal(html.includes('Importar planilha'), !readOnly); assert.equal(html.includes('Editar dia'), !readOnly);
    assert.doesNotMatch(html, /ROTA 99/); assert.match(html, /Checklist/);
  }
});
