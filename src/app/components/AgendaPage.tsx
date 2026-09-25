import { useMemo, useState } from 'react';
import { CheckSquare, Square, Calendar, Hash, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { useAgenda } from '../agenda/useAgenda';
import { mentionTextOnly } from '../mensagens/mentionUtils';
import type { Atribuicao } from '../atribuicoes.server';

type Tab = 'paraMim' | 'porMim';

const statusConfig: Record<string, { color: string; bg: string }> = {
  'A iniciar': { color: 'var(--ink-4)', bg: 'var(--surface-2)' },
  'Em andamento': { color: 'var(--brand)', bg: 'var(--brand-soft)' },
  'Concluído': { color: 'var(--success)', bg: 'var(--success-soft)' },
  'Atrasado': { color: 'var(--danger)', bg: 'var(--danger-soft)' },
};

function formatTs(iso: string) {
  try { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)); }
  catch { return iso; }
}

function sortItens(itens: Atribuicao[]) {
  return [...itens].sort((a, b) => {
    if (!!a.concluidaEm !== !!b.concluidaEm) return a.concluidaEm ? 1 : -1;
    if (a.dataPlanejada && b.dataPlanejada) return a.dataPlanejada.localeCompare(b.dataPlanejada);
    if (a.dataPlanejada) return -1;
    if (b.dataPlanejada) return 1;
    return b.criadoEm.localeCompare(a.criadoEm);
  });
}

export function AgendaPage({ onOpenProject }: { onOpenProject: (projectId: number) => void }) {
  const { user } = useAuth();
  const { paraMim, porMim, loading, toggle } = useAgenda();
  const [tab, setTab] = useState<Tab>('paraMim');

  const itens = useMemo(() => sortItens(tab === 'paraMim' ? paraMim : porMim), [tab, paraMim, porMim]);
  const pendentesParaMim = useMemo(() => paraMim.filter(a => !a.concluidaEm).length, [paraMim]);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-1">
        {([
          { id: 'paraMim' as Tab, label: 'Para mim', count: pendentesParaMim },
          { id: 'porMim' as Tab, label: 'Atribuídas por mim', count: 0 },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors"
            style={{
              background: tab === t.id ? 'var(--brand-soft)' : 'transparent',
              color: tab === t.id ? 'var(--brand-text)' : 'var(--ink-4)',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--warning-soft)', color: 'var(--warning-strong-text)' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 bg-card rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="py-10 text-center" style={{ fontSize: '0.8rem', color: 'var(--ink-5)' }}>Carregando…</div>
        ) : itens.length === 0 ? (
          <div className="py-10 text-center" style={{ fontSize: '0.8rem', color: 'var(--ink-5)' }}>
            {tab === 'paraMim'
              ? 'Nenhuma tarefa atribuída a você por enquanto.'
              : 'Você ainda não atribuiu nenhuma tarefa a alguém — mencione uma tarefa e uma pessoa juntas numa mensagem.'}
          </div>
        ) : itens.map(item => {
          const st = statusConfig[item.atividadeStatus] ?? statusConfig['A iniciar'];
          const done = !!item.concluidaEm;
          return (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border p-3"
              style={{ borderColor: 'var(--border)', opacity: done ? 0.6 : 1 }}
            >
              {tab === 'paraMim' ? (
                <button
                  onClick={() => toggle(item.id, !done)}
                  title={done ? 'Marcar como pendente' : 'Marcar como concluída'}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: done ? 'var(--success)' : 'var(--ink-4)' }}
                >
                  {done ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              ) : (
                <div className="flex-shrink-0 mt-0.5" style={{ color: done ? 'var(--success)' : 'var(--ink-4)' }}>
                  {done ? <CheckSquare size={16} /> : <Square size={16} />}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink-1)', textDecoration: done ? 'line-through' : 'none' }}>
                    {item.atividadeNome}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: st.bg, color: st.color }}>
                    {item.atividadeStatus}
                  </span>
                </div>

                <button
                  onClick={() => { if (item.projetoId != null) onOpenProject(item.projetoId); }}
                  className="inline-flex items-center gap-1 mt-1 hover:underline"
                  style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}
                >
                  <Hash size={10} />
                  {item.projetoCode ? `${item.projetoCode} · ${item.projetoNome}` : item.projetoNome || 'Projeto'}
                </button>

                <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5" style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
                  {item.dataPlanejada && (
                    <span className="inline-flex items-center gap-1"><Calendar size={10} /> {item.dataPlanejada}</span>
                  )}
                  {tab === 'paraMim' ? (
                    <span>Atribuída por {item.atribuidoPorLogin === user?.login ? 'você' : item.atribuidoPorNome}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <ArrowRight size={10} /> {item.atribuidoParaLogin === user?.login ? 'você' : item.atribuidoParaNome}
                    </span>
                  )}
                  <span>{formatTs(item.criadoEm)}</span>
                </div>

                {item.mensagemTexto && (() => {
                  const plain = mentionTextOnly(item.mensagemTexto);
                  return (
                    <div
                      className="mt-1.5 pl-2 border-l-2"
                      style={{ borderColor: 'var(--line-1)', fontSize: '0.72rem', color: 'var(--ink-4)', fontStyle: 'italic' }}
                    >
                      "{plain.length > 140 ? `${plain.slice(0, 140)}…` : plain}"
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
