import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PopupDetalhe } from '../PopupDetalhe';
import { ConferenciaCampoMatriz, MatrizLinhaEdicao } from './MatrizLinhaEdicao';
import { FUNCOES_MATRIZ, ATUACAO_MATRIZ, EXPERIENCIA_MATRIZ, NIVEIS_MATRIZ, leituraMatriz, type MatrizPrototipoInput } from '../../diagnostic/catalog/matrizPrototipo';
import { listarRespostasMatriz, salvarMatrizPrototipo, obterImportacaoMatrizPendente, descartarImportacaoMatriz, type MatrizResposta } from '../../diagnosticos.server';
import { LeituraFuncaoMatriz } from './LeituraFuncaoMatriz';
import { ESTADOS_MATRIZ, estadoFuncaoMatriz, type EdicaoMatriz } from '../../diagnostic/estadoMatriz';
import { EntradaMatriz } from './EntradaMatriz';
import { PainelMatriz } from './PainelMatriz';
import { validarConferencia, rascunhoVazio, type CampoImportado, type ConferenciaFuncao, type ImportacaoSalva, type DecisoesImportacao, type RascunhoMatriz } from '../../diagnostic/importarMatriz';

interface Props { diagnosticoId: string; organizacaoId: string; readOnly: boolean }
type Draft = RascunhoMatriz;
const inicial=(nome:string,r?:MatrizResposta):Draft=>({nomeFuncao:nome,atuacao:r?.atuacao[0]??null,
  experiencia:r?.experiencia??null,criticidade:r?.criticidade??null,interesse:r?.interesse??null,observacoes:r?.observacoes??null,externo:r?.externo??null});

/** Rascunhos nunca acompanham a troca de organização ou aplicação. */
export function MatrizFuncionalTab(props:Props) {
  const client=useQueryClient();const key=['matriz-importacao',props.diagnosticoId,props.organizacaoId];
  const pendente=useQuery({queryKey:key,queryFn:()=>obterImportacaoMatrizPendente({data:{organizacaoId:props.organizacaoId,diagnosticoId:props.diagnosticoId}})});
  if(pendente.isLoading)return <p role="status">Carregando conferência da Matriz…</p>;
  if(pendente.error)return <p role="alert">Não foi possível carregar a conferência da Matriz. <button type="button" onClick={()=>void pendente.refetch()}>Tentar novamente</button></p>;
  return <MatrizDaAplicacao key={`${props.organizacaoId}:${props.diagnosticoId}`} {...props} importacao={pendente.data??null}
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
  const [edicaoTabela,setEdicaoTabela]=useState(false);
  const [errosLinha,setErrosLinha]=useState<Record<string,string>>({});
  const importacaoAnterior=useRef(importacao?.id);
  useEffect(()=>{
    // Atualizar a conferência não remonta a tabela nem apaga rascunhos de outras linhas.
    if(importacaoAnterior.current===importacao?.id)return;
    importacaoAnterior.current=importacao?.id;
    const importadas=Object.fromEntries((importacao?.pendentes??[]).map(id=>[id,importacao?.dados.respostas[id]??rascunhoVazio(FUNCOES_MATRIZ.find(f=>f.id===id)?.nome??id)]));
    setImportadas(importadas);
    if(importacao?.pendentes.length){
      const id=importacao.pendentes[0];setIniciada(true);setEntrada(false);setAberta(id);setEditando(!readOnly);
      setDraft(importadas[id]);setDecisoes({});setConfirmado(false);setErroConferencia('');
    }
  },[importacao,readOnly]);
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
      setErrosLinha(anteriores=>({...anteriores,[data.funcaoId]:''}));setErroConferencia('');
      onImportacaoAlterada();
      void client.invalidateQueries({queryKey:['diagnostico-matriz',diagnosticoId]});
      void client.invalidateQueries({queryKey:['diagnostico',diagnosticoId]});
      void client.invalidateQueries({queryKey:['diagnostico-visao-geral']});
      setEditando(false);toast.success('Resposta salva.');
    },onError:(e:Error,data)=>{const mensagem=(e.message||'Não foi possível salvar.')+' Suas alterações continuam visíveis e ainda não foram confirmadas. Tente salvar novamente.';setErrosLinha(anteriores=>({...anteriores,[data.funcaoId]:mensagem}));setErroConferencia(mensagem);toast.error(mensagem);},onSettled:()=>{emCurso.current=false;},
  });
  const avaliadas=FUNCOES_MATRIZ.filter(f=>{const r=indice.get(f.id);return r?.atuacao.length && r.experiencia && r.criticidade && r.interesse;}).length;
  const grupos=[...new Set(FUNCOES_MATRIZ.map(f=>f.grupo))];
  const pendentes=Object.keys(edicoes).length;
  const ocupado=salvar.isPending||descartando;
  const gravarFuncao=(id:string,valores:Draft,escolhas:DecisoesImportacao,revisada:boolean)=>{
    if(readOnly||emCurso.current||descartando)return;
    try {
      const funcao=FUNCOES_MATRIZ.find(f=>f.id===id);
      if(!funcao)throw new Error('Função inválida.');
      const resposta={...valores,nomeFuncao:funcao.nome};
      const revisao=importacao&&importadas[id]?{id:importacao.id,decisoes:escolhas,confirmado:revisada}:undefined;
      if(revisao)validarConferencia(conferencia[id],resposta,escolhas,revisada);
      setErroConferencia('');setErrosLinha(anteriores=>({...anteriores,[id]:''}));emCurso.current=true;
      salvar.mutate({organizacaoId,diagnosticoId,funcaoId:id,...resposta,importacao:revisao});
    }catch(e){const mensagem=(e as Error).message;setErroConferencia(mensagem);setErrosLinha(anteriores=>({...anteriores,[id]:mensagem}));}
  };
  const cancelarLinha=(id:string)=>{
    setEdicoes(anteriores=>{const novas={...anteriores};delete novas[id];return novas;});
    setErrosLinha(anteriores=>({...anteriores,[id]:''}));
  };
  const editarLinha=(id:string,valores:Draft,escolhas:DecisoesImportacao,confirmado=false)=>{
    if(readOnly||ocupado)return;
    setEdicoes(anteriores=>({...anteriores,[id]:{valores,decisoes:escolhas,confirmado}}));
    setErrosLinha(anteriores=>({...anteriores,[id]:''}));
  };
  const atualizarEdicao=(valores:Draft,escolhas:DecisoesImportacao,revisada:boolean)=>{
    setDraft(valores);setDecisoes(escolhas);setConfirmado(revisada);setErroConferencia('');
    if(aberta)setEdicoes(anteriores=>({...anteriores,[aberta]:{valores,decisoes:escolhas,confirmado:revisada}}));
  };
  const alterar=<K extends CampoImportado>(campo:K,valor:Draft[K])=>{
    const novas={...decisoes};if(valor)novas[campo]='corrigido';else delete novas[campo];
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
    return <ConferenciaCampoMatriz campo={campo} conferencia={conferencia[aberta]} decisao={decisoes[campo]} aoManterVazio={()=>atualizarEdicao({...draft,[campo]:null},{...decisoes,[campo]:'nao_identificado'},false)}/>;
  };
  const selecao=(label:string,campo:'atuacao'|'experiencia'|'criticidade'|'interesse',opcoes:readonly string[])=>
    <label className="flex flex-col gap-1 text-sm">{label}<select className="min-h-10 border rounded-lg bg-card p-2" value={draft[campo]??''} onChange={e=>alterar(campo,e.target.value||null)}>
      <option value="">Não informado</option>{opcoes.map(o=><option key={o} value={o}>{o}</option>)}
    </select>{statusCampo(campo)}{(campo==='criticidade'||campo==='interesse')&&<span className="text-xs text-muted-foreground">Escala de 1 a 4.</span>}</label>;
  const selecionarFuncao=(id:string)=>{
    if(ocupado||edicaoTabela)return;
    const f=FUNCOES_MATRIZ.find(item=>item.id===id)!;
    carregarEdicao(id,importadas[id]??inicial(f.nome,indice.get(id)));
    setAberta(id);setEditando(!readOnly&&(!indice.has(id)||Boolean(edicoes[id])));
  };
  return <div className="w-full space-y-4 min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-2xl sm:text-3xl">Matriz Funcional</h3>
    <p className="mt-2 text-sm text-muted-foreground">Leitura visual por criticidade atual e interesse em desenvolvimento.</p></div><span className="rounded-full border bg-muted px-3 py-2 text-xs text-muted-foreground">Criticidade × interesse</span></div>
    <section aria-label="Estados da Matriz" className="space-y-2">
      <ul className="flex flex-wrap gap-2 text-xs">{ESTADOS_MATRIZ.map(e=><li key={e.id} title={e.descricao} className="rounded-lg border bg-card px-3 py-2"><span>{e.rotulo}: </span><strong>{[...estados.values()].filter(estado=>estado===e.id).length}</strong></li>)}</ul>
      <p className="text-xs text-muted-foreground">{readOnly?(importacao?'Somente leitura. As respostas do PDF pendente ainda não foram confirmadas.':'Somente leitura. Consulte as respostas salvas nesta aplicação.'):'As alterações só são gravadas ao salvar cada função. “Revisada” indica valores conferidos; os ainda não salvos são identificados abaixo.'}</p>
    </section>
    {!readOnly&&<div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={ocupado||(edicaoTabela&&pendentes>0)} className="border rounded-lg px-3 py-1.5 text-xs disabled:opacity-60" onClick={()=>{setAberta(null);setEditando(false);setEdicaoTabela(v=>!v);}}>{edicaoTabela?'Fechar edição':'Editar'}</button>
      <button type="button" disabled={ocupado||edicaoTabela||pendentes>0||Object.keys(importadas).length>0} className="underline text-primary text-sm disabled:opacity-60" onClick={()=>setEntrada(true)}>Importar PDF</button>
    </div>}
    {!readOnly&&edicaoTabela&&<p role="status" className="text-sm">Edite as células e salve ou cancele cada linha. {pendentes>0?`${pendentes} linha(s) com alterações não salvas.`:''}</p>}
    {origem&&<div className="rounded-xl border p-4 space-y-2 text-sm" role="status"><p>PDF: {origem}. Funções ainda não salvas: {Object.keys(importadas).length}. Revisadas e prontas para salvar: {Object.keys(importadas).filter(id=>estados.get(id)==='revisada').length}.</p><p>Confira os campos reconhecidos, ausentes ou ambíguos. Corrija as respostas e confirme o salvamento de cada função. Nenhuma resposta é salva automaticamente.</p>
      {(Object.keys(conferencia).length<FUNCOES_MATRIZ.length||pendencias.length>0||Object.values(conferencia).some(f=>Object.values(f.campos).some(c=>c!=='reconhecido')))&&<p><strong>Importação parcial.</strong> Revise o que foi identificado e complete os campos ausentes manualmente. Respostas sem função correspondente não foram associadas automaticamente.</p>}
      {pendencias.length>0&&<details><summary>Ocorrências identificadas no PDF ({pendencias.length})</summary><ul className="list-disc pl-5">{pendencias.map((p,i)=><li key={i}>{p}</li>)}</ul></details>}
      {!readOnly&&Object.keys(importadas).length>0&&<button type="button" disabled={ocupado||pendentes>0} className="underline" onClick={async()=>{if(!importacao)return;setDescartando(true);try{await descartarImportacaoMatriz({data:{organizacaoId,diagnosticoId,importacaoId:importacao.id}});onRegistro(null);}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível descartar.');}finally{setDescartando(false);}}}>Descartar respostas ainda não salvas</button>}
    </div>}
    <p className="text-sm text-muted-foreground">{avaliadas} de {FUNCOES_MATRIZ.length} funções avaliadas.</p>
    <PainelMatriz linhas={FUNCOES_MATRIZ.map(f=>({id:f.id,valores:{...((!readOnly?edicoes[f.id]?.valores:undefined)??(indice.has(f.id)?inicial(f.nome,indice.get(f.id)):importadas[f.id]??inicial(f.nome))),nomeFuncao:f.nome},estado:ESTADOS_MATRIZ.find(e=>e.id===estados.get(f.id))!.rotulo}))} onSelecionar={selecionarFuncao} desabilitado={ocupado||edicaoTabela} filtroBloqueado={pendentes>0||ocupado}
      renderEdicao={!readOnly&&edicaoTabela?linha=>{
        const edicao=edicoes[linha.id];const escolhas=edicao?.decisoes??{};const revisada=edicao?.confirmado??false;
        const alterarCampo=<K extends CampoImportado>(campo:K,valor:Draft[K])=>{
          const novas={...escolhas};if(valor)novas[campo]='corrigido';else delete novas[campo];
          editarLinha(linha.id,{...linha.valores,[campo]:valor},novas);
        };
        return <MatrizLinhaEdicao id={linha.id} formularioId={`matriz-${organizacaoId}-${diagnosticoId}-${linha.id}`} valores={linha.valores} estado={linha.estado} bloqueado={ocupado} pendente={!!edicao} importada={!!importadas[linha.id]} conferencia={conferencia[linha.id]} decisoes={escolhas} confirmado={revisada} erro={errosLinha[linha.id]}
          aoAlterar={alterarCampo} aoNaoIdentificado={campo=>editarLinha(linha.id,{...linha.valores,[campo]:null},{...escolhas,[campo]:'nao_identificado'})} aoConferir={valor=>editarLinha(linha.id,linha.valores,escolhas,valor)} aoSalvar={()=>gravarFuncao(linha.id,linha.valores,escolhas,revisada)} aoCancelar={()=>cancelarLinha(linha.id)}/>;
      }:undefined}/>
    {grupos.map(grupo=><section key={grupo} className="space-y-2"><h4 className="sr-only">{grupo}</h4>
      {FUNCOES_MATRIZ.filter(f=>f.grupo===grupo&&f.id===aberta).map(f=>{
        const r=indice.get(f.id),open=aberta===f.id;
        const reiniciar=()=>importadas[f.id]??inicial(f.nome,r);
        const estado=ESTADOS_MATRIZ.find(e=>e.id===estados.get(f.id))!;
        const valoresConsulta=r?inicial(f.nome,r):importadas[f.id]??inicial(f.nome);
        const valoresLinha=(!readOnly?edicoes[f.id]?.valores:undefined)??valoresConsulta;
        const nome=f.nome;
        return <PopupDetalhe key={f.id} titulo={`${f.id} · ${nome}`} descricao={`${grupo} · Matriz Funcional`} bloqueado={ocupado} aoFechar={()=>{setAberta(null);setEditando(false);}}>
        <div id={`matriz-funcao-${f.id}`} data-inova-form="matriz" data-inova-field={f.id} data-estado-matriz={estado.id}>
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <span className="text-xs text-muted-foreground">{f.id}</span>
            <span className="flex-1 min-w-0 break-words font-medium text-sm">{nome}</span><span className="text-xs text-muted-foreground">{leituraMatriz(valoresLinha.criticidade,valoresLinha.experiencia)}</span>
            <span aria-label={`Estado da função ${f.id}: ${estado.rotulo}`} className="rounded border px-2 py-1 text-xs" title={estado.descricao}>{estado.rotulo}</span>
            {origem&&<span className="text-xs font-medium">{r?'Salva nesta aplicação':!conferencia[f.id]?'Ausente no PDF':estado.id==='revisada'?'PDF conferido · ainda não salvo':estado.id==='com_pendencias'?'PDF · requer conferência':'Origem: PDF'}</span>}
          </div>
          {open&&<div className="border-t p-4">
            <p role="status" className="mb-3 text-xs text-muted-foreground">{r&&!edicoes[f.id]&&!editando?'Respostas salvas nesta aplicação.':estado.id==='revisada'?'Valores revisados e prontos para salvar. Ainda não salvos.':readOnly&&importadas[f.id]?'Prévia do PDF pendente. Valores ainda não confirmados nem salvos na Matriz.':estado.descricao}</p>
            {editando&&!readOnly?<form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(readOnly||emCurso.current)return;
              gravarFuncao(f.id,draft,decisoes,confirmado);}}>
              <fieldset disabled={salvar.isPending||descartando} className="contents">
                <div className="sm:col-span-2 text-sm"><span className="block text-xs text-muted-foreground">Função</span><p className="mt-1 font-medium">{f.nome}</p></div>
                {selecao('Atuação','atuacao',ATUACAO_MATRIZ)}{selecao('Experiência','experiencia',EXPERIENCIA_MATRIZ)}
                {selecao('Criticidade atual','criticidade',NIVEIS_MATRIZ)}{selecao('Interesse em desenvolvimento','interesse',NIVEIS_MATRIZ)}
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Leitura orientativa<input readOnly className="border rounded-lg bg-muted p-2" value={leituraMatriz(draft.criticidade,draft.experiencia)}/><span className="text-xs text-muted-foreground">Calculada automaticamente. A prévia acompanha suas alterações. Clique em Salvar alterações para confirmar.</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Observação<textarea className="border rounded-lg bg-card p-2 min-h-24" maxLength={20000} value={draft.observacoes??''} onChange={e=>alterar('observacoes',e.target.value||null)}/>{statusCampo('observacoes')}<span className="text-xs text-muted-foreground">Reúne o relato, a necessidade, o público e a mudança desejada.</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Externo<textarea className="border rounded-lg bg-card p-2" maxLength={20000} value={draft.externo??''} onChange={e=>alterar('externo',e.target.value||null)}/>{statusCampo('externo')}<span className="text-xs text-muted-foreground">Informe quem participa externamente. Deixe vazio quando não identificado.</span></label>
                {importadas[f.id]&&<label className="sm:col-span-2 flex items-start gap-2 text-sm"><input type="checkbox" required checked={confirmado} onChange={e=>atualizarEdicao(draft,decisoes,e.target.checked)}/>Conferi esta função e as decisões dos campos ambíguos. Campos não identificados permanecerão vazios.</label>}
                {estado.id==='revisada'&&<section aria-label={`Valores revisados da função ${f.id}`} className="sm:col-span-2 rounded-lg border bg-card p-3"><p className="mb-2 text-sm font-medium">Confira os valores antes de salvar</p><LeituraFuncaoMatriz valores={draft}/></section>}
                {erroConferencia&&<p role="alert" className="sm:col-span-2 text-sm">{erroConferencia}</p>}
                <div className="sm:col-span-2 flex flex-wrap gap-2"><button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={()=>{cancelarLinha(f.id);setDraft(reiniciar());setConfirmado(false);setDecisoes({});setErroConferencia('');setEditando(false);}}>Cancelar</button>
                  {!importadas[f.id]&&<button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={()=>{if(!draft.nomeFuncao.trim()){setErroConferencia('Informe o nome da função antes de revisar.');return;}atualizarEdicao(draft,decisoes,true);}}>Revisar valores</button>}
                  <button type="submit" className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">{salvar.isPending?'Salvando…':importadas[f.id]?'Confirmar e salvar função':'Salvar alterações'}</button></div>
              </fieldset>
            </form>:<div className="space-y-2">
              <LeituraFuncaoMatriz valores={valoresConsulta}/>
              {r?.origemPdf&&<details className="text-xs"><summary>Origem e conferência do PDF</summary><p>{r.origemPdf.nomeArquivo} · conferida em {new Date(r.origemPdf.conferidoEm).toLocaleString('pt-BR')}</p><p className="break-all">SHA-256: {r.origemPdf.sha256}</p></details>}
              {!readOnly&&<button type="button" className="underline text-primary text-sm" onClick={()=>{carregarEdicao(f.id,reiniciar());setEditando(true);}}>Editar</button>}
            </div>}
          </div>}
        </div></PopupDetalhe>;
      })}
    </section>)}
  </div>;
}
