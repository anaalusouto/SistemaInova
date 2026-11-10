import { useEffect, useRef, useState } from 'react';
import { usePendenciaModulo } from '../PendenciasModulo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listarRespostasCaderno, salvarRespostaCaderno } from '../../caderno.server';
import { validarRespostaCaderno, valoresVazios, type RegistroCaderno, type ValoresCaderno } from '../../diagnostic/cadernoCria';
import type { ItemCaderno } from '../../diagnostic/catalog/cadernoCria';
import { lerRelatoImplantacao, escreverRelatoImplantacao, lerResponsavelImplantacao, escreverResponsavelImplantacao } from '../../diagnostic/implantacao';

export interface ContextoCaderno { diagnosticoId: string; organizacaoId: string; readOnly: boolean }
export function useCaderno({ diagnosticoId, organizacaoId }: Pick<ContextoCaderno, 'diagnosticoId' | 'organizacaoId'>) {
  return useQuery({ queryKey: ['caderno-cria', diagnosticoId, organizacaoId], queryFn: () => listarRespostasCaderno({ data: { diagnosticoId, organizacaoId } }), enabled: Boolean(organizacaoId) });
}
export function CadernoItens({ itens, contexto = '', compact = false, abertoInicial = false, ...props }: ContextoCaderno & { itens: ItemCaderno[]; contexto?: string; compact?: boolean; abertoInicial?: boolean }) {
  const consulta = useCaderno(props);
  if (consulta.isLoading) return <p role="status">Carregando respostas…</p>;
  if (consulta.error) return <p role="alert" className="rounded-xl border p-4 text-sm">{consulta.error.message} <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  return <div className={compact ? 'space-y-1' : 'space-y-3'}>{itens.map(item => <ItemCadernoFormulario key={`${contexto}:${item.codigo}`} {...props} contexto={contexto} compact={compact} abertoInicial={abertoInicial} item={item} registro={consulta.data?.find(r => r.codigo === item.codigo && r.contexto === contexto)}/>)}</div>;
}
const campo = 'w-full min-w-0 rounded-lg border bg-card p-2.5 text-sm';
function ItemCadernoFormulario({ item, registro, contexto, compact, abertoInicial, diagnosticoId, organizacaoId, readOnly }: ContextoCaderno & { item: ItemCaderno; registro?: RegistroCaderno; contexto: string; compact: boolean; abertoInicial: boolean }) {
  const client = useQueryClient();
  const [valores, setValores] = useState<ValoresCaderno>(registro?.resposta ?? valoresVazios);
  const [versao, setVersao] = useState(registro?.versao ?? 0);
  const [sujo, setSujo] = useState(false);
  const [erro, setErro] = useState('');
  const detalhesRef = useRef<HTMLDetailsElement>(null);
  const [detalhesImplantacao, setDetalhesImplantacao] = useState(() => lerRelatoImplantacao(registro?.resposta.relato ?? ''));
  const [responsavelImplantacao, setResponsavelImplantacao] = useState(() => lerResponsavelImplantacao(registro?.resposta.respondentes ?? ''));
  useEffect(() => { if (!sujo) { setValores(registro?.resposta ?? valoresVazios()); setVersao(registro?.versao ?? 0); setDetalhesImplantacao(lerRelatoImplantacao(registro?.resposta.relato ?? '')); setResponsavelImplantacao(lerResponsavelImplantacao(registro?.resposta.respondentes ?? '')); } }, [registro, sujo]);
  useEffect(() => { if (abertoInicial && detalhesRef.current) detalhesRef.current.open = true; }, [abertoInicial]);
  const alterar = <K extends keyof ValoresCaderno>(chave: K, valor: ValoresCaderno[K]) => { setValores(v => ({ ...v, [chave]: valor })); setSujo(true); setErro(''); };
  const salvar = useMutation({ mutationFn: () => salvarRespostaCaderno({ data: { diagnosticoId, organizacaoId, codigo: item.codigo, contexto, resposta: valores, versao } }),
    onSuccess: r => {
      client.setQueryData<RegistroCaderno[]>(['caderno-cria', diagnosticoId, organizacaoId], antes => [...(antes ?? []).filter(a => a.codigo !== item.codigo || a.contexto !== contexto), r]);
      setVersao(r.versao); setValores(r.resposta); setSujo(false); setErro('');
      void client.invalidateQueries({ queryKey: ['diagnostico', diagnosticoId] });
      void client.invalidateQueries({ queryKey: ['portfolio-notas-mapeamento'] });
      void client.invalidateQueries({ queryKey: ['prioridades-cruzadas'] });
      void client.invalidateQueries({ queryKey: ['portfolio-detalhes-mapeamento'] });
    }, onError: (e: Error) => setErro(e.message + ' Suas alterações continuam neste formulário.') });
  usePendenciaModulo(!readOnly && (sujo || salvar.isPending));
  const resposta = registro?.resposta;
  const exibicao = resposta?.valor ? item.opcoes?.find(o => o.valor === resposta.valor)?.descricao ?? resposta.valor : resposta?.selecoes.length ? resposta.selecoes.join(', ') : registro ? 'Registro sem resposta' : 'Não preenchido';
  const implantacao = /^IM0[1-7]$/.test(item.codigo);
  return <details ref={detalhesRef} className="rounded-lg border bg-card" data-caderno-codigo={item.codigo}>
    <summary className={`cursor-pointer ${compact ? 'p-2.5 text-xs leading-5' : 'p-4 text-sm'}`}><span className="font-mono text-xs text-muted-foreground mr-2">{item.codigo}</span><strong>{item.texto}</strong><span className={`${compact ? 'mt-0.5' : 'mt-2'} block text-xs text-muted-foreground line-clamp-2`}>{exibicao}{sujo ? ' · alterações ainda não salvas' : ''}</span></summary>
    <div className="border-t p-4 space-y-3">
      {item.orientacao && <p className="text-sm text-muted-foreground">{item.orientacao}</p>}
      {item.aprofundar && <p className="text-sm text-muted-foreground">Aprofundar se necessário: {item.aprofundar}</p>}
      {readOnly ? <dl className="space-y-3 text-sm">{[['Resposta', exibicao], ['Relato / justificativa / Observação', resposta?.relato], ['Respondentes / responsável', resposta?.respondentes], ['Fonte / evid\u00eancia', resposta?.fonte]].map(([rotulo, texto]) => <div key={rotulo}><dt className="font-semibold">{rotulo}</dt><dd className="whitespace-pre-wrap break-words">{texto || 'Não informado'}</dd></div>)}</dl>
        : <form className="space-y-4" onSubmit={e => { e.preventDefault(); if (salvar.isPending) return; try { validarRespostaCaderno(item.codigo, contexto, valores); setErro(''); salvar.mutate(); } catch (e) { setErro((e as Error).message); } }}>
          <fieldset disabled={salvar.isPending} className="space-y-4">
            {item.tipo === 'texto' ? <label className="block text-sm">Resposta<textarea aria-label={`Resposta ${item.codigo}`} className={`${campo} min-h-24 mt-1`} maxLength={20000} value={valores.valor ?? ''} onChange={e => alterar('valor', e.target.value || null)}/></label>
              : item.tipo === 'multipla' ? <fieldset><legend className="text-sm font-medium mb-2">Marque todas as opções pertinentes</legend><div className="flex flex-wrap gap-2">{item.opcoes?.map(o => <label key={o.valor} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><input type="checkbox" checked={valores.selecoes.includes(o.valor)} onChange={e => alterar('selecoes', e.target.checked ? [...valores.selecoes, o.valor] : valores.selecoes.filter(s => s !== o.valor))}/>{o.descricao}</label>)}</div></fieldset>
              : <fieldset><legend className="text-sm font-medium mb-2">{item.tipo === 'escala' ? 'Marque o maior nível integralmente atendido ou a situação pertinente' : 'Selecione a opção pertinente'}</legend><div className="space-y-2">{item.opcoes?.map(o => <label key={o.valor} className="flex items-start gap-2 rounded-lg border p-3 text-sm"><input className="mt-1" type="radio" name={`${item.codigo}:${contexto}`} checked={valores.valor === o.valor} onChange={() => alterar('valor', o.valor)}/><span>{/^[1-4]$/.test(o.valor) ? `${o.valor} — ` : ''}{o.descricao}</span></label>)}</div><button type="button" className="mt-2 text-xs underline" onClick={() => alterar('valor', null)}>Deixar sem marcação</button></fieldset>}
            {implantacao ? <>
              {([['existe','O que existe'],['falta','O que falta'],['proximo','Próximo passo'],['outros','Outras informações registradas']] as const).map(([chave,label])=><label key={chave} className="block text-sm">{label}<textarea className={`${campo} min-h-20 mt-1`} maxLength={20000} value={detalhesImplantacao[chave]} onChange={e=>{const atual={...detalhesImplantacao,[chave]:e.target.value};setDetalhesImplantacao(atual);alterar('relato',escreverRelatoImplantacao(atual));}}/></label>)}
              <label className="block text-sm">Responsável<input className={`${campo} mt-1`} maxLength={20000} value={responsavelImplantacao.responsavel} onChange={e=>{const atual={...responsavelImplantacao,responsavel:e.target.value};setResponsavelImplantacao(atual);alterar('respondentes',escreverResponsavelImplantacao(atual.responsavel,atual.prazo));}}/></label>
              <label className="block text-sm">Prazo<input className={`${campo} mt-1`} maxLength={20000} value={responsavelImplantacao.prazo} onChange={e=>{const atual={...responsavelImplantacao,prazo:e.target.value};setResponsavelImplantacao(atual);alterar('respondentes',escreverResponsavelImplantacao(atual.responsavel,atual.prazo));}}/></label>
            </> : <><label className="block text-sm">Relato / justificativa / Observação<textarea className={`${campo} min-h-24 mt-1`} maxLength={20000} value={valores.relato} onChange={e => alterar('relato', e.target.value)}/></label>
            <label className="block text-sm">Respondentes / público / responsável<input className={`${campo} mt-1`} maxLength={20000} value={valores.respondentes} onChange={e => alterar('respondentes', e.target.value)}/></label></>}
            {erro && <p role="alert" className="text-sm text-destructive">{erro} <button type="button" className="underline" onClick={() => void client.invalidateQueries({ queryKey: ['caderno-cria', diagnosticoId, organizacaoId] })}>Recarregar para conferir</button></p>}
            <div className="flex flex-wrap gap-2"><button type="submit" disabled={!sujo} className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{salvar.isPending ? 'Salvando…' : 'Salvar resposta'}</button><button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => { setValores(registro?.resposta ?? valoresVazios()); setVersao(registro?.versao ?? 0); setDetalhesImplantacao(lerRelatoImplantacao(registro?.resposta.relato ?? '')); setResponsavelImplantacao(lerResponsavelImplantacao(registro?.resposta.respondentes ?? '')); setSujo(false); setErro(''); }}>Cancelar alterações</button></div>
          </fieldset>
        </form>}
      {registro && <p className="text-xs text-muted-foreground">Salvo em {new Date(registro.atualizado_em).toLocaleString('pt-BR')} · versão da resposta {registro.versao}</p>}
    </div>
  </details>;
}
