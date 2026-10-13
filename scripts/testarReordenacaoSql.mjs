// Banco PostgreSQL em memória. Não lê credenciais nem conecta ao banco real.
// Dependência de teste: npm install --prefix node_modules/.cache/reordenacao-test --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TYPE entidade_operacao_enum AS ENUM ('meta', 'etapa', 'especificacao');
    CREATE TYPE acao_operacao_enum AS ENUM ('editar');
    CREATE TABLE projetos(id bigint PRIMARY KEY);
    CREATE TABLE metas(id uuid PRIMARY KEY, projeto_id bigint REFERENCES projetos(id), nome text, ordem numeric NOT NULL);
    CREATE TABLE etapas(id uuid PRIMARY KEY, meta_id uuid REFERENCES metas(id), nome text, ordem numeric NOT NULL);
    CREATE TABLE atividades(id uuid PRIMARY KEY, etapa_id uuid REFERENCES etapas(id), nome text, ordem numeric NOT NULL, excluido_em timestamptz);
    CREATE TABLE log_alteracoes_meta(projeto_id bigint, entidade entidade_operacao_enum, acao acao_operacao_enum, parent_id uuid,
      target_path text, campo text, de_valor text, para_valor text, payload jsonb, autor text, autor_papel text, aprovado_por text);
    INSERT INTO projetos VALUES(1), (2);
  `);
  await db.exec(await readFile('supabase/migrations/0021_reordenacao_plano.sql', 'utf8'));
  for (let m = 1; m <= 4; m++) {
    await db.query('INSERT INTO metas VALUES($1, 1, $2, 0)', [id(m), `Meta ${m}`]);
    await db.query('INSERT INTO etapas VALUES($1, $2, $3, 0)', [id(m + 10), id(1), `Etapa ${m}`]);
    await db.query('INSERT INTO atividades VALUES($1, $2, $3, 0, NULL)', [id(m + 20), id(11), `Atividade ${m}`]);
  }
  await db.query('INSERT INTO metas VALUES($1, 2, $2, 0)', [id(99), 'Outro projeto']);
  await db.query('INSERT INTO atividades VALUES($1, $2, $3, 0, now())', [id(98), id(11), 'Removida']);
  const chamar = (nivel, pai, antes, ids) => db.query('SELECT reordenar_plano($1,$2,$3::jsonb,$4::uuid[],$5,$6)', [nivel, pai, JSON.stringify(antes), ids, 'Pessoa', 'PMO']);
  const ler = async (tabela, filtro = '') => (await db.query(`SELECT id, ordem::float8 AS "order" FROM ${tabela} ${filtro} ORDER BY ordem, id`)).rows;
  for (const [nivel, tabela, pai, filtro] of [['meta', 'metas', '1', 'WHERE projeto_id=1'], ['etapa', 'etapas', id(1), ''], ['atividade', 'atividades', id(11), 'WHERE excluido_em IS NULL']]) {
    const antes = await ler(tabela, filtro);
    const ids = [antes[0].id, antes[2].id, antes[3].id, antes[1].id];
    await chamar(nivel, pai, antes, ids);
    assert.deepEqual(await ler(tabela, filtro), ids.map((id, i) => ({ id, order: i + 1 })));
    await assert.rejects(chamar(nivel, pai, antes, ids), /alterada por outra pessoa/);
    const atualizado = await ler(tabela, filtro);
    await assert.rejects(chamar(nivel, pai, atualizado, [ids[0], ids[0], ids[2], ids[3]]), /mesma origem/);
    assert.deepEqual(await ler(tabela, filtro), atualizado);
  }
  const antes = await ler('metas', 'WHERE projeto_id=1');
  await assert.rejects(chamar('meta', '1', antes, [antes[0].id, antes[1].id, antes[2].id, id(99)]), /mesma origem/);
  await db.exec(`CREATE FUNCTION recusar_historico() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha de histórico simulada'; END $$;
    CREATE TRIGGER recusar_historico BEFORE INSERT ON log_alteracoes_meta FOR EACH ROW EXECUTE FUNCTION recusar_historico();`);
  await assert.rejects(chamar('meta', '1', antes, antes.map(i => i.id).reverse()), /Falha de histórico/);
  assert.deepEqual(await ler('metas', 'WHERE projeto_id=1'), antes, 'Falha de histórico deve desfazer todas as atualizações');
  assert.equal((await db.query('SELECT count(*)::int AS total FROM log_alteracoes_meta')).rows[0].total, 3);
  assert.equal((await db.query('SELECT ordem::int AS ordem FROM atividades WHERE id=$1', [id(98)])).rows[0].ordem, 0);
  assert.equal((await db.query('SELECT etapa_id FROM atividades WHERE id=$1', [id(22)])).rows[0].etapa_id, id(11));
  for (const papel of ['anon', 'authenticated', 'service_role']) {
    const resultado = await db.query("SELECT has_function_privilege($1, 'public.reordenar_plano(text,text,jsonb,uuid[],text,text)', 'EXECUTE') AS permitido", [papel]);
    assert.equal(resultado.rows[0].permitido, papel === 'service_role');
  }
  console.log('SQL aprovado: três níveis, índices repetidos, conflitos, duplicações, isolamento de origem, rollback integral, histórico e permissões.');
} finally { await db.close(); }
