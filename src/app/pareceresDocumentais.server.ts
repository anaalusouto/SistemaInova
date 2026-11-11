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
type MetadadosArquivo = { nomeArquivo: string; tipoMime: string; tamanhoBytes: number };
type ManifestoParecer = { organizacaoId: string; usuarioId: string; expiraEm: number; arquivos: (MetadadosArquivo & { storagePath: string })[] };

async function assinarManifesto(manifesto: ManifestoParecer) {
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!segredo) throw new Error('O envio de arquivos não está configurado.');
  const { createHmac } = await import('node:crypto');
  const dados = Buffer.from(JSON.stringify(manifesto)).toString('base64url');
  const assinatura = createHmac('sha256', segredo).update(`parecer-upload:${dados}`).digest('base64url');
  return `${dados}.${assinatura}`;
}

async function verificarManifesto(token: string, organizacaoId: string, usuarioId: string): Promise<ManifestoParecer> {
  if (typeof token !== 'string' || token.length > 100000) throw new Error('Envio de parecer inválido.');
  const [dados, assinatura, extra] = token.split('.');
  if (!dados || !assinatura || extra) throw new Error('Envio de parecer inválido.');
  const segredo = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!segredo) throw new Error('O envio de arquivos não está configurado.');
  const { createHmac, timingSafeEqual } = await import('node:crypto');
  const esperado = createHmac('sha256', segredo).update(`parecer-upload:${dados}`).digest();
  const recebido = Buffer.from(assinatura, 'base64url');
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) throw new Error('Envio de parecer inválido.');
  let manifesto: ManifestoParecer;
  try { manifesto = JSON.parse(Buffer.from(dados, 'base64url').toString('utf8')); } catch { throw new Error('Envio de parecer inválido.'); }
  if (manifesto.organizacaoId !== organizacaoId || manifesto.usuarioId !== usuarioId || manifesto.expiraEm < Date.now() || !Array.isArray(manifesto.arquivos) || manifesto.arquivos.length > 50) throw new Error('Envio expirado ou não pertence a esta sessão.');
  validarArquivosParecer(manifesto.arquivos);
  return manifesto;
}

/** Prepara um caminho privado e uma autorização de envio para cada anexo. */
export const prepararArquivosParecer = createServerFn({ method: 'POST' })
  .validator((d: { organizacaoId: string; arquivos: MetadadosArquivo[] }) => d)
  .handler(async ({ data }): Promise<{ manifesto: string; destinos: { storagePath: string; token: string }[] }> => {
    const { db, usuario } = await contexto(data.organizacaoId, true);
    validarArquivosParecer(data.arquivos);
    if (data.arquivos.length > 50) throw new Error('Selecione até 50 arquivos por parecer.');
    const { randomUUID } = await import('node:crypto');
    const parecerId = randomUUID();
    const arquivos = data.arquivos.map(a => ({ nomeArquivo: a.nomeArquivo, tipoMime: a.tipoMime, tamanhoBytes: a.tamanhoBytes, storagePath: `documentos/parecer/${data.organizacaoId}/registros/${parecerId}/${randomUUID()}` }));
    const destinos = [];
    for (const arquivo of arquivos) {
      const { data: signed, error } = await db.storage.from(BUCKET).createSignedUploadUrl(arquivo.storagePath);
      if (error || !signed?.token) throw new Error('Não foi possível preparar o envio dos anexos.');
      destinos.push({ storagePath: arquivo.storagePath, token: signed.token });
    }
    const manifesto = await assinarManifesto({ organizacaoId: data.organizacaoId, usuarioId: usuario.id, expiraEm: Date.now() + 2 * 60 * 60 * 1000, arquivos });
    return { manifesto, destinos };
  });

/** Confere tamanho e tipo diretamente no armazenamento antes do cadastro. */
export const concluirArquivosParecer = createServerFn({ method: 'POST' })
  .validator((d: { organizacaoId: string; manifesto: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const { db, usuario } = await contexto(data.organizacaoId, true);
    const manifesto = await verificarManifesto(data.manifesto, data.organizacaoId, usuario.id);
    const caminhos = manifesto.arquivos.map(a => a.storagePath);
    const existentes = await db.from('documentos_registro').select('storage_path').eq('area', 'parecer').eq('comunidade_id', data.organizacaoId).in('storage_path', caminhos);
    if (existentes.error) throw new Error('Não foi possível verificar os anexos do parecer.');
    if ((existentes.data ?? []).length === caminhos.length) return;
    if ((existentes.data ?? []).length) throw new Error('Os anexos já foram parcialmente registrados. Atualize a lista de pareceres.');
    for (const arquivo of manifesto.arquivos) {
      const { data: info, error } = await db.storage.from(BUCKET).info(arquivo.storagePath);
      if (error || !info || info.size !== arquivo.tamanhoBytes || info.contentType !== arquivo.tipoMime) throw new Error(`Não foi possível confirmar o arquivo ${arquivo.nomeArquivo}.`);
    }
    const rows = manifesto.arquivos.map(a => ({ area: 'parecer', comunidade_id: data.organizacaoId, projeto_id: null, storage_path: a.storagePath, nome_arquivo: a.nomeArquivo.trim(), tipo_mime: a.tipoMime, tamanho_bytes: a.tamanhoBytes, enviado_por: usuario.displayName }));
    const { error } = await db.from('documentos_registro').insert(rows);
    if (error) throw new Error('Não foi possível salvar o parecer. Atualize a lista antes de tentar novamente.');
  });

/** Remove somente envios temporários que ainda não foram registrados. */
export const cancelarArquivosParecer = createServerFn({ method: 'POST' })
  .validator((d: { organizacaoId: string; manifesto: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const { db, usuario } = await contexto(data.organizacaoId, true);
    const manifesto = await verificarManifesto(data.manifesto, data.organizacaoId, usuario.id);
    const caminhos = manifesto.arquivos.map(a => a.storagePath);
    const existentes = await db.from('documentos_registro').select('storage_path').eq('area', 'parecer').eq('comunidade_id', data.organizacaoId).in('storage_path', caminhos);
    if (existentes.error) throw new Error('Não foi possível verificar o estado dos anexos.');
    const registrados = new Set((existentes.data ?? []).map(row => row.storage_path));
    const temporarios = caminhos.filter(caminho => !registrados.has(caminho));
    if (temporarios.length) {
      const { error } = await db.storage.from(BUCKET).remove(temporarios);
      if (error) throw new Error('Não foi possível limpar os anexos temporários.');
    }
  });
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
