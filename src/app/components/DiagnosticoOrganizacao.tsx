import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Plus, X } from 'lucide-react';
import { listarComunidades } from '../comunidades.server';
import { listarDiagnosticosPorComunidade, criarDiagnostico, type DiagnosticoStatus } from '../diagnosticos.server';
import { useAudit } from '../audit/auditStore';
import { useAuth } from '../auth/authStore';
import { formatDateOnly } from '../lib/dateOnly';

const STATUS_LABEL: Record<DiagnosticoStatus, string> = { em_edicao: 'Em edição', concluido: 'Concluído' };

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
};

interface DiagnosticoOrganizacaoProps {
  comunidadeId: string;
  onBack: () => void;
  onSelectDiagnostico: (diagnosticoId: string) => void;
}

export function DiagnosticoOrganizacao({ comunidadeId, onBack, onSelectDiagnostico }: DiagnosticoOrganizacaoProps) {
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [novaData, setNovaData] = useState('');

  const { data: comunidades = [] } = useQuery({ queryKey: ['comunidades'], queryFn: () => listarComunidades() });
  const comunidade = comunidades.find(c => c.id === comunidadeId);

  const { data: diagnosticos = [], isLoading } = useQuery({
    queryKey: ['diagnosticos', comunidadeId],
    queryFn: () => listarDiagnosticosPorComunidade({ data: { comunidadeId } }),
  });

  const criar = useMutation({
    mutationFn: () => criarDiagnostico({ data: { comunidadeId, dataAplicacao: novaData } }),
    onSuccess: diag => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticos', comunidadeId] });
      queryClient.invalidateQueries({ queryKey: ['diagnostico-visao-geral'] });
      audit({ userLogin: user?.login ?? '—', area: 'diagnóstico', action: 'criar diagnóstico', detail: comunidade?.nome ?? comunidadeId, kind: 'alteracao' });
      toast.success('Diagnóstico criado.');
      setShowNew(false);
      setNovaData('');
      onSelectDiagnostico(diag.id);
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível criar o diagnóstico.'),
  });

  const dataAplicacaoMaisRecente = diagnosticos[0]?.dataAplicacao ?? null;
  const ultimaEdicao = diagnosticos.slice().sort((a, b) => (a.atualizadoEm < b.atualizadoEm ? 1 : -1))[0]?.atualizadoEm ?? null;

  return (
    <div className="flex flex-col gap-6 p-7 overflow-y-auto h-full">
      <div className="flex flex-col gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] w-fit hover:text-blue-600" style={{ color: 'var(--ink-4)' }}>
          <ArrowLeft size={12} /> Diagnóstico
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
              <Building2 size={18} color="var(--brand)" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--ink-1)' }}>
                {comunidade?.nome ?? 'Organização'}
              </h1>
              <p style={{ color: 'var(--ink-4)', fontSize: '0.8rem', marginTop: 2 }}>
                {comunidade?.code} · {comunidade?.classificacao} · {diagnosticos.length} diagnóstico(s) · aplicação mais recente {formatDateOnly(dataAplicacaoMaisRecente)} · última edição {fmtDate(ultimaEdicao)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white hover:opacity-90"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={14} /> Novo diagnóstico
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)' }}>
            Histórico de Diagnósticos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Data da aplicação', 'Última edição', 'Status', 'Ação'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diagnosticos.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-3">
                    <span style={{ fontSize: '0.82rem', color: 'var(--ink-1)' }}>{formatDateOnly(d.dataAplicacao)}</span>
                    {d.versao > 1 && <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)', marginLeft: 6 }}>v{d.versao}</span>}
                  </td>
                  <td className="px-4 py-3"><span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{fmtDate(d.atualizadoEm)}</span></td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{
                        color: d.status === 'concluido' ? 'var(--success)' : 'var(--brand)',
                        background: d.status === 'concluido' ? 'var(--success-soft)' : 'var(--brand-soft)',
                      }}
                    >
                      {STATUS_LABEL[d.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => onSelectDiagnostico(d.id)} className="text-[12px] font-medium hover:underline" style={{ color: 'var(--primary)' }}>
                      Visualizar
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && diagnosticos.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.8rem' }}>
                    Nenhum diagnóstico registrado ainda para esta organização.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.5)' }} onClick={() => setShowNew(false)}>
          <form
            onSubmit={e => { e.preventDefault(); if (novaData) criar.mutate(); }}
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl border p-6 w-full max-w-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-1)' }}>
                Novo diagnóstico
              </h3>
              <button type="button" onClick={() => setShowNew(false)} className="p-1 rounded hover:bg-accent">
                <X size={16} />
              </button>
            </div>
            <label className="flex flex-col gap-1 mb-4">
              <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>Data da aplicação *</span>
              <input
                type="date"
                required
                value={novaData}
                onChange={e => setNovaData(e.target.value)}
                className="border rounded-lg px-3 py-2 text-[13px]"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowNew(false)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={criar.isPending} className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white disabled:opacity-60" style={{ background: 'var(--primary)' }}>
                Criar diagnóstico
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
