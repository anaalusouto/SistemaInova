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
    if (r.endsWith('.css')) return {};
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

test('resumo: ordem da referência, andamento independente do financeiro e riscos não encerrados', () => {
  const { ResumoProjetoTopo } = carregar('src/app/components/project-tabs/ResumoProjetoTopo.tsx', {
    '../../theme/useFormatoPlano': { useFormatoPlano: () => ({ formato: { ordemCampos: {} } }) },
  });
  const project = { id: 1, code: '18-2026', name: 'Projeto sintético', budgetExecuted: 80244.69, budgetApproved: 164285.71,
    goals: [{ deliverables: [{ activities: [{ progress: 100 }, { progress: 46 }] }] }],
    risks: ['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'].map(status => ({ status })) };
  const html = renderToStaticMarkup(React.createElement(ResumoProjetoTopo, { project }));
  assert.ok(html.indexOf('Projeto</span>') < html.indexOf('VALOR EXECUTADO'));
  assert.ok(html.indexOf('VALOR EXECUTADO') < html.indexOf('ANDAMENTO'));
  assert.match(html, /width:73%/);
  assert.match(html, />73%<\/span>/);
  assert.match(html, /80\.244,69/);
  assert.match(html, /164\.285,71/);
  assert.match(html, /3 em aberto/);
  assert.ok(!html.includes('R$'));
});

test('atalho de riscos inicia com status não encerrados sem perder o projeto', () => {
  const { VisaoRiscos } = carregar('src/app/components/plano/VisaoRiscos.tsx', {
    '../../auth/authStore': { useAuth: () => ({ readOnly: true }) },
    '../../store': { useStore: () => ({}) },
  });
  const riscos = ['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'].map((status, i) => ({ id: `r${i}`, title: `Risco-${i}`, status, probability: 2, impact: 3, severity: 6 }));
  const props = { projetoId: 1, riscos, metas: [], codigos: new Map(), atividades: [] };
  const todos = renderToStaticMarkup(React.createElement(VisaoRiscos, props));
  const abertos = renderToStaticMarkup(React.createElement(VisaoRiscos, { ...props, pedidoAbertos: 1 }));
  assert.ok(todos.includes('Risco-3'));
  for (let i = 0; i < 3; i++) assert.ok(abertos.includes(`Risco-${i}`));
  assert.ok(!abertos.includes('Risco-3'));
});

test('planilha de riscos salva a linha inteira, preserva vínculos e mantém rascunho em erro', async () => {
  let indice = 0, falhar = false, consulta = false;
  const estados = [], salvos = [], pendencias = [];
  const hooks = { ...React, useMemo: f => f(), useEffect() {},
    useRef(valor) { const i = indice++; return estados[i] ??= { current: valor }; },
    useState(inicial) {
      const i = indice++;
      if (!(i in estados)) estados[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [estados[i], v => { estados[i] = typeof v === 'function' ? v(estados[i]) : v; }];
    },
  };
  const { VisaoRiscos } = carregar('src/app/components/plano/VisaoRiscos.tsx', {
    react: hooks, '../../auth/authStore': { useAuth: () => ({ readOnly: consulta }) },
    '../../store': { useStore: () => ({ updateRisco: async (id, d) => {
      if (falhar) throw new Error('Falha de gravação'); salvos.push({ id, d });
    } }) }, sonner: { toast: { success() {} } },
  });
  const risco = { id: 'r1', title: 'Entrega comprometida', description: 'Chuva', category: 'Técnico', responsible: 'Equipe',
    probability: 2, impact: 3, severity: 6, status: 'Aberto', stageId: 'e', goalId: 'm', specification: 'Indicador antigo', responseStrategy: 'Acompanhar' };
  const props = { projetoId: 7, riscos: [risco], metas: [{ id: 'm', name: 'Meta', deliverables: [etapa] }],
    codigos: new Map(), atividades: [], editar: true, aoPendencia: (id, p) => pendencias.push([id, p]) };
  const render = () => { indice = 0; return VisaoRiscos(props); };
  function achar(n, pred) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) { for (const c of n) { const r = achar(c, pred); if (r) return r; } return; }
    return pred(n) ? n : achar(n.props?.children, pred);
  }
  const linha = () => {
    const n = achar(render(), n => n.props?.risco?.id === 'r1' && n.props?.aoSalvar);
    return n.type(n.props);
  };
  const campo = nome => achar(linha(), n => n.props?.['aria-label'] === `${nome}: ${risco.title}`);
  const salvar = () => achar(linha(), n => n.type === 'button' && n.props.children === 'Salvar linha').props.onClick();
  const fim = () => new Promise(resolve => setImmediate(resolve));
  campo('Probabilidade').props.onChange({ target: { value: '2.5' } });
  salvar(); await fim();
  assert.equal(salvos.length, 0);
  assert.match(achar(linha(), n => n.props?.role === 'alert').props.children, /inteiro entre 1 e 5/);
  campo('Probabilidade').props.onChange({ target: { value: '5' } });
  campo('Impacto').props.onChange({ target: { value: '4' } });
  campo('Descrição').props.onChange({ target: { value: 'Chuvas persistentes\nAcesso interrompido' } });
  falhar = true; salvar(); await fim();
  assert.match(achar(linha(), n => n.props?.role === 'alert').props.children, /Falha de gravação/);
  assert.equal(campo('Probabilidade').props.value, 5);
  assert.deepEqual(pendencias.at(-1), ['risco:r1', true]);
  assert.equal(achar(render(), n => n.props?.type === 'search').props.disabled, true);
  falhar = false;
  linha().props.onKeyDown({ key: 'Enter', ctrlKey: true, target: { tagName: 'TEXTAREA' }, preventDefault() {} });
  await fim();
  assert.equal(salvos.length, 1);
  assert.equal(salvos[0].id, 'r1');
  assert.equal(salvos[0].d.projetoId, 7);
  assert.equal(salvos[0].d.etapaId, 'e');
  assert.equal(salvos[0].d.especificacao, 'Indicador antigo');
  assert.equal(salvos[0].d.estrategiaResposta, 'Acompanhar');
  assert.equal(salvos[0].d.descricao, 'Chuvas persistentes\nAcesso interrompido');
  assert.deepEqual(pendencias.at(-1), ['risco:r1', false]);
  campo('Categoria').props.onChange({ target: { value: 'Ambiental' } });
  linha().props.onKeyDown({ key: 'Escape', preventDefault() {} });
  assert.equal(campo('Categoria').props.value, 'Técnico');
  assert.equal(salvos.length, 1);
  consulta = true;
  assert.equal(achar(linha(), n => n.type === 'input' || n.type === 'textarea' || n.type === 'select'), undefined);
  assert.equal(achar(linha(), n => n.props?.children === 'Editar linha'), undefined);
});

test('planilha de riscos mantém ausência de etapa legada e valida os limites da matriz', () => {
  const { dadosDoRisco, errosDaEdicaoRisco } = carregar('src/app/lib/edicaoLinhaRisco.ts');
  const risco = { title: 'Legado', description: 'Descrição', responsible: 'Equipe', category: 'Externo', probability: 1, impact: 5, status: 'Aberto' };
  const dados = dadosDoRisco(1, risco);
  assert.equal(dados.etapaId, '');
  assert.deepEqual(errosDaEdicaoRisco(dados, risco), []);
  assert.match(errosDaEdicaoRisco(dados, { ...risco, stageId: 'etapa' }).join(' '), /Selecione a etapa/);
  for (const n of [0, 6, 1.5, NaN]) assert.ok(errosDaEdicaoRisco({ ...dados, impacto: n }, risco).length);
});

test('PDF propaga rejeição assíncrona da gravação', async () => {
  const { exportReportPdf } = carregar('src/app/lib/reportExport.ts', {
    jspdf: { default: function (...args) {
      const doc = new (require('jspdf').jsPDF)(...args);
      doc.save = () => Promise.reject(new Error('Gravação recusada'));
      return doc;
    } },
  });
  await assert.rejects(exportReportPdf({ title: 'Teste', generatedAt: new Date(), projects: [] }), /Gravação recusada/);
});

test('colunas: arraste e teclado mudam só a coluna escolhida, com limites, cancelamento e restauração', () => {
  let indice = 0;
  const estados = [];
  const hooks = {
    useRef(valor) { const i = indice++; return estados[i] ??= { current: valor }; },
    useState(valor) { const i = indice++; if (!(i in estados)) estados[i] = valor;
      return [estados[i], novo => { estados[i] = novo; }]; },
  };
  const { useLargurasTabela } = carregar('src/app/components/plano/useLargurasTabela.ts', { react: hooks });
  const render = () => { indice = 0; return useLargurasTabela(['Atividade', 'Responsável']); };
  let tabela = render();
  tabela.tabelaRef.current = { tHead: { rows: [{ cells: [300, 200].map(width => ({ getBoundingClientRect: () => ({ width }) })) }] } };
  const evento = { button: 0, clientX: 100, pointerId: 1, preventDefault() {}, currentTarget: { setPointerCapture() {} } };
  tabela.controles('Atividade').onPointerDown(evento);
  tabela.controles('Atividade').onPointerMove({ clientX: 180 });
  tabela = render();
  assert.deepEqual(tabela.larguras, { Atividade: 380, Responsável: 200 });
  assert.equal(tabela.larguraTotal, 580);
  tabela.controles('Atividade').onPointerMove({ clientX: -1000 });
  assert.equal(render().larguras.Atividade, 160);
  tabela.controles('Atividade').onKeyDown({ key: 'Escape' });
  assert.equal(render().larguras, null);
  tabela.controles('Responsável').onKeyDown({ key: 'ArrowRight', preventDefault() {} });
  assert.deepEqual(render().larguras, { Atividade: 300, Responsável: 216 });
  tabela.controles('Responsável').onKeyDown({ key: 'Home', preventDefault() {} });
  assert.equal(render().larguras.Responsável, 40);
  tabela.controles('Responsável').onKeyDown({ key: 'End', preventDefault() {} });
  assert.equal(render().larguras.Responsável, 1200);
  tabela = render(); tabela.restaurar();
  assert.equal(render().larguras, null);
});

test('demanda 19: formato recupera dados inválidos e nunca elimina nem duplica colunas', () => {
  const { validarFormatoPlano, COLUNAS_PLANO } = carregar('src/app/lib/formatoPlano.ts');
  for (const raw of [null, [], {colunas:['Status','Status','Inválida'],ordemCampos:{atividade:['name','name','<script>']}}]) {
    const formato=validarFormatoPlano(raw);
    assert.equal(formato.colunas.length,COLUNAS_PLANO.length);
    assert.equal(new Set(formato.colunas).size,COLUNAS_PLANO.length);
    assert.ok(formato.colunas.every(c=>COLUNAS_PLANO.includes(c)));
    assert.ok(!JSON.stringify(formato).includes('<script>'));
  }
});

test('demanda 19: cada nível mantém o mesmo número de células e o risco fica apenas na etapa', () => {
  const { VisaoTabela } = carregar('src/app/components/plano/VisaoTabela.tsx', {
    '../../auth/authStore':{useAuth:()=>({readOnly:true})}, '../../store':{useStore:()=>({})},
  });
  const antes=structuredClone(atividade);
  const html=renderToStaticMarkup(React.createElement(VisaoTabela,{metas:[{id:'m',name:'Meta',deliverables:[{...etapa,activities:[{...atividade,riskOriginId:'r1',tasks:[{id:'t',title:'Tarefa',order:1}]}]}]}], riscos:[{id:'r1',stageId:'e',status:'Aberto',severity:12}],recolhidos:new Set(),codigos:new Map(),editar:true}));
  const linhas=[...html.matchAll(/<tr data-tipo="([^"]+)"[^>]*>(.*?)<\/tr>/g)];
  assert.equal(linhas.length,4);
  for(const [,tipo,conteudo] of linhas){assert.equal((conteudo.match(/<td /g)||[]).length,13);assert.equal(conteudo.includes('Abrir risco da etapa'),tipo==='etapa');}
  assert.doesNotMatch(html, /<input|<textarea|<select|Salvar linha/);
  assert.deepEqual(atividade,antes);
});

test('demanda 19: edição global salva campos de meta, etapa, atividade e tarefa sem perder vínculos', async () => {
  let indice=0;const estados=[], salvos=[];
  const hooks={...React,useMemo:f=>f(),useRef:v=>({current:v}),useState(inicial){const i=indice++;if(!(i in estados))estados[i]=inicial;return[estados[i],v=>{estados[i]=typeof v==='function'?v(estados[i]):v;}];}};
  const {VisaoTabela}=carregar('src/app/components/plano/VisaoTabela.tsx',{
    react:hooks,'../../auth/authStore':{useAuth:()=>({readOnly:false})},
    '../../store':{useStore:()=>({updateAtividade:async(id,d)=>salvos.push({tipo:'atividade',id,d}),saveMeta:async d=>salvos.push({tipo:'meta',d}),savePeriodoEtapa:async d=>salvos.push({tipo:'etapa',d}),renameTarefa:async(id,nome)=>salvos.push({tipo:'tarefa',id,d:{nome}})})},sonner:{toast:{success(){}}},
  });
  const props={metas:[{id:'m',name:'Meta',deliverables:[{...etapa,activities:[{...atividade,tasks:[{id:'t',title:'Tarefa',order:1}]}]}]}],riscos:[],recolhidos:new Set(),codigos:new Map(),editar:true};
  const render=()=>{indice=0;return VisaoTabela(props);};
  function achar(n,p){if(!n||typeof n!=='object')return;if(Array.isArray(n)){for(const c of n){const r=achar(c,p);if(r)return r;}return;}return p(n)?n:achar(n.props?.children,p);}
  for(const [id,titulo,tipo] of [['m','Meta','meta'],['e','Etapa','etapa'],['a',atividade.name,'atividade'],['t','Tarefa','tarefa']]){
    achar(render(),n=>n.props?.['aria-label']===`Título: ${titulo}`).props.onChange({target:{value:`Novo ${tipo}`}});
    const linha=achar(render(),n=>n.props?.['data-registro']===id);
    await achar(linha,n=>n.type==='button'&&n.props.children==='Salvar linha').props.onClick();
    await new Promise(resolve=>setImmediate(resolve));
  }
  assert.deepEqual(salvos.map(s=>s.tipo),['meta','etapa','atividade','tarefa']);
  assert.equal(salvos[2].d.proximoPasso,atividade.nextStep);
  assert.equal(salvos[2].d.proximoPassoResponsavel,atividade.nextStepOwner);
  assert.equal(salvos[2].d.responsavel,atividade.responsible);
  assert.equal(salvos[1].d.etapaId,etapa.id);
});
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

test('R05: projeto mantem abas e resumo sem duplicar encaminhamentos', () => {
  for (const controlada of [false, true]) {
  let rota = { aba: 'plano', foco: null };
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
    './project-tabs/ResumoProjetoTopo': { ResumoProjetoTopo: () => null },
    './project-tabs/TabDescricao': { TabDescricao: () => null },
    './plano/TabPlanoTrabalho': { TabPlanoTrabalho: Plano },
    './orcamento/TabOrcamento': { TabOrcamento: () => null },
    './project-tabs/TabFinanceiro': { TabFinanceiro: () => null },
    './project-tabs/TabMudancas': { TabMudancas: () => null },
    './DocumentosRegistro': { DocumentosRegistro: () => null },
    sonner: { toast: { error() {} } },
  });
  const render = () => { indice = 0; return ProjectView({ project: p, onBack() {}, aoEncaminhamentos() { saidas++; },
    ...(controlada ? { abaAtual: rota.aba, focoAtual: rota.foco, aoMudarAba(aba, foco) { rota = { aba, foco }; } } : {}),
    renderEncaminhamentos: foco => React.createElement('section', { 'data-foco': foco }, 'Encaminhamentos da organização') }); };
  function achar(node, pred) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const n of node) { const r = achar(n, pred); if (r) return r; } return; }
    return pred(node) ? node : achar(node.props?.children, pred);
  }
  assert.equal(achar(render(), e => e.type === Plano).props.aoEncaminhamentos, undefined);
  assert.equal(achar(render(), e => e.type === 'section' && e.props['data-foco']), undefined);
  const resumo=()=>achar(render(),e=>e.type==='button'&&e.props['aria-controls']==='project-context-1');
  assert.equal(resumo().props['aria-expanded'],true);
  resumo().props.onClick();assert.equal(resumo().props['aria-expanded'],false);
  assert.equal(achar(render(),e=>e.props?.id==='project-context-1').props['data-expanded'],false);
  resumo().props.onClick();assert.equal(resumo().props['aria-expanded'],true);
  achar(render(), e => e.type === 'button' && e.props.children?.includes?.('Plano de Trabalho')).props.onClick();
  assert.ok(achar(render(), e => e.type === Plano));
  const atalhos = () => achar(render(), e => typeof e.props?.aoDescricao === 'function').props;
  const abaAtiva = nome => achar(render(), e => e.type === 'button' && e.props.children?.includes?.(nome)).props['aria-current'];
  atalhos().aoDescricao(); assert.equal(abaAtiva('Descrição'), 'page');
  atalhos().aoOrcamento(); assert.equal(abaAtiva('Orçamento'), 'page');
  atalhos().aoPlano(); assert.equal(abaAtiva('Plano de Trabalho'), 'page');
  assert.equal(achar(render(), e => e.type === Plano).props.pedidoVisao.visao, 'tabela');
  atalhos().aoRiscos();
  assert.equal(achar(render(), e => e.type === Plano).props.pedidoVisao.somenteAbertos, true);
  achar(render(), e => e.type === Plano).props.aoPendencias(true);
  atalhos().aoDescricao(); assert.equal(abaAtiva('Plano de Trabalho'), 'page', 'Rascunhos bloqueiam a saída pelos atalhos');
  assert.equal(achar(render(), e => e.type === 'button' && e.props['aria-label'] === 'Encaminhamentos'), undefined);
  assert.equal(saidas, 0);
  }
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
test('R02/03/04/06: tabela preserva observacoes e legado sem duplicar encaminhamentos', () => {
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
    assert.doesNotMatch(html, /Enviar convite/);
    assert.doesNotMatch(html, /Ver encaminhamento/);
    assert.match(html, /LEGADO_PRESERVADO/);
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
  const hooks = { ...React, useMemo: fn => fn(), useRef: value => ({ current: value }), useState(inicial) {
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
  achar(render(), e => e.props?.['aria-label'] === `Início realizado: ${atividade.name}`).props.onChange({ target: { value: '2026-01-01' } });
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
