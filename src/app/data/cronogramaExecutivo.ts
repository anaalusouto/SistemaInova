// Cronograma Executivo — INOVA SOCIOBIO II
// Fonte: PDF "Cronograma_Inova.pdf" (CESUPA/SEMAS)
// Início das visitas técnicas: 24/08/2026

export type GanttStatus = 'Não iniciado' | 'No prazo' | 'Em andamento' | 'Entregue' | 'Atrasado';

export const ganttStatusColors: Record<GanttStatus, string> = {
  'Não iniciado': '#94A3B8',
  'No prazo': '#0D6E8A',
  'Em andamento': '#F59E0B',
  'Entregue': '#22C55E',
  'Atrasado': '#EF4444',
};

export const ganttStatusProgress: Record<GanttStatus, number> = {
  'Não iniciado': 0,
  'No prazo': 15,
  'Em andamento': 55,
  'Entregue': 100,
  'Atrasado': 30,
};

export interface GanttActivity {
  id: number;
  atividade: string;
  inicio: string; // YYYY-MM-DD
  fim: string;    // YYYY-MM-DD
  responsavel: string;
  status: GanttStatus;
  progress: number; // 0-100
}

export interface GanttEntrega {
  id: number;
  entrega: string;
  inicio: string;
  fim: string;
  responsavel: string;
  status: GanttStatus;
  progress: number;
  atividades: GanttActivity[];
}

export interface GanttBloco {
  id: number;
  bloco: string;
  entregas: GanttEntrega[];
}

const P = (s: GanttStatus, override?: number): number =>
  override ?? ganttStatusProgress[s];

// Helper para reduzir verbosidade
const A = (id: number, atividade: string, inicio: string, fim: string, responsavel: string, status: GanttStatus): GanttActivity =>
  ({ id, atividade, inicio, fim, responsavel, status, progress: P(status) });

export const cronogramaExecutivoSeed: GanttBloco[] = [
  {
    id: 1,
    bloco: '1. Preparação do Diagnóstico',
    entregas: [
      {
        id: 101,
        entrega: 'Avaliação preliminar dos planos de trabalho',
        inicio: '2026-07-16', fim: '2026-07-25', responsavel: 'CESUPA',
        status: 'Em andamento', progress: 55,
        atividades: [
          A(10101, 'Inserir os planos de trabalho no Dashboard de Monitoramento', '2026-07-16', '2026-07-17', 'CESUPA', 'Entregue'),
          A(10102, 'Avaliar os riscos dos planos de trabalho', '2026-07-20', '2026-07-23', 'CESUPA', 'Em andamento'),
          A(10103, 'Classificar o nível de criticidade das iniciativas', '2026-07-23', '2026-07-24', 'CESUPA', 'No prazo'),
          A(10104, 'Atualizar os planos de trabalho das instituições', '2026-07-23', '2026-07-24', 'CESUPA', 'No prazo'),
        ],
      },
    ],
  },
  {
    id: 2,
    bloco: '2. Desenvolvimento e Validação dos Instrumentos',
    entregas: [
      {
        id: 201,
        entrega: 'Questionário validado',
        inicio: '2026-07-15', fim: '2026-08-14', responsavel: 'CESUPA / SEMAS / Especialistas',
        status: 'No prazo', progress: 20,
        atividades: [
          A(20101, 'Elaborar versão-base do questionário', '2026-07-06', '2026-07-10', 'CESUPA', 'Entregue'),
          A(20102, 'Definir metodologia de aplicação', '2026-07-20', '2026-07-28', 'CESUPA', 'No prazo'),
          A(20103, 'Convidar especialistas', '2026-07-22', '2026-07-24', 'CESUPA', 'No prazo'),
          A(20104, 'Realizar validação com especialistas', '2026-08-05', '2026-08-06', 'CESUPA / SEMAS / Especialistas', 'No prazo'),
          A(20105, 'Consolidar contribuições', '2026-08-07', '2026-08-08', 'CESUPA', 'No prazo'),
          A(20106, 'Validar com a SEMAS', '2026-08-10', '2026-08-12', 'SEMAS', 'No prazo'),
        ],
      },
      {
        id: 202,
        entrega: 'Índice de Classificação Organizacional validado',
        inicio: '2026-07-15', fim: '2026-08-14', responsavel: 'CESUPA / SEMAS / Especialistas',
        status: 'No prazo', progress: 20,
        atividades: [
          A(20201, 'Definir referências', '2026-07-06', '2026-07-10', 'CESUPA', 'Entregue'),
          A(20202, 'Definir dimensões', '2026-07-20', '2026-07-24', 'CESUPA', 'No prazo'),
          A(20203, 'Definir indicadores', '2026-07-20', '2026-07-24', 'CESUPA', 'No prazo'),
          A(20204, 'Definir escalas e critérios de avaliação', '2026-07-27', '2026-07-30', 'CESUPA', 'No prazo'),
          A(20205, 'Elaborar versão-base do Índice', '2026-07-27', '2026-07-30', 'CESUPA', 'No prazo'),
          A(20206, 'Convidar especialistas', '2026-07-22', '2026-07-24', 'CESUPA', 'No prazo'),
          A(20207, 'Realizar validação com especialistas', '2026-08-05', '2026-08-06', 'CESUPA / SEMAS / Especialistas', 'No prazo'),
          A(20208, 'Consolidar contribuições', '2026-08-07', '2026-08-08', 'CESUPA', 'No prazo'),
          A(20209, 'Validar com a SEMAS', '2026-08-10', '2026-08-12', 'SEMAS', 'No prazo'),
          A(20210, 'Finalizar versão oficial', '2026-08-13', '2026-08-14', 'CESUPA', 'No prazo'),
        ],
      },
    ],
  },
  {
    id: 3,
    bloco: '3. Estruturação do Sistema de Monitoramento',
    entregas: [
      {
        id: 301,
        entrega: 'Dashboard de Monitoramento – versão inicial',
        inicio: '2026-07-21', fim: '2026-08-19', responsavel: 'CESUPA',
        status: 'No prazo', progress: 15,
        atividades: [
          A(30101, 'Definir arquitetura do sistema de monitoramento', '2026-07-21', '2026-07-23', 'CESUPA', 'No prazo'),
          A(30102, 'Definir estrutura do banco de dados', '2026-07-24', '2026-07-25', 'CESUPA', 'No prazo'),
          A(30103, 'Desenvolver o Dashboard de Monitoramento', '2026-07-28', '2026-08-08', 'CESUPA', 'No prazo'),
          A(30104, 'Realizar testes internos', '2026-08-11', '2026-08-13', 'CESUPA', 'No prazo'),
          A(30105, 'Validar com a SEMAS', '2026-08-14', '2026-08-15', 'SEMAS', 'No prazo'),
          A(30106, 'Finalizar versão inicial do Dashboard', '2026-08-18', '2026-08-19', 'CESUPA', 'No prazo'),
        ],
      },
    ],
  },
  {
    id: 4,
    bloco: '4. Pré-visita e Pactuação',
    entregas: [
      {
        id: 401,
        entrega: 'Instituições alinhadas e cronogramas pactuados',
        inicio: '2026-08-13', fim: '2026-08-21', responsavel: 'CESUPA / Instituições',
        status: 'Não iniciado', progress: 0,
        atividades: [
          A(40101, 'Elaborar apresentação institucional', '2026-07-27', '2026-07-31', 'CESUPA', 'No prazo'),
          A(40102, 'Retomar contato com as instituições e agendar encontros preliminares', '2026-07-27', '2026-07-31', 'CESUPA', 'No prazo'),
          A(40103, 'Realizar primeira reunião de alinhamento', '2026-08-10', '2026-08-21', 'CESUPA', 'Não iniciado'),
          A(40104, 'Pactuar o cronograma de visitas', '2026-08-10', '2026-08-21', 'CESUPA / Instituições', 'Não iniciado'),
          A(40105, 'Atualizar informações cadastrais da instituição', '2026-08-11', '2026-08-21', 'CESUPA / Instituições', 'Não iniciado'),
          A(40106, 'Solicitar documentação preliminar', '2026-08-10', '2026-08-19', 'CESUPA / Instituições', 'Não iniciado'),
          A(40107, 'Identificar necessidades e prioridades da instituição', '2026-08-10', '2026-08-21', 'CESUPA', 'Não iniciado'),
          A(40108, 'Consolidar diagnóstico preliminar', '2026-08-12', '2026-08-21', 'CESUPA', 'Não iniciado'),
        ],
      },
    ],
  },
  {
    id: 5,
    bloco: '5. Planejamento Operacional',
    entregas: [
      {
        id: 501,
        entrega: 'Planos de voo e roteiros de visita finalizados',
        inicio: '2026-08-18', fim: '2026-08-22', responsavel: 'CESUPA / SEMAS',
        status: 'Não iniciado', progress: 0,
        atividades: [
          A(50101, 'Elaborar roteiro individual das visitas', '2026-08-17', '2026-08-21', 'CESUPA', 'Não iniciado'),
          A(50102, 'Definir entrevistados', '2026-08-10', '2026-08-21', 'CESUPA / Instituições', 'Não iniciado'),
          A(50103, 'Definir unidades produtivas', '2026-08-10', '2026-08-21', 'CESUPA / Instituições', 'Não iniciado'),
          A(50104, 'Planejar logística de campo', '2026-08-10', '2026-08-21', 'CESUPA', 'Não iniciado'),
          A(50105, 'Confirmar logística de deslocamento', '2026-08-03', '2026-08-17', 'CESUPA / Instituições', 'No prazo'),
          A(50106, 'Identificar protocolos territoriais aplicáveis', '2026-08-03', '2026-08-17', 'CESUPA / Instituições', 'No prazo'),
          A(50107, 'Elaborar plano de contingência', '2026-08-17', '2026-08-21', 'CESUPA', 'Não iniciado'),
          A(50108, 'Validar plano de voo com a SEMAS', '2026-08-21', '2026-08-21', 'SEMAS', 'Não iniciado'),
          A(50109, 'Finalizar plano de voo', '2026-08-22', '2026-08-22', 'CESUPA', 'Não iniciado'),
        ],
      },
    ],
  },
  {
    id: 6,
    bloco: '6. Capacitação da Equipe',
    entregas: [
      {
        id: 601,
        entrega: 'Equipe de campo capacitada',
        inicio: '2026-08-13', fim: '2026-08-21', responsavel: 'CESUPA',
        status: 'Não iniciado', progress: 0,
        atividades: [
          A(60101, 'Elaborar materiais de apoio', '2026-08-13', '2026-08-14', 'CESUPA', 'Não iniciado'),
          A(60102, 'Realizar alinhamento metodológico', '2026-08-15', '2026-08-15', 'CESUPA', 'Não iniciado'),
          A(60103, 'Realizar simulação da aplicação do questionário', '2026-08-18', '2026-08-18', 'CESUPA', 'Não iniciado'),
          A(60104, 'Realizar simulação das entrevistas', '2026-08-19', '2026-08-19', 'CESUPA', 'Não iniciado'),
          A(60105, 'Realizar simulação dos grupos focais', '2026-08-19', '2026-08-19', 'CESUPA', 'Não iniciado'),
          A(60106, 'Padronizar procedimentos de registro', '2026-08-19', '2026-08-20', 'CESUPA', 'Não iniciado'),
          A(60107, 'Realizar treinamento para utilização do Dashboard', '2026-08-20', '2026-08-21', 'CESUPA', 'Não iniciado'),
          A(60108, 'Alinhar procedimentos de atuação em campo', '2026-08-24', '2026-08-25', 'CESUPA', 'Não iniciado'),
        ],
      },
    ],
  },
  {
    id: 7,
    bloco: '7. Regularização Documental',
    entregas: [
      {
        id: 701,
        entrega: 'Termos e procedimentos documentais concluídos',
        inicio: '2026-07-28', fim: '2026-08-15', responsavel: 'CESUPA / SEMAS',
        status: 'Não iniciado', progress: 0,
        atividades: [
          A(70101, 'Envio dos termos da SEMAS para embasar a criação do termo conjunto', '2026-07-08', '2026-07-24', 'SEMAS', 'No prazo'),
          A(70102, 'Elaborar Termo de Autorização de Uso de Imagem e Dados', '2026-07-29', '2026-08-05', 'CESUPA', 'Não iniciado'),
          A(70103, 'Validar termo com a SEMAS', '2026-08-11', '2026-08-12', 'SEMAS', 'Não iniciado'),
          A(70104, 'Definir procedimento de assinatura', '2026-08-13', '2026-08-13', 'CESUPA', 'Não iniciado'),
          A(70105, 'Definir responsável pelo arquivamento', '2026-08-14', '2026-08-14', 'CESUPA', 'Não iniciado'),
          A(70106, 'Organizar armazenamento dos documentos assinados', '2026-08-15', '2026-08-15', 'CESUPA', 'Não iniciado'),
        ],
      },
    ],
  },
  {
    id: 8,
    bloco: '8. Visitas Técnicas e Diagnóstico',
    entregas: [
      {
        id: 801,
        entrega: 'Execução das visitas técnicas',
        inicio: '2026-08-24', fim: '2026-10-30', responsavel: 'CESUPA',
        status: 'Não iniciado', progress: 0,
        atividades: [
          A(80101, 'Realizar visitas técnicas e aplicar os instrumentos de diagnóstico', '2026-08-24', '2026-10-30', 'CESUPA', 'Não iniciado'),
        ],
      },
    ],
  },
  {
    id: 9,
    bloco: '9. Sistematização, Análise e Devolutivas',
    entregas: [
      {
        id: 901,
        entrega: 'Diagnósticos, planos de fortalecimento e devolutivas',
        inicio: '2026-08-31', fim: '2026-11-06', responsavel: 'CESUPA / Instituições',
        status: 'Não iniciado', progress: 0,
        atividades: [
          A(90101, 'Sistematizar informações, elaborar diagnósticos e realizar devolutivas', '2026-08-31', '2026-11-06', 'CESUPA / Instituições', 'Não iniciado'),
        ],
      },
    ],
  },
  {
    id: 10,
    bloco: '10. Monitoramento, Inteligência e Tomada de Decisão',
    entregas: [
      {
        id: 1001,
        entrega: 'Monitoramento contínuo e apoio à decisão',
        inicio: '2026-08-24', fim: '2026-12-21', responsavel: 'CESUPA / SEMAS',
        status: 'Não iniciado', progress: 0,
        atividades: [
          A(100101, 'Atualizar indicadores, analisar riscos e subsidiar a tomada de decisão', '2026-08-24', '2026-12-21', 'CESUPA / SEMAS', 'Não iniciado'),
        ],
      },
    ],
  },
];
