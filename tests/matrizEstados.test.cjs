const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={},cache=new Map()){
  file=path.resolve(file);if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';if(cache.has(file))return cache.get(file).exports;
  const m={exports:{}};cache.set(file,m);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(r=>r in mocks?mocks[r]:r.startsWith('.')?load(path.resolve(path.dirname(file),r),mocks,cache):require(r),m,m.exports);return m.exports;
}
const {estadoFuncaoMatriz:estado,ESTADOS_MATRIZ}=load('src/app/diagnostic/estadoMatriz.ts');
const {interpretarTextoMatriz:parse}=load('src/app/diagnostic/importarMatriz.ts');
const completo=parse('F01\nAtuação: Executa\nExperiência: Inicial\nCriticidade atual: 3\nInteresse em desenvolvimento: 4\nObservação: Relato importado\nExterno: Parceiro importado');
const importar=r=>({salva:false,importada:r.respostas.F01,conferencia:r.conferencia.F01});
test('os cinco estados do slide são distintos; importação reconhecida não está revisada nem salva',()=>{
  assert.deepEqual(ESTADOS_MATRIZ.map(e=>e.rotulo),['Vazia','Em edição','Pré-preenchida','Com pendências','Revisada']);
  assert.equal(estado({salva:false}),'vazia');assert.equal(estado({salva:false,editando:true}),'em_edicao');assert.equal(estado(importar(completo)),'pre_preenchida');
  assert.equal(estado({...importar(completo),edicao:{valores:completo.respostas.F01,decisoes:{},confirmado:true}}),'revisada');
  assert.equal(estado({salva:true}),'revisada');
});
test('revisão não encobre ambiguidades sem decisão, e campos ausentes precisam de conferência',()=>{
  const r=parse('F01\nAtuação: Executa\nAtuação: Viabiliza\nExperiência: Inicial'),valores=r.respostas.F01;
  assert.equal(estado(importar(r)),'com_pendencias');
  assert.equal(estado({...importar(r),edicao:{valores,decisoes:{},confirmado:true}}),'com_pendencias');
  assert.equal(estado({...importar(r),edicao:{valores:{...valores,atuacao:'Executa'},decisoes:{atuacao:'corrigido'},confirmado:true}}),'revisada');
  assert.equal(estado({...importar(r),edicao:{valores,decisoes:{atuacao:'nao_identificado'},confirmado:true}}),'revisada');
  const parcial=parse('F01\nAtuação: Executa');assert.equal(estado(importar(parcial)),'com_pendencias');
});
test('consulta não apresenta rascunho local como revisado e mostra valores importados sem permitir edição',()=>{
  assert.equal(estado({...importar(completo),readOnly:true,edicao:{valores:completo.respostas.F01,decisoes:{},confirmado:true}}),'pre_preenchida');
  const importacao={id:'i1',dados:completo,origem:{nomeArquivo:'origem.pdf',sha256:'a'.repeat(64),tamanho:300},pendentes:['F01'],estado:'pendente'};
  const mocks={'../../diagnosticos.server':{},'@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='matriz-importacao'?importacao:[]}),useQueryClient:()=>({}),useMutation:()=>({isPending:false})}};
  const {MatrizFuncionalTab}=load('src/app/components/diagnostic/MatrizPrototipoTab.tsx',mocks);
  const html=renderToStaticMarkup(React.createElement(MatrizFuncionalTab,{organizacaoId:'org-a',diagnosticoId:'d1',readOnly:true}));
  assert.match(html,/Relato importado/);assert.match(html,/Parceiro importado/);assert.match(html,/Somente leitura/);assert.match(html,/ainda não confirmados/);
  assert.doesNotMatch(html,/<input|<select|<textarea|>Editar<|Confirmar e salvar|Descartar respostas/);
  assert.equal([...html.matchAll(/data-inova-form="matriz"/g)].length,21);
});
