import { useEffect, useId, useState, type Dispatch, type SetStateAction } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCaderno, type ContextoCaderno } from './CadernoItens';
import { salvarRespostaCaderno } from '../../caderno.server';
import { AVALIACAO_MATRIZ_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { validarRespostaCaderno, valoresVazios } from '../../diagnostic/cadernoCria';
import { usePendenciaModulo } from '../PendenciasModulo';

/** Avaliação canônica Fxx, independente da leitura calculada da função. */
export function AvaliacaoMatriz({ funcaoId, aoPendencias, ...props }: ContextoCaderno & { funcaoId: string; aoPendencias: Dispatch<SetStateAction<Record<string, boolean>>> }) {
  const consulta = useCaderno(props);
  const pendenciaId = useId();
  const client = useQueryClient();
  const item = AVALIACAO_MATRIZ_CADERNO.find(i => i.codigo === funcaoId)!;
  const registro = consulta.data?.find(r => r.codigo === funcaoId && r.contexto === '');
  const [valores, setValores] = useState(registro?.resposta ?? valoresVazios);
  const [versao, setVersao] = useState(registro?.versao ?? 0);
  const [sujo, setSujo] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!sujo) { setValores(registro?.resposta ?? valoresVazios()); setVersao(registro?.versao ?? 0); }
  }, [registro, sujo]);
  const salvar = useMutation({
    mutationFn: () => salvarRespostaCaderno({ data: { diagnosticoId: props.diagnosticoId, organizacaoId: props.organizacaoId, codigo: funcaoId, contexto: '', resposta: valores, versao } }),
    onSuccess: r => {
      client.setQueryData<typeof consulta.data>(['caderno-cria', props.diagnosticoId, props.organizacaoId], antes => [...(antes ?? []).filter(a => a.codigo !== funcaoId || a.contexto !== ''), r]);
      setValores(r.resposta); setVersao(r.versao); setSujo(false); setErro('');
      void client.invalidateQueries({ queryKey: ['diagnostico', props.diagnosticoId] });
      void client.invalidateQueries({ queryKey: ['portfolio-notas-mapeamento'] });
    },
    onError: (e: Error) => setErro(e.message + ' Suas alterações continuam neste formulário.'),
  });
  usePendenciaModulo(!props.readOnly && (sujo || salvar.isPending));
  const pendente = sujo || salvar.isPending;
  useEffect(() => {
    aoPendencias(antes => Boolean(antes[pendenciaId]) === pendente ? antes : { ...antes, [pendenciaId]: pendente });
    return () => { aoPendencias(antes => antes[pendenciaId] ? { ...antes, [pendenciaId]: false } : antes); };
  }, [pendenciaId, pendente, aoPendencias]);
  if (consulta.isLoading) return <p role="status">Carregando avaliação…</p>;
  if (consulta.error) return <p role="alert">Não foi possível carregar a avaliação. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  if (props.readOnly) return <div className="space-y-2"><p>{item.opcoes?.find(o => o.valor === registro?.resposta.valor)?.descricao ?? 'Não avaliado'}</p>{registro?.resposta.relato && <p className="whitespace-pre-wrap">{registro.resposta.relato}</p>}</div>;
  return <form className="space-y-2" aria-label={`Avaliação ${funcaoId}`} onSubmit={e => {
    e.preventDefault(); e.stopPropagation(); if (salvar.isPending) return;
    try { validarRespostaCaderno(funcaoId, '', valores); setErro(''); salvar.mutate(); }
    catch (e) { setErro((e as Error).message); }
  }}>
    <fieldset disabled={salvar.isPending} className="space-y-2">
      <label className="block text-xs">Avaliação<select className="mt-1 w-full min-w-0 rounded-lg border bg-card p-2 text-sm" aria-label={`Avaliação ${funcaoId}`} value={valores.valor ?? ''} onChange={e => { setValores(v => ({ ...v, valor: e.target.value || null })); setSujo(true); setErro(''); }}>
        <option value="">Não avaliado</option>{item.opcoes?.map(o => <option key={o.valor} value={o.valor}>{o.valor} · {o.descricao}</option>)}
      </select></label>
      <label className="block text-xs">Observação da avaliação<textarea className="mt-1 w-full min-w-0 rounded-lg border bg-card p-2 text-sm" aria-label={`Observação da avaliação ${funcaoId}`} rows={3} maxLength={20000} value={valores.relato} onChange={e => { setValores(v => ({ ...v, relato: e.target.value })); setSujo(true); setErro(''); }}/></label>
      <p className="text-xs text-muted-foreground">Escala de 1 a 4: quanto menor a nota, maior a necessidade de desenvolvimento. Não se aplica exige justificativa. Sem evidências, mantenha Não avaliado.</p>
      <button type="submit" disabled={!sujo} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-50">{salvar.isPending ? 'Salvando…' : 'Salvar avaliação'}</button>
      <button type="button" disabled={!sujo} className="ml-2 text-xs underline disabled:opacity-50" onClick={() => { setValores(registro?.resposta ?? valoresVazios()); setVersao(registro?.versao ?? 0); setSujo(false); setErro(''); }}>Cancelar avaliação</button>
      {sujo && <p role="status" className="text-xs">Avaliação com alterações não salvas.</p>}
    </fieldset>
    {erro && <p role="alert" className="text-xs text-destructive">{erro}</p>}
  </form>;
}
