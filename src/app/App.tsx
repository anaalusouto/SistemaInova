import { useEffect, useState } from 'react';
import { Menu, Minus, Moon, Plus, Sun } from 'lucide-react';
import { Toaster } from 'sonner';
import { Sidebar, type NavItem } from './components/Sidebar';
import { ProjectView } from './components/ProjectView';
import { PortfolioView } from './components/PortfolioView';
import { ReportsModule } from './components/ReportsModule';
import { ConfiguracoesPage } from './components/ConfiguracoesPage';
import { DiagnosticoModule } from './components/DiagnosticoModule';
import { OrganizacoesModule } from './components/organizacoes/OrganizacoesModule';
import { ROTA_INICIO, type RotaOrg } from './lib/navegacaoOrg';
import { CronogramaPage } from './components/CronogramaPage';
import { NotificationsBell, useApprovalToasts } from './components/NotificationsBell';
import { useMentionToasts } from './mensagens/useMentionToasts';
import { ProjectsProvider, useStore } from './store';
import { AuthProvider, useAuth } from './auth/authStore';
import { AuditProvider, useAudit } from './audit/auditStore';
import { ThemeProvider, useTheme, FONT_SCALE_LABEL } from './theme/themeStore';
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
  // A Visão Geral é a entrada da plataforma; projetos abrem na organização.
  // A rota da organização fica aqui porque o menu lateral também a lê.
  const [activeNav, setActiveNav] = useState<NavItem>('overview');
  const [rotaOrg, setRotaOrg] = useState<RotaOrg>(ROTA_INICIO);
  // Projeto sem organização vinculada (em 29/09 nenhum): abre sozinho, para
  // não ficar inacessível.
  const [projetoAvulso, setProjetoAvulso] = useState<number | null>(null);
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

  /** Abre o projeto dentro da organização dele (notificações e agenda). */
  const handleSelectProject = (id: number) => {
    const orgId = getProject(id)?.organizacao?.id ?? null;
    setActiveNav('organizations');
    if (orgId) {
      setProjetoAvulso(null);
      setRotaOrg({ orgId, secao: 'projeto', projetoId: id });
    } else {
      setProjetoAvulso(id);
    }
  };

  const navegarOrg = (rota: RotaOrg) => {
    setProjetoAvulso(null);
    setActiveNav('organizations');
    setRotaOrg(rota);
  };

  const handleNavigate = (item: NavItem) => {
    setActiveNav(item);
    setProjetoAvulso(null);
    // "Organizações" no menu sempre leva à lista de organizações.
    if (item === 'organizations') setRotaOrg(ROTA_INICIO);
  };

  const renderMain = () => {
    if (activeNav === 'organizations' && projetoAvulso != null) {
      const project = getProject(projetoAvulso);
      if (project) return <ProjectView project={project} onBack={() => setProjetoAvulso(null)} rotuloVoltar="Organizações" />;
    }

    switch (activeNav) {
      case 'overview':
        return <PortfolioView />;
      case 'organizations':
        return <OrganizacoesModule rota={rotaOrg} aoNavegar={navegarOrg} />;
      case 'schedule':
        return <CronogramaPage onOpenProject={handleSelectProject} />;
      case 'diagnostics':
        return <DiagnosticoModule />;
      case 'reports':
        return <ReportsModule />;
      case 'settings':
        return <ConfiguracoesPage />;

      default:
        return <PortfolioView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar
        activeItem={activeNav}
        onNavigate={handleNavigate}
        rotaOrg={rotaOrg}
        aoNavegarOrg={navegarOrg}
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
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
          <FontSizeControl />
          <ThemeToggleButton />
          <NotificationsBell onOpenProject={handleSelectProject} />
        </header>
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto">{renderMain()}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

function FontSizeControl() {
  const { fontScale, increaseFontScale, decreaseFontScale } = useTheme();
  return (
    <div
      className="hidden sm:flex items-center rounded-full"
      style={{ height: 34, border: '1px solid var(--border)', color: 'var(--ink-3)' }}
      title={`Tamanho do texto: ${FONT_SCALE_LABEL[fontScale]}`}
    >
      <button
        onClick={decreaseFontScale}
        disabled={fontScale === 'sm'}
        aria-label="Diminuir tamanho do texto"
        className="flex items-center justify-center rounded-full disabled:opacity-30"
        style={{ width: 30, height: 30 }}
      >
        <Minus size={13} />
      </button>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, width: 20, textAlign: 'center' }}>A</span>
      <button
        onClick={increaseFontScale}
        disabled={fontScale === 'xl'}
        aria-label="Aumentar tamanho do texto"
        className="flex items-center justify-center rounded-full disabled:opacity-30"
        style={{ width: 30, height: 30 }}
      >
        <Plus size={13} />
      </button>
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
            <Gated />
          </ProjectsProvider>
        </AuditProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
