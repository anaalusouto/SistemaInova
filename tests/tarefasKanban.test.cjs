const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function ambiente({ consulta = false, semSessao = false, tabelas = {} } = {}) {
  const escritas = []; const leituras = []; const cache = new Map();
  const db = { from(tabela) {
    let payload; let operacao; let inicio = 0; let fim = 499; let single = false;
    const b = {
      select() { return this; }, order() { return this; }, range(a,z) { inicio=a;fim=z;return this; }, eq() { return this; },
      insert(p) { payload=p;operacao='insert';return this; }, update(p) { payload=p;operacao='update';return this; }, delete() { operacao='delete';return this; },
      single() { single=true;return this; },
      then(resolve,reject) {
        if (operacao) escritas.push({ tabela, operacao, payload }); else leituras.push({ tabela, inicio, fim });
        return Promise.resolve({ data: operacao ? (single ? { id:'nova' } : []) : (tabelas[tabela] ?? []).slice(inicio,fim+1), error:null }).then(resolve,reject);
      },
    }; return b;
  } };
  function carregar(nome) {
    const arquivo = path.resolve(__dirname,'..',nome.endsWith('.ts') ? nome : `${nome}.ts`);
    if (cache.has(arquivo)) return cache.get(arquivo).exports;
    const mod={exports:{}};cache.set(arquivo,mod);
    const code=ts.transpileModule(fs.readFileSync(arquivo,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
    new Function('require','module','exports',code)(r=>{
      if (r==='@tanstack/react-start') return { createServerFn:()=>{const fn={validator(){return fn;},handler(h){return a=>h(a);}};return fn;} };
      if (r.endsWith('/client.server')) return { supabaseAdmin:db };
      if (r==='./sessao.server') {
        const sessao=async()=>{if(semSessao)throw new Error('Sem sessão');return {login:'criadora',displayName:'Pessoa que abriu',role:consulta?'visualizador':'admin'};};
        return {exigirSessao:sessao,exigirEscrita:async()=>{const u=await sessao();if(consulta)throw new Error('Sem permissão');return u;}};
      }
      return carregar(path.resolve(path.dirname(arquivo),r));
    },mod,mod.exports);return mod.exports;
  }
  return { carregar, escritas, leituras, api:carregar('src/app/tarefasGestao.server') };
}
const projeto={id:7,nome:'Projeto',code:'P7'};
const atividade={id:'a1',nome:'Comprar material',responsavel:'Maria',status:'A iniciar',criado_por:'João',criado_por_login:'joao',
  etapas:{nome:'Etapa',metas:{nome:'Meta',projetos:projeto}},
  tarefas:[{id:'t1',titulo:'Pedir cotação',criado_por:'Paula'}],
  proximo_passo:'Acompanhar fornecedor',proximo_passo_responsavel:'José',proximo_passo_criado_por:'Ana'};

test('todas as fontes atribuídas entram no quadro com ID estável, origem e criador distintos do responsável',()=>{
  const {tarefasVinculadas}=ambiente().carregar('src/app/lib/tarefasKanban');
  const fontes={atividades:[atividade,{...atividade,id:'removida',excluido_em:'2026-10-01'}, {id:'sem',nome:'Sem atribuição',tarefas:[]}],
    encaminhamentos:[{id:'e1',descricao:'Enviar documento',responsavel:'Maria',criado_por:'Bruno',comunidade_id:'org',status:'Concluído'}],
    riscos:[{id:'r1',estrategia_mitigacao:'Solicitar alternativa',responsavel:'José',resposta_criada_por:'Carla',status:'Em mitigação',projetos:projeto}],
    atribuicoes:[{id:'m1',atividade_id:'a1',atividades:atividade,atribuido_para_login:'outra',atribuido_para_nome:'Outra pessoa',atribuido_por_nome:'Luis'}]};
  const antes=structuredClone(fontes); const cards=tarefasVinculadas(fontes);
  assert.equal(cards.length,6); assert.equal(new Set(cards.map(t=>t.id)).size,6);
  assert.equal(cards.find(t=>t.id==='atividade:a1').atribuidoPorNome,'João');
  assert.equal(cards.find(t=>t.id==='subtarefa:t1').atribuidoParaNome,'Maria');
  assert.equal(cards.find(t=>t.id==='subtarefa:t1').atribuidoPorNome,'Paula');
  assert.equal(cards.find(t=>t.id==='acao:a1').atribuidoPorNome,'Ana');
  assert.equal(cards.find(t=>t.id==='encaminhamento:e1').status,'concluido');
  assert.equal(cards.find(t=>t.id==='risco:r1').atribuidoPorNome,'Carla');
  assert.deepEqual(fontes,antes,'Exibir no Kanban não altera os registros de origem');
});

test('reatribuir, concluir e remover na origem atualiza o cartão; autor desconhecido não é inventado',()=>{
  const {tarefasVinculadas}=ambiente().carregar('src/app/lib/tarefasKanban');
  const a={...atividade,tarefas:[],proximo_passo:'',criado_por:null};
  const primeiro=tarefasVinculadas({atividades:[a]})[0];
  a.responsavel='José';a.status='Concluído';
  const atualizado=tarefasVinculadas({atividades:[a]})[0];
  assert.equal(atualizado.id,primeiro.id);assert.equal(atualizado.status,'concluido');
  assert.equal(atualizado.atribuidoParaNome,'José');assert.equal(atualizado.atribuidoPorNome,'Não informado');
  a.responsavel='';assert.equal(tarefasVinculadas({atividades:[a]}).length,0);
});

test('nomes ambíguos ficam visíveis sem associar conta errada; menção à mesma atividade e pessoa não duplica o cartão',()=>{
  const {tarefasVinculadas,resolverPessoasDoQuadro}=ambiente().carregar('src/app/lib/tarefasKanban');
  const cards=tarefasVinculadas({atividades:[{...atividade,tarefas:[],proximo_passo:''}],atribuicoes:[{
    id:'m1',atividade_id:'a1',atividades:atividade,atribuido_para_login:'maria',atribuido_para_nome:'Maria',atribuido_por_nome:'João'}]});
  assert.equal(resolverPessoasDoQuadro(cards,[{login:'maria',name:'Maria'}]).length,1);
  assert.equal(resolverPessoasDoQuadro(cards,[{login:'maria1',name:'Maria'},{login:'maria2',name:'Maria'}])[0].atribuidoParaLogin,'nome:maria');
});

test('atividades administrativas e subatividades entram com autoria original e herança explícita de responsável',()=>{
  const {tarefasAdministrativas}=ambiente().carregar('src/app/lib/tarefasKanban');
  const blocos=[{bloco:'Interno',entregas:[{entrega:'Entrega',atividades:[{id:1,atividade:'Preparar visita',responsavel:'Ana',criadoPor:'Paula',status:'No prazo',inicio:'',fim:'',subatividades:[{id:2,atividade:'Reservar transporte',criadoPor:'Bruno',status:'Não iniciado',inicio:'',fim:''}]}]}]}];
  const cards=tarefasAdministrativas(blocos);
  assert.equal(cards.length,2);assert.equal(cards[1].atribuidoParaNome,'Ana');assert.equal(cards[1].atribuidoPorNome,'Bruno');
  assert.equal(cards[0].origem.tipo,'administrativo');
});

test('API usa criador da sessão e não aceita autoria forjada pelo cliente',async()=>{
  const a=ambiente();await a.api.criarTarefaGestao({data:{titulo:'Nova',atribuidoParaLogin:'maria',atribuidoParaNome:'Maria',atribuidoPorLogin:'falso',atribuidoPorNome:'Falso',dataEntrada:'2026-10-14',dataLimite:'2026-10-20',criticidade:1,projetoIds:[]}});
  const row=a.escritas.find(e=>e.tabela==='tarefas_gestao').payload;
  assert.equal(row.atribuido_por_login,'criadora');assert.equal(row.atribuido_por_nome,'Pessoa que abriu');
});

test('consulta não cria, altera, move ou exclui; leitura sem sessão é recusada',async()=>{
  const a=ambiente({consulta:true});
  for (const nome of ['criarTarefaGestao','editarTarefaGestao','moverTarefaGestao','atualizarStatusTarefaGestao','excluirTarefaGestao']) await assert.rejects(a.api[nome]({data:{id:'t'}}),/permissão/);
  assert.deepEqual(a.escritas,[]);
  await assert.rejects(ambiente({semSessao:true}).api.listarTarefasGestao(),/sessão/);
});

test('leitura pagina todas as fontes e não perde tarefas além do limite padrão da API',async()=>{
  const a=ambiente({tabelas:{atividades:Array.from({length:1001},(_,i)=>({...atividade,id:`a${i}`,tarefas:[],proximo_passo:''}))}});
  const cards=await a.api.listarTarefasGestao();
  assert.equal(cards.length,1001);assert.ok(a.leituras.some(l=>l.tabela==='atividades'&&l.inicio===1000));
});
