export type AreaRelatorioOrg = 'mapeamento' | 'parecer';

/** Só documentos externos por HTTP(S); vazio permite retirar a referência. */
export function normalizarLinkRelatorio(valor: string): string | null {
  const texto = valor.trim();
  if (!texto) return null;
  try {
    const url = new URL(texto);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    return url.href;
  } catch {
    throw new Error('Informe um link externo válido começando com https:// ou http://.');
  }
}
