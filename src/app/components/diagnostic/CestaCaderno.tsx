import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarProdutos, criarProduto, listarCategoriasProduto, criarCategoriaProduto, type Produto, type CategoriaProduto } from '../../diagnosticos.server';
import { PORTFOLIO_CESTA, PERFIL_CESTA, AVALIACOES_OPERACAO, IMPLANTACAO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import type { RegistroCaderno } from '../../diagnostic/cadernoCria';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
import { CestaProdutosTab } from './CestaProdutosTab';
import { DadosComerciaisCesta } from './DadosComerciaisCesta';

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const COLUNAS_CESTA = [
  { grupo: 'Produção e qualidade', itens: [['C02','Procedimentos'],['C03','Qualidade'],['C04','Perdas'],['C10','Lotes e rastreabilidade'],['C11','Validade'],['C12','Embalagem']] },
  { grupo: 'Gestão, mercado e riscos', itens: [['C01','Planejamento'],['C05','Custos'],['C06','Comercialização'],['C07','Logística'],['C08','Resultados'],['C09','Clima']] },
] as const;
const DIFICULDADES = [
  { titulo: 'Limitações para produzir', codigos: ['CP08'], tipo: 'Dificuldade relatada' },
  { titulo: 'Barreiras para vender', codigos: ['CP09'], tipo: 'Dificuldade relatada' },
  { titulo: 'Clima e produção', codigos: ['CP10','CP11'], tipo: 'Dificuldade relatada' },
  { titulo: 'Logística e acesso', codigos: ['CP12'], tipo: 'Dificuldade relatada' },
] as const;
const COMPLETAR = [
  { titulo: 'Preço e custos', codigos: ['CP18'], tipo: 'Informação a completar' },
  { titulo: 'Licenças e verificações', codigos: ['CP13','CP14'], tipo: 'Informação a completar' },
  { titulo: 'Resíduos e impactos', codigos: ['CP15'], tipo: 'Informação a completar' },
  { titulo: 'Dados disponíveis', codigos: ['CP19'], tipo: 'Dados disponíveis' },
] as const;
const situacaoLabel = (v: string | null) => v === 'Funcionamento' ? 'Em funcionamento' : v === 'Implantação' ? 'Em implantação' : v === 'Futuro' ? 'De interesse futuro' : 'Não informado';
const mesAtivo = (p: Produto, mes: number) => p.safra.estado === 'ano_inteiro' || p.safra.estado === 'sazonal' && p.safra.intervalos.some(i => i.inicio <= i.fim ? mes >= i.inicio && mes <= i.fim : mes >= i.inicio || mes <= i.fim);

const SIM_IDS = {
  mel: '10000000-0000-4000-8000-000000000001', cera: '10000000-0000-4000-8000-000000000002',
  cupuacu: '10000000-0000-4000-8000-000000000003', acai: '10000000-0000-4000-8000-000000000004',
  visita: '10000000-0000-4000-8000-000000000005',
} as const;
const SIM_CATEGORIES: CategoriaProduto[] = [
  {id:'20000000-0000-4000-8000-000000000001',diagnosticoId:'',nome:'Produtos apícolas'},
  {id:'20000000-0000-4000-8000-000000000002',diagnosticoId:'',nome:'Polpas de frutas'},
  {id:'20000000-0000-4000-8000-000000000003',diagnosticoId:'',nome:'Serviços'},
];
const simProduct = (id: string, nome: string, categoriaId: string, safra: Produto['safra'] = {estado:'nao_informada',intervalos:[]}): Produto => ({
  id, diagnosticoId:'simulation', nome, cadeia:null, categoriaId, unidadeMedida:null, safra, canaisComerciais:[], etapasEconomicas:[],
  statusPreenchimento:'em_preenchimento', respostas:{}, criadoEm:'', atualizadoEm:'',
});
const SIM_PRODUCTS: Produto[] = [
  simProduct(SIM_IDS.mel,'Mel de abelhas',SIM_CATEGORIES[0].id,{estado:'sazonal',intervalos:[{inicio:3,fim:6}]}),
  simProduct(SIM_IDS.cera,'Cera de abelha',SIM_CATEGORIES[0].id,{estado:'sazonal',intervalos:[{inicio:3,fim:6}]}),
  simProduct(SIM_IDS.cupuacu,'Polpa de cupuaçu',SIM_CATEGORIES[1].id),
  simProduct(SIM_IDS.acai,'Polpa de açaí',SIM_CATEGORIES[1].id),
  simProduct(SIM_IDS.visita,'Visita educativa',SIM_CATEGORIES[2].id),
];
function registroSimulado(diagnosticoId: string, codigo: string, contexto: string, valor: string | null, extra: Partial<RegistroCaderno['resposta']> = {}): RegistroCaderno {
  return { diagnostico_id:diagnosticoId, codigo, contexto, resposta:{valor,selecoes:[],relato:'',fonte:'SIMULAÇÃO · dados fictícios',respondentes:'Exemplo fictício',...extra}, versao:1, atualizado_em:'', atualizado_por:'simulação' };
}
function dadosSimulados(diagnosticoId: string): RegistroCaderno[] {
  const rows: RegistroCaderno[] = [];
  const codigosVisuais = ['C02','C03','C04','C10','C11','C12','C01','C05','C06','C07','C08','C09'];
  const avaliacoes = [
    [SIM_IDS.mel,['3','4','2','3','3','2','3','2','3','2','2','1']],
    [SIM_IDS.cera,['3','4','2','3','3','2','3','2','1','2','2','1']],
  ] as const;
  for (const [id, valores] of avaliacoes) {
    codigosVisuais.forEach((codigo,i)=>rows.push(registroSimulado(diagnosticoId,codigo,id,valores[i])));
  }
  const perfis: [string,string,string][] = [
    [SIM_IDS.mel,'PR_CODIGO','PR01'],[SIM_IDS.mel,'PR_OPERACAO','Apicultura · exemplo fictício'],[SIM_IDS.mel,'PR_SITUACAO','Funcionamento'],[SIM_IDS.mel,'PR_PAPEL','Executa'],[SIM_IDS.mel,'CP03','3'],
    [SIM_IDS.cera,'PR_CODIGO','PR02'],[SIM_IDS.cera,'PR_OPERACAO','Apicultura · exemplo fictício'],[SIM_IDS.cera,'PR_SITUACAO','Funcionamento'],[SIM_IDS.cera,'PR_PAPEL','Executa'],[SIM_IDS.cera,'CP03','2'],
    [SIM_IDS.cupuacu,'PR_CODIGO','PR03'],[SIM_IDS.cupuacu,'PR_OPERACAO','Casa de Polpas · exemplo fictício'],[SIM_IDS.cupuacu,'PR_SITUACAO','Implantação'],[SIM_IDS.cupuacu,'PR_PAPEL','Viabiliza'],
    [SIM_IDS.acai,'PR_CODIGO','PR04'],[SIM_IDS.acai,'PR_OPERACAO','Casa de Polpas · exemplo fictício'],[SIM_IDS.acai,'PR_SITUACAO','Implantação'],[SIM_IDS.acai,'PR_PAPEL','Viabiliza'],
    [SIM_IDS.visita,'PR_CODIGO','PR05'],[SIM_IDS.visita,'PR_OPERACAO','Serviço educativo · exemplo fictício'],[SIM_IDS.visita,'PR_SITUACAO','Futuro'],[SIM_IDS.visita,'PR_PAPEL','Viabiliza'],
  ];
  for (const [id,codigo,valor] of perfis) rows.push(registroSimulado(diagnosticoId,codigo,id,valor));
  rows.push(registroSimulado(diagnosticoId,'CP05',SIM_IDS.mel,'', {valor:'Mel disponível de abril a dezembro com estoque. Produção concentrada em março a junho.'}));
  rows.push(registroSimulado(diagnosticoId,'CP05',SIM_IDS.cera,'', {valor:'Disponibilidade conforme encomendas.'}));
  rows.push(registroSimulado(diagnosticoId,'CP08',SIM_IDS.mel,null,{selecoes:['Equipamentos','Capital de giro'],relato:'Equipamentos e capital de giro limitam o envase.'}));
  rows.push(registroSimulado(diagnosticoId,'CP09',SIM_IDS.mel,null,{selecoes:['Logística','Preço'],relato:'Logística e preço dificultam acesso ao varejo.'}));
  rows.push(registroSimulado(diagnosticoId,'CP10',SIM_IDS.mel,null,{selecoes:['Excesso de chuva'],relato:'Excesso de chuva em período demonstrativo.'}));
  rows.push(registroSimulado(diagnosticoId,'CP11',SIM_IDS.mel,'Alteração da safra observada. Causa climática não verificada.'));
  rows.push(registroSimulado(diagnosticoId,'CP12',SIM_IDS.mel,'Dificuldade de logística por conta da distância das terras para o local de beneficiamento.'));
  rows.push(registroSimulado(diagnosticoId,'CP18',SIM_IDS.mel,'Algumas condições'));
  rows.push(registroSimulado(diagnosticoId,'CP13',SIM_IDS.mel,'Exigências de rotulagem a conferir — exemplo'));
  rows.push(registroSimulado(diagnosticoId,'CP14',SIM_IDS.mel,'Análise laboratorial prevista para lote demonstrativo'));
  rows.push(registroSimulado(diagnosticoId,'CP15',SIM_IDS.mel,'Cera residual reaproveitada em oficina demonstrativa'));
  rows.push(registroSimulado(diagnosticoId,'CP19',SIM_IDS.mel,'Volume anual de mel'));
  for (const [i,status] of ['Disponível','Em andamento','Disponível','Ainda não iniciado','Em andamento','Em andamento','Não informado'].entries()) {
    rows.push(registroSimulado(diagnosticoId,`IM0${i+1}`,'OP01',status,{relato:'Grupo e proposta de operação — fictícios',fonte:'Dezembro de 2026 — exemplo',respondentes:'Responsável fictício'}));
  }
  return rows;
}

export function CestaCaderno(props: ContextoCaderno) {
  const client = useQueryClient();
  const consulta = useQuery({ queryKey: ['diagnostico-produtos', props.diagnosticoId], queryFn: () => listarProdutos({ data: { diagnosticoId: props.diagnosticoId } }) });
  const categoriasQuery = useQuery({ queryKey: ['cesta-categorias', props.diagnosticoId], queryFn: () => listarCategoriasProduto({ data: { diagnosticoId: props.diagnosticoId } }) });
  const caderno = useCaderno(props);
  const [selecionado, setSelecionado] = useState('');
  const [nome, setNome] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [visao, setVisao] = useState<'produtos'|'perfis'|'implantacao'>('produtos');
  const [simulacao, setSimulacao] = useState(false);
  const criar = useMutation({ mutationFn: () => criarProduto({ data: { diagnosticoId: props.diagnosticoId, nome: nome.trim(), cadeia: null } }), onSuccess: p => { void client.invalidateQueries({ queryKey: ['diagnostico-produtos', props.diagnosticoId] }); setSelecionado(p.id); setNome(''); } });
  const criarCategoria = useMutation({ mutationFn: () => criarCategoriaProduto({ data: { diagnosticoId: props.diagnosticoId, nome: novaCategoria } }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['cesta-categorias', props.diagnosticoId] }); setNovaCategoria(''); } });
  if (consulta.isLoading || caderno.isLoading || categoriasQuery.isLoading) return <p role="status">Carregando Cesta de Produtos…</p>;
  if (consulta.error || caderno.error || categoriasQuery.error) return <p role="alert">{consulta.error?.message || caderno.error?.message || categoriasQuery.error?.message} <button className="underline" type="button" onClick={() => { void consulta.refetch(); void caderno.refetch(); void categoriasQuery.refetch(); }}>Tentar novamente</button></p>;

  const produtos = simulacao ? SIM_PRODUCTS : consulta.data ?? [];
  const categorias = simulacao ? SIM_CATEGORIES : categoriasQuery.data ?? [];
  const registros = simulacao ? dadosSimulados(props.diagnosticoId) : caderno.data ?? [];
  const fichaSelecionada = simulacao ? undefined : produtos.find(p => p.id === selecionado);
  const valor = (codigo: string, contexto: string) => registros.find(r => r.codigo === codigo && r.contexto === contexto)?.resposta.valor ?? null;
  const resposta = (codigo: string, contexto: string) => registros.find(r => r.codigo === codigo && r.contexto === contexto)?.resposta;
  const categoriaNome = (p: Produto) => categorias.find(c => c.id === p.categoriaId)?.nome ?? 'Sem categoria';
  const operacoes = new Set(produtos.map(p => valor('PR_OPERACAO', p.id)).filter(Boolean));
  const funcionamento = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Funcionamento');
  const implantacao = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Implantação');
  const futuros = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Futuro');
  const gruposCategoria = [...new Set([...categorias.map(c=>c.nome),...produtos.map(categoriaNome)])].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const gruposImplantacao = [...new Map(implantacao.map(p=>{
    const operacao=valor('PR_OPERACAO',p.id);
    return [operacao||`produto:${p.id}`,{operacao,produtos:operacao?implantacao.filter(q=>valor('PR_OPERACAO',q.id)===operacao):[p]}] as const;
  })).values()];
  const voltarDadosReais = () => { setSimulacao(false); setSelecionado(''); };
  const selecionarProduto = (id: string) => {
    if (simulacao) return;
    setSelecionado(id);
    window.setTimeout(()=>document.getElementById('ficha-cesta-produto')?.scrollIntoView({behavior:'smooth',block:'start'}),0);
  };
  const legenda = (codigo: string) => AVALIACOES_OPERACAO.find(i=>i.codigo===codigo)?.opcoes?.filter(o=>/^[1-4]$/.test(o.valor)) ?? [];
  const valorIndicador = (codigo: string, id: string) => valor(codigo,id);
  const produtoRealOuFalso = fichaSelecionada;

  return <div className="space-y-5" id="cestaPanel">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-5">
      <div><h3 className="text-2xl font-bold">Cesta de Produtos</h3><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Visualização construída somente com valores definidos no mapeamento. Lacunas permanecem como não informadas ou pendentes.</p></div>
      <span className="rounded-full border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground">Sem nota geral por produto</span>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-3">
    {!simulacao ? <button type="button" aria-pressed={false} onClick={()=>{setSimulacao(true);setSelecionado('');}} className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Ver simulação com dados fictícios</button> : <button type="button" aria-pressed={true} onClick={voltarDadosReais} className="rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">Voltar aos dados reais</button>}
    </div>
    {simulacao&&<aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="note"><strong>SIMULAÇÃO · DADOS FICTÍCIOS</strong><p className="mt-1">Produtos, notas, relatos, meses e valores abaixo são exemplos. Não pertencem à organização selecionada, não são salvos e não entram nos relatórios reais. Para editar ou exportar, volte aos dados reais.</p></aside>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Stat valor={produtos.length} rotulo={simulacao?'produtos fictícios':'produtos/serviços mapeados'}/>
      <Stat valor={operacoes.size} rotulo={simulacao?'operações fictícias':'operações/grupos'}/>
      <Stat valor={funcionamento.length} rotulo="em funcionamento"/>
      <Stat valor={implantacao.length} rotulo="em implantação"/>
      <Stat valor={futuros.length} rotulo={simulacao?'interesse futuro':'de interesse futuro'}/>
    </div>

    <nav className="flex flex-wrap gap-2" aria-label="Visualizações da Cesta" role="tablist">
      {([['produtos','Produtos e serviços'],['perfis','Perfis e calendário'],['implantacao','Implantação']] as const).map(([id,label])=><button key={id} role="tab" aria-selected={visao===id} type="button" onClick={()=>setVisao(id)} className={`rounded-full border px-4 py-2 text-sm ${visao===id?'border-primary bg-primary/10 font-semibold text-primary':'text-muted-foreground hover:bg-muted'}`}>{label}</button>)}
    </nav>

    {visao==='produtos'&&<section className="space-y-4" role="tabpanel">
      <div><h4 className="text-lg font-semibold">Produtos e serviços mapeados</h4><p className="text-xs text-muted-foreground">1–4 níveis registrados · — não coletado · ? pendente · N/A não aplicável · Heterogêneo: práticas distintas. Sem nota geral por produto ou operação.</p></div>
      <details className="rounded-lg border bg-card px-3 py-2"><summary className="cursor-pointer text-xs font-medium">Critérios dos níveis 1–4 por indicador</summary><div className="mt-3 grid gap-2 md:grid-cols-2">{COLUNAS_CESTA.flatMap(g=>g.itens.map(([codigo,nome])=><article key={codigo} className="rounded-md border p-2 text-xs"><strong>{codigo} · {nome}</strong><ul className="mt-1 list-inside list-disc text-muted-foreground">{legenda(codigo).map(o=><li key={o.valor}><b>{o.valor}</b>: {o.descricao}</li>)}</ul></article>))}</div></details>
      <div className="overflow-x-auto rounded-xl border bg-card"><table className="min-w-[1080px] w-full border-collapse text-left text-xs"><caption className="sr-only">Indicadores da operação por produto, agrupados por categoria</caption><thead className="bg-muted/70"><tr><th rowSpan={2} className="sticky left-0 z-10 min-w-56 border-b bg-muted p-3">Produto / serviço e operação</th>{COLUNAS_CESTA.map(g=><th key={g.grupo} colSpan={g.itens.length} className="border-b p-3 text-center">{g.grupo}</th>)}</tr><tr>{COLUNAS_CESTA.flatMap(g=>g.itens.map(([code,label])=><th key={code} className="min-w-24 border-b p-2 align-bottom"><span className="block">{label}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{code}</span></th>))}</tr></thead><tbody>
        {gruposCategoria.map(cat=>{const itens=produtos.filter(p=>categoriaNome(p)===cat);return <FragmentCategoria key={cat} nome={cat} quantidade={itens.length} colSpan={13}>{itens.map(p=><tr key={p.id} className="border-t hover:bg-muted/30"><th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left"><button type="button" className="text-primary underline" onClick={()=>selecionarProduto(p.id)}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button><span className="mt-1 block font-normal text-muted-foreground">{valor('PR_OPERACAO',p.id)||'Operação não informada'} · {situacaoLabel(valor('PR_SITUACAO',p.id))}</span></th>{COLUNAS_CESTA.flatMap(g=>g.itens.map(([code])=>{const v=valorIndicador(code,p.id);const criterio=legenda(code).find(o=>o.valor===v)?.descricao;return <td key={code} className="border-l p-2 text-center"><span title={v&&criterio?`${code} · ${criterio}`:`${code}: ${v||'pendente'}`} aria-label={`${code}: ${v||'pendente'}${criterio?` — ${criterio}`:''}`} className={`inline-flex min-w-7 justify-center rounded px-2 py-1 font-semibold ${v&&/^[1-4]$/.test(v)?`text-white ${v==='1'?'bg-[#a9473e]':v==='2'?'bg-[#c8833c]':v==='3'?'bg-[#d3b84a]':'bg-[#588268]'}`:'bg-muted text-muted-foreground'}`}>{v==='H'?'H':v==='NA'?'N/A':v==='NC'?'—':v==='NS'?'NS':v==='D'?'D':v||'?'}</span></td>}))}</tr>)}</FragmentCategoria>})}
        {!produtos.length&&<tr><td colSpan={13} className="p-8 text-center text-muted-foreground">Nenhum produto ou serviço cadastrado.</td></tr>}
      </tbody></table></div>
      {funcionamento.length>0&&<section className="space-y-4 rounded-xl border bg-card p-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">O que pede atenção na operação</p><h4 className="mt-1 text-lg font-semibold">Dificuldades em destaque</h4><p className="mt-1 text-xs text-muted-foreground">Relatos e opções registrados para produtos em funcionamento. Selecione o produto para abrir a ficha completa.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{DIFICULDADES.map(g=><AttentionCard key={g.titulo} grupo={g} produtos={funcionamento} resposta={resposta} codigoProduct={valor} aoAbrir={selecionarProduto}/>)}</div>
        <div><h4 className="text-lg font-semibold">Informações para completar a análise</h4><p className="mt-1 text-xs text-muted-foreground">Pontos registrados que precisam de confirmação ou acompanhamento.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{COMPLETAR.map(g=><AttentionCard key={g.titulo} grupo={g} produtos={funcionamento} resposta={resposta} codigoProduct={valor} aoAbrir={selecionarProduto}/>)}</div>
        {funcionamento.some(p=>resposta('CP19',p.id)?.valor)&&<div className="rounded-lg border p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acompanhamento da operação · dados disponíveis</p><ul className="mt-2 space-y-2">{funcionamento.flatMap(p=>{const r=resposta('CP19',p.id);return r?.valor?[<li key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm"><span><strong>{r.valor}</strong><span className="ml-2 text-xs text-muted-foreground">{p.nome}{r.relato?` · ${r.relato}`:''}</span></span><button type="button" className="text-xs text-primary underline" onClick={()=>selecionarProduto(p.id)}>Consultar dados registrados ↗</button></li>]:[]})}</ul></div>}</section>}
    </section>}

    {visao==='perfis'&&<section className="space-y-4" role="tabpanel">
      <div><h4 className="text-lg font-semibold">Portfólio · perfil CP01–CP07</h4><p className="text-xs text-muted-foreground">Categorias e operações são dimensões distintas. A operação informa quem produz ou beneficia; a categoria agrupa produtos semelhantes.</p></div>
      {gruposCategoria.map(cat=>{const itens=produtos.filter(p=>categoriaNome(p)===cat);return <section key={cat} className="overflow-x-auto rounded-xl border bg-card"><h5 className="border-b bg-muted/70 p-3 font-semibold">{cat} <span className="text-xs font-normal text-muted-foreground">· {itens.length} produto(s)</span></h5>{itens.length>0?<table className="min-w-[700px] w-full text-left text-xs"><thead><tr>{['Produto / serviço','Operação','Situação','Papel da organização','Interesse · CP03'].map(t=><th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{itens.map(p=><tr key={p.id} className="border-t"><th className="p-3 text-left font-medium"><button type="button" className="text-primary underline" onClick={()=>selecionarProduto(p.id)}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button></th><td className="p-3">{valor('PR_OPERACAO',p.id)||'Não informado'}</td><td className="p-3">{situacaoLabel(valor('PR_SITUACAO',p.id))}</td><td className="p-3">{valor('PR_PAPEL',p.id)||'Não informado'}</td><td className="p-3">{valor('CP03',p.id)||'Não informado'}</td></tr>)}</tbody></table>:<p className="p-3 text-xs text-muted-foreground">Nenhum produto nesta categoria.</p>}
        <div className="border-t p-3"><div><h6 className="text-sm font-semibold">Calendário da Cesta</h6><p className="mt-1 text-xs text-muted-foreground">Safra por produto, inclusive intervalos que atravessam dezembro. A ausência de informação não significa ausência de produção.</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span><b className="text-primary">●</b> Safra / disponível</span><span><b>—</b> Fora da safra informada</span><span><b>?</b> Safra não informada</span><span>Disponível o ano inteiro permanece identificado na linha do produto.</span></div></div><table className="mt-3 w-full min-w-[650px] text-center text-xs"><thead><tr><th className="p-2 text-left">Produto</th>{MESES.map(m=><th key={m} className="p-2">{m}</th>)}</tr></thead><tbody>{itens.map(p=><tr key={p.id} className="border-t"><th className="p-2 text-left font-medium">{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}<span className="block font-normal text-muted-foreground">{p.safra.estado==='nao_informada'?'Safra não informada':p.safra.estado==='ano_inteiro'?'Disponível o ano inteiro':p.safra.intervalos.length?'Safra sazonal':'Safra sazonal · intervalo não informado'}</span></th>{MESES.map((m,j)=><td key={m} className="p-1"><span aria-label={`${p.nome}, ${m}: ${p.safra.estado==='nao_informada'?'safra não informada':mesAtivo(p,j+1)?'em safra':'fora da safra'}`} className={`inline-flex min-w-7 justify-center rounded px-1.5 py-1 ${mesAtivo(p,j+1)?'bg-primary/15 font-semibold text-primary':'text-muted-foreground'}`}>{p.safra.estado==='nao_informada'?'?':mesAtivo(p,j+1)?'●':'—'}</span></td>)}</tr>)}</tbody></table></div>
      </section>})}
      {produtos.length===0&&<p className="rounded-xl border p-6 text-sm text-muted-foreground">Nenhum produto no portfólio.</p>}
      <section className="rounded-xl border bg-card p-4"><h4 className="text-lg font-semibold">Disponibilidade para venda / serviço · CP05</h4><p className="mt-1 text-xs text-muted-foreground">Disponibilidade, estoques e restrições são relatos associados a cada produto.</p><div className="mt-3 space-y-2">{funcionamento.map(p=><article key={p.id} className="grid gap-1 border-t pt-2 text-sm sm:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]"><strong>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</strong><p className="text-muted-foreground">{resposta('CP05',p.id)?.valor||'Não informado'}</p></article>)}</div></section>
    </section>}

    {visao==='implantacao'&&<section className="space-y-4" role="tabpanel"><div><h4 className="text-lg font-semibold">Preparação da implantação · IM01–IM07</h4><p className="text-xs text-muted-foreground">Disponível · Em andamento · Ainda não iniciado · Não informado · N/A. Condições de implantação não recebem notas de funcionamento.</p></div>
      {gruposImplantacao.map((g,i)=><article key={g.operacao||i} className="rounded-xl border bg-card p-4"><h5 className="font-semibold">{g.operacao||'Operação não informada'}</h5><p className="mt-1 text-xs text-muted-foreground">{g.produtos.map(p=>`${valor('PR_CODIGO',p.id)||'Produto'} · ${p.nome} · ${categoriaNome(p)}`).join(' / ')}</p>{simulacao?<div className="mt-3 overflow-x-auto"><table className="min-w-[760px] w-full text-left text-xs"><thead><tr>{['Condição / produtos','Situação','O que existe','O que falta','Próximo passo','Responsável / prazo'].map(t=><th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{IMPLANTACAO_CADERNO.map((item,j)=>{const r=resposta(item.codigo,'OP01');return <tr key={item.codigo} className="border-t"><th className="p-2">{item.codigo} · {item.texto}<span className="block font-normal text-muted-foreground">PR03; PR04</span></th><td className="p-2">{r?.valor||'Não informado'}</td><td className="p-2">{r?.relato||'Não informado'}</td><td className="p-2">Concluir preparação deste aspecto</td><td className="p-2">Revisar condições com a equipe demonstrativa</td><td className="p-2">Responsável fictício<br/>{r?.fonte||'Prazo não informado'}</td></tr>})}</tbody></table></div>:g.operacao?<CadernoItens {...props} itens={IMPLANTACAO_CADERNO} contexto={g.operacao}/>:<p className="mt-3 text-sm text-muted-foreground">Informe o código OP para agrupar as etapas de preparação compartilhadas por esta operação.</p>}</article>)}
      {futuros.length>0&&<section className="rounded-xl border bg-card p-4"><h5 className="font-semibold">Interesse futuro · sem nota</h5><p className="mt-1 text-xs text-muted-foreground">Produtos futuros permanecem no portfólio e não recebem avaliação de operação.</p><ul className="mt-2 space-y-2">{futuros.map(p=><li key={p.id} className="border-t pt-2 text-sm"><button type="button" className="text-primary underline" onClick={()=>selecionarProduto(p.id)}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button><span className="ml-2 text-xs text-muted-foreground">{categoriaNome(p)} · operação {valor('PR_OPERACAO',p.id)||'não informada'}</span></li>)}</ul></section>}
      {implantacao.length===0&&futuros.length===0&&<p className="rounded-xl border p-6 text-sm text-muted-foreground">Nenhum produto em implantação ou de interesse futuro.</p>}
    </section>}

    {produtoRealOuFalso&&<section id="ficha-cesta-produto" className="scroll-mt-4 space-y-4 rounded-xl border bg-card p-4" aria-label={`Ficha ${produtoRealOuFalso.nome}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-muted-foreground">{categoriaNome(produtoRealOuFalso)} · Operação {valor('PR_OPERACAO',produtoRealOuFalso.id)||'não informada'}</p><h4 className="text-lg font-semibold">{valor('PR_CODIGO',produtoRealOuFalso.id)||'Produto'} · {produtoRealOuFalso.nome}</h4></div><button type="button" className="text-xs underline" onClick={()=>setSelecionado('')}>Fechar ficha</button></div><CadernoItens {...props} itens={PORTFOLIO_CESTA} contexto={produtoRealOuFalso.id}/><DadosComerciaisCesta key={produtoRealOuFalso.id} produto={produtoRealOuFalso} categorias={categorias} readOnly={props.readOnly}/>
      {valor('PR_SITUACAO',produtoRealOuFalso.id)==='Funcionamento'?<><h5 className="text-lg font-semibold">Perfil e avaliação da operação atual</h5><p className="text-sm text-muted-foreground">Os níveis 1–4 se aplicam a cada indicador da operação, com critérios próprios no instrumento. Não há classificação da categoria nem cálculo de nota geral do produto.</p><CadernoItens {...props} itens={[...PERFIL_CESTA,...AVALIACOES_OPERACAO]} contexto={produtoRealOuFalso.id}/></>:valor('PR_SITUACAO',produtoRealOuFalso.id)==='Implantação'?<><h5 className="text-lg font-semibold">Preparação da implantação</h5>{valor('PR_OPERACAO',produtoRealOuFalso.id)?<CadernoItens {...props} itens={IMPLANTACAO_CADERNO} contexto={valor('PR_OPERACAO',produtoRealOuFalso.id)!}/>:<p className="text-sm text-muted-foreground">Informe o código OP para registrar a preparação pela operação responsável.</p>}</>:<p className="text-sm text-muted-foreground">Produto futuro ou ainda sem situação definida: registrar no portfólio, sem pontuar a operação.</p>}
    </section>}
    {!props.readOnly&&!simulacao&&<details className="rounded-xl border bg-card p-3"><summary className="cursor-pointer text-sm font-semibold">Cadastrar produto e categoria</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><form className="flex items-end gap-2" onSubmit={e=>{e.preventDefault();if(nome.trim()&&!criar.isPending)criar.mutate();}}><label className="min-w-0 flex-1 text-xs">Novo produto ou serviço<input aria-label="Novo produto ou serviço" required maxLength={500} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome no portfólio" className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"/></label><button disabled={criar.isPending} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Adicionar</button></form><form className="flex items-end gap-2" onSubmit={e=>{e.preventDefault();if(novaCategoria.trim()&&!criarCategoria.isPending)criarCategoria.mutate();}}><label className="min-w-0 flex-1 text-xs">Nova categoria<input maxLength={120} value={novaCategoria} onChange={e=>setNovaCategoria(e.target.value)} placeholder="Polpas de frutas, Frutas in natura, Farinhas, Hortaliças" className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"/></label><button disabled={!novaCategoria.trim()||criarCategoria.isPending} className="rounded-lg border px-3 py-2 text-sm">Cadastrar categoria</button></form>{(criar.error||criarCategoria.error)&&<p role="alert" className="text-xs text-destructive sm:col-span-2">{criar.error?.message||criarCategoria.error?.message}</p>}</div></details>}
    {!simulacao&&<details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Consultar respostas da Cesta anterior — instrumento legado</summary><p className="my-3 text-xs text-muted-foreground">Dados anteriores preservados para consulta. Não foram convertidos em notas ou respostas do Caderno.</p><CestaProdutosTab diagnosticoId={props.diagnosticoId} readOnly/> </details>}
  </div>;
}

function FragmentCategoria({nome,quantidade,colSpan,children}:{nome:string;quantidade:number;colSpan:number;children:ReactNode}) {
  return <>{<tr className="border-t bg-muted/50"><th colSpan={colSpan} className="p-2 text-left font-semibold">{nome}<span className="ml-2 text-xs font-normal text-muted-foreground">· {quantidade} produto(s)</span></th></tr>}{quantidade?children:<tr><td colSpan={colSpan} className="p-3 text-xs text-muted-foreground">Nenhum produto nesta categoria.</td></tr>}</>;
}
function AttentionCard({grupo,produtos,resposta,codigoProduct,aoAbrir}:{grupo:{titulo:string;codigos:readonly string[];tipo:string};produtos:Produto[];resposta:(codigo:string,contexto:string)=>RegistroCaderno['resposta']|undefined;codigoProduct:(codigo:string,contexto:string)=>string|null;aoAbrir:(id:string)=>void}) {
  const ocorrencias=produtos.flatMap(p=>grupo.codigos.flatMap(code=>{const r=resposta(code,p.id);if(!r||(!r.valor&&!r.selecoes.length&&!r.relato))return[];return [{p,code,r}];}));
  return <article className="rounded-lg border p-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{grupo.tipo}</span><h5 className="mt-1 text-sm font-semibold">{grupo.titulo}</h5>{ocorrencias.length?<ul className="mt-2 space-y-2 text-xs">{ocorrencias.slice(0,5).map((x,i)=><li key={`${x.p.id}-${x.code}-${i}`} className="border-t pt-2"><strong>{x.r.selecoes.length?x.r.selecoes.join(', '):x.r.valor||'Relato registrado'}</strong>{x.r.relato&&<p className="mt-1 text-muted-foreground">{x.r.relato}</p>}<p className="mt-1 text-muted-foreground">{codigoProduct('PR_OPERACAO',x.p.id)||x.p.nome}</p><button type="button" onClick={()=>aoAbrir(x.p.id)} className="mt-1 text-primary underline">Ver relato completo ↗</button></li>)}</ul>:<p className="mt-2 text-xs text-muted-foreground">Não informado</p>}</article>;
}
function Stat({valor,rotulo}:{valor:number;rotulo:string}) { return <article className="rounded-xl border bg-card p-4"><strong className="block text-3xl font-bold text-primary">{valor}</strong><span className="mt-1 block text-sm font-medium">{rotulo}</span></article>; }
