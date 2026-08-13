import { Check, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import type { OpEntity, PendingApproval } from '../../data/projectExtras';
import { useStore } from '../../store';
import { useAuth, hasAdminPowers } from '../../auth/authStore';

const actionLabel: Record<string, string> = { criar: 'Criar', editar: 'Editar', excluir: 'Excluir' };

interface Props {
  projectId: number;
  approvals: PendingApproval[];
  /** Filtra por entidade; sem filtro mostra todas. */
  entities?: OpEntity[];
}

/** Faixa com solicitações pendentes de validação de administrador. */
export function ApprovalsBanner({ projectId, approvals, entities }: Props) {
  const { approveMetaEdit, rejectMetaEdit } = useStore();
  const { user } = useAuth();
  const isAdmin = hasAdminPowers(user);
  const adminName = user?.displayName ?? 'Administrador';

  const pending = approvals.filter(
    a => a.status === 'Pendente' && (!entities || entities.includes(a.entity)),
  );
  if (pending.length === 0) return null;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: '#FCD34D', background: '#FFFBEB' }}>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} color="#B45309" />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#B45309' }}>
          {pending.length} alteração(ões) aguardando validação de administrador
        </span>
      </div>
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
        {pending.map(a => (
          <div key={a.id} className="flex items-center justify-between gap-3 bg-white rounded-lg border px-3 py-2" style={{ borderColor: '#FDE68A' }}>
            <div style={{ fontSize: '0.75rem', color: '#0F172A' }}>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase mr-2" style={{ background: '#F1F5F9', color: '#475569' }}>
                {actionLabel[a.action] ?? a.action} · {a.entity}
              </span>
              <strong>{a.author}</strong> · {a.targetPath}
              {a.field ? ` · ${a.field}` : ''}
              {a.action === 'editar' && (
                <>
                  {': '}
                  <span style={{ color: '#DC2626', textDecoration: 'line-through' }}>{a.from || '—'}</span>
                  {' → '}
                  <span style={{ color: '#059669' }}>{a.to}</span>
                </>
              )}
              {a.action === 'criar' && a.to ? <span style={{ color: '#059669' }}>: {a.to}</span> : null}
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => { approveMetaEdit(projectId, a.id, adminName); toast.success('Alteração aprovada.'); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-white"
                  style={{ background: '#059669' }}
                ><Check size={11} /> Aprovar</button>
                <button
                  onClick={() => { rejectMetaEdit(projectId, a.id, adminName); toast.error('Alteração recusada.'); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border"
                  style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                ><X size={11} /> Recusar</button>
              </div>
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#B45309' }}>Aguardando administrador</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Hook utilitário: monta o autor da operação a partir da sessão. */
export function useOpAuthor() {
  const { user } = useAuth();
  const isAdmin = hasAdminPowers(user);
  return {
    author: { name: user?.displayName ?? 'Desconhecido', role: user?.role ?? 'estagiario', isAdmin },
    isAdmin,
  };
}
