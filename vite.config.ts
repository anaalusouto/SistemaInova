import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig(async ({ command, mode }) => {
  // DEBUG TEMPORÁRIO: confirmar se a Vercel está passando VITE_SUPABASE_URL
  // pro processo de build. Aparece nos Build Logs da Vercel. Remover depois.
  console.log('[debug-env]', {
    command, mode,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '(presente)' : undefined,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });

  const plugins = [
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    react(),
  ];

  if (command === "build") {
    const { nitro } = await import("nitro/vite");
    // No explicit preset: Nitro auto-detects Vercel (or any other supported
    // platform) via its build-time env vars, falling back to "node-server"
    // for a plain local build. Force { preset: "node-server" } only for a
    // build meant to run as a standalone Node process outside Vercel.
    plugins.push(nitro({}));
  }

  return {
    css: { transformer: "lightningcss" },
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    server: {
      host: true,
      port: 8080,
    },
    plugins,
  };
});
