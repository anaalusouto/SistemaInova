const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Renderização dos componentes reais com hooks de sessão/leitura isolados.
// Não substitui ensaio no navegador para rolagem, foco e operações persistidas.
function carregarInterface(arquivo, { readOnly = false, org } = {}) {
  const cache = new Map();
  const vazio = () => null;
  const mocks = {
    authStore: { useAuth: () => ({ user: { login: 'teste', displayName: 'Verificador', role: readOnly ? 'visualizador' : 'admin' }, readOnly, isAdmin: !readOnly }) },
    auditStore: { useAudit: () => ({ log: () => {} }) },
    useAgenda: { useAgenda: () => ({ paraMim: [] }) },
    useOrganizacoes: { useFichaOrganizacao: () => ({ data: org }), useListaOrganizacoes: () => ({ data: org ? [org] : [] }), useEscritaOrganizacao: () => ({ salvarLinkRelatorio: async () => {} }) },
    store: { useStore: () => ({ getProject: () => undefined }) },
    AbaRegistrosContato: { AbaRegistrosContato: vazio },
    AbaEncaminhamentos: { AbaEncaminhamentos: vazio },
    NotasDaOrganizacao: { NotasDaOrganizacao: vazio },
    ProjectSummaryHeader: { ProjectSummaryHeader: vazio },
    TabDescricao: { TabDescricao: vazio },
    TabPlanoTrabalho: { TabPlanoTrabalho: vazio },
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
