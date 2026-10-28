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
