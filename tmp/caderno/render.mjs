import fs from 'node:fs';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdf=await getDocument({data:new Uint8Array(fs.readFileSync('DOCUMENTOS/01_Caderno_Instrumentos_Cria (1).pdf')),useSystemFonts:true}).promise;
for(const n of [3,14,35,46]){const page=await pdf.getPage(n);const viewport=page.getViewport({scale:1.3});const canvas=createCanvas(viewport.width,viewport.height);await page.render({canvas,canvasContext:canvas.getContext('2d'),viewport}).promise;fs.writeFileSync(`tmp/caderno/pagina-${n}.png`,canvas.toBuffer('image/png'));}
