import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  User, Bell, Users, ChevronRight, Check, LogOut, Mail, Lock, FolderKanban, UserSearch, Search, ArrowLeft, Palette, Sun, Moon,
  UserCog, Plus, Trash2, X,
} from 'lucide-react';
import { usePeople, ROLE_LABEL, useAuth, type UserRole } from '../auth/authStore';
import { listarUsuarios, criarUsuario, atualizarUsuario, excluirUsuario, type ManagedUser } from '../usuarios.server';
import { AdminUnlockDialog } from '../auth/AdminUnlockDialog';
import { useAudit } from '../audit/auditStore';
import { useStore } from '../store';
import { useTheme, ACCENT_LABEL, ACCENT_SWATCH, type AccentColor } from '../theme/themeStore';

const NOTIF_KEY = 'pp-notificacoes-v1';

interface NotifPrefs { deadlines: boolean }
const defaultPrefs: NotifPrefs = { deadlines: false };

const formatTs = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  } catch { return iso; }
};
const dayOf = (iso: string) => iso.slice(0, 10);

export function ConfiguracoesPage() {
  const { user, isAdmin, signOut, verifyOwnPassword, onlineLogins } = useAuth();
  const APP_PEOPLE = usePeople();
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
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'team', label: 'Equipe', icon: Users },
    ...(isAdmin ? [{ id: 'usuarios', label: 'Usuários', icon: UserCog }] : []),
    ...(isAdmin ? [{ id: 'registros', label: 'Registros', icon: FolderKanban }] : []),
  ];

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <div className="w-52 border-r flex-shrink-0 py-6 px-3 flex flex-col" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        <div className="px-3 mb-4">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
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
                  background: isActive ? 'var(--brand-soft)' : 'transparent',
                  color: isActive ? 'var(--brand)' : 'var(--ink-3)',
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
          style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
        >
          <LogOut size={13} /> Sair
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeSection === 'profile' && (
          <div className="max-w-3xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>
                Perfil do Usuário
              </h2>
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={user?.role === 'admin' ? { background: 'var(--warning-soft)', color: 'var(--warning-strong-text)' } : { background: 'var(--brand-soft)', color: 'var(--brand)' }}
              >
                {ROLE_LABEL[(user?.role ?? 'estagiario') as UserRole]}
              </span>
            </div>

            <div className="flex items-center gap-4 p-5 bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontFamily: 'var(--font-heading)' }}
              >
                {user?.login.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--ink-1)' }}>{user?.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-4)' }}>Login: {user?.login}</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'appearance' && <AparenciaSection />}

        {activeSection === 'notifications' && (
          <NotificacoesSection prefs={prefs} setPrefs={setPrefs} />
        )}

        {activeSection === 'usuarios' && isAdmin && <UsuariosSection />}

        {activeSection === 'team' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>
              Equipe
            </h2>
            <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
                    {['Membro', 'Função', ...(isAdmin ? ['Status'] : [])].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                              {m.name.split(' ').map(x => x[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink-1)' }}>{m.name}</div>
                              {isAdmin && <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{m.login}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}>{ROLE_LABEL[m.role as UserRole]}</span>
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={online ? { background: 'var(--success-soft)', color: 'var(--success)' } : { background: 'var(--surface-2)', color: 'var(--ink-4)' }}
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
              <h2 className="mb-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>
                Registros
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginBottom: 12 }}>
                Área restrita. Confirme sua senha para acessar os registros de projetos e o acompanhamento individual.
              </p>
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (await verifyOwnPassword(pwd)) { setRegistrosUnlocked(true); setPwd(''); }
                  else toast.error('Senha incorreta.');
                }}
                className="bg-card rounded-xl border p-4 flex flex-col gap-3"
                style={{ borderColor: 'var(--border)' }}
              >
                <label className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'var(--ink-4)' }}>
                  <Lock size={11} /> Senha do seu login
                </label>
                <input
                  type="password" autoFocus value={pwd} onChange={e => setPwd(e.target.value)}
                  className="px-3 py-2 rounded-lg text-[13px]"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface-1)' }}
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

const ACCENT_OPTIONS: AccentColor[] = ['azul', 'rosa', 'verde', 'amarelo'];

function AparenciaSection() {
  const { mode, accent, setMode, setAccent } = useTheme();

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>
        Aparência
      </h2>

      <div className="bg-card rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-1)' }}>Tema</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-5)', marginTop: 2 }}>Escolha entre o modo claro ou escuro para a plataforma.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('light')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium border transition-colors"
            style={{
              borderColor: mode === 'light' ? 'var(--brand)' : 'var(--border)',
              background: mode === 'light' ? 'var(--brand-soft)' : 'transparent',
              color: mode === 'light' ? 'var(--brand-text)' : 'var(--ink-3)',
            }}
          >
            <Sun size={14} /> Claro
          </button>
          <button
            onClick={() => setMode('dark')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium border transition-colors"
            style={{
              borderColor: mode === 'dark' ? 'var(--brand)' : 'var(--border)',
              background: mode === 'dark' ? 'var(--brand-soft)' : 'transparent',
              color: mode === 'dark' ? 'var(--brand-text)' : 'var(--ink-3)',
            }}
          >
            <Moon size={14} /> Escuro
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink-1)' }}>Cor de destaque</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-5)', marginTop: 2 }}>
            Define a cor dos botões principais, itens ativos do menu e links em toda a plataforma.
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ACCENT_OPTIONS.map(a => {
            const isActive = accent === a;
            return (
              <button
                key={a}
                onClick={() => setAccent(a)}
                aria-label={ACCENT_LABEL[a]}
                title={ACCENT_LABEL[a]}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className="rounded-full flex items-center justify-center transition-transform"
                  style={{
                    width: 34, height: 34, background: ACCENT_SWATCH[a],
                    outline: isActive ? `2px solid ${ACCENT_SWATCH[a]}` : 'none',
                    outlineOffset: 2,
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {isActive && <Check size={15} color="var(--primary-foreground)" />}
                </span>
                <span style={{ fontSize: '0.68rem', color: isActive ? 'var(--ink-1)' : 'var(--ink-5)', fontWeight: isActive ? 600 : 400 }}>
                  {ACCENT_LABEL[a]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
        As preferências de aparência ficam salvas neste dispositivo.
      </p>
    </div>
  );
}

/* ============================================================
   NOTIFICAÇÕES POR E-MAIL
   ============================================================ */

function NotificacoesSection({ prefs, setPrefs }: { prefs: NotifPrefs; setPrefs: (p: NotifPrefs | ((p: NotifPrefs) => NotifPrefs)) => void }) {
  const { updateNotificationPrefs } = useAuth();
  const [emailOn, setEmailOn] = useState(false);
  const [address, setAddress] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const startSave = () => {
    if (emailOn && !address.trim()) { toast.error('Informe um e-mail para ativar os avisos.'); return; }
    setShowPwd(true);
  };

  const confirmSave = async () => {
    if (!pwd) return;
    setSaving(true);
    try {
      const ok = await updateNotificationPrefs(pwd, address, emailOn);
      if (ok) { toast.success('Preferências salvas.'); setShowPwd(false); setPwd(''); }
      else toast.error('Senha incorreta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl flex flex-col gap-6">
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>
        Notificações
      </h2>

      <div className="bg-card rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
        <Toggle
          label="Notificações por e-mail"
          desc="Avisa por e-mail quando uma solicitação sua for aprovada/recusada (ou, se você for administrador, quando alguém enviar uma nova solicitação)."
          on={emailOn}
          onChange={v => setEmailOn(v)}
        />
        {emailOn && (
          <div className="pl-1">
            <label className="text-[11px] font-medium flex items-center gap-1.5 mb-1" style={{ color: 'var(--ink-4)' }}>
              <Mail size={11} /> E-mail para envio
            </label>
            <input
              type="email"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="nome@dominio.com"
              className="w-full px-3 py-2 rounded-lg text-[13px]"
              style={{ border: '1px solid var(--border)', background: 'var(--surface-1)' }}
            />
          </div>
        )}

        <div className="border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <Toggle
            label="Alerta de prazos"
            desc="No mesmo e-mail: aviso quando a atividade passa da metade do prazo e quando ultrapassa o prazo final."
            on={prefs.deadlines}
            disabled={!emailOn}
            onChange={v => setPrefs(p => ({ ...p, deadlines: v }))}
          />
          {!emailOn && (
            <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginTop: 6 }}>
              Disponível apenas com as notificações por e-mail ligadas. (Este alerta específico ainda depende de uma rotina agendada — chega quando ela estiver configurada.)
            </p>
          )}
        </div>

        {!showPwd ? (
          <button onClick={startSave} className="self-start px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>
            Salvar preferências
          </button>
        ) : (
          <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <label className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'var(--ink-4)' }}>
              <Lock size={11} /> Confirme sua senha para salvar
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password" autoFocus value={pwd} onChange={e => setPwd(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmSave()}
                className="flex-1 px-3 py-2 rounded-lg text-[13px]"
                style={{ border: '1px solid var(--border)', background: 'var(--surface-1)' }}
              />
              <button onClick={confirmSave} disabled={saving} className="px-3 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-60" style={{ background: 'var(--primary)' }}>
                {saving ? 'Salvando…' : 'Confirmar'}
              </button>
              <button onClick={() => { setShowPwd(false); setPwd(''); }} className="px-2 py-2 rounded-lg" style={{ color: 'var(--ink-4)' }}><X size={14} /></button>
            </div>
          </div>
        )}
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
        O e-mail e a preferência ficam salvos na sua conta (não só neste dispositivo).
      </p>
    </div>
  );
}

/* ============================================================
   USUÁRIOS E PAPÉIS (admin)
   ============================================================ */

const ROLE_OPTIONS: UserRole[] = ['admin', 'estagiario', 'visualizador'];

function UsuariosSection() {
  const { refreshPeople } = useAuth();
  const [rows, setRows] = useState<ManagedUser[] | null>(null);
  const [unlock, setUnlock] = useState<{ login: string; senha: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = async (login: string, senha: string) => {
    try {
      setRows(await listarUsuarios({ data: { actingLogin: login, actingSenha: senha } }));
      setUnlock({ login, senha });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível carregar os usuários.');
    }
  };

  const run = async (action: (creds: { actingLogin: string; actingSenha: string }) => Promise<void>, successMsg: string) => {
    if (!unlock) return;
    try {
      await action({ actingLogin: unlock.login, actingSenha: unlock.senha });
      toast.success(successMsg);
      await load(unlock.login, unlock.senha);
      refreshPeople();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível concluir.');
    }
  };

  if (!unlock) {
    return (
      <div className="max-w-sm">
        <h2 className="mb-2" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>
          Usuários
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginBottom: 12 }}>
          Área restrita. Confirme sua senha de administrador para gerenciar contas e papéis (admin / estagiário / visualizador).
        </p>
        {dialogOpen ? (
          <AdminUnlockDialog
            title="Gerenciar usuários"
            description="Confirme suas credenciais de administrador para ver e editar contas."
            onSuccess={(login, senha) => load(login, senha)}
            onClose={() => setDialogOpen(false)}
          />
        ) : (
          <button onClick={() => setDialogOpen(true)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>
            Tentar de novo
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>Usuários</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginTop: 2 }}>
            Administradores têm poder total (edição e aprovação em tudo). Estagiários podem ter poderes de admin ativados individualmente.
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-white" style={{ background: 'var(--primary)' }}>
          <Plus size={13} /> Novo usuário
        </button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'Login', 'Papel', 'Admin total', 'E-mail', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.login} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-2.5" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--ink-1)' }}>{r.displayName}</td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.75rem', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>{r.login}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={r.role}
                    onChange={e => run(creds => atualizarUsuario({ data: { ...creds, alvoLogin: r.login, role: e.target.value as UserRole } }), 'Papel atualizado.')}
                    className="px-2 py-1 rounded-md text-[12px]"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface-0)' }}
                  >
                    {ROLE_OPTIONS.map(o => <option key={o} value={o}>{ROLE_LABEL[o]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="checkbox" checked={r.adminOverride}
                    onChange={e => run(creds => atualizarUsuario({ data: { ...creds, alvoLogin: r.login, adminOverride: e.target.checked } }), 'Atualizado.')}
                  />
                </td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.75rem', color: 'var(--ink-4)' }}>{r.email ?? '—'}</td>
                <td className="px-4 py-2.5 text-right">
                  {r.login.toLowerCase() !== unlock.login.toLowerCase() && (
                    confirmDelete === r.login ? (
                      <span className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => { run(creds => excluirUsuario({ data: { ...creds, alvoLogin: r.login } }), 'Usuário excluído.'); setConfirmDelete(null); }}
                          className="px-2 py-1 rounded text-[11px] font-medium text-white" style={{ background: 'var(--danger)' }}
                        >Confirmar</button>
                        <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded text-[11px]" style={{ color: 'var(--ink-4)' }}>Cancelar</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(r.login)} className="p-1.5 rounded hover:bg-accent" title="Excluir">
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNew && (
        <NovoUsuarioModal
          onClose={() => setShowNew(false)}
          onCreate={async (data) => {
            await run(creds => criarUsuario({ data: { ...creds, ...data } }), 'Usuário criado.');
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
}

function NovoUsuarioModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (d: { login: string; senha: string; nomeExibicao: string; role: UserRole; adminOverride?: boolean; email?: string }) => Promise<void>;
}) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [role, setRole] = useState<UserRole>('estagiario');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!login.trim() || !senha.trim() || !nome.trim()) { toast.error('Preencha login, senha e nome.'); return; }
    setSaving(true);
    try { await onCreate({ login, senha, nomeExibicao: nome, role, email: email || undefined }); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(15, 23, 42, 0.5)' }} onClick={onClose}>
      <div className="w-full max-w-sm bg-card rounded-2xl border p-6 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>Novo usuário</h3>
          <button onClick={onClose}><X size={16} color="var(--ink-4)" /></button>
        </div>
        <Field label="Nome de exibição"><input className="ci2" value={nome} onChange={e => setNome(e.target.value)} /></Field>
        <Field label="Login"><input className="ci2" value={login} onChange={e => setLogin(e.target.value)} /></Field>
        <Field label="Senha"><input className="ci2" type="password" value={senha} onChange={e => setSenha(e.target.value)} /></Field>
        <Field label="E-mail (opcional, para notificações)"><input className="ci2" type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
        <Field label="Papel">
          <select className="ci2" value={role} onChange={e => setRole(e.target.value as UserRole)}>
            {ROLE_OPTIONS.map(o => <option key={o} value={o}>{ROLE_LABEL[o]}</option>)}
          </select>
        </Field>
        <button onClick={submit} disabled={saving} className="mt-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-60" style={{ background: 'var(--primary)' }}>
          {saving ? 'Criando…' : 'Criar usuário'}
        </button>
        <style>{`.ci2{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)' }}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, desc, on, onChange, disabled }: {
  label: string; desc: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: disabled ? 'var(--ink-5)' : 'var(--ink-1)' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-5)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button
        disabled={disabled}
        onClick={() => onChange(!on)}
        style={{ background: on ? 'var(--brand)' : 'var(--line-2)', width: 40, height: 22, borderRadius: 999, padding: 2, opacity: disabled ? 0.5 : 1, flexShrink: 0 }}
      >
        <span className="block w-4 h-4 rounded-full bg-card transition-transform" style={{ transform: on ? 'translateX(18px)' : 'translateX(0)' }} />
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
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: 'var(--ink-1)' }}>Registros</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginTop: 2 }}>
            Todo o histórico de alterações do sistema fica concentrado aqui. A cada 7 dias os registros são consolidados e enviados por e-mail aos administradores.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setView('projetos')} className="bg-card rounded-xl border p-5 text-left hover:shadow-md transition-all" style={{ borderColor: 'var(--border)' }}>
            <FolderKanban size={20} color="var(--brand)" />
            <div className="mt-2" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink-1)' }}>Registro de projetos</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-4)' }}>Metas, financeiro, cronograma e contatos de cada um dos {projects.length} projetos.</div>
          </button>
          <button onClick={() => setView('individual')} className="bg-card rounded-xl border p-5 text-left hover:shadow-md transition-all" style={{ borderColor: 'var(--border)' }}>
            <UserSearch size={20} color="var(--info)" />
            <div className="mt-2" style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink-1)' }}>Acompanhamento individual</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-4)' }}>O que cada estagiário ou visualizador fez em um dia específico.</div>
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
                  {p.org && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}>{p.org}</span>}
                  <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>{p.code}</span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-1)' }}>{p.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>
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
      <button onClick={onClick} className="flex items-center gap-1 text-[12px]" style={{ color: 'var(--ink-4)' }}>
        <ArrowLeft size={13} /> Voltar
      </button>
      <span style={{ color: 'var(--line-2)' }}>·</span>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink-1)' }}>{label}</h2>
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
          <Search size={14} color="var(--ink-5)" />
          <input className="flex-1 outline-none text-[13px] bg-transparent" placeholder="Buscar por responsável, área ou alteração…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <input type="date" value={day} onChange={e => setDay(e.target.value)} className="px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }} />
        {(q || day) && (
          <button onClick={() => { setQ(''); setDay(''); }} className="px-3 py-2 rounded-lg border text-[12px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Limpar</button>
        )}
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--surface-1)' }}>
              {['Data e hora', 'Login', 'Área', 'Ação', 'Alteração'].map(h => (
                <th key={h} className="px-4 py-2 text-left" style={{ fontSize: '0.67rem', fontWeight: 700, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="py-10 text-center" style={{ fontSize: '0.8rem', color: 'var(--ink-5)' }}>Nenhum registro encontrado.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-2" style={{ fontSize: '0.73rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{formatTs(r.date)}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--ink-1)' }}>{r.author}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{r.area}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{r.action}</td>
                <td className="px-4 py-2" style={{ fontSize: '0.74rem', color: 'var(--ink-4)' }}>{r.detail}</td>
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
  const APP_PEOPLE = usePeople();
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
        <select value={login} onChange={e => setLogin(e.target.value)} className="px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
          {people.map(p => <option key={p.login} value={p.login}>{p.name} — {ROLE_LABEL[p.role as UserRole]}</option>)}
        </select>
        <input type="date" value={day} onChange={e => setDay(e.target.value)} className="px-3 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Panel title="Campos acessados" count={acessos.length} color="var(--brand)">
          {acessos.map(e => (
            <Row key={e.id} left={formatTs(e.timestamp)} main={e.area} sub={e.detail ?? e.action} />
          ))}
        </Panel>
        <Panel title="Alterações realizadas" count={alteracoes.length} color="var(--success)">
          {alteracoes.map(e => (
            <Row key={e.id} left={formatTs(e.timestamp)} main={`${e.area} · ${e.action}`} sub={`${e.projectName ? `${e.projectName} — ` : ''}${e.detail ?? ''}`} />
          ))}
        </Panel>
        <Panel title="Pendências" count={pendencias.length} color="var(--warning)">
          {pendencias.map(p => (
            <Row key={p.id} left={formatTs(p.date)} main={p.project} sub={p.detail} />
          ))}
        </Panel>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
        A cada 7 dias este acompanhamento é consolidado em planilha e enviado aos administradores com o título
        “Acompanhamento individual - (nome do membro)” seguido da data inicial e final da semana, junto com o registro de projetos.
      </p>
    </div>
  );
}

function Panel({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden flex flex-col" style={{ borderColor: 'var(--border)' }}>
      <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-1)' }}>{title}</span>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: `${color}1A`, color }}>{count}</span>
      </div>
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {count === 0
          ? <div className="py-8 text-center" style={{ fontSize: '0.76rem', color: 'var(--ink-5)' }}>Nada neste dia.</div>
          : children}
      </div>
    </div>
  );
}

function Row({ left, main, sub }: { left: string; main: string; sub?: string }) {
  return (
    <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-5)' }}>{left}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--ink-1)' }}>{main}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>{sub}</div>}
    </div>
  );
}
