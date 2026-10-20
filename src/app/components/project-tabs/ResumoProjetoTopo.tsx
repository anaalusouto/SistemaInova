import { useState } from "react";
import { Download, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "../../data/mockData";
import { andamentoDoProjeto, riscoEmAberto, NAO_CALCULADO } from "../../lib/planoTrabalho";
import { CAMPOS_RELATORIO_PLANO } from "../../lib/planoRelatorio";
import { useFormatoPlano } from "../../theme/useFormatoPlano";

export function ResumoProjetoTopo({
  project,
  aoRiscos,
  aoDescricao,
  aoPlano,
  aoOrcamento,
  bloqueado = false,
}: {
  project: Project;
  aoRiscos: () => void;
  aoDescricao: () => void;
  aoPlano: () => void;
  aoOrcamento: () => void;
  bloqueado?: boolean;
}) {
  const [baixando, setBaixando] = useState(false);
  const { formato } = useFormatoPlano();
  const moeda = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const andamento = andamentoDoProjeto(
    project.goals.flatMap((m) => m.deliverables.flatMap((e) => e.activities)),
  );
  const abertos = project.risks.filter(riscoEmAberto).length;
  const baixar = async () => {
    if (baixando) return;
    setBaixando(true);
    try {
      const { buildReportModel, exportReportPdf } = await import("../../lib/reportExport");
      await exportReportPdf(
        buildReportModel(
          `Plano de trabalho e riscos - ${project.name}`,
          [project],
          [...CAMPOS_RELATORIO_PLANO],
          formato.ordemCampos,
        ),
      );
      toast.success("PDF gerado e download iniciado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível baixar o PDF.");
    } finally {
      setBaixando(false);
    }
  };
  return (
    <div className="project-summary-grid px-4 sm:px-6 py-4 items-center gap-4">
      <button type="button" onClick={aoDescricao} aria-label="Projeto: abrir descrição" className="project-summary-link min-w-0 text-left">
        <span className="project-summary-label">Projeto</span>
        <span className="block text-sm break-words leading-snug">
          {project.code} · {project.name}
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
      <button type="button" onClick={aoPlano} aria-label="Andamento: abrir plano de trabalho" className="project-summary-link text-left">
        <span className="project-summary-label">ANDAMENTO</span>
        <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
          {andamento !== NAO_CALCULADO && <span className="project-summary-progress" aria-hidden>
            <span style={{ width: `${andamento}%` }} />
          </span>}
          <span>{andamento === NAO_CALCULADO ? NAO_CALCULADO : `${andamento}%`}</span>
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
        disabled={baixando || bloqueado}
        title={
          bloqueado
            ? "Salve ou cancele as linhas alteradas antes de baixar."
            : "Baixar plano de trabalho e riscos em PDF"
        }
        onClick={() => void baixar()}
        aria-label="Baixar plano de trabalho e riscos"
        className="inline-flex justify-center gap-2 rounded-lg px-4 py-2 text-sm text-primary-foreground bg-primary disabled:opacity-50"
      >
        <Download size={16} />
        {baixando ? "Baixando…" : "Baixar"}
      </button>
    </div>
  );
}
