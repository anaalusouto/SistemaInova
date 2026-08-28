import { Check, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import type { OpEntity, PendingApproval } from '../../data/projectExtras';
import { useStore } from '../../store';
import { useAuth, hasAdminPowers } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';

const actionLabel: Record<string, string> = { criar: 'Criar', editar: 'Editar', excluir: 'Excluir' };

interface Props {
  projectId: number;
  approvals: PendingApproval[];
  /** Filtra por entidade; sem filtro mostra todas. */
  entities?: OpEntity[];
}

/** Faixa com solicitações pendentes de validação de administrador. */
export function ApprovalsBanner({ projectId, approvals, entities }: Props) {
  const { approveMetaEdit, rejectMetaEdit, getProject } = useStore();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const isAdmin = hasAdminPowers(user);
  const adminName = user?.displayName ?? 'Administrador';
  const projectName = getProject(projectId)?.name;

  const record = (action: string, detail: string) =>
    audit({
      userLogin: user?.login ?? '—', area: 'aprovações', action, detail,
      projectId, projectName, kind: 'alteracao',
    });

  const pending = approvals.filter(
    a => a.status === 'Pendente' && (!entities || entities.includes(a.entity)),
  );
  if (pending.length === 0) return null;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--warning-soft-border)', background: 'var(--warning-soft)' }}>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={14} color="var(--warning-strong-text)" />
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning-strong-text)' }}>
          {pending.length} alteração(ões) aguardando validação de administrador
        </span>
      </div>
      <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
        {pending.map(a => (
          <div key={a.id} className="flex items-center justify-between gap-3 bg-card rounded-lg border px-3 py-2" style={{ borderColor: 'var(--warning-soft-border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-1)' }}>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase mr-2" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                {actionLabel[a.action] ?? a.action} · {a.entity}
              </span>
              <strong>{a.author}</strong> · {a.targetPath}
              {a.field ? ` · ${a.field}` : ''}
              {a.action === 'editar' && (
                <>
                  {': '}
                  <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{a.from || '—'}</span>
                  {' → '}
                  <span style={{ color: 'var(--success)' }}>{a.to}</span>
                </>
              )}
              {a.action === 'criar' && a.to ? <span style={{ color: 'var(--success)' }}>: {a.to}</span> : null}
            </div>
            {isAdmin ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => {
                    approveMetaEdit(projectId, a.id, adminName);
                    record('aprovar alteração', `${actionLabel[a.action] ?? a.action} · ${a.entity} · ${a.targetPath}`);
                    toast.success('Alteração aprovada.');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-white"
                  style={{ background: 'var(--success)' }}
                ><Check size={11} /> Aprovar</button>
                <button
                  onClick={() => {
                    rejectMetaEdit(projectId, a.id, adminName);
                    record('recusar alteração', `${actionLabel[a.action] ?? a.action} · ${a.entity} · ${a.targetPath}`);
                    toast.error('Alteração recusada.');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border"
                  style={{ borderColor: 'var(--danger-soft-border)', color: 'var(--danger)' }}
                ><X size={11} /> Recusar</button>
              </div>
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--warning-strong-text)' }}>Aguardando administrador</span>
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
