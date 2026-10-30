import type { RegistroCaderno } from "./cadernoCria";

/** Identifica o título registrado, sem interpretar relatos ou criar pendências. */
export function pendenciaDeRemapeamento(texto: string) {
  return /^remapeamento\s+dimensional\s+pendente\b/i.test(texto.trim());
}

export function prioridadesDoCaderno(registros: RegistroCaderno[]) {
  return registros
    .filter((r) => r.contexto === "" && /^PRIO[1-3]$/.test(r.codigo))
    .filter((r) => r.resposta.valor?.trim() || r.resposta.relato.trim())
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}

/** Separa apenas rótulos explícitos. O registro completo continua disponível. */
export function camposDaPrioridade(texto: string) {
  const campos: Record<string, string> = {};
  const rotulos =
    /^(resultado desejado|mudança desejada|obstáculo(?: inicial)?|apoio(?: necessário)?|público(?: beneficiado)?|responsável|prazo)\s*:\s*/gim;
  const ocorrencias = [...texto.matchAll(rotulos)];
  for (let i = 0; i < ocorrencias.length; i++) {
    const atual = ocorrencias[i];
    const valor = texto
      .slice(atual.index! + atual[0].length, ocorrencias[i + 1]?.index ?? texto.length)
      .trim();
    const chave = /^(resultado|mudança)/i.test(atual[1])
      ? "resultado"
      : /^obstáculo/i.test(atual[1])
        ? "obstaculo"
        : /^apoio/i.test(atual[1])
          ? "apoio"
          : /^público/i.test(atual[1])
            ? "publico"
            : atual[1].toLowerCase();
    campos[chave] = [campos[chave], valor].filter(Boolean).join("\n");
  }
  return campos;
}

export function trechoExecutivo(texto: string | null | undefined, limite = 360) {
  const paragrafo = texto?.trim().split(/\n\s*\n/)[0] ?? "";
  if (paragrafo.length <= limite) return paragrafo;
  const corte = paragrafo.lastIndexOf(" ", limite);
  return `${paragrafo.slice(0, corte > 0 ? corte : limite)}…`;
}

export function ordenarDimensoes<T extends { media: number | null }>(dimensoes: T[]) {
  return [...dimensoes]
    .sort((a, b) => (a.media ?? Infinity) - (b.media ?? Infinity))
    .map((d, _i, todas) => ({
      ...d,
      ordem:
        d.media === null
          ? null
          : 1 + todas.filter((o) => o.media !== null && o.media < d.media!).length,
    }));
}
