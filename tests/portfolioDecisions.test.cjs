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

test('projeto da organização exige vínculo único e rejeita ID de outra organização', () => {
  const { resolverProjetoOrg } = loadTs('src/app/lib/navegacaoOrg');
  const projetos = [{ id: 101 }, { id: 202 }];
  const antes = JSON.stringify(projetos);
  assert.deepEqual(resolverProjetoOrg([]), { estado: 'sem-projeto', ids: [] });
  assert.deepEqual(resolverProjetoOrg([projetos[0]]), { estado: 'unico', projeto: projetos[0] });
  assert.deepEqual(resolverProjetoOrg([projetos[0]], 202), { estado: 'vinculo-invalido', ids: [101] });
  assert.deepEqual(resolverProjetoOrg(projetos, 101), { estado: 'conflito', ids: [101, 202] });
  assert.equal(JSON.stringify(projetos), antes);
});

test('Gestão Interna preserva ordem Projeto, Diagnóstico e Relatórios', () => {
  const { SUBAREAS_GESTAO } = loadTs('src/app/lib/gestaoInterna');
  assert.deepEqual(SUBAREAS_GESTAO.map(s => s.label), ['Projeto', 'Diagnóstico', 'Relatórios']);
  assert.equal(new Set(SUBAREAS_GESTAO.map(s => s.id)).size, 3);
});

test('criação exige organização e atualização rejeita todos os formatos de vínculo', () => {
  const { exigirOrganizacaoNaCriacao, validarPatchVinculo } = loadTs('src/app/lib/vinculoProjeto');
  for (const valor of [null, undefined, '', '  ', 12]) assert.throws(() => exigirOrganizacaoNaCriacao(valor), /Selecione a organização/);
  assert.equal(exigirOrganizacaoNaCriacao(' org-a '), 'org-a');
  for (const campo of ['comunidadeId', 'comunidade_id', 'communityId', 'organizacao', 'org']) {
    assert.throws(() => validarPatchVinculo({ [campo]: 'org-b' }), /não pode ser alterado/);
  }
  assert.doesNotThrow(() => validarPatchVinculo({ name: 'Projeto', driveLink: 'https://example.org' }));
});

test('relatórios externos aceitam HTTP(S) e rejeitam execução de código e credenciais na URL', () => {
  const { normalizarLinkRelatorio } = loadTs('src/app/lib/relatoriosOrg');
  assert.equal(normalizarLinkRelatorio('  https://example.org/relatorio.pdf  '), 'https://example.org/relatorio.pdf');
  assert.equal(normalizarLinkRelatorio(' '), null);
  for (const link of ['javascript:alert(1)', 'data:text/html,test', 'file:///doc.pdf', 'ftp://example.org/doc', 'https://user:pass@example.org', 'doc.pdf']) {
    assert.throws(() => normalizarLinkRelatorio(link), /link externo válido/);
  }
});

test('plano começa recolhido; expansão e filtro preservam IDs, folhas e numeração', () => {
  const { CRITERIOS_VAZIOS, idsRecolhiveis, recolhidosDe, tudoExpandido, filtrarPlano, codigosHierarquicos } = loadTs('src/app/lib/planoTrabalho');
  const metas = [{ id: 'meta-a', name: 'Meta', deliverables: [{ id: 'etapa-a', name: 'Etapa', activities: [
    { id: 'atividade-a', name: 'Oficina', responsible: 'Ana', status: 'Em andamento', budgetLink: 'Não informado', tasks: [{ id: 'tarefa-a', title: 'Preparação' }] },
    { id: 'atividade-b', name: 'Entrega', responsible: 'Bia', status: 'A iniciar', budgetLink: 'Não informado', tasks: [] },
  ] }] }];
  const antes = JSON.stringify(metas);
  const ids = idsRecolhiveis(metas);
  assert.deepEqual([...recolhidosDe(ids, new Set())], ['meta-a', 'etapa-a', 'atividade-a']);
  assert.equal(tudoExpandido(ids, new Set()), false);
  assert.equal(tudoExpandido(ids, new Set(ids)), true);
  assert.equal(recolhidosDe(ids, new Set(ids)).size, 0);
  const codigosAntes = [...codigosHierarquicos(metas)];
  const resultado = filtrarPlano(metas, [], { ...CRITERIOS_VAZIOS, busca: 'preparacao', responsaveis: ['Ana'], status: ['Em andamento'] });
  assert.deepEqual(resultado.flatMap(m => m.deliverables.flatMap(e => e.activities.map(a => a.id))), ['atividade-a']);
  assert.equal(resultado[0].deliverables[0].activities[0], metas[0].deliverables[0].activities[0]);
  assert.deepEqual([...codigosHierarquicos(metas)], codigosAntes);
  assert.equal(JSON.stringify(metas), antes);
});

test('organizações: busca, filtros combinados, limpeza e ordenação preservam IDs e dados', () => {
  const { FILTROS_VAZIOS, filtrarOrganizacoes, ordenarOrganizacoes } = loadTs('src/app/lib/organizacoes');
  const a = { id: 'org-a', codigo: 'ORG-01', nome: 'Árvore', categoria: 'Indígena', tipo: 'Associação', uf: 'PA', status: 'Ativa', projetos: [] };
  const b = { id: 'org-b', codigo: 'ORG-02', nome: 'Buriti', categoria: 'Quilombola', tipo: 'Cooperativa', uf: 'MA', status: 'Concluída', projetos: [] };
  const lista = [b, a];
  const antes = JSON.stringify(lista);
  for (const busca of ['arvore', 'ORG-01']) assert.deepEqual(filtrarOrganizacoes(lista, { ...FILTROS_VAZIOS, busca }).map(o => o.id), ['org-a']);
  assert.deepEqual(filtrarOrganizacoes(lista, { ...FILTROS_VAZIOS, categorias: ['Indígena'], tipos: ['Associação'], ufs: ['PA'], situacoes: ['Ativa'] }).map(o => o.id), ['org-a']);
  assert.deepEqual(filtrarOrganizacoes(lista, { ...FILTROS_VAZIOS, categorias: ['Indígena'], ufs: ['MA'] }), []);
  assert.equal(filtrarOrganizacoes(lista, FILTROS_VAZIOS).length, 2);
  for (const coluna of ['nome', 'categoria', 'tipo']) {
    const asc = ordenarOrganizacoes(lista, coluna, 'asc').map(o => o.id);
    const desc = ordenarOrganizacoes(lista, coluna, 'desc').map(o => o.id);
    assert.deepEqual(desc, [...asc].reverse());
    assert.deepEqual([...asc].sort(), ['org-a', 'org-b']);
  }
  assert.equal(JSON.stringify(lista), antes);
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

test('AT-007: os mesmos filtros preservam indicadores e gráficos derivados do conjunto selecionado', () => {
  const { applyPortfolioFilters, emptyPortfolioFilters } = loadTs('src/app/lib/portfolioFilters');
  const { buildKpi } = loadTs('src/app/data/mockData');
  const { buildFinancialTimeline } = loadTs('src/app/lib/financialTimeline');
  const a = project({ id: 101, name: 'Projeto A', org: 'Org A', segmento: 'Indígena', startDate: '2026-10-01', endDate: '2026-10-31',
    risks: [{ severity: 20, category: 'Operacional', status: 'Aberto' }], changes: [{ approval: 'Pendente' }],
    financialItems: [{ date: '2026-10-05', plannedValue: 100, executedValue: 60 }] });
  const b = project({ id: 202, name: 'Projeto B', org: 'Org B', segmento: 'Quilombola', startDate: '2026-01-01', endDate: '2026-12-31', budgetApproved: 200, budgetExecuted: 80, changes: [] });
  const c = project({ id: 303, name: 'Projeto C', org: 'Org A', segmento: 'Indígena', startDate: '2026-10-01', endDate: '2026-10-31', status: 'Concluído', budgetApproved: 50, budgetExecuted: 0, changes: [] });
  const lista = [a, b, c];
  const filtros = { ...emptyPortfolioFilters(), exercicioKey: '2026-2026', periodStart: { year: 2026, month: 10 }, periodEnd: { year: 2026, month: 10 }, status: ['Em andamento'], org: ['Org A'], classificacao: ['Indígena'] };
  const antes = JSON.stringify({ lista, filtros });
  const calcular = () => {
    const selecionados = applyPortfolioFilters(lista, filtros);
    return { ids: selecionados.map(p => p.id), kpi: buildKpi(selecionados), decisions: buildDecisionCharts(selecionados, reference),
      timeline: buildFinancialTimeline(selecionados, { start: filtros.periodStart, end: filtros.periodEnd }) };
  };
  const resultado = calcular();
  assert.deepEqual(resultado.ids, [101]);
  assert.equal(resultado.kpi.totalProjects, 1);
  assert.equal(resultado.kpi.totalBudget, 100);
  assert.equal(resultado.kpi.totalExecuted, 60);
  assert.equal(resultado.kpi.avgProgress, 30);
  assert.equal(resultado.kpi.criticalRisks, 1);
  assert.equal(resultado.kpi.pendingChanges, 1);
  assert.deepEqual(resultado.timeline, [{ month: 'Out/2026', previsto: 100, executado: 60 }]);
  assert.deepEqual(resultado.decisions.budgets, [{ name: 'Org A', previsto: 100, executado: 60, saldo: 40 }]);
  assert.deepEqual(calcular(), resultado);
  assert.equal(JSON.stringify({ lista, filtros }), antes);
  assert.equal(buildKpi(applyPortfolioFilters(lista, emptyPortfolioFilters())).totalBudget, 350);
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

const { validarJustificativaAtraso, temAtrasoNasDatas, validarDatasDaAtividade } = loadTs('src/app/lib/planoTrabalho');
for (const [inicio, inicioReal] of [['antecipado', '2026-10-09'], ['igual', '2026-10-10'], ['posterior', '2026-10-11']]) {
  for (const [fim, fimReal] of [['antecipado', '2026-10-19'], ['igual', '2026-10-20'], ['posterior', '2026-10-21']]) {
    test(`justificativa: início ${inicio} e fim ${fim}`, () => {
      const dates = { plannedStart: '2026-10-10', plannedEnd: '2026-10-20', actualStart: inicioReal, actualEnd: fimReal };
      const etapa = { plannedStart: '2026-10-01', plannedEnd: '2026-10-31', actualStart: null, actualEnd: null };
      const precisaJustificar = inicio === 'posterior' || fim === 'posterior';
      assert.equal(validarDatasDaAtividade(dates, etapa).ok, true);
      assert.equal(temAtrasoNasDatas(dates), precisaJustificar);
      const result = validarJustificativaAtraso(dates, '');
      assert.equal(result.ok, !precisaJustificar);
      assert.equal(validarJustificativaAtraso(dates, 'Entrega reprogramada após indisponibilidade do fornecedor.').ok, true);
      if (precisaJustificar) {
        assert.match(result.erros[0], /Justificativa de atraso/);
        assert.equal(result.erros[0].includes('início real'), inicio === 'posterior');
        assert.equal(result.erros[0].includes('fim real'), fim === 'posterior');
      }
    });
  }
}

test('justificativa trata datas parciais e não aceita apenas espaços quando há atraso', () => {
  const dates = { plannedStart: '2026-10-10', plannedEnd: '2026-10-20', actualStart: '2026-10-11', actualEnd: null };
  assert.equal(validarJustificativaAtraso(dates, '   ').ok, false);
  assert.equal(validarJustificativaAtraso({ ...dates, actualStart: null }, '').ok, true);
  assert.equal(validarJustificativaAtraso({ ...dates, actualStart: '2026-10-09' }, '').ok, true);
  assert.equal(validarJustificativaAtraso({ ...dates, actualStart: null, actualEnd: '2026-10-21' }, '').ok, false);
});
