import { createServerFn } from '@tanstack/react-start';
import { validarRespostaCaderno, type RegistroCaderno, type ValoresCaderno } from './diagnostic/cadernoCria';

async function contexto(diagnosticoId: string, organizacaoId: string, escrita = false) {
  const sessao = await import('./sessao.server');
  const autor = escrita ? await sessao.exigirEscrita() : await sessao.exigirSessao();
  const { supabaseAdmin: db } = await import('../integrations/supabase/client.server');
  const { data, error } = await db.from('diagnosticos').select('id,status').eq('id', diagnosticoId).eq('comunidade_id', organizacaoId).maybeSingle();
  if (error || !data) throw new Error('A aplicação não pertence à organização selecionada.');
  if (escrita && data.status !== 'em_edicao') throw new Error('Mapeamento concluído: crie uma nova versão para alterar.');
  return { db, autor };
}
function mensagem(e: { code?: string; message: string }) {
  return ['42P01','PGRST205','PGRST202','42883'].includes(e.code ?? '') ? 'O Caderno CRIA precisa da migração de banco preparada para esta revisão. Nenhuma resposta foi alterada.' : e.message;
}
export const listarRespostasCaderno = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string; organizacaoId: string }) => d)
  .handler(async ({ data }): Promise<RegistroCaderno[]> => {
    const { db } = await contexto(data.diagnosticoId, data.organizacaoId);
    const r = await db.from('diagnostico_caderno_respostas').select('*').eq('diagnostico_id', data.diagnosticoId).order('codigo');
    if (r.error) throw new Error(mensagem(r.error));
    return r.data ?? [];
  });
export const salvarRespostaCaderno = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; organizacaoId: string; codigo: string; contexto: string; resposta: ValoresCaderno; versao: number }) => d)
  .handler(async ({ data }): Promise<RegistroCaderno> => {
    const { db, autor } = await contexto(data.diagnosticoId, data.organizacaoId, true);
    validarRespostaCaderno(data.codigo, data.contexto, data.resposta);
    if (!Number.isInteger(data.versao) || data.versao < 0) throw new Error('Versão da resposta inválida.');
    const r = await db.rpc('salvar_resposta_caderno_cria', { p_organizacao: data.organizacaoId, p_diagnostico: data.diagnosticoId, p_codigo: data.codigo, p_contexto: data.contexto, p_resposta: data.resposta, p_versao: data.versao, p_autor: autor.id });
    if (r.error) throw new Error(mensagem(r.error));
    if (!r.data) throw new Error('O banco não confirmou o salvamento. Suas alterações continuam no formulário.');
    return r.data;
  });
