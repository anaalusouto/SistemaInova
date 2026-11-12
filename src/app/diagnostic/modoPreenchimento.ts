export type ModoPreenchimento = 'plataforma' | 'planilha';
export function lerModoPreenchimento(id: string): ModoPreenchimento {
  try { return typeof window !== 'undefined' && window.localStorage.getItem(`mapeamento-modo:${id}`) === 'planilha' ? 'planilha' : 'plataforma'; } catch { return 'plataforma'; }
}
export function guardarModoPreenchimento(id: string, modo: ModoPreenchimento) {
  try { if (typeof window !== 'undefined') window.localStorage.setItem(`mapeamento-modo:${id}`, modo); } catch { /* A escolha permanece disponível durante esta sessão. */ }
}
