// Catálogo do Índice de Estruturação Organizacional (IEO) — RF-02.B.
// Conteúdo fornecido pelo usuário (Anexo — Instrumentos do Diagnóstico, seção 2):
// somente as perguntas pontuáveis em escala 1-4, com a descrição completa de
// cada nível. Perguntas abertas/de caracterização ficam no catálogo do Parecer
// Técnico (parecerComplementar.ts), não aqui.

export interface IeoNivel {
  valor: string;
  descricao: string;
}

export interface IeoPergunta {
  id: string;
  texto: string;
  niveis: IeoNivel[];
}

export interface IeoSubdimensao {
  id: string;
  titulo: string;
  perguntas: IeoPergunta[];
}

export interface IeoDimensao {
  id: string;
  titulo: string;
  subdimensoes: IeoSubdimensao[];
}

const REGISTRO_PARTICIPACAO_NIVEIS: IeoNivel[] = [
  { valor: '1', descricao: 'Não há prática definida de registrar quem participa das reuniões e assembleias.' },
  { valor: '2', descricao: 'Há registros em alguns encontros, mas eles são feitos de forma irregular ou ficam dispersos.' },
  { valor: '3', descricao: 'A participação é registrada nos principais encontros e os registros ficam organizados para consulta.' },
  { valor: '4', descricao: 'A participação é registrada de forma sistemática, os registros são consolidados e utilizados para acompanhar o envolvimento dos membros.' },
];

const CADASTRO_ATUALIZADO_NIVEIS: IeoNivel[] = [
  { valor: '1', descricao: 'Não há cadastro organizado ou não é possível identificar quais informações estão atualizadas.' },
  { valor: '2', descricao: 'Existe cadastro, mas a atualização ocorre apenas quando surge uma necessidade ou contato com o membro.' },
  { valor: '3', descricao: 'Existe uma rotina definida para revisar e atualizar os dados dos membros.' },
  { valor: '4', descricao: 'Há rotina, responsável e controle da atualização, permitindo identificar dados desatualizados e tomar providências.' },
];

const FUNCOES_PRIORITARIAS_ALTERNATIVA_NIVEIS: IeoNivel[] = [
  { valor: '1', descricao: 'Há funções prioritárias que seriam interrompidas e para as quais a organização não possui alternativa identificada.' },
  { valor: '2', descricao: 'A organização identifica possíveis alternativas para manter as funções prioritárias, mas sua continuidade ainda depende da obtenção de novos recursos, apoios ou parcerias.' },
  { valor: '3', descricao: 'A organização já possui recursos, pessoas ou parcerias alternativas que permitem manter as funções prioritárias, ainda que com limitações.' },
  { valor: '4', descricao: 'A organização possui recursos, pessoas ou alternativas estruturadas para manter as funções prioritárias sem depender da continuidade dos principais projetos ou apoios externos.' },
];

const METAS_RESULTADOS_NIVEIS: IeoNivel[] = [
  { valor: '1', descricao: 'As ações são realizadas sem metas ou resultados esperados definidos.' },
  { valor: '2', descricao: 'Metas ou resultados são definidos pontualmente, principalmente quando há exigência externa.' },
  { valor: '3', descricao: 'A organização define previamente metas ou resultados esperados para as ações que acompanha.' },
  { valor: '4', descricao: 'A organização define metas ou resultados esperados, estabelece responsáveis pelo acompanhamento e utiliza os resultados para revisar suas ações.' },
];

const ENTRADAS_SAIDAS_NIVEIS: IeoNivel[] = [
  { valor: '1', descricao: 'Não há registro organizado das entradas e saídas financeiras.' },
  { valor: '2', descricao: 'Existem registros, mas são incompletos, dispersos ou atualizados apenas quando surge necessidade.' },
  { valor: '3', descricao: 'Entradas e saídas são registradas de forma contínua e podem ser consultadas.' },
  { valor: '4', descricao: 'Os registros são atualizados, conferidos com as movimentações financeiras e utilizados no acompanhamento e nas decisões da organização.' },
];

const RESULTADOS_RELACOES_NIVEIS: IeoNivel[] = [
  { valor: '1', descricao: 'A organização não identifica resultados concretos gerados pelas relações institucionais ou territoriais.' },
  { valor: '2', descricao: 'A organização identifica resultados concretos de algumas relações, mas não os registra ou acompanha.' },
  { valor: '3', descricao: 'A organização registra e acompanha resultados gerados pelas relações consideradas prioritárias.' },
  { valor: '4', descricao: 'A organização define objetivos para relações prioritárias, acompanha seus resultados e utiliza essas informações para manter, ajustar ou desenvolver novas articulações.' },
];

export const IEO_DIMENSOES: IeoDimensao[] = [
  {
    id: '1', titulo: 'Governança e Base dos Membros',
    subdimensoes: [
      {
        id: '1.1', titulo: 'Governança, decisão e participação',
        perguntas: [
          { id: '1.1.1', texto: 'A organização possui espaços de decisão definidos e que funcionam na prática?', niveis: [
            { valor: '1', descricao: 'Não há espaços de decisão definidos ou os existentes não funcionam na prática.' },
            { valor: '2', descricao: 'Existem espaços de decisão, mas são acionados apenas em algumas situações e sem rotina definida.' },
            { valor: '3', descricao: 'Os principais espaços de decisão funcionam conforme regras ou rotinas conhecidas pela organização.' },
            { valor: '4', descricao: 'Os espaços de decisão funcionam conforme regras ou rotinas definidas, possuem registros e acompanham os encaminhamentos realizados.' },
          ] },
          { id: '1.1.2', texto: 'Quais são as principais instâncias de decisão e com que frequência se reúnem?', niveis: REGISTRO_PARTICIPACAO_NIVEIS },
          { id: '1.1.3', texto: 'Nas decisões mais importantes, quem participa efetivamente?', niveis: REGISTRO_PARTICIPACAO_NIVEIS },
          { id: '1.1.4', texto: 'Como a organização registra a participação nas principais reuniões e assembleias?', niveis: REGISTRO_PARTICIPACAO_NIVEIS },
          { id: '1.1.5', texto: 'Como a organização acompanha e promove a participação dos membros nas principais decisões coletivas?', niveis: [
            { valor: '1', descricao: 'A participação fica concentrada nas lideranças ou em um grupo restrito e a organização não acompanha quem participa.' },
            { valor: '2', descricao: 'Outros membros participam, mas isso varia entre decisões e não há mecanismo definido para acompanhar ou ampliar a participação.' },
            { valor: '3', descricao: 'Diferentes membros participam das principais decisões e a organização utiliza mecanismos definidos para convocar ou favorecer essa participação.' },
            { valor: '4', descricao: 'Além de promover a participação, a organização registra quem participa, identifica grupos menos presentes e adota ações para ampliar ou equilibrar o envolvimento.' },
          ] },
          { id: '1.1.6', texto: 'Como os membros que não ocupam cargos podem apresentar demandas, críticas ou propostas?', niveis: [
            { valor: '1', descricao: 'Não há canal ou forma conhecida para apresentar demandas, críticas ou propostas.' },
            { valor: '2', descricao: 'Os membros conseguem se manifestar, mas isso depende de contatos informais e não há fluxo definido de tratamento.' },
            { valor: '3', descricao: 'Existem canais conhecidos pelos membros e as manifestações recebidas são encaminhadas para tratamento.' },
            { valor: '4', descricao: 'Existem canais conhecidos, registro das manifestações, responsáveis pelo tratamento e acompanhamento das respostas ou providências.' },
          ] },
          { id: '1.1.7', texto: 'Como ocorre a renovação de lideranças e a preparação de novas pessoas para assumir responsabilidades?', niveis: [
            { valor: '1', descricao: 'Não há prática de preparar novas pessoas para assumir responsabilidades.' },
            { valor: '2', descricao: 'Novas pessoas são preparadas apenas quando surge uma necessidade ou vaga.' },
            { valor: '3', descricao: 'A organização envolve e prepara novas pessoas para assumir algumas responsabilidades antes que a substituição seja necessária.' },
            { valor: '4', descricao: 'Há práticas definidas de formação, compartilhamento de responsabilidades e preparação de sucessores para funções-chave.' },
          ] },
          { id: '1.1.8', texto: 'Há grupos da base com menor participação ou influência nas decisões? Quais e por quê?', niveis: CADASTRO_ATUALIZADO_NIVEIS },
        ],
      },
      {
        id: '1.2', titulo: 'Conhecimento e relacionamento com a base',
        perguntas: [
          { id: '1.2.1', texto: 'Como a organização mantém atualizado o cadastro dos membros?', niveis: CADASTRO_ATUALIZADO_NIVEIS },
          { id: '1.2.2', texto: 'Como estão organizadas as informações que a organização mantém sobre seus membros?', niveis: [
            { valor: '1', descricao: 'Há apenas informações básicas, incompletas ou dispersas sobre os membros.' },
            { valor: '2', descricao: 'Existe cadastro organizado e algumas informações adicionais, mas elas não estão integradas ou completas.' },
            { valor: '3', descricao: 'A organização mantém de forma organizada informações cadastrais e outras informações relevantes para sua atuação com os membros.' },
            { valor: '4', descricao: 'As informações estão integradas, atualizadas e podem ser consultadas e utilizadas para planejar ações, serviços ou operações com os membros.' },
          ] },
          { id: '1.2.3', texto: 'Como ocorre a atualização das informações sobre os membros?', niveis: [
            { valor: '1', descricao: 'Não há rotina definida de atualização das informações.' },
            { valor: '2', descricao: 'As informações são atualizadas quando surge uma necessidade específica.' },
            { valor: '3', descricao: 'As informações são revisadas em momentos previamente definidos.' },
            { valor: '4', descricao: 'Há rotina de atualização, responsável definido e controle sobre quando as informações foram revisadas.' },
          ] },
          { id: '1.2.4', texto: 'Como está estruturada a comunicação da organização com sua base?', niveis: [
            { valor: '1', descricao: 'A comunicação acontece de forma ocasional, sem canais ou responsáveis definidos.' },
            { valor: '2', descricao: 'Existem canais utilizados pela organização, mas não há rotina definida nem verificação de quem recebeu a informação.' },
            { valor: '3', descricao: 'Existem canais e rotina de comunicação definidos para informar os membros sobre os principais assuntos.' },
            { valor: '4', descricao: 'Além de canais e rotina definidos, a organização verifica alcance ou retorno e ajusta a comunicação quando identifica falhas.' },
          ] },
          { id: '1.2.5', texto: 'Como a organização registra e trata demandas, reclamações ou sugestões dos membros?', niveis: [
            { valor: '1', descricao: 'Não há forma definida de receber e tratar demandas, reclamações ou sugestões.' },
            { valor: '2', descricao: 'As manifestações são recebidas e tratadas informalmente, sem registro ou responsável definido.' },
            { valor: '3', descricao: 'Há forma conhecida de recebimento, encaminhamento e tratamento das manifestações.' },
            { valor: '4', descricao: 'As manifestações são registradas, possuem responsável, têm andamento acompanhado e recebem retorno aos membros.' },
          ] },
        ],
      },
    ],
  },
  {
    id: '2', titulo: 'Gestão e Capacidade Organizacional',
    subdimensoes: [
      {
        id: '2.1', titulo: 'Gestão organizacional e capacidade operacional',
        perguntas: [
          { id: '2.1.1', texto: 'As responsabilidades internas estão claramente definidas?', niveis: [
            { valor: '1', descricao: 'As responsabilidades não estão definidas e as tarefas dependem de decisões do momento.' },
            { valor: '2', descricao: 'Algumas responsabilidades são conhecidas, mas há sobreposição, lacunas ou dependência de acordos informais.' },
            { valor: '3', descricao: 'As principais responsabilidades estão definidas e as pessoas sabem quem responde por cada função.' },
            { valor: '4', descricao: 'As responsabilidades estão definidas e registradas, são conhecidas pela equipe e revistas quando há mudanças.' },
          ] },
          { id: '2.1.2', texto: 'O que acontece com as principais atividades quando uma liderança ou pessoa-chave não está disponível?', niveis: [
            { valor: '1', descricao: 'Há função prioritária que depende exclusivamente de uma pessoa e não possui substituição possível.' },
            { valor: '2', descricao: 'Existem substitutos para determinadas funções prioritárias, mas ainda há funções prioritárias que dependem de pessoas específicas.' },
            { valor: '3', descricao: 'As funções prioritárias possuem pessoas capazes de assumir sua execução quando necessário.' },
            { valor: '4', descricao: 'Além de haver substituição para as funções prioritárias, conhecimentos e responsabilidades das funções-chave são compartilhados e há mecanismo definido de substituição.' },
          ] },
          { id: '2.1.3', texto: 'Como estão organizados os principais documentos e registros da organização?', niveis: [
            { valor: '1', descricao: 'Os documentos ficam dispersos ou dependem de pessoas específicas para serem localizados.' },
            { valor: '2', descricao: 'Parte dos documentos está organizada, mas não há padrão único de armazenamento ou localização.' },
            { valor: '3', descricao: 'Os principais documentos estão organizados em locais definidos e podem ser localizados quando necessários.' },
            { valor: '4', descricao: 'Há padrão de organização, responsáveis, controle de versões ou atualização e acesso definido aos documentos.' },
          ] },
          { id: '2.1.4', texto: 'Quais são hoje os principais gargalos de gestão da organização? Já tentaram resolver? Se sim, como foi?', niveis: FUNCOES_PRIORITARIAS_ALTERNATIVA_NIVEIS },
        ],
      },
      {
        id: '2.2', titulo: 'Autonomia organizacional',
        perguntas: [
          { id: '2.2.1', texto: 'Se os principais projetos ou apoios externos terminassem hoje, o que aconteceria com as funções prioritárias da organização?', niveis: FUNCOES_PRIORITARIAS_ALTERNATIVA_NIVEIS },
          { id: '2.2.2', texto: 'Como as receitas próprias ou recorrentes contribuem para manter as funções prioritárias da organização?', niveis: [
            { valor: '1', descricao: 'A continuidade das funções prioritárias depende de recursos eventuais, projetos ou apoios externos.' },
            { valor: '2', descricao: 'Existem receitas próprias ou recorrentes, mas elas não permitem manter as funções prioritárias sem recursos adicionais.' },
            { valor: '3', descricao: 'As receitas próprias ou recorrentes permitem manter as funções prioritárias, embora haja dependência de uma fonte principal.' },
            { valor: '4', descricao: 'As receitas próprias ou recorrentes permitem manter as funções prioritárias e provêm de fontes diversificadas, reduzindo a dependência de uma única fonte.' },
          ] },
          { id: '2.2.3', texto: 'Quais são as três capacidades que mais precisam ser fortalecidas para aumentar a autonomia da organização?', niveis: METAS_RESULTADOS_NIVEIS },
          { id: '2.2.4', texto: 'O que a organização considera que seria uma mudança concreta de sucesso ao final do projeto Inova?', niveis: METAS_RESULTADOS_NIVEIS },
        ],
      },
      {
        id: '2.3', titulo: 'Monitoramento, aprendizagem e melhoria',
        perguntas: [
          { id: '2.3.1', texto: 'A organização define metas ou resultados esperados para suas principais ações?', niveis: METAS_RESULTADOS_NIVEIS },
          { id: '2.3.2', texto: 'Quando uma ação não funciona como esperado, como a organização identifica o problema e decide o que mudar?', niveis: [
            { valor: '1', descricao: 'Os problemas são tratados quando acontecem de forma reativa, sem prática definida de analisar suas causas.' },
            { valor: '2', descricao: 'Os problemas são discutidos e podem gerar mudanças, mas a análise ocorre de forma pontual e sem acompanhamento definido.' },
            { valor: '3', descricao: 'A organização analisa causas e alternativas antes de implementar mudanças nos principais problemas identificados.' },
            { valor: '4', descricao: 'Há rotina para analisar causas, definir mudanças, acompanhar sua implementação e verificar se produziram o resultado esperado.' },
          ] },
        ],
      },
    ],
  },
  {
    id: '3', titulo: 'Gestão Econômica-Financeira',
    subdimensoes: [
      {
        id: '3.1', titulo: 'Gestão financeira institucional',
        perguntas: [
          { id: '3.1.1', texto: 'A organização contrata serviços externos de apoio contábil e/ou jurídico?', niveis: ENTRADAS_SAIDAS_NIVEIS },
          { id: '3.1.2', texto: 'A organização realiza ou contrata auditorias externas?', niveis: ENTRADAS_SAIDAS_NIVEIS },
          { id: '3.1.3', texto: 'A organização possui controle regular de entradas e saídas?', niveis: ENTRADAS_SAIDAS_NIVEIS },
          { id: '3.1.4', texto: 'Como a organização planeja quanto espera receber e gastar em suas atividades?', niveis: [
            { valor: '1', descricao: 'Não é feita previsão de receitas e despesas antes das atividades.' },
            { valor: '2', descricao: 'São feitas previsões pontualmente, principalmente quando há exigência de projeto ou parceiro.' },
            { valor: '3', descricao: 'A organização possui prática definida de elaborar previsões de receitas e despesas antes da execução das atividades.' },
            { valor: '4', descricao: 'Além de elaborar previsões, compara o previsto com o realizado e utiliza as diferenças para ajustar decisões e atividades.' },
          ] },
          { id: '3.1.5', texto: 'A organização confere se as movimentações das contas bancárias correspondem aos seus registros de entradas e saídas?', niveis: [
            { valor: '1', descricao: 'Não é feita conferência entre extratos/movimentações bancárias e registros internos.' },
            { valor: '2', descricao: 'A conferência é feita apenas quando surge uma dúvida, problema ou necessidade específica.' },
            { valor: '3', descricao: 'A conferência é feita em uma rotina definida e as diferenças identificadas são verificadas.' },
            { valor: '4', descricao: 'Há rotina, responsável e registro da conferência, com tratamento das diferenças encontradas.' },
          ] },
        ],
      },
      {
        id: '3.2', titulo: 'Gestão econômico-financeira das operações com os membros',
        perguntas: [
          { id: '3.2.3', texto: 'Como a organização realiza e acompanha os pagamentos ou repasses devidos aos membros?', niveis: [
            { valor: '1', descricao: 'Não há prazos definidos para pagamentos ou repasses, ou os atrasos não são acompanhados.' },
            { valor: '2', descricao: 'Existem prazos acordados, mas os atrasos são identificados ou tratados apenas quando surge uma cobrança ou problema.' },
            { valor: '3', descricao: 'Existem prazos definidos e a organização acompanha seu cumprimento e identifica eventuais atrasos.' },
            { valor: '4', descricao: 'Existem prazos definidos, controle de seu cumprimento e registro, comunicação e tratamento dos atrasos identificados.' },
          ] },
        ],
      },
    ],
  },
  {
    id: '4', titulo: 'Geração de Valor e Articulação',
    subdimensoes: [
      {
        id: '4.2', titulo: 'Articulação institucional e territorial',
        perguntas: [
          { id: '4.2.4', texto: 'Em quais conselhos, fóruns, redes, comitês ou espaços territoriais a organização participa e com qual objetivo?', niveis: RESULTADOS_RELACOES_NIVEIS },
          { id: '4.2.5', texto: 'A organização consegue transformar suas relações institucionais e territoriais em resultados concretos para a base?', niveis: RESULTADOS_RELACOES_NIVEIS },
        ],
      },
    ],
  },
  {
    id: '5', titulo: 'Regularidade e Gestão de Riscos',
    subdimensoes: [
      {
        id: '5.1', titulo: 'Regularidade e Gestão de Riscos',
        perguntas: [
          { id: '5.1', texto: 'Como a organização mantém e acompanha os documentos obrigatórios para seu funcionamento?', niveis: [
            { valor: '1', descricao: 'A organização não possui controle definido que permita identificar a situação dos documentos obrigatórios para seu funcionamento.' },
            { valor: '2', descricao: 'A organização identifica seus documentos obrigatórios, mas há documentos ausentes, vencidos ou cuja atualização ocorre apenas quando surge uma necessidade.' },
            { valor: '3', descricao: 'Os documentos obrigatórios identificados pela organização estão regulares e há acompanhamento de prazos e necessidades de atualização.' },
            { valor: '4', descricao: 'A documentação está organizada e atualizada, com controle de prazos, responsáveis e providências necessárias para manter a regularidade.' },
          ] },
        ],
      },
    ],
  },
];

/** Lista achatada de todas as perguntas pontuáveis, com a dimensão a que pertencem. */
export const IEO_PERGUNTAS_FLAT: { dimensaoId: string; dimensaoTitulo: string; pergunta: IeoPergunta }[] =
  IEO_DIMENSOES.flatMap(d => d.subdimensoes.flatMap(s => s.perguntas.map(p => ({ dimensaoId: d.id, dimensaoTitulo: d.titulo, pergunta: p }))));
