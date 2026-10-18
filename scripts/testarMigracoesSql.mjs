// PostgreSQL isolado. Somente auth/storage/realtime do provedor são simulados.
// Nenhuma credencial ou dado do banco publicado é carregado.
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import './verificarMigracoes.mjs';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', {paths:[path.resolve('node_modules/.cache/reordenacao-test')]}));
const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE SCHEMA realtime;
    CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;`);
  const arquivos = (await readdir('supabase/migrations')).filter(n=>n.endsWith('.sql')).sort();
  for (const arquivo of arquivos) {
    try { await db.exec(await readFile(path.join('supabase/migrations',arquivo),'utf8')); }
    catch(e) { throw new Error(`Falha na migração ${arquivo}: ${e.message}`,{cause:e}); }
  }
  const tabelas = (await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(r=>r.tablename);
  for (const tabela of ['projetos','metas','etapas','atividades','plano_riscos','usuarios','sessoes','orcamento_itens','orcamento_notas','cronograma_rotas','contatos','logs_comunicacao','diagnosticos','comunidade_pessoas','projeto_equipe']) {
    assert.ok(tabelas.includes(tabela),`Tabela ${tabela} precisa sobreviver à sequência completa`);
  }
  const semRls = (await db.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity")).rows;
  assert.deepEqual(semRls,[],'RLS deve estar habilitado nas tabelas da aplicação');
  // Exercita os campos usados pelo CRUD real, que IF NOT EXISTS não acrescenta
  // se o protótipo de diagnóstico tiver sido criado antes da migration 0009.
  await db.exec(`BEGIN;
    INSERT INTO public.diagnosticos(comunidade_id,data_aplicacao)
      SELECT id, CURRENT_DATE FROM public.comunidades ORDER BY code LIMIT 1;
    INSERT INTO public.diagnostico_produtos(diagnostico_id,nome,cadeia,respostas)
      SELECT id, 'Produto de teste', 'Teste', '{"teste":true}'::jsonb
      FROM public.diagnosticos LIMIT 1;`);
  const diagnostico = (await db.query(`SELECT d.status,d.versao,p.status_preenchimento,p.respostas
    FROM public.diagnosticos d JOIN public.diagnostico_produtos p ON p.diagnostico_id=d.id`)).rows[0];
  assert.equal(diagnostico.status,'em_edicao');
  assert.equal(diagnostico.versao,1);
  assert.equal(diagnostico.status_preenchimento,'em_preenchimento');
  assert.deepEqual(diagnostico.respostas,{teste:true});
  await db.exec('ROLLBACK;');
  const catalogo = (await db.query(`SELECT c.relname AS tabela,a.attname AS coluna,format_type(a.atttypid,a.atttypmod) AS tipo,a.attnotnull AS obrigatorio
    FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum`)).rows;
  await writeFile('node_modules/.cache/catalogo-migracoes.json',JSON.stringify(catalogo,null,2));
  console.log(`Migrações aprovadas: ${arquivos.length} arquivos, ${tabelas.length} tabelas, RLS e estrutura final preservados.`);
} finally { await db.close(); }
