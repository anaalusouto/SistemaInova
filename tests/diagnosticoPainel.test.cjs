const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function carregar(arquivo, mocks = {}, cache = new Map()) {
  arquivo = path.resolve(arquivo);
  if (!path.extname(arquivo)) arquivo += fs.existsSync(arquivo + '.tsx') ? '.tsx' : '.ts';
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const m = { exports: {} }; cache.set(arquivo, m);
  const code = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(r => r in mocks ? mocks[r] : r.startsWith('.') ? carregar(path.resolve(path.dirname(arquivo), r), mocks, cache) : require(r), m, m.exports);
  return m.exports;
}
function elementos(no) {
  if (!no || typeof no !== 'object') return [];
  return [no, ...React.Children.toArray(no.props?.children).flatMap(elementos)];
}
function painel() {
  let filtro = 'Todos';
  const { FUNCOES_MATRIZ } = carregar('src/app/diagnostic/catalog/matrizPrototipo.ts');
  const { PainelMatriz } = carregar('src/app/components/diagnostic/PainelMatriz.tsx', { react: { ...React, useState: () => [filtro, valor => { filtro = valor; }] } });
  const linhas = FUNCOES_MATRIZ.map(f => ({ id: f.id, estado: 'Revisada', valores: { nomeFuncao: f.nome, atuacao: null, experiencia: 'Inicial', criticidade: f.id === 'F01' ? null : '4', interesse: '4', observacoes: null, externo: null } }));
  let selecionada;
  return { render: () => PainelMatriz({ linhas, desabilitado: false, onSelecionar: id => { selecionada = id; } }), selecionada: () => selecionada };
}
test('quadro posiciona apenas funções com os dois eixos informados e preserva campos ausentes', () => {
  const p = painel(); const html = renderToStaticMarkup(p.render());
  assert.match(html, /Criticidade 4, interesse 4: 20 funções/);
  assert.match(html, /Sem posição no quadro[^<]*F01/);
  assert.match(html, /Não informado/);
  assert.match(html, /Lacuna crítica/);
  assert.doesNotMatch(html, /Descrição e exemplo|Sem avaliação registrada|>Avaliação<|Caderno CRIA/);
});
test('filtro de grupo atualiza tabela, contagem e seleção da função', () => {
  const p = painel();
  elementos(p.render()).find(e => e.type === 'button' && e.props.children === 'Mercado').props.onClick();
  const filtrado = p.render(); const html = renderToStaticMarkup(filtrado);
  assert.match(html, /Criticidade 4, interesse 4: 6 funções/);
  assert.doesNotMatch(html, /Representação e articulação institucional|Sem posição no quadro/);
  elementos(filtrado).find(e => e.props['aria-label']?.startsWith('F14 ·')).props.onClick();
  assert.equal(p.selecionada(), 'F14');
});
test('IEO apresenta visão geral sem atribuir zero a dimensões ainda não respondidas', () => {
  const { IEO_DIMENSOES } = carregar('src/app/diagnostic/catalog/ieo.ts');
  const perguntaId = IEO_DIMENSOES[0].subdimensoes[0].perguntas[0].id;
  const { IeoTab } = carregar('src/app/components/diagnostic/IeoTab.tsx', {
    '../../diagnosticos.server': {},
    '@tanstack/react-query': { useQuery: () => ({ data: [{ perguntaId, nivel: 3, observacao: 'Relato confirmado' }] }), useMutation: () => ({}), useQueryClient: () => ({}) },
  });
  const html = renderToStaticMarkup(React.createElement(IeoTab, { diagnosticoId: 'd1', readOnly: true }));
  assert.match(html, /Todas as dimensões/); assert.match(html, /3,0/); assert.match(html, /Relato confirmado/);
  assert.match(html, /Sem pontuação/); assert.doesNotMatch(html, /<textarea|>Salvar</);
});
