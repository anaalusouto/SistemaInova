import { useState } from 'react';
import {
  LayoutGrid,
  Target,
  DollarSign,
  ShieldAlert,
  GitBranch,
  Users,
  ClipboardCheck,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Link2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Project } from '../data/mockData';
import { type ProjectExt } from '../store';
import { useStore } from '../store';
import { useAuth } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';
import { TabResumo } from './project-tabs/TabResumo';
import { TabMetas } from './project-tabs/TabMetas';
import { TabFinanceiro } from './project-tabs/TabFinanceiro';
import { TabContatos } from './project-tabs/TabContatos';
import { CronogramaExecutivoTab } from './CronogramaExecutivoTab';
import { TabRiscos } from './project-tabs/TabRiscos';
import { TabMudancas } from './project-tabs/TabMudancas';

type TabId = 'resumo' | 'metas' | 'financeiro' | 'cronograma' | 'contatos';

const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'resumo',      label: 'Dashboard',              icon: LayoutGrid },
  { id: 'metas',       label: 'Monitoramento de Metas', icon: Target },
  { id: 'financeiro',  label: 'Financeiro',             icon: DollarSign },
  { id: 'cronograma',  label: 'Cronograma',             icon: ClipboardCheck },
  { id: 'contatos',    label: 'Contatos',               icon: Users },
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
  const [activeTab, setActiveTab] = useState<TabId>('resumo');
  const [panel, setPanel] = useState<'riscos' | 'mudancas' | null>(null);
  const [editLink, setEditLink] = useState<{ kind: 'driveLink' | 'budgetLink' | 'termoFomentoLink'; value: string } | null>(null);
  const { getProject, updateProject } = useStore();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const project = getProject(initial.id) ?? initial;
  const driveLink = (project as ProjectExt).driveLink ?? '';
  const budgetLink = (project as ProjectExt).budgetLink ?? '';
  const termoFomentoLink = (project as ProjectExt).termoFomentoLink ?? '';
  const cfg = statusConfig[project.status] ?? { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' };

  const renderTab = () => {
    switch (activeTab) {
      case 'resumo':      return <TabResumo project={project} />;
      case 'metas':       return <TabMetas project={project} />;
      case 'financeiro':  return <TabFinanceiro project={project} />;
      case 'cronograma':  return <div className="h-full min-h-0 p-6"><CronogramaExecutivoTab projectId={project.id} /></div>;
      case 'contatos':    return <TabContatos project={project} />;
      default:            return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project header */}
      <div
        className="flex-shrink-0 border-b px-6 pt-5 pb-0"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}
      >
        {/* Breadcrumb */}
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

        {/* Project title row */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-4 gap-3 lg:gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: 'var(--ink-1)',
                    lineHeight: 1.3,
                  }}
                >
                  {project.name}
                </h1>
                {(project as ProjectExt).org && (
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold" style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}>
                    {(project as ProjectExt).org}
                  </span>
                )}
                {(project as ProjectExt).segmento && (
                  <span className="px-2 py-1 rounded-md text-[11px] font-medium" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                    {(project as ProjectExt).segmento}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                  style={{ color: cfg.color, background: cfg.bg }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                  {project.status}
                </span>

                {/* Link do Plano de Trabalho no Drive */}
                {driveLink ? (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ color: 'var(--info)', background: 'var(--success-soft)' }}
                  >
                    <ExternalLink size={11} /> Plano de Trabalho (Drive)
                  </a>
                ) : null}
                <button
                  onClick={() => setEditLink({ kind: 'driveLink', value: driveLink })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                >
                  <Link2 size={11} /> {driveLink ? 'Editar plano' : 'Link do Plano de Trabalho'}
                </button>

                {budgetLink ? (
                  <a
                    href={budgetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ color: 'var(--warning-strong-text)', background: 'var(--warning-soft)' }}
                  >
                    <ExternalLink size={11} /> Orçamento Realizado
                  </a>
                ) : null}
                <button
                  onClick={() => setEditLink({ kind: 'budgetLink', value: budgetLink })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                >
                  <Link2 size={11} /> {budgetLink ? 'Editar orçamento' : 'Link do Orçamento Realizado'}
                </button>

                {termoFomentoLink ? (
                  <a
                    href={termoFomentoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ color: 'var(--info)', background: 'var(--info-soft)' }}
                  >
                    <ExternalLink size={11} /> Termo de Fomento
                  </a>
                ) : null}
                <button
                  onClick={() => setEditLink({ kind: 'termoFomentoLink', value: termoFomentoLink })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                >
                  <Link2 size={11} /> {termoFomentoLink ? 'Editar termo' : 'Link do Termo de Fomento'}
                </button>
              </div>
              <div className="flex items-center gap-x-3 gap-y-1 mt-1 flex-wrap">
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                  {project.code}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>·</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-4)' }}>
                  {project.coordinator}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>·</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--ink-4)' }}>
                  {project.financier}
                </span>
              </div>
            </div>
          </div>

          {/* Registros + progresso */}
          <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap lg:flex-shrink-0">
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
            <div className="flex items-center gap-2">
              <div className="w-28 h-2 rounded-full" style={{ background: 'var(--line-1)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${project.progress}%`,
                    background: project.status === 'Atrasado' ? 'var(--danger)' : project.status === 'Concluído' ? 'var(--success)' : 'var(--brand)',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: project.status === 'Atrasado' ? 'var(--danger)' : 'var(--ink-1)',
                }}
              >
                {project.progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
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

      {/* Tab content */}
      <div className="flex-1 overflow-hidden" style={{ background: 'var(--background)' }}>
        {renderTab()}
      </div>

      {/* Painel Riscos / Mudanças */}
      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setPanel(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card h-full w-full max-w-4xl flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem' }}>
                {panel === 'riscos' ? 'Registro de Riscos' : 'Registro de Mudanças'}
              </span>
              <button onClick={() => setPanel(null)}><X size={16} /></button>
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
