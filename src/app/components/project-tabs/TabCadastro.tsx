import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { type Project, type ProjectStatus } from '../../data/mockData';
import { useStore, type PlanoTrabalho, type ProjectExt } from '../../store';
import { useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';

interface Props { project: Project; }

const statusOptions: ProjectStatus[] = ['Não iniciado', 'Em andamento', 'Concluído', 'Atrasado', 'Suspenso'];

const P_FIELDS: { title: string; fields: { key: keyof PlanoTrabalho; label: string; type?: 'text' | 'number' | 'textarea' }[] }[] = [
  {
    title: 'Critério I — Relevância',
    fields: [
      { key: 'problematica', label: 'Problemática', type: 'textarea' },
      { key: 'justificativa', label: 'Justificativa', type: 'textarea' },
      { key: 'localizacaoAbrangencia', label: 'Localização e abrangência', type: 'textarea' },
      { key: 'diversidade', label: 'Diversidade', type: 'textarea' },
      { key: 'saberesLocais', label: 'Saberes locais', type: 'textarea' },
    ],
  },
  {
    title: 'Critério II — Capacidade Técnica',
    fields: [
      { key: 'experienciaPrevia', label: 'Experiência prévia', type: 'textarea' },
      { key: 'capacidadeTecnica', label: 'Capacidade técnica e gerencial / equipe', type: 'textarea' },
      { key: 'estrategia', label: 'Estratégia', type: 'textarea' },
      { key: 'cronogramaFisico', label: 'Cronograma físico (metas/etapas)', type: 'textarea' },
      { key: 'detalhamentoRecursos', label: 'Detalhamento do plano de aplicação dos recursos', type: 'textarea' },
      { key: 'contrapartida', label: 'Contrapartida', type: 'textarea' },
      { key: 'justificativaContrapartida', label: 'Justificativa da contrapartida', type: 'textarea' },
    ],
  },
  {
    title: 'Critério III — Impacto',
    fields: [
      { key: 'resultadosImpactos', label: 'Resultados e impactos previstos', type: 'textarea' },
      { key: 'publicoAlvo', label: 'Beneficiários / público-alvo', type: 'textarea' },
      { key: 'beneficiadosDiretos', label: 'Total diretamente beneficiados', type: 'number' },
      { key: 'beneficiadosIndiretos', label: 'Total indiretamente beneficiados', type: 'number' },
      { key: 'formaAcompanhamento', label: 'Forma de acompanhamento e avaliação', type: 'textarea' },
    ],
  },
  {
    title: 'Critério IV — Replicabilidade',
    fields: [
      { key: 'potencialReplicabilidade', label: 'Potencial de replicabilidade', type: 'textarea' },
      { key: 'potencialAmpliacao', label: 'Potencial de ampliação', type: 'textarea' },
    ],
  },
  {
    title: 'Extras (planilha)',
    fields: [
      { key: 'pilares', label: 'Pilares' },
      { key: 'metasTexto', label: 'Metas' },
      { key: 'detalhamentoPlano', label: 'Detalhamento por plano de trabalho', type: 'textarea' },
      { key: 'compradores', label: 'Compradores' },
      { key: 'garantiaVenda', label: 'Garantia de venda' },
      { key: 'destinacao', label: 'Destinação' },
      { key: 'ativacoes', label: 'Ativações' },
      { key: 'oportunidades', label: 'Oportunidades' },
      { key: 'receitaFaixa', label: 'Receita (faixa)' },
      { key: 'valorRepasse', label: 'Valor do repasse' },
      { key: 'formaRepasse', label: 'Forma de repasse' },
      { key: 'statusRepasse', label: 'Status do repasse' },
      { key: 'dataRepasse', label: 'Data do repasse' },
      { key: 'planoArquivo', label: 'Plano atualizado (arquivo)' },
      { key: 'observacoes', label: 'Observações', type: 'textarea' },
    ],
  },
];

export function TabCadastro({ project }: Props) {
  const { updateProject, communities } = useStore();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const proj = project as ProjectExt;

  const record = (action: string, detail: string) =>
    audit({
      userLogin: user?.login ?? '—', area: 'cadastro', action, detail,
      projectId: project.id, projectName: project.name, kind: 'alteracao',
    });
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
    communityId: proj.communityId ?? null as number | null,
  });
  const [plano, setPlano] = useState<PlanoTrabalho>(proj.plano ?? {});

  useEffect(() => {
    setForm({
      name: project.name, code: project.code,
      coordinator: project.coordinator, financier: project.financier,
      objective: project.objective, startDate: project.startDate, endDate: project.endDate,
      budgetApproved: String(project.budgetApproved), status: project.status,
      teamText: project.team.join(', '), communityId: proj.communityId ?? null,
    });
    setPlano(proj.plano ?? {});
  }, [project.id]);

  const save = () => {
    updateProject(project.id, {
      name: form.name, coordinator: form.coordinator, financier: form.financier,
      objective: form.objective, startDate: form.startDate, endDate: form.endDate,
      budgetApproved: Number(form.budgetApproved) || 0, status: form.status,
      team: form.teamText.split(',').map(t => t.trim()).filter(Boolean),
      communityId: form.communityId, plano,
    } as Partial<ProjectExt>);
    record('editar cadastro/plano de trabalho', form.name);
    toast.success('Cadastro salvo.');
  };

  const setP = <K extends keyof PlanoTrabalho>(k: K, v: PlanoTrabalho[K]) => setPlano(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4 p-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
          Cadastro do Projeto
        </h2>
        <button onClick={save} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: 'var(--primary)' }}>
          <Save size={12} /> Salvar
        </button>
      </div>

      <Section title="I — Apresentação" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <F label="Código Interno"><input className="ci" value={form.code} readOnly disabled /></F>
          <F label="Situação">
            <select className="ci" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ProjectStatus })}>
              {statusOptions.map(s => <option key={s}>{s}</option>)}
            </select>
          </F>
          <F label="Título do Projeto" full><input className="ci" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></F>
          <F label="Objetivo" full><textarea className="ci" style={{ minHeight: 100 }} value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} /></F>
          <F label="Coordenador(a)"><input className="ci" value={form.coordinator} onChange={e => setForm({ ...form, coordinator: e.target.value })} /></F>
          <F label="Empresa / Organização"><input className="ci" value={form.financier} onChange={e => setForm({ ...form, financier: e.target.value })} /></F>
          <F label="Equipe (separada por vírgula)" full>
            <input className="ci" value={form.teamText} onChange={e => setForm({ ...form, teamText: e.target.value })} />
          </F>
          <F label="Início"><input className="ci" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} placeholder="MM/AAAA" /></F>
          <F label="Término"><input className="ci" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} placeholder="MM/AAAA" /></F>
          <F label="Valor Total (R$)"><input type="number" className="ci" value={form.budgetApproved} onChange={e => setForm({ ...form, budgetApproved: e.target.value })} /></F>
          <F label="Comunidade vinculada">
            <select className="ci" value={form.communityId ?? ''} onChange={e => setForm({ ...form, communityId: e.target.value ? Number(e.target.value) : null })}>
              <option value="">— Sem vínculo —</option>
              {communities.map(c => <option key={c.id} value={c.id}>{c.code} · {c.nome}</option>)}
            </select>
          </F>
        </div>
        {project.team.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {project.team.map(member => (
              <span key={member} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)', background: 'var(--surface-1)' }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
                  {member.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                {member}
                <button onClick={() => {
                  const next = project.team.filter(m => m !== member);
                  updateProject(project.id, { team: next });
                  setForm(f => ({ ...f, teamText: next.join(', ') }));
                  record('remover membro da equipe', member);
                  toast.success('Membro removido.');
                }} className="p-0.5 rounded hover:bg-red-50">
                  <X size={10} color="var(--danger)" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      {P_FIELDS.map(group => (
        <Section key={group.title} title={group.title}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.fields.map(f => (
              <F key={String(f.key)} label={f.label} full={f.type === 'textarea'}>
                {f.type === 'textarea' ? (
                  <textarea className="ci" style={{ minHeight: 90 }}
                    value={(plano[f.key] as string) ?? ''}
                    onChange={e => setP(f.key, e.target.value as PlanoTrabalho[typeof f.key])} />
                ) : f.type === 'number' ? (
                  <input type="number" className="ci"
                    value={(plano[f.key] as number | undefined) ?? ''}
                    onChange={e => setP(f.key, (e.target.value === '' ? undefined : Number(e.target.value)) as PlanoTrabalho[typeof f.key])} />
                ) : (
                  <input className="ci"
                    value={(plano[f.key] as string) ?? ''}
                    onChange={e => setP(f.key, e.target.value as PlanoTrabalho[typeof f.key])} />
                )}
              </F>
            ))}
          </div>
        </Section>
      ))}

      <style>{`.ci{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
      .ci:focus{border-color:var(--primary);background:var(--surface-0)}
      .ci{resize:vertical}
      textarea.ci{overflow-y:auto}`}</style>
    </div>
  );
}

function Section({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} className="w-full px-5 py-3 border-b flex items-center gap-2 text-left" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)' }}>{title}</h3>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      {children}
    </label>
  );
}
