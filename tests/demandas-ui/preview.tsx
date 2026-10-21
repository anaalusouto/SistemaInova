import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "../../src/app/theme/themeStore";
import { useMenuLateral } from "../../src/app/theme/useMenuLateral";
import { Sidebar } from "../../src/app/components/Sidebar";
import { MarcaCria } from "../../src/app/components/MarcaCria";
import { LoginScreen } from "../../src/app/auth/LoginScreen";
import { FormatoProjetoSection } from "../../src/app/components/plano/FormatoProjetoSection";
import { FichaOrganizacao } from "../../src/app/components/organizacoes/FichaOrganizacao";
import type { RotaOrg } from "../../src/app/lib/navegacaoOrg";
import { orgId } from "./dados";
import { projeto } from "./dados";
import { TabPlanoTrabalho } from "../../src/app/components/plano/TabPlanoTrabalho";
import type { Project } from "../../src/app/data/mockData";
import { IeoTab } from "../../src/app/components/diagnostic/IeoTab";
import { DiagnosticoEditor } from "../../src/app/components/DiagnosticoEditor";
import { DiagnosticoModule } from "../../src/app/components/DiagnosticoModule";
import "../../src/styles.css";
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
export function Preview() {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LayoutPreview />
        <Toaster position="top-right" richColors closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
function LayoutPreview() {
  const [rota, setRota] = useState<RotaOrg>({ orgId, secao: "projeto", projetoId: 1 });
  const [aberto, setAberto] = useState(false);
  const [formatoAberto, setFormatoAberto] = useState(false);
  const { recolhido, alternar } = useMenuLateral();
  const { toggleMode, setAccent, setFontScale } = useTheme();
  if (new URLSearchParams(location.search).has('matriz-navegacao')) return <DiagnosticoModule />;
  if (new URLSearchParams(location.search).has('matriz-arquitetura')) return <DiagnosticoEditor diagnosticoId="diag-demo" onBack={() => {}} onNovaVersao={() => {}} />;
  if (new URLSearchParams(location.search).has('paleta')) return <div className="min-h-dvh p-6 bg-background text-foreground">
    <p className="mb-3">Prévia local da paleta institucional — dados sintéticos.</p>
    <button className="bg-primary text-primary-foreground rounded px-3 py-2 mb-5" onClick={toggleMode}>Alternar tema</button>
    <IeoTab diagnosticoId="teste-paleta" readOnly={false} />
  </div>;
  if (new URLSearchParams(location.search).has('riscos')) return <>
    <p className="p-3 bg-muted">Teste isolado de riscos — dados sintéticos, sem conexão com o banco.</p>
    <TabPlanoTrabalho project={projeto as unknown as Project} />
  </>;
  if (new URLSearchParams(location.search).has("login")) return <LoginScreen />;
  return (
    <div className="relative h-dvh flex min-w-0 overflow-hidden">
      <Sidebar
        activeItem="organizations"
        onNavigate={(item) => setFormatoAberto(item === "settings")}
        rotaOrg={rota}
        aoNavegarOrg={setRota}
        isOpen={aberto}
        onClose={() => setAberto(false)}
        collapsed={recolhido}
        onToggleCollapsed={alternar}
      />
      <div className="min-h-0 min-w-0 flex-1 flex flex-col overflow-hidden">
        <header className="cria-app-header flex shrink-0 items-center border-b px-4 font-semibold">
          Boa tarde, Administrador!
        </header>
        <div className="shrink-0 flex flex-wrap gap-2 border-b p-2 text-xs">
          <button className="lg:hidden" aria-label="Abrir menu" onClick={() => setAberto(true)}>
            Menu
          </button>
          <MarcaCria compacta className="lg:!hidden" />
          <button onClick={toggleMode}>Alternar tema</button>
          <button onClick={() => setFontScale("xl")}>Texto extragrande</button>
          <button onClick={() => setFontScale("md")}>Texto padrão</button>
          <button onClick={() => setAccent("terracota")}>Terracota</button>
          <button onClick={() => setAccent("azul")}>Azul</button>
          <strong>Teste isolado — dados sintéticos</strong>
          {(["dados", "projeto", "mapeamento", "parecer"] as const).map((secao) => (
            <button
              key={secao}
              type="button"
              onClick={() => setRota({ orgId, secao, projetoId: secao === "projeto" ? 1 : null })}
              className="border rounded px-2"
            >
              Testar {secao}
            </button>
          ))}
          <a href="?consulta=1">Perfil de consulta</a>
        </div>
        <div className="flex-1 min-h-0">
          {formatoAberto ? (
            <div className="p-4 overflow-y-auto h-full">
              <button className="border rounded p-2" onClick={() => setFormatoAberto(false)}>
                Voltar ao projeto
              </button>
              <FormatoProjetoSection />
            </div>
          ) : (
            <FichaOrganizacao rota={{ ...rota, orgId }} aoNavegar={setRota} />
          )}
        </div>
      </div>
    </div>
  );
}
const fixtureRoot =
  import.meta.hot?.data.fixtureRoot ?? createRoot(document.getElementById("root")!);
if (import.meta.hot) import.meta.hot.data.fixtureRoot = fixtureRoot;
fixtureRoot.render(<Preview />);
