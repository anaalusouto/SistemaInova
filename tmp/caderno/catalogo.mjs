import fs from 'node:fs';
const texto = fs.readFileSync('tmp/caderno/texto.txt', 'utf8');
const paginas = texto.split(/--- PAGINA (\d+) ---/);
const limpar = s => s.replace(/\s+/g, ' ').trim();
const questoes = [], operacao = [], funcoes = [];
for (let i = 1; i < paginas.length; i += 2) {
 const pagina = Number(paginas[i]), t = paginas[i + 1];
 if (pagina >= 14 && pagina <= 26) {
  const publico = limpar(t.match(/Questionário — ([^\n]+)/)?.[1] ?? '');
  for (const m of t.matchAll(/\n(Q\d{2}) ([\s\S]*?)(?=\nQ\d{2} |\nINOVA SOCIOBIO)/g)) {
   const corpo = m[2], antes = corpo.split(/\n1 —/)[0], fim = antes.indexOf('?');
   const niveis = [...corpo.matchAll(/\n([1-4]) — ([\s\S]*?)(?=\n[1-4] —|\n\[ \])/g)].map(n => ({valor:n[1], descricao:limpar(n[2])}));
   if (niveis.length !== 4) throw Error('Escala incompleta '+m[1]);
   questoes.push({codigo:m[1],texto:limpar(antes.slice(0,fim+1)),orientacao:limpar(antes.slice(fim+1)),publico,pagina,niveis,aprofundar:limpar(corpo.split('Aprofundar se necessário:')[1]??'')});
  }
 }
 if (pagina >= 35 && pagina <= 40) {
  for (const m of t.matchAll(/(?:\n| )(C\d{2}) ([\s\S]*?)(?=\nC\d{2} |\nINOVA SOCIOBIO)/g)) {
   const corpo = m[2], antes=corpo.split(/\n1\./)[0], fim=antes.indexOf('?');
   const niveis = [...corpo.matchAll(/\n([1-4])\.\s+([\s\S]*?)(?=\n[1-4]\.|\n\[ \]|$)/g)].map(n=>({valor:n[1],descricao:limpar(n[2])}));
   if(niveis.length!==4)throw Error('Escala incompleta '+m[1]);
   operacao.push({codigo:m[1],texto:limpar(antes.slice(0,fim+1)),orientacao:limpar(antes.slice(fim+1)),pagina,niveis});
  }
 }
 if(pagina>=3&&pagina<=13)for(const m of t.matchAll(/\n(F\d{2}) ([\s\S]*?)\nViabiliza/g)){
  const partes=m[2].split('Exemplo:');funcoes.push({codigo:m[1],descricao:limpar(partes[0]),exemplo:limpar(partes[1]??''),pagina});
 }
}
if(questoes.length!==25||operacao.length!==12)throw Error(JSON.stringify({q:questoes.length,c:operacao.length}));
fs.writeFileSync('src/app/diagnostic/catalog/cadernoCriaDados.ts',`/** Transcrição do Caderno de Instrumentos CRIA, revisão 22/10/2026. Página = página física do PDF. */\nexport const QUESTOES_CRIA = ${JSON.stringify(questoes,null,2)};\nexport const OPERACAO_CRIA = ${JSON.stringify(operacao,null,2)};\nexport const FUNCOES_GUIA_CRIA = ${JSON.stringify(funcoes,null,2)};\n`);
console.log(JSON.stringify({questoes:questoes.length,operacao:operacao.length,funcoes:funcoes.length}));

