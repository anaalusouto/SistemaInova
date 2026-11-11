const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function carregar(arquivo, mocks = {}, cache = new Map()) {
  arquivo = path.resolve(arquivo);if(arquivo.endsWith('.css'))return {};
  if (!path.extname(arquivo)) arquivo += fs.existsSync(arquivo + '.tsx') ? '.tsx' : '.ts';
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const m = { exports: {} }; cache.set(arquivo, m);
  const code = ts.transpileModule(fs.readFileSync(arquivo, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'module', 'exports', code)(r => r in mocks ? mocks[r] : r.startsWith('.') ? carregar(path.resolve(path.dirname(arquivo), r), mocks, cache) : require(r), m, m.exports);
  return m.exports;
}
function elementos(no) {
  if (!no || typeof no !== 'object') return [];
  return [no, ...React.Children.toArray(no.props?.children).flatMap(elementos)];
}
function painel() {
  let filtro = 'Todos';
  const { FUNCOES_MATRIZ } = carregar('src/app/diagnostic/catalog/matrizPrototipo.ts');
  const { PainelMatriz } = carregar('src/app/components/diagnostic/PainelMatriz.tsx', { '../plano/useLargurasTabela': {useLargurasTabela:()=>({tabelaRef:null,larguras:null,controles:()=>({}),restaurar(){}})}, react: { ...React, useState: () => [filtro, valor => { filtro = valor; }] } });
  const linhas = FUNCOES_MATRIZ.map(f => ({ id: f.id, estado: 'Revisada', valores: { nomeFuncao: f.nome, atuacao: null, experiencia: 'Inicial', criticidade: f.id === 'F01' ? null : '4', interesse: '4', observacoes: null, externo: null } }));
  let selecionada;
  return { render: () => PainelMatriz({ linhas, desabilitado: false, onSelecionar: id => { selecionada = id; } }), selecionada: () => selecionada };
}
test('produtos sem situação permanecem acessíveis para concluir cadastro', () => {
  const produto = { id:'p1', nome:'Produto recém-criado', respostas:{}, categoriaId:null, safra:{estado:'nao_informada',intervalos:[]} };
  const { CestaCaderno } = carregar('src/app/components/diagnostic/CestaCaderno.tsx', {
    react:{...React,useState: inicial=>[typeof inicial==='function'?inicial():inicial,()=>{}]},
    '@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='diagnostico-produtos'?[produto]:[]}),useMutation:()=>({}),useQueryClient:()=>({})},
    '../../diagnosticos.server':{}, './CadernoItens':{useCaderno:()=>({data:[]}),CadernoItens:()=>null},
    './DadosComerciaisCesta':{DadosComerciaisCesta:()=>null}, '../PendenciasModulo':{usePendenciaModulo(){},navegarSemPendencias:(_,fn)=>fn()},
  });
  const html=renderToStaticMarkup(CestaCaderno({diagnosticoId:'d1',organizacaoId:'o1',readOnly:false}));
  assert.match(html,/Produtos aguardando situação/);
  assert.match(html,/Produto recém-criado/);
});
test('produto recém-cadastrado abre a ficha mesmo sem situação definida', async () => {
  const novo={id:'p1',nome:'Produto novo',respostas:{},categoriaId:null,safra:{estado:'nao_informada',intervalos:[]}};
  let produtos=[],pendente,cursor=0;const estados=[];
  const react={...React,useState:inicial=>{const i=cursor++;if(!(i in estados))estados[i]=typeof inicial==='function'?inicial():inicial;return [estados[i],v=>{estados[i]=typeof v==='function'?v(estados[i]):v;}];}};
  const client={setQueryData:(_key,atualizar)=>{produtos=atualizar(produtos);},invalidateQueries(){}};
  const {CestaCaderno}=carregar('src/app/components/diagnostic/CestaCaderno.tsx',{
    react,'@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='diagnostico-produtos'?produtos:[]}),useMutation:op=>({mutate:()=>{pendente=op.mutationFn().then(p=>op.onSuccess(p));}}),useQueryClient:()=>client},
    '../../diagnosticos.server':{criarProduto:async()=>novo},'./CadernoItens':{useCaderno:()=>({data:[]}),CadernoItens:()=>null},
    './DadosComerciaisCesta':{DadosComerciaisCesta:()=>null},'../PendenciasModulo':{usePendenciaModulo(){},navegarSemPendencias:(_,fn)=>fn()},
  });
  const render=()=>{cursor=0;return CestaCaderno({diagnosticoId:'d1',organizacaoId:'o1',readOnly:false});};
  let nos=elementos(render());
  nos.find(n=>n.props?.['aria-label']==='Novo produto ou serviço').props.onChange({target:{value:'Produto novo'}});
  nos=elementos(render());
  const form=nos.find(n=>n.type==='form'&&elementos(n).some(x=>x.props?.['aria-label']==='Novo produto ou serviço'));
  form.props.onSubmit({preventDefault(){}});await pendente;
  const html=renderToStaticMarkup(render());
  assert.match(html,/Ficha Produto novo/);assert.match(html,/Produtos aguardando situação/);
});
test('editor de avaliação produtiva usa o identificador do produto, aceito pelo caderno', () => {
  const id='00000000-0000-0000-0000-000000000011';
  const produto={id,nome:'Mel',statusPreenchimento:'em_andamento',respostas:{}};
  const {EditorInformacoesDiagnostico}=carregar('src/app/components/diagnostic/EditorInformacoesDiagnostico.tsx',{
    react:{...React,useState:i=>[typeof i==='function'?i():i,()=>{}],useEffect(){},useMemo:f=>f(),useRef:i=>({current:i})},
    '@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='diagnostico-produtos'?[produto]:undefined}),useQueryClient:()=>({})},
    '../../diagnosticos.server':{}, './CadernoItens':{useCaderno:()=>({data:[]}),CadernoItens:()=>null},
    './MatrizFuncionalTab':{MatrizFuncionalTab:()=>null},'./CestaCaderno':{CestaCaderno:()=>null},'./ParecerTecnicoTab':{ParecerTecnicoTab:()=>null},
  });
  const arvore=EditorInformacoesDiagnostico({diagnostico:{id:'d1'},diagnosticoId:'d1',organizacaoId:'o1',readOnly:false,secaoInicial:'Avaliação produtiva',haPendencias:false,aoFechar(){},aoGerenciarEvidencias(){}});
  const item=elementos(arvore).find(n=>n.props?.itens?.[0]?.codigo==='C01');
  assert.equal(item.props.contexto,id);
  const {validarRespostaCaderno,valoresVazios}=carregar('src/app/diagnostic/cadernoCria.ts');
  assert.doesNotThrow(()=>validarRespostaCaderno('C01',id,{...valoresVazios(),valor:'2'}));
  assert.throws(()=>validarRespostaCaderno('C01','OP01',{...valoresVazios(),valor:'2'}),/Contexto/);
});
test('questão selecionada do IEO abre diretamente para avaliação', () => {
  const {EditorInformacoesDiagnostico}=carregar('src/app/components/diagnostic/EditorInformacoesDiagnostico.tsx',{
    react:{...React,useState:i=>[typeof i==='function'?i():i,()=>{}],useEffect(){},useMemo:f=>f(),useRef:i=>({current:i})},
    '@tanstack/react-query':{useQuery:({queryKey})=>({data:queryKey[0]==='diagnostico-produtos'?[]:undefined}),useQueryClient:()=>({})},
    '../../diagnosticos.server':{},'./CadernoItens':{useCaderno:()=>({data:[]}),CadernoItens:()=>null},
    './MatrizFuncionalTab':{MatrizFuncionalTab:()=>null},'./CestaCaderno':{CestaCaderno:()=>null},'./ParecerTecnicoTab':{ParecerTecnicoTab:()=>null},
  });
  const arvore=EditorInformacoesDiagnostico({diagnostico:{id:'d1'},diagnosticoId:'d1',organizacaoId:'o1',readOnly:false,secaoInicial:'Questões do IEO',haPendencias:false,aoFechar(){},aoGerenciarEvidencias(){}});
  const item=elementos(arvore).find(n=>n.props?.itens?.[0]?.codigo==='Q01');
  assert.equal(item.props.abertoInicial,true);
});
test('aba de implantação na Cesta mostra as condições e os produtos de interesse futuro da aplicação', () => {
  const produto = (id, nome) => ({ id, nome, respostas: {}, categoriaId: null, safra: { estado: 'nao_informada', intervalos: [] } });
  const produtos = [produto('p1', 'Mel'), produto('p2', 'Polpa'), produto('p3', 'Turismo')];
  const registro = (contexto, codigo, valor, relato = '') => ({ contexto, codigo, resposta: { valor, relato, selecoes: [], fonte: '', respondentes: '' } });
  const registros = [registro('p1','PR_SITUACAO','Funcionamento'), registro('p2','PR_SITUACAO','Implantação'), registro('p3','PR_SITUACAO','Futuro'), registro('p2','PR_CODIGO','PR02'), registro('p2','PR_OPERACAO','OP02'), registro('OP02','IM01','Em andamento','O que existe: Estrutura registrada')];
  let indiceEstado = 0;
  const { CestaCaderno } = carregar('src/app/components/diagnostic/CestaCaderno.tsx', {
    react: { ...React, useState: inicial => [indiceEstado++ === 3 ? 'implantacao' : typeof inicial === 'function' ? inicial() : inicial, () => {}] },
    '@tanstack/react-query': { useQuery: ({queryKey}) => ({ data: queryKey[0] === 'diagnostico-produtos' ? produtos : [] }), useMutation: () => ({}), useQueryClient: () => ({}) },
    '../../diagnosticos.server': {},
    './CadernoItens': { useCaderno: () => ({data: registros}), CadernoItens: () => null },
    './DadosComerciaisCesta': { DadosComerciaisCesta: () => null },
    '../PendenciasModulo': { usePendenciaModulo() {}, navegarSemPendencias: (_, fn) => fn() },
  });
  const html = renderToStaticMarkup(CestaCaderno({ diagnosticoId: 'd1', organizacaoId: 'o1', readOnly: true }));
  assert.match(html, /PR02 · Polpa/);
  assert.match(html, /OP02/);
  for (let i=1;i<=7;i++) assert.match(html, new RegExp(`IM0${i}`));
  assert.match(html, /Estrutura registrada/);
  assert.match(html, /Interesse futuro/);
  assert.match(html, /Turismo/);
  assert.doesNotMatch(html, />Mel</);
});
test('gráfico agrupa funções por leitura e preserva campos ausentes', () => {
  const p = painel(); const html = renderToStaticMarkup(p.render());
  assert.match(html, /Lacuna crítica: 20 funções/);
  assert.match(html, /Completar avaliação: 1 funções/);
  assert.doesNotMatch(html, /Criticidade × Interesse/);
  assert.match(html, /Não informado/);
  assert.match(html, /Lacuna crítica/);
  assert.match(html, /data-label="Avaliação"/);
  assert.doesNotMatch(html, /Como a leitura da Matriz é calculada/);
});
test('filtro de grupo atualiza tabela, contagem e seleção da função', () => {
  const p = painel();
  elementos(p.render()).find(e => e.type === 'button' && e.props.children === 'Mercado').props.onClick();
  const filtrado = p.render(); const html = renderToStaticMarkup(filtrado);
  assert.match(html, /Lacuna crítica: 20 funções/);
  assert.doesNotMatch(html, /Representação e articulação institucional|Sem posição no quadro/);
  elementos(filtrado).find(e => e.type === 'button' && e.props.className === 'diagnostico-funcao' && React.Children.toArray(e.props.children).some(c => c.props?.children === 'F14')).props.onClick();
  assert.equal(p.selecionada(), 'F14');
});
test('IEO apresenta visão geral sem atribuir zero a dimensões ainda não respondidas', () => {
  const { IEO_DIMENSOES } = carregar('src/app/diagnostic/catalog/ieo.ts');
  const perguntaId = IEO_DIMENSOES[0].subdimensoes[0].perguntas[0].id;
  const { IeoTab } = carregar('src/app/components/diagnostic/IeoTab.tsx', {
    '../../diagnosticos.server': {},
    '@tanstack/react-query': { useQuery: () => ({ data: [{ perguntaId, nivel: 3, observacao: 'Relato confirmado' }] }), useMutation: () => ({}), useQueryClient: () => ({}) },
  });
  const html = renderToStaticMarkup(React.createElement(IeoTab, { diagnosticoId: 'd1', readOnly: true }));
  assert.match(html, /Todas as dimensões/); assert.match(html, /3,0/); assert.match(html, /Relato confirmado/);
  assert.match(html, /Sem pontuação/); assert.doesNotMatch(html, /<textarea|>Salvar</);
});
