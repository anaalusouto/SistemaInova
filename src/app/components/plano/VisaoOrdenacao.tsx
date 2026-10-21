import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Goal } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { moverParaPosicao, type ItemOrdemPlano, type NivelPlano } from '../../lib/reordenacaoPlano';
import { tituloSemNumeroLegado } from '../../lib/tituloPlano';

export function VisaoOrdenacao({ projetoId, metas, codigos }: { projetoId: number; metas: Goal[]; codigos: Map<string, string> }) {
  const { reorderPlano, moveEtapa } = useStore();
  const { readOnly } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const emExecucao = useRef(false);
  const [transferencia, setTransferencia] = useState<{ etapaId: string; origemId: string; destinoId: string; posicao: number } | null>(null);
  const transferir = async () => {
    if (readOnly || emExecucao.current || !transferencia) return;
    const origem = metas.find(m => m.id === transferencia.origemId);
    const destino = metas.find(m => m.id === transferencia.destinoId);
    if (!origem || !destino) return;
    emExecucao.current = true; setSalvando(true);
    try {
      await moveEtapa({ projetoId, ...transferencia,
        antesOrigem: origem.deliverables.map(({ id, order }) => ({ id, order })),
        antesDestino: destino.deliverables.map(({ id, order }) => ({ id, order })),
      });
      setTransferencia(null); toast.success('Etapa transferida. A numeração do plano foi atualizada.');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível transferir a etapa.'); }
    finally { emExecucao.current = false; setSalvando(false); }
  };
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
      <span className="flex-1 min-w-0 text-sm break-words"><strong>{rotulo} {codigo}</strong> · {tituloSemNumeroLegado(item.name, nivel)}</span>
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
        {!readOnly && metas.length > 1 && <div className="mb-2">
          {transferencia?.etapaId !== etapa.id ? <button type="button" className="text-xs underline" disabled={salvando || transferencia !== null}
            onClick={() => setTransferencia({ etapaId: etapa.id, origemId: meta.id, destinoId: metas.find(m => m.id !== meta.id)!.id, posicao: 1 })}>Mover para outra meta</button>
            : <fieldset disabled={salvando} className="flex flex-wrap items-end gap-2 border rounded p-3">
              <legend className="text-xs">Transferir etapa {codigos.get(etapa.id)}</legend>
              <label className="text-xs">Meta de destino<select className="block border rounded p-2 bg-card" value={transferencia.destinoId}
                onChange={e => setTransferencia({ ...transferencia, destinoId: e.target.value, posicao: 1 })}>
                {metas.filter(m => m.id !== meta.id).map(m => <option key={m.id} value={m.id}>Meta {codigos.get(m.id)} · {tituloSemNumeroLegado(m.name, 'meta')}</option>)}
              </select></label>
              <label className="text-xs">Posição no destino<select className="block border rounded p-2 bg-card" value={transferencia.posicao}
                onChange={e => setTransferencia({ ...transferencia, posicao: Number(e.target.value) })}>
                {Array.from({ length: (metas.find(m => m.id === transferencia.destinoId)?.deliverables.length ?? 0) + 1 }, (_, i) =>
                  <option key={i} value={i + 1}>Posição {i + 1} ({codigos.get(transferencia.destinoId)}.{i + 1})</option>)}
              </select></label>
              <p role="status" className="basis-full text-sm">Etapa {codigos.get(etapa.id)} → {codigos.get(transferencia.destinoId)}.{transferencia.posicao}. As atividades acompanham a etapa.</p>
              <button type="button" className="border rounded p-2 text-xs" onClick={() => setTransferencia(null)}>Cancelar</button>
              <button type="button" className="bg-primary text-primary-foreground rounded p-2 text-xs" onClick={() => void transferir()}>Confirmar movimentação</button>
            </fieldset>}
        </div>}
        {etapa.activities.map(atividade => <div key={atividade.id} className="ml-3 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
          {linha('atividade', etapa.id, etapa.activities, atividade)}
        </div>)}
      </div>)}
    </section>)}
  </div>;
}
