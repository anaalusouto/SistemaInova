import { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../../src/app/theme/themeStore";
import { FichaOrganizacao } from "../../src/app/components/organizacoes/FichaOrganizacao";
import type { RotaOrg } from "../../src/app/lib/navegacaoOrg";
import { orgId } from "./dados";
import "../../src/styles.css";
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
export function Preview() {
  const [rota, setRota] = useState<RotaOrg>({ orgId, secao: "projeto", projetoId: 1 });
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <div className="h-dvh flex flex-col">
          <div className="flex flex-wrap gap-2 border-b p-2 text-xs">
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
            <FichaOrganizacao rota={{ ...rota, orgId }} aoNavegar={setRota} />
          </div>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
const fixtureRoot =
  import.meta.hot?.data.fixtureRoot ?? createRoot(document.getElementById("root")!);
if (import.meta.hot) import.meta.hot.data.fixtureRoot = fixtureRoot;
fixtureRoot.render(<Preview />);
