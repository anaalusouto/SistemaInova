const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;

function botao({readOnly=false,pendente=false}={}) {
  const React=require('react');const mod={exports:{}};let opcoes,chamadas=0;const invalidacoes=[],avisos=[];
  const diagnostico={id:id(1),comunidadeId:id(2),dataAplicacao:'2026-10-30',versao:2,atualizadoEm:'2026-10-30T12:00:00Z'};
  const mocks={react:React,'@tanstack/react-query':{useMutation:o=>{opcoes=o;return{isPending:pendente,mutate:()=>chamadas++};},useQueryClient:()=>({removeQueries:o=>invalidacoes.push(o),invalidateQueries:o=>invalidacoes.push(o)})},
    '../../diagnosticos.server':{},'../../auth/authStore':{useAuth:()=>({readOnly,user:{login:'teste'}})},'../../audit/auditStore':{useAudit:()=>({log(){}})},'../../lib/dateOnly':{formatDateOnly:d=>d},sonner:{toast:{success:m=>avisos.push(m),warning:m=>avisos.push(m),error:m=>avisos.push(m)}}};
  const code=ts.transpileModule(fs.readFileSync('src/app/components/diagnostic/ExcluirDiagnosticoButton.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(r=>mocks[r]??require(r),mod,mod.exports);
  return{render:()=>mod.exports.ExcluirDiagnosticoButton({diagnostico,nomeOrganizacao:'Organização de teste'}),chamadas:()=>chamadas,opcoes:()=>opcoes,invalidacoes,avisos};
}

test('botão não oferece exclusão a consulta e só executa após confirmação específica',()=>{
  assert.equal(botao({readOnly:true}).render(),null);
  const janelaAnterior=global.window;let confirmar=false,mensagem='';global.window={confirm:m=>{mensagem=m;return confirmar;}};
  try {
    const b=botao();b.render().props.onClick();assert.equal(b.chamadas(),0);
    confirmar=true;b.render().props.onClick();assert.equal(b.chamadas(),1);
    assert.match(mensagem,/Organização de teste/);assert.match(mensagem,/Versão 2/);assert.match(mensagem,/2026-10-30/);assert.match(mensagem,/não pode ser desfeita/);
    const ocupado=botao({pendente:true});ocupado.render().props.onClick();assert.equal(ocupado.chamadas(),0);
  } finally {if(janelaAnterior===undefined)delete global.window;else global.window=janelaAnterior;}
});

test('sucesso invalida listas e relatórios e remove somente o cache da aplicação excluída',()=>{
  const b=botao();b.render();b.opcoes().onSuccess({arquivosPendentes:false});
  assert.deepEqual(b.invalidacoes.filter(o=>o.queryKey).map(o=>o.queryKey[0]),['diagnosticos','diagnostico-visao-geral','diagnosticos-concluidos-relatorio']);
  const filtro=b.invalidacoes.find(o=>o.predicate).predicate;
  assert.equal(filtro({queryKey:['diagnostico',id(1)]}),true);assert.equal(filtro({queryKey:['diagnostico',id(3)]}),false);
  assert.match(b.avisos[0],/excluído/);
});

// Executa o handler real, incluindo suas consultas, em PostgreSQL isolado.
test('exclusão de mapeamento: autorização, concorrência, cascatas e preservação de vínculos',async t=>{
  const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[path.resolve('node_modules/.cache/reordenacao-test')]}));
  const pg=new PGlite();let consulta=false,falhaStorage=false;const removidos=[];
  const db={storage:{from:bucket=>({remove:async caminhos=>{removidos.push({bucket,caminhos});return{error:falhaStorage?{message:'Storage indisponível'}:null};}})},from(tabela){
    let colunas='*',apagar=false,unico=false,obrigatorio=false,limite;const filtros=[],args=[];
    const coluna=s=>'"'+s+'"';
    const b={select(c){colunas=c;return this;},delete(){apagar=true;return this;},eq(c,v){args.push(v);filtros.push(`${coluna(c)}=$${args.length}`);return this;},neq(c,v){args.push(v);filtros.push(`${coluna(c)}<>$${args.length}`);return this;},in(c,valores){const params=valores.map(v=>{args.push(v);return '$'+args.length;});filtros.push(`${coluna(c)} IN (${params.join(',')})`);return this;},limit(n){limite=n;return this;},single(){unico=true;obrigatorio=true;return this;},maybeSingle(){unico=true;return this;},then(resolve,reject){
      const where=filtros.length?' WHERE '+filtros.join(' AND '):'';
      const sql=apagar?`DELETE FROM ${coluna(tabela)}${where} RETURNING ${colunas}`:`SELECT ${colunas} FROM ${coluna(tabela)}${where}${limite?' LIMIT '+limite:''}`;
      return pg.query(sql,args).then(r=>({data:unico?r.rows[0]??null:r.rows,error:obrigatorio&&!r.rows.length?{message:'Mapeamento não encontrado nesta organização.'}:null}),e=>({data:null,error:{message:e.message}})).then(resolve,reject);
    }};return b;
  }};
  const cache=new Map();
  function carregar(f){f=path.resolve(f);if(!path.extname(f))f+='.ts';if(cache.has(f))return cache.get(f).exports;const m={exports:{}};cache.set(f,m);
    const code=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('require','module','exports',code)(r=>{
      if(r==='@tanstack/react-start')return{createServerFn:()=>{let v=d=>d;const fn={validator(x){v=x;return fn;},handler(h){return a=>h({data:v(a?.data)});}};return fn;}};
      if(r==='./sessao.server')return{exigirSessao:async()=>({id:id(99)}),exigirEscrita:async()=>{if(consulta)throw Error('Sem permissão');return{id:id(99)};}};
      if(r.endsWith('/client.server'))return{supabaseAdmin:db};
      return r.startsWith('.')?carregar(path.resolve(path.dirname(f),r)):require(r);
    },m,m.exports);return m.exports;
  }
  try {
    await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);CREATE SCHEMA realtime;CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$BEGIN RETURN;END$$;ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;`);
    const migracoes=fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
    for(const f of migracoes)await pg.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
    const orgs=(await pg.query('SELECT id FROM comunidades ORDER BY code LIMIT 2')).rows.map(r=>r.id);
    await pg.query("INSERT INTO diagnosticos(id,comunidade_id,data_aplicacao) VALUES($1,$3,'2026-10-30'),($2,$4,'2026-10-30')",[id(1),id(2),...orgs]);
    const {excluirDiagnostico,getDiagnostico}=carregar('src/app/diagnosticos.server.ts');
    const payload=async numero=>({id:id(numero),comunidadeId:orgs[0],atualizadoEm:(await pg.query('SELECT atualizado_em::text AS stamp FROM diagnosticos WHERE id=$1',[id(numero)])).rows[0].stamp,confirmacao:'EXCLUIR'});
    const excluir=async d=>excluirDiagnostico({data:d});
    await t.test('link com organização divergente não abre outro mapeamento',async()=>{
      assert.equal((await getDiagnostico({data:{id:id(1),comunidadeId:orgs[0]}})).comunidadeId,orgs[0]);
      await assert.rejects(getDiagnostico({data:{id:id(1),comunidadeId:orgs[1]}}),/não encontrado nesta organização/);
    });
    await t.test('consulta e falta de confirmação não permitem exclusão',async()=>{
      const d=await payload(1);consulta=true;await assert.rejects(excluir(d),/Sem permissão/);consulta=false;
      await assert.rejects(async()=>excluir({...d,confirmacao:''}),/Confirme/);
      await assert.rejects(excluir({...d,comunidadeId:orgs[1]}),/não encontrado nesta organização/);
      assert.equal((await pg.query('SELECT count(*)::int n FROM diagnosticos')).rows[0].n,2);
    });
    await t.test('versão posterior bloqueia exclusão da anterior',async()=>{
      await pg.query("INSERT INTO diagnosticos(id,comunidade_id,data_aplicacao,versao,diagnostico_anterior_id) VALUES($1,$2,'2026-10-30',2,$3)",[id(3),orgs[0],id(1)]);
      await assert.rejects(excluir(await payload(1)),/versão posterior/);
      await excluir(await payload(3));assert.equal((await pg.query('SELECT id FROM diagnosticos WHERE id=$1',[id(1)])).rows.length,1);
    });
    await t.test('alteração concorrente não apaga a aplicação',async()=>{
      await assert.rejects(excluir({...await payload(1),atualizadoEm:'2000-01-01T00:00:00Z'}),/alterado ou excluído/);
      assert.equal((await pg.query('SELECT id FROM diagnosticos WHERE id=$1',[id(1)])).rows.length,1);
    });
    await pg.query("INSERT INTO diagnostico_matriz(diagnostico_id,funcao_id) VALUES($1,'F01');",[id(1)]);
    await pg.query("INSERT INTO diagnostico_ieo(diagnostico_id,pergunta_id,nivel) VALUES($1,'1.1.1',3)",[id(1)]);
    await pg.query("INSERT INTO diagnostico_produtos(id,diagnostico_id,nome) VALUES($1,$2,'Produto sintético')",[id(10),id(1)]);
    await pg.query("INSERT INTO diagnostico_caderno_respostas(diagnostico_id,codigo,contexto,resposta,atualizado_por) VALUES($1,'Q01','','{\"valor\":\"3\",\"selecoes\":[],\"relato\":\"Teste\",\"fonte\":\"Teste\",\"respondentes\":\"Teste\"}','Teste')",[id(1)]);
    await pg.query('INSERT INTO diagnostico_parecer(diagnostico_id) VALUES($1)',[id(1)]);
    await pg.query("INSERT INTO diagnostico_anexos(id,diagnostico_id,storage_path,nome_arquivo) VALUES($1,$2,'isolado/teste.pdf','teste.pdf')",[id(11),id(1)]);
    await pg.query('INSERT INTO diagnostico_checklist_itens(diagnostico_id,item_id,anexo_id) VALUES($1,1,$2)',[id(2),id(11)]);
    await t.test('evidência compartilhada bloqueia exclusão sem modificar outra aplicação',async()=>{
      await assert.rejects(excluir(await payload(1)),/evidências.*outra versão/);
      assert.equal((await pg.query('SELECT anexo_id FROM diagnostico_checklist_itens WHERE diagnostico_id=$1',[id(2)])).rows[0].anexo_id,id(11));
    });
    await pg.query('DELETE FROM diagnostico_checklist_itens WHERE diagnostico_id=$1',[id(2)]);
    await pg.query('INSERT INTO diagnostico_checklist_itens(diagnostico_id,item_id,anexo_id) VALUES($1,1,$2)',[id(1),id(11)]);
    await pg.query("UPDATE diagnosticos SET status='concluido' WHERE id=$1",[id(1)]);
    await t.test('excluir concluído remove apenas suas filhas e mantém organização e outras aplicações',async()=>{
      await pg.exec('SET ROLE service_role');
      const result=await excluir(await payload(1));assert.equal(result.arquivosPendentes,false);
      await pg.exec('RESET ROLE');
      for(const tabela of ['diagnostico_matriz','diagnostico_ieo','diagnostico_produtos','diagnostico_caderno_respostas','diagnostico_parecer','diagnostico_checklist_itens','diagnostico_anexos'])assert.equal((await pg.query(`SELECT count(*)::int n FROM ${tabela} WHERE diagnostico_id=$1`,[id(1)])).rows[0].n,0,tabela);
      assert.equal((await pg.query('SELECT id FROM comunidades WHERE id=$1',[orgs[0]])).rows.length,1);
      assert.equal((await pg.query('SELECT id FROM diagnosticos WHERE id=$1',[id(2)])).rows.length,1);
      assert.deepEqual(removidos,[{bucket:'diagnostico-anexos',caminhos:['isolado/teste.pdf']}]);
    });
    await t.test('falha de Storage informa pendência sem fingir que a exclusão SQL falhou',async()=>{
      await pg.query("INSERT INTO diagnosticos(id,comunidade_id,data_aplicacao) VALUES($1,$2,'2026-10-30')",[id(4),orgs[0]]);
      await pg.query("INSERT INTO diagnostico_anexos(id,diagnostico_id,storage_path,nome_arquivo) VALUES($1,$2,'isolado/pendente.pdf','pendente.pdf')",[id(12),id(4)]);
      falhaStorage=true;assert.equal((await excluir(await payload(4))).arquivosPendentes,true);
      assert.equal((await pg.query('SELECT id FROM diagnosticos WHERE id=$1',[id(4)])).rows.length,0);
    });
  } finally {await pg.close();}
});
