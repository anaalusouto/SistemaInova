import { useEffect, useRef, useState } from 'react';
import { interpretarTextoMatriz, type ImportacaoMatriz } from '../../diagnostic/importarMatriz';

interface Props { onManual:()=>void; onImportar:(dados:ImportacaoMatriz,nome:string)=>void; onCancelar?:()=>void; temRespostas?:boolean }
export function EntradaMatriz({onManual,onImportar,onCancelar,temRespostas=false}:Props) {
  const [importando,setImportando]=useState(false),[erro,setErro]=useState('');
  const controle=useRef<AbortController|null>(null),selecionando=useRef(false);
  useEffect(()=>()=>controle.current?.abort(),[]);
  async function importar(arquivo:File) {
    if(selecionando.current)return;selecionando.current=true;
    const abort=new AbortController();controle.current=abort;setErro('');setImportando(true);
    try {
      const {lerPdfMatriz}=await import('../../diagnostic/lerPdfMatriz');
      const texto=await lerPdfMatriz(arquivo,abort.signal);abort.signal.throwIfAborted();
      const resultado=interpretarTextoMatriz(texto);
      if(!Object.keys(resultado.conferencia).length)throw new Error(texto.trim()?'Não foram reconhecidas funções do catálogo atual. Confira se o PDF identifica as funções e os campos ou preencha do zero.':'O PDF não contém texto legível. Selecione um PDF com texto ou preencha do zero.');
      onImportar(resultado,arquivo.name);
    } catch(e) {if(!abort.signal.aborted)setErro(e instanceof Error?e.message:'Não foi possível ler o PDF.');}
    finally {if(!abort.signal.aborted){selecionando.current=false;setImportando(false);}}
  }
  return <section aria-label="Iniciar mapeamento" className="space-y-4 max-w-5xl">
    <h3 className="text-lg font-semibold">{temRespostas?'Importar PDF':'Iniciar mapeamento'}</h3>
    <p className="text-sm text-muted-foreground">Escolha como preencher a Matriz Funcional desta organização e aplicação.</p>
    <div className="grid sm:grid-cols-2 gap-4">
      {!temRespostas&&<div className="rounded-xl border bg-card p-5 space-y-3"><h4 className="font-semibold">Criar do zero</h4><p className="text-sm text-muted-foreground">Abra as 21 funções com os campos vazios para preenchimento manual.</p><button type="button" disabled={importando} onClick={onManual} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60">Criar do zero</button></div>}
      <div className="rounded-xl border bg-card p-5 space-y-3"><h4 className="font-semibold">Importar PDF</h4><p className="text-sm text-muted-foreground">Selecione um PDF com respostas para conferir e editar na Matriz antes de salvar.</p><label className="flex flex-col gap-2 text-sm">PDF do mapeamento<input type="file" accept=".pdf,application/pdf" disabled={importando} onChange={e=>{const arquivo=e.target.files?.[0];e.target.value='';if(arquivo)void importar(arquivo);}}/><span className="text-xs text-muted-foreground">PDF com texto, até 10 MB. O arquivo é lido neste navegador.</span></label></div>
    </div>
    {importando&&<p role="status">Lendo PDF e identificando respostas…</p>}
    {erro&&<p role="alert" className="text-sm">{erro}</p>}
    {onCancelar&&<button type="button" disabled={importando} className="underline text-sm" onClick={onCancelar}>Voltar para a Matriz</button>}
  </section>;
}
