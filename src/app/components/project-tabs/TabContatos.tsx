import { useState } from 'react';
import { Plus, Trash2, X, Phone, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';
import { type Project } from '../../data/mockData';
import { useStore } from '../../store';

const empty = { name: '', role: '', org: '', phone: '', email: '', notes: '' };

export function TabContatos({ project }: { project: Project }) {
  const { getProject, addContact, deleteContact } = useStore();
  const p = getProject(project.id) ?? (project as never);
  const contacts = p.contacts ?? [];
  const [form, setForm] = useState<typeof empty | null>(null);

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>Contatos</h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{contacts.length} contatos registrados neste projeto</p>
        </div>
        <button
          onClick={() => setForm({ ...empty })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        ><Plus size={12} /> Novo contato</button>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Users size={40} color="#CBD5E1" />
          <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Nenhum contato registrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {contacts.map(c => (
            <div key={c.id} className="bg-card rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{c.name}</div>
                  <div style={{ fontSize: '0.73rem', color: '#64748B' }}>{[c.role, c.org].filter(Boolean).join(' · ')}</div>
                </div>
                <button
                  onClick={() => { if (window.confirm('Excluir contato?')) { deleteContact(project.id, c.id); toast.success('Contato excluído.'); } }}
                  className="p-1 rounded hover:bg-red-50"
                ><Trash2 size={12} color="#DC2626" /></button>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                {c.phone && <span className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: '#475569' }}><Phone size={11} /> {c.phone}</span>}
                {c.email && <span className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: '#475569' }}><Mail size={11} /> {c.email}</span>}
                {c.notes && <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{c.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setForm(null)}>
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault();
              if (!form.name.trim()) { toast.error('Informe o nome do contato.'); return; }
              addContact(project.id, form);
              toast.success('Contato registrado.');
              setForm(null);
            }}
            className="bg-white rounded-2xl border p-6 w-full max-w-lg"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Novo contato</h3>
              <button type="button" onClick={() => setForm(null)}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['name', 'Nome *'], ['role', 'Função'], ['org', 'Organização'],
                ['phone', 'Telefone'], ['email', 'E-mail'],
              ] as const).map(([k, label]) => (
                <label key={k} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>{label}</span>
                  <input
                    className="border rounded-lg px-2.5 py-1.5 text-[13px]"
                    style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}
                    value={form[k]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                  />
                </label>
              ))}
              <label className="flex flex-col gap-1 col-span-2">
                <span className="text-[11px] font-medium" style={{ color: '#64748B' }}>Observações</span>
                <textarea
                  className="border rounded-lg px-2.5 py-1.5 text-[13px] min-h-[60px]"
                  style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button type="button" onClick={() => setForm(null)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: '#475569' }}>Cancelar</button>
              <button type="submit" className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
