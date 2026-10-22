// PostgreSQL isolado: sequência real de migrações, sem credenciais ou dados remotos.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const rows = async (sql, args=[]) => (await db.query(sql,args)).rows;
const snap = async () => {
  const resultado = {};
  for(const tabela of ['metas','etapas','atividades','tarefas','projeto_anexos','plano_riscos','log_alteracoes_meta'])
    resultado[tabela] = await rows(`SELECT * FROM ${tabela} ORDER BY id`);
  return resultado;
};
async function recusa(fn, padrao) {
  const antes=await snap();
  await assert.rejects(fn(),padrao);
  assert.deepEqual(await snap(),antes,'Falha deve reverter integralmente a operação');
}
const concluir=(tipo,n,periodos=[],concluido=true)=>db.query('SELECT concluir_plano_com_periodos($1,$2,$3,$4::jsonb)',[tipo,id(n),concluido,JSON.stringify(periodos)]);
const periodo=(n,extra={})=>({id:id(n),inicioRealizado:'2026-02-01',fimRealizado:'2026-03-01',antes:{inicioRealizado:null,fimRealizado:null},...extra});
const irmaos=n=>rows('SELECT id,ordem AS "order" FROM etapas WHERE meta_id=$1 ORDER BY ordem,id',[id(n)]);
const mover=async(extra={})=>db.query('SELECT mover_etapa_plano($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9)',[
  1,id(16),id(1),extra.destino??id(2),extra.posicao??3,JSON.stringify(extra.antesOrigem??await irmaos(1)),JSON.stringify(extra.antesDestino??await irmaos(2)),'Teste','cesupa']);
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE SCHEMA realtime;
    CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;`);
  const arquivos=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
  for(const f of arquivos) await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
  await db.exec(`INSERT INTO projetos(id,comunidade_id,nome,code) OVERRIDING SYSTEM VALUE
    SELECT n,id,'Projeto '||n,n::text FROM (SELECT id,row_number() OVER(ORDER BY code) n FROM comunidades) c WHERE n<=2;
    INSERT INTO metas(id,projeto_id,nome,ordem) VALUES('${id(1)}',1,'Meta 1',1),('${id(2)}',1,'Meta 2',2),('${id(3)}',2,'Externa',1);
    INSERT INTO etapas(id,meta_id,nome,ordem,inicio_previsto,fim_previsto)
      SELECT ('00000000-0000-0000-0000-'||lpad((10+n)::text,12,'0'))::uuid,'${id(1)}','Etapa '||n,n,'2026-01-01','2026-12-31' FROM generate_series(1,6) n;
    INSERT INTO etapas(id,meta_id,nome,ordem) VALUES('${id(17)}','${id(2)}','Destino 1',1),('${id(18)}','${id(2)}','Destino 2',2),('${id(19)}','${id(2)}','Destino 3',3);
    INSERT INTO atividades(id,etapa_id,nome,ordem,status,progresso,inicio_previsto,fim_previsto,observacoes) VALUES
      ('${id(21)}','${id(16)}','Atividade A',1,'Em andamento',40,'2026-01-01','2026-12-31','Preservar'),
      ('${id(22)}','${id(16)}','Atividade B',2,'Concluído',100,'2026-01-01','2026-12-31','Legado sem datas'),
      ('${id(23)}','${id(17)}','Outra atividade',1,'A iniciar',0,'2026-01-01','2026-12-31',NULL);
    INSERT INTO tarefas(id,atividade_id,titulo,ordem) VALUES('${id(31)}','${id(21)}','Tarefa preservada',1);
    INSERT INTO projeto_anexos(id,projeto_id,atividade_id,storage_path,nome_arquivo) VALUES('${id(32)}',1,'${id(21)}','teste.pdf','teste.pdf');
    INSERT INTO plano_riscos(id,projeto_id,meta_id,etapa_id,descricao,probabilidade,impacto) VALUES('${id(33)}',1,'${id(1)}','${id(16)}','Risco preservado',2,3);`);
  for(const [tipo,n] of [['meta',1],['etapa',16],['atividade',21]]) await recusa(()=>concluir(tipo,n),/início e fim/);
  await recusa(()=>concluir('meta',1,[periodo(21)]),/Atividade B/);
  await recusa(()=>concluir('meta',1,[periodo(21),periodo(22,{fimRealizado:'2026-01-01'})]),/anterior/);
  await recusa(()=>concluir('meta',1,[periodo(21),periodo(22,{inicioRealizado:'2026-02-30'})]));
  await recusa(()=>concluir('meta',1,[periodo(23)]),/fora/);
  await recusa(()=>concluir('meta',1,[periodo(21),periodo(21)]),/única vez/);
  await recusa(()=>concluir('meta',1,[periodo(21,{antes:{inicioRealizado:'2026-01-01',fimRealizado:null}})]),/mudou/);
  await concluir('atividade',21,[periodo(21)]);
  assert.equal((await rows('SELECT status FROM atividades WHERE id=$1',[id(21)]))[0].status,'Concluído');
  await concluir('atividade',21); // Sem novo preenchimento.
  await concluir('etapa',16,[periodo(22)]); // Inclui o legado concluído sem datas.
  await concluir('meta',1);
  const periodosAntes=await rows('SELECT id,inicio_realizado,fim_realizado FROM atividades ORDER BY id');
  await concluir('meta',1,[],false);
  assert.deepEqual(await rows('SELECT id,inicio_realizado,fim_realizado FROM atividades ORDER BY id'),periodosAntes);
  assert.equal((await rows('SELECT status FROM atividades WHERE id=$1',[id(23)]))[0].status,'A iniciar');
  const before=await snap();
  await recusa(()=>mover({destino:id(3)}),/mesmo projeto/);
  await recusa(()=>mover({posicao:5}),/Posição/);
  await recusa(()=>mover({antesOrigem:[]}),/estrutura mudou/);
  await recusa(()=>mover({antesDestino:[]}),/estrutura mudou/);
  await db.exec(`CREATE FUNCTION falha_log_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha simulada'; END $$;
    CREATE TRIGGER falha_log_teste BEFORE INSERT ON log_alteracoes_meta FOR EACH ROW EXECUTE FUNCTION falha_log_teste();`);
  await recusa(()=>mover(),/Falha simulada/);
  await db.exec('DROP TRIGGER falha_log_teste ON log_alteracoes_meta');
  await mover();
  assert.deepEqual((await irmaos(1)).map(x=>Number(x.order)),[1,2,3,4,5]);
  assert.deepEqual((await irmaos(2)).map(x=>x.id),[id(17),id(18),id(16),id(19)],'Etapa 1.6 vira 2.3');
  assert.deepEqual((await irmaos(2)).map(x=>Number(x.order)),[1,2,3,4]);
  for(const tabela of ['atividades','tarefas','projeto_anexos']) assert.deepEqual((await snap())[tabela],before[tabela]);
  assert.equal((await rows('SELECT meta_id FROM plano_riscos WHERE id=$1',[id(33)]))[0].meta_id,id(2));
  const salvarAntes=await snap();
  const migracao=await readFile('supabase/migrations/0029_conclusao_periodo_movimentacao_etapas.sql','utf8');
  // Aplicação parcial (primeira função) e reexecução completa em banco preenchido.
  await db.exec(migracao.split('CREATE OR REPLACE FUNCTION public.mover_etapa_plano')[0]);
  await db.exec(migracao); await db.exec(migracao);
  assert.deepEqual(await snap(),salvarAntes);
  for(const papel of ['anon','authenticated','service_role']) for(const funcao of [
    'concluir_plano_com_periodos(text,uuid,boolean,jsonb)',
    'mover_etapa_plano(bigint,uuid,uuid,uuid,integer,jsonb,jsonb,text,text)'])
    assert.equal((await rows('SELECT has_function_privilege($1,$2,$3) p',[papel,'public.'+funcao,'EXECUTE']))[0].p,papel==='service_role');
  console.log(`SQL aprovado: ${arquivos.length} migrações; conclusão em três níveis, períodos, concorrência, transferência 1.6 → 2.3, vínculos, rollback, reexecução e permissões.`);
} catch(e) { console.error(e.message); process.exitCode=1; }
finally { await db.close(); }
