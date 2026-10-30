const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
function load(file,mocks={},cache=new Map()){
 file=path.resolve(file);if(!path.extname(file))file+=fs.existsSync(file+'.tsx')?'.tsx':'.ts';if(cache.has(file))return cache.get(file).exports;
 const m={exports:{}};cache.set(file,m);const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',code)(r=>r in mocks?mocks[r]:r.startsWith('.')?load(path.resolve(path.dirname(file),r),mocks,cache):require(r),m,m.exports);return m.exports;
}
const catalogo=load('src/app/diagnostic/catalog/cadernoCria.ts');
const {valoresVazios,validarRespostaCaderno:validar}=load('src/app/diagnostic/cadernoCria.ts');
const uuid='00000000-0000-0000-0000-000000000011';

test('IEO atual cobre Q01–Q25 uma vez e ignora opções sem nota e contextos de operação',()=>{
 const {DIMENSOES_IEO_CADERNO:dimensoes,calcularIeoCaderno:calcular}=load('src/app/diagnostic/ieoCaderno.ts');
 const codigos=dimensoes.flatMap(d=>d.codigos);
 assert.equal(new Set(codigos).size,25);assert.equal(codigos.length,25);
 assert.deepEqual([...codigos].sort(),catalogo.QUESTIONARIO_CADERNO.map(q=>q.codigo).sort());
 const r=(codigo,valor,contexto='')=>({codigo,contexto,resposta:{...valoresVazios(),valor}});
 const resultado=calcular([r('Q01','4'),r('Q03','2'),r('Q02','1'),r('Q06','NS'),r('Q07','NC'),r('Q08','NA'),r('Q25','D'),r('Q11','4','OP01'),r('1.1.1','4')]);
 assert.equal(resultado.geral,2);assert.equal(resultado.respondidas,7);assert.equal(resultado.pontuadas,3);
 assert.equal(resultado.porDimensao[0].media,3);assert.equal(resultado.porDimensao[2].media,null);
 assert.equal(calcular([]).geral,null);
});

test('visualização atual mantém dimensões, termômetros, relatos e perguntas novas na consulta',()=>{
 const registro={codigo:'Q01',contexto:'',resposta:{...valoresVazios(),valor:'3',relato:'Decisões acompanhadas'},versao:1};
 const mocks={'./IeoTab':{IeoTab:()=>null},'../../caderno.server':{},'@tanstack/react-query':{useQuery:()=>({data:[registro]}),useMutation:()=>({}),useQueryClient:()=>({})}};
 const {QuestionarioCaderno}=load('src/app/components/diagnostic/QuestionarioCaderno.tsx',mocks);
 const html=renderToStaticMarkup(React.createElement(QuestionarioCaderno,{diagnosticoId:'d1',organizacaoId:'o1',readOnly:true}));
 assert.match(html,/Índice de Estruturação Organizacional/);assert.match(html,/Todas as dimensões/);
 assert.match(html,/diagnostico-termometro/);assert.match(html,/3,0/);assert.match(html,/Decisões acompanhadas/);
 assert.equal((html.match(/data-caderno-codigo="Q\d\d"/g)||[]).length,25);
 assert.doesNotMatch(html,/<input|<textarea|Salvar resposta/);
});

test('PDF usa as mesmas notas do IEO atual mesmo com respostas antigas presentes',()=>{
 const {buildDiagnosticoReportModel}=load('src/app/lib/diagnosticReportExport.ts');
 const d={diagnostico:{dataAplicacao:'2026-10-22',versao:1},comunidade:{nome:'Organização',code:'ORG',classificacao:''},matriz:[],ieo:[{perguntaId:'1.1.1',nivel:1}],produtos:[],caderno:[{codigo:'Q01',contexto:'',resposta:{...valoresVazios(),valor:'4',relato:'Relato atual'}},{codigo:'Q03',contexto:'',resposta:{...valoresVazios(),valor:'NS'}}]};
 const r=buildDiagnosticoReportModel('Mapeamento',[d],['ieo']).entries[0].ieo;
 assert.equal(r.instrumento,'caderno');assert.equal(r.geral,4);assert.equal(r.perguntas.length,2);
 assert.match(r.perguntas[0].pergunta,/Q01/);assert.equal(r.perguntas[0].observacao,'Relato atual');
 assert.equal(r.perguntas[1].nivel,'NS');assert.match(r.perguntas[1].descricaoNivel,/Não sabe/);
});

test('entrada antiga da Matriz abre o instrumento sem consultar nem incluir avaliações do Caderno',()=>{
 const props={organizacaoId:'org-a',diagnosticoId:'d1',readOnly:false};
 let recebidas;
 const {MatrizCadernoTab}=load('src/app/components/diagnostic/MatrizCadernoTab.tsx',{
  './MatrizFuncionalTab':{MatrizFuncionalTab:p=>{recebidas=p;return React.createElement('p',null,'Matriz independente');}},
  './CadernoItens':{useCaderno(){throw Error('A Matriz não deve consultar o Caderno');}},
 });
 const html=renderToStaticMarkup(React.createElement(MatrizCadernoTab,props));
 assert.equal(html,'<p>Matriz independente</p>');assert.deepEqual(recebidas,props);
});
test('caderno contém os 25 códigos Q, públicos e escalas transcritos da revisão 22/10/2026',()=>{
 const q=catalogo.QUESTIONARIO_CADERNO;
 assert.equal(q.length,25);assert.equal(new Set(q.map(i=>i.codigo)).size,25);
 assert.deepEqual([...q.map(i=>i.codigo)].sort(),Array.from({length:25},(_,i)=>`Q${String(i+1).padStart(2,'0')}`));
 assert.deepEqual([...new Set(q.map(i=>i.grupo))],['Presidente','Diretoria','Tesoureiro / responsável financeiro','Sócios/cooperados']);
 assert.equal(q[0].texto,'Como funcionam as decisões coletivas e o acompanhamento do que foi decidido?');
 for(const i of q){assert.deepEqual(i.opcoes.map(o=>o.valor),['1','2','3','4','NS','NC','NA','D']);assert.ok(i.pagina>=14&&i.pagina<=26);assert.ok(i.aprofundar);}
});
test('Cesta possui CP01–CP19, C01–C12 e IM01–IM07; implantação não usa escalas numéricas',()=>{
 assert.deepEqual(catalogo.PERFIL_CESTA.map(i=>i.codigo),Array.from({length:19},(_,i)=>`CP${String(i+1).padStart(2,'0')}`));
 assert.equal(catalogo.AVALIACOES_OPERACAO.length,12);assert.equal(catalogo.IMPLANTACAO_CADERNO.length,7);
 assert.equal(catalogo.AVALIACOES_OPERACAO[0].opcoes.at(-1).valor,'H');
 for(const i of catalogo.IMPLANTACAO_CADERNO){assert.ok(i.opcoes.every(o=>!/^\d$/.test(o.valor)));assert.throws(()=>validar(i.codigo,'OP01',{...valoresVazios(),valor:'1'}),/opção/);}
 assert.equal(catalogo.FUNCOES_GUIA_CRIA.length,21);
 assert.equal(catalogo.EVIDENCIAS_CADERNO.length,8);
 assert.equal(catalogo.IDENTIFICACAO_CADERNO.length,3);
});
test('N/A, divergência e heterogeneidade exigem relato; NS/NC não viram nota zero',()=>{
 for(const valor of ['NA','D'])assert.throws(()=>validar('Q01','',{...valoresVazios(),valor}),/justificativa/);
 for(const valor of ['NS','NC',null])assert.doesNotThrow(()=>validar('Q01','',{...valoresVazios(),valor}));
 assert.throws(()=>validar('C01',uuid,{...valoresVazios(),valor:'H'}),/diferenças/);
 assert.doesNotThrow(()=>validar('C01',uuid,{...valoresVazios(),valor:'H',relato:'Os grupos têm experiências diferentes.'}));
 assert.throws(()=>validar('Q01','',{...valoresVazios(),valor:'5'}),/opção/);
 assert.throws(()=>validar('Q01','',{...valoresVazios(),valor:'H',relato:'Diferenças'}),/opção/);
});
test('avaliação da Matriz é independente da experiência, com NA e não avaliado próprios',()=>{
 const {leituraMatriz}=load('src/app/diagnostic/catalog/matrizPrototipo.ts');
 assert.equal(leituraMatriz('4','Recorrente'),'Acompanhar');
 assert.doesNotThrow(()=>validar('F01','',{...valoresVazios(),valor:'1',relato:'Recorrente mas não atende à necessidade.'}));
 assert.deepEqual(catalogo.AVALIACAO_MATRIZ_CADERNO[0].opcoes.map(o=>o.valor),['1','2','3','4','NA','NC']);
});
test('contextos são organização/aplicação, produto UUID ou operação OP, sem cruzamento indevido',()=>{
 assert.throws(()=>validar('Q01',uuid,valoresVazios()),/Contexto/);
 assert.throws(()=>validar('CP01','OP01',valoresVazios()),/Contexto/);
 assert.throws(()=>validar('IM01',uuid,valoresVazios()),/Contexto/);
 assert.doesNotThrow(()=>validar('IM01','OP01',{...valoresVazios(),valor:'Disponível'}));
 assert.throws(()=>validar('PR_OPERACAO',uuid,{...valoresVazios(),valor:'PR01'}),/OP01/);
 assert.throws(()=>validar('CP08',uuid,{...valoresVazios(),selecoes:['Insumos','Insumos']}),/Seleções/);
 assert.doesNotThrow(()=>validar('CP08',uuid,{...valoresVazios(),selecoes:['Energia','Água']}));
});
test('consulta do caderno não oferece formulários nem salvamento e mantém relatos e fontes',()=>{
 const registro={codigo:'Q01',contexto:'',resposta:{...valoresVazios(),valor:'NS',relato:'Relato original',fonte:'Fonte conferida'},versao:1,atualizado_em:'2026-10-22T12:00:00Z'};
 const mocks={'../../caderno.server':{},'@tanstack/react-query':{useQuery:()=>({data:[registro]}),useMutation:()=>({}),useQueryClient:()=>({})}};
 const {CadernoItens}=load('src/app/components/diagnostic/CadernoItens.tsx',mocks);
 const html=renderToStaticMarkup(React.createElement(CadernoItens,{diagnosticoId:'d1',organizacaoId:'o1',readOnly:true,itens:catalogo.QUESTIONARIO_CADERNO.slice(0,1)}));
 assert.match(html,/Não sabe informar/);assert.match(html,/Relato original/);assert.match(html,/Fonte conferida/);assert.doesNotMatch(html,/<input|<textarea|Salvar resposta/);
});
test('relatório inclui códigos, justificativas e contextos do caderno sem converter notas legadas',()=>{
 const {buildDiagnosticoReportModel}=load('src/app/lib/diagnosticReportExport.ts');
 const d={diagnostico:{dataAplicacao:'2026-10-22',versao:1},comunidade:{nome:'Organização',code:'ORG',classificacao:''},matriz:[],ieo:[],produtos:[{id:uuid,nome:'Mel',cadeia:null,respostas:{}}],parecer:{respostasComplementares:{},evidenciasVinculadas:[]},caderno:[{codigo:'C01',contexto:uuid,resposta:{...valoresVazios(),valor:'NA',relato:'Não pertinente à operação',fonte:'Entrevista'}}]};
 const r=buildDiagnosticoReportModel('Mapeamento',[d],['identificacao','ieo','cesta']).entries[0];
 assert.equal(r.caderno[0].contexto,'Mel');assert.match(r.caderno[0].resposta,/Não se aplica/);assert.equal(r.caderno[0].relato,'Não pertinente à operação');assert.equal(r.ieo.geral,null);
});
