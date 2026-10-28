const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function carregar(file, mocks = {}, cache = new Map()) {
  const p = path.resolve(file);
  if (cache.has(p)) return cache.get(p).exports;
  const mod = { exports: {} }; cache.set(p, mod);
  const codigo = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', codigo)(r => {
    if (mocks[r]) return mocks[r];
    if (r.startsWith('@/')) {
      const rel = path.resolve('src', r.slice(2));
      return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks, cache);
    }
    if (!r.startsWith('.')) return require(r);
    const rel = path.resolve(path.dirname(p), r);
    return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks, cache);
  }, mod, mod.exports);
  return mod.exports;
}
const filtros = carregar('src/app/lib/portfolioFilters.ts');
const { resumoPlanoPortfolio } = carregar('src/app/lib/resumoPlanoPortfolio.ts');
const projetos = () => [{
  id: 1, name: 'Projeto real', org: 'Comunidade Real', code: 'REAL', status: 'Em andamento', progress: 50,
  startDate: '', endDate: '', budgetApproved: 100, budgetExecuted: 20,
  risks: [], changes: [], financialItems: [], goals: [{ id: 'm1', deliverables: [
    { id: 'e1', activities: [{ id: 'a1', status: 'Concluído' }, { id: 'a2', status: 'A iniciar' }] },
    { id: 'e2', activities: [] },
  ] }],
}];

test('dashboard inclui todas as comunidades por padrão, sem excluir projetos sem prazo; seleção vazia não volta a mostrar tudo', () => {
  const lista = [...projetos(), { ...projetos()[0], id: 2, org: 'Outra comunidade', startDate: '2025-01-01', endDate: '2025-12-31' }];
  const padrao = filtros.emptyPortfolioFilters();
  assert.equal(padrao.org, null);
  assert.equal(padrao.periodStart, null); assert.equal(padrao.periodEnd, null);
  assert.equal(padrao.exercicioKey, null);
  assert.deepEqual(filtros.applyPortfolioFilters(lista, padrao), lista);
  assert.deepEqual(filtros.applyPortfolioFilters(lista, { ...padrao, org: [] }), []);
  assert.deepEqual(filtros.applyPortfolioFilters(lista, { ...padrao, org: ['Outra comunidade'] }).map(p => p.id), [2]);
  lista.push({ ...lista[0], id: 3, org: 'Nova comunidade' });
  assert.equal(filtros.applyPortfolioFilters(lista, padrao).length, 3);
});

test('contadores do dashboard refletem concluir e reabrir atividades e grupos, sem concluir grupos vazios', () => {
  const lista = projetos();
  assert.deepEqual(resumoPlanoPortfolio(lista).map(r => [r.concluidas, r.total]), [[0, 1], [0, 2], [1, 2]]);
  lista[0].goals[0].deliverables[0].activities[1].status = 'Concluído';
  assert.deepEqual(resumoPlanoPortfolio(lista).map(r => r.concluidas), [1, 1, 2]);
  lista[0].goals[0].deliverables[0].activities[0].status = 'Em andamento';
  assert.deepEqual(resumoPlanoPortfolio(lista).map(r => r.concluidas), [0, 0, 1]);
  assert.deepEqual(resumoPlanoPortfolio([]).map(r => [r.concluidas, r.total]), [[0, 0], [0, 0], [0, 0]]);
});

test('filtro mostra todas selecionadas, retira controles de período e permite retirar uma comunidade ou todas', () => {
  const { PortfolioFilters } = carregar('src/app/components/portfolio/PortfolioFilters.tsx');
  const mudancas = [];
  const props = { exercicios: [{ key: '2026-2026', label: '2026' }], statusOptions: [], orgOptions: ['Org A', 'Org B'], classificacaoOptions: [], filters: filtros.emptyPortfolioFilters(), onChange: d => mudancas.push(d), onClear() {} };
  const html = renderToStaticMarkup(React.createElement(PortfolioFilters, props));
  assert.match(html, /aria-pressed="true"[^>]*>[\s\S]*?Org A/);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Período|Jan\/2026|Dez\/2026/);
  const arvore = PortfolioFilters(props);
  function achar(n, pred) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { for (const c of n) { const r = achar(c, pred); if (r) return r; } return; }
    return pred(n) ? n : achar(n.props?.children, pred);
  }
  achar(arvore, n => n.props?.children === 'Org A').props.onClick();
  assert.deepEqual(mudancas.at(-1).org, ['Org B']);
  achar(arvore, n => n.props?.children === 'Desmarcar todas').props.onClick();
  assert.deepEqual(mudancas.at(-1).org, []);
  achar(arvore, n => n.props?.children === 'Selecionar todas').props.onClick();
  assert.equal(mudancas.at(-1).org, null);
  achar(arvore, n => n.type === 'select').props.onChange({ target: { value: '2026-2026' } });
  assert.equal(mudancas.at(-1).periodStart, null); assert.equal(mudancas.at(-1).periodEnd, null);
});

test('dashboard abre com dados reais e mostra a conclusão atual sem recorte de período escondido', () => {
  const reais = projetos(); const graficos = [];
  const nomes = ['AreaChart', 'Area', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer', 'PieChart', 'Pie', 'Cell', 'BarChart', 'Bar', 'Legend', 'Line', 'LineChart', 'Scatter', 'ScatterChart'];
  const recharts = Object.fromEntries(nomes.map(nome => [nome, ({ children, data }) => {
    if (data) graficos.push(data);
    return React.createElement('div', null, children);
  }]));
  const { PortfolioView } = carregar('src/app/components/PortfolioView.tsx', {
    '../store': { useStore: () => ({ projects: reais, projectsLoading: false }) }, recharts,
    '../auth/authStore': { useAuth: () => ({ readOnly: true }) },
  });
  let html = renderToStaticMarkup(React.createElement(PortfolioView));
  assert.match(html, /aria-pressed="true"[^>]*>Dados reais/);
  assert.doesNotMatch(html, /Dados simulados|PERÍODO/);
  assert.match(html, /Comunidade Real/);
  assert.match(html, /Minhas visualizações/); assert.match(html, /Personalizar visualizações/);
  assert.doesNotMatch(html, /Acompanhamento dos projetos/);
  assert.match(html, /Metas concluídas/); assert.match(html, /Etapas concluídas/); assert.match(html, /Atividades concluídas/);
  assert.ok(graficos.flat().some(row => row.name === 'Comunidade Real' && row.fisico === 50));
  reais[0].goals[0].deliverables[0].activities[1].status = 'Concluído'; reais[0].progress = 100;
  graficos.length = 0;
  html = renderToStaticMarkup(React.createElement(PortfolioView));
  assert.ok(graficos.flat().some(row => row.name === 'Comunidade Real' && row.fisico === 100));
  assert.match(html, /Atividades concluídas[\s\S]*?>2 /);
  reais[0].status = 'Suspenso';
  graficos.length = 0;
  html = renderToStaticMarkup(React.createElement(PortfolioView));
  assert.ok(graficos.flat().some(row => row.name === 'Suspenso' && row.value === 1));
  assert.ok(graficos.flat().some(row => row.name === 'Em andamento' && row.value === 0));
  assert.match(html, /Suspenso/);
  assert.doesNotMatch(html, /Alterar status de/);
  assert.equal(filtros.applyPortfolioFilters(reais, { ...filtros.emptyPortfolioFilters(), status: ['Em andamento'] }).length, 0);
  assert.equal(filtros.applyPortfolioFilters(reais, { ...filtros.emptyPortfolioFilters(), status: ['Suspenso'] }).length, 1);
});
