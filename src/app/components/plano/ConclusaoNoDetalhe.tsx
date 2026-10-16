import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Activity } from '../../data/mockData';
import { useAuth } from '../../auth/authStore';
import { useStore } from '../../store';
import { resumirConclusao, type TipoConclusaoPlano } from '../../lib/conclusaoPlano';
import { CheckConclusaoPlano } from './CheckConclusaoPlano';

export function ConclusaoNoDetalhe({ tipo, id, nome, atividades }: {
  tipo: TipoConclusaoPlano; id: string; nome: string; atividades: Activity[];
}) {
  const { readOnly } = useAuth();
  const { setConclusaoPlano } = useStore();
  const [salvando, setSalvando] = useState(false);
  const emCurso = useRef(false);
  const resumo = resumirConclusao(atividades);
  const salvar = async (concluido: boolean) => {
    if (readOnly || emCurso.current || resumo.total === 0) return;
    emCurso.current = true;
    setSalvando(true);
    try {
      await setConclusaoPlano({ tipo, id, concluido });
      toast.success(concluido ? 'Conclusão salva.' : 'Retornado para Em andamento.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível salvar a conclusão.'); }
    finally { emCurso.current = false; setSalvando(false); }
  };
  return <section className="rounded-lg border p-3 mb-3" style={{ borderColor: 'var(--border)' }} aria-label="Conclusão">
    <div className="flex items-center gap-2">
      <CheckConclusaoPlano tipo={tipo} nome={nome} resumo={resumo} desativado={readOnly || salvando} salvando={salvando}
        aoMudar={concluido => void salvar(concluido)} />
      <span className="text-sm font-medium">{salvando ? 'Salvando…' : resumo.concluido ? 'Concluída' : 'Marcar como concluída'}</span>
    </div>
    <p className="mt-1 text-xs" style={{ color: 'var(--ink-4)' }}>
      {resumo.total === 0 ? 'Cadastre uma atividade para acompanhar a conclusão.'
        : tipo === 'atividade' ? 'Desmarcar volta para Em andamento.'
        : 'Marcar conclui todas as atividades deste grupo. Desmarcar volta para Em andamento.'}
    </p>
  </section>;
}
