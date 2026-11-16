import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[path.resolve('node_modules/.cache/reordenacao-test')]}));
const db=new PGlite();
try {
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 CREATE SCHEMA realtime; CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;`);
 const arquivos=(await readdir('supabase/migrations')).filter(x=>x.endsWith('.sql')).sort();
 for(const arquivo of arquivos) await db.exec(await readFile(path.join('supabase/migrations',arquivo),'utf8'));
 await db.exec(`INSERT INTO public.comunidades(id,code,nome) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','org-teste','Organização teste');
 INSERT INTO public.projetos(comunidade_id,nome,code) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Projeto teste','teste');
 INSERT INTO public.metas(id,projeto_id,nome) SELECT '00000000-0000-4000-8000-000000000001',id,'Meta com etapa' FROM public.projetos WHERE code='teste';
 INSERT INTO public.etapas(meta_id,nome) VALUES ('00000000-0000-4000-8000-000000000001','Etapa preservada');`);
 await assert.rejects(db.query(`SELECT public.excluir_meta_segura('00000000-0000-4000-8000-000000000001','Pessoa','PMO')`),/vinculados/);
 assert.equal((await db.query(`SELECT count(*)::int n FROM public.etapas WHERE nome='Etapa preservada'`)).rows[0].n,1);
 assert.equal((await db.query(`SELECT count(*)::int n FROM public.log_alteracoes_meta WHERE acao='excluir'`)).rows[0].n,0);
 // Reaplicação com dados existentes preserva a meta e seus vínculos.
 await db.exec(await readFile(path.join('supabase/migrations',arquivos.at(-1)),'utf8'));
 assert.equal((await db.query(`SELECT count(*)::int n FROM public.etapas WHERE nome='Etapa preservada'`)).rows[0].n,1);
 for(const [sufixo,sql] of [
  ['003',`INSERT INTO public.plano_riscos(projeto_id,meta_id,titulo,descricao,probabilidade,impacto) SELECT id,'00000000-0000-4000-8000-000000000003','Risco','Risco',1,1 FROM public.projetos WHERE code='teste'`],
  ['004',`INSERT INTO public.mudancas(projeto_id,meta_id,descricao,tipo) SELECT id,'00000000-0000-4000-8000-000000000004','Mudança','Escopo' FROM public.projetos WHERE code='teste'`],
  ['005',`INSERT INTO public.orcamento_itens(projeto_id,meta_id,item) SELECT id,'00000000-0000-4000-8000-000000000005','Item' FROM public.projetos WHERE code='teste'`],
 ]) {
  const id=`00000000-0000-4000-8000-000000000${sufixo}`;
  await db.exec(`INSERT INTO public.metas(id,projeto_id,nome) SELECT '${id}',id,'Meta vinculada' FROM public.projetos WHERE code='teste'; ${sql}`);
  await assert.rejects(db.query(`SELECT public.excluir_meta_segura('${id}','Pessoa','PMO')`),/vinculados/);
  assert.equal((await db.query(`SELECT count(*)::int n FROM public.metas WHERE id='${id}'`)).rows[0].n,1);
 }
 await db.exec(`INSERT INTO public.metas(id,projeto_id,nome) SELECT '00000000-0000-4000-8000-000000000002',id,'Meta vazia' FROM public.projetos WHERE code='teste'`);
 await db.query(`SELECT public.excluir_meta_segura('00000000-0000-4000-8000-000000000002','Pessoa','PMO')`);
 assert.equal((await db.query(`SELECT count(*)::int n FROM public.metas WHERE id='00000000-0000-4000-8000-000000000002'`)).rows[0].n,0);
 assert.equal((await db.query(`SELECT count(*)::int n FROM public.log_alteracoes_meta WHERE acao='excluir' AND autor='Pessoa'`)).rows[0].n,1);
 const permissoes=(await db.query(`SELECT has_function_privilege('anon','public.excluir_meta_segura(uuid,text,text)','EXECUTE') anon,has_function_privilege('authenticated','public.excluir_meta_segura(uuid,text,text)','EXECUTE') autenticado,has_function_privilege('service_role','public.excluir_meta_segura(uuid,text,text)','EXECUTE') servico`)).rows[0];
 assert.deepEqual(permissoes,{anon:false,autenticado:false,servico:true});
 await db.exec(`CREATE TABLE public.vinculo_teste(id uuid PRIMARY KEY, meta_id uuid REFERENCES public.metas(id) ON DELETE CASCADE)`);
 await assert.rejects(db.query(`SELECT public.excluir_meta_segura('00000000-0000-4000-8000-000000000001','Pessoa','PMO')`),/vínculo.*não suportado/);
 console.log('Exclusão segura: vínculos preservados, histórico atômico e permissões conferidos em PostgreSQL isolado.');
} finally {await db.close();}
