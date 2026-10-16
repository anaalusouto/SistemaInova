/**
 * Pop-up de detalhe do Plano de Trabalho, com navegação interna pela hierarquia.
 *
 * Todos fecham por botão e por Escape (RF-006) e mostram a posição na
 * hierarquia no topo, para que ninguém perca de vista onde está — um painel
 * que abre de três visões diferentes precisa dizer de onde veio.
 */
import { type ReactNode } from 'react';
import { PopupDetalhe } from '../PopupDetalhe';
import { formatDateOnly } from '../../lib/dateOnly';
import { NAO_INFORMADO } from '../../lib/planoTrabalho';

export function Painel({
  titulo, caminho, aoFechar, acoes, children, largo, lateral, bloqueado,
}: {
  titulo: string; caminho: string; aoFechar: () => void;
  acoes?: ReactNode; children: ReactNode;
  /** Painel de leitura de texto longo, como o do risco (RF02). */
  largo?: boolean;
  lateral?: ReactNode; bloqueado?: boolean;
}) {
  return (
    <PopupDetalhe titulo={titulo} descricao={caminho} aoFechar={aoFechar} acoes={acoes} largo={largo || !!lateral} lateral={lateral} bloqueado={bloqueado}>{children}</PopupDetalhe>
  );
}

export function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="py-2" style={{ borderBottom: '1px solid var(--line-1)' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {rotulo}
      </div>
      {/* Texto longo quebra linha e respeita parágrafos (RF02): nada é cortado. */}
      <div style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.5, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{children}</div>
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
