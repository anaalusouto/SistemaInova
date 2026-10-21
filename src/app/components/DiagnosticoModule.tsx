import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listarDiagnosticosPorComunidade } from '../diagnosticos.server';
import { diagnosticoAtual } from '../diagnostic/navegacaoDiagnostico';
import { DiagnosticoVisaoGeral } from './DiagnosticoVisaoGeral';
import { DiagnosticoOrganizacao } from './DiagnosticoOrganizacao';
import { DiagnosticoEditor } from './DiagnosticoEditor';

type View =
  | { name: 'geral' }
  | { name: 'organizacao'; comunidadeId: string }
  | { name: 'entrada'; comunidadeId: string }
  | { name: 'editor'; comunidadeId: string; diagnosticoId: string };

export function DiagnosticoModule({ comunidadeId, instrumentoInicial = 'resumo' }: { comunidadeId?: string; instrumentoInicial?: 'resumo' | 'matriz' | 'parecer' }) {
  const [view, setView] = useState<View>(comunidadeId ? {name:'entrada',comunidadeId} : { name: 'geral' });

  if (view.name === 'geral') {
    return <DiagnosticoVisaoGeral onSelectOrganizacao={comunidadeId => setView({ name: 'entrada', comunidadeId })} />;
  }
  if (view.name === 'entrada') return <EntradaDiagnosticoAtual comunidadeId={view.comunidadeId} incorporado={!!comunidadeId}
    instrumentoInicial={instrumentoInicial === 'parecer' ? 'parecer' : 'resumo'}
    onBack={() => setView(comunidadeId ? {name:'organizacao',comunidadeId} : {name:'geral'})}
    onHistorico={() => setView({name:'organizacao',comunidadeId:view.comunidadeId})}
    onNovaVersao={diagnosticoId => setView({name:'editor',comunidadeId:view.comunidadeId,diagnosticoId})} />;
  if (view.name === 'organizacao') {
    return (
      <DiagnosticoOrganizacao
        comunidadeId={view.comunidadeId}
        incorporado={!!comunidadeId}
        onBack={() => setView({ name: 'geral' })}
        onSelectDiagnostico={diagnosticoId => setView({ name: 'editor', comunidadeId: view.comunidadeId, diagnosticoId })}
      />
    );
  }
  return (
    <DiagnosticoEditor
      key={view.diagnosticoId}
      diagnosticoId={view.diagnosticoId}
      incorporado={!!comunidadeId}
      instrumentoInicial={instrumentoInicial === 'parecer' ? 'parecer' : 'resumo'}
      rotuloVoltar={comunidadeId ? 'Histórico da organização' : 'Visão Geral'}
      onBack={() => setView(comunidadeId ? {name:'organizacao',comunidadeId} : {name:'geral'})}
      onHistorico={() => setView({name:'organizacao',comunidadeId:view.comunidadeId})}
      onNovaVersao={novoId => setView({ name: 'editor', comunidadeId: view.comunidadeId, diagnosticoId: novoId })}
    />
  );
}

export function EntradaDiagnosticoAtual({ comunidadeId, incorporado, instrumentoInicial, onBack, onHistorico, onNovaVersao }: {
  comunidadeId: string; incorporado: boolean; instrumentoInicial: 'resumo' | 'parecer';
  onBack: () => void; onHistorico: () => void; onNovaVersao: (id: string) => void;
}) {
  const {data, isLoading, error, refetch} = useQuery({queryKey:['diagnosticos',comunidadeId],
    queryFn:()=>listarDiagnosticosPorComunidade({data:{comunidadeId}}),refetchOnMount:'always'});
  if(isLoading) return <p role="status" className="p-7">Carregando diagnóstico atual…</p>;
  if(error) return <div role="alert" className="p-7 space-y-2"><p>Não foi possível carregar o diagnóstico atual.</p>
    <button type="button" className="underline mr-3" onClick={()=>void refetch()}>Tentar novamente</button><button type="button" className="underline" onClick={onBack}>Voltar</button></div>;
  const atual=diagnosticoAtual(data??[],comunidadeId);
  if(!atual) return <DiagnosticoOrganizacao comunidadeId={comunidadeId} incorporado={incorporado} onBack={onBack} onSelectDiagnostico={onNovaVersao} />;
  return <DiagnosticoEditor key={atual.id} diagnosticoId={atual.id} incorporado={incorporado} instrumentoInicial={instrumentoInicial}
    rotuloVoltar={incorporado?'Histórico da organização':'Visão Geral'} onBack={onBack} onHistorico={onHistorico} onNovaVersao={onNovaVersao} />;
}
