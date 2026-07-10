import { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  Bell,
  Search,
  ClipboardList,
  Layers,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'communities'
  | 'projects'
  | 'schedule'
  | 'diagnostics'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

const topItems = [
  { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
];

const inovaChildren = [
  { id: 'communities' as NavItem, label: 'Comunidades', icon: Users },
  { id: 'projects' as NavItem, label: 'Projetos', icon: FolderKanban },
];

const bottomItems = [
  { id: 'schedule' as NavItem, label: 'Cronograma 2026', icon: CalendarDays },
  { id: 'diagnostics' as NavItem, label: 'Diagnóstico', icon: ClipboardList },
  { id: 'reports' as NavItem, label: 'Relatórios', icon: BarChart3 },
  { id: 'settings' as NavItem, label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  const [inovaOpen, setInovaOpen] = useState(true);

  const renderBtn = (item: { id: NavItem; label: string; icon: typeof LayoutDashboard }, indent = false) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onNavigate(item.id)}
        className="w-full flex items-center gap-3 rounded-md mb-0.5 text-left transition-all duration-150"
        style={{
          padding: indent ? '8px 12px 8px 30px' : '8px 12px',
          background: isActive ? 'var(--sidebar-primary)' : 'transparent',
          color: isActive ? '#fff' : 'var(--sidebar-foreground)',
          opacity: isActive ? 1 : 0.78,
        }}
        onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-accent)'; (e.currentTarget as HTMLButtonElement).style.opacity = '1'; } }}
        onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.opacity = '0.78'; } }}
      >
        <Icon size={15} />
        <span style={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
        {isActive && <ChevronRight size={12} className="ml-auto" />}
      </button>
    );
  };

  return (
    <aside className="flex flex-col h-full w-60 flex-shrink-0" style={{ background: 'var(--sidebar)' }}>
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--sidebar-primary)' }}>
          <LayoutDashboard size={16} color="#fff" />
        </div>
        <div>
          <div style={{ color: '#F1F5F9', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
            INOVA CRIA
          </div>
          <div style={{ color: 'var(--sidebar-foreground)', fontSize: '0.7rem', opacity: 0.6 }}>
            Gestão de Portfólio
          </div>
        </div>
      </div>

      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--sidebar-foreground)' }}>
          <Search size={13} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: '0.78rem', opacity: 0.5 }}>Buscar...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>⌘K</kbd>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {topItems.map(i => renderBtn(i))}

        {/* Grupo INOVA FAS/FUNBIO */}
        <button
          onClick={() => setInovaOpen(v => !v)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 text-left mt-2"
          style={{ color: 'var(--sidebar-foreground)', opacity: 0.9 }}
        >
          <Layers size={15} />
          <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>INOVA FAS/FUNBIO</span>
          {inovaOpen ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
        </button>
        {inovaOpen && inovaChildren.map(i => renderBtn(i, true))}

        <div className="mt-2">
          {bottomItems.map(i => renderBtn(i))}
        </div>
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--sidebar-primary)', color: '#fff' }}>
            CR
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: '#E2E8F0', fontSize: '0.78rem', fontWeight: 500 }}>CRIA</div>
            <div style={{ color: 'rgba(203,213,225,0.45)', fontSize: '0.68rem' }}>INOVA FAS/FUNBIO</div>
          </div>
          <Bell size={14} style={{ color: 'rgba(203,213,225,0.5)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
