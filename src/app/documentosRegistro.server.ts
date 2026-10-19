import { createServerFn } from "@tanstack/react-start";
import {
  LIMITE_DOCUMENTO,
  validarDocumento,
  validarDestinoDocumento,
  type DestinoDocumento,
} from "./lib/documentosRegistro";

const BUCKET = "projeto-anexos";
async function admin() {
  return (await import("../integrations/supabase/client.server")).supabaseAdmin;
}
async function sessao(escrita = false) {
  const s = await import("./sessao.server");
  return escrita ? s.exigirEscrita() : s.exigirSessao();
}
export interface DocumentoRegistro {
  id: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanhoBytes: number;
  criadoEm: string;
}
function mapear(r: Record<string, unknown>): DocumentoRegistro {
  return {
    id: String(r.id),
    nomeArquivo: String(r.nome_arquivo),
    tipoMime: String(r.tipo_mime),
    tamanhoBytes: Number(r.tamanho_bytes),
    criadoEm: String(r.criado_em),
  };
}
async function destinoValido(data: DestinoDocumento) {
  validarDestinoDocumento(data);
  const db = await admin();
  const { data: pai, error } = await db
    .from(data.area === "projeto" ? "projetos" : "comunidades")
    .select("id")
    .eq("id", data.area === "projeto" ? data.projetoId! : data.organizacaoId!)
    .maybeSingle();
  if (error || !pai)
    throw new Error("O registro de destino não foi encontrado. Reabra a tela antes de anexar.");
  return db;
}
export const listarDocumentosRegistro = createServerFn({ method: "GET" })
  .validator((d: DestinoDocumento) => d)
  .handler(async ({ data }): Promise<DocumentoRegistro[]> => {
    await sessao();
    const db = await destinoValido(data);
    const { data: rows, error } = await db
      .from("documentos_registro")
      .select("id,nome_arquivo,tipo_mime,tamanho_bytes,criado_em")
      .eq("area", data.area)
      .eq(
        data.area === "projeto" ? "projeto_id" : "comunidade_id",
        data.area === "projeto" ? data.projetoId! : data.organizacaoId!,
      )
      .order("criado_em", { ascending: false });
    if (error)
      throw new Error(
        error.code === "42P01" || error.code === "PGRST205"
          ? "Os anexos desta área aguardam a atualização do banco de dados."
          : "Não foi possível carregar os documentos. Tente novamente.",
      );
    return (rows ?? []).map(mapear);
  });
export const enviarDocumentoRegistro = createServerFn({ method: "POST" })
  .validator(
    (d: DestinoDocumento & { nomeArquivo: string; tipoMime: string; dataUrl: string }) => d,
  )
  .handler(async ({ data }): Promise<DocumentoRegistro> => {
    const usuario = await sessao(true);
    validarDestinoDocumento(data);
    if (
      typeof data.dataUrl !== "string" ||
      data.dataUrl.length > Math.ceil((LIMITE_DOCUMENTO * 4) / 3) + 256
    )
      throw new Error("O documento deve ter no máximo 3 MB.");
    const conteudo = Buffer.from(
      data.dataUrl.includes(",") ? data.dataUrl.slice(data.dataUrl.indexOf(",") + 1) : data.dataUrl,
      "base64",
    );
    validarDocumento(data.nomeArquivo, data.tipoMime, conteudo.byteLength);
    const db = await destinoValido(data);
    const { randomUUID } = await import("node:crypto");
    const storagePath = `documentos/${data.area}/${data.projetoId ?? data.organizacaoId}/${randomUUID()}`;
    const { error: uploadError } = await db.storage
      .from(BUCKET)
      .upload(storagePath, conteudo, { contentType: data.tipoMime, upsert: false });
    if (uploadError) throw new Error("Não foi possível enviar o documento. Tente novamente.");
    const { data: row, error } = await db
      .from("documentos_registro")
      .insert({
        area: data.area,
        projeto_id: data.area === "projeto" ? data.projetoId : null,
        comunidade_id: data.area === "projeto" ? null : data.organizacaoId,
        storage_path: storagePath,
        nome_arquivo: data.nomeArquivo.trim(),
        tipo_mime: data.tipoMime,
        tamanho_bytes: conteudo.byteLength,
        enviado_por: usuario.displayName,
      })
      .select("id,nome_arquivo,tipo_mime,tamanho_bytes,criado_em")
      .single();
    if (error || !row) {
      await db.storage.from(BUCKET).remove([storagePath]);
      throw new Error(
        "O documento não foi registrado. Confira se a atualização do banco foi aplicada e tente novamente.",
      );
    }
    return mapear(row);
  });
export const abrirDocumentoRegistro = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ url: string; titulo: string; mimeType: string }> => {
    await sessao();
    const db = await admin();
    const { data: row, error } = await db
      .from("documentos_registro")
      .select("storage_path,nome_arquivo,tipo_mime")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Documento não encontrado.");
    const { data: signed, error: signError } = await db.storage
      .from(BUCKET)
      .createSignedUrl(row.storage_path, 600);
    if (signError || !signed) throw new Error("Não foi possível abrir o documento.");
    return { url: signed.signedUrl, titulo: row.nome_arquivo, mimeType: row.tipo_mime };
  });
export const excluirDocumentoRegistro = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    await sessao(true);
    const db = await admin();
    const { data: row, error } = await db
      .from("documentos_registro")
      .select("storage_path")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Documento não encontrado.");
    // Mantém o objeto até a referência ser removida; falha na gravação não quebra o arquivo existente.
    const { error: deleteError } = await db.from("documentos_registro").delete().eq("id", data.id);
    if (deleteError) throw new Error("Não foi possível remover o documento.");
    const { error: storageError } = await db.storage.from(BUCKET).remove([row.storage_path]);
    if (storageError)
      console.error("[documentos] Falha na limpeza do objeto removido", storageError.message);
  });
