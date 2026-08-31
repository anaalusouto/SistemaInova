import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { listarMensagens, type Mensagem } from '../mensagens.server';
import { extractMentionedLogins, mentionTextOnly } from './mentionUtils';
import { useAuth } from '../auth/authStore';

const QUERY_KEY = ['mensagens'];

/**
 * Popup em tempo real: dispara sempre que uma mensagem nova @menciona o usuário logado
 * (com ou sem tarefa junto — mencionar sozinho já vale, diferente da atribuição de tarefa
 * em si, que exige tarefa+pessoa juntas). Mesmo padrão de diff do useApprovalToasts
 * (NotificationsBell.tsx): só notifica o que chegou depois do primeiro snapshot.
 *
 * Assina o canal 'mensagens-sync' por conta própria (mesmo já existindo em useMensagens)
 * porque este hook fica montado no AppShell inteiro — precisa ver mensagens novas mesmo
 * com o usuário fora da aba Mensagens.
 */
export function useMentionToasts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: QUERY_KEY, queryFn: () => listarMensagens() });
  const seenIds = useRef<Set<string> | null>(null);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('mensagens-sync')
      .on('broadcast', { event: 'changed' }, () => invalidate())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [invalidate]);

  useEffect(() => {
    const mensagens = (data ?? []) as Mensagem[];
    const prev = seenIds.current;

    if (prev && user) {
      for (const m of mensagens) {
        if (prev.has(m.id) || m.autorLogin === user.login) continue;
        if (extractMentionedLogins(m.texto).includes(user.login)) {
          const plain = mentionTextOnly(m.texto);
          toast.info(`${m.autorNome} mencionou você numa mensagem`, {
            description: plain.length > 140 ? `${plain.slice(0, 140)}…` : plain,
          });
        }
      }
    }

    seenIds.current = new Set(mensagens.map(m => m.id));
  }, [data, user]);
}
