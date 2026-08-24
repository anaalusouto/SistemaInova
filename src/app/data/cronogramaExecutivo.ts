// Cronograma Executivo — INOVA SOCIOBIO II
// Fonte: planilha "Cronograma_Macro_Inova_Sociobio_II" (CESUPA/SEMAS)
// Estrutura: Bloco > Entrega > Atividade. Acompanhamento é feito por projeto.

import type { InternalStatus } from './controleInterno';

export type GanttStatus = InternalStatus;

export const ganttStatusColors: Record<GanttStatus, string> = {
  'Não iniciado': '#94A3B8',
  'Validação pendente': '#7C3AED',
  'No prazo': '#0D6E8A',
  'Entregue': '#22C55E',
  'Atrasado': '#EF4444',
};

export interface GanttActivity {
  id: number;
  atividade: string;
  /** Atividade macro à qual esta subatividade pertence (opcional). */
  grupo?: string;
  descricao?: string;
  inicio: string; // YYYY-MM-DD
  fim: string;    // YYYY-MM-DD
  responsavel?: string;
  aprovador?: string;
  status: GanttStatus;
  observacao?: string;
  comentario?: string;
  /** Progresso manual — quando ausente, é calculado pela validação por projeto. */
  progress?: number;
  /** Projeto/comunidade ao qual esta atividade (ou subatividade) está vinculada. */
  projetoId?: number | null;
  /** Subatividades — mesma estrutura, também podem ter vínculo próprio. */
  subatividades?: GanttActivity[];
}


export interface GanttEntrega {
  id: number;
  entrega: string;
  inicio: string;
  fim: string;
  responsavel: string;
  status: GanttStatus;
  comentario?: string;
  progress?: number;
  atividades: GanttActivity[];
}

export interface GanttBloco {
  id: number;
  bloco: string;
  entregas: GanttEntrega[];
}

export const cronogramaExecutivoSeed: GanttBloco[] = [
  {
    "id": 1,
    "bloco": "1. Preparação do Diagnóstico",
    "entregas": [
      {
        "id": 101,
        "entrega": "Avaliação preliminar dos planos de trabalho",
        "inicio": "2026-07-16",
        "fim": "2026-08-27",
        "responsavel": "João Marcelo",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1001,
            "atividade": "Inserir os planos de trabalho na Plataforma",
            "inicio": "2026-07-16",
            "fim": "2026-07-17",
            "responsavel": "João Marcelo",
            "status": "Entregue"
          },
          {
            "id": 1002,
            "atividade": "Solicitar planos de trabalho enviados para FAS",
            "inicio": "2026-08-06",
            "fim": "2026-08-10",
            "responsavel": "Suze",
            "status": "No prazo"
          },
          {
            "id": 1003,
            "atividade": "Elaborar matriz de avaliação dos planos de trabalho",
            "descricao": "Matriz que oriente a equipe técnica na avaliação dos planos de trabalhos, a fim de gerar avaliações baseadas no mesmo modelo",
            "inicio": "2026-08-06",
            "fim": "2026-08-10",
            "responsavel": "Gabi",
            "status": "Não iniciado"
          },
          {
            "id": 1004,
            "atividade": "Elencar os riscos do plano de trabalho",
            "grupo": "Análise de riscos das metas e atividades dos planos de trabalho",
            "inicio": "2026-07-20",
            "fim": "2026-08-13",
            "responsavel": "Equipe",
            "status": "Entregue"
          },
          {
            "id": 1005,
            "atividade": "Avaliar os riscos dos planos de trabalho",
            "grupo": "Análise de riscos das metas e atividades dos planos de trabalho",
            "inicio": "2026-07-20",
            "fim": "2026-08-13",
            "responsavel": "Equipe",
            "status": "Entregue"
          },
          {
            "id": 1006,
            "atividade": "Elaborar estratégias de gerenciamento dos riscos",
            "grupo": "Análise de riscos das metas e atividades dos planos de trabalho",
            "inicio": "2026-07-20",
            "fim": "2026-08-13",
            "responsavel": "Equipe",
            "status": "Entregue"
          },
          {
            "id": 1007,
            "atividade": "Classificar o nível de criticidade das metas dos planos de trabalho",
            "grupo": "Análise de riscos das metas e atividades dos planos de trabalho",
            "descricao": "A partir das metas de cada projeto, classificar o quão críticas são a partir de uma matriz de risco",
            "inicio": "2026-07-23",
            "fim": "2026-08-13",
            "responsavel": "Equipe",
            "status": "Entregue"
          },
          {
            "id": 1008,
            "atividade": "Avaliar demais parâmetros do plano de trabalho",
            "descricao": "Para além da análise de riscos, quais são as avaliações dos planos de trabalho que devem ser feitas, como governança, equipe, financeiro",
            "inicio": "2026-08-24",
            "fim": "2026-08-27",
            "status": "No prazo"
          },
          {
            "id": 1009,
            "atividade": "Verificar se as instituições atualizaram os planos de trabalho (reunião idv)",
            "inicio": "2026-07-23",
            "fim": "2026-08-14",
            "responsavel": "Equipe",
            "status": "Atrasado"
          },
          {
            "id": 1010,
            "atividade": "Adicionar análises de risco do plano de trabalho à aba no Lovable",
            "inicio": "2026-08-06",
            "fim": "2026-08-14",
            "responsavel": "Equipe + João Marcelo",
            "status": "Entregue"
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "bloco": "2. Desenvolvimento e Validação dos Instrumentos",
    "entregas": [
      {
        "id": 201,
        "entrega": "Questionário",
        "inicio": "2026-07-06",
        "fim": "2026-08-25",
        "responsavel": "João Marcelo",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1011,
            "atividade": "Elaborar versão-base do questionário",
            "inicio": "2026-07-06",
            "fim": "2026-07-10",
            "responsavel": "João Marcelo",
            "status": "Entregue"
          },
          {
            "id": 1012,
            "atividade": "Revisar questionário para foco em negócios",
            "inicio": "2026-08-05",
            "fim": "2026-08-06",
            "responsavel": "Gabi",
            "status": "No prazo"
          },
          {
            "id": 1013,
            "atividade": "Definir metodologia de aplicação",
            "inicio": "2026-07-20",
            "fim": "2026-08-07",
            "responsavel": "Gabi",
            "status": "No prazo"
          },
          {
            "id": 1014,
            "atividade": "Fazer material de apresentação do projeto e convite aos especialistas",
            "inicio": "2026-08-06",
            "fim": "2026-08-06",
            "responsavel": "Suze",
            "status": "Entregue"
          },
          {
            "id": 1015,
            "atividade": "Convidar especialistas",
            "inicio": "2026-07-22",
            "fim": "2026-08-24",
            "responsavel": "Suze",
            "status": "No prazo"
          },
          {
            "id": 1016,
            "atividade": "Realizar validação com especialistas (Ivanildo e Felipe Freitas)",
            "inicio": "2026-08-05",
            "fim": "2026-08-25",
            "responsavel": "Coordenação",
            "status": "No prazo",
            "observacao": "Agendada com Ivanildo (25/8), aguardando retorno do Felipe"
          },
          {
            "id": 1017,
            "atividade": "Consolidar contribuições",
            "inicio": "2026-08-07",
            "fim": "2026-08-25",
            "responsavel": "Coordenação",
            "status": "No prazo"
          },
          {
            "id": 1018,
            "atividade": "Enviar para validação com a SEMAS",
            "inicio": "2026-08-10",
            "fim": "2026-08-25",
            "responsavel": "Coordenação",
            "status": "No prazo"
          }
        ]
      },
      {
        "id": 202,
        "entrega": "Índice de Classificação Organizacional",
        "inicio": "2026-07-06",
        "fim": "2026-08-18",
        "responsavel": "Gabi",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1019,
            "atividade": "Definir referências",
            "inicio": "2026-07-06",
            "fim": "2026-07-10",
            "responsavel": "Gabi",
            "status": "Entregue"
          },
          {
            "id": 1020,
            "atividade": "Definir dimensões",
            "inicio": "2026-07-20",
            "fim": "2026-07-24",
            "responsavel": "Gabi",
            "status": "Entregue"
          },
          {
            "id": 1021,
            "atividade": "Definir indicadores",
            "inicio": "2026-07-20",
            "fim": "2026-07-24",
            "responsavel": "Gabi",
            "status": "Entregue"
          },
          {
            "id": 1022,
            "atividade": "Definir escalas e critérios de avaliação",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "Gabi",
            "status": "No prazo"
          },
          {
            "id": 1023,
            "atividade": "Elaborar versão-base do Índice",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "Gabi",
            "status": "No prazo"
          },
          {
            "id": 1024,
            "atividade": "Convidar especialistas",
            "inicio": "2026-08-06",
            "fim": "2026-08-14",
            "responsavel": "Gabi",
            "status": "No prazo"
          },
          {
            "id": 1025,
            "atividade": "Realizar validação com especialistas",
            "inicio": "2026-08-05",
            "fim": "2026-08-14",
            "responsavel": "Coordenação",
            "status": "No prazo"
          },
          {
            "id": 1026,
            "atividade": "Consolidar contribuições",
            "inicio": "2026-08-07",
            "fim": "2026-08-14",
            "responsavel": "Coordenação",
            "status": "No prazo"
          },
          {
            "id": 1027,
            "atividade": "Enviar para validação com a SEMAS",
            "inicio": "2026-08-06",
            "fim": "2026-08-14",
            "responsavel": "Coordenação",
            "status": "No prazo"
          },
          {
            "id": 1028,
            "atividade": "Finalizar versão oficial",
            "inicio": "2026-08-13",
            "fim": "2026-08-18",
            "responsavel": "Gabi",
            "status": "No prazo"
          }
        ]
      }
    ]
  },
  {
    "id": 3,
    "bloco": "3. Estruturação do Sistema de Monitoramento",
    "entregas": [
      {
        "id": 301,
        "entrega": "Dashboard de Monitoramento",
        "inicio": "2026-08-06",
        "fim": "2026-08-19",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1029,
            "atividade": "Definir arquitetura do sistema de monitoramento",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "CESUPA",
            "status": "No prazo"
          },
          {
            "id": 1030,
            "atividade": "Definir estrutura do banco de dados",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "João Marcelo",
            "status": "No prazo"
          },
          {
            "id": 1031,
            "atividade": "Desenvolver o Dashboard de Monitoramento",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "CESUPA",
            "status": "No prazo"
          },
          {
            "id": 1032,
            "atividade": "Realizar testes internos",
            "inicio": "2026-08-10",
            "fim": "2026-08-12",
            "responsavel": "CESUPA",
            "status": "No prazo"
          },
          {
            "id": 1033,
            "atividade": "Implementar estrutura",
            "inicio": "2026-08-14",
            "fim": "2026-08-13",
            "responsavel": "SEMAS",
            "status": "No prazo"
          },
          {
            "id": 1034,
            "atividade": "Finalizar versão inicial do Dashboard",
            "inicio": "2026-08-18",
            "fim": "2026-08-19",
            "responsavel": "CESUPA",
            "status": "No prazo"
          },
          {
            "id": 1035,
            "atividade": "Cadastro de visualização FAS/SEMAS",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "João Marcelo",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 4,
    "bloco": "4. Pré-visita e Pactuação",
    "entregas": [
      {
        "id": 401,
        "entrega": "Alinhamento com as Instituições",
        "inicio": "2026-08-04",
        "fim": "2026-08-26",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1036,
            "atividade": "Providenciar chip",
            "inicio": "2026-08-04",
            "fim": "2026-08-06",
            "responsavel": "CESUPA",
            "status": "No prazo"
          },
          {
            "id": 1037,
            "atividade": "Estabelecer fluxo macro de contato com as instituições",
            "descricao": "Definir macroetapas de contato com cada uma das organização (confirmação de visita, lembrete de data, alinhamento de horário de chegada, etc) - para orientar a equipe a fazer o destrinchmaneto dessas etapas",
            "inicio": "2026-08-24",
            "fim": "2026-08-24",
            "responsavel": "Ana Paula",
            "aprovador": "Mônica",
            "status": "No prazo"
          },
          {
            "id": 1038,
            "atividade": "Destrinchar fluxo de contato com as instituições",
            "descricao": "A partir do fluxo macro, esmiuçar os contatos a serem realizados, incluindo crianção de textos base para enviar",
            "inicio": "2026-08-24",
            "fim": "2026-08-25",
            "responsavel": "Equipe",
            "aprovador": "Mônica/Ana Paula",
            "status": "No prazo"
          },
          {
            "id": 1039,
            "atividade": "Criar grupos com as instituições",
            "descricao": "Criar grupo de alinhamento com as instituições já contatadas (rotas 1 e 2)",
            "inicio": "2026-08-24",
            "fim": "2026-08-26",
            "responsavel": "Ana Paula",
            "status": "No prazo"
          },
          {
            "id": 1040,
            "atividade": "Elaborar apresentação institucional (carta)",
            "inicio": "2026-08-06",
            "fim": "2026-08-06",
            "responsavel": "Suze",
            "status": "Entregue"
          },
          {
            "id": 1041,
            "atividade": "Fazer vídeo",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "Ana Souto",
            "status": "Não iniciado"
          },
          {
            "id": 1042,
            "atividade": "Desenvolver termo de autorização para ida do Cesupa",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "Mônica",
            "status": "Não iniciado"
          },
          {
            "id": 1043,
            "atividade": "Retomar contato com as instituições e agendar encontros preliminares",
            "inicio": "2026-08-06",
            "fim": "2026-07-31",
            "responsavel": "CESUPA",
            "status": "Não iniciado",
            "observacao": "Ligação > Vídeo"
          },
          {
            "id": 1044,
            "atividade": "Elaborar checklist da primeira reunião de alinhamento",
            "inicio": "2026-08-06",
            "fim": "2026-08-06",
            "responsavel": "Ana Paula",
            "aprovador": "Mônica",
            "status": "Entregue"
          },
          {
            "id": 1045,
            "atividade": "Realizar primeira reunião de alinhamento",
            "inicio": "2026-08-10",
            "fim": "2026-08-21",
            "responsavel": "Equipe",
            "status": "Não iniciado",
            "observacao": "Data, roteiro, consulta sobre documentação preliminar"
          },
          {
            "id": 1046,
            "atividade": "Validar informações cadastrais da instituição",
            "inicio": "2026-08-11",
            "fim": "2026-08-21",
            "responsavel": "CESUPA / Instituições",
            "status": "Não iniciado"
          },
          {
            "id": 1047,
            "atividade": "Identificar necessidades e prioridades da instituição pré-visita",
            "inicio": "2026-08-10",
            "fim": "2026-08-21",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1048,
            "atividade": "Consolidar informações preliminares",
            "inicio": "2026-08-06",
            "fim": "2026-08-12",
            "responsavel": "Equipe",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 5,
    "bloco": "5. Planejamento Operacional",
    "entregas": [
      {
        "id": 501,
        "entrega": "Cronograma das Visitas",
        "inicio": "2026-08-06",
        "fim": "2026-08-13",
        "responsavel": "Mônica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1049,
            "atividade": "Definir cronograma de visitas – considerando pontos de atenção",
            "inicio": "2026-08-06",
            "fim": "2026-08-13",
            "responsavel": "Mônica",
            "status": "No prazo"
          },
          {
            "id": 1050,
            "atividade": "Confirmar datas com as instituições",
            "inicio": "2026-08-06",
            "fim": "2026-08-06",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 502,
        "entrega": "Plano de Voo das Visitas",
        "inicio": "2026-08-05",
        "fim": "2026-08-22",
        "responsavel": "Mônica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1051,
            "atividade": "Fazer checklist de tudo que precisa ter no plano de voo",
            "inicio": "2026-08-05",
            "fim": "2026-08-05",
            "responsavel": "Mônica",
            "status": "Entregue"
          },
          {
            "id": 1052,
            "atividade": "Elaborar roteiro geral das visitas",
            "inicio": "2026-08-06",
            "fim": "2026-08-06",
            "responsavel": "Mônica",
            "status": "Entregue"
          },
          {
            "id": 1053,
            "atividade": "Elaborar roteiro específico de cada visita",
            "inicio": "2026-08-06",
            "fim": "2026-08-17",
            "responsavel": "Equipe",
            "aprovador": "Coordenação",
            "status": "Não iniciado",
            "observacao": "Definir entrevistados, Definir unidades produtivas, Planejar logística de campo, Confirmar logística de deslocamento, Identificar protocolos territoriais aplicáveis, Elaborar plano de contingência"
          },
          {
            "id": 1054,
            "atividade": "Validar plano de voo-base com a SEMAS",
            "inicio": "2026-08-21",
            "fim": "2026-08-21",
            "responsavel": "Coordenação",
            "aprovador": "SEMAS",
            "status": "Não iniciado"
          },
          {
            "id": 1055,
            "atividade": "Finalizar plano de voo com as contribuições",
            "inicio": "2026-08-22",
            "fim": "2026-08-22",
            "responsavel": "Coordenação",
            "status": "Não iniciado"
          },
          {
            "id": 1056,
            "atividade": "Imprimir todos os documentos para as visitas",
            "inicio": "2026-08-05",
            "fim": "2026-08-05",
            "responsavel": "Ana Paula",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 503,
        "entrega": "Logística",
        "inicio": "2026-08-24",
        "fim": "2026-08-24",
        "responsavel": "Coordenação",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1057,
            "atividade": "Fazer fluxo de financeiro das tarefas da logística (alimentação, reservas, etc)",
            "descricao": "Definir qual organização fica responsável por cada demanda de logística (CESUPA/SEMAS)",
            "inicio": "2026-08-24",
            "fim": "2026-08-24",
            "responsavel": "Coordenação",
            "aprovador": "SEMAS",
            "status": "Não iniciado"
          },
          {
            "id": 1058,
            "atividade": "Detalhar e confirmar logística de cada local (hotel, distâncias, tempos)",
            "inicio": "2026-08-24",
            "fim": "2026-08-24",
            "responsavel": "Equipe",
            "status": "Não iniciado"
          },
          {
            "id": 1059,
            "atividade": "Reservar hotéis e transportes de cada viagem",
            "inicio": "2026-08-24",
            "fim": "2026-08-24",
            "status": "Não iniciado"
          },
          {
            "id": 1060,
            "atividade": "Contratar seguro-viagem",
            "inicio": "2026-08-24",
            "fim": "2026-08-24",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 6,
    "bloco": "6. Capacitação da Equipe",
    "entregas": [
      {
        "id": 601,
        "entrega": "Preparação da Equipe",
        "inicio": "2026-08-13",
        "fim": "2026-08-25",
        "responsavel": "Ana Paula",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1061,
            "atividade": "Elaborar Manual de Campo - Equipe (protocolos, vestimenta, etc)",
            "inicio": "2026-08-13",
            "fim": "2026-08-14",
            "responsavel": "Ana Paula",
            "aprovador": "Mônica",
            "status": "Validação pendente"
          },
          {
            "id": 1062,
            "atividade": "Realizar alinhamento metodológico",
            "inicio": "2026-08-15",
            "fim": "2026-08-15",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1063,
            "atividade": "Realizar simulação da aplicação do questionário",
            "inicio": "2026-08-18",
            "fim": "2026-08-18",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1064,
            "atividade": "Realizar simulação das entrevistas",
            "inicio": "2026-08-19",
            "fim": "2026-08-19",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1065,
            "atividade": "Realizar simulação dos grupos focais",
            "inicio": "2026-08-19",
            "fim": "2026-08-19",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1066,
            "atividade": "Padronizar procedimentos de registro",
            "inicio": "2026-08-19",
            "fim": "2026-08-20",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1067,
            "atividade": "Realizar treinamento para utilização do Dashboard",
            "inicio": "2026-08-20",
            "fim": "2026-08-21",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1068,
            "atividade": "Alinhar procedimentos de atuação em campo",
            "inicio": "2026-08-24",
            "fim": "2026-08-25",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 7,
    "bloco": "7. Regularização Documental",
    "entregas": [
      {
        "id": 701,
        "entrega": "Documentação",
        "inicio": "2026-07-08",
        "fim": "2026-08-15",
        "responsavel": "SEMAS",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1069,
            "atividade": "Envio dos termos da SEMAS para embasar a criação do termo conjunto",
            "inicio": "2026-07-08",
            "fim": "2026-07-24",
            "responsavel": "SEMAS",
            "status": "Não iniciado"
          },
          {
            "id": 1070,
            "atividade": "Elaborar Termo de Autorização de Uso de Imagem e Dados",
            "inicio": "2026-07-29",
            "fim": "2026-08-05",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1071,
            "atividade": "Validar termo com a SEMAS",
            "inicio": "2026-08-11",
            "fim": "2026-08-12",
            "responsavel": "SEMAS",
            "status": "Não iniciado"
          },
          {
            "id": 1072,
            "atividade": "Definir procedimento de assinatura",
            "inicio": "2026-08-13",
            "fim": "2026-08-13",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1073,
            "atividade": "Definir responsável pelo arquivamento",
            "inicio": "2026-08-14",
            "fim": "2026-08-14",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1074,
            "atividade": "Organizar armazenamento dos documentos assinados",
            "inicio": "2026-08-15",
            "fim": "2026-08-15",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 8,
    "bloco": "8. Visitas Técnicas e Diagnóstico",
    "entregas": [
      {
        "id": 801,
        "entrega": "Execução do Diagnóstico",
        "inicio": "2026-08-24",
        "fim": "2026-10-30",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1075,
            "atividade": "Realizar visitas técnicas e aplicar os instrumentos de diagnóstico",
            "inicio": "2026-08-24",
            "fim": "2026-10-30",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 9,
    "bloco": "9. Sistematização, Análise e Devolutivas",
    "entregas": [
      {
        "id": 901,
        "entrega": "Diagnósticos",
        "inicio": "2026-08-31",
        "fim": "2026-11-06",
        "responsavel": "CESUPA / Instituições",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1076,
            "atividade": "Sistematizar informações, elaborar diagnósticos e realizar devolutivas",
            "inicio": "2026-08-31",
            "fim": "2026-11-06",
            "responsavel": "CESUPA / Instituições",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 10,
    "bloco": "10. Monitoramento, Inteligência e Tomada de Decisão",
    "entregas": [
      {
        "id": 1001,
        "entrega": "Monitoramento contínuo e apoio à decisão",
        "inicio": "2026-08-01",
        "fim": "2026-08-31",
        "responsavel": "CESUPA / SEMAS",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1077,
            "atividade": "Atualizar indicadores, analisar riscos e subsidiar a tomada de decisão",
            "inicio": "2026-08-01",
            "fim": "2026-08-01",
            "responsavel": "CESUPA / SEMAS",
            "status": "Não iniciado"
          },
          {
            "id": 1078,
            "atividade": "Registrar tecnicamente as recomendações realizadas por iniciativa",
            "inicio": "2026-08-01",
            "fim": "2026-08-01",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1002,
        "entrega": "Relatório de Governança Técnica e Acompanhamento da Aplicação dos Recursos",
        "inicio": "2027-03-29",
        "fim": "2027-04-02",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1079,
            "atividade": "Consolidar registros técnicos de acompanhamento por iniciativa",
            "inicio": "2027-03-29",
            "fim": "2027-03-30",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1080,
            "atividade": "Elaborar parecer técnico de conformidade de uso de recursos das 20 iniciativas",
            "inicio": "2027-03-31",
            "fim": "2027-04-01",
            "responsavel": "Coord. Técnico",
            "status": "Não iniciado"
          },
          {
            "id": 1081,
            "atividade": "Validar relatório com a SEMAS",
            "inicio": "2027-04-02",
            "fim": "2027-04-02",
            "responsavel": "SEMAS",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 11,
    "bloco": "11. Governança Técnica e Validação dos Planos de Trabalho",
    "entregas": [
      {
        "id": 1101,
        "entrega": "Pareceres técnicos de validação dos planos de trabalho",
        "inicio": "2026-11-09",
        "fim": "2026-11-27",
        "responsavel": "Coord. Técnico",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1082,
            "atividade": "Analisar os planos de trabalho das 20 iniciativas",
            "inicio": "2026-11-09",
            "fim": "2026-11-20",
            "responsavel": "Coord. Técnico",
            "status": "Não iniciado"
          },
          {
            "id": 1083,
            "atividade": "Verificar coerência entre objetivos, atividades e orçamento",
            "inicio": "2026-11-09",
            "fim": "2026-11-20",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1084,
            "atividade": "Elaborar os 20 pareceres técnicos individuais do plano de trabalho",
            "inicio": "2026-11-23",
            "fim": "2026-11-27",
            "responsavel": "Coord. Técnico",
            "status": "Não iniciado"
          },
          {
            "id": 1085,
            "atividade": "Validar pareceres com a SEMAS",
            "inicio": "2026-11-27",
            "fim": "2026-11-27",
            "responsavel": "SEMAS",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1102,
        "entrega": "Orientações técnicas para ajustes nos planos de trabalho",
        "inicio": "2026-11-30",
        "fim": "2026-12-04",
        "responsavel": "Coord. Técnico",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1086,
            "atividade": "Comunicar recomendações de adequação a cada iniciativa",
            "inicio": "2026-11-30",
            "fim": "2026-12-02",
            "responsavel": "Coord. Técnico",
            "status": "Não iniciado"
          },
          {
            "id": 1087,
            "atividade": "Acompanhar ajustes solicitados nos planos de trabalho",
            "inicio": "2026-12-02",
            "fim": "2026-12-04",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 12,
    "bloco": "12. Capacitação e Fortalecimento das Iniciativas",
    "entregas": [
      {
        "id": 1201,
        "entrega": "Oficinas de fortalecimento de gestão e governança",
        "inicio": "2026-12-07",
        "fim": "2027-01-29",
        "responsavel": "Equipe Técnica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1088,
            "atividade": "Definir conteúdo programático das oficinas (gestão financeira, governança, organização produtiva)",
            "inicio": "2026-12-07",
            "fim": "2026-12-11",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1089,
            "atividade": "Agendar e convocar as 20 iniciativas",
            "inicio": "2026-12-14",
            "fim": "2026-12-18",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1090,
            "atividade": "Realizar as oficinas online",
            "inicio": "2027-01-04",
            "fim": "2027-01-22",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1091,
            "atividade": "Sistematizar registros de participação e aprendizado",
            "inicio": "2027-01-25",
            "fim": "2027-01-29",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1202,
        "entrega": "Mentorias técnicas individuais e por cadeia produtiva",
        "inicio": "2026-12-07",
        "fim": "2027-03-26",
        "responsavel": "Equipe Técnica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1092,
            "atividade": "Definir cronograma de mentorias por iniciativa/cadeia produtiva",
            "inicio": "2026-12-07",
            "fim": "2026-12-11",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1093,
            "atividade": "Realizar mentorias técnicas periódicas (1 check-in mensal por iniciativa)",
            "inicio": "2026-12-14",
            "fim": "2027-03-19",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1094,
            "atividade": "Registrar desafios resolvidos e encaminhamentos",
            "inicio": "2027-03-22",
            "fim": "2027-03-26",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1203,
        "entrega": "Apoio à organização de registros e evidências das 20 iniciativas",
        "inicio": "2026-12-14",
        "fim": "2027-03-26",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1095,
            "atividade": "Confirmar todas as regras de prestação de contras, registros e relatórios pelos financiadores",
            "inicio": "2026-12-14",
            "fim": "2026-12-14",
            "status": "Não iniciado"
          },
          {
            "id": 1096,
            "atividade": "Criar fluxo de registro de execução das atividades por iniciativa",
            "inicio": "2026-12-14",
            "fim": "2026-12-14",
            "status": "Não iniciado"
          },
          {
            "id": 1097,
            "atividade": "Apoiar a organização de registros de execução das atividades por iniciativa",
            "inicio": "2026-12-14",
            "fim": "2027-03-19",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1098,
            "atividade": "Sistematizar evidências (relatórios, fotos, registros técnicos) gerais",
            "inicio": "2026-12-14",
            "fim": "2027-03-19",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1099,
            "atividade": "Organizar informações para relatórios técnicos",
            "inicio": "2027-03-22",
            "fim": "2027-03-26",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1204,
        "entrega": "Registro de participação qualificada (mulheres, jovens e lideranças comunitárias)",
        "inicio": "2026-12-07",
        "fim": "2027-03-26",
        "responsavel": "Equipe Técnica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1116,
            "atividade": "Definir indicador de equidade e protagonismo comunitário",
            "inicio": "2026-12-07",
            "fim": "2026-12-11",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1117,
            "atividade": "Registrar participação por perfil em oficinas e mentorias",
            "inicio": "2026-12-14",
            "fim": "2027-03-19",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1118,
            "atividade": "Consolidar indicador de participação qualificada",
            "inicio": "2027-03-22",
            "fim": "2027-03-26",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 13,
    "bloco": "13. Monitoramento Final e Avaliação de Prontidão",
    "entregas": [
      {
        "id": 1301,
        "entrega": "Comparação Linha de Base x Situação Final",
        "inicio": "2027-04-05",
        "fim": "2027-05-14",
        "responsavel": "Equipe Técnica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1100,
            "atividade": "Atualizar indicadores definidos na linha de base - monitoramento",
            "inicio": "2027-04-05",
            "fim": "2027-04-16",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1101,
            "atividade": "Verificar execução física e financeira das 20 iniciativas",
            "inicio": "2027-04-19",
            "fim": "2027-04-30",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1102,
            "atividade": "Consolidar indicadores finais por iniciativa",
            "inicio": "2027-05-03",
            "fim": "2027-05-07",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1103,
            "atividade": "Elaborar comparação linha de base x situação final",
            "inicio": "2027-05-10",
            "fim": "2027-05-14",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1302,
        "entrega": "Classificação de Prontidão para Mercado",
        "inicio": "2027-05-03",
        "fim": "2027-05-14",
        "responsavel": "Equipe Técnica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1104,
            "atividade": "Aplicar critérios de classificação de prontidão",
            "inicio": "2027-05-03",
            "fim": "2027-05-07",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1105,
            "atividade": "Classificar estágio de desenvolvimento comercial por iniciativa",
            "inicio": "2027-05-10",
            "fim": "2027-05-14",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          },
          {
            "id": 1106,
            "atividade": "Identificar oportunidades de mercado por iniciativa",
            "inicio": "2027-05-10",
            "fim": "2027-05-14",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1303,
        "entrega": "Consolidação dos resultados por cadeia produtiva",
        "inicio": "2027-05-17",
        "fim": "2027-05-21",
        "responsavel": "Equipe Técnica",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1107,
            "atividade": "Sistematizar padrões e aprendizados por segmento produtivo",
            "inicio": "2027-05-17",
            "fim": "2027-05-21",
            "responsavel": "Equipe Técnica",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1304,
        "entrega": "Recomendações técnicas para fase subsequente do programa",
        "inicio": "2027-06-21",
        "fim": "2027-06-25",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1108,
            "atividade": "Sistematizar necessidades de apoio futuro identificadas",
            "inicio": "2027-06-21",
            "fim": "2027-06-23",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1109,
            "atividade": "Elaborar recomendações técnicas e institucionais",
            "inicio": "2027-06-23",
            "fim": "2027-06-25",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  },
  {
    "id": 14,
    "bloco": "14. Relatórios Finais e Encerramento",
    "entregas": [
      {
        "id": 1401,
        "entrega": "Relatório Final Integrado",
        "inicio": "2027-06-21",
        "fim": "2027-06-30",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1110,
            "atividade": "Consolidar resultados, aprendizados e impactos do acompanhamento das 20 iniciativas",
            "inicio": "2027-06-21",
            "fim": "2027-06-25",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1111,
            "atividade": "Elaborar narrativa unificada do impacto gerado pelo projeto",
            "inicio": "2027-06-21",
            "fim": "2027-06-28",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1112,
            "atividade": "Revisar e finalizar relatório final integrado",
            "inicio": "2027-06-29",
            "fim": "2027-06-30",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1113,
            "atividade": "Validar relatório com a SEMAS",
            "inicio": "2027-06-28",
            "fim": "2027-06-30",
            "responsavel": "SEMAS",
            "status": "Não iniciado"
          },
          {
            "id": 1114,
            "atividade": "Preparar apresentação de resultados, devolutiva e próximos passos",
            "inicio": "2027-06-28",
            "fim": "2027-06-29",
            "responsavel": "CESUPA",
            "status": "Não iniciado"
          },
          {
            "id": 1115,
            "atividade": "Realizar reunião de encerramento",
            "inicio": "2027-06-30",
            "fim": "2027-06-30",
            "responsavel": "CESUPA / SEMAS",
            "status": "Não iniciado"
          }
        ]
      },
      {
        "id": 1402,
        "entrega": "Entregas",
        "inicio": "2026-08-01",
        "fim": "2026-08-31",
        "responsavel": "CESUPA",
        "status": "Não iniciado",
        "atividades": [
          {
            "id": 1119,
            "atividade": "6.5 Validações SEMAS e FAS",
            "inicio": "2026-08-01",
            "fim": "2026-08-01",
            "status": "Não iniciado"
          },
          {
            "id": 1120,
            "atividade": "Protocolos territoriais aplicáveis identificados e formalizados",
            "inicio": "2026-08-01",
            "fim": "2026-08-01",
            "status": "Não iniciado"
          },
          {
            "id": 1121,
            "atividade": "Roteiro e datas da visita compartilhados previamente com a SEMAS",
            "inicio": "2026-08-01",
            "fim": "2026-08-01",
            "status": "Não iniciado"
          },
          {
            "id": 1122,
            "atividade": "Autorizações necessárias emitidas e em posse da equipe",
            "inicio": "2026-08-01",
            "fim": "2026-08-01",
            "status": "Não iniciado"
          }
        ]
      }
    ]
  }
];
