import { useEffect, useRef, useState } from 'react';
import { interpretarTextoMatriz, type ImportacaoSalva } from '../../diagnostic/importarMatriz';
import { registrarImportacaoMatriz } from '../../diagnosticos.server';

interface Props { organizacaoId:string;diagnosticoId:string;onManual:()=>void; onImportar:(dados:ImportacaoSalva)=>void; onCancelar?:()=>void; temRespostas?:boolean }
export function EntradaMatriz({organizacaoId,diagnosticoId,onManual,onImportar,onCancelar,temRespostas=false}:Props) {
  const [importando,setImportando]=useState(false),[erro,setErro]=useState('');
  const [semCorrespondencias,setSemCorrespondencias]=useState<string[]|null>(null);
  const controle=useRef<AbortController|null>(null),selecionando=useRef(false);
  useEffect(()=>()=>controle.current?.abort(),[]);
  async function importar(arquivo:File) {
    if(selecionando.current)return;selecionando.current=true;
    const abort=new AbortController();controle.current=abort;setErro('');setSemCorrespondencias(null);setImportando(true);
    try {
      const {lerPdfMatriz}=await import('../../diagnostic/lerPdfMatriz');
      const texto=await lerPdfMatriz(arquivo,abort.signal);abort.signal.throwIfAborted();
      if(!texto.trim())throw new Error('O PDF não contém texto legível. Selecione um PDF com texto ou preencha do zero.');
      const identificacao=interpretarTextoMatriz(texto);
      if(!Object.values(identificacao.conferencia).some(f=>Object.values(f.campos).includes('reconhecido')||Object.values(f.valores??{}).some(v=>v.length>0))){
        setSemCorrespondencias(identificacao.pendencias);return;
      }
      const hash=await crypto.subtle.digest('SHA-256',await arquivo.arrayBuffer());abort.signal.throwIfAborted();
      const sha256=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
      const resultado=await registrarImportacaoMatriz({data:{organizacaoId,diagnosticoId,texto,origem:{nomeArquivo:arquivo.name,sha256,tamanho:arquivo.size}}});
      if(!abort.signal.aborted)onImportar(resultado);
    } catch(e) {if(!abort.signal.aborted)setErro(e instanceof Error?e.message:'Não foi possível ler o PDF.');}
    finally {if(!abort.signal.aborted){selecionando.current=false;setImportando(false);}}
  }
  return <section aria-label="Iniciar mapeamento" className="space-y-4 max-w-5xl">
    <h3 className="text-lg font-semibold">{temRespostas?'Importar PDF':'Iniciar mapeamento'}</h3>
    {!temRespostas&&<p role="status" className="text-sm">Matriz vazia · 21 funções oficiais sem respostas.</p>}
    <p className="text-sm text-muted-foreground">Escolha como preencher a Matriz Funcional desta organização e aplicação.</p>
    <div className="grid sm:grid-cols-2 gap-4">
      {!temRespostas&&<div className="rounded-xl border bg-card p-5 space-y-3"><h4 className="font-semibold">Criar do zero</h4><p className="text-sm text-muted-foreground">Abra as 21 funções com os campos vazios para preenchimento manual.</p><button type="button" disabled={importando} onClick={onManual} className="rounded-lg bg-primary text-primary-foreground px-4 py-2 disabled:opacity-60">Criar do zero</button></div>}
      <div className="rounded-xl border bg-card p-5 space-y-3"><h4 className="font-semibold">Importar PDF</h4><p className="text-sm text-muted-foreground">Selecione um PDF com respostas para conferir e editar na Matriz antes de salvar.</p><label className="flex flex-col gap-2 text-sm">PDF do mapeamento<input type="file" accept=".pdf,application/pdf" disabled={importando} onChange={e=>{const arquivo=e.target.files?.[0];e.target.value='';if(arquivo)void importar(arquivo);}}/><span className="text-xs text-muted-foreground">PDF com texto, até 10 MB. O texto reconhecido e a referência do arquivo ficam registrados nesta aplicação para conferência.</span></label></div>
    </div>
    {importando&&<p role="status">Lendo PDF e identificando respostas…</p>}
    {erro&&<p role="alert" className="text-sm">{erro}</p>}
    {semCorrespondencias!==null&&<div role="status" className="rounded-xl border bg-card p-4 space-y-2 text-sm"><p className="font-medium">Importação sem correspondências</p><p>Nenhuma resposta pôde ser associada com segurança às funções oficiais. Nenhuma alteração foi feita na Matriz. Selecione outro PDF ou preencha manualmente.</p>{semCorrespondencias.length>0&&<details><summary>Respostas não associadas ({semCorrespondencias.length})</summary><ul className="list-disc pl-5">{semCorrespondencias.map((p,i)=><li key={i}>{p}</li>)}</ul></details>}</div>}
    {onCancelar&&<button type="button" disabled={importando} className="underline text-sm" onClick={onCancelar}>Voltar para a Matriz</button>}
  </section>;
}
