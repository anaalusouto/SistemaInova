import { useState } from 'react';
import {
  LayoutGrid,
  Target,
  DollarSign,
  ShieldAlert,
  GitBranch,
  Users,
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
import { TabResumo } from './project-tabs/TabResumo';
import { TabMetas } from './project-tabs/TabMetas';
import { TabFinanceiro } from './project-tabs/TabFinanceiro';
import { TabContatos } from './project-tabs/TabContatos';
import { TabRiscos } from './project-tabs/TabRiscos';
import { TabMudancas } from './project-tabs/TabMudancas';

type TabId = 'resumo' | 'metas' | 'financeiro' | 'contatos';

const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'resumo',      label: 'Dashboard',              icon: LayoutGrid },
  { id: 'metas',       label: 'Monitoramento de Metas', icon: Target },
  { id: 'financeiro',  label: 'Financeiro',             icon: DollarSign },
  { id: 'contatos',    label: 'Contatos',               icon: Users },
];

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  'Em andamento': { color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
  'Concluído':    { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  'Atrasado':     { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
  'Não iniciado': { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
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
  const project = getProject(initial.id) ?? initial;
  const driveLink = (project as ProjectExt).driveLink ?? '';
  const budgetLink = (project as ProjectExt).budgetLink ?? '';
  const termoFomentoLink = (project as ProjectExt).termoFomentoLink ?? '';
  const cfg = statusConfig[project.status] ?? { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' };

  const renderTab = () => {
    switch (activeTab) {
      case 'resumo':      return <TabResumo project={project} />;
      case 'metas':       return <TabMetas project={project} />;
      case 'financeiro':  return <TabFinanceiro project={project} />;
      case 'contatos':    return <TabContatos project={project} />;
      default:            return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Project header */}
      <div
        className="flex-shrink-0 border-b px-6 pt-5 pb-0"
        style={{ borderColor: 'var(--border)', background: '#fff' }}
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-[12px] transition-colors hover:text-blue-600"
            style={{ color: '#64748B' }}
          >
            <ArrowLeft size={12} /> Projetos
          </button>
          <ChevronRight size={11} color="#CBD5E1" />
          <span style={{ fontSize: '0.75rem', color: '#0F172A', fontWeight: 500 }}>
            {project.name}
          </span>
        </div>

        {/* Project title row */}
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 700,
                    fontSize: '1.25rem',
                    color: '#0F172A',
                    lineHeight: 1.3,
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

                {/* Link do Plano de Trabalho no Drive */}
                {driveLink ? (
                  <a
                    href={driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ color: '#0F766E', background: '#ECFDF5' }}
                  >
                    <ExternalLink size={11} /> Plano de Trabalho (Drive)
                  </a>
                ) : null}
                <button
                  onClick={() => setEditLink({ kind: 'driveLink', value: driveLink })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  style={{ borderColor: 'var(--border)', color: '#475569' }}
                >
                  <Link2 size={11} /> {driveLink ? 'Editar plano' : 'Link do Plano de Trabalho'}
                </button>

                {budgetLink ? (
                  <a
                    href={budgetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ color: '#B45309', background: '#FFFBEB' }}
                  >
                    <ExternalLink size={11} /> Orçamento Realizado
                  </a>
                ) : null}
                <button
                  onClick={() => setEditLink({ kind: 'budgetLink', value: budgetLink })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  style={{ borderColor: 'var(--border)', color: '#475569' }}
                >
                  <Link2 size={11} /> {budgetLink ? 'Editar orçamento' : 'Link do Orçamento Realizado'}
                </button>

                {termoFomentoLink ? (
                  <a
                    href={termoFomentoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                    style={{ color: '#7C3AED', background: '#F5F3FF' }}
                  >
                    <ExternalLink size={11} /> Termo de Fomento
                  </a>
                ) : null}
                <button
                  onClick={() => setEditLink({ kind: 'termoFomentoLink', value: termoFomentoLink })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border"
                  style={{ borderColor: 'var(--border)', color: '#475569' }}
                >
                  <Link2 size={11} /> {termoFomentoLink ? 'Editar termo' : 'Link do Termo de Fomento'}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>
                  {project.code}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>·</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {project.coordinator}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>·</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  {project.financier}
                </span>
              </div>
            </div>
          </div>

          {/* Registros + progresso */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setPanel('riscos')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
              style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}
            >
              <ShieldAlert size={13} /> Riscos ({project.risks.length})
            </button>
            <button
              onClick={() => setPanel('mudancas')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
              style={{ borderColor: '#BFDBFE', color: '#2563EB', background: '#EFF6FF' }}
            >
              <GitBranch size={13} /> Mudanças ({project.changes.length})
            </button>
            <div className="flex items-center gap-2">
              <div className="w-28 h-2 rounded-full" style={{ background: '#E2E8F0' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${project.progress}%`,
                    background: project.status === 'Atrasado' ? '#EF4444' : project.status === 'Concluído' ? '#10B981' : '#2563EB',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: project.status === 'Atrasado' ? '#DC2626' : '#0F172A',
                }}
              >
                {project.progress}%
              </span>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-end gap-0 -mb-px">
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
                  color: isActive ? 'var(--primary)' : '#64748B',
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

      {/* Tab content */}
      <div className="flex-1 overflow-hidden" style={{ background: 'var(--background)' }}>
        {renderTab()}
      </div>

      {/* Painel Riscos / Mudanças */}
      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setPanel(null)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white h-full w-full max-w-4xl flex flex-col"
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
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
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
              style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}
              placeholder="https://drive.google.com/..."
              value={editLink.value}
              onChange={e => setEditLink({ ...editLink, value: e.target.value })}
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setEditLink(null)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: '#475569' }}>Cancelar</button>
              <button
                onClick={() => {
                  updateProject(project.id, { [editLink.kind]: editLink.value.trim() } as Partial<ProjectExt>);
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
