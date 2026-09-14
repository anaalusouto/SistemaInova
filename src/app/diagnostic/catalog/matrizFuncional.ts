// Catálogo da Matriz Funcional (RF-02.A) — conteúdo fornecido pelo usuário
// (Anexo — Instrumentos do Diagnóstico, seção 1). Função/Descrição/Exemplo são
// fixos e não editáveis durante a aplicação.

export interface MatrizFuncaoCatalogo {
  id: string;
  funcao: string;
  descricao: string;
  exemplo: string;
}

export const MATRIZ_FUNCOES: MatrizFuncaoCatalogo[] = [
  { id: '1', funcao: 'Representação dos membros', descricao: 'Representar, defender e encaminhar interesses, demandas e direitos coletivos dos associados/cooperados perante órgãos públicos, empresas, conselhos, fóruns e outros espaços de negociação ou decisão.', exemplo: 'Participar de um conselho municipal para defender melhoria de acesso/estrada necessária aos associados.' },
  { id: '2', funcao: 'Articulação institucional', descricao: 'Construir e manter relações com órgãos públicos, instituições de apoio, empresas, financiadores e outras organizações para viabilizar parcerias, recursos, serviços, projetos e oportunidades para a organização e seus membros.', exemplo: 'Articular com a EMATER atendimento técnico ou com o SEBRAE uma ação de apoio à organização.' },
  { id: '3', funcao: 'Valorização cultural', descricao: 'Atua na valorização, preservação, transmissão e fortalecimento de saberes, práticas, costumes, crenças, manifestações e referências culturais vinculadas às comunidades e ao território.', exemplo: 'A associação apoia a realização de festividades religiosas e tradicionais da comunidade, mobiliza os associados para sua organização e contribui para que práticas, histórias, celebrações e conhecimentos associados à identidade local sejam transmitidos às novas gerações.' },
  { id: '4', funcao: 'Fortalecimento de saberes e práticas tradicionais', descricao: 'Atua na valorização, continuidade e transmissão de conhecimentos e práticas tradicionais relacionados aos modos de vida, produção, uso dos recursos naturais e manejo do território.', exemplo: 'A organização atua na valorização e continuidade das práticas tradicionais de manejo do açaizal, transmitidas entre gerações, respeitando os conhecimentos da comunidade sobre períodos de coleta, seleção das plantas, formas de manejo da área e relação com outras espécies do território.' },
  { id: '5', funcao: 'Organização e planejamento da produção', descricao: 'Organizar e planejar antecipadamente produtores, atividades, produtos, volumes, períodos, necessidades produtivas e responsabilidades para atender objetivos ou demandas coletivas.', exemplo: 'Consolidar quais membros participarão, quanto poderá ser produzido, em quais períodos e como serão organizadas as entregas para atender uma demanda coletiva.' },
  { id: '6', funcao: 'Assistência/orientação técnica', descricao: 'Oferecer diretamente ou viabilizar junto a parceiros orientação técnica sobre produção, manejo, processamento, qualidade ou outras necessidades.', exemplo: 'Viabilizar visitas de técnico agrícola aos produtores ou manter profissional próprio para orientação técnica.' },
  { id: '7', funcao: 'Capacitação em gestão e desenvolvimento organizacional', descricao: 'Promover ou viabilizar capacitações para associados/cooperados e lideranças voltadas ao desenvolvimento de competências de gestão e organização, como administração, finanças, governança, liderança, planejamento, comercialização, marketing, uso de tecnologias, elaboração de projetos e outras habilidades não relacionadas diretamente às técnicas de produção.', exemplo: 'Promover oficina de gestão financeira, liderança, comercialização, marketing ou elaboração de projetos.' },
  { id: '8', funcao: 'Compra coletiva de insumos', descricao: 'Organizar compras conjuntas de materiais, insumos ou outros recursos necessários à produção.', exemplo: 'Reunir a demanda dos membros e comprar conjuntamente embalagens, sementes, adubos ou outros insumos.' },
  { id: '9', funcao: 'Disponibilização de máquinas/equipamentos', descricao: 'Disponibilizar, administrar ou facilitar o acesso dos membros a máquinas, equipamentos ou estruturas produtivas.', exemplo: 'Disponibilizar despolpadeira, barco, trator, câmara fria ou outro equipamento para uso dos membros.' },
  { id: '10', funcao: 'Beneficiamento', descricao: 'Realizar ou organizar transformação, processamento, seleção, preparo ou outras etapas de beneficiamento dos produtos.', exemplo: 'Receber frutas dos membros e realizar despolpamento, seleção, embalagem ou outro processamento coletivo.' },
  { id: '11', funcao: 'Armazenamento', descricao: 'Disponibilizar ou organizar estruturas e procedimentos para armazenamento de matérias-primas, insumos ou produtos.', exemplo: 'Manter câmara fria, depósito ou espaço coletivo para armazenar produtos ou insumos dos membros.' },
  { id: '12', funcao: 'Controle de qualidade', descricao: 'Definir, orientar, verificar ou acompanhar requisitos de qualidade dos produtos e processos.', exemplo: 'Verificar padrões de higiene, peso, aparência, umidade ou outros requisitos antes da comercialização.' },
  { id: '13', funcao: 'Padronização', descricao: 'Estabelecer ou orientar padrões comuns de produção, processamento, apresentação ou qualidade.', exemplo: 'Definir padrão comum de embalagem, peso, classificação ou processo para produtos comercializados coletivamente.' },
  { id: '14', funcao: 'Regularização/certificação', descricao: 'Identificar requisitos e apoiar ou conduzir licenças, registros, certificações e adequações necessárias às atividades e produtos.', exemplo: 'Apoiar obtenção de licença sanitária, registro de produto, certificação orgânica ou outra regularização necessária.' },
  { id: '15', funcao: 'Comercialização em mercado privado e canais voluntários', descricao: 'Organizar a oferta dos membros, negociar condições comerciais e realizar ou viabilizar vendas coletivas para compradores privados e outros canais voluntários.', exemplo: 'Consolidar produtos de vários membros e negociar preço, volume, prazo, padrão e entrega com supermercado, restaurante, distribuidor, feira, empresa ou consumidor final.' },
  { id: '16', funcao: 'Comercialização em políticas públicas', descricao: 'Organizar a oferta dos membros e conduzir ou apoiar a participação em programas e compras públicas, incluindo atendimento a requisitos, negociação, documentação, entrega e acompanhamento dos resultados.', exemplo: 'Organizar a participação no PAA, PNAE ou outra compra pública, consolidando volumes, documentação, preços, cronograma de entrega e responsabilidades dos membros.' },
  { id: '17', funcao: 'Formação/orientação de preços', descricao: 'Apoiar a definição de preços considerando custos, condições produtivas, mercado e objetivos econômicos dos membros.', exemplo: 'Calcular ou orientar preço de venda considerando custos de produção, logística, margem e referências de mercado.' },
  { id: '18', funcao: 'Transporte/logística', descricao: 'Organizar ou viabilizar coleta, transporte, consolidação de cargas, distribuição ou entrega dos produtos.', exemplo: 'Organizar coleta dos produtos nas propriedades e transporte até unidade de beneficiamento ou comprador.' },
  { id: '19', funcao: 'Gestão de marca', descricao: 'Criar, manter e administrar marca coletiva ou identidade utilizada na apresentação e comercialização dos produtos.', exemplo: 'Administrar uma marca coletiva utilizada nos rótulos e embalagens dos produtos dos membros.' },
  { id: '20', funcao: 'Divulgação/promoção de produtos', descricao: 'Divulgar a organização, seus membros, produtos e diferenciais junto a compradores, consumidores e outros públicos.', exemplo: 'Participar de feiras, produzir materiais de divulgação ou promover produtos da organização em canais digitais.' },
  { id: '21', funcao: 'Captação de recursos/projetos', descricao: 'Identificar e acessar editais, financiamentos, parcerias, doações e outras oportunidades de recursos para objetivos coletivos.', exemplo: 'Inscrever a organização em edital ou articular financiamento/parceria para aquisição de equipamentos ou execução de ações.' },
  { id: '22', funcao: 'Gestão de projetos', descricao: 'Planejar, executar, acompanhar resultados e realizar prestação de contas dos projetos da organização.', exemplo: 'Executar projeto financiado, controlar cronograma e orçamento, acompanhar metas e realizar prestação de contas.' },
  { id: '23', funcao: 'Acesso a políticas públicas', descricao: 'Identificar políticas, programas e benefícios pertinentes e apoiar os membros no acesso a essas oportunidades.', exemplo: 'Apoiar membros na emissão ou atualização da CAF, acesso a crédito rural, assistência técnica, programas de fomento, benefícios ou outras políticas pertinentes.' },
  { id: '24', funcao: 'Outra função', descricao: 'Outra função coletiva relevante exercida pela organização.', exemplo: '' },
];

export const ATUACAO_OPCOES = ['Articula', 'Apoia', 'Coordena', 'Executa', 'Não realiza'] as const;

export const QUEM_EXECUTA_OPCOES = ['Membros', 'Parceiro', 'Terceiro', 'N/A'] as const;

export const INTERESSE_OPCOES = [
  'Já atua no nível desejado', 'Não tem interesse', 'Baixo interesse', 'Médio interesse', 'Alto interesse',
] as const;

export interface NivelOpcao { valor: string; label: string; descricao: string; }

export const CRITICIDADE_OPCOES: NivelOpcao[] = [
  { valor: '1', label: '1 — Baixa', descricao: 'Sua ausência gera pouco impacto.' },
  { valor: '2', label: '2 — Moderada', descricao: 'Sua ausência gera limitações pontuais.' },
  { valor: '3', label: '3 — Alta', descricao: 'Sua ausência compromete resultados relevantes.' },
  { valor: '4', label: '4 — Crítica', descricao: 'Sua ausência compromete diretamente a atuação ou continuidade da organização.' },
];

export const ABRANGENCIA_OPCOES: NivelOpcao[] = [
  { valor: '1', label: '1 — Restrita', descricao: 'Alcança apenas um grupo pequeno ou casos específicos entre os membros.' },
  { valor: '2', label: '2 — Parcial', descricao: 'Alcança parte dos membros, mas deixa grupos relevantes sem atendimento ou acesso.' },
  { valor: '3', label: '3 — Ampla', descricao: 'Alcança a maior parte dos membros para os quais a função é pertinente.' },
  { valor: '4', label: '4 — Geral', descricao: 'Alcança de forma regular todos ou praticamente todos os membros para os quais é pertinente.' },
  { valor: 'N/A', label: 'N/A', descricao: 'A função não é destinada diretamente aos membros ou a abrangência não é pertinente.' },
];
