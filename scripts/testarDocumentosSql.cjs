// PostgreSQL isolado: mesma dependência de testes SQL já usada pelos outros scripts.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('PostgreSQL isolado: documentos validam destino/RLS e instrumentos concluídos ficam imutáveis',async()=>{
  const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[path.resolve('node_modules/.cache/reordenacao-test')]}));
  const db=new PGlite();
  const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
  try {
    await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      CREATE SCHEMA realtime;CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN;END $$;`);
    for(const f of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await db.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
    await db.exec(`INSERT INTO comunidades(id,code,nome) VALUES('${id(1)}','TESTE-01','Organização sintética');
      INSERT INTO diagnosticos(id,comunidade_id,data_aplicacao) VALUES('${id(2)}','${id(1)}','2026-10-19');
      INSERT INTO diagnostico_ieo(diagnostico_id,pergunta_id,nivel) VALUES('${id(2)}','1.1.1',2);
      INSERT INTO documentos_registro(id,area,comunidade_id,storage_path,nome_arquivo,tipo_mime,tamanho_bytes,enviado_por)
      VALUES('${id(3)}','parecer','${id(1)}','documentos/objeto-sintetico','teste.pdf','application/pdf',100,'Verificador');`);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM documentos_registro')).rows[0].n,1);
    const migracao=fs.readFileSync('supabase/migrations/0028_documentos_organizacao_projeto.sql','utf8');
    const snapshot=async()=> (await db.query('SELECT * FROM documentos_registro ORDER BY id')).rows;
    const antes=await snapshot();
    await db.exec(migracao);
    await db.exec(migracao);
    assert.deepEqual(await snapshot(),antes,'Reexecução preserva cada campo dos documentos');
    await db.exec('DROP INDEX documentos_registro_org_idx; DROP TRIGGER diagnostico_editavel_guard ON diagnostico_ieo');
    await db.exec(migracao);
    assert.deepEqual(await snapshot(),antes,'Recuperação de aplicação parcial preserva dados');
    assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname='diagnostico_editavel_guard' AND NOT tgisinternal")).rows[0].n,6);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_indexes WHERE schemaname='public' AND indexname='documentos_registro_org_idx'")).rows[0].n,1);
    await assert.rejects(db.exec(`INSERT INTO documentos_registro(area,comunidade_id,storage_path,nome_arquivo,tipo_mime,tamanho_bytes,enviado_por) VALUES('projeto','${id(1)}','errado','teste.pdf','application/pdf',1,'Teste')`),/documento_registro_pai_ck/);
    await assert.rejects(db.exec(`INSERT INTO documentos_registro(area,comunidade_id,storage_path,nome_arquivo,tipo_mime,tamanho_bytes,enviado_por) VALUES('parecer','${id(1)}','grande','teste.pdf','application/pdf',3145729,'Teste')`),/check constraint/);
    assert.equal((await db.query("SELECT relrowsecurity FROM pg_class WHERE relname='documentos_registro'")).rows[0].relrowsecurity,true);
    assert.equal((await db.query("SELECT has_table_privilege('anon','documentos_registro','SELECT') AS pode")).rows[0].pode,false);
    assert.equal((await db.query("SELECT has_table_privilege('authenticated','documentos_registro','INSERT') AS pode")).rows[0].pode,false);
    await db.exec(`UPDATE diagnosticos SET status='concluido' WHERE id='${id(2)}'`);
    for(const sql of [
      `UPDATE diagnostico_ieo SET nivel=4 WHERE diagnostico_id='${id(2)}'`,
      `DELETE FROM diagnostico_ieo WHERE diagnostico_id='${id(2)}'`,
      `INSERT INTO diagnostico_matriz(diagnostico_id,funcao_id) VALUES('${id(2)}','funcao')`,
      `INSERT INTO diagnostico_produtos(diagnostico_id,nome) VALUES('${id(2)}','Produto')`,
      `INSERT INTO diagnostico_parecer(diagnostico_id) VALUES('${id(2)}')`,
      `INSERT INTO diagnostico_checklist_itens(diagnostico_id,item_id) VALUES('${id(2)}',1)`,
    ])await assert.rejects(db.exec(sql),/somente leitura/);
    assert.equal((await db.query('SELECT nivel FROM diagnostico_ieo')).rows[0].nivel,2);
    await db.exec('ALTER TABLE documentos_registro RENAME COLUMN tipo_mime TO tipo_mime_incompativel');
    await assert.rejects(db.exec(migracao),/estrutura incompatível.*tipo_mime/);
    assert.deepEqual((await db.query('SELECT nome_arquivo FROM documentos_registro')).rows,[{nome_arquivo:'teste.pdf'}]);
  } finally {await db.close();}
});
