import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve("tests/assistant-ui"),
  resolve: { alias: { "@": path.resolve("src") } },
  server: { host: "127.0.0.1", port: 8092, strictPort: true, fs: { allow: [path.resolve(".")] } },
  plugins: [
    {
      name: "isolated-assistant-fixture",
      enforce: "pre",
      resolveId(source, importer) {
        if (
          source === "../auth/authStore" &&
          importer?.replaceAll("\\", "/").endsWith("/assistant/AssistenteInova.tsx")
        )
          return "\0assistant-fixture-auth";
      },
      load(id) {
        if (id === "\0assistant-fixture-auth")
          return "export const useAuth = () => ({ user: { login: 'fixture-local', role: 'visualizador', adminOverride: false } });";
      },
      configureServer(server) {
        server.middlewares.use("/api/assistente", (_req, res) => {
          res.statusCode = 503;
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              configured: false,
              message:
                "Conexão real ainda não configurada. Solicite a configuração do Assistente Inova ao administrador.",
            }),
          );
        });
      },
    },
    tailwindcss(),
    react(),
  ],
});
