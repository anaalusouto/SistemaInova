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
  bloqueado = false,
}: {
  project: Project;
  aoRiscos: () => void;
  bloqueado?: boolean;
}) {
  const [baixando, setBaixando] = useState(false);
  const { formato } = useFormatoPlano();
  const moeda = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const andamento = andamentoDoProjeto(
    project.goals.flatMap((m) => m.deliverables.flatMap((e) => e.activities)),
  );
  const abertos = project.risks.filter(riscoEmAberto).length;
  const baixar = async () => {
    if (baixando) return;
    setBaixando(true);
    try {
      const { buildReportModel, exportReportPdf } = await import("../../lib/reportExport");
      exportReportPdf(
        buildReportModel(
          `Plano de trabalho e riscos - ${project.name}`,
          [project],
          [...CAMPOS_RELATORIO_PLANO],
          formato.ordemCampos,
        ),
      );
      toast.success("Plano de trabalho e riscos exportados.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível baixar o PDF.");
    } finally {
      setBaixando(false);
    }
  };
  return (
    <div className="project-summary-grid px-4 sm:px-6 pb-3 items-center gap-4">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Projeto</p>
        <p className="text-xs break-words">
          {project.code} · {project.name}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Valor executado / proposto</p>
        <p className="text-xs font-mono">
          {project.budgetExecuted > 0 ||
          (project.financialItems ?? []).some((i) => i.executedValue > 0)
            ? moeda(project.budgetExecuted)
            : "Não informado"}{" "}
          / {project.budgetApproved > 0 ? moeda(project.budgetApproved) : "Não informado"}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Andamento</p>
        <p className="text-xs">{andamento === NAO_CALCULADO ? NAO_CALCULADO : `${andamento}%`}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Riscos</p>
        <button
          type="button"
          onClick={aoRiscos}
          className="inline-flex gap-1 items-center text-xs font-semibold underline rounded focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ color: "var(--danger)" }}
          aria-label="Ver riscos do projeto"
        >
          <ShieldAlert size={14} />
          {abertos} em aberto
        </button>
      </div>
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
