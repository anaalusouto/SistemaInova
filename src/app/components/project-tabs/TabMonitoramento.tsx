import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Target, Package, CheckSquare, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type ActivityStatus } from '../../data/mockData';
import { useStore } from '../../store';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<ActivityStatus, { color: string; bg: string; dot: string }> = {
  'Não iniciado': { color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
  'Em andamento': { color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
  'Concluído':    { color: '#059669', bg: '#ECFDF5', dot: '#10B981' },
  'Atrasado':     { color: '#DC2626', bg: '#FEF2F2', dot: '#EF4444' },
};

interface TabMonitoramentoProps {
  project: Project;
}

export function TabMonitoramento({ project }: TabMonitoramentoProps) {
  const { updateActivityStatus } = useStore();
  const detailRef = useRef<HTMLDivElement>(null);
  const [expandedGoals, setExpandedGoals] = useState<number[]>(project.goals.map(g => g.id));
  const [expandedDeliverables, setExpandedDeliverables] = useState<number[]>(
    project.goals.flatMap(g => g.deliverables.map(d => d.id))
  );

  const toggleGoal = (id: number) =>
    setExpandedGoals(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleDeliverable = (id: number) =>
    setExpandedDeliverables(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allActivities = project.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));
  const totalProgress = allActivities.length > 0
    ? Math.round(allActivities.reduce((a, act) => a + act.progress, 0) / allActivities.length)
    : 0;

  if (project.goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Target size={48} color="#CBD5E1" />
        <p style={{ color: '#94A3B8', fontSize: '0.875rem' }}>Nenhuma meta cadastrada neste projeto.</p>
        <button
          onClick={() => toast.info("Cadastro de metas: use a aba Cadastro para editar a estrutura do projeto.")} className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={14} /> Adicionar Meta
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
      {/* Resumo geral do projeto (Visão Geral unificada) */}
      <div className="bg-card rounded-xl border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
              Resumo do Projeto
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 4, maxWidth: 720 }}>
              {project.objective}
            </p>
          </div>
          <button
            onClick={() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium text-white flex-shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            <ArrowDown size={12} /> Ver detalhamento
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Situação', value: project.status },
            { label: 'Progresso', value: `${project.progress}%` },
            { label: 'Vigência', value: `${project.startDate} → ${project.endDate}` },
            { label: 'Coordenador(a)', value: project.coordinator },
            { label: 'Financiador', value: project.financier },
            { label: 'Aprovado', value: fmt(project.budgetApproved) },
            { label: 'Executado', value: fmt(project.budgetExecuted) },
            { label: 'Metas / Atividades', value: `${project.goals.length} / ${project.goals.flatMap(g => g.deliverables.flatMap(d => d.activities)).length}` },
          ].map(kv => (
            <div key={kv.label} className="rounded-lg p-3 border" style={{ borderColor: 'var(--border)', background: '#F8FAFC' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kv.label}</div>
              <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, marginTop: 3 }}>{kv.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div ref={detailRef} />
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: '#0F172A' }}>
            Detalhamento do Monitoramento
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
            {project.goals.length} metas · {allActivities.length} atividades · {totalProgress}% concluído
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            {(['Não iniciado', 'Em andamento', 'Concluído', 'Atrasado'] as ActivityStatus[]).map(s => {
              const count = allActivities.filter(a => a.status === s).length;
              const cfg = statusConfig[s];
              return (
                <span key={s} className="flex items-center gap-1.5 text-[11px]" style={{ color: cfg.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                  {count} {s.split(' ')[0]}
                </span>
              );
            })}
          </div>
          <button
            onClick={() => toast.info("Novas metas devem ser cadastradas na aba Cadastro.")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white ml-2"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={12} /> Meta
          </button>
        </div>
      </div>

      {/* Goals tree */}
      <div className="flex flex-col gap-3">
        {project.goals.map(goal => {
          const goalActs = goal.deliverables.flatMap(d => d.activities);
          const goalPct = goalActs.length > 0
            ? Math.round(goalActs.reduce((a, act) => a + act.progress, 0) / goalActs.length)
            : 0;
          const isGoalExpanded = expandedGoals.includes(goal.id);

          return (
            <div
              key={goal.id}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--border)', background: '#FAFBFD' }}
            >
              {/* Goal header */}
              <button
                onClick={() => toggleGoal(goal.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-blue-50"
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EFF6FF' }}>
                  <Target size={12} color="#2563EB" />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', flex: 1 }}>
                  {goal.name}
                </span>
                <div className="flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-2 w-28">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: '#DBEAFE' }}>
                      <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: '#2563EB' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#2563EB', fontWeight: 600 }}>
                      {goalPct}%
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{goalActs.length} atividades</span>
                </div>
                {isGoalExpanded ? <ChevronDown size={14} color="#94A3B8" /> : <ChevronRight size={14} color="#94A3B8" />}
              </button>

              {isGoalExpanded && (
                <div className="px-4 pb-4">
                  {goal.deliverables.map(deliverable => {
                    const isDelExpanded = expandedDeliverables.includes(deliverable.id);
                    const delActs = deliverable.activities;
                    const delPct = delActs.length > 0
                      ? Math.round(delActs.reduce((a, act) => a + act.progress, 0) / delActs.length)
                      : 0;

                    return (
                      <div
                        key={deliverable.id}
                        className="rounded-lg border mb-2 overflow-hidden"
                        style={{ borderColor: 'var(--border)', background: '#fff' }}
                      >
                        {/* Deliverable header */}
                        <button
                          onClick={() => toggleDeliverable(deliverable.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#F0FDF4' }}>
                            <Package size={11} color="#059669" />
                          </div>
                          <div className="flex-1">
                            <div style={{ fontSize: '0.825rem', fontWeight: 500, color: '#1E293B' }}>{deliverable.name}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 1 }}>
                              Resultado esperado: {deliverable.expectedResult}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mr-2">
                            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{delActs.length} atividades</span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#059669', fontWeight: 600 }}>{delPct}%</span>
                          </div>
                          {isDelExpanded ? <ChevronDown size={13} color="#94A3B8" /> : <ChevronRight size={13} color="#94A3B8" />}
                        </button>

                        {isDelExpanded && (
                          <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                            <table className="w-full">
                              <thead>
                                <tr style={{ background: '#F8FAFC' }}>
                                  {['Atividade', 'Responsável', 'Data Prevista', 'Início', 'Conclusão', 'Progresso', 'Status', 'Obs'].map(h => (
                                    <th
                                      key={h}
                                      className="px-3 py-2 text-left"
                                      style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {deliverable.activities.map(activity => {
                                  const sCfg = statusConfig[activity.status];
                                  return (
                                    <tr
                                      key={activity.id}
                                      style={{ borderBottom: '1px solid var(--border)' }}
                                    >
                                      <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2">
                                          <CheckSquare size={12} color={sCfg.dot} />
                                          <span style={{ fontSize: '0.78rem', color: '#1E293B', fontWeight: 500 }}>
                                            {activity.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>{activity.responsible}</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.73rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                                          {activity.plannedDate}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.73rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                                          {activity.startDate ?? '—'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.73rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                                          {activity.conclusionDate ?? '—'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 w-28">
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-1.5 rounded-full" style={{ background: '#E2E8F0' }}>
                                            <div
                                              className="h-full rounded-full"
                                              style={{ width: `${activity.progress}%`, background: sCfg.dot }}
                                            />
                                          </div>
                                          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#64748B', width: 28, textAlign: 'right' }}>
                                            {activity.progress}%
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <select
                                          value={activity.status}
                                          onChange={(e) => {
                                            updateActivityStatus(project.id, activity.id, e.target.value as ActivityStatus);
                                            toast.success('Status atualizado.');
                                          }}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap border-0 outline-none cursor-pointer"
                                          style={{ color: sCfg.color, background: sCfg.bg }}
                                        >
                                          {(['Não iniciado', 'Em andamento', 'Concluído', 'Atrasado'] as ActivityStatus[]).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                                          {activity.observations || '—'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            <div className="p-3">
                              <button
                                onClick={() => toast.info("Adição de atividades: será liberada na aba Cadastro.")}
                                className="flex items-center gap-1.5 text-[12px]"
                                style={{ color: '#2563EB' }}
                              >
                                <Plus size={12} /> Adicionar atividade
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
