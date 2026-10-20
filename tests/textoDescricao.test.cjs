const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
const source = fs.readFileSync('src/app/lib/textoDescricao.ts', 'utf8');
new Function('exports', ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(mod.exports);
const { formatarTextoDescricao: formatar } = mod.exports;

test('recompõe linhas e espaços de PDF sem perder parágrafos, números ou hífens', () => {
  const texto = '  Comunidades   com\r\n renda\tlocal e pós-\r\npesca.\r\n\r\n\r\n Valor:\u00a0R$ 1.234,56; 73%. ';
  const antes = texto;
  assert.deepEqual(formatar(texto, 'Contexto').blocos, [
    { tipo: 'paragrafo', texto: 'Comunidades com renda local e pós-pesca.' },
    { tipo: 'paragrafo', texto: 'Valor: R$ 1.234,56; 73%.' },
  ]);
  assert.equal(texto, antes);
  assert.deepEqual(formatar(0, 'Pessoas').blocos, [{ tipo: 'paragrafo', texto: '0' }]);
});

test('mantém marcadores, continuação dos itens e parágrafo após uma lista', () => {
  assert.deepEqual(formatar('Resultados:\n\n● Formação\ncomunitária.\n\n● Produção local.\n\nSão resultados previstos.', 'Impactos').blocos, [
    { tipo: 'paragrafo', texto: 'Resultados:' },
    { tipo: 'lista', ordenada: false, itens: [{ texto: 'Formação comunitária.' }, { texto: 'Produção local.' }] },
    { tipo: 'paragrafo', texto: 'São resultados previstos.' },
  ]);
  assert.deepEqual(formatar('2. Primeira ação\n5) Outra ação\n- Item sem número', 'Metas').blocos, [
    { tipo: 'lista', ordenada: true, itens: [{ numero: 2, texto: 'Primeira ação' }, { numero: 5, texto: 'Outra ação' }] },
    { tipo: 'lista', ordenada: false, itens: [{ texto: 'Item sem número' }] },
  ]);
});

test('separa orientação com parênteses internos e evita apenas o título inicial idêntico', () => {
  const valor = 'Saberes locais\n (Instrução: Explique os saberes (inclusive culturais)\ne práticas).\n\nResposta preservada.';
  assert.deepEqual(formatar(valor, 'Saberes locais'), {
    orientacao: '(Instrução: Explique os saberes (inclusive culturais) e práticas)',
    blocos: [{ tipo: 'paragrafo', texto: 'Resposta preservada.' }],
  });
  assert.equal(formatar('(Instrução: texto incompleto', 'Campo').orientacao, undefined);
  assert.equal(formatar('Outro título\nResposta', 'Campo').blocos[0].texto, 'Outro título Resposta');
});
