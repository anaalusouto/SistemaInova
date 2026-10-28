import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE SCHEMA realtime;CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN;END $$;`);
 for (const f of (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort()) { await db.exec(await readFile('supabase/migrations/' + f, 'utf8')); console.log('Lida e validada: ' + f); }
 const queries = {
  tabelas: `select tablename from pg_tables where schemaname='public' order by tablename`,
  colunas: `select table_name,column_name,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name like 'diagnostic%' order by table_name,ordinal_position`,
  indices: `select tablename,indexdef from pg_indexes where schemaname='public' and tablename like 'diagnostic%' order by tablename,indexname`,
  restricoes: `select conrelid::regclass::text tabela,conname,pg_get_constraintdef(oid) definicao from pg_constraint where connamespace='public'::regnamespace and conrelid::regclass::text like 'diagnostic%' order by tabela,conname`,
  gatilhos: `select event_object_table,trigger_name,action_statement from information_schema.triggers where trigger_schema='public' and event_object_table like 'diagnostic%' order by event_object_table`,
  permissoes: `select table_name,grantee,privilege_type from information_schema.table_privileges where table_schema='public' and table_name like 'diagnostic%' order by table_name,grantee`,
  funcoes: `select proname,pg_get_function_identity_arguments(oid) argumentos,pg_get_functiondef(oid) definicao from pg_proc where pronamespace='public'::regnamespace and (proname like '%diagnostico%' or proname like '%matriz%') order by proname`
 };
 const resultado = {};
 for (const [nome, sql] of Object.entries(queries)) resultado[nome] = (await db.query(sql)).rows;
 await writeFile('tmp/caderno/historico-local.json', JSON.stringify(resultado, null, 2));
 console.log(JSON.stringify({ tabelas: resultado.tabelas, funcoes: resultado.funcoes, colunas: resultado.colunas }, null, 2));
} finally { await db.close(); }
