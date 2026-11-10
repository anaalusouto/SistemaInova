import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useStore } from "../../store";
import { usePeople } from "../../auth/authStore";
import { encaminhamentosDoPlano, atividadesDaOrganizacao } from "../../lib/planoRelatorio";
import { codigosHierarquicos } from "../../lib/planoTrabalho";
import { formatDateOnly } from "../../lib/dateOnly";
import type { Encaminhamento, OrganizacaoFicha } from "../../lib/organizacoes";
import { PainelAtividade } from "../plano/PainelAtividade";
import { PainelRisco } from "../plano/PainelRisco";
import "../responsive-tables.css";

type Origem = "Plano de trabalho" | "Riscos" | "Outros";
export function TabelaEncaminhamentos({
  org,
  foco,
  linhas,
  mostrarConcluidos,
  readOnly,
  pessoas,
  textoOrigem,
  aoConsultar,
  aoContato,
  aoEditar,
  aoExcluir,
}: {
  org: OrganizacaoFicha;
  foco: string | null;
  linhas: Encaminhamento[];
  mostrarConcluidos: boolean;
  readOnly: boolean;
  pessoas: ReturnType<typeof usePeople>;
  textoOrigem: (e: Encaminhamento) => { texto: string; contato: boolean } | null;
  aoConsultar: (id: string) => void;
  aoContato: (id: string) => void;
  aoEditar: (e: Encaminhamento) => void;
  aoExcluir: (e: Encaminhamento) => void;
}) {
  const { projects, projectsLoading } = useStore();
  const [filtro, setFiltro] = useState<Origem | "Todas">("Todas");
  const [colunas, setColunas] = useState<"origem" | "acompanhamento">("origem");
  const [atividadeId, setAtividadeId] = useState<string | null>(null);
  const [riscoId, setRiscoId] = useState<string | null>(null);
  const plano = encaminhamentosDoPlano(projects, org.id).filter(
    (l) => mostrarConcluidos || l.atividade.status !== "Concluído",
  );
  const alvo = atividadeId
    ? atividadesDaOrganizacao(projects, org.id).find((l) => l.atividade.id === atividadeId)
    : undefined;
  const projetoRisco = riscoId
    ? projects.find((p) => p.organizacao?.id === org.id && p.risks.some((r) => r.id === riscoId))
    : undefined;
  const risco = projetoRisco?.risks.find((r) => r.id === riscoId);
  const metaRisco = projetoRisco?.goals.find((m) =>
    m.deliverables.some((e) => e.id === risco?.stageId),
  );
  const etapaRisco = metaRisco?.deliverables.find((e) => e.id === risco?.stageId);
  const registros = [
    ...plano.map((l) => ({
      id: `plano:${l.atividade.id}`,
      origem: "Plano de trabalho" as Origem,
      vinculo: `${l.projeto.code} / ${l.meta.name} / ${l.etapa.name} / ${l.atividade.name}`,
      acao: l.atividade.nextStep,
      responsavel: l.atividade.nextStepOwner || "Não informado",
      prazo: l.atividade.nextStepDue,
      status: l.atividade.status,
      abrir: () => setAtividadeId(l.atividade.id),
      enc: undefined as Encaminhamento | undefined,
    })),
    ...linhas.map((e) => ({
      id: `enc:${e.id}`,
      origem: (e.classificacaoOrigem ?? (e.origem?.tipo === "risco" ? "Riscos" : "Outros")) as Origem,
      vinculo: textoOrigem(e)?.texto || "Sem vínculo",
      acao: e.descricao,
      responsavel:
        pessoas.find((p) => p.id && p.id === e.responsavelUsuarioId)?.name ??
        e.responsavel ??
        "Não informado",
      prazo: e.dataFim,
      status: e.status,
      abrir: () => aoConsultar(e.id),
      enc: e,
    })),
  ]
    .filter((r) => filtro === "Todas" || r.origem === filtro)
    .sort(
      (a, b) =>
        a.origem.localeCompare(b.origem, "pt-BR") ||
        a.vinculo.localeCompare(b.vinculo, "pt-BR") ||
        a.acao.localeCompare(b.acao, "pt-BR"),
    );
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pb-3 text-xs">
        <label>Origem <select aria-label="Filtrar origem" className="rounded border bg-card p-1.5" value={filtro} onChange={e => setFiltro(e.target.value as typeof filtro)}><option>Todas</option><option>Plano de trabalho</option><option>Riscos</option><option>Outros</option></select></label>
        <label>Colunas <select className="rounded border bg-card p-1.5" value={colunas} onChange={e => setColunas(e.target.value as typeof colunas)}><option value="origem">Origem</option><option value="acompanhamento">Acompanhamento</option></select></label>
      </div>
      <div className="rounded-xl border bg-card">
        <table data-grupo={colunas} className="encaminhamentos-grade w-full table-fixed text-left text-sm" aria-label="Encaminhamentos">
          <thead>
            <tr className="border-b bg-muted/30">
              {(colunas === "origem" ? ["Origem", "Vínculo", "Ação", "Status", "Ações"] : ["Origem", "Ação", "Responsável", "Prazo", "Status", "Ações"]).map((c) => (
                <th className="p-3" key={c}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => {
              return (
                <tr
                  key={r.id}
                  className="border-b align-top"
                  style={{
                    background:
                      foco &&
                      (r.id === `plano:${foco}` ||
                        (r.enc?.origem?.tipo === "contato" && r.enc.origem.registroId === foco))
                        ? "var(--brand-soft)"
                        : undefined,
                  }}
                >
                    <th scope="row" className="p-3 font-medium">
                      {r.origem}
                    </th>
                  {colunas === "origem" && (
                    <td className="p-3">
                      {r.enc?.origem?.tipo === "contato" ? (
                        <button
                          className="text-left text-primary underline"
                          onClick={() =>
                            aoContato((r.enc!.origem as { registroId: string }).registroId)
                          }
                        >
                          {r.vinculo}
                        </button>
                      ) : (
                        r.vinculo
                      )}
                    </td>
                  )}
                  <td className="p-3">
                    <button className="text-left hover:underline" onClick={r.abrir}>
                      {r.acao}
                    </button>
                  </td>
                  {colunas === "acompanhamento" && <td className="p-3">{r.responsavel}</td>}
                  {colunas === "acompanhamento" && <td className="p-3">
                    {r.prazo ? formatDateOnly(r.prazo) : "Não informado"}
                  </td>}
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">
                    {r.enc && !readOnly && (
                      <span className="flex gap-2">
                        <button onClick={() => aoEditar(r.enc!)} aria-label="Editar encaminhamento">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => aoExcluir(r.enc!)}
                          aria-label="Excluir encaminhamento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!registros.length && (
              <tr>
                <td colSpan={colunas === "origem" ? 5 : 6} className="p-8 text-center text-muted-foreground">
                  {projectsLoading
                    ? "Carregando encaminhamentos…"
                    : "Nenhum encaminhamento neste filtro."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {alvo && (
        <PainelAtividade
          key={alvo.atividade.id}
          atividade={alvo.atividade}
          etapa={alvo.etapa}
          meta={alvo.meta}
          projetoId={alvo.projeto.id}
          codigo={codigosHierarquicos(alvo.projeto.goals).get(alvo.atividade.id) ?? ""}
          riscoOrigem={alvo.projeto.risks.find((r) => r.id === alvo.atividade.riskOriginId)}
          aoFechar={() => setAtividadeId(null)}
          aoAbrirRisco={(r) => {
            setAtividadeId(null);
            setRiscoId(r.id);
          }}
        />
      )}
      {risco && projetoRisco && (
        <PainelRisco
          risco={risco}
          organizacaoId={org.id}
          etapa={etapaRisco}
          meta={metaRisco}
          projetoId={projetoRisco.id}
          metas={projetoRisco.goals}
          codigos={codigosHierarquicos(projetoRisco.goals)}
          acoesDeResposta={projetoRisco.goals
            .flatMap((m) => m.deliverables.flatMap((e) => e.activities))
            .filter((a) => a.riskOriginId === risco.id)}
          aoFechar={() => setRiscoId(null)}
          aoAbrirAtividade={(a) => {
            setRiscoId(null);
            setAtividadeId(a.id);
          }}
        />
      )}
    </>
  );
}
