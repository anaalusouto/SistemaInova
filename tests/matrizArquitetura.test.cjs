const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function ambiente({erro=false,carregando=false}={}) {
  const diag={id:'d1',comunidadeId:'org-a',dataAplicacao:'2026-10-21',versao:1,status:'em_edicao'};
  const query=({queryKey:[key,id]})=>({data:key==='diagnostico'?diag:key==='diagnostico-matriz'?[{funcaoId:'1',observacoes:'Observação da matriz'}]:[{perguntaId:'1.1',observacao:'Observação do IEO'}],error:erro?new Error('Falha'):null,isLoading:carregando,refetch(){}});
  const vazio=()=>null;
  const mocks={react:React,'@tanstack/react-query':{useQuery:query,useMutation:()=>({}),useQueryClient:()=>({})},
    '../comunidades.server':{},'./diagnostic/painel-diagnostico.css':{},'./CadernoItens':{useCaderno:()=>({data:[]})},
    './diagnostic/MatrizCadernoTab':{MatrizCadernoTab:vazio},'./diagnostic/QuestionarioCaderno':{QuestionarioCaderno:vazio},'./diagnostic/CestaCaderno':{CestaCaderno:vazio},'./diagnostic/CadernoItens':{CadernoItens:vazio},
    '../auth/authStore':{useAuth:()=>({readOnly:true})},'../diagnosticos.server':{},'../../diagnosticos.server':{},
    './diagnostic/MatrizFuncionalTab':{MatrizFuncionalTab:vazio},'./diagnostic/IeoTab':{IeoTab:vazio},'./diagnostic/CestaProdutosTab':{CestaProdutosTab:vazio},
    './diagnostic/ParecerTecnicoTab':{ParecerTecnicoTab:()=>React.createElement('p',null,'Parecer separado')},
    './diagnostic/ExcluirDiagnosticoButton':{ExcluirDiagnosticoButton:vazio},
    '../DocumentosRegistro':{DocumentosRegistro:p=>React.createElement('p',null,`Documentos ${p.area} ${p.organizacaoId}`)},
    '../organizacoes/useOrganizacoes':{useFichaOrganizacao:id=>({data:{id,nome:'Organização A',registros:[{id:'r1',data:'2026-10-21',assunto:'Visita',resumo:'Registro existente'}],notas:[{id:'n1',conteudo:'Nota existente'}],projetos:[{id:5,codigo:'P5',nome:'Projeto A'}]},refetch(){}})},
  };
  const cache=new Map();
  function carregar(f){f=path.resolve(f);if(cache.has(f))return cache.get(f).exports;const m={exports:{}};cache.set(f,m);
    const code=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('require','module','exports',code)(r=>{if(mocks[r])return mocks[r];if(!r.startsWith('.'))return require(r);const p=path.resolve(path.dirname(f),r);return carregar(fs.existsSync(p+'.tsx')?p+'.tsx':p+'.ts');},m,m.exports);return m.exports;}
  return carregar('src/app/components/DiagnosticoEditor.tsx').DiagnosticoEditor;
}
const render=(Editor,instrumentoInicial='resumo')=>renderToStaticMarkup(React.createElement(Editor,{diagnosticoId:'d1',instrumentoInicial,onBack(){},onNovaVersao(){}}));
test('painel oferece quatro abas na ordem da referência, sem parecer adicional',()=>{
  const html=render(ambiente());
  const opcoes=[...html.matchAll(/<option[^>]*>([^<]+)<\/option>/g)].map(m=>m[1]);
  assert.deepEqual(opcoes,['Matriz','IEO','Cesta','Resumo']);
  assert.doesNotMatch(html,/Parecer Técnico|Parecer separado/);
  assert.match(html,/<nav class="diagnostico-menu-conteudo"[\s\S]*?<\/nav><div class="diagnostico-conteudo diagnostico-conteudo-com-menu">/);
});
test('parecer legado continua acessível separadamente, sem alterar as quatro abas da matriz',()=>{
  const html=render(ambiente(),'parecer');assert.match(html,/Parecer separado/);assert.doesNotMatch(html,/<select|>Matriz Funcional</);
});
test('resumo reúne informações existentes da organização e do mapeamento sem inventar outro formulário',()=>{
  const html=render(ambiente());for(const texto of ['Documentos mapeamento org-a','Registro existente','Observação da matriz','Observação do IEO','Nota existente','Projeto A'])assert.ok(html.includes(texto));
  assert.match(html,/org=org-a/);assert.doesNotMatch(html,/<textarea|>Salvar</);
});
test('carregamento e erro do mapeamento não mostram resumo vazio como se fosse dado confirmado',()=>{
  for(const [op,esperado] of [[{carregando:true},/Carregando mapeamento/],[{erro:true},/Não foi possível abrir o mapeamento/]])assert.match(render(ambiente(op)),esperado);
});
