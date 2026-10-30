import { useCanGoBack, useNavigate, useRouter, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { listarDiagnosticosPorComunidade } from '../diagnosticos.server';
import { diagnosticoAtual } from '../diagnostic/navegacaoDiagnostico';
import type { BuscaApp, InstrumentoDiagnostico } from '../lib/navegacaoApp';
import { DiagnosticoVisaoGeral } from './DiagnosticoVisaoGeral';
import { DiagnosticoOrganizacao } from './DiagnosticoOrganizacao';
import { DiagnosticoEditor } from './DiagnosticoEditor';

/** Versões, aplicação e instrumento integram a URL e o histórico do navegador. */
export function DiagnosticoModule({ comunidadeId, instrumentoInicial = 'resumo' }: { comunidadeId?: string; instrumentoInicial?: 'resumo' | 'matriz' | 'parecer' }) {
  const busca = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const router = useRouter();
  const podeVoltar = useCanGoBack();
  const organizacao = comunidadeId ?? busca.org;
  const visao = busca.visaoDiagnostico ?? (instrumentoInicial === 'parecer' ? 'atual' : 'versoes');
  const instrumento = busca.instrumento ?? (instrumentoInicial === 'parecer' ? 'parecer' : 'resumo');
  const ir = (contexto: Pick<BuscaApp, 'org' | 'visaoDiagnostico' | 'diagnostico' | 'instrumento'>, replace = false) => {
    void navigate({ to: '/', search: anterior => ({ ...anterior, org: organizacao, visaoDiagnostico: undefined, diagnostico: undefined, instrumento: undefined, popup: undefined, ...contexto }), replace, resetScroll: true });
  };
  const historico = (replace = false) => ir({ org: organizacao, visaoDiagnostico: 'versoes' }, replace);
  const voltar = () => {
    if (podeVoltar) { router.history.back(); return; }
    // Links diretos têm um destino interno, sem sair para um site externo.
    if (visao === 'editor') { historico(true); return; }
    if (comunidadeId) {
      void navigate({ to: '/', search: { area: 'organizations', org: comunidadeId, secao: 'dados' }, replace: true });
    } else ir({ org: undefined }, true);
  };
  const abrir = (id: string) => ir({ org: organizacao, visaoDiagnostico: 'editor', diagnostico: id, instrumento: instrumentoInicial === 'parecer' ? 'parecer' : 'resumo' });
  const mudarInstrumento = (novo: InstrumentoDiagnostico) => ir({ org: organizacao, visaoDiagnostico: visao, diagnostico: busca.diagnostico, instrumento: novo });

  if (!organizacao) return <DiagnosticoVisaoGeral onSelectOrganizacao={org => ir({ org, visaoDiagnostico: instrumentoInicial === 'parecer' ? 'atual' : 'versoes' })} />;
  if (visao === 'atual') return <EntradaDiagnosticoAtual comunidadeId={organizacao} incorporado={!!comunidadeId}
    instrumentoInicial={instrumentoInicial === 'parecer' ? 'parecer' : 'resumo'} instrumentoAtual={instrumento}
    onBack={voltar} onHistorico={() => historico()} onNovaVersao={abrir} onMudarInstrumento={mudarInstrumento} onExcluido={() => historico(true)} />;
  if (visao === 'editor' && busca.diagnostico) return <DiagnosticoEditor key={busca.diagnostico}
    diagnosticoId={busca.diagnostico} organizacaoId={organizacao} incorporado={!!comunidadeId} instrumentoInicial={instrumentoInicial === 'parecer' ? 'parecer' : 'resumo'} instrumentoAtual={instrumento}
    onMudarInstrumento={mudarInstrumento} rotuloVoltar="Voltar" onBack={voltar} onHistorico={() => historico()} onNovaVersao={abrir} onExcluido={() => historico(true)} />;
  return <DiagnosticoOrganizacao comunidadeId={organizacao} incorporado={!!comunidadeId} onBack={voltar} onSelectDiagnostico={abrir} />;
}

export function EntradaDiagnosticoAtual({ comunidadeId, incorporado, instrumentoInicial, onBack, onHistorico, onNovaVersao, instrumentoAtual, onMudarInstrumento, onExcluido }: {
  comunidadeId: string; incorporado: boolean; instrumentoInicial: 'resumo' | 'parecer';
  onBack: () => void; onHistorico: () => void; onNovaVersao: (id: string) => void;
  instrumentoAtual?: InstrumentoDiagnostico; onMudarInstrumento?: (instrumento: InstrumentoDiagnostico) => void; onExcluido?: () => void;
}) {
  const {data, isLoading, error, refetch} = useQuery({queryKey:['diagnosticos',comunidadeId],
    queryFn:()=>listarDiagnosticosPorComunidade({data:{comunidadeId}}),refetchOnMount:'always'});
  if(isLoading) return <p role="status" className="p-7">Carregando mapeamento atual…</p>;
  if(error) return <div role="alert" className="p-7 space-y-2"><p>Não foi possível carregar o mapeamento atual.</p>
    <button type="button" className="underline mr-3" onClick={()=>void refetch()}>Tentar novamente</button><button type="button" className="underline" onClick={onBack}>Voltar</button></div>;
  const atual=diagnosticoAtual(data??[],comunidadeId);
  if(!atual) return <DiagnosticoOrganizacao comunidadeId={comunidadeId} incorporado={incorporado} onBack={onBack} onSelectDiagnostico={onNovaVersao} />;
  return <DiagnosticoEditor key={atual.id} diagnosticoId={atual.id} organizacaoId={comunidadeId} incorporado={incorporado} instrumentoInicial={instrumentoInicial}
    instrumentoAtual={instrumentoAtual} onMudarInstrumento={onMudarInstrumento} onExcluido={onExcluido}
    rotuloVoltar="Voltar" onBack={onBack} onHistorico={onHistorico} onNovaVersao={onNovaVersao} />;
}
