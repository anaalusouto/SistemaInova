import { useEffect, useState } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { Toaster } from 'sonner';
import { Sidebar, type NavItem } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectsPage } from './components/ProjectsPage';
import { ProjectView } from './components/ProjectView';
import { ReportsPage } from './components/ReportsPage';
import { ConfiguracoesPage } from './components/ConfiguracoesPage';
import { DiagnosticoPage } from './components/DiagnosticoPage';
import { CronogramaPage } from './components/CronogramaPage';
import { NotificationsBell, useApprovalToasts } from './components/NotificationsBell';
import { ProjectsProvider, useStore } from './store';
import { DiagnosticProvider } from './diagnostic/store';
import { AuthProvider, useAuth } from './auth/authStore';
import { AuditProvider, useAudit } from './audit/auditStore';
import { ThemeProvider, useTheme } from './theme/themeStore';
import { LoginScreen } from './auth/LoginScreen';

function AppShell() {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { getProject } = useStore();
  const { user } = useAuth();
  const { log } = useAudit();
  useApprovalToasts();

  useEffect(() => {
    if (!user) return;
    log({ userLogin: user.login, area: activeNav, action: 'view' });
  }, [activeNav, user, log]);

  const handleSelectProject = (id: number) => {
    setSelectedProjectId(id);
    setActiveNav('projects');
  };

  const handleBackToProjects = () => setSelectedProjectId(null);

  const handleNavigate = (item: NavItem) => {
    setActiveNav(item);
    if (item !== 'projects') setSelectedProjectId(null);
  };

  const renderMain = () => {
    if (activeNav === 'projects' && selectedProjectId != null) {
      const project = getProject(selectedProjectId);
      if (project) return <ProjectView project={project} onBack={handleBackToProjects} />;
    }

    switch (activeNav) {
      case 'dashboard':
        return <Dashboard onSelectProject={(p) => handleSelectProject(p.id)} onGoToProjects={() => handleNavigate('projects')} />;
      case 'projects':
        return <ProjectsPage onSelectProject={(p) => handleSelectProject(p.id)} />;
      case 'schedule':
        return <CronogramaPage />;
      case 'diagnostics':
        return <DiagnosticoPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <ConfiguracoesPage />;

      default:
        return <Dashboard onSelectProject={(p) => handleSelectProject(p.id)} onGoToProjects={() => handleNavigate('projects')} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar
        activeItem={activeNav}
        onNavigate={handleNavigate}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="flex items-center gap-3 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
        >
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menu"
            className="flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent lg:hidden"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-foreground lg:hidden">Sistema Inova</span>
          <div className="flex-1" />
          <ThemeToggleButton />
          <NotificationsBell onOpenProject={handleSelectProject} />
        </header>
        <main className="flex-1 overflow-y-auto">{renderMain()}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

function ThemeToggleButton() {
  const { mode, toggleMode } = useTheme();
  return (
    <button
      onClick={toggleMode}
      aria-label={mode === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={mode === 'dark' ? 'Modo claro' : 'Modo escuro'}
      className="flex items-center justify-center rounded-full transition-colors"
      style={{ width: 34, height: 34, color: 'var(--ink-3)' }}
    >
      {mode === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function Gated() {
  const { user, signIn } = useAuth();
  const { log } = useAudit();

  useEffect(() => {
    if (user) log({ userLogin: user.login, area: 'sessão', action: 'login', detail: user.displayName });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.login]);

  if (!user) {
    return (
      <>
        <LoginScreen />
        <Toaster position="top-right" richColors closeButton />
        <span hidden data-noop={typeof signIn === 'function' ? '1' : '0'} />
      </>
    );
  }
  return <AppShell />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuditProvider>
          <ProjectsProvider>
            <DiagnosticProvider>
              <Gated />
            </DiagnosticProvider>
          </ProjectsProvider>
        </AuditProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
