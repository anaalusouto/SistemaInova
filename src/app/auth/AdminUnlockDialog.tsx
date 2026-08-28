import { useState, type FormEvent } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useAuth } from './authStore';

interface Props {
  title?: string;
  description?: string;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Modal that asks for admin credentials before performing a sensitive action.
 * Does NOT change the current session; simply validates and calls onSuccess.
 */
export function AdminUnlockDialog({ title = 'Ação restrita', description = 'Informe as credenciais administrativas para continuar.', onSuccess, onClose }: Props) {
  const { verifyAdmin } = useAuth();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (verifyAdmin(login, password)) {
      onSuccess();
      onClose();
    } else {
      setError('Credenciais administrativas inválidas.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(15, 23, 42, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-card rounded-2xl border p-6 flex flex-col gap-4"
        style={{ borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--warning-soft)' }}>
              <ShieldCheck size={17} color="var(--warning)" />
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>{title}</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--ink-4)', marginTop: 2 }}>{description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X size={14} color="var(--ink-4)" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login administrador</span>
            <input autoFocus className="ci" value={login} onChange={e => setLogin(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</span>
            <input className="ci" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && (
            <div style={{ fontSize: '0.72rem', color: 'var(--danger)', background: 'var(--danger-soft)', padding: '7px 10px', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px] font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
              Cancelar
            </button>
            <button type="submit" className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: 'var(--primary)' }}>
              Confirmar
            </button>
          </div>
        </form>

        <style>{`.ci{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
        .ci:focus{border-color:var(--primary);background:var(--surface-0)}`}</style>
      </div>
    </div>
  );
}
