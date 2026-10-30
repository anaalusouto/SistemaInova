const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function('exports', ts.transpileModule(fs.readFileSync('src/app/lib/navegacaoApp.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(mod.exports);
const { validarBuscaApp, buscaDaOrganizacao, rotaDaBusca } = mod.exports;

test('URL valida contexto, descarta campos inválidos e não carrega formulário ou sessão', () => {
  assert.deepEqual(validarBuscaApp({ area: 'inexistente', token: 'segredo' }), {});
  assert.deepEqual(validarBuscaApp({ area: 'reports', org: 'org-a', projeto: 12, aba: 'orcamento' }), { area: 'reports' });
  assert.deepEqual(validarBuscaApp({ area: 'schedule', gestao: 'rotas', org: 'org-a' }), { area: 'schedule', gestao: 'rotas' });
  assert.deepEqual(validarBuscaApp({ area: 'schedule', gestao: 'inexistente' }), { area: 'schedule', gestao: 'plano' });
  assert.deepEqual(validarBuscaApp({ area: 'schedule', gestao: 'rotas', popup:'rotas:dia:3' }), { area:'schedule', gestao:'rotas', popup:'rotas:dia:3' });
  assert.deepEqual(validarBuscaApp({ area: 'schedule', popup:'javascript:alert(1)' }), { area:'schedule', gestao:'plano' });
  assert.deepEqual(validarBuscaApp({ area: 'organizations', org: [], projeto: -1 }), { area: 'organizations' });
  assert.deepEqual(validarBuscaApp({ area: 'organizations', org: 'org-a', secao: 'projeto', projeto: '12', aba: 'invalida', observacoes: 'rascunho' }),
    { area: 'organizations', org: 'org-a', secao: 'projeto', projeto: 12, aba: 'plano' });
  const rota = { orgId: 'org-a', secao: 'projeto', projetoId: 12, abaProjeto: 'plano', foco: 'atividade-a' };
  assert.deepEqual(rotaDaBusca(buscaDaOrganizacao(rota)), rota);
  assert.deepEqual(validarBuscaApp({ area:'organizations', org:'org-a', secao:'projeto', projeto:12, aba:'encaminhamentos', foco:'atividade-a' }), { area:'organizations', org:'org-a', secao:'encaminhamentos', foco:'atividade-a' });
  assert.deepEqual(buscaDaOrganizacao({ ...rota, secao: 'registros' }), { area: 'organizations', org: 'org-a', secao: 'registros', foco: 'atividade-a' });
});

test('histórico real restaura versão e instrumento do Mapeamento, inclusive após recarga', async () => {
  const { createRouter, createRootRoute, createRoute, createMemoryHistory } = await import('@tanstack/react-router');
  for (const base of [{area:'diagnostics'}, {area:'organizations',org:'org-a',secao:'mapeamento'}]) {
    const root=createRootRoute();const index=createRoute({getParentRoute:()=>root,path:'/',validateSearch:validarBuscaApp});
    const history=createMemoryHistory({initialEntries:['/']});const router=createRouter({routeTree:root.addChildren([index]),history,isServer:true});await router.load();
    const estados=[{...base,org:'org-a',visaoDiagnostico:'versoes'}, {...base,org:'org-a',visaoDiagnostico:'editor',diagnostico:'v1',instrumento:'resumo'}, {...base,org:'org-a',visaoDiagnostico:'editor',diagnostico:'v1',instrumento:'matriz'}, {...base,org:'org-a',visaoDiagnostico:'editor',diagnostico:'v1',instrumento:'ieo'}];
    const carregar=async()=>{router.updateLatestLocation();await router.load();};const ler=()=>router.state.matches.at(-1).search;
    for(const search of estados){history.push(router.buildLocation({to:'/',search}).href);await carregar();}
    assert.deepEqual(ler(),estados[3]);history.back();await carregar();assert.deepEqual(ler(),estados[2]);
    history.back();await carregar();assert.deepEqual(ler(),estados[1]);history.forward();await carregar();assert.deepEqual(ler(),estados[2]);
    const root2=createRootRoute();const index2=createRoute({getParentRoute:()=>root2,path:'/',validateSearch:validarBuscaApp});
    const recarregado=createRouter({routeTree:root2.addChildren([index2]),history:createMemoryHistory({initialEntries:[history.location.href]}),isServer:true});await recarregado.load();
    assert.deepEqual(recarregado.state.matches.at(-1).search,estados[2]);
  }
  assert.deepEqual(validarBuscaApp({area:'organizations',org:'org-a',secao:'dados',diagnostico:'v1',instrumento:'ieo'}),{area:'organizations',org:'org-a',secao:'dados'});
  assert.deepEqual(validarBuscaApp({area:'diagnostics',org:'org-a',visaoDiagnostico:'invalida',instrumento:'segredo',rascunho:'texto'}),{area:'diagnostics',org:'org-a'});
});

test('histórico real do TanStack volta entre abas e organizações, avança e restaura após recarga', async () => {
  const { createRouter, createRootRoute, createRoute, createMemoryHistory } = await import('@tanstack/react-router');
  const criar = (href = '/') => {
    const root = createRootRoute();
    const index = createRoute({ getParentRoute: () => root, path: '/', validateSearch: validarBuscaApp });
    const history = createMemoryHistory({ initialEntries: [href] });
    const router = createRouter({ routeTree: root.addChildren([index]), history, isServer: true });
    return { router, history };
  };
  const { router, history } = criar();
  await router.load();
  const plano = buscaDaOrganizacao({ orgId: 'org-a', secao: 'projeto', projetoId: 12 });
  const orcamento = { ...plano, aba: 'orcamento' };
  const encaminhamentos = { area: 'organizations', org: 'org-a', secao: 'encaminhamentos', foco: 'atividade-a' };
  const detalhe = { ...encaminhamentos, popup:'enc-org-a:enc:encaminhamento-a' };
  const outro = buscaDaOrganizacao({ orgId: 'org-b', secao: 'projeto', projetoId: 25 });
  // O adapter React faz a atualização no navegador. Aqui usamos o histórico
  // em memória e o parser reais, sem DOM e sem simular dados da plataforma.
  const carregar = async () => { router.updateLatestLocation(); await router.load(); };
  for (const search of [plano, orcamento, encaminhamentos, detalhe, outro]) {
    history.push(router.buildLocation({ to: '/', search }).href);
    await carregar();
  }
  const ler = () => router.state.matches.at(-1).search;
  assert.deepEqual(ler(), outro);
  history.back(); await carregar(); assert.deepEqual(ler(), detalhe);
  history.back(); await carregar(); assert.deepEqual(ler(), encaminhamentos);
  history.forward(); await carregar(); assert.deepEqual(ler(), detalhe);
  const recarregado = criar(history.location.href);
  await recarregado.router.load();
  assert.deepEqual(recarregado.router.state.matches.at(-1).search, detalhe);
  history.back(); await carregar();
  history.back(); await carregar();
  history.back(); await carregar(); assert.deepEqual(ler(), plano);
  history.back(); await carregar(); assert.deepEqual(ler(), {});
  assert.equal(history.location.pathname, '/', 'Voltar percorre a aplicação até a entrada');
});
