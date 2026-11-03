const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, cache = new Map()) {
  file = path.resolve(file);
  if (!path.extname(file)) file += fs.existsSync(file + '.ts') ? '.ts' : '.tsx';
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', code)((name) => name.startsWith('.')
    ? load(path.resolve(path.dirname(file), name), cache)
    : require(name), module, module.exports);
  return module.exports;
}

const record = (codigo, valor, contexto = '') => ({ codigo, contexto, resposta: { valor } });

test('nota consolidada repondera componentes disponíveis e não mistura outras aplicações', () => {
  const { calcularNotaConsolidada } = load('src/app/diagnostic/notaConsolidada.ts');
  const ieo = Array.from({ length: 25 }, (_, i) => record(`Q${String(i + 1).padStart(2, '0')}`, '4'));
  const registros = [...ieo, record('F01', '2'), record('C01', '1', 'produto-fora-da-aplicacao')];
  const resultado = calcularNotaConsolidada(registros, []);
  assert.equal(resultado.pesoDisponivel, 0.75);
  assert.equal(resultado.nota, 10 / 3);
  assert.equal(resultado.componentes.find((c) => c.id === 'cesta').nota, null);
  assert.equal(resultado.parcial, true);
});

test('Cesta só agrega C01–C12 de produtos em funcionamento incluídos na aplicação', () => {
  const { calcularNotaConsolidada } = load('src/app/diagnostic/notaConsolidada.ts');
  const { FUNCOES_MATRIZ } = load('src/app/diagnostic/catalog/matrizPrototipo.ts');
  const produto = 'produto-atual';
  const registros = [
    ...Array.from({ length: 25 }, (_, i) => record(`Q${String(i + 1).padStart(2, '0')}`, '2')),
    ...FUNCOES_MATRIZ.map((f) => record(f.id, '2')),
    record('PR_SITUACAO', 'Funcionamento', produto),
    ...Array.from({ length: 12 }, (_, i) => record(`C${String(i + 1).padStart(2, '0')}`, '3', produto)),
    record('C01', '1', 'produto-antigo'),
  ];
  const resultado = calcularNotaConsolidada(registros, [{ id: produto }]);
  assert.equal(resultado.componentes.find((c) => c.id === 'cesta').nota, 3);
  assert.equal(resultado.componentes.find((c) => c.id === 'cesta').pontuadas, 12);
  assert.equal(resultado.nota, 2.25);
  assert.equal(resultado.parcial, false);
});

test('indicadores distinguem ausência, pendência, valores válidos e situações sem nota', () => {
  const { situacaoIndicador } = load('src/app/diagnostic/situacaoIndicador.ts');
  assert.equal(situacaoIndicador().texto, 'Ausente');
  assert.equal(situacaoIndicador({ valor: null }).texto, 'Pendente');
  assert.equal(situacaoIndicador({ valor: '3' }).simbolo, '3');
  assert.equal(situacaoIndicador({ valor: 'NA' }).texto, 'Não aplicável');
  assert.equal(situacaoIndicador({ valor: 'NC' }).texto, 'Não coletado');
  assert.match(situacaoIndicador({ valor: 'D' }).texto, /Divergência/);
});
