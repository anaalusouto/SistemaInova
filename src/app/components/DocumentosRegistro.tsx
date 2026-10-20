import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth/authStore";
import {
  listarDocumentosRegistro,
  enviarDocumentoRegistro,
  abrirDocumentoRegistro,
  excluirDocumentoRegistro,
} from "../documentosRegistro.server";
import {
  validarDocumento,
  EXTENSOES_DOCUMENTO,
  type DestinoDocumento,
} from "../lib/documentosRegistro";
import { visualizarDocumento } from "../lib/visualizacaoDocumento";
import { normalizarLinkRelatorio } from "../lib/relatoriosOrg";

export function DocumentosRegistro({
  relatorioUrl,
  ...destino
}: DestinoDocumento & { relatorioUrl?: string | null }) {
  let relatorio: string | null = null;
  try {
    relatorio = normalizarLinkRelatorio(relatorioUrl ?? "");
  } catch {
    /* Não apresenta URL legada inválida. */
  }
  const { readOnly } = useAuth();
  const queryClient = useQueryClient();
  const key = ["documentos-registro", destino.area, destino.projetoId ?? destino.organizacaoId];
  const {
    data: documentos = [],
    isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: key, queryFn: () => listarDocumentosRegistro({ data: destino }) });
  const input = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  const enviar = async (arquivo: File) => {
    setFalha(null);
    setOcupado(true);
    try {
      validarDocumento(arquivo.name, arquivo.type, arquivo.size);
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error("Não foi possível ler o documento."));
        r.readAsDataURL(arquivo);
      });
      await enviarDocumentoRegistro({
        data: { ...destino, nomeArquivo: arquivo.name, tipoMime: arquivo.type, dataUrl },
      });
      await queryClient.invalidateQueries({ queryKey: key });
      toast.success("Documento anexado.");
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível anexar o documento.");
    } finally {
      setOcupado(false);
      if (input.current) input.current.value = "";
    }
  };
  const abrir = async (id: string) => {
    try {
      visualizarDocumento(await abrirDocumentoRegistro({ data: { id } }));
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível abrir o documento.");
    }
  };
  const remover = async () => {
    if (!excluirId) return;
    setOcupado(true);
    setFalha(null);
    try {
      await excluirDocumentoRegistro({ data: { id: excluirId } });
      await queryClient.invalidateQueries({ queryKey: key });
      setExcluirId(null);
      toast.success("Documento removido.");
    } catch (e) {
      setFalha(e instanceof Error ? e.message : "Não foi possível remover o documento.");
    } finally {
      setOcupado(false);
    }
  };
  return (
    <section aria-label="Documentos anexados" className="relative space-y-3 rounded-xl border p-3 min-w-0">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Paperclip size={16} />
        Documentos anexados
      </h2>
      <p className="text-xs text-muted-foreground">
        Arquivos deste {destino.area === "projeto" ? "projeto" : destino.area}. PDF, documentos,
        planilhas e imagens, até 3 MB por arquivo.
      </p>
      {relatorio && (
        <a
          href={relatorio}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs underline"
        >
          Consultar relatório externo já disponibilizado
        </a>
      )}
      {isLoading && (
        <p role="status" className="text-xs">
          Carregando documentos…
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error instanceof Error ? error.message : "Não foi possível carregar os documentos."}{" "}
          <button type="button" onClick={() => void refetch()} className="underline">
            Tentar novamente
          </button>
        </p>
      )}
      {!isLoading && !error && !documentos.length && (
        <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
      )}
      <ul className="space-y-2">
        {documentos.map((d) => (
          <li key={d.id} className="flex min-w-0 items-start gap-2 rounded-lg border p-2">
            <button
              type="button"
              onClick={() => void abrir(d.id)}
              className="flex min-w-0 flex-1 items-start gap-2 text-left text-xs hover:underline"
              aria-label={`Abrir documento ${d.nomeArquivo}`}
            >
              <Download size={15} className="shrink-0" />
              <span className="break-all">
                {d.nomeArquivo}
                <span className="block text-muted-foreground">
                  {(d.tamanhoBytes / 1024).toFixed(0)} KB
                </span>
              </span>
            </button>
            {!readOnly && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setExcluirId(d.id)}
                aria-label={`Remover documento ${d.nomeArquivo}`}
                className="p-1 text-destructive"
              >
                <Trash2 size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={ocupado || isLoading || !!error}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs disabled:opacity-50"
          >
            <Paperclip size={14} />
            {ocupado ? "Aguarde…" : "Anexar documento"}
          </button>
          <input
            ref={input}
            type="file"
            aria-label="Selecionar documento"
            accept={EXTENSOES_DOCUMENTO}
            className="sr-only"
            disabled={ocupado}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void enviar(f);
            }}
          />
        </>
      )}
      {excluirId && !readOnly && (
        <div role="alert" className="space-y-2 rounded-lg border p-3 text-xs">
          <p>Remover este documento? Esta ação exclui o arquivo anexado.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void remover()}
              className="rounded border px-2 py-1 text-destructive"
            >
              Confirmar remoção
            </button>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => setExcluirId(null)}
              className="rounded border px-2 py-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {falha && (
        <p role="alert" className="text-xs text-destructive">
          {falha}
        </p>
      )}
    </section>
  );
}
