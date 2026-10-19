import type { Project } from "../data/mockData";
import type { ItemOrcamento, NotaOrcamento } from "../lib/orcamento";
import { totaisDoOrcamento, somaDasNotas, moeda } from "../lib/orcamento";
import { andamentoDoProjeto, estaAtrasada, faixaRisco, hojeISO } from "../lib/planoTrabalho";
import type { DadosAssistenteLocal, RespostaLocal } from "./localBot";
import type { BuscaApp } from "../lib/navegacaoApp";
import { resolverProjetoOrg } from "../lib/navegacaoOrg";

/** Mesma resolução de vínculo usada pela ficha da organização, sem escolher legados ambíguos. */
export function projetoDaNavegacao<T extends { id: number; organizacao?: { id: string } | null }>(
  projetos: readonly T[],
  busca: BuscaApp,
): T | undefined {
  if (busca.area !== "organizations") return;
  if (!busca.org) return projetos.find((p) => p.id === busca.projeto);
  if (busca.secao !== "projeto" && busca.secao !== "projetos") return;
  const resolvido = resolverProjetoOrg(
    projetos.filter((p) => p.organizacao?.id === busca.org),
    busca.projeto ?? null,
  );
  return resolvido.estado === "unico" ? resolvido.projeto : undefined;
}

export type ProjetoParaAjuda = Project & {
  organizacao?: { nome: string } | null;
  orcamentoItens?: ItemOrcamento[];
  orcamentoNotas?: NotaOrcamento[];
};
export type DetalheProjetoLocal = {
  nome: string;
  codigo: string;
  organizacao: string;
  objetivo: string;
  status: string;
  andamento: number | "Não calculado";
  inicio: string;
  fim: string;
  metas: {
    nome: string;
    etapas: {
      nome: string;
      atividades: {
        nome: string;
        status: string;
        progresso: number;
        inicio: string | null;
        fim: string | null;
        inicioReal: string | null;
        fimReal: string | null;
        atrasada: boolean;
        tarefas: number;
      }[];
    }[];
  }[];
  riscos: { titulo: string; status: string; faixa: string }[];
  orcamento?: { proposto: number; executado: number | null; notas: number | null };
};

/** Projeção explícita: nunca inclui nomes de pessoas, mensagens, contatos, links, anexos ou notas livres. */
export function detalharProjetoLocal(p: ProjetoParaAjuda, hoje = hojeISO()): DetalheProjetoLocal {
  const atividades = p.goals.flatMap((m) => m.deliverables.flatMap((e) => e.activities));
  return {
    nome: p.name,
    codigo: p.code,
    organizacao: p.organizacao?.nome ?? "",
    objetivo: p.objective,
    status: p.status,
    andamento: andamentoDoProjeto(atividades),
    inicio: p.startDate,
    fim: p.endDate,
    metas: p.goals.map((m) => ({
      nome: m.name,
      etapas: m.deliverables.map((e) => ({
        nome: e.name,
        atividades: e.activities.map((a) => ({
          nome: a.name,
          status: a.status,
          progresso: a.progress,
          inicio: a.plannedStart,
          fim: a.plannedEnd,
          inicioReal: a.actualStart,
          fimReal: a.actualEnd,
          atrasada: estaAtrasada(a, hoje),
          tarefas: a.tasks?.length ?? 0,
        })),
      })),
    })),
    riscos: p.risks.map((r) => ({
      titulo: r.title || r.description,
      status: r.status,
      faixa: faixaRisco(r.probability * r.impact),
    })),
    ...(p.orcamentoItens
      ? {
          orcamento: {
            proposto: totaisDoOrcamento(p.orcamentoItens).proposto,
            executado: p.orcamentoNotas ? somaDasNotas(p.orcamentoNotas) : null,
            notas: p.orcamentoNotas?.length ?? null,
          },
        }
      : {}),
  };
}

const normal = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const fonte = [
  "Dados carregados da plataforma no momento da pergunta.",
  "src/app/lib/planoTrabalho.ts: andamentoDoProjeto, estaAtrasada",
  "src/app/lib/orcamento.ts: totaisDoOrcamento, somaDasNotas",
];
const resposta = (texto: string): RespostaLocal => ({ texto, fontes: fonte });
const titulo = (p: DetalheProjetoLocal) => `${p.nome}${p.codigo ? ` (${p.codigo})` : ""}`;
const ats = (p: DetalheProjetoLocal) =>
  p.metas.flatMap((m) => m.etapas.flatMap((e) => e.atividades));
const data = (s: string | null) =>
  s ? (/^\d{4}-\d{2}-\d{2}$/.test(s) ? s.split("-").reverse().join("/") : s) : "Não informado";
const recorte = <T>(items: T[], format: (item: T, index: number) => string, limite = 12) =>
  [
    ...items.slice(0, limite).map(format),
    ...(items.length > limite
      ? [`Exibindo ${limite} de ${items.length}. Cite o nome de uma meta ou etapa para detalhar.`]
      : []),
  ].join("\n");

function resumo(p: DetalheProjetoLocal): string {
  const a = ats(p);
  const concluidas = a.filter((x) => x.status === "Concluído").length;
  const etapas = p.metas.flatMap((m) => m.etapas);
  const linhas = [
    titulo(p),
    p.organizacao ? `Organização: ${p.organizacao}.` : "",
    p.objetivo ? `Objetivo previsto: ${p.objetivo.slice(0, 650)}` : "Objetivo: Não informado.",
    `Situação: ${p.status}. Andamento: ${typeof p.andamento === "number" ? `${p.andamento}%` : p.andamento}.`,
    `Período cadastrado na proposta: ${data(p.inicio)} a ${data(p.fim)}.`,
    `Estrutura: ${p.metas.length} meta(s), ${etapas.length} etapa(s), ${a.length} atividade(s) e ${a.reduce((n, x) => n + x.tarefas, 0)} tarefa(s).`,
    `Execução: ${concluidas} atividade(s) concluída(s), ${a.length - concluidas} não concluída(s), ${a.filter((x) => x.atrasada).length} atrasada(s).`,
    `Riscos: ${p.riscos.length}, sendo ${p.riscos.filter((r) => r.status !== "Encerrado").length} em aberto.`,
  ];
  if (p.orcamento)
    linhas.push(
      `Proposta vigente: ${moeda(p.orcamento.proposto)}. Executado pelas notas carregadas: ${moeda(p.orcamento.executado)}.`,
    );
  if (p.metas.length)
    linhas.push(
      `Metas do projeto:\n${recorte(p.metas, (m, i) => `${i + 1}. ${m.nome} — ${m.etapas.length} etapa(s), ${m.etapas.reduce((n, e) => n + e.atividades.length, 0)} atividade(s).`)}`,
    );
  linhas.push(
    "A proposta descreve o que se pretende alcançar. Conclusão e execução acima vêm dos registros carregados, sem avaliar a qualidade dos resultados.",
  );
  return linhas.filter(Boolean).join("\n\n");
}

export function responderProjetos(
  pergunta: string,
  dados: DadosAssistenteLocal,
): RespostaLocal | undefined {
  const q = normal(pergunta);
  if (/\b(regra|regras|como|preencher|preencho|o que e|calcula|obrigatorio)\b/.test(q)) return;
  const consulta =
    /\b(resumo|resuma|situacao|dados|status|andamento|quantos|quantas|listar|liste|mostre|detalhe|detalhar|derivados|pendencias|atrasadas|atrasados|orcamento|progresso|metas|etapas|atividades|tarefas|riscos)\b/.test(
      q,
    );
  if (!consulta) return;
  if (!dados.projetos?.length && !dados.projetoDetalhado) return;
  if (dados.carregando)
    return resposta(
      "Os dados ainda estão carregando. Aguarde para eu consultar a versão recebida pela plataforma.",
    );
  const disponiveis = dados.projetos ?? (dados.projetoDetalhado ? [dados.projetoDetalhado] : []);
  const citados = disponiveis.filter((p) =>
    [p.nome, p.codigo, p.organizacao].some((s) => normal(s).length >= 3 && q.includes(normal(s))),
  );
  if (citados.length > 1)
    return resposta(
      `Encontrei mais de um projeto para essa referência. Especifique o nome ou código:\n${recorte(citados, (p) => `• ${titulo(p)}`)}`,
    );
  const p = citados[0] ?? dados.projetoDetalhado;
  if (!citados.length && /\b(projetos|portfolio|carteira)\b/.test(q))
    return resposta(
      `Projetos carregados: ${disponiveis.length}.\n\n${recorte(disponiveis, (p) => `• ${titulo(p)} — ${p.status}; ${p.metas.length} meta(s), ${ats(p).length} atividade(s), ${ats(p).filter((a) => a.status === "Concluído").length} concluída(s), ${ats(p).filter((a) => a.atrasada).length} atrasada(s).`)}\n\nCite um nome/código ou abra o projeto para o resumo detalhado. A lista considera os dados carregados, não os filtros visuais.`,
    );
  const referencia = q.match(/\bprojeto\s+(.+)$/)?.[1]?.trim();
  if (
    !citados.length &&
    referencia &&
    !/^(aberto|atual|selecionado|carregado|em tela|aqui)(\s|$)/.test(referencia)
  )
    return resposta(
      "Não encontrei esse nome/código entre os projetos carregados. Confira a referência ou pergunte “Liste os projetos”.",
    );
  if (!p)
    return resposta(
      "Abra um projeto ou cite seu nome/código. Para ver as opções, pergunte “Liste os projetos”.",
    );
  const atividades = ats(p);
  const metasCitadas = p.metas.filter(
    (m) => normal(m.nome).length >= 4 && q.includes(normal(m.nome)),
  );
  const etapasCitadas = p.metas
    .flatMap((m) => m.etapas)
    .filter((e) => normal(e.nome).length >= 4 && q.includes(normal(e.nome)));
  const atividadesCitadas = atividades.filter(
    (a) => normal(a.nome).length >= 4 && q.includes(normal(a.nome)),
  );
  if (
    !metasCitadas.length &&
    !etapasCitadas.length &&
    !atividadesCitadas.length &&
    /\b(meta|etapa|atividade)\s+\S+/.test(q) &&
    !/\b(meta|etapa|atividade)\s+(do|da|no|na|abert[ao]|atual|selecionad[ao])\b/.test(q)
  )
    return resposta(
      "Não encontrei essa meta, etapa ou atividade no projeto consultado. Confira o nome ou liste os registros do projeto antes de detalhar.",
    );
  if (atividadesCitadas.length === 1) {
    const a = atividadesCitadas[0];
    return resposta(
      `${titulo(p)}\nAtividade: ${a.nome}\nSituação: ${a.status}${a.atrasada ? " — atrasada" : ""}. Progresso: ${a.progresso}%.\nPrevisto: ${data(a.inicio)} a ${data(a.fim)}.\nRealizado: ${data(a.inicioReal)} a ${data(a.fimReal)}.\nTarefas vinculadas: ${a.tarefas}.`,
    );
  }
  if (/\b(orcamento|financeiro|executado|proposto|notas)\b/.test(q))
    return resposta(
      p.orcamento
        ? `${titulo(p)}\nProposta vigente (itens ativos): ${moeda(p.orcamento.proposto)}.\nExecutado pelas notas carregadas: ${moeda(p.orcamento.executado)}.\nNotas: ${p.orcamento.notas ?? "Não informado"}.\nAusência de notas não comprova execução zero. Consulte o Orçamento para os itens e documentos.`
        : `${titulo(p)}\nNão tenho o orçamento estruturado carregado para esse projeto. Abra a aba Orçamento e confira os dados; não vou inferir valores pelo progresso das atividades.`,
    );
  if (/\b(risco|riscos)\b/.test(q)) {
    const riscos = /\b(aberto|abertos|pendente|pendentes)\b/.test(q)
      ? p.riscos.filter((r) => r.status !== "Encerrado")
      : p.riscos;
    return resposta(
      `${titulo(p)}\nRiscos encontrados: ${riscos.length}.\n${recorte(riscos, (r) => `• ${r.titulo} — ${r.status}; faixa ${r.faixa}.`) || "Não há riscos nesse recorte."}\nA faixa não substitui a análise de probabilidade, impacto e estratégia de resposta.`,
    );
  }
  if (metasCitadas.length > 1 || etapasCitadas.length > 1 || atividadesCitadas.length > 1)
    return resposta(
      "Há registros com nomes repetidos ou mais de uma correspondência. Especifique a meta/etapa e abra o detalhe correspondente para evitar misturar registros.",
    );
  const grupo = metasCitadas.length === 1 ? metasCitadas[0] : undefined;
  const etapas =
    etapasCitadas.length === 1
      ? etapasCitadas
      : (grupo?.etapas ?? p.metas.flatMap((m) => m.etapas));
  const grupoAtividades = etapas.flatMap((e) => e.atividades);
  if (
    /\b(atividade|atividades|atrasada|atrasadas|pendencia|pendencias)\b/.test(q) ||
    etapasCitadas.length === 1
  ) {
    const filtradas = /\batrasad/.test(q)
      ? grupoAtividades.filter((a) => a.atrasada)
      : /\bpenden/.test(q)
        ? grupoAtividades.filter((a) => a.status !== "Concluído")
        : grupoAtividades;
    return resposta(
      `${titulo(p)}${grupo ? `\nMeta: ${grupo.nome}` : ""}${etapasCitadas.length === 1 ? `\nEtapa: ${etapasCitadas[0].nome}` : ""}\nAtividades no recorte: ${filtradas.length}.\n${recorte(filtradas, (a) => `• ${a.nome} — ${a.status}${a.atrasada ? " (atrasada)" : ""}; ${a.progresso}%; fim previsto ${data(a.fim)}; ${a.tarefas} tarefa(s).`) || "Nenhuma atividade nesse recorte."}`,
    );
  }
  if (grupo || /\b(etapa|etapas|derivados|desdobramentos)\b/.test(q))
    return resposta(
      `${titulo(p)}${grupo ? `\nMeta: ${grupo.nome}` : ""}\nEtapas: ${etapas.length}.\n${recorte(etapas, (e) => `• ${e.nome} — ${e.atividades.length} atividade(s), ${e.atividades.filter((a) => a.status === "Concluído").length} concluída(s).`) || "Nenhuma etapa cadastrada."}\nCite o nome de uma etapa para listar suas atividades.`,
    );
  return resposta(resumo(p));
}
