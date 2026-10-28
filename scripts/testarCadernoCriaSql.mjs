// Sequência completa em PostgreSQL isolado. Não lê credenciais nem acessa banco remoto.
import assert from 'node:assert/strict';
import { readFile,readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[path.resolve('node_modules/.cache/reordenacao-test')]}));
const db=new PGlite();
const arquivo='0034_caderno_instrumentos_cria.sql';
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const q=async(sql,args=[]) => (await db.query(sql,args)).rows;
const resposta=(valor,relato='Relato de teste')=>({valor,selecoes:[],relato,fonte:'Fonte sintética',respondentes:'Grupo de teste'});
let org,outraOrg;
const salvar=async(codigo,contexto,valor,versao=0,organizacao=org,diag=id(1))=>(await q('select salvar_resposta_caderno_cria($1,$2,$3,$4,$5,$6,$7) r',[organizacao,diag,codigo,contexto,resposta(valor),versao,'autor-teste']))[0].r;
try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE SCHEMA realtime;CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN;END $$;`);
 const anteriores=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')&&f<arquivo).sort();
 for(const f of anteriores)await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
 [org,outraOrg]=(await q('select id from comunidades order by code limit 2')).map(r=>r.id);
 await db.query("insert into diagnosticos(id,comunidade_id,data_aplicacao) values($1,$3,'2026-10-22'),($2,$4,'2026-10-22')",[id(1),id(2),org,outraOrg]);
 await db.query("insert into diagnostico_ieo(diagnostico_id,pergunta_id,nivel) values($1,'1.1.1',3)",[id(1)]);
 await db.query("insert into diagnostico_matriz(diagnostico_id,funcao_id,experiencia) values($1,'F01','Recorrente')",[id(1)]);
 await db.query("insert into diagnostico_produtos(id,diagnostico_id,nome,respostas) values($1,$3,'Mel','{\"legado\":\"preservado\"}'),($2,$3,'Polpa','{}'),($4,$5,'Outra organização','{}')",[id(11),id(12),id(1),id(13),id(2)]);
 const legado=async()=>q("select 'ieo' tipo,to_jsonb(i) dados from diagnostico_ieo i union all select 'matriz',to_jsonb(m) from diagnostico_matriz m union all select 'produtos',to_jsonb(p) from diagnostico_produtos p order by tipo,dados");
 const antes=await legado();
 const sql=await readFile('supabase/migrations/'+arquivo,'utf8');
 // Aplicação parcial (tabela criada, restante ainda não aplicado), seguida de reexecução.
 await db.exec(sql.slice(0,sql.indexOf('-- IF NOT EXISTS')));
 await db.exec(sql); await db.exec(sql);
 assert.deepEqual(await legado(),antes);
 await db.exec('set role service_role');
 const q01=await salvar('Q01','','3');assert.equal(q01.versao,1);
 await salvar('Q01','','NS',1);assert.equal((await q("select resposta->>'valor' v from diagnostico_caderno_respostas where codigo='Q01'"))[0].v,'NS');
 await assert.rejects(salvar('Q01','','4',1),/outra pessoa/);
 await assert.rejects(salvar('Q02','','2',0,outraOrg),/inválida/);
 await salvar('F01','','2'); // Recorrente não determina a avaliação.
 await assert.rejects(salvar('C01',id(11),'4'),/funcionamento/);
 await assert.rejects(salvar('PR_SITUACAO',id(13),'Funcionamento'),/não pertence/);
 await salvar('PR_SITUACAO',id(11),'Funcionamento');await salvar('PR_CODIGO',id(11),'PR01');
 await salvar('C01',id(11),'3');
 await salvar('PR_SITUACAO',id(12),'Implantação');await salvar('PR_OPERACAO',id(12),'OP01');
 await salvar('IM01','OP01','Em andamento');
 await assert.rejects(salvar('C02',id(12),'1'),/não pontuar/);
 await assert.rejects(salvar('IM02','OP99','Disponível'),/vinculada/);
 await assert.rejects(salvar('PR_CODIGO',id(12),'PR01'),/unique/);
 await db.exec('reset role');const preservadas=await q('select * from diagnostico_caderno_respostas order by codigo,contexto');
 await db.exec(sql);assert.deepEqual(await q('select * from diagnostico_caderno_respostas order by codigo,contexto'),preservadas);assert.deepEqual(await legado(),antes);
 for(const papel of ['anon','authenticated']){
  await db.exec(`set role ${papel}`);await assert.rejects(q('select * from diagnostico_caderno_respostas'),/permission denied/);await assert.rejects(salvar('Q03','','1'),/permission denied/);await db.exec('reset role');
 }
 await db.query("update diagnosticos set status='concluido' where id=$1",[id(1)]);
 await assert.rejects(salvar('Q04','','1'),/concluído/);
 await assert.rejects(q("update diagnostico_caderno_respostas set resposta=$1 where diagnostico_id=$2",[resposta('4'),id(1)]),/somente leitura/);
 console.log(`SQL aprovado: ${anteriores.length+1} migrações, aplicação parcial, reexecução com registros, legado preservado, conflitos de edição, vínculos, implantação sem pontuação, RLS e conclusão.`);
}catch(e){console.error(e);process.exitCode=1;}finally{await db.close();}

