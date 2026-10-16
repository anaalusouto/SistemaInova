import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Goal } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { moverParaPosicao, type ItemOrdemPlano, type NivelPlano } from '../../lib/reordenacaoPlano';
import type { SelecaoPlano } from './NavegacaoPlano';

export function VisaoOrdenacao({ projetoId, metas, codigos, aoAbrir }: { projetoId: number; metas: Goal[]; codigos: Map<string, string>; aoAbrir?: (alvo: SelecaoPlano) => void }) {
  const { reorderPlano } = useStore();
  const { readOnly } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const emExecucao = useRef(false);
  const mover = async (nivel: NivelPlano, paiId: string | number, irmaos: ItemOrdemPlano[], id: string, posicao: number) => {
    if (readOnly || emExecucao.current || irmaos.findIndex(i => i.id === id) === posicao - 1) return;
    emExecucao.current = true;
    setSalvando(true);
    try {
      await reorderPlano({ nivel, paiId, antes: irmaos.map(i => ({ id: i.id, order: i.order })), ids: moverParaPosicao(irmaos, id, posicao) });
      toast.success('Ordem salva. A numeração do plano foi atualizada.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível alterar a ordem.'); }
    finally { emExecucao.current = false; setSalvando(false); }
  };
  const linha = (nivel: NivelPlano, paiId: string | number, irmaos: (ItemOrdemPlano & { name: string })[], item: ItemOrdemPlano & { name: string }) => {
    const codigo = codigos.get(item.id) ?? '';
    const prefixo = codigo.split('.').slice(0, -1);
    const rotulo = { meta: 'Meta', etapa: 'Etapa', atividade: 'Atividade' }[nivel];
    return <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2">
      {aoAbrir ? <button type="button" disabled={salvando} className="flex-1 min-w-0 text-left text-sm break-words hover:underline" onClick={() => aoAbrir({ tipo: nivel, id: item.id })}><strong>{rotulo} {codigo}</strong> · {item.name}</button>
        : <span className="flex-1 min-w-0 text-sm break-words"><strong>{rotulo} {codigo}</strong> · {item.name}</span>}
      {!readOnly && <select aria-label={`Posição de ${rotulo.toLowerCase()} ${codigo}: ${item.name}`} value={irmaos.findIndex(i => i.id === item.id) + 1}
        disabled={salvando || irmaos.length < 2} className="border rounded-lg p-2 text-xs disabled:opacity-50"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
        onChange={e => void mover(nivel, paiId, irmaos, item.id, Number(e.target.value))}>
        {irmaos.map((i, pos) => <option key={i.id} value={pos + 1}>Posição {pos + 1} ({[...prefixo, pos + 1].join('.')})</option>)}
      </select>}
    </div>;
  };
  return <div className="p-4 space-y-3" aria-busy={salvando}>
    <p className="text-sm">Escolha a posição de cada meta, etapa ou atividade entre os itens do mesmo nível. Ao mover uma meta ou etapa, seus itens acompanham a nova numeração.</p>
    <p className="text-xs" role="status" aria-live="polite">{salvando ? 'Salvando ordem…' : 'Cada mudança de posição é salva automaticamente.'}</p>
    {metas.length === 0 && <p className="text-sm">Nenhuma meta cadastrada.</p>}
    {metas.map(meta => <section key={meta.id} className="border rounded-lg p-3" style={{ borderColor: 'var(--border)' }}>
      {linha('meta', projetoId, metas, meta)}
      {meta.deliverables.map(etapa => <div key={etapa.id} className="ml-3 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
        {linha('etapa', meta.id, meta.deliverables, etapa)}
        {etapa.activities.map(atividade => <div key={atividade.id} className="ml-3 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
          {linha('atividade', etapa.id, etapa.activities, atividade)}
        </div>)}
      </div>)}
    </section>)}
  </div>;
}
