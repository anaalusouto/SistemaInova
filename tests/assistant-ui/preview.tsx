// Ambiente isolado de UI, sem login, banco ou chamadas OpenAI. Não é rota do Inova.
import { createRoot } from "react-dom/client";
import { AssistenteInova } from "../../src/app/assistant/AssistenteInova";
import { ThemeProvider } from "../../src/app/theme/themeStore";
import { Campo, Texto } from "../../src/app/components/plano/camposFormulario";
import "../../src/styles.css";
import type { DetalheProjetoLocal } from "../../src/app/assistant/projectHelp";

const projeto: DetalheProjetoLocal = {
  nome: "Projeto de demonstração",
  codigo: "DEMO-01",
  organizacao: "Organização de teste",
  objetivo: "Preparar oficinas de comercialização",
  status: "Em andamento",
  andamento: 40,
  inicio: "2026-01-01",
  fim: "2026-12-31",
  metas: [
    {
      nome: "Fortalecer comercialização",
      etapas: [
        {
          nome: "Preparar oficina",
          atividades: [
            {
              nome: "Executar oficina",
              status: "Em andamento",
              progresso: 40,
              inicio: "2026-01-01",
              fim: "2026-09-30",
              inicioReal: null,
              fimReal: null,
              atrasada: true,
              tarefas: 2,
            },
          ],
        },
      ],
    },
  ],
  riscos: [],
};

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
          projetosCarregados: 1,
          projetos: [projeto],
          projetoDetalhado: projeto,
          projeto: {
            metas: 1,
            etapas: 1,
            atividades: 1,
            concluidas: 0,
            riscos: 0,
            riscosAbertos: 0,
            status: "Em andamento",
          },
        }}
      />
    </main>
  </ThemeProvider>,
);
