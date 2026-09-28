import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listarOrganizacoes, obterOrganizacao,
  criarRegistroContato, atualizarRegistroContato, excluirRegistroContato,
  criarEncaminhamento, atualizarEncaminhamento, excluirEncaminhamento,
  salvarNotaOrganizacao,
} from '../../organizacoes.server';
import type { RegistroContatoInput, EncaminhamentoInput } from '../../lib/organizacoes';

/**
 * Leitura e escrita das Organizações.
 *
 * Toda escrita revalida a lista e a ficha, e também os projetos: o parecer do
 * projeto lê os registros de contato da organização. A atualização vinda de
 * outras pessoas chega pelo canal de realtime que a store já assina.
 */
export function useListaOrganizacoes() {
  return useQuery({ queryKey: ['organizacoes'], queryFn: () => listarOrganizacoes() });
}

export function useFichaOrganizacao(id: string) {
  return useQuery({ queryKey: ['organizacao', id], queryFn: () => obterOrganizacao({ data: { id } }) });
}

export function useEscritaOrganizacao() {
  const queryClient = useQueryClient();
  const revalidar = useCallback(() => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['organizacoes'] }),
    queryClient.invalidateQueries({ queryKey: ['organizacao'] }),
    queryClient.invalidateQueries({ queryKey: ['projetos'] }),
  ]), [queryClient]);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
    const r = await fn();
    await revalidar();
    return r;
  }, [revalidar]);

  return {
    criarRegistro: (d: RegistroContatoInput) => run(() => criarRegistroContato({ data: d })),
    atualizarRegistro: (registroId: string, dados: RegistroContatoInput) =>
      run(() => atualizarRegistroContato({ data: { registroId, dados } })),
    excluirRegistro: (registroId: string) => run(() => excluirRegistroContato({ data: { registroId } })),
    criarEncaminhamento: (d: EncaminhamentoInput) => run(() => criarEncaminhamento({ data: d })),
    atualizarEncaminhamento: (encaminhamentoId: string, dados: EncaminhamentoInput) =>
      run(() => atualizarEncaminhamento({ data: { encaminhamentoId, dados } })),
    excluirEncaminhamento: (encaminhamentoId: string) =>
      run(() => excluirEncaminhamento({ data: { encaminhamentoId } })),
    salvarNota: (organizacaoId: string, conteudo: string, versaoAberta: number) =>
      run(() => salvarNotaOrganizacao({ data: { organizacaoId, conteudo, versaoAberta } })),
  };
}
