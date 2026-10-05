const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Executa os handlers reais com sessão e banco isolados. Não usa credenciais,
// rede nem registros reais. O índice/trigger ainda exige teste em PostgreSQL.
function ambiente({ consulta = false, vinculados = [], orgExiste = true, etapa } = {}) {
  const escritas = [];
  const cache = new Map();
  const db = { from(tabela) {
    let inserido;
    let atualizacao;
    let filtroId;
    let codigos = false;
    const resultado = () => {
      if (tabela === 'etapas') return { data: etapa, error: null };
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

test('AT-049: criar e editar atividade exigem justificativa somente para datas posteriores', async () => {
  const etapa = { id: 'etapa-a', inicio_previsto: '2026-10-01', fim_previsto: '2026-10-31', inicio_realizado: null, fim_realizado: null };
  for (const inicioRealizado of ['2026-10-09', '2026-10-10', '2026-10-11']) {
    for (const fimRealizado of ['2026-10-19', '2026-10-20', '2026-10-21']) {
      for (const editar of [false, true]) {
        const a = ambiente({ etapa });
        const plano = a.carregar('src/app/planoTrabalho.server');
        const dados = {
          etapaId: 'etapa-a', nome: 'Atividade de teste', responsavel: 'Equipe', status: 'Em andamento', progresso: 30,
          inicioPrevisto: '2026-10-10', fimPrevisto: '2026-10-20', inicioRealizado, fimRealizado,
          justificativaAtraso: '', vinculoOrcamentario: 'Não informado', observacoes: '',
          proximoPasso: '', proximoPassoResponsavel: '', proximoPassoPrazo: null,
        };
        const salvar = () => editar
          ? plano.atualizarAtividade({ data: { atividadeId: 'atividade-a', dados } })
          : plano.criarAtividade({ data: dados });
        const atraso = inicioRealizado > dados.inicioPrevisto || fimRealizado > dados.fimPrevisto;
        if (atraso) {
          await assert.rejects(salvar(), erro => {
            assert.equal(erro.name, 'DadosInvalidos');
            assert.match(erro.message, /posterior/);
            assert.match(erro.message, /Preencha o campo "Justificativa de atraso"/);
            return true;
          });
          assert.deepEqual(a.escritas, []);
          dados.justificativaAtraso = 'Fornecedor indisponível no período previsto.';
        }
        await salvar();
        assert.equal(a.escritas.length, 1);
        assert.equal(a.escritas[0].tabela, 'atividades');
        assert.equal(a.escritas[0].dados.inicio_realizado, inicioRealizado);
        assert.equal(a.escritas[0].dados.fim_realizado, fimRealizado);
        assert.equal(a.escritas[0].dados.justificativa_atraso, dados.justificativaAtraso || null);
      }
    }
  }
});
