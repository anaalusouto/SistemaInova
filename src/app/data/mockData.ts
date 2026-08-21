export type ProjectStatus = 'Em andamento' | 'Concluído' | 'Atrasado' | 'Não iniciado' | 'Suspenso';
export type RiskLevel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico' | '—';
export type ActivityStatus = 'Não iniciado' | 'Em andamento' | 'Concluído' | 'Atrasado';
export type ApprovalStatus = 'Aprovado' | 'Pendente' | 'Reprovado';
export type ChangeType = 'Escopo' | 'Prazo' | 'Financeiro' | 'Equipe' | 'Técnico';
export type RiskStatus = 'Aberto' | 'Em mitigação' | 'Monitorando' | 'Encerrado';

export interface Activity {
  id: number;
  name: string;
  responsible: string;
  plannedDate: string;
  startDate: string | null;
  conclusionDate: string | null;
  progress: number;
  status: ActivityStatus;
  observations: string;
}

export interface Deliverable {
  id: number;
  name: string;
  expectedResult: string;
  activities: Activity[];
}

export interface Goal {
  id: number;
  name: string;
  deliverables: Deliverable[];
}

export type BudgetCategory =
  | 'Despesas com pessoal'
  | 'Serviços de terceiros'
  | 'Materiais de consumo'
  | 'Material permanente/equipamentos'
  | 'Custos administrativos';

export const BUDGET_CATEGORIES: BudgetCategory[] = [
  'Despesas com pessoal',
  'Serviços de terceiros',
  'Materiais de consumo',
  'Material permanente/equipamentos',
  'Custos administrativos',
];

/** Valor executado: Sim = igual ao previsto, Não = nada executado, Parcial = valor digitado. */
export type ExecutedFlag = 'Não' | 'Sim' | 'Parcial';

export type AccountabilityStatus =
  | 'Não enviado'
  | 'Enviado'
  | 'Aprovado pela FAS'
  | 'Devolvido para ajuste'
  | 'Reprovado';

export const ACCOUNTABILITY_STATUSES: AccountabilityStatus[] = [
  'Não enviado', 'Enviado', 'Aprovado pela FAS', 'Devolvido para ajuste', 'Reprovado',
];

export type ChangeRecord =
  | 'Conforme planejado'
  | 'Alterado parcialmente'
  | 'Alterado totalmente'
  | 'Novo item';

export const CHANGE_RECORDS: ChangeRecord[] = [
  'Conforme planejado', 'Alterado parcialmente', 'Alterado totalmente', 'Novo item',
];

export interface FinancialItem {
  id: number;
  meta: string;               // Ex: "Meta 1"
  category: string;           // BudgetCategory (string p/ retrocompat)
  relatedGoal: string;        // legado — mantido p/ compatibilidade
  item: string;               // Descrição
  qtd: number;                // Qtd.
  unidade: string;            // Unidade (ex: diária, mês, unidade)
  qtdUnidades: number;        // Qtd. de Unidades
  valorUnitario: number;      // Valor Unitário (R$)
  plannedValue: number;       // = qtd × qtdUnidades × valorUnitario
  executedValue: number;
  date: string;
  supplier: string;
  document: string;
  /** Foi executado? Sim / Não / Parcial */
  executedFlag?: ExecutedFlag;
  /** Status da prestação de contas */
  accountability?: AccountabilityStatus;
  /** Registro de alterações da linha */
  changeRecord?: ChangeRecord;
}


export type ContrapartidaTipo = 'Financeira' | 'Econômica';

export interface ContrapartidaItem {
  id: number;
  meta: string;
  descricao: string;
  tipo: ContrapartidaTipo;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
}

export type ChangeNature = 'Radical' | 'Adaptação' | 'Exclusão';

export interface Risk {
  id: number;
  description: string;
  category: string;
  probability: number;
  impact: number;
  severity: number;
  responseStrategy: string;
  responsible: string;
  status: RiskStatus;
  /** Meta (Goal) à qual o risco está vinculado — obrigatório nos novos registros. */
  goalId?: number;
  /** Etapa da meta em que o risco foi identificado. */
  stage?: string;
  /** Especificação/métrica da etapa (números e resultados esperados). */
  spec?: string;
}

export interface Change {
  id: number;
  description: string;
  type: ChangeType;
  date: string;
  justification: string;
  approval: ApprovalStatus;
  responsible: string;
  /** Meta (Goal) à qual a mudança está vinculada — obrigatório nos novos registros. */
  goalId?: number;
  /** Natureza da mudança em relação à meta. */
  nature?: ChangeNature;
}

export interface Evidence {
  id: number;
  name: string;
  type: 'PDF' | 'Imagem' | 'Vídeo' | 'Link' | 'Documento';
  relatedActivity: string;
  uploadDate: string;
  size: string;
}

export interface Project {
  id: number;
  name: string;
  code: string;
  coordinator: string;
  team: string[];
  financier: string;
  objective: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  budgetApproved: number;
  budgetExecuted: number;
  riskLevel: RiskLevel;
  goals: Goal[];
  financialItems: FinancialItem[];
  contrapartidas: ContrapartidaItem[];
  risks: Risk[];
  changes: Change[];
  evidences: Evidence[];
}

// -----------------------------------------------------------------------------
// Dados reais extraídos da "Planilha de Acompanhamento de Portfólio"
// (Cadastro / Monitoramento / Riscos) — 20 Planos de Trabalho.
// -----------------------------------------------------------------------------

export const projects: Project[] = [
  {
    id: 1,
    name: 'Farinha Tauari Premium: Agroindústria Inovadora e Empoderamento de Mulheres Rurais',
    code: 'PT-2026-001',
    coordinator: 'Ideane do Socorro de Freitas Rosa',
    team: [],
    financier: 'ATRT — Associação de Trabalhadores Rurais de Tauari',
    objective:
      'Implantar uma agroindústria de farinha em Tauari (Capanema/PA), capacitando 20 mulheres rurais e obtendo certificação ADEPARÁ.',
    startDate: '01/2026',
    endDate: '12/2026',
    status: 'Não iniciado',
    progress: 0,
    budgetApproved: 164285.71,
    budgetExecuted: 0,
    riskLevel: 'Médio',
    goals: [
      {
        id: 1,
        name: '1. Infraestrutura',
        deliverables: [
          {
            id: 1,
            name: '1.1–1.3 Construção, adequação elétrica/hidráulica, pintura e acabamento',
            expectedResult: '1 agroindústria construída e adequada às normas da ADEPARÁ',
            activities: [
              { id: 1, name: 'Construção civil da agroindústria', responsible: 'ATRT', plannedDate: '30/11/2026', startDate: null, conclusionDate: null, progress: 50, status: 'Atrasado', observations: '' },
            ],
          },
        ],
      },
      {
        id: 2,
        name: '2. Equipamentos',
        deliverables: [
          {
            id: 2,
            name: '2.1–2.3 Aquisição/instalação de forno, prensa, descascador, balança, seladora, freezers, mesas inox',
            expectedResult: '1 agroindústria equipada com 7 equipamentos essenciais',
            activities: [
              { id: 2, name: 'Aquisição e instalação de equipamentos', responsible: 'ATRT', plannedDate: '30/06/2026', startDate: null, conclusionDate: null, progress: 100, status: 'Concluído', observations: '' },
            ],
          },
        ],
      },
      {
        id: 3,
        name: '3. Capacitações',
        deliverables: [
          {
            id: 3,
            name: '3.1–3.2 Realização de 4 cursos (boas práticas de fabricação e gestão de negócios)',
            expectedResult: '20 mulheres capacitadas em 4 cursos (160h)',
            activities: [
              { id: 3, name: 'Cursos de BPF e gestão de negócios', responsible: 'ATRT', plannedDate: '30/11/2026', startDate: null, conclusionDate: null, progress: 50, status: 'Atrasado', observations: '' },
            ],
          },
        ],
      },
      {
        id: 4,
        name: '4. Certificação',
        deliverables: [
          {
            id: 4,
            name: '4.1 Consultoria especializada para obtenção do certificado ADEPARÁ',
            expectedResult: 'Certificação sanitária emitida pela ADEPARÁ',
            activities: [
              { id: 4, name: 'Consultoria e certificação', responsible: 'ATRT', plannedDate: '05/03/2027', startDate: null, conclusionDate: null, progress: 0, status: 'Não iniciado', observations: '' },
            ],
          },
        ],
      },
      {
        id: 5,
        name: '5. Serviço de terceiros',
        deliverables: [
          {
            id: 5,
            name: '5.1 Serviços contábeis, prestação de contas e taxas bancárias',
            expectedResult: 'Prestação de contas e consultorias realizadas',
            activities: [
              { id: 5, name: 'Serviços contábeis e bancários', responsible: 'ATRT', plannedDate: '05/03/2027', startDate: null, conclusionDate: null, progress: 0, status: 'Não iniciado', observations: '' },
            ],
          },
        ],
      },
    ],
    financialItems: [],
    contrapartidas: [],
    risks: [
      {
        id: 1,
        description: 'Falta de familiaridade com softwares de gestão (Project etc.)',
        category: 'Técnico',
        probability: 3,
        impact: 3,
        severity: 9,
        responseStrategy: 'Assumir — capacitar equipe conforme necessidade.',
        responsible: 'Coordenação',
        status: 'Monitorando',
      },
    ],
    changes: [],
    evidences: [],
  },
  {
    id: 2,
    name: 'Produção sustentável e inclusão comunitária com quintais agroecológicos e apicultura no Nordeste Paraense',
    code: 'PT-2026-002',
    coordinator: 'Mariele Kate Alves Monteiro',
    team: [],
    financier: 'ADESC/PA — Associação de Desenvolvimento Comunitário de Santa Maria do Pará',
    objective:
      'Implantar quintais agroecológicos em Santa Maria do Pará e apicultura em Maracanã, com capacitação de famílias e insumos.',
    startDate: '01/2026',
    endDate: '12/2026',
    status: 'Não iniciado',
    progress: 0,
    budgetApproved: 164285.71,
    budgetExecuted: 0,
    riskLevel: 'Alto',
    goals: [
      {
        id: 1,
        name: '1. Contratação equipe central',
        deliverables: [
          {
            id: 1,
            name: '1.1–1.5 Coordenação, gestão financeira, monitoras, relatoria, social media',
            expectedResult: '5 contratos assinados (12 meses)',
            activities: [
              { id: 1, name: 'Contratação da equipe central', responsible: 'ADESC/PA', plannedDate: '05/03/2027', startDate: null, conclusionDate: null, progress: 0, status: 'Não iniciado', observations: '' },
            ],
          },
        ],
      },
      {
        id: 2,
        name: '2. Aquisição de equipamentos e insumos',
        deliverables: [
          {
            id: 2,
            name: '2.1–2.4 Kits apícolas, kits ferramentas, kits mudas/sementes, custos operacionais',
            expectedResult: '4 kits apícolas + 8 kits agrícolas + 8 kits mudas + custeio mensal',
            activities: [
              { id: 2, name: 'Aquisição de equipamentos e insumos', responsible: 'ADESC/PA', plannedDate: '30/03/2027', startDate: null, conclusionDate: null, progress: 0, status: 'Não iniciado', observations: '' },
            ],
          },
        ],
      },
      {
        id: 3,
        name: '3. Quintais agroecológicos (Santa Maria)',
        deliverables: [
          {
            id: 3,
            name: '3.1–3.4 Seleção das famílias, oficinas de manejo agroecológico, implantação',
            expectedResult: '8 famílias capacitadas e 8 quintais implantados e produtivos',
            activities: [
              { id: 3, name: 'Implantação dos quintais agroecológicos', responsible: 'ADESC/PA', plannedDate: '30/05/2026', startDate: null, conclusionDate: null, progress: 100, status: 'Concluído', observations: '' },
            ],
          },
        ],
      },
      {
        id: 4,
        name: '4. Apicultura (Maracanã)',
        deliverables: [
          {
            id: 4,
            name: '4.1–4.4 Seleção das famílias, oficinas de manejo apícola, instalação de colmeias',
            expectedResult: '8 famílias capacitadas e 8 colmeias instaladas e produtivas',
            activities: [
              { id: 4, name: 'Implantação da apicultura', responsible: 'ADESC/PA', plannedDate: '05/01/2027', startDate: null, conclusionDate: null, progress: 80, status: 'Em andamento', observations: '' },
            ],
          },
        ],
      },
      {
        id: 5,
        name: '5. Biodigestor / Balde Agroecológico',
        deliverables: [
          {
            id: 5,
            name: '5.1–5.2 Aquisição de 100 baldes de 20L e 100 recipientes de 5L',
            expectedResult: '100 baldes e 100 recipientes distribuídos e em uso',
            activities: [
              { id: 5, name: 'Distribuição dos baldes agroecológicos', responsible: 'ADESC/PA', plannedDate: '31/12/2026', startDate: null, conclusionDate: null, progress: 60, status: 'Em andamento', observations: '' },
            ],
          },
        ],
      },
      {
        id: 6,
        name: '6. Acompanhamento e avaliação',
        deliverables: [
          {
            id: 6,
            name: '6.1 Relatoria (parciais nos meses 3, 6, 9 e final no mês 12)',
            expectedResult: '4 relatórios produzidos',
            activities: [
              { id: 6, name: 'Produção de relatórios de acompanhamento', responsible: 'ADESC/PA', plannedDate: '31/12/2026', startDate: null, conclusionDate: null, progress: 0, status: 'Não iniciado', observations: '' },
            ],
          },
        ],
      },
    ],
    financialItems: [],
    contrapartidas: [],
    risks: [
      {
        id: 1,
        description: 'Risco operacional na execução das atividades (código 12)',
        category: 'Operacional',
        probability: 4,
        impact: 3,
        severity: 12,
        responseStrategy: 'Mitigar — reforçar monitoramento mensal.',
        responsible: 'Coordenação',
        status: 'Em mitigação',
      },
      {
        id: 2,
        description: 'Risco crítico externo (código 15)',
        category: 'Externo',
        probability: 5,
        impact: 3,
        severity: 15,
        responseStrategy: 'Transferir/mitigar — plano de contingência.',
        responsible: 'Coordenação',
        status: 'Aberto',
      },
    ],
    changes: [],
    evidences: [],
  },
];

// -----------------------------------------------------------------------------
// Projeto MALUNGU — Planilha Orçamentária (Anexo XX)
// Floresta viva e negócios quilombolas sustentáveis
// -----------------------------------------------------------------------------

type BudgetSeed = [string, string, string, number, string, number, number];
// [meta, categoria, descrição, qtd, unidade, qtdUnidades, valorUnitario]

const MALUNGU_BUDGET: BudgetSeed[] = [
  // META 1
  ['Meta 1', 'Despesas com pessoal', 'Oficineiro (responsável pelas formações e capacitações)', 1, 'Pessoas', 9, 1000],
  ['Meta 1', 'Serviços de terceiros', 'Elaboração de projeto básico', 1, 'Contrato', 1, 5000],
  ['Meta 1', 'Serviços de terceiros', 'Construtora', 1, 'Contrato', 1, 35000],
  // META 2
  ['Meta 2', 'Materiais de consumo', 'Tijolo 09x19x29', 1, 'milheiro', 6, 1830],
  ['Meta 2', 'Materiais de consumo', 'Tijolo 09x14x29', 1, 'milheiro', 4, 75],
  ['Meta 2', 'Material permanente/equipamentos', 'Ferro 5/16 - 6m', 1, 'unidade', 10, 82.6],
  ['Meta 2', 'Material permanente/equipamentos', 'Ferro estribo - 6m', 1, 'unidade', 5, 16.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Arame recozido', 1, 'KG', 10, 27.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Cimento 50 kg', 1, 'unidade', 150, 48.5],
  ['Meta 2', 'Material permanente/equipamentos', 'Areia para construção', 1, 'm3', 30, 60],
  ['Meta 2', 'Material permanente/equipamentos', 'Seixo', 1, 'm3', 4, 230],
  ['Meta 2', 'Material permanente/equipamentos', 'Telha fibrocimento 4mm (2,4x0,5)', 1, 'unidade', 150, 28],
  ['Meta 2', 'Material permanente/equipamentos', 'Peças 60cm x 12cm - 10m', 1, 'unidade', 6, 360],
  ['Meta 2', 'Material permanente/equipamentos', 'Pernamanca 5m', 1, 'dúzia', 6, 320],
  ['Meta 2', 'Material permanente/equipamentos', 'Ripão 3cm x 5cm - 4m', 1, 'dúzia', 12, 132],
  ['Meta 2', 'Material permanente/equipamentos', 'Tábua para laje', 1, 'dúzia', 5, 120],
  ['Meta 2', 'Material permanente/equipamentos', 'Prego 3x9', 1, 'KG', 10, 24],
  ['Meta 2', 'Material permanente/equipamentos', 'Prego para telha', 1, 'KG', 12, 16],
  ['Meta 2', 'Material permanente/equipamentos', 'Prego 10x10', 1, 'KG', 6, 42],
  ['Meta 2', 'Material permanente/equipamentos', 'Pregos para tábua', 1, 'KG', 6, 28],
  ['Meta 2', 'Material permanente/equipamentos', 'Forro PVC', 1, 'm2', 80, 36],
  ['Meta 2', 'Material permanente/equipamentos', 'Roda ferro', 1, 'unidade', 12, 39],
  ['Meta 2', 'Material permanente/equipamentos', 'Portas de alumínio 0,8x2,20', 1, 'unidade', 8, 695],
  ['Meta 2', 'Material permanente/equipamentos', 'Janelas 1x1', 1, 'unidade', 8, 225],
  ['Meta 2', 'Material permanente/equipamentos', 'Pia de cozinha inox 1,20m', 1, 'unidade', 2, 295],
  ['Meta 2', 'Material permanente/equipamentos', 'Pia lavatório', 1, 'unidade', 2, 299],
  ['Meta 2', 'Material permanente/equipamentos', 'Ducha higiênica', 1, 'unidade', 2, 110],
  ['Meta 2', 'Material permanente/equipamentos', 'Torneiras', 1, 'unidade', 4, 49.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Cano esgoto 100mm', 1, 'unidade', 10, 120],
  ['Meta 2', 'Material permanente/equipamentos', 'Cano esgoto 40mm', 1, 'unidade', 10, 68],
  ['Meta 2', 'Material permanente/equipamentos', 'Cano água 50', 1, 'unidade', 1, 115],
  ['Meta 2', 'Material permanente/equipamentos', 'Cano água 25', 1, 'unidade', 10, 29],
  ['Meta 2', 'Material permanente/equipamentos', 'Redução 50-25', 1, 'unidade', 2, 6.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Ralo 40 cm', 1, 'unidade', 8, 14.5],
  ['Meta 2', 'Material permanente/equipamentos', 'Joelhos 40cm', 1, 'unidade', 15, 2.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Sifão simples', 1, 'unidade', 4, 9.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Joelho 25', 1, 'unidade', 15, 1.3],
  ['Meta 2', 'Material permanente/equipamentos', 'Caixa d\'água 310 litros', 1, 'unidade', 3, 360],
  ['Meta 2', 'Material permanente/equipamentos', 'Caixa d\'água 1000 litros', 1, 'unidade', 1, 590.5],
  ['Meta 2', 'Material permanente/equipamentos', 'Caixas elétricas', 1, 'unidade', 15, 2.5],
  ['Meta 2', 'Material permanente/equipamentos', 'Eletroduto 1', 1, 'M', 100, 2.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Tomada com interruptor', 1, 'unidade', 15, 25],
  ['Meta 2', 'Material permanente/equipamentos', 'Cabo 10mm', 1, 'M', 100, 14],
  ['Meta 2', 'Material permanente/equipamentos', 'Cabo 2,5', 1, 'M', 200, 3.5],
  ['Meta 2', 'Material permanente/equipamentos', 'Cabo 1,5', 1, 'M', 100, 1.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Plafon', 1, 'unidade', 15, 7.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Lâmpada 40w', 1, 'unidade', 15, 39.9],
  ['Meta 2', 'Material permanente/equipamentos', 'Padrão bifásico', 1, 'unidade', 1, 210],
  ['Meta 2', 'Material permanente/equipamentos', 'Massa acrílica 20L', 1, 'Balde', 5, 163],
  ['Meta 2', 'Material permanente/equipamentos', 'Massa corrida PVA', 1, 'Balde', 10, 79],
  ['Meta 2', 'Material permanente/equipamentos', 'Selador de parede 20L', 1, 'Balde', 5, 96.5],
  ['Meta 2', 'Material permanente/equipamentos', 'Tinta base d\'água branca', 1, 'Balde', 5, 178],
  ['Meta 2', 'Material permanente/equipamentos', 'Vaso sanitário acoplado', 1, 'unidade', 1, 680],
  ['Meta 2', 'Material permanente/equipamentos', 'Pia para banheiro', 1, 'unidade', 1, 320],
  ['Meta 2', 'Material permanente/equipamentos', 'Kit banheiro', 1, 'unidade', 1, 89],
  ['Meta 2', 'Material permanente/equipamentos', 'Tinta epóxi 3,6L', 1, 'Galão', 10, 173],
  // META 3
  ['Meta 3', 'Material permanente/equipamentos', 'Freezer horizontal 417L bivolt', 1, 'unidade', 5, 4325],
  ['Meta 3', 'Material permanente/equipamentos', 'Seladora manual 20 cm bivolt', 1, 'unidade', 5, 199.5],
  ['Meta 3', 'Material permanente/equipamentos', 'Despolpadeira de frutas 20 litros bivolt', 1, 'unidade', 2, 3850],
  ['Meta 3', 'Material permanente/equipamentos', 'Mesa inox 304 – 0,53m x 1,2m', 2, 'unidade', 1, 856.5],
  ['Meta 3', 'Material permanente/equipamentos', 'Balança digital', 4, 'unidade', 1, 600],
  ['Meta 3', 'Material permanente/equipamentos', 'Liquidificador industrial baixa rotação 25L bivolt', 1, 'unidade', 2, 3225],
  ['Meta 3', 'Material permanente/equipamentos', 'Roçadeira lateral 43cc', 1, 'unidade', 2, 1889],
  // META 4
  ['Meta 4', 'Materiais de consumo', 'Embalagens para polpas personalizadas – 500g', 1, 'Milheiro', 20, 185],
  ['Meta 4', 'Materiais de consumo', 'Embalagens para polpas personalizadas – 1kg', 1, 'Milheiro', 20, 145],
  ['Meta 4', 'Materiais de consumo', 'Luvas látex', 1, 'Dúzia', 5, 31.9],
  ['Meta 4', 'Materiais de consumo', 'Toucas descartáveis', 1, 'Caixa', 5, 24],
  ['Meta 4', 'Materiais de consumo', 'Uniformes da agroindústria (calça branca, camisa branca, botas e aventais)', 1, 'Kit', 8, 680],
  ['Meta 4', 'Materiais de consumo', 'EPI – botas brancas (agroindústria e apanhadores de açaí)', 1, 'Par', 50, 58],
  ['Meta 4', 'Materiais de consumo', 'Alimentação (capacitações e reuniões)', 1, 'Dias', 10, 1500],
  // META 5
  ['Meta 5', 'Custos administrativos', 'Taxas bancárias', 1, 'Mês', 12, 120],
  ['Meta 5', 'Custos administrativos', 'Diárias de viagem', 1, 'Diária', 20, 250],
  ['Meta 5', 'Custos administrativos', 'Combustível', 1, 'Litros', 5, 500],
];

const buildMalunguItems = (): FinancialItem[] =>
  MALUNGU_BUDGET.map(([meta, cat, desc, qtd, un, qtdUn, vu], idx) => ({
    id: idx + 1,
    meta,
    category: cat,
    relatedGoal: meta,
    item: desc,
    qtd,
    unidade: un,
    qtdUnidades: qtdUn,
    valorUnitario: vu,
    plannedValue: qtd * qtdUn * vu,
    executedValue: 0,
    date: '',
    supplier: '',
    document: '',
  }));

const malunguItems = buildMalunguItems();
const malunguBudgetTotal = malunguItems.reduce((a, i) => a + i.plannedValue, 0);

projects.push({
  id: 3,
  name: 'Floresta viva e negócios quilombolas sustentáveis: sociobioeconomia de base comunitária na Amazônia paraense',
  code: 'PT-2026-003',
  coordinator: 'MALUNGU — Coordenação Estadual',
  team: [],
  financier: 'Coord. das Associações das Comunidades Reman. de Quilombos do Pará - MALUNGU',
  objective:
    'Fortalecer a sociobioeconomia quilombola no nordeste paraense com agroindústria, capacitações e apoio produtivo. CNPJ: 06.968.130/0001-07.',
  startDate: '01/2026',
  endDate: '12/2026',
  status: 'Não iniciado',
  progress: 0,
  budgetApproved: malunguBudgetTotal,
  budgetExecuted: 0,
  riskLevel: 'Médio',
  goals: [],
  financialItems: malunguItems,
  contrapartidas: [
    { id: 1, meta: 'Meta 1', descricao: 'Pagamento de 33% do salário do Coordenador', tipo: 'Financeira', quantidade: 11, unidade: 'Mês', valorUnitario: 1000 },
    { id: 2, meta: 'Meta 2', descricao: 'Cessão de notebook para uso exclusivo no projeto', tipo: 'Financeira', quantidade: 1, unidade: 'Unid.', valorUnitario: 4500 },
    { id: 3, meta: 'Meta 2', descricao: 'Aquisição de material de escritório (resmas, canetas)', tipo: 'Econômica', quantidade: 1, unidade: 'Verba', valorUnitario: 400 },
  ],
  risks: [],
  changes: [],
  evidences: [],
});

// Placeholders (IDs 4–20) para os demais Planos de Trabalho previstos no portfólio.
for (let i = 4; i <= 20; i++) {
  projects.push({
    id: i,
    name: `Plano de Trabalho ${i} — a cadastrar`,
    code: `PT-2026-${String(i).padStart(3, '0')}`,
    coordinator: '—',
    team: [],
    financier: '—',
    objective: 'Cadastro pendente. Preencha os dados desta linha do portfólio.',
    startDate: '01/2026',
    endDate: '12/2026',
    status: 'Não iniciado',
    progress: 0,
    budgetApproved: 164285.71,
    budgetExecuted: 0,
    riskLevel: '—',
    goals: [],
    financialItems: [],
    contrapartidas: [],
    risks: [],
    changes: [],
    evidences: [],
  });
}

// -----------------------------------------------------------------------------
// Derivados usados pelo Dashboard e demais telas
// -----------------------------------------------------------------------------

function computeKpi(list: Project[]) {
  const cadastrados = list.filter(p => p.name && !p.name.includes('a cadastrar'));
  const base = cadastrados.length > 0 ? cadastrados : list;
  return {
    totalProjects: list.length,
    cadastrados: cadastrados.length,
    inProgress: list.filter(p => p.status === 'Em andamento').length,
    concluded: list.filter(p => p.status === 'Concluído').length,
    delayed: list.filter(p => p.status === 'Atrasado').length,
    notStarted: list.filter(p => p.status === 'Não iniciado').length,
    avgProgress: Math.round(base.reduce((a, p) => a + p.progress, 0) / base.length),
    totalBudget: list.reduce((a, p) => a + p.budgetApproved, 0),
    totalExecuted: list.reduce((a, p) => a + p.budgetExecuted, 0),
    criticalRisks: list.reduce((a, p) => a + p.risks.filter(r => r.severity >= 15).length, 0),
    pendingChanges: list.reduce((a, p) => a + p.changes.filter(c => c.approval === 'Pendente').length, 0),
  };
}

export const kpiData = computeKpi(projects);
export function buildKpi(list: Project[]) {
  return computeKpi(list);
}

export const upcomingDeadlines = [
  { project: projects[0].name, milestone: 'Aquisição de equipamentos', date: '30/06/2026', daysLeft: 175, status: 'Não iniciado' },
  { project: projects[1].name, milestone: 'Implantação dos quintais', date: '30/05/2026', daysLeft: 144, status: 'Não iniciado' },
  { project: projects[1].name, milestone: 'Distribuição de baldes agroecológicos', date: '31/12/2026', daysLeft: 359, status: 'Não iniciado' },
  { project: projects[0].name, milestone: 'Encerramento do plano', date: '31/12/2026', daysLeft: 359, status: 'Não iniciado' },
];

export const monthlyFinancial = [
  { month: 'Jan/26', previsto: 27380, executado: 0 },
  { month: 'Fev/26', previsto: 27380, executado: 0 },
  { month: 'Mar/26', previsto: 27380, executado: 0 },
  { month: 'Abr/26', previsto: 27380, executado: 0 },
  { month: 'Mai/26', previsto: 27380, executado: 0 },
  { month: 'Jun/26', previsto: 27380, executado: 0 },
  { month: 'Jul/26', previsto: 27380, executado: 0 },
  { month: 'Ago/26', previsto: 27380, executado: 0 },
  { month: 'Set/26', previsto: 27380, executado: 0 },
];
