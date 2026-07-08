import {
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  GitBranch,
  Paperclip,
  BarChart3,
  Settings,
  ChevronRight,
  Bell,
  Search,
  ClipboardList,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'projects'
  | 'diagnostics'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
}

const navItems = [
  { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects' as NavItem, label: 'Projetos', icon: FolderKanban },
  { id: 'diagnostics' as NavItem, label: 'Diagnóstico', icon: ClipboardList },
  { id: 'reports' as NavItem, label: 'Relatórios', icon: BarChart3 },
  { id: 'settings' as NavItem, label: 'Configurações', icon: Settings },
];

const projectModules = [
  { label: 'Monitoramento', icon: TrendingUp },
  { label: 'Financeiro', icon: DollarSign },
  { label: 'Riscos', icon: ShieldAlert },
  { label: 'Mudanças', icon: GitBranch },
  { label: 'Evidências', icon: Paperclip },
];

export function Sidebar({ activeItem, onNavigate }: SidebarProps) {
  return (
    <aside
      className="flex flex-col h-full w-60 flex-shrink-0"
      style={{ background: 'var(--sidebar)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--sidebar-primary)' }}
        >
          <LayoutDashboard size={16} color="#fff" />
        </div>
        <div>
          <div style={{ color: '#F1F5F9', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
            GestorPro
          </div>
          <div style={{ color: 'var(--sidebar-foreground)', fontSize: '0.7rem', opacity: 0.6 }}>
            Projetos Institucionais
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pt-4 pb-2">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--sidebar-foreground)' }}
        >
          <Search size={13} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: '0.78rem', opacity: 0.5 }}>Buscar...</span>
          <kbd
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="mb-4">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 text-left transition-all duration-150"
                style={{
                  background: isActive ? 'var(--sidebar-primary)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--sidebar-foreground)',
                  opacity: isActive ? 1 : 0.75,
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-accent)';
                    (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.opacity = '0.75';
                  }
                }}
              >
                <Icon size={15} />
                <span style={{ fontSize: '0.825rem', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </button>
            );
          })}
        </div>

        {/* Section: Project modules hint */}
        <div
          className="pt-3 pb-1 px-3 mb-1"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(203,213,225,0.4)', fontWeight: 600 }}>
            Módulos do Projeto
          </span>
        </div>
        {projectModules.map(mod => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.label}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md mb-0.5 text-left transition-all duration-150 opacity-50 cursor-default"
              style={{ color: 'var(--sidebar-foreground)' }}
            >
              <Icon size={14} />
              <span style={{ fontSize: '0.8rem' }}>{mod.label}</span>
              <span
                className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}
              >
                via Projeto
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-3 px-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{ background: 'var(--sidebar-primary)', color: '#fff' }}
          >
            GS
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: '#E2E8F0', fontSize: '0.78rem', fontWeight: 500 }}>Gestor Sênior</div>
            <div style={{ color: 'rgba(203,213,225,0.45)', fontSize: '0.68rem' }}>Administrador</div>
          </div>
          <Bell size={14} style={{ color: 'rgba(203,213,225,0.5)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
