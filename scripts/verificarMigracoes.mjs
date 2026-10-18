import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
const arquivos = (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort();
const versoes = new Set();
for (const [indice,arquivo] of arquivos.entries()) {
  const match=/^(\d{4})_[a-z0-9_]+\.sql$/.exec(arquivo);
  assert.ok(match,`Nome fora do padrão NNNN_descricao.sql: ${arquivo}`);
  assert.equal(match[1],String(indice).padStart(4,'0'),`Sequência ausente ou versão duplicada: ${arquivo}`);
  assert.ok(!versoes.has(match[1]),`Versão duplicada: ${match[1]}`);
  versoes.add(match[1]);
  assert.ok((await readFile('supabase/migrations/'+arquivo,'utf8')).trim(),`Migração vazia: ${arquivo}`);
}
console.log(`Migrações: ${arquivos.length} arquivos sequenciais de 0000 até ${[...versoes].at(-1)}, sem nomes inválidos ou versões duplicadas.`);
