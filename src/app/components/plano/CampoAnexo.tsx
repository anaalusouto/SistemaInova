/**
 * Anexar, abrir, substituir e remover um arquivo (RF-009, RF-026, RF-032).
 *
 * Serve tanto à atividade quanto ao registro de contato: a única diferença é
 * qual id vai como pai. Um componente só evita que as duas telas divirjam em
 * limite, tipos aceitos ou no que acontece ao substituir.
 *
 * O arquivo nunca é exposto por URL pública. `abrirAnexo` pede ao servidor uma
 * URL assinada de vida curta, emitida só depois da checagem de sessão — é o que
 * impede um link direto de virar acesso aberto (RN-002).
 */
import { useRef, useState } from 'react';
import { Paperclip, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Attachment } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { urlDoAnexo, LIMITE_BYTES, TIPOS_ACEITOS, EXTENSOES_ACEITAS } from '../../anexos.server';

/**
 * Abre o anexo numa aba nova.
 *
 * Exportado porque a Tabela e o Gantt também abrem anexo, sem montar o campo
 * inteiro. O `window.open` acontece ANTES do await: navegador bloqueia popup
 * aberto depois de uma espera assíncrona, por não ser mais atribuível ao
 * clique da pessoa.
 */
export async function abrirAnexo(anexoId: string): Promise<void> {
  const aba = window.open('', '_blank');
  try {
    const { url } = await urlDoAnexo({ data: { anexoId } });
    if (aba) aba.location.href = url;
    else window.location.href = url;
  } catch (e) {
    aba?.close();
    toast.error(e instanceof Error ? e.message : 'Não foi possível abrir o anexo.');
  }
}

function tamanhoLegivel(bytes: number | null): string {
  if (bytes === null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function CampoAnexo({
  projetoId, atividadeId, logComunicacaoId, anexo, rotulo = 'Anexar foto ou documento',
}: {
  projetoId: number;
  atividadeId?: string;
  logComunicacaoId?: string;
  anexo?: Attachment | null;
  rotulo?: string;
}) {
  const { uploadAnexo, deleteAnexo } = useStore();
  const { readOnly } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);

  const paiDefinido = !!atividadeId || !!logComunicacaoId;

  const selecionar = async (arquivo: File) => {
    // Checagem local para dar resposta imediata; o servidor revalida de
    // qualquer forma, que é onde a regra de fato vale.
    if (arquivo.size > LIMITE_BYTES) {
      toast.error(`O arquivo tem ${(arquivo.size / 1048576).toFixed(1)} MB e o limite é 20 MB.`);
      return;
    }
    if (!TIPOS_ACEITOS.includes(arquivo.type as (typeof TIPOS_ACEITOS)[number])) {
      toast.error('Tipo de arquivo não aceito. Use imagem, PDF, DOC, DOCX, ODT, XLS, XLSX ou TXT.');
      return;
    }

    setOcupado(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const leitor = new FileReader();
        leitor.onload = () => resolve(String(leitor.result));
        leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        leitor.readAsDataURL(arquivo);
      });

      await uploadAnexo({
        projetoId,
        atividadeId: atividadeId ?? null,
        logComunicacaoId: logComunicacaoId ?? null,
        nomeArquivo: arquivo.name,
        tipoMime: arquivo.type,
        dataUrl,
      });
      toast.success(anexo ? 'Anexo substituído.' : 'Anexo enviado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível enviar o anexo.');
    } finally {
      setOcupado(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remover = async () => {
    if (!anexo) return;
    setOcupado(true);
    try {
      await deleteAnexo(anexo.id);
      toast.success('Anexo removido.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível remover o anexo.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-3)' }}>{rotulo}</span>

      {anexo ? (
        <div
          className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 flex-wrap"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
        >
          <Paperclip size={13} color="var(--ink-4)" style={{ flexShrink: 0 }} />
          <span className="truncate min-w-0 flex-1" style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }} title={anexo.fileName}>
            {anexo.fileName}
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)', whiteSpace: 'nowrap' }}>
            {tamanhoLegivel(anexo.sizeBytes)}
          </span>
          <button
            type="button"
            onClick={() => abrirAnexo(anexo.id)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ color: 'var(--info)', fontSize: '0.72rem' }}
          >
            <ExternalLink size={11} /> abrir
          </button>
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={ocupado}
                className="px-1.5 py-0.5 rounded"
                style={{ color: 'var(--ink-3)', fontSize: '0.72rem' }}
              >
                substituir
              </button>
              <button
                type="button"
                onClick={remover}
                disabled={ocupado}
                aria-label="Remover anexo"
                className="px-1 py-0.5 rounded"
              >
                <Trash2 size={12} color="var(--danger)" />
              </button>
            </>
          )}
        </div>
      ) : (
        !readOnly && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={ocupado || !paiDefinido}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] self-start"
            style={{
              borderColor: 'var(--border)',
              color: paiDefinido ? 'var(--ink-3)' : 'var(--ink-5)',
              cursor: paiDefinido ? 'pointer' : 'not-allowed',
            }}
            title={paiDefinido ? undefined : 'Salve o registro antes de anexar um arquivo.'}
          >
            {ocupado ? <Loader2 size={13} className="animate-spin" /> : <Paperclip size={13} />}
            {ocupado ? 'Enviando…' : rotulo}
          </button>
        )
      )}

      {!paiDefinido && !readOnly && (
        // Anexo precisa de um pai já gravado: sem id, não há a que vincular, e
        // inventar um vínculo depois deixaria arquivo solto no storage.
        <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>
          Salve o registro primeiro para poder anexar um arquivo.
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={EXTENSOES_ACEITAS}
        className="hidden"
        onChange={e => {
          const arquivo = e.target.files?.[0];
          if (arquivo) void selecionar(arquivo);
        }}
      />
    </div>
  );
}
