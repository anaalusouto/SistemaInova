import { createRoot } from "react-dom/client";
import { PortfolioView } from "../../src/app/components/PortfolioView";
import "../../src/styles.css";

createRoot(document.getElementById("root")!).render(
  <>
    <div className="p-3 bg-muted text-xs">
      Teste isolado com dados sintéticos · sem conexão ao banco.{" "}
      <a className="underline" href="?usuario=teste-a">
        Usuário A
      </a>{" "}
      ·{" "}
      <a className="underline" href="?usuario=teste-b">
        Usuário B
      </a>
    </div>
    <PortfolioView />
  </>,
);
