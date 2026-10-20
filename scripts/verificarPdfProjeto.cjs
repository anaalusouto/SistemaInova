// Valida o gerador real com dados sintéticos. Não acessa conta, navegador ou banco.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { jsPDF } = require('jspdf');
const raiz = path.resolve(__dirname, '..');
const destino = path.resolve(raiz, process.argv[2] || 'docs/evidencias/especificacao-projetos-20261020');
if (!destino.startsWith(raiz + path.sep)) throw new Error('O destino deve ficar no repositório.');
fs.mkdirSync(destino, { recursive: true });
let arquivo;
const cache = new Map();
function carregar(nome) {
  const absoluto = path.resolve(raiz, nome);
  if (cache.has(absoluto)) return cache.get(absoluto).exports;
  const mod = { exports: {} };
  cache.set(absoluto, mod);
  const codigo = ts.transpileModule(fs.readFileSync(absoluto, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', codigo)(r => {
    if (r === 'jspdf') return { default: function (...args) {
      const doc = new jsPDF(...args);
      const salvar = doc.save.bind(doc);
      doc.save = (nome, opcoes) => { arquivo = path.join(destino, nome); return salvar(arquivo, opcoes); };
      return doc;
    } };
    if (!r.startsWith('.')) return require(r);
    const base = path.resolve(path.dirname(absoluto), r);
    return carregar(fs.existsSync(base) ? base : base + '.ts');
  }, mod, mod.exports);
  return mod.exports;
}
(async () => {
  const { projeto } = carregar('tests/demandas-ui/dados.ts');
  const { CAMPOS_RELATORIO_PLANO } = carregar('src/app/lib/planoRelatorio.ts');
  const { buildReportModel, exportReportPdf } = carregar('src/app/lib/reportExport.ts');
  await exportReportPdf(buildReportModel(`Plano de trabalho e riscos - ${projeto.name}`, [projeto], [...CAMPOS_RELATORIO_PLANO]));
  const bytes = fs.readFileSync(arquivo);
  if (bytes.length < 1000 || bytes.subarray(0, 5).toString() !== '%PDF-' || !bytes.subarray(-20).toString().includes('%%EOF'))
    throw new Error('O arquivo gerado não passou na verificação básica do PDF.');
  process.stdout.write(JSON.stringify({ arquivo, bytes: bytes.length, projeto: projeto.name }) + '\n');
})().catch(e => { process.stderr.write(e.stack + '\n'); process.exitCode = 1; });
