import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarProdutos, criarProduto, listarCategoriasProduto, criarCategoriaProduto, type Produto } from '../../diagnosticos.server';
import { PORTFOLIO_CESTA, PERFIL_CESTA, AVALIACOES_OPERACAO, IMPLANTACAO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
import { CestaProdutosTab } from './CestaProdutosTab';
import { DadosComerciaisCesta } from './DadosComerciaisCesta';

const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const COLUNAS_CESTA = [
  { grupo: 'Produção e qualidade', itens: [['C02','Procedimentos'],['C03','Qualidade'],['C04','Perdas'],['C10','Lotes e rastreabilidade'],['C11','Validade'],['C12','Embalagem']] },
  { grupo: 'Gestão, mercado e riscos', itens: [['C01','Planejamento'],['C05','Custos'],['C06','Comercialização'],['C07','Logística'],['C08','Resultados'],['C09','Clima']] },
] as const;
const situacaoLabel = (v: string | null) => v === 'Funcionamento' ? 'Em funcionamento' : v === 'Implantação' ? 'Em implantação' : v === 'Futuro' ? 'De interesse futuro' : 'Não informado';
const mesAtivo = (p: Produto, mes: number) => p.safra.estado === 'ano_inteiro' || p.safra.estado === 'sazonal' && p.safra.intervalos.some(i => i.inicio <= i.fim ? mes >= i.inicio && mes <= i.fim : mes >= i.inicio || mes <= i.fim);

export function CestaCaderno(props: ContextoCaderno) {
  const client = useQueryClient();
  const consulta = useQuery({ queryKey: ['diagnostico-produtos', props.diagnosticoId], queryFn: () => listarProdutos({ data: { diagnosticoId: props.diagnosticoId } }) });
  const categoriasQuery = useQuery({ queryKey: ['cesta-categorias', props.diagnosticoId], queryFn: () => listarCategoriasProduto({ data: { diagnosticoId: props.diagnosticoId } }) });
  const caderno = useCaderno(props);
  const [selecionado, setSelecionado] = useState('');
  const [nome, setNome] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [visao, setVisao] = useState<'produtos'|'perfis'|'implantacao'>('produtos');
  const criar = useMutation({ mutationFn: () => criarProduto({ data: { diagnosticoId: props.diagnosticoId, nome: nome.trim(), cadeia: null } }), onSuccess: p => { void client.invalidateQueries({ queryKey: ['diagnostico-produtos', props.diagnosticoId] }); setSelecionado(p.id); setNome(''); } });
  const criarCategoria = useMutation({ mutationFn: () => criarCategoriaProduto({ data: { diagnosticoId: props.diagnosticoId, nome: novaCategoria } }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['cesta-categorias', props.diagnosticoId] }); setNovaCategoria(''); } });
  if (consulta.isLoading || caderno.isLoading || categoriasQuery.isLoading) return <p role="status">Carregando Cesta de Produtos…</p>;
  if (consulta.error || caderno.error || categoriasQuery.error) return <p role="alert">{consulta.error?.message || caderno.error?.message || categoriasQuery.error?.message} <button className="underline" type="button" onClick={() => { void consulta.refetch(); void caderno.refetch(); void categoriasQuery.refetch(); }}>Tentar novamente</button></p>;

  const produtos = consulta.data ?? [];
  const categorias = categoriasQuery.data ?? [];
  const registros = caderno.data ?? [];
  const produto = produtos.find(p => p.id === selecionado);
  const valor = (codigo: string, contexto: string) => registros.find(r => r.codigo === codigo && r.contexto === contexto)?.resposta.valor ?? null;
  const resposta = (codigo: string, contexto: string) => registros.find(r => r.codigo === codigo && r.contexto === contexto)?.resposta;
  const categoriaNome = (p: Produto) => categorias.find(c => c.id === p.categoriaId)?.nome ?? 'Sem categoria';
  const operacoes = new Set(produtos.map(p => valor('PR_OPERACAO', p.id)).filter(Boolean));
  const funcionando = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Funcionamento');
  const implantacao = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Implantação');
  const futuros = produtos.filter(p => valor('PR_SITUACAO', p.id) === 'Futuro');
  const gruposCategoria = [...new Set(produtos.map(categoriaNome))].sort((a,b) => a.localeCompare(b,'pt-BR'));

  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border bg-card p-5">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Caderno CRIA · revisão 22/10/2026</p><h3 className="mt-1 text-2xl font-bold">Cesta de Produtos</h3><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Portfólio por categoria, perfil, calendário e operação. Lacunas seguem como não informadas ou pendentes.</p></div>
      <span className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground">Sem nota geral por produto</span>
    </header>

    {!props.readOnly && <div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-2">
      <form className="flex items-end gap-2" onSubmit={e => { e.preventDefault(); if (nome.trim() && !criar.isPending) criar.mutate(); }}><label className="min-w-0 flex-1 text-xs">Novo produto ou serviço<input aria-label="Novo produto ou serviço" required maxLength={500} value={nome} onChange={e=>setNome(e.target.value)} placeholder="Nome no portfólio" className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"/></label><button disabled={criar.isPending} className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">Adicionar</button></form>
      <form className="flex items-end gap-2" onSubmit={e=>{e.preventDefault();if(novaCategoria.trim()&&!criarCategoria.isPending)criarCategoria.mutate();}}><label className="min-w-0 flex-1 text-xs">Nova categoria<input maxLength={120} value={novaCategoria} onChange={e=>setNovaCategoria(e.target.value)} placeholder="Polpas de frutas, Frutas in natura…" className="mt-1 w-full rounded-lg border bg-background p-2 text-sm"/></label><button disabled={!novaCategoria.trim()||criarCategoria.isPending} className="rounded-lg border px-3 py-2 text-sm">Cadastrar</button></form>
      {(criar.error||criarCategoria.error)&&<p role="alert" className="text-xs text-destructive sm:col-span-2">{criar.error?.message||criarCategoria.error?.message}</p>}
    </div>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Stat valor={produtos.length} rotulo="produtos/serviços mapeados"/>
      <Stat valor={operacoes.size} rotulo="operações/grupos"/>
      <Stat valor={funcionando.length} rotulo="em funcionamento"/>
      <Stat valor={implantacao.length} rotulo="em implantação"/>
      <Stat valor={futuros.length} rotulo="de interesse futuro"/>
    </div>

    <nav className="flex flex-wrap gap-2" aria-label="Visualizações da Cesta">
      {([['produtos','Produtos e serviços'],['perfis','Perfis e calendário'],['implantacao','Implantação']] as const).map(([id,label])=><button key={id} type="button" aria-pressed={visao===id} onClick={()=>setVisao(id)} className={`rounded-full border px-4 py-2 text-sm ${visao===id?'border-primary bg-primary/10 font-semibold text-primary':'text-muted-foreground hover:bg-muted'}`}>{label}</button>)}
    </nav>

    {visao==='produtos'&&<section className="space-y-4">
      <div><h4 className="text-lg font-semibold">Produtos e serviços mapeados</h4><p className="text-xs text-muted-foreground">1–4 níveis registrados · — não coletado · ? pendente · N/A não aplicável · H heterogêneo. Sem nota geral por produto ou operação.</p></div>
      <div className="overflow-x-auto rounded-xl border bg-card"><table className="min-w-[1080px] w-full border-collapse text-left text-xs"><caption className="sr-only">Indicadores de cada produto e operação</caption><thead className="bg-muted/70"><tr><th rowSpan={2} className="sticky left-0 z-10 min-w-52 border-b p-3">Produto / serviço e operação</th>{COLUNAS_CESTA.map(g=><th key={g.grupo} colSpan={g.itens.length} className="border-b p-3 text-center">{g.grupo}</th>)}</tr><tr>{COLUNAS_CESTA.flatMap(g=>g.itens.map(([code,label])=><th key={code} className="min-w-24 border-b p-2 align-bottom"><span className="block">{label}</span><span className="mt-1 block font-mono text-[10px] text-muted-foreground">{code}</span></th>))}</tr></thead><tbody>
        {produtos.map(p=><tr key={p.id} className="border-t hover:bg-muted/30"><th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left"><button type="button" className="text-primary underline" onClick={()=>setSelecionado(p.id)}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button><span className="mt-1 block font-normal text-muted-foreground">{valor('PR_OPERACAO',p.id)||'Operação não informada'} · {situacaoLabel(valor('PR_SITUACAO',p.id))}</span></th>{COLUNAS_CESTA.flatMap(g=>g.itens.map(([code])=>{const v=valor(code,p.id);return <td key={code} className="border-l p-2 text-center"><span title={AVALIACOES_OPERACAO.find(x=>x.codigo===code)?.texto||code} aria-label={`${code}: ${v||'pendente'}`} className={`inline-flex min-w-7 justify-center rounded px-2 py-1 font-semibold ${v&&/^[1-4]$/.test(v)?`text-white ${v==='1'?'bg-[#a9473e]':v==='2'?'bg-[#c8833c]':v==='3'?'bg-[#d3b84a]':'bg-[#588268]'}`:'bg-muted text-muted-foreground'}`}>{v==='H'?'H':v==='NA'?'N/A':v==='NC'?'—':v==='NS'?'NS':v==='D'?'D':v||'?'}</span></td>}))}</tr>)}
        {!produtos.length&&<tr><td colSpan={13} className="p-8 text-center text-muted-foreground">Nenhum produto ou serviço cadastrado.</td></tr>}
      </tbody></table></div>
      {funcionando.length>0&&<section className="rounded-xl border bg-card p-4"><h4 className="font-semibold">Condições e atenção</h4><p className="mt-1 text-xs text-muted-foreground">Dificuldades e informações complementares registradas no perfil dos produtos em funcionamento.</p><div className="mt-3 grid gap-3 md:grid-cols-3">{[['CP08','Limitações produtivas'],['CP09','Dificuldades comerciais'],['CP10','Eventos climáticos']].map(([code,title])=>{const itens=funcionando.flatMap(p=>{const r=resposta(code,p.id);const vals=[...(r?.selecoes??[]),...(r?.valor?[r.valor]:[])];return vals.map(v=>({produto:p.nome,valor:v,relato:r?.relato||''}));});return <article key={code} className="rounded-lg border p-3"><h5 className="text-sm font-semibold">{title}</h5>{itens.length?<ul className="mt-2 space-y-2 text-xs">{itens.slice(0,4).map((x,i)=><li key={`${x.produto}-${i}`}><strong>{x.valor}</strong><span className="block text-muted-foreground">{x.produto}{x.relato?` · ${x.relato}`:''}</span></li>)}</ul>:<p className="mt-2 text-xs text-muted-foreground">Não informado</p>}</article>})}</div></section>}
    </section>}

    {visao==='perfis'&&<section className="space-y-4">
      <div><h4 className="text-lg font-semibold">Portfólio · perfil CP01–CP07</h4><p className="text-xs text-muted-foreground">Perfil e calendário agrupados por categoria. Os códigos e a operação responsável permanecem visíveis separadamente.</p></div>
      {gruposCategoria.map(cat=>{const itens=produtos.filter(p=>categoriaNome(p)===cat);return <section key={cat} className="overflow-x-auto rounded-xl border bg-card"><h5 className="border-b bg-muted/70 p-3 font-semibold">{cat} <span className="text-xs font-normal text-muted-foreground">· {itens.length} produto(s)</span></h5><table className="min-w-[700px] w-full text-left text-xs"><thead><tr>{['Produto / serviço','Operação','Situação','Papel da organização','Interesse · CP03'].map(t=><th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{itens.map(p=><tr key={p.id} className="border-t"><th className="p-3 text-left font-medium"><button type="button" className="text-primary underline" onClick={()=>setSelecionado(p.id)}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button></th><td className="p-3">{valor('PR_OPERACAO',p.id)||'Não informado'}</td><td className="p-3">{situacaoLabel(valor('PR_SITUACAO',p.id))}</td><td className="p-3">{valor('PR_PAPEL',p.id)||'Não informado'}</td><td className="p-3">{valor('CP03',p.id)||'Não informado'}</td></tr>)}</tbody></table>
        <div className="border-t p-3"><h6 className="text-sm font-semibold">Calendário da Cesta</h6><p className="mt-1 text-xs text-muted-foreground">Safra contínua, sazonal, não informada e intervalos que atravessam dezembro têm estados distintos.</p><table className="mt-3 w-full min-w-[650px] text-center text-xs"><thead><tr><th className="p-2 text-left">Produto</th>{MESES.map(m=><th key={m} className="p-2">{m}</th>)}</tr></thead><tbody>{itens.map(p=><tr key={p.id} className="border-t"><th className="p-2 text-left font-medium">{p.nome}<span className="block font-normal text-muted-foreground">{p.safra.estado==='nao_informada'?'Safra não informada':p.safra.estado==='ano_inteiro'?'Disponível o ano inteiro':'Safra sazonal'}</span></th>{MESES.map((m,j)=><td key={m} className="p-1"><span className={`inline-flex min-w-7 justify-center rounded px-1.5 py-1 ${mesAtivo(p,j+1)?'bg-primary/15 font-semibold text-primary':'text-muted-foreground'}`}>{mesAtivo(p,j+1)?'●':'·'}</span></td>)}</tr>)}</tbody></table></div>
      </section>})}
      {produtos.length===0&&<p className="rounded-xl border p-6 text-sm text-muted-foreground">Nenhum produto no portfólio.</p>}
    </section>}

    {visao==='implantacao'&&<section className="space-y-4"><div><h4 className="text-lg font-semibold">Implantação e interesse futuro</h4><p className="text-xs text-muted-foreground">A preparação é registrada por operação/grupo responsável; produtos futuros ficam sem pontuação.</p></div>
      {implantacao.map(p=>{const operacao=valor('PR_OPERACAO',p.id);return <article key={p.id} className="rounded-xl border bg-card p-4"><h5 className="font-semibold">{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</h5><p className="mb-3 text-xs text-muted-foreground">{categoriaNome(p)} · Operação {operacao||'não informada'} · {valor('PR_PAPEL',p.id)||'papel não informado'}</p>{operacao?<CadernoItens {...props} itens={IMPLANTACAO_CADERNO} contexto={operacao}/>:<p className="text-sm text-muted-foreground">Informe o código OP antes de registrar a preparação da implantação.</p>}</article>})}
      {futuros.length>0&&<section className="rounded-xl border bg-card p-4"><h5 className="font-semibold">De interesse futuro · sem nota</h5><ul className="mt-2 space-y-2">{futuros.map(p=><li key={p.id} className="border-t pt-2 text-sm"><button type="button" className="text-primary underline" onClick={()=>setSelecionado(p.id)}>{valor('PR_CODIGO',p.id)||'Produto'} · {p.nome}</button><span className="ml-2 text-xs text-muted-foreground">{categoriaNome(p)} · operação {valor('PR_OPERACAO',p.id)||'não informada'}</span></li>)}</ul></section>}
      {implantacao.length===0&&futuros.length===0&&<p className="rounded-xl border p-6 text-sm text-muted-foreground">Nenhum produto em implantação ou de interesse futuro.</p>}
    </section>}

    {produto&&<section className="space-y-4 rounded-xl border bg-card p-4" aria-label={`Ficha ${produto.nome}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs text-muted-foreground">{categoriaNome(produto)} · Operação {valor('PR_OPERACAO',produto.id)||'não informada'}</p><h4 className="text-lg font-semibold">{valor('PR_CODIGO',produto.id)||'Produto'} · {produto.nome}</h4></div><button type="button" className="text-xs underline" onClick={()=>setSelecionado('')}>Fechar ficha</button></div><CadernoItens {...props} itens={PORTFOLIO_CESTA} contexto={produto.id}/><DadosComerciaisCesta key={produto.id} produto={produto} categorias={categorias} readOnly={props.readOnly}/>
      {valor('PR_SITUACAO',produto.id)==='Funcionamento'?<><h5 className="text-lg font-semibold">Perfil e avaliação da operação atual</h5><p className="text-sm text-muted-foreground">Cada indicador tem resposta, relato e fonte próprios. Não há cálculo de nota geral do produto.</p><CadernoItens {...props} itens={[...PERFIL_CESTA,...AVALIACOES_OPERACAO]} contexto={produto.id}/></>:valor('PR_SITUACAO',produto.id)==='Implantação'?<><h5 className="text-lg font-semibold">Preparação da implantação</h5>{valor('PR_OPERACAO',produto.id)?<CadernoItens {...props} itens={IMPLANTACAO_CADERNO} contexto={valor('PR_OPERACAO',produto.id)!}/>:<p className="text-sm text-muted-foreground">Informe o código OP para registrar a preparação pela operação responsável.</p>}</>:<p className="text-sm text-muted-foreground">Produto futuro ou ainda sem situação definida: registrar no portfólio, sem pontuar operação.</p>}
    </section>}
    <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Consultar respostas da Cesta anterior — instrumento legado</summary><p className="my-3 text-xs text-muted-foreground">Dados anteriores preservados para consulta. Não foram convertidos em notas ou respostas do Caderno.</p><CestaProdutosTab diagnosticoId={props.diagnosticoId} readOnly/></details>
  </div>;
}

function Stat({valor,rotulo}:{valor:number;rotulo:string}) { return <article className="rounded-xl border bg-card p-4"><strong className="block text-3xl font-bold text-primary">{valor}</strong><span className="mt-1 block text-sm font-medium">{rotulo}</span></article>; }
