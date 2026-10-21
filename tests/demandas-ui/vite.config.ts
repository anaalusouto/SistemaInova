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
          return `import{useSyncExternalStore}from'react';import{projeto}from'/dados.ts';let revisao=0;const listeners=new Set();const observar=f=>{listeners.add(f);return()=>listeners.delete(f);};const notificar=()=>{projeto.goals=[...projeto.goals];revisao++;for(const f of listeners)f();};const etapas=()=>projeto.goals.flatMap(m=>m.deliverables);const atividades=()=>etapas().flatMap(e=>e.activities);const falha=()=>{if(new URLSearchParams(location.search).has('falha'))throw new Error('Falha de gravação sintética');};export const useStore=()=>{useSyncExternalStore(observar,()=>revisao,()=>0);return new Proxy({projects:[projeto],getProject:()=>projeto,setConclusaoPlano:async(d)=>{falha();const alvos=d.tipo==='meta'?projeto.goals.find(m=>m.id===d.id).deliverables.flatMap(e=>e.activities):d.tipo==='etapa'?etapas().find(e=>e.id===d.id).activities:atividades().filter(a=>a.id===d.id);for(const p of d.periodos??[]){const a=alvos.find(a=>a.id===p.id);a.actualStart=p.inicioRealizado;a.actualEnd=p.fimRealizado;}if(d.concluido&&alvos.some(a=>!a.actualStart||!a.actualEnd||a.actualEnd<a.actualStart))throw new Error('Período realizado obrigatório');for(const a of alvos){a.status=d.concluido?'Concluído':'Em andamento';a.progress=d.concluido?100:50;}notificar();},moveEtapa:async(d)=>{falha();const origem=projeto.goals.find(m=>m.id===d.origemId);const destino=projeto.goals.find(m=>m.id===d.destinoId);const etapa=origem.deliverables.find(e=>e.id===d.etapaId);origem.deliverables=origem.deliverables.filter(e=>e!==etapa);destino.deliverables.splice(d.posicao-1,0,etapa);for(const m of [origem,destino])m.deliverables.forEach((e,i)=>e.order=i+1);for(const r of projeto.risks)if(r.stageId===etapa.id)r.goalId=destino.id;notificar();},updateRisco:async(id,d)=>{falha();const r=projeto.risks.find(r=>r.id===id);const meta=projeto.goals.find(m=>m.deliverables.some(e=>e.id===d.etapaId));Object.assign(r,{title:d.titulo,description:d.descricao,stageId:d.etapaId||null,goalId:meta?.id??r.goalId,category:d.categoria,responsible:d.responsavel,probability:d.probabilidade,impact:d.impacto,severity:d.probabilidade*d.impacto,status:d.status,responseStrategy:d.estrategiaResposta,specification:d.especificacao});projeto.risks=[...projeto.risks];notificar();},updateAtividade:async(id,d)=>{falha();const a=atividades().find(a=>a.id===id);Object.assign(a,{name:d.nome,responsible:d.responsavel,observations:d.observacoes,plannedStart:d.inicioPrevisto,plannedEnd:d.fimPrevisto,actualStart:d.inicioRealizado,actualEnd:d.fimRealizado,status:d.status,progress:d.progresso,delayJustification:d.justificativaAtraso,budgetLink:d.vinculoOrcamentario});notificar();},saveMeta:async(d)=>{falha();Object.assign(projeto.goals.find(m=>m.id===d.metaId),{name:d.nome,responsible:d.responsavel,plannedStart:d.inicioPrevisto,plannedEnd:d.fimPrevisto});notificar();},savePeriodoEtapa:async(d)=>{falha();Object.assign(etapas().find(e=>e.id===d.etapaId),{name:d.nome,expectedResult:d.resultadoEsperado,plannedStart:d.inicioPrevisto,plannedEnd:d.fimPrevisto,actualStart:d.inicioRealizado,actualEnd:d.fimRealizado});notificar();},renameTarefa:async(id,nome)=>{falha();atividades().flatMap(a=>a.tasks).find(t=>t.id===id).title=nome;notificar();}},{get(t,k){return k in t?t[k]:async()=>{};}});};`;
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
