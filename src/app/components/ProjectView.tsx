import { useState } from 'react';
import {
  LayoutGrid,
  ClipboardList,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  GitBranch,
  Paperclip,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { type Project } from '../data/mockData';
import { useStore } from '../store';
import { TabCadastro } from './project-tabs/TabCadastro';
import { TabMonitoramento } from './project-tabs/TabMonitoramento';
import { TabFinanceiro } from './project-tabs/TabFinanceiro';
import { TabRiscos } from './project-tabs/TabRiscos';
import { TabMudancas } from './project-tabs/TabMudancas';
import { TabEvidencias } from './project-tabs/TabEvidencias';

type TabId = 'cadastro' | 'monitoramento' | 'financeiro' | 'riscos' | 'mudancas' | 'evidencias';

const tabs: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'cadastro',      label: 'Cadastro',                 icon: ClipboardList },
  { id: 'monitoramento', label: 'Monitoramento',            icon: TrendingUp },
  { id: 'financeiro',    label: 'Financeiro',               icon: DollarSign },
  { id: 'riscos',        label: 'Gestão de Riscos',         icon: ShieldAlert },
  { id: 'mudancas',      label: 'Gestão de Mudanças',       icon: GitBranch },
  { id: 'evidencias',    label: 'Evidências e Relatório',   icon: Paperclip },
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
  const [activeTab, setActiveTab] = useState<TabId>('cadastro');
  const { getProject } = useStore();
  const project = getProject(initial.id) ?? initial;
  const cfg = statusConfig[project.status] ?? { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' };

  const renderTab = () => {
    switch (activeTab) {
      case 'cadastro':      return <TabCadastro project={project} />;
      case 'monitoramento': return <TabMonitoramento project={project} />;
      case 'financeiro':    return <TabFinanceiro project={project} />;
      case 'riscos':        return <TabRiscos project={project} />;
      case 'mudancas':      return <TabMudancas project={project} />;
      case 'evidencias':    return <TabEvidencias project={project} />;
      default:              return null;
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
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-3">
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

          {/* Progress mini */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 rounded-full" style={{ background: '#E2E8F0' }}>
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
    </div>
  );
}
