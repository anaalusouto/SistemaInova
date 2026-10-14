// Teste isolado PostgreSQL/PGlite: não lê credenciais nem altera dados reais.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { PGlite } = require(require.resolve('@electric-sql/pglite', { paths: [path.resolve('node_modules/.cache/reordenacao-test')] }));
const db = new PGlite();
const id = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TYPE situacao_item_orcamento AS ENUM ('Ativo','Excluído');
    CREATE TYPE evento_item_orcamento AS ENUM ('importação','correção de origem');
    CREATE TABLE projetos(id bigint PRIMARY KEY);
    CREATE TABLE metas(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), projeto_id bigint REFERENCES projetos(id), nome text, ordem numeric);
    CREATE TABLE orcamento_importacoes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), projeto_id bigint REFERENCES projetos(id), nome_arquivo text, aba text, versao integer, autor text, resumo jsonb);
    CREATE TABLE orcamento_itens(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), projeto_id bigint REFERENCES projetos(id), meta_id uuid REFERENCES metas(id),
      grupo text, categoria text, item text NOT NULL, qtd numeric(10,2) NOT NULL DEFAULT 1, unidade text, qtd_unidades numeric(10,2) NOT NULL DEFAULT 1,
      valor_unitario numeric(14,2) NOT NULL DEFAULT 0, valor_proposto numeric(14,2), valor_planejado numeric GENERATED ALWAYS AS (qtd*qtd_unidades*valor_unitario) STORED,
      chave_origem text, ordem numeric, importacao_id uuid REFERENCES orcamento_importacoes(id), situacao situacao_item_orcamento DEFAULT 'Ativo', valor_executado numeric,
      data_compra date, justificativa_diferenca text, risco_id uuid, execucao_concluida boolean DEFAULT false);
    CREATE TABLE orcamento_item_historico(item_id uuid REFERENCES orcamento_itens(id), evento evento_item_orcamento, autor text NOT NULL, valor_anterior text, valor_novo text, detalhe text);
    CREATE TABLE notas(id uuid PRIMARY KEY, item_id uuid REFERENCES orcamento_itens(id), valor numeric, comprovante text);
    INSERT INTO projetos VALUES(1),(2);
    INSERT INTO metas(id,projeto_id) VALUES('${id(1)}',1),('${id(2)}',2);`);
  await db.exec(await readFile('supabase/migrations/0022_orcamento_vigente.sql', 'utf8'));
  const ler = async () => (await db.query('SELECT * FROM orcamento_itens WHERE projeto_id=1 AND vigente ORDER BY id')).rows;
  const snapshot = async () => (await db.query("SELECT coalesce(jsonb_agg(to_jsonb(o) ORDER BY id),'[]'::jsonb) AS s FROM orcamento_itens o WHERE projeto_id=1 AND vigente")).rows[0].s;
  const novo = (nome, valor, extra = {}) => ({ id: null, meta_id: id(1), grupo: 'Grupo', categoria: 'Material', item: nome, qtd: 1, unidade: 'un', qtd_unidades: 1, valor_unitario: valor, valor_proposto: valor, chave_origem: nome, ...extra });
  const planejado = i => Object.fromEntries(['id','meta_id','grupo','categoria','item','qtd','unidade','qtd_unidades','valor_unitario','valor_proposto','chave_origem'].map(k => [k, i[k]]));
  const gravar = async (itens, antes, imp = null) => (await db.query('SELECT salvar_versao_orcamento($1,$2::jsonb,$3::jsonb,$4,$5::jsonb) AS r', [1, JSON.stringify(antes ?? await snapshot()), JSON.stringify(itens), 'Teste', imp && JSON.stringify(imp)])).rows[0].r;
  const imp = { nome_arquivo: 'versao.xlsx', aba: 'Orçamento', resumo: {} };
  assert.equal((await gravar([novo('A',100),novo('B',200)], undefined, imp)).versao, 1);
  let rows = await ler(); const a = rows.find(i => i.item === 'A'); const b = rows.find(i => i.item === 'B');
  await db.query('UPDATE orcamento_itens SET valor_executado=50, data_compra=$1, justificativa_diferenca=$2, risco_id=$3 WHERE id=$4', ['2026-10-01','Parcial',id(99),b.id]);
  await db.query('INSERT INTO notas VALUES($1,$2,50,$3)', [id(10),b.id,'comprovante.pdf']);
  const r = await gravar([novo('A',150,{id:a.id}),novo('C',300)], undefined, imp);
  assert.equal(r.versao,2); assert.equal(r.ausentes,1);
  rows = await ler(); assert.equal(rows.reduce((s,i)=>s+Number(i.valor_proposto),0),450, 'Nova proposta substitui 300 por 450, sem somar versões');
  assert.equal(rows.find(i=>i.item==='A').id,a.id);
  const arquivado = (await db.query('SELECT * FROM orcamento_itens WHERE id=$1',[b.id])).rows[0];
  assert.equal(arquivado.vigente,false); assert.equal(Number(arquivado.valor_executado),50);
  assert.equal(arquivado.justificativa_diferenca,'Parcial'); assert.equal(arquivado.risco_id,id(99));
  assert.equal((await db.query('SELECT comprovante FROM notas WHERE item_id=$1',[b.id])).rows[0].comprovante,'comprovante.pdf');
  const anterior = await snapshot();
  await db.exec('BEGIN');
  await gravar([novo('D',10,{meta_id:null,meta_nova:'Nova meta'}),novo('E',20,{meta_id:null,meta_nova:'Nova meta'})],undefined,imp);
  const mesmaMeta = await ler();
  assert.equal(mesmaMeta[0].meta_id,mesmaMeta[1].meta_id,'A meta nova é criada uma vez por nome');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM metas WHERE nome='Nova meta'")).rows[0].n,1);
  await db.exec('ROLLBACK');
  await gravar(rows.map(planejado),undefined,imp);
  assert.equal((await ler()).length,2,'Repetir arquivo não duplica');
  rows=await ler(); const editados=rows.map(planejado); editados[0].qtd=2; editados[0].valor_proposto=600;
  await gravar(editados); assert.equal((await ler()).find(i=>i.id===editados[0].id).qtd,'2.00');
  await assert.rejects(gravar(editados,anterior),/outra pessoa/);
  const antes = await snapshot();
  for (const itens of [[novo('D',10,{meta_id:id(2)})], [novo('D',10,{id:b.id})], [novo('D',10),novo('D',20)], [novo('D',-1)]]) {
    await assert.rejects(gravar(itens)); assert.deepEqual(await snapshot(),antes);
  }
  await db.exec(`CREATE FUNCTION recusar_historico() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Falha de histórico'; END $$;
    CREATE TRIGGER recusar_historico BEFORE INSERT ON orcamento_item_historico FOR EACH ROW EXECUTE FUNCTION recusar_historico();`);
  await assert.rejects(gravar([novo('Nova',5,{ meta_id:null, meta_nova:'Meta sem gravação parcial' })],undefined,imp),/Falha de histórico/);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM metas')).rows[0].n,2,'Falha também reverte metas criadas na revisão');
  assert.deepEqual(await snapshot(),antes,'Falha de auditoria reverte a revisão completa');
  assert.equal((await db.query('SELECT count(*)::int AS n FROM orcamento_importacoes')).rows[0].n,3,'Importação com falha não deixa versão parcial');
  for (const papel of ['anon','authenticated','service_role']) {
    assert.equal((await db.query("SELECT has_function_privilege($1,'public.salvar_versao_orcamento(bigint,jsonb,jsonb,text,jsonb)','EXECUTE') AS p",[papel])).rows[0].p,papel==='service_role');
  }
  console.log('SQL aprovado: substituição, reimportação, edição, notas/anexos preservados, concorrência, isolamento, rollback e permissões.');
} finally { await db.close(); }
