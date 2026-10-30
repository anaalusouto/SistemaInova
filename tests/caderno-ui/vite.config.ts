import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
export default defineConfig({root:path.resolve('tests/caderno-ui'),resolve:{alias:{'@':path.resolve('src')}},server:{host:'127.0.0.1',port:8096,strictPort:true,fs:{allow:[path.resolve('.')]}},plugins:[{
 name:'caderno-isolado',enforce:'pre',resolveId(source){if(source.endsWith('/caderno.server'))return '\0caderno-api';if(source.endsWith('/diagnosticos.server'))return '\0diagnosticos-api';},
 load(id){
  if(id==='\0caderno-api')return `
  import {validarRespostaCaderno} from '/@fs/${path.resolve('src/app/diagnostic/cadernoCria.ts').replaceAll('\\','/')}';
  const diag='00000000-0000-0000-0000-000000000001',mel='00000000-0000-0000-0000-000000000011',polpa='00000000-0000-0000-0000-000000000012';
  const registro=(codigo,contexto,valor,relato='')=>({diagnostico_id:diag,codigo,contexto,resposta:{valor,selecoes:[],relato,fonte:'Fonte sintética',respondentes:'Equipe de teste'},versao:1,atualizado_em:'2026-10-22T12:00:00Z',atualizado_por:'teste'});
  let linhas=[registro('Q01','','3','Decisões com responsáveis definidos.'),registro('F01','','2','Apoio recorrente com lacunas importantes.'),registro('PR_CODIGO',mel,'PR01'),registro('PR_OPERACAO',mel,'OP01'),registro('PR_SITUACAO',mel,'Funcionamento'),registro('PR_PAPEL',mel,'Executa'),registro('PR_CODIGO',polpa,'PR02'),registro('PR_OPERACAO',polpa,'OP02'),registro('PR_SITUACAO',polpa,'Implantação'),registro('PR_PAPEL',polpa,'Viabiliza')];
  export const listarRespostasCaderno=async()=>structuredClone(linhas);
  export const salvarRespostaCaderno=async({data:d})=>{if(new URLSearchParams(location.search).has('falha'))throw Error('Falha sintética de salvamento');if(new URLSearchParams(location.search).has('consulta'))throw Error('Somente leitura');validarRespostaCaderno(d.codigo,d.contexto,d.resposta);const antes=linhas.find(r=>r.codigo===d.codigo&&r.contexto===d.contexto);if((antes?.versao??0)!==d.versao)throw Error('Resposta alterada por outra pessoa');const r={...registro(d.codigo,d.contexto,null),resposta:d.resposta,versao:d.versao+1,atualizado_em:new Date().toISOString()};linhas=[...linhas.filter(a=>a.codigo!==d.codigo||a.contexto!==d.contexto),r];return structuredClone(r);};`;
  if(id==='\0diagnosticos-api')return `
   let produtos=[{id:'00000000-0000-0000-0000-000000000011',diagnosticoId:'00000000-0000-0000-0000-000000000001',nome:'Mel',cadeia:'Apicultura',statusPreenchimento:'em_preenchimento',respostas:{},atualizadoEm:'2026-10-22'},{id:'00000000-0000-0000-0000-000000000012',nome:'Polpa de frutas',cadeia:'Frutas',statusPreenchimento:'em_preenchimento',respostas:{},atualizadoEm:'2026-10-22'}];
   export const listarProdutos=async()=>structuredClone(produtos);
   export const criarProduto=async({data})=>{const p={...data,id:crypto.randomUUID(),respostas:{},statusPreenchimento:'em_preenchimento',atualizadoEm:new Date().toISOString()};produtos=[...produtos,p];return p;};
   export const listarRespostasIeo=async()=>[];
   let matriz=[{funcaoId:'F01',nomeFuncao:'Representação e articulação institucional',atuacao:['Viabiliza e executa'],experiencia:'Recorrente',criticidade:'4',interesse:'4',observacoes:'Apoios recorrentes, com dependência de parceiros.',externo:'Parceiro sintético'}];
   export const listarRespostasMatriz=async()=>structuredClone(matriz);
   export const salvarMatrizPrototipo=async({data})=>{if(new URLSearchParams(location.search).has('consulta'))throw Error('Somente leitura');if(new URLSearchParams(location.search).has('falha'))throw Error('Falha sintética de salvamento');const resposta={...data,atuacao:data.atuacao?[data.atuacao]:[],atualizadoEm:new Date().toISOString()};matriz=[...matriz.filter(r=>r.funcaoId!==data.funcaoId),resposta];return structuredClone(resposta);};
   export const obterImportacaoMatrizPendente=async()=>null;
   const bloqueado=async()=>{throw Error('Ação fora do escopo deste teste isolado');};
   export const descartarImportacaoMatriz=bloqueado,registrarImportacaoMatriz=bloqueado,salvarRespostaIeo=bloqueado,salvarRespostasProduto=bloqueado,excluirProduto=bloqueado;
   `;
 }
},tailwindcss(),react()]});
