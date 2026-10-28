import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve("tests/visualizacoes-ui"),
  resolve: { alias: { "@": path.resolve("src") } },
  server: { host: "127.0.0.1", port: 8095, strictPort: true, fs: { allow: [path.resolve(".")] } },
  plugins: [
    {
      name: "visualizacoes-isoladas",
      enforce: "pre",
      resolveId(source) {
        if (source.endsWith("/auth/authStore")) return "\0visualizacoes-auth";
        if (source.endsWith("/store")) return "\0visualizacoes-store";
      },
      load(id) {
        if (id === "\0visualizacoes-auth")
          return `export const useAuth=()=>({user:{login:new URLSearchParams(location.search).get('usuario')||'teste-a'},readOnly:true});`;
        if (id === "\0visualizacoes-store")
          return `import {portfolioDemo} from '/@fs/${path.resolve("src/app/data/portfolioDemo.ts").replaceAll("\\", "/")}'; export const useStore=()=>({projects:portfolioDemo,projectsLoading:false});`;
      },
    },
    tailwindcss(),
    react(),
  ],
});
