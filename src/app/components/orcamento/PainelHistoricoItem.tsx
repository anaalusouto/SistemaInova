/**
 * Histórico do item de orçamento (RN-033).
 *
 * Mostra valor anterior e novo em cada evento. É isso que responde "por que
 * este item mudou de R$ 8.000 para R$ 12.000, e quem decidiu?" — pergunta que
 * aparece meses depois, quando ninguém lembra. Nenhuma justificativa substitui
 * a anterior em silêncio: cada troca vira uma linha.
 */
import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { historicoDoItem, type EventoHistorico } from '../../orcamento.server';
import { type ItemOrcamento } from '../../lib/orcamento';

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Valor monetário guardado como texto no histórico; exibe como veio quando não for número. */
function valor(v: string | null): string {
  if (v === null) return 'não informado';
  const n = Number(v);
  return Number.isFinite(n)
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
    : v;
}

const EVENTOS_MONETARIOS = new Set(['valor executado']);

export function PainelHistoricoItem({
  item, aoFechar,
}: { item: ItemOrcamento; aoFechar: () => void }) {
  const [eventos, setEventos] = useState<EventoHistorico[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  useEffect(() => {
    let cancelado = false;
    historicoDoItem({ data: { itemId: item.id } })
      .then(r => { if (!cancelado) setEventos(r); })
      .catch(e => { if (!cancelado) setErro(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.'); });
    return () => { cancelado = true; };
  }, [item.id]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card h-full w-full max-w-lg flex flex-col"
        role="dialog"
        aria-label="Histórico do item"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{item.grupo} · {item.categoria}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.92rem', color: 'var(--ink-1)', marginTop: 2 }}>
              {item.descricao}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)', marginTop: 2 }}>Histórico de alterações</div>
          </div>
          <button onClick={aoFechar} aria-label="Fechar histórico"><X size={16} color="var(--ink-4)" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {erro && (
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--danger-soft-border)', background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.78rem' }}>
              {erro}
            </div>
          )}

          {!erro && eventos === null && (
            <div className="flex items-center gap-2" style={{ color: 'var(--ink-4)', fontSize: '0.78rem' }}>
              <Loader2 size={14} className="animate-spin" /> Carregando…
            </div>
          )}

          {eventos?.length === 0 && (
            <div style={{ color: 'var(--ink-5)', fontSize: '0.8rem', lineHeight: 1.6 }}>
              Nenhuma alteração registrada para este item ainda. O histórico começa a partir da
              primeira execução, correção ou exclusão.
            </div>
          )}

          {eventos && eventos.length > 0 && (
            <ol className="flex flex-col gap-3" style={{ listStyle: 'none' }}>
              {eventos.map(e => {
                const monetario = EVENTOS_MONETARIOS.has(e.evento);
                return (
                  <li key={e.id} className="pl-3" style={{ borderLeft: '2px solid var(--line-2)' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: '0.68rem', fontWeight: 600 }}
                      >
                        {e.evento}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                        {dataHora(e.criadoEm)}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}>{e.autor}</span>
                    </div>

                    {(e.valorAnterior !== null || e.valorNovo !== null) && (
                      <div style={{ fontSize: '0.76rem', color: 'var(--ink-2)', marginTop: 3 }}>
                        <span style={{ color: 'var(--ink-5)' }}>
                          {monetario ? valor(e.valorAnterior) : (e.valorAnterior ?? 'não informado')}
                        </span>
                        {' → '}
                        <strong>
                          {monetario ? valor(e.valorNovo) : (e.valorNovo ?? 'não informado')}
                        </strong>
                      </div>
                    )}

                    {e.detalhe && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.5 }}>
                        {e.detalhe}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
