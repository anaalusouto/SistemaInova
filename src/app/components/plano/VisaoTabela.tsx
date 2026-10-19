import { useMemo, useState, type ReactNode } from "react";
import "../responsive-tables.css";
import { ChevronDown, ChevronRight, Paperclip, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type {
  Goal,
  Activity,
  Risk,
  Deliverable,
  Task,
  ActivityStatus,
  BudgetLink,
} from "../../data/mockData";
import { useAuth } from "../../auth/authStore";
import { useStore } from "../../store";
import { indiceConclusao } from "../../lib/conclusaoPlano";
import { formatDateOnly } from "../../lib/dateOnly";
import { dadosDaAtividade, errosDaEdicao } from "../../lib/edicaoLinhaPlano";
import { COLUNAS_PLANO, type ColunaPlano } from "../../lib/formatoPlano";
import {
  estaAtrasada,
  hojeISO,
  prazoDaMeta,
  riscoDaEtapa,
  progressoParaStatus,
  validarMeta,
  validarPeriodoDaEtapa,
} from "../../lib/planoTrabalho";

export interface VisaoTabelaProps {
  metas: Goal[];
  metasCompletas?: Goal[];
  administrativo?: boolean;
  riscos: Risk[];
  recolhidos: Set<string>;
  alternarRecolhido: (id: string) => void;
  codigos: Map<string, string>;
  aoAbrirMeta: (meta: Goal) => void;
  aoAbrirEtapa: (etapa: Deliverable, meta: Goal) => void;
  aoAbrirAtividade: (atividade: Activity, etapa: Deliverable, meta: Goal) => void;
  aoAbrirRisco: (risco: Risk) => void;
  aoAbrirAnexo: (atividade: Activity) => void;
  editar?: boolean;
  somenteEdicaoGlobal?: boolean;
  colunas?: readonly ColunaPlano[];
  aoPendencia?: (id: string, pendente: boolean) => void;
}
interface DadosLinha {
  nome: string;
  observacoes: string;
  responsavel: string;
  inicioPrevisto: string | null;
  fimPrevisto: string | null;
  inicioRealizado: string | null;
  fimRealizado: string | null;
  status: ActivityStatus;
  progresso: number;
  justificativaAtraso: string;
  vinculoOrcamentario: BudgetLink;
}
type Linha = {
  tipo: "meta" | "etapa" | "atividade" | "tarefa";
  id: string;
  dados: DadosLinha;
  meta: Goal;
  etapa?: Deliverable;
  atividade?: Activity;
  tarefa?: Task;
};
const vazio = (nome: string): DadosLinha => ({
  nome,
  observacoes: "",
  responsavel: "",
  inicioPrevisto: null,
  fimPrevisto: null,
  inicioRealizado: null,
  fimRealizado: null,
  status: "A iniciar",
  progresso: 0,
  justificativaAtraso: "",
  vinculoOrcamentario: "Não informado",
});
const ausente = <span className="text-muted-foreground">—</span>;
const data = (v: string | null) =>
  v ? <span className="whitespace-nowrap text-xs font-mono">{formatDateOnly(v)}</span> : ausente;

/** Uma única grade para todas as organizações: cada valor ocupa sua coluna. */
export function VisaoTabela({
  metas,
  metasCompletas,
  administrativo = false,
  riscos,
  recolhidos,
  alternarRecolhido,
  codigos,
  aoAbrirMeta,
  aoAbrirEtapa,
  aoAbrirAtividade,
  aoAbrirRisco,
  aoAbrirAnexo,
  editar = false,
  somenteEdicaoGlobal = false,
  colunas = COLUNAS_PLANO,
  aoPendencia,
}: VisaoTabelaProps) {
  const { readOnly } = useAuth();
  const store = useStore();
  const conclusoes = useMemo(
    () => indiceConclusao(metasCompletas ?? metas),
    [metasCompletas, metas],
  );
  const [rascunhos, setRascunhos] = useState<Record<string, DadosLinha>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [edicaoLocal, setEdicaoLocal] = useState<string | null>(null);
  const chave = (l: Linha) => `${l.tipo}:${l.id}`;
  const alterar = (l: Linha, campo: keyof DadosLinha, valor: string | number | null) => {
    const id = chave(l);
    setRascunhos((atual) => ({ ...atual, [id]: { ...(atual[id] ?? l.dados), [campo]: valor } }));
    setErros((atual) => ({ ...atual, [id]: "" }));
    aoPendencia?.(id, true);
  };
  const limpar = (l: Linha) => {
    const id = chave(l);
    setRascunhos((atual) => {
      const proximo = { ...atual };
      delete proximo[id];
      return proximo;
    });
    setErros((atual) => ({ ...atual, [id]: "" }));
    setEdicaoLocal(null);
    aoPendencia?.(id, false);
  };
  const salvar = async (l: Linha) => {
    if (readOnly || salvando) return;
    const id = chave(l),
      d = rascunhos[id] ?? l.dados;
    let problemas = !d.nome.trim() ? ["Informe o título."] : [];
    const input =
      l.atividade && l.etapa
        ? {
            ...dadosDaAtividade(l.atividade, l.etapa.id),
            ...d,
            progresso: progressoParaStatus(d.status, d.progresso),
          }
        : null;
    if (l.tipo === "atividade" && input && l.etapa)
      problemas = [...problemas, ...errosDaEdicao(input, l.etapa)];
    if (l.tipo === "meta")
      problemas = [
        ...problemas,
        ...validarMeta({
          nome: d.nome,
          responsavel: d.responsavel,
          inicioPrevisto: d.inicioPrevisto,
          fimPrevisto: d.fimPrevisto,
        }).erros,
      ];
    if (l.tipo === "etapa" && l.etapa) {
      problemas = [
        ...problemas,
        ...validarPeriodoDaEtapa(
          { inicio: d.inicioPrevisto, fim: d.fimPrevisto },
          l.etapa.activities,
        ).erros,
      ];
      if (d.inicioRealizado && d.fimRealizado && d.inicioRealizado > d.fimRealizado)
        problemas.push("O início realizado não pode ser posterior ao fim realizado.");
    }
    if (problemas.length) {
      setErros((atual) => ({ ...atual, [id]: problemas.join(" ") }));
      return;
    }
    setSalvando(id);
    try {
      if (l.tipo === "atividade" && input) await store.updateAtividade(l.id, input);
      else if (l.tipo === "meta")
        await store.saveMeta({
          metaId: l.id,
          nome: d.nome,
          responsavel: d.responsavel,
          inicioPrevisto: d.inicioPrevisto,
          fimPrevisto: d.fimPrevisto,
        });
      else if (l.tipo === "etapa")
        await store.savePeriodoEtapa({
          etapaId: l.id,
          nome: d.nome,
          resultadoEsperado: d.observacoes,
          inicioPrevisto: d.inicioPrevisto,
          fimPrevisto: d.fimPrevisto,
          inicioRealizado: d.inicioRealizado,
          fimRealizado: d.fimRealizado,
        });
      else if (l.tipo === "tarefa") await store.renameTarefa(l.id, d.nome);
      limpar(l);
      toast.success("Linha salva.");
    } catch (e) {
      setErros((atual) => ({
        ...atual,
        [id]: e instanceof Error ? e.message : "Não foi possível salvar a linha.",
      }));
    } finally {
      setSalvando(null);
    }
  };
  const linhas: Linha[] = [];
  for (const meta of metas) {
    linhas.push({
      tipo: "meta",
      id: meta.id,
      meta,
      dados: {
        ...vazio(meta.name),
        responsavel: meta.responsible ?? "",
        inicioPrevisto: meta.plannedStart ?? null,
        fimPrevisto: meta.plannedEnd ?? null,
      },
    });
    if (recolhidos.has(meta.id)) continue;
    for (const etapa of meta.deliverables) {
      linhas.push({
        tipo: "etapa",
        id: etapa.id,
        meta,
        etapa,
        dados: {
          ...vazio(etapa.name),
          observacoes: etapa.expectedResult ?? "",
          inicioPrevisto: etapa.plannedStart,
          fimPrevisto: etapa.plannedEnd,
          inicioRealizado: etapa.actualStart,
          fimRealizado: etapa.actualEnd,
        },
      });
      if (recolhidos.has(etapa.id)) continue;
      for (const atividade of etapa.activities) {
        linhas.push({
          tipo: "atividade",
          id: atividade.id,
          meta,
          etapa,
          atividade,
          dados: { ...dadosDaAtividade(atividade, etapa.id), nome: atividade.name },
        });
        if (!recolhidos.has(atividade.id))
          for (const tarefa of atividade.tasks ?? [])
            linhas.push({
              tipo: "tarefa",
              id: tarefa.id,
              meta,
              etapa,
              atividade,
              tarefa,
              dados: vazio(tarefa.title),
            });
      }
    }
  }
  const renderLinha = (l: Linha) => {
    const id = chave(l),
      d = rascunhos[id] ?? l.dados,
      emEdicao = !readOnly && (editar || edicaoLocal === id);
    const atividade = l.tipo === "atividade",
      estrutura = l.tipo === "meta" || l.tipo === "etapa";
    const concluido = atividade
      ? l.atividade?.status === "Concluído"
      : estrutura && conclusoes.get(id)?.concluido;
    const celula = (c: ColunaPlano): ReactNode => {
      const campo = (nome: keyof DadosLinha, tipo: "text" | "number" = "text") => (
        <input
          aria-label={`${c === "Atividade" ? "Título" : c}: ${l.dados.nome}`}
          type={tipo}
          min={tipo === "number" ? 0 : undefined}
          max={tipo === "number" ? 100 : undefined}
          step={tipo === "number" ? 1 : undefined}
          value={d[nome] ?? ""}
          disabled={salvando !== null}
          onChange={(e) =>
            alterar(l, nome, tipo === "number" ? Number(e.target.value) : e.target.value)
          }
          className="w-full min-w-0 rounded border bg-card p-1.5 text-xs"
        />
      );
      const texto = (nome: keyof DadosLinha) =>
        emEdicao ? (
          <textarea
            aria-label={`${c === "Observações / resultado esperado" ? "Observações" : c}: ${l.dados.nome}`}
            value={String(d[nome] ?? "")}
            disabled={salvando !== null}
            onChange={(e) => alterar(l, nome, e.target.value)}
            rows={2}
            className="w-full min-w-0 rounded border bg-card p-1.5 text-xs"
          />
        ) : (
          String(d[nome] ?? "") || ausente
        );
      switch (c) {
        case "Atividade":
          return (
            <div
              style={{
                paddingLeft: l.tipo === "meta" ? 0 : l.tipo === "etapa" ? 12 : atividade ? 24 : 36,
              }}
              className="min-w-0"
            >
              <div className="flex items-start gap-1">
                {(estrutura || (atividade && (l.atividade?.tasks.length ?? 0) > 0)) && (
                  <button
                    type="button"
                    disabled={editar}
                    onClick={() => alternarRecolhido(l.id)}
                    aria-expanded={!recolhidos.has(l.id)}
                    aria-label={
                      l.tipo === "meta"
                        ? `${recolhidos.has(l.id) ? "Expandir" : "Recolher"} meta: ${l.dados.nome}`
                        : l.tipo === "etapa"
                          ? `${recolhidos.has(l.id) ? "Expandir" : "Recolher"} etapa`
                          : `${recolhidos.has(l.id) ? "Expandir" : "Recolher"} tarefas`
                    }
                    className="shrink-0 p-1"
                  >
                    {recolhidos.has(l.id) ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}
                <span className="shrink-0 text-xs text-muted-foreground pt-1">
                  {codigos.get(l.id)}
                </span>
                {emEdicao ? (
                  campo("nome")
                ) : (
                  <button
                    type="button"
                    aria-label={l.tipo === "meta" ? `Abrir meta: ${l.dados.nome}` : undefined}
                    onClick={() =>
                      l.tipo === "meta"
                        ? aoAbrirMeta(l.meta)
                        : l.tipo === "etapa"
                          ? aoAbrirEtapa(l.etapa!, l.meta)
                          : aoAbrirAtividade(l.atividade!, l.etapa!, l.meta)
                    }
                    className={`text-left hover:underline ${concluido ? "line-through" : ""} ${estrutura ? "font-semibold" : ""}`}
                  >
                    {d.nome}
                  </button>
                )}
              </div>
              {!readOnly &&
                !administrativo &&
                !somenteEdicaoGlobal &&
                !editar &&
                atividade &&
                edicaoLocal !== id && (
                  <button
                    type="button"
                    aria-label={`Editar datas e status: ${l.dados.nome}`}
                    onClick={() => setEdicaoLocal(id)}
                    className="underline text-xs"
                  >
                    Editar datas e status
                  </button>
                )}
              {emEdicao && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    disabled={salvando !== null || (!rascunhos[id] && editar)}
                    className="underline text-xs disabled:opacity-40"
                    onClick={() => void salvar(l)}
                  >
                    {salvando === id ? "Salvando…" : "Salvar linha"}
                  </button>
                  <button
                    type="button"
                    disabled={salvando !== null}
                    className="underline text-xs"
                    onClick={() => limpar(l)}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              {erros[id] && (
                <p role="alert" className="text-xs text-destructive mt-2">
                  {erros[id]}
                </p>
              )}
            </div>
          );
        case "Observações / resultado esperado":
          return atividade || l.tipo === "etapa" ? texto("observacoes") : ausente;
        case "Responsável":
          return atividade || l.tipo === "meta"
            ? emEdicao
              ? campo("responsavel")
              : d.responsavel || ausente
            : ausente;
        case "Início previsto":
        case "Fim previsto":
        case "Início":
        case "Fim": {
          if (l.tipo === "tarefa" || (l.tipo === "meta" && (c === "Início" || c === "Fim")))
            return ausente;
          const nome =
            c === "Início previsto"
              ? "inicioPrevisto"
              : c === "Fim previsto"
                ? "fimPrevisto"
                : c === "Início"
                  ? "inicioRealizado"
                  : "fimRealizado";
          const rotulo = c === "Início" ? "Início realizado" : c === "Fim" ? "Fim realizado" : c;
          if (emEdicao)
            return (
              <input
                type="date"
                aria-label={`${rotulo}: ${l.dados.nome}`}
                value={d[nome] ?? ""}
                disabled={salvando !== null}
                onChange={(e) => alterar(l, nome, e.target.value || null)}
                className="w-full min-w-0 rounded border bg-card p-1.5 text-xs"
              />
            );
          const prazo = l.tipo === "meta" ? prazoDaMeta(l.meta) : null;
          return data(prazo ? (c === "Início previsto" ? prazo.inicio : prazo.fim) : d[nome]);
        }
        case "Status":
          return atividade ? (
            emEdicao ? (
              <select
                aria-label={`Status: ${l.dados.nome}`}
                value={d.status}
                disabled={salvando !== null}
                onChange={(e) => {
                  alterar(l, "status", e.target.value);
                  alterar(
                    l,
                    "progresso",
                    progressoParaStatus(e.target.value as ActivityStatus, d.progresso),
                  );
                }}
                className="w-full rounded border bg-card p-1 text-xs"
              >
                {["A iniciar", "Em andamento", "Concluído"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            ) : (
              <span>{estaAtrasada(l.atividade!, hojeISO()) ? "Atrasada" : d.status}</span>
            )
          ) : estrutura ? (
            <span>
              {conclusoes.get(id)?.concluidas ?? 0}/{conclusoes.get(id)?.total ?? 0} concluídas
            </span>
          ) : (
            ausente
          );
        case "Progresso (%)":
          return atividade
            ? emEdicao
              ? campo("progresso", "number")
              : `${d.progresso}%`
            : ausente;
        case "Justificativa de atraso":
          return atividade ? texto("justificativaAtraso") : ausente;
        case "Vínculo orçamentário":
          return atividade ? (
            emEdicao ? (
              <select
                aria-label={`Vínculo orçamentário: ${l.dados.nome}`}
                value={d.vinculoOrcamentario}
                disabled={salvando !== null}
                onChange={(e) => alterar(l, "vinculoOrcamentario", e.target.value)}
                className="w-full border rounded bg-card p-1 text-xs"
              >
                {["Sim", "Não", "Não informado"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            ) : (
              d.vinculoOrcamentario
            )
          ) : (
            ausente
          );
        case "Nível risco": {
          if (l.tipo !== "etapa") return ausente;
          const resumo = riscoDaEtapa(riscos, l.id),
            risco = riscos
              .filter((r) => r.stageId === l.id && r.status !== "Encerrado")
              .sort((a, b) => b.severity - a.severity)[0];
          return risco && resumo ? (
            <button
              type="button"
              aria-label={`Abrir risco da etapa: ${l.dados.nome}`}
              onClick={() => aoAbrirRisco(risco)}
              className="inline-flex items-center gap-1 underline text-xs"
              style={{
                color:
                  resumo.faixa === "Crítico"
                    ? "var(--danger)"
                    : resumo.faixa === "Alto"
                      ? "var(--alert)"
                      : "var(--ink-3)",
              }}
            >
              <ShieldAlert size={12} />
              {resumo.faixa} · {resumo.quantidade} em aberto
            </button>
          ) : (
            ausente
          );
        }
        case "Anexo":
          return atividade ? (
            <button
              type="button"
              onClick={() => aoAbrirAnexo(l.atividade!)}
              aria-label={`Anexos: ${l.dados.nome}`}
              className="inline-flex gap-1 items-center underline text-xs"
            >
              <Paperclip size={12} />
              {l.atividade?.attachment?.fileName ?? (readOnly ? "Sem anexo" : "Anexar")}
            </button>
          ) : (
            ausente
          );
      }
    };
    return (
      <tr
        key={id}
        data-tipo={l.tipo}
        data-registro={l.id}
        className="border-b align-top"
        style={{
          background:
            l.tipo === "meta"
              ? "var(--surface-2)"
              : l.tipo === "etapa"
                ? "var(--surface-1)"
                : undefined,
        }}
        onKeyDown={(e) => {
          if (!emEdicao) return;
          if (e.key === "Escape" && !salvando) {
            e.preventDefault();
            limpar(l);
          }
          if (e.key === "Enter" && (e.ctrlKey || (e.target as HTMLElement).tagName === "INPUT")) {
            e.preventDefault();
            void salvar(l);
          }
        }}
      >
        {colunas.map((c) => (
          <td
            key={c}
            data-label={c}
            className="p-2 text-xs whitespace-pre-wrap break-words"
            style={{ minWidth: c === "Atividade" ? 280 : 120 }}
          >
            {celula(c)}
          </td>
        ))}
      </tr>
    );
  };
  if (!metas.length)
    return (
      <p className="p-6 text-sm text-muted-foreground">Nenhum registro encontrado neste filtro.</p>
    );
  return (
    <div className="inova-table-frame overflow-x-auto">
      <table
        className="inova-table-cards w-full"
        aria-label="Plano de trabalho"
        style={{ minWidth: 1800, tableLayout: "fixed" }}
      >
        <thead>
          <tr>
            {colunas.map((c) => (
              <th
                key={c}
                scope="col"
                className="p-2 text-left text-[10px] uppercase text-muted-foreground border-b"
                style={{ width: c === "Atividade" ? 320 : 140 }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{linhas.map(renderLinha)}</tbody>
      </table>
    </div>
  );
}
