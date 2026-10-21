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
  const p=interpretar();assert.deepEqual(p(texto+'\n'+texto).respostas,{});
  const r=p('F02 Valorização cultural\nAtuação: Apoia\nExperiência: Recorrente\nCriticidade atual: 5');
  assert.equal(r.respostas.F02.atuacao,null);assert.equal(r.respostas.F02.criticidade,null);assert.equal(r.pendencias.length,2);
  assert.equal(r.conferencia.F02.campos.atuacao,'ambiguo');assert.equal(r.conferencia.F02.campos.experiencia,'reconhecido');
  assert.deepEqual(p('1 Representação\nAtuação: Executa').respostas,{});assert.deepEqual(p('Texto sem respostas').respostas,{});
  assert.deepEqual(p('F22 Não oficial\nAtuação: Executa').respostas,{});
  assert.equal(p(texto+'\n'+texto).conferencia.F01.campos.atuacao,'ambiguo');
  assert.equal(p('Função: F01\nAtuação:\nAtuação: Executa').conferencia.F01.campos.atuacao,'ambiguo');
});
test('importações independentes não reutilizam dados de outro arquivo ou organização',()=>{
  const p=interpretar(),primeira=p(texto),snapshot=JSON.stringify(primeira);
  const segunda=p('F03 Fortalecimento\nAtuação: Não realiza');
  assert.equal(segunda.respostas.F01,undefined);assert.equal(segunda.respostas.F03.atuacao,'Não realiza');assert.equal(JSON.stringify(primeira),snapshot);
});
function matriz({respostas=[],readOnly=false}={}) {
  const mocks={'@tanstack/react-query':{useQuery:()=>({data:respostas}),useMutation:()=>({isPending:false}),useQueryClient:()=>({})},'../../diagnosticos.server':{}};
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
test('os dois caminhos usam o mesmo editor; importação só grava após revisão explícita',()=>{
  function editor(respostas=[]) {
    let cursor=0,opcoes;const estados=[],gravacoes=[];
    const react={...React,useState(inicial){const i=cursor++;if(!(i in estados))estados[i]=inicial;return [estados[i],v=>{estados[i]=typeof v==='function'?v(estados[i]):v;}];},useRef(v){const i=cursor++;return estados[i]??(estados[i]={current:v});},useMemo:f=>f()};
    const mocks={react,'../../diagnosticos.server':{},'@tanstack/react-query':{useQuery:()=>({data:respostas}),useQueryClient:()=>({setQueryData(_key,update){const novas=update(respostas);respostas.splice(0,respostas.length,...novas);},invalidateQueries(){}}),useMutation(o){opcoes=o;return {isPending:false,mutate(d){gravacoes.push(d);opcoes.onSuccess({...d,atuacao:d.atuacao?[d.atuacao]:[]},d);opcoes.onSettled();}};}}};
    const {MatrizFuncionalTab}=load('src/app/components/diagnostic/MatrizPrototipoTab.tsx',mocks);
    const root=MatrizFuncionalTab({organizacaoId:'org-a',diagnosticoId:'diag-a',readOnly:false});
    return {gravacoes,render(){cursor=0;return root.type(root.props);}};
  }
  function find(node,pred) {if(!node||typeof node!=='object')return null;if(pred(node))return node;for(const c of [node.props?.children].flat(Infinity)){const n=find(c,pred);if(n)return n;}return null;}
  const manual=editor();manual.render().props.onManual();const vazio=manual.render();assert.ok(find(vazio,n=>n.props?.['data-inova-field']==='F21'));assert.equal(manual.gravacoes.length,0);
  const e=editor();e.render().props.onImportar(interpretar()(texto),'respostas.pdf');let tree=e.render();
  assert.equal(e.gravacoes.length,0);assert.ok(find(tree,n=>n.type==='form'));assert.ok(find(tree,n=>n.type==='input'&&n.props.value==='Representação e articulação institucional'));
  find(tree,n=>n.type==='button'&&n.props.children==='Cancelar').props.onClick();tree=e.render();assert.equal(find(tree,n=>n.type==='form'),null);assert.equal(e.gravacoes.length,0);
  find(tree,n=>n.type==='button'&&n.props.children==='Editar').props.onClick();tree=e.render();
  const campo=find(tree,n=>n.type==='textarea'&&n.props.value==='Parceiro local');campo.props.onChange({target:{value:'Parceiro conferido'}});tree=e.render();
  find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});tree=e.render();
  assert.equal(e.gravacoes.length,1);assert.equal(e.gravacoes[0].organizacaoId,'org-a');assert.equal(e.gravacoes[0].diagnosticoId,'diag-a');assert.equal(e.gravacoes[0].externo,'Parceiro conferido');
  assert.equal(find(tree,n=>n.type==='form'),null);
  const pendente=editor();pendente.render().props.onImportar(interpretar()('F02 Valorização cultural\nAtuação: Apoia\nExperiência: Inicial'),'incompleto.pdf');
  const conferenciaHtml=renderToStaticMarkup(pendente.render());
  assert.match(conferenciaHtml,/Reconhecido no PDF/);assert.match(conferenciaHtml,/Ausente no PDF/);assert.match(conferenciaHtml,/Ambíguo no PDF/);assert.match(conferenciaHtml,/Confirmar e salvar função/);
  assert.equal(pendente.gravacoes.length,0);
  assert.doesNotMatch(conferenciaHtml,/Respostas anteriores|Outra função|Acesso a políticas públicas/);
  const duplicada=editor();duplicada.render().props.onImportar(interpretar()(texto+'\n'+texto),'duplicado.pdf');assert.ok(find(duplicada.render(),n=>n.type==='form'));assert.equal(duplicada.gravacoes.length,0);
});
