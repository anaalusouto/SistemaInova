// Comunidades INOVA CRIA — seed a partir de Planos_de_trabalho_-_Comunidades_Inova_CRIA.xlsx

export type ComunidadeStatus = 'Ativa' | 'Em execução' | 'Concluída' | 'Pausada' | 'Prospectada';

export interface ComunidadePessoa {
  id: number;
  nome: string;
  funcao: string;
  contato?: string;
}
export interface ComunidadeProduto {
  id: number;
  nome: string;
  categoria?: string;
  observacao?: string;
}
export interface ComunidadeFornecedorComprador {
  id: number;
  nome: string;
  papel: 'Fornecedor' | 'Comprador';
  detalhe?: string;
}
export interface ComunidadeCapacitacao {
  id: number;
  tema: string;
  publico?: string;
  status?: 'Prevista' | 'Em curso' | 'Concluída';
}

export interface Comunidade {
  id: number;
  code: string;                    // NN-2026
  nome: string;
  responsavelTecnico: string;      // Ponto focal CRIA
  segmentoSocial: string;
  eixoPrincipal: string;
  classificacao: string;
  localizacao: string;
  municipio?: string;
  uf?: string;
  financiador: string;
  objetivo: string;
  valorTotal: number;
  formaRepasse: string;
  statusRepasse: string;
  dataRepasse: string;
  inicioPrevisto: string;          // MM/AAAA
  finalPrevisto: string;
  status: ComunidadeStatus;
  categoriasTematicas: string;
  compradores: string;
  garantiaVenda: string;
  destinacao: string;
  ativacoes?: string;
  oportunidades?: string;
  totalBeneficiadosDiretos: number;
  totalBeneficiadosIndiretos: number;
  mulheresBeneficiadas?: number;
  receitaFaixa: string;
  observacoes?: string;
  planoTrabalhoArquivo?: string;
  detalhamento: string;
  justificativa: string;
  produtoTexto: string;
  // Seções livres editáveis
  pessoas: ComunidadePessoa[];
  infraestrutura: string;
  certificacao: string;
  fornecedores: ComunidadeFornecedorComprador[];
  capacitacoes: ComunidadeCapacitacao[];
  territorio: string;
  produtos: ComunidadeProduto[];
  projectId?: number | null;       // vínculo com projeto INOVA FAS/FUNBIO
}

type Seed = Omit<Comunidade, 'id' | 'code' | 'pessoas' | 'infraestrutura' | 'certificacao' | 'fornecedores' | 'capacitacoes' | 'territorio' | 'produtos' | 'projectId'>;

const RAW: Seed[] = [
  {
    nome: 'Associação de Desenvolvimento Comunitário de Santa Maria do Pará (ADESC/PA)',
    responsavelTecnico: '', segmentoSocial: 'Comunidade Tradicional', eixoPrincipal: 'Eixo 1',
    classificacao: 'Projeto Estruturante', localizacao: 'Santa Maria do Pará', municipio: 'Santa Maria do Pará', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecer cadeias locais da sociobiodiversidade em Santa Maria do Pará e Maracanã, integrando segurança alimentar, geração de renda e conservação ambiental via quintais agroecológicos e apicultura comunitária.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'Efetuado', dataRepasse: '01/04/2026',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Em execução',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade, Fortalecimento produtivo e organizacional territorial',
    compradores: 'Em feiras locais', garantiaVenda: 'Não identificado', destinacao: 'Comércio e Varejo Local/Regional',
    ativacoes: '', oportunidades: 'Realizar imersões turísticas de forma transversal',
    totalBeneficiadosDiretos: 80, totalBeneficiadosIndiretos: 1020, mulheresBeneficiadas: undefined,
    receitaFaixa: 'Até R$75k', observacoes: 'Quintais produtivos, biodigestor e apicultura',
    planoTrabalhoArquivo: 'AJUSTADO- Plano de Trabalho - ADESC 24.10.pdf',
    detalhamento: 'Fortalecer cadeias locais da sociobiodiversidade em Santa Maria do Pará/PA e Maracanã/PA, integrando segurança alimentar, geração de renda e conservação ambiental por meio da implantação de quintais agroecológicos produtivos e do fortalecimento de apicultura comunitária.',
    justificativa: 'Fortalecimento dos sociobionegócios; valorização de saberes e promoção da segurança alimentar.',
    produtoTexto: 'Santa Maria do Pará (Quintais agroecológicos; qualificação de resíduos orgânicos); Maracanã (1 apiário, 10 novas colmeias: apicultura, mel artesanal e derivados)',
  },
  {
    nome: 'Associação de Trabalhadores Rurais de Tauari (ATRT)',
    responsavelTecnico: '', segmentoSocial: 'Agricultura Familiar', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'Capanema', municipio: 'Capanema', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Implantar agroindústria comunitária de mandioca com certificação ADEPARÁ e novos derivados, gerando renda e capacitando 20 mulheres.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'Efetuado', dataRepasse: '12/02/2026',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Em execução',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: 'Governo Federal (PAA/CONAB) e atravessadores locais', garantiaVenda: 'Com Fornecedor Fixo',
    destinacao: 'Programas Governamentais, Atravessadores e Distribuidores',
    totalBeneficiadosDiretos: 20, totalBeneficiadosIndiretos: 500,
    receitaFaixa: 'R$75k-R$250k', observacoes: 'Agroindústria de mandioca',
    planoTrabalhoArquivo: 'REAJUSTE - PROPOSTA DE PLANO DE TRABALHO TAUARI 21.10.25.pdf',
    detalhamento: 'Implantar agroindústria comunitária moderna para beneficiamento da mandioca com certificação ADEPARÁ; capacitar 20 mulheres em boas práticas de produção e gestão; desenvolver cinco novos produtos derivados; criar a marca Farinha Tauari Premium.',
    justificativa: 'Implementação de agroindústria comunitária.',
    produtoTexto: 'Farinha lavada, goma, tucupi, farinha de tapioca, farinha saborizada e farinha para farofa',
  },
  {
    nome: 'Associação Agroextrativista Sementes da Floresta (AASFLOR)',
    responsavelTecnico: '', segmentoSocial: 'Agricultura Familiar', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'Uruará', municipio: 'Uruará', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Ampliar e diversificar a capacidade produtiva das mini-usinas e farinheiras, dando suporte técnico à extração de sementes.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'Efetuado', dataRepasse: '16/04/2026',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Em execução',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: 'Varejo e representantes comerciais em São Paulo, Belém, Altamira e Santarém',
    garantiaVenda: 'Garantia Parcial', destinacao: 'Consumidor Final e Venda Direta',
    totalBeneficiadosDiretos: 100, totalBeneficiadosIndiretos: 400, mulheresBeneficiadas: 16,
    receitaFaixa: 'R$75k-R$250k', observacoes: 'Manejo, cultivo, extração de sementes, óleos e manteigas',
    planoTrabalhoArquivo: 'SEMENTES DA FLORESTA PROPOSTA DE PLANO DE TRABALHO - AJUSTADO 23.10.docx',
    detalhamento: 'Contratar técnico de campo para capacitar comunidades, melhorar estruturas de mini-usina de extração de óleos e manteigas e criar estrutura de secagem, aumentando capacidade produtiva e qualidade.',
    justificativa: 'Ampliação e diversificação da capacidade produtiva das mini-usinas e farinheiras.',
    produtoTexto: 'Coleta de sementes, óleos e manteigas vegetais, castanha-do-pará, babaçu, andiroba, copaíba e farinha de mandioca',
  },
  {
    nome: 'Associação das Comunidades Remanescentes de Quilombos de Oriximiná (ARQMO)',
    responsavelTecnico: '', segmentoSocial: 'Quilombola', eixoPrincipal: 'Eixo 1',
    classificacao: 'Projeto Estruturante', localizacao: 'Oriximiná', municipio: 'Oriximiná', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Implantar 2 viveiros agroflorestais comunitários no território quilombola do Erepecuru com produção mínima de 5 mil mudas/ano por viveiro, reflorestando ao menos 30ha.',
    valorTotal: 200000, formaRepasse: 'Parcela Única', statusRepasse: 'NA', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '11/2026', status: 'Prospectada',
    categoriasTematicas: 'Manejo territorial e restauração agroflorestal',
    compradores: 'Santarém, Oriximiná e região', garantiaVenda: 'Garantia Parcial',
    destinacao: 'Consumidor Final e Venda Direta',
    totalBeneficiadosDiretos: 50, totalBeneficiadosIndiretos: 1000,
    receitaFaixa: 'Acima de R$1M', observacoes: 'Manejo sustentável',
    planoTrabalhoArquivo: 'ARQMO PROPOSTA DE PLANO DE TRABALHO 26.09.pdf',
    detalhamento: 'Implantar até novembro/2026, 2 viveiros comunitários agroflorestais com capacidade mínima de 5 mil mudas/ano, envolvendo 50 membros em capacitações práticas e reflorestamento de 30 ha.',
    justificativa: 'Manejo inadequado das áreas agrícolas com perda de biodiversidade e degradação do solo.',
    produtoTexto: 'Viveiro agroflorestal comunitário: mudas nativas e de uso tradicional; reflorestamento',
  },
  {
    nome: 'Cooperativa Amazônia Agroindustrial Viseu Pará (COOPAVISEU)',
    responsavelTecnico: '', segmentoSocial: 'Agricultura Familiar', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'Viseu', municipio: 'Viseu', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Estruturar a cadeia agroindustrial de frutas da sociobiodiversidade em Viseu com construção e operacionalização de agroindústria de polpas.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'Efetuado', dataRepasse: '06/04/2026',
    inicioPrevisto: '01/2026', finalPrevisto: '10/2026', status: 'Em execução',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: 'Atravessadores locais, mercados regionais (Belém, Castanhal, Bragança), PNAE municipal',
    garantiaVenda: 'Com Fornecedor Fixo', destinacao: 'Atravessadores, Programas Governamentais',
    ativacoes: 'Participação no MVP Laboratório Fábrica',
    totalBeneficiadosDiretos: 30, totalBeneficiadosIndiretos: 600,
    receitaFaixa: 'R$75k-R$250k', observacoes: 'Agroindústria de polpas',
    planoTrabalhoArquivo: '[OFICIAL COOPAVISEU] Plano de Trabalho.docx - AJUSTADO.docx',
    detalhamento: 'Estruturar até outubro/2026 a cadeia agroindustrial de frutas com agroindústria de polpas em Viseu/PA, gerando renda para pelo menos 30 cooperados.',
    justificativa: 'Estruturar a cadeia de beneficiamento.',
    produtoTexto: 'Agroindústria de polpa; capacitação de cooperados e certificação sanitária; acesso a editais PNAE, PAA',
  },
  {
    nome: 'Cooperativa dos Agricultores e Apicultores no Nordeste Paraense (CAANP AGROMEL)',
    responsavelTecnico: '', segmentoSocial: 'Agricultura Familiar', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'São João de Pirabas', municipio: 'São João de Pirabas', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Modernizar a infraestrutura da AGROMEL com inovação, certificação sanitária e diversificação (mel e polpas).',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'Efetuado', dataRepasse: '10/03/2026',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Em execução',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: 'Governo Federal (PAA), atravessadores e consumidores locais',
    garantiaVenda: 'Com Fornecedor Fixo', destinacao: 'Programas Governamentais, Atravessadores, Comércio Local/Regional',
    ativacoes: 'Participação no MVP Laboratório Fábrica',
    totalBeneficiadosDiretos: 25, totalBeneficiadosIndiretos: 500, mulheresBeneficiadas: 16,
    receitaFaixa: 'R$75k-R$250k', observacoes: 'Agroindústria de polpas',
    planoTrabalhoArquivo: 'PROPOSTA DE PLANO DE TRABALHO CAANP AGROMEL',
    detalhamento: 'Construir casa de despolpar frutas, finalizar reforma do entreposto, adquirir equipamentos modernos, capacitar 25 cooperados em gestão, obter certificação ADEPARÁ e ampliar canais de venda.',
    justificativa: 'Estruturar e modernizar a cadeia produtiva da AGROMEL.',
    produtoTexto: 'Unidade de despolpa de frutas, entreposto próprio e casa de mel',
  },
  {
    nome: 'COPASMIG — São Miguel do Guamá',
    responsavelTecnico: '', segmentoSocial: 'Quilombola', eixoPrincipal: 'Eixo 1',
    classificacao: 'Projeto Estruturante', localizacao: 'São Miguel do Guamá', municipio: 'São Miguel do Guamá', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento da cadeia produtiva comunitária quilombola.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Fortalecimento produtivo e organizacional territorial',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0,
    receitaFaixa: '', observacoes: '',
    detalhamento: 'Detalhamento a ser complementado pelo plano de trabalho.',
    justificativa: '',
    produtoTexto: '',
  },
  {
    nome: 'MALUNGU — Coordenação das Associações Quilombolas do Pará',
    responsavelTecnico: '', segmentoSocial: 'Quilombola', eixoPrincipal: 'Eixo 1',
    classificacao: 'Projeto Estruturante', localizacao: 'São Miguel do Guamá', municipio: 'São Miguel do Guamá', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Floresta viva e negócios quilombolas sustentáveis.',
    valorTotal: 200000, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Manejo territorial e restauração agroflorestal',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0,
    receitaFaixa: '', observacoes: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'CAANP-AGROMEL (2ª rota)',
    responsavelTecnico: '', segmentoSocial: 'Agricultura Familiar', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'São João de Pirabas', municipio: 'São João de Pirabas', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Cadeia produtiva do mel e polpas.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'Associação Mulheres Indígenas do Gurupi',
    responsavelTecnico: '', segmentoSocial: 'Indígena', eixoPrincipal: 'Eixo 2',
    classificacao: 'Projeto Estruturante', localizacao: 'Paragominas — Vila Caip', municipio: 'Paragominas', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento produtivo de mulheres indígenas do Gurupi.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Fortalecimento produtivo e organizacional territorial',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'Nova Betel',
    responsavelTecnico: '', segmentoSocial: 'Quilombola', eixoPrincipal: 'Eixo 1',
    classificacao: 'Projeto Estruturante', localizacao: 'Tomé-Açu / Quatro Bocas', municipio: 'Tomé-Açu', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento comunitário quilombola.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Fortalecimento produtivo e organizacional territorial',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'Turiwara-Ka\'i',
    responsavelTecnico: '', segmentoSocial: 'Indígena', eixoPrincipal: 'Eixo 2',
    classificacao: 'Projeto Estruturante', localizacao: 'Tomé-Açu / Quatro Bocas', municipio: 'Tomé-Açu', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento indígena Turiwara-Ka\'i.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Fortalecimento produtivo e organizacional territorial',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'ARQUIA — Abaetetuba',
    responsavelTecnico: '', segmentoSocial: 'Quilombola', eixoPrincipal: 'Eixo 1',
    classificacao: 'Projeto Estruturante', localizacao: 'Abaetetuba', municipio: 'Abaetetuba', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento produtivo quilombola em Abaetetuba.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Fortalecimento produtivo e organizacional territorial',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'COOMAP — Oeiras do Pará',
    responsavelTecnico: '', segmentoSocial: 'Comunidade Tradicional', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'Oeiras do Pará', municipio: 'Oeiras do Pará', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Cadeia produtiva de comunidades tradicionais em Oeiras do Pará.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'MANEJAÍ — Portel',
    responsavelTecnico: '', segmentoSocial: 'Comunidade Tradicional', eixoPrincipal: 'Eixo 1',
    classificacao: 'Projeto Estruturante', localizacao: 'Portel', municipio: 'Portel', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Manejo comunitário em Portel.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Manejo territorial e restauração agroflorestal',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'ATAIC — Associação de Trabalhadores Agroextrativistas',
    responsavelTecnico: '', segmentoSocial: 'Comunidade Tradicional', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'Operação via Macapá/Santana', municipio: 'Macapá', uf: 'AP',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento agroextrativista.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'COOPAFS — Santarém',
    responsavelTecnico: '', segmentoSocial: 'Agricultura Familiar', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'Santarém', municipio: 'Santarém', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Cadeia produtiva de agricultores familiares em Santarém.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'AIKATUK — Oriximiná',
    responsavelTecnico: '', segmentoSocial: 'Indígena', eixoPrincipal: 'Eixo 2',
    classificacao: 'Projeto Estruturante', localizacao: 'Oriximiná', municipio: 'Oriximiná', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento indígena em Oriximiná.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Fortalecimento produtivo e organizacional territorial',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'Associação Mebengokre Yte Kayapo',
    responsavelTecnico: '', segmentoSocial: 'Indígena', eixoPrincipal: 'Eixo 2',
    classificacao: 'Projeto Estruturante', localizacao: 'Redenção', municipio: 'Redenção', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Fortalecimento indígena Mebengokre.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Fortalecimento produtivo e organizacional territorial',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
  {
    nome: 'ACREPAF — Jacundá',
    responsavelTecnico: '', segmentoSocial: 'Comunidade Tradicional', eixoPrincipal: 'Eixo 3',
    classificacao: 'Projeto Estruturante', localizacao: 'Jacundá', municipio: 'Jacundá', uf: 'PA',
    financiador: 'INOVA FAS/FUNBIO', objetivo: 'Cadeia produtiva tradicional em Jacundá.',
    valorTotal: 164285.71, formaRepasse: 'Parcela Única', statusRepasse: 'A definir', dataRepasse: '',
    inicioPrevisto: '01/2026', finalPrevisto: '12/2026', status: 'Ativa',
    categoriasTematicas: 'Alimentos e bebidas da sociobiodiversidade',
    compradores: '', garantiaVenda: '', destinacao: '',
    totalBeneficiadosDiretos: 0, totalBeneficiadosIndiretos: 0, receitaFaixa: '',
    detalhamento: '', justificativa: '', produtoTexto: '',
  },
];

export const comunidades: Comunidade[] = RAW.map((c, i) => ({
  ...c,
  id: i + 1,
  code: `${String(i + 1).padStart(2, '0')}-2026`,
  pessoas: [],
  infraestrutura: '',
  certificacao: '',
  fornecedores: [],
  capacitacoes: [],
  territorio: '',
  produtos: [],
  projectId: null,
}));
