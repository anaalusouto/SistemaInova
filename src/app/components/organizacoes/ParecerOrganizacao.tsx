import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/authStore';
import { listarPareceresDocumentais, criarParecerDocumental, excluirParecerDocumental } from '../../pareceresDocumentais.server';
import { abrirDocumentoRegistro } from '../../documentosRegistro.server';
import { EXTENSOES_DOCUMENTO } from '../../lib/documentosRegistro';
import { validarArquivosParecer, type ParecerDocumental } from '../../lib/pareceresDocumentais';
import { visualizarDocumento } from '../../lib/visualizacaoDocumento';
import { normalizarLinkRelatorio } from '../../lib/relatoriosOrg';
import { BotaoNovo } from '../BotaoNovo';
import { ConfirmarExclusao } from '../plano/camposFormulario';
import '../responsive-tables.css';

export function ParecerOrganizacao({ organizacaoId, relatorioUrl, aoVoltar }: {
  organizacaoId: string; relatorioUrl?: string | null; aoVoltar: () => void;
}) {
  const { readOnly } = useAuth();
  const queryClient = useQueryClient();
  const key = ['pareceres-documentais', organizacaoId];
  const { data: pareceres = [], isLoading, error, refetch } = useQuery({
    queryKey: key, queryFn: () => listarPareceresDocumentais({ data: { organizacaoId } }),
  });
  const [novo, setNovo] = useState(false);
  const [excluir, setExcluir] = useState<ParecerDocumental | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [falhaExclusao, setFalhaExclusao] = useState<string | null>(null);
  const [falhaConsulta, setFalhaConsulta] = useState<string | null>(null);
  const [abrindo, setAbrindo] = useState<string | null>(null);
  let relatorio: string | null = null;
  try { relatorio = normalizarLinkRelatorio(relatorioUrl ?? ''); } catch { /* Preserva somente links válidos. */ }

  const atualizar = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: key }),
      queryClient.invalidateQueries({ queryKey: ['documentos-registro', 'parecer', organizacaoId] }),
    ]);
  };
  const abrir = async (id: string) => {
    setFalhaConsulta(null);
    setAbrindo(id);
    try { visualizarDocumento(await abrirDocumentoRegistro({ data: { id } })); }
    catch (e) { setFalhaConsulta(e instanceof Error ? e.message : 'Não foi possível abrir o anexo.'); }
    finally { setAbrindo(null); }
  };
  const remover = async () => {
    if (!excluir || excluindo) return;
    setExcluindo(true);
    setFalhaExclusao(null);
    try {
      const resultado = await excluirParecerDocumental({ data: { organizacaoId, parecerId: excluir.id } });
      setExcluir(null);
      await atualizar();
      if (resultado.arquivosPendentes) toast.warning('Parecer excluído. A limpeza de alguns arquivos precisa ser verificada pela equipe.');
      else toast.success('Parecer excluído.');
    } catch (e) { setFalhaExclusao(e instanceof Error ? e.message : 'Não foi possível excluir o parecer.'); }
    finally { setExcluindo(false); }
  };

  return <div className="flex flex-col gap-6 p-4 sm:p-7 min-w-0">
    <div className="flex flex-col gap-3">
      <button type="button" onClick={aoVoltar} className="flex items-center gap-1 text-[12px] w-fit hover:text-blue-600" style={{ color: 'var(--ink-4)' }}>
        <ArrowLeft size={12} /> Voltar
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
            <Building2 size={18} color="var(--brand)" />
          </div>
          <h2 className="text-lg font-semibold">Parecer</h2>
        </div>
        {!readOnly && <BotaoNovo onClick={() => setNovo(true)}>Novo parecer</BotaoNovo>}
      </div>
    </div>
    {relatorio && <a href={relatorio} target="_blank" rel="noopener noreferrer" className="text-xs underline w-fit">Consultar relatório externo já disponibilizado</a>}
    {falhaConsulta && <p role="alert" className="text-sm text-destructive">{falhaConsulta}</p>}
    {error ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar os pareceres. <button type="button" className="underline" onClick={() => void refetch()}>Tentar novamente</button></p>
      : isLoading ? <p role="status">Carregando pareceres…</p>
      : <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)' }}>Pareceres da organização</h3>
        </div>
        <div className="inova-table-frame overflow-x-auto">
          <table className="inova-table-cards w-full" aria-label="Pareceres da organização">
            <thead><tr style={{ background: 'var(--surface-1)' }}>
              {['Parecer', 'Data de inclusão', 'Responsável', 'Anexos', 'Ação'].map(h => <th key={h} scope="col" className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {pareceres.map(p => <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td data-label="Parecer" className="px-4 py-3 text-sm break-words">{p.anexos[0]?.nomeArquivo}{p.anexos.length > 1 && <span className="block text-xs text-muted-foreground">e mais {p.anexos.length - 1} anexo(s)</span>}</td>
                <td data-label="Data de inclusão" className="px-4 py-3 text-sm">{new Date(p.criadoEm).toLocaleDateString('pt-BR')}</td>
                <td data-label="Responsável" className="px-4 py-3 text-sm">{p.enviadoPor}</td>
                <td data-label="Anexos" className="px-4 py-3"><ul className="space-y-2">
                  {p.anexos.map(a => <li key={a.id}><button type="button" disabled={abrindo !== null} onClick={() => void abrir(a.id)} className="inline-flex items-start gap-1 text-left text-xs hover:underline disabled:opacity-50" style={{ color: 'var(--primary)' }} aria-label={`Consultar anexo ${a.nomeArquivo}`}>
                    <Paperclip size={13} className="shrink-0 mt-0.5" /><span className="break-all">{abrindo === a.id ? 'Abrindo…' : a.nomeArquivo}<span className="block text-muted-foreground">{Math.ceil(a.tamanhoBytes / 1024)} KB</span></span>
                  </button></li>)}
                </ul></td>
                <td data-label="Ação" className="px-4 py-3">{!readOnly ? <button type="button" onClick={() => { setFalhaExclusao(null); setExcluir(p); }} className="text-[12px] font-medium text-destructive hover:underline" aria-label={`Excluir parecer ${p.anexos[0]?.nomeArquivo}`}>Excluir</button> : <span className="text-xs text-muted-foreground">Somente consulta</span>}</td>
              </tr>)}
              {pareceres.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.8rem' }}>Nenhum parecer registrado ainda para esta organização.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>}
    {novo && !readOnly && <NovoParecer organizacaoId={organizacaoId} aoFechar={() => setNovo(false)} aoSalvar={async () => { setNovo(false); await atualizar(); }} />}
    {excluir && !readOnly && <ConfirmarExclusao titulo="Excluir parecer" descricao={`Excluir o parecer “${excluir.anexos[0]?.nomeArquivo}” e seus ${excluir.anexos.length} anexo(s)? Esta ação é permanente e não permite recuperação pela aplicação.`}
      ocupado={excluindo} erro={falhaExclusao} aoCancelar={() => setExcluir(null)} aoConfirmar={() => void remover()} />}
  </div>;
}

function lerArquivo(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(new Error(`Não foi possível ler ${arquivo.name}.`));
    leitor.readAsDataURL(arquivo);
  });
}

function NovoParecer({ organizacaoId, aoFechar, aoSalvar }: { organizacaoId: string; aoFechar: () => void; aoSalvar: () => Promise<void> }) {
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const salvar = async () => {
    if (salvando) return;
    setErro(null);
    setSalvando(true);
    try {
      validarArquivosParecer(arquivos.map(a => ({ nomeArquivo: a.name, tipoMime: a.type, tamanhoBytes: a.size })));
      const anexos = await Promise.all(arquivos.map(async a => ({ nomeArquivo: a.name, tipoMime: a.type, dataUrl: await lerArquivo(a) })));
      await criarParecerDocumental({ data: { organizacaoId, arquivos: anexos } });
      toast.success('Parecer salvo.');
      await aoSalvar();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar o parecer.'); }
    finally { setSalvando(false); }
  };
  return <Dialog.Root open onOpenChange={aberto => { if (!aberto && !salvando) aoFechar(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-lg max-h-[calc(100dvh_-_2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-4 sm:p-6 shadow-xl outline-none" aria-busy={salvando} onEscapeKeyDown={e => { if (salvando) e.preventDefault(); }} onInteractOutside={e => { if (salvando) e.preventDefault(); }}>
        <div className="flex justify-between items-center gap-3 mb-3">
          <Dialog.Title className="text-lg font-semibold">Novo parecer</Dialog.Title>
          <Dialog.Close disabled={salvando} aria-label="Fechar cadastro de parecer" className="p-1 rounded hover:bg-accent disabled:opacity-50"><X size={16} /></Dialog.Close>
        </div>
        <Dialog.Description className="text-sm text-muted-foreground mb-4">Selecione os arquivos que compõem este parecer. PDF, documentos, planilhas, textos e imagens; até 3 MB no total.</Dialog.Description>
        <form onSubmit={e => { e.preventDefault(); void salvar(); }} className="space-y-4">
          <label className="flex flex-col gap-2 text-sm">Anexos do parecer *
            <input type="file" multiple accept={EXTENSOES_DOCUMENTO} disabled={salvando} className="w-full min-w-0 rounded-lg border p-2 text-xs" onChange={e => {
              const selecionados = Array.from(e.target.files ?? []);
              setErro(null);
              setArquivos(anteriores => [...anteriores, ...selecionados]);
              e.target.value = '';
            }} />
          </label>
          {arquivos.length > 0 && <ul className="space-y-2" aria-label="Arquivos selecionados">{arquivos.map((a, i) => <li key={`${a.name}-${i}`} className="flex items-start gap-2 rounded-lg border p-2 text-xs">
            <span className="flex-1 break-all">{a.name} <span className="text-muted-foreground">({Math.ceil(a.size / 1024)} KB)</span></span>
            <button type="button" disabled={salvando} aria-label={`Remover ${a.name} da seleção`} onClick={() => setArquivos(lista => lista.filter((_, indice) => indice !== i))} className="p-1"><X size={14} /></button>
          </li>)}</ul>}
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <div className="flex items-center justify-end gap-2">
            <button type="button" disabled={salvando} onClick={aoFechar} className="px-3 py-1.5 rounded-md border text-[13px] disabled:opacity-60">Cancelar</button>
            <button type="submit" disabled={salvando || !arquivos.length} className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white disabled:opacity-60" style={{ background: 'var(--primary)' }}>{salvando ? 'Salvando…' : 'Salvar parecer'}</button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
