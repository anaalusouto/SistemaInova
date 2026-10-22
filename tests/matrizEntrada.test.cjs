const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={},cache=new Map()) {
  file=path.resolve(file);if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';
  if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(r=>r in mocks?mocks[r]:r.startsWith('.')?load(path.resolve(path.dirname(file),r),mocks,cache):require(r),m,m.exports);return m.exports;
}
const interpretar=()=>load('src/app/diagnostic/importarMatriz.ts').interpretarTextoMatriz;
const texto='F01 Representação e articulação institucional\nAtuação: Viabiliza e executa\nExperiência: Inicial\nCriticidade atual: 3\nInteresse em desenvolvimento: 4\nObservação: Relato da organização\nContinuação do relato\nExterno: Parceiro local';
test('PDF reconhece campos oficiais e mantém observação multilinha sem incluir leitura calculada',()=>{
  const r=interpretar()(texto+'\nLeitura orientativa: Outra leitura');
  assert.deepEqual(r.pendencias,[]);assert.equal(Object.keys(r.respostas).length,1);
  assert.equal(r.respostas.F01.atuacao,'Viabiliza e executa');assert.equal(r.respostas.F01.experiencia,'Inicial');
  assert.equal(r.respostas.F01.observacoes,'Relato da organização\nContinuação do relato');assert.equal(r.respostas.F01.externo,'Parceiro local');
  assert.equal(r.respostas.F01.criticidade,'3');assert.equal(r.respostas.F01.interesse,'4');assert.equal('leitura' in r.respostas.F01,false);
  assert.equal(r.conferencia.F01.campos.atuacao,'reconhecido');
});
test('reconhecimento também associa nome oficial sem código e deixa campos ausentes vazios',()=>{
  const r=interpretar()('Gestão de projetos\nAtuação:\nExecuta\nObservação: Planejamento');
  assert.equal(r.respostas.F21.atuacao,'Executa');assert.equal(r.respostas.F21.experiencia,null);assert.equal(r.respostas.F21.externo,null);
  assert.equal(r.conferencia.F21.campos.externo,'ausente');
});
test('funções repetidas, opções inválidas e códigos legados não recebem respostas presumidas',()=>{
  const p=interpretar();assert.deepEqual(p(texto+'\n'+texto).respostas,p(texto).respostas);
  const r=p('F02 Valorização cultural\nAtuação: Apoia\nExperiência: Recorrente\nCriticidade atual: 5');
  assert.equal(r.respostas.F02.atuacao,null);assert.equal(r.respostas.F02.criticidade,null);assert.equal(r.pendencias.length,2);
  assert.equal(r.conferencia.F02.campos.atuacao,'ambiguo');assert.equal(r.conferencia.F02.campos.experiencia,'reconhecido');
  assert.deepEqual(p('1 Representação\nAtuação: Executa').respostas,{});assert.deepEqual(p('Texto sem respostas').respostas,{});
  assert.deepEqual(p('F22 Não oficial\nAtuação: Executa').respostas,{});
  assert.equal(p(texto+'\n'+texto.replace('Viabiliza e executa','Executa')).conferencia.F01.campos.atuacao,'ambiguo');
  assert.equal(p('Função: F01\nAtuação: Viabiliza\nAtuação: Executa').conferencia.F01.campos.atuacao,'ambiguo');
});
test('importações independentes não reutilizam dados de outro arquivo ou organização',()=>{
  const p=interpretar(),primeira=p(texto),snapshot=JSON.stringify(primeira);
  const segunda=p('F03\nAtuação: Não realiza');
  assert.equal(segunda.respostas.F01,undefined);assert.equal(segunda.respostas.F03.atuacao,'Não realiza');assert.equal(JSON.stringify(primeira),snapshot);
});
function matriz({respostas=[],readOnly=false}={}) {
  const mocks={'@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='matriz-importacao'?null:respostas}),useMutation:()=>({isPending:false}),useQueryClient:()=>({})},'../../diagnosticos.server':{}};
  const {MatrizFuncionalTab}=load('src/app/components/diagnostic/MatrizPrototipoTab.tsx',mocks);
  return renderToStaticMarkup(React.createElement(MatrizFuncionalTab,{diagnosticoId:'diag-a',organizacaoId:'org-a',readOnly}));
}
test('entrada vazia oferece duas opções e não abre formulário antes da escolha',()=>{
  const html=matriz();assert.match(html,/Iniciar mapeamento/);assert.match(html,/Criar do zero/);assert.match(html,/Importar PDF/);assert.match(html,/type="file"/);assert.doesNotMatch(html,/Salvar alterações/);
});
test('respostas salvas abrem Matriz atual; consulta não oferece iniciar ou importar',()=>{
  const html=matriz({respostas:[{funcaoId:'F01',atuacao:['Executa'],experiencia:'Inicial',criticidade:'3',interesse:'2'}]});
  assert.match(html,/1 de 21 funções avaliadas/);assert.doesNotMatch(html,/Iniciar mapeamento|Criar do zero/);
  const consulta=matriz({readOnly:true});assert.match(consulta,/F21/);assert.doesNotMatch(consulta,/Importar PDF|Criar do zero|type="file"/);
});
test('leitor extrai respostas de PDF real e recusa arquivos inválidos ou operação cancelada',async()=>{
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const worker=require('node:url').pathToFileURL(path.resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')).href;
  const {lerPdfMatriz}=load('src/app/diagnostic/lerPdfMatriz.ts',{'pdfjs-dist':pdfjs,'pdfjs-dist/build/pdf.worker.min.mjs?url':{default:worker}});
  const {jsPDF}=require('jspdf');const doc=new jsPDF();doc.text(texto.split('\n'),15,20);
  const arquivo=new File([doc.output('arraybuffer')],'respostas.pdf',{type:'application/pdf'});
  const extraido=await lerPdfMatriz(arquivo,new AbortController().signal);
  const r=interpretar()(extraido);assert.equal(r.respostas.F01.atuacao,'Viabiliza e executa');assert.equal(r.respostas.F01.experiencia,'Inicial');
  await assert.rejects(lerPdfMatriz(new File(['não é pdf'],'falso.pdf'),new AbortController().signal),/PDF válido/);
  await assert.rejects(lerPdfMatriz(new File([],'vazio.pdf'),new AbortController().signal),/vazio/);
  const abort=new AbortController();abort.abort();await assert.rejects(lerPdfMatriz(arquivo,abort.signal),/aborted/);
});

test('leitor apresenta mensagens acionáveis para PDF protegido ou corrompido',async()=>{
  for(const [nome,mensagem] of [['PasswordException',/protegido por senha/],['InvalidPDFException',/inválido, corrompido ou incompleto/],['UnknownErrorException',/Selecione outra cópia/]]){
    let destruido=false;const erro=new Error('mensagem interna do leitor');erro.name=nome;
    const {lerPdfMatriz}=load('src/app/diagnostic/lerPdfMatriz.ts',{'pdfjs-dist':{GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.reject(erro),async destroy(){destruido=true;}})},'pdfjs-dist/build/pdf.worker.min.mjs?url':{default:'worker'}});
    await assert.rejects(lerPdfMatriz(new File(['%PDF-1.7\narquivo incompleto'],'teste.pdf'),new AbortController().signal),mensagem);assert.equal(destruido,true);
  }
  const {lerPdfMatriz}=load('src/app/diagnostic/lerPdfMatriz.ts',{'pdfjs-dist':{GlobalWorkerOptions:{},getDocument:()=>({promise:Promise.resolve({numPages:101}),async destroy(){}})},'pdfjs-dist/build/pdf.worker.min.mjs?url':{default:'worker'}});
  await assert.rejects(lerPdfMatriz(new File(['%PDF-1.7'],'extenso.pdf'),new AbortController().signal),/até 100 páginas/);
});

function entradaTeste(){
  let cursor=0,conteudo='',falha=false;const estados=[],gravacoes=[],importadas=[];
  const react={...React,useState(initial){const i=cursor++;if(!(i in estados))estados[i]=initial;return [estados[i],v=>{estados[i]=typeof v==='function'?v(estados[i]):v;}];},useRef(initial){const i=cursor++;return estados[i]??(estados[i]={current:initial});},useEffect(){}};
  const {EntradaMatriz}=load('src/app/components/diagnostic/EntradaMatriz.tsx',{react,'../../diagnostic/lerPdfMatriz':{lerPdfMatriz:async()=>conteudo},'../../diagnosticos.server':{registrarImportacaoMatriz:async({data})=>{gravacoes.push(data);if(falha)throw new Error('Falha de conexão ao registrar');return {id:'importacao',dados:interpretar()(data.texto)};}}});
  const render=()=>{cursor=0;return EntradaMatriz({organizacaoId:'org',diagnosticoId:'diag',onManual(){},onImportar:r=>importadas.push(r)});};
  const todos=(n,p)=>!n||typeof n!=='object'?[]:[...(p(n)?[n]:[]),...[n.props?.children].flat(Infinity).flatMap(c=>todos(c,p))];
  return {gravacoes,importadas,render,todos,setTexto:t=>{conteudo=t;},falhar:v=>{falha=v;},async selecionar(){const input=todos(render(),n=>n.type==='input'&&n.props.type==='file')[0];input.props.onChange({target:{files:[new File(['%PDF-1.7'],'teste.pdf')],value:'teste.pdf'}});for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,5));if(!todos(render(),n=>n.props?.role==='status').some(n=>String(n.props.children).includes('Lendo PDF')))return;}throw new Error('Importação não terminou');}};
}

test('PDF sem correspondências não registra importação e permite escolher outro arquivo',async()=>{
  const e=entradaTeste();
  for(const texto of ['Documento sem respostas','F01 Representação e articulação institucional','F22 Fora do catálogo\nAtuação: Executa']){
    e.setTexto(texto);await e.selecionar();assert.equal(e.gravacoes.length,0);assert.equal(e.importadas.length,0);
    assert.match(renderToStaticMarkup(e.render()),/Importação sem correspondências/);assert.equal(e.todos(e.render(),n=>n.props?.role==='alert').length,0);
  }
  e.setTexto('F01\nAtuação: Executa\nF22 Não oficial\nAtuação: Viabiliza');await e.selecionar();
  assert.equal(e.gravacoes.length,1);assert.equal(e.importadas.length,1);assert.deepEqual(Object.keys(e.importadas[0].dados.respostas),['F01']);assert.match(e.importadas[0].dados.pendencias.join(' '),/F22/);
});

test('falha de registro permite nova tentativa e não confirma respostas automaticamente',async()=>{
  const e=entradaTeste();e.setTexto(texto);e.falhar(true);await e.selecionar();assert.equal(e.importadas.length,0);
  assert.match(renderToStaticMarkup(e.render()),/Falha de conexão ao registrar/);
  e.falhar(false);await e.selecionar();assert.equal(e.importadas.length,1);assert.equal(e.gravacoes.length,2);assert.equal(e.todos(e.render(),n=>n.props?.role==='alert').length,0);
});
