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
    if (!r.startsWith('.')) return require(r);
    const rel = path.resolve(path.dirname(p), r);
    return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks, cache);
  }, mod, mod.exports); return mod.exports;
}
function fixture() {
  const a = (id, status = 'A iniciar') => ({ id, name: id, status, tasks: [], order: 1, nextStep: '', observations: '' });
  return { id: 'm1', name: 'Meta principal', order: 1, deliverables: [
    { id: 'e1', name: 'Etapa atual', order: 1, activities: [a('Atividade aberta'), a('Atividade concluída', 'Concluído')] },
    { id: 'e2', name: 'Outra etapa', order: 2, activities: [a('Outra atividade')] },
  ] };
}
function achar(n, pred) {
  if (!n || typeof n !== 'object') return;
  if (Array.isArray(n)) { for (const c of n) { const r = achar(c, pred); if (r) return r; } return; }
  return pred(n) ? n : achar(n.props?.children, pred);
}

test('lateral da atividade mostra meta, todas as etapas, atividades irmãs e conclusão derivada com seleção atual', () => {
  const { NavegacaoPlano } = carregar('src/app/components/plano/NavegacaoPlano.tsx', {
    '../../auth/authStore': { useAuth: () => ({ readOnly: false }) }, '../../store': { useStore: () => ({}) },
  });
  const html = renderToStaticMarkup(React.createElement(NavegacaoPlano, {
    meta: fixture(), selecionado: { tipo: 'atividade', id: 'Atividade aberta' }, codigos: new Map(), aoAbrir() {},
  }));
  assert.match(html, /Navegação do plano de trabalho/);
  for (const nome of ['Meta principal', 'Etapa atual', 'Outra etapa', 'Atividade aberta', 'Atividade concluída']) assert.ok(html.includes(nome));
  assert.match(html, /aria-current="page"[^>]*aria-label="Abrir atividade: Atividade aberta"/);
  assert.match(html, /1 de 3 concluídas/);
  assert.match(html, /line-through/);
  assert.doesNotMatch(html, /Abrir atividade: Outra atividade/, 'Outra etapa pode ser expandida sem perder o contexto atual');
});

test('navegação da lateral abre o tipo e ID corretos; salvar bloqueia navegação e cliques repetidos e preserva falhas', async () => {
  const estados = []; const refs = []; let i = 0; let ir = 0; let consulta = false;
  const abrir = []; const salvar = []; const ocupacoes = []; const avisos = []; let rejeitar;
  const hooks = { ...React, useState(inicial) { const k = i++; if (!(k in estados)) estados[k] = inicial;
    return [estados[k], v => { estados[k] = typeof v === 'function' ? v(estados[k]) : v; }];
  }, useRef(v) { const k = ir++; return refs[k] ??= { current: v }; } };
  const { NavegacaoPlano } = carregar('src/app/components/plano/NavegacaoPlano.tsx', {
    react: hooks, '../../auth/authStore': { useAuth: () => ({ readOnly: consulta }) },
    '../../store': { useStore: () => ({ setConclusaoPlano: data => { salvar.push(data); return new Promise((_, nao) => { rejeitar = nao; }); } }) },
    sonner: { toast: { success() {}, error: e => avisos.push(e) } },
  });
  const props = { meta: fixture(), selecionado: { tipo: 'atividade', id: 'Atividade aberta' }, codigos: new Map(), aoAbrir: p => abrir.push(p), aoOcupar: p => ocupacoes.push(p) };
  const render = () => { i = 0; ir = 0; return NavegacaoPlano(props); };
  const registro = (tipo, id) => achar(render(), n => n.type?.name === 'RegistroDaArvore' && n.props.tipo === tipo && n.props.id === id);
  let r = registro('meta', 'm1'); r.props.aoAbrir({ tipo: 'meta', id: 'm1' });
  assert.deepEqual(abrir, [{ tipo: 'meta', id: 'm1' }]);
  const etapa = registro('etapa', 'e1'); etapa.props.aoConcluir({ tipo: 'etapa', id: 'e1' }, true);
  etapa.props.aoConcluir({ tipo: 'etapa', id: 'e1' }, true);
  assert.deepEqual(salvar, [{ tipo: 'etapa', id: 'e1', concluido: true }]);
  assert.equal(registro('atividade', 'Atividade aberta').props.ocupado, true);
  registro('meta', 'm1').props.aoAbrir({ tipo: 'meta', id: 'm1' }); assert.equal(abrir.length, 1);
  rejeitar(new Error('Falha de gravação')); await new Promise(ok => setImmediate(ok));
  assert.equal(registro('etapa', 'e1').props.ocupado, false);
  assert.deepEqual(ocupacoes, [true, false]); assert.match(avisos[0], /Falha de gravação/);
  consulta = true;
  registro('meta', 'm1').props.aoConcluir({ tipo: 'meta', id: 'm1' }, true);
  assert.equal(salvar.length, 1);
});

test('Tabela separa abrir meta de expandir; Todos os campos e Ordenar abrem o mesmo detalhe', () => {
  const abrir = []; let expandiu = 0;
  const mocks = { react: { ...React, useMemo: fn => fn(), useRef: v => ({ current: v }), useState: v => [v, () => {}] },
    '../../auth/authStore': { useAuth: () => ({ readOnly: false }) }, '../../store': { useStore: () => ({}) } };
  const { VisaoTabela } = carregar('src/app/components/plano/VisaoTabela.tsx', mocks);
  const meta = fixture();
  const tabela = VisaoTabela({ metas: [meta], riscos: [], recolhidos: new Set(['m1']), codigos: new Map(),
    alternarRecolhido() { expandiu++; }, aoAbrirMeta: m => abrir.push({ tipo: 'meta', id: m.id }) });
  achar(tabela, n => n.props?.['aria-label'] === 'Expandir meta: Meta principal').props.onClick();
  assert.equal(expandiu, 1); assert.equal(abrir.length, 0);
  achar(tabela, n => n.props?.['aria-label'] === 'Abrir meta: Meta principal').props.onClick();
  assert.deepEqual(abrir.at(-1), { tipo: 'meta', id: 'm1' });
  const { VisaoCompleta } = carregar('src/app/components/plano/VisaoCompleta.tsx');
  const completa = VisaoCompleta({ registros: [{ id: 'a1', tipo: 'atividade', titulo: 'Atividade', campos: [] }], aoAbrir: alvo => abrir.push(alvo) });
  achar(completa, n => n.type === 'button').props.onClick();
  assert.deepEqual(abrir.at(-1), { tipo: 'atividade', id: 'a1' });
  const { VisaoOrdenacao } = carregar('src/app/components/plano/VisaoOrdenacao.tsx', mocks);
  const ordem = VisaoOrdenacao({ projetoId: 1, metas: [meta], codigos: new Map(), aoAbrir: alvo => abrir.push(alvo) });
  achar(ordem, n => n.type === 'button').props.onClick();
  assert.deepEqual(abrir.at(-1), { tipo: 'meta', id: 'm1' });
});

test('detalhe da atividade recebe lateral e mantém observações, encaminhamento, subtarefas, anexo, risco e orçamento visíveis', () => {
  const { PainelAtividade } = carregar('src/app/components/plano/PainelAtividade.tsx', {
    '../../auth/authStore': { useAuth: () => ({ readOnly: true }) }, '../../store': { useStore: () => ({}) },
    './PainelBase': { Painel: ({ children, lateral }) => React.createElement('div', null, lateral, children),
      Linha: ({ rotulo, children }) => React.createElement('section', null, rotulo, children), Periodo: () => null, Ausente: () => '—', BotaoAcao: () => null },
    './CampoAnexo': { CampoAnexo: ({ anexo }) => React.createElement('span', null, anexo?.fileName) },
    './FormularioAtividade': { FormularioAtividade: () => null },
  });
  const meta = fixture(); const etapa = meta.deliverables[0];
  const atividade = { ...etapa.activities[0], progress: 0, budgetLink: 'Sim', observations: 'Observação importante',
    nextStep: 'Encaminhamento específico', nextStepOwner: 'Equipe', tasks: [{ id: 't1', title: 'Subtarefa ligada' }],
    attachment: { fileName: 'Anexo ligado.pdf' } };
  const html = renderToStaticMarkup(React.createElement(PainelAtividade, {
    atividade, etapa, meta, projetoId: 1, codigo: '1.1.1', aoFechar() {}, aoAbrirRisco() {},
    lateral: React.createElement('nav', null, 'Árvore da meta'),
    riscoOrigem: { id: 'r1', title: 'Risco de origem' }, riscosDaEtapa: [{ id: 'r2', title: 'Outro risco da etapa' }],
    orcamentoDaMeta: [{ id: 'i1', descricao: 'Item vigente da meta', valorProposto: 100 }],
  }));
  for (const texto of ['Árvore da meta', 'Observação importante', 'Encaminhamento específico', 'Subtarefa ligada', 'Anexo ligado.pdf', 'Risco de origem', 'Outro risco da etapa', 'Item vigente da meta', 'Itens compartilhados']) assert.ok(html.includes(texto), texto);
  assert.doesNotMatch(html, /Marcar como concluída/, 'Conclusão fica na lateral, sem controle duplicado no conteúdo');
});
