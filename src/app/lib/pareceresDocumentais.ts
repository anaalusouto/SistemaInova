import { validarDocumento } from './documentosRegistro';

export interface AnexoParecer {
  id: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanhoBytes: number;
}
export interface ParecerDocumental {
  id: string;
  criadoEm: string;
  enviadoPor: string;
  anexos: AnexoParecer[];
}
export interface DocumentoParecerRow {
  id: string;
  storage_path: string;
  nome_arquivo: string;
  tipo_mime: string;
  tamanho_bytes: number;
  criado_em: string;
  enviado_por: string;
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
/**
 * Contrato de persistência: cada cadastro ocupa uma pasta UUID imutável dentro
 * de documentos/parecer/<organização>/registros/. Todos os metadados continuam
 * em documentos_registro. Caminhos anteriores representam pareceres individuais.
 * Não depende de nomes de arquivo, ordem de envio ou datas para agrupar anexos.
 */
export function idParecerDocumento(row: Pick<DocumentoParecerRow, 'id' | 'storage_path'>, organizacaoId: string) {
  const match = new RegExp(`^documentos/parecer/(${UUID})/registros/(${UUID})/(${UUID})$`, 'i').exec(row.storage_path);
  return match && match[1].toLowerCase() === organizacaoId.toLowerCase() ? match[2] : row.id;
}

export function agruparPareceres(rows: DocumentoParecerRow[], organizacaoId: string): ParecerDocumental[] {
  const grupos = new Map<string, ParecerDocumental>();
  for (const row of rows) {
    const id = idParecerDocumento(row, organizacaoId);
    let parecer = grupos.get(id);
    if (!parecer) {
      parecer = { id, criadoEm: row.criado_em, enviadoPor: row.enviado_por, anexos: [] };
      grupos.set(id, parecer);
    }
    parecer.anexos.push({ id: row.id, nomeArquivo: row.nome_arquivo, tipoMime: row.tipo_mime, tamanhoBytes: Number(row.tamanho_bytes) });
  }
  return [...grupos.values()];
}

export const LIMITE_ARQUIVO_PARECER = 20 * 1024 * 1024;
export function validarArquivosParecer(arquivos: { nomeArquivo: string; tipoMime: string; tamanhoBytes: number }[]) {
  if (!Array.isArray(arquivos) || !arquivos.length) throw new Error('Selecione ao menos um arquivo para o parecer.');
  if (arquivos.length > 50) throw new Error('Selecione até 50 arquivos por parecer.');
  for (const arquivo of arquivos) {
    validarDocumento(arquivo.nomeArquivo, arquivo.tipoMime, arquivo.tamanhoBytes, LIMITE_ARQUIVO_PARECER);
  }
}
