import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE SCHEMA realtime;
    CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;`);
  const arquivos = (await readdir('supabase/migrations')).filter(n => n.endsWith('.sql')).sort();
  const atual = arquivos.find(n => n.endsWith('_limite_arquivos_parecer.sql'));
  assert.ok(atual);
  for (const arquivo of arquivos) {
    if (arquivo === atual) break;
    await db.exec(await readFile(path.join('supabase/migrations', arquivo), 'utf8'));
  }
  await db.exec(`INSERT INTO public.comunidades(id,code,nome) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','teste-parecer','Organização teste');
    INSERT INTO public.documentos_registro(id,area,comunidade_id,storage_path,nome_arquivo,tipo_mime,tamanho_bytes,enviado_por)
      VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','parecer','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','legado.pdf','legado.pdf','application/pdf',123,'Teste');`);
  const sql = await readFile(path.join('supabase/migrations', atual), 'utf8');
  await db.exec(sql);
  assert.deepEqual((await db.query("SELECT nome_arquivo,tamanho_bytes::int FROM public.documentos_registro WHERE storage_path='legado.pdf'")).rows,[{nome_arquivo:'legado.pdf',tamanho_bytes:123}]);
  // Retomada após aplicação parcial: ambas as constraints existem.
  await db.exec('ALTER TABLE public.documentos_registro ADD CONSTRAINT documentos_registro_tamanho_bytes_check CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 3145728)');
  await db.exec(sql);
  const inserir = (area, tamanho, nome) => db.exec(`INSERT INTO public.documentos_registro(area,comunidade_id,storage_path,nome_arquivo,tipo_mime,tamanho_bytes,enviado_por) VALUES ('${area}','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${nome}','${nome}','application/pdf',${tamanho},'Teste')`);
  await inserir('parecer',20971520,'grande.pdf');
  await assert.rejects(inserir('parecer',20971521,'excedido.pdf'));
  await assert.rejects(inserir('mapeamento',3145729,'mapeamento.pdf'));
  await assert.rejects(inserir('parecer',0,'vazio.pdf'));
  await db.exec(sql);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM public.documentos_registro')).rows[0].n,2);
  console.log('Limite do parecer validado: histórico, preservação, aplicação parcial, reexecução e limites por área.');
} finally { await db.close(); }
