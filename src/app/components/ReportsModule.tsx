import { useState } from 'react';
import { FolderKanban, ClipboardList } from 'lucide-react';
import { ReportsPage } from './ReportsPage';
import { DiagnosticoReportsPage } from './DiagnosticoReportsPage';

type ReportsSubView = 'projetos' | 'diagnosticos';

/** Aba ativa preservada enquanto a sessão estiver aberta (mesmo padrão de ProjectsModule/DiagnosticoModule). */
const subViewMemory: { value: ReportsSubView } = { value: 'projetos' };

const TABS: { id: ReportsSubView; label: string; icon: typeof FolderKanban }[] = [
  { id: 'projetos', label: 'Projetos', icon: FolderKanban },
  { id: 'diagnosticos', label: 'Diagnósticos', icon: ClipboardList },
];

export function ReportsModule() {
  const [subView, setSubViewState] = useState<ReportsSubView>(subViewMemory.value);

  const setSubView = (v: ReportsSubView) => {
    subViewMemory.value = v;
    setSubViewState(v);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-7 pt-4 border-b flex-shrink-0 print:hidden" style={{ borderColor: 'var(--border)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = subView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubView(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-colors"
              style={{ color: active ? 'var(--primary)' : 'var(--ink-4)', borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent' }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-hidden">
        {subView === 'projetos' ? <ReportsPage /> : <DiagnosticoReportsPage />}
      </div>
    </div>
  );
}
