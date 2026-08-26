import { useState, type FormEvent } from 'react';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from './authStore';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const user = signIn(login, password, remember);
    if (!user) setError('E-mail ou senha inválidos.');
  };

  return (
    <div
      className="relative flex items-center justify-center h-screen w-screen p-6 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('https://mundolenny.com.br/wp-content/uploads/2022/09/MundoLenny_DiaDaAmazonia.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'rgba(15, 23, 42, 0.72)' }} />
      <div className="relative w-full max-w-sm bg-card rounded-2xl border p-7 flex flex-col gap-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <ShieldCheck size={22} color="#fff" />
          </div>
          <div className="text-center">
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem', color: '#0F172A' }}>
              Sistema Inova
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 3 }}>
              Acesse o portfólio de projetos institucionais
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-mail</span>
            <input
              className="ci"
              value={login}
              onChange={e => setLogin(e.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="nome@cesupa.br"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</span>
            <input
              className="ci"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <label className="flex items-center gap-2 mt-0.5" style={{ fontSize: '0.75rem', color: '#475569' }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Lembrar de mim neste computador
          </label>

          {error && (
            <div style={{ fontSize: '0.75rem', color: '#DC2626', background: '#FEF2F2', padding: '8px 10px', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white mt-1"
            style={{ background: 'var(--primary)' }}
          >
            <LogIn size={14} /> Entrar
          </button>
        </form>

        <div style={{ fontSize: '0.7rem', color: '#94A3B8', textAlign: 'center', lineHeight: 1.6 }}>
          Acesso restrito · Todos os acessos são registrados
        </div>

        <style>{`.ci{border:1px solid var(--border);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;width:100%;background:#F8FAFC;color:#0F172A}
        .ci:focus{border-color:var(--primary);background:#fff}`}</style>
      </div>
    </div>
  );
}
