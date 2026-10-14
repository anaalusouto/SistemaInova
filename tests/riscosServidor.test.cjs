const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Executa os handlers reais sem rede ou alteração de registros reais.
function ambiente({ consulta = false, risco = { id: 'r1', projeto_id: 1, etapa_id: null, meta_id: 'meta-antiga' }, projetoDaEtapa = 1, etapaExiste = true, erroEscrita = null } = {}) {
  const escritas = [];
  const cache = new Map();
  const db = { from(tabela) {
    let escrita;
    const filtros = {};
    const resultado = () => {
      if (escrita) return { data: erroEscrita ? null : { id: filtros.id ?? 'novo' }, error: erroEscrita };
      if (tabela === 'plano_riscos') return { data: risco, error: null };
      if (tabela === 'etapas') return { data: etapaExiste ? { meta_id: 'meta-nova' } : null, error: null };
      if (tabela === 'metas') return { data: { id: 'meta-nova', projeto_id: projetoDaEtapa }, error: null };
      throw new Error(`Consulta inesperada: ${tabela}`);
    };
    const builder = {
      select() { return this; },
      eq(campo, valor) { filtros[campo] = valor; return this; },
      insert(dados) { escrita = { tabela, acao: 'insert', dados, filtros }; escritas.push(escrita); return this; },
      update(dados) { escrita = { tabela, acao: 'update', dados, filtros }; escritas.push(escrita); return this; },
      delete() { escrita = { tabela, acao: 'delete', filtros }; escritas.push(escrita); return this; },
      single() { return Promise.resolve(resultado()); },
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
    new Function('require', 'module', 'exports', compilado.outputText)(request => {
      if (request === '@tanstack/react-start') return { createServerFn: () => {
        const fn = { validator() { return fn; }, handler(h) { return args => h(args); } };
        return fn;
      } };
      if (request.endsWith('/client.server')) return { supabaseAdmin: db };
      if (request === './sessao.server') return { exigirEscrita: async () => { if (consulta) throw new Error('Sem permissão.'); return { login: 'teste', displayName: 'Verificador', role: 'admin' }; } };
      return carregar(path.resolve(path.dirname(absoluto), request));
    }, mod, mod.exports);
    return mod.exports;
  }
  return { plano: carregar('src/app/planoTrabalho.server'), escritas };
}

const dados = (patch = {}) => ({
  projetoId: 1, etapaId: 'etapa-1', titulo: 'Risco', descricao: 'Descrição', categoria: 'Financeiro',
  responsavel: 'Equipe', probabilidade: 3, impacto: 4, status: 'Aberto', estrategiaResposta: '', especificacao: '', ...patch,
});

test('cria risco na etapa e deriva a meta do projeto correto', async () => {
  const a = ambiente();
  await a.plano.criarRisco({ data: dados() });
  assert.equal(a.escritas[0].dados.meta_id, 'meta-nova');
  assert.equal(a.escritas[0].dados.etapa_id, 'etapa-1');
  assert.equal(a.escritas[0].dados.projeto_id, 1);
});

test('edita risco antigo sem exigir etapa nova nem apagar meta legada', async () => {
  const a = ambiente();
  await a.plano.atualizarRisco({ data: { riscoId: 'r1', dados: dados({ etapaId: '', titulo: 'Atualizado' }) } });
  assert.equal(a.escritas[0].dados.titulo, 'Atualizado');
  assert.equal(a.escritas[0].dados.etapa_id, null);
  assert.equal(a.escritas[0].dados.meta_id, 'meta-antiga');
  assert.deepEqual(a.escritas[0].filtros, { id: 'r1' });
});

test('permite vincular risco antigo e trocar etapa de risco existente', async () => {
  for (const etapa_id of [null, 'etapa-antiga']) {
    const a = ambiente({ risco: { id: 'r1', projeto_id: 1, etapa_id, meta_id: 'meta-antiga' } });
    await a.plano.atualizarRisco({ data: { riscoId: 'r1', dados: dados() } });
    assert.equal(a.escritas[0].dados.etapa_id, 'etapa-1');
    assert.equal(a.escritas[0].dados.meta_id, 'meta-nova');
  }
});

test('recusa etapa de outro projeto ou inexistente antes de escrever', async () => {
  for (const config of [{ projetoDaEtapa: 2 }, { etapaExiste: false }]) {
    for (const editar of [true, false]) {
      const a = ambiente(config);
      await assert.rejects(editar
        ? a.plano.atualizarRisco({ data: { riscoId: 'r1', dados: dados() } })
        : a.plano.criarRisco({ data: dados() }), /etapa|Etapa/);
      assert.deepEqual(a.escritas, []);
    }
  }
});

test('recusa novo risco sem etapa, matriz fracionária e status inválido', async () => {
  for (const patch of [{ etapaId: '' }, { probabilidade: 1.5 }, { impacto: 6 }, { status: 'Inválido' }]) {
    const a = ambiente();
    await assert.rejects(a.plano.criarRisco({ data: dados(patch) }));
    assert.deepEqual(a.escritas, []);
  }
});

test('recusa desvincular etapa existente ou editar risco inexistente/de outro projeto', async () => {
  for (const [config, patch] of [
    [{ risco: { id: 'r1', projeto_id: 1, etapa_id: 'etapa-1' } }, { etapaId: '' }],
    [{ risco: null }, {}],
    [{ risco: { id: 'r1', projeto_id: 2, etapa_id: null } }, {}],
  ]) {
    const a = ambiente(config);
    await assert.rejects(a.plano.atualizarRisco({ data: { riscoId: 'r1', dados: dados(patch) } }));
    assert.deepEqual(a.escritas, []);
  }
});

test('perfil de consulta não cria, edita nem exclui riscos', async () => {
  const a = ambiente({ consulta: true });
  await assert.rejects(a.plano.criarRisco({ data: dados() }), /Sem permissão/);
  await assert.rejects(a.plano.atualizarRisco({ data: { riscoId: 'r1', dados: dados() } }), /Sem permissão/);
  await assert.rejects(a.plano.excluirRisco({ data: { riscoId: 'r1' } }), /Sem permissão/);
  assert.deepEqual(a.escritas, []);
});

test('exclusão remove somente o risco solicitado e propaga falhas do banco', async () => {
  const a = ambiente();
  await a.plano.excluirRisco({ data: { riscoId: 'r1' } });
  assert.deepEqual(a.escritas, [{ tabela: 'plano_riscos', acao: 'delete', filtros: { id: 'r1' } }]);
  const falha = ambiente({ erroEscrita: { message: 'Falha ao excluir' } });
  await assert.rejects(falha.plano.excluirRisco({ data: { riscoId: 'r1' } }), /Falha ao excluir/);
});
