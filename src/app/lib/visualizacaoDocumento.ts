export interface DocumentoVisualizacao { url: string; titulo: string; mimeType?: string }
export const EVENTO_VISUALIZAR_DOCUMENTO = 'inova:visualizar-documento';

export function validarDocumento(d: DocumentoVisualizacao): DocumentoVisualizacao {
  const url = new URL(d.url, typeof window === 'undefined' ? 'https://inova.invalid' : window.location.href);
  if (!['https:', 'http:', 'blob:'].includes(url.protocol)) throw new Error('Este endereço não pode ser visualizado.');
  return { url: url.href, titulo: d.titulo?.trim() || 'Documento', mimeType: d.mimeType };
}
export function urlDeVisualizacao(url: string): string {
  const u = new URL(url);
  if (u.hostname === 'docs.google.com') {
    const m = u.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([\w-]+)/);
    if (m) { u.pathname = `/${m[1]}/d/${m[2]}/preview`; return u.href; }
  }
  if (u.hostname === 'drive.google.com') {
    const id = u.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? (u.pathname === '/open' ? u.searchParams.get('id') : null);
    if (id && /^[\w-]+$/.test(id)) { u.pathname = `/file/d/${id}/preview`; u.searchParams.delete('id'); return u.href; }
  }
  return u.href;
}
/** Não abre uma aba do navegador nem redireciona a aplicação. */
export function visualizarDocumento(dados: DocumentoVisualizacao): void {
  const documento = validarDocumento(dados);
  window.dispatchEvent(new CustomEvent(EVENTO_VISUALIZAR_DOCUMENTO, { detail: documento }));
}
