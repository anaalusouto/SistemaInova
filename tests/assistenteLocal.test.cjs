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
const { detalharProjetoLocal, projetoDaNavegacao } = load('src/app/assistant/projectHelp.ts');
const { catalogoCobertura } = load('src/app/assistant/manualHelp.ts');
const { conhecimento, contextoSeguro, contextoDaNavegacao } = load('src/app/assistant/context.ts');
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

const projeto = (name, code = name) => ({
  name, code, objective: 'Estruturar a produção conforme a proposta', status: 'Em andamento', startDate: '2026-01-01', endDate: '2026-12-31',
  coordinator: 'PESSOA RESTRITA', team: ['PESSOA RESTRITA'], contacts: [{ telefone: 'CONTATO RESTRITO' }],
  goals: [{ name: 'Fortalecer comercialização', deliverables: [{ name: 'Preparar oficina', activities: [
    { name: 'Agendar encontro', status: 'Concluído', progress: 100, plannedStart: '2026-01-01', plannedEnd: '2026-01-30', actualStart: null, actualEnd: null, tasks: [{title:'TAREFA RESTRITA'}], observations:'NOTA RESTRITA', responsible: 'PESSOA RESTRITA' },
    { name: 'Executar oficina', status: 'Em andamento', progress: 40, plannedStart: '2026-01-01', plannedEnd: '2026-09-30', actualStart: null, actualEnd: null, tasks: [] },
  ] }] }], risks: [{ title:'Risco logístico', description:'DETALHE RESTRITO', status:'Aberto', probability:5, impact:3 }],
});
const alfa = detalharProjetoLocal(projeto('Projeto Alfa', 'ALFA-01'), '2026-10-19');
const beta = detalharProjetoLocal(projeto('Projeto Beta', 'BETA-02'), '2026-10-19');
const dadosRicos = { ...data, projetos:[alfa,beta], projetoDetalhado:alfa };

test('catálogo de regras tem cobertura por domínio e fontes existentes', () => {
  const coverage = catalogoCobertura();
  assert.ok(coverage.guias >= 22);
  assert.ok(coverage.regras >= 85);
  assert.ok(coverage.campos > 200);
  for (const guide of conhecimento.guias) {
    assert.ok(guide.passos.length >= 3, guide.id);
    for (const source of guide.fontes) assert.ok(fs.existsSync(path.resolve(__dirname, '..', source.split(':')[0])), source);
  }
  const reply = responderLocal('Todas as regras de negócio', context, data);
  assert.match(reply.texto, /ponderação.*validação/);
  assert.match(reply.texto, /Não calculado/);
  assert.match(reply.texto, /administrador ou adminOverride/);
  assert.match(reply.texto, /20 MB/);
});
test('guias explicam sequência, campos e regras sem trocar tutorial por contagem', () => {
  assert.match(responderLocal('Como preencher uma atividade?', {tela:'plano'}, dadosRicos).texto, /Como preencher cada campo:/);
  const reply = responderLocal('Como preencher uma atividade?', context, dadosRicos);
  assert.match(reply.texto, /Como fazer:/);
  assert.match(reply.texto, /Como preencher cada campo:/);
  assert.match(reply.texto, /Regras verificadas:/);
  assert.match(reply.texto, /Justificativa de atraso/);
  const quantidade = responderLocal('Como preencher quantidade no orçamento?', context, dadosRicos);
  assert.match(quantidade.texto, /Quantidade/);
  assert.doesNotMatch(quantidade.texto, /Situação do projeto aberto/);
  assert.match(responderLocal('Como preencher o código do projeto?', context, data).texto, /identificador/);
});
test('processos e regras possuem respostas específicas nos assuntos operacionais', () => {
  for (const [query, expected] of [
    ['Como importar orçamento?', /prévia/], ['Regras da nota fiscal', /maior que zero/],
    ['Regras de conclusão', /grupo vazio/], ['Como reclassificar um registro?', /destino/],
    ['Como excluir uma etapa?', /dependências|vínculos/], ['Como aprovar uma alteração?', /administrativ/],
    ['Como cadastrar registro de contato?', /participante/], ['Como preencher encaminhamento?', /Data final/],
  ]) assert.match(responderLocal(query, context, data).texto, expected, query);
});
test('mapeamento consulta níveis e orientações diretamente dos catálogos oficiais', () => {
  const ieo = responderLocal('Explique IEO 1.1.1', {tela:'diagnostics'}, data);
  assert.match(ieo.texto, /espaços de decisão/);
  assert.match(ieo.texto, /1\. .*2\. .*3\. .*4\./s);
  assert.match(ieo.fontes.join(), /catalog\/ieo/);
  assert.match(responderLocal('IEO 99.99.99', context, data).texto, /Não encontrei a pergunta/);
  assert.match(responderLocal('Explique a pergunta 1.1.1', {tela:'diagnostics',formulario:'ieo'}, data).texto, /espaços de decisão/);
  assert.match(responderLocal('Como preencho este campo?', {tela:'diagnostics',formulario:'cesta',campo:'membros_atuantes'}, data).texto, /Nº de membros atuantes/);
  assert.match(responderLocal('Como preencher criticidade da matriz?', context, data).texto, /Criticidade/);
});
test('resumo narrativo identifica projeto, metas, execução real e base prevista', () => {
  const reply = responderLocal('Resumo do projeto aberto', context, dadosRicos);
  assert.match(reply.texto, /Projeto Alfa \(ALFA-01\)/);
  assert.match(reply.texto, /Objetivo previsto/);
  assert.match(reply.texto, /Andamento: 70%/);
  assert.match(reply.texto, /1 atrasada/);
  assert.match(reply.texto, /Fortalecer comercialização/);
  assert.match(reply.texto, /sem avaliar a qualidade/);
});
test('portfólio e projeto citado usam o recorte pedido mesmo com outro projeto aberto', () => {
  const portfolio = responderLocal('Liste os projetos', context, dadosRicos);
  assert.match(portfolio.texto, /Projeto Alfa/); assert.match(portfolio.texto, /Projeto Beta/);
  const chosen = responderLocal('Resumo do projeto BETA-02', context, dadosRicos);
  assert.match(chosen.texto, /Projeto Beta/); assert.doesNotMatch(chosen.texto, /Projeto Alfa/);
});
test('derivados distinguem metas, etapas, atividades, atrasos e riscos', () => {
  assert.match(responderLocal('Detalhe a meta Fortalecer comercialização', context, dadosRicos).texto, /Preparar oficina/);
  assert.match(responderLocal('Liste atividades da etapa Preparar oficina', context, dadosRicos).texto, /Agendar encontro.*Executar oficina/s);
  const atrasadas = responderLocal('Liste atividades atrasadas', context, dadosRicos).texto;
  assert.match(atrasadas, /Executar oficina/); assert.doesNotMatch(atrasadas, /Agendar encontro/);
  assert.match(responderLocal('Detalhe Agendar encontro', context, dadosRicos).texto, /Tarefas vinculadas: 1/);
  assert.match(responderLocal('Riscos em aberto', context, dadosRicos).texto, /Risco logístico.*Crítico/s);
});
test('projeção detalhada não expõe dados pessoais, documentos ou observações livres', () => {
  assert.doesNotMatch(JSON.stringify(alfa), /RESTRIT/);
  const empty = detalharProjetoLocal({...projeto('Sem plano'),goals:[],risks:[]});
  assert.equal(empty.andamento, 'Não calculado');
  const ambiguous = { ...dadosRicos, projetos:[alfa, {...beta,codigo:alfa.codigo}] };
  assert.match(responderLocal('Resumo ALFA-01', context, ambiguous).texto, /mais de um projeto/);
});
test('perguntas fora do domínio não são respondidas por coincidência de uma palavra', () => {
  for (const query of ['Qual a previsão do tempo em Marte?', 'Como funciona um foguete?', 'Explique melhor a órbita lunar']) assert.match(responderLocal(query, context, dadosRicos).texto, /Não encontrei/, query);
  assert.deepEqual(contextoSeguro({tela:'diagnostics', formulario:'ieo',campo:'1.1.1',valores:'RESTRITO'}), {tela:'diagnostics',formulario:'ieo',campo:'1.1.1'});
});

test('referência desconhecida e nomes duplicados não usam silenciosamente outro registro', () => {
  const missing = responderLocal('Resumo do projeto Fantasma', context, dadosRicos).texto;
  assert.match(missing, /Não encontrei esse nome/);
  assert.doesNotMatch(missing, /Projeto Alfa/);
  assert.match(responderLocal('Detalhe a meta Fantasma', context, dadosRicos).texto, /Não encontrei essa meta/);
  const duplicate = {...alfa,metas:[...alfa.metas,...alfa.metas]};
  assert.match(responderLocal('Detalhe a meta Fortalecer comercialização', context, {...dadosRicos,projetoDetalhado:duplicate}).texto, /nomes repetidos/);
});

test('resumo financeiro respeita vigência, exclusão e ausência de notas', () => {
  const input = {...projeto('Financeiro'), orcamentoItens:[
    {valorProposto:100,situacao:'Ativo',vigente:true},
    {valorProposto:700,situacao:'Excluído',vigente:true},
    {valorProposto:900,situacao:'Ativo',vigente:false},
  ],orcamentoNotas:[]};
  const detail = detalharProjetoLocal(input);
  assert.equal(detail.orcamento.proposto,100);
  assert.equal(detail.orcamento.executado,null);
  const reply = responderLocal('Resumo financeiro do projeto aberto', context, {...dadosRicos,projetoDetalhado:detail}).texto;
  assert.match(reply,/100,00/); assert.match(reply,/Não informado/);
  assert.match(reply,/não comprova execução zero/);
  input.orcamentoNotas.push({valor:25,fornecedor:'RESTRITO'});
  const updated = detalharProjetoLocal(input);
  assert.equal(updated.orcamento.executado,25);
  assert.doesNotMatch(JSON.stringify(updated),/RESTRIT/);
});

test('projeto aberto segue a resolução da organização com e sem ID na URL', () => {
  const projects = [{id:1,organizacao:{id:'org-a'}},{id:2,organizacao:{id:'org-b'}}];
  const route = {area:'organizations',org:'org-a',secao:'projeto',aba:'descricao'};
  assert.equal(projetoDaNavegacao(projects,route),projects[0]);
  assert.equal(projetoDaNavegacao(projects,{...route,projeto:1}),projects[0]);
  assert.equal(projetoDaNavegacao(projects,{...route,projeto:2}),undefined);
  assert.equal(projetoDaNavegacao([...projects,{id:3,organizacao:{id:'org-a'}}],route),undefined);
  assert.equal(projetoDaNavegacao(projects,{...route,secao:'dados'}),undefined);
  assert.equal(projetoDaNavegacao(projects,{area:'organizations',projeto:2}),projects[1]);
  assert.equal(projetoDaNavegacao(projects,{area:'overview',projeto:2}),undefined);
  assert.equal(contextoDaNavegacao(route).tela,'descricao');
});
