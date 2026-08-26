import type { ActivityStatus } from './mockData';

// Tipos só-de-seed (ids number): este arquivo alimenta apenas o script de seed do
// Supabase (src/routes/api/admin/seed.ts) — em runtime os dados vêm do banco, com
// ids uuid (ver tipos Goal/Deliverable/Activity em mockData.ts).
export interface ActivitySeed {
  id: number; name: string; responsible: string; plannedDate: string;
  startDate: string | null; conclusionDate: string | null; progress: number;
  status: ActivityStatus; observations: string;
}
export interface DeliverableSeed { id: number; name: string; expectedResult: string; activities: ActivitySeed[] }
export interface GoalSeed { id: number; name: string; deliverables: DeliverableSeed[] }

/** Metas/Etapas/Especificações padronizadas a partir da planilha RISCOS - PLANOS DE TRABALHO. */
export const metasProjetos: Record<number, GoalSeed[]> = {
  1: [
    { id: 1001, name: `1. Implantar a geleira comunitária com energia elétrica`, deliverables: [
      { id: 100101, name: `1.1 Levantamento e orçamento de equipamentos`, expectedResult: `Cotação com, pelo menos, 3 fornecedores de equipamentos de refrigeração e de energia elétrica.`, activities: [
        { id: 1001011, name: `Cotação com, pelo menos, 3 fornecedores de equipamentos de refrigeração e de energia elétrica.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100102, name: `1.2. Aquisição`, expectedResult: `Compra da máquina de fazer gelo e de todos os equipamentos necessários para a ligação elétrica`, activities: [
        { id: 1001021, name: `Compra da máquina de fazer gelo e de todos os equipamentos necessários para a ligação elétrica`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100103, name: `1.3 Manutenção do espaço de instalação da máquina`, expectedResult: `Manutenção na infraestrutura do espaço de implantação da geleira com mão de obra local`, activities: [
        { id: 1001031, name: `Manutenção na infraestrutura do espaço de implantação da geleira com mão de obra local`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100104, name: `1.4 Contratação de técnico para instalação da rede elétrica`, expectedResult: `Instalação da rede`, activities: [
        { id: 1001041, name: `Instalação da rede`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100105, name: `1.5. Testes e comissionamento do sistema`, expectedResult: `Realização de testes operacionais para garantir o funcionamento adequado da geleira.`, activities: [
        { id: 1001051, name: `Realização de testes operacionais para garantir o funcionamento adequado da geleira.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 1002, name: `2. Capacitar pescadores em boas práticas, gestão e comercialização`, deliverables: [
      { id: 100201, name: `2.1 Contratação de profissional engenheiro de pesca ou biólogo com experiência em recursos pesqueiros e profissional de Administração).`, expectedResult: `Realizar o contrato com um profissional para capacitações e serviços`, activities: [
        { id: 1002011, name: `Realizar o contrato com um profissional para capacitações e serviços`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100202, name: `2.2. Elaboração do material didático e plano de curso`, expectedResult: `Desenvolvimento de conteúdo programático e materiais para as capacitações.`, activities: [
        { id: 1002021, name: `Desenvolvimento de conteúdo programático e materiais para as capacitações.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100203, name: `2.3. Realização de oficinas de boas práticas de manuseio do pescado`, expectedResult: `2 oficinas de 20 horas cada para 40 pescadores.`, activities: [
        { id: 1002031, name: `2 oficinas de 20 horas cada para 40 pescadores.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100204, name: `2.4 . Realização de oficinas de gestão e comercialização`, expectedResult: `2 oficinas de 20 horas cada para 40 pescadores.`, activities: [
        { id: 1002041, name: `2 oficinas de 20 horas cada para 40 pescadores.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 1003, name: `3. Fortalecer a organização comunitária e ampliar o acesso a mercados`, deliverables: [
      { id: 100301, name: `3.1 Desenvolvimento de plano de negócios comunitário`, expectedResult: `Elaboraçao de um plano estratégico para a gestão e comercialização do pescado.`, activities: [
        { id: 1003011, name: `Elaboraçao de um plano estratégico para a gestão e comercialização do pescado.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100302, name: `3.2. Prospecção de novos mercados e parcerias`, expectedResult: `Identificação e contato com potenciais compradores e parceiros comerciais.`, activities: [
        { id: 1003021, name: `Identificação e contato com potenciais compradores e parceiros comerciais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100303, name: `3.3. Participação em feiras e eventos de comercialização`, expectedResult: `Participação em 2 feiras regionais para divulgação e venda do pescado`, activities: [
        { id: 1003031, name: `Participação em 2 feiras regionais para divulgação e venda do pescado`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 1004, name: `4. Monitorar e Avaliar os Resultados do Projeto`, deliverables: [
      { id: 100401, name: `4.1 Definição de indicadores de desempenho`, expectedResult: `Será elaborado um conjunto de indicadores quantitativos e qualitativos, como: quantidade de gelo produzido, número de pescadores capacitados, volume de pescado comercializado e participação em reuniões comunitárias. A atividade será realizada em 7 dias, com apoio de um consultor e lideranças da ACREPAF. Documento consolidado com indicadores definidos`, activities: [
        { id: 1004011, name: `Será elaborado um conjunto de indicadores quantitativos e qualitativos, como: quantidade de gelo produzido, número de pescadores capacitados, volume de pescado comercializado e participação em reuniões comunitárias. A atividade será realizada em 7 dias, com apoio de um consultor e lideranças da ACREPAF. Documento consolidado com indicadores definidos`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100402, name: `4.2 Criação de sistema de registro e acompanhamento`, expectedResult: `Desenvolvimento de planilhas e relatórios mensais para registrar produção, vendas e participação em oficinas. Jovens da comunidade serão capacitados para apoiar na coleta e alimentação dos dados.`, activities: [
        { id: 1004021, name: `Desenvolvimento de planilhas e relatórios mensais para registrar produção, vendas e participação em oficinas. Jovens da comunidade serão capacitados para apoiar na coleta e alimentação dos dados.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100403, name: `4.3 Reuniões de avaliação participativa`, expectedResult: `Realização de 2 reuniões semestrais, com duração de 4 horas cada, envolvendo representantes das 7 comunidades para análise dos resultados, identificação de desafios e proposição de ajustes`, activities: [
        { id: 1004031, name: `Realização de 2 reuniões semestrais, com duração de 4 horas cada, envolvendo representantes das 7 comunidades para análise dos resultados, identificação de desafios e proposição de ajustes`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 100404, name: `4.4 Elaboração de relatório final de resultados`, expectedResult: `Consolidação dos dados coletados em um relatório final, contendo análise de impactos, indicadores alcançados e recomendações para continuidade do projeto.`, activities: [
        { id: 1004041, name: `Consolidação dos dados coletados em um relatório final, contendo análise de impactos, indicadores alcançados e recomendações para continuidade do projeto.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  2: [
    { id: 2001, name: `1. Fortalecer a organização da cooperativa.`, deliverables: [
      { id: 200101, name: `1.1. Realizar uma reunião entre as comunidades Beneficiadas, cooperativa e MALUNGU;`, expectedResult: `Mobilizar as duas comunidades para reunião de 2 dias para informar e planejar as etapas que serão realizadas no projeto.`, activities: [
        { id: 2001011, name: `Mobilizar as duas comunidades para reunião de 2 dias para informar e planejar as etapas que serão realizadas no projeto.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2002, name: `2. Elaboração de projeto básico;`, deliverables: [
      { id: 200201, name: `2.1. Cotação de preço e escolha do projeto de arquitetura.`, expectedResult: `Elaboração da planta BAIXA do Espaço.`, activities: [
        { id: 2002011, name: `Elaboração da planta BAIXA do Espaço.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2003, name: `3. Contratação de empresa para construção da agroindústria`, deliverables: [
      { id: 200301, name: `3.1. Seleção da PJ para execução da infraestrutura da agroindústria;`, expectedResult: `Envio de carta convite para seleção da empresa para executar a obra da infraestrutura do projeto.`, activities: [
        { id: 2003011, name: `Envio de carta convite para seleção da empresa para executar a obra da infraestrutura do projeto.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200302, name: `3.2.Elaboração de contrato com a PJ`, expectedResult: `Oficializar a assinatura do contrato e definir as parcelas de desembolso.`, activities: [
        { id: 2003021, name: `Oficializar a assinatura do contrato e definir as parcelas de desembolso.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200303, name: `3.3 Contratação do PJ`, expectedResult: `Assinatura do contrato`, activities: [
        { id: 2003031, name: `Assinatura do contrato`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200304, name: `3.4. Construção da estrutura da agroindústria`, expectedResult: `Atividade de mão de obra pela PJ contratada.`, activities: [
        { id: 2003041, name: `Atividade de mão de obra pela PJ contratada.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2004, name: `4. Compra de material para construção da infraestrutura.`, deliverables: [
      { id: 200401, name: `4.1. Cotação de preços`, expectedResult: `Atividade de mão de obra pela PJ contratada.`, activities: [
        { id: 2004011, name: `Atividade de mão de obra pela PJ contratada.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200402, name: `4.2. Escolha do orçamento`, expectedResult: `A decisão se dará pelo custo benefício para otimizar o recurso.`, activities: [
        { id: 2004021, name: `A decisão se dará pelo custo benefício para otimizar o recurso.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200403, name: `4.3. Compra do material`, expectedResult: `Duas pessoas realizarão a compra dos materiais.`, activities: [
        { id: 2004031, name: `Duas pessoas realizarão a compra dos materiais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2005, name: `5. Compra de equipamentos (maquinário)`, deliverables: [
      { id: 200501, name: `5.1 Cotação dos preços dos equipamentos.`, expectedResult: `Fazer cotação em três empresas diferentes os valores dos equipamentos.`, activities: [
        { id: 2005011, name: `Fazer cotação em três empresas diferentes os valores dos equipamentos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200502, name: `5.2 Escolha do orçamento`, expectedResult: `Análise pela coordenação financeira dos custo benefício para otimizar os recursos do orçamento.`, activities: [
        { id: 2005021, name: `Análise pela coordenação financeira dos custo benefício para otimizar os recursos do orçamento.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200503, name: `5.3 Compra dos equipamentos`, expectedResult: `Duas pessoas realizarão a compra dos materiais.`, activities: [
        { id: 2005031, name: `Duas pessoas realizarão a compra dos materiais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2006, name: `6. Instalação dos equipamentos`, deliverables: [
      { id: 200601, name: `6.1. Cotação de PJ`, expectedResult: `Fazer cotação em três empresas diferentes os valores dos equipamentos.`, activities: [
        { id: 2006011, name: `Fazer cotação em três empresas diferentes os valores dos equipamentos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200602, name: `6.2 Escolha do orçamento`, expectedResult: `Análise e seleção pela coordenação financeira dos custo benefício para otimizar os recursos do orçamento.`, activities: [
        { id: 2006021, name: `Análise e seleção pela coordenação financeira dos custo benefício para otimizar os recursos do orçamento.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200603, name: `6.3. Contratação do PJ e assinatura do contrato.`, expectedResult: `Assinatura do contrato`, activities: [
        { id: 2006031, name: `Assinatura do contrato`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2007, name: `7. Formação técnica`, deliverables: [
      { id: 200701, name: `7.1.Contratação de um técnico especialista em manejo agroflorestal sustentável, processamento, etc.`, expectedResult: `Formação que irá abranger 30 pessoas de cada uma das duas comunidades, ou seja, 60 pessoas no total.`, activities: [
        { id: 2007011, name: `Formação que irá abranger 30 pessoas de cada uma das duas comunidades, ou seja, 60 pessoas no total.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200702, name: `7.2. Realização das formações e capacitações`, expectedResult: `Das 60 pessoas em formação, 30 serão mulheres, 15 jovens e 15 homens adultos.`, activities: [
        { id: 2007021, name: `Das 60 pessoas em formação, 30 serão mulheres, 15 jovens e 15 homens adultos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200703, name: `7.3 Entrega de certificados das capacitações executadas e avaliação.`, expectedResult: `No final será entregue certificados aos participantes e avaliação de aprendizado.`, activities: [
        { id: 2007031, name: `No final será entregue certificados aos participantes e avaliação de aprendizado.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2008, name: `8. Prática do manejo sustentável nas áreas das famílias atendidas pelo projeto.`, deliverables: [
      { id: 200801, name: `8.1. Atividade em campo acompanhada pelo técnico nas áreas de açaizais.`, expectedResult: `Atividade prática de 5 dias em campo com as 60 pessoas.`, activities: [
        { id: 2008011, name: `Atividade prática de 5 dias em campo com as 60 pessoas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 200802, name: `8.2. Produção de viveiro tradicional de espécies de frutas locais para os SAFs.`, expectedResult: `Na atividade prática de manejo será construído o viveiro tradicional utilizado pelas comunidades.`, activities: [
        { id: 2008021, name: `Na atividade prática de manejo será construído o viveiro tradicional utilizado pelas comunidades.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2009, name: `9. Entrega da agroindústria às comunidades.`, deliverables: [
      { id: 200901, name: `9.1. Assembleia entre as duas comunidades, coordenação da cooperativa quilombola e coordenação da MALUNGU`, expectedResult: `A assembleia contará com aproximadamente 300 famílias envolvendo as duas comunidades, coordenação da cooperativa quilombola e coordenação da MALUNGU.`, activities: [
        { id: 2009011, name: `A assembleia contará com aproximadamente 300 famílias envolvendo as duas comunidades, coordenação da cooperativa quilombola e coordenação da MALUNGU.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 2010, name: `10. Solicitação para Regularização e certificação de selo artesanal da agroindústria na ADEPARÁ`, deliverables: [
      { id: 201001, name: `10.1. Após entrega da agroindústria as comunidades e cooperativa, será de responsabilidade da cooperativa buscar orientação junto a ADEPARÁ para sua regularização.`, expectedResult: `A cooperativa acompanhará todo processo de regularização e certificação.`, activities: [
        { id: 2010011, name: `A cooperativa acompanhará todo processo de regularização e certificação.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  3: [
    { id: 3001, name: `1. Meta 1 — Construção e equipagem de 3 casas do artesanato Tembé`, deliverables: [
      { id: 300101, name: `1.1 Contratação das três coordenações indígenas`, expectedResult: `Serão contratados 3 indígenas para atuarem como coordenadores das ações do projeto, com pagamento de diárias de serviço pela AMIG. Indicador: 03 contratos assinados. Duração: mês 1 a mês 12. Fonte de verificação: recibos de pagamento de diárias.`, activities: [
        { id: 3001011, name: `Serão contratados 3 indígenas para atuarem como coordenadores das ações do projeto, com pagamento de diárias de serviço pela AMIG. Indicador: 03 contratos assinados. Duração: mês 1 a mês 12. Fonte de verificação: recibos de pagamento de diárias.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300102, name: `1.2 Três reuniões de mobilização e escolha dos locais (mês 1)`, expectedResult: `Os três coordenadores indígenas organizarão e realizarão 3 reuniões comunitárias, uma em cada aldeia, para mobilização e escolha dos locais das casas. Indicador: 03 reuniões. Duração: mês 1. Fonte de verificação: ata, lista de frequência e relatório das reuniões.`, activities: [
        { id: 3001021, name: `Os três coordenadores indígenas organizarão e realizarão 3 reuniões comunitárias, uma em cada aldeia, para mobilização e escolha dos locais das casas. Indicador: 03 reuniões. Duração: mês 1. Fonte de verificação: ata, lista de frequência e relatório das reuniões.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300103, name: `1.3 Contratação do projeto arquitetônico`, expectedResult: `Contratação de arquiteto para elaborar as plantas e o projeto arquitetônico das casas. Na aldeia Tekohaw a comunidade optou pela reforma de uma casa de farinha em alvenaria, sem uso há anos, com 12 x 8 metros; as outras duas casas serão construídas com 8 x 8 metros. Indicador: 02 projetos arquitetônicos. Duração: mês 1.`, activities: [
        { id: 3001031, name: `Contratação de arquiteto para elaborar as plantas e o projeto arquitetônico das casas. Na aldeia Tekohaw a comunidade optou pela reforma de uma casa de farinha em alvenaria, sem uso há anos, com 12 x 8 metros; as outras duas casas serão construídas com 8 x 8 metros. Indicador: 02 projetos arquitetônicos. Duração: mês 1.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300104, name: `1.4 Contratação da equipe de construção, com lenhador para retirar madeira`, expectedResult: `Contratação de 3 equipes de profissionais para a construção das casas, com pedreiro e ajudante, marceneiro e ajudante, lenhador (profissional que retirará a madeira na floresta), pintor e eletricista. Indicador: 03 contratos. Duração: mês 2 a mês 3.`, activities: [
        { id: 3001041, name: `Contratação de 3 equipes de profissionais para a construção das casas, com pedreiro e ajudante, marceneiro e ajudante, lenhador (profissional que retirará a madeira na floresta), pintor e eletricista. Indicador: 03 contratos. Duração: mês 2 a mês 3.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300105, name: `1.5 (grafada 1.4) Compra de materiais em Paragominas`, expectedResult: `Compra, na cidade de Paragominas, de materiais de construção não indígenas (cimento, azulejos e argamassa) para as fundações de 02 casas nas aldeias Cajueiro e Koiaka, buscando maior durabilidade; as paredes serão de madeira e o telhado de telhas de barro. Indicador: notas fiscais, 03 unidades. Duração: mês 2 a mês 3.`, activities: [
        { id: 3001051, name: `Compra, na cidade de Paragominas, de materiais de construção não indígenas (cimento, azulejos e argamassa) para as fundações de 02 casas nas aldeias Cajueiro e Koiaka, buscando maior durabilidade; as paredes serão de madeira e o telhado de telhas de barro. Indicador: notas fiscais, 03 unidades. Duração: mês 2 a mês 3.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300106, name: `1.6 Deslocamento do material para as aldeias (1 frete, mês 3)`, expectedResult: `Fretamento de caminhão para transportar os materiais e equipamentos comprados em Paragominas até as aldeias beneficiadas. Indicador: 01 nota fiscal do frete. Duração: mês 3. Fonte de verificação: recibo ou nota fiscal do pagamento do frete.`, activities: [
        { id: 3001061, name: `Fretamento de caminhão para transportar os materiais e equipamentos comprados em Paragominas até as aldeias beneficiadas. Indicador: 01 nota fiscal do frete. Duração: mês 3. Fonte de verificação: recibo ou nota fiscal do pagamento do frete.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300107, name: `1.7 Execução das obras (mês 3 a 7)`, expectedResult: `Execução das obras pela equipe de construção formada por integrantes indígenas e não indígenas, com uso de tijolo e azulejo por questão de durabilidade. Indicador: 03 casas construídas. Duração: mês 3 a mês 7. Fonte de verificação: relatório de finalização das obras.`, activities: [
        { id: 3001071, name: `Execução das obras pela equipe de construção formada por integrantes indígenas e não indígenas, com uso de tijolo e azulejo por questão de durabilidade. Indicador: 03 casas construídas. Duração: mês 3 a mês 7. Fonte de verificação: relatório de finalização das obras.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300108, name: `1.8 Compra de equipamentos e materiais para o artesanato`, expectedResult: `Compra de 12 kits de artesanato (03 para cada casa de artesanato), compostos por furadeira, lixadeira, miçangas, falcão, fios de nylon, agulhas e máquina de costura, entre outros. Indicador: 12 kits de artesanato. Duração: mês 5 a mês 7. Fonte de verificação: nota fiscal da compra e relatório de entrega.`, activities: [
        { id: 3001081, name: `Compra de 12 kits de artesanato (03 para cada casa de artesanato), compostos por furadeira, lixadeira, miçangas, falcão, fios de nylon, agulhas e máquina de costura, entre outros. Indicador: 12 kits de artesanato. Duração: mês 5 a mês 7. Fonte de verificação: nota fiscal da compra e relatório de entrega.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 300109, name: `1.9 Inauguração das Casas (mês 8)`, expectedResult: `Realização da solenidade de inauguração das casas, com convite a parceiros institucionais para organização e participação. Indicador: 03 placas de inauguração. Duração: mês 8. Fonte de verificação: relatório da inauguração das casas.`, activities: [
        { id: 3001091, name: `Realização da solenidade de inauguração das casas, com convite a parceiros institucionais para organização e participação. Indicador: 03 placas de inauguração. Duração: mês 8. Fonte de verificação: relatório da inauguração das casas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 3002, name: `2. Meta 2 — Formação em negócios e vendas e Plano de Negócio`, deliverables: [
      { id: 300201, name: `2.1 Três oficinas nas três aldeias (mês 9)`, expectedResult: `Realização de 3 oficinas, uma em cada aldeia, de formação de jovens e mulheres em negócios sustentáveis e elaboração participativa do Plano de Negócios para venda das biojoias. As oficinas serão ministradas por parceiros institucionais (SEBRAE, CIRAD, IDEFLOR-Bio, UEPA, UFRA), cabendo à AMIG custear transporte e alimentação. Indicador: 30 participantes e plano de negócios elaborado. Duração: mês 9.`, activities: [
        { id: 3002011, name: `Realização de 3 oficinas, uma em cada aldeia, de formação de jovens e mulheres em negócios sustentáveis e elaboração participativa do Plano de Negócios para venda das biojoias. As oficinas serão ministradas por parceiros institucionais (SEBRAE, CIRAD, IDEFLOR-Bio, UEPA, UFRA), cabendo à AMIG custear transporte e alimentação. Indicador: 30 participantes e plano de negócios elaborado. Duração: mês 9.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 3003, name: `3. Meta 3 — Formação de jovens em mídias digitais`, deliverables: [
      { id: 300301, name: `3.1 Oficina de mídias digitais para 9 jovens (mês 10)`, expectedResult: `Realização de 1 oficina de mídias digitais e informativa para 9 jovens das aldeias beneficiadas, qualificando-os para trabalhar com mídias digitais como Instagram e site, em parceria com instituições de ensino e pesquisa (UEPA e UFRA Paragominas). Os jovens formados ficarão responsáveis por alimentar o site da AMIG. Indicador: 9 jovens formados. Duração: mês 10.`, activities: [
        { id: 3003011, name: `Realização de 1 oficina de mídias digitais e informativa para 9 jovens das aldeias beneficiadas, qualificando-os para trabalhar com mídias digitais como Instagram e site, em parceria com instituições de ensino e pesquisa (UEPA e UFRA Paragominas). Os jovens formados ficarão responsáveis por alimentar o site da AMIG. Indicador: 9 jovens formados. Duração: mês 10.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 3004, name: `4. Meta 4 — Produção do site de venda do artesanato`, deliverables: [
      { id: 300401, name: `4.1 Contratar empresa para produção do site (mês 7 a 11)`, expectedResult: `Contratação de empresa de comunicação e publicidade para produzir o site da AMIG, que será alimentado pelos indígenas formados na oficina de mídias digitais. Indicador: site e Instagram criados (01). Duração: mês 7 a mês 11. Fonte de verificação: contrato assinado com a empresa.`, activities: [
        { id: 3004011, name: `Contratação de empresa de comunicação e publicidade para produzir o site da AMIG, que será alimentado pelos indígenas formados na oficina de mídias digitais. Indicador: site e Instagram criados (01). Duração: mês 7 a mês 11. Fonte de verificação: contrato assinado com a empresa.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 3005, name: `5. Meta 5 — Avaliação do projeto`, deliverables: [
      { id: 300501, name: `5.1 Reuniões de avaliação comunitária (mês 12)`, expectedResult: `Realização de 3 reuniões comunitárias de avaliação do projeto, uma em cada aldeia onde foi instalada a casa de artesanato e sementes. Indicador: 03 atas das reuniões. Duração: mês 12. Fonte de verificação não preenchida no plano.`, activities: [
        { id: 3005011, name: `Realização de 3 reuniões comunitárias de avaliação do projeto, uma em cada aldeia onde foi instalada a casa de artesanato e sementes. Indicador: 03 atas das reuniões. Duração: mês 12. Fonte de verificação não preenchida no plano.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  4: [
    { id: 4001, name: `1. Contratação de prestadores de serviço para equipe central do projeto`, deliverables: [
      { id: 400101, name: `1.1. Coordenação do projeto`, expectedResult: `Contratação formal de 1 coordenador(a) responsável pelo planejamento e gestão do projeto, no período de 12 meses.`, activities: [
        { id: 4001011, name: `Contratação formal de 1 coordenador(a) responsável pelo planejamento e gestão do projeto, no período de 12 meses.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400102, name: `1.2. Gestão financeira`, expectedResult: `Contratação de 1 gestor(a) para organizar planilhas, relatórios e prestação de contas, no período de 12 meses`, activities: [
        { id: 4001021, name: `Contratação de 1 gestor(a) para organizar planilhas, relatórios e prestação de contas, no período de 12 meses`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400103, name: `1.3. Monitoras`, expectedResult: `Contratação de 2 monitoras locais para assistência contínua às famílias beneficiárias e apicultores, no período de 12 meses`, activities: [
        { id: 4001031, name: `Contratação de 2 monitoras locais para assistência contínua às famílias beneficiárias e apicultores, no período de 12 meses`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400104, name: `1.4. Relatoria`, expectedResult: `Contratação de 1 relator, responsável por produzir 3 relatórios parciais e 1 relatório final, no período de 12 meses`, activities: [
        { id: 4001041, name: `Contratação de 1 relator, responsável por produzir 3 relatórios parciais e 1 relatório final, no período de 12 meses`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400105, name: `1.5. Social Media`, expectedResult: `Contratação de 1 social media, responsável por produzir conteúdo para as mídias digitais da ADESC/PA, destacando o patrocínio, no período de 12 meses`, activities: [
        { id: 4001051, name: `Contratação de 1 social media, responsável por produzir conteúdo para as mídias digitais da ADESC/PA, destacando o patrocínio, no período de 12 meses`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4002, name: `2. Aquisição de equipamentos e insumos`, deliverables: [
      { id: 400201, name: `2.1. Kits comunitários de indumentária apícola`, expectedResult: `Fornecimento de Kit apícola (2 macacões de apicultor, 2 pares botas, 2 pares de luvas, 1 fumigador, 1 garfo desorpeculador, 2 caixas de colmeia), assegurando condições adequadas de segurança no manejo de abelhas.`, activities: [
        { id: 4002011, name: `Fornecimento de Kit apícola (2 macacões de apicultor, 2 pares botas, 2 pares de luvas, 1 fumigador, 1 garfo desorpeculador, 2 caixas de colmeia), assegurando condições adequadas de segurança no manejo de abelhas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400202, name: `2.2. Kits de ferramentas agrícolas`, expectedResult: `Aquisição de kits com ferramentas manuais para apoiar a implantação e manutenção dos quintais produtivos.`, activities: [
        { id: 4002021, name: `Aquisição de kits com ferramentas manuais para apoiar a implantação e manutenção dos quintais produtivos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400203, name: `2.3. Kits de mudas e sementes`, expectedResult: `Aquisição de mudas frutíferas, hortaliças e espécies nativas, além de substratos, insumos e recipientes para plantio.`, activities: [
        { id: 4002031, name: `Aquisição de mudas frutíferas, hortaliças e espécies nativas, além de substratos, insumos e recipientes para plantio.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400204, name: `2.4. Custo operacionais`, expectedResult: `Pagamento mensal de despesas operacionais (água, energia elétrica, internet e serviços basicos de manuntençao predial).`, activities: [
        { id: 4002041, name: `Pagamento mensal de despesas operacionais (água, energia elétrica, internet e serviços basicos de manuntençao predial).`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4003, name: `3. Capacitação de 8 famílias em práticas agroecológicas e instalação de 8 quintais agroecológicos produtivos em Santa Maria do Pará/PA`, deliverables: [
      { id: 400301, name: `3.1. Seleção e mobilização das famílias`, expectedResult: `Realização de reunião comunitária com beneficiários da Cozinha Solidária Vida Saudável; priorização de famílias chefiadas por mulheres (mínimo 60%); visitas domiciliares para diagnóstico do espaço; cadastro das famílias; preenchimento de ficha técnica detalhada; assinatura de termos de compromisso. A etapa garante a seleção justa e o alinhamento das responsabilidades.`, activities: [
        { id: 4003011, name: `Realização de reunião comunitária com beneficiários da Cozinha Solidária Vida Saudável; priorização de famílias chefiadas por mulheres (mínimo 60%); visitas domiciliares para diagnóstico do espaço; cadastro das famílias; preenchimento de ficha técnica detalhada; assinatura de termos de compromisso. A etapa garante a seleção justa e o alinhamento das responsabilidades.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400302, name: `3.2. Oficinas de capacitação em manejo agroecológico e distribuição dos kits 2.2 e 2.3`, expectedResult: `Distribuição de kits para condução de 2 oficinas teórico- práticas (3h cada) na sede da ADESC/PA, abordando: técnicas de manejo agroecológico, uso de biofertilizantes do biodigestor, práticas de aproveitamento integral de alimentos, manejo do solo e diversificação de culturas.`, activities: [
        { id: 4003021, name: `Distribuição de kits para condução de 2 oficinas teórico- práticas (3h cada) na sede da ADESC/PA, abordando: técnicas de manejo agroecológico, uso de biofertilizantes do biodigestor, práticas de aproveitamento integral de alimentos, manejo do solo e diversificação de culturas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400303, name: `3.3. Contratação de 1 oficineiro especialista`, expectedResult: `Contratação de 1 oficineiro, com expertise em técnicas de manejo agroecológico, uso de biofertilizantes do biodigestor, práticas de aproveitamento integral de alimentos, manejo do solo e diversificação de culturas.`, activities: [
        { id: 4003031, name: `Contratação de 1 oficineiro, com expertise em técnicas de manejo agroecológico, uso de biofertilizantes do biodigestor, práticas de aproveitamento integral de alimentos, manejo do solo e diversificação de culturas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400304, name: `3.4. Implantação dos quintais produtivos`, expectedResult: `Acompanhamento técnico individualizado no preparo do solo, plantio e manutenção inicial; registro da evolução de cada quintal até sua atividade mais consolidade.`, activities: [
        { id: 4003041, name: `Acompanhamento técnico individualizado no preparo do solo, plantio e manutenção inicial; registro da evolução de cada quintal até sua atividade mais consolidade.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4004, name: `4. Capacitação de 8 famílias em práticas apícolas e instalar 8 colmeias em Maracanã/PA`, deliverables: [
      { id: 400401, name: `4.1. Seleção e mobilização das famílias`, expectedResult: `Realização de reunião comunitária na comunidade São Benedito; priorização de famílias chefiadas por mulheres (mínimo 60%); cadastro e ficha técnica; assinatura de termo de compromisso para formalizar a participação.`, activities: [
        { id: 4004011, name: `Realização de reunião comunitária na comunidade São Benedito; priorização de famílias chefiadas por mulheres (mínimo 60%); cadastro e ficha técnica; assinatura de termo de compromisso para formalizar a participação.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400402, name: `4.2. Oficinas de capacitação em manejo apícola e distribuição dos kits 2.1 e 2.4`, expectedResult: `Distribuição de kits para condução de 2 oficinas teórico- práticas (3h cada) em São Benedito, abordando: boas práticas apícolas, manejo sustentável, higiene e segurança, além de estratégias de comercialização, precificação e marketing comunitário.`, activities: [
        { id: 4004021, name: `Distribuição de kits para condução de 2 oficinas teórico- práticas (3h cada) em São Benedito, abordando: boas práticas apícolas, manejo sustentável, higiene e segurança, além de estratégias de comercialização, precificação e marketing comunitário.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400403, name: `4.3. Contratação de 1 oficineiro especialista`, expectedResult: `Contratação de 1 oficineiro, com expertise em boas práticas apícolas, manejo sustentável, higiene e segurança, além de estratégias de comercialização, precificação e marketing comunitário.`, activities: [
        { id: 4004031, name: `Contratação de 1 oficineiro, com expertise em boas práticas apícolas, manejo sustentável, higiene e segurança, além de estratégias de comercialização, precificação e marketing comunitário.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400404, name: `4.4. Instalação de colmeias`, expectedResult: `Acompanhamento técnico durante a instalação das 8 caixas de colmeia e primeiros ciclos de produção; registro da evolução da atividade. Considerando que a consolidação das colmeias, com produção plena de mel, normalmente leva até 2 anos, durante os 12 meses do projeto será realizado o acompanhamento técnico individualizado das colmeias recém-instaladas, incluindo monitoramento da saúde das colônias, manejo básico e registro da evolução de cada colmeia. Dessa forma, mesmo sem atingir a produção plena, garante-se a capacitação das famílias e a estruturação necessária para continuidade e expansão futura da atividade.Consideraremos, de todo modo, como o projeto esta a serviço da melhoria da atividade já desenvolvida pela comunidade.`, activities: [
        { id: 4004041, name: `Acompanhamento técnico durante a instalação das 8 caixas de colmeia e primeiros ciclos de produção; registro da evolução da atividade. Considerando que a consolidação das colmeias, com produção plena de mel, normalmente leva até 2 anos, durante os 12 meses do projeto será realizado o acompanhamento técnico individualizado das colmeias recém-instaladas, incluindo monitoramento da saúde das colônias, manejo básico e registro da evolução de cada colmeia. Dessa forma, mesmo sem atingir a produção plena, garante-se a capacitação das famílias e a estruturação necessária para continuidade e expansão futura da atividade.Consideraremos, de todo modo, como o projeto esta a serviço da melhoria da atividade já desenvolvida pela comunidade.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4005, name: `5. Manutenção do biodigestor e melhoria de condições para o uso coletivo`, deliverables: [
      { id: 400501, name: `5.1. Aquisição de 100 baldes de 20L`, expectedResult: `Aquisição de 100 baldes para a ampliação do projeto Balde Agroecológico`, activities: [
        { id: 4005011, name: `Aquisição de 100 baldes para a ampliação do projeto Balde Agroecológico`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 400502, name: `5.2. Aquisição de 100 recipientes de 5L`, expectedResult: `Aquisição de 100 recipientes de 5L para armazenamento de biofertilizante a ser`, activities: [
        { id: 4005021, name: `Aquisição de 100 recipientes de 5L para armazenamento de biofertilizante a ser`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 4006, name: `6. Acompanhamento, monitoramento e avaliação`, deliverables: [
      { id: 400601, name: `6.1. Relatoria`, expectedResult: `Elaboração de relatórios parciais (mês 3, 6 e 9) e relatório final (mês 12), contendo indicadores quantitativos e qualitativos, desafios e lições aprendidas.`, activities: [
        { id: 4006011, name: `Elaboração de relatórios parciais (mês 3, 6 e 9) e relatório final (mês 12), contendo indicadores quantitativos e qualitativos, desafios e lições aprendidas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  5: [
    { id: 5001, name: `1. Meta 1 — Capacitar 50 extrativistas em manejo, beneficiamento e gestão da castanha`, deliverables: [
      { id: 500101, name: `1.1 Contratar profissionais e elaborar material didático (dez/25 a jan/26)`, expectedResult: `Contratação de profissionais (agrônomo, gestor ambiental e especialista em bioeconomia) e desenvolvimento de material didático adaptado à cultura Kayapó. Indicadores: 02 contratos de serviço e 01 material didático. Duração: dez/2025 a jan/2026. Fonte de verificação: contratos, relatórios e material didático.`, activities: [
        { id: 5001011, name: `Contratação de profissionais (agrônomo, gestor ambiental e especialista em bioeconomia) e desenvolvimento de material didático adaptado à cultura Kayapó. Indicadores: 02 contratos de serviço e 01 material didático. Duração: dez/2025 a jan/2026. Fonte de verificação: contratos, relatórios e material didático.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 500102, name: `1.2 Realizar 8 oficinas de 40 horas (jan a jun/26)`, expectedResult: `Realização de 8 oficinas de 40 horas, com 25 participantes cada, abordando boas práticas de coleta sustentável, técnicas de armazenamento e logística, gestão comunitária e comercialização coletiva da castanha-do-pará, além de organização social, negociação e fortalecimento da autonomia econômica. Indicadores: 08 oficinas e 50 participantes. Duração: jan a jun/2026.`, activities: [
        { id: 5001021, name: `Realização de 8 oficinas de 40 horas, com 25 participantes cada, abordando boas práticas de coleta sustentável, técnicas de armazenamento e logística, gestão comunitária e comercialização coletiva da castanha-do-pará, além de organização social, negociação e fortalecimento da autonomia econômica. Indicadores: 08 oficinas e 50 participantes. Duração: jan a jun/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 5002, name: `2. Meta 2 — Implantar estrutura de coleta e logística`, deliverables: [
      { id: 500201, name: `2.1 Aquisição de 2 barcos e 2 motores 40 HP (dez/25)`, expectedResult: `Compra de 2 barcos e 2 motores de 40 HP para otimização da coleta e do transporte sustentável da produção e da equipe de coleta. Indicadores: 02 barcos e 02 motores 40 HP. Duração: dez/2025. Fonte de verificação: notas fiscais e termos de entrega.`, activities: [
        { id: 5002011, name: `Compra de 2 barcos e 2 motores de 40 HP para otimização da coleta e do transporte sustentável da produção e da equipe de coleta. Indicadores: 02 barcos e 02 motores 40 HP. Duração: dez/2025. Fonte de verificação: notas fiscais e termos de entrega.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 500202, name: `2.2 Ponto de armazenamento comunitário (jan a mar/26)`, expectedResult: `Aquisição e instalação de estruturas simples (depósitos, caixas de armazenamento e equipamentos de secagem natural) para garantir a qualidade da castanha até o transporte. Indicador: 01 estrutura de armazenamento instalada. Duração: jan a mar/2026. Fonte de verificação: notas fiscais, termos de instalação e fotos.`, activities: [
        { id: 5002021, name: `Aquisição e instalação de estruturas simples (depósitos, caixas de armazenamento e equipamentos de secagem natural) para garantir a qualidade da castanha até o transporte. Indicador: 01 estrutura de armazenamento instalada. Duração: jan a mar/2026. Fonte de verificação: notas fiscais, termos de instalação e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 5003, name: `3. Meta 3 — Estruturar a comercialização coletiva`, deliverables: [
      { id: 500301, name: `3.1 Criação do núcleo comunitário de comercialização (fev a mar/26)`, expectedResult: `Organização de um espaço físico e administrativo na Associação Mebengokre Ytê Kayapó para centralizar a venda da produção. Indicador: 01 núcleo de comercialização estruturado. Duração: fev a mar/2026. Fonte de verificação: relatório de criação e ata de definição do núcleo.`, activities: [
        { id: 5003011, name: `Organização de um espaço físico e administrativo na Associação Mebengokre Ytê Kayapó para centralizar a venda da produção. Indicador: 01 núcleo de comercialização estruturado. Duração: fev a mar/2026. Fonte de verificação: relatório de criação e ata de definição do núcleo.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 500302, name: `3.2 Formalização de 2 parcerias comerciais (mar a mai/26)`, expectedResult: `Estabelecimento de contratos ou acordos com fornecedores e compradores parceiros, garantindo preços justos e previsibilidade de escoamento da produção. Indicador: 02 documentos. Duração: mar a mai/2026. Fonte de verificação: acordos ou contratos firmados.`, activities: [
        { id: 5003021, name: `Estabelecimento de contratos ou acordos com fornecedores e compradores parceiros, garantindo preços justos e previsibilidade de escoamento da produção. Indicador: 02 documentos. Duração: mar a mai/2026. Fonte de verificação: acordos ou contratos firmados.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 500303, name: `3.3 Organização de 3 vendas coletivas (mar a jul/26)`, expectedResult: `Planejamento e execução de pelo menos 3 vendas coletivas durante o período do projeto, reunindo a produção de diferentes comunidades Kayapó. Indicador: 03 vendas coletivas realizadas. Duração: mar a jul/2026. Fonte de verificação: relatório de vendas e fotos.`, activities: [
        { id: 5003031, name: `Planejamento e execução de pelo menos 3 vendas coletivas durante o período do projeto, reunindo a produção de diferentes comunidades Kayapó. Indicador: 03 vendas coletivas realizadas. Duração: mar a jul/2026. Fonte de verificação: relatório de vendas e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 5004, name: `4. Meta 4 — Fortalecer o protagonismo indígena e a conservação da floresta`, deliverables: [
      { id: 500401, name: `4.1 Assembleias e reuniões de comunicação (dez/25 a out/26)`, expectedResult: `Realização de assembleias regulares, a cada dois meses, e de reuniões com o conselho de caciques e os comitês de mulheres e de jovens. Indicadores: 06 reuniões e 06 assembleias. Duração: dez/2025 a out/2026. Fonte de verificação: atas de reunião e relatórios de participação.`, activities: [
        { id: 5004011, name: `Realização de assembleias regulares, a cada dois meses, e de reuniões com o conselho de caciques e os comitês de mulheres e de jovens. Indicadores: 06 reuniões e 06 assembleias. Duração: dez/2025 a out/2026. Fonte de verificação: atas de reunião e relatórios de participação.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 500402, name: `4.2 Monitoramento ambiental e cultural (4 relatórios)`, expectedResult: `Acompanhamento das práticas de manejo florestal sustentável e registro das atividades culturais relacionadas à castanha-do-pará. Indicadores: 04 relatórios de monitoramento e 01 registro cultural. Duração: dez/2025 a out/2026. Fonte de verificação: relatórios técnicos e documentação fotográfica/vídeo.`, activities: [
        { id: 5004021, name: `Acompanhamento das práticas de manejo florestal sustentável e registro das atividades culturais relacionadas à castanha-do-pará. Indicadores: 04 relatórios de monitoramento e 01 registro cultural. Duração: dez/2025 a out/2026. Fonte de verificação: relatórios técnicos e documentação fotográfica/vídeo.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 500403, name: `4.3 Divulgação e acesso a mercados (3 feiras, mar a out/26)`, expectedResult: `Participação em feiras e eventos e articulação com compradores para acesso a mercados diferenciados. Indicador: 03 participações em eventos. Duração: mar a out/2026. Fonte de verificação: certificados de participação.`, activities: [
        { id: 5004031, name: `Participação em feiras e eventos e articulação com compradores para acesso a mercados diferenciados. Indicador: 03 participações em eventos. Duração: mar a out/2026. Fonte de verificação: certificados de participação.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 5005, name: `5. Meta 5 — Implantar sistema de monitoramento e avaliação`, deliverables: [
      { id: 500501, name: `5.1 Definir indicadores de desempenho (dez/25 a jan/26)`, expectedResult: `Elaboração de um conjunto de indicadores participativos (econômicos, sociais e ambientais) para acompanhar a execução do projeto. Indicador: 01 conjunto de indicadores elaborado. Duração: dez/2025 a jan/2026. Fonte de verificação: documento com indicadores definidos e aprovados em assembleia.`, activities: [
        { id: 5005011, name: `Elaboração de um conjunto de indicadores participativos (econômicos, sociais e ambientais) para acompanhar a execução do projeto. Indicador: 01 conjunto de indicadores elaborado. Duração: dez/2025 a jan/2026. Fonte de verificação: documento com indicadores definidos e aprovados em assembleia.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 500502, name: `5.2 e 5.3 Relatórios semestrais e avaliação participativa (até dez/26)`, expectedResult: `Produção de relatórios semestrais com dados sobre coleta, armazenamento, comercialização e impactos sociais (02 relatórios) e realização de encontros trimestrais de avaliação participativa com extrativistas, caciques e comitês de mulheres e jovens (04 encontros). Duração: dez/2025 a dez/2026.`, activities: [
        { id: 5005021, name: `Produção de relatórios semestrais com dados sobre coleta, armazenamento, comercialização e impactos sociais (02 relatórios) e realização de encontros trimestrais de avaliação participativa com extrativistas, caciques e comitês de mulheres e jovens (04 encontros). Duração: dez/2025 a dez/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  6: [
    { id: 6001, name: `1. Valorização cultural e saberes tradicionais`, deliverables: [
      { id: 600101, name: `.1.1. 3 (três) oficinas de conhecimentos do território quilombola`, expectedResult: `Capacitação ofertada pelas lideranças comunitárias e os anciãos.`, activities: [
        { id: 6001011, name: `Capacitação ofertada pelas lideranças comunitárias e os anciãos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600102, name: `1.2. (confecção da cartilha) Registrar práticas tradicionais em cartilhas`, expectedResult: `registrar práticas tradicionais em cartilha em conjunto com os jovens da comunidade que estão na universidade.`, activities: [
        { id: 6001021, name: `registrar práticas tradicionais em cartilha em conjunto com os jovens da comunidade que estão na universidade.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6002, name: `2. Capacitação comunitária`, deliverables: [
      { id: 600201, name: `2.1 Intercâmbio entre as comunidades`, expectedResult: `Promover a troca de experiências entre diferentes viveiristas.`, activities: [
        { id: 6002011, name: `Promover a troca de experiências entre diferentes viveiristas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600202, name: `2.1.1 oficina de capacitação sobre espécies nativa (identificação, coleta, ciclo de vida)`, expectedResult: `Contratar um profissional para realizar capacitação teórica e prática`, activities: [
        { id: 6002021, name: `Contratar um profissional para realizar capacitação teórica e prática`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600203, name: `2.1.3..Capacitação para a construção do Viveiro`, expectedResult: `Contratação de um carpinteiro para a construção do viveiro`, activities: [
        { id: 6002031, name: `Contratação de um carpinteiro para a construção do viveiro`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6003, name: `3. Infraestrutura do viveiro`, deliverables: [
      { id: 600301, name: `3.1. Limpeza do espaço para a construção`, expectedResult: `Participação da comunidade através de puxirum`, activities: [
        { id: 6003011, name: `Participação da comunidade através de puxirum`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600302, name: `3.2. Construção dos viveiros com mutirão (puxirum) comunidade`, expectedResult: `Viveiros comunitários montado e funcional.`, activities: [
        { id: 6003021, name: `Viveiros comunitários montado e funcional.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6004, name: `4. Produção de mudas`, deliverables: [
      { id: 600401, name: `4.1. Planejamento para a Coleta das sementes na floresta`, expectedResult: `mapear as espécies nativas do território com época de coleta e elaborar a Ficha de coleta de sementes para impressão,`, activities: [
        { id: 6004011, name: `mapear as espécies nativas do território com época de coleta e elaborar a Ficha de coleta de sementes para impressão,`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600402, name: `4.2 Coleta das Sementes`, expectedResult: `coletar espécies nativas, frutíferas e medicinais valorizadas pela comunidade e pelo mercado`, activities: [
        { id: 6004021, name: `coletar espécies nativas, frutíferas e medicinais valorizadas pela comunidade e pelo mercado`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600403, name: `4.3. Plantio das Sementes`, expectedResult: `preparar substratos e produzir mudas Germinação saudável das espécies coletadas ou escolhidas.`, activities: [
        { id: 6004031, name: `preparar substratos e produzir mudas Germinação saudável das espécies coletadas ou escolhidas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600404, name: `4.4.Cuidados pós plantio`, expectedResult: `Alta taxa de sobrevivência das mudas. Mudas firmes no solo, com raiz já adaptada (raízes novas), que não tombem, nem murchem com facilidade, mesmo quando há variação no clima.`, activities: [
        { id: 6004041, name: `Alta taxa de sobrevivência das mudas. Mudas firmes no solo, com raiz já adaptada (raízes novas), que não tombem, nem murchem com facilidade, mesmo quando há variação no clima.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 600405, name: `Acompanhamento do crescimento`, expectedResult: `A coordenação do projeto e as famílias das comunidades farão o acompanhamento nos viveiros de acordo com seu planejamento Adaptação ao local definitivo, sobrevivência, altura e diâmetros das mudas`, activities: [
        { id: 6004051, name: `A coordenação do projeto e as famílias das comunidades farão o acompanhamento nos viveiros de acordo com seu planejamento Adaptação ao local definitivo, sobrevivência, altura e diâmetros das mudas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 6005, name: `5. Reflorestamento e recuperação ambiental`, deliverables: [
      { id: 600501, name: `utilizar muda dos viveiros em áreas degradadas da comunidade (roçados, capoeiras, beira de rio)`, expectedResult: `Os comunitários farão o plantio das essências florestais nas áreas determinadas pelas comunidades, sendo nas de APP, áreas manejadas e em áreas com baixo potencial de castanha do Pará e cumaru`, activities: [
        { id: 6005011, name: `Os comunitários farão o plantio das essências florestais nas áreas determinadas pelas comunidades, sendo nas de APP, áreas manejadas e em áreas com baixo potencial de castanha do Pará e cumaru`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  7: [
    { id: 7001, name: `1. Cotação e Contratação de fornecedores de produtos (materiais de construção) e serviços (arquiteto, engenheiro e outros)`, deliverables: [
      { id: 700101, name: `1.1. Cotação de preços e contratação de serviços de construção`, expectedResult: `Atividade realizada pela equipe técnica do projeto, em dias, considerando melhor preço e proposta.`, activities: [
        { id: 7001011, name: `Atividade realizada pela equipe técnica do projeto, em dias, considerando melhor preço e proposta.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700102, name: `1.2 Fase 1: avaliação da estrutura física atual da sede da ATAIC`, expectedResult: `Análise da estrutura física para reaproveitamento de espaços e materiais. Essa ação será desenvolvida pelos técnicos contratados para a construção das instalações, no período de 07 dias.`, activities: [
        { id: 7001021, name: `Análise da estrutura física para reaproveitamento de espaços e materiais. Essa ação será desenvolvida pelos técnicos contratados para a construção das instalações, no período de 07 dias.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700103, name: `1.3 Fase 2: Construção dos espaços conforme planta arquitetônica.`, expectedResult: `Construção das estruturas físicas, de acordo com a planta arquitetônica elaborada Essa atividade será realizada no período de 150 dias.`, activities: [
        { id: 7001031, name: `Construção das estruturas físicas, de acordo com a planta arquitetônica elaborada Essa atividade será realizada no período de 150 dias.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700104, name: `1.4 Fase 3: Acabamento e reparos`, expectedResult: `Instalações elétricas, hidráulicas e pintura dos espaços, a ser realizado pelos profissionais contratados no periodo de 60 dias.`, activities: [
        { id: 7001041, name: `Instalações elétricas, hidráulicas e pintura dos espaços, a ser realizado pelos profissionais contratados no periodo de 60 dias.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 7002, name: `2. Formaçao da equipe gestora do Centro de Formação`, deliverables: [
      { id: 700201, name: `prospecção de formações a serem realizadas`, expectedResult: `realizaçao de diagnostico de identificação de formações de Interesse dos beneficiários diretos e indiretos da proposta, desenvolvido por equipe técnica responsável com o apoio de assessoria, a ser contratada. Será desenvolvido no período de 60 dias`, activities: [
        { id: 7002011, name: `realizaçao de diagnostico de identificação de formações de Interesse dos beneficiários diretos e indiretos da proposta, desenvolvido por equipe técnica responsável com o apoio de assessoria, a ser contratada. Será desenvolvido no período de 60 dias`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 700202, name: `2.2.Criar e formar equipe gestora do Centro de formação.`, expectedResult: `Mobilização, seleção e capacitação da equipe gestora do Centro de Formação, definindo papeis e responsabilidades. Essa tarefa será realizada pela diretoria da ATAIC e equipe do Projeto, em um periodo de 60 dias`, activities: [
        { id: 7002021, name: `Mobilização, seleção e capacitação da equipe gestora do Centro de Formação, definindo papeis e responsabilidades. Essa tarefa será realizada pela diretoria da ATAIC e equipe do Projeto, em um periodo de 60 dias`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  8: [
    { id: 8001, name: `1. Aquisição de equipamentos para viabilizar os planejamentos, relatórios, prestação de contas e sistematização das informação do projeto;`, deliverables: [
      { id: 800101, name: `Compra de Notebook, projetos multimídias, mesas e cadeiras.`, expectedResult: `A equipe de compras da ARQUIA fará a cotação e a compra um Notebook e um projetos multimídias, mesas e cadeiras para uso da organização em seus projetos. A equipe fará essa cotação por um período de uma semana, considerando as condições geográficas que exigem tempo de pesquisa e cotação.`, activities: [
        { id: 8001011, name: `A equipe de compras da ARQUIA fará a cotação e a compra um Notebook e um projetos multimídias, mesas e cadeiras para uso da organização em seus projetos. A equipe fará essa cotação por um período de uma semana, considerando as condições geográficas que exigem tempo de pesquisa e cotação.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 8002, name: `2. Implantar 5 hortas comunitárias com variedades de hortaliças adaptadas nas comunidades e mitigação das mudanças climáticas;`, deliverables: [
      { id: 800201, name: `Contratação de profissionais para assessorar a ARQUIA em atividades formativas na área de direitos, mobilização e captação de recursos e horticultura.`, expectedResult: `Profissional da área de agronomia (Agrônomo ou afim), para orientação profissional em horticultura; Assessor técnico para atividades formativas em direitos quilombolas, contratação de profissional para mobilização de recursos .`, activities: [
        { id: 8002011, name: `Profissional da área de agronomia (Agrônomo ou afim), para orientação profissional em horticultura; Assessor técnico para atividades formativas em direitos quilombolas, contratação de profissional para mobilização de recursos .`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800202, name: `Realização de Cinco (5) reuniões com as comunidades envolvidas para planejar a execução das dos trabalhos hortaliças;`, expectedResult: `Participação de comunitários das 5 comunidades a receber as hortas, lideranças da ARQUIA e outros comunitários interessados nas projeto, convidados pela ARQAUIA e comunidades`, activities: [
        { id: 8002021, name: `Participação de comunitários das 5 comunidades a receber as hortas, lideranças da ARQUIA e outros comunitários interessados nas projeto, convidados pela ARQAUIA e comunidades`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 800203, name: `Oficinas práticas de construção, de hortas comunitárias, com atividades teóricas e práticas sobre formas de produção e canais de comercialização sobre os sistemas produtivos e seu manejo sustentável.`, expectedResult: `Participação nas formações, de pelo menos 10 comunitários das de cada um das 5 comunidades a receberem as hortas e formações; participação de lideranças da ARQUIA`, activities: [
        { id: 8002031, name: `Participação nas formações, de pelo menos 10 comunitários das de cada um das 5 comunidades a receberem as hortas e formações; participação de lideranças da ARQUIA`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 8003, name: `3. Formar no mínimo 20 lideranças das comunidades em temas como direitos (ambientais, territoriais, educação, saúde ambiental, visando o fortalecimento institucional e comunitário`, deliverables: [
      { id: 800301, name: `Formar no mínimo 20 lideranças das comunidades quilombolas da ARQUIA, em temas como direito à saúde, educação, território, dentre outros.`, expectedResult: `Garantir a participação de no mínimo 20 comunitários e suas lideranças, nas formações sobre direitos`, activities: [
        { id: 8003011, name: `Garantir a participação de no mínimo 20 comunitários e suas lideranças, nas formações sobre direitos`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 8004, name: `4. Construir e equipar um espaço físico comunitário multifuncional até o final do projeto, para abrigar atividades`, deliverables: [
      { id: 800401, name: `4.1.definição do terreno/comunidade, preparação do espaço, compra dos materiais de construção, definição dos profissionais/comunitários, inicio das atividades/obras.`, expectedResult: `Construção do espaço e liberação de uso`, activities: [
        { id: 8004011, name: `Construção do espaço e liberação de uso`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  9: [
    { id: 9001, name: `1. Realizar reuniões de alinhamento com equipe interna e parceiros institucionais, lançamento de editais e chamadas para profissionais/voluntário, além de cotações de materiais e serviços necessários ao início das atividades do projeto.`, deliverables: [
      { id: 900101, name: `1.1.Reuniões com stakeholders;`, expectedResult: `- 1 semana – Reunião com a equipe de coordenação e execução (incluindo pontos focais - diárias) Alinhamento geral - 2 semana – Reunião com parceiros – (EMATER, UFOPA, Associações indígenas, IFPA, OCB, SENAR etc`, activities: [
        { id: 9001011, name: `- 1 semana – Reunião com a equipe de coordenação e execução (incluindo pontos focais - diárias) Alinhamento geral - 2 semana – Reunião com parceiros – (EMATER, UFOPA, Associações indígenas, IFPA, OCB, SENAR etc`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900102, name: `1.2 Publicação de edital;`, expectedResult: `Lançamento do banco de talentos do projeto, chamada para voluntários: Análise curricular de profissionais;`, activities: [
        { id: 9001021, name: `Lançamento do banco de talentos do projeto, chamada para voluntários: Análise curricular de profissionais;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900103, name: `Formação de banco de talentos: Essas contratações serão para serviços pontuais como: facilitação de oficinas, motorista, cozinheiro etc; (por isso trabalhamos com banco de talentos para quando precisarmos dos profissionais, eles já estarão mapeados)`, expectedResult: `Formação de banco de talentos: Essas contratações serão para serviços pontuais como: facilitação de oficinas, motorista, cozinheiro etc; (por isso trabalhamos com banco de talentos para quando precisarmos dos profissionais, eles já estarão mapeados)`, activities: [
        { id: 9001031, name: `Formação de banco de talentos: Essas contratações serão para serviços pontuais como: facilitação de oficinas, motorista, cozinheiro etc; (por isso trabalhamos com banco de talentos para quando precisarmos dos profissionais, eles já estarão mapeados)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900104, name: `1.3 Cotações de materiais e serviços;`, expectedResult: `Cotações de materiais e serviços a serem adquiridos pelo projeto; Análise de preço, qualidade, tempo de entrega de materiais.`, activities: [
        { id: 9001041, name: `Cotações de materiais e serviços a serem adquiridos pelo projeto; Análise de preço, qualidade, tempo de entrega de materiais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900105, name: `1.4.Compras dos materiais e serviço;`, expectedResult: `Pagamento para a aquisição de materiais e serviços (equipamentos, gráfica, combustível etc) Entrega: Análise de materiais entregues (se estão em bom funcionamento)`, activities: [
        { id: 9001051, name: `Pagamento para a aquisição de materiais e serviços (equipamentos, gráfica, combustível etc) Entrega: Análise de materiais entregues (se estão em bom funcionamento)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9002, name: `2. EXECUÇÃO DAS OFICINAS E TREINAMENTOS DE FERRAMENTAS DIGITAIS PARA MARKETING E VENDAS`, deliverables: [
      { id: 900201, name: `2.1. Reuniões para planejamento da oficina, com o mesmo conteúdo para ser realizada nos dois territórios, mudando a logística para planalto e rios.`, expectedResult: `- 1a semana: Reunião com equipe de coordenação e execução e parceiros Elaboração de Termo de Referência TDR para a seleção de facilitadores e suporte técnico e (Facilitadores deverão elaborar conteúdo programático do curso, material didático e prático); - 2 e 3a Semana: Reunião com coordenação, equipe técnica (voluntários) e facilitadores Análise, revisão e aprovação do material elaborado; - 3a semana: Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparação de material de divulgação (camisas, banners etc) - 4a semana: Reunião com pontos focais e logística Preparação do ambiente e equipamentos para a realização do curso, preparação da área para crianças e tudo.`, activities: [
        { id: 9002011, name: `- 1a semana: Reunião com equipe de coordenação e execução e parceiros Elaboração de Termo de Referência TDR para a seleção de facilitadores e suporte técnico e (Facilitadores deverão elaborar conteúdo programático do curso, material didático e prático); - 2 e 3a Semana: Reunião com coordenação, equipe técnica (voluntários) e facilitadores Análise, revisão e aprovação do material elaborado; - 3a semana: Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparação de material de divulgação (camisas, banners etc) - 4a semana: Reunião com pontos focais e logística Preparação do ambiente e equipamentos para a realização do curso, preparação da área para crianças e tudo.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900202, name: `2.2.Execução da oficina de ferramentas digitais, marketing e vendas;`, expectedResult: `- 1a semana – Tapajós e Planalto 30 Mulheres e jovens inscritos na oficina; 10 mulheres e jovens no cadastro reserva Criação do grupo de whatsapp para facilitar a comunicação com as inscritas;`, activities: [
        { id: 9002021, name: `- 1a semana – Tapajós e Planalto 30 Mulheres e jovens inscritos na oficina; 10 mulheres e jovens no cadastro reserva Criação do grupo de whatsapp para facilitar a comunicação com as inscritas;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900203, name: `2.3. Avaliação da oficina de ferramentas digitais, marketing e vendas;`, expectedResult: `1a semana – Sistematização de dados das oficinas; Quantitativos e qualitativos; 2asemana – Reunião – Coordenação, equipe executora e facilitadores – Entrega de relatórios dos facilitadores; Análise de dados sistematizados; Avaliação geral; 3a semana – Elaboração de relatório financeiro e descritivo da primeira fase do projeto; 4asemana – Entrega do relatório`, activities: [
        { id: 9002031, name: `1a semana – Sistematização de dados das oficinas; Quantitativos e qualitativos; 2asemana – Reunião – Coordenação, equipe executora e facilitadores – Entrega de relatórios dos facilitadores; Análise de dados sistematizados; Avaliação geral; 3a semana – Elaboração de relatório financeiro e descritivo da primeira fase do projeto; 4asemana – Entrega do relatório`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9003, name: `3. CICLO FORMATIVO DE GESTÃO FINANCEIRA`, deliverables: [
      { id: 900301, name: `3.1. Reuniões para planejamento da oficina;`, expectedResult: `1a semana Reunião com equipe coordenação 1a semana Elaboração de Termo de Referência TDR para a seleção de facilitadores e suporte técnico e (Facilitadores deverão elaborar conteúdo programático do curso, material didático e prático); 2 e 3a Semana Reunião com coordenação,equipe tecnica (voluntários) e facilitadores – Analise, revisão e aprovação do material elaborado; 3a semana Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparção de material de divulgação (camisas, banners etc) 4a semana Reunião com pontos focais e logistica – Perparação do ambiente e equipamentos para a realização do curso), preparção da área para as crianças e tudo`, activities: [
        { id: 9003011, name: `1a semana Reunião com equipe coordenação 1a semana Elaboração de Termo de Referência TDR para a seleção de facilitadores e suporte técnico e (Facilitadores deverão elaborar conteúdo programático do curso, material didático e prático); 2 e 3a Semana Reunião com coordenação,equipe tecnica (voluntários) e facilitadores – Analise, revisão e aprovação do material elaborado; 3a semana Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparção de material de divulgação (camisas, banners etc) 4a semana Reunião com pontos focais e logistica – Perparação do ambiente e equipamentos para a realização do curso), preparção da área para as crianças e tudo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900302, name: `3.2. Execução da oficina de gestão financeira;`, expectedResult: `1a semana – Tapajós e planalto 30 Mulheres e jovens inscritos na oficina de gestão financeira do tapajós e Planalto; 10 mulheres e jovens no cadastro reserva Criação do grupo de whatsapp para facilitar a comunicação com as inscritas; 1a semana - Tapajós Preparação da logistica até a comunidade onde será realizada a oficina; 2a semana – Tapajós Realização da oficina 3a semana - Planalto Preparação da logistica até a comunidade onde será realizada a oficina 4a semana – Planalto Realização da oficina - Dia 1 – Chegada – Recepção, acomodação, conversa com a comunidade, distribuição dos kits para as participantes, ultimos ajustes;`, activities: [
        { id: 9003021, name: `1a semana – Tapajós e planalto 30 Mulheres e jovens inscritos na oficina de gestão financeira do tapajós e Planalto; 10 mulheres e jovens no cadastro reserva Criação do grupo de whatsapp para facilitar a comunicação com as inscritas; 1a semana - Tapajós Preparação da logistica até a comunidade onde será realizada a oficina; 2a semana – Tapajós Realização da oficina 3a semana - Planalto Preparação da logistica até a comunidade onde será realizada a oficina 4a semana – Planalto Realização da oficina - Dia 1 – Chegada – Recepção, acomodação, conversa com a comunidade, distribuição dos kits para as participantes, ultimos ajustes;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900303, name: `3.3. Avaliação da oficina de gestão financeira;`, expectedResult: `1a semana – Sistematização de dados das oficinas; Quantitativos e qualitativos; 2asemana – Reunião – Coordenação, equipe executora e facilitadores – Entrega de relatórios dos facilitadores; Analise de dados sistematizados; Avaliação geral; 3a semana – Elaboração de relatório financeiro e descritivo da segunda fase do projeto; 4asemana – Entrega do relátorio`, activities: [
        { id: 9003031, name: `1a semana – Sistematização de dados das oficinas; Quantitativos e qualitativos; 2asemana – Reunião – Coordenação, equipe executora e facilitadores – Entrega de relatórios dos facilitadores; Analise de dados sistematizados; Avaliação geral; 3a semana – Elaboração de relatório financeiro e descritivo da segunda fase do projeto; 4asemana – Entrega do relátorio`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9004, name: `4. CICLO FORMATIVO DE PLANEJAMENTO E GÊNERO`, deliverables: [
      { id: 900401, name: `4.1. Reuniões para planejamento da oficina;`, expectedResult: `1a semana Reunião com equipe coordenação e execução 1a semana Elaboração de Termo de Refrência TDR para a seleção de facilitadores e suporte técnico 2 e 3a Semana Reunião com coordenação, equipe tecnica (voluntários) e facilitadores – Analise, revisão e aprovação do material elaborado; 3a semana Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparação de material de divulgação (camisas, banners etc) 4a semana Reunião com pontos focais e logística – Preparação do ambiente e equipamentos para a realização do curso), preparação da área para as crianças`, activities: [
        { id: 9004011, name: `1a semana Reunião com equipe coordenação e execução 1a semana Elaboração de Termo de Refrência TDR para a seleção de facilitadores e suporte técnico 2 e 3a Semana Reunião com coordenação, equipe tecnica (voluntários) e facilitadores – Analise, revisão e aprovação do material elaborado; 3a semana Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparação de material de divulgação (camisas, banners etc) 4a semana Reunião com pontos focais e logística – Preparação do ambiente e equipamentos para a realização do curso), preparação da área para as crianças`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900402, name: `4.2. Execução da oficina de planejamento e gênero;`, expectedResult: `1a semana – Tapajós e planalto 30 Mulheres e jovens inscritos na oficina de planejamento e gênero; 10 mulheres e jovens no cadastro reserva Criação do grupo de whatsapp para facilitar a comunicação com as inscritas; 1a semana - Tapajós Preparação da logistica até a comunidade onde será realizada a oficina; 2a semana – Tapajós Realização da oficina 3a semana - Planalto Preparação da logistica até a comunidade onde será realizada a oficina; 4a semana – Tapajós Realização da oficina`, activities: [
        { id: 9004021, name: `1a semana – Tapajós e planalto 30 Mulheres e jovens inscritos na oficina de planejamento e gênero; 10 mulheres e jovens no cadastro reserva Criação do grupo de whatsapp para facilitar a comunicação com as inscritas; 1a semana - Tapajós Preparação da logistica até a comunidade onde será realizada a oficina; 2a semana – Tapajós Realização da oficina 3a semana - Planalto Preparação da logistica até a comunidade onde será realizada a oficina; 4a semana – Tapajós Realização da oficina`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900403, name: `4.3. Avaliação da oficina de planejamento e gênero;`, expectedResult: `1a semana – Sistematização de dados das oficinas; Quantitativos e qualitativos; 2asemana – Reunião – Coordenação, equipe executora e facilitarores – Entrega de relatórios dos facilitadores; Analise de dados sistematizados; Avaliação geral; 3a semana – Elaboração de relatório financeiro e descritivo da segunda fase do projeto; 4asemana – Entrega do relatório`, activities: [
        { id: 9004031, name: `1a semana – Sistematização de dados das oficinas; Quantitativos e qualitativos; 2asemana – Reunião – Coordenação, equipe executora e facilitarores – Entrega de relatórios dos facilitadores; Analise de dados sistematizados; Avaliação geral; 3a semana – Elaboração de relatório financeiro e descritivo da segunda fase do projeto; 4asemana – Entrega do relatório`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9005, name: `5. CICLO FORMATIVO INTRODUÇÃO A AGROECOLOGIA E PRODUÇÃO ORGÂNICA`, deliverables: [
      { id: 900501, name: `5.1. Reuniões para planejamento da oficina;`, expectedResult: `1a semana Reunião com equipe coordenação e execução e parcerios (EMATER, IFPA etc) – Elaboração de Termo de Refrência TDR para a seleção de facilitadores e suporte técnico. Reunião com coordenação, equipe técnica (voluntários) e facilitadores – Análise, revisão e aprovação do material elaborado; 3a semana Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparação de material de divulgação (camisas, banners etc) 4a semana Reunião com pontos focais e logística`, activities: [
        { id: 9005011, name: `1a semana Reunião com equipe coordenação e execução e parcerios (EMATER, IFPA etc) – Elaboração de Termo de Refrência TDR para a seleção de facilitadores e suporte técnico. Reunião com coordenação, equipe técnica (voluntários) e facilitadores – Análise, revisão e aprovação do material elaborado; 3a semana Reunião entre coordenação e comunicação – Aprovação da campanha de divulgação do curso Lançamento das inscrições, divulgação e mobilização dos participantes Impressão de material didático (apostilas, cadernos etc) e preparação de material de divulgação (camisas, banners etc) 4a semana Reunião com pontos focais e logística`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900502, name: `5.2. Execução da introdução a agroecologia e produção orgânica;`, expectedResult: `Realização da oficina Tapajós e Planalto Dia 1 – Chegada – Recepção, acomodação, conversa com a comunidade, distribuição dos kits para as participantes, ultimos ajustes; Inicio da formação Dia 2 – Modulo 1- Agroecologia, principios e saberes tradicionais 5hrs Dia 3 – Modulo 2- Produção orgânica teoria e prática 5hrs Dia 4 - Modulo 3 – Quintais produtivos e Sistemas agroflorestais SAFS 5hrs Dia 5 – Apresentação dos resultados pelas participantes, avaliação da formação e entrega de certificados 5hrs`, activities: [
        { id: 9005021, name: `Realização da oficina Tapajós e Planalto Dia 1 – Chegada – Recepção, acomodação, conversa com a comunidade, distribuição dos kits para as participantes, ultimos ajustes; Inicio da formação Dia 2 – Modulo 1- Agroecologia, principios e saberes tradicionais 5hrs Dia 3 – Modulo 2- Produção orgânica teoria e prática 5hrs Dia 4 - Modulo 3 – Quintais produtivos e Sistemas agroflorestais SAFS 5hrs Dia 5 – Apresentação dos resultados pelas participantes, avaliação da formação e entrega de certificados 5hrs`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9006, name: `6. ELABORAÇÃO DA SECRETARIA DE MULHERES DA COOPAFS`, deliverables: [
      { id: 900601, name: `6.1 – Rodas de conversa – importância da secretaria de mulheres da COOPAFS – 1 hr`, expectedResult: `- Mobilização de cooperadas - Escuta ativa - Levantamento de demandas`, activities: [
        { id: 9006011, name: `- Mobilização de cooperadas - Escuta ativa - Levantamento de demandas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900602, name: `6.2- Elaboração do planejamento coletivo`, expectedResult: `- Oficina de cocriação da Secretaria – 2hrs - missão, visão e valores -regimento interno -Estrutura mínima estabelecida: coordenadora, secretaria etc`, activities: [
        { id: 9006021, name: `- Oficina de cocriação da Secretaria – 2hrs - missão, visão e valores -regimento interno -Estrutura mínima estabelecida: coordenadora, secretaria etc`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900603, name: `6.3 – Aprovação em assembleia`, expectedResult: `-Apresentação da proposta à assembleia geral e diretoria da cooperativa`, activities: [
        { id: 9006031, name: `-Apresentação da proposta à assembleia geral e diretoria da cooperativa`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9007, name: `7. CAMPANHA DE ASSOCIAÇÃO COOPERATIVIStA PARA MULHERES INDÍGENAS – MUNDURUKU E TAPAJÓS`, deliverables: [
      { id: 900701, name: `7.1 - Mobilização e sensibilização`, expectedResult: `- Produção de materiais em linguagem acessível (cartilhas, áudios, banners etc) sobre o cooperativismo e a COOPAFS - Inserção de lideranças na campanha;`, activities: [
        { id: 9007011, name: `- Produção de materiais em linguagem acessível (cartilhas, áudios, banners etc) sobre o cooperativismo e a COOPAFS - Inserção de lideranças na campanha;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900702, name: `7.2 – Facilitação ao acesso à cooperativa`, expectedResult: `Abertura de 40 novas vagas exclusivas para mulheres indígenas que estejam aptas e tenham interesse na cooperativa; -Estande de esclarecimentos e diagnóstico paralelo a cada ação do projeto; Diagnóstico de CAF Levantamento produtivo`, activities: [
        { id: 9007021, name: `Abertura de 40 novas vagas exclusivas para mulheres indígenas que estejam aptas e tenham interesse na cooperativa; -Estande de esclarecimentos e diagnóstico paralelo a cada ação do projeto; Diagnóstico de CAF Levantamento produtivo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900703, name: `7.3 – Aprovação de novos cooperados em Assembleia`, expectedResult: `Apresentação de mulheres que passaram na triagem da cooperativa e estão aptas a se associar para a AGO, Inserção de pelo menos 5 mulheres indígenas em programas institucionais PAA e PNAE.`, activities: [
        { id: 9007031, name: `Apresentação de mulheres que passaram na triagem da cooperativa e estão aptas a se associar para a AGO, Inserção de pelo menos 5 mulheres indígenas em programas institucionais PAA e PNAE.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900704, name: `7.4 – Avaliação`, expectedResult: `Elaboração de relatórios e sistematização de dados durante todo o processo`, activities: [
        { id: 9007041, name: `Elaboração de relatórios e sistematização de dados durante todo o processo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9008, name: `8. 1a FEIRA DE MULHERES INDÍGENAS DA COOPAFS`, deliverables: [
      { id: 900801, name: `8.1 – Reunião geral entre coordenação do projeto, executores, parceiros e grupos de mulheres responsáveis pela Feira – (os grupos de mulheres responsáveis pela realização da feira irão decidir se farão juntas ou cada uma em seu território)`, expectedResult: `Criação da comissão organizadora (100% de mulheres que participaram das oficinas) Mapeamento das expositoras Definição de espaço, cronograma, logística, financeiro da feira, mobilização e divulgação;`, activities: [
        { id: 9008011, name: `Criação da comissão organizadora (100% de mulheres que participaram das oficinas) Mapeamento das expositoras Definição de espaço, cronograma, logística, financeiro da feira, mobilização e divulgação;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900802, name: `8.2 – Acompanhamento sistêmico do planejamento para execução da feira`, expectedResult: `Grupo de apoio a comissão organizadora criado no whatsapp – Mentoria para a comissão organizadora; Relatórios semanais de passso a passo para a realização feira- realizado pelas mulheres que participaram das formações; Recursos materiais e humanos garantidos para a execução da feira;`, activities: [
        { id: 9008021, name: `Grupo de apoio a comissão organizadora criado no whatsapp – Mentoria para a comissão organizadora; Relatórios semanais de passso a passo para a realização feira- realizado pelas mulheres que participaram das formações; Recursos materiais e humanos garantidos para a execução da feira;`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 900803, name: `8.3 – DIA DA FEIRA!`, expectedResult: `Mulheres expondo seus produtos Atrações culturais Encerramento oficial do projeto`, activities: [
        { id: 9008031, name: `Mulheres expondo seus produtos Atrações culturais Encerramento oficial do projeto`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 9009, name: `9. RELATÓRIO FINAL`, deliverables: [
      { id: 900901, name: `9.1 Sistematização de todos os dados`, expectedResult: `Elaboração de relatórios`, activities: [
        { id: 9009011, name: `Elaboração de relatórios`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  10: [
    { id: 10001, name: `1. Construção da Infraestrutura Física de 100 m2 para abrigar os equipamentos e materiais da agroindústria`, deliverables: [
      { id: 1000101, name: `1.1. Realizar reunião de Planejamento`, expectedResult: `Reunião de 4 horas com todos os cooperados para explicar o cronograma de execução do projeto`, activities: [
        { id: 10001011, name: `Reunião de 4 horas com todos os cooperados para explicar o cronograma de execução do projeto`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000102, name: `1.2. Contratar responsável técnico da obra/ projeto`, expectedResult: `Contratação de Engenheiro civil para elaboração de projeto de construção da agroindústria.`, activities: [
        { id: 10001021, name: `Contratação de Engenheiro civil para elaboração de projeto de construção da agroindústria.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000103, name: `1.3. Obter Licença Prévia`, expectedResult: `Solicitação para obter licença junto a SEMMA municipal.`, activities: [
        { id: 10001031, name: `Solicitação para obter licença junto a SEMMA municipal.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000104, name: `1.4. Obter Licença de Instalação`, expectedResult: `Solicitação para obter licença junto a SEMMA municipal.`, activities: [
        { id: 10001041, name: `Solicitação para obter licença junto a SEMMA municipal.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000105, name: `1.5. Realizar construção de poço`, expectedResult: `Fazer Contratação de uma equipe especializada em perfuração de poço artesiano.`, activities: [
        { id: 10001051, name: `Fazer Contratação de uma equipe especializada em perfuração de poço artesiano.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000106, name: `1.5. Realizar compra de material de construção / cimento`, expectedResult: `Fazer cotação de preço e realizar a compra`, activities: [
        { id: 10001061, name: `Fazer cotação de preço e realizar a compra`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000107, name: `1.6. Realizar compra de material de construção / vegalhão diversos`, expectedResult: `Fazer cotação de preço e realizar a compra de vergalhão 3/8, vergalhão 4.2 e arame recozinho.`, activities: [
        { id: 10001071, name: `Fazer cotação de preço e realizar a compra de vergalhão 3/8, vergalhão 4.2 e arame recozinho.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000108, name: `1.7. Realizar compra de material de construção / Tijolo`, expectedResult: `Fazer cotação de preço e realizar a compra de tijolo`, activities: [
        { id: 10001081, name: `Fazer cotação de preço e realizar a compra de tijolo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000109, name: `1.8. Realizar compra de material de construção / Seixo`, expectedResult: `Fazer cotação de preço e realizar a compra de seixo`, activities: [
        { id: 10001091, name: `Fazer cotação de preço e realizar a compra de seixo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000110, name: `1.9. Fazer instação de piso curundum`, expectedResult: `Contratação de uma equipe especializada na instaçao de piso curudum`, activities: [
        { id: 10001101, name: `Contratação de uma equipe especializada na instaçao de piso curudum`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000111, name: `1.10. Contratar mão de obra pedreiro (50%)`, expectedResult: `Contratação de uma equipe de pedreiros e ajudantes, para realizar a construção da infraestrutura. (fundação,piso, parede, reboco, telhado e forro)`, activities: [
        { id: 10001111, name: `Contratação de uma equipe de pedreiros e ajudantes, para realizar a construção da infraestrutura. (fundação,piso, parede, reboco, telhado e forro)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000112, name: `"1.11. Contratar um eletrecista"`, expectedResult: `Realizar contratação de um eletrecista para fazer a instalação elétrica.`, activities: [
        { id: 10001121, name: `Realizar contratação de um eletrecista para fazer a instalação elétrica.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000113, name: `1.12. Realizar compra de materiais elétricos`, expectedResult: `Fazer cotação de preço e realizar a compra dos materias eletricos nescessários (fio, cabo, tomadas, lâmpadas, dijuntores, conduítes, refletores, interruptor, dijuntores, quadro de distribuição, luzes de emergências, isoladores, etc.)`, activities: [
        { id: 10001131, name: `Fazer cotação de preço e realizar a compra dos materias eletricos nescessários (fio, cabo, tomadas, lâmpadas, dijuntores, conduítes, refletores, interruptor, dijuntores, quadro de distribuição, luzes de emergências, isoladores, etc.)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000114, name: `1.13. Contratar um encanador`, expectedResult: `Realizar contratação de um encanador para fazer a instalação hidráulica.`, activities: [
        { id: 10001141, name: `Realizar contratação de um encanador para fazer a instalação hidráulica.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000115, name: `1.14. Realizar compra de materiais Hidráulicos`, expectedResult: `Fazer cotação de preço e realizar a compra dos materias hidráulicos nescessários (Bomba submersa, caixa d’água, tubos, conexões, pia, torneiras, chuveiro, ralo, registros, vaso sanitário, cola, veda rosca, etc.)`, activities: [
        { id: 10001151, name: `Fazer cotação de preço e realizar a compra dos materias hidráulicos nescessários (Bomba submersa, caixa d’água, tubos, conexões, pia, torneiras, chuveiro, ralo, registros, vaso sanitário, cola, veda rosca, etc.)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000116, name: `1.15. Contratar serviço metalúrgicos`, expectedResult: `Realizar contratação de um metalúrgico para confeccionar e instalar portão, portas e balancinhos.`, activities: [
        { id: 10001161, name: `Realizar contratação de um metalúrgico para confeccionar e instalar portão, portas e balancinhos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000117, name: `1.16. Comprar telha de alunimio`, expectedResult: `Fazer cotação de preço e realizar a compra de telha de alimínio.`, activities: [
        { id: 10001171, name: `Fazer cotação de preço e realizar a compra de telha de alimínio.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000118, name: `1.17. Comprar forro PVC`, expectedResult: `Fazer cotação de preço e realizar a compra de forro PVC`, activities: [
        { id: 10001181, name: `Fazer cotação de preço e realizar a compra de forro PVC`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000119, name: `1.18. Comprar material de pintura`, expectedResult: `Fazer cotação de preço e realizar a compra material de pintura (tinta, pincel, rolo, bandeija, massa, luva, oculos, mascara, )`, activities: [
        { id: 10001191, name: `Fazer cotação de preço e realizar a compra material de pintura (tinta, pincel, rolo, bandeija, massa, luva, oculos, mascara, )`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000120, name: `1.19. Comprar combustível para deslocamento`, expectedResult: `Fazer cotação de preço e realizar a compra de combustivel, (óleo disel e gasolina)`, activities: [
        { id: 10001201, name: `Fazer cotação de preço e realizar a compra de combustivel, (óleo disel e gasolina)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000121, name: `1.20. Realizar a Pintura do prédio`, expectedResult: `realizar contratação de profissional para pintar todo o prédio (interior e exterior)`, activities: [
        { id: 10001211, name: `realizar contratação de profissional para pintar todo o prédio (interior e exterior)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10002, name: `2. Aquisição de máquinas e equipamentos.`, deliverables: [
      { id: 1000201, name: `2.1. Aquisição de mesa Classificadora`, expectedResult: `Fazer cotação de preço e realizar a compra de mesa classificadora`, activities: [
        { id: 10002011, name: `Fazer cotação de preço e realizar a compra de mesa classificadora`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000202, name: `2.2. Aquisição de Tanque de Higienização`, expectedResult: `Fazer cotação de preço e realizar a compra de Tanque de Higienização`, activities: [
        { id: 10002021, name: `Fazer cotação de preço e realizar a compra de Tanque de Higienização`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000203, name: `2.3. Aquisição de Branqueador Digital`, expectedResult: `Fazer cotação de preço e realizar a compra de Branqueador digital`, activities: [
        { id: 10002031, name: `Fazer cotação de preço e realizar a compra de Branqueador digital`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000204, name: `2.4. Aquisição de Filtro com purificador de água industrial`, expectedResult: `Fazer cotação de preço e realizar a compra de filtro com purificador de água industrial`, activities: [
        { id: 10002041, name: `Fazer cotação de preço e realizar a compra de filtro com purificador de água industrial`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000205, name: `2.5. Aquisição de Despolpadeira Industrial (3 latas por vez)`, expectedResult: `Fazer cotação de preço e realizar a compra de despolpadeira industrial`, activities: [
        { id: 10002051, name: `Fazer cotação de preço e realizar a compra de despolpadeira industrial`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000206, name: `2.6. Aquisição de Envasadora Pneumática`, expectedResult: `Fazer cotação de preço e realizar a compra de Envasadora Pneumática`, activities: [
        { id: 10002061, name: `Fazer cotação de preço e realizar a compra de Envasadora Pneumática`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000207, name: `2.7. Aquisição de Seladora Selamulta Pedal - Barra Quente`, expectedResult: `Fazer cotação de preço e realizar a compra de Seladora selamulta pedal – Barra quente.`, activities: [
        { id: 10002071, name: `Fazer cotação de preço e realizar a compra de Seladora selamulta pedal – Barra quente.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10003, name: `3. Qualificação`, deliverables: [
      { id: 1000301, name: `3.1. Realizar capacitação: ferramentas digitais aplicadas à gestão, produção, comercialização e comunicação.`, expectedResult: `Realizar contratação de profissional habilitado para capacitar os cooperados em ferramentas digitais aplicadas à gestão, produção, comercialização e comunicação.`, activities: [
        { id: 10003011, name: `Realizar contratação de profissional habilitado para capacitar os cooperados em ferramentas digitais aplicadas à gestão, produção, comercialização e comunicação.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000302, name: `3.2. Realizar capacitação: boas práticas de colheita`, expectedResult: `Realizar contratação de profissional habilitado para capacitar os cooperados em boas práticas de colheita de frutos da flloresta`, activities: [
        { id: 10003021, name: `Realizar contratação de profissional habilitado para capacitar os cooperados em boas práticas de colheita de frutos da flloresta`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000303, name: `3.3. Realizar capacitação: manipulação e processamento de alimentos`, expectedResult: `Realizar contratação de profissional habilitado para capacitar os cooperados em manipulação e processamento de alimentos.`, activities: [
        { id: 10003031, name: `Realizar contratação de profissional habilitado para capacitar os cooperados em manipulação e processamento de alimentos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10004, name: `4. Registro`, deliverables: [
      { id: 1000401, name: `4.1.Obter Licença de Operação`, expectedResult: `Solicitação para obter a licença junto a SEMMA municipal`, activities: [
        { id: 10004011, name: `Solicitação para obter a licença junto a SEMMA municipal`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1000402, name: `4.2. Obter registro do estabelecimento e dos produtos no MAPA`, expectedResult: `Solicitação para obter registro junto a ADEPARÁ e MAPA.`, activities: [
        { id: 10004021, name: `Solicitação para obter registro junto a ADEPARÁ e MAPA.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 10005, name: `5. Presatção de Contas`, deliverables: [
      { id: 1000501, name: `5.1. Realizar Prestação de Contas`, expectedResult: `Juntar todos os documentos, notas fiscais, recibos, lista de presença, comprovantes, registros fotográficos, infraestrutura conclúida, máquinas e equipamentos adquiridos em operação, apresentação das polpas produzidas contendo selo e marca própria do produto registrado.`, activities: [
        { id: 10005011, name: `Juntar todos os documentos, notas fiscais, recibos, lista de presença, comprovantes, registros fotográficos, infraestrutura conclúida, máquinas e equipamentos adquiridos em operação, apresentação das polpas produzidas contendo selo e marca própria do produto registrado.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  11: [
    { id: 11001, name: `1. Meta 1 — Implantar casa comunitária de produtos da agricultura familiar`, deliverables: [
      { id: 1100101, name: `1.1 Projeto arquitetônico junto com a comunidade (jan/26)`, expectedResult: `Convocação da comunidade para participar da assembleia geral tendo como pauta a divulgação do projeto. Indicador físico: 01 assembleia. Duração: janeiro/2026. Fonte de verificação: edital de convocação, registros de atas e assinaturas dos presentes.`, activities: [
        { id: 11001011, name: `Convocação da comunidade para participar da assembleia geral tendo como pauta a divulgação do projeto. Indicador físico: 01 assembleia. Duração: janeiro/2026. Fonte de verificação: edital de convocação, registros de atas e assinaturas dos presentes.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1100102, name: `1.2 Contratação de empresa para a construção (fev/26)`, expectedResult: `Contratação de empresa para a construção do espaço. Especificação registrada no plano: "Período 01 mês". Indicador físico: 01. Duração: fevereiro/2026. Fonte de verificação: relatórios mensais e fotos.`, activities: [
        { id: 11001021, name: `Contratação de empresa para a construção do espaço. Especificação registrada no plano: "Período 01 mês". Indicador físico: 01. Duração: fevereiro/2026. Fonte de verificação: relatórios mensais e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1100103, name: `1.3 Construção civil por serviços de pessoa física (mar a out/26)`, expectedResult: `Implantação do projeto físico: construção civil por meio de serviços prestados à pessoa física (arquitetos, pedreiros, ajudantes, carpinteiros e demais profissionais da área). Especificação: "Período de 07 meses". Duração: março a outubro/2026. Fonte de verificação: relatórios mensais e fotos.`, activities: [
        { id: 11001031, name: `Implantação do projeto físico: construção civil por meio de serviços prestados à pessoa física (arquitetos, pedreiros, ajudantes, carpinteiros e demais profissionais da área). Especificação: "Período de 07 meses". Duração: março a outubro/2026. Fonte de verificação: relatórios mensais e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 11002, name: `2. Meta 2 — Aquisição dos equipamentos`, deliverables: [
      { id: 1100201, name: `2.1 Equipamentos de qualidade de água, energia e despolpamento (jul a set)`, expectedResult: `Aquisição de equipamentos para garantir a qualidade da água e da energia e de equipamentos artesanais de despolpamento e armazenamento de frutas. Indicador físico: 01; quantidade registrada como "A definir". Duração: julho a setembro/2026. Fonte de verificação: relatórios mensais e fotos.`, activities: [
        { id: 11002011, name: `Aquisição de equipamentos para garantir a qualidade da água e da energia e de equipamentos artesanais de despolpamento e armazenamento de frutas. Indicador físico: 01; quantidade registrada como "A definir". Duração: julho a setembro/2026. Fonte de verificação: relatórios mensais e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1100202, name: `2.2 Compra de equipamentos (jan a out/26)`, expectedResult: `Compra de equipamentos ao longo da execução. Duração: janeiro a outubro/2026. Fonte de verificação: notas fiscais e fotos. Especificação, unidade de medida e quantidade não preenchidas no plano.`, activities: [
        { id: 11002021, name: `Compra de equipamentos ao longo da execução. Duração: janeiro a outubro/2026. Fonte de verificação: notas fiscais e fotos. Especificação, unidade de medida e quantidade não preenchidas no plano.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 11003, name: `3. Meta 3 — Formações e qualificações`, deliverables: [
      { id: 1100301, name: `3.1 Convocação da comunidade para assembleia geral (jan a out/26)`, expectedResult: `Convocação da comunidade para reunião em assembleia geral, contemplando pelo menos 50% da comunidade, tendo como público prioritário as mulheres e a juventude indígena. Unidade de medida e quantidade registradas como "A definir". Duração: janeiro a outubro/2026.`, activities: [
        { id: 11003011, name: `Convocação da comunidade para reunião em assembleia geral, contemplando pelo menos 50% da comunidade, tendo como público prioritário as mulheres e a juventude indígena. Unidade de medida e quantidade registradas como "A definir". Duração: janeiro a outubro/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1100302, name: `3.2 Contratação de profissionais para as palestras (fev a out/26)`, expectedResult: `Contratação de profissionais para ministrar as palestras, contemplando pelo menos 50% de cada público-alvo. Unidade de medida e quantidade registradas como "A definir". Duração: fevereiro a outubro/2026. Fonte de verificação: relatórios mensais e fotos.`, activities: [
        { id: 11003021, name: `Contratação de profissionais para ministrar as palestras, contemplando pelo menos 50% de cada público-alvo. Unidade de medida e quantidade registradas como "A definir". Duração: fevereiro a outubro/2026. Fonte de verificação: relatórios mensais e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1100303, name: `3.3 Criação de banner para divulgação`, expectedResult: `Criação de banner para divulgação das ações desenvolvidas por meio da contemplação do recurso, com meta de contemplar 50% de cada público-alvo. Unidade de medida e quantidade registradas como "A definir". Duração: fevereiro a outubro/2026.`, activities: [
        { id: 11003031, name: `Criação de banner para divulgação das ações desenvolvidas por meio da contemplação do recurso, com meta de contemplar 50% de cada público-alvo. Unidade de medida e quantidade registradas como "A definir". Duração: fevereiro a outubro/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 11004, name: `4. Meta 4 — Palestras temáticas e oficinas presenciais`, deliverables: [
      { id: 1100401, name: `4.1 Comunidade em geral (mar a out/26)`, expectedResult: `Realização de palestras temáticas e oficinas presenciais para a comunidade em geral, contemplando 50% de cada público-alvo. Unidade de medida e quantidade registradas como "A definir". Duração: março a outubro/2026. Fonte de verificação: relatórios mensais e fotos.`, activities: [
        { id: 11004011, name: `Realização de palestras temáticas e oficinas presenciais para a comunidade em geral, contemplando 50% de cada público-alvo. Unidade de medida e quantidade registradas como "A definir". Duração: março a outubro/2026. Fonte de verificação: relatórios mensais e fotos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  12: [
    { id: 12001, name: `1. Finalizar a construção da Casa de mel`, deliverables: [
      { id: 1200101, name: `1.1. Cotação de preços de materiais da construção e dos maquinários da Casa de Mel.`, expectedResult: `Fazer o levantamento de orçamento com pelo menos 3 fornecedores, fisicamente e por telefone.`, activities: [
        { id: 12001011, name: `Fazer o levantamento de orçamento com pelo menos 3 fornecedores, fisicamente e por telefone.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200102, name: `1.2. Realizar a aquisição dos maquinários necessários.`, expectedResult: `Compra de 6 máquinas um mês após o recebimento do investimento.`, activities: [
        { id: 12001021, name: `Compra de 6 máquinas um mês após o recebimento do investimento.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200103, name: `1.3. Adquirir as certificações da ADEPARÁ.`, expectedResult: `Contratar 1 veterinário para realizar a verificação do local e obter a certificação.`, activities: [
        { id: 12001031, name: `Contratar 1 veterinário para realizar a verificação do local e obter a certificação.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 12002, name: `2. Construir a casa da despolpadora de frutas.`, deliverables: [
      { id: 1200201, name: `2.1. Cotação de preços de materiais da construção da casa de despolpadeira de frutas.`, expectedResult: `Fazer o levantamento de orçamento com pelo menos 3 fornecedores, fisicamente e por telefone.`, activities: [
        { id: 12002011, name: `Fazer o levantamento de orçamento com pelo menos 3 fornecedores, fisicamente e por telefone.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200202, name: `2.2. Levantamento do orçamento dos equipamentos junto das fábricas para verificar prazos de pagamento e entrega, além do valor do frete.`, expectedResult: `Fazer cotação com pelo menos 2 fábricas por telefone ou via chamada de vídeo.`, activities: [
        { id: 12002021, name: `Fazer cotação com pelo menos 2 fábricas por telefone ou via chamada de vídeo.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200203, name: `2.3. Realizar a aquisição dos maquinários necessários.`, expectedResult: `Compra de 7 máquinas um mês após o recebimento do investimento.`, activities: [
        { id: 12002031, name: `Compra de 7 máquinas um mês após o recebimento do investimento.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200204, name: `2.4. Adquirir as certificações da ADEPARÁ.`, expectedResult: `Contratar 1 técnico agrônomo para realizar a verificação do local para obter a certificação..`, activities: [
        { id: 12002041, name: `Contratar 1 técnico agrônomo para realizar a verificação do local para obter a certificação..`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200205, name: `2.5. Capacitação de cooperados para manipular alimentos.`, expectedResult: `Contratar técnico para treinamento de 3 dias de pelo menos 6 cooperados.`, activities: [
        { id: 12002051, name: `Contratar técnico para treinamento de 3 dias de pelo menos 6 cooperados.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 12003, name: `3. Capacitar os colaboradores em gestão administrativa`, deliverables: [
      { id: 1200301, name: `3.1. Contratar os profissionais para as oficinas em gestão administrativa`, expectedResult: `Fazer cotação e fechar a contratação de 1 profissional para realizar oficinas de pelo menos 16 horas com 25 participantes.`, activities: [
        { id: 12003011, name: `Fazer cotação e fechar a contratação de 1 profissional para realizar oficinas de pelo menos 16 horas com 25 participantes.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200302, name: `3.2.Realizar as oficinas de gestão administrativas.`, expectedResult: `Realizar 1 oficina de 16 horas com 25 participantes.`, activities: [
        { id: 12003021, name: `Realizar 1 oficina de 16 horas com 25 participantes.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 12004, name: `4. Implementar novas estratégias de mercado e canais de venda.`, deliverables: [
      { id: 1200401, name: `4.1. Visitar redes de supermercado.`, expectedResult: `Realizar visitas em 10 supermercados na região de salinas e 5 na região de Pirabas.`, activities: [
        { id: 12004011, name: `Realizar visitas em 10 supermercados na região de salinas e 5 na região de Pirabas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200402, name: `4.2. Participar de feiras`, expectedResult: `Participar de 2 feiras regionais em 12 meses`, activities: [
        { id: 12004021, name: `Participar de 2 feiras regionais em 12 meses`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1200403, name: `4.3. Se inscrever em programas institucionais`, expectedResult: `Inscrever a comunidade no PAA – Programa de Aquisição de Alimentos e no PNAE – Programa Nacional de Alimentação Escolar`, activities: [
        { id: 12004031, name: `Inscrever a comunidade no PAA – Programa de Aquisição de Alimentos e no PNAE – Programa Nacional de Alimentação Escolar`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  13: [
    { id: 13001, name: `1. Meta: Mobilização e Diagnóstico Participativo`, deliverables: [
      { id: 1300101, name: `1.1.Mapeamento de áreas de coleta das espécies potenciais (Murumuru, Buriti e tucumã.).`, expectedResult: `Realização do mapeamento e diagnóstico das áreas, rastreando as espécies e potencial produtivo, com auxílio de profissional florestal e agronômico, no período 1 mês em parceria com a comunidade, consolidando com um mapa/rota de coleta e possível recuperação de espécies`, activities: [
        { id: 13001011, name: `Realização do mapeamento e diagnóstico das áreas, rastreando as espécies e potencial produtivo, com auxílio de profissional florestal e agronômico, no período 1 mês em parceria com a comunidade, consolidando com um mapa/rota de coleta e possível recuperação de espécies`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300102, name: `1.2.Cadastramento das mulheres interessadas e dos territórios de coleta`, expectedResult: `Realização de 2 reuniões de Cadastramento das mulheres/famílias envolvidas no projeto, pela equipe técnica do projeto, nas comunidades Quilombo CantaGalo e Foz do Urucuri`, activities: [
        { id: 13001021, name: `Realização de 2 reuniões de Cadastramento das mulheres/famílias envolvidas no projeto, pela equipe técnica do projeto, nas comunidades Quilombo CantaGalo e Foz do Urucuri`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300103, name: `1.3.Planos comunitários de manejo sustentável das espécies nativas.`, expectedResult: `Realização de 1 plano de manejo comunitário de manejo sustentável das comunidades envolvidas pela equipe técnico do projeto (florestal e agrônomo)`, activities: [
        { id: 13001031, name: `Realização de 1 plano de manejo comunitário de manejo sustentável das comunidades envolvidas pela equipe técnico do projeto (florestal e agrônomo)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 13002, name: `2. Meta: Capacitação e Formação`, deliverables: [
      { id: 1300201, name: `2.1. Oficina sobre boas práticas de coleta, secagem e armazenamento de sementes.`, expectedResult: `Realização de 1 oficina de boas práticas de coleta, secagem e armazenamento de sementes, pela equipe técnica do projeto (engenheiro florestal e agrônomo) para as mulheres da comunidade da Foz do Urucuri`, activities: [
        { id: 13002011, name: `Realização de 1 oficina de boas práticas de coleta, secagem e armazenamento de sementes, pela equipe técnica do projeto (engenheiro florestal e agrônomo) para as mulheres da comunidade da Foz do Urucuri`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300202, name: `2.2. Treinamento em técnicas de extração e beneficiamento artesanal de óleo do buriti.`, expectedResult: `Realização de 2 treinamentos de extração artesanal de óleo do buriti para as mulheres nas comunidade Quilombo cantaGalo e Foz do Urucuri, pela a equipe técnica do projeto`, activities: [
        { id: 13002021, name: `Realização de 2 treinamentos de extração artesanal de óleo do buriti para as mulheres nas comunidade Quilombo cantaGalo e Foz do Urucuri, pela a equipe técnica do projeto`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300203, name: `Formação em gestão, associativismo, cooperativismo e comercialização.`, expectedResult: `Realização de 1 formação para as mulheres sobre cooperativismo, associativismo e comercialização pela equipe técnica da Coopasmig`, activities: [
        { id: 13002031, name: `Realização de 1 formação para as mulheres sobre cooperativismo, associativismo e comercialização pela equipe técnica da Coopasmig`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 13003, name: `3. Implantação da Estrutura Produtiva`, deliverables: [
      { id: 1300301, name: `3.1. Aquisição de maquinários: despolpadeira, decantador, utensílios em geral.`, expectedResult: `Realização de compra de máquinas e utilitários para o beneficiamento artesanal do buriti para extração de óleo, pela coordenação e gestão do projeto`, activities: [
        { id: 13003011, name: `Realização de compra de máquinas e utilitários para o beneficiamento artesanal do buriti para extração de óleo, pela coordenação e gestão do projeto`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300302, name: `3.2. Construção unidade de secagem de sementes (estufa)`, expectedResult: `Construção de unidades de estufa para secagem de sementes de murumuru, com a contrapartida da comunidade no apoio de mão de obra`, activities: [
        { id: 13003021, name: `Construção de unidades de estufa para secagem de sementes de murumuru, com a contrapartida da comunidade no apoio de mão de obra`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300303, name: `3.3. Criação de área de produção do óleo vegetal e vitrine dos produtos.`, expectedResult: `Construção de espaço de beneficiamento artesanal do buriti e vitrine rústica dos produtos`, activities: [
        { id: 13003031, name: `Construção de espaço de beneficiamento artesanal do buriti e vitrine rústica dos produtos`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300304, name: `3.4 Aquisição de 3 motores para embarcação (tipo rabeta) para coleta e escoamento da produção.`, expectedResult: `Aquisição de motores de embarcação tipo rabeta, para uso na coleta e escoamento da produção, para uso das mulheres do projeto, administrado pela equipe técnica do projeto durante os 12 meses do projeto`, activities: [
        { id: 13003041, name: `Aquisição de motores de embarcação tipo rabeta, para uso na coleta e escoamento da produção, para uso das mulheres do projeto, administrado pela equipe técnica do projeto durante os 12 meses do projeto`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300305, name: `3.5 Desenvolvimento de identidade visual e embalagens.`, expectedResult: `Criação de embalagens com a identidade do produto da biodiversidade e das mulheres quilombolas`, activities: [
        { id: 13003051, name: `Criação de embalagens com a identidade do produto da biodiversidade e das mulheres quilombolas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1300306, name: `3.6 Estabelecer parcerias com mercados consumidores sustentáveis (cosméticos, fitoterápicos, alimentos).`, expectedResult: `Realização de articulação com redes de mercados e consumidores para a comercialização dos produtos em parceria com instituições parceiras da Coopasmig como: SEBRAE e outras`, activities: [
        { id: 13003061, name: `Realização de articulação com redes de mercados e consumidores para a comercialização dos produtos em parceria com instituições parceiras da Coopasmig como: SEBRAE e outras`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 13004, name: `4. Estruturar unidade administrativa de gestão e divulgação do projeto`, deliverables: [
      { id: 1300401, name: `4.1 Estrutura de um espaço físico administrativo para apoio da equipe técnica do projeto`, expectedResult: `Custos com operacionalização da gestão do projeto Comunicação e divulgação`, activities: [
        { id: 13004011, name: `Custos com operacionalização da gestão do projeto Comunicação e divulgação`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  14: [
    { id: 14001, name: `1. Meta 1 — Capacitar 50 artesãos em produção, gestão e comercialização`, deliverables: [
      { id: 1400101, name: `1.1 Levantamento de necessidades e planejamento (dez/25)`, expectedResult: `Contratar 2 consultores especializados em artesanato indígena e gestão de pequenos negócios, realizar reunião com os artesãos para identificar as demandas de capacitação e elaborar o plano de capacitação com conteúdo programático, metodologia e cronograma. Indicadores: 02 consultores contratados e 01 plano elaborado. Duração: dez/2025.`, activities: [
        { id: 14001011, name: `Contratar 2 consultores especializados em artesanato indígena e gestão de pequenos negócios, realizar reunião com os artesãos para identificar as demandas de capacitação e elaborar o plano de capacitação com conteúdo programático, metodologia e cronograma. Indicadores: 02 consultores contratados e 01 plano elaborado. Duração: dez/2025.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400102, name: `1.2 Três oficinas de aprimoramento técnico (jan a mar/26)`, expectedResult: `Conduzir 3 oficinas de aprimoramento técnico, de 40 horas cada, sobre técnicas avançadas de produção artesanal, design e inovação de produtos, com cerca de 17 artesãos por turma, totalizando 50 participantes. Indicadores: 03 oficinas e 50 artesãos capacitados. Fonte de verificação: listas de presença, certificados, relatórios fotográficos e portfólio de produtos.`, activities: [
        { id: 14001021, name: `Conduzir 3 oficinas de aprimoramento técnico, de 40 horas cada, sobre técnicas avançadas de produção artesanal, design e inovação de produtos, com cerca de 17 artesãos por turma, totalizando 50 participantes. Indicadores: 03 oficinas e 50 artesãos capacitados. Fonte de verificação: listas de presença, certificados, relatórios fotográficos e portfólio de produtos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400103, name: `1.3 Quatro oficinas de gestão e comercialização (mar a jun/26)`, expectedResult: `Conduzir 4 oficinas de gestão e comercialização, de 40 horas cada, abordando precificação justa, controle financeiro, marketing digital, fotografia de produtos, atendimento ao cliente e logística de vendas, adaptadas à realidade cultural e socioeconômica Kayapó. Indicadores: 04 oficinas e 50 artesãos capacitados. Duração: mar a jun/2026.`, activities: [
        { id: 14001031, name: `Conduzir 4 oficinas de gestão e comercialização, de 40 horas cada, abordando precificação justa, controle financeiro, marketing digital, fotografia de produtos, atendimento ao cliente e logística de vendas, adaptadas à realidade cultural e socioeconômica Kayapó. Indicadores: 04 oficinas e 50 artesãos capacitados. Duração: mar a jun/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 14002, name: `2. Meta 2 — Construir espaço coletivo de produção artesanal em Gorotire`, deliverables: [
      { id: 1400201, name: `2.1 Planejamento e projeto arquitetônico (nov a dez/25)`, expectedResult: `Realizar reunião com a comunidade para definir necessidades e características do espaço coletivo; contratar arquiteto ou engenheiro para elaborar o projeto arquitetônico, considerando materiais locais, sustentabilidade e funcionalidade; e obter as aprovações necessárias. Indicadores: 01 profissional contratado e 01 projeto elaborado. Duração: nov a dez/2025.`, activities: [
        { id: 14002011, name: `Realizar reunião com a comunidade para definir necessidades e características do espaço coletivo; contratar arquiteto ou engenheiro para elaborar o projeto arquitetônico, considerando materiais locais, sustentabilidade e funcionalidade; e obter as aprovações necessárias. Indicadores: 01 profissional contratado e 01 projeto elaborado. Duração: nov a dez/2025.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400202, name: `2.2 Aquisição de materiais e definição de mão de obra (jan a fev/26)`, expectedResult: `Realizar a compra dos materiais de construção, priorizando fornecedores locais e materiais sustentáveis, e definir mão de obra local com membros da comunidade Kayapó. Indicadores: materiais adquiridos (quantidade registrada como "Não definido") e seleção de 10 pessoas para a mão de obra. Duração: jan a fev/2026.`, activities: [
        { id: 14002021, name: `Realizar a compra dos materiais de construção, priorizando fornecedores locais e materiais sustentáveis, e definir mão de obra local com membros da comunidade Kayapó. Indicadores: materiais adquiridos (quantidade registrada como "Não definido") e seleção de 10 pessoas para a mão de obra. Duração: jan a fev/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400203, name: `2.3 Construção e equipagem do espaço (mar a jul/26)`, expectedResult: `Executar a construção do espaço coletivo seguindo o projeto arquitetônico, adquirir e instalar equipamentos básicos para as atividades artesanais (bancadas, ferramentas, máquinas de costura, prateleiras) e realizar a inauguração com a participação da comunidade. Indicador: 01 espaço construído e equipado. Duração: mar a jul/2026.`, activities: [
        { id: 14002031, name: `Executar a construção do espaço coletivo seguindo o projeto arquitetônico, adquirir e instalar equipamentos básicos para as atividades artesanais (bancadas, ferramentas, máquinas de costura, prateleiras) e realizar a inauguração com a participação da comunidade. Indicador: 01 espaço construído e equipado. Duração: mar a jul/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 14003, name: `3. Meta 3 — Criar marca e desenvolver catálogo físico e digital`, deliverables: [
      { id: 1400301, name: `3.1 Aquisição de 1 câmera profissional para registros`, expectedResult: `Contratar designer para criar a identidade visual da marca, realizar o registro legal junto aos órgãos competentes, desenvolver critérios e manual de uso da marca e produzir materiais gráficos para embalagem dos produtos. Indicadores: 01 profissional contratado, 01 marca criada e registrada, 01 manual de uso elaborado e materiais gráficos produzidos. Duração: jan a mar/2026.`, activities: [
        { id: 14003011, name: `Contratar designer para criar a identidade visual da marca, realizar o registro legal junto aos órgãos competentes, desenvolver critérios e manual de uso da marca e produzir materiais gráficos para embalagem dos produtos. Indicadores: 01 profissional contratado, 01 marca criada e registrada, 01 manual de uso elaborado e materiais gráficos produzidos. Duração: jan a mar/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400302, name: `3.2 Desenvolvimento do catálogo físico e digital (abr a set/26)`, expectedResult: `Contratar equipe especializada para desenvolver catálogo físico e digital dos produtos e realizar a fotografia profissional das peças artesanais para inclusão no catálogo. Indicadores: 01 profissional contratado, 01 catálogo desenvolvido e lançado e 100% dos produtos fotografados. Duração: abr a set/2026.`, activities: [
        { id: 14003021, name: `Contratar equipe especializada para desenvolver catálogo físico e digital dos produtos e realizar a fotografia profissional das peças artesanais para inclusão no catálogo. Indicadores: 01 profissional contratado, 01 catálogo desenvolvido e lançado e 100% dos produtos fotografados. Duração: abr a set/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 14004, name: `4. Meta 4 — Aumentar em 40% a produção e a comercialização`, deliverables: [
      { id: 1400401, name: `4.1 Estratégias de comercialização, 5 feiras (mar a out/26)`, expectedResult: `Participar de feiras de artesanato regionais e nacionais utilizando o catálogo e a marca como diferenciais, estabelecer parcerias com lojas de artesanato, galerias e plataformas de e-commerce e desenvolver material de divulgação. Indicadores: 05 participações em feiras, 04 parcerias comerciais e 01 material de divulgação produzido. Duração: mar a out/2026.`, activities: [
        { id: 14004011, name: `Participar de feiras de artesanato regionais e nacionais utilizando o catálogo e a marca como diferenciais, estabelecer parcerias com lojas de artesanato, galerias e plataformas de e-commerce e desenvolver material de divulgação. Indicadores: 05 participações em feiras, 04 parcerias comerciais e 01 material de divulgação produzido. Duração: mar a out/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400402, name: `4.2 Monitoramento da produção e vendas (dez/25 a out/26)`, expectedResult: `Implantar sistema de registro e acompanhamento da produção e das vendas dos artesãos, realizar reuniões mensais para analisar resultados e ajustar estratégias e elaborar relatórios trimestrais de progresso. Indicadores: 01 sistema implantado, 12 reuniões de acompanhamento e 04 relatórios elaborados. Duração: dez/2025 a out/2026.`, activities: [
        { id: 14004021, name: `Implantar sistema de registro e acompanhamento da produção e das vendas dos artesãos, realizar reuniões mensais para analisar resultados e ajustar estratégias e elaborar relatórios trimestrais de progresso. Indicadores: 01 sistema implantado, 12 reuniões de acompanhamento e 04 relatórios elaborados. Duração: dez/2025 a out/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 14005, name: `5. Meta 5 — Manejo sustentável e identidade cultural`, deliverables: [
      { id: 1400501, name: `5.1 Duas oficinas de manejo com anciãos (jan a fev/26)`, expectedResult: `Realizar 2 oficinas sobre técnicas de coleta e manejo sustentável de matérias-primas da floresta (fibras, sementes e madeiras), conduzidas por anciãos e especialistas locais, garantindo a preservação dos recursos e a continuidade das práticas artesanais. Indicadores: 02 oficinas realizadas e 50 artesãos participantes. Duração: jan a fev/2026.`, activities: [
        { id: 14005011, name: `Realizar 2 oficinas sobre técnicas de coleta e manejo sustentável de matérias-primas da floresta (fibras, sementes e madeiras), conduzidas por anciãos e especialistas locais, garantindo a preservação dos recursos e a continuidade das práticas artesanais. Indicadores: 02 oficinas realizadas e 50 artesãos participantes. Duração: jan a fev/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400502, name: `5.2 Evento de valorização cultural (out/26)`, expectedResult: `Organizar evento cultural na aldeia Gorotire para celebrar e divulgar o artesanato Kayapó, com exposições, demonstrações de técnicas artesanais, apresentações culturais e rodas de conversa, reunindo artesãos, comunidade e visitantes. Indicador: 01 evento realizado. Duração: out/2026.`, activities: [
        { id: 14005021, name: `Organizar evento cultural na aldeia Gorotire para celebrar e divulgar o artesanato Kayapó, com exposições, demonstrações de técnicas artesanais, apresentações culturais e rodas de conversa, reunindo artesãos, comunidade e visitantes. Indicador: 01 evento realizado. Duração: out/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 14006, name: `6. Meta 6 — Fortalecer gestão, comunicação e transparência`, deliverables: [
      { id: 1400601, name: `6.1 Formação da equipe técnica e administrativa (dez/25)`, expectedResult: `Realizar reunião comunitária para definição dos papéis e responsabilidades das equipes de coordenação, logística, monitoramento e prestação de contas e estabelecer rotinas de acompanhamento e controle interno. Indicador: 01 equipe constituída. Duração: dez/2025. Fonte de verificação: atas de reunião, contratos de trabalho e registros internos.`, activities: [
        { id: 14006011, name: `Realizar reunião comunitária para definição dos papéis e responsabilidades das equipes de coordenação, logística, monitoramento e prestação de contas e estabelecer rotinas de acompanhamento e controle interno. Indicador: 01 equipe constituída. Duração: dez/2025. Fonte de verificação: atas de reunião, contratos de trabalho e registros internos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1400602, name: `6.2 Comunicação comunitária e prestação de contas`, expectedResult: `Produzir e divulgar boletins informativos bimestrais, murais comunitários e áudios em língua Kayapó sobre o andamento do projeto e realizar assembleias comunitárias de apresentação dos resultados parciais e finais. Indicadores: 02 boletins divulgados e 02 assembleias realizadas. Duração: dez/2025 a out/2026.`, activities: [
        { id: 14006021, name: `Produzir e divulgar boletins informativos bimestrais, murais comunitários e áudios em língua Kayapó sobre o andamento do projeto e realizar assembleias comunitárias de apresentação dos resultados parciais e finais. Indicadores: 02 boletins divulgados e 02 assembleias realizadas. Duração: dez/2025 a out/2026.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  15: [
    { id: 15001, name: `1. Reunião geral com o público alvo do projeto`, deliverables: [
      { id: 1500101, name: `1.1. Apresentação do projeto aprovado e seleção das famílias para cada ação proposta`, expectedResult: `Mobilizar através de convites e redes de whatsapp, com estimativa de 30 pessoas, em aproximadamente 6 horas de trabalho. Será coordenada pela equipe gestora da cooperativa e do projeto.`, activities: [
        { id: 15001011, name: `Mobilizar através de convites e redes de whatsapp, com estimativa de 30 pessoas, em aproximadamente 6 horas de trabalho. Será coordenada pela equipe gestora da cooperativa e do projeto.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15002, name: `2. Capacitações técnicas`, deliverables: [
      { id: 1500201, name: `2.1. Implantação hortas comunitária`, expectedResult: `As oficinas serão ministradas por técnicos contratados das comunidades locais, com perfil do trabalho comunitário, com carga horária de 20 horas cada oficina em 02 territórios.`, activities: [
        { id: 15002011, name: `As oficinas serão ministradas por técnicos contratados das comunidades locais, com perfil do trabalho comunitário, com carga horária de 20 horas cada oficina em 02 territórios.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500202, name: `2.2. Criação de aves comunitária`, expectedResult: `As oficinas serão ministradas por técnicos contratados das comunidades locais, com perfil do trabalho comunitário, com carga horária de 20 horas cada oficina, em 02 territórios.`, activities: [
        { id: 15002021, name: `As oficinas serão ministradas por técnicos contratados das comunidades locais, com perfil do trabalho comunitário, com carga horária de 20 horas cada oficina, em 02 territórios.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500203, name: `2.3. Manutenção e sistemas solar`, expectedResult: `A oficina será ministrada por um técnico profissional instalação, manutenção e eletricidade, contratado, com carga horária de 20 horas.`, activities: [
        { id: 15002031, name: `A oficina será ministrada por um técnico profissional instalação, manutenção e eletricidade, contratado, com carga horária de 20 horas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15003, name: `3. Produção de mudas`, deliverables: [
      { id: 1500301, name: `3.1.coleta de sementes, plantio e germinação em viveiros`, expectedResult: `As sementes serão coletadas`, activities: [
        { id: 15003011, name: `As sementes serão coletadas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500302, name: `3.2. crescimento, acompanhamento`, expectedResult: `As ações serão desenvolvidas pelos próprios comunitários, com acompanhamento de um técnico`, activities: [
        { id: 15003021, name: `As ações serão desenvolvidas pelos próprios comunitários, com acompanhamento de um técnico`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1500303, name: `3.3. Plantio`, expectedResult: `O plantio será feito pelos comunitários com orientação de um técnico, conforme o crescimento (desenvolvimento) do ciclo de vida de cada espécie.`, activities: [
        { id: 15003031, name: `O plantio será feito pelos comunitários com orientação de um técnico, conforme o crescimento (desenvolvimento) do ciclo de vida de cada espécie.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15004, name: `4. Implantação das hortas comunitárias`, deliverables: [
      { id: 1500401, name: `4.1. construção e plantio`, expectedResult: `A construção e plantio será pela comunidade local com orientação de um técnico`, activities: [
        { id: 15004011, name: `A construção e plantio será pela comunidade local com orientação de um técnico`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15005, name: `5. implantação da criação de aves`, deliverables: [
      { id: 1500501, name: `Reparo dos aviários (telagem, coberturas, piso), compra dos pintos, ração e bebedouro.`, expectedResult: `As atividades serão feitas pelas famílias envolvidas, com orientação técnica`, activities: [
        { id: 15005011, name: `As atividades serão feitas pelas famílias envolvidas, com orientação técnica`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15006, name: `6. Compra instalação dos kit de internet`, deliverables: [
      { id: 1500601, name: `compra dos kits`, expectedResult: `As compras e instalação serão feitas`, activities: [
        { id: 15006011, name: `As compras e instalação serão feitas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15007, name: `7. Compra e instalação dos abastecimentos de água`, deliverables: [
      { id: 1500701, name: `compra dos sistemas`, expectedResult: `As compras e instalação serão feitas pela equipe responsável do projeto, conselho fiscal e logística`, activities: [
        { id: 15007011, name: `As compras e instalação serão feitas pela equipe responsável do projeto, conselho fiscal e logística`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15008, name: `8. Compra e instalação do kit solar`, deliverables: [
      { id: 1500801, name: `compra do kit`, expectedResult: `As compras serão feitas pela equipe responsável do projeto, conselho fiscal e logística, instalada por um técnico profissional.`, activities: [
        { id: 15008011, name: `As compras serão feitas pela equipe responsável do projeto, conselho fiscal e logística, instalada por um técnico profissional.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15009, name: `9. reforma do entreposto de produção`, deliverables: [
      { id: 1500901, name: `reforma do entreposto`, expectedResult: `compra de materiais de construção e pagamento de mao de obra`, activities: [
        { id: 15009011, name: `compra de materiais de construção e pagamento de mao de obra`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 15010, name: `10. prestação de contas e publicação dos resultados`, deliverables: [
      { id: 1501001, name: `envio de documentos e assembleia geral`, expectedResult: `A equipe gestoras enviará os documentos e fará assembleia geral com os envolvidos, publicará os resultados`, activities: [
        { id: 15010011, name: `A equipe gestoras enviará os documentos e fará assembleia geral com os envolvidos, publicará os resultados`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  16: [
    { id: 16001, name: `1. Infraestrutura`, deliverables: [
      { id: 1600101, name: `1.1 Construção; Agroindústria`, expectedResult: `1 Agroindústria Construída e adequada às normas da ADEPARÁ`, activities: [
        { id: 16001011, name: `1 Agroindústria Construída e adequada às normas da ADEPARÁ`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600102, name: `1.2. Adequação Elétrica e hidráulica/sanitária`, expectedResult: `1.2. Adequação Elétrica e hidráulica/sanitária`, activities: [
        { id: 16001021, name: `1.2. Adequação Elétrica e hidráulica/sanitária`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600103, name: `1.3. Pintura e Acabamento`, expectedResult: `1.3. Pintura e Acabamento`, activities: [
        { id: 16001031, name: `1.3. Pintura e Acabamento`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16002, name: `2. Equipamentos`, deliverables: [
      { id: 1600201, name: `2.1.Aquisição e instalação do forno elétrico`, expectedResult: `1 Agroindústria equipada com 7 equipamentos essenciais.`, activities: [
        { id: 16002011, name: `1 Agroindústria equipada com 7 equipamentos essenciais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600202, name: `2.2. Prensa, descascador; balança.`, expectedResult: `2.2. Prensa, descascador; balança.`, activities: [
        { id: 16002021, name: `2.2. Prensa, descascador; balança.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600203, name: `2.3.Seladora, freezers,mesas inox.`, expectedResult: `2.3.Seladora, freezers,mesas inox.`, activities: [
        { id: 16002031, name: `2.3.Seladora, freezers,mesas inox.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16003, name: `3. Capacitações`, deliverables: [
      { id: 1600301, name: `3.1. Realização de 4 cursos`, expectedResult: `20 Mulheres capacitadas em 4 cursos ( total de 160h)`, activities: [
        { id: 16003011, name: `20 Mulheres capacitadas em 4 cursos ( total de 160h)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1600302, name: `3.2. Boas práticas de fabricação, gestão de negócios`, expectedResult: `3.2. Boas práticas de fabricação, gestão de negócios`, activities: [
        { id: 16003021, name: `3.2. Boas práticas de fabricação, gestão de negócios`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16004, name: `4. Certificação`, deliverables: [
      { id: 1600401, name: `4.1.Consultoria especializada e acompanhamento para obtenção de certificado ADEPARÁ`, expectedResult: `Certificação sanitária unidade emitida pela ADEPARÁ`, activities: [
        { id: 16004011, name: `Certificação sanitária unidade emitida pela ADEPARÁ`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 16005, name: `5. Serviço de terceiros`, deliverables: [
      { id: 1600501, name: `5,1 Serviços contábeis, prestação de contas e Taxas Bancárias`, expectedResult: `Prestação de contas e consultorias.`, activities: [
        { id: 16005011, name: `Prestação de contas e consultorias.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  17: [
    { id: 17001, name: `1. Meta 1 — Formação e oficinas para a coleta de sementes nativas`, deliverables: [
      { id: 1700101, name: `1.1 Apoiar as oficinas de formação (60 participantes, 5 dias)`, expectedResult: `As oficinas serão realizadas por profissionais consultores, via parceiros, e por anciãos mestres nativos, com 60 participantes, duração de 5 dias cada e carga horária total de 40 horas. Indicador: 01 oficina. Fonte de verificação: NF, recibos, lista de presença e certificados emitidos.`, activities: [
        { id: 17001011, name: `As oficinas serão realizadas por profissionais consultores, via parceiros, e por anciãos mestres nativos, com 60 participantes, duração de 5 dias cada e carga horária total de 40 horas. Indicador: 01 oficina. Fonte de verificação: NF, recibos, lista de presença e certificados emitidos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700102, name: `1.2 Aquisição de combustível (5.999 litros mais 131 de óleo)`, expectedResult: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de 5.999 litros de gasolina e diesel e 131 litros de óleo 2 tempos. Indicador: litros. Fonte de verificação: orçamentos e notas fiscais.`, activities: [
        { id: 17001021, name: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de 5.999 litros de gasolina e diesel e 131 litros de óleo 2 tempos. Indicador: litros. Fonte de verificação: orçamentos e notas fiscais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700103, name: `1.3 Alimentação para 60 pessoas`, expectedResult: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para o fornecimento de alimentação a 60 pessoas. Indicador: pessoas, 60. Fonte de verificação: notas fiscais e lista de presença.`, activities: [
        { id: 17001031, name: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para o fornecimento de alimentação a 60 pessoas. Indicador: pessoas, 60. Fonte de verificação: notas fiscais e lista de presença.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700104, name: `1.4 Compra de materiais de escritório`, expectedResult: `Serão adquiridos papel A4, canetas, barbantes, blocos de anotação e fita adesiva para os 60 participantes das oficinas. Indicador: 36 unidades. Fonte de verificação: notas fiscais.`, activities: [
        { id: 17001041, name: `Serão adquiridos papel A4, canetas, barbantes, blocos de anotação e fita adesiva para os 60 participantes das oficinas. Indicador: 36 unidades. Fonte de verificação: notas fiscais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 17002, name: `2. Meta 2 — Modernizar com novas ferramentas e beneficiamento de sementes`, deliverables: [
      { id: 1700201, name: `2.1 Aquisição de quebradeira de castanha e furadeira (20 equipamentos)`, expectedResult: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de material permanente e equipamentos: quebradeira de castanha e furadeira. Indicador: 20 equipamentos. Fonte de verificação: notas fiscais.`, activities: [
        { id: 17002011, name: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de material permanente e equipamentos: quebradeira de castanha e furadeira. Indicador: 20 equipamentos. Fonte de verificação: notas fiscais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 17003, name: `3. Meta 3 — Ajudar na safra de castanha, cumaru e sementes de morototó`, deliverables: [
      { id: 1700301, name: `3.1 Aquisição de 1 câmera profissional para registros`, expectedResult: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de 1 câmera profissional destinada a registros fotográficos. Indicador: 1 equipamento. Fonte de verificação: notas fiscais.`, activities: [
        { id: 17003011, name: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de 1 câmera profissional destinada a registros fotográficos. Indicador: 1 equipamento. Fonte de verificação: notas fiscais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 17004, name: `4. Meta 4 — Apoiar a comercialização dos produtos artesanais`, deliverables: [
      { id: 1700401, name: `4.1 Treinamento de vendas para 8 mulheres da Lojinha (20 horas)`, expectedResult: `Promover treinamentos de vendas para 8 mulheres atuantes na Lojinha da comunidade, com carga horária total de 20 horas, criando estratégias de comercialização de produtos em feiras e eventos. Indicador: 01 treinamento. Fonte de verificação: lista de presença e certificados emitidos.`, activities: [
        { id: 17004011, name: `Promover treinamentos de vendas para 8 mulheres atuantes na Lojinha da comunidade, com carga horária total de 20 horas, criando estratégias de comercialização de produtos em feiras e eventos. Indicador: 01 treinamento. Fonte de verificação: lista de presença e certificados emitidos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700402, name: `4.2 Aquisição de etiquetas com a logomarca`, expectedResult: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de etiquetas com a logomarca da instituição. Indicador: 01 serviço de terceiros. Fonte de verificação: notas fiscais.`, activities: [
        { id: 17004021, name: `Realizar pesquisa de preços em 3 fornecedores locais, preferencialmente, para aquisição de etiquetas com a logomarca da instituição. Indicador: 01 serviço de terceiros. Fonte de verificação: notas fiscais.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1700403, name: `4.3 Tarifas bancárias`, expectedResult: `Pagamentos mensais de tarifas bancárias ao longo da execução do projeto. Indicador: 12 custos administrativos. Fonte de verificação: extrato bancário.`, activities: [
        { id: 17004031, name: `Pagamentos mensais de tarifas bancárias ao longo da execução do projeto. Indicador: 12 custos administrativos. Fonte de verificação: extrato bancário.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  18: [
    { id: 18001, name: `1. Meta 1 – Realizar capacitações e acompanhamento de 41 associados em técnica de plantio, manejo extração de sementes em 10 meses`, deliverables: [
      { id: 1800101, name: `1.1 Seleção e contratação de técnico de campo`, expectedResult: `Técnico contratado por 12 meses pela gestão da associação`, activities: [
        { id: 18001011, name: `Técnico contratado por 12 meses pela gestão da associação`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1800102, name: `1.2 Planejar detalhadamente as 3 capacitações coletivas por comunidade`, expectedResult: `Reunião prévia da gestão da associação com técnico para detalhar as capacitações.`, activities: [
        { id: 18001021, name: `Reunião prévia da gestão da associação com técnico para detalhar as capacitações.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1800103, name: `1.3 Organizar a logística do técnico`, expectedResult: `Reunião prévia da gestão da associação com técnico para realizar toda logística de atuação`, activities: [
        { id: 18001031, name: `Reunião prévia da gestão da associação com técnico para realizar toda logística de atuação`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1800104, name: `1.4 Realizar as 3 capacitações coletivas por comunidade`, expectedResult: `3 Capacitações por comunidade: manejo e cuidados de armazenagem e extração de óleos. Cada oficina terá duração de um dia, com duração média de oito horas com técnica especialistas contratado.`, activities: [
        { id: 18001041, name: `3 Capacitações por comunidade: manejo e cuidados de armazenagem e extração de óleos. Cada oficina terá duração de um dia, com duração média de oito horas com técnica especialistas contratado.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1800105, name: `1.5 Realizar visitas mensais nas 4 comunidades`, expectedResult: `10 Visitas Realizadas`, activities: [
        { id: 18001051, name: `10 Visitas Realizadas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1800106, name: `1.6 Testar novos espaços e processos`, expectedResult: `Serão realizados testes finais nas comunidades no período de 24h com os 4 coordenadores de produção.`, activities: [
        { id: 18001061, name: `Serão realizados testes finais nas comunidades no período de 24h com os 4 coordenadores de produção.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 18002, name: `2. Meta 2 - Melhoria das estruturas produtivas já existentes`, deliverables: [
      { id: 1800201, name: `2.1. Reformar das mini usinas de processamento de óleos (1) Deus dos Pobres e (2) N. S.do Rosário`, expectedResult: `Estruturas produtivas fortalecidas; maior capacidade de beneficiamento de óleos e manteigas, sementes e farinhas`, activities: [
        { id: 18002011, name: `Estruturas produtivas fortalecidas; maior capacidade de beneficiamento de óleos e manteigas, sementes e farinhas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1800202, name: `2.2. Reforma nas secadoras das sementes`, expectedResult: `Estruturas produtivas fortalecidas; maior capacidade de beneficiamento de óleos, sementes e farinhas`, activities: [
        { id: 18002021, name: `Estruturas produtivas fortalecidas; maior capacidade de beneficiamento de óleos, sementes e farinhas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1800203, name: `2.3. Construção das minis secadoras de sementes`, expectedResult: `Estruturas produtivas fortalecidas; maior capacidade de beneficiamento de óleos, sementes e farinhas`, activities: [
        { id: 18002031, name: `Estruturas produtivas fortalecidas; maior capacidade de beneficiamento de óleos, sementes e farinhas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 18003, name: `3. 2.2 Criação de secadoras nas comunidades`, deliverables: [
      { id: 1800301, name: `2.4. Mapear todas as melhorias a serem feitas`, expectedResult: `Terá um associado responsável por mapear`, activities: [
        { id: 18003011, name: `Terá um associado responsável por mapear`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  19: [
    { id: 19001, name: `1. Construção da infraestrutura`, deliverables: [
      { id: 1900101, name: `1.1. Licença de instalação`, expectedResult: `Ir na Secretaria de Agricultura/Secretaria de Meio Ambiente para buscar orientações para a obtenção da licença.`, activities: [
        { id: 19001011, name: `Ir na Secretaria de Agricultura/Secretaria de Meio Ambiente para buscar orientações para a obtenção da licença.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900102, name: `1.2 Elaborar projetos estruturais.`, expectedResult: `Contratação do responsável técnico para elaborar a planta do projeto.`, activities: [
        { id: 19001021, name: `Contratação do responsável técnico para elaborar a planta do projeto.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900103, name: `1.3.Levantamento de orçamentos de materiais da obra.`, expectedResult: `A diretoria pesquisar por três orçamentos a fim de encontrar os melhores preços`, activities: [
        { id: 19001031, name: `A diretoria pesquisar por três orçamentos a fim de encontrar os melhores preços`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900104, name: `1.4.Levantamento de orçamentos de mão de obra`, expectedResult: `A diretoria pesquisar por três orçamentos a fim de encontrar os melhores preços e serviços de qualidade`, activities: [
        { id: 19001041, name: `A diretoria pesquisar por três orçamentos a fim de encontrar os melhores preços e serviços de qualidade`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900105, name: `1.5 Execução da obra`, expectedResult: `Construção da agroindústria`, activities: [
        { id: 19001051, name: `Construção da agroindústria`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 19002, name: `2. Aquisição de Equipamentos`, deliverables: [
      { id: 1900201, name: `2.1. Orçamentos de equipamentos e frete.`, expectedResult: `A diretoria pesquisar por três orçamentos a fim de encontrar os melhores preços`, activities: [
        { id: 19002011, name: `A diretoria pesquisar por três orçamentos a fim de encontrar os melhores preços`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900202, name: `2.2. Comprar equipamentos`, expectedResult: `A diretoria da Cooperativa irá analisar os orçamentos conforme melhor preço e garantias`, activities: [
        { id: 19002021, name: `A diretoria da Cooperativa irá analisar os orçamentos conforme melhor preço e garantias`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900203, name: `2.3. Instalar equipamentos`, expectedResult: `01 técnico Contratado para apoiar a diretoria a identificar os equipamentos mais adequados`, activities: [
        { id: 19002031, name: `01 técnico Contratado para apoiar a diretoria a identificar os equipamentos mais adequados`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 19003, name: `3. Capacitações`, deliverables: [
      { id: 1900301, name: `3.1 Orçamento para contratação para capacitação de uso dos equipamentos`, expectedResult: `A diretoria irá identificar um profissional que possa realizar a capacitação dos(as) cooperados(as) para manusear os equipamentos.`, activities: [
        { id: 19003011, name: `A diretoria irá identificar um profissional que possa realizar a capacitação dos(as) cooperados(as) para manusear os equipamentos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900302, name: `3.2. Orçamento para capacitação em boas práticas de produção`, expectedResult: `A diretoria irá identificar um profissional que possa realizar a capacitação dos(as) cooperados(as) para manusear os equipamentos.`, activities: [
        { id: 19003021, name: `A diretoria irá identificar um profissional que possa realizar a capacitação dos(as) cooperados(as) para manusear os equipamentos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900303, name: `3.3 Definição de cronogramas e detalhes da programação de ambas as capacitações.`, expectedResult: `A diretoria irá definir o cronograma e detalhamento para realizar as capacitações`, activities: [
        { id: 19003031, name: `A diretoria irá definir o cronograma e detalhamento para realizar as capacitações`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900304, name: `3.4 Realizar ambas as capacitações`, expectedResult: `A diretoria irá convidar e realizar as capacitações para os(as) cooperados(as)`, activities: [
        { id: 19003041, name: `A diretoria irá convidar e realizar as capacitações para os(as) cooperados(as)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 19004, name: `4. Certificação ADEPARA`, deliverables: [
      { id: 1900401, name: `4.1. Levantamento de necessidades para licenciamento na ADEPARÁ`, expectedResult: `A diretoria irá na ADEPARÀ buscar orientações para a construção da agroindústria dentro das normas existentes`, activities: [
        { id: 19004011, name: `A diretoria irá na ADEPARÀ buscar orientações para a construção da agroindústria dentro das normas existentes`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900402, name: `4.2. Procurar ADEPARA para certificar a agroindustria`, expectedResult: `A diretoria enviará o ofício solicitando a vistoria para adquirir a licença`, activities: [
        { id: 19004021, name: `A diretoria enviará o ofício solicitando a vistoria para adquirir a licença`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 19005, name: `5. Comunicação e Lançamento da Marca.`, deliverables: [
      { id: 1900501, name: `5.1. Orçar uma empresa de comunicação/Procurar Parceiros`, expectedResult: `Procurar um profissional que tenha competência técnica para adequar a identidade da cooperativa para os produtos, assim como auxiliar nas estratégias de lançamento.`, activities: [
        { id: 19005011, name: `Procurar um profissional que tenha competência técnica para adequar a identidade da cooperativa para os produtos, assim como auxiliar nas estratégias de lançamento.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900502, name: `5.2 Definir Manual de Marca da empresa.`, expectedResult: `O Profissional irá elaborar manual de marca adequando a identidade visual da cooperativa aos produtos.`, activities: [
        { id: 19005021, name: `O Profissional irá elaborar manual de marca adequando a identidade visual da cooperativa aos produtos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900503, name: `5.3 Definir canais de comunicação e público alvo.`, expectedResult: `O Profissional entregará um documento sugerindo os melhores canais de comunicação e o público alvo do produto,`, activities: [
        { id: 19005031, name: `O Profissional entregará um documento sugerindo os melhores canais de comunicação e o público alvo do produto,`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900504, name: `5.4 Definir estratégia de marketing`, expectedResult: `O Profissional irá definir as estratégias de comunicação para atingir o público alvo`, activities: [
        { id: 19005041, name: `O Profissional irá definir as estratégias de comunicação para atingir o público alvo`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900505, name: `5.5 Validação`, expectedResult: `Validação de todo material entregue pelo profissional contratado com a diretoria através de uma reunião.`, activities: [
        { id: 19005051, name: `Validação de todo material entregue pelo profissional contratado com a diretoria através de uma reunião.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 1900506, name: `5.6 Evento de lançamento`, expectedResult: `Um evento de lançamento do produto e da agroindústria aberto ao público com intuito de apresentar o produto.`, activities: [
        { id: 19005061, name: `Um evento de lançamento do produto e da agroindústria aberto ao público com intuito de apresentar o produto.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
  20: [
    { id: 20001, name: `1. Oferecer formação em direitos quilombolas, associativismo, cooperativismo e Capacitar jovens da comunidade em escrita e gestão de projetos comunitários`, deliverables: [
      { id: 2000101, name: `1.1. Oficinas de reflorestamento associativismo e cooperativismo.`, expectedResult: `Formação sobre práticas de reflorestamento associativismo e cooperativismo.`, activities: [
        { id: 20001011, name: `Formação sobre práticas de reflorestamento associativismo e cooperativismo.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000102, name: `1.2. Oficinas sobre direitos quilombolas e territórios tradicionais`, expectedResult: `Formação sobre direitos constitucionais, legislações e políticas públicas`, activities: [
        { id: 20001021, name: `Formação sobre direitos constitucionais, legislações e políticas públicas`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000103, name: `1.3. Oficinas de escrita e gestão de projetos para jovens.`, expectedResult: `Capacitação na elaboração, captação e execução de projetos.`, activities: [
        { id: 20001031, name: `Capacitação na elaboração, captação e execução de projetos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 20002, name: `2. Implementar práticas de agricultura familiar sustentável e reflorestamento comunitário.`, deliverables: [
      { id: 2000201, name: `2.1.Mapeamento das áreas de cultivo e reflorestamento.`, expectedResult: `Identificação e demarcação de áreas prioritárias para cultivo e reflorestamento, com um técnico e equipe de pelo menos 3 lideranças da comunidade.`, activities: [
        { id: 20002011, name: `Identificação e demarcação de áreas prioritárias para cultivo e reflorestamento, com um técnico e equipe de pelo menos 3 lideranças da comunidade.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000202, name: `2.2.Aquisição e distribuição de insumos e mudas`, expectedResult: `Compra de 1.000 mudas frutíferas e nativas, insumos orgânicos, ferramentas básicas, adquiridas para o plantio nas áreas degradadas do território.`, activities: [
        { id: 20002021, name: `Compra de 1.000 mudas frutíferas e nativas, insumos orgânicos, ferramentas básicas, adquiridas para o plantio nas áreas degradadas do território.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000203, name: `2.3.Realização de mutirões comunitários de plantio.`, expectedResult: `Mobilização de agricultores Quilombolas para o plantio coletivo e manejo inicial. 4 mutirões realizados com participação de no mínimo 25 pessoas.`, activities: [
        { id: 20002031, name: `Mobilização de agricultores Quilombolas para o plantio coletivo e manejo inicial. 4 mutirões realizados com participação de no mínimo 25 pessoas.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 20003, name: `3. Fortalecer a cadeia de valor dos produtos da agricultura familiar quilombola.`, deliverables: [
      { id: 2000301, name: `3.1. Oficina de manipulação e conservação de alimentos.`, expectedResult: `Formação sobre higiene, armazenamento e beneficiamento.`, activities: [
        { id: 20003011, name: `Formação sobre higiene, armazenamento e beneficiamento.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000302, name: `3.2. Oficina sobre rotulagem, embalagem e identidade visual`, expectedResult: `Capacitação para agregar valor aos produtos.`, activities: [
        { id: 20003021, name: `Capacitação para agregar valor aos produtos.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000303, name: `3.3.Apoio para inserção em mercados locais e busca de certificações`, expectedResult: `Orientação para comercialização e certificaçõe`, activities: [
        { id: 20003031, name: `Orientação para comercialização e certificaçõe`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
    { id: 20004, name: `4. Estruturar e fortalecer a gestão institucional da Associação Nova Betel.`, deliverables: [
      { id: 2000401, name: `4.1. Oficina de planejamento estratégico e definição de funções`, expectedResult: `Fortalecer organização interna e divisão de responsabilidades.`, activities: [
        { id: 20004011, name: `Fortalecer organização interna e divisão de responsabilidades.`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000402, name: `4.2. Aquisição de equipamentos para gestão`, expectedResult: `Compra de equipamentos (computador, impressora, pastas, etc.)`, activities: [
        { id: 20004021, name: `Compra de equipamentos (computador, impressora, pastas, etc.)`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
      { id: 2000403, name: `4.3.Formação básica em gestão administrativa e prestação de contas`, expectedResult: `Capacitação para fortalecer a gestão institucional e transparência`, activities: [
        { id: 20004031, name: `Capacitação para fortalecer a gestão institucional e transparência`, responsible: ``, plannedDate: ``, startDate: null, conclusionDate: null, progress: 0, status: `Não iniciado`, observations: `` },
      ] },
    ] },
  ],
};
