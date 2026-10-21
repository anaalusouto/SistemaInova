import { conhecimento, contextoSeguro, type ContextoAssistente } from "./context";
import type { RespostaLocal } from "./localBot";
const normal = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
type Guia = (typeof conhecimento.guias)[number];
const paragrafo = (texto: string, fontes: string[], assunto?: string): RespostaLocal => ({
  texto,
  fontes,
  assunto,
});
export function catalogoCobertura() {
  return {
    guias: conhecimento.guias.length,
    regras: conhecimento.guias.reduce((n, g) => n + g.regras.length, 0),
    campos: Object.values(conhecimento.formularios).reduce(
      (n, f) => n + Object.keys(f.campos).length,
      0,
    ),
    versao: conhecimento.versao,
  };
}
function formatarGuia(g: Guia, campos: boolean, soRegras: boolean) {
  const f = conhecimento.formularios[g.id];
  return [
    g.titulo,
    ...(!soRegras ? ["Como fazer:\n" + g.passos.map((p, i) => `${i + 1}. ${p}`).join("\n")] : []),
    ...(campos && f
      ? [
          "Como preencher cada campo:\n" +
            Object.entries(f.campos)
              .map(([k, v]) => `• ${k}: ${v}`)
              .join("\n"),
        ]
      : []),
    "Regras verificadas:\n" + g.regras.map((r) => `• ${r}`).join("\n"),
    "Orientação de consulta: execute as ações diretamente na tela, conforme seu perfil. O assistente não salva alterações.",
  ].join("\n\n");
}
function localizarGuia(q: string, ctx: ContextoAssistente): Guia | undefined {
  const operacoes: [RegExp, string][] = [
    [/\b(reclassificar|reclassificacao|ordenar|reordenar|ordenacao)\b/, "ordenacao"],
    [/\b(excluir|exclusao|apagar|remover)\b/, "exclusao"],
    [/\b(aprovar|aprovacao|rejeitar)\b/, "aprovacao"],
    [/\b(importar|importacao)\b/, "importacao"],
  ];
  const operacao = operacoes.find(([padrao]) => padrao.test(q));
  if (operacao) return conhecimento.guias.find((g) => g.id === operacao[1]);
  const termos = q
    .split(" ")
    .filter(
      (s) =>
        s.length >= 3 &&
        ![
          "como",
          "preencher",
          "preencho",
          "regras",
          "regra",
          "fazer",
          "faco",
          "cada",
          "campo",
          "campos",
          "sobre",
          "negocio",
          "passo",
          "passos",
          "todas",
          "tudo",
          "dados",
        ].includes(s),
    );
  const candidates = conhecimento.guias
    .map((g) => {
      const terms = normal(`${g.titulo} ${g.termos}`).split(" ");
      const hits = termos.filter((t) => terms.includes(t)).length;
      const assuntoExplicito = termos.includes(normal(g.id)) || termos.includes(`${normal(g.id)}s`);
      return {
        g,
        score: hits * 3 + (assuntoExplicito ? 15 : 0) + (hits && g.id === ctx.formulario ? 1 : 0),
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
  return (
    candidates[0]?.g ??
    (/\b(este|esse|isso|aqui)\b/.test(q) || termos.length === 0
      ? conhecimento.guias.find((g) => g.id === ctx.formulario)
      : undefined)
  );
}
export function responderManual(
  pergunta: string,
  contexto: ContextoAssistente,
): RespostaLocal | undefined {
  const q = normal(pergunta);
  const ctx = contextoSeguro(contexto);
  if (
    /\b(todas as regras|todas regras|regras de negocio|catalogo de regras)\b/.test(q) &&
    !conhecimento.guias.some((g) => q.includes(normal(g.id)) && g.id !== "acesso")
  ) {
    const c = catalogoCobertura();
    return paragrafo(
      `Catálogo de regras do CRIA\n${c.regras} regras documentadas em ${c.guias} assuntos, versão ${c.versao}. São as regras verificadas no projeto; normas institucionais não expressas no código continuam como lacunas.\n\n${conhecimento.guias.map((g) => `${g.titulo}\n${g.regras.map((r) => `• ${r}`).join("\n")}`).join("\n\n")}\n\nPara os passos de uma operação, pergunte “Como faço…” com o nome do assunto.`,
      [...new Set(conhecimento.guias.flatMap((g) => g.fontes))],
    );
  }
  if (/\b(o que posso perguntar|assuntos disponiveis|indice de ajuda|guia completo)\b/.test(q))
    return paragrafo(
      `Posso ajudar com:\n${conhecimento.guias.map((g) => `• ${g.titulo}`).join("\n")}\n\nTambém posso resumir os projetos carregados e detalhar metas, etapas, atividades e riscos. Exemplos: “Como preencher uma atividade?”, “Regras do orçamento”, “IEO 1.1.1”, “Liste os projetos”.`,
      ["src/app/assistant/manual.json"],
    );
  const id = pergunta.match(/\b\d+(?:\.\d+){2}\b/)?.[0];
  const instrumento = /\bieo\b/.test(q)
    ? "ieo"
    : /\bparecer\b/.test(q)
      ? "parecerDiagnostico"
      : ctx.formulario === "ieo" || ctx.formulario === "parecerDiagnostico"
        ? ctx.formulario
        : undefined;
  if (id && instrumento) {
    const f = conhecimento.formularios[instrumento];
    const texto = f.campos[id];
    return texto
      ? paragrafo(`${f.titulo}\n${texto}\n\n${f.orientacao}`, f.fontes, "diagnostico")
      : paragrafo(
          `Não encontrei a pergunta ${id} no catálogo de ${f.titulo}. Confira o identificador exibido na tela.`,
          f.fontes,
        );
  }
  const guia = localizarGuia(q, ctx);
  // Campo explicitamente citado: prefere o instrumento indicado e o formulário selecionado.
  const escopo = /\bieo\b/.test(q)
    ? "ieo"
    : /\bcesta|produto\b/.test(q)
      ? "cesta"
      : /\bmatriz\b/.test(q)
        ? "matriz"
        : /\bparecer.*diagnostico\b/.test(q)
          ? "parecerDiagnostico"
          : (guia?.id ?? ctx.formulario);
  const f = escopo ? conhecimento.formularios[escopo] : undefined;
  const buscaCampo=escopo==='matriz'?q.replace(/\bcriticidade\b(?! atual)/,'criticidade atual').replace(/\binteresse\b(?! em desenvolvimento)/,'interesse em desenvolvimento'):q;
  const exatos = f
    ? Object.entries(f.campos)
        .filter(([campo]) => normal(campo).length >= 3 && ` ${buscaCampo} `.includes(` ${normal(campo)} `))
        .sort((a, b) => b[0].length - a[0].length)
    : [];
  if (
    exatos.length &&
    !/\b(todas|todos|regras|campos|passo a passo|resumo|resuma|listar|liste|quantos|quantas)\b/.test(
      q,
    )
  ) {
    const [campo, texto] = exatos[0];
    return paragrafo(
      `${f!.titulo} · ${campo}\n\nComo preencher:\n${texto}\n\nAntes de salvar:\n${f!.orientacao}`,
      f!.fontes,
      escopo,
    );
  }
  const regras = /\b(regras?|obrigatori[oa]s?|validacao|por que|porque|nao consigo)\b/.test(q);
  const processo =
    /\b(como|passo a passo|cadastrar|cadastro|preencher|preencho|funciona|guia|explicar|explique)\b/.test(
      q,
    );
  if (guia && (regras || processo) && !/\b(este campo|esse campo|esta tela|essa tela)\b/.test(q))
    return paragrafo(
      formatarGuia(guia, /\b(campos|preencher|preencho|cadastro)\b/.test(q), regras && !processo),
      guia.fontes,
      guia.id,
    );
  return;
}
