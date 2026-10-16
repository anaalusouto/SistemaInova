import { Check, Minus } from 'lucide-react';
import type { ResumoConclusao, TipoConclusaoPlano } from '../../lib/conclusaoPlano';

export function CheckConclusaoPlano({ tipo, nome, resumo, desativado, salvando, aoMudar, compacto = false }: {
  tipo: TipoConclusaoPlano;
  nome: string;
  resumo: ResumoConclusao;
  desativado: boolean;
  salvando: boolean;
  aoMudar: (concluido: boolean) => void;
  compacto?: boolean;
}) {
  const acao = resumo.concluido ? 'Reabrir' : 'Concluir';
  const Icone = resumo.parcial ? Minus : Check;
  const descricao = resumo.total === 0 ? 'Cadastre uma atividade para acompanhar a conclusão.'
    : resumo.concluido ? 'Desmarcar volta para Em andamento.'
    : tipo === 'atividade' ? 'Marcar como concluída.'
    : `Concluir todas as ${resumo.total} atividades, inclusive as ocultas por filtros.`;
  return <label className="relative inline-flex shrink-0 items-center gap-1.5 text-xs" title={descricao}>
    <input type="checkbox" checked={resumo.concluido}
      ref={elemento => { if (elemento) elemento.indeterminate = resumo.parcial; }}
      aria-label={`${acao} ${tipo}: ${nome}`}
      aria-busy={salvando || undefined}
      disabled={desativado || resumo.total === 0}
      onChange={e => aoMudar(e.target.checked)}
      className="h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: resumo.concluido || resumo.parcial ? 'var(--success)' : 'var(--ink-4)',
        background: resumo.concluido || resumo.parcial ? 'var(--success)' : 'transparent',
      }} />
    {(resumo.concluido || resumo.parcial) && <Icone aria-hidden="true" size={16} strokeWidth={3}
      className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 p-0.5 text-white" />}
    {tipo !== 'atividade' && !compacto && <span style={{ color: resumo.concluido ? 'var(--success)' : 'var(--ink-4)' }}>
      {salvando ? 'Salvando…' : `${resumo.concluidas}/${resumo.total} concluídas`}
    </span>}
  </label>;
}
