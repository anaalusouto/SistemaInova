export type AreaDocumento = "projeto" | "mapeamento" | "parecer";
export type DestinoDocumento = { area: AreaDocumento; projetoId?: number; organizacaoId?: string };
// 3 MB mantém o transporte base64 abaixo do limite do servidor de hospedagem.
export const LIMITE_DOCUMENTO = 3 * 1024 * 1024;
export const TIPOS_DOCUMENTO = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
];
export const EXTENSOES_DOCUMENTO = ".pdf,.doc,.docx,.odt,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.webp";
export function validarDestinoDocumento(d: DestinoDocumento) {
  if (!["projeto", "mapeamento", "parecer"].includes(d.area))
    throw new Error("Área de documento inválida.");
  if (
    d.area === "projeto"
      ? !Number.isSafeInteger(d.projetoId) || d.projetoId! <= 0 || d.organizacaoId != null
      : !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          d.organizacaoId ?? "",
        ) || d.projetoId != null
  )
    throw new Error("Informe um único registro de destino válido para o documento.");
}
export function validarDocumento(nome: string, mime: string, tamanho: number) {
  if (
    typeof nome !== "string" ||
    !nome.trim() ||
    nome.length > 255 ||
    [...nome].some((c) => c.charCodeAt(0) < 32)
  )
    throw new Error("Nome de arquivo inválido.");
  if (!TIPOS_DOCUMENTO.includes(mime))
    throw new Error("Tipo de documento não aceito. Use PDF, documento, planilha, texto ou imagem.");
  if (!Number.isSafeInteger(tamanho) || tamanho <= 0) throw new Error("O arquivo está vazio.");
  if (tamanho > LIMITE_DOCUMENTO) throw new Error("O documento deve ter no máximo 3 MB.");
}
