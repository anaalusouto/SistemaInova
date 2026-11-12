import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { criarProduto, criarCategoriaProduto, listarProdutos, listarCategoriasProduto, type Produto } from '../../diagnosticos.server';
import { PORTFOLIO_CESTA, PERFIL_CESTA, AVALIACOES_OPERACAO, IMPLANTACAO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { useCaderno, type ContextoCaderno } from './CadernoItens';
import { PlanilhaCaderno } from './PlanilhaCaderno';
import { DadosComerciaisCesta } from './DadosComerciaisCesta';

export function PlanilhaCesta(props: ContextoCaderno) {
  const client=useQueryClient();
  const produtos=useQuery({queryKey:['diagnostico-produtos',props.diagnosticoId],queryFn:()=>listarProdutos({data:{diagnosticoId:props.diagnosticoId}})});
  const categorias=useQuery({queryKey:['cesta-categorias',props.diagnosticoId],queryFn:()=>listarCategoriasProduto({data:{diagnosticoId:props.diagnosticoId}})});
  const caderno=useCaderno(props);
  const [nome,setNome]=useState('');
  const [nomeCategoria,setNomeCategoria]=useState('');
  const criar=useMutation({mutationFn:()=>criarProduto({data:{diagnosticoId:props.diagnosticoId,nome:nome.trim(),cadeia:null}}),onSuccess:p=>{client.setQueryData<Produto[]>(['diagnostico-produtos',props.diagnosticoId],old=>[...(old??[]),p]);setNome('');}});
  const criarCategoria=useMutation({mutationFn:()=>criarCategoriaProduto({data:{diagnosticoId:props.diagnosticoId,nome:nomeCategoria.trim()}}),onSuccess:()=>{setNomeCategoria('');void client.invalidateQueries({queryKey:['cesta-categorias',props.diagnosticoId]});}});
  if(produtos.isLoading||categorias.isLoading||caderno.isLoading)return <p role="status">Carregando Cesta…</p>;
  if(produtos.error||categorias.error||caderno.error)return <p role="alert">Não foi possível carregar a Cesta. Recarregue a página para tentar novamente.</p>;
  const valor=(codigo:string,contexto:string)=>caderno.data?.find(r=>r.codigo===codigo&&r.contexto===contexto)?.resposta.valor;
  return <div className="space-y-5"><h3 className="font-semibold">Produtos e serviços</h3>
    {!props.readOnly&&<form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();if(nome.trim())criar.mutate();}}><label className="flex-1 min-w-0">Nome do produto ou serviço<input className="block w-full rounded border p-2" value={nome} onChange={e=>setNome(e.target.value)}/></label><button className="self-end rounded bg-primary px-3 py-2 text-primary-foreground" disabled={!nome.trim()||criar.isPending}>Adicionar</button></form>}
    {criar.error&&<p role="alert">{criar.error.message}</p>}
    {!props.readOnly&&<form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();if(nomeCategoria.trim())criarCategoria.mutate();}}><label className="flex-1 min-w-0">Nova categoria<input className="block w-full rounded border p-2" value={nomeCategoria} onChange={e=>setNomeCategoria(e.target.value)}/></label><button className="self-end rounded border px-3 py-2" disabled={!nomeCategoria.trim()||criarCategoria.isPending}>Adicionar categoria</button></form>}{criarCategoria.error&&<p role="alert">{criarCategoria.error.message}</p>}
    {!produtos.data?.length&&<p>Adicione um produto ou serviço para preencher a Cesta.</p>}
    {produtos.data?.map((p,indice)=>{const situacao=valor('PR_SITUACAO',p.id),operacao=valor('PR_OPERACAO',p.id);const primeiraOperacao=operacao&&!produtos.data?.slice(0,indice).some(outro=>valor('PR_SITUACAO',outro.id)==='Implantação'&&valor('PR_OPERACAO',outro.id)===operacao);return <section key={p.id} className="space-y-3 border rounded-lg p-3"><h4 className="font-semibold">{p.nome}</h4><PlanilhaCaderno {...props} contexto={p.id} itens={PORTFOLIO_CESTA}/><PlanilhaCaderno {...props} contexto={p.id} itens={PERFIL_CESTA}/>{situacao==='Funcionamento'&&<><h5 className="font-semibold">Avaliação da operação</h5><PlanilhaCaderno {...props} contexto={p.id} itens={AVALIACOES_OPERACAO}/></>}{situacao==='Implantação'&&(!operacao?<p>Informe e salve o código da operação para preencher a implantação.</p>:primeiraOperacao&&<><h5 className="font-semibold">Implantação · {operacao}</h5><PlanilhaCaderno {...props} contexto={operacao} itens={IMPLANTACAO_CADERNO}/></>)}<DadosComerciaisCesta key={p.id} produto={p} categorias={categorias.data??[]} readOnly={props.readOnly} formatoPlanilha/></section>;})}
  </div>;
}
