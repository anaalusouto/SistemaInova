import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Menu, Minus, Moon, Plus, Sun } from 'lucide-react';
import { Toaster } from 'sonner';
import { Sidebar, type NavItem } from './components/Sidebar';
import { MarcaCria } from './components/MarcaCria';
import { useMenuLateral } from './theme/useMenuLateral';
import { ProjectView } from './components/ProjectView';
import { PortfolioView } from './components/PortfolioView';
import { ReportsModule } from './components/ReportsModule';
import { ConfiguracoesPage } from './components/ConfiguracoesPage';
import { DiagnosticoModule } from './components/DiagnosticoModule';
import { OrganizacoesModule } from './components/organizacoes/OrganizacoesModule';
import { ROTA_INICIO, type RotaOrg } from './lib/navegacaoOrg';
import { buscaDaOrganizacao, rotaDaBusca, type BuscaApp } from './lib/navegacaoApp';
import { CronogramaPage } from './components/CronogramaPage';
import { NotificationsBell, useApprovalToasts } from './components/NotificationsBell';
import { useMentionToasts } from './mensagens/useMentionToasts';
import { ProjectsProvider, useStore } from './store';
import { AuthProvider, useAuth } from './auth/authStore';
import { AuditProvider, useAudit } from './audit/auditStore';
import { ThemeProvider, useTheme, FONT_SCALE_LABEL } from './theme/themeStore';
import { LoginScreen } from './auth/LoginScreen';
import { PopupNavegacao } from './components/PopupNavegacao';
import { VisualizadorDocumentos } from './components/VisualizadorDocumentos';
import { AssistenteInova } from './assistant/AssistenteInova';
import { contextoDaNavegacao } from './assistant/context';
import { resumirProjetoLocal } from './assistant/localBot';
import { detalharProjetoLocal, projetoDaNavegacao } from './assistant/projectHelp';
import { hojeISO } from './lib/planoTrabalho';

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
  const busca = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const activeNav = busca.area ?? 'overview';
  const rotaOrg = rotaDaBusca(busca);
  const ir = (search: BuscaApp) => { void navigate({ to: '/', search: { ...search, popup: undefined }, resetScroll: false }); };
  // Projeto sem organização vinculada (em 29/09 nenhum): abre sozinho, para
  // não ficar inacessível.
  const projetoAvulso = activeNav === 'organizations' && !busca.org ? busca.projeto ?? null : null;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { recolhido: menuRecolhido, alternar: alternarMenu } = useMenuLateral();
  const fecharMenu = useCallback(() => setMobileNavOpen(false), []);
  const { getProject, projects, projectsLoading } = useStore();
  const projetoAssistente = projetoDaNavegacao(projects, busca);
  const hojeAssistente = hojeISO();
  const detalhesAssistente = useMemo(() => projects.map(p => ({ id: p.id, detalhe: detalharProjetoLocal(p, hojeAssistente) })), [projects, hojeAssistente]);
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
    if (orgId) {
      navegarOrg({ orgId, secao: 'projeto', projetoId: id });
    } else {
      ir({ area: 'organizations', projeto: id, secao: 'projeto', aba: 'plano' });
    }
  };

  const navegarOrg = (rota: RotaOrg) => {
    ir(buscaDaOrganizacao(rota));
  };

  const handleNavigate = (item: NavItem) => {
    ir(item === 'overview' ? {} : { area: item });
  };

  const renderMain = () => {
    if (activeNav === 'organizations' && projetoAvulso != null) {
      const project = getProject(projetoAvulso);
      if (project) return <ProjectView key={project.id} project={project} onBack={() => navegarOrg(ROTA_INICIO)} rotuloVoltar="Organizações"
        abaAtual={busca.aba ?? 'plano'} aoMudarAba={(aba, foco) => ir({ ...busca, aba, foco: foco ?? undefined })} />;
    }

    switch (activeNav) {
      case 'overview':
        return <PortfolioView />;
      case 'organizations':
        return <OrganizacoesModule rota={rotaOrg} aoNavegar={navegarOrg} />;
      case 'schedule':
        return <CronogramaPage abaAtual={busca.gestao ?? 'plano'} aoMudarAba={gestao => ir({ area: 'schedule', gestao })} onOpenProject={handleSelectProject} onOpenOrg={(orgId, foco) => navegarOrg({ orgId, secao: 'encaminhamentos', projetoId: null, foco })} />;
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
    <PopupNavegacao><VisualizadorDocumentos><div className="relative flex h-dvh w-full min-w-0 overflow-hidden" style={{ background: 'var(--background)' }}>
      <Sidebar
        activeItem={activeNav}
        onNavigate={handleNavigate}
        rotaOrg={rotaOrg}
        aoNavegarOrg={navegarOrg}
        isOpen={mobileNavOpen}
        onClose={fecharMenu}
        collapsed={menuRecolhido}
        onToggleCollapsed={alternarMenu}
      />
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <header
          className="flex items-center gap-3 border-b px-4 h-16 flex-shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
        >
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={mobileNavOpen}
            aria-controls="menu-principal"
            className="flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent lg:hidden"
          >
            <Menu size={20} />
          </button>
          <MarcaCria compacta className="lg:!hidden" />
          <span className="hidden lg:inline text-sm font-medium" style={{ color: 'var(--ink-1)' }}>{greeting}</span>
          <div className="flex-1" />
          <FontSizeControl />
          <ThemeToggleButton />
          <NotificationsBell onOpenProject={handleSelectProject} />
        </header>
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto">{renderMain()}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
      <AssistenteInova key={user?.login} contexto={contextoDaNavegacao(busca)} dados={{
        carregando: projectsLoading,
        projetosCarregados: projects.length,
        projetos: detalhesAssistente.map(p => p.detalhe),
        projetoDetalhado: detalhesAssistente.find(p => p.id === projetoAssistente?.id)?.detalhe,
        projeto: projetoAssistente ? resumirProjetoLocal(projetoAssistente) : undefined,
      }} />
    </div></VisualizadorDocumentos></PopupNavegacao>
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
