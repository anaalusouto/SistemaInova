import { useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CheckCircle2, FileSpreadsheet, MapPin, Pencil, Upload, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { useAuth, usePeople } from '../../auth/authStore';
import { obterCronogramaRotas, preverImportacaoRotas, confirmarImportacaoRotas, salvarLinhaRotas } from '../../cronogramaRotas.server';
import { analisarRotas, blocosDaRota, numeroRota, dataDaPlanilha, chaveRotas, type LinhaRotas, type TabelaRotas, type VisitaRota } from '../../lib/cronogramaRotas';
import { formatDateOnly } from '../../lib/dateOnly';
import { PopupDetalhe } from '../PopupDetalhe';
import { usePopupChave } from '../PopupNavegacao';

const input = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50';
type Previa = Awaited<ReturnType<typeof preverImportacaoRotas>>;
type Edicao = { linha: LinhaRotas; tabela: TabelaRotas; versao: number };

export function CronogramaRotas({ renderMapa }: { renderMapa?: (visitas: VisitaRota[]) => ReactNode }) {
  const { readOnly } = useAuth();
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['cronograma-rotas'], queryFn: () => obterCronogramaRotas(), refetchInterval: 30000 });
  const [aba, setAba] = useState<'cronograma' | 'mapa'>('cronograma');
  const [popup, mudarPopup] = usePopupChave('rotas');
  const [selecionada, setSelecionada] = useState('');
  const [busca, setBusca] = useState('');
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const salvo = query.data;
  const analise = useMemo(() => salvo ? analisarRotas(salvo.dados) : null, [salvo]);
  const numeros = analise?.numeros ?? [];
  const numero = numeros.includes(selecionada) ? selecionada : numeros[0];
  const visitas = analise?.visitas.filter(v => numeroRota(v.rota) === numero) ?? [];
  const dias = (analise?.dias.filter(d => numeroRota(d.rota) === numero) ?? []).sort((a, b) => (a.data ?? '').localeCompare(b.data ?? '') || a.linha - b.linha);
  const detalhe = salvo?.dados.abas.find(a => numeroRota(a.nome) === numero);
  const blocos = detalhe ? blocosDaRota(detalhe) : [];
  const [tipoPopup, alvoPopup, blocoPopup] = (popup ?? '').split(':');
  const visitaPopup = tipoPopup === 'visita' ? analise?.visitas.find(v => v.linha === Number(alvoPopup)) : undefined;
  const diaPopup = tipoPopup === 'dia' ? analise?.dias.find(d => d.linha === Number(alvoPopup)) : undefined;
  const abaDetalhePopup = tipoPopup === 'bloco' ? salvo?.dados.abas.find(a => numeroRota(a.nome) === alvoPopup) : undefined;
  const blocoAberto = abaDetalhePopup ? blocosDaRota(abaDetalhePopup)[Number(blocoPopup)] : undefined;
  const conteudo = analise && (visitaPopup ? { titulo: visitaPopup.organizacao, tabela: { ...analise.instituicoes, linhas: [visitaPopup] } }
    : diaPopup ? { titulo: `${diaPopup.rota} · ${diaPopup.valores[0]}`, tabela: { ...analise.cronograma, linhas: [diaPopup] } }
    : tipoPopup === 'visitas' ? { titulo: `Visitas da Rota ${alvoPopup}`, tabela: { ...analise.instituicoes, linhas: analise.visitas.filter(v => numeroRota(v.rota) === alvoPopup) } }
    : blocoAberto ? { titulo: `${blocoAberto.titulo} · Rota ${alvoPopup}`, tabela: blocoAberto.tabela } : null);
  const filtro = busca.toLocaleLowerCase('pt-BR').trim();
  const rotasFiltradas = numeros.filter(n => !filtro || `rota ${n} ${analise!.visitas.filter(v => numeroRota(v.rota) === n).map(v => `${v.organizacao} ${v.municipio}`).join(' ')} ${analise!.dias.filter(d => numeroRota(d.rota) === n).map(d => `${d.equipeSemas} ${d.equipe}`).join(' ')}`.toLocaleLowerCase('pt-BR').includes(filtro));

  const editar = (linha: LinhaRotas, tabela: TabelaRotas) => {
    if (!readOnly && salvo) {
      const valores = salvo.dados.abas.find(a => a.nome === linha.aba)?.linhas[linha.linha];
      if (!valores) return;
      mudarPopup(null);
      setEdicao({ linha: { ...linha, valores }, tabela, versao: salvo.versao });
    }
  };
  async function ler(file?: File) {
    if (!file || ocupado || readOnly) return;
    setPrevia(null); setErro('');
    if (!/\.xlsx?$/i.test(file.name) || file.size > 10 * 1024 * 1024) { setErro('Selecione um Excel .xlsx ou .xls de até 10 MB.'); return; }
    setOcupado(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Falha ao abrir o arquivo.')); reader.readAsDataURL(file); });
      setPrevia(await preverImportacaoRotas({ data: { dataUrl, nomeArquivo: file.name } }));
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível ler a planilha.'); }
    finally { setOcupado(false); }
  }
  async function importar() {
    if (!previa || ocupado || readOnly) return;
    setOcupado(true); setErro('');
    try {
      const atualizado = await confirmarImportacaoRotas({ data: { dados: previa.dados, versao: previa.versaoAtual } });
      client.setQueryData(['cronograma-rotas'], atualizado);
      setPrevia(null); mudarPopup(null); setAba('cronograma');
      toast.success('Cronograma importado e disponível para a equipe.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível importar.'); }
    finally { setOcupado(false); }
  }

  return <section className="space-y-5 min-w-0">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">Cronograma de rotas</h2><p className="text-sm text-muted-foreground mt-1">Visitas, equipes e logística de campo em um só lugar.</p></div>
      <div className="flex gap-2 flex-wrap" aria-label="Visualizações de rotas">
        <button className={button} aria-pressed={aba === 'cronograma'} onClick={() => setAba('cronograma')}><CalendarDays size={15} /> Cronograma</button>
        {renderMapa && <button className={button} aria-pressed={aba === 'mapa'} onClick={() => setAba('mapa')}><MapPin size={15} /> Mapa</button>}
        {!readOnly && <button className={`${button} bg-primary text-primary-foreground`} onClick={() => mudarPopup('importar')}><Upload size={15} /> Importar planilha</button>}
      </div>
    </div>
    {query.isLoading && <p role="status">Carregando cronograma compartilhado…</p>}
    {query.error && <div role="alert" className="rounded-xl border border-destructive p-4"><p>{query.error.message}</p><button className={`${button} mt-3`} onClick={() => void query.refetch()}>Tentar novamente</button></div>}
    {popup === 'importar' && !readOnly && <PopupDetalhe titulo="Importar cronograma do Excel" descricao="Confira a prévia antes de substituir a referência compartilhada." largo bloqueado={ocupado} aoFechar={() => mudarPopup(null)}><div className="space-y-4">
      <div className="flex items-center gap-3"><FileSpreadsheet size={25} /><div><h3 className="font-semibold">Importar cronograma do Excel</h3><p className="text-sm text-muted-foreground">Selecione o arquivo com as abas Instituições, Cronograma e os roteiros por rota.</p></div></div>
      <input aria-label="Planilha de rotas" type="file" accept=".xlsx,.xls" disabled={ocupado || query.isLoading || !!query.error} onChange={e => { void ler(e.target.files?.[0]); e.target.value = ''; }} className={input} />
      <p className="text-sm text-muted-foreground">A prévia não altera dados. Ao confirmar, o arquivo passa a ser a referência compartilhada. A versão anterior e as correções ficam preservadas no histórico.</p>
      {ocupado && <p role="status">Processando planilha…</p>}
      {erro && <p role="alert" className="text-destructive">{erro}</p>}
      {previa && <div className="space-y-4">
        <Resumo valores={[[previa.resumo.rotas, 'rotas'], [previa.resumo.visitas, 'visitas'], [previa.resumo.dias, 'dias de agenda'], [previa.dados.abas.length, 'abas preservadas']]} />
        <p className="text-sm"><strong>{previa.dados.arquivo}</strong> · {previa.versaoAtual ? `Substitui a versão ${previa.versaoAtual}` : 'Primeira importação'}</p>
        <Avisos avisos={previa.resumo.avisos} />
        <div className="max-h-72 overflow-auto"><Tabela tabela={analisarRotas(previa.dados).instituicoes} /></div>
        <div className="flex gap-2"><button disabled={ocupado} className={`${button} bg-primary text-primary-foreground`} onClick={() => void importar()}>Confirmar importação</button><button disabled={ocupado} className={button} onClick={() => setPrevia(null)}>Cancelar prévia</button></div>
      </div>}
    </div></PopupDetalhe>}
    {!query.isLoading && !query.error && !salvo ? <div className="rounded-xl border border-dashed border-border p-10 text-center"><FileSpreadsheet className="mx-auto mb-3 text-muted-foreground" size={32} /><h3 className="font-semibold">Nenhum cronograma importado</h3><p className="text-sm text-muted-foreground mt-2">{readOnly ? 'O cronograma aparecerá aqui quando a equipe importar a planilha.' : 'Use Importar planilha para trazer as rotas, datas e equipes do Excel.'}</p></div> : analise && salvo && <>
      <Resumo valores={[[numeros.length, 'rotas'], [analise.visitas.length, 'visitas'], [analise.dias.length, 'dias de agenda'], [salvo.versao, 'versão atual']]} />
      <p className="text-xs text-muted-foreground">Fonte: {salvo.dados.arquivo} · Atualizado por {salvo.autor} em {new Date(salvo.atualizadoEm).toLocaleString('pt-BR')}. As correções são compartilhadas com a equipe.</p>
      <Avisos avisos={analise.avisos} />
      {aba === 'mapa' ? renderMapa?.(analise.visitas) : <div className="grid grid-cols-1 lg:grid-cols-[245px_minmax(0,1fr)] gap-5 min-w-0">
        <aside className="space-y-3 min-w-0"><label className="sr-only" htmlFor="busca-rotas">Buscar rota, comunidade ou pessoa</label><input id="busca-rotas" className={input} value={busca} onChange={e => setBusca(e.target.value)} placeholder="Rota, comunidade ou pessoa" />
          <nav aria-label="Rotas do cronograma" className="flex lg:flex-col gap-2 overflow-auto lg:max-h-[75vh] lg:pr-1">
            {rotasFiltradas.map(n => { const v = analise.visitas.filter(v => numeroRota(v.rota) === n); return <button key={n} onClick={() => setSelecionada(n)} aria-current={numero === n ? 'true' : undefined} className={`min-w-44 shrink-0 text-left rounded-xl border p-3 ${numero === n ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}>
              <span className="font-semibold text-sm">Rota {n}</span><span className="block text-xs mt-1">{v.map(x => x.organizacao).join(' · ') || 'Sem instituição'}</span><span className="block text-xs text-muted-foreground mt-2">{formatDateOnly(v[0]?.inicio ?? null)} — {formatDateOnly(v[0]?.fim ?? null)}</span>
            </button>; })}
          </nav>{!rotasFiltradas.length && <p className="text-sm text-muted-foreground">Nenhuma rota encontrada.</p>}
        </aside>
        <div className="min-w-0 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4"><h3 className="text-lg font-semibold">Rota {numero} <span className="text-sm font-normal text-muted-foreground">· {dias.length} dias na agenda</span></h3>
            <div className="grid sm:grid-cols-2 gap-3">{visitas.map(v => <article key={`${v.aba}:${v.linha}`} className="rounded-lg bg-muted/40 p-4">
              <div className="flex justify-between items-start gap-2"><h4 className="font-semibold text-sm"><button className="text-left hover:underline" aria-label={`Ver visita ${v.organizacao}`} onClick={() => mudarPopup(`visita:${v.linha}`)}>{v.organizacao}</button></h4>{!readOnly && <button className="p-1" aria-label={`Editar visita ${v.organizacao}`} onClick={() => editar(v, analise.instituicoes)}><Pencil size={14} /></button>}</div>
              <p className="text-xs text-muted-foreground mt-1">{v.municipio} · {v.uf}</p><p className="text-xs mt-3">Visita: {formatDateOnly(v.inicioVisita)} — {formatDateOnly(v.fimVisita)}</p><span className="inline-block rounded-full bg-background px-2 py-1 text-xs mt-2">{v.status || 'Status não informado'}</span>
            </article>)}</div>
          </div>
          <section className="space-y-3"><h3 className="font-semibold flex items-center gap-2"><CalendarDays size={17} /> Agenda diária e equipes</h3>
            {!dias.length && <p className="text-sm text-muted-foreground">Esta rota não tem dias na aba Cronograma.</p>}
            {dias.map(d => <article key={`${d.aba}:${d.linha}`} className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="flex gap-3 justify-between"><div><p className="font-semibold">{d.data ? formatDateOnly(d.data) : d.valores[0] || 'Data a confirmar'} <span className="text-sm text-muted-foreground font-normal">· {d.valores[1]}</span></p><h4 className="text-sm mt-1">{d.instituicao || 'Deslocamento / apoio logístico'}</h4></div>{!readOnly && <button className={button} aria-label={`Editar dia ${d.valores[0]}`} onClick={() => editar(d, analise.cronograma)}><Pencil size={14} /><span className="hidden sm:inline">Editar</span></button>}</div>
              <button className="text-sm whitespace-pre-wrap mt-3 text-left hover:underline" aria-label={`Ver dia ${d.valores[0]}`} onClick={() => mudarPopup(`dia:${d.linha}`)}>{d.atividade || 'Atividade a confirmar'}</button>
              <div className="grid sm:grid-cols-2 gap-3 mt-4"><Equipe titulo="Equipe SEMAS" nomes={d.equipeSemas} /><Equipe titulo="Nossa equipe" nomes={d.equipe} /></div>
              <dl className="grid sm:grid-cols-3 gap-3 text-xs mt-4">{[['Origem', d.origem], ['Transporte', d.modal], ['Pernoite', d.pernoite]].map(([label, value]) => <div key={label}><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap">{value || 'Não informado'}</dd></div>)}</dl>
              {d.valores[17]?.trim() && <p className="mt-3 text-xs whitespace-pre-wrap rounded-lg bg-muted/50 p-3">{d.valores[17]}</p>}
            </article>)}
          </section>
          <div className="grid sm:grid-cols-2 gap-3">
          <button className="rounded-xl border border-border bg-card p-4 text-left hover:bg-accent" onClick={() => mudarPopup(`visitas:${numero}`)}><Eye size={17} className="mb-2" /><span className="font-semibold text-sm">Todos os campos das visitas</span><span className="block text-xs text-muted-foreground mt-1">Consultar em pop-up</span></button>
          {blocos.map((b, i) => <button key={i} className="rounded-xl border border-border bg-card p-4 text-left hover:bg-accent" onClick={() => mudarPopup(`bloco:${numero}:${i}`)}><Eye size={17} className="mb-2" /><span className="font-semibold text-sm">{b.titulo}</span><span className="block text-xs text-muted-foreground mt-1">{b.tabela.linhas.length} registros · Abrir detalhes</span></button>)}
          </div>
          {!detalhe && <p className="text-sm text-muted-foreground">Não há aba de logística detalhada para esta rota.</p>}
        </div>
      </div>}
    </>}
    {conteudo && <PopupDetalhe titulo={conteudo.titulo} descricao="Consulte os detalhes sem sair do cronograma." largo aoFechar={() => mudarPopup(null)}>
      {conteudo.tabela.linhas.length === 1 ? <>
        <dl className="grid sm:grid-cols-2 gap-4">{conteudo.tabela.cabecalhos.map((titulo, i) => <div key={i} className="min-w-0 border-b border-border pb-3"><dt className="text-xs text-muted-foreground">{titulo || 'Tipo de comunidade'}</dt><dd className="text-sm whitespace-pre-wrap break-words mt-1">{conteudo.tabela.linhas[0].valores[i] || 'Não informado'}</dd></div>)}</dl>
        {!readOnly && <button className={`${button} mt-4`} onClick={() => editar(conteudo.tabela.linhas[0], conteudo.tabela)}><Pencil size={14} /> Editar registro</button>}
      </> : <Tabela tabela={conteudo.tabela} editar={readOnly ? undefined : editar} />}
    </PopupDetalhe>}
    {edicao && <EditarLinha key={`${edicao.linha.aba}:${edicao.linha.linha}:${edicao.versao}`} edicao={edicao} aoFechar={() => setEdicao(null)} aoSalvar={async alteracoes => {
      const atualizado = await salvarLinhaRotas({ data: { versao: edicao.versao, aba: edicao.linha.aba, linha: edicao.linha.linha, alteracoes } });
      client.setQueryData(['cronograma-rotas'], atualizado); setEdicao(null); toast.success('Correção salva para a equipe.');
    }} />}
  </section>;
}

function Resumo({ valores }: { valores: [number, string][] }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{valores.map(([n, label]) => <div key={label} className="rounded-xl border border-border bg-card p-4"><p className="text-2xl font-semibold">{n}</p><p className="text-xs text-muted-foreground mt-1">{label}</p></div>)}</div>;
}
function Equipe({ titulo, nomes }: { titulo: string; nomes: string }) {
  return <div className="rounded-lg bg-muted/40 p-3"><p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2"><Users size={13} />{titulo}</p><div className="flex gap-1.5 flex-wrap">{nomes.trim() ? nomes.split(/[,;\n]+/).map((nome, i) => <span key={i} className="rounded-full bg-background border border-border px-2 py-1 text-xs">{nome.trim()}</span>) : <span className="text-xs">A confirmar</span>}</div></div>;
}
function Avisos({ avisos }: { avisos: string[] }) {
  return avisos.length ? <details className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"><summary className="cursor-pointer text-sm font-medium">Conferências da planilha ({avisos.length})</summary><ul className="list-disc pl-5 mt-3 space-y-1 text-xs">{avisos.map((a, i) => <li key={i}>{a}</li>)}</ul></details> : null;
}
function Tabela({ tabela, editar }: { tabela: TabelaRotas; editar?: (l: LinhaRotas, t: TabelaRotas) => void }) {
  const indices = Array.from({ length: Math.max(tabela.cabecalhos.length, ...tabela.linhas.map(l => l.valores.length)) }, (_, i) => i).filter(i => tabela.linhas.some(l => l.valores[i]?.trim()));
  return <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr>{indices.map(i => <th key={i} className="text-left p-2 border-b border-border min-w-28">{tabela.cabecalhos[i] || `Coluna ${i + 1}`}</th>)}{editar && <th className="p-2">Ações</th>}</tr></thead><tbody>{tabela.linhas.map(l => <tr key={l.linha}>{indices.map(i => <td key={i} className="p-2 border-b border-border align-top whitespace-pre-wrap min-w-28 max-w-80 break-words">{l.valores[i] === 'TRUE' ? <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} />Feito</span> : l.valores[i] === 'FALSE' ? 'Pendente' : l.valores[i] || '—'}</td>)}{editar && <td className="p-2 align-top"><button aria-label={`Editar ${tabela.aba}, linha ${l.linha + 1}`} className={button} onClick={() => editar(l, tabela)}><Pencil size={13} /></button></td>}</tr>)}</tbody></table></div>;
}
function EditarLinha({ edicao, aoFechar, aoSalvar }: { edicao: Edicao; aoFechar: () => void; aoSalvar: (alteracoes: Record<string, string>) => Promise<void> }) {
  const pessoas = usePeople();
  const [valores, setValores] = useState([...edicao.linha.valores]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const largura = Math.max(edicao.tabela.cabecalhos.length, valores.length);
  const salvar = async () => {
    if (salvando) return;
    const alteracoes = Object.fromEntries(valores.flatMap((v, i) => v !== (edicao.linha.valores[i] ?? '') ? [[String(i), v]] : []));
    if (!Object.keys(alteracoes).length) { aoFechar(); return; }
    setSalvando(true); setErro('');
    try { await aoSalvar(alteracoes); } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar.'); } finally { setSalvando(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !salvando) aoFechar(); }}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar {edicao.tabela.aba}</DialogTitle><DialogDescription>Linha {edicao.linha.linha + 1} da fonte. As correções serão compartilhadas com a equipe.</DialogDescription></DialogHeader>
    <form onSubmit={e => { e.preventDefault(); void salvar(); }} className="space-y-4"><div className="grid sm:grid-cols-2 gap-4">{Array.from({ length: largura }, (_, i) => {
      const titulo = edicao.tabela.cabecalhos[i] || (edicao.linha.aba === 'Cronograma' && i === 4 ? 'Tipo de comunidade' : `Coluna ${i + 1}`);
      const isData = /^data(?: |$)/.test(chaveRotas(titulo));
      const alterar = (valor: string) => setValores(v => { const copy = [...v]; while (copy.length <= i) copy.push(''); copy[i] = valor; return copy; });
      return <label key={i} className="text-xs space-y-1"><span className="block font-medium">{titulo}</span>
      {['TRUE', 'FALSE'].includes(valores[i]) ? <select disabled={salvando} className={input} value={valores[i]} onChange={e => alterar(e.target.value)}><option value="TRUE">Feito</option><option value="FALSE">Pendente</option></select>
        : isData ? <input type="date" disabled={salvando} className={input} value={dataDaPlanilha(valores[i] ?? '') ?? ''} onChange={e => alterar(e.target.value ? e.target.value.split('-').reverse().join('/') : '')} />
        : <textarea disabled={salvando || chaveRotas(titulo) === 'dia da semana'} rows={2} className={input} value={valores[i] ?? ''} onChange={e => alterar(e.target.value)} />}
    </label>; })}</div>
    {pessoas.length > 0 && <p className="text-xs text-muted-foreground">Equipe interna cadastrada: {pessoas.map(p => p.name).join(', ')}. Pessoas externas podem ser informadas nas equipes e responsáveis.</p>}
    {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}<div className="flex gap-2 justify-end"><button type="button" disabled={salvando} className={button} onClick={aoFechar}>Cancelar</button><button type="submit" disabled={salvando} className={`${button} bg-primary text-primary-foreground`}>{salvando ? 'Salvando…' : 'Salvar correções'}</button></div></form>
  </DialogContent></Dialog>;
}
