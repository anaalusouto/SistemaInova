// Ambiente isolado de UI, sem login, banco ou chamadas OpenAI. Não é rota do Inova.
import { createRoot } from "react-dom/client";
import { AssistenteInova } from "../../src/app/assistant/AssistenteInova";
import { ThemeProvider } from "../../src/app/theme/themeStore";
import { Campo, Texto } from "../../src/app/components/plano/camposFormulario";
import "../../src/styles.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <main
      className="min-h-screen p-6"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <h1 className="mb-6 text-xl font-bold">Teste local — Assistente Inova</h1>
      <div data-inova-form="atividade" className="max-w-sm rounded-lg border p-4">
        <Campo rotulo="Título" obrigatorio>
          <Texto valor="Dado sintético que não deve sair do formulário" aoMudar={() => {}} />
        </Campo>
      </div>
      <AssistenteInova
        contexto={{ tela: "plano" }}
        dados={{
          projetosCarregados: 3,
          projeto: {
            metas: 2,
            etapas: 4,
            atividades: 8,
            concluidas: 3,
            riscos: 2,
            riscosAbertos: 1,
            status: "Em andamento",
          },
        }}
      />
    </main>
  </ThemeProvider>,
);
