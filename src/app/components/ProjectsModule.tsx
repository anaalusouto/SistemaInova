import { useState } from 'react';
import { LayoutGrid, FolderKanban } from 'lucide-react';
import { type Project } from '../data/mockData';
import { PortfolioView } from './PortfolioView';
import { ProjectsPage } from './ProjectsPage';

type ProjectsSubView = 'portfolio' | 'projects';

interface ProjectsModuleProps {
  onSelectProject: (project: Project) => void;
}

/** Aba ativa preservada enquanto a sessão estiver aberta (entrar/sair de um projeto não limpa). */
const subViewMemory: { value: ProjectsSubView } = { value: 'portfolio' };

const TABS: { id: ProjectsSubView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'portfolio', label: 'Visão Geral', icon: LayoutGrid },
  { id: 'projects', label: 'Projetos', icon: FolderKanban },
];

export function ProjectsModule({ onSelectProject }: ProjectsModuleProps) {
  const [subView, setSubViewState] = useState<ProjectsSubView>(subViewMemory.value);

  const setSubView = (v: ProjectsSubView) => {
    subViewMemory.value = v;
    setSubViewState(v);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-7 pt-4 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = subView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubView(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors"
              style={{
                color: active ? 'var(--primary)' : 'var(--ink-4)',
                borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden">
        {subView === 'portfolio' ? (
          <PortfolioView onSelectProject={onSelectProject} />
        ) : (
          <ProjectsPage onSelectProject={onSelectProject} />
        )}
      </div>
    </div>
  );
}
