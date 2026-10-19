const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');

function ambiente({semSessao=false,consulta=false,status='em_edicao',falhaUpload=false,falhaLinha=false,falhaExclusao=false}={}) {
  const eventos=[];const documentos=[];const cache=new Map();
  const usuario={id:'u1',displayName:'Autoria da sessão',role:consulta?'visualizador':'admin'};
  const exigirSessao=async()=>{if(semSessao)throw Error('Sessão necessária');return usuario;};
  const exigirEscrita=async()=>{await exigirSessao();if(consulta)throw Error('Sem permissão');return usuario;};
  const db={storage:{from(bucket){return {
    async upload(key,buffer){eventos.push({acao:'upload',bucket,key,tamanho:buffer.length});return {error:falhaUpload?{message:'falha'}:null};},
    async remove(keys){eventos.push({acao:'storage-remove',bucket,keys});return {error:null};},
    async createSignedUrl(key,segundos){eventos.push({acao:'signed',bucket,key,segundos});return {data:{signedUrl:'https://storage.example/privado?assinado'},error:null};},
  };}},from(tabela){
    eventos.push({acao:'from',tabela});let acao='select',payload;const filtros=[];
    const result=()=>{
      if(tabela==='projetos'||tabela==='comunidades')return {data:{id:filtros.find(([k])=>k==='id')?.[1]},error:null};
      if(tabela==='diagnosticos')return {data:{id:'d1',comunidade_id:'org-a',status,versao:1},error:null};
      if(tabela==='diagnostico_produtos'&&acao==='select')return {data:{diagnostico_id:'d1'},error:null};
      if(tabela==='documentos_registro'){
        if(acao==='insert'){
          eventos.push({acao:'insert',payload});
          if(falhaLinha)return {data:null,error:{message:'falha'}};
          const row={...payload,id:'arquivo-'+(documentos.length+1),criado_em:'2026-10-19'};documentos.push(row);return {data:row,error:null};
        }
        if(acao==='delete'){
          eventos.push({acao:'delete',filtros});
          if(falhaExclusao)return {error:{message:'falha'}};
          const i=documentos.findIndex(r=>filtros.every(([k,v])=>r[k]===v));if(i>=0)documentos.splice(i,1);return {data:null,error:null};
        }
        return {data:documentos.filter(r=>filtros.every(([k,v])=>r[k]===v)),error:null};
      }
      eventos.push({acao,tabela,payload});return {data:payload??{},error:null};
    };
    const q={select(){return q;},eq(k,v){filtros.push([k,v]);return q;},order(){return q;},insert(d){acao='insert';payload=d;return q;},upsert(d){acao='upsert';payload=d;return q;},update(d){acao='update';payload=d;return q;},delete(){acao='delete';return q;},
      async single(){const r=result();return {...r,data:Array.isArray(r.data)?r.data[0]??null:r.data};},async maybeSingle(){return q.single();},then(ok,bad){return Promise.resolve(result()).then(ok,bad);}};return q;
  }};
  const load=file=>{
    const full=path.resolve(__dirname,'..',file.endsWith('.ts')?file:file+'.ts');if(cache.has(full))return cache.get(full).exports;
    const mod={exports:{}};cache.set(full,mod);
    const code=ts.transpileModule(fs.readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('require','module','exports',code)(r=>{
      if(r==='@tanstack/react-start')return {createServerFn:()=>{let valid=d=>d;const f={validator(v){valid=v;return f;},handler(h){return p=>h({data:valid(p?.data)});}};return f;}};
      if(r.endsWith('/client.server'))return {supabaseAdmin:db};
      if(r.endsWith('sessao.server'))return {exigirSessao,exigirEscrita};
      return r.startsWith('.')?load(path.resolve(path.dirname(full),r)):require(r);
    },mod,mod.exports);return mod.exports;
  };
  return {api:load('src/app/documentosRegistro.server.ts'),diagnostico:load('src/app/diagnosticos.server.ts'),validacao:load('src/app/lib/documentosRegistro.ts'),eventos,documentos};
}
const org='11111111-1111-4111-8111-111111111111';
const arquivo={area:'projeto',projetoId:1,nomeArquivo:'plano.pdf',tipoMime:'application/pdf',dataUrl:'data:application/pdf;base64,JVBERi0xLjc='};

test('documentos exigem sessão para listar e abrir; consulta não anexa nem remove',async()=>{
  const a=ambiente({semSessao:true});
  await assert.rejects(a.api.listarDocumentosRegistro({data:{area:'projeto',projetoId:1}}),/Sessão/);
  await assert.rejects(a.api.abrirDocumentoRegistro({data:{id:'x'}}),/Sessão/);
  assert.equal(a.eventos.length,0);
  const b=ambiente({consulta:true});
  await assert.rejects(b.api.enviarDocumentoRegistro({data:arquivo}),/permissão/);
  await assert.rejects(b.api.excluirDocumentoRegistro({data:{id:'x'}}),/permissão/);
  assert.equal(b.eventos.length,0);
});
test('upload associa arquivo ao destino correto, usa autoria da sessão e não substitui outros documentos',async()=>{
  const a=ambiente();
  await a.api.enviarDocumentoRegistro({data:{...arquivo,enviadoPor:'AUTORIA FORJADA'}});
  await a.api.enviarDocumentoRegistro({data:{...arquivo,nomeArquivo:'outro.pdf'}});
  assert.equal(a.documentos.length,2);
  assert.equal(a.documentos[0].enviado_por,'Autoria da sessão');
  assert.equal(a.documentos[0].projeto_id,1);assert.equal(a.documentos[0].comunidade_id,null);
  assert.ok(a.eventos.filter(e=>e.acao==='upload').every(e=>e.bucket==='projeto-anexos'&&!e.key.includes('plano.pdf')));
  assert.ok(!a.eventos.some(e=>e.acao==='storage-remove'));
});
test('listagem separa projetos, organizações e áreas sem expor caminho do storage',async()=>{
  const a=ambiente();
  for(const d of [arquivo,{...arquivo,projetoId:2},{...arquivo,area:'parecer',projetoId:undefined,organizacaoId:org},{...arquivo,area:'mapeamento',projetoId:undefined,organizacaoId:org}])await a.api.enviarDocumentoRegistro({data:d});
  const lista=await a.api.listarDocumentosRegistro({data:{area:'projeto',projetoId:1}});
  assert.equal(lista.length,1);assert.equal(lista[0].nomeArquivo,'plano.pdf');assert.ok(!('storage_path'in lista[0]));
  const parecer=await a.api.listarDocumentosRegistro({data:{area:'parecer',organizacaoId:org}});assert.equal(parecer.length,1);
});
test('arquivo usa acesso temporário e remoção falha sem apagar objeto se banco recusar',async()=>{
  const a=ambiente({falhaExclusao:true});const d=await a.api.enviarDocumentoRegistro({data:arquivo});
  const acesso=await a.api.abrirDocumentoRegistro({data:{id:d.id}});assert.match(acesso.url,/assinado/);
  assert.equal(a.eventos.find(e=>e.acao==='signed').segundos,600);
  await assert.rejects(a.api.excluirDocumentoRegistro({data:{id:d.id}}),/remover/);
  assert.ok(!a.eventos.some(e=>e.acao==='storage-remove'));
});
test('falhas de upload e metadados não deixam referência ou arquivo órfão',async()=>{
  const a=ambiente({falhaUpload:true});await assert.rejects(a.api.enviarDocumentoRegistro({data:arquivo}),/enviar/);
  assert.equal(a.documentos.length,0);assert.ok(!a.eventos.some(e=>e.acao==='insert'));
  const b=ambiente({falhaLinha:true});await assert.rejects(b.api.enviarDocumentoRegistro({data:arquivo}),/não foi registrado/);
  assert.equal(b.documentos.length,0);assert.ok(b.eventos.some(e=>e.acao==='storage-remove'));
});
test('validação recusa tamanho, MIME, arquivo vazio e destinos misturados antes do upload',async()=>{
  const a=ambiente();
  for(const d of [{...arquivo,area:'nao-existe'},{...arquivo,organizacaoId:org},{...arquivo,projetoId:-1},{...arquivo,tipoMime:'text/html'},{...arquivo,dataUrl:''}])await assert.rejects(a.api.enviarDocumentoRegistro({data:d}));
  assert.ok(!a.eventos.some(e=>e.acao==='upload'));
  assert.throws(()=>a.validacao.validarDocumento('arquivo.pdf','application/pdf',3145729),/3 MB/);
});
test('todas as consultas diagnósticas exigem autenticação no servidor',async()=>{
  const a=ambiente({semSessao:true});
  for(const [nome,dados] of [['listarVisaoGeralDiagnosticos',{}],['listarDiagnosticosPorComunidade',{comunidadeId:org}],['getDiagnostico',{id:'d1'}],['listarRespostasMatriz',{diagnosticoId:'d1'}],['listarRespostasIeo',{diagnosticoId:'d1'}],['listarProdutos',{diagnosticoId:'d1'}],['getParecer',{diagnosticoId:'d1'}],['listarChecklist',{diagnosticoId:'d1'}],['getAnexo',{anexoId:'a1'}],['getDadosCompletosDiagnostico',{diagnosticoId:'d1'}],['listarDiagnosticosConcluidosParaRelatorio',{}]])await assert.rejects(a.diagnostico[nome]({data:dados}),/Sessão/,nome);
  assert.equal(a.eventos.length,0);
});
test('consulta não cria, altera, conclui, versiona ou anexa instrumentos por chamada direta',async()=>{
  const a=ambiente({consulta:true});
  for(const nome of ['criarDiagnostico','concluirDiagnostico','salvarRespostaMatriz','salvarRespostaIeo','criarProduto','salvarRespostasProduto','excluirProduto','salvarParecer','salvarChecklistItem','uploadAnexoChecklist','criarNovaVersaoDiagnostico'])await assert.rejects(a.diagnostico[nome]({data:{id:'d1',diagnosticoId:'d1',produtoId:'p1',diagnosticoAnteriorId:'d1'}}),/permissão/,nome);
  assert.equal(a.eventos.length,0);
});
test('diagnóstico concluído impede alteração de instrumentos, produtos e anexos no servidor',async()=>{
  const a=ambiente({status:'concluido'});
  for(const nome of ['concluirDiagnostico','salvarRespostaMatriz','salvarRespostaIeo','criarProduto','salvarRespostasProduto','excluirProduto','salvarParecer','salvarChecklistItem','uploadAnexoChecklist'])await assert.rejects(a.diagnostico[nome]({data:{id:'d1',diagnosticoId:'d1',produtoId:'p1'}}),/somente leitura/,nome);
  assert.ok(!a.eventos.some(e=>['insert','upsert','update','delete','upload'].includes(e.acao)));
});
test('IEO recusa níveis inválidos e versão nova exige conclusão da anterior',async()=>{
  const a=ambiente();
  for(const nivel of [0,5,1.5,NaN])await assert.rejects(a.diagnostico.salvarRespostaIeo({data:{diagnosticoId:'d1',perguntaId:'1.1.1',nivel}}),/inteiro de 1 a 4/);
  await assert.rejects(a.diagnostico.criarNovaVersaoDiagnostico({data:{diagnosticoAnteriorId:'d1'}}),/Conclua/);
});
