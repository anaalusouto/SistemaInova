// Blocos de UI compartilhados entre as abas do Diagnóstico (Matriz Funcional,
// IEO, Cesta de Produtos, Parecer Técnico) — mesmo padrão visual em todas.

export function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--ink-4)', minWidth: 110 }}>{label}:</span>
      <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{valor}</span>
    </div>
  );
}

export function OpcaoGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-4)' }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all text-left"
      style={{
        background: active ? 'var(--primary)' : 'var(--surface-0)',
        color: active ? 'var(--primary-foreground)' : 'var(--ink-4)',
        border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
      }}
    >
      {children}
    </button>
  );
}
