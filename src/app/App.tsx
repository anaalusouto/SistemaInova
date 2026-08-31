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
import { MensagensPage } from './components/MensagensPage';
import { AgendaPage } from './components/AgendaPage';
import { NotificationsBell, useApprovalToasts } from './components/NotificationsBell';
import { useMentionToasts } from './mensagens/useMentionToasts';
import { ProjectsProvider, useStore } from './store';
import { DiagnosticProvider } from './diagnostic/store';
import { AuthProvider, useAuth } from './auth/authStore';
import { AuditProvider, useAudit } from './audit/auditStore';
import { ThemeProvider, useTheme } from './theme/themeStore';
import { LoginScreen } from './auth/LoginScreen';

const GREETING_BY_PERIOD: Record<'manha' | 'tarde' | 'noite', string> = {
  manha: 'Bom dia',
  tarde: 'Boa tarde',
  noite: 'Boa noite',
};

function greetingFor(displayName: string): string {
  const firstName = displayName.trim().split(' ')[0] || displayName;
  const hour = new Date().getHours();
  const period: 'manha' | 'tarde' | 'noite' = hour < 6 || hour >= 18 ? 'noite' : hour < 12 ? 'manha' : 'tarde';
  const base = GREETING_BY_PERIOD[period];
  // Uma a cada 4 vezes aparece "bem-vindo de volta" em vez do horário — só pra variar.
  const variants = [`${base}, ${firstName}!`, `${base}, ${firstName}!`, `${base}, ${firstName}!`, `Bem-vindo de volta, ${firstName}!`];
  return variants[Math.floor(Math.random() * variants.length)];
}

function AppShell() {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { getProject } = useStore();
  const { user } = useAuth();
  const { log } = useAudit();
  const [greeting] = useState(() => greetingFor(user?.displayName ?? ''));
  useApprovalToasts();
  useMentionToasts();

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
      case 'messages':
        return <MensagensPage onOpenProject={handleSelectProject} />;
      case 'agenda':
        return <AgendaPage onOpenProject={handleSelectProject} />;
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
          className="flex items-center gap-3 border-b px-4 h-16 flex-shrink-0"
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
          <span className="hidden lg:inline text-sm font-medium" style={{ color: 'var(--ink-1)' }}>{greeting}</span>
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
