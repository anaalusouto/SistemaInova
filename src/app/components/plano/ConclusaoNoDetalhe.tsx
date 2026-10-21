import type { Activity } from '../../data/mockData';
import { useAuth } from '../../auth/authStore';
import { useConclusaoComPeriodo } from './useConclusaoComPeriodo';
import { resumirConclusao, type TipoConclusaoPlano } from '../../lib/conclusaoPlano';
import { CheckConclusaoPlano } from './CheckConclusaoPlano';

export function ConclusaoNoDetalhe({ tipo, id, nome, atividades }: {
  tipo: TipoConclusaoPlano; id: string; nome: string; atividades: Activity[];
}) {
  const { readOnly } = useAuth();
  const { solicitar, ocupado, salvando, dialogo } = useConclusaoComPeriodo();
  const resumo = resumirConclusao(atividades);
  return <section className="rounded-lg border p-3 mb-3" style={{ borderColor: 'var(--border)' }} aria-label="Conclusão">
    <div className="flex items-center gap-2">
      <CheckConclusaoPlano tipo={tipo} nome={nome} resumo={resumo} desativado={readOnly || ocupado} salvando={salvando}
        aoMudar={concluido => solicitar({ tipo, id }, concluido, atividades)} />
      <span className="text-sm font-medium">{salvando ? 'Salvando…' : resumo.concluido ? 'Concluída' : 'Marcar como concluída'}</span>
    </div>
    <p className="mt-1 text-xs" style={{ color: 'var(--ink-4)' }}>
      {resumo.total === 0 ? 'Cadastre uma atividade para acompanhar a conclusão.'
        : tipo === 'atividade' ? 'Desmarcar volta para Em andamento.'
        : 'Marcar conclui todas as atividades deste grupo. Desmarcar volta para Em andamento.'}
    </p>
    {dialogo}
  </section>;
}
