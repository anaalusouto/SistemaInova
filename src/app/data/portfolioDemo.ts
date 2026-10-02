import type { ProjectExt } from '../store';
import type { ProjectStatus, Risk } from './mockData';
import { faixaRisco } from '../lib/planoTrabalho';

/** Cenário demonstrativo da Visão Geral. Nunca é enviado ao banco. */
export const DEMO_REFERENCE_DATE = '2026-10-02';
const status: ProjectStatus[] = ['Em andamento', 'Atrasado', 'Em andamento', 'Concluído', 'Suspenso', 'Em andamento', 'Atrasado', 'Não iniciado', 'Em andamento', 'Concluído', 'Atrasado', 'Em andamento'];
const progress = [68, 32, 78, 100, 42, 56, 24, 0, 82, 100, 38, 64];
const spending = [0.52, 0.74, 0.61, 0.97, 0.38, 0.47, 0.63, 0, 0.71, 0.94, 0.58, 0.51];
const categories = ['Logístico', 'Financeiro', 'Operacional', 'Ambiental', 'Institucional'];
const monthlyWeights = [6, 7, 9, 10, 12, 13, 12, 10, 8, 6, 4, 3];
const demoOrganizations = [
  { org: 'COOP RIO', name: 'Conservação do pescado', segmento: 'Comunidades tradicionais', budget: 240000 },
  { org: 'ASSOC VERDE', name: 'Agrofloresta comunitária', segmento: 'Agricultura familiar', budget: 320000 },
  { org: 'COOP AÇAÍ', name: 'Beneficiamento do açaí', segmento: 'Agricultura familiar', budget: 480000 },
  { org: 'ASSOC RAÍZES', name: 'Casa de farinha', segmento: 'Comunidades quilombolas', budget: 180000 },
  { org: 'COOP NORTE', name: 'Logística de comercialização', segmento: 'Agricultura familiar', budget: 410000 },
  { org: 'ASSOC FLORESTA', name: 'Manejo sustentável', segmento: 'Comunidades tradicionais', budget: 275000 },
  { org: 'COOP TERRA', name: 'Produção de polpas', segmento: 'Agricultura familiar', budget: 360000 },
  { org: 'ASSOC ARUMÃ', name: 'Artesanato e renda', segmento: 'Comunidades indígenas', budget: 150000 },
  { org: 'COOP SEMENTE', name: 'Viveiro de mudas', segmento: 'Agricultura familiar', budget: 225000 },
  { org: 'ASSOC QUILOMBO', name: 'Horta comunitária', segmento: 'Comunidades quilombolas', budget: 195000 },
  { org: 'COOP ÁGUAS', name: 'Estrutura de armazenamento', segmento: 'Comunidades tradicionais', budget: 520000 },
  { org: 'ASSOC UNIÃO', name: 'Formação e gestão', segmento: 'Agricultura familiar', budget: 165000 },
];

export const portfolioDemo: ProjectExt[] = demoOrganizations.map((p, index) => {
  const budget = p.budget;
  const executed = Math.round(budget * spending[index]);
  let plannedSoFar = 0;
  let executedSoFar = 0;
  const financialItems = monthlyWeights.map((weight, month) => {
    const plannedValue = month === 11 ? budget - plannedSoFar : Math.round(budget * weight / 100);
    const executedValue = month < 8 ? Math.round(executed * weight / 87) : month === 8 ? executed - executedSoFar : 0;
    plannedSoFar += plannedValue;
    executedSoFar += executedValue;
    return {
      id: `demo-finance-${index}-${month}`, meta: 'Meta 1', category: 'Serviços', relatedGoal: '',
      item: 'Execução mensal demonstrativa', qtd: 1, unidade: 'mês', qtdUnidades: 1,
      valorUnitario: plannedValue, plannedValue, executedValue,
      date: `${String(month + 1).padStart(2, '0')}/2026`, supplier: '', document: '',
    };
  });
  const risks: Risk[] = Array.from({ length: 2 + index % 4 }, (_, r) => {
    const probability = 2 + (index + r) % 4;
    const impact = 2 + (index * 2 + r) % 4;
    return {
      id: `demo-risk-${index}-${r}`, title: 'Risco demonstrativo', description: 'Ocorrência simulada para análise do portfólio.',
      category: categories[(index + r) % categories.length], probability, impact, severity: probability * impact,
      responseStrategy: 'Acompanhamento e plano de resposta', responsible: 'Equipe regional',
      status: r === 0 && index % 3 === 0 ? 'Encerrado' : r % 2 === 0 ? 'Aberto' : 'Em mitigação',
    };
  });
  const highest = Math.max(...risks.filter(r => r.status !== 'Encerrado').map(r => r.severity), 0);
  return {
    id: -index - 1, name: p.name, org: p.org, segmento: p.segmento, code: `DEMO-${index + 1}`,
    coordinator: 'Equipe regional', team: [], financier: 'Programa demonstrativo', objective: 'Cenário simulado para análise gerencial.',
    status: status[index], progress: progress[index],
    startDate: '2026-01-01', endDate: `2026-${String(8 + index % 5).padStart(2, '0')}-28`,
    budgetApproved: budget, budgetExecuted: executed, financialItems, risks,
    riskLevel: faixaRisco(highest),
    goals: [], changes: [], evidences: [], contrapartidas: [], organizacao: null,
  };
});
