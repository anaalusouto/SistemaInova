import { useMemo, useState } from 'react';
import {
  Plus, Download, TrendingUp, DollarSign, Wallet, Trash2, X, HandCoins, PencilLine, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ACCOUNTABILITY_STATUSES,
  BUDGET_CATEGORIES,
  CHANGE_RECORDS,
  type AccountabilityStatus,
  type BudgetCategory,
  type ChangeRecord,
  type ContrapartidaTipo,
  type ExecutedFlag,
  type FinancialItem,
  type Project,
} from '../../data/mockData';
import type { JsonValue } from '../../data/projectExtras';
import { useStore, type ProjectExt } from '../../store';
import { ApprovalsBanner, useOpAuthor } from './ApprovalsBanner';
import { useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n);

const pct = (exec: number, planned: number) => (planned > 0 ? Math.round((exec / planned) * 100) : 0);

const computeLine = (i: Pick<FinancialItem, 'qtd' | 'qtdUnidades' | 'valorUnitario'>) =>
  (Number(i.qtd) || 0) * (Number(i.qtdUnidades) || 0) * (Number(i.valorUnitario) || 0);

const EXECUTED_FLAGS: ExecutedFlag[] = ['Não', 'Sim', 'Parcial'];

const ACC_COLORS: Record<AccountabilityStatus, { bg: string; fg: string }> = {
  'Não enviado':           { bg: 'var(--surface-2)', fg: 'var(--ink-3)' },
  'Enviado':               { bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  'Aprovado pela FAS':     { bg: 'var(--success-soft)', fg: 'var(--success)' },
  'Devolvido para ajuste': { bg: 'var(--warning-soft)', fg: 'var(--warning-strong-text)' },
  'Reprovado':             { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
};

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  'Despesas com pessoal': { bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  'Serviços de terceiros': { bg: 'var(--warning-soft)', fg: 'var(--warning-strong-text)' },
  'Materiais de consumo': { bg: 'var(--success-soft)', fg: 'var(--success)' },
  'Material permanente/equipamentos': { bg: 'var(--info-soft)', fg: 'var(--info)' },
  'Custos administrativos': { bg: 'var(--danger-soft)', fg: 'var(--danger-strong-text)' },
};

const chipStyle = (c: string) => {
  const cc = CATEGORY_COLORS[c] ?? { bg: 'var(--line-1)', fg: 'var(--ink-3)' };
  return { background: cc.bg, color: cc.fg };
};

const selCls = 'w-full bg-transparent rounded px-1 py-1 border border-transparent hover:border-border focus:border-blue-300 outline-none';

interface TabFinanceiroProps { project: Project }

export function TabFinanceiro({ project }: TabFinanceiroProps) {
  const { submitMetaEdit, addContrapartida, deleteContrapartida, addAporte, deleteAporte, getProject } = useStore();
  const { author, isAdmin } = useOpAuthor();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const p = getProject(project.id) ?? (project as ProjectExt);

  const record = (action: string, detail: string, kind: 'alteracao' | 'pendencia' = 'alteracao') =>
    audit({
      userLogin: user?.login ?? '—', area: 'financeiro', action, detail,
      projectId: project.id, projectName: project.name, kind,
    });

  const [showItemForm, setShowItemForm] = useState(false);
  const [showCpForm, setShowCpForm] = useState(false);
  const [editItem, setEditItem] = useState<FinancialItem | null>(null);
  const [showAporteForm, setShowAporteForm] = useState(false);

  const items = p.financialItems;
  const contrapartidas = p.contrapartidas ?? [];
  const aportes = p.aportes ?? [];
  const metaOptions = useMemo(() => {
    const fromGoals = (p.goals ?? []).map(g => g.name);
    const fromItems = p.financialItems.map(i => i.meta).filter(Boolean);
    return Array.from(new Set([...fromGoals, ...fromItems]));
  }, [p]);

  const notify = (r: 'aplicado' | 'pendente') =>
    r === 'pendente'
      ? toast.info('Alteração enviada para validação de um administrador.')
      : toast.success('Alteração registrada.');

  const edit = async (item: FinancialItem, field: string, from: string, to: string) => {
    if (from === to) return;
    if (!isAdmin) { setEditItem(item); return; }
    const result = await submitMetaEdit(project.id, {
      entity: 'financeiro', action: 'editar', targetId: item.id,
      targetPath: `${item.meta} › ${item.item.slice(0, 40)}`, field, from, to,
    }, author);
    notify(result);
    record('editar item orçamentário', `${field}: ${from} → ${to} · ${item.item.slice(0, 40)}`, result === 'pendente' ? 'pendencia' : 'alteracao');
  };

  const remove = async (item: FinancialItem) => {
    if (!window.confirm('Excluir item orçamentário?')) return;
    const result = await submitMetaEdit(project.id, {
      entity: 'financeiro', action: 'excluir', targetId: item.id,
      targetPath: `${item.meta} › ${item.item.slice(0, 40)}`, from: item.item,
    }, author);
    notify(result);
    record('excluir item orçamentário', `${item.meta} · ${item.item.slice(0, 40)}`, result === 'pendente' ? 'pendencia' : 'alteracao');
  };

  const submitRowEdit = async (item: FinancialItem, payload: Record<string, JsonValue>) => {
    const result = await submitMetaEdit(project.id, {
      entity: 'financeiro', action: 'editar', targetId: item.id,
      targetPath: `${item.meta} › ${item.item.slice(0, 40)}`,
      field: 'item orçamentário', from: item.item, to: String(payload.item ?? item.item), payload,
    }, author);
    notify(result);
    record('editar item orçamentário', `${item.meta} · ${String(payload.item ?? item.item)}`, result === 'pendente' ? 'pendencia' : 'alteracao');
    setEditItem(null);
  };

  const create = async (payload: Record<string, JsonValue>) => {
    const result = await submitMetaEdit(project.id, {
      entity: 'financeiro', action: 'criar', targetPath: `${payload.meta}`,
      to: String(payload.item ?? ''), payload,
    }, author);
    notify(result);
    record('criar item orçamentário', `${payload.meta} · ${String(payload.item ?? '')}`, result === 'pendente' ? 'pendencia' : 'alteracao');
    setShowItemForm(false);
  };

  // ---- Aggregations ---------------------------------------------------------
  const totalPlanned = items.reduce((a, i) => a + (i.plannedValue || computeLine(i)), 0);
  const totalExecuted = items.reduce((a, i) => a + i.executedValue, 0);
  const budgetBase = p.budgetApproved > 0 ? p.budgetApproved : totalPlanned;
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

  const accSummary = useMemo(() => {
    const map = new Map<AccountabilityStatus, number>();
    ACCOUNTABILITY_STATUSES.forEach(s => map.set(s, 0));
    items.forEach(i => {
      const s = (i.accountability ?? 'Não enviado') as AccountabilityStatus;
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [items]);

  const cpTotals = contrapartidas.reduce(
    (acc, c) => {
      const v = c.quantidade * c.valorUnitario;
      if (c.tipo === 'Financeira') acc.financeira += v; else acc.economica += v;
      acc.total += v;
      return acc;
    },
    { financeira: 0, economica: 0, total: 0 },
  );

  const exportCSV = () => {
    const rows: (string | number)[][] = [
      ['Meta', 'Categoria', 'Descrição', 'Qtd', 'Unidade', 'Qtd. de Unidades', 'Valor Unitário', 'Total da Linha (Previsto)', 'Executado', 'Valor Executado', 'Prestação de Contas', 'Registro de Alterações'],
      ...items.map(i => [
        i.meta, i.category, i.item, i.qtd, i.unidade, i.qtdUnidades, i.valorUnitario,
        i.plannedValue || computeLine(i), i.executedFlag ?? 'Não', i.executedValue,
        i.accountability ?? 'Não enviado', i.changeRecord ?? 'Conforme planejado',
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
    a.href = url; a.download = `orcamentario-${p.code}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Planilha exportada.');
  };

  return (
    <div className="space-y-5 p-6 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
            Planilha Orçamentária do Projeto
          </h2>
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>
            Total da linha (previsto) = Qtd × Qtd. de unidades × Valor unitário · execução, prestação de contas e registro por linha
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)', background: 'var(--surface-0)' }}>
            <Download size={12} /> Exportar CSV
          </button>
          <button onClick={() => setShowCpForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)', background: 'var(--surface-0)' }}>
            <HandCoins size={12} /> Contrapartida
          </button>
          <button onClick={() => setShowItemForm(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: 'var(--primary)' }}>
            <Plus size={12} /> Item orçamentário
          </button>
        </div>
      </div>

      <ApprovalsBanner projectId={project.id} approvals={p.approvals ?? []} entities={['financeiro']} />

      {/* Executive summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total do Projeto', value: fmt(totalPlanned), icon: DollarSign, color: 'var(--brand)', bg: 'var(--brand-soft)', sub: `${items.length} itens em ${byMeta.length} metas` },
          { label: 'Executado', value: fmt(totalExecuted), icon: TrendingUp, color: 'var(--success)', bg: 'var(--success-soft)', sub: `${pctExec}% do orçamento` },
          { label: 'Saldo Disponível', value: fmt(saldo), icon: Wallet, color: 'var(--warning)', bg: 'var(--warning-soft)', sub: `${Math.max(0, 100 - pctExec)}% restante` },
          { label: 'Contrapartidas', value: fmt(cpTotals.total), icon: HandCoins, color: 'var(--info)', bg: 'var(--info-soft)', sub: `Fin. ${fmt(cpTotals.financeira)} · Econ. ${fmt(cpTotals.economica)}` },
        ].map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-card rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: k.bg }}>
                <Icon size={17} color={k.color} />
              </div>
              <div className="min-w-0">
                <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-1)' }}>{k.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>{k.label}</div>
                <div style={{ fontSize: '0.66rem', color: 'var(--ink-5)' }} className="truncate">{k.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prestação de contas */}
      <div className="flex items-center gap-2 flex-wrap">
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-3)' }}>Prestação de contas:</span>
        {accSummary.map(([s, c]) => (
          <span key={s} className="px-2.5 py-1 rounded-full text-[11px] font-medium" style={{ background: ACC_COLORS[s].bg, color: ACC_COLORS[s].fg }}>
            {c} {s}
          </span>
        ))}
      </div>

      {/* Progress */}
      <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-1)' }}>Execução do Orçamento</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: pctExec >= 90 ? 'var(--success)' : pctExec >= 70 ? 'var(--brand)' : 'var(--warning)' }}>
            {pctExec}%
          </span>
        </div>
        <div className="h-3 rounded-full" style={{ background: 'var(--line-1)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pctExec)}%`, background: pctExec >= 90 ? 'var(--success)' : pctExec >= 70 ? 'var(--brand)' : 'var(--warning)' }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>R$ 0</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{fmt(budgetBase)}</span>
        </div>
      </div>

      {/* Resumo por categoria */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)' }}>
            Resumo por Categoria de Gastos
          </h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ background: 'var(--surface-1)' }}>
              {['Categoria', 'Itens', 'Previsto', 'Executado', '% Exec.'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left" style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byCategory.map(([cat, v]) => (
              <tr key={cat} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="px-4 py-2.5"><span className="px-2 py-0.5 rounded-md text-[11px] font-medium" style={chipStyle(cat)}>{cat}</span></td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{v.count}</td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-1)' }}>{fmt(v.planned)}</td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 600 }}>{fmt(v.executed)}</td>
                <td className="px-4 py-2.5" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{pct(v.executed, v.planned)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--surface-1)', borderTop: '2px solid var(--border)' }}>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-1)' }}>TOTAL DO PROJETO</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}>{items.length}</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-1)' }}>{fmt(totalPlanned)}</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)' }}>{fmt(totalExecuted)}</td>
              <td className="px-4 py-2.5" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-1)' }}>{pct(totalExecuted, totalPlanned)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Itens por Meta */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)' }}>
            Detalhamento Orçamentário por Meta
          </h3>
        </div>

        <div style={{ maxHeight: 520, overflow: 'auto' }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <DollarSign size={32} color="var(--line-2)" />
              <p style={{ color: 'var(--ink-5)', fontSize: '0.825rem' }}>Nenhum item orçamentário cadastrado.</p>
            </div>
          ) : (
            byMeta.map(([meta, its]) => {
              const subtotalP = its.reduce((a, i) => a + (i.plannedValue || computeLine(i)), 0);
              const subtotalE = its.reduce((a, i) => a + i.executedValue, 0);
              return (
                <div key={meta} style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="px-5 py-2 flex items-center justify-between sticky top-0 z-10" style={{ background: 'var(--surface-2)' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink-1)', textTransform: 'uppercase' }}>{meta}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>
                      Previsto: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-1)' }}>{fmt(subtotalP)}</span>
                      <span style={{ margin: '0 8px', color: 'var(--line-2)' }}>·</span>
                      Executado: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)' }}>{fmt(subtotalE)}</span>
                    </span>
                  </div>
                  <table className="w-full" style={{ minWidth: 1420 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-1)' }}>
                        {['Categoria', 'Descrição', 'Qtd.', 'Unidade', 'Qtd. de unidade', 'Valor unitário (R$)', 'Total da linha (previsto)', 'Valor executado', 'R$ executado', 'Status prestação de contas', 'Registro de alterações', isAdmin ? '' : 'Realizar alteração'].map(h => (
                          <th key={h} className="px-3 py-2 text-left" style={{ fontSize: '0.63rem', fontWeight: 700, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {its.map(item => {
                        const total = item.plannedValue || computeLine(item);
                        const flag = (item.executedFlag ?? (item.executedValue === 0 ? 'Não' : item.executedValue === total ? 'Sim' : 'Parcial')) as ExecutedFlag;
                        const acc = (item.accountability ?? 'Não enviado') as AccountabilityStatus;
                        const rec = (item.changeRecord ?? 'Conforme planejado') as ChangeRecord;
                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td className="px-2 py-2 w-48">
                              <select className={selCls} disabled={!isAdmin} style={{ fontSize: '0.7rem' }} value={item.category} onChange={e => edit(item, 'categoria', item.category, e.target.value)}>
                                {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                {!BUDGET_CATEGORIES.includes(item.category as BudgetCategory) && <option value={item.category}>{item.category}</option>}
                              </select>
                            </td>
                            <td className="px-2 py-2 min-w-[260px]">
                              <input className={selCls} disabled={!isAdmin} readOnly={!isAdmin} style={{ fontSize: '0.76rem', color: 'var(--ink-1)' }} defaultValue={item.item}
                                onBlur={e => edit(item, 'descrição', item.item, e.target.value)} />
                            </td>
                            <td className="px-2 py-2 w-16">
                              <input type="number" className={selCls} disabled={!isAdmin} readOnly={!isAdmin} style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }} defaultValue={item.qtd}
                                onBlur={e => edit(item, 'qtd', String(item.qtd), e.target.value)} />
                            </td>
                            <td className="px-2 py-2 w-28">
                              <input className={selCls} disabled={!isAdmin} readOnly={!isAdmin} style={{ fontSize: '0.74rem' }} defaultValue={item.unidade}
                                onBlur={e => edit(item, 'unidade', item.unidade, e.target.value)} />
                            </td>
                            <td className="px-2 py-2 w-20">
                              <input type="number" className={selCls} disabled={!isAdmin} readOnly={!isAdmin} style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }} defaultValue={item.qtdUnidades}
                                onBlur={e => edit(item, 'qtd. de unidades', String(item.qtdUnidades), e.target.value)} />
                            </td>
                            <td className="px-2 py-2 w-28">
                              <input type="number" step="0.01" className={selCls} disabled={!isAdmin} readOnly={!isAdmin} style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }} defaultValue={item.valorUnitario}
                                onBlur={e => edit(item, 'valor unitário', String(item.valorUnitario), e.target.value)} />
                            </td>
                            <td className="px-3 py-2 w-32" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-1)', fontWeight: 600, background: 'var(--success-soft)' }}>
                              {fmt(total)}
                            </td>
                            <td className="px-2 py-2 w-24">
                              <select className={selCls} disabled={!isAdmin} style={{ fontSize: '0.72rem', color: flag === 'Sim' ? 'var(--success)' : flag === 'Parcial' ? 'var(--warning-strong-text)' : 'var(--ink-4)' }}
                                value={flag} onChange={e => edit(item, 'executado', flag, e.target.value)}>
                                {EXECUTED_FLAGS.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2 w-32">
                              {flag === 'Não' ? (
                                <span style={{ fontSize: '0.72rem', color: 'var(--line-2)' }}>—</span>
                              ) : (
                                <input
                                  type="number" step="0.01"
                                  className={selCls} disabled={!isAdmin} readOnly={!isAdmin}
                                  style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 600 }}
                                  defaultValue={item.executedValue}
                                  key={`${item.id}-${item.executedValue}`}
                                  onBlur={e => edit(item, 'valor executado', String(item.executedValue), e.target.value)}
                                />
                              )}
                            </td>
                            <td className="px-2 py-2 w-44">
                              <select
                                className={selCls} disabled={!isAdmin}
                                style={{ fontSize: '0.71rem', background: ACC_COLORS[acc].bg, color: ACC_COLORS[acc].fg, borderRadius: 6 }}
                                value={acc}
                                onChange={e => edit(item, 'prestação de contas', acc, e.target.value)}
                              >
                                {ACCOUNTABILITY_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2 w-44">
                              <select className={selCls} disabled={!isAdmin} style={{ fontSize: '0.71rem', color: 'var(--ink-3)' }} value={rec}
                                onChange={e => edit(item, 'registro de alterações', rec, e.target.value)}>
                                {CHANGE_RECORDS.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              {isAdmin ? (
                                <button onClick={() => remove(item)} className="p-1 rounded hover:bg-red-50" title="Excluir item">
                                  <Trash2 size={12} color="var(--danger)" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setEditItem(item)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border"
                                  style={{ borderColor: 'var(--brand-soft-border)', color: 'var(--brand-text)', background: 'var(--brand-soft)' }}
                                >
                                  <PencilLine size={11} /> Realizar alteração
                                </button>
                              )}
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

      {!isAdmin && (
        <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
          Você está como estagiário: alterações no orçamento só passam a valer após a aprovação de um administrador.
        </p>
      )}

      {/* Contrapartidas */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)' }}>Contrapartidas</h3>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>
            Financeira: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-1)' }}>{fmt(cpTotals.financeira)}</span>
            <span style={{ margin: '0 8px', color: 'var(--line-2)' }}>·</span>
            Econômica: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-1)' }}>{fmt(cpTotals.economica)}</span>
            <span style={{ margin: '0 8px', color: 'var(--line-2)' }}>·</span>
            Total: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--info)' }}>{fmt(cpTotals.total)}</span>
          </div>
        </div>
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {contrapartidas.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <HandCoins size={28} color="var(--line-2)" />
              <p style={{ color: 'var(--ink-5)', fontSize: '0.8rem' }}>Nenhuma contrapartida cadastrada.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ background: 'var(--surface-1)' }}>
                  {['Meta', 'Descrição', 'Tipo', 'Qtd', 'Unidade', 'Valor Unit.', 'Total', ''].map(h => (
                    <th key={h} className="px-4 py-2 text-left" style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contrapartidas.map(c => {
                  const total = c.quantidade * c.valorUnitario;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{c.meta}</td>
                      <td className="px-4 py-2" style={{ fontSize: '0.76rem', color: 'var(--ink-1)' }}>{c.descricao}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={c.tipo === 'Financeira' ? { background: 'var(--info-soft)', color: 'var(--info)' } : { background: 'var(--success-soft)', color: 'var(--success)' }}>{c.tipo}</span>
                      </td>
                      <td className="px-4 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{c.quantidade}</td>
                      <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{c.unidade}</td>
                      <td className="px-4 py-2" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{fmt(c.valorUnitario)}</td>
                      <td className="px-4 py-2" style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-1)', fontWeight: 600 }}>{fmt(total)}</td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => { if (window.confirm('Excluir contrapartida?')) { deleteContrapartida(project.id, c.id); record('excluir contrapartida', `${c.meta} · ${c.descricao}`); toast.success('Excluída.'); } }}
                          className="p-1 rounded hover:bg-red-50"
                        ><Trash2 size={12} color="var(--danger)" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Caderno de recursos adicionais */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)' }}>
              Caderno de recursos (entradas e saídas)
            </h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
              Recursos que a comunidade movimentou fora do valor do termo. Não altera o orçamento aprovado — serve só para conhecimento e acompanhamento.
            </p>
          </div>
          <button onClick={() => setShowAporteForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white" style={{ background: 'var(--primary)' }}>
            <Plus size={13} /> Lançar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-px" style={{ background: 'var(--border)' }}>
          {(() => {
            const ent = aportes.filter(a => a.tipo === 'Entrada').reduce((x, a) => x + a.valor, 0);
            const sai = aportes.filter(a => a.tipo === 'Saída').reduce((x, a) => x + a.valor, 0);
            const cards = [
              { l: 'Recurso do termo (recebido)', v: fmt(p.budgetApproved), c: 'var(--ink-1)' },
              { l: 'Entradas adicionais', v: fmt(ent), c: 'var(--success)' },
              { l: 'Saídas adicionais', v: fmt(sai), c: 'var(--danger)' },
              { l: 'Saldo de controle', v: fmt(p.budgetApproved + ent - sai - 0), c: 'var(--brand-text)' },
            ];
            return cards.map(c => (
              <div key={c.l} className="px-4 py-3" style={{ background: 'var(--surface-0)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{c.l}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.c }}>{c.v}</div>
              </div>
            ));
          })()}
        </div>

        {aportes.length > 0 && (
          <table className="w-full" style={{ borderTop: '1px solid var(--border)' }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Data', 'Tipo', 'Origem / destino', 'Descrição', 'Valor', 'Registrado por', ''].map(h => (
                  <th key={h} className="px-4 py-2 text-left" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--ink-5)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aportes.map(a => (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-4 py-2" style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{a.data}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={a.tipo === 'Entrada' ? { background: 'var(--success-soft)', color: 'var(--success)' } : { background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                      {a.tipo === 'Entrada' ? <ArrowDownCircle size={10} /> : <ArrowUpCircle size={10} />} {a.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{a.origem}</td>
                  <td className="px-4 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{a.descricao}</td>
                  <td className="px-4 py-2" style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: a.tipo === 'Entrada' ? 'var(--success)' : 'var(--danger)' }}>{fmt(a.valor)}</td>
                  <td className="px-4 py-2" style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>{a.registradoPor ?? '—'}</td>
                  <td className="px-2 py-2">
                    {isAdmin && (
                      <button onClick={() => { deleteAporte(project.id, a.id); record('excluir lançamento', `${a.tipo} · ${a.descricao}`); }} className="p-1 rounded hover:bg-red-50"><Trash2 size={12} color="var(--danger)" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showItemForm && (
        <ItemForm existingMetas={metaOptions} onClose={() => setShowItemForm(false)} onSave={create} />
      )}
      {editItem && (
        <ItemForm
          existingMetas={metaOptions}
          initial={editItem}
          onClose={() => setEditItem(null)}
          onSave={payload => submitRowEdit(editItem, payload)}
        />
      )}
      {showAporteForm && (
        <AporteForm
          onClose={() => setShowAporteForm(false)}
          onSave={a => { addAporte(project.id, { ...a, registradoPor: author.name }); record('lançar recurso', `${a.tipo} · ${a.descricao}`); toast.success('Lançamento registrado.'); setShowAporteForm(false); }}
        />
      )}
      {showCpForm && (
        <CpForm
          existingMetas={byMeta.map(([m]) => m)}
          onClose={() => setShowCpForm(false)}
          onSave={(payload) => { addContrapartida(project.id, payload); record('adicionar contrapartida', `${payload.meta} · ${payload.descricao}`); toast.success('Contrapartida adicionada.'); setShowCpForm(false); }}
        />
      )}

    </div>
  );
}

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--ink-3)', marginBottom: 4, display: 'block' }}>{children}</label>;
}

const inputCls = 'w-full px-3 py-2 rounded-lg border text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-200';
const inputStyle = { borderColor: 'var(--border)', background: 'var(--surface-0)' } as const;

function ItemForm({ existingMetas, initial, onClose, onSave }: {
  existingMetas: string[];
  initial?: FinancialItem;
  onClose: () => void;
  onSave: (i: Record<string, JsonValue>) => void;
}) {
  const [f, setF] = useState({
    meta: initial?.meta ?? existingMetas[existingMetas.length - 1] ?? 'Meta 1',
    category: (initial?.category ?? BUDGET_CATEGORIES[0]) as BudgetCategory,
    item: initial?.item ?? '',
    qtd: String(initial?.qtd ?? 1),
    unidade: initial?.unidade ?? 'unidade',
    qtdUnidades: String(initial?.qtdUnidades ?? 1),
    valorUnitario: String(initial?.valorUnitario ?? ''),
    executedFlag: (initial?.executedFlag ?? 'Não') as ExecutedFlag,
    executedValue: String(initial?.executedValue ?? 0),
    accountability: (initial?.accountability ?? 'Não enviado') as AccountabilityStatus,
    changeRecord: (initial?.changeRecord ?? (initial ? 'Conforme planejado' : 'Novo item')) as ChangeRecord,
  });
  const total = (Number(f.qtd) || 0) * (Number(f.qtdUnidades) || 0) * (Number(f.valorUnitario) || 0);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.item.trim()) { toast.error('Informe a descrição do item.'); return; }
    if (!f.meta.trim()) { toast.error('Informe a meta.'); return; }
    onSave({
      meta: f.meta.trim(),
      category: f.category,
      item: f.item.trim(),
      qtd: Number(f.qtd) || 0,
      unidade: f.unidade.trim(),
      qtdUnidades: Number(f.qtdUnidades) || 0,
      valorUnitario: Number(f.valorUnitario) || 0,
      executedFlag: f.executedFlag,
      executedValue: f.executedFlag === 'Sim' ? total : f.executedFlag === 'Parcial' ? Number(f.executedValue) || 0 : 0,
      accountability: f.accountability,
      changeRecord: f.changeRecord,
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>{initial ? 'Realizar alteração no item' : 'Novo Item Orçamentário'}</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Meta</FieldLabel>
            <select className={inputCls} style={inputStyle} value={f.meta} onChange={e => setF({ ...f, meta: e.target.value })}>
              {!existingMetas.includes(f.meta) && f.meta && <option value={f.meta}>{f.meta}</option>}
              {(existingMetas.length ? existingMetas : ['Meta 1', 'Meta 2', 'Meta 3', 'Meta 4', 'Meta 5']).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Categoria</FieldLabel>
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
            <FieldLabel>Qtd. de unidade</FieldLabel>
            <input type="number" step="1" min="0" className={inputCls} style={inputStyle} value={f.qtdUnidades} onChange={e => setF({ ...f, qtdUnidades: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Valor unitário (R$)</FieldLabel>
            <input type="number" step="0.01" min="0" className={inputCls} style={inputStyle} value={f.valorUnitario} onChange={e => setF({ ...f, valorUnitario: e.target.value })} placeholder="0,00" />
          </div>
          <div className="col-span-2 rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontWeight: 600 }}>Total da linha — previsto (Qtd × Qtd. de unidades × Valor unitário):</span>
            <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-1)' }}>{fmt(total)}</span>
          </div>
          <div>
            <FieldLabel>Valor executado</FieldLabel>
            <select className={inputCls} style={inputStyle} value={f.executedFlag} onChange={e => setF({ ...f, executedFlag: e.target.value as ExecutedFlag })}>
              {EXECUTED_FLAGS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {f.executedFlag !== 'Não' && (
            <div>
              <FieldLabel>R$ executado</FieldLabel>
              <input
                type="number" step="0.01" min="0" className={inputCls} style={inputStyle}
                value={f.executedFlag === 'Sim' ? String(total) : f.executedValue}
                onChange={e => setF({ ...f, executedValue: e.target.value, executedFlag: 'Parcial' })}
              />
            </div>
          )}
          <div>
            <FieldLabel>Status prestação de contas</FieldLabel>
            <select className={inputCls} style={inputStyle} value={f.accountability} onChange={e => setF({ ...f, accountability: e.target.value as AccountabilityStatus })}>
              {ACCOUNTABILITY_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Registro de alterações</FieldLabel>
            <select className={inputCls} style={inputStyle} value={f.changeRecord} onChange={e => setF({ ...f, changeRecord: e.target.value as ChangeRecord })}>
              {CHANGE_RECORDS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Cancelar</button>
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
      <form onSubmit={submit} onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-6 w-full max-w-lg" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Nova Contrapartida</h3>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
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
          <div className="col-span-2 rounded-lg px-4 py-3 flex items-center justify-between" style={{ background: 'var(--surface-2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontWeight: 600 }}>Total da contrapartida:</span>
            <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-1)' }}>{fmt(total)}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
      </form>
    </div>
  );
}

function AporteForm({ onClose, onSave }: {
  onClose: () => void;
  onSave: (a: { data: string; tipo: 'Entrada' | 'Saída'; origem: string; descricao: string; valor: number }) => void;
}) {
  const [f, setF] = useState({
    data: new Date().toISOString().slice(0, 10),
    tipo: 'Entrada' as 'Entrada' | 'Saída',
    origem: '',
    descricao: '',
    valor: '',
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={onClose}>
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={e => {
          e.preventDefault();
          const valor = Number(f.valor) || 0;
          if (!valor) { toast.error('Informe o valor.'); return; }
          onSave({ data: f.data, tipo: f.tipo, origem: f.origem.trim(), descricao: f.descricao.trim(), valor });
        }}
        className="bg-card rounded-2xl border p-6 w-full max-w-lg"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>Lançamento de recurso</h3>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)', marginBottom: 12 }}>
          Entradas e saídas fora do termo. O valor recebido do termo continua inalterado.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Data</FieldLabel>
            <input type="date" className={inputCls} style={inputStyle} value={f.data} onChange={e => setF({ ...f, data: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <select className={inputCls} style={inputStyle} value={f.tipo} onChange={e => setF({ ...f, tipo: e.target.value as 'Entrada' | 'Saída' })}>
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </select>
          </div>
          <div>
            <FieldLabel>Origem / destino</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.origem} onChange={e => setF({ ...f, origem: e.target.value })} placeholder="Ex: recurso próprio da comunidade" />
          </div>
          <div>
            <FieldLabel>Valor (R$)</FieldLabel>
            <input type="number" step="0.01" className={inputCls} style={inputStyle} value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })} placeholder="0,00" />
          </div>
          <div className="col-span-2">
            <FieldLabel>Descrição</FieldLabel>
            <input className={inputCls} style={inputStyle} value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} placeholder="Do que se trata este recurso" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Cancelar</button>
          <button type="submit" className="px-4 py-2 rounded-lg text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
        </div>
      </form>
    </div>
  );
}
