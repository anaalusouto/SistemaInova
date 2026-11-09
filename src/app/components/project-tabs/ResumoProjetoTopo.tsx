import { FileText, ShieldAlert } from "lucide-react";
import type { Project } from "../../data/mockData";
import { andamentoDoProjeto, riscoEmAberto, NAO_CALCULADO } from "../../lib/planoTrabalho";

export function ResumoProjetoTopo({
  project,
  aoRiscos,
  aoDescricao,
  aoPlano,
  aoOrcamento,
  aoParecer,
  bloqueado = false,
}: {
  project: Project;
  aoRiscos: () => void;
  aoDescricao: () => void;
  aoPlano: () => void;
  aoOrcamento: () => void;
  aoParecer: () => void;
  bloqueado?: boolean;
}) {
  const moeda = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const andamento = andamentoDoProjeto(
    project.goals.flatMap((m) => m.deliverables.flatMap((e) => e.activities)),
  );
  const abertos = project.risks.filter(riscoEmAberto).length;
  return (
    <div className="project-summary-grid px-4 sm:px-6 py-4 items-center gap-4">
      <button type="button" onClick={aoDescricao} aria-label="Projeto: abrir descrição" className="project-summary-link min-w-0 text-left">
        <span className="project-summary-label">Projeto</span>
        <span className="block text-sm break-words leading-snug">
          {project.code} · {project.name}
        </span>
      </button>
      <button type="button" onClick={aoPlano} aria-label="Andamento: abrir plano de trabalho" className="project-summary-link text-left">
        <span className="project-summary-label">ANDAMENTO</span>
        <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          {andamento !== NAO_CALCULADO && <span className="project-summary-progress" aria-hidden>
            <span style={{ width: `${andamento}%` }} />
          </span>}
          <span>{andamento === NAO_CALCULADO ? NAO_CALCULADO : `${andamento}%`}</span>
        </span>
      </button>
      <button type="button" onClick={aoOrcamento} aria-label="Valor: abrir orçamento" className="project-summary-link project-summary-value text-left">
        <span className="project-summary-label">VALOR EXECUTADO</span>
        <span className="block text-sm tabular-nums" title="Valor executado / proposto em reais">
          <span className="text-base font-bold">
          {project.budgetExecuted > 0 ||
          (project.financialItems ?? []).some((i) => i.executedValue > 0)
            ? moeda(project.budgetExecuted)
            : "Não informado"}</span>{" "}
          / {project.budgetApproved > 0 ? moeda(project.budgetApproved) : "Não informado"}
        </span>
      </button>
        <button
          type="button"
          onClick={aoRiscos}
          className="project-summary-link text-left rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "var(--danger)" }}
          aria-label="Ver riscos do projeto"
        >
          <span className="project-summary-label">RISCOS</span>
          <span className="inline-flex gap-1.5 items-center text-sm font-semibold">
            <ShieldAlert size={15} />{abertos} em aberto
          </span>
        </button>
      <button
        type="button"
        disabled={bloqueado}
        onClick={aoParecer}
        aria-label="Ver parecer"
        className="inline-flex justify-center gap-2 rounded-lg px-4 py-2 text-sm text-primary-foreground bg-primary disabled:opacity-50"
      >
        <FileText size={16} />
        Ver Parecer
      </button>
    </div>
  );
}
