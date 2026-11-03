const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function carregar(arquivo, mocks = {}, cache = new Map()) {
  arquivo = path.resolve(arquivo);if(arquivo.endsWith('.css'))return {};
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
  const { PainelMatriz } = carregar('src/app/components/diagnostic/PainelMatriz.tsx', { '../plano/useLargurasTabela': {useLargurasTabela:()=>({tabelaRef:null,larguras:null,controles:()=>({}),restaurar(){}})}, react: { ...React, useState: () => [filtro, valor => { filtro = valor; }] } });
  const linhas = FUNCOES_MATRIZ.map(f => ({ id: f.id, estado: 'Revisada', valores: { nomeFuncao: f.nome, atuacao: null, experiencia: 'Inicial', criticidade: f.id === 'F01' ? null : '4', interesse: '4', observacoes: null, externo: null } }));
  let selecionada;
  return { render: () => PainelMatriz({ linhas, desabilitado: false, onSelecionar: id => { selecionada = id; } }), selecionada: () => selecionada };
}
test('aba de implantação mostra registros da aplicação sem incluir funcionamento ou interesse futuro', () => {
  const produto = (id, nome) => ({ id, nome, respostas: {}, categoriaId: null, safra: { estado: 'nao_informada', intervalos: [] } });
  const produtos = [produto('p1', 'Mel'), produto('p2', 'Polpa'), produto('p3', 'Turismo')];
  const registro = (contexto, codigo, valor, relato = '') => ({ contexto, codigo, resposta: { valor, relato, selecoes: [], fonte: '', respondentes: '' } });
  const registros = [registro('p1','PR_SITUACAO','Funcionamento'), registro('p2','PR_SITUACAO','Implantação'), registro('p3','PR_SITUACAO','Futuro'), registro('p2','PR_CODIGO','PR02'), registro('p2','PR_OPERACAO','OP02'), registro('OP02','IM01','Em andamento','O que existe: Estrutura registrada')];
  const { CestaCaderno } = carregar('src/app/components/diagnostic/CestaCaderno.tsx', {
    react: { ...React, useState: inicial => [typeof inicial === 'function' ? inicial() : inicial, () => {}] },
    '@tanstack/react-query': { useQuery: ({queryKey}) => ({ data: queryKey[0] === 'diagnostico-produtos' ? produtos : [] }), useMutation: () => ({}), useQueryClient: () => ({}) },
    '../../diagnosticos.server': {},
    './CadernoItens': { useCaderno: () => ({data: registros}), CadernoItens: () => null },
    './DadosComerciaisCesta': { DadosComerciaisCesta: () => null },
    '../PendenciasModulo': { usePendenciaModulo() {}, navegarSemPendencias: (_, fn) => fn() },
  });
  const html = renderToStaticMarkup(CestaCaderno({ diagnosticoId: 'd1', organizacaoId: 'o1', readOnly: true, somenteImplantacao: true }));
  assert.match(html, /PR02 · Polpa/);
  assert.match(html, /OP02/);
  assert.match(html, /IM01/);
  assert.match(html, /Estrutura registrada/);
  assert.doesNotMatch(html, /Turismo|>Mel</);
});
test('gráfico agrupa funções por leitura e preserva campos ausentes', () => {
  const p = painel(); const html = renderToStaticMarkup(p.render());
  assert.match(html, /Lacuna crítica: 20 funções/);
  assert.match(html, /Completar avaliação: 1 funções/);
  assert.doesNotMatch(html, /Criticidade × Interesse/);
  assert.match(html, /Não informado/);
  assert.match(html, /Lacuna crítica/);
  assert.match(html, /data-label="Avaliação"/);
  assert.doesNotMatch(html, /Como a leitura da Matriz é calculada/);
});
test('filtro de grupo atualiza tabela, contagem e seleção da função', () => {
  const p = painel();
  elementos(p.render()).find(e => e.type === 'button' && e.props.children === 'Mercado').props.onClick();
  const filtrado = p.render(); const html = renderToStaticMarkup(filtrado);
  assert.match(html, /Lacuna crítica: 20 funções/);
  assert.doesNotMatch(html, /Representação e articulação institucional|Sem posição no quadro/);
  elementos(filtrado).find(e => e.type === 'button' && e.props.className === 'diagnostico-funcao' && React.Children.toArray(e.props.children).some(c => c.props?.children === 'F14')).props.onClick();
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
