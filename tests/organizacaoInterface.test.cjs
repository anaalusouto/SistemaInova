const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Renderização dos componentes reais com hooks de sessão/leitura isolados.
// Não substitui ensaio no navegador para rolagem, foco e operações persistidas.
function carregarInterface(arquivo, { readOnly = false, org, project, listaState } = {}) {
  const cache = new Map();
  const vazio = () => null;
  const mocks = {
    authStore: { useAuth: () => ({ user: { login: 'teste', displayName: 'Verificador', role: readOnly ? 'visualizador' : 'admin' }, readOnly, isAdmin: !readOnly }) },
    auditStore: { useAudit: () => ({ log: () => {} }) },
    useAgenda: { useAgenda: () => ({ paraMim: [] }) },
    useOrganizacoes: { useFichaOrganizacao: () => ({ data: org }), useListaOrganizacoes: () => listaState ?? ({ data: org ? [org] : [] }), useEscritaOrganizacao: () => ({ salvarLinkRelatorio: async () => {} }) },
    store: { useStore: () => ({ getProject: id => project?.id === id ? project : undefined }) },
    AbaRegistrosContato: { AbaRegistrosContato: vazio },
    AbaEncaminhamentos: { AbaEncaminhamentos: vazio },
    NotasDaOrganizacao: { NotasDaOrganizacao: vazio },
    ProjectSummaryHeader: { ProjectSummaryHeader: vazio },
    TabDescricao: { TabDescricao: vazio },
    TabPlanoTrabalho: { TabPlanoTrabalho: ({ project }) => React.createElement('section', { 'data-plano-projeto': project.id }, 'Plano do projeto') },
    TabOrcamento: { TabOrcamento: vazio },
    TabFinanceiro: { TabFinanceiro: vazio },
    TabMudancas: { TabMudancas: vazio },
  };
  function load(nome) {
    const absoluto = path.resolve(__dirname, '..', nome);
    const resolvido = fs.existsSync(absoluto) ? absoluto : fs.existsSync(`${absoluto}.tsx`) ? `${absoluto}.tsx` : `${absoluto}.ts`;
    if (cache.has(resolvido)) return cache.get(resolvido).exports;
    const mod = { exports: {} };
    cache.set(resolvido, mod);
    const code = ts.transpileModule(fs.readFileSync(resolvido, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function('require', 'module', 'exports', code)(request => {
      if (request.endsWith('.css')) return {};
      if (!request.startsWith('.')) return require(request);
      const base = path.basename(request);
      if (mocks[base]) return mocks[base];
      return load(path.resolve(path.dirname(resolvido), request));
    }, mod, mod.exports);
    return mod.exports;
  }
  return load(arquivo);
}

test('menu renderiza as três subáreas uma vez e na ordem aprovada', () => {
  const { Sidebar } = carregarInterface('src/app/components/Sidebar.tsx');
  const html = renderToStaticMarkup(React.createElement(Sidebar, {
    activeItem: 'diagnostics', onNavigate: () => {}, rotaOrg: { orgId: null }, aoNavegarOrg: () => {},
  }));
  assert.equal((html.match(/>Diagnóstico</g) ?? []).length, 1);
  assert.equal((html.match(/>Relatórios</g) ?? []).length, 1);
  assert.ok(html.indexOf('>Projeto<') < html.indexOf('>Diagnóstico<'));
  assert.ok(html.indexOf('>Diagnóstico<') < html.indexOf('>Relatórios<'));
  assert.match(html, /aria-label="Subáreas de Gestão Interna"/);
  assert.ok(html.indexOf('>Visão Geral<') < html.indexOf('>Organizações<'));
  assert.ok(html.indexOf('>Organizações<') < html.indexOf('Gestão Interna'));
});

test('AT-017/020: desktop e celular apresentam seis seções na ordem e organização corretas', () => {
  const nomes = ['Cadastro', 'Projeto', 'Mapeamento (Em construção)', 'Parecer (Em construção)', 'Encaminhamento', 'Registro de Contato'];
  for (const id of ['org-a', 'org-b']) {
    const org = { id, nome: id, categoria: 'Indígena', tipo: 'Associação', projetos: [], registros: [], pessoas: [], pendentes: 0 };
    for (const secao of ['dados', 'projeto', 'encaminhamentos', 'registros']) {
      const componentes = carregarInterface('src/app/components/Sidebar.tsx', { org });
      const ficha = carregarInterface('src/app/components/organizacoes/FichaOrganizacao.tsx', { org });
      const rota = { orgId: id, secao, projetoId: null };
      const desktop = renderToStaticMarkup(React.createElement(componentes.Sidebar, { activeItem: 'organizations', rotaOrg: rota, onNavigate: () => {}, aoNavegarOrg: () => {} }));
      const celular = renderToStaticMarkup(React.createElement(ficha.FichaOrganizacao, { rota, aoNavegar: () => {} }));
      for (const html of [desktop, celular]) {
        const posicoes = nomes.map(nome => html.indexOf(`>${nome}<`));
        assert.ok(posicoes.every(p => p >= 0));
        assert.deepEqual(posicoes, [...posicoes].sort((a, b) => a - b));
        const atual = { dados: 'Cadastro', projeto: 'Projeto', encaminhamentos: 'Encaminhamento', registros: 'Registro de Contato' }[secao];
        assert.ok(html.includes(id));
        if (html === desktop) assert.match(html, new RegExp(`aria-current="page"[^>]*><span[^>]*><span[^>]*>${atual}<`));
        else assert.match(html, new RegExp(`aria-selected="true"[^>]*>${atual}<`));
      }
    }
  }
});

test('AT-009/011: Organizações começa pela lista e distingue carregamento, erro e busca vazia', () => {
  const filtros = { busca: '', categorias: [], tipos: [], ufs: [], situacoes: [] };
  const org = { id: 'org-a', nome: 'Org A', codigo: 'ORG-01', categoria: 'Indígena', tipo: 'Associação', projetos: [], pendentes: 0 };
  const { OrganizacoesModule } = carregarInterface('src/app/components/organizacoes/OrganizacoesModule.tsx', { org });
  const html = renderToStaticMarkup(React.createElement(OrganizacoesModule, { rota: { orgId: null, secao: 'dados', projetoId: null }, aoNavegar: () => {} }));
  assert.match(html, /Organizações<\/h1>/);
  assert.match(html, /aria-label="Buscar organização"/);
  assert.match(html, /Org A/);
  assert.match(html, /Ordenar por/);
  assert.match(html, /<option value="nome" selected="">Organização<\/option>/);
  assert.match(html, /<option value="categoria">Categoria<\/option>/);
  assert.match(html, /<option value="tipo">Tipo<\/option>/);
  assert.match(html, /alternar para decrescente/);
  assert.ok(!html.includes('<table'));
  assert.ok(!html.includes('Visão Geral'));
  assert.ok(!html.includes('Execução Financeira'));
  for (const [state, busca, esperado] of [
    [{ data: [], isLoading: true }, '', 'Carregando organizações'],
    [{ data: [], error: new Error('Falha controlada') }, '', 'Não foi possível carregar as organizações. Falha controlada'],
    [{ data: [] }, '', 'Nenhuma organização cadastrada.'],
    [{ data: [org] }, 'inexistente', 'Nenhuma organização encontrada com essa busca ou esses filtros.'],
  ]) {
    const { ListaOrganizacoes } = carregarInterface('src/app/components/organizacoes/ListaOrganizacoes.tsx', { listaState: state });
    const render = renderToStaticMarkup(React.createElement(ListaOrganizacoes, { filtros: { ...filtros, busca }, aoMudarFiltros: () => {}, aoAbrir: () => {} }));
    assert.ok(render.includes(esperado));
  }
});

test('AT-021/022/024/025: ficha abre plano único e informa ausência/conflito sem abrir outro projeto', () => {
  const project = { id: 101, name: 'Projeto A', code: '01-2026', financier: 'Financiador', status: 'Não iniciado', risks: [], changes: [], organizacao: { id: 'org-a', nome: 'Org A' } };
  for (const [projetos, solicitado, esperado] of [
    [[{ id: 101, nome: 'Projeto A' }], null, 'data-plano-projeto="101"'],
    [[], null, 'Nenhum projeto vinculado'],
    [[{ id: 101, nome: 'Projeto A' }, { id: 202, nome: 'Projeto B' }], 101, 'Projetos vinculados: 101, 202'],
    [[{ id: 101, nome: 'Projeto A' }], 202, 'Vínculo de projeto inválido'],
  ]) {
    const org = { id: 'org-a', nome: 'Org A', categoria: 'Indígena', tipo: 'Associação', projetos, registros: [], pendentes: 0 };
    const { FichaOrganizacao } = carregarInterface('src/app/components/organizacoes/FichaOrganizacao.tsx', { org, project });
    const html = renderToStaticMarkup(React.createElement(FichaOrganizacao, { rota: { orgId: 'org-a', secao: 'projeto', projetoId: solicitado }, aoNavegar: () => {} }));
    assert.ok(html.includes(esperado));
    if (!esperado.startsWith('data-plano')) assert.ok(!html.includes('data-plano-projeto'));
  }
});

test('página informativa abre relatório externo e não oferece escrita ao perfil de consulta', () => {
  for (const titulo of ['Mapeamento', 'Parecer']) {
    const { OrganizacaoEmConstrucao } = carregarInterface('src/app/components/organizacoes/OrganizacaoEmConstrucao.tsx', { readOnly: true });
    const html = renderToStaticMarkup(React.createElement(OrganizacaoEmConstrucao, { titulo, organizacaoId: 'org-a', relatorioUrl: 'https://example.org/relatorio.pdf' }));
    assert.ok(html.includes(`${titulo} (Em construção)`));
    assert.match(html, /href="https:\/\/example.org\/relatorio.pdf" target="_blank"/);
    assert.ok(!html.includes('Disponibilizar relatório externo'));
    assert.ok(!html.includes('Editar link do relatório'));
    assert.ok(!html.includes('<form'));
  }
});

test('ficha mantém um único H1 por organização e isola o relatório de cada contexto', () => {
  for (const id of ['org-a', 'org-b']) {
    const org = { id, nome: id, categoria: 'Indígena', tipo: 'Associação', projetos: [], registros: [], pendentes: 0, parecerRelatorioUrl: `https://example.org/${id}.pdf` };
    const { FichaOrganizacao } = carregarInterface('src/app/components/organizacoes/FichaOrganizacao.tsx', { org, readOnly: true });
    const html = renderToStaticMarkup(React.createElement(FichaOrganizacao, { rota: { orgId: id, secao: 'parecer', projetoId: null }, aoNavegar: () => {} }));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.ok(html.includes(`>${id}</h1>`));
    assert.ok(html.includes(`https://example.org/${id}.pdf`));
    assert.ok(!html.includes(`https://example.org/${id === 'org-a' ? 'org-b' : 'org-a'}.pdf`));
  }
});

test('projeto mostra organização e abas sem acesso antigo ao parecer técnico', () => {
  const project = { id: 101, name: 'Projeto A', code: '01-2026', financier: 'Financiador', status: 'Não iniciado', risks: [], changes: [], organizacao: { id: 'org-a', nome: 'Org A' } };
  const { ProjectView } = carregarInterface('src/app/components/ProjectView.tsx', { readOnly: true });
  const html = renderToStaticMarkup(React.createElement(ProjectView, { project, onBack: () => {} }));
  assert.ok(html.includes('Org A</h1>'));
  assert.ok(html.includes('Projeto A</h2>'));
  for (const aba of ['Descrição', 'Plano de Trabalho', 'Orçamento']) assert.ok(html.includes(aba));
  assert.ok(!html.includes('Parecer técnico'));
  assert.ok(!html.includes('Link do Plano de Trabalho'));
  const dentro = renderToStaticMarkup(React.createElement(ProjectView, { project, onBack: () => {}, dentroDaOrganizacao: true }));
  assert.ok(!dentro.includes('<h1'));
});
