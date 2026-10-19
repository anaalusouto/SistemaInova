const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file, cache = new Map()) {
  const full = path.resolve(__dirname, '..', file);
  if (full.endsWith('.json')) return JSON.parse(fs.readFileSync(full, 'utf8'));
  if (cache.has(full)) return cache.get(full).exports;
  const mod = { exports: {} }; cache.set(full, mod);
  const compiled = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', compiled)(name => {
    assert.ok(name.startsWith('.'), `Dependência externa não permitida no motor local: ${name}`);
    return load(path.resolve(path.dirname(full), name.endsWith('.json') ? name : `${name}.ts`), cache);
  }, mod, mod.exports);
  return mod.exports;
}
const { responderLocal, resumirProjetoLocal } = load('src/app/assistant/localBot.ts');
const context = { tela: 'plano', formulario: 'atividade', campo: 'Fim previsto' };
const data = { projetosCarregados: 3, projeto: { metas: 2, etapas: 4, atividades: 8, concluidas: 3, riscos: 2, riscosAbertos: 1, status: 'Em andamento' } };
test('ajuda usa o campo selecionado e as regras verificadas, com fontes', () => {
  const result = responderLocal('Como preencho este campo?', context, data);
  assert.match(result.texto, /Atividade · Fim previsto/);
  assert.match(result.texto, /período previsto da etapa/);
  assert.ok(result.fontes.some(s => s.includes('FormularioAtividade')));
});
test('busca reconhece acentos, plurais, formulário e campo explícito', () => {
  const result = responderLocal('Qual a probabilidade dos riscos?', context, data);
  assert.match(result.texto, /1 a 5/);
  assert.match(result.texto, /validação com a equipe/);
  assert.match(responderLocal('Progresso (%) da atividade', context, data).texto, /1 a 99/);
});
test('tela e permissões usam o contexto atual sem oferecer escrita ao visualizador', () => {
  assert.match(responderLocal('Explique esta tela', context, data).texto, /metas contêm etapas/);
  assert.match(responderLocal('Quais minhas permissões?', context, data, 'visualizador').texto, /recusa alterações/);
  assert.match(responderLocal('Quais minhas permissões?', context, data, 'admin').texto, /Administrador pode escrever/);
});
test('resumo usa dados carregados do projeto e reflete atualização na próxima pergunta', () => {
  assert.match(responderLocal('Resumo do projeto aberto', context, data).texto, /Metas: 2.*Etapas: 4.*Atividades: 8/s);
  assert.match(responderLocal('Quantas atividades?', context, data).texto, /concluídas: 3; não concluídas: 5/);
  assert.match(responderLocal('Quantas atividades?', context, { ...data, projeto: { ...data.projeto, concluidas: 4 } }).texto, /concluídas: 4; não concluídas: 4/);
  assert.match(responderLocal('Quantos riscos em aberto?', context, data).texto, /em aberto: 1/);
  assert.match(responderLocal('Quantos projetos estão carregados?', context, data).texto, /Há 3 projeto/);
});
test('não confunde dados em carregamento ou projeto fechado com contagem zero', () => {
  assert.match(responderLocal('Resumo do projeto', context, { ...data, carregando: true }).texto, /carregando/);
  assert.match(responderLocal('Resumo do projeto', context, { projetosCarregados: 0 }).texto, /Abra um projeto/);
});
test('resumo deriva contagens sem copiar nomes, responsáveis, valores ou dados pessoais', () => {
  const project = { name: 'DADO RESTRITO', coordinator: 'PESSOA RESTRITA', status: 'Em andamento', goals: [{ name: 'META RESTRITA', deliverables: [{ activities: [{ status: 'Concluído', responsible: 'RESPONSÁVEL RESTRITO' }, { status: 'A iniciar' }] }] }], risks: [{ status: 'Aberto' }, { status: 'Encerrado' }] };
  const before = JSON.stringify(project);
  assert.deepEqual(resumirProjetoLocal(project), { metas: 1, etapas: 1, atividades: 2, concluidas: 1, riscos: 2, riscosAbertos: 1, status: 'Em andamento' });
  assert.equal(JSON.stringify(project), before);
  assert.doesNotMatch(JSON.stringify(resumirProjetoLocal(project)), /RESTRIT/);
});
test('não inventa respostas e identifica lacunas e pedidos de alteração', () => {
  assert.match(responderLocal('Qual a previsão do tempo em Marte?', context, data).texto, /Não encontrei/);
  assert.match(responderLocal('Quais as lacunas?', context, data).texto, /esclarecimento/);
  assert.match(responderLocal('Salve este registro', context, data).texto, /Nenhum registro foi alterado/);
  assert.match(responderLocal('Qual é minha senha?', context, data).texto, /Não preciso de senhas/);
});
test('motor local não faz rede nem precisa de serviços externos', () => {
  const original = global.fetch;
  global.fetch = () => assert.fail('O chatbot local não pode fazer chamadas de rede');
  try {
    for (const question of ['Olá', 'Como preencho este campo?', 'Quantas atividades?', 'Explique esta tela', 'Pergunta desconhecida']) assert.ok(responderLocal(question, context, data).texto);
  } finally { global.fetch = original; }
  const ui = fs.readFileSync(path.resolve(__dirname, '../src/app/assistant/AssistenteInova.tsx'), 'utf8');
  assert.doesNotMatch(ui, /fetch\(|openai\/chatkit|cdn\.platform|localStorage|sessionStorage/);
});
