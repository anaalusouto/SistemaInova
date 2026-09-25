import { useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Target, Package, CheckSquare, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type ActivityStatus } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);

const statusConfig: Record<ActivityStatus, { color: string; bg: string; dot: string }> = {
  'A iniciar':    { color: 'var(--ink-4)', bg: 'var(--surface-2)', dot: 'var(--ink-5)' },
  'Em andamento': { color: 'var(--brand)', bg: 'var(--brand-soft)', dot: 'var(--brand)' },
  'Concluído':    { color: 'var(--success)', bg: 'var(--success-soft)', dot: 'var(--success)' },
};

interface TabMonitoramentoProps {
  project: Project;
}

export function TabMonitoramento({ project }: TabMonitoramentoProps) {
  const { updateActivityStatus } = useStore();
  const { user } = useAuth();
  const { log: audit } = useAudit();
  const record = (action: string, detail: string) =>
    audit({
      userLogin: user?.login ?? '—', area: 'monitoramento', action, detail,
      projectId: project.id, projectName: project.name, kind: 'alteracao',
    });
  const detailRef = useRef<HTMLDivElement>(null);
  const [expandedGoals, setExpandedGoals] = useState<string[]>(project.goals.map(g => g.id));
  const [expandedDeliverables, setExpandedDeliverables] = useState<string[]>(
    project.goals.flatMap(g => g.deliverables.map(d => d.id))
  );

  const toggleGoal = (id: string) =>
    setExpandedGoals(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleDeliverable = (id: string) =>
    setExpandedDeliverables(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const allActivities = project.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));
  const totalProgress = allActivities.length > 0
    ? Math.round(allActivities.reduce((a, act) => a + act.progress, 0) / allActivities.length)
    : 0;

  if (project.goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <Target size={48} color="var(--line-2)" />
        <p style={{ color: 'var(--ink-5)', fontSize: '0.875rem' }}>Nenhuma meta cadastrada neste projeto.</p>
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
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
              Resumo do Projeto
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)', marginTop: 4, maxWidth: 720 }}>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
            <div key={kv.label} className="rounded-lg p-3 border" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kv.label}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--ink-1)', fontWeight: 600, marginTop: 3 }}>{kv.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div ref={detailRef} />
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
            Detalhamento do Monitoramento
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 2 }}>
            {project.goals.length} metas · {allActivities.length} atividades · {totalProgress}% concluído
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            {(['A iniciar', 'Em andamento', 'Concluído'] as ActivityStatus[]).map(s => {
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
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
            >
              {/* Goal header */}
              <button
                onClick={() => toggleGoal(goal.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-blue-50"
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
                  <Target size={12} color="var(--brand)" />
                </div>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink-1)', flex: 1 }}>
                  {goal.name}
                </span>
                <div className="flex items-center gap-3 mr-2">
                  <div className="flex items-center gap-2 w-28">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--brand-soft)' }}>
                      <div className="h-full rounded-full" style={{ width: `${goalPct}%`, background: 'var(--brand)' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--brand)', fontWeight: 600 }}>
                      {goalPct}%
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{goalActs.length} atividades</span>
                </div>
                {isGoalExpanded ? <ChevronDown size={14} color="var(--ink-5)" /> : <ChevronRight size={14} color="var(--ink-5)" />}
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
                        style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}
                      >
                        {/* Deliverable header */}
                        <button
                          onClick={() => toggleDeliverable(deliverable.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent"
                        >
                          <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--success-soft)' }}>
                            <Package size={11} color="var(--success)" />
                          </div>
                          <div className="flex-1">
                            <div style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--ink-2)' }}>{deliverable.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginTop: 1 }}>
                              Resultado esperado: {deliverable.expectedResult}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mr-2">
                            <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{delActs.length} atividades</span>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 600 }}>{delPct}%</span>
                          </div>
                          {isDelExpanded ? <ChevronDown size={13} color="var(--ink-5)" /> : <ChevronRight size={13} color="var(--ink-5)" />}
                        </button>

                        {isDelExpanded && (
                          <div className="border-t" style={{ borderColor: 'var(--border)' }}>
                            <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr style={{ background: 'var(--surface-1)' }}>
                                  {['Atividade', 'Responsável', 'Data Prevista', 'Início', 'Conclusão', 'Progresso', 'Status', 'Obs'].map(h => (
                                    <th
                                      key={h}
                                      className="px-3 py-2 text-left"
                                      style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}
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
                                          <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)', fontWeight: 500 }}>
                                            {activity.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{activity.responsible}</span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.73rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                                          {activity.plannedDate}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.73rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                                          {activity.startDate ?? '—'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.73rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                                          {activity.conclusionDate ?? '—'}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 w-28">
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--line-1)' }}>
                                            <div
                                              className="h-full rounded-full"
                                              style={{ width: `${activity.progress}%`, background: sCfg.dot }}
                                            />
                                          </div>
                                          <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-4)', width: 28, textAlign: 'right' }}>
                                            {activity.progress}%
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <select
                                          value={activity.status}
                                          onChange={(e) => {
                                            updateActivityStatus(project.id, activity.id, e.target.value as ActivityStatus);
                                            record('alterar status de atividade', `${activity.name}: ${activity.status} → ${e.target.value}`);
                                            toast.success('Status atualizado.');
                                          }}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap border-0 outline-none cursor-pointer"
                                          style={{ color: sCfg.color, background: sCfg.bg }}
                                        >
                                          {(['A iniciar', 'Em andamento', 'Concluído'] as ActivityStatus[]).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-3 py-2.5">
                                        <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
                                          {activity.observations || '—'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            </div>
                            <div className="p-3">
                              <button
                                onClick={() => toast.info("Adição de atividades: será liberada na aba Cadastro.")}
                                className="flex items-center gap-1.5 text-[12px]"
                                style={{ color: 'var(--brand)' }}
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
