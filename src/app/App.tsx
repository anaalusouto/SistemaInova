import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { Sidebar, type NavItem } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectsPage } from './components/ProjectsPage';
import { ProjectView } from './components/ProjectView';
import { ReportsPage } from './components/ReportsPage';
import { ConfiguracoesPage } from './components/ConfiguracoesPage';
import { DiagnosticoPage } from './components/DiagnosticoPage';
import { ControleInternoPage } from './components/ControleInternoPage';
import { CronogramaPage } from './components/CronogramaPage';
import { ProjectsProvider, useStore } from './store';
import { DiagnosticProvider } from './diagnostic/store';
import { AuthProvider, useAuth } from './auth/authStore';
import { AuditProvider, useAudit } from './audit/auditStore';
import { LoginScreen } from './auth/LoginScreen';

function AppShell() {
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const { getProject } = useStore();
  const { user, isAdmin } = useAuth();
  const { log } = useAudit();

  useEffect(() => {
    if (!isAdmin && activeNav === 'settings') setActiveNav('dashboard');
  }, [isAdmin, activeNav]);


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
      case 'internal':
        return <ControleInternoPage />;
      case 'projects':
        return <ProjectsPage onSelectProject={(p) => handleSelectProject(p.id)} />;
      case 'schedule':
        return <CronogramaPage />;
      case 'diagnostics':
        return <DiagnosticoPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return isAdmin ? <ConfiguracoesPage /> : <Dashboard onSelectProject={(p) => handleSelectProject(p.id)} onGoToProjects={() => handleNavigate('projects')} />;

      default:
        return <Dashboard onSelectProject={(p) => handleSelectProject(p.id)} onGoToProjects={() => handleNavigate('projects')} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar activeItem={activeNav} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-hidden">{renderMain()}</main>
      <Toaster position="top-right" richColors closeButton />
    </div>
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
    <AuthProvider>
      <AuditProvider>
        <ProjectsProvider>
          <DiagnosticProvider>
            <Gated />
          </DiagnosticProvider>
        </ProjectsProvider>
      </AuditProvider>
    </AuthProvider>
  );
}
