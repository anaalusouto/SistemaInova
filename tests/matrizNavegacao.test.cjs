const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const React=require('react');
function carregar(arquivo,mocks={}) {
  const m={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(arquivo,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(r=>mocks[r]??require(r),m,m.exports);return m.exports;
}
const helper=carregar('src/app/diagnostic/navegacaoDiagnostico.ts');
const diag=(id,versao,extra={})=>({id,versao,comunidadeId:'org-a',dataAplicacao:'2026-10-21',criadoEm:'2026-10-21T12:00:00Z',...extra});
test('diagnóstico atual respeita organização, aplicação e versão, sem confundir edição recente com versão atual',()=>{
  const lista=[diag('v1',1,{atualizadoEm:'2030-01-01'}),diag('externo',99,{comunidadeId:'org-b'}),diag('antigo',10,{dataAplicacao:'2026-09-01'}),diag('v2',2)];
  const antes=structuredClone(lista);
  assert.equal(helper.diagnosticoAtual(lista,'org-a').id,'v2');assert.deepEqual(lista,antes);
  assert.equal(helper.diagnosticoAtual(lista,'org-c'),null);
  assert.equal(helper.diagnosticoAtual([...lista].reverse(),'org-a').id,'v2');
});
function ambiente({data=[diag('v2',2),diag('v1',1)],isLoading=false,error=null}={}){
  let estado;
  const VisaoGeral=()=>null, Historico=()=>null, Editor=()=>null;
  const api=carregar('src/app/components/DiagnosticoModule.tsx',{
    react:{...React,useState(inicial){if(estado===undefined)estado=inicial;return[estado,n=>{estado=n;}];}},
    '@tanstack/react-query':{useQuery:()=>({data,isLoading,error,refetch(){}})},
    '../diagnosticos.server':{},'../diagnostic/navegacaoDiagnostico':helper,
    './DiagnosticoVisaoGeral':{DiagnosticoVisaoGeral:VisaoGeral},'./DiagnosticoOrganizacao':{DiagnosticoOrganizacao:Historico},'./DiagnosticoEditor':{DiagnosticoEditor:Editor},
  });
  return {...api,VisaoGeral,Historico,Editor};
}
test('Visão Geral abre Resumo atual; histórico permite escolher versão antiga; voltar restaura a visão geral',()=>{
  const a=ambiente();const render=()=>a.DiagnosticoModule({});
  let tela=render();assert.equal(tela.type,a.VisaoGeral);tela.props.onSelectOrganizacao('org-a');
  tela=render();let editor=a.EntradaDiagnosticoAtual(tela.props);
  assert.equal(editor.type,a.Editor);assert.equal(editor.props.diagnosticoId,'v2');assert.equal(editor.props.instrumentoInicial,'resumo');
  editor.props.onHistorico();tela=render();assert.equal(tela.type,a.Historico);
  tela.props.onSelectDiagnostico('v1');editor=render();assert.equal(editor.props.diagnosticoId,'v1');assert.equal(editor.props.instrumentoInicial,'resumo');
  editor.props.onBack();assert.equal(render().type,a.VisaoGeral);
});
test('entrada incorporada começa em Resumo e mantém o acesso separado a Parecer',()=>{
  for(const instrumentoInicial of ['matriz','parecer']){
    const a=ambiente();const tela=a.DiagnosticoModule({comunidadeId:'org-a',instrumentoInicial});
    const editor=a.EntradaDiagnosticoAtual(tela.props);assert.equal(editor.props.instrumentoInicial,instrumentoInicial==='parecer'?'parecer':'resumo');
    assert.equal(editor.props.rotuloVoltar,'Histórico da organização');
  }
});
test('entrada sem diagnóstico oferece histórico/criação, enquanto carregamento e erro não abrem registro arbitrário',()=>{
  for(const [op,tipo] of [[{data:[]},'historico'],[{isLoading:true},'status'],[{error:new Error('Falha')},'alert']]){
    const a=ambiente(op);const entrada=a.EntradaDiagnosticoAtual({comunidadeId:'org-a',incorporado:false,instrumentoInicial:'resumo',onBack(){},onHistorico(){},onNovaVersao(){}});
    if(tipo==='historico')assert.equal(entrada.type,a.Historico);else assert.equal(entrada.props.role,tipo);
  }
});
