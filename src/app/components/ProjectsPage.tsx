import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Filter,
  Plus,
  ChevronRight,
  FolderKanban,
  Calendar,
  DollarSign,
  Users,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { type Project, type ProjectStatus } from '../data/mockData';
import type { ProjectExt } from '../store';
import { useStore } from '../store';
import { useAuth } from '../auth/authStore';
import { useAudit } from '../audit/auditStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  'Em andamento': { color: 'var(--brand)', bg: 'var(--brand-soft)', dot: 'var(--brand)' },
  'Concluído':    { color: 'var(--success)', bg: 'var(--success-soft)', dot: 'var(--success)' },
  'Atrasado':     { color: 'var(--danger)', bg: 'var(--danger-soft)', dot: 'var(--danger)' },
  'Não iniciado': { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' },
  'Suspenso':     { color: 'var(--warning)', bg: 'var(--warning-soft)', dot: 'var(--warning)' },
};

interface ProjectsPageProps {
  onSelectProject: (project: Project) => void;
}

/** Filtros preservados enquanto a sessão estiver aberta (entrar/sair de um projeto não limpa). */
const filterMemory: { search: string; categories: string[]; open: boolean } = { search: '', categories: [], open: false };

export function ProjectsPage({ onSelectProject }: ProjectsPageProps) {
  const { projects, addProject, deleteProject } = useStore();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const record = (action: string, detail: string, projectId?: number, projectName?: string) =>
    audit({ userLogin: user?.login ?? '—', area: 'projetos', action, detail, projectId, projectName, kind: 'alteracao' });
  const [search, setSearchState] = useState(filterMemory.search);
  const [selected, setSelectedState] = useState<string[]>(filterMemory.categories);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFiltersState] = useState(filterMemory.open || filterMemory.categories.length > 0);

  const setSearch = (v: string) => { filterMemory.search = v; setSearchState(v); };
  const setSelected = (v: string[]) => { filterMemory.categories = v; setSelectedState(v); };
  const setShowFilters = (v: boolean) => { filterMemory.open = v; setShowFiltersState(v); };

  const categories = ['Comunidades tradicionais', 'Comunidades quilombolas', 'Comunidades indígenas', 'Agricultura familiar'];

  const toggleCategory = (c: string) =>
    setSelected(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);

  const normalized = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const filtered = projects.filter(p => {
    const q = normalized(search);
    const matchSearch =
      !q ||
      normalized(p.name).includes(q) ||
      normalized((p as ProjectExt).org ?? '').includes(q) ||
      normalized((p as ProjectExt).segmento ?? '').includes(q) ||
      normalized(p.coordinator).includes(q) ||
      normalized(p.financier).includes(q) ||
      normalized(p.code).includes(q);
    const matchCategory = selected.length === 0 || selected.includes((p as ProjectExt).segmento ?? '');
    return matchSearch && matchCategory;
  });

  const handleDelete = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Excluir "${name}"? Esta ação não pode ser desfeita.`)) return;
    deleteProject(id);
    record('excluir projeto', name, id, name);
    toast.success('Projeto excluído.');
  };

  return (
    <div className="flex flex-col gap-6 p-7 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)' }}>
            Projetos
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
            {projects.length} projetos no portfólio · {filtered.length} exibidos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white hover:opacity-90"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={14} /> Novo Projeto
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card flex-1"
            style={{ borderColor: 'var(--border)' }}
          >
            <Search size={14} color="var(--ink-5)" />
            <input
              className="flex-1 outline-none text-[13px] bg-transparent"
              placeholder="Buscar projeto, comunidade, coordenador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ color: 'var(--ink-1)' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-medium"
            style={{
              borderColor: showFilters ? 'var(--primary)' : 'var(--border)',
              color: showFilters ? 'var(--primary)' : 'var(--ink-4)',
              background: showFilters ? 'var(--brand-soft)' : 'var(--surface-0)',
            }}
          >
            <Filter size={12} /> Filtros{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-3 rounded-lg border bg-card" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelected([])}
              className="px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
              style={{
                background: selected.length === 0 ? 'var(--primary)' : 'var(--surface-0)',
                color: selected.length === 0 ? 'var(--primary-foreground)' : 'var(--ink-4)',
                border: `1px solid ${selected.length === 0 ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              Todas
            </button>
            {categories.map(c => {
              const on = selected.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all"
                  style={{
                    background: on ? 'var(--primary)' : 'var(--surface-0)',
                    color: on ? 'var(--primary-foreground)' : 'var(--ink-4)',
                    border: `1px solid ${on ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  <span className="inline-flex items-center justify-center rounded-sm"
                    style={{ width: 12, height: 12, border: `1px solid ${on ? 'var(--surface-0)' : 'var(--line-2)'}`, background: on ? 'var(--surface-0)' : 'transparent' }}>
                    {on && <Check size={9} color="var(--brand)" />}
                  </span>
                  {c}
                </button>
              );
            })}
            <button
              onClick={() => { setSearch(''); setSelected([]); }}
              className="text-[12px] px-2 py-1.5 rounded border ml-auto"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
            >
              Limpar filtros
            </button>
          </div>
          <p className="mt-2" style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
            Você pode marcar mais de uma categoria. Os filtros continuam ativos ao entrar e sair de um projeto — use “Todas” ou “Limpar filtros” para zerar.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(p => {
          const cfg = statusConfig[p.status] ?? { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' };
          const progressColor =
            p.status === 'Atrasado' ? 'var(--danger)' :
            p.status === 'Concluído' ? 'var(--success)' : 'var(--brand)';

          return (
            <div
              key={p.id}
              className="bg-card rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group relative"
              style={{ borderColor: 'var(--border)' }}
              onClick={() => onSelectProject(p)}
            >
              <div className="h-1 w-full" style={{ background: progressColor }} />

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    {p.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                      {p.code}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, p.id, p.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-opacity"
                      title="Excluir projeto"
                    >
                      <Trash2 size={12} color="var(--danger)" />
                    </button>
                  </div>
                </div>

                <h3
                  className="mb-1 group-hover:text-blue-600 transition-colors"
                  style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.925rem', color: 'var(--ink-1)', lineHeight: 1.4 }}
                >
                  {p.name}
                </h3>
                {((p as ProjectExt).org || (p as ProjectExt).segmento) && (
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    {(p as ProjectExt).org && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}>
                        {(p as ProjectExt).org}
                      </span>
                    )}
                    {(p as ProjectExt).segmento && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                        {(p as ProjectExt).segmento}
                      </span>
                    )}
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', lineHeight: 1.5, marginBottom: 14 }}>
                  {p.objective.length > 90 ? p.objective.slice(0, 90) + '…' : p.objective}
                </p>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>Execução física</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-1)', fontFamily: 'var(--font-mono)' }}>
                      {p.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--line-1)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.progress}%`, background: progressColor }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Users size={12} color="var(--ink-5)" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>
                      {p.coordinator}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>· {p.financier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <DollarSign size={12} color="var(--ink-5)" />
                      <span style={{ fontSize: '0.73rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                        {fmt(p.budgetExecuted)} <span style={{ color: 'var(--ink-5)' }}>/ {fmt(p.budgetApproved)}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} color="var(--ink-5)" />
                      <span style={{ fontSize: '0.73rem', color: 'var(--ink-3)' }}>{p.endDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="px-5 py-3 flex items-center justify-between border-t"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
              >
                <div className="flex items-center gap-2">
                  <FolderKanban size={12} color="var(--ink-5)" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
                    {p.goals.length > 0 ? `${p.goals.length} metas · ` : ''}
                    {p.risks.length} riscos · {p.changes.length} mudanças
                  </span>
                </div>
                <ChevronRight size={14} color="var(--ink-5)" className="group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <FolderKanban size={40} color="var(--line-2)" />
          <p style={{ color: 'var(--ink-5)', fontSize: '0.875rem' }}>Nenhum projeto encontrado</p>
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreate={async (data) => {
            const created = await addProject(data);
            record('criar projeto', created.name, created.id, created.name);
            toast.success(`Projeto "${created.name}" criado.`);
            setShowModal(false);
            onSelectProject(created);
          }}
        />
      )}
    </div>
  );
}

function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    code: string;
    coordinator: string;
    financier: string;
    objective: string;
    startDate: string;
    endDate: string;
    status: ProjectStatus;
    progress: number;
    budgetApproved: number;
    budgetExecuted: number;
    riskLevel: '—';
  }) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    coordinator: '',
    financier: '',
    objective: '',
    startDate: '',
    endDate: '',
    budgetApproved: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.coordinator.trim()) {
      toast.error('Informe pelo menos nome e coordenador(a).');
      return;
    }
    onCreate({
      name: form.name.trim(),
      code: form.code.trim() || `PT-2026-${String(Date.now()).slice(-3)}`,
      coordinator: form.coordinator.trim(),
      financier: form.financier.trim() || '—',
      objective: form.objective.trim() || 'Sem objetivo cadastrado.',
      startDate: form.startDate || '01/2026',
      endDate: form.endDate || '12/2026',
      status: 'Não iniciado',
      progress: 0,
      budgetApproved: Number(form.budgetApproved) || 0,
      budgetExecuted: 0,
      riskLevel: '—',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15, 23, 42, 0.5)' }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border p-6 w-full max-w-lg"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink-1)' }}>
            Novo Projeto
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nome *" full>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          </Field>
          <Field label="Código">
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input" placeholder="PT-2026-003" />
          </Field>
          <Field label="Coordenador(a) *">
            <input value={form.coordinator} onChange={e => setForm({ ...form, coordinator: e.target.value })} className="input" />
          </Field>
          <Field label="Financiador / Organização" full>
            <input value={form.financier} onChange={e => setForm({ ...form, financier: e.target.value })} className="input" />
          </Field>
          <Field label="Objetivo" full>
            <textarea value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} className="input min-h-[70px]" />
          </Field>
          <Field label="Início">
            <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="input" placeholder="MM/AAAA" />
          </Field>
          <Field label="Término">
            <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="input" placeholder="MM/AAAA" />
          </Field>
          <Field label="Valor total (R$)" full>
            <input type="number" value={form.budgetApproved} onChange={e => setForm({ ...form, budgetApproved: e.target.value })} className="input" placeholder="164285.71" />
          </Field>
        </div>
        <div className="flex items-center justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
            Cancelar
          </button>
          <button type="submit" className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>
            Criar projeto
          </button>
        </div>
        <style>{`.input{border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
.input:focus{border-color:var(--primary);background:var(--surface-0)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'col-span-2' : ''}`}>
      <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>{label}</span>
      {children}
    </label>
  );
}
