const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
function load(file,mocks={},cache=new Map()){
  file=path.resolve(file);if(!path.extname(file))file+='.ts';if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  new Function('require','module','exports',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(r=>r in mocks?mocks[r]:r.startsWith('.')?load(path.resolve(path.dirname(file),r),mocks,cache):require(r),m,m.exports);return m.exports;
}
const lib=load('src/app/diagnostic/importarMatriz.ts'),parse=lib.interpretarTextoMatriz;
const texto='F01 Representação e articulação institucional\nAtuação: Executa\nAtuação: Viabiliza\nExperiência: Inicial\nCriticidade atual: 3';
test('código e texto oficial divergentes não produzem respostas presumidas',()=>{
  const r=parse('F01 Valorização cultural\nAtuação: Executa');assert.deepEqual(r.respostas,{});assert.equal(r.conferencia.F01.campos.atuacao,'ambiguo');assert.match(r.pendencias[0],/código e nome/);
  const seguro=parse('Função: F01\nRepresentação e articulação institucional\nAtuação: Executa');assert.equal(seguro.respostas.F01.atuacao,'Executa');
});
test('divergência é mantida por campo; opções idênticas repetidas não são conflito',()=>{
  const r=parse(texto);assert.equal(r.respostas.F01.atuacao,null);assert.equal(r.respostas.F01.experiencia,'Inicial');assert.deepEqual(r.conferencia.F01.valores.atuacao,['Executa','Viabiliza']);
  assert.equal(parse(texto.replace('Viabiliza','Executa')).respostas.F01.atuacao,'Executa');
});
test('conteúdo parcialmente legível, opção inválida e campo desconhecido exigem revisão',()=>{
  const r=parse('F02 Valorização cultural\nExperiência: Recor�ente\nCriticidade atual: Alto\nObservação: Relato\nQuem executa: Parceiro');
  assert.equal(r.conferencia.F02.campos.experiencia,'ambiguo');assert.equal(r.respostas.F02.criticidade,null);assert.equal(r.respostas.F02.observacoes,'Relato');assert.ok(r.pendencias.some(p=>p.includes('Campo não reconhecido')));
  assert.equal(parse('Função: F02\nExperiência: Recorrente').respostas.F02.experiencia,'Recorrente');
});
test('ambiguidade exige decisão explícita e confirmação; não identificado deve permanecer vazio',()=>{
  const r=parse(texto),estado=r.conferencia.F01,draft=r.respostas.F01;
  assert.throws(()=>lib.validarConferencia(estado,draft,{},false),/Confirme/);
  assert.throws(()=>lib.validarConferencia(estado,draft,{},true),/ambiguidade/);
  assert.throws(()=>lib.validarConferencia(estado,{...draft,atuacao:'Executa'},{atuacao:'nao_identificado'},true),/ambiguidade/);
  lib.validarConferencia(estado,{...draft,atuacao:'Executa'},{atuacao:'corrigido'},true);
  lib.validarConferencia(estado,draft,{atuacao:'nao_identificado'},true);
  assert.throws(()=>lib.validarConferencia(estado,draft,{inexistente:'corrigido'},true),/inválidas/);
});
const org='11111111-1111-4111-8111-111111111111',diag='22222222-2222-4222-8222-222222222222';
function api({consulta=false,semSessao=false}={}){
  const eventos=[],registro={id:'importacao-teste',diagnostico_id:diag,dados:parse(texto),origem:{nomeArquivo:'origem.pdf',sha256:'a'.repeat(64),tamanho:400},pendentes:['F01'],estado:'pendente',criado_em:'2026-10-22T12:00:00Z'};
  const db={from(tabela){eventos.push({tabela});const q={select(){return q;},eq(){return q;},async maybeSingle(){return {error:null,data:tabela==='diagnosticos'?{id:diag}:registro};}};return q;},async rpc(nome,args){eventos.push({nome,args});return {error:null,data:nome==='registrar_importacao_matriz'?{...registro,dados:args.p_dados}:{funcao_id:'F01',atuacao:['Executa'],origem_pdf:{nomeArquivo:'origem.pdf',estado:'conferida'}}};}};
  const sessao=async()=>{if(semSessao)throw new Error('Sem sessão');return {id:'autor-servidor'};};
  const fn=()=>{const f={validator(){return f;},handler(h){return p=>h({data:p?.data});}};return f;};
  const mocks={'@tanstack/react-start':{createServerFn:fn},'./sessao.server':{exigirSessao:sessao,exigirEscrita:async()=>{const u=await sessao();if(consulta)throw new Error('Sem permissão');return u;}},'../integrations/supabase/client.server':{supabaseAdmin:db}};
  return {api:load('src/app/diagnosticos.server.ts',mocks),eventos,registro};
}
test('servidor reinterpreta texto oficial e usa autoria da sessão; registrar não salva respostas',async()=>{
  const a=api();await a.api.registrarImportacaoMatriz({data:{organizacaoId:org,diagnosticoId:diag,origem:a.registro.origem,texto,dados:{inventado:true}}});
  assert.equal(a.eventos.length,1);assert.equal(a.eventos[0].nome,'registrar_importacao_matriz');assert.equal(a.eventos[0].args.p_autor,'autor-servidor');assert.equal(a.eventos[0].args.p_dados.conferencia.F01.campos.atuacao,'ambiguo');
});
test('servidor impede gravação sem resolver a ambiguidade antes de chamar RPC e preserva origem na resposta',async()=>{
  const a=api(),dados={organizacaoId:org,diagnosticoId:diag,funcaoId:'F01',...a.registro.dados.respostas.F01,atuacao:'Executa',importacao:{id:a.registro.id,decisoes:{},confirmado:true}};
  await assert.rejects(a.api.salvarMatrizPrototipo({data:dados}),/ambiguidade/);assert.equal(a.eventos.filter(e=>e.nome).length,0);
  dados.importacao.decisoes={atuacao:'corrigido'};dados.nomeFuncao='Enunciado alterado pelo cliente';const resposta=await a.api.salvarMatrizPrototipo({data:dados});assert.equal(resposta.origemPdf.nomeArquivo,'origem.pdf');
  const evento=a.eventos.find(e=>e.nome);assert.equal(evento.nome,'confirmar_importacao_matriz');assert.equal(evento.args.p_autor,'autor-servidor');assert.equal(evento.args.p_organizacao,org);
  assert.equal(evento.args.p_resposta.nomeFuncao,'Representação e articulação institucional');
});
test('retomada exige sessão e leitura de aplicação/organização; consulta não registra nem descarta',async()=>{
  const a=api();assert.equal((await a.api.obterImportacaoMatrizPendente({data:{organizacaoId:org,diagnosticoId:diag}})).origem.sha256,a.registro.origem.sha256);
  assert.deepEqual(a.eventos.map(e=>e.tabela),['diagnosticos','diagnostico_matriz_importacoes']);
  const sem=api({semSessao:true});await assert.rejects(sem.api.obterImportacaoMatrizPendente({data:{organizacaoId:org,diagnosticoId:diag}}),/sessão/);assert.equal(sem.eventos.length,0);
  const b=api({consulta:true});for(const nome of ['registrarImportacaoMatriz','descartarImportacaoMatriz'])await assert.rejects(b.api[nome]({data:{}}),/permissão/);assert.equal(b.eventos.length,0);
});
