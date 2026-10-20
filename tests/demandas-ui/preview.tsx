import { useState } from "react";
import { createRoot } from "react-dom/client";
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
import "../../src/styles.css";
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
export function Preview() {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <LayoutPreview />
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
