import { useState, type ReactNode } from "react";
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
  aoEncaminhamentos?: (atividadeId?: string) => void;
  renderEncaminhamentos?: (atividadeId: string | null) => ReactNode;
  abaAtual?: AbaProjeto;
  focoAtual?: string | null;
  aoMudarAba?: (aba: AbaProjeto, foco?: string | null) => void;
}
export function ProjectView({
  project: initial,
  onBack,
  rotuloVoltar = "Organizações",
  dentroDaOrganizacao = false,
  aoEncaminhamentos,
  renderEncaminhamentos,
  abaAtual,
  focoAtual,
  aoMudarAba,
}: ProjectViewProps) {
  const { getProject } = useStore();
  const { readOnly } = useAuth();
  const project = getProject(initial.id) ?? initial;
  const [abaLocal, setAbaLocal] = useState<AbaProjeto>("plano");
  const [focoLocal, setFocoLocal] = useState<string | null>(null);
  const [pedidoVisao, setPedidoVisao] = useState<PedidoVisaoPlano | null>(null);
  const activeTab = abaAtual ?? abaLocal;
  const mudarAba = (aba: AbaProjeto, foco?: string | null) => {
    if (aoMudarAba) aoMudarAba(aba, foco);
    else {
      setAbaLocal(aba);
      setFocoLocal(foco ?? null);
    }
  };
  const abrirEncaminhamentos = renderEncaminhamentos
    ? (atividadeId?: string) => mudarAba("encaminhamentos", atividadeId ?? null)
    : aoEncaminhamentos;
  const riscosAbertos = project.risks.filter(riscoEmAberto);
  const criticos = riscosAbertos.filter((r) => faixaRisco(r.severity) === "Crítico").length;
  return (
    <div className="min-w-0">
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
      <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <nav
            aria-label="Abas do projeto"
            className="flex overflow-x-auto border-b px-4 sm:px-6"
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
                  className="flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-3 text-sm whitespace-nowrap"
                  style={{
                    borderColor: activeTab === tab.id ? "var(--primary)" : "transparent",
                    color: activeTab === tab.id ? "var(--primary)" : "var(--ink-4)",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          {activeTab === "descricao" && <TabDescricao project={project} />}
          {activeTab === "plano" && (
            <TabPlanoTrabalho
              project={project}
              pedidoVisao={pedidoVisao}
              acoesExternas
              aoEncaminhamentos={abrirEncaminhamentos}
            />
          )}
          {activeTab === "orcamento" && <TabOrcamentoInterino project={project} />}
          {activeTab === "encaminhamentos" &&
            renderEncaminhamentos?.(abaAtual === undefined ? focoLocal : (focoAtual ?? null))}
        </div>
        <aside
          aria-label="Resumo e documentos do projeto"
          className="min-w-0 space-y-4 border-t xl:border-l xl:border-t-0 p-4"
          style={{ background: "var(--surface-0)" }}
        >
          <button
            type="button"
            onClick={() => {
              mudarAba("plano");
              setPedidoVisao((p) => ({ visao: "riscos", contador: (p?.contador ?? 0) + 1 }));
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold"
            style={{
              borderColor: criticos ? "var(--danger-soft-border)" : "var(--border)",
              background: criticos ? "var(--danger-soft)" : "var(--surface-1)",
              color: criticos ? "var(--danger)" : "var(--ink-2)",
            }}
          >
            <ShieldAlert size={17} />
            Riscos ({riscosAbertos.length}){criticos > 0 ? " · " + criticos + " crítico(s)" : ""}
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                mudarAba("plano");
                setPedidoVisao((p) => ({ visao: "completa", contador: (p?.contador ?? 0) + 1 }));
              }}
              className="flex-1 rounded-lg border px-3 py-2 text-xs"
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
                className="flex-1 rounded-lg border px-3 py-2 text-xs"
              >
                Ordenar
              </button>
            )}
          </div>
          <ProjectSummaryHeader project={project} lateral />
          {abrirEncaminhamentos && (
            <button
              type="button"
              aria-label="Encaminhamentos"
              onClick={() => abrirEncaminhamentos()}
              className="w-full rounded-lg border px-3 py-2 text-xs"
            >
              Encaminhamentos
            </button>
          )}
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
        </aside>
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
                color: sub === valor ? "var(--brand)" : "var(--ink-3)",
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
