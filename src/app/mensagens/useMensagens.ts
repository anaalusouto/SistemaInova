import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { listarMensagens, enviarMensagem, type Mensagem } from '../mensagens.server';
import { criarAtribuicoes } from '../atribuicoes.server';
import { useAuth } from '../auth/authStore';
import type { ExtractedAssignment } from './mentionUtils';

const QUERY_KEY = ['mensagens'];

export function useMensagens() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QUERY_KEY, queryFn: () => listarMensagens() });

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

  const send = useCallback(async (texto: string, assignments: ExtractedAssignment[] = []) => {
    if (!user) return;
    const { id } = await enviarMensagem({ data: { autorLogin: user.login, autorNome: user.displayName, texto } });
    invalidate();
    if (assignments.length) {
      // A mensagem já foi enviada nesse ponto — se a atribuição falhar, não desfaz o envio.
      try {
        await criarAtribuicoes({
          data: { mensagemId: id, atribuidoPorLogin: user.login, atribuidoPorNome: user.displayName, itens: assignments },
        });
      } catch { /* ignore */ }
    }
  }, [user, invalidate]);

  return { mensagens: (data ?? []) as Mensagem[], loading: isLoading, send };
}
