import type { ProjectExt } from '../store';
import { faixaRisco } from './planoTrabalho';

/** Datas mensais representam o último dia do mês; datas inválidas ficam sem prazo. */
function deadline(value: string): number | null {
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);
  const br = /^(?:(\d{2})\/)?(\d{2})\/(\d{4})$/.exec(value);
  if (!iso && !br) return null;
  const year = Number(iso?.[1] ?? br?.[3]);
  const month = Number(iso?.[2] ?? br?.[2]);
  const day = iso?.[3] ?? br?.[1];
  if (month < 1 || month > 12) return null;
  const date = new Date(Date.UTC(year, month - 1, day ? Number(day) : 1));
  if (!day) date.setUTCMonth(month, 0);
  if (date.getUTCMonth() !== month - 1) return null;
  return date.getTime();
}

export function buildDecisionCharts(projects: ProjectExt[], referenceDate: Date) {
  const organizations = new Map<string, { name: string; previsto: number; executado: number; saldo: number }>();
  const categories = new Map<string, { name: string; baixo: number; medio: number; alto: number; critico: number; semNivel: number }>();
  const deadlines = ['Vencidos', 'Até 30 dias', '31–60 dias', '61–90 dias', 'Após 90 dias', 'Sem prazo']
    .map(name => ({ name, projetos: 0 }));
  const today = Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  for (const p of projects) {
    const name = p.org || p.organizacao?.nome || p.code;
    const row = organizations.get(name) ?? { name, previsto: 0, executado: 0, saldo: 0 };
    row.previsto += p.budgetApproved;
    row.executado += p.budgetExecuted;
    row.saldo = row.previsto - row.executado;
    organizations.set(name, row);
    for (const risk of p.risks) {
      if (risk.status === 'Encerrado') continue;
      const category = risk.category || 'Sem categoria';
      const riskRow = categories.get(category) ?? { name: category, baixo: 0, medio: 0, alto: 0, critico: 0, semNivel: 0 };
      const faixa = faixaRisco(risk.severity);
      const level = faixa === 'Crítico' ? 'critico' : faixa === 'Alto' ? 'alto' : faixa === 'Médio' ? 'medio' : faixa === 'Baixo' ? 'baixo' : 'semNivel';
      riskRow[level] += 1;
      categories.set(category, riskRow);
    }
    if (p.status === 'Concluído') continue;
    const end = deadline(p.endDate);
    const days = end === null ? null : Math.ceil((end - today) / 86400000);
    const bucket = days === null ? 5 : days < 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
    deadlines[bucket].projetos += 1;
  }
  const progress = projects.filter(p => p.budgetApproved > 0).map(p => {
    const financeiro = Math.round(p.budgetExecuted / p.budgetApproved * 100);
    return { name: p.org || p.code, fisico: p.progress, financeiro, diferenca: Math.abs(financeiro - p.progress) };
  }).sort((a, b) => b.diferenca - a.diferenca).slice(0, 8);
  return {
    budgets: [...organizations.values()].sort((a, b) => b.previsto - a.previsto).slice(0, 8),
    progress,
    risks: [...categories.values()].sort((a, b) => (b.alto + b.critico) - (a.alto + a.critico)),
    deadlines,
  };
}
