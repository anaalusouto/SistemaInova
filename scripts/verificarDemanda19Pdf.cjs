// Gera o PDF real com dados sintéticos; só intercepta o destino do download.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const out=path.resolve('docs/evidencias/demandas-19-20261020');fs.mkdirSync(out,{recursive:true});
const destino=path.join(out,'plano-trabalho-sintetico.pdf');
const Real=require('jspdf').jsPDF;
function Documento(...args){const doc=new Real(...args);doc.save=()=>fs.writeFileSync(destino,Buffer.from(doc.output('arraybuffer')));return doc;}
const cache=new Map();function carregar(arquivo){const absoluto=path.resolve(arquivo);if(cache.has(absoluto))return cache.get(absoluto);const mod={exports:{}};
const codigo=ts.transpileModule(fs.readFileSync(absoluto,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
new Function('require','module','exports',codigo)(r=>r==='jspdf'?{__esModule:true,default:Documento}:r.startsWith('.')?carregar(path.resolve(path.dirname(absoluto),r+'.ts')):require(r),mod,mod.exports);cache.set(absoluto,mod.exports);return mod.exports;}
const {projeto}=carregar('tests/demandas-ui/dados.ts');
const {buildReportModel,exportReportPdf}=carregar('src/app/lib/reportExport.ts');
exportReportPdf(buildReportModel('Plano de trabalho e riscos - Projeto de demonstração',[projeto],['cadastro','metas','riscos']));
if(fs.statSync(destino).size<1000)throw new Error('PDF incompleto');console.log(destino);
