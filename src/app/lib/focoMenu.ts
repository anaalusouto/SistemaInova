/** Instala navegação de teclado somente enquanto o menu móvel está aberto. */
export function ativarFocoMenu(menu: HTMLElement, aoFechar: () => void): () => void {
  const documento = menu.ownerDocument;
  const anterior = documento.activeElement as HTMLElement | null;
  const controles = () => Array.from(menu.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]'))
    .filter(el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden');
  controles()[0]?.focus();
  const aoTeclar = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      aoFechar();
    } else if (e.key === 'Tab') {
      const itens = controles();
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (!primeiro) { e.preventDefault(); return; }
      if (!menu.contains(documento.activeElement)) { e.preventDefault(); (e.shiftKey ? ultimo : primeiro).focus(); }
      else if (e.shiftKey && documento.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && documento.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  };
  documento.addEventListener('keydown', aoTeclar);
  return () => {
    documento.removeEventListener('keydown', aoTeclar);
    if (anterior?.isConnected) anterior.focus();
  };
}
