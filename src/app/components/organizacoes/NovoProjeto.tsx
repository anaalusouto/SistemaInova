/**
 * Novo projeto, criado DENTRO da organização (navegação centrada na
 * organização, 29/09/2026): o projeto já nasce vinculado a ela
 * (projetos.comunidade_id). Antes vivia na lista de Projetos, que saiu do menu.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import type { ProjectStatus } from '../../data/mockData';

export function NovoProjetoModal({
  organizacao,
  onClose,
  onCreate,
}: {
  /** Organização já selecionada; o vínculo é obrigatório e imutável. */
  organizacao: { id: string; nome: string };
  onClose: () => void;
  onCreate: (data: {
    comunidadeId: string;
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
      comunidadeId: organizacao.id,
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
        <div className="flex items-center justify-between mb-1">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink-1)' }}>
            Novo projeto
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X size={16} />
          </button>
        </div>
        <p className="mb-4" style={{ fontSize: '0.78rem', color: 'var(--ink-4)' }}>
          Organização executora: <strong style={{ color: 'var(--ink-2)' }}>{organizacao.nome}</strong>
        </p>
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
          <Field label="Financiador" full>
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
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>{label}</span>
      {children}
    </label>
  );
}
