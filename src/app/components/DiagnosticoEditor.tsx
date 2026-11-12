import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Lock, CopyPlus, PencilLine } from 'lucide-react';
import { getDiagnostico, concluirDiagnostico, criarNovaVersaoDiagnostico, type DiagnosticoStatus } from '../diagnosticos.server';
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
import './diagnostic/painel-diagnostico.css';
import { NavegacaoModulo } from './NavegacaoModulo';
import { PendenciasModulo, navegarSemPendencias } from './PendenciasModulo';
import { EvidenciasDiagnosticoPanel } from './diagnostic/EvidenciasDiagnosticoPanel';
import { EditorInformacoesDiagnostico } from './diagnostic/EditorInformacoesDiagnostico';
import { PlanilhaCaderno } from './diagnostic/PlanilhaCaderno';
import { PlanilhaCesta } from './diagnostic/PlanilhaCesta';
import { IDENTIFICACAO_CADERNO, QUESTIONARIO_CADERNO, COMPLEMENTARES_CADERNO, EVIDENCIAS_CADERNO } from '../diagnostic/catalog/cadernoCria';
import { lerModoPreenchimento, guardarModoPreenchimento, type ModoPreenchimento } from '../diagnostic/modoPreenchimento';

const STATUS_LABEL: Record<DiagnosticoStatus, string> = { em_edicao: 'Em edição', concluido: 'Concluído' };

type TabId = InstrumentoDiagnostico;
const TABS: { id: TabId; label: string }[] = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'matriz', label: 'Matriz' },
  { id: 'ieo', label: 'IEO' },
  { id: 'cesta', label: 'Cesta' },
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
  onHistorico?: () => void;
}

export function DiagnosticoEditor(props: DiagnosticoEditorProps) {
  const [haPendencias, setHaPendencias] = useState(false);
  return <PendenciasModulo key={props.diagnosticoId} aoPendencias={setHaPendencias}><ConteudoDiagnosticoEditor {...props} haPendencias={haPendencias}/></PendenciasModulo>;
}

function ConteudoDiagnosticoEditor({ diagnosticoId, organizacaoId, onBack, onNovaVersao, incorporado = false, instrumentoInicial = 'resumo', rotuloVoltar = 'Voltar', instrumentoAtual, onMudarInstrumento, onExcluido, onHistorico, haPendencias }: DiagnosticoEditorProps & { haPendencias: boolean }) {
  const [modo, setModo] = useState<ModoPreenchimento>(()=>lerModoPreenchimento(diagnosticoId));
  const [abaPlanilha, setAbaPlanilha] = useState<'matriz'|'ieo'|'cesta'>('matriz');
  const [tabLocal, setTabLocal] = useState<TabId>(instrumentoInicial);
  const tab = instrumentoAtual ?? tabLocal;
  const [evidenciasAberto, setEvidenciasAberto] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [secaoEditor, setSecaoEditor] = useState<'Dados gerais' | 'Evidências' | 'Implantação' | 'Matriz Funcional' | 'Questões do IEO' | 'Produtos e serviços'>('Dados gerais');
  const [registroEditor, setRegistroEditor] = useState<string | undefined>();
  const setTab = (instrumento: TabId) => { if (instrumento === tab) return; navegarSemPendencias(haPendencias, () => { if (onMudarInstrumento) onMudarInstrumento(instrumento); else setTabLocal(instrumento); }); };
  const { readOnly } = useAuth();
  const queryClient = useQueryClient();
  const { data: comunidades = [] } = useQuery({ queryKey: ['comunidades'], queryFn: () => listarComunidades() });
  const { data: diagnostico, isLoading, error, refetch } = useQuery({
    queryKey: ['diagnostico', diagnosticoId, organizacaoId ?? null],
    queryFn: () => getDiagnostico({ data: { id: diagnosticoId, comunidadeId: organizacaoId } }),
  });
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
    <div className={`diagnostico-painel diagnostico-editor ${tab === 'matriz' ? 'diagnostico-editor-matriz-neutra' : ''} ${incorporado ? 'flex flex-col min-w-0' : 'flex flex-col h-full min-h-0 overflow-hidden'}`}>
      <div className={`flex min-w-0 flex-col flex-shrink-0 ${incorporado ? '' : 'gap-3 px-3 sm:px-7 pt-4 pb-0'}`}>
        {!incorporado && <nav aria-label="Caminho do mapeamento" className="flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => navegarSemPendencias(haPendencias, onBack)} className="flex items-center gap-1 hover:underline" style={{ color: 'var(--ink-4)' }}><ArrowLeft size={12} /> {rotuloVoltar}</button>
          <span aria-hidden>›</span><span aria-current="page">{tab === 'parecer' ? 'Parecer Técnico' : TABS.find(t => t.id === tab)?.label}</span>
        </nav>}
        <div className={`flex flex-wrap items-center justify-between gap-3 ${incorporado ? 'diagnostico-contexto px-4 sm:px-6 py-4' : 'pb-3'}`}>
          <div className={incorporado ? 'diagnostico-contexto-grid' : ''}>
            {incorporado ? <>
              <div><span>Versão</span><strong>{diagnostico?.versao ?? '—'}</strong>{onHistorico && <button type="button" className="block text-xs text-primary underline" onClick={onHistorico}>Ver todas as Versões</button>}</div>
              <div><span>Aplicação</span><strong>{diagnostico ? formatDateOnly(diagnostico.dataAplicacao) : '—'}</strong></div>
              <div><span>Última edição</span><strong>{diagnostico?.atualizadoEm ? new Date(diagnostico.atualizadoEm).toLocaleString('pt-BR') : '—'}</strong></div>
              <div><span>Status</span><strong>{diagnostico ? STATUS_LABEL[diagnostico.status] : '—'}</strong></div>
            </> : <>
              <p className="diagnostico-sobretitulo">Inova Sociobio · Diagnóstico organizacional</p>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.8rem', color: 'var(--ink-1)' }}>
                {comunidades.find(c => c.id === diagnostico?.comunidadeId)?.nome ?? 'Mapeamento organizacional'}
              </h2>
              <p style={{ color: 'var(--ink-4)', fontSize: '0.78rem', marginTop: 2 }}>
                Aplicação {diagnostico ? formatDateOnly(diagnostico.dataAplicacao) : '—'} · Versão {diagnostico?.versao ?? '—'}
                {diagnostico?.atualizadoEm && <> · Última edição {new Date(diagnostico.atualizadoEm).toLocaleString('pt-BR')}</>} · Status {diagnostico ? STATUS_LABEL[diagnostico.status] : '—'}
              </p>
            </>}
          </div>
          {diagnostico && (
            <div className="diagnostico-acoes flex min-w-0 flex-wrap items-center gap-2">
              {onExcluido && <ExcluirDiagnosticoButton diagnostico={diagnostico} nomeOrganizacao={comunidades.find(c => c.id === diagnostico.comunidadeId)?.nome ?? 'Organização'} onExcluido={onExcluido} bloqueado={haPendencias} />}
              <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium" onClick={() => navegarSemPendencias(haPendencias, () => { setRegistroEditor(undefined); setSecaoEditor(tab === 'matriz' ? 'Matriz Funcional' : tab === 'ieo' ? 'Questões do IEO' : tab === 'cesta' ? 'Produtos e serviços' : 'Dados gerais'); setEditorAberto(true); })}>
                <PencilLine size={14} aria-hidden /> Editar informações
              </button>
              {!readOnly && (diagnostico.status === 'em_edicao' ? (
                <button
                  onClick={() => { if (window.confirm('Concluir este mapeamento? Para alterar depois, será preciso criar uma nova versão.')) concluir.mutate(); }}
                  disabled={concluir.isPending || haPendencias}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-60"
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
        {instrumentoInicial !== 'parecer' && <div className="mb-3 flex flex-wrap items-center gap-2 text-sm"><span>Modo de preenchimento:</span>{(['plataforma','planilha'] as const).map(m=><button key={m} type="button" aria-pressed={modo===m} className={`rounded border px-3 py-1.5 ${modo===m?'bg-primary text-primary-foreground':''}`} onClick={()=>navegarSemPendencias(haPendencias,()=>{setModo(m);guardarModoPreenchimento(diagnosticoId,m);})}>{m==='plataforma'?'Plataforma':'Planilha'}</button>)}</div>}
        {instrumentoInicial !== 'parecer' && modo==='plataforma' && <NavegacaoModulo abas={TABS} atual={tab} aoMudar={setTab} rotulo="Módulos do diagnóstico" bloqueado={haPendencias} className={tab === 'matriz' ? 'modulo-abas-matriz-neutras' : ''}/>}
        <div className={`diagnostico-conteudo${instrumentoInicial !== 'parecer' ? ' diagnostico-conteudo-com-menu modulo-bloco' : ''}`}>
        {haPendencias && <p role="status" className="mb-4 rounded-lg border bg-muted px-3 py-2 text-sm">Alterações não salvas. Salve ou cancele antes de navegar.</p>}
        {isLoading && <p role="status">Carregando mapeamento…</p>}
        {error && <p role="alert">Não foi possível abrir o mapeamento. <button type="button" onClick={() => void refetch()}>Tentar novamente</button></p>}
        {modo==='planilha' && instrumentoInicial!=='parecer' && diagnostico && <div className="space-y-4"><p className="text-sm">Preencha as três abas. O mapeamento permanece em edição para revisão.</p><nav aria-label="Abas da planilha" className="flex flex-wrap gap-2">{(['matriz','ieo','cesta'] as const).map(a=><button key={a} type="button" aria-pressed={abaPlanilha===a} className={`rounded border px-4 py-2 text-sm ${abaPlanilha===a?'bg-primary text-primary-foreground':''}`} onClick={()=>navegarSemPendencias(haPendencias,()=>setAbaPlanilha(a))}>{a==='ieo'?'IEO':a==='matriz'?'Matriz':'Cesta'}</button>)}</nav>{abaPlanilha==='matriz'&&<MatrizFuncionalTab diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly||diagnostico.status==='concluido'} modoPlanilha/>}{abaPlanilha==='ieo'&&<PlanilhaCaderno diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly||diagnostico.status==='concluido'} itens={[...IDENTIFICACAO_CADERNO,...QUESTIONARIO_CADERNO,...COMPLEMENTARES_CADERNO,...EVIDENCIAS_CADERNO]}/>}{abaPlanilha==='cesta'&&<PlanilhaCesta diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly||diagnostico.status==='concluido'}/>}</div>}
        {(modo==='plataforma'||instrumentoInicial==='parecer') && tab === 'resumo' && diagnostico && <div className="space-y-6">
          <ResumoDiagnostico diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId}
            readOnly={readOnly || diagnostico.status === 'concluido'} onConsultarIeo={() => setTab('ieo')} onConsultarParecer={() => setTab('parecer')} />
        </div>}
        {modo==='plataforma' && tab === 'matriz' && diagnostico && <MatrizFuncionalTab diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} />}
        {modo==='plataforma' && tab === 'ieo' && diagnostico && (
          <QuestionarioCaderno diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        {modo==='plataforma' && tab === 'cesta' && diagnostico && (
          <CestaCaderno diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} bloqueado={haPendencias} aoEditarImplantacao={(operacao,codigo)=>{setRegistroEditor(`${operacao}:${codigo}`);setSecaoEditor('Implantação');setEditorAberto(true);}} />
        )}
        {(modo==='plataforma'||instrumentoInicial==='parecer') && tab === 'parecer' && diagnostico && (
          <ParecerTecnicoTab diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} />
        )}
        </div>
      </div>
      {diagnostico && evidenciasAberto && <EvidenciasDiagnosticoPanel diagnosticoId={diagnosticoId} readOnly={readOnly || diagnostico.status === 'concluido'} aoFechar={() => setEvidenciasAberto(false)} aoGerenciar={() => { setEvidenciasAberto(false); setSecaoEditor('Evidências'); setEditorAberto(true); }} />}
      {diagnostico && editorAberto && <EditorInformacoesDiagnostico diagnostico={diagnostico} diagnosticoId={diagnosticoId} organizacaoId={diagnostico.comunidadeId} readOnly={readOnly || diagnostico.status === 'concluido'} haPendencias={haPendencias} secaoInicial={secaoEditor} registroInicial={secaoEditor==='Implantação'?registroEditor:undefined} aoFechar={() => setEditorAberto(false)} aoGerenciarEvidencias={() => { setEditorAberto(false); setEvidenciasAberto(true); }} />}
    </div>
  );
}
