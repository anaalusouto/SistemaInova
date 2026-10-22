import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FUNCOES_MATRIZ, ATUACAO_MATRIZ, EXPERIENCIA_MATRIZ, NIVEIS_MATRIZ, leituraMatriz, type MatrizPrototipoInput } from '../../diagnostic/catalog/matrizPrototipo';
import { listarRespostasMatriz, salvarMatrizPrototipo, obterImportacaoMatrizPendente, descartarImportacaoMatriz, type MatrizResposta } from '../../diagnosticos.server';
import { LeituraFuncaoMatriz } from './LeituraFuncaoMatriz';
import { ESTADOS_MATRIZ, estadoFuncaoMatriz, type EdicaoMatriz } from '../../diagnostic/estadoMatriz';
import { EntradaMatriz } from './EntradaMatriz';
import { validarConferencia, rascunhoVazio, type CampoImportado, type ConferenciaFuncao, type ImportacaoSalva, type DecisoesImportacao, type RascunhoMatriz } from '../../diagnostic/importarMatriz';

interface Props { diagnosticoId: string; organizacaoId: string; readOnly: boolean }
type Draft = RascunhoMatriz;
const inicial=(nome:string,r?:MatrizResposta):Draft=>({nomeFuncao:r?.nomeFuncao??nome,atuacao:r?.atuacao[0]??null,
  experiencia:r?.experiencia??null,criticidade:r?.criticidade??null,interesse:r?.interesse??null,observacoes:r?.observacoes??null,externo:r?.externo??null});

/** Rascunhos nunca acompanham a troca de organização ou aplicação. */
export function MatrizFuncionalTab(props:Props) {
  const client=useQueryClient();const key=['matriz-importacao',props.diagnosticoId,props.organizacaoId];
  const pendente=useQuery({queryKey:key,queryFn:()=>obterImportacaoMatrizPendente({data:{organizacaoId:props.organizacaoId,diagnosticoId:props.diagnosticoId}})});
  if(pendente.isLoading)return <p role="status">Carregando conferência da Matriz…</p>;
  if(pendente.error)return <p role="alert">Não foi possível carregar a conferência da Matriz. <button type="button" onClick={()=>void pendente.refetch()}>Tentar novamente</button></p>;
  return <MatrizDaAplicacao key={`${props.organizacaoId}:${props.diagnosticoId}:${pendente.data?.id??'manual'}:${pendente.data?.pendentes.join(',')??''}`} {...props} importacao={pendente.data??null}
    onRegistro={r=>client.setQueryData(key,r)} onImportacaoAlterada={()=>void client.invalidateQueries({queryKey:key})}/>;
}
function MatrizDaAplicacao({diagnosticoId,organizacaoId,readOnly,importacao,onRegistro,onImportacaoAlterada}:Props&{importacao:ImportacaoSalva|null;onRegistro:(r:ImportacaoSalva|null)=>void;onImportacaoAlterada:()=>void}) {
  const client=useQueryClient();
  const importadasIniciais=Object.fromEntries((importacao?.pendentes??[]).map(id=>[id,importacao?.dados.respostas[id]??rascunhoVazio(FUNCOES_MATRIZ.find(f=>f.id===id)?.nome??id)]));
  const [aberta,setAberta]=useState<string|null>(importacao?.pendentes[0]??null);
  const [editando,setEditando]=useState(Boolean(importacao?.pendentes.length));
  const [draft,setDraft]=useState<Draft>(importadasIniciais[importacao?.pendentes[0]??'']??inicial(''));
  const [iniciada,setIniciada]=useState(Boolean(importacao));
  const [entrada,setEntrada]=useState(false);
  const [importadas,setImportadas]=useState<Record<string,RascunhoMatriz>>(importadasIniciais);
  const origem=importacao?.origem.nomeArquivo??'';
  const pendencias=importacao?.dados.pendencias??[];
  const conferencia:Record<string,ConferenciaFuncao>=importacao?.dados.conferencia??{};
  const [decisoes,setDecisoes]=useState<DecisoesImportacao>({});
  const [confirmado,setConfirmado]=useState(false),[erroConferencia,setErroConferencia]=useState('');
  const [descartando,setDescartando]=useState(false);
  const [edicoes,setEdicoes]=useState<Record<string,EdicaoMatriz>>({});
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
      setEdicoes(anteriores=>{const novas={...anteriores};delete novas[data.funcaoId];return novas;});
      onImportacaoAlterada();
      void client.invalidateQueries({queryKey:['diagnostico-matriz',diagnosticoId]});
      void client.invalidateQueries({queryKey:['diagnostico',diagnosticoId]});
      void client.invalidateQueries({queryKey:['diagnostico-visao-geral']});
      setEditando(false);toast.success('Resposta salva.');
    },onError:(e:Error)=>{const mensagem=(e.message||'Não foi possível salvar.')+' Suas alterações continuam visíveis e ainda não foram confirmadas. Tente salvar novamente.';setErroConferencia(mensagem);toast.error(mensagem);},onSettled:()=>{emCurso.current=false;},
  });
  const avaliadas=FUNCOES_MATRIZ.filter(f=>{const r=indice.get(f.id);return r?.atuacao.length && r.experiencia && r.criticidade && r.interesse;}).length;
  const grupos=[...new Set(FUNCOES_MATRIZ.map(f=>f.grupo))];
  const atualizarEdicao=(valores:Draft,escolhas:DecisoesImportacao,revisada:boolean)=>{
    setDraft(valores);setDecisoes(escolhas);setConfirmado(revisada);setErroConferencia('');
    if(aberta)setEdicoes(anteriores=>({...anteriores,[aberta]:{valores,decisoes:escolhas,confirmado:revisada}}));
  };
  const alterar=<K extends keyof Draft>(campo:K,valor:Draft[K])=>{
    const novas={...decisoes};if(campo!=='nomeFuncao'){const chave=campo as CampoImportado;if(valor)novas[chave]='corrigido';else delete novas[chave];}
    atualizarEdicao({...draft,[campo]:valor},novas,false);
  };
  if(consulta.isLoading) return <p role="status">Carregando Matriz Funcional…</p>;
  if(consulta.error) return <div role="alert"><p>Não foi possível carregar a Matriz desta organização e aplicação.</p><button type="button" className="underline" onClick={()=>void consulta.refetch()}>Tentar novamente</button></div>;
  const temRespostas=FUNCOES_MATRIZ.some(f=>indice.has(f.id));
  const carregarEdicao=(id:string,base:Draft)=>{const edicao=edicoes[id];setDraft(edicao?.valores??base);setConfirmado(edicao?.confirmado??false);setDecisoes(edicao?.decisoes??{});setErroConferencia('');};
  if(!readOnly&&(entrada||(!iniciada&&!temRespostas)))return <EntradaMatriz organizacaoId={organizacaoId} diagnosticoId={diagnosticoId} temRespostas={temRespostas} onManual={()=>{setIniciada(true);setEntrada(false);}} onImportar={onRegistro} onCancelar={entrada?()=>setEntrada(false):undefined}/>;
  const estados=new Map(FUNCOES_MATRIZ.map(f=>[f.id,estadoFuncaoMatriz({salva:indice.has(f.id),importada:importadas[f.id],conferencia:conferencia[f.id],edicao:edicoes[f.id],editando:aberta===f.id&&editando,readOnly})]));
  const statusCampo=(campo:CampoImportado)=>{
    if(!origem||!aberta||indice.has(aberta))return null;
    const estado=conferencia[aberta]?.campos[campo]??'ausente';
    return <span className="text-xs text-muted-foreground">{estado==='reconhecido'?'Reconhecido no PDF · confira antes de salvar':estado==='ambiguo'?'Ambíguo no PDF · escolha ou corrija este campo':'Ausente no PDF · preencha se conhecido'}
      {estado==='ambiguo'&&<><span className="block whitespace-pre-wrap">Valores no PDF: {(conferencia[aberta]?.valores?.[campo]??[]).join(' / ')||'Função ou conteúdo não identificado com segurança'}</span><button type="button" className="underline" onClick={()=>atualizarEdicao({...draft,[campo]:null},{...decisoes,[campo]:'nao_identificado'},false)}>Manter como não identificado</button>{decisoes[campo]&&<span className="block">{decisoes[campo]==='corrigido'?'Resposta corrigida para conferência':'Decisão: dado não identificado'}</span>}</>}
    </span>;
  };
  const selecao=(label:string,campo:'atuacao'|'experiencia'|'criticidade'|'interesse',opcoes:readonly string[])=>
    <label className="flex flex-col gap-1 text-sm">{label}<select className="min-h-10 border rounded-lg bg-card p-2" value={draft[campo]??''} onChange={e=>alterar(campo,e.target.value||null)}>
      <option value="">Não informado</option>{opcoes.map(o=><option key={o} value={o}>{o}</option>)}
    </select>{statusCampo(campo)}{(campo==='criticidade'||campo==='interesse')&&<span className="text-xs text-muted-foreground">Escala de 1 a 4.</span>}</label>;
  return <div className="max-w-5xl space-y-4 min-w-0">
    <h3 className="font-semibold text-lg">Matriz Funcional</h3>
    <section aria-label="Estados da Matriz" className="space-y-2">
      <ul className="flex flex-wrap gap-2 text-xs">{ESTADOS_MATRIZ.map(e=><li key={e.id} title={e.descricao} className="rounded-lg border bg-card px-3 py-2"><span>{e.rotulo}: </span><strong>{[...estados.values()].filter(estado=>estado===e.id).length}</strong></li>)}</ul>
      <p className="text-xs text-muted-foreground">{readOnly?(importacao?'Somente leitura. As respostas do PDF pendente ainda não foram confirmadas.':'Somente leitura. Consulte as respostas salvas nesta aplicação.'):'As alterações só são gravadas ao salvar cada função. “Revisada” indica valores conferidos; os ainda não salvos são identificados abaixo.'}</p>
    </section>
    {!readOnly&&<button type="button" disabled={salvar.isPending||Object.keys(importadas).length>0} className="underline text-primary text-sm disabled:opacity-60" onClick={()=>setEntrada(true)}>Importar PDF</button>}
    {origem&&<div className="rounded-xl border p-4 space-y-2 text-sm" role="status"><p>PDF: {origem}. Funções ainda não salvas: {Object.keys(importadas).length}. Revisadas e prontas para salvar: {Object.keys(importadas).filter(id=>estados.get(id)==='revisada').length}.</p><p>Confira os campos reconhecidos, ausentes ou ambíguos. Corrija as respostas e confirme o salvamento de cada função. Nenhuma resposta é salva automaticamente.</p>
      {(Object.keys(conferencia).length<FUNCOES_MATRIZ.length||pendencias.length>0||Object.values(conferencia).some(f=>Object.values(f.campos).some(c=>c!=='reconhecido')))&&<p><strong>Importação parcial.</strong> Revise o que foi identificado e complete os campos ausentes manualmente. Respostas sem função correspondente não foram associadas automaticamente.</p>}
      {pendencias.length>0&&<details><summary>Ocorrências identificadas no PDF ({pendencias.length})</summary><ul className="list-disc pl-5">{pendencias.map((p,i)=><li key={i}>{p}</li>)}</ul></details>}
      {!readOnly&&Object.keys(importadas).length>0&&<button type="button" disabled={salvar.isPending||descartando} className="underline" onClick={async()=>{if(!importacao)return;setDescartando(true);try{await descartarImportacaoMatriz({data:{organizacaoId,diagnosticoId,importacaoId:importacao.id}});onRegistro(null);}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível descartar.');}finally{setDescartando(false);}}}>Descartar respostas ainda não salvas</button>}
    </div>}
    <p className="text-sm text-muted-foreground">{avaliadas} de {FUNCOES_MATRIZ.length} funções avaliadas.</p>
    {grupos.map(grupo=><section key={grupo} className="space-y-2"><h4 className="font-semibold text-sm">{grupo}</h4>
      {FUNCOES_MATRIZ.filter(f=>f.grupo===grupo).map(f=>{
        const r=indice.get(f.id),open=aberta===f.id;
        const reiniciar=()=>importadas[f.id]??inicial(f.nome,r);
        const estado=ESTADOS_MATRIZ.find(e=>e.id===estados.get(f.id))!;
        const valoresConsulta=r?inicial(f.nome,r):importadas[f.id]??inicial(f.nome);
        const valoresLinha=(!readOnly?edicoes[f.id]?.valores:undefined)??valoresConsulta;
        const nome=valoresLinha.nomeFuncao||f.nome;
        return <div key={f.id} data-inova-form="matriz" data-inova-field={f.id} data-estado-matriz={estado.id} className="border rounded-xl bg-card overflow-hidden">
          <button type="button" disabled={salvar.isPending||descartando} aria-expanded={open} className="w-full flex flex-wrap items-center gap-2 p-3 text-left"
            onClick={()=>{carregarEdicao(f.id,reiniciar());setAberta(open?null:f.id);setEditando(!open&&!readOnly&&(!r||Boolean(edicoes[f.id])));}}>
            {open?<ChevronDown size={14}/>:<ChevronRight size={14}/>}<span className="text-xs text-muted-foreground">{f.id}</span>
            <span className="flex-1 min-w-0 break-words font-medium text-sm">{nome}</span><span className="text-xs text-muted-foreground">{leituraMatriz(valoresLinha.criticidade,valoresLinha.experiencia)}</span>
            <span aria-label={`Estado da função ${f.id}: ${estado.rotulo}`} className="rounded border px-2 py-1 text-xs" title={estado.descricao}>{estado.rotulo}</span>
            {origem&&<span className="text-xs font-medium">{r?'Salva nesta aplicação':!conferencia[f.id]?'Ausente no PDF':estado.id==='revisada'?'PDF conferido · ainda não salvo':estado.id==='com_pendencias'?'PDF · requer conferência':'Origem: PDF'}</span>}
          </button>
          {open&&<div className="border-t p-4">
            <p role="status" className="mb-3 text-xs text-muted-foreground">{r&&!edicoes[f.id]&&!editando?'Respostas salvas nesta aplicação.':estado.id==='revisada'?'Valores revisados e prontos para salvar. Ainda não salvos.':readOnly&&importadas[f.id]?'Prévia do PDF pendente. Valores ainda não confirmados nem salvos na Matriz.':estado.descricao}</p>
            {editando&&!readOnly?<form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(readOnly||emCurso.current)return;
              const revisao=importacao&&importadas[f.id]?{id:importacao.id,decisoes,confirmado}:undefined;
              if(revisao)try{validarConferencia(conferencia[f.id],draft,decisoes,confirmado);}catch(erro){setErroConferencia((erro as Error).message);return;}
              setErroConferencia('');emCurso.current=true;salvar.mutate({organizacaoId,diagnosticoId,funcaoId:f.id,...draft,importacao:revisao});}}>
              <fieldset disabled={salvar.isPending||descartando} className="contents">
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Função<input required maxLength={500} className="border rounded-lg bg-card p-2" value={draft.nomeFuncao} onChange={e=>alterar('nomeFuncao',e.target.value)}/></label>
                {selecao('Atuação','atuacao',ATUACAO_MATRIZ)}{selecao('Experiência','experiencia',EXPERIENCIA_MATRIZ)}
                {selecao('Criticidade atual','criticidade',NIVEIS_MATRIZ)}{selecao('Interesse em desenvolvimento','interesse',NIVEIS_MATRIZ)}
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Leitura orientativa<input readOnly className="border rounded-lg bg-muted p-2" value={leituraMatriz(draft.criticidade,draft.experiencia)}/><span className="text-xs text-muted-foreground">Calculada automaticamente. A prévia acompanha suas alterações. Clique em Salvar alterações para confirmar.</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Observação<textarea className="border rounded-lg bg-card p-2 min-h-24" maxLength={20000} value={draft.observacoes??''} onChange={e=>alterar('observacoes',e.target.value||null)}/>{statusCampo('observacoes')}<span className="text-xs text-muted-foreground">Reúne o relato, a necessidade, o público e a mudança desejada.</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Externo<textarea className="border rounded-lg bg-card p-2" maxLength={20000} value={draft.externo??''} onChange={e=>alterar('externo',e.target.value||null)}/>{statusCampo('externo')}<span className="text-xs text-muted-foreground">Informe quem participa externamente. Deixe vazio quando não identificado.</span></label>
                {importadas[f.id]&&<label className="sm:col-span-2 flex items-start gap-2 text-sm"><input type="checkbox" required checked={confirmado} onChange={e=>atualizarEdicao(draft,decisoes,e.target.checked)}/>Conferi esta função e as decisões dos campos ambíguos. Campos não identificados permanecerão vazios.</label>}
                {estado.id==='revisada'&&<section aria-label={`Valores revisados da função ${f.id}`} className="sm:col-span-2 rounded-lg border bg-card p-3"><p className="mb-2 text-sm font-medium">Confira os valores antes de salvar</p><LeituraFuncaoMatriz valores={draft}/></section>}
                {erroConferencia&&<p role="alert" className="sm:col-span-2 text-sm">{erroConferencia}</p>}
                <div className="sm:col-span-2 flex flex-wrap gap-2"><button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={()=>{setEdicoes(anteriores=>{const novas={...anteriores};delete novas[f.id];return novas;});setDraft(reiniciar());setConfirmado(false);setDecisoes({});setErroConferencia('');setEditando(false);}}>Cancelar</button>
                  {!importadas[f.id]&&<button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={()=>{if(!draft.nomeFuncao.trim()){setErroConferencia('Informe o nome da função antes de revisar.');return;}atualizarEdicao(draft,decisoes,true);}}>Revisar valores</button>}
                  <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">{salvar.isPending?'Salvando…':importadas[f.id]?'Confirmar e salvar função':'Salvar alterações'}</button></div>
              </fieldset>
            </form>:<div className="space-y-2">
              <LeituraFuncaoMatriz valores={valoresConsulta}/>
              {r?.origemPdf&&<details className="text-xs"><summary>Origem e conferência do PDF</summary><p>{r.origemPdf.nomeArquivo} · conferida em {new Date(r.origemPdf.conferidoEm).toLocaleString('pt-BR')}</p><p className="break-all">SHA-256: {r.origemPdf.sha256}</p></details>}
              {!readOnly&&<button type="button" className="underline text-primary text-sm" onClick={()=>{carregarEdicao(f.id,reiniciar());setEditando(true);}}>Editar</button>}
            </div>}
          </div>}
        </div>;
      })}
    </section>)}
  </div>;
}
