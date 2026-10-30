import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

export const AVISO_PENDENCIAS = 'Salve ou cancele as alterações antes de navegar.';
export function navegarSemPendencias(pendente: boolean, navegar: () => void) {
  if (pendente) { toast.error(AVISO_PENDENCIAS); return false; }
  navegar(); return true;
}

type Registrar = (id: string, pendente: boolean) => void;
const ContextoPendencias = createContext<Registrar | null>(null);

export function PendenciasModulo({ children, aoPendencias }: { children: ReactNode; aoPendencias: (pendente: boolean) => void }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const registrar = useCallback<Registrar>((id, pendente) => setIds(antes => {
    if (antes.has(id) === pendente) return antes;
    const depois = new Set(antes);
    if (pendente) depois.add(id); else depois.delete(id);
    return depois;
  }), []);
  const pendente = ids.size > 0;
  useEffect(() => aoPendencias(pendente), [aoPendencias, pendente]);
  useEffect(() => {
    if (!pendente) return;
    const avisar = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [pendente]);
  return <ContextoPendencias.Provider value={registrar}>{children}</ContextoPendencias.Provider>;
}

export function usePendenciaModulo(pendente: boolean) {
  const registrar = useContext(ContextoPendencias);
  const id = useId();
  useEffect(() => {
    registrar?.(id, pendente);
    return () => registrar?.(id, false);
  }, [registrar, id, pendente]);
}
