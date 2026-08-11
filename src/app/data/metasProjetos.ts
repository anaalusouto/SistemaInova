import type { Goal } from './mockData';

/** Metas/Etapas/Especificações extraídas do Cronograma de Execução Física de cada plano de trabalho. */
export const metasProjetos: Record<number, Goal[]> = {
  1: [
    { id: 1001, name: `1. Implantar a geleira comunitária com energia orçamento elétrica`, deliverables: [
      { id: 100101, name: `1.1 Levantamento e Cotação com, pelo menos, de 3 fornecedores de equipamentos equipamentos de refrigeração e de en…`, expectedResult: `Levantamento e Cotação com, pelo menos, de 3 fornecedores de equipamentos equipamentos de refrigeração e de energia elétrica.`, activities: [
        { id: 1001011, name: `Especificação — Levantamento e Cotação com, pelo menos, de 3 fornecedores de equipamentos equipamentos de…`, responsible: ``, plannedDate: `Dez/2025–Dez/2025`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Orçamentos e propostas` },
      ] },
      { id: 100102, name: `1.2 Aquisição Compra da máquina de fazer gelo e de todos os equipamentos equipamentos necessários para a ligação e…`, expectedResult: `Aquisição Compra da máquina de fazer gelo e de todos os equipamentos equipamentos necessários para a ligação elétrica`, activities: [
        { id: 1001021, name: `Especificação — Aquisição Compra da máquina de fazer gelo e de todos os equipamentos equipamentos necessár…`, responsible: ``, plannedDate: `Dez/2025–Jan/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas fiscais` },
      ] },
      { id: 100103, name: `1.3 Manutenção do Manutenção espaço de infraestrutura do espaço de instalação da máquina implantação da geleira co…`, expectedResult: `Manutenção do Manutenção espaço de infraestrutura do espaço de instalação da máquina implantação da geleira com mão de obra local`, activities: [
        { id: 1001031, name: `Especificação — Manutenção do Manutenção espaço de infraestrutura do espaço de instalação da máquina impla…`, responsible: ``, plannedDate: `Jan/2026–Fev/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório da reforma, notas fiscais de materiais, fotos` },
      ] },
      { id: 100104, name: `1.4 Contratação de Instalação da rede técnico para instalação da rede elétrica`, expectedResult: `Contratação de Instalação da rede técnico para instalação da rede elétrica`, activities: [
        { id: 1001041, name: `Especificação — Contratação de Instalação da rede técnico para instalação da rede elétrica`, responsible: ``, plannedDate: `Fev/2026–Mar/2025`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatórios de instalação, fotos` },
      ] },
      { id: 100105, name: `1.5 Testes e Realização de testes Relatório de comissionamento operacionais para garantir o do sistema funcionamen…`, expectedResult: `Testes e Realização de testes Relatório de comissionamento operacionais para garantir o do sistema funcionamento adequado da geleira.`, activities: [
        { id: 1001051, name: `Especificação — Testes e Realização de testes Relatório de comissionamento operacionais para garantir o do…`, responsible: ``, plannedDate: `Mar/2025–Mar/2025`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 1002, name: `2. Capacitar pescadores em boas práticas, gestão profissional e comercialização`, deliverables: [
      { id: 100201, name: `2.1 Contratação de Realizar o contrato com um profissional para engenheiro de capacitações e serviços pesca ou bió…`, expectedResult: `Contratação de Realizar o contrato com um profissional para engenheiro de capacitações e serviços pesca ou biólogo com experiência em recursos pesqueiros e profissional de Administração).`, activities: [
        { id: 1002011, name: `Especificação — Contratação de Realizar o contrato com um profissional para engenheiro de capacitações e s…`, responsible: ``, plannedDate: `Jan/2026–Jan/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100202, name: `2.2 Elaboração do Desenvolvimento de material didático e conteúdo programático e plano de curso materiais para as…`, expectedResult: `Elaboração do Desenvolvimento de material didático e conteúdo programático e plano de curso materiais para as capacitações.`, activities: [
        { id: 1002021, name: `Especificação — Elaboração do Desenvolvimento de material didático e conteúdo programático e plano de curs…`, responsible: ``, plannedDate: `Jan/2026–Fev/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100203, name: `2.3 Realização de 2 oficinas de 20 horas cada oficinas de boas para 40 pescadores. práticas de manuseio do pescado`, expectedResult: `Realização de 2 oficinas de 20 horas cada oficinas de boas para 40 pescadores. práticas de manuseio do pescado`, activities: [
        { id: 1002031, name: `Especificação — Realização de 2 oficinas de 20 horas cada oficinas de boas para 40 pescadores. práticas de…`, responsible: ``, plannedDate: `Mar/2026–Abr/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100204, name: `2.4 . Realização de 2 oficinas de 20 horas cada oficinas de gestão para 40 pescadores. e comercialização`, expectedResult: `. Realização de 2 oficinas de 20 horas cada oficinas de gestão para 40 pescadores. e comercialização`, activities: [
        { id: 1002041, name: `Especificação — . Realização de 2 oficinas de 20 horas cada oficinas de gestão para 40 pescadores. e comer…`, responsible: ``, plannedDate: `Mai/2026–Jun/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 1003, name: `3. Fortalecer a organização comunitária Desenvolvimento estratégico para a gestão e e ampliar o acesso a mercados`, deliverables: [
      { id: 100301, name: `3.1 Elaboração de um plano de plano de comercialização do negócios pescado. comunitário`, expectedResult: `Elaboração de um plano de plano de comercialização do negócios pescado. comunitário`, activities: [
        { id: 1003011, name: `Especificação — Elaboração de um plano de plano de comercialização do negócios pescado. comunitário`, responsible: ``, plannedDate: `Mai/2026–Jul/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100302, name: `3.2 Prospecção de Identificação e contato com novos mercados e potenciais compradores e parcerias parceiros comerc…`, expectedResult: `Prospecção de Identificação e contato com novos mercados e potenciais compradores e parcerias parceiros comerciais.`, activities: [
        { id: 1003021, name: `Especificação — Prospecção de Identificação e contato com novos mercados e potenciais compradores e parcer…`, responsible: ``, plannedDate: `Mai/2026–Jul/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100303, name: `3.3 Participação Participação em 2 feiras em feiras e eventos regionais para divulgação e de comercialização venda…`, expectedResult: `Participação Participação em 2 feiras em feiras e eventos regionais para divulgação e de comercialização venda do pescado`, activities: [
        { id: 1003031, name: `Especificação — Participação Participação em 2 feiras em feiras e eventos regionais para divulgação e de c…`, responsible: ``, plannedDate: `Abri/2026–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 1004, name: `4. Monitorar e Avaliar os Resultados do Projeto e acompanhamento mensais para registrar produção, vendas e participação em oficinas. Jovens da…`, deliverables: [
      { id: 100401, name: `4.1 Definição de Será elaborado um indicadores de conjunto de indicadores desempenho quantitativos e qualitativos,…`, expectedResult: `Definição de Será elaborado um indicadores de conjunto de indicadores desempenho quantitativos e qualitativos, como: quantidade de gelo produzido, número de pescadores capacitados, volume de pescado comercializado e participação em reuniões comunitárias. A atividade será realizada em 7 dias, com apoio de um consultor e lideranças da ACREPAF. Documento consolidado com indicadores definidos`, activities: [
        { id: 1004011, name: `Especificação — Definição de Será elaborado um indicadores de conjunto de indicadores desempenho quantitat…`, responsible: ``, plannedDate: `Jan/2026–Jan/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100402, name: `4.2 Criação de Desenvolvimento de sistema de registro planilhas e relatórios implantado`, expectedResult: `Criação de Desenvolvimento de sistema de registro planilhas e relatórios implantado`, activities: [
        { id: 1004021, name: `Especificação — Criação de Desenvolvimento de sistema de registro planilhas e relatórios implantado`, responsible: ``, plannedDate: `Jan/2026–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100403, name: `4.3 Reuniões 02 Abr/2026 Out/2026`, expectedResult: `Reuniões 02 Abr/2026 Out/2026`, activities: [
        { id: 1004031, name: `Especificação — Reuniões 02 Abr/2026 Out/2026`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100404, name: `4.4 Relatório final 01 Out/2026 Dez/2026 produzido e validado`, expectedResult: `Relatório final 01 Out/2026 Dez/2026 produzido e validado`, activities: [
        { id: 1004041, name: `Especificação — Relatório final 01 Out/2026 Dez/2026 produzido e validado`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  2: [
    { id: 2001, name: `1. Fortalecer a organização da cooperativa.`, deliverables: [
      { id: 200101, name: `1.1 Realizar uma reunião entre as comunidades para reunião de 2 dias para Beneficiadas, cooperativa informar e pla…`, expectedResult: `Realizar uma reunião entre as comunidades para reunião de 2 dias para Beneficiadas, cooperativa informar e planejar as etapas que e MALUNGU; serão realizadas no projeto. Total de 50 famílias, sendo 25 de cada comunidade, mais coordenação da cooperativa (16 pessoas) coordenação da MALUNGU (05 pessoas irão participar). Elaboração da planta BAIXA do`, activities: [
        { id: 2001011, name: `Especificação — Realizar uma reunião entre as comunidades para reunião de 2 dias para Beneficiadas, cooper…`, responsible: ``, plannedDate: `Mês/01–Mês/01`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `2. Lista de participantes; 3. Registros fotográficos; Entrega/recebimento` },
      ] },
    ] },
    { id: 2002, name: `2. Elaboração de projeto básico;`, deliverables: [
      { id: 200201, name: `2.1 Cotação de preço e escolha do projeto de Espaço. arquitetura.`, expectedResult: `Área do Espaço 67,08m²`, activities: [
        { id: 2002011, name: `Especificação — Área do Espaço 67,08m²`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `do projeto da planta baixa pelo contratado.` },
      ] },
    ] },
    { id: 2003, name: `3. Contratação de empresa para construção da agroindústria;`, deliverables: [
      { id: 200301, name: `3.1 Seleção da PJ para Envio de carta convite para execução da infraestrutura seleção da empresa para executar da…`, expectedResult: `Contrato Contrato`, activities: [
        { id: 2003011, name: `Especificação — Contrato Contrato`, responsible: ``, plannedDate: `Mês/01–Mês/01`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Disponibilização da carta convite enviada às empresas convidadas. Disponibilização do` },
      ] },
      { id: 200302, name: `3.3 Contratação do PJ Assinatura do contrato`, expectedResult: `Contrato`, activities: [
        { id: 2003021, name: `Especificação — Contrato`, responsible: ``, plannedDate: `Mês/02–Mês/02`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200303, name: `3.4 Construção da estrutura Atividade de mão de obra pela da agroindústria PJ contratada. 30 dias de mão de obra.`, expectedResult: `Contrato`, activities: [
        { id: 2003031, name: `Especificação — Contrato`, responsible: ``, plannedDate: `Mês/03–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2004, name: `4. Compra de material para construção da infraestrutura.`, deliverables: [
      { id: 200401, name: `4.1 Cotação de preços Análise financeira dos custo benefício técnica para otimizar os recursos do orçamento.`, expectedResult: `pela coordenação Avaliação`, activities: [
        { id: 2004011, name: `Especificação — pela coordenação Avaliação`, responsible: ``, plannedDate: `Mês/02–Mês/02`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200402, name: `4.2 Escolha do orçamento A decisão se dará pelo custo Orçamento benefício para otimizar o recurso.`, expectedResult: `Escolha do orçamento A decisão se dará pelo custo Orçamento benefício para otimizar o recurso.`, activities: [
        { id: 2004021, name: `Especificação — Escolha do orçamento A decisão se dará pelo custo Orçamento benefício para otimizar o recu…`, responsible: ``, plannedDate: `Mês/02–Mês/02`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200403, name: `4.3 Compra do material Duas pessoas realizarão a compra Unidade/quali dos materiais.`, expectedResult: `Compra do material Duas pessoas realizarão a compra Unidade/quali dos materiais.`, activities: [
        { id: 2004031, name: `Especificação — Compra do material Duas pessoas realizarão a compra Unidade/quali dos materiais.`, responsible: ``, plannedDate: `Mês/02–Mês/02`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas fiscais da compra` },
      ] },
    ] },
    { id: 2005, name: `5. Compra de equipamentos (maquinário)`, deliverables: [
      { id: 200501, name: `5.1 Cotação dos preços dos Fazer cotação em três empresas Orçamento equipamentos. diferentes os valores dos equipa…`, expectedResult: `Cotação dos preços dos Fazer cotação em três empresas Orçamento equipamentos. diferentes os valores dos equipamentos.`, activities: [
        { id: 2005011, name: `Especificação — Cotação dos preços dos Fazer cotação em três empresas Orçamento equipamentos. diferentes o…`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Orçamentos da cotação` },
      ] },
      { id: 200502, name: `5.2 Escolha do orçamento Análise financeira dos custo benefício técnica para otimizar os recursos do orçamento.`, expectedResult: `pela coordenação Avaliação`, activities: [
        { id: 2005021, name: `Especificação — pela coordenação Avaliação`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200503, name: `5.3 Compra dos Duas pessoas realizarão a compra Equipamentos equipamentos dos materiais.`, expectedResult: `Compra dos Duas pessoas realizarão a compra Equipamentos equipamentos dos materiais.`, activities: [
        { id: 2005031, name: `Especificação — Compra dos Duas pessoas realizarão a compra Equipamentos equipamentos dos materiais.`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2006, name: `6. Instalação dos equipamentos 7. Formação técnica`, deliverables: [
      { id: 200601, name: `6.1 Cotação de PJ Fazer cotação em três empresas diferentes os valores dos equipamentos.`, expectedResult: `Orçamento`, activities: [
        { id: 2006011, name: `Especificação — Orçamento`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200602, name: `6.2 Escolha do orçamento Análise coordenação financeira dos custo benefício para otimizar os recursos do orçamento…`, expectedResult: `e seleção pela Orçamento`, activities: [
        { id: 2006021, name: `Especificação — e seleção pela Orçamento`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `orçamento selecionado.` },
      ] },
      { id: 200603, name: `6.3 Contratação do PJ e Assinatura do contrato assinatura do contrato. Contratação de um Formação que irá abranger…`, expectedResult: `Contrato Assessoria`, activities: [
        { id: 2006031, name: `Especificação — Contrato Assessoria`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `assinado` },
      ] },
    ] },
    { id: 2007, name: `7. Meta 7`, deliverables: [
      { id: 200701, name: `7.2 Realização das Das 60 pessoas em formação, 30 Formações formações e capacitações serão mulheres, 15 jovens e 1…`, expectedResult: `Realização das Das 60 pessoas em formação, 30 Formações formações e capacitações serão mulheres, 15 jovens e 15 homens adultos.`, activities: [
        { id: 2007011, name: `Especificação — Realização das Das 60 pessoas em formação, 30 Formações formações e capacitações serão mul…`, responsible: ``, plannedDate: `Mês/05–Mês/06`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200702, name: `7.3 Entrega de certificados No final será entregue das capacitações executadas certificados aos participantes e e…`, expectedResult: `Certificado,`, activities: [
        { id: 2007021, name: `Especificação — Certificado,`, responsible: ``, plannedDate: `Mês/05–Mês/06`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2008, name: `8. Prática do manejo sustentável nas áreas das famílias atendidas pelo projeto.`, deliverables: [
      { id: 200801, name: `8.1 Atividade em campo Atividade prática de 5 dias em acompanhada pelo técnico campo com as 60 pessoas. nas áreas…`, expectedResult: `Formações`, activities: [
        { id: 2008011, name: `Especificação — Formações`, responsible: ``, plannedDate: `Mês/05–Mês/06`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200802, name: `8.2 Produção de viveiro Na atividade prática de manejo tradicional de espécies de será construído o viveiro frutas…`, expectedResult: `Formação`, activities: [
        { id: 2008021, name: `Especificação — Formação`, responsible: ``, plannedDate: `Mês/05–Mês/06`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2009, name: `9. Entrega da agroindústria às comunidades.`, deliverables: [
      { id: 200901, name: `9.1 Assembleia entre as A assembleia contará com duas comunidades, aproximadamente 300 famílias coordenação da coo…`, expectedResult: `Assembleia`, activities: [
        { id: 2009011, name: `Especificação — Assembleia`, responsible: ``, plannedDate: `Mês/07–Mês/07`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2010, name: `10. 10 . Solicitação para Regularização e certificação agroindústria de selo artesanal da agroindústria na ADEPARÁ será de responsabilidade da`, deliverables: [
      { id: 201001, name: `10.1 Após entrega da A cooperativa acompanhará todo as processo de regularização e comunidades e cooperativa, certi…`, expectedResult: `Reunião`, activities: [
        { id: 2010011, name: `Especificação — Reunião`, responsible: ``, plannedDate: `Mês/08–Mês/08`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  3: [
    { id: 3001, name: `1. Construção e equipagem de 3 casas construção das casas do artesanato Tembé`, deliverables: [
      { id: 300101, name: `1.1 Contratação das três Serão contratados 3 indígenas para atuarem coordenações indígenas como coordenadores das…`, expectedResult: `03 contratos 03 assinados`, activities: [
        { id: 3001011, name: `Especificação — 03 contratos 03 assinados`, responsible: ``, plannedDate: `Mês 1–Mês 12`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `recibos de pagamento de diárias` },
      ] },
      { id: 300102, name: `1.2 realizar 3 reuniões de Os três coordenadores indígenas mobilização comunitária organizarão e farão as 3 reuniõ…`, expectedResult: `Reunião 03`, activities: [
        { id: 3001021, name: `Especificação — Reunião 03`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `ATA e Lista de Frequência e relatório das reuniões.` },
      ] },
      { id: 300103, name: `1.3 Contratação de A AMIG vai contratar um arquiteto para profissional para fazer o elaborar as plantas e projeto…`, expectedResult: `Projeto 02`, activities: [
        { id: 3001031, name: `Especificação — Projeto 02`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato para 1 projeto arquitetônico elaborado, casa do artesanato 8x8 metros 1 projeto arquitetônico de reforma de espaço 12x12 metros.` },
      ] },
      { id: 300104, name: `1.4 Contratação de equipe Serão contratadas 3 equipes de de construção profissionais para realização da construção…`, expectedResult: `Contrato 03`, activities: [
        { id: 3001041, name: `Especificação — Contrato 03`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório de execução das construção das casas de artesanato do Povo Tembé. Recibo de pagamento das diárias de serviços da equipe construção das casas.` },
      ] },
      { id: 300105, name: `1.6 Deslocamento do A AMIG vai ter que fretar caminhão para Nota Fiscal do Material comprado em transportar os mat…`, expectedResult: `Deslocamento do A AMIG vai ter que fretar caminhão para Nota Fiscal do Material comprado em transportar os materiais e equipamentos para as Frete aldeias beneficiadas pelo projeto Paragominas para as aldeias As obras vão ser realizadas pela equipe de Casa construída`, activities: [
        { id: 3001051, name: `Especificação — Deslocamento do A AMIG vai ter que fretar caminhão para Nota Fiscal do Material comprado e…`, responsible: ``, plannedDate: `Mês 3–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `recibo/nota fiscal de pagamento do frete` },
      ] },
      { id: 300106, name: `1.7 Execução das obras. construção formada por integrantes não indígenas e indígena. No caso os indígenas não domi…`, expectedResult: `Execução das obras. construção formada por integrantes não indígenas e indígena. No caso os indígenas não dominam as técnicas de construção com tijolos e azulejos, mas optamos por estes materiais pela questão da durabilidade.`, activities: [
        { id: 3001061, name: `Especificação — Execução das obras. construção formada por integrantes não indígenas e indígena. No caso o…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `das obras.` },
      ] },
      { id: 300107, name: `1.8 Compra de a AMIG vai realizar a compra de 12 kit equipamentos e materiais artesanatos (03 para cada casa de ar…`, expectedResult: `Kits de`, activities: [
        { id: 3001071, name: `Especificação — Kits de`, responsible: ``, plannedDate: `Mês 5–Mês 7`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `entrega.` },
      ] },
      { id: 300108, name: `1.9 Inauguração das A AMIG irá realizar a solenidade de Placas de Casas de Artesanato e inauguração da casa. Iremo…`, expectedResult: `negócios elaborado de`, activities: [
        { id: 3001081, name: `Especificação — negócios elaborado de`, responsible: ``, plannedDate: `Mês 8–Mês 8`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `das Casas oficinas` },
      ] },
    ] },
    { id: 3002, name: `3. Formação de jovens indígenas em mídias digitais`, deliverables: [
      { id: 300201, name: `3.1 realizar 01 oficina de Será realizada uma oficina sobre mídias jovens formados mídias digitais e digitais para…`, expectedResult: `em mídias digitais`, activities: [
        { id: 3002011, name: `Especificação — em mídias digitais`, responsible: ``, plannedDate: `Mês 10–Mês 10`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Oficina` },
      ] },
    ] },
    { id: 3003, name: `4. Produção do site de venda do artesanato e biojoias produzidas nas casas de artesanato`, deliverables: [
      { id: 300301, name: `4.1 contratar empresa O projeto irá contratar um empresa de site e instagram para produção de site comunicação e p…`, expectedResult: `criados ATA das reuniões`, activities: [
        { id: 3003011, name: `Especificação — criados ATA das reuniões`, responsible: ``, plannedDate: `Mês 7–Mês 11`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato assinado com a empresa` },
      ] },
    ] },
  ],
  4: [
    { id: 4001, name: `1. Contratação de prestadores de serviço para equipe central do projeto`, deliverables: [
      { id: 400101, name: `1.1 Coordenação do projeto`, expectedResult: `Contrato 1 contrato relatórios, fotos, pelo planejamento e gestão do mês de mês de assinado assinado comprovantes de projeto, no período de 12 execução do execução do pagamento. meses. projeto projeto Contratação de 1 gestor(a) Primeiro dia, Vigésimo dia, Contrato, para organizar planilhas, do primeiro do primeiro Contrato 1 contrato relatórios, fotos,`, activities: [
        { id: 4001011, name: `Especificação — Contrato 1 contrato relatórios, fotos, pelo planejamento e gestão do mês de mês de assinad…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400102, name: `1.2 Gestão financeira`, expectedResult: `relatórios e prestação de mês de mês de assinado assinado comprovantes de contas, no período de 12 execução do execução do pagamento. meses projeto projeto Contratação de 2 monitoras Primeiro dia, Vigésimo dia, Contrato, locais para assistência do primeiro do primeiro Contrato 1 contrato relatórios, fotos,`, activities: [
        { id: 4001021, name: `Especificação — relatórios e prestação de mês de mês de assinado assinado comprovantes de contas, no perío…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400103, name: `1.3 Monitoras`, expectedResult: `contínua às famílias mês de mês de assinado assinado comprovantes de beneficiárias e apicultores, no execução do execução do pagamento. período de 12 meses projeto projeto Contratação de 1 relator, Contrato, Primeiro dia, Vigésimo dia, responsável por produzir 3 Contrato 1 contrato relatórios, fotos,`, activities: [
        { id: 4001031, name: `Especificação — contínua às famílias mês de mês de assinado assinado comprovantes de beneficiárias e apicu…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400104, name: `1.4 Relatoria Contratação de 1 social media, responsável por produzir conteúdo para as mídias`, expectedResult: `do primeiro do primeiro relatórios parciais e 1 assinado assinado comprovantes de mês de mês de relatório final, no período de 12 pagamento. meses execução do execução do projeto projeto Primeiro dia, Vigésimo dia, Contrato, do primeiro do primeiro Contrato 1 contrato relatórios, fotos,`, activities: [
        { id: 4001041, name: `Especificação — do primeiro do primeiro relatórios parciais e 1 assinado assinado comprovantes de mês de m…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400105, name: `1.5 Social Media digitais da ADESC/PA, destacando o patrocínio, no período de 12 meses Fornecimento de Kit apícola…`, expectedResult: `mês de mês de assinado assinado comprovantes de execução do execução do pagamento. projeto projeto Primeiro dia, Último dia,`, activities: [
        { id: 4001051, name: `Especificação — mês de mês de assinado assinado comprovantes de execução do execução do pagamento. projeto…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4002, name: `2. Aquisição de equipamentos e insumos ferramentas agrícolas`, deliverables: [
      { id: 400201, name: `2.1 Kits comunitários de indumentária desorpeculador, 2 caixas de apícola colmeia), assegurando condições adequada…`, expectedResult: `fumigador, 1 garfo do primeiro do primeiro Recibos e notas Kit 4 kits mês de mês de fiscais. execução do execução do projeto projeto abelhas. Primeiro dia, Último dia, do primeiro do primeiro projeto projeto certificado de comercialização, por família, precificação e marketing por oficina) comunitário. Contrato 11º dia, do 2º Último dia, assinado, nota`, activities: [
        { id: 4002011, name: `Especificação — fumigador, 1 garfo do primeiro do primeiro Recibos e notas Kit 4 kits mês de mês de fiscai…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400202, name: `2.2 Kits de apoiar a implantação e manutenção dos quintais Aquisição de mudas frutíferas, distribuição dos kits`, expectedResult: `Recibos e notas Kit 8 kits mês de mês de fiscais. execução do execução do produtivos. projeto projeto Primeiro dia, Último dia, do primeiro do primeiro biofertilizantes do biodigestor, emitidos (1 fotografias. projeto projeto`, activities: [
        { id: 4002021, name: `Especificação — Recibos e notas Kit 8 kits mês de mês de fiscais. execução do execução do produtivos. proj…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400203, name: `2.3 Kits de mudas e hortaliças e espécies nativas, sementes além de substratos, insumos e recipientes para plantio…`, expectedResult: `Recibos e notas Kit 8 kits mês de mês de fiscais. execução do execução do projeto projeto 1º mês de 12º mês de Recibos, práticas de aproveitamento certificado integral de alimentos, manejo por família, do solo e diversificação de por oficina) culturas. Contratação de 1 oficineiro, Contrato`, activities: [
        { id: 4002031, name: `Especificação — Recibos e notas Kit 8 kits mês de mês de fiscais. execução do execução do projeto projeto…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400204, name: `2.4 Custo operacionais despesas operacionais (água, energia elétrica, internet e mulheres (mínimo 60%); visitas`, expectedResult: `Cota 1 cota execução do execução do comprovantes, projeto projeto notas fiscais. serviços básicos de manutenção predial). Realização de reunião comunitária com beneficiários da Cozinha Solidária Vida Saudável; priorização de famílias chefiadas por Lista de 8 famílias 1º dia, do 2º 10º dia, do 2º`, activities: [
        { id: 4002041, name: `Especificação — Cota 1 cota execução do execução do comprovantes, projeto projeto notas fiscais. serviços…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4003, name: `3. Capacitação de 8 famílias em práticas agroecológicas e instalação de 8 quintais agroecológicos produtivos em Santa Maria do Pará/PA`, deliverables: [
      { id: 400301, name: `3.1 Seleção e mobilização das famílias A etapa garante a seleção justa condução de 2 oficinas teórico-`, expectedResult: `domiciliares para diagnóstico Cadastros e presença, fichas cadastradas mês de mês de do espaço; cadastro das termos cadastrais, e com termo execução do execução do famílias; preenchimento de assinado termos de assinado projeto projeto ficha técnica detalhada; compromisso assinatura de termos de compromisso. e o alinhamento das responsabilidades. Distribuição de kits para 2 listas de práticas (3h cada) na sede da frequências,`, activities: [
        { id: 4003011, name: `Especificação — domiciliares para diagnóstico Cadastros e presença, fichas cadastradas mês de mês de do es…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400302, name: `3.2 Oficinas de capacitação em manejo agroecológico e`, expectedResult: `ADESC/PA, abordando: além de, no 11º dia, do 2º Último dia, técnicas de manejo mínimo, 16 Relatórios, Frequências mês de do 2º mês de agroecológico, uso de certificados frequências, e certificados execução do execução do`, activities: [
        { id: 4003021, name: `Especificação — ADESC/PA, abordando: além de, no 11º dia, do 2º Último dia, técnicas de manejo mínimo, 16…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400303, name: `3.3 Contratação de 1 oficineiro especialista biofertilizantes do biodigestor,`, expectedResult: `Contrato 1 contrato 1º dia, do 2º 5º dia, do 2º com expertise em técnicas de assinado, nota assinado assinado mês de mês de manejo agroecológico, uso de fiscal de execução do execução do prestação de práticas de aproveitamento projeto projeto serviço. integral de alimentos, manejo do solo e diversificação de culturas. Acompanhamento técnico Relatórios, fotos, individualizado no preparo do 8 quintais 2º mês de 12º mês de publicações em`, activities: [
        { id: 4003031, name: `Especificação — Contrato 1 contrato 1º dia, do 2º 5º dia, do 2º com expertise em técnicas de assinado, not…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400304, name: `3.4 Implantação dos quintais produtivos inicial; registro da evolução de cada quintal até sua atividade`, expectedResult: `solo, plantio e manutenção Quintais implantados e execução do execução do redes sociais e implantados produtivos projeto projeto site da ADESC/PA. mais consolidade. Realização de reunião comunitária na comunidade São Benedito; priorização de Primeiro dia, Décimo dia, Lista de 8 famílias`, activities: [
        { id: 4003041, name: `Especificação — solo, plantio e manutenção Quintais implantados e execução do execução do redes sociais e…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4004, name: `4. Capacitação de 8 famílias em práticas apícolas e instalar 8 colmeias em Maracanã/PA Contratação de 1 oficineiro especialista Instalação de c…`, deliverables: [
      { id: 400401, name: `4.1 Seleção e mobilização das famílias compromisso para formalizar a condução de 2 oficinas teórico-`, expectedResult: `famílias chefiadas por Cadastros e do segundo do segundo presença, fichas cadastradas mulheres (mínimo 60%); termos mês de mês de cadastrais, e com termo cadastro e ficha técnica; assinado execução do execução do termos de assinado assinatura de termo de projeto projeto compromisso participação. Distribuição de kits para 2 listas de frequências, práticas (3h cada) em São além de, no`, activities: [
        { id: 4004011, name: `Especificação — famílias chefiadas por Cadastros e do segundo do segundo presença, fichas cadastradas mulh…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400402, name: `4.2 Oficinas de capacitação em manejo apícola e distribuição`, expectedResult: `Benedito, abordando: boas 11º dia, do 2º Último dia, mínimo, 16 Relatórios, práticas apícolas, manejo Frequências mês de do 2º mês de certificados frequências, sustentável, higiene e e certificados execução do execução do emitidos (1 fotografias.`, activities: [
        { id: 4004021, name: `Especificação — Benedito, abordando: boas 11º dia, do 2º Último dia, mínimo, 16 Relatórios, práticas apíco…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400403, name: `4.3 sustentável, higiene e segurança, além de estratégias de comercialização, precificação e marketing comunitário…`, expectedResult: `Contrato 1 contrato mês de do 2º mês de fiscal de assinado assinado execução do execução do prestação de projeto projeto serviço. Relatórios, fotos, 8 caixas de Caixas de 2º mês de 12º mês de publicações em`, activities: [
        { id: 4004031, name: `Especificação — Contrato 1 contrato mês de do 2º mês de fiscal de assinado assinado execução do execução d…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400404, name: `4.4 individualizado das colmeias recém-instaladas, incluindo monitoramento da saúde das colônias, manejo básico e…`, expectedResult: `colmeia colmeia execução do execução do redes sociais e instaladas e instaladas projeto projeto site da produtivos ADESC/PA. comunidade. Baldes distribuídos Notas fiscais, em escolas, 1º mês de 2º mês de`, activities: [
        { id: 4004041, name: `Especificação — colmeia colmeia execução do execução do redes sociais e instaladas e instaladas projeto pr…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4005, name: `5. Manutenção do biodigestor e melhoria de condições para o uso coletivo 6. Acompanhamento,`, deliverables: [
      { id: 400501, name: `5.1 Aquisição de 100 ampliação do projeto Balde baldes de 20L Aquisição de 100 recipientes`, expectedResult: `100 baldes comprovantes de comércios execução do execução do distribuídos recebimento, Agroecológico locais, projeto projeto fotos. domicílios familiares 100 recipientes Recipientes Notas fiscais, com 1º mês de 2º mês de`, activities: [
        { id: 4005011, name: `Especificação — 100 baldes comprovantes de comércios execução do execução do distribuídos recebimento, Agr…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400502, name: `5.2 Aquisição de 100 de 5L para armazenamento de recipientes de 5L biofertilizante a ser . Elaboração de relatório…`, expectedResult: `distribuídos comprovantes de biofertilizantes execução do execução do na recebimento, circulando projeto projeto comunidade fotos pela comunidade Contrato, 1º mês de 12º mês de 4 relatórios relatórios, fotos,`, activities: [
        { id: 4005021, name: `Especificação — distribuídos comprovantes de biofertilizantes execução do execução do na recebimento, circ…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4006, name: `6. monitoramento e avaliação`, deliverables: [
      { id: 400601, name: `6.1 Relatoria contendo indicadores quantitativos e qualitativos, desafios e lições aprendidas.`, expectedResult: `Relatórios execução do execução do produzidos comprovantes de projeto projeto pagamento.`, activities: [
        { id: 4006011, name: `Especificação — Relatórios execução do execução do produzidos comprovantes de projeto projeto pagamento.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  5: [
    { id: 5001, name: `1. Capacitar 50 extrativistas Kayapó em elaborar material didático manejo sustentável, beneficiamento e gestão da castanha-do- Pará`, deliverables: [
      { id: 500101, name: `1.1 Contratar profissionais e Contratação`, expectedResult: `de profissionais Contrato de (agrônomo, gestor ambiental, serviço especialista em bioeconomia) e Material didático desenvolvimento de material didático adaptado à cultura Kayapó`, activities: [
        { id: 5001011, name: `Especificação — de profissionais Contrato de (agrônomo, gestor ambiental, serviço especialista em bioecono…`, responsible: ``, plannedDate: `Dez/2025–Jan/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contratos, Relatórios, Material didático` },
      ] },
      { id: 500102, name: `1.2 Realizar oficinas de capacitação`, expectedResult: `Realização de 8 oficinas de 40 horas, Oficinas com 25 participantes cada, abordando realizadas boas práticas de coleta sustentável, Participantes técnicas de armazenamento e logística, gestão comunitária e comercialização coletiva da castanha-do-pará. As oficinas também incluirão conteúdos sobre organização social, negociação com fornecedores e fortalecimento da autonomia econômica das famílias Kayapó.`, activities: [
        { id: 5001021, name: `Especificação — Realização de 8 oficinas de 40 horas, Oficinas com 25 participantes cada, abordando realiz…`, responsible: ``, plannedDate: `Jan/2026–Jun/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Listas de presença, Certificados, Relatórios fotográficos, Avaliações` },
      ] },
    ] },
    { id: 5002, name: `2. Implantar estrutura de coleta e logística da equipamentos de coleta e castanha-do-pará`, deliverables: [
      { id: 500201, name: `2.1 Aquisição de transporte`, expectedResult: `Compra de 2 barcos e 2 motores para Barco otimização da coleta e transporte Motor 40hp sustentável da produção e equipe de coleta.`, activities: [
        { id: 5002011, name: `Especificação — Compra de 2 barcos e 2 motores para Barco otimização da coleta e transporte Motor 40hp sus…`, responsible: ``, plannedDate: `Dez/2025–Dez/2025`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas fiscais, Termos de entrega` },
      ] },
      { id: 500202, name: `2.2 Implantação de ponto de Aquisição e instalação de estruturas Estruturas de armazenamento comunitário simples`, expectedResult: `(depósitos, caixas de armazenamento armazenamento e equipamentos de instaladas secagem natural) para garantir a qualidade da castanha até o transporte.`, activities: [
        { id: 5002021, name: `Especificação — (depósitos, caixas de armazenamento armazenamento e equipamentos de instaladas secagem nat…`, responsible: ``, plannedDate: `Jan/2026–Mar/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas fiscais, Termos de instalação, Fotos` },
      ] },
    ] },
    { id: 5003, name: `3. Estruturar a comercialização coletiva da castanha- do-pará`, deliverables: [
      { id: 500301, name: `3.1 Criação de um núcleo comunitário de comercialização`, expectedResult: `Organização de um espaço físico e Núcleo de administrativo na Associação comercialização Mebengokre Ytê Kayapó para estruturado centralizar a venda da produção.`, activities: [
        { id: 5003011, name: `Especificação — Organização de um espaço físico e Núcleo de administrativo na Associação comercialização M…`, responsible: ``, plannedDate: `Fev/2026–Mar/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório de criação e ata de definição do núcleo` },
      ] },
      { id: 500302, name: `3.2 Formalização de parcerias comerciais`, expectedResult: `Estabelecimento de contratos ou Documentos acordos com fornecedores e firmados com compradores parceiros, garantindo preços justos e previsibilidade de escoamento da produção.`, activities: [
        { id: 5003021, name: `Especificação — Estabelecimento de contratos ou Documentos acordos com fornecedores e firmados com comprad…`, responsible: ``, plannedDate: `Mar/2026–Mai/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Acordos/contratos fornecedores e compradores` },
      ] },
      { id: 500303, name: `3.3 Organização de lotes coletivos de venda`, expectedResult: `Planejamento e execução de pelo Vendas menos 3 vendas coletivas durante o coletivas período do projeto, reunindo a produção realizadas de diferentes comunidades Kayapó.`, activities: [
        { id: 5003031, name: `Especificação — Planejamento e execução de pelo Vendas menos 3 vendas coletivas durante o coletivas períod…`, responsible: ``, plannedDate: `Mar/2026–Jul/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório de vendas, fotos` },
      ] },
    ] },
    { id: 5004, name: `4. Fortalecer o protagonismo indígena reuniões de comunicação. e a conservação da floresta.`, deliverables: [
      { id: 500401, name: `4.1 Realizar assembleias e Realização de assembleias regulares`, expectedResult: `Reuniões (de 2 em 2 meses) e reuniões com realizadas conselho de caciques, comitês de Asssembleias mulheres e jovens.`, activities: [
        { id: 5004011, name: `Especificação — Reuniões (de 2 em 2 meses) e reuniões com realizadas conselho de caciques, comitês de Asss…`, responsible: ``, plannedDate: `Dez/2025–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Atas de reunião, Relatórios de participação` },
      ] },
      { id: 500402, name: `4.2 Monitoramento ambiental Acompanhamento das práticas de e cultural`, expectedResult: `Relatório de manejo florestal sustentável e registro monitoramento das atividades culturais relacionadas à Registros castanha-do-Pará culturais`, activities: [
        { id: 5004021, name: `Especificação — Relatório de manejo florestal sustentável e registro monitoramento das atividades culturai…`, responsible: ``, plannedDate: `Dez/2025–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatórios técnicos, Documentação fotográfica/vídeo` },
      ] },
      { id: 500403, name: `4.3 Divulgação e acesso a mercados.`, expectedResult: `Participação em feiras, eventos e Participação em articulação com compradores para eventos acesso a mercados diferenciados`, activities: [
        { id: 5004031, name: `Especificação — Participação em feiras, eventos e Participação em articulação com compradores para eventos…`, responsible: ``, plannedDate: `Mar/2026–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Certificados de participação` },
      ] },
    ] },
    { id: 5005, name: `5. Implantar sistema de monitoramento e avaliação dos resultados mulheres e jovens para avaliar coletivamente os resultados e propor ajustes.`, deliverables: [
      { id: 500501, name: `5.1 Definir indicadores de desempenho comunitário e ambiental`, expectedResult: `Elaboração de um conjunto de Conjunto de indicadores participativos (econômicos, indicadores sociais e ambientais) para acompanhar elaborados a execução do projeto.`, activities: [
        { id: 5005011, name: `Especificação — Elaboração de um conjunto de Conjunto de indicadores participativos (econômicos, indicador…`, responsible: ``, plannedDate: `Dez/2025–Jan/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Documento com indicadores definidos e aprovados em assembleia` },
      ] },
      { id: 500502, name: `5.2 Realizar relatórios periódicos de acompanhamento`, expectedResult: `Produção de relatórios semestrais com Relatórios de dados sobre coleta, armazenamento, monitoramento comercialização e impactos sociais. produzidos`, activities: [
        { id: 5005021, name: `Especificação — Produção de relatórios semestrais com Relatórios de dados sobre coleta, armazenamento, mon…`, responsible: ``, plannedDate: `Dez/2025–Dez/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatórios semestrais impressos ou digitais; atas de apresentação à comunidade.` },
      ] },
      { id: 500503, name: `5.3 Avaliação participativa com a comunidade realizados`, expectedResult: `Realização de encontros trimestrais Encontros de com extrativistas, caciques, comitês de avaliação avaliação; registros fotográficos dos encontros.`, activities: [
        { id: 5005031, name: `Especificação — Realização de encontros trimestrais Encontros de com extrativistas, caciques, comitês de a…`, responsible: ``, plannedDate: `Mar/2026–Dez/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Listas de presença; atas das reuniões de` },
      ] },
    ] },
  ],
  6: [
    { id: 6001, name: `1. Meta 1`, deliverables: [
      { id: 600101, name: `1.2 (confecção da cartilha) registrar práticas tradicionais em Registrar práticas tradicionais em cartilhas medici…`, expectedResult: `Cartilhas 150 mês 10/ano 1 mês 10/ano 1 Impressão das cartilhas, cartilha em conjunto com os jovens da fotos . comunidade que estão na universidade. objetivo da cartilha é fazer um memorial sobre práticas tradicionais de espécies nativas extrativista e com valor`, activities: [
        { id: 6001011, name: `Especificação — Cartilhas 150 mês 10/ano 1 mês 10/ano 1 Impressão das cartilhas, cartilha em conjunto com…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6002, name: `2. Capacitação comunitária comunidades 1 oficina de capacitação Contratar um profissional para realizar Oficina sobre espécies nativa (identifi…`, deliverables: [
      { id: 600201, name: `2.1 Intercâmbio entre as Promover a troca de experiências entre Encontros de diferentes viveiristas. Compartilhar…`, expectedResult: `03 mês 5/ano 1 mês 05/ano 1 Comprovantes de intercâmbio passagens , registro fotográfico ,vídeo depoimento e relatório descritivo. 01 oficina mês 2/ano 1 mês 3/ano 1 Lista de em 2 dias presença,registro fotográficos, depoimentos e relatório da oficina 01 mês 3/ano 1 mês 3/ano 1 Lista de presença,registro fotográficos, depoimentos e relatório da oficina`, activities: [
        { id: 6002011, name: `Especificação — 03 mês 5/ano 1 mês 05/ano 1 Comprovantes de intercâmbio passagens , registro fotográfico ,…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6003, name: `3. Infraestrutura do viveiro`, deliverables: [
      { id: 600301, name: `3.1 Limpeza do espaço para a construção`, expectedResult: `Participação da comunidade através de Puxirum 01 mês 3/ano 1 mês 3/ano 1 Relatório, presença e puxirum foto Terreno limpo e organizado para iniciar a construção do viveiro. Equipe motivada e consciente da importância do cuidado com o espaço. Aproveitamento de materiais naturais para uso posterior (adubo, cobertura, proteção). Redução de riscos durante a construção (quedas, ferramentas presas, acúmulo de água`, activities: [
        { id: 6003011, name: `Especificação — Participação da comunidade através de Puxirum 01 mês 3/ano 1 mês 3/ano 1 Relatório, presen…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600302, name: `3.2 Construção dos viveiros Viveiros comunitários montado e com mutirão (puxirum) comunidade`, expectedResult: `Viveiro 02 mês 3/ano 1 mês 4/ano 1 Viveiros prontos funcional. Fortalecimento de laços comunitários e da cultura do puxirum. Aprendizado técnico coletivo sobre viveiros e sementes. Empoderamento local para ações de reflorestamento, alimentação e cura com plantas. Continuidade no cuidado e uso do viveiro.`, activities: [
        { id: 6003021, name: `Especificação — Viveiro 02 mês 3/ano 1 mês 4/ano 1 Viveiros prontos funcional. Fortalecimento de laços com…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6004, name: `4. Produção de mudas`, deliverables: [
      { id: 600401, name: `4.1 Planejamento para a Coleta das sementes na floresta`, expectedResult: `mapear as espécies nativas do Ficha de coleta 03 mês 02/ano mês 03/ano 1 Modelo de ficha de território com época de coleta e de semente 01 coleta de semente elaborar a Ficha de coleta de (frutífera, (frutífera, medicinal e sementes para impressão, medicinal e nativa) pronto considerando as espécies nativa) nativas,medicinal e frutíferas Lista de Orientações para montar um banco de sementes comunitário.`, activities: [
        { id: 6004011, name: `Especificação — mapear as espécies nativas do Ficha de coleta 03 mês 02/ano mês 03/ano 1 Modelo de ficha d…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600402, name: `4.2 Coleta das Sementes`, expectedResult: `coletar espécies nativas, frutíferas e Sementes 0 mês 04/ano 1 mês 06/ano 1 Registro de campo (lista medicinais valorizadas pela coletadas por de sementes coletas) comunidade e pelo mercado categoria com assinatura de (nativa, frutífera técnico ou comunidade; e medicinal) fotos datadas, fichas preenchidas`, activities: [
        { id: 6004021, name: `Especificação — coletar espécies nativas, frutíferas e Sementes 0 mês 04/ano 1 mês 06/ano 1 Registro de ca…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600403, name: `4.3 Plantio das Sementes Cuidados pós plantio`, expectedResult: `preparar substratos e produzir mudas Plantio 5000 por mês 5/ano 1 mês 10/ano 1 viveiro em Germinação saudável das espécies viveiro. funcionamento,ficha de coletadas ou escolhidas. coleta de sementes,lista Mudas bem identificadas e cuidadas de espécies de para o uso futuro. sementes atualizadas Participantes empoderados com o conhecimento do ciclo da vida. Organização do viveiro pronta para próximas etapas (transplante, plantio no campo) Alta taxa de sobrevivência das mudas Cuidado 5000 por mês 5/ano 1 mês 10/ano 1 Registro de campo ou Mudas firmes no solo, com raiz já viveiro planilha de adaptada (raízes novas), que não monitoramento (lista de tombem, nem murchem com facilidade, mudas plantadas, mesmo quando há variação no clima. número sobreviventes) Resistência a estresses do ambiente as com assinatura de mudas ficam mais preparadas para técnico ou comunidade; enfrentar sol forte, períodos secos, fotos datadas vento, variação de temperatura antes/depois comparativas`, activities: [
        { id: 6004031, name: `Especificação — preparar substratos e produzir mudas Plantio 5000 por mês 5/ano 1 mês 10/ano 1 viveiro em…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600404, name: `4.5 Acompanhamento do crescimento`, expectedResult: `A coordenação do projeto e as famílias das Acompanhamento 5000 por mês 5/ano 1 mês 10/ano 1 Relatórios feitos por comunidades farão o acompanhamento nos viveiro extensionistas, técnicos viveiros de acordo com seu planejamento agrícolas ou agentes locais Adaptação ao local definitivo,,sobrevivência, registrando medições, altura e diâmetros das mudas observações, evolução do crescimento.`, activities: [
        { id: 6004041, name: `Especificação — A coordenação do projeto e as famílias das Acompanhamento 5000 por mês 5/ano 1 mês 10/ano…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6005, name: `5. Reflorestamento e recuperação ambiental degradadas da comunidade áreas manejadas e em áreas com baixo de rios) especialmente`, deliverables: [
      { id: 600501, name: `5.1 utilizar muda dos viveiros em áreas (roçados, capoeiras, beira potencial de castanha do Pará e cumaru`, expectedResult: `Os comunitários farão o plantio das Puxirum (mutirão) 5 mês 10/ano 1 mês 11/ano 1 Lista de presença,registro essências florestais nas áreas determinadas (com 20 fotográficos, depoimentos e pelas comunidades, sendo nas de APP, pessoas relatório da oficina cada)`, activities: [
        { id: 6005011, name: `Especificação — Os comunitários farão o plantio das Puxirum (mutirão) 5 mês 10/ano 1 mês 11/ano 1 Lista de…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  7: [
    { id: 7001, name: `1. Cotação e Contratação de fornecedores de produtos (materiais de construção) e serviços (arquiteto, engenheiro e outros) 2. Formação da equip…`, deliverables: [
      { id: 700101, name: `1.1 Cotação de preços e contratação de serviços de construção`, expectedResult: `Atividade realizada pela equipe Serviço 01 01/2026 02/2026 Orçamentos recebidos técnica do projeto, em dias, considerando melhor preço e proposta.`, activities: [
        { id: 7001011, name: `Especificação — Atividade realizada pela equipe Serviço 01 01/2026 02/2026 Orçamentos recebidos técnica do…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700102, name: `1.2 Fase 1: avaliação da estrutura física atual da sede da ATAIC`, expectedResult: `Análise da estrutura física para Serviço 01 02/2026 02/2026 Parecer técnico do reaproveitamento de espaços e profissional contratado e nota fiscal do serviço. materiais. Essa ação será desenvolvida pelos técnicos contratados para a construção das instalações, no período de 07 dias.`, activities: [
        { id: 7001021, name: `Especificação — Análise da estrutura física para Serviço 01 02/2026 02/2026 Parecer técnico do reaproveita…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700103, name: `1.3 Fase 2: Construção dos espaços conforme planta arquitetônica.`, expectedResult: `Construção das estruturas físicas, Serviço 01 03/2026/ 08/2026 Relatório descritivo, de acordo com a planta fotográfico e nota fiscal de serviços arquitetônica elaborada Essa atividade será realizada no período de 150 dias.`, activities: [
        { id: 7001031, name: `Especificação — Construção das estruturas físicas, Serviço 01 03/2026/ 08/2026 Relatório descritivo, de ac…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700104, name: `1.4 Fase 3: Acabamento e reparos Prospecção de formações a serem realizadas Criar e formar equipe gestora do Centr…`, expectedResult: `Instalações elétricas, hidráulicas Serviço 01 07/2026 09/2026 Relatório descritivo, e pintura dos espaços, a ser fotográfico e nota fiscal de serviços realizado pelos profissionais contratados, no período de 60 dias Realização de diagnóstico de Serviço 01 05/2026 07/2026 Relatório descritivo, identificação de formações de fotográfico e nota fiscal de serviços interesse dos beneficiários diretos e indiretos da proposta, desenvolvido por equipe técnica responsável com o apoio de assessoria, a ser contratada. Será desenvolvido no período de 60 dias Mobilização, seleção e Capacitação 03 08/2026 10/2026 Relatório descritivo, capacitação da equipe gestora do fotográfico e nota fiscal de serviços Centro de Formação, definindo papeis e responsabilidades. Essa tarefa será realizada pela diretoria da ATAIC e equipe do Projeto, em um período de 60 dias`, activities: [
        { id: 7001041, name: `Especificação — Instalações elétricas, hidráulicas Serviço 01 07/2026 09/2026 Relatório descritivo, e pint…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  8: [
    { id: 8001, name: `1. Aquisição de equipamentos para viabilizar os cadeiras. planejamentos, relatórios, prestação de contas e sistematização das informação do pro…`, deliverables: [
      { id: 800101, name: `1.1 Compra de Notebook, projetos multimídias, mesas e a cotação e a compra um Notebook e`, expectedResult: `A equipe de compras da ARQUIA fará Equipamentos 3 um projetos multimídias, mesas e cadeiras para uso da organização em seus projetos. A equipe fará essa cotação por um período de uma semana, considerando as condições geográficas que exigem tempo de pesquisa e cotação.`, activities: [
        { id: 8001011, name: `Especificação — A equipe de compras da ARQUIA fará Equipamentos 3 um projetos multimídias, mesas e cadeira…`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Orçamentos resultantes dos trabalhos de pesquisa; Notas fiscais de compras quando confirmada a escola.` },
      ] },
      { id: 800102, name: `1.2 Etapa`, expectedResult: ``, activities: [
        { id: 8001021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800103, name: `1.3 Etapa`, expectedResult: ``, activities: [
        { id: 8001031, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 8002, name: `2. Implantar 5 hortas comunitárias com a ARQUIA em atividades profissional em horticultura; Assessor variedades de hortaliças adaptadas nas com…`, deliverables: [
      { id: 800201, name: `2.1 Contratação profissionais para assessorar (Agrônomo ou afim), para orientação formativas na área de direitos,…`, expectedResult: `de Profissional da área de agronomia Profissionais 3 1 direitos quilombolas, contratação de profissional para mobilização de recursos .`, activities: [
        { id: 8002011, name: `Especificação — de Profissional da área de agronomia Profissionais 3 1 direitos quilombolas, contratação d…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Lista de assinatura, relatório fotográfico,` },
      ] },
      { id: 800202, name: `2.2 Realização de Cinco (5) Participação de comunitários das 5 comunidades Participação de gestores 100 reuniões c…`, expectedResult: `convidados pela ARQAUIA e comunidades por reunião.`, activities: [
        { id: 8002021, name: `Especificação — convidados pela ARQAUIA e comunidades por reunião.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Lista de assinatura, relatório fotográfico,.` },
      ] },
      { id: 800203, name: `2.3 Oficinas práticas de Participação nas formações, de pelo menos 10 Participação de gestores 60 construção, de h…`, expectedResult: `1 5 por reunião.`, activities: [
        { id: 8002031, name: `Especificação — 1 5 por reunião.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800204, name: `2.4 Etapa`, expectedResult: ``, activities: [
        { id: 8002041, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 8003, name: `3. Formar no mínimo 20 lideranças das das comunidades quilombolas da comunitários e suas lideranças, nas formações aprendizagem comunidades em…`, deliverables: [
      { id: 800301, name: `3.1 Formar no mínimo 20 lideranças Garantir a participação de no mínimo 20 Participação e saúde, educação, territó…`, expectedResult: `20 1 7`, activities: [
        { id: 8003011, name: `Especificação — 20 1 7`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800302, name: `3.2 Etapa`, expectedResult: ``, activities: [
        { id: 8003021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800303, name: `3.3 definição do terreno/comunidade, preparação do espaço, compra dos materiais de profissionais/comunitários, ini…`, expectedResult: `Construção do espaço e liberação de uso Local liberado para uso 1 2 8`, activities: [
        { id: 8003031, name: `Especificação — Construção do espaço e liberação de uso Local liberado para uso 1 2 8`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 8004, name: `4. abrigar atividades`, deliverables: [
      { id: 800401, name: `4.2 Etapa`, expectedResult: ``, activities: [
        { id: 8004011, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800402, name: `4.3 Etapa`, expectedResult: ``, activities: [
        { id: 8004021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  9: [
  ],
  10: [
    { id: 10001, name: `1. Construção da Infraestrutura Física de 100 para capitação de água com 24 M m² para abrigar os equipamentos e materiais da agroindústria Real…`, deliverables: [
      { id: 1000101, name: `1.1 Realizar reunião de Planejamento`, expectedResult: `Reunião de 4 horas com todos os cooperados para explicar o cronograma de execução do projeto`, activities: [
        { id: 10001011, name: `Especificação — Reunião de 4 horas com todos os cooperados para explicar o cronograma de execução do proje…`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Ata da reunião, lista de presença e fotogafias.` },
      ] },
      { id: 1000102, name: `1.2 Contratar responsável técnico da Contratação de Engenheiro civil para obra/ projeto`, expectedResult: `elaboração de projeto de construção da agroindústria.`, activities: [
        { id: 10001021, name: `Especificação — elaboração de projeto de construção da agroindústria.`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Projeto pronto/recibo` },
      ] },
      { id: 1000103, name: `1.3 Obter Licença Prévia`, expectedResult: `Solicitação para obter licença junto a SEMMA municipal.`, activities: [
        { id: 10001031, name: `Especificação — Solicitação para obter licença junto a SEMMA municipal.`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Licença Emitida e recibo de pagamento` },
      ] },
      { id: 1000104, name: `1.4 Obter Licença de Instalação`, expectedResult: `Solicitação para obter licença junto a SEMMA municipal.`, activities: [
        { id: 10001041, name: `Especificação — Solicitação para obter licença junto a SEMMA municipal.`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Licença Emitida e recibo de pagamento` },
      ] },
      { id: 1000105, name: `1.5 Realizar construção de poço Realizar compra de material de construção / cimento`, expectedResult: `Fazer Contratação de uma equipe especializada em perfuração de poço artesiano. Fazer cotação de preço e realizar a compra Saco de cimento.`, activities: [
        { id: 10001051, name: `Especificação — Fazer Contratação de uma equipe especializada em perfuração de poço artesiano. Fazer cotaç…`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Recibo de pagamento e fotografias. Notas fiscais` },
      ] },
      { id: 1000106, name: `1.6 Etapa`, expectedResult: `Fazer cotação de preço e realizar a compra Vara`, activities: [
        { id: 10001061, name: `Especificação — Fazer cotação de preço e realizar a compra Vara`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas fiscais` },
      ] },
      { id: 1000107, name: `1.7 Realizar compra de material de construção / Tijolo`, expectedResult: `Fazer cotação de preço e realizar a compra Milheiro de tijolo`, activities: [
        { id: 10001071, name: `Especificação — Fazer cotação de preço e realizar a compra Milheiro de tijolo`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas fiscais` },
      ] },
      { id: 1000108, name: `1.8 Fazer cotação de preço e realizar a compra M² de seixo`, expectedResult: `15`, activities: [
        { id: 10001081, name: `Especificação — 15`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000109, name: `1.9 Contratação de uma equipe especializada na instação de piso curudum.`, expectedResult: `M² 100`, activities: [
        { id: 10001091, name: `Especificação — M² 100`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000110, name: `1.10 Contratação de uma equipe de pedreiros e M² ajudantes, para realizar a construção da infraestrutura. (fundação…`, expectedResult: `100`, activities: [
        { id: 10001101, name: `Especificação — 100`, responsible: ``, plannedDate: `Mês 1–Mês 2`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000111, name: `1.11 Realizar contratação de um eletrecista para Empreitada fazer a instalação elétrica.`, expectedResult: `1 Mês 1/ ano 1`, activities: [
        { id: 10001111, name: `Especificação — 1 Mês 1/ ano 1`, responsible: ``, plannedDate: `Mês 2–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000112, name: `1.12 Fazer cotação de preço e realizar a compra Diversos dos materias eletricos nescessários (fio, cabo, tomadas, l…`, expectedResult: `Diversos`, activities: [
        { id: 10001121, name: `Especificação — Diversos`, responsible: ``, plannedDate: `Mês 1–Mês 2`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000113, name: `1.13 Realizar contratação de um encanador para Empreitada fazer a instalação hidráulica.`, expectedResult: `1 Mês 1/ ano 1`, activities: [
        { id: 10001131, name: `Especificação — 1 Mês 1/ ano 1`, responsible: ``, plannedDate: `Mês 2–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000114, name: `1.14 Fazer cotação de preço e realizar a compra Diversos dos materias hidráulicos nescessários (Bomba submersa, cai…`, expectedResult: `Diversos`, activities: [
        { id: 10001141, name: `Especificação — Diversos`, responsible: ``, plannedDate: `Mês 1–Mês 2`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000115, name: `1.15 Realizar contratação de um metalúrgico para confeccionar e instalar portão, portas e balancinhos.`, expectedResult: `Empreitada 1 Mês 1/ ano 1`, activities: [
        { id: 10001151, name: `Especificação — Empreitada 1 Mês 1/ ano 1`, responsible: ``, plannedDate: `Mês 2–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000116, name: `1.16 Fazer cotação de preço e realizar a compra M² de telha de alimínio.`, expectedResult: `120`, activities: [
        { id: 10001161, name: `Especificação — 120`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000117, name: `1.17 Fazer cotação de preço e realizar a compra M² de forro PVC`, expectedResult: `100`, activities: [
        { id: 10001171, name: `Especificação — 100`, responsible: ``, plannedDate: `Mês 1–Mês 1`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000118, name: `1.18 Fazer cotação de preço e realizar a compra M² material de pintura (tinta, pincel, rolo, bandeija, massa, luva,…`, expectedResult: `240`, activities: [
        { id: 10001181, name: `Especificação — 240`, responsible: ``, plannedDate: `Mês 2–Mês 2`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000119, name: `1.19 Comprar combustível para deslocamento`, expectedResult: `Fazer cotação de preço e realizar a compra L de combustivel, (óleo disel e gasolina)`, activities: [
        { id: 10001191, name: `Especificação — Fazer cotação de preço e realizar a compra L de combustivel, (óleo disel e gasolina)`, responsible: ``, plannedDate: `Mês 1–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000120, name: `1.20 Realizar a Pintura do prédio`, expectedResult: `realizar contratação de profissional para pintar todo o prédio (interior e exterior)`, activities: [
        { id: 10001201, name: `Especificação — realizar contratação de profissional para pintar todo o prédio (interior e exterior)`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10002, name: `2. Aquisição de máquinas e Aquisição de Filtro com purificador de de filtro com purificador de água industrial equipamentos.`, deliverables: [
      { id: 1000201, name: `2.1 Aquisição de mesa Classificadora`, expectedResult: `Fazer cotação de preço e realizar a compra Unidade de mesa classificadora`, activities: [
        { id: 10002011, name: `Especificação — Fazer cotação de preço e realizar a compra Unidade de mesa classificadora`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000202, name: `2.2 Aquisição de Tanque de Higienização de Tanque de Higienização`, expectedResult: `Fazer cotação de preço e realizar a compra Unidade`, activities: [
        { id: 10002021, name: `Especificação — Fazer cotação de preço e realizar a compra Unidade`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000203, name: `2.3 Aquisição de Branqueador Digital`, expectedResult: `Fazer cotação de preço e realizar a compra Unidade de Branqueador digital`, activities: [
        { id: 10002031, name: `Especificação — Fazer cotação de preço e realizar a compra Unidade de Branqueador digital`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000204, name: `2.4 água industrial`, expectedResult: `Fazer cotação de preço e realizar a compra Unidade`, activities: [
        { id: 10002041, name: `Especificação — Fazer cotação de preço e realizar a compra Unidade`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000205, name: `2.5 Aquisição de Despolpadeira Industrial de despolpadeira industrial (3 latas por vez)`, expectedResult: `Fazer cotação de preço e realizar a compra Unidade`, activities: [
        { id: 10002051, name: `Especificação — Fazer cotação de preço e realizar a compra Unidade`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000206, name: `2.6 Aquisição de Envasadora Pneumática`, expectedResult: `Fazer cotação de preço e realizar a compra Unidade de Envasadora Pneumática`, activities: [
        { id: 10002061, name: `Especificação — Fazer cotação de preço e realizar a compra Unidade de Envasadora Pneumática`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000207, name: `2.7 Aquisição de Seladora Selamulta Pedal - Barra Quente`, expectedResult: `Fazer cotação de preço e realizar a compra Unidade de Seladora selamulta pedal – Barra quente.`, activities: [
        { id: 10002071, name: `Especificação — Fazer cotação de preço e realizar a compra Unidade de Seladora selamulta pedal – Barra que…`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10003, name: `3. Qualificação`, deliverables: [
      { id: 1000301, name: `3.1 Realizar capacitação: ferramentas digitais aplicadas à gestão, produção, ferramentas digitais aplicadas à gest…`, expectedResult: `Realizar contratação de profissional habilitado para capacitar os cooperados em produção, comercialização e comunicação.`, activities: [
        { id: 10003011, name: `Especificação — Realizar contratação de profissional habilitado para capacitar os cooperados em produção,…`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000302, name: `3.2 Realizar capacitação: boas práticas habilitado para capacitar os cooperados em de colheita`, expectedResult: `Realizar contratação de profissional boas práticas de colheita de frutos da flloresta`, activities: [
        { id: 10003021, name: `Especificação — Realizar contratação de profissional boas práticas de colheita de frutos da flloresta`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000303, name: `3.3 Realizar capacitação: manipulação e processamento de alimentos Obter Licença de Operação`, expectedResult: `Realizar contratação de profissional habilitado para capacitar os cooperados em manipulação e processamento de alimentos. Solicitação para obter a licença junto a SEMMA municipal`, activities: [
        { id: 10003031, name: `Especificação — Realizar contratação de profissional habilitado para capacitar os cooperados em manipulaçã…`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10004, name: `4. Registro`, deliverables: [
      { id: 1000401, name: `4.2 Realizar compra de material de construção / vegalhão diversos Obter registro do estabelecimento e dos produtos…`, expectedResult: `de vergalhão 3/8, vergalhão e arame recozinho. Solicitação para obter registro junto a ADEPARÁ e MAPA.`, activities: [
        { id: 10004011, name: `Especificação — de vergalhão 3/8, vergalhão e arame recozinho. Solicitação para obter registro junto a ADE…`, responsible: ``, plannedDate: `Mês 3–Mês 10`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10005, name: `5. Presatção de Contas`, deliverables: [
      { id: 1000501, name: `5.1 Realizar Prestação de Contas`, expectedResult: `Juntar todos os documentos, notas fiscais, Documento recibos, lista de presença, comprovantes, registros fotográficos, infraestrutura conclúida, máquinas e equipamentos adquiridos em operação, apresentação das polpas produzidas contendo selo e marca própria do produto registrado.`, activities: [
        { id: 10005011, name: `Especificação — Juntar todos os documentos, notas fiscais, Documento recibos, lista de presença, comprovan…`, responsible: ``, plannedDate: `Mês 10–Mês 12`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  11: [
  ],
  12: [
    { id: 12001, name: `1. Finalizar a construção da Casa de materiais da construção e dos menos 3 fornecedores, fisicamente e por mel`, deliverables: [
      { id: 1200101, name: `1.1 Cotação de preços de Fazer o levantamento de orçamento com pelo maquinários da Casa de Mel. telefone.`, expectedResult: `Orçamentos 3 Fevereiro de Agosto de 2026 Orçamentos 2026`, activities: [
        { id: 12001011, name: `Especificação — Orçamentos 3 Fevereiro de Agosto de 2026 Orçamentos 2026`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200102, name: `1.2 Realizar a aquisição dos Compra de 6 máquinas um mês após o maquinários necessários. recebimento do investimen…`, expectedResult: `Equipamento 6 Fevereiro de Março de 2026 Notas fiscais e fotos. 2026`, activities: [
        { id: 12001021, name: `Especificação — Equipamento 6 Fevereiro de Março de 2026 Notas fiscais e fotos. 2026`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200103, name: `1.3 Adquirir as certificações Contratar 1 veterinário para realizar a da ADEPARÁ. verificação do local e obter a c…`, expectedResult: `Contratação 1 Janeiro 2026 Junho 2026 Nota fiscal.`, activities: [
        { id: 12001031, name: `Especificação — Contratação 1 Janeiro 2026 Junho 2026 Nota fiscal.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 12002, name: `2. Construir a casa da despolpadora de frutas. materiais da construção da`, deliverables: [
      { id: 1200201, name: `2.1 Cotação de preços de Fazer o levantamento de orçamento com pelo menos 3 fornecedores, fisicamente e por casa d…`, expectedResult: `Orçamento 3 Janeiro de 2026 Janeiro de 2026 Orçamentos`, activities: [
        { id: 12002011, name: `Especificação — Orçamento 3 Janeiro de 2026 Janeiro de 2026 Orçamentos`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200202, name: `2.2 Levantamento do Fazer cotação com pelo menos 2 fábricas por orçamento dos equipamentos telefone ou via chamada…`, expectedResult: `Orçamento 2 Janeiro de 2026 Janeiro de 2026 Orçamentos`, activities: [
        { id: 12002021, name: `Especificação — Orçamento 2 Janeiro de 2026 Janeiro de 2026 Orçamentos`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200203, name: `2.3 Realizar a aquisição dos Compra de 7 máquinas um mês após o maquinários necessários. recebimento do investimen…`, expectedResult: `Equipamento 7 Fevereiro de Março de 2026 Notas fiscais e fotos. 2026`, activities: [
        { id: 12002031, name: `Especificação — Equipamento 7 Fevereiro de Março de 2026 Notas fiscais e fotos. 2026`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200204, name: `2.4 Adquirir as certificações Contratar 1 técnico agrônomo para realizar a da ADEPARÁ. verificação do local para o…`, expectedResult: `Contratação 1 Outubro de 2026 Novembro de Nota fiscal. 2026`, activities: [
        { id: 12002041, name: `Especificação — Contratação 1 Outubro de 2026 Novembro de Nota fiscal. 2026`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200205, name: `2.5 Capacitação de Contratar técnico para treinamento de 3 dias de cooperados para manipular pelo menos 6 cooperad…`, expectedResult: `Contratação 3 Outubro de 2026 Outubro de 2026 Lista de presença e fotos.`, activities: [
        { id: 12002051, name: `Especificação — Contratação 3 Outubro de 2026 Outubro de 2026 Lista de presença e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 12003, name: `3. Capacitar os`, deliverables: [
      { id: 1200301, name: `3.1 Contratar os profissionais Fazer cotação e fechar a contratação de 1`, expectedResult: `Orçamento 1 Fevereiro de Fevereiro de Orçamento e nota fiscal.`, activities: [
        { id: 12003011, name: `Especificação — Orçamento 1 Fevereiro de Fevereiro de Orçamento e nota fiscal.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  13: [
  ],
  14: [
  ],
  15: [
    { id: 15001, name: `1. reunião geral com o público alvo do projeto aprovado e seleção das famílias whatsapp, com estimativa de 30`, deliverables: [
      { id: 1500101, name: `1.1 apresentação do projeto Mobilizar através de convites e redes de reunião para cada ação proposta.`, expectedResult: `01 01/2026 02/2026 lista de presença, fotos, notas fiscais. pessoas, em aproximadamente 6 horas de trabalho. Será coordenada pela equipe gestora da cooperativa e do projeto.`, activities: [
        { id: 15001011, name: `Especificação — 01 01/2026 02/2026 lista de presença, fotos, notas fiscais. pessoas, em aproximadamente 6…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500102, name: `1.2 Etapa`, expectedResult: ``, activities: [
        { id: 15001021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500103, name: `1.3 Etapa`, expectedResult: ``, activities: [
        { id: 15001031, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15002, name: `2. capacitações técnicas 3.produção de mudas`, deliverables: [
      { id: 1500201, name: `2.1 implantação hortas As oficinas serão ministradas por oficina comunitária`, expectedResult: `02 03/2026 03/2026 lista de presença, fotos, técnicos contratados das comunidades notas fiscais. emissão de locais, com perfil do trabalho certificado comunitário, com carga horária de 20 horas cada oficina em 02 territórios`, activities: [
        { id: 15002011, name: `Especificação — 02 03/2026 03/2026 lista de presença, fotos, técnicos contratados das comunidades notas fi…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500202, name: `2.2 criação de aves comunitária As oficinas serão ministradas por oficina manutenção e sistemas solar A oficina se…`, expectedResult: `02 04/2026 04/2026 listas de presença, fotos, técnicos contratados das comunidades notas, emissão de locais, com perfil do trabalho certificados. comunitário, com carga horária de 20 horas cada oficina, em 02 territórios 01 05/2026 05/2026 lista de presença, fotos, profissional instalação, manutenção e notas fiscais. eletricidade, contratado, com carga horária de 20 horas N/A 01/2026 05/2026 fotos e planilha de plantadas pelos comunitários nos anotação próprios territórios (assentamentos PEAEX).`, activities: [
        { id: 15002021, name: `Especificação — 02 04/2026 04/2026 listas de presença, fotos, técnicos contratados das comunidades notas,…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15003, name: `3. Meta 3`, deliverables: [
      { id: 1500301, name: `3.2 crescimento, As ações serão desenvolvidas pelos N/A acompanhamento`, expectedResult: `N/A 01/2026 10/2026 fotos e planilha de próprios comunitários, com anotação acompanhamento de um técnico`, activities: [
        { id: 15003011, name: `Especificação — N/A 01/2026 10/2026 fotos e planilha de próprios comunitários, com anotação acompanhamento…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500302, name: `3.3 Plantio`, expectedResult: `O plantio será feito pelos comunitários Mudas 0 10/2026 10/2026 fotos, coordenada com orientação de um técnico, geográfica da area conforme o crescimento plantada, notas fiscais (desenvolvimento) do ciclo de vida de de pagamentos por cada espécie. serviços ambientais por mudas plantadas`, activities: [
        { id: 15003021, name: `Especificação — O plantio será feito pelos comunitários Mudas 0 10/2026 10/2026 fotos, coordenada com orie…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15004, name: `4. implantação das das hortas comunitárias 5. implantação da criação de aves 6. Compra instalação dos kit de internet 7. Compra e instalação co…`, deliverables: [
      { id: 1500401, name: `4.1 construção e plantio`, expectedResult: `A construção e plantio será pela hortas 02 04/2026 07/2026 fotos, notas fiscais, comunidade local com orientação de lista de presença um técnico`, activities: [
        { id: 15004011, name: `Especificação — A construção e plantio será pela hortas 02 04/2026 07/2026 fotos, notas fiscais, comunidad…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500402, name: `4.2 Etapa`, expectedResult: ``, activities: [
        { id: 15004021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500403, name: `4.3 Reparo dos aviários (telagem, coberturas, piso), compra dos pintos, ração e bebedouro. compra dos kits assembl…`, expectedResult: `As atividades serão feitas pelas aviários 02 04/2026 07/2026 notas fiscais, fotos, lista famílias envolvidas, com orientação de presença técnica As compras e instalação serão feitas kit de internet 02 01/2026 04/2026 notas fiscais, fotos pela equipe responsável do projeto, conselho fiscal e logística. As compras e instalação serão feitas abastecimento 02 01/2026 05/2026 notas fiscais, fotos pela equipe responsável do projeto, de água conselho fiscal e logística As compras serão feitas pela equipe kit energia 01 01/2026 06/2026 notas fiscais, fotos responsável do projeto, conselho fiscal solar e logística, instalada por um técnico profissional. compra de materiais de construção e reforma 01 01/2026 08/2026 fotos, notas fiscais. pagamento de mao de obra A equipe gestoras enviará os prestação de 01 11/2026 11/2026 notas fiscais, documentos e fará assembleia geral contas relatório(fluxo de caixa) com os envolvidos, publicará os ,fotos, vídeos. resultados`, activities: [
        { id: 15004031, name: `Especificação — As atividades serão feitas pelas aviários 02 04/2026 07/2026 notas fiscais, fotos, lista f…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  16: [
    { id: 16001, name: `1. Infraestrutura 2.Equipamentos`, deliverables: [
      { id: 1600101, name: `1.1 Construção; 1 Agroindústria Construída e Agroindústria`, expectedResult: `adequada às normas da UNIDADE Jan 2026 Mar 2026 RECIBOS;`, activities: [
        { id: 16001011, name: `Especificação — adequada às normas da UNIDADE Jan 2026 Mar 2026 RECIBOS;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600102, name: `1.2 Adequação Elétrica e hidráulica/sanitária`, expectedResult: `ADEPARÁ 1 NOTAS FISCAIS; REGISTROS`, activities: [
        { id: 16001021, name: `Especificação — ADEPARÁ 1 NOTAS FISCAIS; REGISTROS`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600103, name: `1.3 Pintura e Acabamento Aquisição e instalação do forno elétrico`, expectedResult: `FOTOGRÁFICOS 1 Agroindústria equipada RECIBOS; com 7 equipamentos UNIDADE 1 Mar 2026 Abr 2026 NOTAS FISCAIS;`, activities: [
        { id: 16001031, name: `Especificação — FOTOGRÁFICOS 1 Agroindústria equipada RECIBOS; com 7 equipamentos UNIDADE 1 Mar 2026 Abr 2…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16002, name: `2. Meta 2`, deliverables: [
      { id: 1600201, name: `2.2 Prensa, descascador; balança. Seladora, freezers,mesas inox.`, expectedResult: `essenciais. REGISTROS FOTOGRÁFICOS`, activities: [
        { id: 16002011, name: `Especificação — essenciais. REGISTROS FOTOGRÁFICOS`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16003, name: `3. Capacitações 4.Certificação Consultoria especializada e acompanhamento para obtenção de certificado ADEPARÁ 5.Serviço de 5,1 Serviços contáb…`, deliverables: [
      { id: 1600301, name: `3.1 Realização de 4 cursos`, expectedResult: `Realização de 4 cursos`, activities: [
        { id: 16003011, name: `Especificação — Realização de 4 cursos`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600302, name: `3.2 Boas práticas de 20 Mulheres capacitadas em PESSOAS fabricação, gestão de negócios Certificação sanitária unid…`, expectedResult: `20 Abr 2026 Jul 2026 LISTA DE 4 cursos ( total de 160h) PRESENÇA; CERTIFICADOS; RELATÓRIOS UNIDADE 1 Jul 2026 Set 2026 Certificado da ADEPARÁ ADEPARÁ Recibos e UNIDADE 1 set 2026 Dez 2026 Extratos bancários`, activities: [
        { id: 16003021, name: `Especificação — 20 Abr 2026 Jul 2026 LISTA DE 4 cursos ( total de 160h) PRESENÇA; CERTIFICADOS; RELATÓRIOS…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  17: [
    { id: 17001, name: `1. Promover formação|oficinas para formação potencializar com qualidade as coletas de sementes nativas diversificadas.`, deliverables: [
      { id: 1700101, name: `1.1 Apoiar as Oficinas de`, expectedResult: `As oficinas serão feitas com Oficinas 1 Dezembro/1 Agosto/1 NF, Recibos, Lista de profissionais consultores via ano ano presença, certificado parceiros e anciões mestres nativos, 1 1 emitido. com 60 participantes, com duração de 5 dias cada, com carga horário total de 40 horas.`, activities: [
        { id: 17001011, name: `Especificação — As oficinas serão feitas com Oficinas 1 Dezembro/1 Agosto/1 NF, Recibos, Lista de profissi…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700102, name: `1.2 Aquisição de óleo 2 tempo e combustíveis (Gasolina e diesel)`, expectedResult: `Realizar pesquisa de preços em 3 Litros 5999 + 131 Dezembro/1 Agosto/1 Orçamentos e Notas fornecedores locais ano ano fiscal (preferencialmente). 1 1`, activities: [
        { id: 17001021, name: `Especificação — Realizar pesquisa de preços em 3 Litros 5999 + 131 Dezembro/1 Agosto/1 Orçamentos e Notas…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700103, name: `1.3 Alimentação`, expectedResult: `Realizar pesquisa de preços em 3 Pessoas 60 Dezembro/1 Agosto/1 Notas fiscal e lista de fornecedores locais ano ano presença (preferencialmente). 1 1`, activities: [
        { id: 17001031, name: `Especificação — Realizar pesquisa de preços em 3 Pessoas 60 Dezembro/1 Agosto/1 Notas fiscal e lista de fo…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700104, name: `1.4 Compra de materiais de Serão adquiridos Papel A4, canetas, Unidades 36 escritório (papelaria)`, expectedResult: `Dezembro/1 Agosto/1 Notas fiscal barbantes, blocos de anotação, fita ano1 ano1 durex para 60 participantes das oficinas.`, activities: [
        { id: 17001041, name: `Especificação — Dezembro/1 Agosto/1 Notas fiscal barbantes, blocos de anotação, fita ano1 ano1 durex para…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 17002, name: `2. Modernizar com introdução de novas ferramentas e beneficiamento de sementes para melhorar o manejo e conservação das sementes nativas`, deliverables: [
      { id: 1700201, name: `2.1 Aquisição de Material permanente/equipamentos (quebradeira de castanha e furadeira)`, expectedResult: `Realizar pesquisa de preços em 3 Equipament 20 Dezembro/1 Agosto/1 Notas fiscal fornecedores locais o ano1 ano1 (preferencialmente).`, activities: [
        { id: 17002011, name: `Especificação — Realizar pesquisa de preços em 3 Equipament 20 Dezembro/1 Agosto/1 Notas fiscal fornecedor…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700202, name: `2.2 Etapa`, expectedResult: ``, activities: [
        { id: 17002021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700203, name: `2.3 Etapa`, expectedResult: ``, activities: [
        { id: 17002031, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 17003, name: `3. Ajudar na safra de castanha, cumaru e sementes de morototó`, deliverables: [
      { id: 1700301, name: `3.1 Aquisição de 1 câmera profissional para registros fotográficos`, expectedResult: `Realizar pesquisa de preços em 3 Equipament 1 Dezembro/1 Agosto/1 Notas fiscal fornecedores locais os ano1 ano1 (preferencialmente).`, activities: [
        { id: 17003011, name: `Especificação — Realizar pesquisa de preços em 3 Equipament 1 Dezembro/1 Agosto/1 Notas fiscal fornecedore…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700302, name: `3.2 Etapa`, expectedResult: ``, activities: [
        { id: 17003021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700303, name: `3.3 Etapa`, expectedResult: ``, activities: [
        { id: 17003031, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 17004, name: `4. Apoiar a comercialização dos produtos artesanais ...`, deliverables: [
      { id: 1700401, name: `4.1 Criar estratégias de comercialização de produtos em feiras e eventos.`, expectedResult: `Promover treinamentos de vendas Treinamento 1 Dezembro/1 Agosto/1 Lista de presença e para 8 mulheres atuantes na Lojinha ano1 ano1 certificados emitidos da comunidade, com carga horário de 20 horas total`, activities: [
        { id: 17004011, name: `Especificação — Promover treinamentos de vendas Treinamento 1 Dezembro/1 Agosto/1 Lista de presença e para…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700402, name: `4.2 Aquisição de etiquetas Realizar pesquisa de preços em 3 Serviços de com logo marca da instituição fornecedores…`, expectedResult: `1 Dezembro/1 Agosto/1 Notas fiscal Terceiros ano1 ano1 (preferencialmente).`, activities: [
        { id: 17004021, name: `Especificação — 1 Dezembro/1 Agosto/1 Notas fiscal Terceiros ano1 ano1 (preferencialmente).`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700403, name: `4.3 Tarifas bancárias`, expectedResult: `Pagamentos mensais Custos 12 Dezembro/1 Agosto/1 extrato administrativ ano1 ano1 os`, activities: [
        { id: 17004031, name: `Especificação — Pagamentos mensais Custos 12 Dezembro/1 Agosto/1 extrato administrativ ano1 ano1 os`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  18: [
  ],
  19: [
    { id: 19001, name: `1. Construção da infraestrutura`, deliverables: [
      { id: 1900101, name: `1.1 Licença de instalação`, expectedResult: `Ir na Secretaria de Agricultura/Secretaria de Atividade Meio Ambiente para buscar orientações para a obtenção da licença.`, activities: [
        { id: 19001011, name: `Especificação — Ir na Secretaria de Agricultura/Secretaria de Atividade Meio Ambiente para buscar orientaç…`, responsible: ``, plannedDate: `Mês 1–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Licença/Dispensa de Instalação` },
      ] },
      { id: 1900102, name: `1.2 Elaborar projetos estruturais. Levantamento de orçamentos de materiais da obra. Levantamento de A diretoria pe…`, expectedResult: `Contratação do responsável técnico para Contrato elaborar a planta do projeto. A diretoria pesquisar por três orçamentos a fim Orçamentos de encontrar os melhores preços`, activities: [
        { id: 19001021, name: `Especificação — Contratação do responsável técnico para Contrato elaborar a planta do projeto. A diretoria…`, responsible: ``, plannedDate: `Mês 1–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato e comprovantes de pagamento Documento de cada orçamento cotado Documento de cada orçamento cotado` },
      ] },
      { id: 1900103, name: `1.5 Execução da obra Construção da agroindústria`, expectedResult: `Fotos / Notas fiscais e/ou recibos`, activities: [
        { id: 19001031, name: `Especificação — Fotos / Notas fiscais e/ou recibos`, responsible: ``, plannedDate: `Mês 4–Mês 8`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Fotos, notas fiscais e/ou recibos` },
      ] },
    ] },
    { id: 19002, name: `2. Aquisição de Equipamentos`, deliverables: [
      { id: 1900201, name: `2.1 Orçamentos de A diretoria pesquisar por três orçamentos a fim Orçamentos equipamentos e frete. de encontrar os…`, expectedResult: `Orçamentos de A diretoria pesquisar por três orçamentos a fim Orçamentos equipamentos e frete. de encontrar os melhores preços`, activities: [
        { id: 19002011, name: `Especificação — Orçamentos de A diretoria pesquisar por três orçamentos a fim Orçamentos equipamentos e fr…`, responsible: ``, plannedDate: `Mês 3–Mês 5`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Orçamentos` },
      ] },
      { id: 1900202, name: `2.2 Comprar equipamentos A diretoria da Cooperativa irá analisar os orçamentos conforme melhor preço e garantias`, expectedResult: `Orçamentos`, activities: [
        { id: 19002021, name: `Especificação — Orçamentos`, responsible: ``, plannedDate: `Mês 4–Mês 6`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas fiscais` },
      ] },
      { id: 1900203, name: `2.3 Instalar equipamentos 01 técnico Contratado para apoiar a diretoria a Contrato identificar os equipamentos mai…`, expectedResult: `Instalar equipamentos 01 técnico Contratado para apoiar a diretoria a Contrato identificar os equipamentos mais adequados`, activities: [
        { id: 19002031, name: `Especificação — Instalar equipamentos 01 técnico Contratado para apoiar a diretoria a Contrato identificar…`, responsible: ``, plannedDate: `Mês 4–Mês 6`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato` },
      ] },
    ] },
    { id: 19003, name: `3. Capacitações`, deliverables: [
      { id: 1900301, name: `3.1 Orçamento para A diretoria irá identificar um profissional que Contrato contratação para capacitação possa rea…`, expectedResult: `Orçamento para A diretoria irá identificar um profissional que Contrato contratação para capacitação possa realizar a capacitação dos(as) de uso dos equipamentos cooperados(as) para manusear os equipamentos.`, activities: [
        { id: 19003011, name: `Especificação — Orçamento para A diretoria irá identificar um profissional que Contrato contratação para c…`, responsible: ``, plannedDate: `Mês 7–Mês 8`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato` },
      ] },
      { id: 1900302, name: `3.2 Orçamento para A diretoria irá identificar um profissional que Contrato capacitação em boas práticas possa rea…`, expectedResult: `Orçamento para A diretoria irá identificar um profissional que Contrato capacitação em boas práticas possa realizar a capacitação dos(as) de produção cooperados(as) para manusear os equipamentos`, activities: [
        { id: 19003021, name: `Especificação — Orçamento para A diretoria irá identificar um profissional que Contrato capacitação em boa…`, responsible: ``, plannedDate: `Mês 7–Mês 8`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato` },
      ] },
      { id: 1900303, name: `3.3 Definição de cronogramas A diretoria irá definir o cronograma e e detalhes da programação detalhamento para re…`, expectedResult: `Ata de reunião da 2 diretoria`, activities: [
        { id: 19003031, name: `Especificação — Ata de reunião da 2 diretoria`, responsible: ``, plannedDate: `Mês 7–Mês 8`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900304, name: `3.4 Realizar ambas as A diretoria irá convidar e realizar as capacitações capacitações para os(as) cooperados(as)`, expectedResult: `Lista de presença e 2 fotos`, activities: [
        { id: 19003041, name: `Especificação — Lista de presença e 2 fotos`, responsible: ``, plannedDate: `Mês 8–Mês 10`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 19004, name: `4. Certificação ADEPARA`, deliverables: [
      { id: 1900401, name: `4.1 Levantamento de A diretoria irá na ADEPARÀ buscar orientações necessidades para para a construção da agroindús…`, expectedResult: `Levantamento de A diretoria irá na ADEPARÀ buscar orientações necessidades para para a construção da agroindústria dentro das licenciamento na ADEPARÁ normas existentes`, activities: [
        { id: 19004011, name: `Especificação — Levantamento de A diretoria irá na ADEPARÀ buscar orientações necessidades para para a con…`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900402, name: `4.2 Procurar ADEPARA para A diretoria enviará o ofício solicitando a vistoria Ofício certificar a agroindustria pa…`, expectedResult: `Procurar ADEPARA para A diretoria enviará o ofício solicitando a vistoria Ofício certificar a agroindustria para adquirir a licença`, activities: [
        { id: 19004021, name: `Especificação — Procurar ADEPARA para A diretoria enviará o ofício solicitando a vistoria Ofício certifica…`, responsible: ``, plannedDate: `Mês 8–Mês 9`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 19005, name: `5. Comunicação e Lançamento da Marca. comunicação/Procurar`, deliverables: [
      { id: 1900501, name: `5.1 Orçar uma empresa de Procurar um profissional que tenha competência Contrato técnica para adequar a identidade…`, expectedResult: `Orçar uma empresa de Procurar um profissional que tenha competência Contrato técnica para adequar a identidade da cooperativa para os produtos, assim como auxiliar nas Parceiros estratégias de lançamento.`, activities: [
        { id: 19005011, name: `Especificação — Orçar uma empresa de Procurar um profissional que tenha competência Contrato técnica para…`, responsible: ``, plannedDate: `Mês 2–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900502, name: `5.2 Definir Manual de Marca da O Profissional irá elaborar manual de marca adequando a identidade visual da cooper…`, expectedResult: `Manual de marca 1 aos produtos.`, activities: [
        { id: 19005021, name: `Especificação — Manual de marca 1 aos produtos.`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900503, name: `5.3 Definir canais de comunicação e público alvo.`, expectedResult: `O Profissional entregará um documento Documento sugerindo os melhores canais de comunicação e o público alvo do produto,`, activities: [
        { id: 19005031, name: `Especificação — O Profissional entregará um documento Documento sugerindo os melhores canais de comunicaçã…`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900504, name: `5.4 Definir estratégia de marketing`, expectedResult: `O Profissional irá definir as estratégias de Documento comunicação para atingir o público alvo`, activities: [
        { id: 19005041, name: `Especificação — O Profissional irá definir as estratégias de Documento comunicação para atingir o público…`, responsible: ``, plannedDate: `Mês 4–Mês 5`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900505, name: `5.5 Validação`, expectedResult: `Validação de todo material entregue pelo Reunião profissional contratado com a diretoria através de uma reunião.`, activities: [
        { id: 19005051, name: `Especificação — Validação de todo material entregue pelo Reunião profissional contratado com a diretoria a…`, responsible: ``, plannedDate: `Mês 5–Mês 6`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900506, name: `5.6 Evento de lançamento`, expectedResult: `Um evento de lançamento do produto e da Evento agroindústria aberto ao público com intuito de apresentar o produto.`, activities: [
        { id: 19005061, name: `Especificação — Um evento de lançamento do produto e da Evento agroindústria aberto ao público com intuito…`, responsible: ``, plannedDate: `Mês 10–Mês 10`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
};
