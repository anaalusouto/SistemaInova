import type { Project } from "../data/mockData";
import { conhecimento, contextoSeguro, type ContextoAssistente } from "./context";
import { responderManual } from "./manualHelp";
import { responderProjetos, type DetalheProjetoLocal } from "./projectHelp";

export type ResumoProjetoLocal = {
  metas: number;
  etapas: number;
  atividades: number;
  concluidas: number;
  riscos: number;
  riscosAbertos: number;
  status: string;
};
export type DadosAssistenteLocal = {
  carregando?: boolean;
  projetosCarregados: number;
  projeto?: ResumoProjetoLocal;
  projetoDetalhado?: DetalheProjetoLocal;
  projetos?: DetalheProjetoLocal[];
};
export type RespostaLocal = { texto: string; fontes: string[]; assunto?: string };
export type PerfilLocal = "admin" | "estagiario" | "visualizador";

/** Só deriva contagens do estado que o usuário já recebeu na plataforma. */
export function resumirProjetoLocal(
  project: Pick<Project, "goals" | "risks" | "status">,
): ResumoProjetoLocal {
  const etapas = project.goals.flatMap((meta) => meta.deliverables);
  const atividades = etapas.flatMap((etapa) => etapa.activities);
  return {
    metas: project.goals.length,
    etapas: etapas.length,
    atividades: atividades.length,
    concluidas: atividades.filter((a) => a.status === "Concluído").length,
    riscos: project.risks.length,
    riscosAbertos: project.risks.filter((r) => r.status !== "Encerrado").length,
    status: project.status,
  };
}

const normalizar = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const ignorar = new Set(
  "a o as os de da do das dos em no na nos nas um uma e ou para por que qual quais como eu voce me meu minha este esta esse essa isso sobre quero preciso preencho preencher entendo entender informe informar explicar explique campo formulario sistema inova".split(
    " ",
  ),
);
const radical = (s: string) =>
  ({
    atividades: "atividade",
    metas: "meta",
    etapas: "etapa",
    riscos: "risco",
    notas: "nota",
    projetos: "projeto",
    prazos: "prazo",
    datas: "data",
    orcamentario: "orcamento",
    orcamentaria: "orcamento",
  })[s] ?? s;
const termos = (s: string) => [
  ...new Set(
    normalizar(s)
      .split(" ")
      .filter((t) => t.length > 1 && !ignorar.has(t))
      .map(radical),
  ),
];
const aliases: Record<string, string> = {
  planejado: "orcamento item proposta quantidade valor unitario total proposto",
  execucao: "execucao executado diferenca justificativa",
  nota: "nota fiscal comprovante fornecedor",
  projeto: "projeto cadastro coordenador",
  atividade: "atividade progresso atraso prazo",
  risco: "risco probabilidade impacto mitigacao",
  meta: "meta",
  etapa: "etapa entrega",
};

const entradas = Object.entries(conhecimento.formularios).flatMap(([id, form]) => [
  {
    id,
    titulo: form.titulo,
    campo: undefined as string | undefined,
    texto: form.orientacao,
    fontes: form.fontes,
    busca: termos(`${form.titulo} ${aliases[id] ?? ""}`),
  },
  ...Object.entries(form.campos).map(([campo, texto]) => ({
    id,
    titulo: `${form.titulo} · ${campo}`,
    campo,
    texto,
    fontes: form.fontes,
    busca: termos(`${campo} ${/^\d|_/.test(campo) ? texto : ""}`),
  })),
]);
const resultado = (texto: string, fontes: string[] = []): RespostaLocal => ({ texto, fontes });

/** Busca determinística: sem rede, modelo, banco, execução de ações ou persistência. */
export function responderLocal(
  pergunta: string,
  contexto: ContextoAssistente,
  dados: DadosAssistenteLocal,
  perfil: PerfilLocal = "visualizador",
): RespostaLocal {
  const q = normalizar(pergunta);
  const atual = contextoSeguro(contexto);
  if (!q) return resultado("Digite uma pergunta sobre o Inova.");
  if (pergunta.length > 1000) return resultado("Use até 1.000 caracteres por pergunta.");
  if (
    /\b(token|chave de api|cpf|dados pessoais|qual (e )?(a |minha )?senha)\b/.test(q) ||
    /sk-[a-z0-9_-]{12,}/i.test(pergunta)
  )
    return resultado(
      "Não preciso de senhas, chaves ou dados pessoais. Informe apenas sua dúvida sobre a tela ou o campo.",
    );
  if (
    /^(?:por favor )?(?:crie|salve|exclua|apague|edite|altere|atualize|cadastre|conclua)\b/.test(q)
  )
    return resultado(
      "Este assistente apenas consulta e orienta. Nenhum registro foi alterado. Posso explicar como usar o formulário e suas permissões.",
    );
  if (/\b(permissao|permissoes|visualizador|administrador|estagiario|meu perfil)\b/.test(q))
    return resultado(
      `${conhecimento.perfis[perfil]}\n\nO chatbot apenas orienta e consulta os dados já carregados.`,
      [conhecimento.perfis.fonte],
    );
  if (/^(oi|ola|bom dia|boa tarde|boa noite|obrigad[oa])$/.test(q))
    return resultado(
      "Olá! Sou o assistente local do Inova. Posso explicar campos e telas ou resumir os dados do projeto aberto. Minhas respostas vêm de regras e da base do sistema.",
    );
  const manual = responderManual(pergunta, atual);
  if (manual) return manual;
  const consulta = responderProjetos(pergunta, dados);
  if (consulta) return consulta;
  const querDados =
    /\b(quantos|quantas|quantidade|resuma|resumo|situacao|dados do projeto|status do projeto)\b/.test(
      q,
    ) && !/\b(como|preencher|preencho|regras?|campo|valor unitario)\b/.test(q);
  if (querDados) {
    if (dados.carregando)
      return resultado(
        "Os dados da plataforma ainda estão carregando. Aguarde e pergunte novamente.",
      );
    if (/\bprojetos\b/.test(q) && !/\b(metas|etapas|atividades|riscos)\b/.test(q))
      return resultado(
        `Há ${dados.projetosCarregados} projeto(s) carregado(s) na sua sessão. Essa contagem considera os dados carregados, não os filtros visuais.`,
        ["Dados carregados na plataforma no momento da pergunta."],
      );
    const p = dados.projeto;
    if (!p)
      return resultado(
        "Abra um projeto em Organizações para consultar seu resumo. Posso informar a quantidade de projetos carregados ou explicar os formulários.",
      );
    const lines = [`Situação do projeto aberto: ${p.status}.`];
    if (/\b(atividade|atividades)\b/.test(q))
      lines.push(
        `Atividades: ${p.atividades}; concluídas: ${p.concluidas}; não concluídas: ${p.atividades - p.concluidas}.`,
      );
    else if (/\b(risco|riscos)\b/.test(q))
      lines.push(
        `Riscos: ${p.riscos}; em aberto: ${p.riscosAbertos}; encerrados: ${p.riscos - p.riscosAbertos}.`,
      );
    else
      lines.push(
        `Metas: ${p.metas}. Etapas: ${p.etapas}. Atividades: ${p.atividades}, das quais ${p.concluidas} concluídas. Riscos: ${p.riscos}, dos quais ${p.riscosAbertos} em aberto.`,
      );
    return resultado(lines.join("\n"), [
      "Dados do projeto aberto carregados na plataforma no momento da pergunta.",
    ]);
  }
  if (/\b(lacuna|lacunas|regras nao documentadas)\b/.test(q))
    return resultado(
      `Ainda precisam de esclarecimento:\n${conhecimento.lacunas
        .filter((l) => !l.startsWith("Prazo de retenção"))
        .map((l) => `• ${l}`)
        .join("\n")}`,
      ["Base de conhecimento do Inova · lacunas."],
    );
  if (/\b(esta tela|essa tela|tela aberta|por onde comecar|onde estou)\b/.test(q))
    return resultado(conhecimento.telas[atual.tela as keyof typeof conhecimento.telas], [
      "Base de conhecimento do Inova · telas.",
    ]);
  const form = atual.formulario
    ? conhecimento.formularios[atual.formulario as keyof typeof conhecimento.formularios]
    : undefined;
  const deictico =
    /\b(este campo|esse campo|este formulario|esse formulario|como preencher|como preencho)\b/.test(
      q,
    );
  const palavras = termos(pergunta);
  if (deictico && form && atual.campo && palavras.length === 0) {
    const texto = (form.campos as Record<string, string>)[atual.campo];
    return resultado(
      `${form.titulo} · ${atual.campo}\n${texto}\n\n${form.orientacao}`,
      form.fontes,
    );
  }
  if (deictico && !palavras.length)
    return form
      ? resultado(`${form.titulo}\n${form.orientacao}`, form.fontes)
      : resultado(
          "Use “Como preencher?” ao lado de um campo ou escreva o nome do formulário e do campo para eu buscar a orientação.",
        );
  const pontuadas = entradas
    .map((entry) => {
      const matches = palavras.filter((t) => entry.busca.includes(t)).length;
      const campoCitado = entry.campo && normalizar(pergunta).includes(normalizar(entry.campo));
      return {
        ...entry,
        score:
          matches >= Math.ceil(palavras.length * 0.6) && matches > 0
            ? matches * (entry.campo ? 10 : 5) +
              (entry.id === atual.formulario ? 2 : 0) +
              (campoCitado ? 3 : 0)
            : 0,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!pontuadas.length)
    return resultado(
      "Não encontrei uma orientação verificada para essa pergunta. Tente citar o campo ou formulário, como “probabilidade do risco”, ou use os atalhos abaixo. Regras não documentadas precisam ser confirmadas com a equipe.",
    );
  const best = pontuadas[0];
  const selected = pontuadas.filter((e) => e.score === best.score).slice(0, 3);
  return resultado(selected.map((e) => `${e.titulo}\n${e.texto}`).join("\n\n"), [
    ...new Set(selected.flatMap((e) => e.fontes)),
  ]);
}
