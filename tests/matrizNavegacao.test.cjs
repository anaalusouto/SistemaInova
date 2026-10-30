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
test('mapeamento atual respeita organização, aplicação e versão, sem confundir edição recente com versão atual',()=>{
  const lista=[diag('v1',1,{atualizadoEm:'2030-01-01'}),diag('externo',99,{comunidadeId:'org-b'}),diag('antigo',10,{dataAplicacao:'2026-09-01'}),diag('v2',2)];
  const antes=structuredClone(lista);
  assert.equal(helper.diagnosticoAtual(lista,'org-a').id,'v2');assert.deepEqual(lista,antes);
  assert.equal(helper.diagnosticoAtual(lista,'org-c'),null);
  assert.equal(helper.diagnosticoAtual([...lista].reverse(),'org-a').id,'v2');
});
function ambiente({data=[diag('v2',2),diag('v1',1)],isLoading=false,error=null,busca={area:'diagnostics'}}={}){
  const entradas=[busca];let indice=0;
  const VisaoGeral=()=>null, Historico=()=>null, Editor=()=>null;
  const api=carregar('src/app/components/DiagnosticoModule.tsx',{
    react:React,
    '@tanstack/react-router':{useSearch:()=>entradas[indice],useCanGoBack:()=>indice>0,useRouter:()=>({history:{back(){indice--;}}}),useNavigate:()=>({search,replace})=>{const nova=typeof search==='function'?search(entradas[indice]):search;if(replace)entradas[indice]=nova;else{entradas.splice(++indice);entradas.push(nova);}}},
    '@tanstack/react-query':{useQuery:()=>({data,isLoading,error,refetch(){}})},
    '../diagnosticos.server':{},'../diagnostic/navegacaoDiagnostico':helper,
    './DiagnosticoVisaoGeral':{DiagnosticoVisaoGeral:VisaoGeral},'./DiagnosticoOrganizacao':{DiagnosticoOrganizacao:Historico},'./DiagnosticoEditor':{DiagnosticoEditor:Editor},
  });
  return {...api,VisaoGeral,Historico,Editor};
}
test('Visão Geral abre versões; escolher uma versão abre seu Resumo e voltar retorna às versões',()=>{
  const a=ambiente();const render=()=>a.DiagnosticoModule({});
  let tela=render();assert.equal(tela.type,a.VisaoGeral);tela.props.onSelectOrganizacao('org-a');
  tela=render();assert.equal(tela.type,a.Historico);assert.equal(tela.props.comunidadeId,'org-a');
  tela.props.onSelectDiagnostico('v1');let editor=render();assert.equal(editor.type,a.Editor);assert.equal(editor.props.diagnosticoId,'v1');assert.equal(editor.props.instrumentoInicial,'resumo');
  editor.props.onBack();assert.equal(render().type,a.Historico);assert.equal(render().props.comunidadeId,'org-a');
  render().props.onBack();assert.equal(render().type,a.VisaoGeral);
});
test('entrada na organização sempre começa nas versões, inclusive ao retornar ao Mapeamento',()=>{
  for(const instrumentoInicial of ['resumo','matriz']){
    const a=ambiente();const tela=a.DiagnosticoModule({comunidadeId:'org-a',instrumentoInicial});
    assert.equal(tela.type,a.Historico);assert.equal(tela.props.incorporado,true);
    tela.props.onSelectDiagnostico('v2');const editor=a.DiagnosticoModule({comunidadeId:'org-a',instrumentoInicial});assert.equal(editor.type,a.Editor);
    editor.props.onBack();assert.equal(a.DiagnosticoModule({comunidadeId:'org-a',instrumentoInicial}).type,a.Historico);
    const novaEntrada=ambiente();assert.equal(novaEntrada.DiagnosticoModule({comunidadeId:'org-a',instrumentoInicial}).type,novaEntrada.Historico);
  }
});
test('acesso separado a Parecer mantém seu instrumento atual',()=>{
  const a=ambiente(),tela=a.DiagnosticoModule({comunidadeId:'org-a',instrumentoInicial:'parecer'});
  const editor=a.EntradaDiagnosticoAtual(tela.props);assert.equal(editor.type,a.Editor);assert.equal(editor.props.instrumentoInicial,'parecer');
});

test('página de versões identifica todas as versões, inclusive a primeira',()=>{
  const {renderToStaticMarkup}=require('react-dom/server');
  const {DiagnosticoOrganizacao}=carregar('src/app/components/DiagnosticoOrganizacao.tsx',{
    './responsive-tables.css':{},'@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='comunidades'?[{id:'org-a',nome:'Organização A'}]:[diag('v2',2),diag('v1',1)]}),useMutation:()=>({}),useQueryClient:()=>({})},
    '../comunidades.server':{},'../diagnosticos.server':{},'../audit/auditStore':{useAudit:()=>({log(){}})},'../auth/authStore':{useAuth:()=>({readOnly:true})},'../lib/dateOnly':{formatDateOnly:d=>d},'./BotaoNovo':{BotaoNovo:()=>null},
    './diagnostic/ExcluirDiagnosticoButton':{ExcluirDiagnosticoButton:()=>null},
  });
  const html=renderToStaticMarkup(React.createElement(DiagnosticoOrganizacao,{comunidadeId:'org-a',incorporado:true,onBack(){},onSelectDiagnostico(){}}));
  assert.match(html,/Versões do mapeamento/);assert.match(html,/Versão 1/);assert.match(html,/Versão 2/);assert.equal([...html.matchAll(/>\s*Visualizar\s*</g)].length,2);
});

test('voltar no editor restaura o instrumento anterior e depois a lista de versões',()=>{
  const a=ambiente();const render=()=>a.DiagnosticoModule({});
  render().props.onSelectOrganizacao('org-a');render().props.onSelectDiagnostico('v1');
  render().props.onMudarInstrumento('matriz');assert.equal(render().props.instrumentoAtual,'matriz');
  render().props.onMudarInstrumento('ieo');assert.equal(render().props.instrumentoAtual,'ieo');
  render().props.onBack();assert.equal(render().props.instrumentoAtual,'matriz');
  render().props.onBack();assert.equal(render().props.instrumentoAtual,'resumo');
  render().props.onBack();assert.equal(render().type,a.Historico);
});

test('link direto e exclusão têm retorno interno, sem abrir aplicação arbitrária',()=>{
  const a=ambiente({busca:{area:'organizations',org:'org-a',secao:'mapeamento',visaoDiagnostico:'editor',diagnostico:'v1',instrumento:'ieo'}});
  const render=()=>a.DiagnosticoModule({comunidadeId:'org-a'});
  assert.equal(render().props.diagnosticoId,'v1');assert.equal(render().props.instrumentoAtual,'ieo');
  render().props.onBack();assert.equal(render().type,a.Historico);
  render().props.onSelectDiagnostico('v2');render().props.onExcluido();assert.equal(render().type,a.Historico);
});

test('entrada sem mapeamento oferece histórico/criação, enquanto carregamento e erro não abrem registro arbitrário',()=>{
  for(const [op,tipo] of [[{data:[]},'historico'],[{isLoading:true},'status'],[{error:new Error('Falha')},'alert']]){
    const a=ambiente(op);const entrada=a.EntradaDiagnosticoAtual({comunidadeId:'org-a',incorporado:false,instrumentoInicial:'resumo',onBack(){},onHistorico(){},onNovaVersao(){}});
    if(tipo==='historico')assert.equal(entrada.type,a.Historico);else assert.equal(entrada.props.role,tipo);
  }
});
