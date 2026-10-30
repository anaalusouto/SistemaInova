import { useState } from "react";
import { FileText, ClipboardList, DollarSign, Info, ChevronDown } from "lucide-react";
import type { Project } from "../data/mockData";
import { useStore, type ProjectExt } from "../store";
import { TituloNavegacao } from "./TituloNavegacao";
import { ResumoProjetoTopo } from "./project-tabs/ResumoProjetoTopo";
import { TabDescricao } from "./project-tabs/TabDescricao";
import { TabPlanoTrabalho, type PedidoVisaoPlano } from "./plano/TabPlanoTrabalho";
import { TabOrcamento } from "./orcamento/TabOrcamento";
import { TabFinanceiro } from "./project-tabs/TabFinanceiro";
import type { AbaProjeto } from "../lib/navegacaoApp";
import { DocumentosRegistro } from "./DocumentosRegistro";
import "./project-responsive.css";
import { toast } from "sonner";

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
  const project = getProject(initial.id) ?? initial;
  const [abaLocal, setAbaLocal] = useState<AbaProjeto>("plano");
  const [pedidoVisao, setPedidoVisao] = useState<PedidoVisaoPlano | null>(null);
  const [mostrarResumo, setMostrarResumo] = useState(true);
  const [haPendencias, setHaPendencias] = useState(false);
  const activeTab = abaAtual ?? abaLocal;
  const mudarAba = (aba: AbaProjeto, foco?: string | null) => {
    if (haPendencias && aba !== activeTab) {
      toast.error("Salve ou cancele as linhas alteradas antes de mudar de aba.");
      return;
    }
    if (aoMudarAba) aoMudarAba(aba, foco);
    else {
      setAbaLocal(aba);
    }
  };
  return (
    <div className="project-shell min-w-0">
      {!dentroDaOrganizacao && (
        <TituloNavegacao nome={(project as ProjectExt).organizacao?.nome ?? (project as ProjectExt).org ?? project.name} aoVoltar={onBack} rotulo={rotuloVoltar} />
      )}
      <section className="relative border-b" aria-label="Resumo do projeto">
        <button
          type="button"
          className="project-summary-toggle absolute z-10 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={mostrarResumo ? "Recolher resumo" : "Expandir resumo"}
          title={mostrarResumo ? "Recolher resumo" : "Expandir resumo"}
          aria-expanded={mostrarResumo}
          aria-controls={`project-context-${project.id}`}
          onClick={() => setMostrarResumo((v) => !v)}
        >
          <ChevronDown size={14} aria-hidden className={mostrarResumo ? "rotate-180" : ""} />
        </button>
        <div
          id={`project-context-${project.id}`}
          hidden={!mostrarResumo}
          data-expanded={mostrarResumo}
        >
          <ResumoProjetoTopo
            project={project}
            aoDescricao={() => mudarAba("descricao")}
            aoPlano={() => {
              if (haPendencias) {
                toast.error("Salve ou cancele as linhas alteradas antes de navegar pelo resumo.");
                return;
              }
              mudarAba("plano");
              setPedidoVisao((p) => ({ visao: "tabela", contador: (p?.contador ?? 0) + 1 }));
            }}
            aoOrcamento={() => mudarAba("orcamento")}
            bloqueado={haPendencias}
            aoRiscos={() => {
              if (haPendencias) {
                toast.error("Salve ou cancele as linhas alteradas antes de navegar pelo resumo.");
                return;
              }
              mudarAba("plano");
              setPedidoVisao((p) => ({ visao: "riscos", somenteAbertos: true, contador: (p?.contador ?? 0) + 1 }));
            }}
          />
        </div>
      </section>
      <nav aria-label="Abas do projeto" className="project-tabs grid min-w-0 grid-cols-3 border-b px-2 sm:px-6" style={{ background: "var(--surface-0)" }}>
        {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => mudarAba(tab.id)} aria-current={activeTab === tab.id ? "page" : undefined} className="flex min-h-12 min-w-0 items-center justify-center gap-1.5 border-b-2 px-1 sm:px-3 py-2 text-xs sm:text-sm" style={{ borderColor: activeTab === tab.id ? "var(--primary)" : "transparent", color: activeTab === tab.id ? "var(--brand-text)" : "var(--ink-4)" }}><Icon size={14} />{tab.label}</button>; })}
      </nav>
      <div className="project-layout">
        <div className="project-main min-w-0">
          {activeTab === "descricao" && <TabDescricao project={project} />}
          {activeTab === "plano" && (
            <TabPlanoTrabalho
              project={project}
              pedidoVisao={pedidoVisao}
              acoesExternas
              aoPendencias={setHaPendencias}
            />
          )}
          {activeTab === "orcamento" && <TabOrcamentoInterino project={project} />}
        </div>
      </div>
      <details open className="project-disclosure border-t">
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 sm:px-6 py-3 text-sm font-medium">Documentos do projeto<ChevronDown size={16} aria-hidden /></summary>
        <div className="px-4 sm:px-6 pb-3"><DocumentosRegistro area="projeto" projetoId={project.id} /></div>
      </details>
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
