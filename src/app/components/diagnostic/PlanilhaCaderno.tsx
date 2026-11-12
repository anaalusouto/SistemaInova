import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salvarRespostaCaderno } from '../../caderno.server';
import { validarRespostaCaderno, valoresVazios, type RegistroCaderno, type ValoresCaderno } from '../../diagnostic/cadernoCria';
import type { ItemCaderno } from '../../diagnostic/catalog/cadernoCria';
import { lerRelatoImplantacao, escreverRelatoImplantacao, lerResponsavelImplantacao, escreverResponsavelImplantacao } from '../../diagnostic/implantacao';
import { usePendenciaModulo, useQuantidadePendencias } from '../PendenciasModulo';
import { useCaderno, type ContextoCaderno } from './CadernoItens';

const campo = 'w-full min-w-0 rounded border bg-card p-1 text-xs';
export function PlanilhaCaderno({ itens, contexto = '', ...props }: ContextoCaderno & { itens: ItemCaderno[]; contexto?: string }) {
  const consulta = useCaderno(props);
  if (consulta.isLoading) return <p role="status">Carregando respostas…</p>;
  if (consulta.error) return <p role="alert">Não foi possível carregar as respostas. <button type="button" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  return <table className="w-full table-fixed border-collapse text-left text-xs" aria-label="Planilha de respostas">
    <colgroup><col style={{width:'27%'}}/><col style={{width:'22%'}}/><col style={{width:'22%'}}/><col style={{width:'13%'}}/><col style={{width:'16%'}}/></colgroup>
    <thead><tr className="bg-muted">{['Pergunta','Resposta','Relato / justificativa','Respondentes','Fonte / ação'].map(h=><th key={h} className="border p-1.5 break-words">{h}</th>)}</tr></thead>
    <tbody>{itens.map(item=><Linha key={`${contexto}:${item.codigo}`} {...props} item={item} contexto={contexto} registro={consulta.data?.find(r=>r.codigo===item.codigo && r.contexto===contexto)}/>)}</tbody>
  </table>;
}
function Linha({ item, contexto, registro, diagnosticoId, organizacaoId, readOnly }: ContextoCaderno & { item: ItemCaderno; contexto: string; registro?: RegistroCaderno }) {
  const client = useQueryClient();
  const [valores, setValores] = useState<ValoresCaderno>(()=>registro?.resposta ?? valoresVazios());
  const [versao, setVersao] = useState(registro?.versao ?? 0);
  const [sujo, setSujo] = useState(false);
  const [erro, setErro] = useState('');
  const quantidadePendencias = useQuantidadePendencias();
  useEffect(()=>{ if(!sujo){setValores(registro?.resposta ?? valoresVazios());setVersao(registro?.versao ?? 0);} },[registro,sujo]);
  const salvar = useMutation({ mutationFn:()=>salvarRespostaCaderno({data:{diagnosticoId,organizacaoId,codigo:item.codigo,contexto,resposta:valores,versao}}), onSuccess:r=>{client.setQueryData<RegistroCaderno[]>(['caderno-cria',diagnosticoId,organizacaoId], old=>[...(old??[]).filter(x=>x.codigo!==item.codigo || x.contexto!==contexto),r]);setVersao(r.versao);setValores(r.resposta);setSujo(false);setErro('');void client.invalidateQueries({queryKey:['diagnostico',diagnosticoId]});void client.invalidateQueries({queryKey:['portfolio-notas-mapeamento']});void client.invalidateQueries({queryKey:['prioridades-cruzadas']});void client.invalidateQueries({queryKey:['portfolio-detalhes-mapeamento']});},onError:(e:Error)=>setErro(e.message) });
  usePendenciaModulo(!readOnly && (sujo || salvar.isPending));
  const alterar = <K extends keyof ValoresCaderno>(chave:K, valor:ValoresCaderno[K])=>{setValores(v=>({...v,[chave]:valor}));setSujo(true);setErro('');};
  const enviar = ()=>{try{if ((item.codigo==='PR_SITUACAO'||item.codigo==='PR_OPERACAO') && quantidadePendencias>1) throw new Error('Salve ou cancele as outras alterações antes de mudar a situação ou operação.');validarRespostaCaderno(item.codigo,contexto,valores);setErro('');salvar.mutate();}catch(e){setErro((e as Error).message);}};
  const implantacao=item.codigo.startsWith('IM');
  const relato=lerRelatoImplantacao(valores.relato), responsavel=lerResponsavelImplantacao(valores.respondentes);
  const desabilitado=readOnly||salvar.isPending;
  return <tr className="align-top"><th scope="row" className="border p-1.5 break-words font-normal"><strong>{item.codigo}</strong> · {item.texto}{item.orientacao&&<small className="block text-muted-foreground">{item.orientacao}</small>}</th>
    <td className="border p-1">{item.tipo==='texto'?<textarea aria-label={`Resposta ${item.codigo}`} className={campo} disabled={desabilitado} value={valores.valor??''} onChange={e=>alterar('valor',e.target.value||null)}/>:item.tipo==='multipla'?<div className="space-y-1">{item.opcoes?.map(o=><label key={o.valor} className="flex gap-1 break-words"><input type="checkbox" disabled={desabilitado} checked={valores.selecoes.includes(o.valor)} onChange={e=>alterar('selecoes',e.target.checked?[...valores.selecoes,o.valor]:valores.selecoes.filter(v=>v!==o.valor))}/>{o.descricao}</label>)}</div>:<select aria-label={`Resposta ${item.codigo}`} className={campo} disabled={desabilitado} value={valores.valor??''} onChange={e=>alterar('valor',e.target.value||null)}><option value="">Não preenchido</option>{item.opcoes?.map(o=><option key={o.valor} value={o.valor}>{o.valor} · {o.descricao}</option>)}</select>}</td>
    <td className="border p-1">{implantacao?([['existe','O que existe'],['falta','O que falta'],['proximo','Próximo passo'],['outros','Outras informações']] as const).map(([k,label])=><label key={k} className="block">{label}<textarea className={campo} disabled={desabilitado} value={relato[k]} onChange={e=>alterar('relato',escreverRelatoImplantacao({...relato,[k]:e.target.value}))}/></label>):<textarea aria-label={`Relato ${item.codigo}`} className={campo} disabled={desabilitado} value={valores.relato} onChange={e=>alterar('relato',e.target.value)}/>}</td>
    <td className="border p-1">{implantacao?<><label>Responsável<input className={campo} disabled={desabilitado} value={responsavel.responsavel} onChange={e=>alterar('respondentes',escreverResponsavelImplantacao(e.target.value,responsavel.prazo))}/></label><label>Prazo<input className={campo} disabled={desabilitado} value={responsavel.prazo} onChange={e=>alterar('respondentes',escreverResponsavelImplantacao(responsavel.responsavel,e.target.value))}/></label></>:<textarea aria-label={`Respondentes ${item.codigo}`} className={campo} disabled={desabilitado} value={valores.respondentes} onChange={e=>alterar('respondentes',e.target.value)}/>}</td>
    <td className="border p-1"><textarea aria-label={`Fonte ${item.codigo}`} className={campo} disabled={desabilitado} value={valores.fonte} onChange={e=>alterar('fonte',e.target.value)}/>{!readOnly&&<div className="space-y-1"><button type="button" className="underline text-primary" disabled={!sujo||salvar.isPending} onClick={enviar}>{salvar.isPending?'Salvando…':'Salvar'}</button>{sujo&&<button type="button" className="block underline" disabled={salvar.isPending} onClick={()=>{setValores(registro?.resposta??valoresVazios());setVersao(registro?.versao??0);setSujo(false);setErro('');}}>Cancelar</button>}</div>}{erro&&<p role="alert" className="text-destructive break-words">{erro}</p>}</td></tr>;
}
