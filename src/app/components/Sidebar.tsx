import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  BarChart3,
  Settings,
  ChevronRight,
  Search,
  ClipboardList,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../auth/authStore';

export type NavItem =
  | 'dashboard'
  | 'projects'
  | 'schedule'
  | 'diagnostics'
  | 'reports'
  | 'messages'
  | 'settings';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const topItems = [
  { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard },
];

const bottomItems = [
  { id: 'projects' as NavItem, label: 'Projetos', icon: FolderKanban },
  { id: 'schedule' as NavItem, label: 'Cronograma 2026', icon: CalendarDays },
  { id: 'diagnostics' as NavItem, label: 'Diagnóstico', icon: ClipboardList },
  { id: 'reports' as NavItem, label: 'Relatórios', icon: BarChart3 },
  { id: 'messages' as NavItem, label: 'Mensagens', icon: MessageSquare },
  { id: 'settings' as NavItem, label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeItem, onNavigate, isOpen = false, onClose }: SidebarProps) {
  const { user, isAdmin, signOut } = useAuth();

  const initials = (user?.displayName ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || 'US';

  const renderBtn = (item: { id: NavItem; label: string; icon: typeof LayoutDashboard }, indent = false) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    return (
      <button
        key={item.id}
        onClick={() => { onNavigate(item.id); onClose?.(); }}
        className="w-full flex items-center gap-3 rounded-md mb-0.5 text-left transition-all duration-150"
        style={{
          padding: indent ? '8px 12px 8px 30px' : '8px 12px',
          background: isActive ? 'var(--sidebar-primary)' : 'transparent',
          color: isActive ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)',
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
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`flex flex-col h-full w-60 flex-shrink-0 fixed inset-y-0 left-0 z-50 transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--sidebar)' }}
      >
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0 border-b" style={{ borderColor: 'var(--sidebar-border)', background: 'var(--surface-0)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--sidebar-primary)' }}>
          <LayoutDashboard size={16} color="var(--primary-foreground)" />
        </div>
        <div>
          <div style={{ color: 'var(--ink-1)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.875rem', lineHeight: 1.2 }}>
            Sistema Inova
          </div>
          <div style={{ color: 'var(--ink-1)', fontSize: '0.7rem', opacity: 0.7 }}>
            Gestão de Projetos
          </div>
        </div>
      </div>

      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors"
          style={{ background: 'var(--sidebar-accent)', color: 'var(--sidebar-foreground)' }}>
          <Search size={13} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: '0.78rem', opacity: 0.5 }}>Buscar...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--sidebar-border)', color: 'var(--sidebar-foreground)', opacity: 0.6 }}>⌘K</kbd>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {topItems.map(i => renderBtn(i))}

        <div className="mt-1">
          {bottomItems.map(i => renderBtn(i))}
        </div>

      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--sidebar-primary)', color: 'var(--primary-foreground)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate" style={{ color: 'var(--sidebar-foreground)', fontSize: '0.78rem', fontWeight: 500 }}>{user?.displayName ?? '—'}</div>
            <div style={{ color: 'var(--sidebar-foreground)', opacity: 0.6, fontSize: '0.68rem' }}>
              {isAdmin ? 'Administrador' : 'Estagiário'}
            </div>
          </div>
          <button onClick={signOut} title="Sair" className="flex-shrink-0">
            <LogOut size={14} style={{ color: 'var(--sidebar-foreground)', opacity: 0.6 }} />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}
