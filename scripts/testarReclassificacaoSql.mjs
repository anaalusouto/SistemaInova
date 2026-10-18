// PostgreSQL isolado: nenhuma credencial ou dado operacional é lido.
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const row = async sql => (await db.query(sql)).rows[0];
async function fixture() {
  await db.exec(`BEGIN;
    INSERT INTO projetos(id,comunidade_id,nome,code) OVERRIDING SYSTEM VALUE
      SELECT n,id,'Projeto '||n,n::text FROM (SELECT id,row_number() OVER(ORDER BY code) n FROM comunidades) c WHERE n<=2;
    INSERT INTO metas(id,projeto_id,nome,ordem,responsavel,inicio_previsto,fim_previsto) VALUES
      ('${id(1)}',1,'Meta original',1,'Pessoa','2026-01-01','2026-12-31'),
      ('${id(2)}',1,'Meta destino',2,NULL,'2026-01-01','2026-12-31'),
      ('${id(3)}',2,'Outro projeto',1,NULL,NULL,NULL);
    INSERT INTO etapas(id,meta_id,nome,ordem,resultado_esperado,inicio_previsto,fim_previsto) VALUES
      ('${id(11)}','${id(1)}','Etapa original',1,'Resultado preenchido','2026-01-01','2026-12-31'),
      ('${id(12)}','${id(2)}','Etapa destino',1,NULL,'2026-01-01','2026-12-31'),
      ('${id(13)}','${id(3)}','Etapa externa',1,NULL,'2026-01-01','2026-12-31');
    INSERT INTO atividades(id,etapa_id,nome,ordem,inicio_previsto,fim_previsto,observacoes,status,progresso) VALUES
      ('${id(21)}','${id(11)}','Atividade original',1,'2026-02-01','2026-10-01','Observação original','Em andamento',45),
      ('${id(22)}','${id(12)}','Atividade destino',1,'2026-02-01','2026-10-01','Não sobrescrever','A iniciar',0),
      ('${id(23)}','${id(13)}','Atividade externa',1,'2026-02-01','2026-10-01',NULL,'A iniciar',0);
    INSERT INTO tarefas(id,atividade_id,titulo,ordem) VALUES ('${id(31)}','${id(21)}','Tarefa preenchida',1);
    INSERT INTO projeto_anexos(id,projeto_id,atividade_id,storage_path,nome_arquivo) VALUES
      ('${id(32)}',1,'${id(21)}','original.pdf','Original.pdf');
    INSERT INTO orcamento_itens(id,projeto_id,meta_id,item) VALUES ('${id(33)}',1,'${id(1)}','Item com orçamento');
    INSERT INTO plano_riscos(id,projeto_id,meta_id,etapa_id,descricao,probabilidade,impacto) VALUES
      ('${id(34)}',1,'${id(1)}','${id(11)}','Risco original',2,2);`);
}
async function previa(tipo, origem) {
  return (await db.query('SELECT previa_reclassificacao_plano($1,$2) p',[tipo,id(origem)])).rows[0].p;
}
async function converter(tipo, origem, novoTipo, pai, override={}) {
  const p = await previa(tipo,origem);
  const destino = tipo==='meta' ? 2 : tipo==='etapa' ? 12 : 22;
  const movimentos = p.dependencias.map(d=>({chave:d.chave,destinoId:id(destino)}));
  return db.query('SELECT reclassificar_plano($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9)',
    [tipo,id(origem),novoTipo,pai===null?null:id(pai),override.token??p.token,JSON.stringify(override.movimentos??movimentos),'Correção do cadastro','PMO','cesupa']);
}
async function caso(fn) {
  await fixture();
  try { await fn(); } finally { await db.exec('ROLLBACK;'); }
}
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE SCHEMA realtime;
    CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;`);
  for (const f of (await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
  for (const [tipo,origem,novo,pai] of [['meta',1,'etapa',2],['meta',1,'atividade',12],['etapa',11,'meta',null],['etapa',11,'atividade',12],['atividade',21,'meta',null],['atividade',21,'etapa',2]]) {
    await caso(async()=>{
      await converter(tipo,origem,novo,pai);
      const tabela = novo==='meta'?'metas':novo==='etapa'?'etapas':'atividades';
      assert.ok(await row(`SELECT id FROM ${tabela} WHERE id='${id(origem)}'`),`${tipo} → ${novo}`);
      const log = await row(`SELECT * FROM log_alteracoes_meta WHERE target_id='${id(origem)}' AND campo='tipo do registro'`);
      assert.equal(log.payload.origem.nome,tipo==='meta'?'Meta original':tipo==='etapa'?'Etapa original':'Atividade original');
      assert.equal(log.de_valor,tipo); assert.equal(log.para_valor,novo);
      assert.equal((await row('SELECT count(*)::int n FROM projeto_anexos')).n,1,'Anexo preservado');
      assert.equal((await row('SELECT count(*)::int n FROM tarefas')).n,1,'Tarefa preservada');
      assert.equal((await row('SELECT count(*)::int n FROM orcamento_itens')).n,1,'Orçamento preservado');
      assert.equal((await row('SELECT count(*)::int n FROM plano_riscos')).n,1,'Risco preservado');
      if(tipo==='atividade') {
        assert.equal(log.payload.origem.observacoes,'Observação original');
        assert.equal(log.payload.origem.progresso,45);
        assert.equal((await row(`SELECT atividade_id FROM tarefas WHERE id='${id(31)}'`)).atividade_id,id(22));
        assert.equal((await row(`SELECT storage_path,atividade_id FROM projeto_anexos WHERE id='${id(32)}'`)).storage_path,'original.pdf');
        assert.equal((await row(`SELECT observacoes FROM atividades WHERE id='${id(22)}'`)).observacoes,'Não sobrescrever');
      }
      if(tipo==='etapa') assert.equal((await row(`SELECT meta_id FROM plano_riscos WHERE id='${id(34)}'`)).meta_id,id(2));
    });
  }
  // Erros são testados em savepoints: nenhum DELETE ou movimento pode sobreviver.
  async function recusa(fn,regex) {
    await db.exec('SAVEPOINT esperado;');
    await assert.rejects(fn(),regex);
    await db.exec('ROLLBACK TO SAVEPOINT esperado;');
    assert.ok(await row(`SELECT id FROM atividades WHERE id='${id(21)}'`));
    assert.equal((await row(`SELECT atividade_id FROM tarefas WHERE id='${id(31)}'`)).atividade_id,id(21));
  }
  await caso(async()=>{
    await recusa(()=>converter('atividade',21,'meta',null,{movimentos:[]}),/cada vínculo/);
    const p = await previa('atividade',21);
    await recusa(()=>converter('atividade',21,'meta',null,{movimentos:p.dependencias.map(d=>({chave:d.chave,destinoId:id(23)}))}),/destino válido/);
    await recusa(()=>converter('atividade',21,'etapa',3),/destino válido/);
    const antigo = p.token;
    await db.exec(`UPDATE tarefas SET titulo='Outra pessoa editou' WHERE id='${id(31)}'`);
    await recusa(()=>converter('atividade',21,'meta',null,{token:antigo}),/mudaram/);
    await db.exec(`UPDATE etapas SET fim_previsto='2026-03-01' WHERE id='${id(12)}'`);
    await recusa(()=>converter('meta',1,'atividade',12),/fora do período/);
    await recusa(async()=>converter('meta',1,'etapa',2,{movimentos:(await previa('meta',1)).dependencias.map(d=>({chave:d.chave,destinoId:id(d.tabela==='plano_riscos'?3:2)}))}),/destino válido/);
  });
  await caso(async()=>{
    await db.exec(`INSERT INTO metas(id,projeto_id,nome,ordem) VALUES('${id(4)}',1,'Outra meta válida',3);`);
    await recusa(async()=>converter('meta',1,'etapa',2,{movimentos:(await previa('meta',1)).dependencias.map(d=>({chave:d.chave,destinoId:id(d.tabela==='plano_riscos'?4:2)}))}),/meta de sua etapa/);
    await db.exec(`CREATE TABLE public.vinculo_futuro(id uuid PRIMARY KEY,meta_id uuid REFERENCES public.metas(id) ON DELETE CASCADE);`);
    await recusa(()=>converter('meta',1,'etapa',2),/vínculo novo/);
  });
  await caso(async()=>{
    await db.exec(`CREATE FUNCTION recusar_historico_teste() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha simulada no histórico'; END $$;
      CREATE TRIGGER recusar_historico BEFORE INSERT ON log_alteracoes_meta FOR EACH ROW EXECUTE FUNCTION recusar_historico_teste();`);
    await recusa(()=>converter('atividade',21,'meta',null),/Falha simulada/);
    assert.equal((await row(`SELECT count(*)::int n FROM metas WHERE id='${id(21)}'`)).n,0);
  });
  for (const papel of ['anon','authenticated']) {
    const p = await row(`SELECT has_function_privilege('${papel}','public.reclassificar_plano(text,uuid,text,uuid,text,jsonb,text,text,text)','EXECUTE') acesso`);
    assert.equal(p.acesso,false);
  }
  console.log('SQL aprovado: seis conversões, dados preenchidos, destinos individuais, anexos, tarefas, riscos e orçamento preservados; conflito, isolamento de projeto, datas, permissões e rollback verificados.');
} finally { await db.close(); }
