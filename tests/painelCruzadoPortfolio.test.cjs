const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

test('painel distingue dados ausentes de zero e reúne sinais reais sem vínculos inventados', () => {
  const dimensoes = Array.from({length: 5}, (_, i) => ({id: String(i + 1), titulo: `Dimensão ${i + 1}`}));
  const dados = [
    {org:{id:'a',nome:'Associação A'},atual:{status:'em_edicao',versao:1,dataAplicacao:'2026-01-01'},erro:null,falhaIeo:false,falhaMatriz:false,
      sinais:{aguardando:false,criticas:1,matrizAvaliadas:1,funcoes:[{id:'F01',nome:'Função A',leitura:'Lacuna crítica'}],dimensoes:[{dimensaoId:'1',media:2,pontuadas:1,total:5,dimensaoTitulo:'Dimensão 1'}],ieo:{geral:2,respondidas:1,total:25,pontuadas:1,ausentes:24,semNota:0,invalidas:0,porDimensao:[{dimensaoId:'1',media:2,pontuadas:1,total:5}]}}},
    {org:{id:'b',nome:'Associação B'},atual:null,sinais:null,erro:null,falhaIeo:false,falhaMatriz:false},
  ];
  const mocks = {
    '@tanstack/react-query': {useQuery:()=>({data:dados})},
    '../../diagnosticos.server': {}, '../../caderno.server': {}, '../../diagnostic/navegacaoDiagnostico': {},
    '../../diagnostic/catalog/matrizPrototipo': {FUNCOES_MATRIZ:[{id:'F01',nome:'Função A'}]},
    '../../diagnostic/ieoCaderno': {DIMENSOES_IEO_CADERNO:dimensoes}, '../../lib/prioridadesCruzadas': {},
    '../../lib/dateOnly': {formatDateOnly:x=>x},
  };
  const code=ts.transpileModule(fs.readFileSync('src/app/components/portfolio/PrioridadesCruzadas.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)(r=>r in mocks?mocks[r]:require(r),mod,mod.exports);
  const projects=[{id:1,organizacao:{id:'a',nome:'Associação A'}},{id:2,organizacao:{id:'b',nome:'Associação B'}}];
  const html=renderToStaticMarkup(React.createElement(mod.exports.PrioridadesCruzadas,{projects,demonstrativo:false}));
  assert.match(html,/Associação A/); assert.match(html,/Associação B/);
  assert.match(html,/1 com nota calculável/); assert.match(html,/1 matrizes com leitura calculável/);
  assert.match(html,/F01 · Função A/); assert.match(html,/sem associar funções a dimensões/);
  assert.match(html,/Sem aplicação encontrada/); assert.match(html,/2,0/);
});
