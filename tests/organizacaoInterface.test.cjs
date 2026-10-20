const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Renderização dos componentes reais com hooks de sessão/leitura isolados.
// Não substitui ensaio no navegador para rolagem, foco e operações persistidas.
function carregarInterface(arquivo, { readOnly = false, org, project, listaState, gantt = [], tarefas = [] } = {}) {
  const cache = new Map();
  const vazio = () => null;
  const mocks = {
    authStore: { useAuth: () => ({ user: { login: 'teste', displayName: 'Verificador', role: readOnly ? 'visualizador' : 'admin' }, readOnly, isAdmin: !readOnly }), usePeople: () => [{ login:'maria', name:'Maria', role:'admin' }] },
    auditStore: { useAudit: () => ({ log: () => {} }) },
    useAgenda: { useAgenda: () => ({ paraMim: [] }) },
    useOrganizacoes: { useFichaOrganizacao: () => ({ data: org }), useListaOrganizacoes: () => listaState ?? ({ data: org ? [org] : [] }), useEscritaOrganizacao: () => ({ salvarLinkRelatorio: async () => {} }) },
    store: { useStore: () => ({ gantt, projects: project ? [project] : [], getProject: id => project?.id === id ? project : undefined }) },
    useGestaoTarefas: { useGestaoTarefas: () => ({ tarefas, loading:false }) },
    AbaRegistrosContato: { AbaRegistrosContato: vazio },
    AbaEncaminhamentos: { AbaEncaminhamentos: vazio },
    NotasDaOrganizacao: { NotasDaOrganizacao: vazio },
    DocumentosRegistro: { DocumentosRegistro: ({area,organizacaoId}) => React.createElement('section',{'data-documentos-area':area,'data-documentos-org':organizacaoId},'Documentos anexados') },
    DiagnosticoModule: { DiagnosticoModule: ({comunidadeId,instrumentoInicial}) => React.createElement('section',{'data-diagnostico-org':comunidadeId,'data-instrumento':instrumentoInicial},'Instrumentos de diagnóstico') },
    ResumoProjetoTopo: { ResumoProjetoTopo: vazio },
    TabDescricao: { TabDescricao: vazio },
    TabPlanoTrabalho: { TabPlanoTrabalho: ({ project }) => React.createElement('section', { 'data-plano-projeto': project.id }, 'Plano do projeto') },
    TabOrcamento: { TabOrcamento: vazio },
    TabFinanceiro: { TabFinanceiro: vazio },
    TabMudancas: { TabMudancas: vazio },
    'orcamento.server': {},
    'orcamentoImportacao.server': {},
    FormularioExecucao: { FormularioExecucao: vazio },
    FormularioPlanejado: { FormularioPlanejado: vazio },
    FormularioNota: { FormularioNota: vazio },
    DialogoExclusaoItem: { DialogoExclusaoItem: vazio },
    PainelHistoricoItem: { PainelHistoricoItem: vazio },
    DialogoImportacao: { DialogoImportacao: vazio },
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
  assert.ok(html.indexOf('</nav>') < html.indexOf('Configurações'));
  assert.ok(html.indexOf('Configurações') < html.indexOf('Verificador'));
  assert.equal((html.match(/>Configurações</g) ?? []).length, 1);
  assert.match(html, /aria-label="Recolher menu lateral"[^>]*aria-expanded="true"/);
  assert.match(html, /src="\/logos\/cria.png"/);
  assert.match(html, /src="\/logos\/ca.png"/);
  assert.doesNotMatch(html, /Sistema Inova/);
  const compacto = renderToStaticMarkup(React.createElement(Sidebar, {
    activeItem: 'diagnostics', onNavigate: () => {}, rotaOrg: { orgId: null }, aoNavegarOrg: () => {}, collapsed: true,
  }));
  assert.match(compacto, /data-collapsed="true"/);
  assert.match(compacto, /aria-label="Expandir menu lateral"[^>]*aria-expanded="false"/);
  assert.match(compacto, /aria-label="Diagnóstico"/);
});

test('Kanban exibe responsável sem conta e criador da tarefa automática; consulta não oferece escrita', () => {
  const tarefa={id:'atividade:a1',titulo:'Cotação de material',atribuidoParaLogin:'nome:responsavel externo',atribuidoParaNome:'Responsável externo',
    atribuidoPorNome:'Pessoa que abriu',atribuidoPorLogin:'criadora',dataEntrada:'',dataLimite:'',criticidade:0,status:'nao_iniciado',
    projetos:[],origem:{tipo:'atividade',registroId:'a1',caminho:'Projeto › Meta › Etapa'},criadoEm:'',atualizadoEm:'',concluidaEm:null};
  const {GestaoPage}=carregarInterface('src/app/components/GestaoPage.tsx',{readOnly:true,tarefas:[tarefa]});
  const html=renderToStaticMarkup(React.createElement(GestaoPage));
  assert.match(html,/Responsável externo/);assert.match(html,/Criada por Pessoa que abriu/);
  assert.match(html,/Cotação de material/);assert.match(html,/Projeto › Meta › Etapa/);
  assert.doesNotMatch(html,/Invalid Date|Nova tarefa|Excluir tarefa|<select/);
});

test('Kanban unifica colunas dos apelidos e apresenta tarefa conjunta na equipe e na pessoa', () => {
  const gantt=[{id:1,bloco:'Interno',entregas:[{id:2,entrega:'Etapa',atividades:[
    {id:3,atividade:'Primeira',responsavel:'Ana Luiza',status:'Não iniciado',inicio:'',fim:''},
    {id:4,atividade:'Segunda',responsavel:'Ana Souto',status:'Não iniciado',inicio:'',fim:''},
    {id:5,atividade:'Compartilhada',responsavel:'CESUPA + João Marcelo',status:'Não iniciado',inicio:'',fim:''},
  ]}]}];
  const {GestaoPage}=carregarInterface('src/app/components/GestaoPage.tsx',{readOnly:true,gantt});
  const html=renderToStaticMarkup(React.createElement(GestaoPage));
  assert.equal((html.match(/>Ana Luiza Souto</g)??[]).length,1);
  assert.doesNotMatch(html,/>Ana Souto<|>Ana Luiza</);
  assert.match(html,/Instituições \/ Coordenadores/);assert.match(html,/João Marcelo/);
  assert.equal((html.match(/>Compartilhada</g)??[]).length,2);
});

test('plano administrativo renderiza tabela e controles comuns sem abrir projeto de organização', () => {
  const gantt = [{ id: 1, bloco: 'Administração', entregas: [{ id: 2, entrega: 'Etapa interna', inicio: '2026-10-01', fim: '2026-10-31', atividades: [{ id: 3, atividade: 'Atividade interna', inicio: '2026-10-01', fim: '2026-10-31', status: 'Não iniciado' }] }] }];
  for (const readOnly of [false, true]) {
    const { PlanoAdministrativo } = carregarInterface('src/app/components/PlanoAdministrativo.tsx', { readOnly, gantt });
    const html = renderToStaticMarkup(React.createElement(PlanoAdministrativo));
    assert.match(html, /Administração/);
    assert.match(html, /Expandir tudo/);
    for (const campo of ['Tabela', 'Gantt', 'Kanban', 'Responsável', 'Início previsto', 'Fim previsto', 'Justificativa de atraso']) assert.ok(html.includes(campo), campo);
    assert.ok(!html.includes('data-plano-projeto'));
  }
});

test('orçamento exibe a meta real de cada item e diferencia legado sem vínculo', () => {
  const item = { id: 'item-a', grupo: 'Materiais', ordem: 1, categoria: 'Consumo', descricao: 'Computador', qtd: 1, unidade: 'un', qtdUnidades: 1, valorUnitario: 10, valorProposto: 10, valorPlanejado: 10, valorExecutado: null, dataCompra: null, justificativaDiferenca: '', execucaoConcluida: false, situacao: 'Ativo', motivoExclusao: null, riscoId: null };
  const project = { id: 7, goals: [{ id: 'meta-a', name: 'Estruturação', deliverables: [] }], orcamentoItens: [{ ...item, metaId: 'meta-a' }, { ...item, id: 'item-b', descricao: 'Legado', metaId: null }], orcamentoNotas: [] };
  const { TabOrcamento } = carregarInterface('src/app/components/orcamento/TabOrcamento.tsx', { project, readOnly: true });
  const html = renderToStaticMarkup(React.createElement(TabOrcamento, { project }));
  assert.match(html, /Meta 1 — Estruturação/);
  assert.match(html, /Meta não vinculada/);
});

test('AT-017/020: desktop e celular apresentam seis seções na ordem e organização corretas', () => {
  const nomes = ['Cadastro', 'Projeto', 'Diagnóstico / Mapeamento', 'Parecer', 'Encaminhamento', 'Registro de Contato'];
  for (const id of ['org-a', 'org-b']) {
    const org = { id, nome: id, categoria: 'Indígena', tipo: 'Associação', projetos: [], registros: [], pessoas: [], pendentes: 0 };
    for (const secao of ['dados', 'projeto', 'mapeamento', 'parecer', 'encaminhamentos', 'registros']) {
      const componentes = carregarInterface('src/app/components/Sidebar.tsx', { org });
      const ficha = carregarInterface('src/app/components/organizacoes/FichaOrganizacao.tsx', { org });
      const rota = { orgId: id, secao, projetoId: null };
      const desktop = renderToStaticMarkup(React.createElement(componentes.Sidebar, { activeItem: 'organizations', rotaOrg: rota, onNavigate: () => {}, aoNavegarOrg: () => {} }));
      const celular = renderToStaticMarkup(React.createElement(ficha.FichaOrganizacao, { rota, aoNavegar: () => {} }));
      assert.doesNotMatch(celular.split('</select>')[0], /Categoria não informada|Tipo não informado|Indígena|Associação/);
      for (const html of [desktop, celular]) {
        const posicoes = nomes.map(nome => html.indexOf(`>${nome}<`));
        assert.ok(posicoes.every(p => p >= 0));
        assert.deepEqual(posicoes, [...posicoes].sort((a, b) => a - b));
        const atual = { dados: 'Cadastro', projeto: 'Projeto', mapeamento: 'Diagnóstico / Mapeamento', parecer: 'Parecer', encaminhamentos: 'Encaminhamento', registros: 'Registro de Contato' }[secao];
        assert.ok(html.includes(id));
        if (html === desktop) assert.match(html, new RegExp(`aria-current="page"[^>]*><span[^>]*><span[^>]*>${atual}<`));
        else {
          assert.match(html,/aria-label="Seção da organização"/);
          assert.match(html,new RegExp(`<option[^>]*selected=""[^>]*>${atual}<`));
        }
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

test('ficha mantém um único H1 e isola diagnóstico e documentos por organização', () => {
  for (const id of ['org-a', 'org-b']) {
    const org = { id, nome: id, categoria: 'Indígena', tipo: 'Associação', projetos: [], registros: [], pendentes: 0, parecerRelatorioUrl: `https://example.org/${id}.pdf` };
    const { FichaOrganizacao } = carregarInterface('src/app/components/organizacoes/FichaOrganizacao.tsx', { org, readOnly: true });
    const html = renderToStaticMarkup(React.createElement(FichaOrganizacao, { rota: { orgId: id, secao: 'parecer', projetoId: null }, aoNavegar: () => {} }));
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    const titulo = html.match(/<h1\b[^>]*>(.*?)<\/h1>/)?.[1] ?? '';
    assert.ok(titulo.includes('Organizações'));
    assert.ok(titulo.includes(`>${id}</span>`));
    assert.ok(html.includes(`data-diagnostico-org="${id}"`));
    assert.ok(html.includes(`data-documentos-org="${id}"`));
    assert.ok(html.includes('data-instrumento="parecer"'));
    assert.ok(!html.includes('Em construção'));
  }
});

test('projeto mostra Organizações e nome do projeto no título, com abas sem parecer antigo', () => {
  const project = { id: 101, name: 'Projeto A', code: '01-2026', financier: 'Financiador', status: 'Não iniciado', risks: [], changes: [], organizacao: { id: 'org-a', nome: 'Org A' } };
  const { ProjectView } = carregarInterface('src/app/components/ProjectView.tsx', { readOnly: true });
  const html = renderToStaticMarkup(React.createElement(ProjectView, { project, onBack: () => {} }));
  const titulo = html.match(/<h1\b[^>]*>(.*?)<\/h1>/)?.[1] ?? '';
  assert.ok(titulo.includes('Organizações'));
  assert.ok(titulo.includes('Projeto A</span>'));
  assert.ok(!html.includes('Caminho de navegação'), 'Sem breadcrumb duplicado abaixo do título');
  assert.ok(!html.includes('Projeto A</h2>'));
  assert.ok(html.includes('Resumo do projeto'));
  for (const aba of ['Descrição', 'Plano de Trabalho', 'Orçamento']) assert.ok(html.includes(aba));
  assert.ok(!html.includes('Parecer técnico'));
  assert.ok(!html.includes('Link do Plano de Trabalho'));
  const dentro = renderToStaticMarkup(React.createElement(ProjectView, { project, onBack: () => {}, dentroDaOrganizacao: true }));
  assert.ok(!dentro.includes('<h1'));
  assert.ok(!html.includes('Mudanças'));
  assert.ok(!html.includes('Ordenar'));
  const nav=html.match(/<nav[^>]*aria-label="Abas do projeto"[^>]*>(.*?)<\/nav>/s)?.[1] ?? '';
  assert.equal((nav.match(/<button\b/g)??[]).length,3);
});

test('cadastro segue identificação, pessoas, localização e projetos sem perder classificação',()=>{
  const org={id:'org-a',nome:'Organização de teste',codigo:'ORG-1',tipo:'Cooperativa',categoria:'Agricultura Familiar',eixo:'Produção',municipio:'Belém',uf:'PA',localizacao:'Área de teste',territorio:'Território',responsavelTecnico:'Equipe',pessoas:[],projetos:[]};
  const {DadosCadastrais}=carregarInterface('src/app/components/organizacoes/FichaOrganizacao.tsx');
  const html=renderToStaticMarkup(React.createElement(DadosCadastrais,{org,aoAbrirProjeto(){}}));
  const pos=['Identificação da organização','Pessoas de referência','Localização','Projetos vinculados'].map(s=>html.indexOf(s));
  assert.ok(pos.every(p=>p>=0));assert.deepEqual(pos,[...pos].sort((a,b)=>a-b));
  for(const valor of ['Agricultura Familiar','Produção','Belém/PA','ORG-1','Território'])assert.ok(html.includes(valor));
});
