import { QUESTOES_CRIA, OPERACAO_CRIA, FUNCOES_GUIA_CRIA } from './cadernoCriaDados';
export { QUESTOES_CRIA, OPERACAO_CRIA, FUNCOES_GUIA_CRIA };
export const REVISAO_CADERNO = '22/10/2026';
export interface ItemCaderno {
  codigo: string; texto: string; grupo: string; pagina: number;
  tipo: 'texto' | 'unica' | 'multipla' | 'escala';
  opcoes?: { valor: string; descricao: string }[];
  orientacao?: string; aprofundar?: string;
}
const opcoes = (...nomes: string[]) => nomes.map(n => ({ valor: n, descricao: n }));
const especiais = [{ valor: 'NS', descricao: 'Não sabe informar' }, { valor: 'NC', descricao: 'Não coletado' }, { valor: 'NA', descricao: 'Não se aplica — justificar' }, { valor: 'D', descricao: 'Divergência — registrar diferenças' }];
export const QUESTIONARIO_CADERNO: ItemCaderno[] = QUESTOES_CRIA.map(q => ({ ...q, grupo: q.publico, tipo: 'escala', opcoes: [...q.niveis, ...especiais] }));
export const AVALIACOES_OPERACAO: ItemCaderno[] = OPERACAO_CRIA.map(q => ({ ...q, grupo: 'Avaliação da operação', tipo: 'escala', opcoes: [...q.niveis, ...especiais, { valor: 'H', descricao: 'Heterogênea — registrar diferenças' }] }));
const texto = (codigo: string, pergunta: string, grupo: string, pagina: number): ItemCaderno => ({ codigo, texto: pergunta, grupo, pagina, tipo: 'texto' });
export const IDENTIFICACAO_CADERNO: ItemCaderno[] = [texto('ID01', 'Nome e Sigla', 'Identificação', 1), { ...texto('ID02', 'Autodefinição da organização', 'Identificação', 1), tipo: 'unica', opcoes: opcoes('Cooperativa', 'Associação') }, texto('ID03', 'Aplicador', 'Identificação', 1)];
export const COMPLEMENTARES_CADERNO: ItemCaderno[] = [
  texto('P01', 'Quais três capacidades precisam fortalecer? O que seria sucesso ao final do projeto?', 'Presidente', 27),
  texto('P02', 'Quais parceiros, redes e espaços de representação são essenciais? Registrar contribuição, frequência e dependências.', 'Presidente', 27),
  texto('D01', 'Quais são os principais gargalos e tentativas de solução? Quais grupos participam menos ou não acessam serviços?', 'Diretoria', 27),
  texto('D02', 'Como funcionam cadastro, documentos e controles? O que está em atualização ou implantação?', 'Diretoria', 27),
  texto('T01', 'Quais receitas, contribuições, reservas e recursos vinculados existem? Quais custos e necessidades de capital de giro?', 'Tesoureiro / responsável financeiro', 28),
  texto('T02', 'Há apoio contábil/jurídico e auditorias? Quem acompanha? Como definem descontos, prazos, repasses e destinação de sobras/perdas?', 'Tesoureiro / responsável financeiro', 28),
  texto('S01', 'O que a organização faz de mais útil? Quem enfrenta dificuldades para participar, receber informações ou acessar serviços?', 'Sócios/cooperados', 28),
  texto('S02', 'Vocês conseguem conferir contas, entregas e pagamentos? Relatar experiências diferentes e melhorias desejadas.', 'Sócios/cooperados', 28),
  texto('E01', 'Qual papel a organização deseja fortalecer para seus membros e território?', 'Fechamento estratégico', 29),
  texto('E02', 'Quais capacidades precisam ser preservadas?', 'Fechamento estratégico', 29),
  texto('E03', 'Que funções deseja executar diretamente e quais deseja viabilizar com outros?', 'Fechamento estratégico', 29),
  ...[1, 2, 3].map(n => texto(`PRIO${n}`, 'Prioridade e função/produto relacionado. Mudança desejada, obstáculo inicial, apoio necessário, responsável e prazo quando conhecidos.', 'Prioridades pactuadas', 29)),
  texto('ANOTACOES', 'Código da pergunta/função/produto, público/grupo, continuação da página e relato original ou observação. Identificar quem informou e o que foi observado.', 'Anotações complementares', 31),
];
export const EVIDENCIAS_CADERNO: ItemCaderno[] = ['Estatuto vigente', 'Ata de eleição/posse', 'Atas recentes', 'Cadastro de membros', 'Planejamento/plano de trabalho', 'Prestação de contas', 'Registros de operações e repasses', 'Demonstrativos financeiros'].map((n, i) => ({ ...texto(`EV0${i + 1}`, n, 'Evidências e pendências', 30), tipo: 'unica', opcoes: opcoes('Consultado', 'Relatado', 'Não apresentado', 'N/A'), orientacao: 'Registrar referência, data, código relacionado, limites ou justificativa. Falta de documento não prova ausência de prática.' }));
export const PERFIL_CESTA: ItemCaderno[] = [
  texto('CP01', 'Quem realiza e qual é o papel da organização? Tipo de produto, cadeia e forma de oferta/processamento.', 'Perfil do produto ou serviço', 33),
  texto('CP02', 'Importância econômica, social, cultural ou territorial. Diferenciais e características desejadas.', 'Perfil do produto ou serviço', 33),
  { ...texto('CP03', 'Interesse. Registrar membros atuantes, se conhecido, fonte e período no relato.', 'Perfil do produto ou serviço', 33), tipo: 'unica', opcoes: [{ valor: '1', descricao: 'Sem interesse' }, { valor: '2', descricao: 'Baixo' }, { valor: '3', descricao: 'Médio' }, { valor: '4', descricao: 'Alto' }] },
  { ...texto('CP04', 'Sazonalidade. Meses de pico, regularidade, entressafra e meses desconhecidos.', 'Perfil do produto ou serviço', 33), tipo: 'unica', opcoes: opcoes('Contínua', 'Sazonal', 'Não informado') },
  texto('CP05', 'Disponibilidade para venda/serviço difere da produção? Estoques ou restrições conhecidas.', 'Perfil do produto ou serviço', 34),
  texto('CP06', 'Canais e compradores atuais e pretendidos. Recorrência, acordos e método de formação do preço.', 'Perfil do produto ou serviço', 34),
  texto('CP07', 'Marca, embalagem, código de barras, selos/reconhecimentos e diferenciais. Situação conhecida.', 'Perfil do produto ou serviço', 34),
  { ...texto('CP08', 'Limitações produtivas. Detalhar período e produtos/grupos afetados.', 'Dificuldades e condições', 41), tipo: 'multipla', opcoes: opcoes('Insumos', 'Equipamentos', 'Infraestrutura', 'Energia', 'Água', 'Refrigeração', 'Armazenamento', 'Trabalho', 'Assistência', 'Capital de giro', 'Licenças', 'Clima', 'Demanda', 'Nenhuma identificada', 'NI', 'Outra') },
  { ...texto('CP09', 'Dificuldades comerciais. Detalhar período e produtos/grupos afetados.', 'Dificuldades e condições', 41), tipo: 'multipla', opcoes: opcoes('Preço', 'Compradores', 'Volume', 'Padrão', 'Marca', 'Embalagem', 'Rótulo', 'Nota fiscal', 'Regularização', 'Logística', 'Capital de giro', 'Nenhuma identificada', 'NI', 'Outra') },
  { ...texto('CP10', 'Eventos climáticos nos últimos três anos. Detalhar período e produtos/grupos afetados.', 'Dificuldades e condições', 42), tipo: 'multipla', opcoes: opcoes('Seca', 'Excesso de chuva', 'Cheia ou vazante atípica', 'Calor', 'Ventos', 'Incêndios', 'Alteração de safra', 'Nenhum identificado', 'NI', 'Outro') },
  texto('CP11', 'Efeitos concretos e medidas adotadas. Distinguir ocorrência de causa climática não verificada.', 'Dificuldades e condições', 42),
  texto('CP12', 'Infraestrutura: qual, de quem, condição e acesso. Logística: rota, transporte, refrigeração e frequência possível.', 'Dificuldades e condições', 42),
  texto('CP13', 'Exigências sanitárias, ambientais, fiscais ou de rotulagem conhecidas. Qual, situação, prazo e fonte da informação.', 'Triagem e informações adicionais', 43),
  texto('CP14', 'Necessidade de análise laboratorial, controle de lote/validade e verificação técnica. Pendências e responsável pelo encaminhamento.', 'Triagem e informações adicionais', 43),
  texto('CP15', 'Resíduos e destinação. Riscos/impactos ambientais e medidas adotadas.', 'Triagem e informações adicionais', 43),
  texto('CP16', 'Espécie nativa: Sim / Não / NI. Conhecimento tradicional: Sim / Não / Possivelmente / NI. Descrever e identificar detentores quando pertinente.', 'Triagem e informações adicionais', 44),
  texto('CP17', 'Já receberam orientação sobre PGCT/SisGen/CGen? Qual atividade requer triagem? Registrar dúvida e encaminhamento.', 'Triagem e informações adicionais', 44),
  { ...texto('CP18', 'O preço cobre custos? Informar base, canal e período.', 'Triagem e informações adicionais', 45), tipo: 'unica', opcoes: opcoes('Informação insuficiente', 'Não', 'Algumas condições', 'Sim', 'N/A') },
  texto('CP19', 'Dados disponíveis: indicador, valor, unidade, período, fonte e produto. Ex.: perdas, volume, custos, vendas ou compradores.', 'Triagem e informações adicionais', 45),
];
export const PORTFOLIO_CESTA: ItemCaderno[] = [
  texto('PR_CODIGO', 'Código do produto/serviço (PR01, PR02...)', 'Lista do portfólio', 32),
  texto('PR_OPERACAO', 'Código da operação (OP01, OP02...)', 'Lista do portfólio', 32),
  { ...texto('PR_SITUACAO', 'Situação do produto/serviço', 'Lista do portfólio', 32), tipo: 'unica', opcoes: opcoes('Funcionamento', 'Implantação', 'Futuro') },
  { ...texto('PR_PAPEL', 'Papel da organização', 'Lista do portfólio', 32), tipo: 'unica', opcoes: opcoes('Executa', 'Viabiliza', 'Não participa') },
];
export const IMPLANTACAO_CADERNO: ItemCaderno[] = ['Pessoas e responsabilidades', 'Instalações e equipamentos', 'Matéria-prima ou condições de serviço', 'Procedimentos de operação e qualidade', 'Custos e recursos para funcionamento', 'Mercado ou público pretendido', 'Exigências técnicas e regularização'].map((n, i) => ({ ...texto(`IM0${i + 1}`, n, 'Preparação da implantação', 46), tipo: 'unica', opcoes: opcoes('Disponível', 'Em andamento', 'Ainda não iniciado', 'Não informado', 'N/A'), orientacao: 'Registrar o que existe, o que falta, próximo passo e responsável. A preparação é registrada por operação; não atribuir nota.' }));
export const AVALIACAO_MATRIZ_CADERNO: ItemCaderno[] = Array.from({ length: 21 }, (_, i) => ({ codigo: `F${String(i + 1).padStart(2, '0')}`, texto: 'Avaliação do atendimento da necessidade e acompanhamento', grupo: 'Matriz Funcional', pagina: 2, tipo: 'escala', opcoes: [{ valor: '1', descricao: 'Não atende: a necessidade não é atendida.' }, { valor: '2', descricao: 'Atende parcialmente: há atendimento, mas persistem lacunas importantes.' }, { valor: '3', descricao: 'Atende com limitações pontuais: a necessidade é atendida regularmente, com aspectos específicos a melhorar.' }, { valor: '4', descricao: 'Atende satisfatoriamente: o atendimento é satisfatório e contínuo, com resultados verificados.' }, { valor: 'NA', descricao: 'Não se aplica — registrar motivo.' }, { valor: 'NC', descricao: 'Não avaliado — faltam informações ou evidências suficientes.' }], orientacao: 'Fundamentar em Observação. Leitura e Avaliação são independentes. Recorrência não gera nota 4 automaticamente. Não converter avaliações antigas.' }));
export const ITENS_CADERNO = [...IDENTIFICACAO_CADERNO, ...QUESTIONARIO_CADERNO, ...COMPLEMENTARES_CADERNO, ...EVIDENCIAS_CADERNO, ...PORTFOLIO_CESTA, ...PERFIL_CESTA, ...AVALIACOES_OPERACAO, ...IMPLANTACAO_CADERNO, ...AVALIACAO_MATRIZ_CADERNO];
