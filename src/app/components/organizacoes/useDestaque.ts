import { useCallback, useEffect, useState } from 'react';

/**
 * Destaque temporário de um item da lista ao chegar por navegação cruzada
 * (registro de contato ⇄ encaminhamento). Rola até o item e o destaca por
 * alguns segundos — o bastante para o olho achar, sem ficar marcado para sempre.
 */
export function useDestaque(alvo: string | null, duracaoMs = 2500) {
  const [ativoId, setAtivoId] = useState<string | null>(alvo);

  useEffect(() => {
    setAtivoId(alvo);
    if (!alvo) return;
    const t = window.setTimeout(() => setAtivoId(null), duracaoMs);
    return () => window.clearTimeout(t);
  }, [alvo, duracaoMs]);

  const ref = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el && id === alvo) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    [alvo],
  );

  return { ref, ativo: (id: string) => id === ativoId };
}
