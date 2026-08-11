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
      { id: 200301, name: `3.1 Seleção da PJ para Envio de carta convite para execução da infraestrutura seleção da empresa para executar da…`, expectedResult: `Contrato`, activities: [
        { id: 2003011, name: `Especificação — Contrato`, responsible: ``, plannedDate: `Mês/01–Mês/01`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Disponibilização da carta convite enviada às empresas convidadas.` },
      ] },
      { id: 200302, name: `3.2 Elaboração de contrato Oficializar a assinatura do com a PJ; contrato e definir as parcelas de desembolso.`, expectedResult: `Contrato`, activities: [
        { id: 2003021, name: `Especificação — Contrato`, responsible: ``, plannedDate: `Mês/02–Mês/02`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Disponibilização do` },
      ] },
      { id: 200303, name: `3.3 Contratação do PJ Assinatura do contrato`, expectedResult: `Contrato`, activities: [
        { id: 2003031, name: `Especificação — Contrato`, responsible: ``, plannedDate: `Mês/02–Mês/02`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200304, name: `3.4 Construção da estrutura Atividade de mão de obra pela da agroindústria PJ contratada. 30 dias de mão de obra.`, expectedResult: `Contrato`, activities: [
        { id: 2003041, name: `Especificação — Contrato`, responsible: ``, plannedDate: `Mês/03–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2004, name: `4. Compra de material para construção da infraestrutura.`, deliverables: [
      { id: 200401, name: `4.1 Cotação de preços Análise pela financeira dos custo benefício técnica para otimizar os recursos do orçamento.`, expectedResult: `coordenação Avaliação`, activities: [
        { id: 2004011, name: `Especificação — coordenação Avaliação`, responsible: ``, plannedDate: `Mês/02–Mês/02`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
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
      { id: 200502, name: `5.2 Escolha do orçamento Análise pela financeira dos custo benefício técnica para otimizar os recursos do orçament…`, expectedResult: `coordenação Avaliação`, activities: [
        { id: 2005021, name: `Especificação — coordenação Avaliação`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200503, name: `5.3 Compra dos Duas pessoas realizarão a compra Equipamentos equipamentos dos materiais.`, expectedResult: `Compra dos Duas pessoas realizarão a compra Equipamentos equipamentos dos materiais.`, activities: [
        { id: 2005031, name: `Especificação — Compra dos Duas pessoas realizarão a compra Equipamentos equipamentos dos materiais.`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2006, name: `6. Instalação dos equipamentos`, deliverables: [
      { id: 200601, name: `6.1 Cotação de PJ Fazer cotação em três empresas diferentes os valores dos equipamentos.`, expectedResult: `Orçamento`, activities: [
        { id: 2006011, name: `Especificação — Orçamento`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200602, name: `6.2 Escolha do orçamento Análise e seleção coordenação financeira dos custo benefício para otimizar os recursos do…`, expectedResult: `pela Orçamento`, activities: [
        { id: 2006021, name: `Especificação — pela Orçamento`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `orçamento selecionado.` },
      ] },
      { id: 200603, name: `6.3 Contratação do PJ e Assinatura do contrato assinatura do contrato.`, expectedResult: `Contrato`, activities: [
        { id: 2006031, name: `Especificação — Contrato`, responsible: ``, plannedDate: `Mês/04–Mês/04`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `assinado` },
      ] },
    ] },
    { id: 2007, name: `7. Formação técnica`, deliverables: [
      { id: 200701, name: `7.1 Contratação de um Formação que irá abranger 30 técnico especialista em pessoas de cada uma das duas manejo agr…`, expectedResult: `Assessoria`, activities: [
        { id: 2007011, name: `Especificação — Assessoria`, responsible: ``, plannedDate: `Mês/05–Mês/05`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200702, name: `7.2 Realização das Das 60 pessoas em formação, 30 Formações formações e capacitações serão mulheres, 15 jovens e 1…`, expectedResult: `Realização das Das 60 pessoas em formação, 30 Formações formações e capacitações serão mulheres, 15 jovens e 15 homens adultos.`, activities: [
        { id: 2007021, name: `Especificação — Realização das Das 60 pessoas em formação, 30 Formações formações e capacitações serão mul…`, responsible: ``, plannedDate: `Mês/05–Mês/06`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200703, name: `7.3 Entrega de certificados No final será entregue das capacitações executadas certificados aos participantes e e…`, expectedResult: `Certificado,`, activities: [
        { id: 2007031, name: `Especificação — Certificado,`, responsible: ``, plannedDate: `Mês/05–Mês/06`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
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
      { id: 300108, name: `1.9 Inauguração das A AMIG irá realizar a solenidade de Placas de Casas de Artesanato e inauguração da casa. Iremo…`, expectedResult: `Inauguração das A AMIG irá realizar a solenidade de Placas de Casas de Artesanato e inauguração da casa. Iremos convidar parceiros inauguração institucionais para organização e participação Sementes nas solenidades de inauguração das Casas.`, activities: [
        { id: 3001081, name: `Especificação — Inauguração das A AMIG irá realizar a solenidade de Placas de Casas de Artesanato e inaugu…`, responsible: ``, plannedDate: `Mês 8–Mês 8`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `das Casas` },
      ] },
    ] },
    { id: 3002, name: `2. Formações de mulheres e jovens em negócios e Plano de Negócios para a participantes e professores das Oficinas. vendas e elaboração do venda…`, deliverables: [
      { id: 300201, name: `2.1 realizar 3 oficinas nas A AMIG vai organizar junto com os Número de 03 aldeias de formação de coordenadores do…`, expectedResult: `negócios elaborado de`, activities: [
        { id: 3002011, name: `Especificação — negócios elaborado de`, responsible: ``, plannedDate: `Mês 9–Mês 9`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `oficinas` },
      ] },
    ] },
    { id: 3003, name: `3. Formação de jovens indígenas em mídias digitais`, deliverables: [
      { id: 300301, name: `3.1 realizar 01 oficina de Será realizada uma oficina sobre mídias jovens formados mídias digitais e digitais para…`, expectedResult: `em mídias digitais`, activities: [
        { id: 3003011, name: `Especificação — em mídias digitais`, responsible: ``, plannedDate: `Mês 10–Mês 10`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Oficina` },
      ] },
    ] },
    { id: 3004, name: `4. Produção do site de venda do artesanato e biojoias produzidas nas casas de artesanato`, deliverables: [
      { id: 300401, name: `4.1 contratar empresa O projeto irá contratar um empresa de site e instagram para produção de site comunicação e p…`, expectedResult: `criados ATA das reuniões`, activities: [
        { id: 3004011, name: `Especificação — criados ATA das reuniões`, responsible: ``, plannedDate: `Mês 7–Mês 11`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato assinado com a empresa` },
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
  ],
  7: [
    { id: 7001, name: `1. Cotação e Contratação de fornecedores de produtos (materiais de construção) e serviços (arquiteto, engenheiro e outros)`, deliverables: [
      { id: 700101, name: `1.1 Cotação de preços e contratação de serviços de construção`, expectedResult: `Atividade realizada pela equipe Serviço 01 01/2026 02/2026 Orçamentos recebidos técnica do projeto, em dias, considerando melhor preço e proposta.`, activities: [
        { id: 7001011, name: `Especificação — Atividade realizada pela equipe Serviço 01 01/2026 02/2026 Orçamentos recebidos técnica do…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700102, name: `1.2 Fase 1: avaliação da estrutura física atual da sede da ATAIC`, expectedResult: `Análise da estrutura física para Serviço 01 02/2026 02/2026 Parecer técnico do reaproveitamento de espaços e profissional contratado e nota fiscal do serviço. materiais. Essa ação será desenvolvida pelos técnicos contratados para a construção das instalações, no período de 07 dias.`, activities: [
        { id: 7001021, name: `Especificação — Análise da estrutura física para Serviço 01 02/2026 02/2026 Parecer técnico do reaproveita…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700103, name: `1.3 Fase 2: Construção dos espaços conforme planta arquitetônica.`, expectedResult: `Construção das estruturas físicas, Serviço 01 03/2026/ 08/2026 Relatório descritivo, de acordo com a planta fotográfico e nota fiscal de serviços arquitetônica elaborada Essa atividade será realizada no período de 150 dias.`, activities: [
        { id: 7001031, name: `Especificação — Construção das estruturas físicas, Serviço 01 03/2026/ 08/2026 Relatório descritivo, de ac…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700104, name: `1.4 Fase 3: Acabamento e reparos`, expectedResult: `Instalações elétricas, hidráulicas Serviço 01 07/2026 09/2026 Relatório descritivo, e pintura dos espaços, a ser fotográfico e nota fiscal de serviços realizado pelos profissionais contratados, no período de 60 dias`, activities: [
        { id: 7001041, name: `Especificação — Instalações elétricas, hidráulicas Serviço 01 07/2026 09/2026 Relatório descritivo, e pint…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 7002, name: `2. Formação da equipe gestora do Centro de formação`, deliverables: [
      { id: 700201, name: `2.1 Prospecção de formações a serem realizadas`, expectedResult: `Realização de diagnóstico de Serviço 01 05/2026 07/2026 Relatório descritivo, identificação de formações de fotográfico e nota fiscal de serviços interesse dos beneficiários diretos e indiretos da proposta, desenvolvido por equipe técnica responsável com o apoio de assessoria, a ser contratada. Será desenvolvido no período de 60 dias`, activities: [
        { id: 7002011, name: `Especificação — Realização de diagnóstico de Serviço 01 05/2026 07/2026 Relatório descritivo, identificaçã…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700202, name: `2.2 Criar e formar equipe gestora do Centro de formação.`, expectedResult: `Mobilização, seleção e Capacitação 03 08/2026 10/2026 Relatório descritivo, capacitação da equipe gestora do fotográfico e nota fiscal de serviços Centro de Formação, definindo papeis e responsabilidades. Essa tarefa será realizada pela diretoria da ATAIC e equipe do Projeto, em um período de 60 dias`, activities: [
        { id: 7002021, name: `Especificação — Mobilização, seleção e Capacitação 03 08/2026 10/2026 Relatório descritivo, capacitação da…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
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
      { id: 800201, name: `2.1 Contratação de Profissional da área de agronomia profissionais para assessorar (Agrônomo ou afim), para orient…`, expectedResult: `Profissionais 3 1 direitos quilombolas, contratação de profissional para mobilização de recursos .`, activities: [
        { id: 8002011, name: `Especificação — Profissionais 3 1 direitos quilombolas, contratação de profissional para mobilização de re…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Lista de assinatura, relatório fotográfico,` },
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
      { id: 800303, name: `3.3 Etapa`, expectedResult: ``, activities: [
        { id: 8003031, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 8004, name: `4. Construir e equipar um espaço físico comunitário multifuncional construção, definição dos até o final do projeto, para abrigar atividades`, deliverables: [
      { id: 800401, name: `4.1 definição do terreno/comunidade, preparação do espaço, compra dos materiais de profissionais/comunitários, ini…`, expectedResult: `Construção do espaço e liberação de uso Local liberado para uso 1 2 8`, activities: [
        { id: 8004011, name: `Especificação — Construção do espaço e liberação de uso Local liberado para uso 1 2 8`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800402, name: `4.2 Etapa`, expectedResult: ``, activities: [
        { id: 8004021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800403, name: `4.3 Etapa`, expectedResult: ``, activities: [
        { id: 8004031, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  9: [
    { id: 9001, name: `1. Realizar reuniões de stakeholders; alinhamento com equipe interna e parceiros institucionais, lançamento de editais e chamadas para profissi…`, deliverables: [
      { id: 900101, name: `1.1 Reuniões com`, expectedResult: `- 1ª semana – Reunião com a Reuniões 2 JAN JAN 2026 Fotos equipe de coordenação e 2026 Lista de execução (incluindo pontos frequência focais - diárias) Alinhamento Ata da reunião geral Nota fiscal -2ª semana – Reunião com parceiros – (EMATER, UFOPA, Associações indígenas, IFPA, OCB, SENAR etc`, activities: [
        { id: 9001011, name: `Especificação — - 1ª semana – Reunião com a Reuniões 2 JAN JAN 2026 Fotos equipe de coordenação e 2026 Lis…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900102, name: `1.2 Publicação de edital; Lançamento do banco de talentos para quando precisarmos dos profissionais, eles já estar…`, expectedResult: `Edital para 2 JAN 2026 JAN 2026 Planilhas com talentos do projeto, chamada voluntário dados para voluntários: s e banco digitalizados de Análise curricular de de talentos inscritos no profissionais; formulário de chamada dos voluntários e para o banco de talentos. Formação de banco de talentos: Banco de 1 JAN 2026 JAN 2026 Planilhas com Essas contratações serão para talentos dados serviços pontuais como: digitalizados dos facilitação de oficinas, currículos motorista, cozinheiro etc; (por recebidos; isso trabalhamos com banco de`, activities: [
        { id: 9001021, name: `Especificação — Edital para 2 JAN 2026 JAN 2026 Planilhas com talentos do projeto, chamada voluntário dado…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900103, name: `1.3 a serem adquiridos pelo projeto; realizadas Análise de preço, qualidade, tempo de entrega de materiais.`, expectedResult: `AN 2026 JAN 2026 Cotações emitidas por lojas ou prestadores de serviço;`, activities: [
        { id: 9001031, name: `Especificação — AN 2026 JAN 2026 Cotações emitidas por lojas ou prestadores de serviço;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900104, name: `1.4 Pagamento para a aquisição de materiais e serviços (equipamentos, gráfica, combustível etc) Entrega - Análise…`, expectedResult: `Compra e Aquisiçã JAN 2026 JAN 2026 Notas fiscais e entregas o das recibos de compras materiais Inventário patrimonial de materiais adquiridos pelo projeto;`, activities: [
        { id: 9001041, name: `Especificação — Compra e Aquisiçã JAN 2026 JAN 2026 Notas fiscais e entregas o das recibos de compras mate…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9002, name: `2. 2 EXECUÇÃO DAS OFICINAS planejamento da oficina, Reunião com equipe de E com o mesmo conteúdo coordenação e execução e TREINAMENTO para ser…`, deliverables: [
      { id: 900201, name: `2.1 Reuniões para dois territórios, recibos da gráfica.`, expectedResult: `1ª semana Reuniões 7 FEV 2026 FEV 2026 Fotos Lista de frequência Ata de reunião Elaboração de Termo de Termo de de facilitadores e suporte técnico referência e (Facilitadores deverão elaborar conteúdo programático do curso, Contrato de material didático e prático); prestação de serviço assinado 2 e 3ª Semana Termo de adesão Reunião com coordenação, ao serviço equipe técnica (voluntários) e voluntário facilitadores assinado; Análise, revisão e aprovação do material elaborado; Plano pedagógico 3ª semana Material didático Reunião entre coordenação e comunicação – Material de Aprovação da campanha de divulgação divulgação do curso (identidade visual, Lançamento das inscrições, peças, formulários divulgação e mobilização dos etc) participantes Impressão de material didático Formulário de (apostilas, cadernos etc) e inscrição preparação de material de divulgação (camisas, banners etc) Notas fiscais e`, activities: [
        { id: 9002011, name: `Especificação — 1ª semana Reuniões 7 FEV 2026 FEV 2026 Fotos Lista de frequência Ata de reunião Elaboração…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900202, name: `2.2 na oficina; 10 mulheres e jovens no cadastro reserva Criação do grupo de whatsapp para facilitar a comunicação…`, expectedResult: `MAR MAR Ficha de inscrição 2026 2026 grupo de whatsapp Fotos e videos; Nota fiscal Lista de presença 15 certificados entregues Tapajós;`, activities: [
        { id: 9002021, name: `Especificação — MAR MAR Ficha de inscrição 2026 2026 grupo de whatsapp Fotos e videos; Nota fiscal Lista d…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900203, name: `2.3 oficinas; Quantitativos e qualitativos; ão, equipe 2ªsemana – Reunião – Coordenação, equipe executora e facili…`, expectedResult: `Reunião 1 ABRIL ABRIL Lista de com 2026 2026 frequência Coordenaç Ata de reunião Fotos executora e Relatório Geral da facilitador primeira fase es`, activities: [
        { id: 9002031, name: `Especificação — Reunião 1 ABRIL ABRIL Lista de com 2026 2026 frequência Coordenaç Ata de reunião Fotos exe…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9003, name: `3. CICLO FORMATIVO DE planejamento da oficina; Reunião com equipe GESTÃO FINANCEIRA Execução da oficina 1ª semana – Tapajós e planalto Particip…`, deliverables: [
      { id: 900301, name: `3.1 Reuniões para ** Obs: A mesma oficina será realizada nos dois territórios, o conteúdo é o mesmo. Só Referência…`, expectedResult: `1ª semana Reunião 1 MAIO MAIO Fotos 2026 2026 Lista de coordenação frequência Ata de reunião 1ª semana Elaboração de Termo de -Termo de de facilitadores e suporte técnico referência conteúdo programático do curso, -Contrato de material didático e prático); prestação de serviço assinado 2 e 3ª Semana -Termo de adesão Reunião com coordenação, ao serviço equipe tecnica (voluntários) e voluntário facilitadores – assinado; Analise, revisão e aprovação do material elaborado; Plano pedagógico 3ª semana Reunião entre coordenação e comunicação – formulário de Aprovação da campanha de inscrição divulgação do curso Lançamento das inscrições, divulgação e mobilização dos Notas fiscais e participantes recibos da gráfica; Impressão de material didático (apostilas, cadernos etc) e preparção de material de divulgação (camisas, banners etc)`, activities: [
        { id: 9003011, name: `Especificação — 1ª semana Reunião 1 MAIO MAIO Fotos 2026 2026 Lista de coordenação frequência Ata de reuni…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900302, name: `3.2 30 Mulheres e jovens inscritos es na oficina de gestão financeira do tapajós e Planalto; 10 mulheres e jovens…`, expectedResult: `JUN 2026 JUN 2026 Ficha de inscrição de 30 mulheres e jovens preenchida; Ficha de inscrição de 10 mulheres e jovens preenchida para cadastro reserva; 1 grupo de whatsapp estabelecido com coordenadores, facilitadores e participantes; Fotos e videos; Nota fiscal de aluguel de barco o lancha; Nota fiscal e recibo de alimentação para os dias do evento; Termo de uso de aparelhos que serão usados na oficina 15 certificados entregues Tapajós; Fotos e videos; Nota fiscal e recibos 15 certificados entregues no Planalto.`, activities: [
        { id: 9003021, name: `Especificação — JUN 2026 JUN 2026 Ficha de inscrição de 30 mulheres e jovens preenchida; Ficha de inscriçã…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900303, name: `3.3 Sistematização de dados das oficinas; Quantitativos e qualitativos; ão, equipe 2ªsemana – Reunião – Coordenaçã…`, expectedResult: `Reunião 1 JULHO JULHO Lista de com 2026 2026 frequência Coordenaç Ata de reunião Fotos executora e Relatório Geral da facilitador segunda fase es segunda fase do projeto; 4ªsemana – Entrega do relátorio`, activities: [
        { id: 9003031, name: `Especificação — Reunião 1 JULHO JULHO Lista de com 2026 2026 frequência Coordenaç Ata de reunião Fotos exe…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9004, name: `4. CICLO FORMATIVO DE planejamento da oficina; Reunião com equipe PLANEJAMENT O E GÊNERO Execução da oficina de planejamento planalto e gênero;…`, deliverables: [
      { id: 900401, name: `4.1 Reuniões para ** Obs: A mesma oficina será realizada nos dois territórios, o conteúdo é o mesmo. Só facilitado…`, expectedResult: `1ª semana Reunião 1 AGO AGO Fotos 2026 2026 Lista de coordenação e execução frequência 1ª semana Ata de reunião Elaboração de Termo de -Termo de Refrência TDR para a seleção de referência -Contrato de prestação de Reunião com coordenação, serviço assinado equipe tecnica (voluntários) e -Termo de adesão facilitadores – ao serviço Analise, revisão e aprovação do voluntário material elaborado; assinado; Plano pedagógico 3ª semana Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparação de material de divulgação (camisas, banners etc)`, activities: [
        { id: 9004011, name: `Especificação — 1ª semana Reunião 1 AGO AGO Fotos 2026 2026 Lista de coordenação e execução frequência 1ª…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900402, name: `4.2 1ª semana – Tapajós e 30 Mulheres e jovens inscritos na oficina de planejamento e gênero; 10 mulheres e jovens…`, expectedResult: `Participant 40 SET 2026 SET 2026 Ficha de inscrição es 1 grupo de whatsapp Fotos e videos; Nota fiscal de Fotos e videos Lista de presença 15 certificados entregues Tapajós;`, activities: [
        { id: 9004021, name: `Especificação — Participant 40 SET 2026 SET 2026 Ficha de inscrição es 1 grupo de whatsapp Fotos e videos;…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900403, name: `4.3 Sistematização de dados das oficinas; Quantitativos e qualitativos; 2ªsemana – Reunião – Coordenação, equipe e…`, expectedResult: `Reunião 1 OUT OUT Lista de com 2026 2026 frequência Coordenaç Ata de reunião ão, equipe Fotos executora e Relatório Geral da facilitador terceira fase es Total:30 mulheres e jovens certificados na oficina de planejamento e gênero A SOMA DE VAGAS E PREVISÃO DE CERTIFICAÇÃO AQUI ESTABELECIDA É SUPERIOR A META DE 80 MULHERES CERTIFICADAS DO ESCOPO DO PROJETO, NO ENTANTO, A IDEIA É QUE ALGUMAS MULHERES POSSAM SE CAPACITAR EM 2 OU ATÉ 3 DOS CICLOS OFERTADOS – E MESMO QUE AS FORMAÇÕES CONTEMPLEM MULHERES 100% DIFERENTES AINDA TEMOS UMA MARGEM DE +10 MULHERES CERTIFICADAS QUE SUPERARÁ O PREVISTO;`, activities: [
        { id: 9004031, name: `Especificação — Reunião 1 OUT OUT Lista de com 2026 2026 frequência Coordenaç Ata de reunião ão, equipe Fo…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9005, name: `5. 5-CICLO FORMATIVO INTRODUÇÃO A AGROECOLOGI ** Obs: A mesma A E PRODUÇÃO oficina será realizada ORGÂNICA Execução da introdução a agroecologi…`, deliverables: [
      { id: 900501, name: `5.1 Reuniões para planejamento da oficina; Reunião com equipe nos dois territórios, o conteúdo é o mesmo. Só Refrê…`, expectedResult: `1ª semana Reunião 1 FEV 2026 FEV 2026 Fotos com Lista de coordenação e execução e Coordenaç frequência parcerios (EMATER, IFPA ão, equipe Ata de reunião etc) – executora Elaboração de Termo de e -Termo de referência de facilitadores e suporte es -Contrato de prestação de Reunião com coordenação, serviço assinado equipe técnica (voluntários) e -Termo de adesão facilitadores – ao serviço Análise, revisão e aprovação voluntário do material elaborado; assinado; 3ª semana Plano pedagógico Reunião entre coordenação e comunicação – Material didático Aprovação da campanha de (slides, apostilas, divulgação do curso roteiro de Lançamento das inscrições, atividades divulgação e mobilização dos práticas) Lista de frequência Ata de reunião Fotos`, activities: [
        { id: 9005011, name: `Especificação — 1ª semana Reunião 1 FEV 2026 FEV 2026 Fotos com Lista de coordenação e execução e Coordena…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900502, name: `5.2 Realização da oficina Tapajós Participant 40 e Planalto acomodação, conversa com a comunidade, distribuição do…`, expectedResult: `MAR MAR Fotos e videos es 2026 2026 Lista de presença A LOGÍSTICA NESSE CURSO SERÁ A MESMA DO CURSO DE FERRAMENTAS DIGITAIS, POIS ELES ACONTECERÃO NO MESMO PERÍODO (UM PELA MANHÃ E OUTRO PELA TARDE) A AVALIAÇÃO GERAL TAMBÉM SERÁ REALIZADA EM CONJUNTO COM A AVALIAÇÃO DO CURSO DE FERRAMENTAS`, activities: [
        { id: 9005021, name: `Especificação — MAR MAR Fotos e videos es 2026 2026 Lista de presença A LOGÍSTICA NESSE CURSO SERÁ A MESMA…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9006, name: `6. 6- ELABORAÇÃO DA SECRETARIA DE MULHERES DA COOPAFS`, deliverables: [
      { id: 900601, name: `6.1 – Rodas de conversa - Mobilização de cooperadas Encontro 1 – importância da secretaria de mulheres - Levantame…`, expectedResult: `JUL – JUL – Fotos, vídeos, - Escuta ativa AGO E AGO E lista de presença; SET 2026 SET 2026 Diagnóstico de demandas das cooperadas;`, activities: [
        { id: 9006011, name: `Especificação — JUL – JUL – Fotos, vídeos, - Escuta ativa AGO E AGO E lista de presença; SET 2026 SET 2026…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900602, name: `6.2 - Elaboração do planejamento coletivo`, expectedResult: `- Oficina de cocriação da Oficina 1 Regimento Secretaria – 2hrs interno aprovado -missão, visão e valores Missão, visão e -regimento interno valores -Estrutura mínima estabelecidos; estabelecida: coordenadora, Estrutura mínima secretaria etc estabelecida`, activities: [
        { id: 9006021, name: `Especificação — - Oficina de cocriação da Oficina 1 Regimento Secretaria – 2hrs interno aprovado -missão,…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900603, name: `6.3 – Aprovação em assembleia`, expectedResult: `-Apresentação da proposta à Reunião 1 Secretaria de assembleia geral e diretoria da mulheres da cooperativa assembleia aprovada em AGO, ata, fotos e vídeos.`, activities: [
        { id: 9006031, name: `Especificação — -Apresentação da proposta à Reunião 1 Secretaria de assembleia geral e diretoria da mulher…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9007, name: `7. 7- CAMPANHA DE ASSOCIAÇÃO COOPERATIVIS TA PARA MULHERES INDÍGENAS – MUNDURUKU E TAPAJÓS`, deliverables: [
      { id: 900701, name: `7.1 - Mobilização e sensibilização`, expectedResult: `- Produção de materiais em Material 2 FEV – FEV Fotos, vídeos, linguagem acessível de SET 2026 -SET entrevistas; (cartilhas, áudios, banners marketing 2026 etc) sobre o cooperativismo e a COOPAFS - Inserção de lideranças na campanha;`, activities: [
        { id: 9007011, name: `Especificação — - Produção de materiais em Material 2 FEV – FEV Fotos, vídeos, linguagem acessível de SET…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900702, name: `7.2 – Facilitação ao acesso à cooperativa`, expectedResult: `Abertura de 40 novas vagas Feira 1 OUT - OUT - Ficha de exclusivas para mulheres 2026 2026 demonstração de indígenas que estejam aptas e interesse; tenham interesse na Planilha com cooperativa; dados -Estande de esclarecimentos e sistematizados de diagnóstico paralelo a cada mulheres ação do projeto; indigenas Diagnóstico de CAF interessadas; Levantamento produtivo`, activities: [
        { id: 9007021, name: `Especificação — Abertura de 40 novas vagas Feira 1 OUT - OUT - Ficha de exclusivas para mulheres 2026 2026…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900703, name: `7.3 – Aprovação de novos cooperados em Assembleia`, expectedResult: `Apresentação de mulheres Reunião 1 Out - Out - Ficha de cadastro que passaram na triagem da comunitári 2026 2026 na COOPAFS, cooperativa e estão aptas a se a fotos, videos; associar para a AGO, Contrato de Inserção de pelo menos 5 entrega de mulheres indígenas em alimentos com o programas institucionais PAA nome das e PNAE. cooperadas.`, activities: [
        { id: 9007031, name: `Especificação — Apresentação de mulheres Reunião 1 Out - Out - Ficha de cadastro que passaram na triagem d…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900704, name: `7.4 – Avaliação`, expectedResult: `Elaboração de relatórios e Relatório 1 Ago - Out - Relatório geral sistematização de dados 2026 2026 durante todo o processo`, activities: [
        { id: 9007041, name: `Especificação — Elaboração de relatórios e Relatório 1 Ago - Out - Relatório geral sistematização de dados…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9008, name: `8. 8- 1ª FEIRA DE MULHERES INDÍGENAS DA projeto, executores, COOPAFS`, deliverables: [
      { id: 900801, name: `8.1 – Reunião geral entre coordenação do parceiros e grupos de mulheres responsáveis Mapeamento das expositoras ra…`, expectedResult: `Criação da comissão reunião 1 OUT - OUT - Lista de presença, organizadora (100% de geral: NOV NOV fotos, vídeo; mulheres que participaram comissão 2026 2026 Termo de das oficinas) organizado compromisso assinado com a Definição de espaço, com os comissão Expositora organizadora; financeiro da feira, s definidos`, activities: [
        { id: 9008011, name: `Especificação — Criação da comissão reunião 1 OUT - OUT - Lista de presença, organizadora (100% de geral:…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900802, name: `8.2 – Acompanhamento Grupo de apoio a comissão sistêmico do organizadora criado no planejamento para whatsapp – Me…`, expectedResult: `grupo de 1 Setembro Outubro Grupo de wpp apoio criado 2026 2026 criado no whatsapp com Relatórios coordenador Fotos e vídeos; es, parceiros e especialistas em eventos;`, activities: [
        { id: 9008021, name: `Especificação — grupo de 1 Setembro Outubro Grupo de wpp apoio criado 2026 2026 criado no whatsapp com Rel…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900803, name: `8.3 – DIA DA FEIRA! Mulheres expondo seus produtos Atrações culturais Encerramento oficial do projeto`, expectedResult: `Feira 1 Setembro Outubro Fotos, vídeos, realizada 2026 2026 pesquisas de satisfação, entrevistas, etc`, activities: [
        { id: 9008031, name: `Especificação — Feira 1 Setembro Outubro Fotos, vídeos, realizada 2026 2026 pesquisas de satisfação, entre…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9009, name: `9. 9- RELATÓRIO FINAL`, deliverables: [
      { id: 900901, name: `9.1 Sistematização de Elaboração de relatório todos os dados`, expectedResult: `Relatório 1 Setembro Outubro Relatório FINAL final 2026 2026 Impacto gerado entregue`, activities: [
        { id: 9009011, name: `Especificação — Relatório 1 Setembro Outubro Relatório FINAL final 2026 2026 Impacto gerado entregue`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
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
      { id: 1000303, name: `3.3 Realizar capacitação: manipulação e processamento de alimentos`, expectedResult: `Realizar contratação de profissional habilitado para capacitar os cooperados em manipulação e processamento de alimentos.`, activities: [
        { id: 10003031, name: `Especificação — Realizar contratação de profissional habilitado para capacitar os cooperados em manipulaçã…`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10004, name: `4. Registro`, deliverables: [
      { id: 1000401, name: `4.1 Obter Licença de Operação`, expectedResult: `Solicitação para obter a licença junto a SEMMA municipal`, activities: [
        { id: 10004011, name: `Especificação — Solicitação para obter a licença junto a SEMMA municipal`, responsible: ``, plannedDate: `Mês 3–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000402, name: `4.2 Realizar compra de material de construção / vegalhão diversos Obter registro do estabelecimento e dos produtos…`, expectedResult: `de vergalhão 3/8, vergalhão e arame recozinho. Solicitação para obter registro junto a ADEPARÁ e MAPA.`, activities: [
        { id: 10004021, name: `Especificação — de vergalhão 3/8, vergalhão e arame recozinho. Solicitação para obter registro junto a ADE…`, responsible: ``, plannedDate: `Mês 3–Mês 10`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10005, name: `5. Presatção de Contas`, deliverables: [
      { id: 1000501, name: `5.1 Realizar Prestação de Contas`, expectedResult: `Juntar todos os documentos, notas fiscais, Documento recibos, lista de presença, comprovantes, registros fotográficos, infraestrutura conclúida, máquinas e equipamentos adquiridos em operação, apresentação das polpas produzidas contendo selo e marca própria do produto registrado.`, activities: [
        { id: 10005011, name: `Especificação — Juntar todos os documentos, notas fiscais, Documento recibos, lista de presença, comprovan…`, responsible: ``, plannedDate: `Mês 10–Mês 12`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  11: [
    { id: 11001, name: `1. Implantar uma casa comunitária de produtos arquitetônico em conjunto da agricultura familiar com a comunidade. indigena (dentro do proprio t…`, deliverables: [
      { id: 1100101, name: `1.1 Elaboração do projeto`, expectedResult: `Convocação da comunidade 01 para participar da assembleia geral tendo como pauta a divulgação do projeto.`, activities: [
        { id: 11001011, name: `Especificação — Convocação da comunidade 01 para participar da assembleia geral tendo como pauta a divulga…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `janeiro de 2026 janeiro de 2026 Edital de convocação, registros de atas, e assinaturas dos presentes` },
      ] },
      { id: 1100102, name: `1.2 contratação de empresa Período 01 mês para construção do espaço`, expectedResult: `01`, activities: [
        { id: 11001021, name: `Especificação — 01`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `fevereiro fevereiro Relatórios 2026 2026 mensais ,fotos entre outros meios de verificação.` },
      ] },
      { id: 1100103, name: `1.3 Implantação do projeto Período de 07 meses físico: Construção Civil, por meio de serviços prestados à pessoa f…`, expectedResult: `01 Equipamento para garantir a 01 qualidade de água e de energia. Equipamentos artesanal de despolpamento e armazenamento de frutas`, activities: [
        { id: 11001031, name: `Especificação — 01 Equipamento para garantir a 01 qualidade de água e de energia. Equipamentos artesanal d…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Março Outubro de Relatórios 2026 2026 mensais ,fotos entre outros meios de verificação. Julho 2026 Setembro Relatórios mensais ,fotos entre outros meios de verificação Outubro 2026 Notas fiscais e fotos` },
      ] },
    ] },
    { id: 11002, name: `3. Formações e qualificações`, deliverables: [
      { id: 1100201, name: `3.1 Convocação da comunidade para reunião em da comunidade, tendo como um assembleia geral`, expectedResult: `Contemplar pelo menos 50% A definir A definir público prioritário as mulheres e juventude indigena.`, activities: [
        { id: 11002011, name: `Especificação — Contemplar pelo menos 50% A definir A definir público prioritário as mulheres e juventude…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `mensais ,fotos entre outros meios de verificação.` },
      ] },
      { id: 1100202, name: `3.2 Contratação de profissionais para ministrar as palestras`, expectedResult: `Contemplar pelo menos 50% de A definir A definir Fevereiro/2026 outubro de Relatórios cada público alvo`, activities: [
        { id: 11002021, name: `Especificação — Contemplar pelo menos 50% de A definir A definir Fevereiro/2026 outubro de Relatórios cada…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `2026 mensais ,fotos entre outros meios de verificação.` },
      ] },
      { id: 1100203, name: `3.3 Criação de banner para divulgação das ações desenvolvidas por meio da contemplação do recurso .`, expectedResult: `Contemplar 50% de cada A definir A definir Fevereiro/2 outubro de Relatórios público alvo`, activities: [
        { id: 11002031, name: `Especificação — Contemplar 50% de cada A definir A definir Fevereiro/2 outubro de Relatórios público alvo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `2026 mensais ,fotos entre outros meios de verificação.` },
      ] },
    ] },
    { id: 11003, name: `4. Palestras Temáticas E Oficinas Presenciais ...`, deliverables: [
      { id: 1100301, name: `4.1 Comunidade em geral`, expectedResult: `Contemplar 50% de cada A definir A definir Março/202 outubro de Relatórios público alvo`, activities: [
        { id: 11003011, name: `Especificação — Contemplar 50% de cada A definir A definir Março/202 outubro de Relatórios público alvo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `mensais ,fotos entre outros meios de verificação.` },
      ] },
    ] },
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
    { id: 13001, name: `1. Meta: Mobilização e Diagnóstico Participativo`, deliverables: [
      { id: 1300101, name: `1.1 Mapeamento de áreas deRealização do mapeamento e diagnóstico das Mapeamento coleta das espécies potenciais áre…`, expectedResult: `Mapeamento de áreas deRealização do mapeamento e diagnóstico das Mapeamento coleta das espécies potenciais áreas, rastreando as espécies e potencial das áreas (Murumuru, Buriti e tucumã.). produtivo, com auxílio de profissional florestal e produtivas agronômico, no período 1 mês em parceria com a comunidade, consolidando com um mapa/rota de coleta e possível recuperação de espécies`, activities: [
        { id: 13001011, name: `Especificação — Mapeamento de áreas deRealização do mapeamento e diagnóstico das Mapeamento coleta das esp…`, responsible: ``, plannedDate: `Mês 1–Mês 2`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Mapa de identificação de áreas e espécies. Relatório físico e visual (fotos e vídeos)` },
      ] },
      { id: 1300102, name: `1.2 Cadastramento das Realização de 2 reuniões de Cadastramento das Reuniões de mulheres interessadas e dos mulher…`, expectedResult: `Cadastramento das Realização de 2 reuniões de Cadastramento das Reuniões de mulheres interessadas e dos mulheres/famílias envolvidas no projeto, pela Cadastramento territórios de coleta equipe técnica do projeto, nas comunidades Quilombo CantaGalo e Foz do Urucuri`, activities: [
        { id: 13001021, name: `Especificação — Cadastramento das Realização de 2 reuniões de Cadastramento das Reuniões de mulheres inter…`, responsible: ``, plannedDate: `Mês 1–Mês 2`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório físico e visual (fotos e vídeos) Lista de frequência` },
      ] },
      { id: 1300103, name: `1.3 Planos comunitários de Realização de 1 plano de manejo comunitário de Plano de manejo sustentável das manejo s…`, expectedResult: `Planos comunitários de Realização de 1 plano de manejo comunitário de Plano de manejo sustentável das manejo sustentável das comunidades envolvidas manejo espécies nativas. pela equipe técnico do projeto (florestal e comunitário agrônomo) sustentável`, activities: [
        { id: 13001031, name: `Especificação — Planos comunitários de Realização de 1 plano de manejo comunitário de Plano de manejo sust…`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório físico e visual (fotos e vídeos) Plano de manejo comunitário` },
      ] },
    ] },
    { id: 13002, name: `2. Meta: Capacitação e Formação`, deliverables: [
      { id: 1300201, name: `2.1 Oficina sobre boas Realização de 1 oficina de boas práticas de coleta, Oficina práticas de coleta, secagem e s…`, expectedResult: `Oficina sobre boas Realização de 1 oficina de boas práticas de coleta, Oficina práticas de coleta, secagem e secagem e armazenamento de sementes, pela armazenamento deequipe técnica do projeto (engenheiro florestal e sementes. agrônomo) para as mulheres da comunidade da Foz do Urucuri.`, activities: [
        { id: 13002011, name: `Especificação — Oficina sobre boas Realização de 1 oficina de boas práticas de coleta, Oficina práticas de…`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório físico e visual (fotos e vídeos) Lista de frequência` },
      ] },
      { id: 1300202, name: `2.2 Treinamento em técnicas Realização de 2 treinamentos de extração Treinamento de extração e beneficiamento arte…`, expectedResult: `Treinamento em técnicas Realização de 2 treinamentos de extração Treinamento de extração e beneficiamento artesanal de óleo do buriti para as mulheres nas artesanal de óleo do buriti. comunidade Quilombo cantaGalo e Foz do Urucuri, pela a equipe técnica do projeto`, activities: [
        { id: 13002021, name: `Especificação — Treinamento em técnicas Realização de 2 treinamentos de extração Treinamento de extração e…`, responsible: ``, plannedDate: `Mês 6–Mês 7`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório físico e visual (fotos e vídeos) Lista de frequência` },
      ] },
      { id: 1300203, name: `2.3 Formação em gestão, Realização de 1 formação para as mulheres sobre Formação associativismo, cooperativismo, a…`, expectedResult: `Formação em gestão, Realização de 1 formação para as mulheres sobre Formação associativismo, cooperativismo, associativismo e comercialização cooperativismo epela equipe técnica da Coopasmig comercialização.`, activities: [
        { id: 13002031, name: `Especificação — Formação em gestão, Realização de 1 formação para as mulheres sobre Formação associativism…`, responsible: ``, plannedDate: `Mês 3–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatório físico e visual (fotos e vídeos) Lista de frequência` },
      ] },
    ] },
    { id: 13003, name: `3. : Implantação da Estrutura Produtiva`, deliverables: [
      { id: 1300301, name: `3.1 Aquisição deRealização de compra de máquinas e utilitários Aquisição maquinários: despolpadeira, para o benefi…`, expectedResult: `unidade`, activities: [
        { id: 13003011, name: `Especificação — unidade`, responsible: ``, plannedDate: `Mês 3–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300302, name: `3.2 Construção unidade de Construção de unidades de estufa para secagem Construção secagem de sementes de sementes…`, expectedResult: `3 Mês 5`, activities: [
        { id: 13003021, name: `Especificação — 3 Mês 5`, responsible: ``, plannedDate: `Mês 6–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300303, name: `3.3 Criação de área de Construção de espaço de beneficiamento Construção produção do óleo vegetal e artesanal do b…`, expectedResult: `1 Mês 3`, activities: [
        { id: 13003031, name: `Especificação — 1 Mês 3`, responsible: ``, plannedDate: `Mês 6–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300304, name: `3.4 Aquisição de 3 motores Aquisição de motores de embarcação tipo rabeta, Compra para embarcação (tipo rabeta) pa…`, expectedResult: `3 Mês 1`, activities: [
        { id: 13003041, name: `Especificação — 3 Mês 1`, responsible: ``, plannedDate: `Mês 3–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300305, name: `3.5 Desenvolvimento de Criação de embalagens com a identidade do Treinamento/pr identidade visual e produto da bio…`, expectedResult: `1 Mês 3`, activities: [
        { id: 13003051, name: `Especificação — 1 Mês 3`, responsible: ``, plannedDate: `Mês 5–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300306, name: `3.6 Estabelecer parcerias com Realização de articulação com redes de Articulação de mercados consumidores mercados…`, expectedResult: `1 Mês 1`, activities: [
        { id: 13003061, name: `Especificação — 1 Mês 1`, responsible: ``, plannedDate: `Mês 8–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 13004, name: `4. : Estruturar unidade administrativa físico administrativo para projeto de gestão e divulgação apoio da equipe técnica do do projeto`, deliverables: [
      { id: 1300401, name: `4.1 Estrutura de um espaço Custos com operacionalização da gestão do Estruturação Comunicação e divulgação projeto`, expectedResult: `1 Mês 1`, activities: [
        { id: 13004011, name: `Especificação — 1 Mês 1`, responsible: ``, plannedDate: `Mês 12–`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  14: [
    { id: 14001, name: `1. Capacitar 50 artesãos Kayapó em técnicas de produção, gestão e comercialização`, deliverables: [
      { id: 1400101, name: `1.1 Levantamento de necessidades e planejamento das capacitações`, expectedResult: `Contratar consultores especializados em artesanato indígena e gestão de pequenos negócios. Realizar reunião com os artesãos para identificar as principais demandas de capacitação em (aprimoramento de trançados, uso de novas matérias-primas, acabamento), gestão (precificação, controle de estoque) (atendimento ao cliente, embalagem, fotografia de produtos). Elaborar o plano de capacitação com a Definição do metodologia e cronograma detalhado das oficinas.`, activities: [
        { id: 14001011, name: `Especificação — Contratar consultores especializados em artesanato indígena e gestão de pequenos negócios.…`, responsible: ``, plannedDate: `Dez/2025–Dez/2025`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400102, name: `1.2 Realização de oficinas de Conduzir 3 oficinas de aprimoramento aprimoramento técnico`, expectedResult: `técnico, com duração de 40 horas cada, focadas em técnicas avançadas de produção artesanal, design e inovação de produtos. Cada oficina atenderá aproximadamente totalizando oficinas incluirão aulas práticas e`, activities: [
        { id: 14001021, name: `Especificação — técnico, com duração de 40 horas cada, focadas em técnicas avançadas de produção artesanal…`, responsible: ``, plannedDate: `Jan/2025–Mar/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `certificados de` },
      ] },
      { id: 1400103, name: `1.3 Realização de oficinas de Conduzir 4 oficinas de gestão e gestão e comercialização`, expectedResult: `horas cada, abordando temas como precificação justa, controle financeiro, estratégias de marketing digital, fotografia de produtos, atendimento ao capacitados em cliente e logística de vendas. As oficinas serão adaptadas à realidade comercialização cultural comunidade Kayapó.`, activities: [
        { id: 14001031, name: `Especificação — horas cada, abordando temas como precificação justa, controle financeiro, estratégias de m…`, responsible: ``, plannedDate: `Mar/2026–Jun/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Lista de presença, certificados de participação, planos de negócios simplificados elaborados pelos artesãos, relatórios de vendas.` },
      ] },
    ] },
    { id: 14002, name: `2. Construir um espaço coletivo de produção artesanal na aldeia Gorotire.`, deliverables: [
      { id: 1400201, name: `2.1 Planejamento e projeto Realizar reunião com a comunidade Profissional arquitetônico`, expectedResult: `para definir as necessidades e características do espaço coletivo. Contratar arquiteto ou engenheiro para elaborar o projeto arquitetônico, considerando sustentabilidade e funcionalidade para as atividades artesanais. Obter as aprovações necessárias.`, activities: [
        { id: 14002011, name: `Especificação — para definir as necessidades e características do espaço coletivo. Contratar arquiteto ou…`, responsible: ``, plannedDate: `Nov/2025–Dez/2025`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Projeto arquitetônico, contrato com o profissional` },
      ] },
      { id: 1400202, name: `2.2 Aquisição de materiais e Realizar compra dos materiais de definição de mão de obra`, expectedResult: `construção necessários, priorizando fornecedores sustentáveis. Definir mão de obra Seleção de mão local, com membros da comunidade Kayapó, para a construção do espaço.`, activities: [
        { id: 14002021, name: `Especificação — construção necessários, priorizando fornecedores sustentáveis. Definir mão de obra Seleção…`, responsible: ``, plannedDate: `Jan/2026–Fev/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Notas Fiscais de compras` },
      ] },
      { id: 1400203, name: `2.3 Construção e equipagem Executar a construção do espaço Espaço coletivo do espaço`, expectedResult: `coletivo de produção, seguindo o de produção costura, armazenamento). inauguração do espaço com a participação da comunidade.`, activities: [
        { id: 14002031, name: `Especificação — coletivo de produção, seguindo o de produção costura, armazenamento). inauguração do espaç…`, responsible: ``, plannedDate: `Mar/2026–Jul/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Relatórios de obra, notas fiscais de equipamentos, registro fotográfico da construção e inauguração.` },
      ] },
    ] },
    { id: 14003, name: `3. Criar uma marca Para o artesanato Kayapó e desenvolver um catálogo físico e digital`, deliverables: [
      { id: 1400301, name: `3.1 Desenvolvimento da marca`, expectedResult: `Contratar designer para criar a Contratação de identidade visual da marca, que represente a cultura Kayapó e a autenticidade dos produtos. Realizar o registro legal junto aos órgãos Marca criada e competentes. Desenvolver critérios e um manual de uso para a marca, garantindo sua aplicação correta pelos artesãos. Produzir materiais gráficos Manual de uso da marca para embalagem dos produtos.`, activities: [
        { id: 14003011, name: `Especificação — Contratar designer para criar a Contratação de identidade visual da marca, que represente…`, responsible: ``, plannedDate: `Jan/2026–Mar/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `produzidas` },
      ] },
      { id: 1400302, name: `3.2 Desenvolvimento do catálogo físico e digital`, expectedResult: `Contratar equipe especializada para desenvolver um catálogo físico e digital, que permitam aos clientes visualizar os produtos em seus próprios fotografia profissional dos produtos artesanais para inclusão no catálogo.`, activities: [
        { id: 14003021, name: `Especificação — Contratar equipe especializada para desenvolver um catálogo físico e digital, que permitam…`, responsible: ``, plannedDate: `Abr/2026–Set/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `físico` },
      ] },
    ] },
    { id: 14004, name: `4. Aumentar em 40% a produção e comercialização do artesanato Kayapó`, deliverables: [
      { id: 1400401, name: `4.1 Implementação de estratégias de comercialização`, expectedResult: `Participar de feiras de artesanato Participação em regionais e nacionais, utilizando o catálogo e a marca como diferenciais. Estabelecer parcerias com lojas de artesanato, galerias de arte e plataformas de e-commerce para estabelecidas ampliar Desenvolver material de divulgação (folders, cartões de visita) com a identidade visual da marca.`, activities: [
        { id: 14004011, name: `Especificação — Participar de feiras de artesanato Participação em regionais e nacionais, utilizando o cat…`, responsible: ``, plannedDate: `Mar/2026–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400402, name: `4.2 Monitoramento e avaliação da produção e vendas`, expectedResult: `Implementar um sistema de registro e acompanhamento da produção e das monitoramento vendas reuniões mensais para analisar os Reuniões de resultados, identificar desafios e acompanhamento ajustar relatórios trimestrais de progresso.`, activities: [
        { id: 14004021, name: `Especificação — Implementar um sistema de registro e acompanhamento da produção e das monitoramento vendas…`, responsible: ``, plannedDate: `Dez/2025–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 14005, name: `5. Promover o manejo sustentável de recursos sustentável de naturais e fortalecer a matérias-primas identidade cultural da aldeia Gorotire`, deliverables: [
      { id: 1400501, name: `5.1 Oficina de manejo`, expectedResult: `Realizar 2 oficinas sobre técnicas de coleta e manejo sustentável de matérias-primas da floresta (fibras, sementes, madeiras), garantindo a preservação dos recursos naturais e a continuidade das práticas artesanais. participantes As oficinas serão conduzidas por anciãos e especialistas locais.`, activities: [
        { id: 14005011, name: `Especificação — Realizar 2 oficinas sobre técnicas de coleta e manejo sustentável de matérias-primas da fl…`, responsible: ``, plannedDate: `Jan/2025–Fev/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400502, name: `5.2 Evento de valorização cultural`, expectedResult: `Organizar um evento cultural na aldeia Evento cultural Gorotire para celebrar e divulgar o artesanato Kayapó, com a participação de artesãos, comunidade e visitantes. visibilidade do O evento demonstrações de técnicas artesanais, apresentações culturais e rodas de conversa sobre a importância da cultura Kayapó`, activities: [
        { id: 14005021, name: `Especificação — Organizar um evento cultural na aldeia Evento cultural Gorotire para celebrar e divulgar o…`, responsible: ``, plannedDate: `Out/2026–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 14006, name: `6. Fortalecer a gestão, a comunicação e a técnica e administrativa transparência Associação Indígena Riktikô “Ronkô” Realizar assembleias comun…`, deliverables: [
      { id: 1400601, name: `6.1 Formação da equipe da`, expectedResult: `Realizar reunião comunitária para definição responsabilidades da equipe de coordenação, logística, monitoramento e prestação de contas. Estabelecer rotinas de acompanhamento e controle interno.`, activities: [
        { id: 14006011, name: `Especificação — Realizar reunião comunitária para definição responsabilidades da equipe de coordenação, lo…`, responsible: ``, plannedDate: `Dez/2025–Dez/2025`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400602, name: `6.2 Comunicação comunitária e prestação de contas garantindo Assembleias realizadas`, expectedResult: `Produzir informativos comunitários e áudios em língua Kayapó sobre o andamento do projeto.`, activities: [
        { id: 14006021, name: `Especificação — Produzir informativos comunitários e áudios em língua Kayapó sobre o andamento do projeto.`, responsible: ``, plannedDate: `Dez/2025–Out/2026`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  15: [
    { id: 15001, name: `1. reunião geral com o público alvo do projeto aprovado e seleção das famílias whatsapp, com estimativa de 30`, deliverables: [
      { id: 1500101, name: `1.1 apresentação do projeto Mobilizar através de convites e redes de reunião para cada ação proposta. pessoas, em…`, expectedResult: `01 01/2026 02/2026 lista de presença, fotos, notas fiscais.`, activities: [
        { id: 15001011, name: `Especificação — 01 01/2026 02/2026 lista de presença, fotos, notas fiscais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500102, name: `1.2 Etapa`, expectedResult: ``, activities: [
        { id: 15001021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500103, name: `1.3 Etapa`, expectedResult: ``, activities: [
        { id: 15001031, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15002, name: `2. capacitações técnicas`, deliverables: [
      { id: 1500201, name: `2.1 implantação hortas As oficinas serão ministradas por oficina comunitária técnicos contratados das comunidades…`, expectedResult: `02 03/2026 03/2026 lista de presença, fotos, notas fiscais. emissão de certificado`, activities: [
        { id: 15002011, name: `Especificação — 02 03/2026 03/2026 lista de presença, fotos, notas fiscais. emissão de certificado`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500202, name: `2.2 criação de aves comunitária As oficinas serão ministradas por oficina técnicos contratados das comunidades loc…`, expectedResult: `02 04/2026 04/2026 listas de presença, fotos, notas, emissão de certificados.`, activities: [
        { id: 15002021, name: `Especificação — 02 04/2026 04/2026 listas de presença, fotos, notas, emissão de certificados.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500203, name: `2.3 manutenção e sistemas solar A oficina será ministrada por um técnico oficina profissional instalação, manutenç…`, expectedResult: `01 05/2026 05/2026 lista de presença, fotos, notas fiscais.`, activities: [
        { id: 15002031, name: `Especificação — 01 05/2026 05/2026 lista de presença, fotos, notas fiscais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15003, name: `3. produção de mudas`, deliverables: [
      { id: 1500301, name: `3.1 coleta de sementes, plantio e As sementes serão coletadas e semente germinação em viveiros plantadas pelos com…`, expectedResult: `N/A 01/2026 05/2026 fotos e planilha de anotação`, activities: [
        { id: 15003011, name: `Especificação — N/A 01/2026 05/2026 fotos e planilha de anotação`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500302, name: `3.2 crescimento, As ações serão desenvolvidas pelos N/A acompanhamento próprios comunitários, acompanhamento de um…`, expectedResult: `N/A 01/2026 10/2026 fotos e planilha de com anotação`, activities: [
        { id: 15003021, name: `Especificação — N/A 01/2026 10/2026 fotos e planilha de com anotação`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500303, name: `3.3 Plantio O plantio será feito pelos comunitários Mudas com orientação de um técnico, conforme o crescimento (de…`, expectedResult: `0 10/2026 10/2026 fotos, coordenada geográfica da area plantada, notas fiscais de pagamentos por serviços ambientais por mudas plantadas`, activities: [
        { id: 15003031, name: `Especificação — 0 10/2026 10/2026 fotos, coordenada geográfica da area plantada, notas fiscais de pagament…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15004, name: `4. implantação das das hortas comunitárias 5. implantação da criação de aves 6. Compra instalação dos kit de internet 7. Compra e instalação co…`, deliverables: [
      { id: 1500401, name: `4.1 construção e plantio A construção e plantio será pela comunidade local com orientação de um técnico`, expectedResult: `hortas 02 04/2026 07/2026 fotos, notas fiscais, lista de presença`, activities: [
        { id: 15004011, name: `Especificação — hortas 02 04/2026 07/2026 fotos, notas fiscais, lista de presença`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500402, name: `4.2 Etapa`, expectedResult: ``, activities: [
        { id: 15004021, name: `Especificação — Etapa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500403, name: `4.3 Reparo dos aviários (telagem, As atividades serão feitas pelas coberturas, piso), compra dos famílias envolvid…`, expectedResult: `aviários 02 04/2026 07/2026 notas fiscais, fotos, lista de presença 01/2026 04/2026 notas fiscais, fotos 01/2026 05/2026 notas fiscais, fotos de água 01 01/2026 06/2026 notas fiscais, fotos 01 01/2026 08/2026 fotos, notas fiscais. prestação de 01 11/2026 11/2026 notas fiscais, relatório(fluxo de caixa) ,fotos, vídeos.`, activities: [
        { id: 15004031, name: `Especificação — aviários 02 04/2026 07/2026 notas fiscais, fotos, lista de presença 01/2026 04/2026 notas…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  16: [
    { id: 16001, name: `1. Infraestrutura`, deliverables: [
      { id: 1600101, name: `1.1 Construção; 1 Agroindústria Construída e Agroindústria adequada às normas da`, expectedResult: `UNIDADE Jan 2026 Mar 2026 RECIBOS;`, activities: [
        { id: 16001011, name: `Especificação — UNIDADE Jan 2026 Mar 2026 RECIBOS;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600102, name: `1.2 Adequação Elétrica e hidráulica/sanitária`, expectedResult: `ADEPARÁ 1 NOTAS FISCAIS; REGISTROS`, activities: [
        { id: 16001021, name: `Especificação — ADEPARÁ 1 NOTAS FISCAIS; REGISTROS`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600103, name: `1.3 Pintura e Acabamento`, expectedResult: `FOTOGRÁFICOS`, activities: [
        { id: 16001031, name: `Especificação — FOTOGRÁFICOS`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16002, name: `2. Equipamentos`, deliverables: [
      { id: 1600201, name: `2.1 Aquisição e instalação do forno 1 Agroindústria equipada elétrico com 7 equipamentos`, expectedResult: `RECIBOS; UNIDADE 1 Mar 2026 Abr 2026 NOTAS FISCAIS;`, activities: [
        { id: 16002011, name: `Especificação — RECIBOS; UNIDADE 1 Mar 2026 Abr 2026 NOTAS FISCAIS;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600202, name: `2.2 Prensa, descascador; balança.`, expectedResult: `essenciais. REGISTROS`, activities: [
        { id: 16002021, name: `Especificação — essenciais. REGISTROS`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600203, name: `2.3 Seladora, freezers,mesas inox.`, expectedResult: `FOTOGRÁFICOS`, activities: [
        { id: 16002031, name: `Especificação — FOTOGRÁFICOS`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16003, name: `3. Capacitações`, deliverables: [
      { id: 1600301, name: `3.1 Realização de 4 cursos`, expectedResult: `Realização de 4 cursos`, activities: [
        { id: 16003011, name: `Especificação — Realização de 4 cursos`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600302, name: `3.2 Boas práticas de 20 Mulheres capacitadas em PESSOAS fabricação, gestão de 4 cursos ( total de 160h) negócios`, expectedResult: `20 Abr 2026 Jul 2026 LISTA DE PRESENÇA; CERTIFICADOS; RELATÓRIOS`, activities: [
        { id: 16003021, name: `Especificação — 20 Abr 2026 Jul 2026 LISTA DE PRESENÇA; CERTIFICADOS; RELATÓRIOS`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16004, name: `4. Certificação especializada e acompanhamento para obtenção de certificado ADEPARÁ 5.Serviço de 5,1 Serviços contábeis, terceiros prestação de…`, deliverables: [
      { id: 1600401, name: `4.1 Consultoria Certificação sanitária unidade emitida pela ADEPARÁ Prestação de contas e consultorias.`, expectedResult: `UNIDADE 1 Jul 2026 Set 2026 Certificado da ADEPARÁ Recibos e UNIDADE 1 set 2026 Dez 2026 Extratos bancários`, activities: [
        { id: 16004011, name: `Especificação — UNIDADE 1 Jul 2026 Set 2026 Certificado da ADEPARÁ Recibos e UNIDADE 1 set 2026 Dez 2026 E…`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
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
      { id: 1900102, name: `1.2 Elaborar projetos estruturais.`, expectedResult: `Contratação do responsável técnico para Contrato elaborar a planta do projeto.`, activities: [
        { id: 19001021, name: `Especificação — Contratação do responsável técnico para Contrato elaborar a planta do projeto.`, responsible: ``, plannedDate: `Mês 1–Mês 3`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Contrato e comprovantes de pagamento` },
      ] },
      { id: 1900103, name: `1.3 Levantamento de orçamentos de materiais da obra.`, expectedResult: `A diretoria pesquisar por três orçamentos a fim Orçamentos de encontrar os melhores preços`, activities: [
        { id: 19001031, name: `Especificação — A diretoria pesquisar por três orçamentos a fim Orçamentos de encontrar os melhores preços`, responsible: ``, plannedDate: `Mês 1–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Documento de cada orçamento cotado` },
      ] },
      { id: 1900104, name: `1.4 Levantamento de A diretoria pesquisar por três orçamentos a fim Orçamentos orçamentos de mão de obra de encont…`, expectedResult: `Levantamento de A diretoria pesquisar por três orçamentos a fim Orçamentos orçamentos de mão de obra de encontrar os melhores preços e serviços de qualidade`, activities: [
        { id: 19001041, name: `Especificação — Levantamento de A diretoria pesquisar por três orçamentos a fim Orçamentos orçamentos de m…`, responsible: ``, plannedDate: `Mês 1–Mês 4`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Documento de cada orçamento cotado` },
      ] },
      { id: 1900105, name: `1.5 Execução da obra Construção da agroindústria`, expectedResult: `Fotos / Notas fiscais e/ou recibos`, activities: [
        { id: 19001051, name: `Especificação — Fotos / Notas fiscais e/ou recibos`, responsible: ``, plannedDate: `Mês 4–Mês 8`, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `Fotos, notas fiscais e/ou recibos` },
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
