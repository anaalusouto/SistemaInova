import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import { type Project, type ProjectStatus } from '../../data/mockData';
import { useStore } from '../../store';

interface Props { project: Project; }

const statusOptions: ProjectStatus[] = ['Não iniciado', 'Em andamento', 'Concluído', 'Atrasado', 'Suspenso'];

export function TabCadastro({ project }: Props) {
  const { updateProject } = useStore();
  const [form, setForm] = useState({
    name: project.name,
    code: project.code,
    coordinator: project.coordinator,
    financier: project.financier,
    objective: project.objective,
    startDate: project.startDate,
    endDate: project.endDate,
    budgetApproved: String(project.budgetApproved),
    status: project.status,
    teamText: project.team.join(', '),
  });

  useEffect(() => {
    setForm({
      name: project.name,
      code: project.code,
      coordinator: project.coordinator,
      financier: project.financier,
      objective: project.objective,
      startDate: project.startDate,
      endDate: project.endDate,
      budgetApproved: String(project.budgetApproved),
      status: project.status,
      teamText: project.team.join(', '),
    });
  }, [project.id]);

  const save = () => {
    updateProject(project.id, {
      name: form.name,
      coordinator: form.coordinator,
      financier: form.financier,
      objective: form.objective,
      startDate: form.startDate,
      endDate: form.endDate,
      budgetApproved: Number(form.budgetApproved) || 0,
      status: form.status,
      team: form.teamText.split(',').map(t => t.trim()).filter(Boolean),
    });
    toast.success('Cadastro salvo.');
  };

  return (
    <div className="space-y-5 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
          Cadastro do Projeto
        </h2>
        <button
          onClick={save}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Save size={12} /> Salvar
        </button>
      </div>

      <Section title="Informações Gerais">
        <div className="grid grid-cols-2 gap-4">
          <F label="Código Interno"><input className="ci" value={form.code} readOnly disabled title="Gerado automaticamente pela ordem de criação" /></F>
          <F label="Situação">
            <select className="ci" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              {statusOptions.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Nome do Projeto" full><input className="ci" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></F>
          <F label="Objetivo" full><textarea className="ci h-[90px] overflow-y-auto resize-none leading-relaxed" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} /></F>
        </div>
      </Section>

      <Section title="Equipe e Responsáveis">
        <div className="grid grid-cols-2 gap-4">
          <F label="Coordenador(a)"><input className="ci" value={form.coordinator} onChange={e => setForm({ ...form, coordinator: e.target.value })} /></F>
          <F label="Financiador / Organização"><input className="ci" value={form.financier} onChange={e => setForm({ ...form, financier: e.target.value })} /></F>
          <F label="Equipe (separada por vírgula)" full>
            <input className="ci" value={form.teamText} onChange={e => setForm({ ...form, teamText: e.target.value })} placeholder="Fulano, Ciclana, ..." />
          </F>
        </div>
        {project.team.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {project.team.map(member => (
              <span
                key={member}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px]"
                style={{ borderColor: 'var(--border)', color: '#475569', background: '#F8FAFC' }}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  {member.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                {member}
                <button
                  onClick={() => {
                    const next = project.team.filter(m => m !== member);
                    updateProject(project.id, { team: next });
                    setForm(f => ({ ...f, teamText: next.join(', ') }));
                    toast.success('Membro removido.');
                  }}
                  className="p-0.5 rounded hover:bg-red-50"
                >
                  <X size={10} color="#DC2626" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Vigência e Financeiro">
        <div className="grid grid-cols-3 gap-4">
          <F label="Data de Início"><input className="ci" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} placeholder="MM/AAAA" /></F>
          <F label="Data de Término"><input className="ci" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} placeholder="MM/AAAA" /></F>
          <F label="Valor Aprovado (R$)"><input type="number" className="ci" value={form.budgetApproved} onChange={e => setForm({ ...form, budgetApproved: e.target.value })} /></F>
        </div>
      </Section>

      <style>{`.ci{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:100%;background:#F8FAFC;color:#0F172A}
.ci:focus{border-color:var(--primary);background:#fff}`}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : ''}`}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </label>
  );
}
