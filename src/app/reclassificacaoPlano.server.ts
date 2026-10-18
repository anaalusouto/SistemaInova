import { createServerFn } from '@tanstack/react-start';
import { TIPOS_PLANO, validarReclassificacao, type TipoPlano, type PreviaReclassificacao, type ReclassificarPlanoInput } from './lib/reclassificacaoPlano';

async function contexto(escrita: boolean) {
  const { exigirSessao, exigirEscrita } = await import('./sessao.server');
  const sessao = await (escrita ? exigirEscrita() : exigirSessao());
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return { sessao, db: supabaseAdmin };
}

export const consultarReclassificacao = createServerFn({ method: 'POST' })
  .validator((d: { tipo: TipoPlano; id: string }) => d)
  .handler(async ({ data }): Promise<PreviaReclassificacao> => {
    const { db } = await contexto(true);
    if (!data || !TIPOS_PLANO.includes(data.tipo) || typeof data.id !== 'string') throw new Error('Registro inválido.');
    const { data: previa, error } = await db.rpc('previa_reclassificacao_plano', { p_tipo: data.tipo, p_id: data.id });
    if (error) throw new Error(error.code === 'PGRST202' ? 'A mudança de tipo ainda precisa ser instalada no banco.' : error.message);
    return { ...previa, dependencias: previa.dependencias.map(({ antes: _antes, coluna: _coluna, ...v }: Record<string, unknown>) => v) } as PreviaReclassificacao;
  });

export const reclassificarRegistro = createServerFn({ method: 'POST' })
  .validator((d: ReclassificarPlanoInput) => d)
  .handler(async ({ data }): Promise<string> => {
    const { sessao, db } = await contexto(true);
    validarReclassificacao(data);
    const { data: id, error } = await db.rpc('reclassificar_plano', {
      p_tipo: data.tipo, p_id: data.id, p_novo_tipo: data.novoTipo, p_pai: data.paiId,
      p_token: data.token, p_destinos: data.destinos, p_motivo: data.motivo,
      p_autor: sessao.displayName, p_papel: sessao.role,
    });
    if (error) throw new Error(error.message);
    return id as string;
  });

export interface HistoricoReclassificacao {
  id: string; data: string; autor: string; de_valor: TipoPlano; para_valor: TipoPlano;
  payload: { motivo: string; origem: Record<string, string | number | boolean | null>; vinculos: { grupo: string; nome: string }[] };
}
export const consultarHistoricoReclassificacao = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<HistoricoReclassificacao[]> => {
    const { db } = await contexto(false);
    const { data: rows, error } = await db.from('log_alteracoes_meta')
      .select('id,data,autor,de_valor,para_valor,payload').eq('target_id', data.id).eq('campo', 'tipo do registro').order('data', { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as HistoricoReclassificacao[];
  });
