import { useMemo, useState } from 'react';
import {
  Plus, Download, TrendingUp, DollarSign, Wallet, Trash2, X, HandCoins, Edit3, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
  type ContrapartidaTipo,
  type FinancialItem,
  type Project,
} from '../../data/mockData';
import { useStore } from '../../store';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n);

const pct = (exec: number, planned: number) =>
  planned > 0 ? Math.round((exec / planned) * 100) : 0;

const computeLine = (i: Pick<FinancialItem, 'qtd' | 'qtdUnidades' | 'valorUnitario'>) =>
  (Number(i.qtd) || 0) * (Number(i.qtdUnidades) || 0) * (Number(i.valorUnitario) || 0);

interface TabFinanceiroProps {
  project: Project;
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  'Despesas com pessoal': { bg: '#EFF6FF', fg: '#2563EB' },
  'Serviços de terceiros': { bg: '#FEF3C7', fg: '#B45309' },
  'Materiais de consumo': { bg: '#F0FDF4', fg: '#059669' },
  'Material permanente/equipamentos': { bg: '#F5F3FF', fg: '#7C3AED' },
  'Custos administrativos': { bg: '#FEE2E2', fg: '#B91C1C' },
};

const chipStyle = (c: string) => {
  const cc = CATEGORY_COLORS[c] ?? { bg: '#E2E8F0', fg: '#475569' };
  return { background: cc.bg, color: cc.fg };
};

export function TabFinanceiro({ project }: TabFinanceiroProps) {
  const {
    addFinancial, deleteFinancial, updateFinancialExecuted,
    addContrapartida, deleteContrapartida,
  } = useStore();

  const [showItemForm, setShowItemForm] = useState(false);
  const [showCpForm, setShowCpForm] = useState(false);
  const [editExec, setEditExec] = useState<number | null>(null);
  const [execVal, setExecVal] = useState('');

  const items = project.financialItems;
  const contrapartidas = project.contrapartidas ?? [];

  // ---- Aggregations ---------------------------------------------------------
  const totalPlanned = items.reduce((a, i) => a + (i.plannedValue || computeLine(i)), 0);
  const totalExecuted = items.reduce((a, i) => a + i.executedValue, 0);
  const budgetBase = project.budgetApproved > 0 ? project.budgetApproved : totalPlanned;
  const saldo = budgetBase - totalExecuted;
  const pctExec = pct(totalExecuted, budgetBase);

  const byMeta = useMemo(() => {
    const map = new Map<string, FinancialItem[]>();
    items.forEach(it => {
      const key = it.meta || 'Sem meta';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [items]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { planned: number; executed: number; count: number }>();
    BUDGET_CATEGORIES.forEach(c => map.set(c, { planned: 0, executed: 0, count: 0 }));
    items.forEach(i => {
      const cur = map.get(i.category) ?? { planned: 0, executed: 0, count: 0 };
      cur.planned += i.plannedValue || computeLine(i);
      cur.executed += i.executedValue;
      cur.count += 1;
      map.set(i.category, cur);
    });
    return Array.from(map.entries());
  }, [items]);

  const cpTotals = contrapartidas.reduce(
    (acc, c) => {
      const v = c.quantidade * c.valorUnitario;
      if (c.tipo === 'Financeira') acc.financeira += v;
      else acc.economica += v;
      acc.total += v;
      return acc;
    },
    { financeira: 0, economica: 0, total: 0 },
  );

  // ---- Export ---------------------------------------------------------------
  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ['Meta', 'Categoria', 'Descrição', 'Qtd', 'Unidade', 'Qtd. Unidades', 'Valor Unitário', 'Total Previsto', 'Executado', 'Data', 'Fornecedor', 'Documento'],
      ...items.map(i => [
        i.meta, i.category, i.item, i.qtd, i.unidade, i.qtdUnidades, i.valorUnitario,
        i.plannedValue || computeLine(i), i.executedValue, i.date, i.supplier, i.document,
      ]),
      [],
      ['CONTRAPARTIDAS'],
      ['Meta', 'Descrição', 'Tipo', 'Qtd', 'Unidade', 'Valor Unitário', 'Total'],
      ...contrapartidas.map(c => [c.meta, c.descricao, c.tipo, c.quantidade, c.unidade, c.valorUnitario, c.quantidade * c.valorUnitario]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `orcamentario-${project.code}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Planilha exportada.');
  };

  return (
    <div className="space-y-5 p-6 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            Planilha Orçamentária do Projeto
          </h2>
          <p style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Estrutura por Meta → Categoria → Item · Total = Qtd × Qtd. Unidades × Valor Unitário
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: '#475569', background: '#fff' }}
          >
            <Download size={12} /> Exportar CSV
          </button>
          <button
            onClick={() => setShowCpForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: '#475569', background: '#fff' }}
          >
            <HandCoins size={12} /> Contrapartida
          </button>
          <button
            onClick={() => setShowItemForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={12} /> Item orçamentário
          </button>
        </div>
      </div>

      {/* Executive summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total do Projeto', value: fmt(totalPlanned), icon: DollarSign, color: '#2563EB', bg: '#EFF6FF', sub: `${items.length} itens em ${byMeta.length} metas` },
          { label: 'Executado', value: fmt(totalExecuted), icon: TrendingUp, color: '#059669', bg: '#ECFDF5', sub: `${pctExec}% do orçamento` },
          { label: 'Saldo Disponível', value: fmt(saldo), icon: Wallet, color: '#D97706', bg: '#FFFBEB', sub: `${Math.max(0, 100 - pctExec)}% restante` },
          { label: 'Contrapartidas', value: fmt(cpTotals.total), icon: HandCoins, color: '#7C3AED', bg: '#F5F3FF', sub: `Fin. ${fmt(cpTotals.financeira)} · Econ. ${fmt(cpTotals.economica)}` },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: k.bg }}>
                <Icon size={17} color={k.color} />
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{k.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{k.label}</div>
                <div style={{ fontSize: '0.66rem', color: '#94A3B8' }} className="truncate">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>Execução do Orçamento</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: pctExec >= 90 ? '#059669' : pctExec >= 70 ? '#2563EB' : '#D97706' }}>
            {pctExec}%
          </span>
        </div>
        <div className="h-3 rounded-full" style={{ background: '#E2E8F0' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, pctExec)}%`, background: pctExec >= 90 ? '#10B981' : pctExec >= 70 ? '#2563EB' : '#F59E0B' }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>R$ 0</span>
          <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{fmt(budgetBase)}</span>
        </div>
      </div>

      {/* Totais por categoria (Anexo XX - resumo) */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
            Resumo por Categoria de Gastos
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {['Categoria', 'Itens', 'Previsto', 'Executado', '% Exec.'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byCategory.map(([cat, v]) => (
              <tr key={cat} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={chipStyle(cat)}>{cat}</span></td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.75rem', color: '#475569' }}>{v.count}</td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{fmt(v.planned)}</td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>{fmt(v.executed)}</td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.75rem', color: '#475569' }}>{pct(v.executed, v.planned)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#F8FAFC', borderTop: '2px solid var(--border)' }}>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>TOTAL DO PROJETO</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', color: '#475569' }}>{items.length}</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>{fmt(totalPlanned)}</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#059669' }}>{fmt(totalExecuted)}</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>{pct(totalExecuted, totalPlanned)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Itens por Meta */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
            Detalhamento Orçamentário por Meta
          </h3>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <DollarSign size={32} color="#CBD5E1" />
            <p style={{ color: '#94A3B8', fontSize: '0.825rem' }}>Nenhum item orçamentário cadastrado.</p>
          </div>
        ) : (
          byMeta.map(([meta, its]) => {
            const subtotalP = its.reduce((a, i) => a + (i.plannedValue || computeLine(i)), 0);
            const subtotalE = its.reduce((a, i) => a + i.executedValue, 0);
            return (
              <div key={meta} style={{ borderTop: '1px solid var(--border)' }}>
                <div className="px-5 py-2 flex items-center justify-between" style={{ background: '#F1F5F9' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{meta}</span>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                    Subtotal: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>{fmt(subtotalP)}</span>
                    <span style={{ margin: '0 8px', color: '#CBD5E1' }}>·</span>
                    Exec.: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#059669' }}>{fmt(subtotalE)}</span>
                  </span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#FAFAFA' }}>
                      {['Categoria', 'Descrição', 'Qtd', 'Unidade', 'Qtd. Un.', 'Valor Unit.', 'Total Linha', 'Executado', 'Saldo', ''].map(h => (
                        <th key={h} className="px-3 py-2 text-left" style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {its.map(item => {
                      const total = item.plannedValue || computeLine(item);
                      const s = total - item.executedValue;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={chipStyle(item.category)}>{item.category}</span></td>
                          <td className="px-3 py-2" style={{ fontSize: '0.76rem', color: '#0F172A' }}>{item.item}</td>
                          <td className="px-3 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{item.qtd}</td>
                          <td className="px-3 py-2" style={{ fontSize: '0.75rem', color: '#475569' }}>{item.unidade}</td>
                          <td className="px-3 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{item.qtdUnidades}</td>
                          <td className="px-3 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{fmt(item.valorUnitario)}</td>
                          <td className="px-3 py-2" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#0F172A', fontWeight: 600 }}>{fmt(total)}</td>
                          <td className="px-3 py-2">
                            {editExec === item.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  autoFocus
                                  type="number" step="0.01"
                                  value={execVal}
                                  onChange={e => setExecVal(e.target.value)}
                                  className="w-24 px-2 py-1 rounded border text-[12px]"
                                  style={{ borderColor: 'var(--border)', fontFamily: 'var(--font-mono)' }}
                                />
                                <button
                                  onClick={() => {
                                    updateFinancialExecuted(project.id, item.id, Number(execVal) || 0);
                                    setEditExec(null);
                                    toast.success('Execução atualizada.');
                                  }}
                                  className="p-1 rounded"
                                  style={{ background: '#DCFCE7' }}
                                ><Check size={12} color="#059669" /></button>
                                <button onClick={() => setEditExec(null)} className="p-1 rounded" style={{ background: '#FEE2E2' }}>
                                  <X size={12} color="#DC2626" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setEditExec(item.id); setExecVal(String(item.executedValue)); }}
                                className="flex items-center gap-1"
                                title="Editar valor executado"
                              >
                                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>{fmt(item.executedValue)}</span>
                                <Edit3 size={10} color="#94A3B8" />
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: s < 0 ? '#DC2626' : '#0F172A', fontWeight: s < 0 ? 600 : 400 }}>{fmt(s)}</td>
                          <td className="px-2 py-2">
                            <button
                              onClick={() => { if (window.confirm('Excluir item orçamentário?')) { deleteFinancial(project.id, item.id); toast.success('Item excluído.'); } }}
                              className="p-1 rounded hover:bg-red-50"
                            ><Trash2 size={12} color="#DC2626" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* Contrapartidas */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>Contrapartidas</h3>
          <div style={{ fontSize: '0.72rem', color: '#475569' }}>
            Financeira: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>{fmt(cpTotals.financeira)}</span>
            <span style={{ margin: '0 8px', color: '#CBD5E1' }}>·</span>
            Econômica: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>{fmt(cpTotals.economica)}</span>
            <span style={{ margin: '0 8px', color: '#CBD5E1' }}>·</span>
            Total: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#7C3AED' }}>{fmt(cpTotals.total)}</span>
          </div>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {contrapartidas.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <HandCoins size={28} color="#CBD5E1" />
            <p style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Nenhuma contrapartida cadastrada.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Meta', 'Descrição', 'Tipo', 'Qtd', 'Unidade', 'Valor Unit.', 'Total', ''].map(h => (
                  <th key={h} className="px-4 py-2 text-left" style={{ fontSize: '0.65rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contrapartidas.map(c => {
                const total = c.quantidade * c.valorUnitario;
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: '#475569' }}>{c.meta}</td>
                    <td className="px-4 py-2" style={{ fontSize: '0.76rem', color: '#0F172A' }}>{c.descricao}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={c.tipo === 'Financeira' ? { background: '#F5F3FF', color: '#7C3AED' } : { background: '#F0FDF4', color: '#059669' }}>{c.tipo}</span>
                    </td>
                    <td className="px-4 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{c.quantidade}</td>
                    <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: '#475569' }}>{c.unidade}</td>
                    <td className="px-4 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#475569' }}>{fmt(c.valorUnitario)}</td>
                    <td className="px-4 py-2" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#0F172A', fontWeight: 600 }}>{fmt(total)}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => { if (window.confirm('Excluir contrapartida?')) { deleteContrapartida(project.id, c.id); toast.success('Excluída.'); } }}
                        className="p-1 rounded hover:bg-red-50"
                      ><Trash2 size={12} color="#DC2626" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {showItemForm && (
        <ItemForm
          existingMetas={byMeta.map(([m]) => m)}
          onClose={() => setShowItemForm(false)}
          onSave={(payload) => {
            addFinancial(project.id, payload);
            toast.success('Item adicionado.');
            setShowItemForm(false);
          }}
        />
      )}
      {showCpForm && (
        <CpForm
          existingMetas={byMeta.map(([m]) => m)}
          onClose={() => setShowCpForm(false)}
          onSave={(payload) => {
            addContrapartida(project.id, payload);
            toast.success('Contrapartida adicionada.');
            setShowCpForm(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }}>{children}</label>;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200';
const inputStyle = { borderColor: 'var(--border)', background: '#fff' } as const;

function ItemForm({ existingMetas, onClose, onSave }: {
  existingMetas: string[];
  onClose: () => void;
  onSave: (i: Omit<FinancialItem, 'id'>) => void;
}) {
  const [f, setF] = useState({
    meta: existingMetas[existingMetas.length - 1] || 'Meta 1',
    category: BUDGET_CATEGORIES[0] as BudgetCategory,
    item: '',
    qtd: '1',
    unidade: 'unidade',
    qtdUnidades: '1',
    valorUnitario: '',
    executedValue: '0',
    date: '',
    supplier: '',
    document: '',
  });
  const total = (Number(f.qtd) || 0) * (Number(f.qtdUnidades) || 0) * (Number(f.valorUnitario) || 0);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.item.trim()) { toast.error('Informe a descrição do item.'); return; }
    if (!f.meta.trim()) { toast.error('Informe a meta.'); return; }
    onSave({
      meta: f.meta.trim(),
      category: f.category,
      relatedGoal: f.meta.trim(),
      item: f.item.trim(),
      qtd: Number(f.qtd) || 0,
      unidade: f.unidade.trim(),
      qtdUnidades: Number(f.qtdUnidades) || 0,
      valorUnitario: Number(f.valorUnitario) || 0,
      plannedValue: total,
      executedValue: Number(f.executedValue) || 0,
      date: f.date,
      supplier: f.supplier,
      document: f.document,
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Novo Item Orçamentário</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Meta</FieldLabel>
            <input list="metas-list" className={inputCls} style={inputStyle} value={f.meta} onChange={e => setF({ ...f, meta: e.target.value })} placeholder="Ex: Meta 1" />
            <datalist id="metas-list">
              {existingMetas.map(m => <option key={m} value={m} />)}
              {['Meta 1','Meta 2','Meta 3','Meta 4','Meta 5'].map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <FieldLabel>Categoria de Gasto</FieldLabel>
            <select className={inputCls} style={inputStyle} value={f.category} onChange={e => setF({ ...f, category: e.target.value as BudgetCategory })}>
              {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <FieldLabel>Descrição</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.item} onChange={e => setF({ ...f, item: e.target.value })} placeholder="Descrição detalhada do item / serviço" />
          </div>
          <div>
            <FieldLabel>Qtd.</FieldLabel>
            <input type="number" step="1" min="0" className={inputCls} style={inputStyle} value={f.qtd} onChange={e => setF({ ...f, qtd: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Unidade</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.unidade} onChange={e => setF({ ...f, unidade: e.target.value })} placeholder="ex: diária, mês, unidade" />
          </div>
          <div>
            <FieldLabel>Qtd. de Unidades</FieldLabel>
            <input type="number" step="1" min="0" className={inputCls} style={inputStyle} value={f.qtdUnidades} onChange={e => setF({ ...f, qtdUnidades: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Valor Unitário (R$)</FieldLabel>
            <input type="number" step="0.01" min="0" className={inputCls} style={inputStyle} value={f.valorUnitario} onChange={e => setF({ ...f, valorUnitario: e.target.value })} placeholder="0,00" />
          </div>
          <div className="col-span-2 rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: '#F1F5F9' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Total da linha (calculado automaticamente):</span>
            <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>{fmt(total)}</span>
          </div>
          <div>
            <FieldLabel>Executado (R$)</FieldLabel>
            <input type="number" step="0.01" min="0" className={inputCls} style={inputStyle} value={f.executedValue} onChange={e => setF({ ...f, executedValue: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Data</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} placeholder="dd/mm/aaaa" />
          </div>
          <div>
            <FieldLabel>Fornecedor</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.supplier} onChange={e => setF({ ...f, supplier: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Documento (NF/Recibo)</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.document} onChange={e => setF({ ...f, document: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', color: '#475569' }}>Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar Item</button>
        </div>
      </form>
    </div>
  );
}

function CpForm({ existingMetas, onClose, onSave }: {
  existingMetas: string[];
  onClose: () => void;
  onSave: (i: { meta: string; descricao: string; tipo: ContrapartidaTipo; quantidade: number; unidade: string; valorUnitario: number }) => void;
}) {
  const [f, setF] = useState({
    meta: existingMetas[0] || 'Meta 1',
    descricao: '',
    tipo: 'Financeira' as ContrapartidaTipo,
    quantidade: '1',
    unidade: 'unidade',
    valorUnitario: '',
  });
  const total = (Number(f.quantidade) || 0) * (Number(f.valorUnitario) || 0);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.descricao.trim()) { toast.error('Informe a descrição.'); return; }
    onSave({
      meta: f.meta.trim(),
      descricao: f.descricao.trim(),
      tipo: f.tipo,
      quantidade: Number(f.quantidade) || 0,
      unidade: f.unidade.trim(),
      valorUnitario: Number(f.valorUnitario) || 0,
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Nova Contrapartida</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Meta Associada</FieldLabel>
            <input list="cp-metas" className={inputCls} style={inputStyle} value={f.meta} onChange={e => setF({ ...f, meta: e.target.value })} />
            <datalist id="cp-metas">
              {existingMetas.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <select className={inputCls} style={inputStyle} value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value as ContrapartidaTipo })}>
              <option value="Financeira">Financeira</option>
              <option value="Econômica">Econômica</option>
            </select>
          </div>
          <div className="col-span-2">
            <FieldLabel>Descrição</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Quantidade</FieldLabel>
            <input type="number" step="1" min="0" className={inputCls} style={inputStyle} value={f.quantidade} onChange={e => setF({ ...f, quantidade: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Unidade</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.unidade} onChange={e => setF({ ...f, unidade: e.target.value })} />
          </div>
          <div className="col-span-2">
            <FieldLabel>Valor Unitário (R$)</FieldLabel>
            <input type="number" step="0.01" min="0" className={inputCls} style={inputStyle} value={f.valorUnitario} onChange={e => setF({ ...f, valorUnitario: e.target.value })} />
          </div>
          <div className="col-span-2 rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: '#F1F5F9' }}>
            <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Total da contrapartida:</span>
            <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>{fmt(total)}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', color: '#475569' }}>Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
      </form>
    </div>
  );
}
