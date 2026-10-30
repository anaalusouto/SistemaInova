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
function ambiente(importacao=null) {
  const banco=new Map(),gravacoes=[],consultas=[];let falha=false;
  function abrir(organizacaoId='org-a',diagnosticoId='diag-a',readOnly=false) {
    const contexto=`${organizacaoId}:${diagnosticoId}`;let cursor=0;const estados=[];
    const react={...React,useEffect(){},useState(initial){const i=cursor++;if(!(i in estados))estados[i]=initial;return [estados[i],v=>{estados[i]=typeof v==='function'?v(estados[i]):v;}];},useRef(initial){const i=cursor++;return estados[i]??(estados[i]={current:initial});},useMemo:f=>f()};
    const client={invalidateQueries(){},setQueryData(key,update){assert.deepEqual(key,['diagnostico-matriz',diagnosticoId,organizacaoId]);banco.set(contexto,update(banco.get(contexto)));}};
    const mocks={react,sonner:{toast:{success(){},error(){}}},'../PopupDetalhe':{PopupDetalhe:({children})=>children},'../../diagnosticos.server':{},'@tanstack/react-query':{
      useQuery(options){consultas.push(options.queryKey);return {data:options.queryKey[0]==='matriz-importacao'?importacao:banco.get(contexto)??[]};},useQueryClient:()=>client,
      useMutation(options){return {isPending:false,mutate(d){gravacoes.push(d);if(falha)options.onError(new Error('Falha ao salvar'),d);else options.onSuccess({...d,atuacao:d.atuacao?[d.atuacao]:[],quemExecuta:null,abrangencia:null,atualizadoEm:'2026-10-21T20:00:00Z'},d);options.onSettled();}};},
    }};
    const {MatrizFuncionalTab}=load('src/app/components/diagnostic/MatrizPrototipoTab.tsx',mocks);
    const root=MatrizFuncionalTab({organizacaoId,diagnosticoId,readOnly});
    return {key:root.key,chaveAtual(){return MatrizFuncionalTab({organizacaoId,diagnosticoId,readOnly}).key;},render(){cursor=0;const atual=MatrizFuncionalTab({organizacaoId,diagnosticoId,readOnly});return atual.type(atual.props);}};
  }
  return {abrir,banco,gravacoes,consultas,simularFalha:v=>{falha=v;},atualizarImportacao:v=>{importacao=v;}};
}
function funcao(editor,id='F01') {
  one(editor.render(),n=>typeof n.props?.onSelecionar==='function').props.onSelecionar(id);return editor.render();
}
function preencher(editor,label,valor) {
  const campo=one(editor.render(),n=>n.type==='label'&&[n.props.children].flat()[0]===label);
  one(campo,n=>['input','textarea','select'].includes(n.type)).props.onChange({target:{value:valor}});
}
const clicar=(editor,nome)=>{const tree=editor.render();const modal=nodes(tree,n=>n.props?.['data-inova-form']==='matriz')[0];return one(modal??tree,n=>n.type==='button'&&n.props.children===nome).props.onClick();};
const salvar=editor=>one(editor.render(),n=>n.type==='form').props.onSubmit({preventDefault(){}});

test('criar do zero apresenta exatamente 21 funções e todos os campos de resposta vazios',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();
  const linhas=one(e.render(),n=>typeof n.props?.onSelecionar==='function').props.linhas;
  assert.equal(linhas.length,21);
  assert.deepEqual(linhas.map(n=>n.id),['F01','F02','F03','F04','F05','F07','F08','F06','F20','F21','F09','F10','F11','F12','F13','F14','F15','F16','F17','F18','F19']);
  for(const id of ['F01','F21']) {
    funcao(e,id);const form=one(e.render(),n=>n.type==='form');
    for(const campo of nodes(form,n=>n.type==='select'||n.type==='textarea'))assert.equal(campo.props.value,'');
    assert.equal(one(form,n=>n.type==='input'&&n.props.readOnly).props.value,'Completar avaliação');
  }
  assert.equal(a.gravacoes.length,0);
});
test('preencher, salvar, reabrir e editar restaura os dados confirmados na aplicação sem duplicar',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();funcao(e);
  for(const [label,value] of [['Atuação','Viabiliza'],['Experiência','Inicial'],['Criticidade atual','3'],['Interesse em desenvolvimento','4'],['Observação','Relato manual'],['Externo','Parceiro local']])preencher(e,label,value);
  salvar(e);assert.equal(nodes(e.render(),n=>n.type==='form').length,0);
  const registro=a.banco.get('org-a:diag-a')[0];assert.equal(registro.observacoes,'Relato manual');assert.equal(registro.externo,'Parceiro local');
  const reaberto=a.abrir();funcao(reaberto);clicar(reaberto,'Editar');
  assert.equal(registro.nomeFuncao,'Representação e articulação institucional');
  assert.equal(nodes(reaberto.render(),n=>n.type==='input'&&!n.props.readOnly).length,0);
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
  const estado=()=>one(e.render(),n=>typeof n.props?.onSelecionar==='function').props.linhas.find(l=>l.id==='F01').estado;
  assert.equal(estado(),'Vazia');funcao(e);assert.equal(estado(),'Em edição');preencher(e,'Atuação','Executa');clicar(e,'Revisar valores');
  assert.equal(estado(),'Revisada');assert.equal(a.gravacoes.length,0);assert.ok(one(e.render(),n=>n.props?.['aria-label']==='Valores revisados da função F01'));
  preencher(e,'Observação','Valor alterado após revisar');assert.equal(estado(),'Em edição');clicar(e,'Revisar valores');salvar(e);assert.equal(estado(),'Revisada');
});
test('rascunhos e revisão permanecem ao alternar funções; cancelar descarta somente a edição atual',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();funcao(e);preencher(e,'Observação','Rascunho F01');clicar(e,'Revisar valores');
  funcao(e,'F02');preencher(e,'Observação','Rascunho F02');funcao(e);
  assert.equal(one(e.render(),n=>n.type==='textarea'&&n.props.value==='Rascunho F01').props.value,'Rascunho F01');
  assert.equal(one(e.render(),n=>n.props?.['data-inova-field']==='F01').props['data-estado-matriz'],'revisada');
  clicar(e,'Cancelar');assert.equal(one(e.render(),n=>n.props?.['data-inova-field']==='F01').props['data-estado-matriz'],'vazia');
  funcao(e,'F02');assert.equal(one(e.render(),n=>n.type==='textarea'&&n.props.value==='Rascunho F02').props.value,'Rascunho F02');assert.equal(a.gravacoes.length,0);
});

const painel=e=>one(e.render(),n=>typeof n.props?.onSelecionar==='function');
function tabela(e) {
  const p=painel(e);
  return {p,linha(id='F01'){const componente=p.props.renderEdicao(p.props.linhas.find(l=>l.id===id));return componente.type(componente.props);}};
}
function mudarCelula(e,id,campo,valor) {
  one(tabela(e).linha(id),n=>n.props?.['aria-label']===`${campo} ${id}`).props.onChange({target:{value:valor}});
}
const salvarLinha=(e,id='F01')=>one(tabela(e).linha(id),n=>n.type==='form').props.onSubmit({preventDefault(){}});
const cancelarLinha=(e,id='F01')=>one(tabela(e).linha(id),n=>n.type==='button'&&n.props.children==='Cancelar').props.onClick();
const fecharPopup=e=>one(e.render(),n=>typeof n.props?.aoFechar==='function'&&typeof n.props?.titulo==='string').props.aoFechar();

test('Editar libera células; gravação e cancelamento são por linha e preservam as demais',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();clicar(e,'Editar');
  assert.equal(typeof painel(e).props.renderEdicao,'function');
  assert.equal(nodes(tabela(e).linha(),n=>['input','select','textarea'].includes(n.type)).length,6);
  assert.equal(nodes(tabela(e).linha(),n=>n.props?.['aria-label']==='Função F01').length,0);
  mudarCelula(e,'F01','Observação','Rascunho A');mudarCelula(e,'F02','Externo','Rascunho B');
  assert.equal(one(e.render(),n=>n.type==='button'&&n.props.children==='Fechar edição').props.disabled,true);
  assert.equal(painel(e).props.filtroBloqueado,true);
  cancelarLinha(e,'F01');
  assert.equal(one(tabela(e).linha('F01'),n=>n.props?.['aria-label']==='Observação F01').props.value,'');
  assert.equal(one(tabela(e).linha('F02'),n=>n.props?.['aria-label']==='Externo F02').props.value,'Rascunho B');
  salvarLinha(e,'F02');
  assert.equal(a.banco.get('org-a:diag-a')[0].funcaoId,'F02');
  assert.equal(a.banco.get('org-a:diag-a')[0].externo,'Rascunho B');
  assert.equal(one(e.render(),n=>n.type==='button'&&n.props.children==='Fechar edição').props.disabled,false);
  clicar(e,'Fechar edição');funcao(e,'F02');
  assert.equal(one(e.render(),n=>n.props?.['data-inova-field']==='F02').props['data-estado-matriz'],'revisada');
});

test('pop-up e tabela compartilham o rascunho; fechar o pop-up mantém alterações visíveis',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();funcao(e);
  preencher(e,'Observação','Rascunho do pop-up');fecharPopup(e);
  assert.equal(nodes(e.render(),n=>n.props?.['data-inova-form']==='matriz').length,0);
  assert.equal(painel(e).props.linhas[0].valores.observacoes,'Rascunho do pop-up');
  clicar(e,'Editar');
  assert.equal(one(tabela(e).linha(),n=>n.props?.['aria-label']==='Observação F01').props.value,'Rascunho do pop-up');
  mudarCelula(e,'F01','Observação','Confirmado na tabela');salvarLinha(e);clicar(e,'Fechar edição');funcao(e);
  assert.equal(a.banco.get('org-a:diag-a')[0].observacoes,'Confirmado na tabela');
  clicar(e,'Editar');assert.equal(one(e.render(),n=>n.type==='textarea'&&n.props.value==='Confirmado na tabela').props.value,'Confirmado na tabela');
});

test('falha de gravação da tabela mantém a linha, permite tentar novamente e não apaga outro rascunho',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();clicar(e,'Editar');
  mudarCelula(e,'F01','Observação','Primeira');mudarCelula(e,'F02','Observação','Segunda');
  a.simularFalha(true);salvarLinha(e);
  assert.match(one(tabela(e).linha(),n=>n.props?.role==='alert').props.children,/Suas alterações continuam visíveis/);
  assert.equal(one(tabela(e).linha(),n=>n.props?.['aria-label']==='Observação F01').props.value,'Primeira');
  assert.equal(a.banco.size,0);
  a.simularFalha(false);salvarLinha(e);
  assert.equal(nodes(tabela(e).linha(),n=>n.props?.role==='alert').length,0);
  assert.equal(one(tabela(e).linha('F02'),n=>n.props?.['aria-label']==='Observação F02').props.value,'Segunda');
});

test('Enter salva por formulário, texto mantém quebras de linha e Escape cancela a linha',()=>{
  const a=ambiente(),e=a.abrir();e.render().props.onManual();clicar(e,'Editar');mudarCelula(e,'F01','Observação','Rascunho');
  let pedidos=0,prevenidos=0;
  const evento=tag=>({key:'Enter',nativeEvent:{isComposing:false},preventDefault(){prevenidos++;},currentTarget:{tagName:tag,form:{requestSubmit(){pedidos++;}}}});
  one(tabela(e).linha(),n=>n.props?.['aria-label']==='Atuação F01').props.onKeyDown(evento('SELECT'));
  assert.equal(pedidos,1);
  const observacao=one(tabela(e).linha(),n=>n.props?.['aria-label']==='Observação F01');
  observacao.props.onKeyDown(evento('TEXTAREA'));assert.equal(pedidos,1);assert.equal(prevenidos,1);
  observacao.props.onKeyDown({key:'Escape',preventDefault(){},stopPropagation(){}});
  assert.equal(one(tabela(e).linha(),n=>n.props?.['aria-label']==='Observação F01').props.value,'');
});

test('tabela exige a mesma conferência de PDF e decisão de ambiguidade do pop-up',()=>{
  const {interpretarTextoMatriz}=load('src/app/diagnostic/importarMatriz.ts',{});
  const dados=interpretarTextoMatriz('F01\nAtuação: Executa\nAtuação: Viabiliza\nExperiência: Inicial');
  const importacao={id:'importacao-1',dados,origem:{nomeArquivo:'origem.pdf'},pendentes:['F01'],estado:'pendente'};
  const a=ambiente(importacao),e=a.abrir();fecharPopup(e);clicar(e,'Editar');
  one(tabela(e).linha(),n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});
  salvarLinha(e);assert.equal(a.gravacoes.length,0);assert.ok(one(tabela(e).linha(),n=>n.props?.role==='alert'));
  mudarCelula(e,'F01','Atuação','Executa');
  one(tabela(e).linha(),n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});
  salvarLinha(e);assert.equal(a.gravacoes.length,1);assert.equal(a.gravacoes[0].importacao.id,'importacao-1');
  assert.equal(a.gravacoes[0].importacao.decisoes.atuacao,'corrigido');
});

test('perfil de consulta não oferece edição em tabela nem no pop-up',()=>{
  const a=ambiente(),e=a.abrir('org-a','diag-a',true);
  assert.equal(painel(e).props.renderEdicao,undefined);
  assert.equal(nodes(e.render(),n=>n.type==='button'&&n.props.children==='Editar').length,0);
  funcao(e);assert.equal(nodes(e.render(),n=>n.type==='form').length,0);
  assert.equal(nodes(e.render(),n=>n.type==='button'&&n.props.children==='Editar').length,0);
  assert.equal(a.gravacoes.length,0);
});

test('concluir a importação não remonta a Matriz nem apaga rascunhos de outras linhas',()=>{
  const {interpretarTextoMatriz}=load('src/app/diagnostic/importarMatriz.ts',{});
  const dados=interpretarTextoMatriz('F01\nAtuação: Executa\nExperiência: Inicial\nCriticidade atual: 3\nInteresse em desenvolvimento: 4');
  const importacao={id:'i1',dados,origem:{nomeArquivo:'origem.pdf'},pendentes:['F01'],estado:'pendente'};
  const a=ambiente(importacao),e=a.abrir();fecharPopup(e);clicar(e,'Editar');
  mudarCelula(e,'F02','Observação','Rascunho de outra função');
  one(tabela(e).linha(),n=>n.type==='input'&&n.props.type==='checkbox').props.onChange({target:{checked:true}});salvarLinha(e);
  assert.equal(a.banco.get('org-a:diag-a')[0].funcaoId,'F01');
  a.atualizarImportacao({...importacao,pendentes:[]});assert.equal(e.chaveAtual(),e.key);
  a.atualizarImportacao(null);assert.equal(e.chaveAtual(),e.key);
  assert.equal(one(tabela(e).linha('F02'),n=>n.props?.['aria-label']==='Observação F02').props.value,'Rascunho de outra função');
});
