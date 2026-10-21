import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FUNCOES_MATRIZ, ATUACAO_MATRIZ, EXPERIENCIA_MATRIZ, NIVEIS_MATRIZ, leituraMatriz, type MatrizPrototipoInput } from '../../diagnostic/catalog/matrizPrototipo';
import { listarRespostasMatriz, salvarMatrizPrototipo, type MatrizResposta } from '../../diagnosticos.server';
import { Campo } from './DiagnosticUI';
import { EntradaMatriz } from './EntradaMatriz';
import type { CampoImportado, ConferenciaFuncao, ImportacaoMatriz, RascunhoMatriz } from '../../diagnostic/importarMatriz';

interface Props { diagnosticoId: string; organizacaoId: string; readOnly: boolean }
type Draft = Omit<MatrizPrototipoInput,'organizacaoId'|'diagnosticoId'|'funcaoId'>;
const inicial=(nome:string,r?:MatrizResposta):Draft=>({nomeFuncao:r?.nomeFuncao??nome,atuacao:r?.atuacao[0]??null,
  experiencia:r?.experiencia??null,criticidade:r?.criticidade??null,interesse:r?.interesse??null,observacoes:r?.observacoes??null,externo:r?.externo??null});

/** Rascunhos nunca acompanham a troca de organização ou aplicação. */
export function MatrizFuncionalTab(props:Props) {
  return <MatrizDaAplicacao key={`${props.organizacaoId}:${props.diagnosticoId}`} {...props} />;
}
function MatrizDaAplicacao({diagnosticoId,organizacaoId,readOnly}:Props) {
  const client=useQueryClient();
  const [aberta,setAberta]=useState<string|null>(null);
  const [editando,setEditando]=useState(false);
  const [draft,setDraft]=useState<Draft>(inicial(''));
  const [iniciada,setIniciada]=useState(false);
  const [entrada,setEntrada]=useState(false);
  const [importadas,setImportadas]=useState<Record<string,RascunhoMatriz>>({});
  const [origem,setOrigem]=useState('');
  const [pendencias,setPendencias]=useState<string[]>([]);
  const [conferencia,setConferencia]=useState<Record<string,ConferenciaFuncao>>({});
  const emCurso=useRef(false);
  const consulta=useQuery({queryKey:['diagnostico-matriz',diagnosticoId,organizacaoId],queryFn:()=>listarRespostasMatriz({data:{diagnosticoId,organizacaoId}})});
  const respostas=consulta.data??[];
  const indice=useMemo(()=>new Map(respostas.map(r=>[r.funcaoId,r])),[respostas]);
  const salvar=useMutation({mutationFn:(data:MatrizPrototipoInput)=>salvarMatrizPrototipo({data}),
    onSuccess:(resposta,data)=>{
      client.setQueryData<MatrizResposta[]>(['diagnostico-matriz',diagnosticoId,organizacaoId],anteriores=>{
        const outras=(anteriores??[]).filter(r=>r.funcaoId!==resposta.funcaoId);
        return [...outras,resposta];
      });
      setImportadas(anteriores=>{const novas={...anteriores};delete novas[data.funcaoId];return novas;});
      void client.invalidateQueries({queryKey:['diagnostico-matriz',diagnosticoId]});
      void client.invalidateQueries({queryKey:['diagnostico',diagnosticoId]});
      void client.invalidateQueries({queryKey:['diagnostico-visao-geral']});
      setEditando(false);toast.success('Resposta salva.');
    },onError:(e:Error)=>toast.error(e.message||'Não foi possível salvar.'),onSettled:()=>{emCurso.current=false;},
  });
  const avaliadas=FUNCOES_MATRIZ.filter(f=>{const r=indice.get(f.id);return r?.atuacao.length && r.experiencia && r.criticidade && r.interesse;}).length;
  const grupos=[...new Set(FUNCOES_MATRIZ.map(f=>f.grupo))];
  const alterar=<K extends keyof Draft>(campo:K,valor:Draft[K])=>setDraft(d=>({...d,[campo]:valor}));
  if(consulta.isLoading) return <p role="status">Carregando Matriz Funcional…</p>;
  if(consulta.error) return <div role="alert"><p>Não foi possível carregar a Matriz desta organização e aplicação.</p><button type="button" className="underline" onClick={()=>void consulta.refetch()}>Tentar novamente</button></div>;
  const temRespostas=FUNCOES_MATRIZ.some(f=>indice.has(f.id));
  function receberImportacao(dados:ImportacaoMatriz,nome:string) {
    const novas={...dados.respostas},avisos=[...dados.pendencias];
    for(const f of FUNCOES_MATRIZ)if(dados.conferencia[f.id]&&!novas[f.id])novas[f.id]=inicial(f.nome);
    for(const id of Object.keys(novas))if(indice.has(id)){delete novas[id];avisos.push(`${id}: resposta já salva preservada.`);}
    setImportadas(novas);setPendencias(avisos);setConferencia(dados.conferencia);setOrigem(nome);setIniciada(true);setEntrada(false);
    const primeira=Object.keys(novas)[0];setAberta(primeira??null);setEditando(Boolean(primeira));
    if(primeira)setDraft(novas[primeira]);
  }
  if(!readOnly&&(entrada||(!iniciada&&!temRespostas)))return <EntradaMatriz temRespostas={temRespostas} onManual={()=>{setIniciada(true);setEntrada(false);}} onImportar={receberImportacao} onCancelar={entrada?()=>setEntrada(false):undefined}/>;
  const statusCampo=(campo:CampoImportado)=>{
    if(!origem||!aberta||indice.has(aberta))return null;
    const estado=conferencia[aberta]?.campos[campo]??'ausente';
    return <span className="text-xs text-muted-foreground">{estado==='reconhecido'?'Reconhecido no PDF · confira antes de salvar':estado==='ambiguo'?'Ambíguo no PDF · confira e corrija este campo':'Ausente no PDF · preencha se conhecido'}</span>;
  };
  const selecao=(label:string,campo:'atuacao'|'experiencia'|'criticidade'|'interesse',opcoes:readonly string[])=>
    <label className="flex flex-col gap-1 text-sm">{label}<select className="min-h-10 border rounded-lg bg-card p-2" value={draft[campo]??''} onChange={e=>alterar(campo,e.target.value||null)}>
      <option value="">Não informado</option>{opcoes.map(o=><option key={o} value={o}>{o}</option>)}
    </select>{statusCampo(campo)}{(campo==='criticidade'||campo==='interesse')&&<span className="text-xs text-muted-foreground">Escala de 1 a 4.</span>}</label>;
  return <div className="max-w-5xl space-y-4 min-w-0">
    <h3 className="font-semibold text-lg">Matriz Funcional</h3>
    {!readOnly&&<button type="button" disabled={salvar.isPending||Object.keys(importadas).length>0} className="underline text-primary text-sm disabled:opacity-60" onClick={()=>setEntrada(true)}>Importar PDF</button>}
    {origem&&<div className="rounded-xl border p-4 space-y-2 text-sm" role="status"><p>PDF: {origem}. {Object.keys(importadas).length} funções aguardam conferência e salvamento.</p><p>Confira os campos reconhecidos, ausentes ou ambíguos. Corrija as respostas e confirme o salvamento de cada função. Nenhuma resposta é salva automaticamente.</p>
      {pendencias.length>0&&<details><summary>Itens para conferir ({pendencias.length})</summary><ul className="list-disc pl-5">{pendencias.map((p,i)=><li key={i}>{p}</li>)}</ul></details>}
      {Object.keys(importadas).length>0&&<button type="button" disabled={salvar.isPending} className="underline" onClick={()=>{setImportadas({});setConferencia({});setOrigem('');setPendencias([]);setAberta(null);setEditando(false);}}>Descartar respostas ainda não salvas</button>}
    </div>}
    <p className="text-sm text-muted-foreground">{avaliadas} de {FUNCOES_MATRIZ.length} funções avaliadas.</p>
    {grupos.map(grupo=><section key={grupo} className="space-y-2"><h4 className="font-semibold text-sm">{grupo}</h4>
      {FUNCOES_MATRIZ.filter(f=>f.grupo===grupo).map(f=>{
        const r=indice.get(f.id),open=aberta===f.id;
        const reiniciar=()=>importadas[f.id]??inicial(f.nome,r);
        const nome=r?.nomeFuncao||f.nome;
        return <div key={f.id} data-inova-form="matriz" data-inova-field={f.id} className="border rounded-xl bg-card overflow-hidden">
          <button type="button" disabled={salvar.isPending} aria-expanded={open} className="w-full flex flex-wrap items-center gap-2 p-3 text-left"
            onClick={()=>{setAberta(open?null:f.id);setEditando(!open&&!readOnly&&!r);setDraft(reiniciar());}}>
            {open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}<span className="text-xs text-muted-foreground">{f.id}</span>
            <span className="flex-1 min-w-0 break-words font-medium text-sm">{nome}</span><span className="text-xs text-muted-foreground">{leituraMatriz(r?.criticidade??null,r?.experiencia??null)}</span>
            {origem&&<span className="text-xs font-medium">{r?'Salva nesta aplicação':!conferencia[f.id]?'Ausente no PDF':Object.values(conferencia[f.id].campos).includes('ambiguo')?'Ambígua · conferir':'Importada · conferir'}</span>}
          </button>
          {open&&<div className="border-t p-4">
            {editando&&!readOnly?<form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(readOnly||emCurso.current)return;emCurso.current=true;salvar.mutate({organizacaoId,diagnosticoId,funcaoId:f.id,...draft});}}>
              <fieldset disabled={salvar.isPending} className="contents">
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Função<input required maxLength={500} className="border rounded-lg bg-card p-2" value={draft.nomeFuncao} onChange={e=>alterar('nomeFuncao',e.target.value)}/></label>
                {selecao('Atuação','atuacao',ATUACAO_MATRIZ)}{selecao('Experiência','experiencia',EXPERIENCIA_MATRIZ)}
                {selecao('Criticidade atual','criticidade',NIVEIS_MATRIZ)}{selecao('Interesse em desenvolvimento','interesse',NIVEIS_MATRIZ)}
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Leitura orientativa<input readOnly className="border rounded-lg bg-muted p-2" value={leituraMatriz(draft.criticidade,draft.experiencia)}/><span className="text-xs text-muted-foreground">Calculada automaticamente. A prévia acompanha suas alterações. Clique em Salvar alterações para confirmar.</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Observação<textarea className="border rounded-lg bg-card p-2 min-h-24" maxLength={20000} value={draft.observacoes??''} onChange={e=>alterar('observacoes',e.target.value||null)}/>{statusCampo('observacoes')}<span className="text-xs text-muted-foreground">Reúne o relato, a necessidade, o público e a mudança desejada.</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Externo<textarea className="border rounded-lg bg-card p-2" maxLength={20000} value={draft.externo??''} onChange={e=>alterar('externo',e.target.value||null)}/>{statusCampo('externo')}<span className="text-xs text-muted-foreground">Informe quem participa externamente. Deixe vazio quando não identificado.</span></label>
                <div className="sm:col-span-2 flex gap-2"><button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={()=>{setDraft(reiniciar());setEditando(false);}}>Cancelar</button><button type="submit" className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">{salvar.isPending?'Salvando…':origem?'Confirmar e salvar função':'Salvar alterações'}</button></div>
              </fieldset>
            </form>:<div className="space-y-2">
              <Campo label="Atuação" valor={r?.atuacao.join(', ')||'Não informado'}/><Campo label="Experiência" valor={r?.experiencia||'Não informado'}/>
              <Campo label="Criticidade atual" valor={r?.criticidade||'Não informado'}/><Campo label="Interesse em desenvolvimento" valor={r?.interesse||'Não informado'}/>
              <Campo label="Leitura orientativa" valor={leituraMatriz(r?.criticidade??null,r?.experiencia??null)}/>
              <Campo label="Observação" valor={r?.observacoes||'Não informado'}/><Campo label="Externo" valor={r?.externo||'Não informado'}/>
              {!readOnly&&<button type="button" className="underline text-primary text-sm" onClick={()=>{setDraft(reiniciar());setEditando(true);}}>Editar</button>}
            </div>}
          </div>}
        </div>;
      })}
    </section>)}
  </div>;
}
