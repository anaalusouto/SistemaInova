import { useState } from "react";
import { ArrowLeft, FileText, ClipboardList, DollarSign, Info, ShieldAlert } from "lucide-react";
import type { Project } from "../data/mockData";
import { useStore, type ProjectExt } from "../store";
import { ProjectSummaryHeader } from "./project-tabs/ProjectSummaryHeader";
import { TabDescricao } from "./project-tabs/TabDescricao";
import { TabPlanoTrabalho, type PedidoVisaoPlano } from "./plano/TabPlanoTrabalho";
import { useAuth } from "../auth/authStore";
import { TabOrcamento } from "./orcamento/TabOrcamento";
import { TabFinanceiro } from "./project-tabs/TabFinanceiro";
import { riscoEmAberto, faixaRisco } from "../lib/planoTrabalho";
import type { AbaProjeto } from "../lib/navegacaoApp";
import { DocumentosRegistro } from "./DocumentosRegistro";
import "./project-responsive.css";

const tabs = [
  { id: "descricao", label: "Descrição", icon: FileText },
  { id: "plano", label: "Plano de Trabalho", icon: ClipboardList },
  { id: "orcamento", label: "Orçamento", icon: DollarSign },
] as const;
interface ProjectViewProps {
  project: Project;
  onBack: () => void;
  rotuloVoltar?: string;
  dentroDaOrganizacao?: boolean;
  abaAtual?: AbaProjeto;
  focoAtual?: string | null;
  aoMudarAba?: (aba: AbaProjeto, foco?: string | null) => void;
}
export function ProjectView({
  project: initial,
  onBack,
  rotuloVoltar = "Organizações",
  dentroDaOrganizacao = false,
  abaAtual,
  aoMudarAba,
}: ProjectViewProps) {
  const { getProject } = useStore();
  const { readOnly } = useAuth();
  const project = getProject(initial.id) ?? initial;
  const [abaLocal, setAbaLocal] = useState<AbaProjeto>("plano");
  const [pedidoVisao, setPedidoVisao] = useState<PedidoVisaoPlano | null>(null);
  const [mostrarResumo, setMostrarResumo] = useState(false);
  const activeTab = abaAtual ?? abaLocal;
  const mudarAba = (aba: AbaProjeto, foco?: string | null) => {
    if (aoMudarAba) aoMudarAba(aba, foco);
    else {
      setAbaLocal(aba);
    }
  };
  const riscosAbertos = project.risks.filter(riscoEmAberto);
  const criticos = riscosAbertos.filter((r) => faixaRisco(r.severity) === "Crítico").length;
  return (
    <div className="project-shell min-w-0">
      {!dentroDaOrganizacao && (
        <div className="px-4 sm:px-6 py-3 border-b">
          <button type="button" onClick={onBack} className="mb-2 flex items-center gap-1 text-xs">
            <ArrowLeft size={13} />
            {rotuloVoltar}
          </button>
          <h1 className="text-xl font-bold break-words">
            {(project as ProjectExt).organizacao?.nome ??
              (project as ProjectExt).org ??
              project.name}
          </h1>
        </div>
      )}
      <nav
        aria-label="Abas do projeto"
        className="grid min-w-0 grid-cols-3 border-b px-2 sm:px-6"
        style={{ background: "var(--surface-0)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => mudarAba(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 sm:px-3 py-2 text-xs sm:text-sm"
              style={{
                borderColor: activeTab === tab.id ? "var(--primary)" : "transparent",
                color: activeTab === tab.id ? "var(--brand-text)" : "var(--ink-4)",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <div className="project-layout">
        <aside
          aria-label="Resumo e documentos do projeto"
          className="project-context min-w-0 p-3 sm:p-4"
          style={{ background: "var(--surface-0)" }}
        >
          <div className="project-actions">
            <button
              type="button"
              onClick={() => {
                mudarAba("plano");
                setPedidoVisao((p) => ({ visao: "riscos", contador: (p?.contador ?? 0) + 1 }));
              }}
              className="flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-semibold"
              style={{
                borderColor: criticos ? "var(--danger-soft-border)" : "var(--border)",
                background: criticos ? "var(--danger-soft)" : "var(--surface-1)",
                color: criticos ? "var(--danger)" : "var(--ink-2)",
              }}
            >
              <ShieldAlert size={17} />
              Riscos ({riscosAbertos.length}){criticos > 0 ? " · " + criticos + " crítico(s)" : ""}
            </button>
            <button
              type="button"
              onClick={() => {
                mudarAba("plano");
                setPedidoVisao((p) => ({ visao: "completa", contador: (p?.contador ?? 0) + 1 }));
              }}
              className="min-h-11 min-w-0 rounded-lg border px-2 py-2 text-xs"
            >
              Todos os campos
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  mudarAba("plano");
                  setPedidoVisao((p) => ({ visao: "ordenar", contador: (p?.contador ?? 0) + 1 }));
                }}
                className="min-h-11 min-w-0 rounded-lg border px-2 py-2 text-xs"
              >
                Ordenar
              </button>
            )}
          </div>
          <button
            type="button"
            className="project-context-toggle mt-2 flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-sm"
            aria-expanded={mostrarResumo}
            aria-controls={`project-context-${project.id}`}
            onClick={() => setMostrarResumo((v) => !v)}
          >
            Resumo e documentos <span aria-hidden>{mostrarResumo ? "−" : "+"}</span>
          </button>
          <div
            id={`project-context-${project.id}`}
            className="project-context-body space-y-4"
            data-expanded={mostrarResumo}
          >
            <ProjectSummaryHeader project={project} lateral />
            <dl className="space-y-2 text-xs break-words">
              <div>
                <dt className="text-muted-foreground">Projeto</dt>
                <dd>
                  {project.code} · {project.name}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Financiador</dt>
                <dd>{project.financier || "Não informado"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Situação</dt>
                <dd>{project.status}</dd>
              </div>
            </dl>
            <DocumentosRegistro area="projeto" projetoId={project.id} />
          </div>
        </aside>
        <div className="project-main min-w-0">
          {activeTab === "descricao" && <TabDescricao project={project} />}
          {activeTab === "plano" && (
            <TabPlanoTrabalho
              project={project}
              pedidoVisao={pedidoVisao}
              acoesExternas
            />
          )}
          {activeTab === "orcamento" && <TabOrcamentoInterino project={project} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Aba Orçamento.
 *
 * "Execução" é a tela da seção 14: itens vindos da planilha, com proposto e
 * executado, exclusão lógica e histórico.
 *
 * "Contrapartidas e aportes" preserva a visão financeira anterior. Esses dois
 * registros NÃO estão na especificação do Orçamento, e removê-los junto com a
 * reformulação tiraria da equipe algo que ela usa hoje e que ninguém pediu para
 * tirar. Ficam acessíveis e rotulados até haver decisão sobre eles.
 */
function TabOrcamentoInterino({ project }: { project: Project }) {
  const [sub, setSub] = useState<"execucao" | "legado">("execucao");

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 pt-4 flex-shrink-0">
        <div
          className="inline-flex rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          {(
            [
              ["execucao", "Execução"],
              ["legado", "Contrapartidas e aportes"],
            ] as const
          ).map(([valor, rotulo], i) => (
            <button
              key={valor}
              onClick={() => setSub(valor)}
              className="px-3 py-1.5 text-[12px]"
              style={{
                background: sub === valor ? "var(--brand-soft)" : "transparent",
                color: sub === valor ? "var(--brand-text)" : "var(--ink-3)",
                fontWeight: sub === valor ? 600 : 400,
                borderRight: i === 0 ? "1px solid var(--border)" : undefined,
              }}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {sub === "execucao" ? (
          <TabOrcamento project={project} />
        ) : (
          <div className="flex flex-col h-full min-h-0">
            <div className="px-6 pt-3 flex-shrink-0">
              <div
                className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                role="note"
              >
                <Info size={15} color="var(--ink-4)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: "0.78rem", color: "var(--ink-3)", lineHeight: 1.5 }}>
                  Visão financeira anterior. Contrapartidas e aportes não fazem parte da
                  especificação do Orçamento — continuam aqui até haver decisão sobre eles. A tabela
                  de itens desta tela foi substituída pela aba Execução.
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <TabFinanceiro project={project} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
