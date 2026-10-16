import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
try {
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;');
  await db.exec(await readFile('supabase/migrations/20261016174704_cronograma_rotas_compartilhado.sql', 'utf8'));
  const dados = { schema: 1, arquivo: 'Teste.xlsx', abas: [] };
  const salvar = (versao, d = dados) => db.query('SELECT salvar_cronograma_rotas($1,$2::jsonb,$3,$4)', [versao, JSON.stringify(d), 'Verificador', 'Teste isolado']);
  await salvar(0);
  await assert.rejects(salvar(0), /outra pessoa/);
  await salvar(1, { ...dados, arquivo: 'Revisão.xlsx' });
  const rows = (await db.query('SELECT versao,dados FROM cronograma_rotas_historico ORDER BY versao')).rows;
  assert.equal(rows.length, 2); assert.equal(rows[0].dados.arquivo, 'Teste.xlsx');
  assert.equal(rows[1].dados.arquivo, 'Revisão.xlsx');
  await assert.rejects(salvar(2, { schema: 2 }), /inválidos/);
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const [r] = (await db.query("SELECT has_function_privilege($1,'public.salvar_cronograma_rotas(bigint,jsonb,text,text)','EXECUTE') AS permitido", [role])).rows;
    assert.equal(r.permitido, role === 'service_role');
  }
  await db.exec(`CREATE FUNCTION recusar_historico_rotas() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha de histórico'; END $$;
    CREATE TRIGGER falha BEFORE INSERT ON cronograma_rotas_historico FOR EACH ROW EXECUTE FUNCTION recusar_historico_rotas();`);
  await assert.rejects(salvar(2), /Falha de histórico/);
  assert.equal(Number((await db.query('SELECT versao FROM cronograma_rotas')).rows[0].versao), 2);
  assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE relname='cronograma_rotas'")).rows[0].relrowsecurity, true);
  console.log('SQL rotas aprovado: importação, histórico, concorrência, permissões, RLS e rollback.');
} finally { await db.close(); }
