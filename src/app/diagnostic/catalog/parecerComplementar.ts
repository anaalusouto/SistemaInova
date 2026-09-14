// Catálogo do Parecer Técnico — Parte 1: perguntas complementares (RF-02.D).
// Conteúdo fornecido pelo usuário (Anexo — Instrumentos do Diagnóstico, seção
// 3.1): perguntas abertas, de caracterização e validação, organizadas pelas
// mesmas 5 dimensões do IEO + o grupo transversal "Patrimônio Genético e
// Conhecimento Tradicional". Não recebem nível/pontuação.

export type ParecerCampoTipo = 'texto' | 'unica' | 'multipla';

export interface ParecerOpcao { valor: string; label: string; }

export interface ParecerCampo {
  id: string;
  label: string;
  tipo: ParecerCampoTipo;
  opcoes?: ParecerOpcao[];
  permiteOutro?: boolean;
}

export interface ParecerGrupo {
  id: string;
  titulo: string;
  campos: ParecerCampo[];
}

const opc = (...valores: string[]): ParecerOpcao[] => valores.map(v => ({ valor: v, label: v }));

export const PARECER_GRUPOS: ParecerGrupo[] = [
  {
    id: '1', titulo: 'Governança e Base dos Membros',
    campos: [
      { id: '1.1.2', label: 'Quais são as principais instâncias de decisão e com que frequência se reúnem?', tipo: 'texto' },
      { id: '1.1.3', label: 'Nas decisões mais importantes, quem participa efetivamente?', tipo: 'texto' },
      { id: '1.1.6', label: 'Como funcionam os canais/formas para apresentação de demandas, críticas ou propostas? Cite um exemplo recente.', tipo: 'texto' },
      { id: '1.1.8', label: 'Há grupos da base com menor participação ou influência nas decisões? Quais e por quê?', tipo: 'texto' },
      { id: '1.2.2', label: 'Marque as informações disponíveis sobre os membros:', tipo: 'multipla', permiteOutro: true, opcoes: opc('Contato/localização', 'Atividade produtiva', 'Produtos', 'Volume/capacidade', 'Necessidades/demandas', 'Participação em ações', 'Vendas/operações', 'Outras') },
      { id: '1.2.3', label: 'Informe a frequência e o responsável pela atualização das informações sobre os membros.', tipo: 'texto' },
      { id: '1.2.4', label: 'Quais canais são utilizados e como a organização verifica se a informação chegou?', tipo: 'texto' },
      { id: '1.2.5', label: 'Descreva o fluxo de recebimento/tratamento de demandas, reclamações ou sugestões e cite um exemplo recente.', tipo: 'texto' },
    ],
  },
  {
    id: '2', titulo: 'Gestão e Capacidade Organizacional',
    campos: [
      { id: '2.1.2', label: 'Quais funções apresentam maior dependência de uma liderança ou pessoa-chave?', tipo: 'texto' },
      { id: '2.1.4', label: 'Quais são hoje os principais gargalos de gestão da organização? Já tentaram resolver? Se sim, como foi?', tipo: 'texto' },
      { id: '2.2.1', label: 'Quais funções seriam mais afetadas se os principais projetos ou apoios externos terminassem hoje?', tipo: 'texto' },
      { id: '2.2.3', label: 'Quais são as três capacidades que mais precisam ser fortalecidas para aumentar a autonomia da organização?', tipo: 'texto' },
      { id: '2.2.4', label: 'O que a organização considera que seria uma mudança concreta de sucesso ao final do projeto Inova?', tipo: 'texto' },
      { id: '2.3.3', label: 'Informe a frequência dos momentos de análise de resultados e revisão de decisões.', tipo: 'texto' },
      { id: '2.3.4', label: 'Cite uma mudança recente feita pela organização a partir de um resultado, problema, feedback ou aprendizado.', tipo: 'texto' },
    ],
  },
  {
    id: '3', titulo: 'Gestão Econômica-Financeira',
    campos: [
      { id: '3.1.1', label: 'A organização contrata serviços externos de apoio contábil e/ou jurídico?', tipo: 'multipla', permiteOutro: true, opcoes: opc('Não contrata', 'Contábil', 'Jurídico', 'Outros') },
      { id: '3.1.1_acompanhamento', label: 'Como a organização acompanha a execução dos serviços contratados?', tipo: 'texto' },
      { id: '3.1.2', label: 'A organização realiza ou contrata auditorias externas?', tipo: 'unica', opcoes: opc('Não realizou', 'Sim, uma vez', 'Sim, mais de uma vez', 'Não sabe informar') },
      { id: '3.1.2_motivo', label: 'Se realizou, por qual motivo?', tipo: 'texto' },
      { id: '3.1.2_data', label: 'Quando ocorreu a auditoria mais recente?', tipo: 'texto' },
      { id: '3.1.4', label: 'Descreva como o planejamento de receitas e despesas é acompanhado.', tipo: 'texto' },
      { id: '3.1.6', label: 'Descreva o formato e a frequência da prestação de contas aos membros.', tipo: 'texto' },
      { id: '3.1.7', label: 'Como os custos são apurados?', tipo: 'texto' },
      { id: '3.1.8', label: 'Quais são hoje as principais fontes de receita da organização?', tipo: 'texto' },
      { id: '3.2.2', label: 'Descreva como os critérios de preço, descontos, retenções ou fundos são informados aos membros.', tipo: 'texto' },
      { id: '3.2.5', label: 'Existem pendências de pagamento atualmente? Como são tratadas?', tipo: 'texto' },
      { id: '3.2.6', label: 'Quando uma operação coletiva gera sobra, perda ou saldo, como a organização calcula esse resultado e decide o que fazer com ele?', tipo: 'texto' },
      { id: '3.2.7', label: 'A organização possui recursos próprios ou reservas financeiras para apoiar suas atividades?', tipo: 'multipla', permiteOutro: true, opcoes: opc('Contribuições dos cooperados para formar o capital da cooperativa (quotas-partes)', 'Dinheiro próprio da organização disponível para manter atividades e operações (capital de giro)', 'Fundo ou reserva financeira da organização', 'Recursos recebidos para uso em projetos específicos', 'Não possui recursos próprios ou reservas financeiras', 'Outro') },
      { id: '3.2.7_regras', label: 'Como esses recursos foram formados e quais são as regras para sua utilização?', tipo: 'texto' },
      { id: '3.2.8', label: 'Dê um exemplo recente de uso de dados econômicos para rever preços, custos, negociações ou outras decisões comerciais.', tipo: 'texto' },
      { id: '3.3.1', label: 'Qual comprador, canal ou política concentra maior dependência?', tipo: 'texto' },
      { id: '3.3.2', label: 'Descreva como a organização identifica novas oportunidades de mercado.', tipo: 'texto' },
      { id: '3.3.3', label: 'Quais são atualmente os principais obstáculos para ampliar ou melhorar a comercialização?', tipo: 'texto' },
    ],
  },
  {
    id: '4', titulo: 'Geração de Valor e Articulação',
    campos: [
      { id: '4.1.1', label: 'Descreva o processo utilizado para identificar e priorizar serviços ou apoios aos membros.', tipo: 'texto' },
      { id: '4.1.2', label: 'Há serviços oferecidos cuja utilização pela base esteja abaixo do esperado pela própria organização? Quais e por quê?', tipo: 'texto' },
      { id: '4.1.3', label: 'Como a organização mede satisfação, adesão ou resultado dos serviços prestados e como utiliza os resultados?', tipo: 'texto' },
      { id: '4.2.1', label: 'Quais são hoje os parceiros mais relevantes e qual é a contribuição concreta de cada um? Registrar: parceiro/instituição; o que faz; quando/em quais situações a relação acontece; o que a parceria já gerou concretamente.', tipo: 'texto' },
      { id: '4.2.2', label: 'Quais relações institucionais são essenciais para a organização funcionar hoje?', tipo: 'texto' },
      { id: '4.2.3', label: 'Qual parceria gera maior dependência e o que deixaria de acontecer se terminasse?', tipo: 'texto' },
      { id: '4.2.4', label: 'Em quais conselhos, fóruns, redes, comitês ou espaços territoriais a organização participa e com qual objetivo?', tipo: 'texto' },
      { id: '4.2.5', label: 'Dê exemplos recentes de resultados concretos gerados pelas relações institucionais e territoriais.', tipo: 'texto' },
    ],
  },
  {
    id: '5', titulo: 'Regularidade e Gestão de Riscos',
    campos: [
      { id: '5.2', label: 'Existem documentos, licenças, registros ou certificações pendentes ou próximos do vencimento? Quais?', tipo: 'texto' },
      { id: '5.4', label: 'Quais são hoje os três principais riscos para a continuidade ou o desempenho da organização?', tipo: 'texto' },
      { id: '5.5', label: 'Quais medidas existem para prevenir e responder aos principais riscos?', tipo: 'texto' },
      { id: '5.6', label: 'Existem conflitos relevantes atualmente? Como estão sendo tratados?', tipo: 'texto' },
    ],
  },
  {
    id: 'transversal', titulo: 'Dimensão Transversal — Patrimônio Genético e Conhecimento Tradicional',
    campos: [
      { id: 'T.1', label: 'A organização já recebeu orientação sobre patrimônio genético, conhecimento tradicional, SisGen/CGen ou repartição de benefícios?', tipo: 'unica', opcoes: opc('Não', 'Sim, parcialmente', 'Sim') },
      { id: 'T.2', label: 'Há alguma atividade que a organização acredita precisar de verificação técnica específica sobre esse tema? Qual?', tipo: 'texto' },
    ],
  },
];
