import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { listarAtribuicoes, concluirAtribuicao, type Atribuicao } from '../atribuicoes.server';
import { useAuth } from '../auth/authStore';

const QUERY_KEY = ['atribuicoes'];

export function useAgenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, user?.login],
    queryFn: () => listarAtribuicoes({ data: { login: user!.login } }),
    enabled: !!user,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('atribuicoes-sync')
      .on('broadcast', { event: 'changed' }, () => invalidate())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [invalidate]);

  const toggle = useCallback(async (id: string, concluida: boolean) => {
    if (!user) return;
    await concluirAtribuicao({ data: { id, login: user.login, concluida } });
    invalidate();
  }, [user, invalidate]);

  return {
    paraMim: (data?.paraMim ?? []) as Atribuicao[],
    porMim: (data?.porMim ?? []) as Atribuicao[],
    loading: isLoading,
    toggle,
  };
}
