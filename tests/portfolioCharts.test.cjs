const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function carregar(arquivo, mocks = {}, cache = new Map()) {
  arquivo = path.resolve(arquivo);
  if (!path.extname(arquivo)) arquivo += '.tsx';
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const modulo = { exports: {} };
  cache.set(arquivo, modulo);
  const codigo = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(
    nome => nome in mocks ? mocks[nome] : nome.startsWith('.') ? carregar(path.resolve(path.dirname(arquivo), nome), mocks, cache) : require(nome),
    modulo,
    modulo.exports,
  );
  return modulo.exports;
}

const graficos = carregar('src/app/components/portfolio/GraficosAcompanhamento.tsx', {
  react: { useMemo: fn => fn() },
  recharts: Object.fromEntries(['Area','AreaChart','Bar','BarChart','CartesianGrid','Cell','LabelList','Legend','Pie','PieChart','ResponsiveContainer','Tooltip','XAxis','YAxis'].map(k => [k, () => null])),
  '../../lib/planoTrabalho': { faixaRisco: () => 'Baixo', riscoEmAberto: () => true, prazoDaMeta: meta => ({ fim: meta.plannedEnd ?? meta.deliverables?.[0]?.plannedEnd ?? null }) },
  '../../lib/resumoPlanoPortfolio': { conclusaoEtapas: p => p.testEtapas },
  '../../lib/conclusaoPlano': { resumirConclusao: () => ({ concluido: false }) },
});

function projeto(id, { approved = 100, executed = 50, steps = { concluidas: 1, total: 2 }, approvedKnown = true, executedKnown = true } = {}) {
  return {
    id: `p-${id}`, code: `P-${id}`, org: `Org ${id}`, organizacao: { id: `org-${id}`, nome: `Organização ${id}` },
    budgetApproved: approved, budgetExecuted: executed, budgetApprovedInformado: approvedKnown, budgetExecutedInformado: executedKnown,
    testEtapas: steps, financialItems: [], orcamentoNotas: [], risks: [], goals: [],
  };
}

test('avanço inclui todas as organizações com ao menos uma medida, sem zeros fictícios ou limite de oito', () => {
  const projetos = Array.from({ length: 10 }, (_, i) => projeto(i + 1));
  projetos.push(
    projeto('etapas', { steps: { concluidas: 3, total: 4 }, approvedKnown: false, executedKnown: false }),
    projeto('financeiro', { steps: { concluidas: 0, total: 0 } }),
  );
  const linhas = graficos.dadosAvanco(projetos);
  assert.equal(linhas.length, 12);
  assert.equal(linhas.find(l => l.id === 'org-etapas').percentualEtapas, 75);
  assert.equal(linhas.find(l => l.id === 'org-etapas').percentualFinanceiro, null);
  assert.equal(linhas.find(l => l.id === 'org-financeiro').percentualEtapas, null);
  assert.equal(linhas.find(l => l.id === 'org-financeiro').percentualFinanceiro, 50);
});

test('orçamento inclui todas as dotações não nulas e distingue parcial, zero e não informado', () => {
  const projetos = Array.from({ length: 10 }, (_, i) => projeto(i + 1));
  const parcialA = projeto('parcial-a', { approved: 25, executed: 0, executedKnown: false });
  const parcialB = projeto('parcial-b', { approved: 0, executed: 0, approvedKnown: false, executedKnown: false });
  parcialB.organizacao = parcialA.organizacao;
  projetos.push(parcialA, parcialB,
    projeto('sem-orcamento', { approved: 0, executed: 0, approvedKnown: false, executedKnown: false }),
    projeto('zero', { approved: 0, executed: 0 }),
  );
  const resumo = graficos.dadosOrcamentoOrganizacao(projetos);
  assert.equal(resumo.linhas.length, 11);
  const parcial = resumo.linhas.find(l => l.id === 'org-parcial-a');
  assert.equal(parcial.aprovados, 25);
  assert.equal(parcial.aprovadoCompleto, false);
  assert.equal(parcial.executados, null);
  assert.equal(resumo.semOrcamento, 1);
  assert.equal(resumo.orcamentoZero, 1);
});

test('previsto mensal vem do item orçamentário vinculado ao prazo da meta, e executado vem das notas', () => {
  const projeto = {
    id: 'p-real', goals: [{ id: 'meta-1', plannedEnd: '2026-04-30', deliverables: [] }],
    orcamentoItens: [
      { id: 'i1', metaId: 'meta-1', valorPlanejado: 1000, valorProposto: 1300, situacao: 'Ativo', vigente: true, dataCompra: '2026-01-15' },
      { id: 'i2', metaId: null, valorPlanejado: 9000, valorProposto: 9000, situacao: 'Ativo', vigente: true },
      { id: 'i3', metaId: 'meta-2', valorPlanejado: 8000, valorProposto: 8000, situacao: 'Ativo', vigente: true },
    ],
    // Data/valor do orçamento legado não devem substituir o cronograma de metas nem as notas.
    financialItems: [{ date: '01/2026', plannedValue: 9000, executedValue: 9000 }],
    orcamentoNotas: [{ dataEmissao: '2026-02-10', valor: 250 }],
  };
  const serie = graficos.dadosMensais([projeto], false);
  assert.deepEqual(serie.anos, [2026]);
  assert.equal(serie.acumulados[0].previsto, null);
  assert.equal(serie.acumulados[1].executado, 250);
  assert.equal(serie.acumulados[2].previsto, null);
  assert.equal(serie.acumulados[3].previsto, 1000);
  assert.equal(serie.acumulados[11].previsto, 1000);
  assert.equal(serie.previstosAlocados, 1);
  assert.equal(serie.previstosSemVinculo, 2);
});

test('acumula valores em ordem cronológica entre anos', () => {
  const serie = graficos.dadosMensais([{ goals: [], orcamentoItens: [], orcamentoNotas: [
    { dataEmissao: '2025-12-01', valor: 100 },
    { dataEmissao: '2026-01-01', valor: 50 },
  ] }], false);
  assert.equal(serie.acumulados[11].executado, 100);
  assert.equal(serie.acumulados[12].executado, 150);
  assert.match(serie.acumulados[12].mes, /2026/);
});
