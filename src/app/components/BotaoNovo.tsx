/**
 * Botões de adicionar (UI/UX, 29/09/2026 — "padronização dos botões de adição").
 *
 * Dois níveis, e só dois:
 * - BotaoNovo: a ação de criar do MÓDULO ("+ Novo registro", "+ Nova tarefa"),
 *   no canto superior direito do cabeçalho. Azul preenchido, com o "+".
 * - LinkNovo: adicionar DENTRO de uma lista (subatividade numa árvore, evento
 *   num dia do calendário). Link azul pequeno com o "+" — um botão cheio em
 *   cada linha viraria ruído.
 *
 * Rótulo: "Novo …"/"Nova …", com minúscula depois da primeira palavra.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Plus } from 'lucide-react';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { children: ReactNode };

export function BotaoNovo({ children, className = '', style, ...resto }: Props) {
  return (
    <button
      type="button"
      {...resto}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-white hover:opacity-90 disabled:opacity-50 flex-shrink-0 ${className}`}
      style={{ background: 'var(--primary)', ...style }}
    >
      <Plus size={13} aria-hidden /> {children}
    </button>
  );
}

export function LinkNovo({ children, className = '', style, ...resto }: Props) {
  return (
    <button
      type="button"
      {...resto}
      className={`inline-flex items-center gap-1 text-[11px] font-medium hover:underline ${className}`}
      style={{ color: 'var(--brand-text)', ...style }}
    >
      <Plus size={11} aria-hidden /> {children}
    </button>
  );
}
