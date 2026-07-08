import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  User,
  Bell,
  Shield,
  Users,
  Tag,
  ChevronRight,
  Check,
  LogOut,
  History,
  Mail,
} from 'lucide-react';
import { useAuth } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';

const sections = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'security', label: 'Segurança', icon: Shield },
  { id: 'team', label: 'Equipe', icon: Users },
  { id: 'categories', label: 'Categorias', icon: Tag },
];

const initialTeam = [
  { name: 'Ana Costa', email: 'ana.costa@org.gov.br', role: 'Coordenadora', avatar: 'AC', active: true },
  { name: 'Carlos Lima', email: 'carlos.lima@org.gov.br', role: 'Coordenador', avatar: 'CL', active: true },
  { name: 'Mariana Souza', email: 'mariana.souza@org.gov.br', role: 'Coordenadora', avatar: 'MS', active: true },
  { name: 'Pedro Alves', email: 'pedro.alves@org.gov.br', role: 'Coordenador', avatar: 'PA', active: true },
  { name: 'Lucas Ferreira', email: 'lucas.ferreira@org.gov.br', role: 'Analista', avatar: 'LF', active: false },
];

const formatTs = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(iso));
  } catch { return iso; }
};

export function ConfiguracoesPage() {
  const { user, signOut } = useAuth();
  const { entries, clear } = useAudit();
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    deadlines: true,
    risks: true,
    changes: false,
    reports: true,
  });
  const [team] = useState(initialTeam);

  const myEntries = useMemo(
    () => entries.filter(e => e.userLogin === user?.login).slice(0, 100),
    [entries, user?.login],
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <div
        className="w-52 border-r flex-shrink-0 py-6 px-3 flex flex-col"
        style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}
      >
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
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
            </div>

            <div className="flex items-center gap-4 p-5 bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'var(--primary)', color: '#fff', fontFamily: 'var(--font-heading)' }}
              >
                {user?.login.slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: '#0F172A' }}>{user?.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>Login: {user?.login}</div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>
                  A edição de dados do perfil é feita em <b>Segurança</b>. Aqui é apenas a visão individual.
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
                <History size={14} color="#475569" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                  Minha atividade
                </h3>
                <span className="ml-auto" style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                  {myEntries.length} registros
                </span>
              </div>
              {myEntries.length === 0 ? (
                <div className="py-10 text-center" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Nenhuma atividade registrada ainda.
                </div>
              ) : (
                <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#FAFAFA' }}>
                        {['Horário', 'Área', 'Ação', 'Detalhe'].map(h => (
                          <th key={h} className="px-4 py-2 text-left" style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myEntries.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-4 py-2" style={{ fontSize: '0.73rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>{formatTs(e.timestamp)}</td>
                          <td className="px-4 py-2" style={{ fontSize: '0.76rem', color: '#0F172A' }}>{e.area}</td>
                          <td className="px-4 py-2" style={{ fontSize: '0.76rem', color: '#475569' }}>{e.action}</td>
                          <td className="px-4 py-2" style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{e.detail ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="max-w-xl flex flex-col gap-6">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
              Notificações
            </h2>
            <div className="p-4 rounded-lg border flex gap-3" style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}>
              <Mail size={16} color="#B45309" style={{ marginTop: 2 }} />
              <div style={{ fontSize: '0.78rem', color: '#78350F', lineHeight: 1.55 }}>
                Envio real por e-mail está <b>parcialmente desenvolvido</b>. As preferências abaixo já ficam salvas; no fluxo final, cada login (e o login administrativo) receberá lembretes por e-mail sobre metas, prazos e alertas.
              </div>
            </div>
            <div className="bg-card rounded-xl border p-5 flex flex-col gap-1" style={{ borderColor: 'var(--border)' }}>
              {[
                { key: 'email' as const, label: 'Notificações por e-mail', desc: 'Receber resumo diário por e-mail' },
                { key: 'deadlines' as const, label: 'Alertas de prazo', desc: 'Avisar 7 dias antes do vencimento de metas' },
                { key: 'risks' as const, label: 'Riscos críticos', desc: 'Notificar ao abrir risco de severidade alta' },
                { key: 'changes' as const, label: 'Mudanças pendentes', desc: 'Avisar quando há mudanças aguardando aprovação' },
                { key: 'reports' as const, label: 'Relatórios automáticos', desc: 'Enviar relatório semanal consolidado' },
              ].map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#0F172A' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <button
                    onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                    style={{
                      background: notifications[item.key] ? '#2563EB' : '#CBD5E1',
                      width: 40,
                      height: 22,
                      borderRadius: 999,
                      padding: 2,
                    }}
                  >
                    <span
                      className="block w-4 h-4 rounded-full bg-white transition-transform"
                      style={{ transform: notifications[item.key] ? 'translateX(18px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div className="max-w-3xl flex flex-col gap-6">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
              Segurança
            </h2>

            <div className="bg-card rounded-xl border p-5 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.95rem', color: '#0F172A' }}>
                Credenciais
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                Nesta versão os logins são fixos (<b>CRIA / INOVA</b> para apresentação e <b>LJCRIA / 12332145+</b> como administrador de testes). A rotação de senha entra na próxima iteração.
              </p>
              <button
                onClick={() => toast.info('Alteração de senha estará disponível na próxima versão.')}
                className="self-start px-3 py-1.5 rounded-lg text-[12px] font-medium border"
                style={{ borderColor: 'var(--border)', color: '#475569' }}
              >
                Alterar senha
              </button>
            </div>

            <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
                <History size={14} color="#475569" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A' }}>
                  Registro completo de auditoria
                </h3>
                <span className="ml-auto flex items-center gap-3">
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{entries.length} registros</span>
                  <button
                    onClick={() => { if (window.confirm('Limpar todo o registro?')) { clear(); toast.success('Registro limpo.'); } }}
                    style={{ fontSize: '0.72rem', color: '#DC2626' }}
                  >
                    Limpar
                  </button>
                </span>
              </div>
              {entries.length === 0 ? (
                <div className="py-10 text-center" style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Nenhum registro ainda.
                </div>
              ) : (
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#FAFAFA' }}>
                        {['Horário', 'Usuário', 'Área', 'Ação', 'Detalhe'].map(h => (
                          <th key={h} className="px-4 py-2 text-left" style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice(0, 200).map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-4 py-2" style={{ fontSize: '0.73rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>{formatTs(e.timestamp)}</td>
                          <td className="px-4 py-2" style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 500 }}>{e.userLogin}</td>
                          <td className="px-4 py-2" style={{ fontSize: '0.76rem', color: '#475569' }}>{e.area}</td>
                          <td className="px-4 py-2" style={{ fontSize: '0.76rem', color: '#475569' }}>{e.action}</td>
                          <td className="px-4 py-2" style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{e.detail ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'team' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
                Equipe
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                Somente visualização — a edição fica em <b>Segurança</b>.
              </span>
            </div>
            <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                    {['Membro', 'Função', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.71rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team.map(m => (
                    <tr key={m.email} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                            {m.avatar}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#0F172A' }}>{m.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>{m.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={m.active ? { background: '#ECFDF5', color: '#059669' } : { background: '#F3F4F6', color: '#6B7280' }}
                        >
                          {m.active ? <Check size={10} /> : null}
                          {m.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'categories' && (
          <div className="max-w-xl flex flex-col gap-6">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.125rem', color: '#0F172A' }}>
              Categorias Financeiras
            </h2>
            <div className="bg-card rounded-xl border p-5 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
              {['Equipamentos', 'Serviços de TI', 'Pessoal', 'Material de Consumo', 'Infraestrutura', 'Comunicação', 'Viagens', 'Treinamento'].map(cat => (
                <div key={cat} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: '#2563EB' }} />
                    <span style={{ fontSize: '0.82rem', color: '#0F172A' }}>{cat}</span>
                  </div>
                </div>
              ))}
              <p style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                Avaliar necessidade desta seção — pode ser removida se não estiver em uso.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
