import type { ProjectExt } from "../store";

export const TIPOS_GRAFICO = [
  { id: "barras", nome: "Barras" },
  { id: "linhas", nome: "Linhas" },
  { id: "area", nome: "Área" },
  { id: "rosca", nome: "Rosca" },
  { id: "dispersao", nome: "Dispersão (X × Y)" },
] as const;
export const DIMENSOES = [
  { id: "organizacao", nome: "Organização" },
  { id: "status", nome: "Status do projeto" },
  { id: "segmento", nome: "Classificação da organização" },
  { id: "coordenador", nome: "Coordenador" },
  { id: "financiador", nome: "Financiador" },
  { id: "projeto", nome: "Projeto" },
] as const;
export const METRICAS = [
  { id: "projetos", nome: "Quantidade de projetos", unidade: "numero" },
  { id: "orcamento", nome: "Orçamento aprovado", unidade: "moeda" },
  { id: "executado", nome: "Valor executado", unidade: "moeda" },
  { id: "saldo", nome: "Saldo orçamentário", unidade: "moeda" },
  { id: "avanco", nome: "Avanço físico", unidade: "percentual" },
  { id: "execucao", nome: "Execução financeira", unidade: "percentual" },
  { id: "riscos", nome: "Riscos em aberto", unidade: "numero" },
  { id: "atividades", nome: "Atividades concluídas", unidade: "numero" },
] as const;
export type TipoGrafico = (typeof TIPOS_GRAFICO)[number]["id"];
export type Dimensao = (typeof DIMENSOES)[number]["id"];
export type Metrica = (typeof METRICAS)[number]["id"];
export interface ConfigGrafico {
  id: string;
  tipo: TipoGrafico;
  dimensao: Dimensao;
  metrica: Metrica;
  cruzamento: Dimensao | "nenhum";
  metricaX: Metrica;
  agregacao: "soma" | "media";
}
export interface PreferenciasVisualizacao {
  versao: 1;
  graficos: ConfigGrafico[];
}
export const MAX_GRAFICOS = 8;
export function preferenciasPadrao(): PreferenciasVisualizacao {
  const base: ConfigGrafico = {
    id: "organizacoes",
    tipo: "barras",
    dimensao: "organizacao",
    metrica: "orcamento",
    cruzamento: "nenhum",
    metricaX: "avanco",
    agregacao: "soma",
  };
  return {
    versao: 1,
    graficos: [
      base,
      { ...base, id: "status", tipo: "rosca", dimensao: "status", metrica: "projetos" },
      { ...base, id: "comparacao", tipo: "dispersao", metrica: "execucao", metricaX: "avanco" },
    ],
  };
}
export function chavePreferencias(login: string) {
  return `inova:visao-geral:v1:${encodeURIComponent(login)}`;
}

/** Preferências são somente configuração; nunca armazenam dados dos projetos. */
export function lerPreferencias(raw: string | null): PreferenciasVisualizacao {
  if (!raw) return preferenciasPadrao();
  try {
    const p = JSON.parse(raw);
    if (p?.versao !== 1 || !Array.isArray(p.graficos) || p.graficos.length > MAX_GRAFICOS)
      return preferenciasPadrao();
    const ids = new Set<string>();
    const validas = p.graficos.every((c: ConfigGrafico) => {
      if (!c || typeof c.id !== "string" || !c.id || c.id.length > 100 || ids.has(c.id))
        return false;
      ids.add(c.id);
      return (
        TIPOS_GRAFICO.some((t) => t.id === c.tipo) &&
        DIMENSOES.some((d) => d.id === c.dimensao) &&
        METRICAS.some((m) => m.id === c.metrica) &&
        METRICAS.some((m) => m.id === c.metricaX) &&
        (c.cruzamento === "nenhum" || DIMENSOES.some((d) => d.id === c.cruzamento)) &&
        ["soma", "media"].includes(c.agregacao)
      );
    });
    return validas
      ? {
          versao: 1,
          graficos: p.graficos.map((c: ConfigGrafico) => ({
            id: c.id,
            tipo: c.tipo,
            dimensao: c.dimensao,
            metrica: c.metrica,
            metricaX: c.metricaX,
            cruzamento: c.cruzamento,
            agregacao: c.agregacao,
          })),
        }
      : preferenciasPadrao();
  } catch {
    return preferenciasPadrao();
  }
}
export function valorMetrica(p: ProjectExt, m: Metrica): number | null {
  const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  switch (m) {
    case "projetos":
      return 1;
    case "orcamento":
      return numero(p.budgetApproved);
    case "executado":
      return numero(p.budgetExecuted);
    case "saldo":
      return numero(p.budgetApproved) !== null && numero(p.budgetExecuted) !== null
        ? p.budgetApproved - p.budgetExecuted
        : null;
    case "avanco":
      return numero(p.progress);
    case "execucao":
      return numero(p.budgetApproved) !== null &&
        p.budgetApproved > 0 &&
        numero(p.budgetExecuted) !== null
        ? (p.budgetExecuted / p.budgetApproved) * 100
        : null;
    case "riscos":
      return (p.risks ?? []).filter((r) => r.status !== "Encerrado").length;
    case "atividades":
      return (p.goals ?? [])
        .flatMap((g) => g.deliverables)
        .flatMap((e) => e.activities)
        .filter((a) => a.status === "Concluído").length;
  }
}
function valorDimensao(p: ProjectExt, d: Dimensao): string {
  const valor =
    d === "organizacao"
      ? p.org || p.organizacao?.nome
      : d === "segmento"
        ? p.segmento
        : d === "coordenador"
          ? p.coordinator
          : d === "financiador"
            ? p.financier
            : d === "projeto"
              ? `${p.code} · ${p.name}`
              : p.status;
  return valor?.trim() || "Não informado";
}
export function formatarMetrica(valor: number, metrica: Metrica) {
  const unidade = METRICAS.find((m) => m.id === metrica)!.unidade;
  return unidade === "moeda"
    ? valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      })
    : `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${unidade === "percentual" ? "%" : ""}`;
}
export function usaMedia(c: ConfigGrafico) {
  return (
    METRICAS.find((m) => m.id === c.metrica)!.unidade === "percentual" || c.agregacao === "media"
  );
}

export interface SerieGrafico {
  chave: string;
  nome: string;
}
export interface LinhaGrafico {
  name: string;
  [chave: string]: string | number | null;
}
export function agruparVisualizacao(projetos: ProjectExt[], c: ConfigGrafico) {
  const separar = c.tipo !== "rosca" && c.cruzamento !== "nenhum" && c.cruzamento !== c.dimensao;
  const series: SerieGrafico[] = [];
  const seriePorNome = new Map<string, string>();
  const grupos = new Map<string, Map<string, { soma: number; n: number }>>();
  let ausentes = 0;
  for (const p of projetos) {
    const nome = valorDimensao(p, c.dimensao);
    const grupo = grupos.get(nome) ?? new Map();
    grupos.set(nome, grupo);
    const serie = separar
      ? valorDimensao(p, c.cruzamento as Dimensao)
      : METRICAS.find((m) => m.id === c.metrica)!.nome;
    if (!seriePorNome.has(serie)) {
      const chave = `serie${series.length}`;
      seriePorNome.set(serie, chave);
      series.push({ chave, nome: serie });
    }
    const chave = seriePorNome.get(serie)!;
    const valor = valorMetrica(p, c.metrica);
    if (valor === null) {
      ausentes++;
      continue;
    }
    const atual = grupo.get(chave) ?? { soma: 0, n: 0 };
    atual.soma += valor;
    atual.n++;
    grupo.set(chave, atual);
  }
  const media = usaMedia(c);
  const linhas: LinhaGrafico[] = [...grupos].map(([name, valores]) => {
    const linha: LinhaGrafico = { name };
    for (const s of series) {
      const v = valores.get(s.chave);
      linha[s.chave] = v ? (media ? v.soma / v.n : v.soma) : null;
    }
    return linha;
  });
  return { linhas, series, ausentes };
}
export function pontosDispersao(projetos: ProjectExt[], c: ConfigGrafico) {
  return projetos.flatMap((p) => {
    const x = valorMetrica(p, c.metricaX),
      y = valorMetrica(p, c.metrica);
    return x === null || y === null ? [] : [{ id: p.id, name: `${p.code} · ${p.name}`, x, y }];
  });
}
