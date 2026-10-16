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
  const code = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', code)(r => {
    if (mocks[r]) return mocks[r];
    if (!r.startsWith('.')) return require(r);
    const rel = path.resolve(path.dirname(p), r);
    return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks, cache);
  }, mod, mod.exports);
  return mod.exports;
}
const helper = carregar('src/app/lib/conclusaoPlano.ts');
const arvore = () => [{ id: 'm1', name: 'Meta', deliverables: [
  { id: 'e1', name: 'Etapa', activities: [{ id: 'a1', status: 'Concluído' }, { id: 'a2', status: 'A iniciar' }] },
  { id: 'e2', name: 'Etapa vazia', activities: [] },
] }];

test('checks derivados acompanham conclusão parcial, total e grupos vazios', () => {
  const metas = arvore();
  const antes = structuredClone(metas);
  let indice = helper.indiceConclusao(metas);
  assert.deepEqual(indice.get('meta:m1'), { total: 2, concluidas: 1, concluido: false, parcial: true });
  assert.equal(indice.get('etapa:e1').parcial, true);
  assert.equal(indice.get('atividade:a1').concluido, true);
  assert.equal(indice.get('etapa:e2').concluido, false);
  assert.deepEqual(metas, antes);
  metas[0].deliverables[0].activities[1].status = 'Concluído';
  indice = helper.indiceConclusao(metas);
  assert.equal(indice.get('meta:m1').concluido, true);
  assert.equal(indice.get('etapa:e1').concluido, true);
});

function servidor({ consulta = false, erro = false, inexistente = false } = {}) {
  const rows = [
    { id: 'a1', etapa_id: 'e1', status: 'A iniciar', progresso: 0, excluido_em: null, inicio_realizado: null },
    { id: 'a2', etapa_id: 'e1', status: 'Em andamento', progresso: 30, excluido_em: null },
    { id: 'a3', etapa_id: 'e2', status: 'Concluído', progresso: 100, excluido_em: null },
    { id: 'a4', etapa_id: 'e2', status: 'A iniciar', progresso: 0, excluido_em: '2026-10-01' },
    { id: 'outro', etapa_id: 'fora', status: 'A iniciar', progresso: 0, excluido_em: null },
  ];
  const updates = [];
  const db = { from(tabela) {
    let patch; const filtros = [];
    const resultado = () => {
      if (!patch) return { data: tabela === 'etapas' && filtros.some(f => f[1] === 'meta_id') ? [{ id: 'e1' }, { id: 'e2' }] : inexistente ? null : { id: 'alvo' }, error: null };
      if (erro) return { data: null, error: { message: 'Falha de gravação' } };
      for (const row of rows) {
        if (filtros.every(([op, c, v]) => op === 'in' ? v.includes(row[c]) : op === 'neq' ? row[c] !== v : row[c] === v)) Object.assign(row, patch);
      }
      return { error: null };
    };
    return {
      select() { return this; },
      eq(c, v) { filtros.push(['eq', c, v]); return this; },
      neq(c, v) { filtros.push(['neq', c, v]); return this; },
      is(c, v) { filtros.push(['is', c, v]); return this; },
      in(c, v) { filtros.push(['in', c, v]); return this; },
      update(d) { patch = d; updates.push({ tabela, patch, filtros }); return this; },
      single() { return Promise.resolve(resultado()); },
      then(ok, fail) { return Promise.resolve(resultado()).then(ok, fail); },
    };
  } };
  const api = carregar('src/app/planoTrabalho.server.ts', {
    '@tanstack/react-start': { createServerFn: () => { const f = { validator() { return f; }, handler(h) { return h; } }; return f; } },
    './sessao.server': { exigirEscrita: async () => { if (consulta) throw new Error('Sem permissão'); return {}; } },
    '../integrations/supabase/client.server': { supabaseAdmin: db },
  });
  return { rows, updates, salvar: data => api.alterarConclusaoPlano({ data }) };
}

test('concluir meta altera todas as atividades ativas em uma escrita, preservando excluídas e outros projetos', async () => {
  const a = servidor(); const antes = structuredClone(a.rows);
  await a.salvar({ tipo: 'meta', id: 'm1', concluido: true });
  assert.equal(a.updates.length, 1);
  assert.deepEqual(a.rows.slice(0, 3).map(r => [r.status, r.progresso]), Array(3).fill(['Concluído', 100]));
  assert.deepEqual(a.rows.slice(3), antes.slice(3));
  assert.deepEqual(Object.keys(a.updates[0].patch).sort(), ['progresso', 'status'], 'Check não inventa datas ou altera observações');
});

test('etapa e atividade limitam a alteração ao próprio vínculo e reabrir mantém status/progresso coerentes', async () => {
  for (const tipo of ['etapa', 'atividade']) {
    const a = servidor();
    const id = tipo === 'etapa' ? 'e1' : 'a1';
    await a.salvar({ tipo, id, concluido: true });
    assert.equal(a.rows[0].status, 'Concluído');
    assert.equal(a.rows[1].status, tipo === 'etapa' ? 'Concluído' : 'Em andamento');
    await a.salvar({ tipo, id, concluido: false });
    assert.equal(a.rows[0].status, 'Em andamento');
    assert.equal(a.rows[0].progresso, 50);
    assert.equal(a.rows[2].status, 'Concluído', 'Outra etapa não é reaberta');
    assert.equal(a.rows[1].progresso, tipo === 'etapa' ? 50 : 30);
  }
});

test('servidor recusa consulta, alvo inexistente e parâmetros inválidos; falha não conclui parcialmente o grupo', async () => {
  for (const op of [{ consulta: true }, { inexistente: true }, { erro: true }]) {
    const a = servidor(op); const antes = structuredClone(a.rows);
    await assert.rejects(a.salvar({ tipo: 'meta', id: 'm1', concluido: true }));
    assert.deepEqual(a.rows, antes);
    if (!op.erro) assert.equal(a.updates.length, 0);
  }
  for (const data of [{ tipo: 'projeto', id: 'm1', concluido: true }, { tipo: 'meta', id: '', concluido: true }, { tipo: 'meta', id: 'm1', concluido: 'sim' }]) {
    const a = servidor(); await assert.rejects(a.salvar(data)); assert.equal(a.updates.length, 0);
  }
});

test('controle parcial, de consulta e vazio oferece check acessível sem habilitar escrita indevida', () => {
  const { CheckConclusaoPlano } = carregar('src/app/components/plano/CheckConclusaoPlano.tsx');
  const props = { tipo: 'meta', nome: 'Meta', resumo: helper.indiceConclusao(arvore()).get('meta:m1'), desativado: false, salvando: false, aoMudar() {} };
  const controle = CheckConclusaoPlano(props);
  const input = controle.props.children[0];
  const elemento = {}; input.props.ref(elemento);
  assert.equal(elemento.indeterminate, true);
  assert.match(input.props['aria-label'], /Concluir meta: Meta/);
  assert.match(controle.props.title, /inclusive as ocultas/);
  for (const config of [{ desativado: true }, { resumo: helper.resumirConclusao([]) }, { salvando: true, desativado: true }]) {
    const html = renderToStaticMarkup(React.createElement(CheckConclusaoPlano, { ...props, ...config }));
    assert.match(html, /disabled/);
  }
});

test('filtro não apresenta meta como concluída quando ainda existe atividade pendente oculta', () => {
  const { VisaoTabela } = carregar('src/app/components/plano/VisaoTabela.tsx', {
    '../../auth/authStore': { useAuth: () => ({ readOnly: true }) },
    '../../store': { useStore: () => ({}) },
  });
  const completas = arvore();
  const visiveis = structuredClone(completas);
  visiveis[0].deliverables[0].activities = [visiveis[0].deliverables[0].activities[0]];
  const html = renderToStaticMarkup(React.createElement(VisaoTabela, {
    metas: visiveis, metasCompletas: completas, riscos: [], recolhidos: new Set(['m1']), codigos: new Map(),
  }));
  assert.match(html, /1\/2 concluídas/);
  assert.doesNotMatch(html, /Concluir meta: Meta|type="checkbox"/);
  assert.doesNotMatch(html, /checked=""/);
});

test('tabela risca somente os registros concluídos e remove o risco visual ao reabrir', () => {
  const { VisaoTabela } = carregar('src/app/components/plano/VisaoTabela.tsx', {
    '../../auth/authStore': { useAuth: () => ({ readOnly: true }) },
    '../../store': { useStore: () => ({}) },
  });
  const metas = arvore();
  const atividades = metas[0].deliverables[0].activities;
  atividades.forEach(a => Object.assign(a, { name: a.id, tasks: [], nextStep: '', observations: '', plannedStart: null, plannedEnd: null }));
  const render = () => renderToStaticMarkup(React.createElement(VisaoTabela, {
    metas, metasCompletas: metas, riscos: [], recolhidos: new Set(), codigos: new Map(),
  }));
  assert.equal((render().match(/line-through/g) ?? []).length, 1);
  atividades[1].status = 'Concluído';
  assert.equal((render().match(/line-through/g) ?? []).length, 4, 'Duas atividades, etapa e meta completas');
  atividades[0].status = 'Em andamento';
  assert.equal((render().match(/line-through/g) ?? []).length, 1);
  assert.doesNotMatch(render(), /type="checkbox"/);
});

test('conclusão no detalhe bloqueia cliques repetidos, respeita consulta e preserva o estado ao falhar', async () => {
  let indice = 0; const estados = []; const refs = []; let indiceRef = 0;
  let readOnly = false; let rejeitar; let resolver; const chamadas = []; const avisos = [];
  const hooks = { ...React, useState(valor) {
    const i = indice++; if (!(i in estados)) estados[i] = valor;
    return [estados[i], v => { estados[i] = v; }];
  }, useRef(valor) { const i = indiceRef++; return refs[i] ??= { current: valor }; } };
  const { ConclusaoNoDetalhe } = carregar('src/app/components/plano/ConclusaoNoDetalhe.tsx', {
    react: hooks,
    '../../auth/authStore': { useAuth: () => ({ readOnly }) },
    '../../store': { useStore: () => ({ setConclusaoPlano: data => {
      chamadas.push(data); return new Promise((ok, falha) => { resolver = ok; rejeitar = falha; });
    } }) },
    sonner: { toast: { success: m => avisos.push(m), error: m => avisos.push(m) } },
  });
  const props = { tipo: 'atividade', id: 'a1', nome: 'Atividade', atividades: [{ id: 'a1', status: 'A iniciar' }] };
  const check = () => { indice = 0; indiceRef = 0; return ConclusaoNoDetalhe(props).props.children[0].props.children[0].props; };
  check().aoMudar(true); check().aoMudar(true);
  assert.equal(chamadas.length, 1); assert.equal(check().desativado, true);
  rejeitar(new Error('Falha de gravação')); await new Promise(ok => setImmediate(ok));
  assert.equal(check().resumo.concluido, false); assert.equal(check().desativado, false);
  assert.match(avisos.at(-1), /Falha de gravação/);
  check().aoMudar(true); resolver(); await new Promise(ok => setImmediate(ok));
  assert.equal(chamadas.length, 2); assert.match(avisos.at(-1), /Conclusão salva/);
  readOnly = true; check().aoMudar(false);
  assert.equal(chamadas.length, 2); assert.equal(check().desativado, true);
});
