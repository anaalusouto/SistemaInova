import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { PopupDetalhe } from './PopupDetalhe';
import { usePopupChave } from './PopupNavegacao';
import { EVENTO_VISUALIZAR_DOCUMENTO, validarDocumento, urlDeVisualizacao, type DocumentoVisualizacao } from '../lib/visualizacaoDocumento';

export function VisualizadorDocumentos({ children }: { children: ReactNode }) {
  const [chave, mudar] = usePopupChave('documento');
  const documentos = useRef(new Map<string, DocumentoVisualizacao>());
  const abrirRef = useRef((d: DocumentoVisualizacao) => {});
  abrirRef.current = d => {
    const documento = validarDocumento(d);
    const id = crypto.randomUUID();
    documentos.current.set(id, documento);
    mudar(id);
  };
  useEffect(() => {
    const abrir = (e: Event) => abrirRef.current((e as CustomEvent<DocumentoVisualizacao>).detail);
    window.addEventListener(EVENTO_VISUALIZAR_DOCUMENTO, abrir);
    return () => window.removeEventListener(EVENTO_VISUALIZAR_DOCUMENTO, abrir);
  }, []);
  const documento = chave ? documentos.current.get(chave) : undefined;
  const interceptar = (e: MouseEvent<HTMLDivElement>) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link || link.hasAttribute('download') || link.dataset.abrirExterno === 'true') return;
    const url = new URL(link.href, window.location.href);
    if (!['http:', 'https:', 'blob:'].includes(url.protocol)) return;
    if (link.target !== '_blank' && url.origin === window.location.origin) return;
    e.preventDefault(); e.stopPropagation();
    abrirRef.current({ url: url.href, titulo: link.getAttribute('title') || link.textContent?.trim() || 'Documento vinculado' });
  };
  return <div className="contents" onClickCapture={interceptar}>
    {children}
    {chave && <PopupDetalhe titulo={documento?.titulo ?? 'Documento'} descricao="Visualização sobre a tela de origem" largo aoFechar={() => mudar(null)}
      acoes={documento ? <a href={documento.url} target="_blank" rel="noopener noreferrer" data-abrir-externo="true" className="inline-flex items-center gap-1.5 text-sm underline"><ExternalLink size={14} /> Abrir no site de origem</a> : undefined}>
      {documento ? <><p className="text-xs text-muted-foreground mb-3">Se o provedor não permitir a visualização aqui, use “Abrir no site de origem”.</p>
        {documento.mimeType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)(?:\?|$)/i.test(documento.url) ? <img src={documento.url} alt={documento.titulo} className="max-w-full max-h-[70dvh] object-contain mx-auto" />
          : <iframe title={`Visualização: ${documento.titulo}`} src={urlDeVisualizacao(documento.url)} className="w-full h-[68dvh] rounded-lg border border-border" sandbox="allow-scripts allow-same-origin allow-forms allow-downloads" referrerPolicy="no-referrer" />}</>
        : <p className="text-sm">O endereço temporário deste documento não está mais disponível. Feche este pop-up e abra o documento novamente na tela de origem.</p>}
    </PopupDetalhe>}
  </div>;
}
