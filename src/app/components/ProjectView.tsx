import { useEffect, useState } from 'react';
import {
  FileText,
  Users,
  ClipboardList,
  DollarSign,
  ShieldAlert,
  GitBranch,
  ClipboardCheck,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  Info,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Project } from '../data/mockData';
import { type ProjectExt } from '../store';
import { useStore } from '../store';
import { useAuth } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';
import { ProjectSummaryHeader } from './project-tabs/ProjectSummaryHeader';
import { TabDescricao } from './project-tabs/TabDescricao';
import { TabContatos } from './project-tabs/TabContatos';
import { TabPlanoTrabalho } from './plano/TabPlanoTrabalho';
import { PainelParecer } from './plano/PainelParecer';
import { TabFinanceiro } from './project-tabs/TabFinanceiro';
import { TabRiscos } from './project-tabs/TabRiscos';
import { TabMudancas } from './project-tabs/TabMudancas';

/**
 * As quatro seções do RF-001, nesta ordem. Substituem as cinco abas antigas:
 * o Dashboard virou o resumo compacto do cabeçalho (RF-004), Monitoramento de
 * Metas e Cronograma passam a ser as visões Tabela e Gantt dentro do Plano de
 * Trabalho, e Financeiro passa a se chamar Orçamento.
 */
type TabId = 'descricao' | 'contato' | 'plano' | 'orcamento';

const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
  { id: 'descricao',  label: 'Descrição',         icon: FileText },
  { id: 'contato',    label: 'Contato',           icon: Users },
  { id: 'plano',      label: 'Plano de Trabalho', icon: ClipboardList },
  { id: 'orcamento',  label: 'Orçamento',         icon: DollarSign },
];

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  'Em andamento': { color: 'var(--brand)', bg: 'var(--brand-soft)', dot: 'var(--brand)' },
  'Concluído':    { color: 'var(--success)', bg: 'var(--success-soft)', dot: 'var(--success)' },
  'Atrasado':     { color: 'var(--danger)', bg: 'var(--danger-soft)', dot: 'var(--danger)' },
  'Não iniciado': { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' },
};

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
}

export function ProjectView({ project: initial, onBack }: ProjectViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('plano');
  const [panel, setPanel] = useState<'riscos' | 'mudancas' | null>(null);
  const [parecerAberto, setParecerAberto] = useState(false);
  const [editLink, setEditLink] = useState<{ kind: 'driveLink' | 'budgetLink' | 'termoFomentoLink'; value: string } | null>(null);
  const { getProject, updateProject } = useStore();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const project = getProject(initial.id) ?? initial;
  const driveLink = (project as ProjectExt).driveLink ?? '';
  const budgetLink = (project as ProjectExt).budgetLink ?? '';
  const termoFomentoLink = (project as ProjectExt).termoFomentoLink ?? '';
  const cfg = statusConfig[project.status] ?? { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' };

  // RF-006: o painel lateral fecha por botão E por Escape. Sem isso, quem abre
  // um detalhe sem querer fica preso ao mouse para sair.
  useEffect(() => {
    if (!panel && editLink === null && !parecerAberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (editLink !== null) setEditLink(null);
      else if (parecerAberto) setParecerAberto(false);
      else setPanel(null);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [panel, editLink, parecerAberto]);

  const renderTab = () => {
    switch (activeTab) {
      case 'descricao': return <TabDescricao project={project} />;
      case 'contato':   return <TabContatos project={project} />;
      case 'plano':     return <TabPlanoTrabalho project={project} />;
      case 'orcamento': return <TabOrcamentoInterino project={project} />;
      default:          return null;
    }
  };

  const linkChips: { kind: 'driveLink' | 'budgetLink' | 'termoFomentoLink'; valor: string; rotulo: string; rotuloVazio: string; cor: string; fundo: string }[] = [
    { kind: 'driveLink', valor: driveLink, rotulo: 'Plano de Trabalho (Drive)', rotuloVazio: 'Link do Plano de Trabalho', cor: 'var(--info)', fundo: 'var(--success-soft)' },
    { kind: 'budgetLink', valor: budgetLink, rotulo: 'Orçamento Realizado', rotuloVazio: 'Link do Orçamento Realizado', cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)' },
    { kind: 'termoFomentoLink', valor: termoFomentoLink, rotulo: 'Termo de Fomento', rotuloVazio: 'Link do Termo de Fomento', cor: 'var(--info)', fundo: 'var(--info-soft)' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Cabeçalho do projeto */}
      <div
        className="flex-shrink-0 border-b px-6 pt-5 pb-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}
      >
        {/* Caminho */}
        <div className="flex items-center gap-1.5 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[12px] transition-colors hover:text-blue-600"
            style={{ color: 'var(--ink-4)' }}
          >
            <ArrowLeft size={12} /> Projetos
          </button>
          <ChevronRight size={11} color="var(--line-2)" />
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-1)', fontWeight: 500 }}>
            {project.name}
          </span>
        </div>

        {/* Título e ações */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 lg:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem',
                  color: 'var(--ink-1)', lineHeight: 1.3,
                }}
              >
                {project.name}
              </h1>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ color: cfg.color, background: cfg.bg }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                {project.status}
              </span>
            </div>

            <div className="flex items-center gap-x-3 gap-y-1 mt-1 flex-wrap">
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                {project.code}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>·</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-4)' }}>{project.financier}</span>
            </div>

            {/* Links do Drive */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {linkChips.map(chip => (
                <span key={chip.kind} className="inline-flex items-center gap-1">
                  {chip.valor && (
                    <a
                      href={chip.valor}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ color: chip.cor, background: chip.fundo }}
                    >
                      <ExternalLink size={11} /> {chip.rotulo}
                    </a>
                  )}
                  <button
                    onClick={() => setEditLink({ kind: chip.kind, value: chip.valor })}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                    style={{ borderColor: 'var(--border)', color: 'var(--ink-4)' }}
                  >
                    <Link2 size={11} /> {chip.valor ? 'Editar' : chip.rotuloVazio}
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Registros — acesso aos painéis de risco e mudança. O registro
              consolidado de riscos (RF-035) passa para dentro do Plano de
              Trabalho numa fase seguinte. */}
          <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap lg:flex-shrink-0">
            {/* RF-033: acesso discreto ao parecer, no cabeçalho, presente em
                todas as quatro seções — e não uma quinta aba. */}
            <button
              onClick={() => setParecerAberto(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
            >
              <ClipboardCheck size={13} /> Parecer técnico ({(project as ProjectExt).pareceres?.length ?? 0})
            </button>
            <button
              onClick={() => setPanel('riscos')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
              style={{ borderColor: 'var(--danger-soft-border)', color: 'var(--danger)', background: 'var(--danger-soft)' }}
            >
              <ShieldAlert size={13} /> Riscos ({project.risks.length})
            </button>
            <button
              onClick={() => setPanel('mudancas')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
              style={{ borderColor: 'var(--brand-soft-border)', color: 'var(--brand)', background: 'var(--brand-soft)' }}
            >
              <GitBranch size={13} /> Mudanças ({project.changes.length})
            </button>
          </div>
        </div>

        {/* Resumo compacto (RF-004) */}
        <ProjectSummaryHeader project={project} />

        {/* Abas */}
        <div className="overflow-x-auto -mb-px">
          <div className="flex items-end gap-0 w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 text-[12.5px] border-b-2 transition-all whitespace-nowrap"
                  style={{
                    borderBottomColor: isActive ? 'var(--primary)' : 'transparent',
                    color: isActive ? 'var(--primary)' : 'var(--ink-4)',
                    fontWeight: isActive ? 600 : 400,
                    background: 'transparent',
                  }}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo da aba */}
      <div className="flex-1 overflow-hidden" style={{ background: 'var(--background)' }}>
        {renderTab()}
      </div>

      {parecerAberto && <PainelParecer project={project} aoFechar={() => setParecerAberto(false)} />}

      {/* Painel de Riscos / Mudanças */}
      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setPanel(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card h-full w-full max-w-4xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>
                {panel === 'riscos' ? 'Registro de Riscos' : 'Registro de Mudanças'}
              </span>
              <button onClick={() => setPanel(null)} aria-label="Fechar painel"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-hidden">
              {panel === 'riscos' ? <TabRiscos project={project} /> : <TabMudancas project={project} />}
            </div>
          </div>
        </div>
      )}

      {/* Modal de links do Drive */}
      {editLink !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setEditLink(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
            <h3 className="mb-3" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem' }}>
              {editLink.kind === 'driveLink'
                ? 'Plano de Trabalho no Drive'
                : editLink.kind === 'budgetLink'
                  ? 'Orçamento Realizado no Drive'
                  : 'Termo de Fomento no Drive'}
            </h3>
            <input
              autoFocus
              className="w-full border rounded-lg px-3 py-2 text-[13px]"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
              placeholder="https://drive.google.com/..."
              value={editLink.value}
              onChange={e => setEditLink({ ...editLink, value: e.target.value })}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setEditLink(null)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Cancelar</button>
              <button
                onClick={() => {
                  updateProject(project.id, { [editLink.kind]: editLink.value.trim() } as Partial<ProjectExt>);
                  audit({
                    userLogin: user?.login ?? '—', area: 'projeto', action: `editar link (${editLink.kind})`,
                    detail: editLink.value.trim(), projectId: project.id, projectName: project.name, kind: 'alteracao',
                  });
                  toast.success('Link atualizado.');
                  setEditLink(null);
                }}
                className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Orçamento na forma anterior, com aviso.
 *
 * A seção 14 do documento trata o Orçamento como etapa posterior: importação
 * de planilha (RF-037), exclusão lógica com risco vinculado (RF-040/RF-041) e
 * o par proposto/executado sem campo de saldo (RF-029) ainda não existem.
 * Até lá a tela financeira atual continua no ar — tirá-la agora removeria algo
 * que a equipe usa hoje e colocaria uma tela vazia no lugar.
 */
function TabOrcamentoInterino({ project }: { project: Project }) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 pt-4 flex-shrink-0">
        <div
          className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          role="note"
        >
          <Info size={15} color="var(--ink-4)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Visão financeira atual. A reformulação do Orçamento — importação da planilha, exclusão
            lógica com risco vinculado e o par proposto/executado — está prevista para uma etapa
            posterior, conforme a seção 14 da especificação.
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <TabFinanceiro project={project} />
      </div>
    </div>
  );
}
