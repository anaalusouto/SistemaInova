import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getAnexo, getParecer, prepararUploadAnexoEvidencia, registrarAnexoEvidencia, salvarEvidenciasDiagnostico, type DocumentoEvidenciaDiagnostico, type EvidenciaVinculada, type SituacaoEvidenciaDiagnostico } from '../../diagnosticos.server';
import { supabase } from '../../../integrations/supabase/client';
import { visualizarDocumento } from '../../lib/visualizacaoDocumento';
import { usePendenciaModulo } from '../PendenciasModulo';

const BUCKET = 'diagnostico-anexos';
const LIMITE_BYTES = 20 * 1024 * 1024;
const TIPOS = ['image/png','image/jpeg','image/webp','image/gif','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.oasis.opendocument.text','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'];
const SITUACOES: SituacaoEvidenciaDiagnostico[] = ['Consultado','Não apresentado','Relatado','Pendente de conferência'];
type DraftEvidencia = EvidenciaVinculada & { id: string; codigo: string; titulo: string; situacao: string; codigosRelacionados: string; referencia: string; oQueComprova: string; limiteDuvida: string; pendencia: string; responsavel: string; fontePagina: string; documentos: DocumentoEvidenciaDiagnostico[] };
const normalizar = (e: EvidenciaVinculada, i: number): DraftEvidencia => ({
  ...e, id: e.id ?? e.codigo ?? `legacy-${i + 1}`, codigo: e.codigo ?? '', titulo: e.titulo ?? e.tipo ?? '',
  situacao: e.situacao ?? '', codigosRelacionados: e.codigosRelacionados ?? '', referencia: e.referencia ?? '',
  oQueComprova: e.oQueComprova ?? e.nota ?? '', limiteDuvida: e.limiteDuvida ?? '', pendencia: e.pendencia ?? '',
  responsavel: e.responsavel ?? '', fontePagina: e.fontePagina ?? '', documentos: e.documentos ?? [],
});
const serializar = (e: DraftEvidencia[]): EvidenciaVinculada[] => e.map(({ id, ...rest }) => ({ ...rest, id }));
const tamanho = (bytes: number | null) => bytes == null ? 'Tamanho não informado' : `${(bytes / 1048576).toLocaleString('pt-BR',{maximumFractionDigits:1})} MB`;

export function EvidenciasDiagnosticoPanel({ diagnosticoId, readOnly, aoFechar, aoGerenciar }: {
  diagnosticoId: string; readOnly: boolean; aoFechar: () => void; aoGerenciar: () => void;
}) {
  const queryClient = useQueryClient();
  const consulta = useQuery({ queryKey: ['diagnostico-parecer', diagnosticoId], queryFn: () => getParecer({ data: { diagnosticoId } }) });
  const [evidencias, setEvidencias] = useState<DraftEvidencia[]>([]);
  const [salvas, setSalvas] = useState('[]');
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const dirty = JSON.stringify(serializar(evidencias)) !== salvas;
  useEffect(() => {
    if (consulta.data) {
      const dados = (consulta.data.evidenciasVinculadas ?? []).map(normalizar);
      setEvidencias(dados); setSalvas(JSON.stringify(serializar(dados)));
      setSelecionada(atual => atual && dados.some(e => e.id === atual) ? atual : dados[0]?.id ?? null);
    }
  }, [consulta.data]);
  usePendenciaModulo(!readOnly && (dirty || ocupado));
  const filtradas = useMemo(() => evidencias.filter(e => `${e.codigo} ${e.titulo} ${e.codigosRelacionados}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))), [evidencias,busca]);
  const atual = evidencias.find(e => e.id === selecionada) ?? null;
  const fechar = () => { if (dirty && !readOnly && !window.confirm('Há alterações não salvas nas evidências. Fechar e descartá-las?')) return; aoFechar(); };
  const alterar = <K extends keyof DraftEvidencia>(campo: K, valor: DraftEvidencia[K]) => {
    if (!selecionada) return;
    setEvidencias(v => v.map(e => e.id === selecionada ? { ...e, [campo]: valor } : e));
    setErro('');
  };
  const novaEvidencia = () => {
    let n = 1;
    while (evidencias.some(e => e.codigo === `EV${String(n).padStart(3,'0')}`)) n++;
    const e: DraftEvidencia = { id: crypto.randomUUID(), codigo: `EV${String(n).padStart(3,'0')}`, titulo: '', situacao: '', codigosRelacionados: '', referencia: '', oQueComprova: '', limiteDuvida: '', pendencia: '', responsavel: '', fontePagina: '', documentos: [] };
    setEvidencias(v => [...v,e]); setSelecionada(e.id); setErro('');
  };
  const salvar = async () => {
    if (readOnly || !dirty || ocupado) return;
    setOcupado(true); setErro('');
    try {
      const salvas = await salvarEvidenciasDiagnostico({ data: { diagnosticoId, evidencias: serializar(evidencias) } });
      const normalizadas = salvas.map(normalizar);
      setEvidencias(normalizadas); setSalvas(JSON.stringify(serializar(normalizadas)));
      await queryClient.invalidateQueries({ queryKey: ['diagnostico-parecer', diagnosticoId] });
      toast.success('Evidências salvas.');
    } catch (e) { const msg = e instanceof Error ? e.message : 'Não foi possível salvar as evidências.'; setErro(msg); toast.error(msg); }
    finally { setOcupado(false); }
  };
  const anexar = async (evidencia: DraftEvidencia, arquivo: File) => {
    if (readOnly || dirty || ocupado) { if (dirty) toast.error('Salve as alterações da evidência antes de anexar um documento.'); return; }
    if (!TIPOS.includes(arquivo.type) || arquivo.size <= 0 || arquivo.size > LIMITE_BYTES) { toast.error('Use PDF, documento, planilha, texto ou imagem de até 20 MB.'); return; }
    setOcupado(true); setErro('');
    try {
      const destino = await prepararUploadAnexoEvidencia({ data: { diagnosticoId, codigo: evidencia.codigo, nomeArquivo: arquivo.name, tipoMime: arquivo.type, tamanhoBytes: arquivo.size } });
      const { error: erroUpload } = await supabase.storage.from(BUCKET).uploadToSignedUrl(destino.storagePath, destino.token, arquivo, { contentType: arquivo.type, upsert: false });
      if (erroUpload) throw new Error(erroUpload.message);
      const atualizadas = await registrarAnexoEvidencia({ data: { diagnosticoId, codigo: evidencia.codigo, storagePath: destino.storagePath, nomeArquivo: arquivo.name, tipoMime: arquivo.type, tamanhoBytes: arquivo.size } });
      const normalizadas = atualizadas.map(normalizar);
      setEvidencias(normalizadas); setSalvas(JSON.stringify(serializar(normalizadas)));
      await queryClient.invalidateQueries({ queryKey: ['diagnostico-parecer', diagnosticoId] });
      toast.success(`Documento anexado à ${evidencia.codigo}.`);
    } catch (e) { const msg = e instanceof Error ? e.message : 'Não foi possível anexar o documento.'; setErro(msg); toast.error(msg); }
    finally { setOcupado(false); }
  };
  const abrirDocumento = async (doc: DocumentoEvidenciaDiagnostico) => {
    try { const { url } = await getAnexo({ data: { anexoId: doc.id } }); visualizarDocumento({ url, titulo: doc.nomeArquivo }); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível abrir o documento.'); }
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-2 sm:p-5" onMouseDown={e => { if (e.target === e.currentTarget) fechar(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="evidencias-titulo" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border bg-card shadow-xl sm:max-h-[calc(100dvh-2.5rem)]">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b p-4 sm:p-5">
        <div><h2 id="evidencias-titulo" className="text-xl font-bold">Evidências e documentos</h2><p className="mt-1 text-sm text-muted-foreground">Registre a referência e anexe o documento à evidência correspondente.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={aoGerenciar} disabled={dirty||ocupado}>Cadastrar / gerenciar evidências</button><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={fechar} aria-label="Fechar painel de evidências">Fechar</button></div>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-3 sm:p-5 lg:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.4fr)]">
        <section className="min-w-0 space-y-3" aria-label="Lista de evidências">
          <div className="flex flex-wrap items-center gap-2"><input className="min-w-0 flex-1 rounded-lg border bg-card px-3 py-2 text-sm" aria-label="Buscar evidência" placeholder="Buscar por código ou título" value={busca} onChange={e => setBusca(e.target.value)} /><button type="button" className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50" onClick={novaEvidencia} disabled={readOnly||ocupado}>Nova evidência</button></div>
          {consulta.isLoading && <p role="status">Carregando evidências…</p>}
          {consulta.error && <p role="alert">Não foi possível carregar as evidências. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>}
          {!consulta.isLoading && filtradas.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">{evidencias.length ? 'Nenhuma evidência corresponde à busca.' : 'Ainda não há evidências cadastradas neste mapeamento.'}</p>}
          {filtradas.map(ev => <article key={ev.id} className={`rounded-xl border p-3 ${selecionada===ev.id?'border-primary bg-primary/5 ring-1 ring-primary/20':'bg-card'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold text-sm">{ev.codigo || 'Sem código'} · {ev.titulo || 'Sem título'}</h3><p className="mt-1 text-xs text-muted-foreground">Códigos relacionados: {ev.codigosRelacionados || 'Não informados'}</p></div><span className="rounded-full border px-2 py-1 text-[11px]">{ev.situacao || 'Não informada'}</span></div>
            {(['oQueComprova','limiteDuvida','pendencia','responsavel'] as const).map((c,i)=>{const labels=['O que comprova/relata','Limite/dúvida','Pendência','Responsável'];return <p key={c} className="mt-2 text-xs"><strong>{labels[i]}:</strong> {ev[c]||'Não preenchido'}</p>;})}
            <div className="mt-3 border-t pt-2"><p className="text-xs font-semibold">Documentos anexados</p>{ev.documentos.length ? <ul className="mt-1 space-y-1">{ev.documentos.map(doc=><li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><button type="button" className="text-left text-primary underline" onClick={()=>void abrirDocumento(doc)}>{doc.nomeArquivo}</button><span className="text-muted-foreground">{tamanho(doc.tamanhoBytes)}</span></li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">Ainda não há documento anexado.</p>}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" className="rounded-md border px-2.5 py-1.5 text-xs" onClick={()=>setSelecionada(ev.id)}>Editar evidência</button>{!readOnly&&<label className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-xs ${dirty||ocupado?'pointer-events-none opacity-50':''}`}>Anexar documento<input type="file" className="sr-only" accept=".png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.odt,.xls,.xlsx,.txt" disabled={dirty||ocupado} onChange={e=>{const f=e.target.files?.[0];if(f)void anexar(ev,f);e.currentTarget.value='';}}/></label>}</div>
          </article>)}
        </section>
        <section className="min-w-0 rounded-xl border bg-muted/10 p-3 sm:p-4" aria-label="Formulário da evidência selecionada">
          {!atual ? <p className="text-sm text-muted-foreground">Selecione uma evidência ou cadastre uma nova.</p> : <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{atual.codigo || 'Nova evidência'} · {atual.titulo || 'Sem título'}</h3>{dirty&&<span role="status" className="text-xs font-medium text-amber-700">Alterações pendentes</span>}</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="ID" value={atual.id} readOnly />
              <Field label="Código" value={atual.codigo} disabled={readOnly} onChange={v=>alterar('codigo',v)} placeholder="EV001" />
              <Field label="Código relacionado" value={atual.codigosRelacionados} disabled={readOnly} onChange={v=>alterar('codigosRelacionados',v)} placeholder="Q01; Q04" />
              <Field label="Documento/questão ou título da evidência" value={atual.titulo} disabled={readOnly} onChange={v=>alterar('titulo',v)} />
              <label className="block text-xs font-semibold">Situação<select className="mt-1 w-full rounded-lg border bg-card p-2.5 text-sm font-normal" value={atual.situacao} disabled={readOnly} onChange={e=>alterar('situacao',e.target.value)}><option value="">Não informada</option>{SITUACOES.map(s=><option key={s}>{s}</option>)}</select></label>
              <Field label="Referência/data" value={atual.referencia} disabled={readOnly} onChange={v=>alterar('referencia',v)} />
              <TextField label="O que comprova/relata" value={atual.oQueComprova} disabled={readOnly} onChange={v=>alterar('oQueComprova',v)} />
              <TextField label="Limite/dúvida" value={atual.limiteDuvida} disabled={readOnly} onChange={v=>alterar('limiteDuvida',v)} />
              <TextField label="Pendência/encaminhamento" value={atual.pendencia} disabled={readOnly} onChange={v=>alterar('pendencia',v)} />
              <Field label="Responsável, quando conhecido" value={atual.responsavel} disabled={readOnly} onChange={v=>alterar('responsavel',v)} />
              <Field label="Fonte/página" value={atual.fontePagina} disabled={readOnly} onChange={v=>alterar('fontePagina',v)} />
            </div>
            {erro&&<p role="alert" className="mt-3 rounded-lg border border-destructive/40 p-2 text-sm text-destructive">{erro}</p>}
            <p className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">Cada documento pode ter até 20 MB. O anexo fica vinculado a {atual.codigo || 'esta evidência'} e a esta versão do mapeamento.</p>
            {!readOnly&&<div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-3 border-t bg-card/95 py-3 backdrop-blur"><p className="text-xs text-muted-foreground">{dirty?'Há alterações pendentes.':'Nenhuma alteração pendente.'}</p><div className="flex gap-2"><button type="button" className="rounded-lg border px-3 py-2 text-sm" disabled={!dirty||ocupado} onClick={()=>{const dados=(consulta.data?.evidenciasVinculadas??[]).map(normalizar);setEvidencias(dados);setSalvas(JSON.stringify(serializar(dados)));setErro('');}}>Cancelar</button><button type="button" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={!dirty||ocupado} onClick={()=>void salvar()}>{ocupado?'Salvando…':'Salvar evidência'}</button></div></div>}
          </>}
        </section>
      </div>
    </section>
  </div>;
}

function Field({ label, value, onChange, disabled = false, readOnly = false, placeholder }: { label: string; value: string; onChange?: (v:string)=>void; disabled?:boolean; readOnly?:boolean; placeholder?:string }) {
  return <label className="block min-w-0 text-xs font-semibold">{label}<input className="mt-1 w-full min-w-0 rounded-lg border bg-card p-2.5 text-sm font-normal" value={value} readOnly={readOnly} disabled={disabled} placeholder={placeholder} onChange={onChange?e=>onChange(e.target.value):undefined}/></label>;
}
function TextField({ label, value, onChange, disabled = false }: { label: string; value: string; onChange:(v:string)=>void; disabled?:boolean }) {
  return <label className="block min-w-0 text-xs font-semibold">{label}<textarea rows={3} maxLength={20000} className="mt-1 w-full min-w-0 rounded-lg border bg-card p-2.5 text-sm font-normal" value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}/></label>;
}
