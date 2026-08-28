import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Check, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';
import { useAuth } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';
import type { PendingApproval } from '../data/projectExtras';

const actionLabel: Record<string, string> = { criar: 'Criar', editar: 'Editar', excluir: 'Excluir' };
const entityLabel: Record<string, string> = {
  meta: 'Meta', etapa: 'Etapa', especificacao: 'Especificação', risco: 'Risco', mudanca: 'Mudança', financeiro: 'Financeiro',
};

type FilterTab = 'pendentes' | 'aprovadas' | 'recusadas' | 'todas';

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'aprovadas', label: 'Aprovadas' },
  { id: 'recusadas', label: 'Recusadas' },
  { id: 'todas', label: 'Todas' },
];

const statusStyle: Record<PendingApproval['status'], { bg: string; fg: string; label: string }> = {
  Pendente: { bg: 'var(--warning-soft)', fg: 'var(--warning-strong-text)', label: 'Pendente' },
  Aprovado: { bg: 'var(--success-soft)', fg: 'var(--success-strong-text)', label: 'Aprovada' },
  Recusado: { bg: 'var(--danger-soft)', fg: 'var(--danger-strong-text)', label: 'Recusada' },
};

const formatTs = (iso: string) => {
  try { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)); }
  catch { return iso; }
};

interface Row extends PendingApproval {
  projectId: number;
  projectName: string;
}

interface Props {
  /** Navega até o projeto/aba de aprovações relacionada (opcional). */
  onOpenProject?: (projectId: number) => void;
}

/** Sino de notificações para administradores: solicitações recentes, quem pediu e o status. */
export function NotificationsBell({ onOpenProject }: Props) {
  const { projects, approveMetaEdit, rejectMetaEdit } = useStore();
  const { user, isAdmin } = useAuth();
  const { log: audit } = useAudit();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<FilterTab>('pendentes');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const rows = useMemo<Row[]>(() => {
    return projects
      .flatMap(p => (p.approvals ?? []).map(a => ({ ...a, projectId: p.id, projectName: p.name })))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [projects]);

  const pendingCount = rows.filter(r => r.status === 'Pendente').length;

  const filtered = useMemo(() => {
    switch (tab) {
      case 'pendentes': return rows.filter(r => r.status === 'Pendente');
      case 'aprovadas': return rows.filter(r => r.status === 'Aprovado');
      case 'recusadas': return rows.filter(r => r.status === 'Recusado');
      default: return rows;
    }
  }, [rows, tab]);

  if (!isAdmin) return null;
  const adminName = user?.displayName ?? 'Administrador';

  const record = (row: Row, action: string) => audit({
    userLogin: user?.login ?? '—', area: 'aprovações', action, detail: `${actionLabel[row.action] ?? row.action} · ${entityLabel[row.entity] ?? row.entity} · ${row.targetPath}`,
    projectId: row.projectId, projectName: row.projectName, kind: 'alteracao',
  });

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notificações"
        className="relative flex items-center justify-center rounded-full transition-colors"
        style={{ width: 34, height: 34, color: 'var(--ink-3)', background: open ? 'var(--surface-2)' : 'transparent' }}
      >
        <Bell size={17} />
        {pendingCount > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full text-white font-bold"
            style={{ top: 2, right: 2, minWidth: 15, height: 15, fontSize: '9px', padding: '0 3px', background: 'var(--danger)' }}
          >
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 rounded-xl border shadow-lg flex flex-col overflow-hidden z-50"
          style={{ width: 380, maxWidth: '90vw', background: 'var(--surface-0)', borderColor: 'var(--line-1)' }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--line-1)' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--ink-1)' }}>
              Notificações
            </span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'var(--warning-soft)', color: 'var(--warning-strong-text)' }}>
                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 px-3 pt-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors"
                style={{
                  background: tab === t.id ? 'var(--brand-soft)' : 'transparent',
                  color: tab === t.id ? 'var(--brand-text)' : 'var(--ink-4)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 420, marginTop: 8 }}>
            {filtered.length === 0 ? (
              <div className="py-10 text-center" style={{ fontSize: '0.8rem', color: 'var(--ink-5)' }}>
                Nenhuma solicitação por aqui.
              </div>
            ) : filtered.map(row => {
              const st = statusStyle[row.status];
              return (
                <div
                  key={row.id}
                  className="px-4 py-3 border-b flex flex-col gap-1.5 cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--line-1)' }}
                  onClick={() => { onOpenProject?.(row.projectId); setOpen(false); }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                      {actionLabel[row.action] ?? row.action} · {entityLabel[row.entity] ?? row.entity}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1" style={{ background: st.bg, color: st.fg }}>
                      {row.status === 'Pendente' && <Clock size={9} />}
                      {row.status === 'Aprovado' && <Check size={9} />}
                      {row.status === 'Recusado' && <X size={9} />}
                      {st.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-1)' }}>
                    <strong>{row.author}</strong> solicitou em <strong>{row.projectName}</strong>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--ink-4)' }}>
                    {row.targetPath}{row.field ? ` · ${row.field}` : ''}
                    {row.action === 'editar' && (
                      <>
                        {': '}
                        <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{row.from || '—'}</span>
                        {' → '}
                        <span style={{ color: 'var(--success)' }}>{row.to}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>
                      {formatTs(row.date)}
                      {row.reviewedBy ? ` · revisado por ${row.reviewedBy}` : ''}
                    </span>
                    {row.status === 'Pendente' && (
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            approveMetaEdit(row.projectId, row.id, adminName);
                            record(row, 'aprovar alteração');
                            toast.success('Alteração aprovada.');
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-white"
                          style={{ background: 'var(--success)' }}
                        ><Check size={10} /> Aprovar</button>
                        <button
                          onClick={() => {
                            rejectMetaEdit(row.projectId, row.id, adminName);
                            record(row, 'recusar alteração');
                            toast.error('Alteração recusada.');
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border"
                          style={{ borderColor: 'var(--danger-soft-border)', color: 'var(--danger)' }}
                        ><X size={10} /> Recusar</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
