import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PopupDetalhe } from '../PopupDetalhe';
import { usePendenciaModulo } from '../PendenciasModulo';
import { ConferenciaCampoMatriz, MatrizLinhaEdicao } from './MatrizLinhaEdicao';
import { FUNCOES_MATRIZ, ATUACAO_MATRIZ, EXPERIENCIA_MATRIZ, NIVEIS_MATRIZ, leituraMatriz, type MatrizPrototipoInput } from '../../diagnostic/catalog/matrizPrototipo';
import { listarRespostasMatriz, salvarMatrizPrototipo, obterImportacaoMatrizPendente, descartarImportacaoMatriz, type MatrizResposta } from '../../diagnosticos.server';
import { LeituraFuncaoMatriz } from './LeituraFuncaoMatriz';
import { ESTADOS_MATRIZ, estadoFuncaoMatriz, type EdicaoMatriz } from '../../diagnostic/estadoMatriz';
import { EntradaMatriz } from './EntradaMatriz';
import { PainelMatriz } from './PainelMatriz';
import { AvaliacaoMatriz } from './AvaliacaoMatriz';
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
  const [avaliacoesPendentes,setAvaliacoesPendentes]=useState<Record<string,boolean>>({});
  const temAvaliacaoPendente=Object.values(avaliacoesPendentes).some(Boolean);
  const [errosLinha,setErrosLinha]=useState<Record<string,string>>({});
  const importacaoAnterior=useRef(importacao?.id);
  useEffect(()=>{
    // Atualizar a conferência não remonta a tabela nem apaga rascunhos de outras linhas.
    if(importacaoAnterior.current===importacao?.id)return;
    importacaoAnterior.current=importacao?.id;
    const importadas=Object.fromEntries((importacao?.pendentes??[]).map(id=>[id,importacao?.dados.respostas[id]??rascunhoVazio(FUNCOES_MATRIZ.find(f=>f.id===id)?.nome??id)]));
    setImportadas(importadas);
    if(importacao?.pendentes.length){
      const id=importacao.pendentes[0];setEntrada(false);setAberta(id);setEditando(!readOnly);
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
      void client.invalidateQueries({queryKey:['prioridades-cruzadas']});
      void client.invalidateQueries({queryKey:['portfolio-detalhes-mapeamento']});
    },onError:(e:Error,data)=>{const mensagem=(e.message||'Não foi possível salvar.')+' Suas alterações continuam visíveis e ainda não foram confirmadas. Tente salvar novamente.';setErrosLinha(anteriores=>({...anteriores,[data.funcaoId]:mensagem}));setErroConferencia(mensagem);toast.error(mensagem);},onSettled:()=>{emCurso.current=false;},
  });
  const avaliadas=FUNCOES_MATRIZ.filter(f=>{const r=indice.get(f.id);return r?.atuacao.length && r.experiencia && r.criticidade && r.interesse;}).length;
  const grupos=[...new Set(FUNCOES_MATRIZ.map(f=>f.grupo))];
  const pendentes=Object.keys(edicoes).length;
  const ocupado=salvar.isPending||descartando;
  usePendenciaModulo(!readOnly && (pendentes > 0 || ocupado));
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
  useEffect(()=>{
    if(readOnly || ocupado) return;
    const proxima = Object.entries(edicoes).find(([id]) => !importadas[id] && !errosLinha[id]);
    if(!proxima) return;
    const [id, edicao] = proxima;
    const timer = window.setTimeout(()=>gravarFuncao(id,edicao.valores,edicao.decisoes,edicao.confirmado),1000);
    return ()=>window.clearTimeout(timer);
  },[edicoes,readOnly,ocupado,importadas,errosLinha]);
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
    if(aberta){setEdicoes(anteriores=>({...anteriores,[aberta]:{valores,decisoes:escolhas,confirmado:revisada}}));setErrosLinha(anteriores=>({...anteriores,[aberta]:''}));}
  };
  const alterar=<K extends CampoImportado>(campo:K,valor:Draft[K])=>{
    const novas={...decisoes};if(valor)novas[campo]='corrigido';else delete novas[campo];
    atualizarEdicao({...draft,[campo]:valor},novas,false);
  };
  if(consulta.isLoading) return <p role="status">Carregando Matriz Funcional…</p>;
  if(consulta.error) return <div role="alert"><p>Não foi possível carregar a Matriz desta organização e aplicação.</p><button type="button" className="underline" onClick={()=>void consulta.refetch()}>Tentar novamente</button></div>;
  const temRespostas=FUNCOES_MATRIZ.some(f=>indice.has(f.id));
  const carregarEdicao=(id:string,base:Draft)=>{const edicao=edicoes[id];setDraft(edicao?.valores??base);setConfirmado(edicao?.confirmado??false);setDecisoes(edicao?.decisoes??{});setErroConferencia('');};
  if(!readOnly&&entrada)return <EntradaMatriz organizacaoId={organizacaoId} diagnosticoId={diagnosticoId} temRespostas={temRespostas} onManual={()=>{setEntrada(false);setEdicaoTabela(true);}} onImportar={registro=>{onRegistro(registro);setEntrada(false);}} onCancelar={()=>setEntrada(false)}/>;
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
    if(ocupado||edicaoTabela||temAvaliacaoPendente)return;
    const f=FUNCOES_MATRIZ.find(item=>item.id===id)!;
    carregarEdicao(id,importadas[id]??inicial(f.nome,indice.get(id)));
    setAberta(id);setEditando(!readOnly&&(!indice.has(id)||Boolean(edicoes[id])));
  };
  return <div className="w-full space-y-4 min-w-0">
    <PainelMatriz cabecalho={<div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Distribuição das funções pela categoria da coluna Leitura. Criticidade e Interesse continuam disponíveis na tabela e no preenchimento.</p><div className="flex flex-wrap items-center gap-2">
      {!readOnly&&<><button type="button" aria-pressed={edicaoTabela} disabled={ocupado||temAvaliacaoPendente||(edicaoTabela&&pendentes>0)} className="border rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-60" onClick={()=>{setAberta(null);setEditando(false);setEdicaoTabela(v=>!v);}}>{edicaoTabela?'Fechar edição':'Editar'}</button><button type="button" disabled={ocupado||temAvaliacaoPendente||edicaoTabela||pendentes>0||Object.keys(importadas).length>0} className="border rounded-lg px-3 py-2 text-xs font-medium disabled:opacity-60" onClick={()=>setEntrada(true)}>Importar PDF</button></>}
    </div></div>
    <section aria-label="Estados da Matriz" className="space-y-2">
      <ul className="flex flex-wrap gap-2 text-xs">{ESTADOS_MATRIZ.map(e=><li key={e.id} title={e.descricao} className="rounded-lg border bg-card px-3 py-2"><span>{e.rotulo}: </span><strong>{[...estados.values()].filter(estado=>estado===e.id).length}</strong></li>)}</ul>
      <p className="text-xs text-muted-foreground">{readOnly?(importacao?'Somente leitura. Há respostas importadas que ainda não foram confirmadas.':'Somente leitura. Consulte as respostas salvas nesta aplicação.'):'As alterações manuais são salvas automaticamente. Respostas importadas exigem conferência e confirmação antes de salvar.'}</p>
    </section>
    {!readOnly&&edicaoTabela&&<p role="status" className="text-sm">{ocupado?'Salvando alterações…':pendentes>0?`${pendentes} linha(s) aguardando salvamento ou conferência.`:'Alterações manuais são salvas automaticamente.'}</p>}
    {origem&&<div className="rounded-xl border p-4 space-y-2 text-sm" role="status"><p>Respostas importadas. Funções ainda não salvas: {Object.keys(importadas).length}. Revisadas e prontas para salvar: {Object.keys(importadas).filter(id=>estados.get(id)==='revisada').length}.</p><p>Confira os campos identificados, ausentes ou ambíguos. Corrija as respostas e confirme o salvamento de cada função. Nenhuma resposta é salva automaticamente.</p>
      {(Object.keys(conferencia).length<FUNCOES_MATRIZ.length||pendencias.length>0||Object.values(conferencia).some(f=>Object.values(f.campos).some(c=>c!=='reconhecido')))&&<p><strong>Importação parcial.</strong> Revise o que foi identificado e complete os campos ausentes manualmente. Respostas sem função correspondente não foram associadas automaticamente.</p>}
      {pendencias.length>0&&<details><summary>Ocorrências identificadas ({pendencias.length})</summary><ul className="list-disc pl-5">{pendencias.map((p,i)=><li key={i}>{p}</li>)}</ul></details>}
      {!readOnly&&Object.keys(importadas).length>0&&<button type="button" disabled={ocupado||pendentes>0} className="underline" onClick={async()=>{if(!importacao)return;setDescartando(true);try{await descartarImportacaoMatriz({data:{organizacaoId,diagnosticoId,importacaoId:importacao.id}});onRegistro(null);}catch(e){toast.error(e instanceof Error?e.message:'Não foi possível descartar.');}finally{setDescartando(false);}}}>Descartar respostas ainda não salvas</button>}
    </div>}
    <p className="text-sm text-muted-foreground">{avaliadas} de {FUNCOES_MATRIZ.length} funções avaliadas.</p>
    </div>} linhas={FUNCOES_MATRIZ.map(f=>({id:f.id,valores:{...((!readOnly?edicoes[f.id]?.valores:undefined)??(indice.has(f.id)?inicial(f.nome,indice.get(f.id)):importadas[f.id]??inicial(f.nome))),nomeFuncao:f.nome},estado:ESTADOS_MATRIZ.find(e=>e.id===estados.get(f.id))!.rotulo}))} onSelecionar={selecionarFuncao} desabilitado={ocupado||edicaoTabela||temAvaliacaoPendente} filtroBloqueado={pendentes>0||ocupado||temAvaliacaoPendente}
      renderAvaliacao={id=><AvaliacaoMatriz key={`${organizacaoId}:${diagnosticoId}:${id}`} aoPendencias={setAvaliacoesPendentes} funcaoId={id} organizacaoId={organizacaoId} diagnosticoId={diagnosticoId} readOnly={readOnly||!edicaoTabela||ocupado}/>}
      renderEdicao={!readOnly&&edicaoTabela?linha=>{
        const edicao=edicoes[linha.id];const escolhas=edicao?.decisoes??{};const revisada=edicao?.confirmado??false;
        const alterarCampo=<K extends CampoImportado>(campo:K,valor:Draft[K])=>{
          const novas={...escolhas};if(valor)novas[campo]='corrigido';else delete novas[campo];
          editarLinha(linha.id,{...linha.valores,[campo]:valor},novas);
        };
        return <MatrizLinhaEdicao id={linha.id} formularioId={`matriz-${organizacaoId}-${diagnosticoId}-${linha.id}`} valores={linha.valores} estado={linha.estado} bloqueado={ocupado} pendente={!!edicao} importada={!!importadas[linha.id]} conferencia={conferencia[linha.id]} decisoes={escolhas} confirmado={revisada} erro={errosLinha[linha.id]}
          avaliacao={<AvaliacaoMatriz key={`${organizacaoId}:${diagnosticoId}:${linha.id}`} aoPendencias={setAvaliacoesPendentes} funcaoId={linha.id} organizacaoId={organizacaoId} diagnosticoId={diagnosticoId} readOnly={ocupado}/>}
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
        return <PopupDetalhe key={f.id} titulo={`${f.id} · ${nome}`} descricao={`${grupo} · Matriz Funcional`} bloqueado={ocupado||temAvaliacaoPendente} aoFechar={()=>{setAberta(null);setEditando(false);}}>
        <div id={`matriz-funcao-${f.id}`} data-inova-form="matriz" data-inova-field={f.id} data-estado-matriz={estado.id}>
          <div className="flex flex-wrap items-center gap-2 pb-3">
            <span className="text-xs text-muted-foreground">{f.id}</span>
            <span className="flex-1 min-w-0 break-words font-medium text-sm">{nome}</span><span className="text-xs text-muted-foreground">{leituraMatriz(valoresLinha.criticidade,valoresLinha.experiencia)}</span>
            <span aria-label={`Estado da função ${f.id}: ${estado.rotulo}`} className="rounded border px-2 py-1 text-xs" title={estado.descricao}>{estado.rotulo}</span>
            {origem&&<span className="text-xs font-medium">{r?'Salva nesta aplicação':!conferencia[f.id]?'Não identificada':estado.id==='revisada'?'Conferida · ainda não salva':estado.id==='com_pendencias'?'Requer conferência':'Importada'}</span>}
          </div>
          {open&&<div className="border-t p-4">
            <p role="status" className="mb-3 text-xs text-muted-foreground">{ocupado?'Salvando alterações…':r&&!edicoes[f.id]?'Respostas salvas nesta aplicação.':estado.id==='revisada'?'Valores revisados e prontos para salvar. Ainda não salvos.':readOnly&&importadas[f.id]?'Prévia de respostas importadas ainda não confirmadas nem salvas na Matriz.':estado.descricao}</p>
            <section className="mb-5 border-b pb-4 space-y-2" aria-label={`Avaliação da função ${f.id}`}><h5 className="font-semibold">Avaliação</h5><AvaliacaoMatriz key={`${organizacaoId}:${diagnosticoId}:${f.id}`} aoPendencias={setAvaliacoesPendentes} funcaoId={f.id} organizacaoId={organizacaoId} diagnosticoId={diagnosticoId} readOnly={readOnly||(!editando&&!temAvaliacaoPendente)||ocupado}/></section>
            {editando&&!readOnly?<form className="grid gap-4 sm:grid-cols-2" onSubmit={e=>{e.preventDefault();if(readOnly||emCurso.current)return;
              gravarFuncao(f.id,draft,decisoes,confirmado);}}>
              <fieldset disabled={salvar.isPending||descartando} className="contents">
                <div className="sm:col-span-2 text-sm"><span className="block text-xs text-muted-foreground">Função</span><p className="mt-1 font-medium">{f.nome}</p></div>
                {selecao('Atuação','atuacao',ATUACAO_MATRIZ)}{selecao('Experiência','experiencia',EXPERIENCIA_MATRIZ)}
                {selecao('Criticidade atual','criticidade',NIVEIS_MATRIZ)}{selecao('Interesse em desenvolvimento','interesse',NIVEIS_MATRIZ)}
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Leitura orientativa<input readOnly className="border rounded-lg bg-muted p-2" value={leituraMatriz(draft.criticidade,draft.experiencia)}/><span className="text-xs text-muted-foreground">Calculada automaticamente. {importadas[f.id]?'Confira e confirme a importação para salvar.':'Alterações manuais são salvas automaticamente.'}</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Observação<textarea className="border rounded-lg bg-card p-2 min-h-24" maxLength={20000} value={draft.observacoes??''} onChange={e=>alterar('observacoes',e.target.value||null)}/>{statusCampo('observacoes')}<span className="text-xs text-muted-foreground">Reúne o relato, a necessidade, o público e a mudança desejada.</span></label>
                <label className="sm:col-span-2 flex flex-col gap-1 text-sm">Externo<textarea className="border rounded-lg bg-card p-2" maxLength={20000} value={draft.externo??''} onChange={e=>alterar('externo',e.target.value||null)}/>{statusCampo('externo')}<span className="text-xs text-muted-foreground">Informe quem participa externamente. Deixe vazio quando não identificado.</span></label>
                {importadas[f.id]&&<label className="sm:col-span-2 flex items-start gap-2 text-sm"><input type="checkbox" required checked={confirmado} onChange={e=>atualizarEdicao(draft,decisoes,e.target.checked)}/>Conferi esta função e as decisões dos campos ambíguos. Campos não identificados permanecerão vazios.</label>}
                {estado.id==='revisada'&&<section aria-label={`Valores revisados da função ${f.id}`} className="sm:col-span-2 rounded-lg border bg-card p-3"><p className="mb-2 text-sm font-medium">Confira os valores antes de salvar</p><LeituraFuncaoMatriz valores={draft}/></section>}
                {erroConferencia&&<p role="alert" className="sm:col-span-2 text-sm">{erroConferencia}</p>}
                <div className="sm:col-span-2 flex flex-wrap gap-2"><button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={()=>{cancelarLinha(f.id);setDraft(reiniciar());setConfirmado(false);setDecisoes({});setErroConferencia('');setEditando(false);}}>{edicoes[f.id]?'Cancelar alterações pendentes':'Fechar edição'}</button>
                  {(importadas[f.id]||erroConferencia)&&<button type="submit" className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm">{salvar.isPending?'Salvando…':importadas[f.id]?'Confirmar e salvar função':'Tentar salvar novamente'}</button>}</div>
              </fieldset>
            </form>:<div className="space-y-2">
              <LeituraFuncaoMatriz valores={valoresConsulta}/>
              {!readOnly&&<button type="button" className="underline text-primary text-sm" onClick={()=>{carregarEdicao(f.id,reiniciar());setEditando(true);}}>Editar</button>}
            </div>}
          </div>}
        </div></PopupDetalhe>;
      })}
    </section>)}
  </div>;
}
