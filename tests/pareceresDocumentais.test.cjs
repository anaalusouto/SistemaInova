const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function carregar(arquivo, mocks = {}) {
  const m = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(r => mocks[r] ?? require(r), m, m.exports);
  return m.exports;
}
const docs = carregar('src/app/lib/documentosRegistro.ts');
const helper = carregar('src/app/lib/pareceresDocumentais.ts', { './documentosRegistro': docs });
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const row = (n, org = 1, grupo) => ({ id: id(n), area: 'parecer', comunidade_id: id(org), storage_path: grupo ? `documentos/parecer/${id(org)}/registros/${id(grupo)}/${id(n)}` : `documentos/parecer/${id(org)}/${id(n)}`, nome_arquivo: `parecer-${n}.pdf`, tipo_mime: 'application/pdf', tamanho_bytes: 10, criado_em: '2026-10-30T15:00:00Z', enviado_por: 'Equipe' });

function ambiente(op = {}) {
  let rows = op.rows ?? [];
  const objetos = new Set(rows.map(r => r.storage_path));
  const chamadas = [];
  let uploads = 0;
  const db = {
    storage: { from: () => ({
      async upload(path) { chamadas.push('upload'); if (++uploads === op.falhaUpload) return { error: { message: 'falhou' } }; objetos.add(path); return {}; },
      async remove(paths) { chamadas.push('storage.remove'); if (op.falhaLimpeza) return { error: { message: 'falhou' } }; paths.forEach(p => objetos.delete(p)); return {}; },
    }) },
    from(tabela) {
      const filtros = [];
      let acao = 'select', novos;
      const q = {
        select() { return q; }, eq(coluna, valor) { filtros.push(r => r[coluna] === valor); return q; },
        in(coluna, valores) { filtros.push(r => valores.includes(r[coluna])); return q; }, order() { return q; },
        delete() { acao = 'delete'; return q; }, insert(r) { acao = 'insert'; novos = r; return q; },
        async maybeSingle() { return { data: { id: id(1) } }; },
        then(resolve, reject) {
          try {
            chamadas.push(`${tabela}.${acao}`);
            if (acao === 'insert') {
              if (op.falhaInsert) return Promise.resolve({ error: { message: 'falhou' } }).then(resolve, reject);
              rows.push(...novos.map((r, i) => ({ ...r, id: id(100 + i), criado_em: '2026-10-30T15:00:00Z' })));
            }
            const selecionadas = rows.filter(r => filtros.every(f => f(r)));
            if (acao === 'delete') {
              if (op.falhaDelete) return Promise.resolve({ error: { message: 'falhou' } }).then(resolve, reject);
              rows = rows.filter(r => !selecionadas.includes(r));
            }
            return Promise.resolve({ data: selecionadas }).then(resolve, reject);
          } catch (e) { return Promise.reject(e).then(resolve, reject); }
        },
      };
      return q;
    },
  };
  const sessao = async () => { if (op.semSessao) throw new Error('Sessão expirada'); return { displayName: 'Equipe' }; };
  const api = carregar('src/app/pareceresDocumentais.server.ts', {
    '@tanstack/react-start': { createServerFn: () => ({ validator: () => ({ handler: f => f }) }) },
    './lib/documentosRegistro': docs, './lib/pareceresDocumentais': helper,
    './sessao.server': { exigirSessao: sessao, exigirEscrita: async () => { await sessao(); if (op.readOnly) throw new Error('Sem permissão'); return { displayName: 'Equipe' }; } },
    '../integrations/supabase/client.server': { supabaseAdmin: db },
  });
  return { ...api, objetos, chamadas, rows: () => rows };
}
const arquivo = nome => ({ nomeArquivo: nome, tipoMime: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERg==' });

test('cadastro com dois anexos persiste um parecer e reaparece na listagem da organização', async () => {
  const a = ambiente({ rows: [row(3, 2)] });
  await a.criarParecerDocumental({ data: { organizacaoId: id(1), arquivos: [arquivo('a.pdf'), arquivo('b.pdf')] } });
  const lista = await a.listarPareceresDocumentais({ data: { organizacaoId: id(1) } });
  assert.equal(lista.length, 1);
  assert.equal(lista[0].anexos.length, 2);
  assert.equal(lista[0].enviadoPor, 'Equipe');
  assert.deepEqual(lista[0].anexos.map(a => a.nomeArquivo), ['a.pdf', 'b.pdf']);
  assert.equal(a.chamadas.filter(c => c === 'documentos_registro.insert').length, 1);
  const outra = await a.listarPareceresDocumentais({ data: { organizacaoId: id(2) } });
  assert.equal(outra[0].anexos[0].id, id(3));
});

test('arquivos antigos são pareceres individuais, mesmo com nome e data iguais', () => {
  const antigo = row(3), outro = { ...row(4), nome_arquivo: antigo.nome_arquivo };
  assert.equal(helper.agruparPareceres([antigo, outro, row(5, 1, 10), row(6, 1, 10)], id(1)).length, 3);
  assert.equal(helper.idParecerDocumento(row(5, 2, 10), id(1)), id(5));
});

test('falha de upload ou dos metadados desfaz somente os novos objetos', async () => {
  for (const falha of [{ falhaUpload: 2 }, { falhaInsert: true }]) {
    const legado = row(3), a = ambiente({ ...falha, rows: [legado] });
    await assert.rejects(a.criarParecerDocumental({ data: { organizacaoId: id(1), arquivos: [arquivo('a.pdf'), arquivo('b.pdf')] } }));
    assert.deepEqual(a.rows(), [legado]);
    assert.deepEqual([...a.objetos], [legado.storage_path]);
  }
});

test('exclusão remove todos os anexos do parecer, preservando outros registros e organizações', async () => {
  const a = ambiente({ rows: [row(3, 1, 10), row(4, 1, 10), row(5, 1, 11), row(6, 2, 10)] });
  await a.excluirParecerDocumental({ data: { organizacaoId: id(1), parecerId: id(10) } });
  assert.deepEqual(a.rows().map(r => r.id), [id(5), id(6)]);
  assert.equal(a.objetos.size, 2);
  assert.ok(a.chamadas.indexOf('documentos_registro.delete') < a.chamadas.indexOf('storage.remove'));
  await assert.rejects(a.excluirParecerDocumental({ data: { organizacaoId: id(1), parecerId: id(6) } }), /não encontrado/);
});

test('falha ao excluir metadados preserva os anexos e a falha de limpeza é reportada', async () => {
  const a = ambiente({ rows: [row(3)], falhaDelete: true });
  await assert.rejects(a.excluirParecerDocumental({ data: { organizacaoId: id(1), parecerId: id(3) } }));
  assert.equal(a.objetos.size, 1);
  assert.equal(a.rows().length, 1);
  const b = ambiente({ rows: [row(3)], falhaLimpeza: true });
  assert.deepEqual(await b.excluirParecerDocumental({ data: { organizacaoId: id(1), parecerId: id(3) } }), { arquivosPendentes: true });
});

test('servidor exige sessão para consulta e escrita para criar ou excluir', async () => {
  const a = ambiente({ readOnly: true });
  await assert.rejects(a.criarParecerDocumental({ data: { organizacaoId: id(1), arquivos: [arquivo('a.pdf')] } }), /permissão/);
  await assert.rejects(a.excluirParecerDocumental({ data: { organizacaoId: id(1), parecerId: id(3) } }), /permissão/);
  assert.deepEqual(a.chamadas, []);
  const b = ambiente({ semSessao: true });
  await assert.rejects(b.listarPareceresDocumentais({ data: { organizacaoId: id(1) } }), /Sessão/);
});

test('valida arquivos obrigatórios, tipos e limite total antes de enviar', async () => {
  assert.throws(() => helper.validarArquivosParecer([]), /ao menos um/);
  assert.throws(() => helper.validarArquivosParecer([{ nomeArquivo: 'a.exe', tipoMime: 'application/octet-stream', tamanhoBytes: 5 }]), /Tipo/);
  assert.throws(() => helper.validarArquivosParecer([1, 2].map(n => ({ nomeArquivo: `${n}.pdf`, tipoMime: 'application/pdf', tamanhoBytes: 2 * 1024 * 1024 }))), /somar/);
  const a = ambiente();
  await assert.rejects(a.criarParecerDocumental({ data: { organizacaoId: id(1), arquivos: [{ ...arquivo('a.pdf'), dataUrl: '' }] } }), /vazio/);
  assert.equal(a.objetos.size, 0);
});

function renderizar(op = {}) {
  const { ParecerOrganizacao } = carregar('src/app/components/organizacoes/ParecerOrganizacao.tsx', {
    '@tanstack/react-query': { useQuery: () => ({ data: op.rows ?? [], isLoading: op.loading, error: op.error }), useQueryClient: () => ({}) },
    '../../auth/authStore': { useAuth: () => ({ readOnly: op.readOnly }) },
    '../../pareceresDocumentais.server': {}, '../../documentosRegistro.server': {},
    '../../lib/documentosRegistro': docs, '../../lib/pareceresDocumentais': helper,
    '../../lib/visualizacaoDocumento': {}, '../../lib/relatoriosOrg': { normalizarLinkRelatorio: () => null },
    '../BotaoNovo': { BotaoNovo: ({ children }) => React.createElement('button', {}, children) },
    '../plano/camposFormulario': {}, '../responsive-tables.css': {},
  });
  return renderToStaticMarkup(React.createElement(ParecerOrganizacao, { organizacaoId: id(1), aoVoltar() {} }));
}
test('tabela oferece criação, estado vazio e consulta de todos os anexos; perfil de consulta não altera', () => {
  assert.match(renderizar(), /Novo parecer/);
  assert.match(renderizar(), /Nenhum parecer registrado/);
  const rows = helper.agruparPareceres([row(3, 1, 10), row(4, 1, 10)], id(1));
  const html = renderizar({ rows });
  assert.match(html, /Data de inclusão/);
  assert.match(html, /Consultar anexo parecer-3.pdf/);
  assert.match(html, /Consultar anexo parecer-4.pdf/);
  assert.match(html, /Excluir parecer/);
  const consulta = renderizar({ rows, readOnly: true });
  assert.doesNotMatch(consulta, /Novo parecer|Excluir parecer/);
  assert.match(consulta, /Consultar anexo/);
  assert.match(renderizar({ loading: true }), /Carregando pareceres/);
  assert.match(renderizar({ error: new Error('Falha') }), /Tentar novamente/);
});
