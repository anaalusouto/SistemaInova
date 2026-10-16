import { createContext, useContext, useState, type ReactNode } from 'react';
import { useNavigate, useRouter, useRouterState, useSearch } from '@tanstack/react-router';

interface NavegacaoPopup { chave: string | null; mudar: (chave: string | null) => void }
const ContextoPopup = createContext<NavegacaoPopup | null>(null);

/** O histórico guarda somente IDs: Voltar fecha o detalhe, Avançar o reabre. */
export function PopupNavegacao({ children }: { children: ReactNode }) {
  const busca = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const router = useRouter();
  const estado = useRouterState({ select: s => s.location.state }) as { __inovaPopup?: string };
  const mudar = (chave: string | null) => {
    if (chave === (busca.popup ?? null)) return;
    if (chave) {
      void navigate({ to: '/', search: prev => ({ ...prev, popup: chave }), state: prev => ({ ...prev, __inovaPopup: chave }), resetScroll: false });
    } else if (busca.popup && estado.__inovaPopup === busca.popup) {
      router.history.back();
    } else {
      // Link aberto diretamente: fechar mantém a página, sem voltar para fora.
      void navigate({ to: '/', search: prev => ({ ...prev, popup: undefined }), state: prev => ({ ...prev, __inovaPopup: undefined }), replace: true, resetScroll: false });
    }
  };
  return <ContextoPopup.Provider value={{ chave: busca.popup ?? null, mudar }}>{children}</ContextoPopup.Provider>;
}

/** Fallback local para usos isolados; no aplicativo, o estado vem da URL. */
export function usePopupChave(escopo: string): [string | null, (chave: string | null) => void] {
  const contexto = useContext(ContextoPopup);
  const [local, setLocal] = useState<string | null>(null);
  const prefixo = `${escopo}:`;
  if (!contexto) return [local, setLocal];
  return [contexto.chave?.startsWith(prefixo) ? contexto.chave.slice(prefixo.length) : null,
    chave => { if (chave || contexto.chave?.startsWith(prefixo)) contexto.mudar(chave ? prefixo + chave : null); }];
}
