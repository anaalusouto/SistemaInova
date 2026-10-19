import type { OrdemCamposPlano } from "./planoRelatorio";

export const COLUNAS_PLANO = [
  "Atividade",
  "Observações / resultado esperado",
  "Responsável",
  "Início previsto",
  "Fim previsto",
  "Início",
  "Fim",
  "Status",
  "Progresso (%)",
  "Justificativa de atraso",
  "Nível risco",
  "Vínculo orçamentário",
  "Anexo",
] as const;
export type ColunaPlano = (typeof COLUNAS_PLANO)[number];
export interface FormatoPlano {
  colunas: ColunaPlano[];
  ordemCampos: OrdemCamposPlano;
}
export const FORMATO_PADRAO: FormatoPlano = { colunas: [...COLUNAS_PLANO], ordemCampos: {} };
export function validarFormatoPlano(valor: unknown): FormatoPlano {
  const raw = valor && typeof valor === "object" ? (valor as Partial<FormatoPlano>) : {};
  const conhecidas = Array.isArray(raw.colunas)
    ? [...new Set(raw.colunas.filter((c) => COLUNAS_PLANO.includes(c)))]
    : [];
  const colunas = [...conhecidas, ...COLUNAS_PLANO.filter((c) => !conhecidas.includes(c))];
  const ordemCampos: OrdemCamposPlano = {};
  for (const tipo of ["meta", "etapa", "atividade", "tarefa", "risco", "parecer"] as const) {
    const lista = raw.ordemCampos?.[tipo];
    if (Array.isArray(lista))
      ordemCampos[tipo] = [
        ...new Set(lista.filter((c) => typeof c === "string" && /^[a-zA-Z]{1,50}$/.test(c))),
      ];
  }
  return { colunas, ordemCampos };
}
