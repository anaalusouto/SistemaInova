// Diagnóstico de Bionegócios — schema derivado da planilha oficial
// Cada seção agrupa perguntas. Tipos: text, textarea, number, select, multiselect

export type QuestionType = 'text' | 'textarea' | 'number' | 'select' | 'multiselect';

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
}

export interface Section {
  id: string;
  title: string;
  chapter: string; // 1. Identificação | 2. Território e Social | 3. Negócio
  questions: Question[];
}

const SIM_NAO = ['Sim', 'Não'];
const SIM_NAO_NS = ['Sim', 'Não', 'Não sabe informar'];
const SIM_PARCIAL_NAO = ['Sim', 'Parcialmente', 'Não'];
const SIM_PARCIAL_NS = ['Sim', 'Não', 'Parcialmente', 'Não sabe informar'];
const SIM_PARCIAL_NA = ['Sim', 'Não', 'Parcialmente', 'Não se aplica'];

export const sections: Section[] = [
  {
    id: 'cadastral',
    chapter: '1. Identificação',
    title: '1.1 Cadastral',
    questions: [
      { id: 'org_nome', label: 'Nome da organização', type: 'text' },
      { id: 'org_tipo', label: 'Tipo de organização', type: 'select', options: ['Associação', 'Cooperativa', 'Coletivo informal', 'Empreendimento familiar', 'Grupo produtivo comunitário', 'Organização indígena', 'Organização quilombola', 'Outro'] },
      { id: 'cnpj_ativo', label: 'CNPJ ativo?', type: 'select', options: ['Sim', 'Não', 'Em regularização', 'Não se aplica'] },
      { id: 'cnpj_numero', label: 'Número do CNPJ', type: 'text' },
      { id: 'ano_fundacao', label: 'Ano de fundação da organização', type: 'number' },
      { id: 'responsavel_nome', label: 'Nome do responsável/representante', type: 'text' },
      { id: 'responsavel_funcao', label: 'Função do responsável', type: 'select', options: ['Presidente/Coordenador(a)', 'Tesoureiro(a)', 'Secretário(a)', 'Técnico(a) responsável', 'Liderança comunitária', 'Outro'] },
      { id: 'contato_tel', label: 'Telefone/WhatsApp de contato', type: 'text' },
      { id: 'contato_email', label: 'E-mail de contato', type: 'text' },
      { id: 'etnia_lideranca', label: 'Autodeclaração étnico-racial da liderança', type: 'select', options: ['Indígena', 'Quilombola', 'Ribeirinha', 'Parda', 'Preta', 'Branca', 'Outra'] },
      { id: 'municipio', label: 'Município', type: 'text' },
      { id: 'comunidade', label: 'Comunidade/território', type: 'text' },
      { id: 'multi_municipio', label: 'Atua em mais de um município?', type: 'select', options: SIM_NAO },
      { id: 'outros_municipios', label: 'Se sim, quais?', type: 'text' },
      { id: 'sede_fisica', label: 'Possui sede física?', type: 'select', options: ['Sim, própria', 'Sim, cedida', 'Sim, alugada', 'Não possui'] },
      { id: 'associados_cad', label: 'Associados/cooperados cadastrados', type: 'number' },
      { id: 'associados_ativos', label: 'Associados/cooperados ativos', type: 'number' },
      { id: 'mulheres', label: 'Número de mulheres envolvidas', type: 'number' },
      { id: 'jovens', label: 'Número de jovens envolvidos', type: 'number' },
      { id: 'perfil_territorio', label: 'Perfil predominante do território', type: 'select', options: ['Indígena', 'Quilombola', 'Ribeirinho', 'Extrativista', 'Agricultor familiar', 'Outro'] },
    ],
  },
  {
    id: 'experiencias',
    chapter: '1. Identificação',
    title: '1.2 Experiências e Parceiros',
    questions: [
      { id: 'ja_acessou', label: 'Já acessou editais/projetos?', type: 'select', options: SIM_NAO },
      { id: 'quais_editais', label: 'Quais projetos/editais?', type: 'textarea' },
      { id: 'faixa_recurso', label: 'Maior faixa de recurso acessada', type: 'select', options: ['Até R$ 50 mil', 'R$ 50-200 mil', 'R$ 200-500 mil', 'R$ 500 mil-1 milhão', 'Acima de R$ 1 milhão'] },
      { id: 'tipos_apoio', label: 'Tipos de apoio acessados hoje', type: 'multiselect', options: ['Articulação de base', 'Gestão', 'Jurídico', 'Assistência técnica', 'Financeiro', 'Comercialização'] },
      { id: 'motivo_nao_acesso', label: 'Se nunca acessou, motivo principal', type: 'select', options: ['Falta de informação', 'Falta de documentação', 'Falta de tempo/capacidade técnica', 'Não se sentiu apto(a)'] },
      { id: 'nao_executado', label: 'Já teve projeto aprovado mas não executado?', type: 'select', options: SIM_NAO },
      { id: 'motivo_nao_execucao', label: 'Se sim, motivo', type: 'textarea' },
      { id: 'parcerias_ativas', label: 'Tem parcerias ativas?', type: 'select', options: SIM_NAO },
      { id: 'tipo_parceiro', label: 'Principal tipo de parceiro', type: 'select', options: ['ONGs', 'Universidades', 'Órgãos públicos', 'Cooperativas de segundo grau', 'Empresas privadas'] },
      { id: 'beneficios_parceria', label: 'Principais benefícios das parcerias', type: 'multiselect', options: ['Assistência técnica', 'Capacitação/formação', 'Financiamento', 'Doação de insumos/equipamentos', 'Comercialização'] },
    ],
  },
  {
    id: 'socio_territorial',
    chapter: '2. Território e Social',
    title: '2.1 Caracterização Socioterritorial',
    questions: [
      { id: 'territorio_reconhecido', label: 'Território é reconhecido/titulado?', type: 'select', options: ['Sim, titulado', 'Reconhecido, mas não titulado', 'Em processo', 'Não'] },
      { id: 'uso_territorio', label: 'Uso é coletivo, individual ou misto?', type: 'select', options: ['Coletivo', 'Individual', 'Misto'] },
      { id: 'categoria_territorio', label: 'Categoria do território', type: 'select', options: ['Terra Indígena', 'Território Quilombola', 'Reserva Extrativista (RESEX)', 'Reserva de Desenvolvimento Sustentável (RDS)', 'Outro'] },
      { id: 'georreferenciamento', label: 'Possui cadastro/georreferenciamento (CAR, SIGEF, RTID)?', type: 'select', options: SIM_PARCIAL_NS },
      { id: 'plano_gestao', label: 'Existe plano de gestão/acordo de uso?', type: 'select', options: SIM_PARCIAL_NS },
      { id: 'ambiente_predominante', label: 'Ambiente predominante', type: 'select', options: ['Floresta de terra firme', 'Várzea/igapó', 'Campo/cerrado', 'Manguezal'] },
      { id: 'uc_entorno', label: 'Está dentro/entorno de UC?', type: 'select', options: ['Sim, dentro', 'Sim, no entorno', 'Não', 'Não sabe informar'] },
    ],
  },
  {
    id: 'governanca',
    chapter: '2. Território e Social',
    title: '2.2 Governança e Organização Interna',
    questions: [
      { id: 'estatuto_atualizado', label: 'Possui estatuto atualizado?', type: 'select', options: ['Sim', 'Não', 'Em atualização', 'Não sabe informar'] },
      { id: 'diretoria_vigente', label: 'Diretoria vigente e registrada?', type: 'select', options: ['Sim', 'Não', 'Parcialmente', 'Em regularização'] },
      { id: 'conselho_fiscal', label: 'Conselho fiscal ativo?', type: 'select', options: ['Sim', 'Não', 'Existe, mas não atua', 'Não sabe informar'] },
      { id: 'assembleias', label: 'Frequência de assembleias', type: 'select', options: ['Mensalmente', 'Bimestralmente', 'Trimestralmente', 'Semestralmente'] },
      { id: 'registro_ata', label: 'Decisões registradas em ata?', type: 'select', options: ['Sempre', 'Às vezes', 'Raramente', 'Nunca'] },
      { id: 'participacao', label: 'Participação dos associados', type: 'select', options: ['Muito alta', 'Alta', 'Média', 'Baixa'] },
      { id: 'divisao_responsabilidades', label: 'Divisão clara de responsabilidades?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'concentracao_decisoes', label: 'Concentração de decisões em poucas lideranças?', type: 'select', options: ['Sim, muito', 'Sim, parcialmente', 'Não', 'Não sabe informar'] },
      { id: 'conflitos_internos', label: 'Conflitos internos que afetam o bionegócio?', type: 'select', options: ['Sim', 'Não', 'Às vezes', 'Prefere não responder'] },
      { id: 'desafios_governanca', label: 'Principais desafios de governança', type: 'textarea' },
      { id: 'mulheres_producao', label: 'Mulheres participam da produção?', type: 'select', options: ['Sim, majoritariamente', 'Sim, de forma equilibrada', 'Sim, mas pouco', 'Não'] },
      { id: 'mulheres_lideranca', label: 'Mulheres em cargos de liderança?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'jovens_participam', label: 'Jovens participam do bionegócio?', type: 'select', options: ['Sim, ativamente', 'Sim, pontualmente', 'Pouco', 'Não'] },
      { id: 'atividades_jovens', label: 'Em quais atividades?', type: 'multiselect', options: ['Produção', 'Beneficiamento', 'Comunicação', 'Gestão', 'Comercialização'] },
      { id: 'barreiras_participacao', label: 'Barreiras para participação de mulheres e jovens', type: 'textarea' },
      { id: 'cargos_funcoes', label: 'Cargos e funções da diretoria/equipe', type: 'textarea' },
      { id: 'fluxo_reunioes', label: 'Fluxo de reuniões', type: 'textarea' },
      { id: 'planejamento_metas', label: 'Planejamento e metas definidos', type: 'textarea' },
      { id: 'fluxo_decisao', label: 'Fluxo de decisão', type: 'textarea' },
    ],
  },
  {
    id: 'patrimonio_genetico',
    chapter: '2. Território e Social',
    title: '2.3 Patrimônio Genético e Conhecimento Tradicional',
    questions: [
      { id: 'conhecimento_repasse', label: 'Como o conhecimento tradicional é repassado, há risco de perda?', type: 'textarea' },
      { id: 'conhecimento_documentado', label: 'Conhecimentos tradicionais documentados?', type: 'select', options: ['Não, apenas transmitido oralmente', 'Sim, documentado pela própria comunidade', 'Sim, documentado por parceiros externos', 'Sim, por ambos'] },
      { id: 'protocolo_comunitario', label: 'Protocolo/acordo para autorizar uso?', type: 'select', options: ['Sim, protocolo/acordo formal', 'Sim, regra informal', 'Em elaboração', 'Não'] },
      { id: 'quem_decide', label: 'Quem decide sobre compartilhamento', type: 'select', options: ['Associação', 'Lideranças', 'Assembleia', 'Famílias'] },
      { id: 'parcerias_pesquisa', label: 'Parcerias com empresas/universidades?', type: 'select', options: ['Sim, atualmente', 'Já houve', 'Em negociação', 'Não'] },
      { id: 'resultados_compartilhados', label: 'Resultados de pesquisa compartilhados?', type: 'select', options: SIM_PARCIAL_NS },
      { id: 'interesse_parcerias', label: 'Interesse em novas parcerias?', type: 'select', options: ['Sim', 'Não', 'Talvez, dependendo das condições'] },
      { id: 'vende_fora', label: 'Vende produtos com insumos da região fora do território?', type: 'select', options: ['Sim', 'Não', 'Só uso interno'] },
      { id: 'reparticao_beneficios', label: 'Acordo de repartição de benefícios?', type: 'select', options: ['Sim', 'Em negociação', 'Não, nunca foi solicitado ou oferecido'] },
      { id: 'ouviu_sisgen', label: 'Ouviu falar do SisGen?', type: 'select', options: SIM_NAO_NS },
      { id: 'cadastro_sisgen', label: 'Cadastro no SisGen', type: 'select', options: ['Já possui', 'Precisa avaliar', 'Não possui', 'Não sabe informar'] },
      { id: 'assessoria_juridica', label: 'Assessoria jurídica/técnica para SisGen?', type: 'select', options: ['Sim, contínua', 'Sim, pontual', 'Não'] },
      { id: 'riscos_preocupacoes', label: 'Principais riscos/dúvidas/preocupações', type: 'textarea' },
      { id: 'capacitacao_desejada', label: 'Capacitação desejada', type: 'multiselect', options: ['SisGen e acesso ao patrimônio genético', 'Propriedade intelectual', 'Repartição de benefícios', 'Contratos e parcerias'] },
    ],
  },
  {
    id: 'regularidade',
    chapter: '2. Território e Social',
    title: '2.4 Regularidade Jurídica, Fiscal e Documental',
    questions: [
      { id: 'estatuto_cartorio', label: 'Estatuto/ata atualizados em cartório?', type: 'select', options: SIM_PARCIAL_NS },
      { id: 'conta_bancaria', label: 'Conta bancária ativa?', type: 'select', options: ['Sim', 'Não', 'Em abertura'] },
      { id: 'nota_fiscal', label: 'Consegue emitir nota fiscal?', type: 'select', options: ['Sim', 'Não', 'Às vezes'] },
      { id: 'inscricao_estadual', label: 'Inscrição estadual?', type: 'select', options: ['Sim', 'Não', 'Em regularização'] },
      { id: 'inscricao_municipal', label: 'Inscrição municipal?', type: 'select', options: ['Sim', 'Não', 'Em regularização'] },
      { id: 'certidoes', label: 'Certidões negativas atualizadas?', type: 'select', options: SIM_PARCIAL_NS },
      { id: 'pendencias_documentais', label: 'Outras pendências documentais', type: 'textarea' },
      { id: 'contador', label: 'Possui contador/apoio contábil?', type: 'select', options: ['Sim, contínuo', 'Sim, pontual', 'Não'] },
      { id: 'pendencias_juridicas', label: 'Pendências jurídicas/fiscais', type: 'textarea' },
    ],
  },
  {
    id: 'portfolio',
    chapter: '3. Negócio',
    title: '3.1 Portfólio e Inovação',
    questions: [
      { id: 'novos_produtos', label: 'Deseja desenvolver novos produtos?', type: 'select', options: SIM_NAO },
      { id: 'prototipagem', label: 'Produtos em fase de teste/prototipagem?', type: 'select', options: SIM_NAO },
      { id: 'apoio_inovacao', label: 'Que tipo de apoio para inovação?', type: 'textarea' },
      { id: 'melhorias_desejadas', label: 'Novos produtos/melhorias desejadas', type: 'textarea' },
      { id: 'total_produzidos', label: 'Nº total de produtos produzidos', type: 'number' },
      { id: 'total_comercializados', label: 'Nº total de produtos comercializados', type: 'number' },
    ],
  },
  {
    id: 'infraestrutura',
    chapter: '3. Negócio',
    title: '3.2 Infraestrutura Produtiva',
    questions: [
      { id: 'unidade_beneficiamento', label: 'Possui unidade de beneficiamento/produção?', type: 'select', options: SIM_NAO },
      { id: 'condicao_infra', label: 'Condição geral da infraestrutura', type: 'select', options: ['Inexistente', 'Muito limitada', 'Parcialmente adequada', 'Adequada', 'Estruturada'] },
      { id: 'energia', label: 'Energia elétrica regular?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'agua', label: 'Água adequada para produção?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'armazenamento', label: 'Área de armazenamento?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'equipamentos', label: 'Quais equipamentos possui', type: 'textarea' },
      { id: 'equipamentos_parados', label: 'Há equipamentos parados/quebrados?', type: 'select', options: SIM_NAO },
      { id: 'quais_parados', label: 'Quais estão parados/subutilizados', type: 'textarea' },
      { id: 'gargalo_infra', label: 'Principal gargalo de infraestrutura', type: 'textarea' },
    ],
  },
  {
    id: 'sanitaria',
    chapter: '3. Negócio',
    title: '3.3 Regularidade Sanitária',
    questions: [
      { id: 'licenca_sanitaria', label: 'Licença sanitária do estabelecimento?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'responsavel_tecnico', label: 'Possui responsável técnico?', type: 'select', options: SIM_NAO },
      { id: 'manual_boas_praticas', label: 'Manual de boas práticas?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'pops', label: 'POPs (procedimentos operacionais padrão)?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'adequacoes_sanitarias', label: 'Adequações sanitárias necessárias', type: 'textarea' },
    ],
  },
  {
    id: 'logistica',
    chapter: '3. Negócio',
    title: '3.4 Logística',
    questions: [
      { id: 'logistica_gargalo', label: 'Logística é gargalo?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'transporte_proprio', label: 'Transporte próprio?', type: 'select', options: SIM_NAO },
      { id: 'fator_acesso', label: 'Principal fator que dificulta acesso', type: 'textarea' },
    ],
  },
  {
    id: 'marca',
    chapter: '3. Negócio',
    title: '3.5 Marca Institucional',
    questions: [
      { id: 'material_comercial', label: 'Possui material comercial?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'narrativa_clara', label: 'Narrativa clara sobre origem/território?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'comunica_narrativa', label: 'Comunica a narrativa?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'canal_comunicacao', label: 'Canal de comunicação e frequência', type: 'text' },
    ],
  },
  {
    id: 'gestao_financeira',
    chapter: '3. Negócio',
    title: '3.6 Gestão Administrativa e Financeira',
    questions: [
      { id: 'controles_financeiros', label: 'Como são feitos os controles?', type: 'textarea' },
      { id: 'ctrl_entradas_saidas', label: 'Controle de entradas e saídas?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'ctrl_estoque', label: 'Controle de estoque?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'ctrl_producao', label: 'Controle de produção?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'ctrl_vendas', label: 'Controle de vendas?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'fluxo_caixa', label: 'Fluxo de caixa?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'capital_giro', label: 'Capital de giro?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'dif_gestao_fin', label: 'Principal dificuldade de gestão financeira', type: 'textarea' },
    ],
  },
  {
    id: 'custos',
    chapter: '3. Negócio',
    title: '3.7 Custos e Precificação',
    questions: [
      { id: 'planilha_custos', label: 'Existe planilha de custos?', type: 'select', options: SIM_PARCIAL_NAO },
      { id: 'custos_dificeis', label: 'Custos mais difíceis de calcular', type: 'textarea' },
      { id: 'dif_precificacao', label: 'Dificuldades para formar preço', type: 'textarea' },
    ],
  },
];

// Índices de Maturidade (1-5)
export interface MaturityIndicator {
  id: string;
  label: string;
  scale: string;
}
export interface MaturityAxis {
  id: 'produtiva' | 'comercial' | 'organizacional';
  title: string;
  indicators: MaturityIndicator[];
}

export const maturityAxes: MaturityAxis[] = [
  {
    id: 'produtiva',
    title: 'Maturidade Produtiva',
    indicators: [
      { id: 'infra', label: 'Infraestrutura produtiva', scale: '1-Inexistente · 5-Estruturada' },
      { id: 'padronizacao', label: 'Padronização produtiva', scale: '1-Não padronizado · 5-Totalmente padronizado' },
      { id: 'qualidade', label: 'Controle de qualidade', scale: '1-Não existe · 5-Avançado' },
      { id: 'regularidade', label: 'Regularidade de produção', scale: '1-Não produz · 5-Regular' },
      { id: 'pedidos', label: 'Capacidade de atender pedidos', scale: '1-Não consegue · 5-Pedidos grandes' },
    ],
  },
  {
    id: 'comercial',
    title: 'Maturidade Comercial',
    indicators: [
      { id: 'mercado', label: 'Acesso a mercado', scale: '1-Não vende · 5-Vendas estruturadas' },
      { id: 'precificacao', label: 'Precificação', scale: '1-Não calcula · 5-Revê preços estrategicamente' },
      { id: 'marca', label: 'Marca e comunicação', scale: '1-Não possui · 5-Profissional' },
      { id: 'compradores', label: 'Relacionamento com compradores', scale: '1-Sem compradores · 5-Contratos consolidados' },
      { id: 'prontidao', label: 'Prontidão para mercado', scale: '1-Não pronto · 5-Mercados exigentes' },
    ],
  },
  {
    id: 'organizacional',
    title: 'Maturidade Organizacional',
    indicators: [
      { id: 'governanca', label: 'Governança interna', scale: '1-Muito frágil · 5-Muito estruturado' },
      { id: 'financeira', label: 'Gestão financeira', scale: '1-Sem controle · 5-Estruturado' },
      { id: 'prestacao', label: 'Prestação de contas', scale: '1-Não consegue · 5-Consolidada' },
      { id: 'participacao', label: 'Participação comunitária', scale: '1-Muito baixa · 5-Muito alta' },
    ],
  },
];

// Produto na cesta
export interface DiagnosticProduct {
  id: number;
  nome: string;
  cadeia: string;
  processamento: string; // In natura, Beneficiado, Processado
  tipo: string; // Alimento, Cosmético, etc.
  importancia: string;
  sazonal: 'Sim' | 'Não';
  volumeProduzido: number;
  volumeVendido: number;
  unidade: string; // kg, l, un
}
