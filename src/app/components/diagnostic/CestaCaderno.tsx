import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarProdutos, criarProduto, listarCategoriasProduto, criarCategoriaProduto, type Produto, type CategoriaProduto } from '../../diagnosticos.server';
import { PORTFOLIO_CESTA, PERFIL_CESTA, AVALIACOES_OPERACAO, IMPLANTACAO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import type { RegistroCaderno } from '../../diagnostic/cadernoCria';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
import { DadosComerciaisCesta } from './DadosComerciaisCesta';
import { usePendenciaModulo } from '../PendenciasModulo';
import { navegarSemPendencias } from '../PendenciasModulo';
import { situacaoIndicador } from '../../diagnostic/situacaoIndicador';
import type { ItemCaderno } from '../../diagnostic/catalog/cadernoCria';
import { lerRelatoImplantacao, lerResponsavelImplantacao } from '../../diagnostic/implantacao';

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const TONS_NIVEL: Record<string,string> = {
  '1': 'border-[#a9473e] bg-[#a9473e] text-white',
  '2': 'border-[#c8833c] bg-[#c8833c] text-white',
  '3': 'border-[#d3b84a] bg-[#d3b84a] text-[#28364b]',
  '4': 'border-[#588268] bg-[#588268] text-white',
};
const TON_ESTADO: Record<string,string> = {
  ausente: 'border-[#d5dde7] bg-[#f1f4f8] text-[#526579]',
  pendente: 'border-[#e7c98b] bg-[#fff7e7] text-[#76521d]',
  neutro: 'border-[#d5dde7] bg-[#f1f4f8] text-[#526579]',
  divergente: 'border-[#c9b8dc] bg-[#f5f0fa] text-[#644d80]',
  heterogeneo: 'border-[#b7c9df] bg-[#eef4fb] text-[#395d83]',
  na: 'border-[#b9c7d5] bg-[#eaf0f5] text-[#40576e]',
};
const classeIndicador = (valor: string | null, existe: boolean) => {
  if (valor && TONS_NIVEL[valor]) return TONS_NIVEL[valor];
  if (!existe) return TON_ESTADO.ausente;
  if (!valor) return TON_ESTADO.pendente;
  if (valor === 'NA') return TON_ESTADO.na;
  if (valor === 'D') return TON_ESTADO.divergente;
  if (valor === 'H') return TON_ESTADO.heterogeneo;
  return TON_ESTADO.neutro;
};
const classeSituacaoProduto = (valor: string | null) => valor === 'Funcionamento'
  ? 'border-[#b9d3c1] bg-[#edf5ef] text-[#385f45]'
  : valor === 'Implantação' ? 'border-[#c2d2e4] bg-[#edf3fa] text-[#345577]'
  : valor === 'Futuro' ? 'border-[#d7d1e2] bg-[#f3f1f7] text-[#5d5372]'
  : TON_ESTADO.neutro;
const classeSituacaoImplantacao = (valor: string | null | undefined) => valor === 'Disponível'
  ? 'border-[#b9d3c1] bg-[#edf5ef] text-[#385f45]'
  : valor === 'Em andamento' ? 'border-[#c2d2e4] bg-[#edf3fa] text-[#345577]'
  : valor === 'Ainda não iniciado' ? 'border-[#d5dde7] bg-[#f1f4f8] text-[#526579]'
  : valor === 'N/A' ? TON_ESTADO.na
  : TON_ESTADO.pendente;
const COLUNAS_CESTA = [
  { grupo: 'Produção e qualidade', itens: [['C02','Procedimentos'],['C03','Qualidade'],['C04','Perdas'],['C10','Lotes e rastreabilidade'],['C11','Validade'],['C12','Embalagem']] },
  { grupo: 'Gestão, mercado e riscos', itens: [['C01','Planejamento'],['C05','Custos'],['C06','Comercialização'],['C07','Logística'],['C08','Resultados'],['C09','Clima']] },
] as const;
const DIFICULDADES = [
  { titulo: 'Limitações Produtivas', codigos: ['CP08'], tipo: 'Dificuldade relatada' },
  { titulo: 'Limitações comerciais', codigos: ['CP09'], tipo: 'Dificuldade relatada' },
  { titulo: 'Impactos Climáticos', codigos: ['CP10'], tipo: 'Dificuldade relatada' },
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

export function CestaCaderno(props: ContextoCaderno & { bloqueado?: boolean; aoEditarImplantacao?: (operacao: string, codigo: string) => void }) {
  const client = useQueryClient();
  const consulta = useQuery({ queryKey: ['diagnostico-produtos', props.diagnosticoId], queryFn: () => listarProdutos({ data: { diagnosticoId: props.diagnosticoId } }) });
  const categoriasQuery = useQuery({ queryKey: ['cesta-categorias', props.diagnosticoId], queryFn: () => listarCategoriasProduto({ data: { diagnosticoId: props.diagnosticoId } }) });
  const caderno = useCaderno(props);
  const [selecionado, setSelecionado] = useState('');
  const [nome, setNome] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [visao, setVisao] = useState<'produtos'|'perfis'|'implantacao'>('produtos');
  const [simulacao, setSimulacao] = useState(false);
  const [editarFicha, setEditarFicha] = useState(false);
  const [registroAberto, setRegistroAberto] = useState<{ produtoId: string; codigo: string; contexto?: string } | null>(null);
  const [editarRegistro, setEditarRegistro] = useState(false);
  const criar = useMutation({ mutationFn: () => criarProduto({ data: { diagnosticoId: props.diagnosticoId, nome: nome.trim(), cadeia: null } }), onSuccess: p => { void client.invalidateQueries({ queryKey: ['diagnostico-produtos', props.diagnosticoId] }); setSelecionado(p.id); setNome(''); } });
  const criarCategoria = useMutation({ mutationFn: () => criarCategoriaProduto({ data: { diagnosticoId: props.diagnosticoId, nome: novaCategoria } }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['cesta-categorias', props.diagnosticoId] }); setNovaCategoria(''); } });
  usePendenciaModulo(!props.readOnly && (Boolean(nome.trim()) || Boolean(novaCategoria.trim()) || criar.isPending || criarCategoria.isPending));
  if (consulta.isLoading || caderno.isLoading || categoriasQuery.isLoading) return <p role="status">Carregando Cesta de Produtos…</p>;
  if (consulta.error || caderno.error || categoriasQuery.error) return <p role="alert">{consulta.error?.message || caderno.error?.message || categoriasQuery.error?.message} <button className="underline" type="button" onClick={() => { void consulta.refetch(); void caderno.refetch(); void categoriasQuery.refetch(); }}>Tentar novamente</button></p>;

  const produtos = simulacao ? SIM_PRODUCTS : consulta.data ?? [];
  const categorias = simulacao ? SIM_CATEGORIES : categoriasQuery.data ?? [];
  const registros = simulacao ? dadosSimulados(props.diagnosticoId) : caderno.data ?? [];
  const valor = (codigo: string, contexto: string) => registros.find(r => r.codigo === codigo && r.contexto === contexto)?.resposta.valor ?? null;
  const resposta = (codigo: string, contexto: string) => registros.find(r => r.codigo === codigo && r.contexto === contexto)?.resposta;
  const fichaSelecionada = simulacao ? undefined : produtos.find(p => p.id === selecionado && (valor('PR_SITUACAO', p.id) === 'Funcionamento' || visao === 'implantacao' && ['Implantação','Futuro'].includes(valor('PR_SITUACAO', p.id) ?? '')));
  const categoriaNome = (p: Produto) => categorias.find(c => c.id === p.categoriaId)?.nome ?? 'Sem categoria';
  const nomeOperacao = (p: Produto) => typeof p.respostas.operacaoNome === 'string' ? p.respostas.operacaoNome : '';
  const funcionamento = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Funcionamento');
  const implantacao = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Implantação');
  const futuros = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Futuro');
  // Registros de implantação e interesse futuro permanecem salvos, mas não entram
  // nas visualizações comparativas e de calendário da Cesta.
  const produtosEmOperacao = funcionamento;
  const operacoes = new Set(produtosEmOperacao.map(p => valor('PR_OPERACAO', p.id)).filter(Boolean));
  const gruposCategoria = [...new Set(produtosEmOperacao.map(categoriaNome))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const gruposImplantacao = [...new Map(implantacao.map(p=>{
    const operacao=valor('PR_OPERACAO',p.id);
    return [operacao||`produto:${p.id}`,{operacao,produtos:operacao?implantacao.filter(q=>valor('PR_OPERACAO',q.id)===operacao):[p]}] as const;
  })).values()];
  const voltarDadosReais = () => navegarSemPendencias(!!props.bloqueado, () => { setSimulacao(false); setSelecionado(''); });
  const selecionarProduto = (id: string) => {
    if (simulacao) return;
    navegarSemPendencias(!!props.bloqueado, () => {
      setSelecionado(id);
      window.setTimeout(()=>document.getElementById('ficha-cesta-produto')?.scrollIntoView({behavior:'smooth',block:'start'}),0);
    });
  };
  const legenda = (codigo: string) => AVALIACOES_OPERACAO.find(i=>i.codigo===codigo)?.opcoes?.filter(o=>/^[1-4]$/.test(o.valor)) ?? [];
  const valorIndicador = (codigo: string, id: string) => valor(codigo,id);
  const produtoRealOuFalso = fichaSelecionada;
  const produtoRegistro = registroAberto ? produtos.find(p => p.id === registroAberto.produtoId) : undefined;
  const itemRegistro = registroAberto ? [...PERFIL_CESTA, ...AVALIACOES_OPERACAO, ...IMPLANTACAO_CADERNO].find(i => i.codigo === registroAberto.codigo) : undefined;
  const contextoRegistro = registroAberto?.contexto ?? registroAberto?.produtoId;
  const respostaRegistro = registroAberto && contextoRegistro ? resposta(registroAberto.codigo, contextoRegistro) : undefined;

  return <div className="space-y-5 rounded-2xl bg-white p-3 text-[#172b4d] sm:p-5 [&_button:focus-visible]:outline [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[#486c92] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-55" id="cestaPanel">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-2xl font-bold">Cesta de Produtos</h3><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Visualização construída somente com valores definidos no mapeamento. Lacunas permanecem como não informadas ou pendentes.</p></div>
      <span className="rounded-full border border-[#d5dde7] bg-white px-3 py-1.5 text-xs text-[#526579]">Sem nota geral por produto</span>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-3">
    {!simulacao ? <button type="button" aria-pressed={false} onClick={()=>navegarSemPendencias(!!props.bloqueado,()=>{setSimulacao(true);setSelecionado('');})} className="rounded-lg border border-[#c6d2df] bg-white px-4 py-2 text-sm font-medium text-[#304c6b] transition-colors hover:bg-[#edf3f8]">Ver simulação com dados fictícios</button> : <button type="button" aria-pressed={true} onClick={voltarDadosReais} className="rounded-lg border border-[#c6d2df] bg-white px-4 py-2 text-sm font-medium text-[#304c6b] transition-colors hover:bg-[#edf3f8]">Voltar aos dados reais</button>}
    </div>
    {simulacao&&<aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" role="note"><strong>SIMULAÇÃO · DADOS FICTÍCIOS</strong><p className="mt-1">Produtos, notas, relatos, meses e valores abaixo são exemplos. Não pertencem à organização selecionada, não são salvos e não entram nos relatórios reais. Para editar ou exportar, volte aos dados reais.</p></aside>}

    <p className="text-xs text-[#5f7187]">As comparações, o portfólio e o calendário abaixo consideram somente produtos e operações em funcionamento.</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <Stat valor={produtosEmOperacao.length} rotulo={simulacao?'produtos fictícios em operação':'produtos/serviços em funcionamento'} tone="base"/>
      <Stat valor={operacoes.size} rotulo={simulacao?'operações fictícias':'operações/grupos'} tone="base"/>
    </div>

    <nav className="flex flex-wrap gap-2" aria-label="Visualizações da Cesta" role="tablist">
      {([['produtos','Produtos e serviços'],['perfis','Perfis e calendário'],['implantacao','Implantação']] as const).map(([id,label])=><button key={id} role="tab" aria-selected={visao===id} type="button" onClick={()=>{if(visao!==id)navegarSemPendencias(!!props.bloqueado,()=>{setVisao(id);setSelecionado('');});}} className={`rounded-lg border px-4 py-2 text-sm transition-colors ${visao===id?'border-[#8c9aaa] bg-[#f1f3f5] font-semibold text-[#172b4d] shadow-sm':'border-[#d5dde7] bg-white text-[#526579] hover:bg-[#f5f6f7]'}`}>{label}</button>)}
    </nav>

    {visao==='produtos'&&<section className="space-y-4" role="tabpanel">
      <div><h4 className="text-lg font-semibold text-[#172b4d]">Produtos e serviços mapeados</h4><p className="text-xs text-[#5f7187]">Sem nota geral por produto ou operação. Cores mostram estados por indicador; os códigos e rótulos permanecem visíveis.</p><div className="mt-2 flex flex-wrap gap-1.5"><LegendaEstado rotulo="1 · Nível 1" classe={TONS_NIVEL['1']}/><LegendaEstado rotulo="2 · Nível 2" classe={TONS_NIVEL['2']}/><LegendaEstado rotulo="3 · Nível 3" classe={TONS_NIVEL['3']}/><LegendaEstado rotulo="4 · Nível 4" classe={TONS_NIVEL['4']}/><LegendaEstado rotulo="— Ausente" classe={TON_ESTADO.ausente}/><LegendaEstado rotulo="? Pendente" classe={TON_ESTADO.pendente}/><LegendaEstado rotulo="NC · Não coletado" classe={TON_ESTADO.neutro}/><LegendaEstado rotulo="NS · Não sabe" classe={TON_ESTADO.neutro}/><LegendaEstado rotulo="N/A" classe={TON_ESTADO.na}/><LegendaEstado rotulo="D · Divergente" classe={TON_ESTADO.divergente}/><LegendaEstado rotulo="H · Heterogêneo" classe={TON_ESTADO.heterogeneo}/></div></div>
      <details className="rounded-lg border bg-card px-3 py-2"><summary className="cursor-pointer text-xs font-medium">Critérios dos níveis 1–4 por indicador</summary><div className="mt-3 grid gap-2 md:grid-cols-2">{COLUNAS_CESTA.flatMap(g=>g.itens.map(([codigo,nome])=><article key={codigo} className="rounded-md border p-2 text-xs"><strong>{codigo} · {nome}</strong><ul className="mt-1 list-inside list-disc text-muted-foreground">{legenda(codigo).map(o=><li key={o.valor}><b>{o.valor}</b>: {o.descricao}</li>)}</ul></article>))}</div></details>
      <div className="overflow-x-auto rounded-xl border bg-card"><table className="min-w-[1080px] w-full border-collapse text-left text-xs"><caption className="sr-only">Indicadores da operação por produto, agrupados por categoria</caption><thead className="bg-muted/70"><tr><th rowSpan={2} className="sticky left-0 z-10 min-w-56 border-b bg-muted p-3">Produto / serviço e operação</th>{COLUNAS_CESTA.map(g=><th key={g.grupo} colSpan={g.itens.length} className="border-b p-3 text-center">{g.grupo}</th>)}</tr><tr>{COLUNAS_CESTA.flatMap(g=>g.itens.map(([code,label])=><th key={code} className="min-w-24 border-b p-2 align-bottom"><span className="block">{label}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{code}</span></th>))}</tr></thead><tbody>
         {gruposCategoria.map(cat=>{const itens=produtosEmOperacao.filter(p=>categoriaNome(p)===cat);return <FragmentCategoria key={cat} nome={cat} quantidade={itens.length} colSpan={13}>{itens.map(p=><tr key={p.id} className="border-t hover:bg-muted/30"><th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left"><button type="button" className="text-primary underline" onClick={()=>{setEditarFicha(false);selecionarProduto(p.id);}}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button><span className="mt-1 block font-normal text-muted-foreground">{valor('PR_OPERACAO',p.id)||'Operação não informada'}{nomeOperacao(p)?` · ${nomeOperacao(p)}`:''}</span></th>{COLUNAS_CESTA.flatMap(g=>g.itens.map(([code])=>{
          const v=valorIndicador(code,p.id);
          const situacao=situacaoIndicador(resposta(code,p.id));
          const criterio=legenda(code).find(o=>o.valor===v)?.descricao;
          const rotulo=`${code}: ${situacao.texto}${criterio?` — ${criterio}`:''}`;
          return <td key={code} className="border-l border-[#e2e8f0] p-2 text-center"><button type="button" title={`${rotulo} · abrir registro`} aria-label={`Consultar ${code}, ${nomeOperacao(p)||p.nome}: ${situacao.texto}`} onClick={()=>setRegistroAberto({produtoId:p.id,codigo:code})} className={`inline-flex min-w-8 justify-center rounded-md border px-2 py-1 font-semibold transition-colors hover:brightness-95 ${classeIndicador(v,Boolean(resposta(code,p.id)))}`}>{situacao.simbolo}</button></td>;
        }))}</tr>)}</FragmentCategoria>})}
         {!produtosEmOperacao.length&&<tr><td colSpan={13} className="p-8 text-center text-muted-foreground">Nenhum produto em funcionamento para comparar.</td></tr>}
      </tbody></table></div>
      {funcionamento.length>0&&<section className="space-y-4 rounded-xl border bg-card p-4"><div><h4 className="text-lg font-semibold">Condições e atenção</h4><p className="mt-1 text-sm text-muted-foreground">O que pede atenção na operação</p><p className="mt-1 text-xs text-muted-foreground">Relatos e opções registrados para produtos em funcionamento.</p></div><div><h5 className="font-semibold">Dificuldades em destaque</h5><div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{DIFICULDADES.map(g=><AttentionCard key={g.titulo} grupo={g} produtos={funcionamento} resposta={resposta} codigoProduct={valor} nomeOperacao={nomeOperacao}/>)}</div></div>
        <div><h5 className="font-semibold">Informações para completar a análise</h5><p className="mt-1 text-xs text-muted-foreground">Pontos registrados que precisam de confirmação ou acompanhamento.</p><div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{COMPLETAR.filter(g=>g.titulo!=='Dados disponíveis').map(g=><AttentionCard key={g.titulo} grupo={g} produtos={funcionamento} resposta={resposta} codigoProduct={valor} nomeOperacao={nomeOperacao}/>)}</div></div>
        <div className="rounded-lg border p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acompanhamento da operação</p><h5 className="mt-1 font-semibold">Dados disponíveis</h5>{funcionamento.map(p=>{const r=resposta('CP19',p.id);return <div key={p.id} className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-sm"><span><strong>Volume de entrada / Quantidade de produto processado</strong><span className="ml-2 text-xs text-muted-foreground">{valor('PR_CODIGO',p.id)} · {p.nome} · {r?.valor||'Valores, unidade, período e fonte não informados'}</span></span><button type="button" className="text-xs text-primary underline" onClick={()=>setRegistroAberto({produtoId:p.id,codigo:'CP19'})}>Consultar dados registrados ↗</button></div>;})}</div></section>}
    </section>}

    {visao==='perfis'&&<section className="space-y-4" role="tabpanel">
      <div><h4 className="text-lg font-semibold">Portfólio · perfil CP01–CP07</h4><p className="text-xs text-muted-foreground">Categorias e operações são dimensões distintas. A operação informa quem produz ou beneficia; a categoria agrupa produtos semelhantes.</p></div>
       <div className="grid gap-3 md:grid-cols-1">{[{titulo:'Em funcionamento',lista:funcionamento,tone:'funcionamento'}].map(g=><article key={g.titulo} className="rounded-xl border border-[#cbded0] bg-[#f5f9f5] p-3"><h5 className="text-sm font-semibold text-[#172b4d]">{g.titulo} · {g.lista.length}</h5><ul className="mt-2 space-y-1 text-xs">{g.lista.map(p=><li key={p.id}><button type="button" className="rounded text-left text-[#304c6b] underline decoration-[#9aacc0] underline-offset-2 hover:text-[#172b4d]" onClick={()=>{setEditarFicha(false);selecionarProduto(p.id);}}>{valor('PR_CODIGO',p.id)} · {p.nome}</button></li>)}</ul></article>)}</div>
       {gruposCategoria.map(cat=>{const itens=produtosEmOperacao.filter(p=>categoriaNome(p)===cat);return <section key={cat} className="overflow-x-auto rounded-xl border border-[#d7e0ea] bg-white"><h5 className="border-b border-[#d7e0ea] bg-[#f0f4f8] p-3 font-semibold text-[#172b4d]">{cat} <span className="text-xs font-normal text-[#5f7187]">· {itens.length} produto(s)</span></h5>{itens.length>0?<table className="min-w-[700px] w-full text-left text-xs"><thead className="bg-[#f8fafc]"><tr>{['Produto / serviço','Operação','Situação','Papel da organização','Interesse · CP03'].map(t=><th key={t} className="p-3 text-[#40566e]">{t}</th>)}</tr></thead><tbody>{itens.map(p=><tr key={p.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]"><th className="p-3 text-left font-medium"><button type="button" className="text-[#304c6b] underline decoration-[#9aacc0] underline-offset-2 hover:text-[#172b4d]" onClick={()=>{setEditarFicha(false);selecionarProduto(p.id);}}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button></th><td className="p-3 text-[#40566e]">{valor('PR_OPERACAO',p.id)?`${valor('PR_OPERACAO',p.id)} · ${nomeOperacao(p)||'Nome do grupo não informado'}`:'Não informado'}</td><td className="p-3"><span className="inline-flex rounded-full border border-[#b9d3c1] bg-[#edf5ef] px-2 py-1 text-[11px] font-medium text-[#385f45]">Em funcionamento</span></td><td className="p-3 text-[#40566e]">{typeof p.respostas.papelOrganizacao==='string'?p.respostas.papelOrganizacao:valor('PR_PAPEL',p.id)||'Não informado'}</td><td className="p-3">{valor('CP03',p.id)||'Não informado'}</td></tr>)}</tbody></table>:<p className="p-3 text-xs text-[#687b90]">Nenhum produto nesta categoria.</p>}
        <div className="border-t border-[#e2e8f0] p-3"><div><h6 className="text-sm font-semibold text-[#172b4d]">Calendário da Cesta</h6><p className="mt-1 text-xs text-[#5f7187]">Safra por produto, inclusive intervalos que atravessam dezembro. A ausência de informação não significa ausência de produção. Selecione o produto ou mês para abrir a edição. A ficha atual registra período sazonal sem distinguir meses de pico dos regulares.</p><div className="mt-2 flex flex-wrap gap-1.5 text-[11px]"><LegendaEstado rotulo="Pico" classe="border-[#d9b3a8] bg-[#fbefec] text-[#8b493f]"/><LegendaEstado rotulo="Produção regular" classe="border-[#e4d59a] bg-[#fbf7e6] text-[#74601b]"/><LegendaEstado rotulo="Entressafra" classe="border-[#c7d9cb] bg-[#edf5ef] text-[#385f45]"/><LegendaEstado rotulo="Não informado" classe={TON_ESTADO.ausente}/><LegendaEstado rotulo="D · Divergente" classe={TON_ESTADO.divergente}/><LegendaEstado rotulo="Período sazonal (sem distinção)" classe="border-[#b8cce0] bg-[#eef4fa] text-[#395d83]"/></div></div><table className="mt-3 w-full min-w-[650px] text-center text-xs"><thead className="bg-[#f8fafc]"><tr><th className="p-2 text-left">Produto</th>{MESES.map(m=><th key={m} className="p-2 text-[#40566e]">{m}</th>)}</tr></thead><tbody>{itens.map(p=><tr key={p.id} className="border-t border-[#e2e8f0]"><th className="p-2 text-left font-medium"><button type="button" className="rounded text-left text-[#304c6b] hover:text-[#172b4d]" onClick={()=>{setEditarFicha(true);selecionarProduto(p.id);}}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}<span className="block font-normal text-[#687b90]">{p.safra.estado==='nao_informada'?(valor('CP04',p.id)==='Sazonal'?'Sazonal · meses não informados nas fichas':'Safra não informada'):p.safra.estado==='ano_inteiro'?'Disponível o ano inteiro':p.safra.intervalos.length?'Safra sazonal':'Safra sazonal · intervalo não informado'}</span></button></th>{MESES.map((m,j)=>{const ativa=mesAtivo(p,j+1);const desconhecida=p.safra.estado==='nao_informada';return <td key={m} className="p-1"><button type="button" disabled={simulacao} onClick={()=>{setEditarFicha(true);selecionarProduto(p.id);}} aria-label={`${p.nome}, ${m}: ${desconhecida?'não informado':ativa?'período sazonal informado':'fora do intervalo sazonal informado'}. Editar calendário`} className={`inline-flex min-w-8 justify-center rounded-md border px-1.5 py-1 font-semibold transition-colors hover:brightness-95 ${desconhecida?TON_ESTADO.ausente:ativa?'border-[#b8cce0] bg-[#eef4fa] text-[#395d83]':'border-[#c7d9cb] bg-[#edf5ef] text-[#385f45]'}`}>{desconhecida?'?':ativa?'●':'—'}</button></td>})}</tr>)}</tbody></table></div>
      </section>})}
       {produtosEmOperacao.length===0&&<p className="rounded-xl border p-6 text-sm text-muted-foreground">Nenhum produto em funcionamento para exibir nas análises da Cesta.</p>}
      <section className="rounded-xl border bg-card p-4"><h4 className="text-lg font-semibold">Disponibilidade para venda / serviço · CP05</h4><p className="mt-1 text-xs text-muted-foreground">Disponibilidade, estoques e restrições são relatos associados a cada produto.</p><div className="mt-3 space-y-2">{funcionamento.map(p=><article key={p.id} className="grid gap-1 border-t pt-2 text-sm sm:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]"><strong>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</strong><p className="text-muted-foreground">{resposta('CP05',p.id)?.valor||'Não informado'}</p></article>)}</div></section>
    </section>}

    {visao==='implantacao'&&<section className="space-y-4" role="tabpanel">
      <div><h4 className="text-lg font-semibold">Preparação da implantação · IM01–IM07</h4><p className="text-xs text-muted-foreground">Disponível · Em andamento · Ainda não iniciado · Não informado · N/A. Condições de implantação não recebem notas de funcionamento.</p></div>
      {gruposImplantacao.map((g,i)=><article key={g.operacao||i} className="rounded-xl border bg-card p-4">
        <h5 className="font-semibold">{(g.produtos[0] && nomeOperacao(g.produtos[0])) || g.operacao || 'Operação não informada'} — em implantação</h5>
        <div className="mt-2 flex flex-wrap gap-2">{g.produtos.map(p=><button key={p.id} type="button" className="rounded-md border px-3 py-1 text-left text-sm underline" onClick={()=>{setEditarFicha(false);selecionarProduto(p.id);}}>{valor('PR_CODIGO',p.id)||'Código não informado'} · {p.nome} · {p.cadeia||'Cadeia não informada'} · {situacaoLabel(valor('PR_SITUACAO',p.id))}</button>)}</div>
        {g.operacao && g.produtos[0] ? <TabelaImplantacao operacao={g.operacao} produtos={g.produtos} valor={valor} resposta={resposta} aoAbrir={codigo=>{setEditarRegistro(false);setRegistroAberto({produtoId:g.produtos[0].id,codigo,contexto:g.operacao!});}}/> : <p className="mt-3 text-sm text-muted-foreground">Operação não informada. Registre o código da operação para consultar suas condições.</p>}
      </article>)}
      {implantacao.length===0&&<p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Nenhum produto em implantação registrado nesta aplicação.</p>}
      <section className="rounded-xl border bg-card p-4"><h5 className="font-semibold">Interesse futuro</h5>
        {futuros.length ? <div className="mt-3 overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead><tr className="border-b">{['Cesta macro','Cadeia produtiva','Produtos detalhados'].map(t=><th key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{futuros.map(p=><tr key={p.id} className="border-b"><th scope="row" className="p-2 text-left"><button type="button" className="text-primary underline" onClick={()=>{setEditarFicha(false);selecionarProduto(p.id);}}>{valor('PR_CODIGO',p.id)||'Código não informado'} · {p.nome}</button></th><td className="p-2">{p.cadeia||'Não informado'}</td><td className="p-2">{typeof p.respostas.produtosDetalhados==='string' && p.respostas.produtosDetalhados.trim() ? p.respostas.produtosDetalhados : 'Não informado'}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-sm text-muted-foreground">Nenhum produto de interesse futuro registrado.</p>}
      </section>
    </section>}

    {produtoRealOuFalso&&<section id="ficha-cesta-produto" role="dialog" aria-modal="true" aria-label={`Ficha ${produtoRealOuFalso.nome}`} className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl space-y-4 overflow-y-auto border-l border-[#cbd5e1] bg-white p-4 shadow-2xl sm:p-6"><div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#d7e0ea] bg-white/95 pb-3 backdrop-blur"><div><p className="text-xs text-[#5f7187]">Categoria: {categoriaNome(produtoRealOuFalso)} · Operação {valor('PR_OPERACAO',produtoRealOuFalso.id)||'não informada'}{nomeOperacao(produtoRealOuFalso)?` · ${nomeOperacao(produtoRealOuFalso)}`:''}</p><h4 className="text-lg font-semibold text-[#172b4d]">{valor('PR_CODIGO',produtoRealOuFalso.id)||'Produto'} · {produtoRealOuFalso.nome}</h4><span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${classeSituacaoProduto(valor('PR_SITUACAO',produtoRealOuFalso.id))}`}>{situacaoLabel(valor('PR_SITUACAO',produtoRealOuFalso.id))}</span></div><button type="button" className="rounded-lg border border-[#c6d2df] bg-white px-3 py-2 text-xs text-[#304c6b] hover:bg-[#edf3f8]" onClick={()=>navegarSemPendencias(!!props.bloqueado,()=>{setSelecionado('');setEditarFicha(false);})}>Fechar ficha</button></div>
      <div className="grid gap-2 sm:grid-cols-2">{[
        ['Processamento/oferta',resposta('CP01',produtoRealOuFalso.id)?.valor||'Não informado'],['Quem realiza',resposta('CP01',produtoRealOuFalso.id)?.valor||'Não informado'],['Papel da organização',typeof produtoRealOuFalso.respostas.papelOrganizacao==='string'?produtoRealOuFalso.respostas.papelOrganizacao:valor('PR_PAPEL',produtoRealOuFalso.id)||'Não informado'],['Importância',resposta('CP02',produtoRealOuFalso.id)?.valor||'Não informado'],['Interesse · CP03',valor('CP03',produtoRealOuFalso.id)||'Não informado'],['Membros atuantes / período',resposta('CP03',produtoRealOuFalso.id)?.relato||'Não informado'],['Sazonalidade',resposta('CP04',produtoRealOuFalso.id)?.valor||'Não informado'],['Meses de pico, regulares e entressafra',produtoRealOuFalso.safra.estado==='nao_informada'?'Não informados nas fichas':produtoRealOuFalso.safra.intervalos.map(i=>`${MESES[i.inicio-1]}–${MESES[i.fim-1]}`).join('; ')||'Não informado'],['Disponibilidade',resposta('CP05',produtoRealOuFalso.id)?.valor||'Não informado'],['Canais atuais e pretendidos',resposta('CP06',produtoRealOuFalso.id)?.valor||'Não informado'],['Marca',lerCampoFicha(resposta('CP07',produtoRealOuFalso.id)?.valor,'Marca')],['Embalagem',lerCampoFicha(resposta('CP07',produtoRealOuFalso.id)?.valor,'Embalagem')],['Código de barras',lerCampoFicha(resposta('CP07',produtoRealOuFalso.id)?.valor,'Código de barras')],['Selos/reconhecimentos',lerCampoFicha(resposta('CP07',produtoRealOuFalso.id)?.valor,'Selos/reconhecimentos')],['Completude','Não informada'],
      ].map(([label,value])=><InfoFicha key={label} label={label} value={value}/>)}</div>
      {valor("PR_SITUACAO",produtoRealOuFalso.id)==="Funcionamento" && <section className="rounded-xl border border-[#d7e0ea] bg-[#f8fafc] p-3"><h5 className="text-sm font-semibold text-[#172b4d]">Indicadores C01–C12</h5><p className="mt-1 text-xs text-[#5f7187]">Estados usam as mesmas cores da tabela; selecione um código para consultar o registro.</p><div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">{COLUNAS_CESTA.flatMap(grupo=>grupo.itens.map(([codigo,label])=>{const r=resposta(codigo,produtoRealOuFalso.id);const v=r?.valor??null;const sit=situacaoIndicador(r);return <button type="button" key={codigo} title={`${sit.texto} · ${label}`} onClick={()=>setRegistroAberto({produtoId:produtoRealOuFalso.id,codigo})} className={`rounded-lg border p-2 text-left transition-colors hover:brightness-95 ${classeIndicador(v,Boolean(r))}`}><span className="block text-[10px] font-mono opacity-80">{codigo} · {label}</span><strong className="mt-1 block text-sm">{sit.simbolo}</strong></button>}))}</div><div className="mt-2 flex flex-wrap gap-1.5"><LegendaEstado rotulo="1" classe={TONS_NIVEL['1']}/><LegendaEstado rotulo="2" classe={TONS_NIVEL['2']}/><LegendaEstado rotulo="3" classe={TONS_NIVEL['3']}/><LegendaEstado rotulo="4" classe={TONS_NIVEL['4']}/><LegendaEstado rotulo="Pendente / ausente" classe={TON_ESTADO.ausente}/></div></section>}
      <button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={()=>setEditarFicha(v=>!v)}>{editarFicha?'Fechar edição':'Editar produto'}</button>
      {editarFicha&&<><CadernoItens {...props} itens={PORTFOLIO_CESTA} contexto={produtoRealOuFalso.id}/><DadosComerciaisCesta key={produtoRealOuFalso.id} produto={produtoRealOuFalso} categorias={categorias} readOnly={props.readOnly}/>
      {valor('PR_SITUACAO',produtoRealOuFalso.id)==='Funcionamento'?<><h5 className="text-lg font-semibold">Perfil e avaliação da operação atual</h5><p className="text-sm text-muted-foreground">Os níveis 1–4 se aplicam a cada indicador da operação, com critérios próprios no instrumento. Não há classificação da categoria nem cálculo de nota geral do produto.</p><CadernoItens {...props} itens={[...PERFIL_CESTA,...AVALIACOES_OPERACAO]} contexto={produtoRealOuFalso.id}/></>:valor('PR_SITUACAO',produtoRealOuFalso.id)==='Implantação'?<><h5 className="text-lg font-semibold">Preparação da implantação</h5>{valor('PR_OPERACAO',produtoRealOuFalso.id)?<CadernoItens {...props} itens={IMPLANTACAO_CADERNO} contexto={valor('PR_OPERACAO',produtoRealOuFalso.id)!}/>:<p className="text-sm text-muted-foreground">Informe o código OP para registrar a preparação pela operação responsável.</p>}</>:<p className="text-sm text-muted-foreground">Produto futuro ou ainda sem situação definida: registrar no portfólio, sem pontuar a operação.</p>}
      </>}
    </section>}
    {!props.readOnly&&!simulacao&&<details className="rounded-xl border bg-card p-3"><summary className="cursor-pointer text-sm font-semibold">Cadastrar produto e categoria</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><form className="flex items-end gap-2" onSubmit={e=>{e.preventDefault();if(nome.trim()&&!criar.isPending)criar.mutate();}}><label className="min-w-0 flex-1 text-xs">Novo produto ou serviço<input aria-label="Novo produto ou serviço" required maxLength={500} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome no portfólio" className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"/></label><button disabled={criar.isPending} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Adicionar</button></form><form className="flex items-end gap-2" onSubmit={e=>{e.preventDefault();if(novaCategoria.trim()&&!criarCategoria.isPending)criarCategoria.mutate();}}><label className="min-w-0 flex-1 text-xs">Nova categoria<input maxLength={120} value={novaCategoria} onChange={e=>setNovaCategoria(e.target.value)} placeholder="Polpas de frutas, Frutas in natura, Farinhas, Hortaliças" className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"/></label><button disabled={!novaCategoria.trim()||criarCategoria.isPending} className="rounded-lg border px-3 py-2 text-sm">Cadastrar categoria</button></form>{(criar.error||criarCategoria.error)&&<p role="alert" className="text-xs text-destructive sm:col-span-2">{criar.error?.message||criarCategoria.error?.message}</p>}</div></details>}
    {registroAberto&&produtoRegistro&&itemRegistro&&( /^IM0[1-7]$/.test(registroAberto.codigo) && contextoRegistro ? <RegistroImplantacaoDialog operacao={contextoRegistro} produtos={implantacao.filter(p=>valor('PR_OPERACAO',p.id)===contextoRegistro)} codigos={p=>valor('PR_CODIGO',p.id)||'Código não informado'} item={itemRegistro} resposta={respostaRegistro} simulado={simulacao} contextoCaderno={props} aoFechar={()=>navegarSemPendencias(!!props.bloqueado,()=>{setRegistroAberto(null);setEditarRegistro(false);})} aoEditar={()=>{if(props.aoEditarImplantacao){setRegistroAberto(null);props.aoEditarImplantacao(contextoRegistro,registroAberto.codigo);}else setEditarRegistro(true);}} editar={editarRegistro}/> : <RegistroCestaDialog produto={produtoRegistro} codigo={registroAberto.codigo} codigoProduto={valor('PR_CODIGO',produtoRegistro.id)||'Produto'} operacaoCodigo={valor('PR_OPERACAO',produtoRegistro.id)||'Não informada'} contexto={contextoRegistro??produtoRegistro.id} item={itemRegistro} resposta={respostaRegistro} simulado={simulacao} contextoCaderno={props} aoFechar={()=>{setRegistroAberto(null);setEditarRegistro(false);}} aoEditar={()=>setEditarRegistro(true)} editar={editarRegistro}/>)}

  </div>;
}

function FragmentCategoria({nome,quantidade,colSpan,children}:{nome:string;quantidade:number;colSpan:number;children:ReactNode}) {
  return <>{<tr className="border-t bg-muted/50"><th colSpan={colSpan} className="p-2 text-left font-semibold">{nome}<span className="ml-2 text-xs font-normal text-muted-foreground">· {quantidade} produto(s)</span></th></tr>}{quantidade?children:<tr><td colSpan={colSpan} className="p-3 text-xs text-muted-foreground">Nenhum produto nesta categoria.</td></tr>}</>;
}
function AttentionCard({grupo,produtos,resposta,codigoProduct,nomeOperacao}:{grupo:{titulo:string;codigos:readonly string[];tipo:string};produtos:Produto[];resposta:(codigo:string,contexto:string)=>RegistroCaderno['resposta']|undefined;codigoProduct:(codigo:string,contexto:string)=>string|null;nomeOperacao:(p:Produto)=>string}) {
  const ocorrencias=produtos.flatMap(p=>grupo.codigos.flatMap(code=>{const r=resposta(code,p.id);if(!r||(!r.valor&&!r.selecoes.length&&!r.relato))return[];return [{p,code,r}];}));
  const dificuldade=grupo.tipo==='Dificuldade relatada';
  return <article className={`rounded-xl border border-t-4 p-3 ${dificuldade?'border-[#ead1cd] border-t-[#b85b52] bg-[#fff8f7]':'border-[#d0dbe8] border-t-[#587a9f] bg-[#f7f9fc]'}`}><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${dificuldade?'border-[#e8c8c2] bg-[#fbecea] text-[#8b493f]':'border-[#cbd8e6] bg-[#edf3f8] text-[#405f81]'}`}><span aria-hidden="true" className="mr-1">{dificuldade?'●':'i'}</span>{grupo.tipo}</span><h5 className="mt-2 text-sm font-semibold text-[#172b4d]">{grupo.titulo}</h5>{ocorrencias.length?<ul className="mt-2 space-y-2 text-xs">{ocorrencias.map((x,i)=><li key={`${x.p.id}-${x.code}-${i}`} className="border-t border-[#e3e8ef] pt-2"><div className="flex flex-wrap gap-1">{x.r.selecoes.length?x.r.selecoes.map(tema=><span key={tema} className={`rounded-full border px-2 py-0.5 ${dificuldade?'border-[#ead8d5] bg-white text-[#72524e]':'border-[#d1dce8] bg-white text-[#506780]'}`}>{tema}</span>):<strong className="text-[#30445e]">{x.r.valor||'Relato registrado'}</strong>}</div>{x.r.relato&&<p className="mt-2 whitespace-pre-wrap text-[#526579]">{x.r.relato}</p>}<p className="mt-2 text-[#687b90]">{codigoProduct('PR_CODIGO',x.p.id)} · {x.p.nome} · {codigoProduct('PR_OPERACAO',x.p.id)}{nomeOperacao(x.p)?` · ${nomeOperacao(x.p)}`:''}</p></li>)}</ul>:<p className="mt-2 text-xs text-[#687b90]">Não informado</p>}</article>;
}
function RegistroCestaDialog({produto,codigo,codigoProduto,operacaoCodigo,contexto,item,resposta,simulado,contextoCaderno,aoFechar,aoEditar,editar}:{produto:Produto;codigo:string;codigoProduto:string;operacaoCodigo:string;contexto:string;item:ItemCaderno;resposta?:RegistroCaderno['resposta'];simulado:boolean;contextoCaderno:ContextoCaderno;aoFechar:()=>void;aoEditar:()=>void;editar:boolean}) {
  const operation = typeof produto.respostas.operacaoNome==='string' ? produto.respostas.operacaoNome : 'Nome do grupo não informado';
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-2 sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)aoFechar();}}><section role="dialog" aria-modal="true" aria-labelledby="registro-cesta-titulo" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl sm:max-h-[calc(100dvh-2.5rem)]"><header className="flex items-start justify-between gap-3 border-b p-4"><div><h4 id="registro-cesta-titulo" className="font-semibold">{codigo} · {item.texto}</h4><p className="mt-1 text-xs text-muted-foreground">{codigoProduto} · {produto.nome} · {operacaoCodigo} · {operation}</p></div><button type="button" className="rounded-lg border px-3 py-2 text-xs" onClick={aoFechar}>Fechar</button></header><div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"><div className="grid gap-2 sm:grid-cols-2"><InfoFicha label="ID do registro" value={`${codigo} · ${contexto}`}/><InfoFicha label="Operação" value={`${contexto.startsWith('OP')?contexto:operacaoCodigo} · ${operation}`}/><InfoFicha label="Produtos abrangidos" value={`${codigoProduto} · ${produto.nome}`}/><InfoFicha label="Grupo" value={item.grupo}/><InfoFicha label="Tema/opção" value={resposta?.selecoes.join('; ')||resposta?.valor||'Não informado'}/><InfoFicha label="Resposta relacionada" value={resposta?.valor||'Não informada'}/><InfoFicha label="Período/meses" value="Não informado no registro"/><InfoFicha label="Responsável/pendência" value={resposta?.respondentes||'Não informado'}/></div><div className="rounded-lg border p-3"><h5 className="text-xs font-semibold">Relato original</h5><p className="mt-1 whitespace-pre-wrap text-sm">{resposta?.relato||'Não informado'}</p></div><InfoFicha label="Fonte/página" value={resposta?.fonte||'Não informado'}/>{simulado&&<p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">SIMULAÇÃO · dados fictícios, sem edição e sem salvamento.</p>}{!simulado&&!contextoCaderno.readOnly&&<button type="button" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={aoEditar}>{editar?'Edição aberta':'Editar registro'}</button>}{editar&&!simulado&&<div className="border-t pt-3"><CadernoItens {...contextoCaderno} itens={[item]} contexto={contexto}/></div>}</div></section></div>;
}
function TabelaImplantacao({operacao,produtos,valor,resposta,aoAbrir}:{operacao:string;produtos:Produto[];valor:(codigo:string,contexto:string)=>string|null;resposta:(codigo:string,contexto:string)=>RegistroCaderno['resposta']|undefined;aoAbrir:(codigo:string)=>void}) {
  const codigos = produtos.map(p=>valor('PR_CODIGO',p.id)||'Código não informado').join('; ');
  return <div className="mt-3 overflow-x-auto rounded-lg border border-[#d7e0ea]"><table className="min-w-[1000px] w-full bg-white text-left text-xs"><thead className="bg-[#f0f4f8]"><tr>{['Condição / produtos','Situação','O que existe','O que falta','Próximo passo','Responsável / prazo'].map(t=><th key={t} scope="col" className="p-2 text-[#40566e]">{t}</th>)}</tr></thead><tbody>{IMPLANTACAO_CADERNO.map(item=>{
    const r=resposta(item.codigo,operacao); const campos=lerRelatoImplantacao(r?.relato||''); const pessoa=lerResponsavelImplantacao(r?.respondentes||'');
    return <tr key={item.codigo} className="border-t border-[#e2e8f0] align-top hover:bg-[#f8fafc]"><th scope="row" className="p-2 text-left"><button type="button" onClick={()=>aoAbrir(item.codigo)} className="text-primary underline">{item.codigo} · {item.texto}</button><span className="block font-normal text-[#687b90]">{codigos}</span></th><td className="p-2"><span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[11px] font-medium ${classeSituacaoImplantacao(r?.valor)}`}>{r?.valor||'Não informado'}</span></td><td className="p-2 whitespace-pre-wrap">{campos.existe||'Não informado'}</td><td className="p-2 whitespace-pre-wrap">{campos.falta||'Não informado'}</td><td className="p-2 whitespace-pre-wrap">{campos.proximo||'Não informado'}</td><td className="p-2 whitespace-pre-wrap">{pessoa.responsavel||'Não informado'}<br/>{pessoa.prazo||'Não informado'}</td></tr>;
  })}</tbody></table></div>;
}

function RegistroImplantacaoDialog({operacao,produtos,codigos,item,resposta,simulado,contextoCaderno,aoFechar,aoEditar,editar}:{operacao:string;produtos:Produto[];codigos:(p:Produto)=>string;item:ItemCaderno;resposta?:RegistroCaderno['resposta'];simulado:boolean;contextoCaderno:ContextoCaderno;aoFechar:()=>void;aoEditar:()=>void;editar:boolean}) {
  const campos=lerRelatoImplantacao(resposta?.relato||''); const pessoa=lerResponsavelImplantacao(resposta?.respondentes||'');
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-2 sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)aoFechar();}}>
    <section role="dialog" aria-modal="true" aria-labelledby="implantacao-titulo" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
      <header className="flex items-center justify-between gap-3 border-b p-4"><h4 id="implantacao-titulo" className="text-lg font-semibold">Implantação</h4><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={aoFechar}>Fechar</button></header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"><dl className="grid gap-2 sm:grid-cols-2">
        <InfoFicha label="Operação ID" value={operacao}/><InfoFicha label="Produtos abrangidos" value={produtos.map(p=>`${codigos(p)} · ${p.nome}`).join('; ')||'Não informado'}/>
        <InfoFicha label="Item" value={item.codigo}/><InfoFicha label="Aspecto" value={item.texto}/><InfoFicha label="Situação" value={resposta?.valor||'Não informado'}/>
        <InfoFicha label="O que existe" value={campos.existe||'Não informado'}/><InfoFicha label="O que falta" value={campos.falta||'Não informado'}/><InfoFicha label="Próximo passo" value={campos.proximo||'Não informado'}/>
        <InfoFicha label="Responsável" value={pessoa.responsavel||'Não informado'}/><InfoFicha label="Prazo" value={pessoa.prazo||'Não informado'}/>
      </dl>{campos.outros&&<InfoFicha label="Outras informações registradas" value={campos.outros}/>}
      {!simulado&&!contextoCaderno.readOnly&&<button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={aoEditar}>{editar?'Edição aberta':'Editar este registro'}</button>}
      {editar&&!simulado&&<CadernoItens {...contextoCaderno} itens={[item]} contexto={operacao} abertoInicial/>}
      </div>
    </section>
  </div>;
}
function InfoFicha({label,value}:{label:string;value:string}){return <div className="min-w-0 rounded-lg border bg-muted/20 p-2.5"><dt className="text-[11px] font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd></div>;}
function lerCampoFicha(texto:string|null|undefined,campo:string){const linha=texto?.split('\n').find(l=>l.toLocaleLowerCase('pt-BR').startsWith(`${campo.toLocaleLowerCase('pt-BR')}:`));return linha?.slice(linha.indexOf(':')+1).trim()||'Não informado';}
function LegendaEstado({rotulo,classe}:{rotulo:string;classe:string}) { return <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${classe}`}>{rotulo}</span>; }
function Stat({valor,rotulo,tone}:{valor:number;rotulo:string;tone:'base'|'funcionamento'|'implantacao'|'futuro'}) { const style=tone==='funcionamento'?'border-[#cbded0] bg-[#f5f9f5] text-[#385f45]':tone==='implantacao'?'border-[#c9d7e7] bg-[#f4f7fb] text-[#345577]':tone==='futuro'?'border-[#d9d5e4] bg-[#f7f6fa] text-[#5d5372]':'border-[#d7e0ea] bg-white text-[#172b4d]';return <article className={`rounded-xl border p-4 ${style}`}><strong className="block text-3xl font-bold">{valor}</strong><span className="mt-1 block text-sm font-medium text-[#40566e]">{rotulo}</span></article>; }
