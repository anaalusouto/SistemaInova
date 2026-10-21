import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve('tests/acompanhamento-ui'),
  resolve: { alias: { '@': path.resolve('src') } },
  server: { host: '127.0.0.1', port: 8094, strictPort: true, fs: { allow: [path.resolve('.')] } },
  plugins: [{
    name: 'acompanhamento-isolado',
    enforce: 'pre',
    resolveId(source) {
      if (source.endsWith('/auth/authStore')) return '\0acompanhamento-auth';
      if (source.endsWith('/store')) return '\0acompanhamento-store';
    },
    load(id) {
      if (id === '\0acompanhamento-auth') return `export const useAuth=()=>({readOnly:new URLSearchParams(location.search).has('consulta')});`;
      if (id === '\0acompanhamento-store') return `
        import {useSyncExternalStore} from 'react';
        const base={coordinator:'Equipe',financier:'Teste',objective:'',team:[],startDate:'2026-01-01',endDate:'2026-12-31',progress:0,budgetApproved:100,budgetExecuted:0,riskLevel:'Baixo',goals:[],financialItems:[],contrapartidas:[],risks:[],changes:[],evidences:[]};
        let projects=[{...base,id:1,name:'Projeto sem visita',org:'Organização A',code:'TESTE-1',status:'Não iniciado'}, {...base,id:2,name:'Projeto acompanhado',org:'Organização B',code:'TESTE-2',status:'Em andamento',pareceres:[{origem:'Visita técnica',data:'2026-10-20'}]}];
        const listeners=new Set();
        const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn)};
        const updateProject=async(id,patch)=>{
          await new Promise(resolve=>setTimeout(resolve,400));
          if(new URLSearchParams(location.search).has('falha'))throw new Error('Falha de gravação sintética');
          if(new URLSearchParams(location.search).has('consulta'))throw new Error('Somente leitura');
          projects=projects.map(p=>p.id===id?{...p,...patch}:p);
          for(const fn of listeners)fn();
        };
        export const useStore=()=>({projects:useSyncExternalStore(subscribe,()=>projects,()=>projects),projectsLoading:false,updateProject});
      `;
    },
  }, tailwindcss(), react()],
});
