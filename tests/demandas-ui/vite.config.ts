import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

export default defineConfig({
  root: path.resolve("tests/demandas-ui"),
  publicDir: path.resolve("public"),
  resolve: { alias: { "@": path.resolve("src") } },
  server: { host: "127.0.0.1", port: 8093, strictPort: true, fs: { allow: [path.resolve(".")] } },
  plugins: [
    {
      name: "isolated-pdf-demands",
      enforce: "pre",
      resolveId(source, importer) {
        if (!importer) return;
        for (const part of [
          "authStore",
          "auditStore",
          "store",
          "useOrganizacoes",
          "useAgenda",
          "PopupNavegacao",
        ])
          if (source.endsWith("/" + part)) return "\0fixture:" + part;
        if (source.endsWith(".server") && source.startsWith("."))
          return "\0fixture-server:" + path.resolve(path.dirname(importer), source + ".ts");
      },
      load(id) {
        if (id === "\0fixture:useAgenda") return `export const useAgenda=()=>({paraMim:[]});`;
        if (id === "\0fixture:authStore")
          return `const consulta=new URLSearchParams(location.search).has('consulta');export const useAuth=()=>({user:{login:'teste',displayName:'Teste',role:consulta?'visualizador':'admin'},readOnly:consulta,isAdmin:!consulta});export const usePeople=()=>[];export const hasAdminPowers=()=>!consulta;`;
        if (id === "\0fixture:auditStore") return `export const useAudit=()=>({log(){}});`;
        if (id === "\0fixture:store")
          return `import{projeto}from'/dados.ts';export const useStore=()=>new Proxy({projects:[projeto],getProject:()=>projeto},{get(t,k){return k in t?t[k]:async()=>{};}});`;
        if (id === "\0fixture:useOrganizacoes")
          return `import{org}from'/dados.ts';export const useFichaOrganizacao=()=>({data:org,isLoading:false});export const useListaOrganizacoes=()=>({data:[org]});export const useEscritaOrganizacao=()=>({});`;
        if (id === "\0fixture:PopupNavegacao")
          return `import{useState}from'react';export const usePopupChave=()=>useState(null);export const PopupNavegacao=({children})=>children;`;
        if (id.startsWith("\0fixture-server:")) {
          const filename = id.slice("\0fixture-server:".length);
          const names = [
            ...fs
              .readFileSync(filename, "utf8")
              .matchAll(/export (?:async )?(?:const|function|class) (\w+)/g),
          ].map((m) => m[1]);
          return (
            `import{call}from'/dados.ts';` +
            names
              .map(
                (n) =>
                  `export const ${n}=${n === "LIMITE_BYTES" ? "20971520" : n === "TIPOS_ACEITOS" ? '["application/pdf"]' : n === "EXTENSOES_ACEITAS" ? '".pdf"' : `(...args)=>call('${n}',...args)`};`,
              )
              .join("\n")
          );
        }
      },
    },
    tailwindcss(),
    react(),
  ],
});
