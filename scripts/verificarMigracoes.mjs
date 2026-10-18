import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
const arquivos = (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort();
const versoes = new Set();
let legado = 0;
for (const [indice,arquivo] of arquivos.entries()) {
  const match=/^(\d{4}|\d{14})_[a-z0-9_]+\.sql$/.exec(arquivo);
  assert.ok(match,`Nome inválido de migração: ${arquivo}`);
  if (match[1].length === 4) {
    assert.equal(match[1],String(legado++).padStart(4,'0'),`Sequência legada ausente: ${arquivo}`);
  }
  assert.ok(!versoes.has(match[1]),`Versão duplicada: ${match[1]}`);
  versoes.add(match[1]);
  assert.ok((await readFile('supabase/migrations/'+arquivo,'utf8')).trim(),`Migração vazia: ${arquivo}`);
}
console.log(`Migrações: ${arquivos.length} arquivos, sem lacunas na sequência legada, nomes inválidos ou versões duplicadas.`);
