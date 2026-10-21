const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
function ambiente({consulta=false,falha=null,organizacaoValida=true}={}) {
  const eventos=[],cache=new Map();
  const db={rpc:async(nome,args)=>{eventos.push({nome,args});return {error:falha,data:{funcao_id:args.p_funcao,funcao_nome:args.p_nome,atuacao:[args.p_atuacao],experiencia:args.p_experiencia,externo:args.p_externo}};},from(tabela){
    const evento={tabela,filtros:[]};eventos.push(evento);
    const result=()=>({error:null,data:tabela==='diagnosticos'?(organizacaoValida?{id:input.diagnosticoId}:null):[{funcao_id:'F01',atuacao:['Executa']},{funcao_id:'1',atuacao:['Articula']},{funcao_id:'24',atuacao:[]}]});
    const q={select(){return q;},eq(k,v){evento.filtros.push([k,v]);return q;},async maybeSingle(){return result();},then(ok,bad){return Promise.resolve(result()).then(ok,bad);}};return q;
  }};
  function load(file) {
    file=path.resolve(file);if(!path.extname(file))file+='.ts';if(cache.has(file))return cache.get(file).exports;
    const m={exports:{}};cache.set(file,m);
    const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('require','module','exports',code)(r=>{
      if(r==='@tanstack/react-start')return {createServerFn:()=>{const f={validator(){return f;},handler(h){return p=>h({data:p?.data});}};return f;}};
      if(r.endsWith('sessao.server'))return {exigirSessao:async()=>({}),exigirEscrita:async()=>{if(consulta)throw Error('Sem permissão');}};
      if(r.endsWith('client.server'))return {supabaseAdmin:db};
      return r.startsWith('.')?load(path.resolve(path.dirname(file),r)):require(r);
    },m,m.exports);return m.exports;
  }
  return {load,eventos};
}
const input={organizacaoId:'11111111-1111-4111-8111-111111111111',diagnosticoId:'22222222-2222-4222-8222-222222222222',funcaoId:'F01',nomeFuncao:'Representação local',atuacao:'Viabiliza',experiencia:'Inicial',criticidade:'3',interesse:'4',observacoes:'Relato',externo:'Parceiro'};
test('21 funções usam códigos próprios; opções são as do protótipo',()=>{
  const c=ambiente().load('src/app/diagnostic/catalog/matrizPrototipo.ts');
  assert.equal(c.FUNCOES_MATRIZ.length,21);assert.equal(new Set(c.FUNCOES_MATRIZ.map(f=>f.id)).size,21);
  assert.deepEqual(c.FUNCOES_MATRIZ.map(f=>f.id).sort(),Array.from({length:21},(_,i)=>`F${String(i+1).padStart(2,'0')}`));
  assert.deepEqual(c.ATUACAO_MATRIZ,['Não realiza','Executa','Viabiliza','Viabiliza e executa']);
  assert.deepEqual(c.EXPERIENCIA_MATRIZ,['Não está acontecendo','Inicial','Recorrente']);
  assert.deepEqual(c.NIVEIS_MATRIZ,['1','2','3','4']);
});
test('leitura cruza experiência e criticidade; campos incompletos não recebem avaliação',()=>{
  const {leituraMatriz:l}=ambiente().load('src/app/diagnostic/catalog/matrizPrototipo.ts');
  for(const c of ['1','2','3','4'])assert.equal(l(c,'Recorrente'),'Acompanhar');
  assert.deepEqual(['1','2','3','4'].map(c=>l(c,'Inicial')),['Melhoria pontual','Melhoria pontual','Lacuna relevante','Lacuna crítica']);
  assert.deepEqual(['1','2','3','4'].map(c=>l(c,'Não está acontecendo')),['Acompanhar','Melhoria pontual','Lacuna crítica','Lacuna crítica']);
  assert.equal(l(null,'Inicial'),'Completar avaliação');assert.equal(l('4',null),'Completar avaliação');
});
test('validação aceita preenchimento parcial e rejeita opções antigas ou contexto inválido',()=>{
  const {validarMatrizPrototipo:v}=ambiente().load('src/app/diagnostic/catalog/matrizPrototipo.ts');v(input);
  v({...input,atuacao:null,experiencia:null,criticidade:null,interesse:null});
  for(const change of [{funcaoId:'1'},{funcaoId:'F22'},{organizacaoId:''},{nomeFuncao:' '},{atuacao:'Apoia'},{experiencia:'N/A'},{criticidade:'5'},{interesse:'Alto'}])assert.throws(()=>v({...input,...change}));
});
test('gravação envia organização e aplicação à operação atômica e conserva novos campos',async()=>{
  const a=ambiente();const row=await a.load('src/app/diagnosticos.server.ts').salvarMatrizPrototipo({data:input});
  assert.equal(a.eventos.length,1);assert.equal(a.eventos[0].nome,'salvar_matriz_prototipo');
  assert.equal(a.eventos[0].args.p_organizacao,input.organizacaoId);assert.equal(a.eventos[0].args.p_diagnostico,input.diagnosticoId);
  assert.equal(row.nomeFuncao,input.nomeFuncao);assert.equal(row.experiencia,input.experiencia);assert.equal(row.externo,input.externo);
});
test('consulta não grava; falha do banco não se apresenta como sucesso',async()=>{
  const a=ambiente({consulta:true});await assert.rejects(a.load('src/app/diagnosticos.server.ts').salvarMatrizPrototipo({data:input}),/permissão/);assert.equal(a.eventos.length,0);
  const b=ambiente({falha:{message:'Aplicação de outra organização'}});await assert.rejects(b.load('src/app/diagnosticos.server.ts').salvarMatrizPrototipo({data:input}),/outra organização/);
});
test('leitura exclui o catálogo antigo e valida o vínculo de organização antes de consultar respostas',async()=>{
  const a=ambiente(),api=a.load('src/app/diagnosticos.server.ts');
  const respostas=await api.listarRespostasMatriz({data:{diagnosticoId:input.diagnosticoId,organizacaoId:input.organizacaoId}});
  assert.deepEqual(respostas.map(r=>r.funcaoId),['F01']);assert.deepEqual(a.eventos[0].filtros,[['id',input.diagnosticoId],['comunidade_id',input.organizacaoId]]);
  const b=ambiente({organizacaoValida:false});await assert.rejects(b.load('src/app/diagnosticos.server.ts').listarRespostasMatriz({data:{diagnosticoId:input.diagnosticoId,organizacaoId:input.organizacaoId}}),/não pertence/);
  assert.equal(b.eventos.length,1);
});
test('relatório inclui somente o catálogo de 21 funções sem alterar IEO ou Cesta',()=>{
  const {buildDiagnosticoReportModel:build}=ambiente().load('src/app/lib/diagnosticReportExport.ts');
  const d={diagnostico:{dataAplicacao:'2026-10-21',versao:1},comunidade:{nome:'Organização',code:'A',classificacao:'Associação'},matriz:[],ieo:[],produtos:[],parecer:null};
  const antes=build('Teste',[d],['ieo','cesta']).entries[0];
  d.matriz=[{...input,atuacao:[input.atuacao]},{funcaoId:'1',atuacao:['Articula'],quemExecuta:'Equipe',observacoes:'Registro anterior'}];
  const snapshot=JSON.stringify(d),depois=build('Teste',[d],['matriz','ieo','cesta']).entries[0];
  assert.equal(depois.matriz.length,1);assert.equal(depois.matriz[0].experiencia,'Inicial');assert.equal(depois.matriz[0].externo,'Parceiro');assert.equal(depois.matriz[0].leitura,'Lacuna relevante');
  assert.deepEqual(depois.ieo,antes.ieo);assert.deepEqual(depois.produtos,antes.produtos);assert.equal(JSON.stringify(d),snapshot);
});
