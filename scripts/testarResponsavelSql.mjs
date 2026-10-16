// PostgreSQL isolado, sem ler credenciais ou alterar o banco operacional.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
try {
  await db.exec('CREATE TABLE usuarios(id uuid PRIMARY KEY, nome_exibicao text); CREATE TABLE encaminhamentos(id uuid PRIMARY KEY, responsavel text);');
  const sql = await readFile('supabase/migrations/0024_encaminhamento_responsavel_cadastrado.sql.sql', 'utf8');
  await db.exec(sql);
  await db.exec(sql); // Seguro ao reexecutar.
  await db.query('INSERT INTO usuarios VALUES ($1,$2),($3,$4)', [uid(1), 'Maria', uid(2), 'Maria']);
  await db.query('INSERT INTO encaminhamentos VALUES ($1,$2,$3)', [uid(3), 'Nome histórico', uid(2)]);
  await db.query('UPDATE usuarios SET nome_exibicao=$1 WHERE id=$2', ['Maria Silva', uid(2)]);
  const { rows } = await db.query('SELECT u.nome_exibicao FROM encaminhamentos e JOIN usuarios u ON u.id=e.responsavel_usuario_id');
  assert.equal(rows[0].nome_exibicao, 'Maria Silva');
  await assert.rejects(db.query('UPDATE encaminhamentos SET responsavel_usuario_id=$1', [uid(9)]));
  await db.query('DELETE FROM usuarios WHERE id=$1', [uid(2)]);
  const apagado = (await db.query('SELECT * FROM encaminhamentos')).rows[0];
  assert.equal(apagado.responsavel_usuario_id, null);
  assert.equal(apagado.responsavel, 'Nome histórico');
  console.log('SQL aprovado: vínculo por UUID, homônimos, renomeação, referência inválida, remoção e preservação do nome histórico.');
} finally { await db.close(); }
