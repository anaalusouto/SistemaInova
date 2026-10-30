import { createServerFn } from '@tanstack/react-start';
import { LIMITE_DOCUMENTO, validarDestinoDocumento } from './lib/documentosRegistro';
import { agruparPareceres, idParecerDocumento, validarArquivosParecer, type DocumentoParecerRow, type ParecerDocumental } from './lib/pareceresDocumentais';

const BUCKET = 'projeto-anexos';
const COLUNAS = 'id,storage_path,nome_arquivo,tipo_mime,tamanho_bytes,criado_em,enviado_por';
async function contexto(organizacaoId: string, escrita = false) {
  const { exigirSessao, exigirEscrita } = await import('./sessao.server');
  const usuario = await (escrita ? exigirEscrita() : exigirSessao());
  validarDestinoDocumento({ area: 'parecer', organizacaoId });
  const { supabaseAdmin: db } = await import('../integrations/supabase/client.server');
  const { data: org, error } = await db.from('comunidades').select('id').eq('id', organizacaoId).maybeSingle();
  if (error || !org) throw new Error('Organização não encontrada. Reabra a tela e tente novamente.');
  return { db, usuario };
}
async function documentos(db: Awaited<ReturnType<typeof contexto>>['db'], organizacaoId: string): Promise<DocumentoParecerRow[]> {
  const { data, error } = await db.from('documentos_registro').select(COLUNAS)
    .eq('area', 'parecer').eq('comunidade_id', organizacaoId)
    .order('criado_em', { ascending: false }).order('id');
  if (error) throw new Error('Não foi possível carregar os pareceres. Tente novamente.');
  return data ?? [];
}

export const listarPareceresDocumentais = createServerFn({ method: 'GET' })
  .validator((d: { organizacaoId: string }) => d)
  .handler(async ({ data }): Promise<ParecerDocumental[]> => {
    const { db } = await contexto(data.organizacaoId);
    return agruparPareceres(await documentos(db, data.organizacaoId), data.organizacaoId);
  });

type ArquivoInput = { nomeArquivo: string; tipoMime: string; dataUrl: string };
export const criarParecerDocumental = createServerFn({ method: 'POST' })
  .validator((d: { organizacaoId: string; arquivos: ArquivoInput[] }) => d)
  .handler(async ({ data }): Promise<void> => {
    const { db, usuario } = await contexto(data.organizacaoId, true);
    if (!Array.isArray(data.arquivos) || !data.arquivos.length) throw new Error('Selecione ao menos um arquivo para o parecer.');
    // Limita o payload antes de decodificar, além de validar os bytes reais abaixo.
    let caracteres = 0;
    for (const a of data.arquivos) {
      if (!a || typeof a.dataUrl !== 'string') throw new Error('Arquivo inválido.');
      caracteres += a.dataUrl.length;
    }
    if (caracteres > Math.ceil(LIMITE_DOCUMENTO * 4 / 3) + data.arquivos.length * 256)
      throw new Error('Os anexos do parecer devem somar no máximo 3 MB.');
    const arquivos = data.arquivos.map(a => ({ ...a, conteudo: Buffer.from(a.dataUrl.includes(',') ? a.dataUrl.slice(a.dataUrl.indexOf(',') + 1) : a.dataUrl, 'base64') }));
    validarArquivosParecer(arquivos.map(a => ({ ...a, tamanhoBytes: a.conteudo.byteLength })));
    const { randomUUID } = await import('node:crypto');
    const parecerId = randomUUID();
    const enviados: string[] = [];
    try {
      const rows = [];
      for (const a of arquivos) {
        const storagePath = `documentos/parecer/${data.organizacaoId}/registros/${parecerId}/${randomUUID()}`;
        const { error } = await db.storage.from(BUCKET).upload(storagePath, a.conteudo, { contentType: a.tipoMime, upsert: false });
        if (error) throw new Error('Não foi possível enviar os anexos. Tente novamente.');
        enviados.push(storagePath);
        rows.push({ area: 'parecer', comunidade_id: data.organizacaoId, projeto_id: null,
          storage_path: storagePath, nome_arquivo: a.nomeArquivo.trim(), tipo_mime: a.tipoMime,
          tamanho_bytes: a.conteudo.byteLength, enviado_por: usuario.displayName });
      }
      // Um único INSERT torna o cadastro de todos os metadados atômico.
      const { error } = await db.from('documentos_registro').insert(rows);
      if (error) throw new Error('Não foi possível salvar o parecer. Tente novamente.');
    } catch (e) {
      if (enviados.length) {
        const { error } = await db.storage.from(BUCKET).remove(enviados);
        if (error) console.error('[parecer] Falha na limpeza de envio incompleto', error.message);
      }
      throw e;
    }
  });

export const excluirParecerDocumental = createServerFn({ method: 'POST' })
  .validator((d: { organizacaoId: string; parecerId: string }) => d)
  .handler(async ({ data }): Promise<{ arquivosPendentes: boolean }> => {
    const { db } = await contexto(data.organizacaoId, true);
    const rows = (await documentos(db, data.organizacaoId)).filter(r => idParecerDocumento(r, data.organizacaoId) === data.parecerId);
    if (!rows.length) throw new Error('Parecer não encontrado. Atualize a listagem.');
    const { error } = await db.from('documentos_registro').delete()
      .eq('area', 'parecer').eq('comunidade_id', data.organizacaoId).in('id', rows.map(r => r.id));
    if (error) throw new Error('Não foi possível excluir o parecer.');
    const { error: storageError } = await db.storage.from(BUCKET).remove(rows.map(r => r.storage_path));
    if (storageError) console.error('[parecer] Falha na limpeza de anexos excluídos', storageError.message);
    return { arquivosPendentes: !!storageError };
  });
