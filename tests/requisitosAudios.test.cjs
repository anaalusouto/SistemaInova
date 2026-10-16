const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function carregar(arquivo, mocks = {}, cache = new Map()) {
  const absoluto = path.resolve(__dirname, '..', arquivo);
  if (cache.has(absoluto)) return cache.get(absoluto);
  const mod = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync(absoluto, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(r => {
    if (mocks[r]) return mocks[r];
    if (r.startsWith('.')) {
      const p = path.resolve(path.dirname(absoluto), r);
      return carregar(fs.existsSync(p + '.ts') ? p + '.ts' : p + '.tsx', mocks, cache);
    }
    return require(r);
  }, mod, mod.exports);
  cache.set(absoluto, mod.exports);
  return mod.exports;
}
const atividade = { id: 'a', name: 'Reunião comunitária', responsible: 'LEGADO_PRESERVADO', status: 'Em andamento', progress: 40,
  plannedStart: '2026-10-02', plannedEnd: '2026-10-10', actualStart: null, actualEnd: null,
  delayJustification: '', budgetLink: 'Sim', observations: 'Observação visível sem abrir painel',
  nextStep: 'Enviar convite', nextStepOwner: 'Maria', nextStepDue: '2026-10-03', riskOriginId: null, tasks: [] };
const etapa = { id: 'e', name: 'Etapa', plannedStart: '2026-10-01', plannedEnd: '2026-10-31', actualStart: null, actualEnd: '2026-10-31', activities: [atividade] };
test('R07: proposta soma só ativos vigentes e cabeçalho mantém o mesmo total, inclusive zero', async () => {
  const { totaisDoOrcamento } = carregar('src/app/lib/orcamento.ts');
  const casos = [
    [{ vigente: true, situacao: 'Ativo', valorProposto: 450 }, { vigente: true, situacao: 'Excluído', valorProposto: 200 }, { vigente: false, situacao: 'Ativo', valorProposto: 300 }],
    [{ vigente: true, situacao: 'Excluído', valorProposto: 200 }],
    [{ vigente: false, situacao: 'Ativo', valorProposto: 300 }],
    [],
  ];
  for (const [n, itens] of casos.entries()) {
    const totais = totaisDoOrcamento(itens.map(i => ({ ...i, valorExecutado: null })));
    assert.equal(totais.proposto, n === 0 ? 450 : 0);
    const rows = [{ id: 1, orcamento_aprovado: 999, orcamento_itens: itens.map((i, id) => ({ id, vigente: i.vigente, situacao: i.situacao, valor_proposto: i.valorProposto })) }];
    const db = { from() { return { select() { return this; }, order() { return this; }, then(resolve) { return Promise.resolve({ data: rows, error: null }).then(resolve); } }; } };
    const api = carregar('src/app/projetos.server.ts', {
      '@tanstack/react-start': { createServerFn: () => {
        const f = { validator() { return f; }, handler(h) { return args => h({ data: args?.data }); } }; return f;
      } },
      '../integrations/supabase/client.server': { supabaseAdmin: db },
    });
    const [p] = await api.listarProjetos();
    assert.equal(p.budgetApproved, itens.length ? totais.proposto : 999);
    assert.equal(p.orcamentoItens.length, itens.length, 'Histórico preservado');
  }
});

test('R05: encaminhamentos abre dentro do projeto e permite voltar ao plano', () => {
  const estados = []; let indice = 0; let saidas = 0;
  const hooks = { ...React, useEffect() {}, useState(inicial) {
    const i = indice++;
    if (!(i in estados)) estados[i] = typeof inicial === 'function' ? inicial() : inicial;
    return [estados[i], v => { estados[i] = typeof v === 'function' ? v(estados[i]) : v; }];
  } };
  const p = { id: 1, name: 'Projeto', status: 'Em andamento', risks: [], changes: [] };
  const Plano = () => null;
  const { ProjectView } = carregar('src/app/components/ProjectView.tsx', {
    react: hooks,
    '../store': { useStore: () => ({ getProject: () => p }) },
    '../auth/authStore': { useAuth: () => ({ readOnly: true }) },
    '../audit/auditStore': { useAudit: () => ({ log() {} }) },
    './project-tabs/ProjectSummaryHeader': { ProjectSummaryHeader: () => null },
    './project-tabs/TabDescricao': { TabDescricao: () => null },
    './plano/TabPlanoTrabalho': { TabPlanoTrabalho: Plano },
    './orcamento/TabOrcamento': { TabOrcamento: () => null },
    './project-tabs/TabFinanceiro': { TabFinanceiro: () => null },
    './project-tabs/TabMudancas': { TabMudancas: () => null },
  });
  const render = () => { indice = 0; return ProjectView({ project: p, onBack() {}, aoEncaminhamentos() { saidas++; }, renderEncaminhamentos: foco => React.createElement('section', { 'data-foco': foco }, 'Encaminhamentos da organização') }); };
  function achar(node, pred) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) { const r = achar(n, pred); if (r) return r; } return; }
    return pred(node) ? node : achar(node.props?.children, pred);
  }
  achar(render(), e => e.type === Plano).props.aoEncaminhamentos('atividade-a');
  assert.equal(achar(render(), e => e.type === 'section').props['data-foco'], 'atividade-a');
  achar(render(), e => e.type === 'button' && e.props.children?.includes?.('Plano de Trabalho')).props.onClick();
  assert.ok(achar(render(), e => e.type === Plano));
  achar(render(), e => e.type === 'button' && e.props['aria-label'] === 'Encaminhamentos').props.onClick();
  assert.equal(achar(render(), e => e.type === 'section').props['data-foco'], null);
  assert.equal(saidas, 0, 'Troca de aba mantém a ficha do projeto aberta');
});

test('R06: edição em linha preserva campos e recusa atraso sem justificativa e período inválido', () => {
  const { dadosDaAtividade, errosDaEdicao } = carregar('src/app/lib/edicaoLinhaPlano.ts');
  const dados = dadosDaAtividade(atividade, etapa.id);
  assert.equal(dados.responsavel, 'LEGADO_PRESERVADO');
  assert.equal(dados.observacoes, atividade.observations);
  assert.equal(dados.proximoPasso, atividade.nextStep);
  assert.deepEqual(errosDaEdicao({ ...dados, inicioRealizado: '2026-10-01' }, etapa), []);
  assert.match(errosDaEdicao({ ...dados, fimRealizado: '2026-10-15' }, etapa).join(' '), /Justificativa de atraso/);
  assert.deepEqual(errosDaEdicao({ ...dados, fimRealizado: '2026-10-15', justificativaAtraso: 'Chuva' }, etapa), []);
  assert.ok(errosDaEdicao({ ...dados, inicioPrevisto: '2026-11-01' }, etapa).length > 0);
});
test('R02/03/04/06: tabela mostra observação e encaminhamento, preserva legado e respeita consulta', () => {
  for (const readOnly of [false, true]) {
    const { VisaoTabela } = carregar('src/app/components/plano/VisaoTabela.tsx', {
      '../../auth/authStore': { useAuth: () => ({ readOnly }) },
      '../../store': { useStore: () => ({ updateAtividade: async () => {} }) },
    });
    const antes = structuredClone(atividade);
    const html = renderToStaticMarkup(React.createElement(VisaoTabela, {
      metas: [{ id: 'm', name: 'Meta', deliverables: [etapa] }], riscos: [], recolhidos: new Set(),
      codigos: new Map(), alternarRecolhido() {}, aoEncaminhamentos() {},
    }));
    assert.match(html, /Observação visível sem abrir painel/);
    assert.match(html, /Enviar convite/);
    assert.match(html, /Ver encaminhamento/);
    assert.doesNotMatch(html, /LEGADO_PRESERVADO/);
    assert.equal(html.includes('Editar datas e status'), !readOnly);
    assert.deepEqual(atividade, antes);
  }
});

function servidor({ pessoa = { id: 'u1', nome_exibicao: 'Nome canônico' }, consulta = false } = {}) {
  const escritas = [];
  const db = { from(tabela) {
    const builder = { select() { return this; }, eq() { return this; },
      insert(d) { escritas.push(d); return this; }, update(d) { escritas.push(d); return this; },
      maybeSingle: async () => ({ data: pessoa, error: null }), single: async () => ({ data: { id: 'enc1' }, error: null }),
      then(resolve) { return Promise.resolve({ error: null }).then(resolve); } };
    return builder;
  } };
  const api = carregar('src/app/organizacoes.server.ts', {
    '@tanstack/react-start': { createServerFn: () => {
      const f = { validator() { return f; }, handler(h) { return args => h({ data: args?.data }); } }; return f;
    } },
    './sessao.server': { exigirEscrita: async () => { if (consulta) throw new Error('Sem permissão'); return { displayName: 'Autor da sessão' }; } },
    '../integrations/supabase/client.server': { supabaseAdmin: db },
  });
  return { api, escritas };
}
const input = { organizacaoId: 'org', descricao: 'Enviar ata', responsavel: 'Nome forjado', responsavelUsuarioId: 'u1', dataInicio: null, dataFim: null, status: 'A iniciar', origem: null };
test('R01: vínculo salva UUID e nome do cadastro, sem aceitar nome forjado', async () => {
  const a = servidor();
  await a.api.criarEncaminhamento({ data: input });
  assert.equal(a.escritas[0].responsavel_usuario_id, 'u1');
  assert.equal(a.escritas[0].responsavel, 'Nome canônico');
  assert.equal(a.escritas[0].criado_por, 'Autor da sessão');
});
test('R01: pessoa removida e perfil de consulta são recusados antes de escrever', async () => {
  for (const op of [{ pessoa: null }, { consulta: true }]) {
    const a = servidor(op);
    await assert.rejects(a.api.criarEncaminhamento({ data: input }));
    assert.equal(a.escritas.length, 0);
  }
});

test('R06: controles da linha salvam datas/status juntos e mantêm o rascunho em falha', async () => {
  const estados = []; let indice = 0; const gravados = []; let falhar = false;
  const hooks = { ...React, useState(inicial) {
    const i = indice++;
    if (!(i in estados)) estados[i] = typeof inicial === 'function' ? inicial() : inicial;
    return [estados[i], v => { estados[i] = typeof v === 'function' ? v(estados[i]) : v; }];
  } };
  const { VisaoTabela } = carregar('src/app/components/plano/VisaoTabela.tsx', {
    react: hooks,
    '../../auth/authStore': { useAuth: () => ({ readOnly: false }) },
    '../../store': { useStore: () => ({ updateAtividade: async (id, d) => {
      if (falhar) throw new Error('Falha de gravação'); gravados.push({ id, d });
    } }) },
    sonner: { toast: { success() {} } },
  });
  const props = { metas: [{ id: 'm', name: 'Meta', deliverables: [etapa] }], riscos: [], recolhidos: new Set(), codigos: new Map(), alternarRecolhido() {} };
  const render = () => { indice = 0; return VisaoTabela(props); };
  function achar(node, pred) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) { const r = achar(n, pred); if (r) return r; } return; }
    if (pred(node)) return node;
    return achar(node.props?.children, pred);
  }
  const editar = () => achar(render(), e => e.props?.['aria-label'] === `Editar datas e status: ${atividade.name}`).props.onClick();
  editar();
  assert.equal(achar(render(), e => e.type === 'input' && e.props.type === 'date').props.type, 'date');
  achar(render(), e => e.props?.['aria-label'] === `Fim realizado: ${atividade.name}`).props.onChange({ target: { value: '2026-10-12' } });
  achar(render(), e => e.type === 'button' && e.props.children === 'Salvar linha').props.onClick();
  assert.equal(gravados.length, 0, 'Atraso sem justificativa não é enviado');
  achar(render(), e => e.props?.['aria-label'] === `Justificativa de atraso: ${atividade.name}`).props.onChange({ target: { value: 'Chuva' } });
  achar(render(), e => e.props?.['aria-label'] === `Status: ${atividade.name}`).props.onChange({ target: { value: 'Concluído' } });
  achar(render(), e => e.type === 'button' && e.props.children === 'Salvar linha').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(gravados.length, 1);
  assert.equal(gravados[0].d.progresso, 100);
  assert.equal(gravados[0].d.fimRealizado, '2026-10-12');
  assert.equal(gravados[0].d.observacoes, atividade.observations);
  editar(); falhar = true;
  achar(render(), e => e.type === 'button' && e.props.children === 'Salvar linha').props.onClick();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(achar(render(), e => e.props?.role === 'alert').props.children, /Falha de gravação/);
  assert.ok(achar(render(), e => e.type === 'button' && e.props.children === 'Salvar linha'));
});
