const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function carregar(arquivo, mocks = {}, cache = new Map()) {
  const absoluto = path.resolve(__dirname, '..', arquivo);
  if (cache.has(absoluto)) return cache.get(absoluto);
  const mod = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync(absoluto, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(r => {
    if (mocks[r]) return mocks[r];
    if (r.startsWith('.')) {
      const base = path.resolve(path.dirname(absoluto), r);
      return carregar(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx', mocks, cache);
    }
    return require(r);
  }, mod, mod.exports);
  cache.set(absoluto, mod.exports);
  return mod.exports;
}
const plano = carregar('src/app/lib/planoRelatorio.ts');
const relatorio = carregar('src/app/lib/reportExport.ts');
function fixture() {
  const atividade = { id: 'a1', order: 1, name: 'ATIVIDADE_COMPLETA', responsible: 'RESP_ATIVIDADE', status: 'Em andamento', progress: 42,
    plannedStart: '2026-10-01', plannedEnd: '2026-10-10', actualStart: '2026-10-02', actualEnd: '2026-10-11',
    delayJustification: 'JUSTIFICATIVA_COMPLETA', budgetLink: 'Sim', observations: 'OBSERVACAO_COMPLETA',
    nextStep: 'ACOMPANHAMENTO_COMPLETO', nextStepOwner: 'RESP_ACAO', nextStepDue: '2026-10-15', riskOriginId: 'r1',
    tasks: [{ id: 't1', title: 'SUBTAREFA_COMPLETA', order: 1 }], attachment: { id: 'anexo', fileName: 'ARQUIVO_COMPLETO.png' } };
  return { id: 1, name: 'PROJETO_COMPLETO', code: 'COD-01', coordinator: 'Equipe', financier: 'Fundo', startDate: '2026-01-01', endDate: '2026-12-31',
    team: [], changes: [], evidences: [], budgetApproved: 10, budgetExecuted: 0, organizacao: { id: 'org-a', nome: 'Org A' },
    goals: [{ id: 'm1', name: 'META_COMPLETA', order: 1, responsible: 'RESP_META', plannedStart: '2026-01-01', plannedEnd: '2026-12-31',
      deliverables: [{ id: 'e1', name: 'ETAPA_COMPLETA', expectedResult: 'RESULTADO_COMPLETO', order: 1,
        plannedStart: '2026-10-01', plannedEnd: '2026-10-31', actualStart: '2026-10-02', actualEnd: '2026-10-25', activities: [atividade] }] }],
    risks: [{ id: 'r1', title: 'RISCO_COMPLETO', description: 'DESCRICAO_COMPLETA', stageId: 'e1', specification: 'ESPECIFICACAO_COMPLETA',
      category: 'Tecnico', probability: 3, impact: 4, severity: 12, responsible: 'RESP_RISCO', status: 'Aberto', responseStrategy: 'ESTRATEGIA_COMPLETA' }],
    pareceres: [{ id: 'p1', data: '2026-10-13', origem: 'Visita técnica', autor: 'AUTOR_COMPLETO', pontosObservados: 'PONTOS_COMPLETOS',
      itensCriticos: 'CRITICOS_COMPLETOS', limitacoesOrcamentarias: 'LIMITACOES_COMPLETAS', recomendacao: 'RECOMENDACAO_COMPLETA', logComunicacaoId: null }] };
}

test('REQ-01: exportações PDF, CSV e XML incluem campos completos, subtarefas, anexo e parecer', async () => {
  const p = fixture();
  const modelo = relatorio.buildReportModel('Parecer', [p], ['metas', 'riscos', 'pareceres']);
  const blobs = [];
  const originalDocument = global.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const { jsPDF } = require('jspdf');
  const originalSave = jsPDF.API.save;
  let pdf;
  try {
    global.document = { createElement: () => ({ click() {} }) };
    URL.createObjectURL = blob => { blobs.push(blob); return 'blob:test'; };
    URL.revokeObjectURL = () => {};
    jsPDF.API.save = function () { pdf = this; return this; };
    relatorio.exportReportCsv(modelo);
    relatorio.exportReportXml(modelo);
    relatorio.exportReportPdf(modelo);
    const saidas = [...await Promise.all(blobs.map(b => b.text())), pdf.output()];
    for (const marcador of ['RESULTADO_COMPLETO', 'RESP_META', 'RESP_ATIVIDADE', 'JUSTIFICATIVA_COMPLETA', 'OBSERVACAO_COMPLETA',
      'ACOMPANHAMENTO_COMPLETO', 'RESP_ACAO', 'SUBTAREFA_COMPLETA', 'ARQUIVO_COMPLETO.png', 'DESCRICAO_COMPLETA', 'ESPECIFICACAO_COMPLETA',
      'ESTRATEGIA_COMPLETA', 'RESP_RISCO', 'AUTOR_COMPLETO', 'PONTOS_COMPLETOS', 'CRITICOS_COMPLETOS', 'LIMITACOES_COMPLETAS', 'RECOMENDACAO_COMPLETA']) {
      for (const saida of saidas) assert.ok(saida.includes(marcador), `Campo omitido: ${marcador}`);
    }
    assert.ok(pdf.getNumberOfPages() > 1);
  } finally { global.document = originalDocument; URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke; jsPDF.API.save = originalSave; }
});

test('REQ-01/02: vazio é explícito, zero é preenchido e ordem escolhida chega ao relatório', () => {
  const p = fixture();
  const a = p.goals[0].deliverables[0].activities[0];
  a.progress = 0; a.observations = ''; a.actualEnd = null;
  const modelo = relatorio.buildReportModel('Parecer', [p], ['metas'], { atividade: ['observations', 'nextStep'] });
  const registro = modelo.projects[0].detalhes.find(r => r.tipo === 'atividade');
  assert.deepEqual(registro.campos.slice(0, 2).map(c => c.chave), ['observations', 'nextStep']);
  assert.equal(registro.campos.find(c => c.chave === 'observations').preenchido, false);
  assert.equal(registro.campos.find(c => c.chave === 'actualEnd').valor, 'Não informado');
  assert.equal(registro.campos.find(c => c.chave === 'progress').valor, '0');
  assert.equal(registro.campos.find(c => c.chave === 'progress').preenchido, true);
  assert.ok(!modelo.projects[0].detalhes.some(r => r.tipo === 'risco'));
});

test('plano e sua exportação não reabrem o parecer técnico antigo; relatório geral preserva os registros', () => {
  const p = fixture();
  const antes = structuredClone(p.pareceres);
  const registros = plano.registrosDoPlano(p, [...plano.CAMPOS_RELATORIO_PLANO]);
  assert.ok(registros.some(r => r.tipo === 'atividade'));
  assert.ok(registros.some(r => r.tipo === 'risco'));
  assert.ok(!registros.some(r => r.tipo === 'parecer'));
  const modelo = relatorio.buildReportModel('Plano de trabalho', [p], [...plano.CAMPOS_RELATORIO_PLANO]);
  assert.ok(!modelo.projects[0].detalhes.some(r => r.tipo === 'parecer'));
  assert.ok(relatorio.buildReportModel('Histórico', [p], ['pareceres']).projects[0].detalhes.some(r => r.tipo === 'parecer'));
  assert.deepEqual(p.pareceres, antes);
});

test('REQ-04: acompanhamento mantém origem, reflete edição e não cruza organizações', () => {
  const p = fixture(); const outro = fixture(); outro.organizacao.id = 'org-b';
  let linhas = plano.encaminhamentosDoPlano([p, outro], 'org-a');
  assert.equal(linhas.length, 1); assert.equal(linhas[0].projeto.id, p.id);
  p.goals[0].deliverables[0].activities[0].nextStep = 'EDITADO_NA_ORIGEM';
  assert.equal(plano.encaminhamentosDoPlano([p], 'org-a')[0].atividade.nextStep, 'EDITADO_NA_ORIGEM');
  p.goals[0].deliverables[0].activities[0].nextStep = '   ';
  assert.equal(plano.encaminhamentosDoPlano([p], 'org-a').length, 0);
});

test('REQ-06: respostas embaralhadas, renomeação e inserção preservam ordem dos irmãos existentes', () => {
  const p = fixture(); const base = p.goals[0].deliverables[0];
  p.goals[0].deliverables = [{ ...base, id: 'e-b', order: 2 }, { ...base, id: 'e-a', order: 2 }, { ...base, id: 'e-0', order: 1 }];
  const antes = structuredClone(p.goals);
  assert.deepEqual(plano.ordenarPlano(p.goals)[0].deliverables.map(e => e.id), ['e-0', 'e-a', 'e-b']);
  assert.deepEqual(p.goals, antes);
  p.goals[0].deliverables.reverse(); p.goals[0].deliverables[0].name = 'Nome editado';
  p.goals[0].deliverables.push({ ...base, id: 'nova', order: 3 });
  assert.deepEqual(plano.ordenarPlano(p.goals)[0].deliverables.map(e => e.id), ['e-0', 'e-a', 'e-b', 'nova']);
});

test('REQ-03: Enter repetido durante salvamento cria uma única subtarefa e falha preserva o texto', async () => {
  const React = require('react');
  let estados = [], indice = 0, resolver, rejeitar, chamadas = 0;
  const hooks = { ...React,
    useState(inicial) { const i = indice++; if (!(i in estados)) estados[i] = typeof inicial === 'function' ? inicial() : inicial;
      return [estados[i], v => { estados[i] = typeof v === 'function' ? v(estados[i]) : v; }]; },
    useRef(inicial) { const i = indice++; if (!(i in estados)) estados[i] = { current: inicial }; return estados[i]; },
  };
  const painel = carregar('src/app/components/plano/PainelAtividade.tsx', {
    react: hooks,
    '../../store': { useStore: () => ({ createTarefa: () => { chamadas++; return new Promise((ok, fail) => { resolver = ok; rejeitar = fail; }); } }) },
    '../../auth/authStore': { useAuth: () => ({ readOnly: false }) },
    './FormularioAtividade': { FormularioAtividade: () => null }, './CampoAnexo': { CampoAnexo: () => null },
    './camposFormulario': { ConfirmarExclusao: () => null }, sonner: { toast: { success() {}, error() {} } },
  });
  function elementos(node) {
    if (!node || typeof node !== 'object') return [];
    if (Array.isArray(node)) return node.flatMap(elementos);
    return [node, ...elementos(node.props?.children)];
  }
  const p = fixture(), meta = p.goals[0], etapa = meta.deliverables[0], atividade = etapa.activities[0];
  const arvore = painel.PainelAtividade({ atividade, etapa, meta, codigo: '1.1.1', projetoId: p.id, aoFechar() {}, aoAbrirRisco() {} });
  const tarefas = elementos(arvore).find(e => e.type?.name === 'Tarefas');
  estados = [];
  const render = () => { indice = 0; return elementos(tarefas.type(tarefas.props)); };
  const input = () => render().find(e => e.type === 'input' && e.props['aria-label'] === 'Nova subtarefa');
  input().props.onChange({ target: { value: 'Tarefa digitada' } });
  const enter = { key: 'Enter', nativeEvent: { isComposing: false }, preventDefault() {} };
  const campo = input(); campo.props.onKeyDown(enter); campo.props.onKeyDown(enter);
  assert.equal(chamadas, 1);
  assert.equal(input().props.disabled, true);
  resolver(); await new Promise(setImmediate);
  assert.equal(input().props.value, '');
  input().props.onChange({ target: { value: 'Rascunho preservado' } });
  input().props.onKeyDown(enter);
  rejeitar(new Error('Falha de rede')); await new Promise(setImmediate);
  assert.equal(input().props.value, 'Rascunho preservado');
  assert.equal(input().props.disabled, false);
});

test('REQ-04: contadores da organização incluem ações do plano e excluem vazias, concluídas e removidas', async () => {
  const acao = (patch = {}) => ({ proximo_passo: 'Acompanhar', status: 'Em andamento', excluido_em: null, ...patch });
  const tabelas = {
    comunidades: [{ id: 'org-a', nome: 'Org A', code: 'A' }],
    projetos: [{ id: 1, comunidade_id: 'org-a', nome: 'Projeto', metas: [{ etapas: [{ atividades: [acao(), acao({ status: 'Concluído' }), acao({ proximo_passo: ' ' }), acao({ excluido_em: '2026-10-13' })] }] }] }],
    encaminhamentos: [{ id: 'enc-1', comunidade_id: 'org-a', descricao: 'Geral', status: 'A iniciar' }],
  };
  const db = { from(tabela) {
    let dados = tabelas[tabela] ?? [];
    const consulta = { select() { return this; }, order() { return this; }, not() { return this; },
      eq(c, v) { dados = dados.filter(r => r[c] === v); return this; }, neq(c, v) { dados = dados.filter(r => r[c] !== v); return this; },
      maybeSingle() { return Promise.resolve({ data: dados[0] ?? null, error: null }); },
      then(ok, fail) { return Promise.resolve({ data: dados, error: null }).then(ok, fail); },
    }; return consulta;
  } };
  const orgs = carregar('src/app/organizacoes.server.ts', {
    '@tanstack/react-start': { createServerFn: () => { const fn = { validator() { return fn; }, handler(h) { return args => h(args); } }; return fn; } },
    '../integrations/supabase/client.server': { supabaseAdmin: db },
    './sessao.server': { exigirSessao: async () => ({ login: 'teste' }) },
  });
  assert.equal((await orgs.listarOrganizacoes())[0].pendentes, 2);
  const ficha = await orgs.obterOrganizacao({ data: { id: 'org-a' } });
  assert.equal(ficha.pendentes, 2);
  assert.equal(ficha.encaminhamentos.length, 1, 'Projeção não duplica registros gerais');
});
