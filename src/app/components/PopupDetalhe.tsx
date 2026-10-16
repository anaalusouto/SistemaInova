import { useRef, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/** Detalhe sobre a tela de origem, com foco e rolagem contidos no pop-up. */
export function PopupDetalhe({ titulo, descricao, children, acoes, aoFechar, largo = false, bloqueado = false, lateral, apresentacao = 'popup' }: {
  titulo: string; descricao: string; children: ReactNode; acoes?: ReactNode;
  aoFechar: () => void; largo?: boolean; bloqueado?: boolean;
  lateral?: ReactNode;
  apresentacao?: 'popup' | 'painel';
}) {
  const origem = useRef<HTMLElement | null>(null);
  const painel = apresentacao === 'painel';
  return <Dialog.Root open modal={!painel} onOpenChange={open => { if (!open && !bloqueado) aoFechar(); }}>
    <Dialog.Portal>
      {!painel && <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />}
      <Dialog.Content
        className={painel
          ? 'fixed inset-y-0 right-0 z-50 flex h-dvh w-full flex-col overflow-hidden border-l border-border bg-card shadow-2xl outline-none md:w-[min(880px,82vw)] xl:w-[min(960px,70vw)]'
          : `fixed left-1/2 top-1/2 z-50 flex w-[calc(100%_-_2rem)] max-h-[90dvh] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl outline-none ${largo ? 'max-w-6xl' : 'max-w-3xl'}`}
        onOpenAutoFocus={() => { origem.current = document.activeElement as HTMLElement | null; }}
        onCloseAutoFocus={e => { e.preventDefault(); if (origem.current?.isConnected) origem.current.focus(); }}
        onEscapeKeyDown={e => { if (bloqueado) e.preventDefault(); }}
        onPointerDownOutside={e => { if (bloqueado || painel) e.preventDefault(); }}
        onFocusOutside={e => { if (painel) e.preventDefault(); }}
      >
        <header className="shrink-0 border-b border-border px-5 py-4 pr-14">
          <Dialog.Title className="font-semibold text-lg break-words">{titulo}</Dialog.Title>
          <Dialog.Description className="text-xs text-muted-foreground mt-1 break-words">{descricao}</Dialog.Description>
          {acoes && <fieldset disabled={bloqueado} className="flex flex-wrap items-center gap-2 mt-3">{acoes}</fieldset>}
        </header>
        <Dialog.Close disabled={bloqueado} aria-label="Fechar pop-up" className="absolute right-3 top-3 rounded-lg p-2 hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"><X size={18} /></Dialog.Close>
        {lateral ? <div className="min-h-0 flex flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <aside className="max-h-52 shrink-0 overflow-y-auto overscroll-contain border-b border-border bg-muted/30 p-3 md:max-h-none md:w-60 md:border-b-0 md:border-r" aria-label="Itens relacionados do plano">{lateral}</aside>
          <div className="min-h-0 min-w-0 flex-1 px-5 py-4 md:overflow-y-auto md:overscroll-contain"><fieldset disabled={bloqueado} className="contents">{children}</fieldset></div>
        </div> : <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
