import { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Settings,
  ChevronRight,
  Search,
  ClipboardList,
  LogOut,
  Kanban,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { useAgenda } from '../agenda/useAgenda';
import { SUBAREAS_GESTAO } from '../lib/gestaoInterna';
import { useListaOrganizacoes } from './organizacoes/useOrganizacoes';
import { SECOES_ORG, nomeCurtoOrg, type RotaOrg } from '../lib/navegacaoOrg';
import './organizacoes/organizacoes.css';

/** O menu "Projetos" saiu (29/09/2026): projeto se abre dentro da organização. */
export type NavItem =
  | 'overview'
  | 'organizations'
  | 'schedule'
  | 'diagnostics'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeItem: NavItem;
  onNavigate: (item: NavItem) => void;
  isOpen?: boolean;
  onClose?: () => void;
  /** Organização aberta: o menu mostra, embaixo dela, seções e projetos. */
  rotaOrg: RotaOrg;
  aoNavegarOrg: (rota: RotaOrg) => void;
}

const topItems: { id: NavItem; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
];

const bottomItems = [
  { id: 'organizations' as NavItem, label: 'Organizações', icon: Building2 },
  { id: 'schedule' as NavItem, label: 'Gestão Interna', icon: Kanban },
  { id: 'settings' as NavItem, label: 'Configurações', icon: Settings },
];

export function Sidebar({ activeItem, onNavigate, isOpen = false, onClose, rotaOrg, aoNavegarOrg }: SidebarProps) {
  const { user, isAdmin, signOut } = useAuth();
  const { paraMim } = useAgenda();
  const [gestaoAberta, setGestaoAberta] = useState(true);
  const naGestao = SUBAREAS_GESTAO.some(s => s.id === activeItem);
  const pendentes = paraMim.filter(a => !a.concluidaEm).length;

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
        type="button"
        aria-current={isActive ? 'page' : undefined}
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
        {item.id === 'schedule' && pendentes > 0 && (
          <span
            className="ml-auto flex items-center justify-center rounded-full text-white font-bold flex-shrink-0"
            style={{ minWidth: 16, height: 16, fontSize: '9px', padding: '0 4px', background: 'var(--danger)' }}
          >
            {pendentes > 9 ? '9+' : pendentes}
          </span>
        )}
        {isActive && <ChevronRight size={12} className="ml-auto flex-shrink-0" />}
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
          {bottomItems.map(i => (
            <div key={i.id}>
              {i.id === 'schedule' ? (
                <>
                  <button type="button" onClick={() => setGestaoAberta(aberta => !aberta)} aria-expanded={gestaoAberta} aria-controls="subareas-gestao"
                    className="w-full flex items-center gap-3 rounded-md mb-0.5 px-3 py-2 text-left hover:bg-[var(--sidebar-accent)]"
                    style={{ color: 'var(--sidebar-foreground)', fontSize: '0.825rem', fontWeight: naGestao ? 600 : 400 }}>
                    <Kanban size={15} /> Gestão Interna
                    {gestaoAberta ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
                  </button>
                  <div id="subareas-gestao" role="group" aria-label="Subáreas de Gestão Interna" hidden={!gestaoAberta}>
                    {SUBAREAS_GESTAO.map(s => renderBtn({ ...s, icon: s.id === 'schedule' ? Kanban : s.id === 'diagnostics' ? ClipboardList : BarChart3 }, true))}
                  </div>
                </>
              ) : renderBtn(i)}
              {i.id === 'organizations' && activeItem === 'organizations' && rotaOrg.orgId && (
                <ArvoreOrganizacao key={rotaOrg.orgId} rota={rotaOrg} aoNavegar={r => { aoNavegarOrg(r); onClose?.(); }} />
              )}
            </div>
          ))}
        </div>

      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 overflow-hidden" style={{ background: 'var(--sidebar-primary)', color: 'var(--primary-foreground)' }}>
            {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : initials}
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

/**
 * O "drop" da organização aberta (alteracoes-inova.pptx): seções e projetos
 * dela, embaixo de "Organizações". O cabeçalho da organização fica fixo na
 * página; é aqui que se troca o que aparece embaixo dele.
 */
function ArvoreOrganizacao({ rota, aoNavegar }: { rota: RotaOrg; aoNavegar: (r: RotaOrg) => void }) {
  const { data: organizacoes = [] } = useListaOrganizacoes();
  const org = organizacoes.find(o => o.id === rota.orgId);
  if (!org || !rota.orgId) return null;
  const orgId = rota.orgId;
  const ir = (parcial: Partial<RotaOrg>) => aoNavegar({ orgId, secao: 'dados', projetoId: null, ...parcial });

  const item = (ativo: boolean, nivel: 1 | 2) => ({
    className: 'w-full flex items-center gap-2 rounded-md text-left transition-colors hover:bg-[var(--sidebar-accent)]',
    style: {
      padding: nivel === 1 ? '6px 10px 6px 34px' : '5px 10px 5px 48px',
      fontSize: nivel === 1 ? '0.78rem' : '0.74rem',
      color: 'var(--sidebar-foreground)',
      background: ativo ? 'var(--sidebar-accent)' : undefined,
      fontWeight: ativo ? 600 : 400,
      opacity: ativo ? 1 : 0.82,
      boxShadow: ativo ? 'inset 2px 0 0 var(--sidebar-primary)' : undefined,
    } as React.CSSProperties,
    'aria-current': ativo ? ('page' as const) : undefined,
  });

  return (
    <div className="organizacao-submenu mb-1" role="group" aria-label={`Seções de ${org.nome}`}>
      <div
        className="flex items-center gap-1.5 truncate"
        style={{ padding: '6px 10px 4px 22px', fontSize: '0.74rem', fontWeight: 700, color: 'var(--sidebar-foreground)' }}
        title={org.nome}
      >
        <ChevronDown size={12} style={{ opacity: 0.7, flexShrink: 0 }} />
        <span className="truncate">{nomeCurtoOrg(org.nome)}</span>
      </div>
      {SECOES_ORG.map(s => {
        const ativo = rota.secao === s.id || (s.id === 'projetos' && rota.secao === 'projeto');
        return (
          <div key={s.id}>
            <button type="button" onClick={() => ir(s.id === 'projetos'
              ? { secao: 'projeto', projetoId: null }
              : { secao: s.id })} {...item(ativo, 1)}>
              <span className="min-w-0">
                <span className="block">{s.rotulo}{s.emConstrucao ? ' (Em construção)' : ''}</span>
              </span>
              {s.id === 'encaminhamentos' && org.pendentes > 0 && (
                <span
                  className="ml-auto rounded-full px-1.5"
                  style={{ fontSize: '0.64rem', background: 'var(--sidebar-border)' }}
                  title={`${org.pendentes} encaminhamento(s) pendente(s)`}
                >
                  {org.pendentes}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
