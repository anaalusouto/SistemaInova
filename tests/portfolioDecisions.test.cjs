const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Executa os módulos TS sem carregar o store, o navegador ou o banco.
const cache = new Map();
function loadTs(file) {
  const absolute = path.resolve(__dirname, '..', file.endsWith('.ts') ? file : `${file}.ts`);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const mod = { exports: {} };
  cache.set(absolute, mod);
  const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  new Function('require', 'module', 'exports', compiled.outputText)(
    request => loadTs(path.resolve(path.dirname(absolute), request)), mod, mod.exports,
  );
  return mod.exports;
}
const { buildDecisionCharts } = loadTs('src/app/lib/portfolioDecisions');
const { portfolioDemo } = loadTs('src/app/data/portfolioDemo');
const reference = new Date(2026, 9, 2, 12);
const project = (overrides = {}) => ({
  org: 'Organização A', code: '01-2026', budgetApproved: 100, budgetExecuted: 60,
  progress: 30, status: 'Em andamento', risks: [], endDate: '2026-10-31', ...overrides,
});

test('dados demonstrativos têm um projeto por organização e totais financeiros consistentes', () => {
  assert.equal(portfolioDemo.length, 12);
  assert.equal(new Set(portfolioDemo.map(p => p.org)).size, portfolioDemo.length);
  for (const p of portfolioDemo) {
    assert.equal(p.financialItems.reduce((sum, i) => sum + i.plannedValue, 0), p.budgetApproved);
    assert.equal(p.financialItems.reduce((sum, i) => sum + i.executedValue, 0), p.budgetExecuted);
    assert.ok(p.financialItems.every(i => i.executedValue >= 0 && i.plannedValue >= 0));
    assert.ok(p.financialItems.slice(9).every(i => i.executedValue === 0));
  }
});

test('orçamento e percentuais não contam organizações duas vezes nem dividem por zero', () => {
  const result = buildDecisionCharts([project(), project({ budgetApproved: 0, budgetExecuted: 0 })], reference);
  assert.deepEqual(result.budgets, [{ name: 'Organização A', previsto: 100, executado: 60, saldo: 40 }]);
  assert.equal(result.progress.length, 1);
  assert.deepEqual(result.progress[0], { name: 'Organização A', fisico: 30, financeiro: 60, diferenca: 30 });
});

test('riscos seguem as faixas do projeto e excluem encerrados', () => {
  const risks = [0, 3, 4, 8, 9, 14, 15, 25].map(severity => ({ category: 'Financeiro', severity, status: 'Aberto' }));
  risks.push({ category: 'Financeiro', severity: 25, status: 'Encerrado' });
  const result = buildDecisionCharts([project({ risks })], reference);
  assert.deepEqual(result.risks, [{ name: 'Financeiro', baixo: 1, medio: 2, alto: 2, critico: 2, semNivel: 1 }]);
});

test('prazos respeitam limites, mês sem dia, datas inválidas e projetos concluídos', () => {
  const endDates = ['2026-10-01', '2026-10-02', '2026-11-01', '2026-11-02', '2026-12-01', '2026-12-02', '2026-12-31', '2027-01-01', '10/2026', '31/02/2026', ''];
  const result = buildDecisionCharts([
    ...endDates.map(endDate => project({ endDate })),
    project({ endDate: '2026-01-01', status: 'Concluído' }),
  ], reference);
  assert.deepEqual(result.deadlines.map(d => d.projetos), [1, 3, 2, 2, 1, 2]);
});

test('recorte vazio produz séries vazias e prazos zerados', () => {
  const result = buildDecisionCharts([], reference);
  assert.deepEqual(result.budgets, []);
  assert.deepEqual(result.progress, []);
  assert.deepEqual(result.risks, []);
  assert.ok(result.deadlines.every(d => d.projetos === 0));
});

test('abreviações seguem os nomes dos projetos e não mudam ao normalizar novamente', () => {
  const { nomeCurtoOrg } = loadTs('src/app/lib/navegacaoOrg');
  const cases = [
    ['Associação de Desenvolvimento Comunitário de Santa Maria do Pará (ADESC/PA)', 'ADESC'],
    ['Associação de Trabalhadores Rurais de Tauari (ATRT)', 'TAUARI'],
    ['Associação Mulheres Indígenas do Gurupi', 'AMIG'],
    ['COPASMIG — São Miguel do Guamá', 'COOPASMIG'],
    ['Cooperativa Amazônia Agroindustrial Viseu Pará (COOPAVISEU)', 'COOPAVISEU'],
    ['ACREPAF — Jacundá', 'ACREPAF'],
    ['CAANP-AGROMEL (2ª rota)', 'CAANP AGROMEL'],
    ['Nova Betel', 'NOVA BETEL'],
  ];
  for (const [fullName, abbreviation] of cases) {
    assert.equal(nomeCurtoOrg(fullName), abbreviation);
    assert.equal(nomeCurtoOrg(abbreviation), abbreviation);
  }
});

test('busca encontra organizações pela sigla, nome completo e projeto', () => {
  const { filtrarOrganizacoes, FILTROS_VAZIOS } = loadTs('src/app/lib/organizacoes');
  const org = {
    id: 'org-1', codigo: '01', nome: 'AMIG', nomeCompleto: 'Associação Mulheres Indígenas do Gurupi',
    categoria: 'Indígena', tipo: 'Associação', municipio: 'Gurupi', uf: 'PA', status: 'Ativa', pendentes: 0,
    projetos: [{ id: 1, codigo: '01-2026', nome: 'Artesanato comunitário', coordenador: 'Equipe regional' }],
  };
  for (const busca of ['amig', 'mulheres indigenas', 'artesanato']) {
    assert.deepEqual(filtrarOrganizacoes([org], { ...FILTROS_VAZIOS, busca }), [org]);
  }
  assert.deepEqual(filtrarOrganizacoes([org], { ...FILTROS_VAZIOS, busca: 'inexistente' }), []);
});
