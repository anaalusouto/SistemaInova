import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ClipboardList, Gauge, ShoppingBasket, FileCheck2, Lock, CopyPlus } from 'lucide-react';
import { getDiagnostico, concluirDiagnostico, criarNovaVersaoDiagnostico, type DiagnosticoStatus } from '../diagnosticos.server';
import { formatDateOnly } from '../lib/dateOnly';
import { MatrizFuncionalTab } from './diagnostic/MatrizFuncionalTab';
import { IeoTab } from './diagnostic/IeoTab';
import { CestaProdutosTab } from './diagnostic/CestaProdutosTab';
import { ParecerTecnicoTab } from './diagnostic/ParecerTecnicoTab';

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
}

export function DiagnosticoEditor({ diagnosticoId, onBack, onNovaVersao }: DiagnosticoEditorProps) {
  const [tab, setTab] = useState<TabId>('matriz');
  const queryClient = useQueryClient();
  const { data: diagnostico } = useQuery({
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
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 px-7 pt-5 pb-0 flex-shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] w-fit hover:text-blue-600" style={{ color: 'var(--ink-4)' }}>
          <ArrowLeft size={12} /> Organização
        </button>
        <div className="flex items-center justify-between pb-3">
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink-1)' }}>
              Diagnóstico {diagnostico ? formatDateOnly(diagnostico.dataAplicacao) : ''}
            </h1>
            <p style={{ color: 'var(--ink-4)', fontSize: '0.78rem', marginTop: 2 }}>
              Versão {diagnostico?.versao ?? '—'}
            </p>
          </div>
          {diagnostico && (
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  color: diagnostico.status === 'concluido' ? 'var(--success)' : 'var(--brand)',
                  background: diagnostico.status === 'concluido' ? 'var(--success-soft)' : 'var(--brand-soft)',
                }}
              >
                {STATUS_LABEL[diagnostico.status]}
              </span>
              {diagnostico.status === 'em_edicao' ? (
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
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors"
                style={{ color: active ? 'var(--primary)' : 'var(--ink-4)', borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent' }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-7">
        {tab === 'matriz' && diagnostico && (
          <MatrizFuncionalTab diagnosticoId={diagnosticoId} readOnly={diagnostico.status === 'concluido'} />
        )}
        {tab === 'ieo' && diagnostico && (
          <IeoTab diagnosticoId={diagnosticoId} readOnly={diagnostico.status === 'concluido'} />
        )}
        {tab === 'cesta' && diagnostico && (
          <CestaProdutosTab diagnosticoId={diagnosticoId} readOnly={diagnostico.status === 'concluido'} />
        )}
        {tab === 'parecer' && diagnostico && (
          <ParecerTecnicoTab diagnosticoId={diagnosticoId} readOnly={diagnostico.status === 'concluido'} />
        )}
      </div>
    </div>
  );
}
