import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Download, ArrowLeft, Lock, CopyPlus, FileCheck2, PencilLine } from 'lucide-react';
import { getDadosCompletosDiagnostico, getDiagnostico, concluirDiagnostico, criarNovaVersaoDiagnostico, type DiagnosticoStatus } from '../diagnosticos.server';
import { formatDateOnly } from '../lib/dateOnly';
import type { InstrumentoDiagnostico } from '../lib/navegacaoApp';
import { ExcluirDiagnosticoButton } from './diagnostic/ExcluirDiagnosticoButton';
import { MatrizFuncionalTab } from './diagnostic/MatrizFuncionalTab';
import { QuestionarioCaderno } from './diagnostic/QuestionarioCaderno';
import { CestaCaderno } from './diagnostic/CestaCaderno';
import { ParecerTecnicoTab } from './diagnostic/ParecerTecnicoTab';
import { ResumoDiagnostico } from './diagnostic/ResumoDiagnostico';
import { useAuth } from '../auth/authStore';
import { listarComunidades } from '../comunidades.server';
import { listarRespostasMatriz, listarProdutos, getParecer, listarChecklist } from '../diagnosticos.server';
import { FUNCOES_MATRIZ } from '../diagnostic/catalog/matrizPrototipo';
import { PARECER_GRUPOS } from '../diagnostic/catalog/parecerComplementar';
import { CHECKLIST_DOCUMENTAL } from '../diagnostic/catalog/checklistDocumental';
import { calcularIeoCaderno } from '../diagnostic/ieoCaderno';
import { useCaderno } from './diagnostic/CadernoItens';
import './diagnostic/painel-diagnostico.css';
import { NavegacaoModulo } from './NavegacaoModulo';
import { PendenciasModulo, navegarSemPendencias } from './PendenciasModulo';
import { EvidenciasDiagnosticoPanel } from './diagnostic/EvidenciasDiagnosticoPanel';
import { EditorInformacoesDiagnostico } from './diagnostic/EditorInformacoesDiagnostico';

const STATUS_LABEL: Record<DiagnosticoStatus, string> = { em_edicao: 'Em edição', concluido: 'Concluído' };

type TabId = InstrumentoDiagnostico;
const TABS: { id: TabId; label: string }[] = [
  { id: 'matriz', label: 'Matriz' },
  { id: 'ieo', label: 'IEO' },
  { id: 'cesta', label: 'Cesta' },
  { id: 'resumo', label: 'Resumo' },
];

interface DiagnosticoEditorProps {
  diagnosticoId: string;
  organizacaoId?: string;
  onBack: () => void;
  onNovaVersao: (novoDiagnosticoId: string) => void;
  incorporado?: boolean;
  instrumentoInicial?: TabId;
  rotuloVoltar?: string;
  instrumentoAtual?: TabId;
  onMudarInstrumento?: (instrumento: TabId) => void;
  onExcluido?: () => void;
}

export function DiagnosticoEditor(props: DiagnosticoEditorProps) {
  const [haPendencias, setHaPendencias] = useState(false);
  return <PendenciasModulo key={props.diagnosticoId} aoPendencias={setHaPendencias}><ConteudoDiagnosticoEditor {...props} haPendencias={haPendencias}/></PendenciasModulo>;
}

function ConteudoDiagnosticoEditor({ diagnosticoId, organizacaoId, onBack, onNovaVersao, incorporado = false, instrumentoInicial = 'resumo', rotuloVoltar = 'Voltar', instrumentoAtual, onMudarInstrumento, onExcluido, haPendencias }: DiagnosticoEditorProps & { haPendencias: boolean }) {
  const [tabLocal, setTabLocal] = useState<TabId>(instrumentoInicial);
  const tab = instrumentoAtual ?? tabLocal;
  const [evidenciasAberto, setEvidenciasAberto] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [secaoEditor, setSecaoEditor] = useState<'Dados gerais' | 'Evidências'>('Dados gerais');
  const setTab = (instrumento: TabId) => { if (instrumento === tab) return; navegarSemPendencias(haPendencias, () => { if (onMudarInstrumento) onMudarInstrumento(instrumento); else setTabLocal(instrumento); }); };
  const { readOnly } = useAuth();
  const [baixando,setBaixando] = useState(false);
  const queryClient = useQueryClient();
  const { data: comunidades = [] } = useQuery({ queryKey: ['comunidades'], queryFn: () => listarComunidades() });
  const { data: diagnostico, isLoading, error, refetch } = useQuery({
    queryKey: ['diagnostico', diagnosticoId, organizacaoId ?? null],
    queryFn: () => getDiagnostico({ data: { id: diagnosticoId, comunidadeId: organizacaoId } }),
  });
  const matrizProgresso = useQuery({ queryKey: ['diagnostico-matriz', diagnosticoId], queryFn: () => listarRespostasMatriz({ data: { diagnosticoId } }) });
  const ieoProgresso = useCaderno({ diagnosticoId, organizacaoId: diagnostico?.comunidadeId ?? organizacaoId ?? '' });
  const cestaProgresso = useQuery({ queryKey: ['diagnostico-produtos', diagnosticoId], queryFn: () => listarProdutos({ data: { diagnosticoId } }) });
  const parecerProgresso = useQuery({ queryKey: ['diagnostico-parecer', diagnosticoId], queryFn: () => getParecer({ data: { diagnosticoId } }) });
  const checklistProgresso = useQuery({ queryKey: ['diagnostico-checklist', diagnosticoId], queryFn: () => listarChecklist({ data: { diagnosticoId } }) });
  const funcoesAvaliadas = FUNCOES_MATRIZ.filter(f => {
    const r = matrizProgresso.data?.find(item => item.funcaoId === f.id);
    return Boolean(r?.atuacao.length && r.experiencia && r.criticidade && r.interesse);
  }).length;
  const ieoResultado = calcularIeoCaderno(ieoProgresso.data ?? []);
  const percentualMatriz = funcoesAvaliadas / FUNCOES_MATRIZ.length;
  const percentualIeo = ieoResultado.total ? ieoResultado.respondidas / ieoResultado.total : 0;
  const produtos = cestaProgresso.data ?? [];
  const percentualCesta = produtos.length ? produtos.filter(p => p.statusPreenchimento === 'completo').length / produtos.length : 0;
  const camposParecer = PARECER_GRUPOS.flatMap(g => g.campos);
  const respostasParecer = parecerProgresso.data?.respostasComplementares ?? {};
  const respondidasParecer = camposParecer.filter(c => {
    const value = respostasParecer[c.id];
    return Array.isArray(value) ? value.length > 0 : Boolean(value?.trim());
  }).length;
  const analiseParecer = ['sintese', 'capacidades', 'fragilidades', 'pontosPrioritarios', 'consideracoesTecnicas'] as const;
  const analiseRespondida = analiseParecer.filter(c => Boolean(parecerProgresso.data?.[c]?.trim())).length;
  const documentosRespondidos = (checklistProgresso.data ?? []).filter(item => item.disponivel !== null).length;
  const totalParecer = camposParecer.length + analiseParecer.length + CHECKLIST_DOCUMENTAL.length;
  const percentualParecer = totalParecer ? (respondidasParecer + analiseRespondida + documentosRespondidos) / totalParecer : 0;
  const percentualProgresso = Math.round((percentualMatriz + percentualIeo + percentualCesta + percentualParecer) / 4 * 100);

  const concluir = useMutation({
    mutationFn: () => concluirDiagnostico({ data: { id: diagnosticoId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico', diagnosticoId] });
      queryClient.invalidateQueries({ queryKey: ['diagnosticos'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostico-visao-geral'] });
      toast.success('Mapeamento concluído. Para alterar, crie uma nova versão.');
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível concluir o mapeamento.'),
  });

  const novaVersao = useMutation({
    mutationFn: () => criarNovaVersaoDiagnostico({ data: { diagnosticoAnteriorId: diagnosticoId } }),
    onSuccess: novo => {
      queryClient.invalidateQueries({ queryKey: ['diagnosticos'] });
      queryClient.invalidateQueries({ queryKey: ['diagnostico-visao-geral'] });
      toast.success(`Versão ${novo.versao} criada — o conjunto anterior foi copiado e está editável.`);
      onNovaVersao(novo.id);
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível criar a nova versão.'),
  });

  return (
    <div className={`diagnostico-painel diagnostico-editor ${incorporado ? 'flex flex-col min-w-0' : 'flex flex-col h-full min-h-0 overflow-hidden'}`}>
      <div className={`flex min-w-0 flex-col flex-shrink-0 border-b ${incorporado ? '' : 'gap-3 px-3 sm:px-7 pt-4 pb-0'}`} style={{ borderColor: 'var(--border)' }}>
        {!incorporado && <nav aria-label="Caminho do mapeamento" className="flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => navegarSemPendencias(haPendencias, onBack)} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--ink-4)' }}><ArrowLeft size={12} /> {rotuloVoltar}</button>
          <span aria-hidden>›</span><span aria-current="page">{tab === 'parecer' ? 'Parecer Técnico' : TABS.find(t => t.id === tab)?.label}</span>
        </nav>}
        <div className={`flex flex-wrap items-center justify-between gap-3 ${incorporado ? 'diagnostico-contexto px-4 sm:px-6 py-4' : 'pb-3'}`}>
          <div className={incorporado ? 'diagnostico-contexto-grid' : ''}>
            {incorporado ? <>
              <div><span>Aplicação</span><strong>{diagnostico ? formatDateOnly(diagnostico.dataAplicacao) : '—'}</strong></div>
              <div><span>Versão</span><strong>{diagnostico?.versao ?? '—'}</strong></div>
              <div><span>Última edição</span><strong>{diagnostico?.atualizadoEm ? new Date(diagnostico.atualizadoEm).toLocaleString('pt-BR') : '—'}</strong></div>
              <div title="Média do preenchimento da Matriz, IEO, Cesta de Produtos e Parecer"><span>Andamento</span><strong className="inline-flex items-center gap-2"><span className="project-summary-progress" aria-hidden="true"><span style={{ width: `${percentualProgresso}%` }} /></span>{percentualProgresso}%</strong></div>
            </> : <>
              <p className="diagnostico-sobretitulo">Inova Sociobio · Diagnóstico organizacional</p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.8rem', color: 'var(--ink-1)' }}>
                {comunidades.find(c => c.id === diagnostico?.comunidadeId)?.nome ?? 'Mapeamento organizacional'}
              </h2>
              <p style={{ color: 'var(--ink-4)', fontSize: '0.78rem', marginTop: 2 }}>
                Aplicação {diagnostico ? formatDateOnly(diagnostico.dataAplicacao) : '—'} · Versão {diagnostico?.versao ?? '—'}
                {diagnostico?.atualizadoEm && <> · Última alteração salva em {new Date(diagnostico.atualizadoEm).toLocaleString('pt-BR')}</>}
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs font-semibold" title="Média do preenchimento da Matriz, IEO, Cesta de Produtos e Parecer" style={{ color: 'var(--ink-3)' }}><span>Andamento</span><span className="project-summary-progress" aria-hidden="true"><span style={{ width: `${percentualProgresso}%` }} /></span>{percentualProgresso}%</p>
            </>}
          </div>
          {diagnostico && (
            <div className="diagnostico-acoes flex min-w-0 flex-wrap items-center gap-2">
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium" onClick={() => navegarSemPendencias(haPendencias, () => setEvidenciasAberto(true))}>
                <FileCheck2 size={14} aria-hidden /> Evidências
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium" onClick={() => navegarSemPendencias(haPendencias, () => { setSecaoEditor('Dados gerais'); setEditorAberto(true); })}>
                <PencilLine size={14} aria-hidden /> Editar informações
              </button>
              <button type="button" aria-label={tab === 'parecer' ? 'Baixar parecer em PDF' : 'Baixar mapeamento em PDF'} title={tab === 'parecer' ? 'Baixar parecer em PDF' : 'Baixar mapeamento em PDF'} disabled={baixando} className="rounded-lg p-2.5 text-white shadow-sm disabled:opacity-60" style={{background:'var(--primary)'}} onClick={async()=>{
                setBaixando(true);
                try {
                  const dados=await getDadosCompletosDiagnostico({data:{diagnosticoId}});
                  const {buildDiagnosticoReportModel,exportDiagnosticoReportPdf}=await import('../lib/diagnosticReportExport');
                  exportDiagnosticoReportPdf(buildDiagnosticoReportModel(tab === 'parecer' ? 'Parecer Técnico' : 'Mapeamento Organizacional',[dados],tab === 'parecer' ? ['identificacao','parecer'] : ['identificacao','matriz','ieo','cesta']));
                } catch(e){toast.error(e instanceof Error ? e.message : 'Não foi possível baixar o PDF.');}
                finally{setBaixando(false);}
              }}><span className="flex items-center gap-2 text-xs font-medium"><Download size={16} className={baixando ? 'animate-pulse' : undefined} aria-hidden />{baixando ? 'Preparando relatório…' : 'Baixar relatório completo'}</span></button>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  color: diagnostico.status === 'concluido' ? 'var(--success)' : 'var(--brand)',
                  background: diagnostico.status === 'concluido' ? 'var(--success-soft)' : 'var(--brand-soft)',
                }}
              >
                {STATUS_LABEL[diagnostico.status]}
              </span>
              {onExcluido && <ExcluirDiagnosticoButton diagnostico={diagnostico} nomeOrganizacao={comunidades.find(c => c.id === diagnostico.comunidadeId)?.nome ?? 'Organização'} onExcluido={onExcluido} bloqueado={haPendencias} />}
              {!readOnly && (diagnostico.status === 'em_edicao' ? (
                <button
                  onClick={() => { if (window.confirm('Concluir este mapeamento? Para alterar depois, será preciso criar uma nova versão.')) concluir.mutate(); }}
                  disabled={concluir.isPending || haPendencias}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-white disabled:opacity-60"
                  style={{ background: 'var(--primary)' }}
                >
                  <Lock size={12} /> Concluir mapeamento
                </button>
              ) : (
                <button
                  onClick={() => { if (window.confirm('Criar uma nova versão? Uma cópia editável de Matriz, IEO, Cesta e Parecer será criada a partir desta versão concluída.')) novaVersao.mutate(); }}
                  disabled={novaVersao.isPending || haPendencias}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[12px] font-medium disabled:opacity-60"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                >
                  <CopyPlus size={12} /> Criar nova versão
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={`diagnostico-editor-corpo ${incorporado ? 'p-3 sm:p-6 min-w-0' : 'flex-1 min-h-0 overflow-y-auto p-3 sm:p-6'}`}>
        {instrumentoInicial !== 'parecer' && <NavegacaoModulo abas={TABS} atual={tab} aoMudar={setTab} rotulo="Módulos do diagnóstico" bloqueado={haPendencias}/>}
        <div className={`diagnostico-conteudo${instrumentoInicial !== 'parecer' ? ' diagnostico-conteudo-com-menu modulo-bloco' : ''}`}>
        {haPendencias && <p role="status" className="mb-4 rounded-lg border bg-muted px-3 py-2 text-sm">Alterações não salvas. Salve ou cancele antes de navegar.</p>}
        {isLoading && <p role="status">Carregando mapeamento…</p>}
        {error && <p role="alert">Não foi possível abrir o mapeamento. <button type="button" onClick={() => void refetch()}>Tentar novamente</button></p>}
        {tab === 'resumo' && diagnostico && <div className="space-y-6">
          <ResumoDiagnostico diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId}
            readOnly={readOnly || diagnostico.status === 'concluido'} onConsultarIeo={() => setTab('ieo')} onConsultarParecer={() => setTab('parecer')} />
        </div>}
        {tab === 'matriz' && diagnostico && (
          <MatrizFuncionalTab diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        {tab === 'ieo' && diagnostico && (
          <QuestionarioCaderno diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        {tab === 'cesta' && diagnostico && (
          <CestaCaderno diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} bloqueado={haPendencias} />
        )}
        {tab === 'parecer' && diagnostico && (
          <ParecerTecnicoTab diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        </div>
      </div>
      {diagnostico && evidenciasAberto && <EvidenciasDiagnosticoPanel diagnosticoId={diagnosticoId} readOnly={readOnly || diagnostico.status === 'concluido'} aoFechar={() => setEvidenciasAberto(false)} aoGerenciar={() => { setEvidenciasAberto(false); setSecaoEditor('Evidências'); setEditorAberto(true); }} />}
      {diagnostico && editorAberto && <EditorInformacoesDiagnostico diagnostico={diagnostico} diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} haPendencias={haPendencias} secaoInicial={secaoEditor} aoFechar={() => setEditorAberto(false)} aoGerenciarEvidencias={() => { setEditorAberto(false); setEvidenciasAberto(true); }} />}
    </div>
  );
}
