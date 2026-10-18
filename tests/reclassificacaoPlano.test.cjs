const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function carregar(file, mocks = {}) {
  const p = path.resolve(file), mod = { exports: {} };
  const codigo = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  new Function('require', 'module', 'exports', codigo)(r => {
    if (mocks[r]) return mocks[r];
    if (!r.startsWith('.')) return require(r);
    const rel = path.resolve(path.dirname(p), r);
    return carregar(fs.existsSync(rel + '.ts') ? rel + '.ts' : rel + '.tsx', mocks);
  }, mod, mod.exports);
  return mod.exports;
}
const uid = n => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const entrada = () => ({ tipo: 'atividade', id: uid(1), novoTipo: 'etapa', paiId: uid(2), token: 'a'.repeat(32),
  motivo: 'A comunidade cadastrou no nível incorreto', destinos: [{ chave: 'tarefas:'+uid(3), destinoId: uid(4) }] });
test('validação exige outro tipo, destino, motivo e correspondência individual sem duplicação', () => {
  const { validarReclassificacao } = carregar('src/app/lib/reclassificacaoPlano.ts');
  assert.doesNotThrow(() => validarReclassificacao(entrada()));
  for (const patch of [{ novoTipo: 'atividade' }, { paiId: null }, { token: '' }, { motivo: '  ' },
    { destinos: [...entrada().destinos, ...entrada().destinos] }, { destinos: [{ chave: 'tarefa', destinoId: '' }] }]) {
    assert.throws(() => validarReclassificacao({ ...entrada(), ...patch }));
  }
});
function servidor(consulta=false, erro=null) {
  const chamadas = [];
  const sessao = { displayName: 'Pessoa da sessão', role: 'cesupa' };
  const api = carregar('src/app/reclassificacaoPlano.server.ts', {
    '@tanstack/react-start': { createServerFn: () => ({ validator: () => ({ handler: f => f }) }) },
    './sessao.server': { exigirSessao: async () => sessao, exigirEscrita: async () => { if(consulta) throw new Error('Sem permissão'); return sessao; } },
    '../integrations/supabase/client.server': { supabaseAdmin: { rpc: async (nome, params) => {
      chamadas.push({nome,params}); return {data:uid(1),error:erro};
    } } },
  });
  return { ...api, chamadas };
}
test('servidor bloqueia consulta e deriva autor da sessão, sem aceitar autoria do navegador', async () => {
  const consulta = servidor(true);
  await assert.rejects(consulta.reclassificarRegistro({data:entrada()}),/permissão/);
  assert.equal(consulta.chamadas.length,0);
  const escrita = servidor();
  const id = await escrita.reclassificarRegistro({data:{...entrada(),autor:'Pessoa forjada'}});
  assert.equal(id,uid(1));
  assert.equal(escrita.chamadas[0].params.p_autor,'Pessoa da sessão');
  assert.deepEqual(escrita.chamadas[0].params.p_destinos,entrada().destinos);
});
test('conflito não retorna conversão bem sucedida', async () => {
  const s = servidor(false,{message:'O plano mudou. Atualize a prévia.'});
  await assert.rejects(s.reclassificarRegistro({data:entrada()}),/Atualize a prévia/);
});
function interfacePlano(readOnly, estados=[]) {
  let indice = 0;
  const mocks = {
    react: {...React,useRef:v=>({current:v}),useState: v => [indice < estados.length ? estados[indice++] : (indice++, v),()=>{}]},
    '@tanstack/react-query': {useQueryClient:()=>({}),useQuery:()=>({data:[],isPending:false})},
    '../../auth/authStore': {useAuth:()=>({readOnly})}, '../../store': {useStore:()=>({})},
    '../../reclassificacaoPlano.server': {},
    './PainelBase': {BotaoAcao:({children})=>React.createElement('button',null,children)},
  };
  const { ReclassificarRegistro } = carregar('src/app/components/plano/ReclassificarRegistro.tsx',mocks);
  return renderToStaticMarkup(React.createElement(ReclassificarRegistro,{tipo:'atividade',id:uid(1),aoConverter(){},aoOcupar(){}}));
}
test('consulta pode acessar dados anteriores e não recebe controle de conversão', () => {
  assert.ok(interfacePlano(false).includes('Alterar tipo'));
  const html=interfacePlano(true);
  assert.ok(!html.includes('Alterar tipo')); assert.ok(html.includes('Dados anteriores'));
});

function achar(no, condicao) {
  if(!no || typeof no !== 'object') return null;
  if(Array.isArray(no)) { for(const n of no) { const r=achar(n,condicao); if(r) return r; } return null; }
  if(condicao(no)) return no;
  return achar(no.props?.children,condicao);
}
test('fluxo exige revisão, envia destinos escolhidos e bloqueia confirmação duplicada', async () => {
  const estado=[], refs=[]; let cursor=0, refCursor=0;
  const chamadas=[], ocupacoes=[], aberturas=[];
  let resolver;
  const pendente=new Promise(ok=>{resolver=ok;});
  const previa={tipo:'meta',id:uid(1),nome:'Meta errada',projeto:1,token:'b'.repeat(32),
    registros:[{tipo:'meta',id:uid(2),nome:'Meta correta',pai:null},{tipo:'meta',id:uid(3),nome:'Outra meta',pai:null},
      {tipo:'etapa',id:uid(12),nome:'Etapa de destino',pai:uid(2)}],
    dependencias:[{chave:'etapas:'+uid(11),id:uid(11),tabela:'etapas',grupo:'Etapa',nome:'Primeira etapa'},
      {chave:'etapas:'+uid(14),id:uid(14),tabela:'etapas',grupo:'Etapa',nome:'Segunda etapa'}]};
  const mocks={
    react:{...React,useState:inicial=>{const i=cursor++; if(!(i in estado)) estado[i]=inicial; return [estado[i],v=>{estado[i]=typeof v==='function'?v(estado[i]):v;}];},
      useRef:inicial=>{const i=refCursor++; return refs[i]??(refs[i]={current:inicial});}},
    '@tanstack/react-query':{useQueryClient:()=>({invalidateQueries:async()=>{}}),useQuery:({queryKey})=>({data:queryKey[0]==='reclassificacao'?previa:[],isPending:false})},
    '../../auth/authStore':{useAuth:()=>({readOnly:false})},
    '../../store':{useStore:()=>({reclassificarPlano:async d=>{chamadas.push(d);await pendente;return uid(1);}})},
    '../../reclassificacaoPlano.server':{}, sonner:{toast:{success(){}}},
  };
  const {ReclassificarRegistro}=carregar('src/app/components/plano/ReclassificarRegistro.tsx',mocks);
  const render=()=>{cursor=0;refCursor=0;return ReclassificarRegistro({tipo:'meta',id:uid(1),aoOcupar:v=>ocupacoes.push(v),aoConverter:(...a)=>aberturas.push(a)});};
  let arvore=render();
  achar(arvore,n=>n.props?.aoClicar&&n.props.children?.includes?.(' Alterar tipo')).props.aoClicar();
  arvore=render();
  // Há duas etapas e cada uma pode ir para uma meta diferente.
  const campos=[]; (function coletar(n){if(!n||typeof n!=='object')return;if(Array.isArray(n))return n.forEach(coletar);if(n.props?.rotulo==='Meta de destino')campos.push(n);coletar(n.props?.children);})(arvore);
  assert.equal(campos.length,2);
  achar(campos[0],n=>n.type==='select').props.onChange({target:{value:uid(2)}});
  achar(campos[1],n=>n.type==='select').props.onChange({target:{value:uid(3)}});
  achar(achar(arvore,n=>n.props?.rotulo==='Meta que receberá este registro'),n=>n.type==='select').props.onChange({target:{value:uid(2)}});
  achar(arvore,n=>n.props?.rotulo==='Motivo da correção').props.children.props.aoMudar('Corrigir nível informado');
  arvore=render();
  achar(arvore,n=>n.props?.aoClicar&&n.props.children==='Revisar alteração').props.aoClicar();
  assert.equal(chamadas.length,0,'Revisar não grava');
  arvore=render();
  const confirmar=achar(arvore,n=>n.type==='button'&&n.props.children==='Confirmar mudança de tipo');
  assert.ok(confirmar); confirmar.props.onClick(); confirmar.props.onClick();
  assert.equal(chamadas.length,1,'Dois cliques não duplicam a requisição');
  assert.deepEqual(chamadas[0].destinos,[{chave:'etapas:'+uid(11),destinoId:uid(2)},{chave:'etapas:'+uid(14),destinoId:uid(3)}]);
  resolver();await new Promise(ok=>setImmediate(ok));
  assert.deepEqual(aberturas,[['etapa',uid(1)]]);
  assert.equal(ocupacoes[0],true);assert.equal(ocupacoes.at(-1),false);
});
