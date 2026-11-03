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
  '../../lib/planoTrabalho': { faixaRisco: () => 'Baixo', riscoEmAberto: () => true },
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
