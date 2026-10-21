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
    if (r.endsWith('.css')) return {};
    if (mocks[r]) return mocks[r];
    if (!r.startsWith('.')) return require(r);
    const rel = path.resolve(path.dirname(p), r);
    return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks, cache);
  }, mod, mod.exports);
  return mod.exports;
}
const helper = carregar('src/app/lib/conclusaoPlano.ts');
test('calendário realizado aceita atraso além do previsto e do realizado da etapa', () => {
  const { FormularioAtividade }=carregar('src/app/components/plano/FormularioAtividade.tsx',{
    '../../store':{useStore:()=>({})},'../../auth/authStore':{usePeople:()=>[]},
  });
  const etapa={id:'e',plannedStart:'2026-01-01',plannedEnd:'2026-02-01',actualStart:null,actualEnd:'2026-03-01',activities:[]};
  const html=renderToStaticMarkup(React.createElement(FormularioAtividade,{etapa,aoFechar(){}}));
  const datas=[...html.matchAll(/<input\b[^>]*type="date"[^>]*>/g)].map(m=>m[0]);
  assert.equal(datas.length,5);
  assert.ok(datas[0].includes('max="2026-02-01"'));
  assert.ok(datas[1].includes('max="2026-02-01"'));
  for(const campo of datas.slice(2,4)) assert.ok(!campo.includes('max='),'Realizado sem teto do previsto ou da etapa');
});
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

function servidor({ consulta = false, erro = false } = {}) {
  const chamadas = [];
  const api = carregar('src/app/planoTrabalho.server.ts', {
    '@tanstack/react-start': { createServerFn: () => { const f = { validator() { return f; }, handler(h) { return h; } }; return f; } },
    './sessao.server': { exigirEscrita: async () => { if (consulta) throw new Error('Sem permissão'); return {}; } },
    '../integrations/supabase/client.server': { supabaseAdmin: { async rpc(nome, dados) { chamadas.push({nome,dados}); return {error: erro ? {message:'Períodos pendentes'} : null}; } } },
  });
  return { chamadas, salvar: data => api.alterarConclusaoPlano({ data }) };
}

test('conclusão dos três níveis usa uma única transação com os períodos e snapshots', async () => {
  for (const tipo of ['meta','etapa','atividade']) {
    const a = servidor();
    const periodos = [{id:'a1',inicioRealizado:'2026-01-01',fimRealizado:'2026-02-01',antes:{inicioRealizado:null,fimRealizado:null}}];
    await a.salvar({tipo,id:'alvo',concluido:true,periodos});
    assert.deepEqual(a.chamadas,[{nome:'concluir_plano_com_periodos',dados:{p_tipo:tipo,p_id:'alvo',p_concluido:true,p_periodos:periodos}}]);
    await a.salvar({tipo,id:'alvo',concluido:false});
    assert.deepEqual(a.chamadas[1].dados.p_periodos,[]);
  }
});

test('consulta e períodos inválidos são recusados antes da escrita; falha do banco é propagada', async () => {
  const consulta=servidor({consulta:true});
  await assert.rejects(consulta.salvar({tipo:'meta',id:'alvo',concluido:true}),/Sem permissão/);
  assert.equal(consulta.chamadas.length,0);
  for(const data of [{tipo:'outro',id:'x',concluido:true},{tipo:'meta',id:'x',concluido:'sim'},
    {tipo:'meta',id:'x',concluido:true,periodos:[{id:'a',inicioRealizado:'2026-02-30',fimRealizado:'2026-02-01',antes:{inicioRealizado:null,fimRealizado:null}}]}]) {
    const a=servidor(); await assert.rejects(a.salvar(data)); assert.equal(a.chamadas.length,0);
  }
  await assert.rejects(servidor({erro:true}).salvar({tipo:'meta',id:'alvo',concluido:true}),/Períodos pendentes/);
});

test('datas realizadas obrigatórias incluem legados concluídos, datas impossíveis e intervalo invertido',()=>{
  for (const [inicio,fim] of [[null,null],['2026-01-01',null],['2026-02-30','2026-03-01'],['2026-03-01','2026-02-01']])
    assert.ok(helper.errosPeriodoConclusao(inicio,fim).length);
  assert.deepEqual(helper.errosPeriodoConclusao('2024-02-29','2024-02-29'),[]);
  assert.equal(helper.atividadesSemPeriodo([{status:'Concluído',actualStart:null,actualEnd:null}]).length,1);
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
  const props = { tipo: 'atividade', id: 'a1', nome: 'Atividade', atividades: [{ id: 'a1', status: 'A iniciar', actualStart:'2026-01-01', actualEnd:'2026-02-01' }] };
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

test('período pendente solicita somente atividades inválidas; cancelar preserva e confirmar envia datas com snapshot', async () => {
  for (const tipo of ['meta','etapa','atividade']) {
    const estados=[],refs=[],chamadas=[]; let i=0,ir=0;
    const { useConclusaoComPeriodo }=carregar('src/app/components/plano/useConclusaoComPeriodo.tsx',{
      react:{...React,useState(v){const k=i++;if(!(k in estados))estados[k]=v;return [estados[k],n=>{estados[k]=typeof n==='function'?n(estados[k]):n;}];},useRef(v){return refs[ir++]??=( {current:v});}},
      '../../auth/authStore':{useAuth:()=>({readOnly:false})},
      '../../store':{useStore:()=>({setConclusaoPlano:async d=>{chamadas.push(d);}})},
      sonner:{toast:{success(){},error(){}}},
    });
    const render=()=>{i=0;ir=0;return useConclusaoComPeriodo();};
    function achar(n,p){if(!n||typeof n!=='object')return;if(Array.isArray(n)){for(const c of n){const r=achar(c,p);if(r)return r;}}else return p(n)?n:achar(n.props?.children,p);}
    const atividades=[{id:'a',name:'Pendente',status:'A iniciar',actualStart:null,actualEnd:null}];
    if(tipo!=='atividade')atividades.push({id:'b',name:'Válida',actualStart:'2026-01-01',actualEnd:'2026-02-01'});
    const pedir=()=>render().solicitar({tipo,id:'alvo'},true,atividades);
    pedir(); assert.equal(chamadas.length,0); assert.equal(render().ocupado,true);
    assert.equal(achar(render().dialogo,n=>n.type==='input'&&n.props['aria-label']?.includes('Válida')),undefined);
    achar(render().dialogo,n=>n.type==='button'&&n.props.children==='Confirmar conclusão').props.onClick();
    assert.equal(chamadas.length,0);
    achar(render().dialogo,n=>n.type==='button'&&n.props.children==='Cancelar').props.onClick();
    assert.equal(render().ocupado,false);assert.equal(chamadas.length,0);assert.equal(atividades[0].status,'A iniciar');
    pedir();
    for(const [label,value] of [['Início realizado: Pendente','2026-02-01'],['Fim realizado: Pendente','2026-01-01']])
      achar(render().dialogo,n=>n.type==='input'&&n.props['aria-label']===label).props.onChange({target:{value}});
    achar(render().dialogo,n=>n.type==='button'&&n.props.children==='Confirmar conclusão').props.onClick();
    assert.equal(chamadas.length,0,'Intervalo invertido não salva');
    achar(render().dialogo,n=>n.type==='input'&&n.props['aria-label']==='Fim realizado: Pendente').props.onChange({target:{value:'2026-03-01'}});
    achar(render().dialogo,n=>n.type==='button'&&n.props.children==='Confirmar conclusão').props.onClick();
    await new Promise(ok=>setImmediate(ok));
    assert.deepEqual(chamadas,[{tipo,id:'alvo',concluido:true,periodos:[{id:'a',inicioRealizado:'2026-02-01',fimRealizado:'2026-03-01',antes:{inicioRealizado:null,fimRealizado:null}}]}]);
    assert.equal(render().dialogo,null);
  }
});
