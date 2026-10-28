import fs from 'node:fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdf = await getDocument({ data: new Uint8Array(fs.readFileSync('DOCUMENTOS/01_Caderno_Instrumentos_Cria (1).pdf')), useSystemFonts: true }).promise;
let texto = '';
for (let i = 1; i <= pdf.numPages; i++) {
  const pagina = await pdf.getPage(i);
  const conteudo = await pagina.getTextContent();
  texto += `\n\n--- PAGINA ${i} ---\n` + conteudo.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('');
}
fs.writeFileSync('tmp/caderno/texto.txt', texto);
console.log(JSON.stringify({ paginas: pdf.numPages, caracteres: texto.length }));
