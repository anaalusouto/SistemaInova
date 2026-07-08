import { useMemo, useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../store';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

interface FieldOption {
  id: string;
  label: string;
  group: string;
}

const FIELDS: FieldOption[] = [
  { id: 'cadastro',     label: 'Cadastro (código, nome, coordenador, financiador, vigência)', group: 'Projeto' },
  { id: 'situacao',     label: 'Situação e progresso',                                         group: 'Projeto' },
  { id: 'objetivo',     label: 'Objetivo',                                                     group: 'Projeto' },
  { id: 'equipe',       label: 'Equipe',                                                       group: 'Projeto' },
  { id: 'metas',        label: 'Metas e atividades',                                           group: 'Monitoramento' },
  { id: 'financeiro',   label: 'Resumo financeiro (aprovado, executado, saldo)',               group: 'Financeiro' },
  { id: 'contrapart',   label: 'Contrapartidas',                                               group: 'Financeiro' },
  { id: 'riscos',       label: 'Riscos abertos',                                               group: 'Gestão' },
  { id: 'mudancas',     label: 'Mudanças',                                                     group: 'Gestão' },
  { id: 'evidencias',   label: 'Evidências e relatórios',                                      group: 'Anexos' },
];

export function ReportsPage() {
  const { projects } = useStore();
  const [selectedProjects, setSelectedProjects] = useState<number[]>(projects.map(p => p.id));
  const [selectedFields, setSelectedFields] = useState<string[]>(['cadastro', 'situacao', 'metas', 'financeiro', 'riscos']);
  const [title, setTitle] = useState('Relatório Consolidado');

  const included = useMemo(() => projects.filter(p => selectedProjects.includes(p.id)), [projects, selectedProjects]);
  const has = (f: string) => selectedFields.includes(f);

  const totals = useMemo(() => {
    const budget = included.reduce((a, p) => a + p.budgetApproved, 0);
    const executed = included.reduce((a, p) => a + p.budgetExecuted, 0);
    return { budget, executed, balance: budget - executed };
  }, [included]);

  const toggleField = (id: string) =>
    setSelectedFields(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleProject = (id: number) =>
    setSelectedProjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handlePrint = () => {
    toast.success('Abrindo diálogo de impressão…');
    setTimeout(() => window.print(), 200);
  };

  return (
    <div className="flex flex-col gap-6 p-7 overflow-y-auto h-full">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: '#0F172A' }}>
            Relatórios
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.825rem', marginTop: 2 }}>
            Monte um resumo unificado escolhendo quais campos devem compor o relatório.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium border"
            style={{ borderColor: 'var(--border)', color: '#475569', background: '#fff' }}
          >
            <Printer size={13} /> Imprimir / PDF
          </button>
          <button
            onClick={() => toast.info('Exportação para Excel disponível em breve.')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Download size={13} /> Exportar
          </button>
        </div>
      </div>

      {/* Builder */}
      <div className="grid grid-cols-3 gap-4 print:hidden">
        <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', marginBottom: 12 }}>
            Título
          </h3>
          <input
            className="ci"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título do relatório"
          />
        </div>

        <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', marginBottom: 12 }}>
            Projetos incluídos ({selectedProjects.length}/{projects.length})
          </h3>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
            {projects.map(p => (
              <label key={p.id} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.8rem', color: '#0F172A' }}>
                <input type="checkbox" checked={selectedProjects.includes(p.id)} onChange={() => toggleProject(p.id)} />
                <span>{p.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: 'auto' }}>{p.code}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', marginBottom: 12 }}>
            Campos do relatório
          </h3>
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
            {FIELDS.map(f => (
              <label key={f.id} className="flex items-start gap-2 cursor-pointer" style={{ fontSize: '0.78rem', color: '#0F172A' }}>
                <input type="checkbox" checked={selectedFields.includes(f.id)} onChange={() => toggleField(f.id)} style={{ marginTop: 3 }} />
                <span>{f.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Report preview */}
      <div className="bg-card rounded-xl border p-8 flex flex-col gap-6" id="report-preview" style={{ borderColor: 'var(--border)' }}>
        <header className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <FileText size={22} color="#2563EB" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem', color: '#0F172A' }}>{title}</h2>
            <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Gerado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())} · {included.length} projeto(s)
            </p>
          </div>
        </header>

        {has('financeiro') && (
          <section>
            <SectionTitle>Resumo Financeiro Consolidado</SectionTitle>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <StatCard label="Aprovado" value={fmt(totals.budget)} color="#2563EB" />
              <StatCard label="Executado" value={fmt(totals.executed)} color="#059669" />
              <StatCard label="Saldo" value={fmt(totals.balance)} color="#D97706" />
            </div>
          </section>
        )}

        {included.map(p => (
          <section key={p.id} className="rounded-lg border p-5" style={{ borderColor: 'var(--border)', background: '#FAFBFD' }}>
            <div className="flex items-baseline justify-between mb-3">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>{p.name}</h3>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontFamily: 'var(--font-mono)' }}>{p.code}</span>
            </div>

            {has('cadastro') && (
              <KV items={[
                ['Coordenador(a)', p.coordinator],
                ['Financiador', p.financier],
                ['Vigência', `${p.startDate} → ${p.endDate}`],
              ]} />
            )}

            {has('situacao') && (
              <KV items={[
                ['Situação', p.status],
                ['Progresso', `${p.progress}%`],
              ]} />
            )}

            {has('objetivo') && (
              <p style={{ fontSize: '0.82rem', color: '#334155', marginTop: 10, lineHeight: 1.55 }}>
                <b style={{ color: '#0F172A' }}>Objetivo:</b> {p.objective}
              </p>
            )}

            {has('equipe') && p.team.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: 6 }}>
                <b style={{ color: '#0F172A' }}>Equipe:</b> {p.team.join(', ')}
              </p>
            )}

            {has('financeiro') && (
              <KV items={[
                ['Aprovado', fmt(p.budgetApproved)],
                ['Executado', fmt(p.budgetExecuted)],
                ['Saldo', fmt(p.budgetApproved - p.budgetExecuted)],
              ]} />
            )}

            {has('metas') && p.goals.length > 0 && (
              <div className="mt-3">
                <b style={{ fontSize: '0.82rem', color: '#0F172A' }}>Metas ({p.goals.length}):</b>
                <ul style={{ fontSize: '0.78rem', color: '#334155', marginTop: 6, paddingLeft: 18, listStyle: 'disc' }}>
                  {p.goals.map(g => {
                    const acts = g.deliverables.flatMap(d => d.activities);
                    const done = acts.filter(a => a.status === 'Concluído').length;
                    return <li key={g.id}>{g.name} — {done}/{acts.length} atividades concluídas</li>;
                  })}
                </ul>
              </div>
            )}

            {has('contrapart') && (p.contrapartidas ?? []).length > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: 8 }}>
                <b style={{ color: '#0F172A' }}>Contrapartidas:</b> {(p.contrapartidas ?? []).length} item(ns)
              </p>
            )}

            {has('riscos') && p.risks.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: 6 }}>
                <b style={{ color: '#0F172A' }}>Riscos abertos:</b> {p.risks.length}
              </p>
            )}

            {has('mudancas') && p.changes.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: 6 }}>
                <b style={{ color: '#0F172A' }}>Mudanças:</b> {p.changes.length}
              </p>
            )}

            {has('evidencias') && p.evidences.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: '#334155', marginTop: 6 }}>
                <b style={{ color: '#0F172A' }}>Evidências:</b> {p.evidences.length} anexo(s)
              </p>
            )}
          </section>
        ))}

        {included.length === 0 && (
          <div className="py-10 text-center" style={{ fontSize: '0.85rem', color: '#94A3B8' }}>
            Selecione ao menos um projeto para compor o relatório.
          </div>
        )}
      </div>

      <style>{`.ci{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:100%;background:#F8FAFC;color:#0F172A}
      .ci:focus{border-color:var(--primary);background:#fff}
      @media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: '#0F172A', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
      {children}
    </h3>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border)' }}>
      <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function KV({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <span style={{ fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{k}: </span>
          <span style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 500 }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
