import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Search, Plus, Trash2, X, ClipboardList, ChevronRight, ArrowLeft, Save,
  FileText, Building2, Link2, Package, TrendingUp, Download,
} from 'lucide-react';
import { useDiagnostics, type Diagnostic, type DiagnosticStatus } from '../diagnostic/store';
import { sections, maturityAxes, type Question } from '../diagnostic/schema';
import { useStore } from '../store';
import { AdminUnlockDialog } from '../auth/AdminUnlockDialog';

const statusColor: Record<DiagnosticStatus, { bg: string; color: string }> = {
  'Rascunho':        { bg: '#F3F4F6', color: '#6B7280' },
  'Em preenchimento':{ bg: '#EFF6FF', color: '#2563EB' },
  'Concluído':       { bg: '#ECFDF5', color: '#059669' },
};

export function DiagnosticoPage() {
  const { diagnostics, createDiagnostic, deleteDiagnostic } = useDiagnostics();
  const { projects } = useStore();
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // new form state
  const [nfTitle, setNfTitle] = useState('');
  const [nfOrg, setNfOrg] = useState('');
  const [nfProject, setNfProject] = useState<string>('');

  const filtered = useMemo(() =>
    diagnostics.filter(d => {
      const q = search.toLowerCase();
      return !q || d.title.toLowerCase().includes(q) || d.organizationName.toLowerCase().includes(q);
    }), [diagnostics, search]);

  if (editingId != null) {
    const d = diagnostics.find(x => x.id === editingId);
    if (d) return <DiagnosticEditor diagnostic={d} onBack={() => setEditingId(null)} />;
  }

  const handleCreate = () => {
    if (!nfTitle.trim() || !nfOrg.trim()) { toast.error('Informe título e organização'); return; }
    const created = createDiagnostic({
      title: nfTitle.trim(),
      organizationName: nfOrg.trim(),
      projectId: nfProject ? Number(nfProject) : null,
    });
    toast.success('Diagnóstico criado');
    setShowNew(false); setNfTitle(''); setNfOrg(''); setNfProject('');
    setEditingId(created.id);
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="mb-1">Diagnóstico</h1>
            <p className="text-sm text-muted-foreground">Diagnóstico institucional e produtivo de bionegócios</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={16} /> Novo diagnóstico
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por título ou organização..."
              className="w-full pl-9 pr-3 py-2 rounded-md text-sm"
              style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center" style={{ background: 'var(--card)' }}>
            <ClipboardList size={40} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">Nenhum diagnóstico cadastrado. Comece criando um novo.</p>
            <button onClick={() => setShowNew(true)} className="text-sm px-4 py-2 rounded-md text-white" style={{ background: 'var(--primary)' }}>
              Criar primeiro diagnóstico
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(d => {
              const proj = projects.find(p => p.id === d.projectId);
              const totalQs = sections.reduce((a, s) => a + s.questions.length, 0);
              const answered = Object.keys(d.answers).filter(k => {
                const v = d.answers[k]; return v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0);
              }).length;
              const pct = Math.round((answered / totalQs) * 100);
              return (
                <div key={d.id}
                  onClick={() => setEditingId(d.id)}
                  className="rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: statusColor[d.status].bg, color: statusColor[d.status].color }}>
                          {d.status}
                        </span>
                        {proj && (
                          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{ background: '#EFF6FF', color: '#2563EB' }}>
                            <Link2 size={10} /> {proj.code}
                          </span>
                        )}
                      </div>
                      <h3 className="mb-0.5">{d.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 size={12} />{d.organizationName}</span>
                        <span>Atualizado em {new Date(d.updatedAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Preenchimento</div>
                        <div className="text-sm font-semibold">{pct}%</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Excluir "${d.title}"?`)) { deleteDiagnostic(d.id); toast.success('Diagnóstico excluído'); }}}
                        className="p-2 rounded-md hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3>Novo diagnóstico</h3>
              <button onClick={() => setShowNew(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Título</label>
                <input value={nfTitle} onChange={e => setNfTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
                  placeholder="Ex: Diagnóstico Comunidade Tauari 2026" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Organização</label>
                <input value={nfOrg} onChange={e => setNfOrg(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
                  placeholder="Nome da organização" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Vincular a projeto (opcional)</label>
                <select value={nfProject} onChange={e => setNfProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}>
                  <option value="">— Sem vínculo —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-md"
                style={{ border: '1px solid var(--border)' }}>Cancelar</button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm text-white rounded-md" style={{ background: 'var(--primary)' }}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------- Editor --------

function DiagnosticEditor({ diagnostic, onBack }: { diagnostic: Diagnostic; onBack: () => void }) {
  const { setAnswer, setMaturity, updateDiagnostic, addProduct, deleteProduct } = useDiagnostics();
  const { projects } = useStore();
  const [tab, setTab] = useState<'questoes' | 'maturidade' | 'produtos' | 'resumo'>('questoes');
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [pendingMaturity, setPendingMaturity] = useState<{ key: string; value: number } | null>(null);

  const requestMaturity = (key: string, value: number) => {
    // Antes do diagnóstico ser concluído, o índice pode ser marcado/alterado livremente
    // (inclusive para desfazer a escolha). Após concluído (100%), qualquer alteração
    // exige autenticação administrativa, pois decisões já foram tomadas a partir dele.
    if (diagnostic.status === 'Concluído') {
      setPendingMaturity({ key, value });
    } else {
      // toggle: clicar no mesmo valor volta para 0 (desfaz)
      const current = diagnostic.maturity[key];
      setMaturity(diagnostic.id, key, current === value ? 0 : value);
    }
  };


  const proj = projects.find(p => p.id === diagnostic.projectId);

  const totalQs = sections.reduce((a, s) => a + s.questions.length, 0);
  const answered = Object.keys(diagnostic.answers).filter(k => {
    const v = diagnostic.answers[k]; return v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0);
  }).length;
  const pct = Math.round((answered / totalQs) * 100);

  const handleExport = () => {
    const lines: string[] = [];
    lines.push(`Diagnóstico,${diagnostic.title}`);
    lines.push(`Organização,${diagnostic.organizationName}`);
    lines.push(`Projeto,${proj?.code ?? '-'}`);
    lines.push('');
    lines.push('Seção,Pergunta,Resposta');
    sections.forEach(s => s.questions.forEach(q => {
      const v = diagnostic.answers[q.id];
      const val = Array.isArray(v) ? v.join('; ') : (v ?? '');
      lines.push(`"${s.title}","${q.label}","${val}"`);
    }));
    lines.push('');
    lines.push('Índices de maturidade');
    maturityAxes.forEach(ax => ax.indicators.forEach(ind => {
      const key = `${ax.id}.${ind.id}`;
      lines.push(`"${ax.title}","${ind.label}",${diagnostic.maturity[key] ?? ''}`);
    }));
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `diagnostico-${diagnostic.id}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Diagnóstico exportado');
  };

  const handleConclude = () => {
    updateDiagnostic(diagnostic.id, { status: 'Concluído' });
    toast.success('Diagnóstico marcado como concluído');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-8 py-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-2 hover:text-foreground">
            <ArrowLeft size={14} /> Voltar
          </button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: statusColor[diagnostic.status].bg, color: statusColor[diagnostic.status].color }}>
                  {diagnostic.status}
                </span>
                {proj && <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: '#EFF6FF', color: '#2563EB' }}>
                  <Link2 size={10} /> {proj.code} · {proj.name}
                </span>}
              </div>
              <h2>{diagnostic.title}</h2>
              <div className="text-xs text-muted-foreground">{diagnostic.organizationName} · {pct}% preenchido</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md"
                style={{ border: '1px solid var(--border)' }}>
                <Download size={14} /> Exportar CSV
              </button>
              {diagnostic.status !== 'Concluído' && (
                <button onClick={handleConclude} className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-md"
                  style={{ background: 'var(--primary)' }}>
                  <Save size={14} /> Concluir
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1 mt-4">
            {[
              { id: 'questoes', label: 'Questionário', icon: FileText },
              { id: 'maturidade', label: 'Índices de Maturidade', icon: TrendingUp },
              { id: 'produtos', label: 'Cesta de Produtos', icon: Package },
              { id: 'resumo', label: 'Resumo', icon: ClipboardList },
            ].map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors"
                  style={{
                    background: active ? 'var(--accent)' : 'transparent',
                    color: active ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                    fontWeight: active ? 600 : 400,
                  }}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {tab === 'questoes' && (
          <div className="grid grid-cols-[220px_1fr] gap-6">
            <div className="space-y-1">
              {sections.map(s => {
                const activeSec = activeSection === s.id;
                const secAnswered = s.questions.filter(q => {
                  const v = diagnostic.answers[q.id];
                  return v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0);
                }).length;
                return (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                    style={{
                      background: activeSec ? 'var(--primary)' : 'transparent',
                      color: activeSec ? '#fff' : 'var(--foreground)',
                    }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{s.chapter}</div>
                    <div className="flex items-center justify-between">
                      <span>{s.title}</span>
                      <span className="text-[10px] opacity-70">{secAnswered}/{s.questions.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div>
              {sections.filter(s => s.id === activeSection).map(s => (
                <div key={s.id} className="rounded-lg p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <h3 className="mb-4">{s.title}</h3>
                  <div className="space-y-4">
                    {s.questions.map(q => (
                      <QuestionField
                        key={q.id}
                        question={q}
                        value={diagnostic.answers[q.id]}
                        onChange={(v) => setAnswer(diagnostic.id, q.id, v)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'maturidade' && (
          <div className="space-y-6">
            {maturityAxes.map(ax => {
              const scores = ax.indicators.map(i => diagnostic.maturity[`${ax.id}.${i.id}`]).filter((v): v is number => typeof v === 'number');
              const avg = scores.length ? (scores.reduce((a, x) => a + x, 0) / scores.length).toFixed(1) : '-';
              return (
                <div key={ax.id} className="rounded-lg p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3>{ax.title}</h3>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Média</div>
                      <div className="text-2xl font-semibold" style={{ color: 'var(--primary)' }}>{avg}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {ax.indicators.map(ind => {
                      const key = `${ax.id}.${ind.id}`;
                      const val = diagnostic.maturity[key] ?? 0;
                      return (
                        <div key={ind.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <div className="text-sm font-medium">{ind.label}</div>
                              <div className="text-xs text-muted-foreground">{ind.scale}</div>
                            </div>
                            <div className="text-sm font-semibold">{val || '-'}</div>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <button key={n}
                                onClick={() => requestMaturity(key, n)}
                                className="flex-1 h-8 rounded text-xs font-medium transition-colors"
                                style={{
                                  background: val >= n ? 'var(--primary)' : 'var(--muted)',
                                  color: val >= n ? '#fff' : 'var(--muted-foreground)',
                                }}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'produtos' && (
          <ProdutosTab
            diagnostic={diagnostic}
            onAdd={(p) => addProduct(diagnostic.id, p)}
            onDelete={(pid) => deleteProduct(diagnostic.id, pid)}
          />
        )}

        {tab === 'resumo' && (
          <ResumoTab diagnostic={diagnostic} />
        )}
      </div>

      {pendingMaturity && (
        <AdminUnlockDialog
          title="Alterar Índice de Maturidade"
          description="Marcar, alterar ou desfazer o índice de maturidade requer autenticação administrativa."
          onSuccess={() => {
            setMaturity(diagnostic.id, pendingMaturity.key, pendingMaturity.value);
            toast.success('Índice de maturidade atualizado.');
          }}
          onClose={() => setPendingMaturity(null)}
        />
      )}
    </div>
  );
}

function QuestionField({ question: q, value, onChange }: {
  question: Question;
  value: string | string[] | number | undefined;
  onChange: (v: string | string[] | number) => void;
}) {
  const inputStyle = { background: 'var(--input-background)', border: '1px solid var(--border)' };
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{q.label}</label>
      {q.type === 'text' && (
        <input value={(value as string) ?? ''} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} />
      )}
      {q.type === 'textarea' && (
        <textarea value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} />
      )}
      {q.type === 'number' && (
        <input type="number" value={(value as number | string) ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} />
      )}
      {q.type === 'select' && (
        <select value={(value as string) ?? ''} onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle}>
          <option value="">— Selecione —</option>
          {q.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {q.type === 'multiselect' && (
        <div className="flex flex-wrap gap-2">
          {q.options?.map(o => {
            const arr = (Array.isArray(value) ? value : []) as string[];
            const checked = arr.includes(o);
            return (
              <button key={o} type="button"
                onClick={() => onChange(checked ? arr.filter(x => x !== o) : [...arr, o])}
                className="px-3 py-1.5 text-xs rounded-full transition-colors"
                style={{
                  background: checked ? 'var(--primary)' : 'var(--muted)',
                  color: checked ? '#fff' : 'var(--foreground)',
                  border: '1px solid var(--border)',
                }}>
                {o}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProdutosTab({ diagnostic, onAdd, onDelete }: {
  diagnostic: Diagnostic;
  onAdd: (p: Omit<import('../diagnostic/schema').DiagnosticProduct, 'id'>) => void;
  onDelete: (id: number) => void;
}) {
  const [form, setForm] = useState({
    nome: '', cadeia: '', processamento: 'In natura', tipo: 'Alimento',
    importancia: 'Geração de renda principal', sazonal: 'Sim' as 'Sim' | 'Não',
    volumeProduzido: 0, volumeVendido: 0, unidade: 'kg',
  });

  const handleAdd = () => {
    if (!form.nome || !form.cadeia) { toast.error('Informe nome e cadeia'); return; }
    onAdd({ ...form });
    toast.success('Produto adicionado');
    setForm({ ...form, nome: '', cadeia: '', volumeProduzido: 0, volumeVendido: 0 });
  };

  const inputStyle = { background: 'var(--input-background)', border: '1px solid var(--border)' };

  return (
    <div className="space-y-6">
      <div className="rounded-lg p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="mb-4">Adicionar produto</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input placeholder="Nome do produto" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="px-3 py-2 text-sm rounded-md" style={inputStyle} />
          <input placeholder="Cadeia produtiva" value={form.cadeia} onChange={e => setForm({ ...form, cadeia: e.target.value })} className="px-3 py-2 text-sm rounded-md" style={inputStyle} />
          <select value={form.processamento} onChange={e => setForm({ ...form, processamento: e.target.value })} className="px-3 py-2 text-sm rounded-md" style={inputStyle}>
            {['In natura', 'Beneficiado', 'Processado'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="px-3 py-2 text-sm rounded-md" style={inputStyle}>
            {['Alimento', 'Cosmético', 'Artesanato', 'Fitoterápico', 'Outro'].map(o => <option key={o}>{o}</option>)}
          </select>
          <input type="number" placeholder="Vol. produzido" value={form.volumeProduzido || ''} onChange={e => setForm({ ...form, volumeProduzido: Number(e.target.value) })} className="px-3 py-2 text-sm rounded-md" style={inputStyle} />
          <input type="number" placeholder="Vol. vendido" value={form.volumeVendido || ''} onChange={e => setForm({ ...form, volumeVendido: Number(e.target.value) })} className="px-3 py-2 text-sm rounded-md" style={inputStyle} />
          <select value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} className="px-3 py-2 text-sm rounded-md" style={inputStyle}>
            {['kg', 'l', 'un', 't'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select value={form.sazonal} onChange={e => setForm({ ...form, sazonal: e.target.value as 'Sim' | 'Não' })} className="px-3 py-2 text-sm rounded-md" style={inputStyle}>
            <option value="Sim">Sazonal: Sim</option>
            <option value="Não">Sazonal: Não</option>
          </select>
        </div>
        <button onClick={handleAdd} className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-md" style={{ background: 'var(--primary)' }}>
          <Plus size={14} /> Adicionar produto
        </button>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--muted)' }}>
            <tr className="text-left text-xs">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Cadeia</th>
              <th className="px-4 py-3">Processamento</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3 text-right">Produzido</th>
              <th className="px-4 py-3 text-right">Vendido</th>
              <th className="px-4 py-3">Un.</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {diagnostic.products.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum produto cadastrado</td></tr>
            ) : diagnostic.products.map(p => (
              <tr key={p.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-medium">{p.nome}</td>
                <td className="px-4 py-3">{p.cadeia}</td>
                <td className="px-4 py-3">{p.processamento}</td>
                <td className="px-4 py-3">{p.tipo}</td>
                <td className="px-4 py-3 text-right">{p.volumeProduzido.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 text-right">{p.volumeVendido.toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3">{p.unidade}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onDelete(p.id)} className="p-1.5 rounded hover:bg-red-50">
                    <Trash2 size={13} className="text-red-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResumoTab({ diagnostic }: { diagnostic: Diagnostic }) {
  const totalQs = sections.reduce((a, s) => a + s.questions.length, 0);
  const answered = Object.keys(diagnostic.answers).filter(k => {
    const v = diagnostic.answers[k]; return v !== '' && v !== undefined && !(Array.isArray(v) && v.length === 0);
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-xs text-muted-foreground">Perguntas respondidas</div>
          <div className="text-2xl font-semibold">{answered}/{totalQs}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-xs text-muted-foreground">Produtos na cesta</div>
          <div className="text-2xl font-semibold">{diagnostic.products.length}</div>
        </div>
        {maturityAxes.map(ax => {
          const scores = ax.indicators.map(i => diagnostic.maturity[`${ax.id}.${i.id}`]).filter((v): v is number => typeof v === 'number');
          const avg = scores.length ? (scores.reduce((a, x) => a + x, 0) / scores.length) : 0;
          return (
            <div key={ax.id} className="rounded-lg p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="text-xs text-muted-foreground">{ax.title}</div>
              <div className="text-2xl font-semibold" style={{ color: 'var(--primary)' }}>{avg ? avg.toFixed(1) : '-'}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="mb-4">Respostas por seção</h3>
        <div className="space-y-4">
          {sections.map(s => {
            const answers = s.questions.map(q => ({ q, v: diagnostic.answers[q.id] }))
              .filter(x => x.v !== undefined && x.v !== '' && !(Array.isArray(x.v) && x.v.length === 0));
            if (answers.length === 0) return null;
            return (
              <div key={s.id}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{s.title}</div>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                  {answers.map(a => (
                    <div key={a.q.id} className="text-sm flex gap-2">
                      <span className="text-muted-foreground">{a.q.label}:</span>
                      <span className="font-medium">{Array.isArray(a.v) ? a.v.join(', ') : String(a.v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
