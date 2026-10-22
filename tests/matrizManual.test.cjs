const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
function load(file,mocks,cache=new Map()) {
  file=path.resolve(file);if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';
  if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(r=>r in mocks?mocks[r]:r.startsWith('.')?load(path.resolve(path.dirname(file),r),mocks,cache):require(r),m,m.exports);return m.exports;
}
function nodes(node,predicate) {
  if(!node||typeof node!=='object')return [];
  return [...(predicate(node)?[node]:[]),...[node.props?.children].flat(Infinity).flatMap(c=>nodes(c,predicate))];
}
const one=(tree,predicate)=>{const encontrados=nodes(tree,predicate);assert.equal(encontrados.length,1);return encontrados[0];};
function ambiente() {
  const banco=new Map(),gravacoes=[],consultas=[];let falha=false;
  function abrir(organizacaoId='org-a',diagnosticoId='diag-a') {
    const contexto=`${organizacaoId}:${diagnosticoId}`;let cursor=0;const estados=[];
    const react={...React,useState(initial){const i=cursor++;if(!(i in estados))estados[i]=initial;return [estados[i],v=>{estados[i]=typeof v==='function'?v(estados[i]):v;}];},useRef(initial){const i=cursor++;return estados[i]??(estados[i]={current:initial});},useMemo:f=>f()};
    const client={invalidateQueries(){},setQueryData(key,update){assert.deepEqual(key,['diagnostico-matriz',diagnosticoId,organizacaoId]);banco.set(contexto,update(banco.get(contexto)));}};
    const mocks={react,sonner:{toast:{success(){},error(){}}},'../../diagnosticos.server':{},'@tanstack/react-query':{
      useQuery(options){consultas.push(options.queryKey);return {data:options.queryKey[0]==='matriz-importacao'?null:banco.get(contexto)??[]};},useQueryClient:()=>client,
      useMutation(options){return {isPending:false,mutate(d){gravacoes.push(d);if(falha)options.onError(new Error('Falha ao salvar'));else options.onSuccess({...d,atuacao:d.atuacao?[d.atuacao]:[],quemExecuta:null,abrangencia:null,atualizadoEm:'2026-10-21T20:00:00Z'},d);options.onSettled();}};},
    }};
    const {MatrizFuncionalTab}=load('src/app/components/diagnostic/MatrizPrototipoTab.tsx',mocks);
    const root=MatrizFuncionalTab({organizacaoId,diagnosticoId,readOnly:false});
    return {key:root.key,render(){cursor=0;return root.type(root.props);}};
  }
  return {abrir,banco,gravacoes,consultas,simularFalha:v=>{falha=v;}};
}
function funcao(editor,id='F01') {
  const bloco=one(editor.render(),n=>n.props?.['data-inova-field']===id);
  one(bloco,n=>n.type==='button'&&n.props['aria-expanded']!==undefined).props.onClick();return editor.render();
}
function preencher(editor,label,valor) {
  const campo=one(editor.render(),n=>n.type==='label'&&[n.props.children].flat()[0]===label);
  one(campo,n=>['input','textarea','select'].includes(n.type)).props.onChange({target:{value:valor}});
}
const clicar=(editor,nome)=>one(editor.render(),n=>n.type==='button'&&n.props.children===nome).props.onClick();
const salvar=editor=>one(editor.render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});

test('criar do zero apresenta exatamente 21 funções e todos os campos de resposta vazios',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();
  assert.equal(nodes(e.render(),n=>n.props?.['data-inova-form']==='matriz').length,21);
  assert.deepEqual(nodes(e.render(),n=>n.props?.['data-inova-form']==='matriz').map(n=>n.props['data-inova-field']),['F01','F02','F03','F04','F05','F07','F08','F06','F20','F21','F09','F10','F11','F12','F13','F14','F15','F16','F17','F18','F19']);
  for(const id of ['F01','F21']) {
    funcao(e,id);const form=one(e.render(),n=>n.type==='form');
    for(const campo of nodes(form,n=>n.type==='select'||n.type==='textarea'))assert.equal(campo.props.value,'');
    assert.equal(one(form,n=>n.type==='input'&&n.props.readOnly).props.value,'Completar avaliação');
  }
  assert.equal(a.gravacoes.length,0);
});
test('preencher, salvar, reabrir e editar restaura os dados confirmados na aplicação sem duplicar',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();funcao(e);
  for(const [label,value] of [['Função','Representação revisada'],['Atuação','Viabiliza'],['Experiência','Inicial'],['Criticidade atual','3'],['Interesse em desenvolvimento','4'],['Observação','Relato manual'],['Externo','Parceiro local']])preencher(e,label,value);
  salvar(e);assert.equal(nodes(e.render(),n=>n.type==='form').length,0);
  const registro=a.banco.get('org-a:diag-a')[0];assert.equal(registro.observacoes,'Relato manual');assert.equal(registro.externo,'Parceiro local');
  const reaberto=a.abrir();funcao(reaberto);clicar(reaberto,'Editar');
  assert.equal(one(reaberto.render(),n=>n.type==='input'&&!n.props.readOnly).props.value,'Representação revisada');
  assert.equal(one(reaberto.render(),n=>n.type==='select'&&n.props.value==='Viabiliza').props.value,'Viabiliza');
  assert.equal(one(reaberto.render(),n=>n.type==='textarea'&&n.props.value==='Relato manual').props.value,'Relato manual');
  preencher(reaberto,'Observação','Relato atualizado');salvar(reaberto);
  assert.equal(a.banco.get('org-a:diag-a').length,1);assert.equal(a.banco.get('org-a:diag-a')[0].observacoes,'Relato atualizado');
});
test('falha mantém o formulário preenchido; cancelar não grava; outra aplicação começa vazia',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();funcao(e);preencher(e,'Observação','Rascunho ainda não salvo');
  a.simularFalha(true);salvar(e);assert.equal(one(e.render(),n=>n.type==='textarea'&&n.props.value==='Rascunho ainda não salvo').props.value,'Rascunho ainda não salvo');assert.equal(a.banco.size,0);
  assert.match(one(e.render(),n=>n.props?.role==='alert').props.children,/Suas alterações continuam visíveis/);
  a.simularFalha(false);salvar(e);assert.equal(a.banco.get('org-a:diag-a')[0].observacoes,'Rascunho ainda não salvo');assert.equal(nodes(e.render(),n=>n.props?.role==='alert').length,0);
  clicar(e,'Editar');preencher(e,'Observação','Alteração cancelada');
  clicar(e,'Cancelar');assert.equal(a.banco.get('org-a:diag-a')[0].observacoes,'Rascunho ainda não salvo');assert.equal(nodes(e.render(),n=>n.type==='form').length,0);
  const outra=a.abrir('org-a','diag-b'),outraOrg=a.abrir('org-b','diag-c');assert.notEqual(e.key,outra.key);assert.notEqual(e.key,outraOrg.key);
  for(const entrada of [outra,outraOrg]){entrada.render().props.onManual();funcao(entrada);assert.equal(nodes(entrada.render(),n=>n.type==='textarea'&&n.props.value!=='').length,0);}
});
test('estado Revisada existe antes do salvamento e volta para Em edição quando um valor muda',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();
  const estado=()=>one(e.render(),n=>n.props?.['data-inova-field']==='F01').props['data-estado-matriz'];
  assert.equal(estado(),'vazia');funcao(e);assert.equal(estado(),'em_edicao');preencher(e,'Atuação','Executa');clicar(e,'Revisar valores');
  assert.equal(estado(),'revisada');assert.equal(a.gravacoes.length,0);assert.ok(one(e.render(),n=>n.props?.['aria-label']==='Valores revisados da função F01'));
  preencher(e,'Observação','Valor alterado após revisar');assert.equal(estado(),'em_edicao');clicar(e,'Revisar valores');salvar(e);assert.equal(estado(),'revisada');
});
test('rascunhos e revisão permanecem ao alternar funções; cancelar descarta somente a edição atual',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();funcao(e);preencher(e,'Observação','Rascunho F01');clicar(e,'Revisar valores');
  funcao(e,'F02');preencher(e,'Observação','Rascunho F02');funcao(e);
  assert.equal(one(e.render(),n=>n.type==='textarea'&&n.props.value==='Rascunho F01').props.value,'Rascunho F01');
  assert.equal(one(e.render(),n=>n.props?.['data-inova-field']==='F01').props['data-estado-matriz'],'revisada');
  clicar(e,'Cancelar');assert.equal(one(e.render(),n=>n.props?.['data-inova-field']==='F01').props['data-estado-matriz'],'vazia');
  funcao(e,'F02');assert.equal(one(e.render(),n=>n.type==='textarea'&&n.props.value==='Rascunho F02').props.value,'Rascunho F02');assert.equal(a.gravacoes.length,0);
});
