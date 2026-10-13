const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function carregar(arquivo, mocks = {}) {
  const absoluto = path.resolve(__dirname, '..', arquivo);
  const mod = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync(absoluto, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(r => {
    if (mocks[r]) return mocks[r];
    if (r.startsWith('.')) return carregar(path.resolve(path.dirname(absoluto), r + '.ts'), mocks);
    return require(r);
  }, mod, mod.exports);
  return mod.exports;
}
const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const helper = carregar('src/app/lib/reordenacaoPlano.ts');
const plano = carregar('src/app/lib/planoRelatorio.ts');
const { codigosHierarquicos } = carregar('src/app/lib/planoTrabalho.ts');
const lista = [1, 2, 3, 4].map(n => ({ id: uid(n), order: n }));
const dados = (nivel = 'atividade') => ({ nivel, paiId: nivel === 'meta' ? 10 : uid(20), antes: lista, ids: helper.moverParaPosicao(lista, uid(2), 4) });

test('atividade 1.2.2 vira 1.2.4 e mantém subtarefas, riscos, anexos e vínculo com a etapa', () => {
  const atividades = lista.map(i => ({ ...i, name: i.id, riskOriginId: uid(50), attachment: { id: uid(60) }, tasks: [{ id: uid(70), order: 1 }] }));
  const metas = [{ id: uid(10), name: 'Meta', order: 1, deliverables: [
    { id: uid(19), name: 'Etapa 1', order: 1, activities: [] }, { id: uid(20), name: 'Etapa 2', order: 2, activities: atividades },
  ] }];
  assert.equal(codigosHierarquicos(metas).get(uid(2)), '1.2.2');
  const nova = helper.moverParaPosicao(atividades, uid(2), 4);
  const movidas = atividades.map(a => ({ ...a, order: nova.indexOf(a.id) + 1 }));
  metas[0].deliverables[1].activities = movidas;
  const codigos = codigosHierarquicos(plano.ordenarPlano(metas));
  assert.equal(codigos.get(uid(2)), '1.2.4');
  assert.equal(codigos.get(uid(3)), '1.2.2');
  assert.equal(codigos.get(uid(4)), '1.2.3');
  for (const a of movidas) {
    const original = atividades.find(i => i.id === a.id);
    assert.equal(a.tasks, original.tasks); assert.equal(a.attachment, original.attachment); assert.equal(a.riskOriginId, original.riskOriginId);
  }
});

test('mover meta e etapa atualiza prefixos de todos os descendentes', () => {
  const metas = [1, 2].map(n => ({ id: uid(n), name: `Meta ${n}`, order: n, deliverables: [1, 2].map(e => ({
    id: uid(n * 10 + e), name: `Etapa ${e}`, order: e, activities: [{ id: uid(n * 100 + e), order: 1, tasks: [{ id: uid(n * 1000 + e), order: 1 }] }],
  })) }));
  metas[0].order = 2; metas[1].order = 1;
  metas[0].deliverables[0].order = 2; metas[0].deliverables[1].order = 1;
  const codigos = codigosHierarquicos(plano.ordenarPlano(metas));
  assert.equal(codigos.get(uid(101)), '2.2.1'); assert.equal(codigos.get(uid(1001)), '2.2.1.1');
  assert.equal(codigos.get(uid(201)), '1.1.1');
});

function servidor({ consulta = false, erro = null } = {}) {
  const chamadas = [];
  const modulo = carregar('src/app/planoTrabalho.server.ts', {
    '@tanstack/react-start': { createServerFn: () => { const fn = { validator() { return fn; }, handler(h) { return args => h(args); } }; return fn; } },
    './sessao.server': { exigirEscrita: async () => { if (consulta) throw new Error('Sem permissão'); return { displayName: 'Pessoa', role: 'PMO' }; } },
    '../integrations/supabase/client.server': { supabaseAdmin: { rpc: async (nome, params) => { chamadas.push({ nome, params }); return { error: erro }; } } },
  });
  return { ...modulo, chamadas };
}

test('handler salva os três níveis em uma RPC e usa autoria da sessão', async () => {
  for (const nivel of ['meta', 'etapa', 'atividade']) {
    const s = servidor(); await s.reordenarPlano({ data: dados(nivel) });
    assert.equal(s.chamadas.length, 1); assert.equal(s.chamadas[0].nome, 'reordenar_plano');
    assert.equal(s.chamadas[0].params.p_nivel, nivel); assert.equal(s.chamadas[0].params.p_autor, 'Pessoa');
    assert.deepEqual(s.chamadas[0].params.p_ids, [uid(1), uid(3), uid(4), uid(2)]);
  }
});

test('permissão de consulta e listas inválidas são recusadas antes de qualquer RPC', async () => {
  const consulta = servidor({ consulta: true });
  await assert.rejects(consulta.reordenarPlano({ data: dados() }), /permissão/); assert.equal(consulta.chamadas.length, 0);
  for (const patch of [{ nivel: 'tarefas' }, { paiId: '' }, { antes: [] }, { ids: [uid(1), uid(1), uid(3), uid(4)] },
    { ids: [uid(1), uid(3), uid(4), uid(999)] }, { antes: [{ id: uid(1), order: NaN }, ...lista.slice(1)] }]) {
    const s = servidor(); await assert.rejects(s.reordenarPlano({ data: { ...dados(), ...patch } })); assert.equal(s.chamadas.length, 0);
  }
});

test('conflito do banco e migração ausente produzem mensagem clara sem sucesso falso', async () => {
  for (const erro of [{ code: 'P0001', message: 'A lista foi alterada por outra pessoa.' }, { code: 'PGRST202', message: 'missing' }]) {
    const s = servidor({ erro });
    await assert.rejects(s.reordenarPlano({ data: dados() }), erro.code === 'PGRST202' ? /migração 0021/ : /outra pessoa/);
    assert.equal(s.chamadas.length, 1);
  }
});

test('interface oferece posições de todos os níveis e não oferece escrita ao perfil de consulta', () => {
  const metas = [{ id: uid(10), name: 'Meta A', order: 1, deliverables: [{ id: uid(20), name: 'Etapa A', order: 1,
    activities: lista.map(i => ({ ...i, name: `Atividade ${i.order}`, tasks: [] })) }] }];
  for (const readOnly of [false, true]) {
    const { VisaoOrdenacao } = carregar('src/app/components/plano/VisaoOrdenacao.tsx', {
      '../../store': { useStore: () => ({ reorderPlano() {} }) }, '../../auth/authStore': { useAuth: () => ({ readOnly }) },
    });
    const html = renderToStaticMarkup(React.createElement(VisaoOrdenacao, { projetoId: 10, metas, codigos: codigosHierarquicos(metas) }));
    if (readOnly) assert.ok(!html.includes('<select'));
    else { assert.equal((html.match(/<select/g) ?? []).length, 6); assert.ok(html.includes('Posição 4 (1.1.4)')); }
  }
});
