import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import {
  listarTarefasGestao, criarTarefaGestao, editarTarefaGestao, moverTarefaGestao,
  atualizarStatusTarefaGestao, excluirTarefaGestao,
  type TarefaGestao, type TarefaGestaoStatus,
} from '../tarefasGestao.server';

const QUERY_KEY = ['tarefas-gestao'];

export function useGestaoTarefas() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listarTarefasGestao(),
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('tarefas-gestao-sync')
      .on('broadcast', { event: 'changed' }, () => invalidate())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [invalidate]);

  const create = useCallback(async (input: {
    titulo: string; atribuidoParaLogin: string; atribuidoParaNome: string;
    atribuidoPorLogin: string; atribuidoPorNome: string;
    dataEntrada: string; dataLimite: string; criticidade: number; projetoIds: number[];
  }) => {
    await criarTarefaGestao({ data: input });
    invalidate();
  }, [invalidate]);

  const edit = useCallback(async (input: {
    id: string; titulo: string; dataEntrada: string; dataLimite: string; criticidade: number; projetoIds: number[];
  }) => {
    await editarTarefaGestao({ data: input });
    invalidate();
  }, [invalidate]);

  const move = useCallback(async (id: string, atribuidoParaLogin: string, atribuidoParaNome: string) => {
    await moverTarefaGestao({ data: { id, atribuidoParaLogin, atribuidoParaNome } });
    invalidate();
  }, [invalidate]);

  const setStatus = useCallback(async (id: string, status: TarefaGestaoStatus) => {
    await atualizarStatusTarefaGestao({ data: { id, status } });
    invalidate();
  }, [invalidate]);

  const remove = useCallback(async (id: string) => {
    await excluirTarefaGestao({ data: { id } });
    invalidate();
  }, [invalidate]);

  return {
    tarefas: (data ?? []) as TarefaGestao[],
    loading: isLoading,
    create, edit, move, setStatus, remove,
  };
}
