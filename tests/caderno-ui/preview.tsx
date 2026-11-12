import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuestionarioCaderno } from '../../src/app/components/diagnostic/QuestionarioCaderno';
import { CestaCaderno } from '../../src/app/components/diagnostic/CestaCaderno';
import { MatrizCadernoTab } from '../../src/app/components/diagnostic/MatrizCadernoTab';
import { MatrizFuncionalTab } from '../../src/app/components/diagnostic/MatrizFuncionalTab';
import { CadernoItens } from '../../src/app/components/diagnostic/CadernoItens';
import { PlanilhaCaderno } from '../../src/app/components/diagnostic/PlanilhaCaderno';
import { PlanilhaCesta } from '../../src/app/components/diagnostic/PlanilhaCesta';
import { PendenciasModulo } from '../../src/app/components/PendenciasModulo';
import { QUESTIONARIO_CADERNO } from '../../src/app/diagnostic/catalog/cadernoCria';
import { IDENTIFICACAO_CADERNO, EVIDENCIAS_CADERNO } from '../../src/app/diagnostic/catalog/cadernoCria';
import '../../src/styles.css';
import '../../src/app/components/diagnostic/painel-diagnostico.css';
const queryClient=new QueryClient({defaultOptions:{queries:{retry:false}}});
function Preview(){
 const [tab,setTab]=useState('Questionário');
 const props={diagnosticoId:'00000000-0000-0000-0000-000000000001',organizacaoId:'00000000-0000-0000-0000-000000000002',readOnly:new URLSearchParams(location.search).has('consulta')};
 return <PendenciasModulo aoPendencias={()=>{}}><div className="diagnostico-painel min-h-screen p-4 sm:p-7 space-y-5"><p className="text-xs text-muted-foreground">Teste isolado · dados sintéticos, sem banco remoto. <a className="underline" href="/">Edição</a> · <a className="underline" href="?consulta">Consulta</a> · <a className="underline" href="?falha">Falha de salvamento</a></p><h1 className="text-2xl font-bold">Mapeamento · Caderno CRIA 22/10/2026</h1><nav className="diagnostico-abas flex flex-wrap gap-2">{['Matriz','Questionário','Cesta','Resumo','Planilha IEO','Planilha Cesta','Planilha Matriz'].map((t,i)=><button key={t} type="button" className="diagnostico-aba px-4 py-3" data-active={tab===t} onClick={()=>setTab(t)}>{i+1} {t}</button>)}</nav><main className="diagnostico-conteudo">{tab==='Questionário'?<QuestionarioCaderno {...props}/>:tab==='Matriz'?<MatrizCadernoTab {...props}/>:tab==='Cesta'?<CestaCaderno {...props}/>:tab==='Planilha Matriz'?<MatrizFuncionalTab {...props} modoPlanilha/>:tab==='Planilha IEO'?<PlanilhaCaderno {...props} itens={QUESTIONARIO_CADERNO}/>:tab==='Planilha Cesta'?<PlanilhaCesta {...props}/>:<div className="space-y-5"><h2 className="text-xl font-semibold">Identificação</h2><CadernoItens {...props} itens={IDENTIFICACAO_CADERNO}/><h2 className="text-xl font-semibold">Evidências e pendências</h2><CadernoItens {...props} itens={EVIDENCIAS_CADERNO}/></div>}</main></div></PendenciasModulo>;
}
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={queryClient}><Preview/></QueryClientProvider>);
