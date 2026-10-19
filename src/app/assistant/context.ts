import catalogo from "./knowledge.json";
import manual from "./manual.json";
import { ajudaDiagnostico } from "./diagnosticHelp";
import type { BuscaApp } from "../lib/navegacaoApp";

export type ContextoAssistente = { tela: string; formulario?: string; campo?: string };
export type FormularioAjuda = {
  titulo: string;
  fontes: string[];
  orientacao: string;
  campos: Record<string, string>;
};
const formularios: Record<string, FormularioAjuda> = {
  ...catalogo.formularios,
  ...manual.formularios,
  ...ajudaDiagnostico,
};
for (const [id, complemento] of Object.entries(manual.complementos)) {
  formularios[id] = {
    ...formularios[id],
    campos: { ...formularios[id].campos, ...complemento.campos },
  };
}
export const conhecimento = {
  ...catalogo,
  versao: manual.versao,
  formularios,
  guias: manual.guias,
};

/** Só aceita chaves de documentação. Nunca valores, URLs, nomes ou IDs de registros. */
export function contextoSeguro(raw: unknown): ContextoAssistente {
  const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const tela =
    typeof d.tela === "string" && Object.hasOwn(catalogo.telas, d.tela) ? d.tela : "overview";
  const formulario =
    typeof d.formulario === "string" && Object.hasOwn(formularios, d.formulario)
      ? d.formulario
      : undefined;
  const campos = formulario ? formularios[formulario].campos : {};
  const campo = typeof d.campo === "string" && Object.hasOwn(campos, d.campo) ? d.campo : undefined;
  return { tela, ...(formulario ? { formulario } : {}), ...(campo ? { campo } : {}) };
}

export function contextoDaNavegacao(busca: BuscaApp): ContextoAssistente {
  let tela: string = busca.area ?? "overview";
  if (
    busca.area === "organizations" &&
    (busca.projeto || busca.secao === "projeto" || busca.secao === "projetos")
  )
    tela = busca.aba ?? "plano";
  else if (busca.area === "organizations" && busca.org) tela = busca.secao ?? "dados";
  else if (busca.area === "schedule") tela = `gestao-${busca.gestao ?? "plano"}`;
  return contextoSeguro({ tela });
}
