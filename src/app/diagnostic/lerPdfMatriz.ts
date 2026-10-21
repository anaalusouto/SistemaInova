import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc=workerUrl;

export async function lerPdfMatriz(arquivo:File,signal:AbortSignal):Promise<string> {
  if(!arquivo.name.toLowerCase().endsWith('.pdf') || (arquivo.type && arquivo.type!=='application/pdf'))throw new Error('Selecione um arquivo PDF.');
  if(!arquivo.size || arquivo.size>10*1024*1024)throw new Error('O PDF deve ter até 10 MB e não pode estar vazio.');
  const buffer=new Uint8Array(await arquivo.arrayBuffer());
  if(new TextDecoder().decode(buffer.subarray(0,5))!=='%PDF-')throw new Error('O arquivo não é um PDF válido.');
  signal.throwIfAborted();
  const tarefa=getDocument({data:buffer});
  const abortar=()=>void tarefa.destroy();signal.addEventListener('abort',abortar,{once:true});
  try {
    const pdf=await tarefa.promise;
    if(pdf.numPages>100)throw new Error('Selecione um PDF com até 100 páginas.');
    const paginas:string[]=[];
    for(let p=1;p<=pdf.numPages;p++) {
      signal.throwIfAborted();const pagina=await pdf.getPage(p);const conteudo=await pagina.getTextContent();
      let texto='';let y:number|undefined;
      for(const item of conteudo.items)if('str' in item){
        if(y!==undefined&&Math.abs(item.transform[5]-y)>3&&!texto.endsWith('\n'))texto+='\n';
        texto+=item.str+(item.hasEOL?'\n':' ');y=item.transform[5];
      }
      paginas.push(texto);pagina.cleanup();
    }
    return paginas.join('\n');
  } catch(e) {
    signal.throwIfAborted();
    if(e instanceof Error&&e.name==='PasswordException')throw new Error('O PDF está protegido por senha. Selecione uma cópia sem senha.');
    throw e;
  } finally {signal.removeEventListener('abort',abortar);await tarefa.destroy();}
}
