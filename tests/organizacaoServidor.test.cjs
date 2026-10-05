const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Executa os handlers reais com sessão e banco isolados. Não usa credenciais,
// rede nem registros reais. O índice/trigger ainda exige teste em PostgreSQL.
function ambiente({ consulta = false, vinculados = [], orgExiste = true } = {}) {
  const escritas = [];
  const cache = new Map();
  const db = { from(tabela) {
    let inserido;
    let atualizacao;
    let filtroId;
    let codigos = false;
    const resultado = () => {
      if (inserido) return { data: { id: 101, ...inserido, comunidades: { id: inserido.comunidade_id, nome: 'Org A' } }, error: null };
      if (atualizacao) return { data: { id: filtroId }, error: null };
      if (tabela === 'comunidades') return { data: orgExiste ? { id: filtroId, nome: 'Org A' } : null, error: null };
      return { data: codigos ? [] : vinculados.map(id => ({ id })), error: null };
    };
    const builder = {
      select() { return this; },
      eq(campo, valor) {
        if (campo === 'id') {
          filtroId = valor;
          if (atualizacao) escritas[escritas.length - 1].id = valor;
        }
        return this;
      },
      ilike() { codigos = true; return this; },
      insert(dados) { inserido = dados; escritas.push({ tabela, dados, acao: 'insert' }); return this; },
      update(dados) { atualizacao = dados; escritas.push({ tabela, dados, acao: 'update' }); return this; },
      single() { return Promise.resolve(resultado()); },
      maybeSingle() { return Promise.resolve(resultado()); },
      then(resolve, reject) { return Promise.resolve(resultado()).then(resolve, reject); },
    };
    return builder;
  } };
  function carregar(arquivo) {
    const absoluto = path.resolve(__dirname, '..', arquivo.endsWith('.ts') ? arquivo : `${arquivo}.ts`);
    if (cache.has(absoluto)) return cache.get(absoluto).exports;
    const mod = { exports: {} };
    cache.set(absoluto, mod);
    const compilado = ts.transpileModule(fs.readFileSync(absoluto, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    const exigir = async () => { if (consulta) throw new Error('Sem permissão para esta operação.'); };
    new Function('require', 'module', 'exports', compilado.outputText)(request => {
      if (request === '@tanstack/react-start') return { createServerFn: () => {
        let validar = d => d;
        const fn = { validator(v) { validar = v; return fn; }, handler(h) { return args => h({ data: validar(args?.data) }); } };
        return fn;
      } };
      if (request.endsWith('/client.server')) return { supabaseAdmin: db };
      if (request === './sessao.server') return { exigirEscrita: exigir, exigirAdmin: exigir, exigirSessao: async () => ({ login: 'teste' }) };
      return carregar(path.resolve(path.dirname(absoluto), request));
    }, mod, mod.exports);
    return mod.exports;
  }
  return { carregar, escritas };
}

test('API de criação não escreve sem organização nem com organização inexistente', async () => {
  for (const comunidadeId of [undefined, null, '']) {
    const a = ambiente();
    await assert.rejects(a.carregar('src/app/projetos.server').criarProjeto({ data: { comunidadeId } }), /Selecione a organização/);
    assert.deepEqual(a.escritas, []);
  }
  const a = ambiente({ orgExiste: false });
  await assert.rejects(a.carregar('src/app/projetos.server').criarProjeto({ data: { comunidadeId: 'org-a' } }), /não encontrada/);
  assert.deepEqual(a.escritas, []);
});

test('API recusa projeto adicional e identifica todos os vínculos legados', async () => {
  const a = ambiente({ vinculados: [101, 202] });
  await assert.rejects(a.carregar('src/app/projetos.server').criarProjeto({ data: { comunidadeId: 'org-a' } }), /101, 202/);
  assert.deepEqual(a.escritas, []);
});

test('API cria projeto com ID e nome da organização selecionada', async () => {
  const a = ambiente();
  const projeto = await a.carregar('src/app/projetos.server').criarProjeto({ data: { comunidadeId: 'org-a', name: 'Projeto A', org: 'Nome enviado incorretamente' } });
  assert.equal(a.escritas[0].dados.comunidade_id, 'org-a');
  assert.equal(a.escritas[0].dados.org, 'Org A');
  assert.equal(projeto.organizacao.id, 'org-a');
});

test('API recusa alteração do vínculo antes de qualquer escrita', async () => {
  for (const campo of ['comunidadeId', 'comunidade_id', 'communityId', 'organizacao', 'org']) {
    const a = ambiente();
    await assert.rejects(a.carregar('src/app/projetos.server').atualizarProjeto({ data: { id: 101, patch: { [campo]: 'org-b' } } }), /não pode ser alterado/);
    assert.deepEqual(a.escritas, []);
  }
});

test('perfil de consulta não cria, atualiza ou disponibiliza relatórios via API', async () => {
  const a = ambiente({ consulta: true });
  const projetos = a.carregar('src/app/projetos.server');
  const orgs = a.carregar('src/app/organizacoes.server');
  await assert.rejects(projetos.criarProjeto({ data: { comunidadeId: 'org-a' } }), /Sem permissão/);
  await assert.rejects(projetos.atualizarProjeto({ data: { id: 101, patch: { name: 'Novo nome' } } }), /Sem permissão/);
  await assert.rejects(orgs.salvarLinkRelatorioOrg({ data: { organizacaoId: 'org-a', area: 'parecer', url: 'https://example.org/doc.pdf' } }), /Sem permissão/);
  assert.deepEqual(a.escritas, []);
});

test('relatório escreve só o campo e organização solicitados e rejeita áreas/URLs inválidas', async () => {
  const a = ambiente();
  const { salvarLinkRelatorioOrg } = a.carregar('src/app/organizacoes.server');
  await salvarLinkRelatorioOrg({ data: { organizacaoId: 'org-a', area: 'mapeamento', url: 'https://example.org/mapa.pdf' } });
  assert.deepEqual(a.escritas, [{ tabela: 'comunidades', acao: 'update', id: 'org-a', dados: { mapeamento_relatorio_url: 'https://example.org/mapa.pdf' } }]);
  await assert.rejects(salvarLinkRelatorioOrg({ data: { organizacaoId: 'org-a', area: 'outra', url: 'https://example.org' } }), /Área de relatório inválida/);
  await assert.rejects(salvarLinkRelatorioOrg({ data: { organizacaoId: 'org-a', area: 'parecer', url: 'javascript:alert(1)' } }), /link externo válido/);
  assert.equal(a.escritas.length, 1);
});
