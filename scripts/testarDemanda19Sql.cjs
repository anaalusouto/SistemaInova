const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');

test('demanda 19: etapa salva nome, resultado e datas em uma escrita validada; consulta não escreve',async()=>{
  const {PGlite}=require(require.resolve('@electric-sql/pglite',{paths:[path.resolve('node_modules/.cache/reordenacao-test')]}));
  const pg=new PGlite();let consulta=false, gravacoes=0;
  const id=n=>`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
  try {
    await pg.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;CREATE TABLE auth.users(id uuid PRIMARY KEY);
      CREATE SCHEMA storage;CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      CREATE SCHEMA realtime;CREATE FUNCTION realtime.send(jsonb,text,text,boolean) RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN;END $$;`);
    for(const f of fs.readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort())await pg.exec(fs.readFileSync('supabase/migrations/'+f,'utf8'));
    await pg.exec(`INSERT INTO comunidades(id,code,nome) VALUES('${id(4)}','ORG-DEMO','Organização sintética');
      INSERT INTO projetos(nome,code,comunidade_id) VALUES('Sintético','DEMO','${id(4)}');
      INSERT INTO metas(id,projeto_id,nome) VALUES('${id(1)}',1,'Meta');
      INSERT INTO etapas(id,meta_id,nome,inicio_previsto,fim_previsto) VALUES('${id(2)}','${id(1)}','Etapa','2026-01-01','2026-12-31');
      INSERT INTO atividades(id,etapa_id,nome,inicio_previsto,fim_previsto) VALUES('${id(3)}','${id(2)}','Atividade','2026-02-01','2026-03-01');`);
    const db={from(tabela){
      assert.ok(['etapas','atividades'].includes(tabela));
      let colunas='*', patch=null;const filtros=[];
      const executar=async()=>{
        const valores=[];const onde=filtros.map(([k,v])=>v===null?`${k} IS NULL`:`${k}=$${valores.push(v)}`).join(' AND ');
        if(!patch)return {data:(await pg.query(`SELECT ${colunas} FROM ${tabela}${onde?' WHERE '+onde:''}`,valores)).rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v instanceof Date?v.toISOString().slice(0,10):v]))),error:null};
        assert.ok(filtros.some(([k])=>k==='id'));gravacoes++;
        const sets=Object.entries(patch).map(([k,v])=>`${k}=$${valores.push(v)}`);
        await pg.query(`UPDATE ${tabela} SET ${sets.join(',')} WHERE ${onde}`,valores);return {data:[],error:null};
      };
      return {select(c){colunas=c;return this;},eq(k,v){filtros.push([k,v]);return this;},is(k,v){filtros.push([k,v]);return this;},update(p){patch=p;return this;},async single(){const r=await executar();return {...r,data:r.data[0]??null};},then(ok,no){return executar().then(ok,no);}};
    }};
    const cache=new Map();
    const carregar=arquivo=>{
      const absoluto=path.resolve(arquivo.endsWith('.ts')?arquivo:arquivo+'.ts');if(cache.has(absoluto))return cache.get(absoluto);
      const mod={exports:{}};const codigo=ts.transpileModule(fs.readFileSync(absoluto,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
      new Function('require','module','exports',codigo)(r=>{
        if(r==='@tanstack/react-start')return {createServerFn:()=>{const f={validator(){return f;},handler(h){return args=>h(args);}};return f;}};
        if(r.endsWith('/client.server'))return {supabaseAdmin:db};
        if(r==='./sessao.server')return {exigirEscrita:async()=>{if(consulta)throw new Error('Sem permissão');return {role:'admin',login:'teste',displayName:'Teste'};}};
        return carregar(path.resolve(path.dirname(absoluto),r));
      },mod,mod.exports);cache.set(absoluto,mod.exports);return mod.exports;
    };
    const api=carregar('src/app/planoTrabalho.server.ts');
    const dados={etapaId:id(2),nome:'Etapa revisada',resultadoEsperado:'Resultado verificado',inicioPrevisto:'2026-01-01',fimPrevisto:'2026-12-31',inicioRealizado:null,fimRealizado:null};
    await api.salvarPeriodoDaEtapa({data:dados});assert.equal(gravacoes,1);
    const ler=async()=> (await pg.query('SELECT nome,resultado_esperado FROM etapas WHERE id=$1',[id(2)])).rows[0];
    assert.deepEqual(await ler(),{nome:dados.nome,resultado_esperado:dados.resultadoEsperado});
    for(const patch of [{nome:''},{inicioRealizado:'2026-10-20',fimRealizado:'2026-10-01'},{fimPrevisto:'2026-02-15'}])await assert.rejects(api.salvarPeriodoDaEtapa({data:{...dados,...patch}}));
    consulta=true;await assert.rejects(api.salvarPeriodoDaEtapa({data:{...dados,nome:'Proibido'}}),/Sem permissão/);
    assert.equal(gravacoes,1);assert.equal((await ler()).nome,dados.nome);
    assert.equal((await pg.query('SELECT count(*)::int AS total FROM atividades')).rows[0].total,1);
  } finally {await pg.close();}
});
