import type { ReactNode } from 'react';
import './modulo.css';

export interface AbaModulo<T extends string> { id: T; label: string; icone?: ReactNode }

export function NavegacaoModulo<T extends string>({ abas, atual, aoMudar, rotulo, bloqueado = false }: {
  abas: AbaModulo<T>[]; atual: T; aoMudar: (id: T) => void; rotulo: string; bloqueado?: boolean;
}) {
  return <nav aria-label={rotulo} className="modulo-abas" style={{ gridTemplateColumns: `repeat(${abas.length}, minmax(0, 1fr))` }}>
    {abas.map(aba => <button key={aba.id} type="button" aria-current={atual === aba.id ? 'page' : undefined} disabled={bloqueado && atual !== aba.id} onClick={() => aoMudar(aba.id)} className="modulo-aba" data-active={atual === aba.id}>
      {aba.icone}<span>{aba.label}</span>
    </button>)}
  </nav>;
}
