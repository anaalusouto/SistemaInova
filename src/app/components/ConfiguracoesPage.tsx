import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  User, Bell, Users, ChevronRight, Check, LogOut, Mail, Lock, FolderKanban, UserSearch, Search, ArrowLeft,
} from 'lucide-react';
import { APP_PEOPLE, ROLE_LABEL, useAuth, type UserRole } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';
import { useStore } from '../store';

const NOTIF_KEY = 'pp-notificacoes-v1';

interface NotifPrefs { email: boolean; address: string; deadlines: boolean }
const defaultPrefs: NotifPrefs = { email: false, address: '', deadlines: false };

const formatTs = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch { return iso; }
};
const dayOf = (iso: string) => iso.slice(0, 10);

export function ConfiguracoesPage() {
  const { user, isAdmin, signOut, verifyOwnPassword, onlineLogins } = useAuth();
  const { entries } = useAudit();
  const { projects } = useStore();
  const [activeSection, setActiveSection] = useState('profile');

  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [hydrated, setHydrated] = useState(false);
  const [registrosUnlocked, setRegistrosUnlocked] = useState(false);
  const [pwd, setPwd] = useState('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...defaultPrefs, ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(NOTIF_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs, hydrated]);

  const sections = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'team', label: 'Equipe', icon: Users },
    ...(isAdmin ? [{ id: 'registros', label: 'Registros', icon: FolderKanban }] : []),
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <div className="w-52 border-r flex-shrink-0 py-6 px-3 flex flex-col" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        <div className="px-3 mb-4">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            Configurações
          </h1>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {sections.map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all"
                style={{
                  background: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#2563EB' : '#475569',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <Icon size={14} />
                <span style={{ fontSize: '0.825rem' }}>{s.label}</span>
                {isActive && <ChevronRight size={12} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => { signOut(); toast.success('Sessão encerrada.'); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all mt-4"
          style={{ color: '#DC2626', fontSize: '0.8rem' }}
        >
          <LogOut size={13} /> Sair
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeSection === 'profile' && (
          <div className="max-w-3xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
                Perfil do Usuário
              </h2>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={user?.role === 'admin' ? { background: '#FEF3C7', color: '#B45309' } : { background: '#EFF6FF', color: '#2563EB' }}
              >
                {ROLE_LABEL[(user?.role ?? 'estagiario') as UserRole]}
              </span>
            </div>

            <div className="flex items-center gap-4 p-5 bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'var(--primary)', color: '#fff', fontFamily: 'var(--font-heading)' }}
              >
                {user?.login.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A' }}>{user?.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Login: {user?.login}</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="max-w-xl flex flex-col gap-6">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
              Notificações
            </h2>

            <div className="bg-card rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
              <Toggle
                label="Notificações por e-mail"
                desc="Enviar aviso sempre que uma atividade for atribuída: qual atividade, onde foi atribuída e por quem."
                on={prefs.email}
                onChange={v => setPrefs(p => ({ ...p, email: v, deadlines: v ? p.deadlines : false }))}
              />
              {prefs.email && (
                <div className="pl-1">
                  <label className="text-[11px] font-medium flex items-center gap-1.5 mb-1" style={{ color: '#64748B' }}>
                    <Mail size={11} /> E-mail para envio
                  </label>
                  <input
                    type="email"
                    value={prefs.address}
                    onChange={e => setPrefs(p => ({ ...p, address: e.target.value }))}
                    placeholder="nome@dominio.com"
                    className="w-full px-3 py-2 rounded-lg text-[13px]"
                    style={{ border: '1px solid var(--border)', background: '#F8FAFC' }}
                  />
                  {!prefs.address.trim() && (
                    <p style={{ fontSize: '0.7rem', color: '#B45309', marginTop: 4 }}>
                      Informe um e-mail para que os avisos possam ser enviados.
                    </p>
                  )}
                </div>
              )}

              <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                <Toggle
                  label="Alerta de prazos"
                  desc="No mesmo e-mail: aviso quando a atividade passa da metade do prazo e quando ultrapassa o prazo final — informando a atividade, onde e por quem foi atribuída."
                  on={prefs.deadlines}
                  disabled={!prefs.email}
                  onChange={v => setPrefs(p => ({ ...p, deadlines: v }))}
                />
                {!prefs.email && (
                  <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 6 }}>
                    Disponível apenas com as notificações por e-mail ligadas.
                  </p>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              As preferências ficam salvas neste dispositivo. O disparo automático dos e-mails é ativado quando o domínio de envio da plataforma estiver configurado.
            </p>
          </div>
        )}

        {activeSection === 'team' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
              Equipe
            </h2>
            <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                    {['Membro', 'Função', ...(isAdmin ? ['Status'] : [])].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {APP_PEOPLE.map(m => {
                    const online = onlineLogins.includes(m.login);
                    return (
                      <tr key={m.login} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                              {m.name.split(' ').map(x => x[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0F172A' }}>{m.name}</div>
                              {isAdmin && <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{m.login}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ fontSize: '0.78rem', color: '#475569' }}>{ROLE_LABEL[m.role as UserRole]}</span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={online ? { background: '#ECFDF5', color: '#059669' } : { background: '#F3F4F6', color: '#6B7280' }}
                            >
                              {online ? <Check size={10} /> : null}
                              {online ? 'Ativo agora' : 'Inativo'}
                            </span>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'registros' && isAdmin && (
          registrosUnlocked ? (
            <RegistrosArea projects={projects} entries={entries} />
          ) : (
            <div className="max-w-sm">
              <h2 className="mb-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
                Registros
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 12 }}>
                Área restrita. Confirme sua senha para acessar os registros de projetos e o acompanhamento individual.
              </p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (verifyOwnPassword(pwd)) { setRegistrosUnlocked(true); setPwd(''); }
                  else toast.error('Senha incorreta.');
                }}
                className="bg-card rounded-xl border p-4 flex flex-col gap-3"
                style={{ borderColor: 'var(--border)' }}
              >
                <label className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: '#64748B' }}>
                  <Lock size={11} /> Senha do seu login
                </label>
                <input
                  type="password" autoFocus value={pwd} onChange={e => setPwd(e.target.value)}
                  className="px-3 py-2 rounded-lg text-[13px]"
                  style={{ border: '1px solid var(--border)', background: '#F8FAFC' }}
                />
                <button type="submit" className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>
                  Acessar registros
                </button>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Toggle({ label, desc, on, onChange, disabled }: {
  label: string; desc: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: disabled ? '#94A3B8' : '#0F172A' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!on)}
        style={{ background: on ? '#2563EB' : '#CBD5E1', width: 40, height: 22, borderRadius: 999, padding: 2, opacity: disabled ? 0.5 : 1, flexShrink: 0 }}
      >
        <span className="block w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }} />
      </button>
    </div>
  );
}

/* ============================================================
   REGISTROS
   ============================================================ */

type RegistrosView = 'menu' | 'projetos' | 'individual';

function RegistrosArea({ projects, entries }: {
  projects: ReturnType<typeof useStore>['projects'];
  entries: ReturnType<typeof useAudit>['entries'];
}) {
  const [view, setView] = useState<RegistrosView>('menu');
  const [projectId, setProjectId] = useState<number | null>(null);

  if (view === 'menu') {
    return (
      <div className="max-w-3xl flex flex-col gap-5">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>Registros</h2>
          <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 2 }}>
            Todo o histórico de alterações do sistema fica concentrado aqui. A cada 7 dias os registros são consolidados e enviados por e-mail aos administradores.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setView('projetos')} className="bg-card rounded-xl border p-5 text-left hover:shadow-md transition-all" style={{ borderColor: 'var(--border)' }}>
            <FolderKanban size={20} color="#2563EB" />
            <div className="mt-2" style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0F172A' }}>Registro de projetos</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Metas, financeiro, cronograma e contatos de cada um dos {projects.length} projetos.</div>
          </button>
          <button onClick={() => setView('individual')} className="bg-card rounded-xl border p-5 text-left hover:shadow-md transition-all" style={{ borderColor: 'var(--border)' }}>
            <UserSearch size={20} color="#7C3AED" />
            <div className="mt-2" style={{ fontWeight: 600, fontSize: '0.95rem', color: '#0F172A' }}>Acompanhamento individual</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>O que cada estagiário ou visualizador fez em um dia específico.</div>
          </button>
        </div>
      </div>
    );
  }

  if (view === 'projetos') {
    if (projectId == null) {
      return (
        <div className="max-w-4xl flex flex-col gap-4">
          <Back onClick={() => setView('menu')} label="Registro de projetos" />
          <div className="grid grid-cols-2 gap-3">
            {projects.map(p => (
              <button key={p.id} onClick={() => setProjectId(p.id)} className="bg-card rounded-xl border p-4 text-left hover:shadow-md transition-all" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  {p.org && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{p.org}</span>}
                  <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{p.code}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                  {(p.metaLog ?? []).length} alterações registradas
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }
    const p = projects.find(x => x.id === projectId);
    if (!p) return null;
    return <RegistroProjeto project={p} entries={entries} onBack={() => setProjectId(null)} />;
  }

  return <AcompanhamentoIndividual entries={entries} projects={projects} onBack={() => setView('menu')} />;
}

function Back({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onClick} className="flex items-center gap-1 text-[12px]" style={{ color: '#64748B' }}>
        <ArrowLeft size={13} /> Voltar
      </button>
      <span style={{ color: '#CBD5E1' }}>·</span>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>{label}</h2>
    </div>
  );
}

function RegistroProjeto({ project, entries, onBack }: {
  project: ReturnType<typeof useStore>['projects'][number];
  entries: ReturnType<typeof useAudit>['entries'];
  onBack: () => void;
}) {
  const [q, setQ] = useState('');
  const [day, setDay] = useState('');

  const rows = useMemo(() => {
    const fromLog = (project.metaLog ?? []).map(l => ({
      id: `log-${l.id}`,
      date: l.date,
      author: l.author,
      area: l.entity,
      action: l.action,
      detail: `${l.targetPath}${l.field ? ` · ${l.field}` : ''}${l.from || l.to ? ` — ${l.from || '—'} → ${l.to || '—'}` : ''}`,
    }));
    const fromAudit = entries
      .filter(e => e.projectId === project.id && e.kind === 'alteracao')
      .map(e => ({ id: e.id, date: e.timestamp, author: e.userLogin, area: e.area, action: e.action, detail: e.detail ?? '—' }));
    return [...fromLog, ...fromAudit]
      .filter(r => !day || dayOf(r.date) === day)
      .filter(r => {
        const s = q.trim().toLowerCase();
        return !s || `${r.author} ${r.area} ${r.action} ${r.detail}`.toLowerCase().includes(s);
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [project, entries, q, day]);

  return (
    <div className="max-w-5xl flex flex-col gap-4">
      <Back onClick={onBack} label={`${project.org ? `${project.org} · ` : ''}${project.name}`} />

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card flex-1 min-w-[220px]" style={{ borderColor: 'var(--border)' }}>
          <Search size={14} color="#94A3B8" />
          <input className="flex-1 outline-none text-[13px] bg-transparent" placeholder="Buscar por responsável, área ou alteração…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <input type="date" value={day} onChange={e => setDay(e.target.value)} className="px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', background: '#fff' }} />
        {(q || day) && (
          <button onClick={() => { setQ(''); setDay(''); }} className="px-3 py-2 rounded-lg border text-[12px]" style={{ borderColor: 'var(--border)', color: '#475569' }}>Limpar</button>
        )}
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Data e hora', 'Login', 'Área', 'Ação', 'Alteração'].map(h => (
                <th key={h} className="px-4 py-2 text-left" style={{ fontSize: '0.67rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Nenhum registro encontrado.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-2" style={{ fontSize: '0.73rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{formatTs(r.date)}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.76rem', fontWeight: 500, color: '#0F172A' }}>{r.author}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: '#475569' }}>{r.area}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: '#475569' }}>{r.action}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.74rem', color: '#64748B' }}>{r.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AcompanhamentoIndividual({ entries, projects, onBack }: {
  entries: ReturnType<typeof useAudit>['entries'];
  projects: ReturnType<typeof useStore>['projects'];
  onBack: () => void;
}) {
  const people = APP_PEOPLE.filter(p => p.role !== 'admin');
  const [login, setLogin] = useState(people[0]?.login ?? '');
  const [day, setDay] = useState(new Date().toISOString().slice(0, 10));

  const person = APP_PEOPLE.find(p => p.login === login);
  const mine = entries.filter(e => e.userLogin === login && dayOf(e.timestamp) === day);
  const acessos = mine.filter(e => (e.kind ?? 'acesso') === 'acesso');
  const alteracoes = mine.filter(e => e.kind === 'alteracao');
  const pendencias = projects.flatMap(p =>
    (p.approvals ?? [])
      .filter(a => a.status === 'Pendente' && (a.author === person?.name || a.author === login))
      .map(a => ({ id: `${p.id}-${a.id}`, date: a.date, project: p.name, detail: `${a.action} · ${a.targetPath}` })),
  );

  return (
    <div className="max-w-5xl flex flex-col gap-4">
      <Back onClick={onBack} label="Acompanhamento individual" />

      <div className="flex items-center gap-2 flex-wrap">
        <select value={login} onChange={e => setLogin(e.target.value)} className="px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', background: '#fff' }}>
          {people.map(p => <option key={p.login} value={p.login}>{p.name} — {ROLE_LABEL[p.role as UserRole]}</option>)}
        </select>
        <input type="date" value={day} onChange={e => setDay(e.target.value)} className="px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', background: '#fff' }} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel title="Campos acessados" count={acessos.length} color="#2563EB">
          {acessos.map(e => (
            <Row key={e.id} left={formatTs(e.timestamp)} main={e.area} sub={e.detail ?? e.action} />
          ))}
        </Panel>
        <Panel title="Alterações realizadas" count={alteracoes.length} color="#059669">
          {alteracoes.map(e => (
            <Row key={e.id} left={formatTs(e.timestamp)} main={`${e.area} · ${e.action}`} sub={`${e.projectName ? `${e.projectName} — ` : ''}${e.detail ?? ''}`} />
          ))}
        </Panel>
        <Panel title="Pendências" count={pendencias.length} color="#D97706">
          {pendencias.map(p => (
            <Row key={p.id} left={formatTs(p.date)} main={p.project} sub={p.detail} />
          ))}
        </Panel>
      </div>

      <p style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
        A cada 7 dias este acompanhamento é consolidado em planilha e enviado aos administradores com o título
        “Acompanhamento individual - (nome do membro)” seguido da data inicial e final da semana, junto com o registro de projetos.
      </p>
    </div>
  );
}

function Panel({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0F172A' }}>{title}</span>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: `${color}1A`, color }}>{count}</span>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {count === 0
          ? <div className="py-8 text-center" style={{ fontSize: '0.76rem', color: '#94A3B8' }}>Nada neste dia.</div>
          : children}
      </div>
    </div>
  );
}

function Row({ left, main, sub }: { left: string; main: string; sub?: string }) {
  return (
    <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: '#94A3B8' }}>{left}</div>
      <div style={{ fontSize: '0.78rem', color: '#0F172A' }}>{main}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{sub}</div>}
    </div>
  );
}
