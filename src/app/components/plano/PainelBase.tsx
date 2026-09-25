/**
 * Casca comum dos painéis laterais do Plano de Trabalho.
 *
 * Todos fecham por botão e por Escape (RF-006) e mostram a posição na
 * hierarquia no topo, para que ninguém perca de vista onde está — um painel
 * que abre de três visões diferentes precisa dizer de onde veio.
 */
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { formatDateOnly } from '../../lib/dateOnly';
import { NAO_INFORMADO } from '../../lib/planoTrabalho';

export function Painel({
  titulo, caminho, aoFechar, acoes, children,
}: {
  titulo: string; caminho: string; aoFechar: () => void;
  acoes?: ReactNode; children: ReactNode;
}) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card h-full w-full max-w-xl flex flex-col"
        role="dialog"
        aria-label={titulo}
      >
        <div className="px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                {caminho}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)', marginTop: 2 }}>
                {titulo}
              </div>
            </div>
            <button onClick={aoFechar} aria-label="Fechar painel" style={{ flexShrink: 0, marginTop: 2 }}>
              <X size={16} color="var(--ink-4)" />
            </button>
          </div>
          {acoes && <div className="flex items-center gap-2 mt-3 flex-wrap">{acoes}</div>}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="py-2" style={{ borderBottom: '1px solid var(--line-1)' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {rotulo}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

export function Ausente() {
  return <span style={{ color: 'var(--ink-5)', fontStyle: 'italic' }}>{NAO_INFORMADO}</span>;
}

export function Periodo({ inicio, fim }: { inicio: string | null; fim: string | null }) {
  if (!inicio && !fim) return <Ausente />;
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
      {formatDateOnly(inicio)} – {formatDateOnly(fim)}
    </span>
  );
}

/** Botão de ação do cabeçalho do painel (RF-014: é aqui que as ações vivem). */
export function BotaoAcao({
  aoClicar, children, perigo,
}: { aoClicar: () => void; children: ReactNode; perigo?: boolean }) {
  return (
    <button
      onClick={aoClicar}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium"
      style={{
        borderColor: perigo ? 'var(--danger-soft-border)' : 'var(--border)',
        color: perigo ? 'var(--danger)' : 'var(--ink-2)',
        background: perigo ? 'var(--danger-soft)' : 'transparent',
      }}
    >
      {children}
    </button>
  );
}
