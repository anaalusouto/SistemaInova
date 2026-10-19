import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, ArrowLeft, ClipboardList, Gauge, ShoppingBasket, FileCheck2, Lock, CopyPlus } from 'lucide-react';
import { getDadosCompletosDiagnostico, getDiagnostico, concluirDiagnostico, criarNovaVersaoDiagnostico, type DiagnosticoStatus } from '../diagnosticos.server';
import { formatDateOnly } from '../lib/dateOnly';
import { MatrizFuncionalTab } from './diagnostic/MatrizFuncionalTab';
import { IeoTab } from './diagnostic/IeoTab';
import { CestaProdutosTab } from './diagnostic/CestaProdutosTab';
import { ParecerTecnicoTab } from './diagnostic/ParecerTecnicoTab';
import { useAuth } from '../auth/authStore';

const STATUS_LABEL: Record<DiagnosticoStatus, string> = { em_edicao: 'Em edição', concluido: 'Concluído' };

type TabId = 'matriz' | 'ieo' | 'cesta' | 'parecer';
const TABS: { id: TabId; label: string; icon: typeof ClipboardList }[] = [
  { id: 'matriz', label: 'Matriz Funcional', icon: ClipboardList },
  { id: 'ieo', label: 'Índice de Estruturação Organizacional', icon: Gauge },
  { id: 'cesta', label: 'Cesta de Produtos', icon: ShoppingBasket },
  { id: 'parecer', label: 'Parecer Técnico', icon: FileCheck2 },
];

interface DiagnosticoEditorProps {
  diagnosticoId: string;
  onBack: () => void;
  onNovaVersao: (novoDiagnosticoId: string) => void;
  incorporado?: boolean;
  instrumentoInicial?: TabId;
}

export function DiagnosticoEditor({ diagnosticoId, onBack, onNovaVersao, incorporado = false, instrumentoInicial = 'matriz' }: DiagnosticoEditorProps) {
  const [tab, setTab] = useState<TabId>(instrumentoInicial);
  const { readOnly } = useAuth();
  const [baixando,setBaixando] = useState(false);
  const queryClient = useQueryClient();
  const { data: diagnostico, isLoading, error, refetch } = useQuery({
    queryKey: ['diagnostico', diagnosticoId],
    queryFn: () => getDiagnostico({ data: { id: diagnosticoId } }),
  });

  const concluir = useMutation({
    mutationFn: () => concluirDiagnostico({ data: { id: diagnosticoId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico', diagnosticoId] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticos'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostico-visao-geral'] });
      toast.success('Diagnóstico concluído — os 4 instrumentos agora estão em modo leitura.');
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível concluir o diagnóstico.'),
  });

  const novaVersao = useMutation({
    mutationFn: () => criarNovaVersaoDiagnostico({ data: { diagnosticoAnteriorId: diagnosticoId } }),
    onSuccess: novo => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticos'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostico-visao-geral'] });
      toast.success(`Versão ${novo.versao} criada — o conjunto anterior foi copiado e está editável.`);
      onNovaVersao(novo.id);
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível criar a nova versão.'),
  });

  return (
    <div className={incorporado ? 'flex flex-col min-w-0' : 'flex flex-col h-full min-h-0 overflow-hidden'}>
      <div className="flex min-w-0 flex-col gap-3 px-3 sm:px-7 pt-4 pb-0 flex-shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] w-fit hover:text-blue-600" style={{ color: 'var(--ink-4)' }}>
          <ArrowLeft size={12} /> Organização
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink-1)' }}>
              Diagnóstico {diagnostico ? formatDateOnly(diagnostico.dataAplicacao) : ''}
            </h2>
            <p style={{ color: 'var(--ink-4)', fontSize: '0.78rem', marginTop: 2 }}>
              Versão {diagnostico?.versao ?? '—'}
            </p>
          </div>
          {diagnostico && (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button type="button" aria-label={tab === 'parecer' ? 'Baixar parecer em PDF' : 'Baixar diagnóstico em PDF'} title={tab === 'parecer' ? 'Baixar parecer em PDF' : 'Baixar diagnóstico em PDF'} disabled={baixando} className="rounded-lg p-2.5 text-white shadow-sm disabled:opacity-60" style={{background:'var(--primary)'}} onClick={async()=>{
                setBaixando(true);
                try {
                  const dados=await getDadosCompletosDiagnostico({data:{diagnosticoId}});
                  const {buildDiagnosticoReportModel,exportDiagnosticoReportPdf}=await import('../lib/diagnosticReportExport');
                  exportDiagnosticoReportPdf(buildDiagnosticoReportModel(tab === 'parecer' ? 'Parecer Técnico' : 'Diagnóstico Organizacional',[dados],tab === 'parecer' ? ['identificacao','parecer'] : ['identificacao','matriz','ieo','cesta','parecer']));
                } catch(e){toast.error(e instanceof Error ? e.message : 'Não foi possível baixar o PDF.');}
                finally{setBaixando(false);}
              }}><Download size={18} className={baixando ? 'animate-pulse' : undefined} aria-hidden /></button>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  color: diagnostico.status === 'concluido' ? 'var(--success)' : 'var(--brand)',
                  background: diagnostico.status === 'concluido' ? 'var(--success-soft)' : 'var(--brand-soft)',
                }}
              >
                {STATUS_LABEL[diagnostico.status]}
              </span>
              {!readOnly && (diagnostico.status === 'em_edicao' ? (
                <button
                  onClick={() => { if (window.confirm('Concluir este diagnóstico? Os 4 instrumentos passam a ser somente leitura — para alterar depois, será preciso criar uma nova versão.')) concluir.mutate(); }}
                  disabled={concluir.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-white disabled:opacity-60"
                  style={{ background: 'var(--primary)' }}
                >
                  <Lock size={12} /> Concluir diagnóstico
                </button>
              ) : (
                <button
                  onClick={() => { if (window.confirm('Criar uma nova versão? Uma cópia editável de Matriz, IEO, Cesta e Parecer será criada a partir desta versão concluída.')) novaVersao.mutate(); }}
                  disabled={novaVersao.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-medium disabled:opacity-60"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                >
                  <CopyPlus size={12} /> Criar nova versão
                </button>
              ))}
            </div>
          )}
        </div>
        <label className="flex flex-col gap-1 pb-3 text-xs text-muted-foreground sm:hidden">Instrumento do diagnóstico
          <select aria-label="Instrumento do diagnóstico" value={tab} onChange={e=>setTab(e.target.value as TabId)} className="min-h-11 w-full min-w-0 rounded-lg border bg-card px-2 text-sm text-foreground">
            {TABS.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <div className="hidden min-w-0 flex-wrap items-stretch gap-1 sm:flex">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 text-center text-[13px] font-medium transition-colors"
                style={{ color: active ? 'var(--primary)' : 'var(--ink-4)', borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent' }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className={incorporado ? 'p-4 sm:p-7 min-w-0' : 'flex-1 min-h-0 overflow-y-auto p-7'}>
        {isLoading && <p role="status">Carregando diagnóstico…</p>}
        {error && <p role="alert">Não foi possível abrir o diagnóstico. <button type="button" onClick={() => void refetch()}>Tentar novamente</button></p>}
        {tab === 'matriz' && diagnostico && (
          <MatrizFuncionalTab diagnosticoId={diagnosticoId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        {tab === 'ieo' && diagnostico && (
          <IeoTab diagnosticoId={diagnosticoId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        {tab === 'cesta' && diagnostico && (
          <CestaProdutosTab diagnosticoId={diagnosticoId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        {tab === 'parecer' && diagnostico && (
          <ParecerTecnicoTab diagnosticoId={diagnosticoId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
      </div>
    </div>
  );
}
