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
    if (arquivo.endsWith('_classificacao_origem_encaminhamentos.sql')) await db.exec(`INSERT INTO public.encaminhamentos(comunidade_id,descricao,origem_texto) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Registro anterior','Vínculo anterior')`);
    if (arquivo.endsWith('_riscos_encaminhamentos.sql')) await db.exec(`
      INSERT INTO public.comunidades(id,code,nome) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','teste-risco','Organização teste');
      INSERT INTO public.projetos(comunidade_id,nome,code) VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Projeto teste','teste-risco');
      INSERT INTO public.metas(id,projeto_id,nome) SELECT 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',id,'Meta teste' FROM public.projetos WHERE code='teste-risco';
      INSERT INTO public.etapas(id,meta_id,nome) VALUES ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Etapa teste');
      INSERT INTO public.plano_riscos(id,projeto_id,titulo,descricao,probabilidade,impacto,estrategia_mitigacao)
        SELECT 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',id,'Risco teste','Descrição',2,3,'Estratégia antiga' FROM public.projetos WHERE code='teste-risco';
      INSERT INTO public.atividades(id,etapa_id,nome,risco_origem_id) VALUES ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','cccccccc-cccc-4ccc-8ccc-cccccccccccc','Atividade antiga','dddddddd-dddd-4ddd-8ddd-dddddddddddd');
    `);
    try { await db.exec(await readFile(path.join('supabase/migrations',arquivo),'utf8')); }
    catch(e) { throw new Error(`Falha na migração ${arquivo}: ${e.message}`,{cause:e}); }
  }
  const legado = (await db.query("SELECT descricao,origem_texto,classificacao_origem FROM public.encaminhamentos WHERE descricao='Registro anterior'")).rows[0];
  assert.deepEqual(legado, {descricao:'Registro anterior',origem_texto:'Vínculo anterior',classificacao_origem:null});
  await db.exec("UPDATE public.encaminhamentos SET classificacao_origem='Plano de trabalho' WHERE descricao='Registro anterior'");
  assert.deepEqual((await db.query("SELECT origem_texto,classificacao_origem FROM public.encaminhamentos WHERE descricao='Registro anterior'")).rows[0],{origem_texto:'Vínculo anterior',classificacao_origem:'Plano de trabalho'});
  await assert.rejects(db.exec("UPDATE public.encaminhamentos SET classificacao_origem='Inválida' WHERE descricao='Registro anterior'"));
  await db.exec("DELETE FROM public.encaminhamentos WHERE descricao='Registro anterior'");
  const anterior = (await db.query("SELECT estrategia_mitigacao,estrategia_resposta_historica FROM public.plano_riscos WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'")).rows[0];
  assert.equal(anterior.estrategia_mitigacao, 'Estratégia antiga');
  assert.equal(anterior.estrategia_resposta_historica, 'Estratégia antiga');
  await db.exec("UPDATE public.plano_riscos SET estrategia_mitigacao='Texto alterado' WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'");
  assert.equal((await db.query("SELECT estrategia_resposta_historica FROM public.plano_riscos WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'")).rows[0].estrategia_resposta_historica, 'Estratégia antiga');
  assert.equal((await db.query("SELECT nome FROM public.atividades WHERE id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'")).rows[0].nome, 'Atividade antiga');
  await db.exec(`INSERT INTO public.encaminhamentos(comunidade_id,descricao,responsavel,data_fim,status,risco_origem_id) VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Ação um','Maria','2027-01-01','A iniciar','dddddddd-dddd-4ddd-8ddd-dddddddddddd'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Ação dois','João','2027-02-01','Em andamento','dddddddd-dddd-4ddd-8ddd-dddddddddddd');`);
  let encaminhamentos = (await db.query("SELECT descricao,responsavel,data_fim,status,risco_origem_id,risco_origem_identificacao,risco_origem_excluido FROM public.encaminhamentos WHERE comunidade_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' ORDER BY descricao")).rows;
  assert.equal(encaminhamentos.length, 2);
  assert.deepEqual(encaminhamentos.map(e => [e.descricao,e.responsavel,e.status,e.risco_origem_identificacao,e.risco_origem_excluido]), [['Ação dois','João','Em andamento','Risco teste',false],['Ação um','Maria','A iniciar','Risco teste',false]]);
  assert.ok(encaminhamentos.every(e => e.risco_origem_id === 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' && e.data_fim));
  await db.exec("INSERT INTO public.comunidades(id,code,nome) VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff','outra-org','Outra organização')");
  await assert.rejects(db.exec("INSERT INTO public.encaminhamentos(comunidade_id,descricao,risco_origem_id) VALUES ('ffffffff-ffff-4fff-8fff-ffffffffffff','Origem inválida','dddddddd-dddd-4ddd-8ddd-dddddddddddd')"), /não pertence à organização/);
  await db.exec("DELETE FROM public.plano_riscos WHERE id='dddddddd-dddd-4ddd-8ddd-dddddddddddd'");
  encaminhamentos = (await db.query("SELECT risco_origem_id,risco_origem_referencia,risco_origem_identificacao,risco_origem_excluido FROM public.encaminhamentos WHERE comunidade_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'")).rows;
  assert.equal(encaminhamentos.length, 2);
  assert.ok(encaminhamentos.every(e => e.risco_origem_id === null && e.risco_origem_referencia === 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' && e.risco_origem_identificacao === 'Risco teste' && e.risco_origem_excluido));
  assert.equal((await db.query("SELECT nome FROM public.atividades WHERE id='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'")).rows[0].nome, 'Atividade antiga');
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
