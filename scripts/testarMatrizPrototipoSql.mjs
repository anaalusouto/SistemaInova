// Sequência real e dados sintéticos em PostgreSQL isolado; nenhum acesso remoto.
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[path.resolve('node_modules/.cache/reordenacao-test')]}));
const db=new PGlite();
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const q=async(sql,args=[]) =>(await db.query(sql,args)).rows;
const arquivo='20261021201656_matriz_funcional_prototipo.sql';
const legado=async()=>q("SELECT to_jsonb(m)-'funcao_nome'-'experiencia'-'externo' d FROM diagnostico_matriz m WHERE funcao_id='1' ORDER BY diagnostico_id");
const outras=async()=>({ieo:await q('SELECT * FROM diagnostico_ieo ORDER BY diagnostico_id,pergunta_id'),cesta:await q('SELECT * FROM diagnostico_produtos ORDER BY id')});
const matriz=()=>q('SELECT * FROM diagnostico_matriz ORDER BY diagnostico_id,funcao_id');
let orgA,orgB;
const salvar=(extra={})=>{const d={org:orgA,diag:id(1),funcao:'F01',nome:'Representação e articulação institucional',atuacao:'Viabiliza e executa',experiencia:'Inicial',criticidade:'4',interesse:'3',observacao:'Observação registrada',externo:'Parceiro identificado',...extra};
  return db.query('SELECT salvar_matriz_prototipo($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',Object.values(d));};
async function recusa(fn,padrao){const antes=await matriz();await assert.rejects(fn(),padrao);assert.deepEqual(await matriz(),antes);}
try {
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE SCHEMA realtime;CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN;END $$;`);
  for(const f of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')&&f<arquivo).sort())await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
  [orgA,orgB]=(await q('SELECT id FROM comunidades ORDER BY code LIMIT 2')).map(x=>x.id);
  await db.query("INSERT INTO diagnosticos(id,comunidade_id,data_aplicacao) VALUES($1,$4,'2026-10-01'),($2,$4,'2026-10-02'),($3,$5,'2026-10-01')",[id(1),id(2),id(3),orgA,orgB]);
  await db.query("INSERT INTO diagnostico_matriz(diagnostico_id,funcao_id,atuacao,quem_executa,abrangencia,observacoes) VALUES($1,'1',ARRAY['Articula','Executa'],'Parceiro','3','Resposta antiga')",[id(1)]);
  await db.query("INSERT INTO diagnostico_matriz(diagnostico_id,funcao_id,observacoes) VALUES($1,'23','Acesso antigo'),($2,'24','Outra função antiga')",[id(2),id(3)]);
  await db.query("INSERT INTO diagnostico_ieo(diagnostico_id,pergunta_id,nivel,observacao) VALUES($1,'1.1.1',3,'IEO preservado')",[id(1)]);
  await db.query("INSERT INTO diagnostico_produtos(diagnostico_id,nome,respostas) VALUES($1,'Mel','{\"origem\":\"Original\"}'::jsonb)",[id(1)]);
  const antesLegado=await legado(),antesOutras=await outras();
  // Reproduz instalação parcial de uma coluna, seguida da execução e reexecução completas.
  await db.exec('ALTER TABLE diagnostico_matriz ADD COLUMN funcao_nome text');
  const sql=await readFile('supabase/migrations/'+arquivo,'utf8');await db.exec(sql);await db.exec(sql);
  assert.deepEqual(await legado(),antesLegado);assert.deepEqual(await outras(),antesOutras);
  await db.exec('SET ROLE service_role');await salvar();await db.exec('RESET ROLE');
  let nova=(await matriz()).find(r=>r.funcao_id==='F01');
  assert.equal(nova.diagnostico_id,id(1));assert.deepEqual(nova.atuacao,['Viabiliza e executa']);assert.equal(nova.experiencia,'Inicial');assert.equal(nova.externo,'Parceiro identificado');
  await salvar({experiencia:'Recorrente',interesse:'4'});
  assert.equal((await matriz()).filter(r=>r.funcao_id==='F01').length,1,'Editar não duplica');
  await recusa(()=>salvar({org:orgB}),/não pertence/);
  for(const patch of [{funcao:'1'},{funcao:'F22'},{atuacao:'Apoia'},{experiencia:'N/A'},{criticidade:'5'},{interesse:'0'},{nome:''}])await recusa(()=>salvar(patch));
  const primeira=(await matriz()).find(r=>r.diagnostico_id===id(1)&&r.funcao_id==='F01');
  await salvar({diag:id(2),observacao:'Outra aplicação'});await salvar({diag:id(3),org:orgB,observacao:'Outra organização'});
  assert.deepEqual((await matriz()).find(r=>r.diagnostico_id===id(1)&&r.funcao_id==='F01'),primeira);
  await db.query("UPDATE diagnosticos SET status='concluido' WHERE id=$1",[id(2)]);
  await recusa(()=>salvar({diag:id(2)}),/concluído/);
  await db.exec(`CREATE FUNCTION falha_matriz_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha de auditoria';END $$;
    CREATE TRIGGER falha_matriz_teste BEFORE UPDATE ON diagnosticos FOR EACH ROW EXECUTE FUNCTION falha_matriz_teste();`);
  await recusa(()=>salvar({funcao:'F03'}),/Falha de auditoria/);
  await db.exec('DROP TRIGGER falha_matriz_teste ON diagnosticos');
  assert.deepEqual(await legado(),antesLegado,'Não converte nem apaga registros antigos');
  assert.deepEqual(await outras(),antesOutras,'Matriz não escreve em IEO nem Cesta');
  const preenchida=await matriz();await db.exec(sql);assert.deepEqual(await matriz(),preenchida,'Reexecutar com dados novos preserva tudo');
  for(const role of ['anon','authenticated','service_role'])assert.equal((await q("SELECT has_function_privilege($1,'public.salvar_matriz_prototipo(uuid,uuid,text,text,text,text,text,text,text,text)','EXECUTE') p",[role]))[0].p,role==='service_role');
  // A retirada do catálogo antigo é uma migração posterior e explicitamente destrutiva.
  const limpeza=await readFile('supabase/migrations/20261021203603_matriz_catalogo_21_funcoes.sql','utf8');
  const atuais=async()=>q("SELECT * FROM diagnostico_matriz WHERE funcao_id LIKE 'F%' ORDER BY diagnostico_id,funcao_id");
  const antesAtuais=await atuais(),antesCabecalhos=await q('SELECT * FROM diagnosticos ORDER BY id');
  await db.query("INSERT INTO diagnostico_matriz(diagnostico_id,funcao_id) VALUES($1,'desconhecida')",[id(1)]);
  await recusa(()=>db.exec(limpeza),/códigos desconhecidos/);
  await db.query("DELETE FROM diagnostico_matriz WHERE funcao_id='desconhecida'");
  await db.exec(`CREATE FUNCTION falha_limpeza_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha na limpeza';END $$;
    CREATE TRIGGER falha_limpeza_teste BEFORE DELETE ON diagnostico_matriz FOR EACH ROW EXECUTE FUNCTION falha_limpeza_teste();`);
  await recusa(()=>db.exec(limpeza),/Falha na limpeza/);
  assert.equal((await q("SELECT tgenabled FROM pg_trigger WHERE tgrelid='diagnostico_matriz'::regclass AND tgname='diagnostico_editavel_guard'"))[0].tgenabled,'O','Falha restaura o gatilho');
  await db.exec('DROP TRIGGER falha_limpeza_teste ON diagnostico_matriz');
  // Simula uma limpeza anterior parcial; a nova execução remove os demais sem tocar nas atuais.
  await db.exec("DELETE FROM diagnostico_matriz WHERE funcao_id='1'");
  await db.exec(limpeza);await db.exec(limpeza);
  assert.deepEqual(await atuais(),antesAtuais);assert.deepEqual(await outras(),antesOutras);
  assert.deepEqual(await q('SELECT * FROM diagnosticos ORDER BY id'),antesCabecalhos);
  assert.equal((await q("SELECT count(*)::int n FROM diagnostico_matriz WHERE funcao_id !~ '^F(0[1-9]|1[0-9]|2[01])$'"))[0].n,0);
  await assert.rejects(db.query("INSERT INTO diagnostico_matriz(diagnostico_id,funcao_id) VALUES($1,'24')",[id(1)]),/diagnostico_matriz_funcao_21_ck/);
  await recusa(()=>salvar({diag:id(2)}),/concluído/);
  console.log('Catálogo de 21 aprovado: exclusão antiga, dados atuais preservados, execução parcial, reexecução, rollback e gatilho restaurado.');
  console.log('SQL aprovado: legado, instalação parcial, reexecução, round-trip, organização/aplicação, conclusão, opções, isolamento de IEO/Cesta, rollback e service_role.');
}catch(e){console.error(e.message);process.exitCode=1;}finally{await db.close();}
