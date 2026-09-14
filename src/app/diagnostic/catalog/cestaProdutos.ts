// Catálogo da Cesta de Produtos (RF-02.C) — conteúdo fornecido pelo usuário
// (Anexo — Instrumentos do Diagnóstico, seção 4): perguntas, orientações e
// alternativas dos oito blocos, um produto/subproduto por vez.

export type CestaCampoTipo = 'texto' | 'numero' | 'unica' | 'multipla';

export interface CestaOpcao { valor: string; label: string; }

export interface CestaCampo {
  id: string;
  label: string;
  orientacao?: string;
  tipo: CestaCampoTipo;
  opcoes?: CestaOpcao[];
  /** Quando marcada a opção "Outro", exibe um campo de texto livre complementar. */
  permiteOutro?: boolean;
  placeholder?: string;
}

export interface CestaBloco {
  id: string;
  titulo: string;
  campos: CestaCampo[];
}

const opc = (...valores: string[]): CestaOpcao[] => valores.map(v => ({ valor: v, label: v }));

export const CESTA_BLOCOS: CestaBloco[] = [
  {
    id: '4.1', titulo: 'Perfil do Produto',
    campos: [
      { id: 'produto_nome', label: 'Produto / Subproduto', orientacao: 'Identifique o produto ou subproduto analisado.', tipo: 'texto', placeholder: 'Ex.: Açaí congelado' },
      { id: 'cadeia_produtiva', label: 'Cadeia produtiva', orientacao: 'Informe a cadeia produtiva à qual o produto pertence.', tipo: 'unica', permiteOutro: true, opcoes: opc('Açaí', 'Cacau', 'Frutas e polpas', 'Óleos e sementes', 'Castanha', 'Mel', 'Farinha/mandioca', 'Artesanato', 'Cosméticos', 'Plantas medicinais', 'Pescado', 'Turismo de base comunitária', 'Outro') },
      { id: 'grau_processamento', label: 'Grau de processamento do produto', orientacao: 'Indique o nível de transformação do produto.', tipo: 'unica', opcoes: opc('In natura / matéria-prima', 'Beneficiado ou minimamente processado', 'Semi-processado', 'Processado / transformado', 'Não se aplica') },
      { id: 'caracteristicas_desejadas', label: 'Características desejadas para o produto', orientacao: 'Marque as características que a organização deseja alcançar na forma de ofertar/comercializar este produto. Pode haver mais de uma resposta; este campo não representa grau de processamento.', tipo: 'multipla', permiteOutro: true, opcoes: opc('Manter como está', 'Comercialização in natura / como matéria-prima', 'Ampliar beneficiamento ou processamento', 'Comercializar com embalagem própria', 'Comercializar com marca própria/coletiva', 'Atender novo padrão/apresentação exigido pelo mercado', 'Outro', 'Não se aplica') },
      { id: 'tipo_produto', label: 'Tipo de produto', orientacao: 'Classifique o produto conforme sua natureza.', tipo: 'unica', permiteOutro: true, opcoes: opc('Alimento', 'Cosmético', 'Artesanato', 'Fitoterápico/medicinal', 'Outro') },
      { id: 'importancia_produto', label: 'Identificação da importância do produto para a organização e/ou para o território', orientacao: 'Identifique os motivos pelos quais este produto é relevante para a organização ou para o território.', tipo: 'multipla', permiteOutro: true, opcoes: opc('Geração de renda principal', 'Complemento de renda', 'Segurança alimentar', 'Identidade cultural', 'Uso tradicional', 'Conservação ambiental', 'Fortalecimento das mulheres', 'Permanência dos jovens no território', 'Outro') },
      { id: 'membros_atuantes', label: 'Nº de membros atuantes neste produto', orientacao: 'Informe quantos associados/cooperados atuam diretamente na produção, beneficiamento ou comercialização deste produto.', tipo: 'numero', placeholder: 'Ex.: 25' },
      { id: 'membros_ativos_organizacao_total', label: 'Nº total de membros ativos da organização', orientacao: 'Campo de referência para permitir comparação com o número de membros atuantes neste produto.', tipo: 'numero', placeholder: 'Ex.: 80' },
      { id: 'producao_sazonal', label: 'Produção sazonal?', orientacao: 'Indique se a produção varia de forma relevante ao longo do ano.', tipo: 'unica', opcoes: opc('Sim — há períodos definidos de safra e entressafra', 'Não — a produção ocorre de forma relativamente contínua', 'Não sabe informar') },
      { id: 'meses_maior_producao', label: 'Meses de maior produção', orientacao: 'Registre os meses de maior oferta/produção.', tipo: 'texto', placeholder: 'Ex.: Julho - Dezembro' },
      { id: 'meses_menor_producao', label: 'Meses de menor produção / entressafra', orientacao: 'Registre os meses de menor oferta ou entressafra.', tipo: 'texto', placeholder: 'Ex.: Janeiro - Junho' },
      { id: 'limitacoes_produtivas', label: 'Principais limitações produtivas', orientacao: 'Identifique os principais fatores que hoje limitam a produção deste produto. Marque todas as opções aplicáveis.', tipo: 'multipla', permiteOutro: true, opcoes: opc('Matéria-prima/insumos', 'Equipamentos', 'Infraestrutura', 'Energia', 'Água', 'Armazenamento', 'Refrigeração', 'Transporte/logística', 'Mão de obra', 'Conhecimento/assistência técnica', 'Capital de giro', 'Regularização/licenças', 'Sazonalidade/clima', 'Baixa demanda', 'Não há limitação relevante identificada', 'Outro') },
      { id: 'especie_nativa', label: 'Utiliza espécie nativa da biodiversidade brasileira?', orientacao: "Registre o que a organização sabe sobre a origem da espécie. Em caso de dúvida, marcar 'Não sabe informar' e encaminhar para Triagem Técnica PGC. A resposta não substitui verificação técnica.", tipo: 'unica', opcoes: opc('Sim', 'Não', 'Não sabe informar') },
      { id: 'conhecimento_tradicional', label: 'Envolve conhecimentos ou práticas tradicionais da comunidade?', orientacao: 'Registre se, na percepção da organização, a produção, manejo, beneficiamento ou uso do produto envolve conhecimentos, práticas ou modos de fazer tradicionais da comunidade ou transmitidos entre gerações. A resposta apoia a Triagem Técnica PGC e não constitui enquadramento jurídico.', tipo: 'unica', opcoes: opc('Sim', 'Não', 'Possivelmente', 'Não sabe informar') },
    ],
  },
  {
    id: '4.2', titulo: 'Processo e Qualidade',
    campos: [
      { id: 'padronizacao_processo', label: 'Como é realizado o processo de produção deste produto?', orientacao: 'Identifique o grau de padronização das práticas de produção ou beneficiamento.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há orientação comum sobre como o processo deve ser realizado.' },
        { valor: '2', label: '2 — Existem orientações comuns sobre o processo, mas não há uma sequência, procedimento ou padrão definido.' },
        { valor: '3', label: '3 — Existe sequência, procedimento ou padrão definido e utilizado na produção ou beneficiamento.' },
        { valor: '4', label: '4 — Além de definido e utilizado, o processo é registrado e seu cumprimento é acompanhado pela organização.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'registro_escrito_processo', label: 'O processo possui orientação ou registro escrito?', orientacao: 'Verifique se as etapas, procedimentos ou orientações do processo estão documentados.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há orientação ou registro do processo.' },
        { valor: '2', label: '2 — Existem anotações ou orientações escritas, mas elas não descrevem como o processo deve ser realizado.' },
        { valor: '3', label: '3 — Existe ficha, manual ou procedimento escrito que descreve como o processo deve ser realizado.' },
        { valor: '4', label: '4 — O documento está atualizado e é utilizado como referência para realização e acompanhamento do processo.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'infraestrutura_coletiva', label: 'Utiliza infraestrutura coletiva?', orientacao: 'Indique se o produto utiliza equipamentos, instalações, armazenamento ou outras estruturas geridas pela organização.', tipo: 'unica', opcoes: opc('Sim', 'Não', 'Não sabe informar') },
      { id: 'assistencia_tecnica_produto', label: 'A organização oferece ou viabiliza assistência/orientação para este produto?', orientacao: 'Identifique o nível de envolvimento da organização na oferta de assistência técnica ou orientação para este produto.', tipo: 'unica', opcoes: opc('Não oferece nem viabiliza', 'Viabiliza por parceiros ou terceiros', 'Oferece diretamente por meio da própria organização/equipe', 'Combina apoio próprio e de parceiros', 'Não sabe informar', 'Não se aplica') },
      { id: 'controle_lotes', label: 'Como é feito o controle de lotes?', orientacao: 'Verifique se o produto pode ser identificado e rastreado por lote, quando aplicável.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há identificação dos lotes.' },
        { valor: '2', label: '2 — Há alguma identificação dos lotes, mas ela não permite relacionar de forma consistente o produto à produção, origem ou período correspondente.' },
        { valor: '3', label: '3 — Os lotes são identificados e associados à produção, origem ou período correspondente.' },
        { valor: '4', label: '4 — Além da identificação dos lotes, existem registros que permitem rastrear sua origem e destino.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'controle_validade', label: 'Como é feito o controle de validade?', orientacao: 'Verifique se há definição, identificação e acompanhamento da validade, quando aplicável.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há definição ou identificação da validade.' },
        { valor: '2', label: '2 — A validade é definida, mas não é identificada de forma consistente nos produtos ou registros.' },
        { valor: '3', label: '3 — A validade é definida e identificada nos produtos ou registros aplicáveis.' },
        { valor: '4', label: '4 — Além de definida e identificada, a validade é registrada e acompanhada pela organização.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'controle_qualidade_produto', label: 'Como é realizado o controle de qualidade deste produto?', orientacao: 'Identifique como a organização ou os produtores verificam a qualidade do produto.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há critérios de qualidade definidos.' },
        { valor: '2', label: '2 — Existem critérios conhecidos, mas não há forma definida de verificar seu atendimento.' },
        { valor: '3', label: '3 — Existem critérios e uma forma definida de verificar seu atendimento.' },
        { valor: '4', label: '4 — Existem critérios, rotina de verificação e registro dos resultados.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'registro_perdas', label: 'Como as perdas deste produto são registradas?', orientacao: 'Registre se a organização conhece e acompanha as perdas. Quando houver dados, informe período, quantidade produzida/processada e quantidade perdida.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há registro das perdas.' },
        { valor: '2', label: '2 — As perdas são estimadas quando percebidas, sem registro definido.' },
        { valor: '3', label: '3 — As perdas são registradas por produção, período ou lote.' },
        { valor: '4', label: '4 — As perdas são registradas e os dados são utilizados para identificar causas ou orientar melhorias no processo.' },
        { valor: 'Sem perdas', label: 'Não há perdas identificadas.' },
        { valor: 'Não sabe informar', label: 'Não sabe informar.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'etapas_com_perdas', label: 'Principais etapas com perdas', orientacao: 'Identifique onde ocorrem as principais perdas.', tipo: 'texto', placeholder: 'Ex.: Colheita e transporte' },
      { id: 'causas_perdas', label: 'Principais causas das perdas', orientacao: 'Identifique as causas mais relevantes das perdas.', tipo: 'texto', placeholder: 'Ex.: Falta de refrigeração' },
    ],
  },
  {
    id: '4.3', titulo: 'Regularidade Sanitária do Produto',
    campos: [
      { id: 'exige_licenca_sanitaria', label: 'A organização sabe se o produto exige licença, inspeção ou registro sanitário?', orientacao: 'Registre o que a organização sabe sobre a exigência sanitária. Esta resposta é autodeclarada e não substitui verificação técnica.', tipo: 'unica', opcoes: opc('Sim — a organização entende que há exigência', 'Não — a organização entende que não há exigência', 'Não sabe informar — encaminhar para validação técnica') },
      { id: 'situacao_licenca_sanitaria', label: 'Situação da licença/registro sanitário aplicável', orientacao: "Preencher quando a exigência for conhecida ou já tiver sido tecnicamente verificada. Se houver dúvida sobre a exigência, registrar 'Não foi possível verificar' e encaminhar para validação técnica.", tipo: 'unica', opcoes: opc('Regular — possui a licença/registro aplicável e vigente', 'Em processo de obtenção ou regularização', 'Necessário, mas ainda não possui', 'Não se aplica — exigência tecnicamente descartada', 'Não foi possível verificar — requer validação técnica') },
      { id: 'necessidade_analise_laboratorial', label: 'Já foi identificada necessidade de análise laboratorial para este produto?', orientacao: 'Indique se já houve análise laboratorial pertinente ao produto.', tipo: 'unica', opcoes: opc('Não foi identificada necessidade', 'Sim, mas ainda não foi realizada', 'Sim, está em andamento', 'Sim, já foi realizada', 'Não sabe informar — verificar tecnicamente', 'Não se aplica') },
      { id: 'adequacao_rotulo', label: 'A adequação legal do rótulo já foi verificada?', orientacao: 'Registre se houve verificação das exigências legais aplicáveis ao rótulo e por quem. Não pedir que a organização declare conformidade técnica sem base de verificação.', tipo: 'unica', opcoes: opc('Não possui rótulo', 'Possui rótulo, mas as exigências aplicáveis ainda não foram verificadas', 'A organização realizou uma verificação interna', 'Houve verificação com apoio técnico/profissional', 'Foram identificadas adequações e elas estão em andamento', 'Não sabe informar', 'Não se aplica') },
    ],
  },
  {
    id: '4.4', titulo: 'Relação Ambiental e Climática do Produto',
    campos: [
      { id: 'gera_residuos', label: 'Gera resíduos produtivos?', orientacao: 'Indique se o processo gera resíduos.', tipo: 'unica', opcoes: opc('Sim', 'Não', 'Não sabe informar') },
      { id: 'destino_residuos', label: 'Destino principal dos resíduos', orientacao: 'Registre a principal destinação dos resíduos.', tipo: 'unica', permiteOutro: true, opcoes: opc('Descartados', 'Reaproveitados', 'Compostados', 'Vendidos', 'Doados', 'Queimados', 'Ainda não há solução', 'Não se aplica / não houve impacto identificado', 'Outro') },
      { id: 'riscos_impactos_ambientais', label: 'Há riscos ou impactos ambientais associados à produção/processamento deste produto?', orientacao: 'Identifique, a partir da percepção da organização, se há riscos ou impactos ambientais associados à produção ou ao processamento deste produto.', tipo: 'multipla', permiteOutro: true, opcoes: opc('Não identificados', 'Uso/degradação do solo', 'Pressão sobre recursos naturais', 'Contaminação de água/solo', 'Geração ou descarte inadequado de resíduos', 'Desmatamento/supressão vegetal', 'Uso de substâncias potencialmente contaminantes', 'Outro', 'Não sabe informar') },
      { id: 'eventos_climaticos', label: 'Eventos climáticos que já afetaram este produto', orientacao: 'Considere eventos ocorridos nos últimos 3 anos ou ciclos produtivos recentes. Marque apenas situações que a organização reconhece ter afetado a produção, manejo, beneficiamento, logística ou comercialização.', tipo: 'multipla', permiteOutro: true, opcoes: opc('Seca / estiagem prolongada', 'Excesso de chuva / alagamento', 'Cheias ou vazantes fora do período esperado', 'Temperaturas muito elevadas / ondas de calor', 'Ventos fortes / tempestades', 'Incêndios / queimadas favorecidas por condições climáticas', 'Alteração percebida no período de safra ou disponibilidade do recurso', 'Outro', 'Não houve impacto climático identificado', 'Não sabe informar') },
      { id: 'impactos_observados', label: 'Quais impactos foram observados neste produto?', orientacao: 'Considerando os eventos climáticos identificados na pergunta anterior, registre os efeitos concretamente observados neste produto.', tipo: 'multipla', permiteOutro: true, opcoes: opc('Redução da produção/disponibilidade', 'Perdas de matéria-prima ou produto', 'Alteração da qualidade', 'Mudança no período de safra', 'Aumento de pragas/doenças', 'Dificuldade de acesso ou escoamento', 'Aumento de custos', 'Redução/interrupção das vendas', 'Mudança necessária no manejo/processo', 'Outro', 'Não sabe informar', 'Não se aplica') },
      { id: 'acompanhamento_impactos_climaticos', label: 'Como a organização acompanha os impactos climáticos?', orientacao: 'Identifique se os efeitos climáticos são apenas percebidos ou se também existem registros que permitam acompanhar ocorrências e consequências ao longo do tempo.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não acompanha especificamente os impactos climáticos.' },
        { valor: '2', label: '2 — Os impactos são percebidos e discutidos, mas não são registrados.' },
        { valor: '3', label: '3 — As ocorrências e suas consequências são registradas.' },
        { valor: '4', label: '4 — Há registros organizados que permitem comparar ocorrências e impactos ao longo do tempo.' },
        { valor: 'N/A', label: 'N/A — Não houve impacto identificado.' },
      ] },
      { id: 'medidas_adaptacao_climatica', label: 'Há medidas adotadas para reduzir ou se adaptar aos impactos climáticos?', orientacao: 'Registre práticas concretas já adotadas pela organização ou pelos membros para prevenir, reduzir ou responder aos efeitos climáticos. Este campo caracteriza capacidade de adaptação e não compõe diretamente a pontuação do IEO.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Nenhuma medida específica foi adotada.' },
        { valor: '2', label: '2 — São adotadas respostas quando o problema ocorre, sem prática preventiva definida.' },
        { valor: '3', label: '3 — Existem práticas preventivas ou de adaptação já adotadas para os impactos identificados.' },
        { valor: '4', label: '4 — Existem medidas definidas, aplicadas e revistas a partir dos impactos observados.' },
        { valor: 'N/A', label: 'N/A — Não houve impacto identificado.' },
      ] },
    ],
  },
  {
    id: '4.5', titulo: 'Precificação',
    campos: [
      { id: 'conhecimento_custos', label: 'Como a organização conhece e registra os custos deste produto?', orientacao: 'Identifique como os custos de produção, beneficiamento, embalagem, transporte ou comercialização são levantados.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há levantamento dos custos.' },
        { valor: '2', label: '2 — Os custos são estimados, mas não há registro que permita consultá-los.' },
        { valor: '3', label: '3 — Os custos utilizados para formação ou análise do preço são registrados.' },
        { valor: '4', label: '4 — Os custos são registrados, atualizados e utilizados para analisar preço ou resultado do produto.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'criterio_preco', label: 'Como o preço é definido?', orientacao: 'Registre o principal critério de formação do preço.', tipo: 'unica', permiteOutro: true, opcoes: opc('Pelo custo', 'Pelo preço de mercado', 'Pelo comprador', 'Pelo atravessador', 'Por tentativa', 'Por acordo comunitário', 'Não há critério definido', 'Outro') },
      { id: 'preco_cobre_custos', label: 'Com base nos custos conhecidos, é possível saber se o preço cobre os custos?', orientacao: 'Avalie apenas quando houver informação de custos suficiente para comparação com o preço praticado.', tipo: 'unica', opcoes: opc('Não há informação suficiente para comparar preço e custos', 'O preço praticado não cobre os custos conhecidos', 'O preço cobre os custos em alguns canais ou condições de venda, mas não em outros', 'O preço cobre os custos conhecidos nos canais ou condições de venda analisados', 'Não se aplica') },
      { id: 'acompanhamento_margem', label: 'Como a organização acompanha o resultado ou a margem deste produto?', orientacao: 'Identifique se o resultado econômico do produto é calculado e acompanhado.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não calcula o resultado ou margem.' },
        { valor: '2', label: '2 — Faz estimativas quando surge necessidade.' },
        { valor: '3', label: '3 — Calcula com base em registros de custos e vendas.' },
        { valor: '4', label: '4 — Calcula e acompanha o resultado ao longo do tempo e utiliza essa informação para apoiar decisões.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'diferenca_preco_canal', label: 'Existe diferença de preço por canal?', orientacao: 'Indique se o preço varia conforme canal ou comprador.', tipo: 'unica', opcoes: opc('Sim', 'Não', 'Não sabe informar') },
    ],
  },
  {
    id: '4.6', titulo: 'Comercialização',
    campos: [
      { id: 'centralizacao_comercializacao', label: 'Como é realizada a comercialização deste produto?', orientacao: 'Identifique o grau de centralização da comercialização deste produto pela organização.', tipo: 'unica', opcoes: opc('Cada produtor/pessoa realiza de sua própria forma, sem padrão comum', 'Existem orientações comuns, mas a comercialização é descentralizada', 'A comercialização é realizada de forma centralizada pela organização') },
      { id: 'relacao_comercial_compradores', label: 'Como é definida a relação comercial com os compradores?', orientacao: 'Indique a forma predominante de negociação/contratação utilizada para este produto.', tipo: 'unica', permiteOutro: true, opcoes: opc('Venda pontual, sem acordo prévio', 'Pedido/encomenda', 'Acordo verbal recorrente', 'Contrato formal', 'Edital/chamada pública', 'Consignação', 'Outro', 'Não se aplica') },
      { id: 'principal_canal_venda', label: 'Principal canal de venda', orientacao: 'Identifique o canal de venda predominante.', tipo: 'unica', permiteOutro: true, opcoes: opc('Venda direta na comunidade', 'Feiras', 'Atravessadores', 'Mercados locais', 'Supermercados', 'Restaurantes', 'Empórios', 'Distribuidores', 'Compras públicas', 'PNAE', 'PAA', 'Redes sociais', 'E-commerce', 'Eventos', 'Empresas', 'Exportação', 'Outro') },
      { id: 'compradores_recorrentes', label: 'Há compradores recorrentes deste produto?', orientacao: 'Registre se existem compradores que realizam compras repetidas.', tipo: 'unica', opcoes: opc('Não', 'Sim', 'Não sabe informar') },
      { id: 'compradores_recorrentes_qtd', label: 'Nº de compradores recorrentes', orientacao: 'Preencher quando houver compradores recorrentes conhecidos.', tipo: 'numero' },
      { id: 'compradores_formalizados', label: 'Entre os compradores recorrentes, há relação formalizada?', orientacao: 'Quando houver compradores recorrentes, registre quantos possuem contrato, pedido formal ou outro instrumento escrito.', tipo: 'unica', opcoes: opc('Nenhum', 'Sim', 'Em negociação', 'Não sabe informar', 'Não se aplica') },
      { id: 'compradores_formalizados_qtd', label: 'Nº com relação formalizada', orientacao: 'Preencher quando houver compradores recorrentes com relação formalizada.', tipo: 'numero' },
      { id: 'principal_dificuldade_venda', label: 'Principal dificuldade de venda', orientacao: 'Registre o principal gargalo comercial.', tipo: 'unica', permiteOutro: true, opcoes: opc('Preço', 'Embalagem', 'Rotulagem', 'Falta de compradores', 'Logística', 'Falta de nota fiscal', 'Falta de regularização', 'Baixo volume', 'Falta de padrão', 'Comunicação', 'Falta de marca', 'Falta de capital de giro', 'Outro') },
    ],
  },
  {
    id: '4.7', titulo: 'Logística',
    campos: [
      { id: 'principal_meio_transporte', label: 'Principal meio de transporte', orientacao: 'Identifique o principal meio utilizado para escoamento.', tipo: 'unica', permiteOutro: true, opcoes: opc('Barco', 'Lancha', 'Rabeta', 'Navio', 'Balsa', 'Carro', 'Caminhão', 'Moto', 'Avião', 'Transporte de terceiros', 'Retirada pelo comprador', 'Outro') },
      { id: 'rota_escoamento', label: 'Rota de escoamento', orientacao: 'Descreva a rota principal entre o local de produção/coleta e o destino de venda, indicando os principais trechos ou pontos de passagem.', tipo: 'texto', placeholder: 'Ex.: Comunidade → barco → sede municipal → caminhão → Belém → comprador.' },
      { id: 'necessita_transporte_refrigerado', label: 'Necessita transporte refrigerado?', orientacao: 'Indique se a conservação do produto exige refrigeração durante o transporte.', tipo: 'unica', opcoes: opc('Sim — em todo o trajeto', 'Sim — em parte do trajeto', 'Não', 'Não sabe informar', 'Não se aplica') },
      { id: 'frequencia_envio', label: 'Frequência possível de envio', orientacao: 'Registre a frequência com que o produto pode ser enviado ao mercado.', tipo: 'unica', opcoes: opc('Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Apenas sob demanda', 'Apenas na safra', 'Irregular') },
      { id: 'participacao_logistica', label: 'Qual é a participação da organização na logística e no escoamento deste produto?', orientacao: 'Identifique o nível de participação da organização na logística e no escoamento deste produto.', tipo: 'unica', opcoes: opc('Não participa', 'Apoia pontualmente quando necessário', 'Articula ou viabiliza transporte por parceiros/terceiros', 'Organiza ou coordena o transporte/escoamento', 'Executa diretamente atividades de transporte ou escoamento', 'Não se aplica') },
    ],
  },
  {
    id: '4.8', titulo: 'Marca e Embalagem',
    campos: [
      { id: 'possui_marca', label: 'Possui marca?', orientacao: 'Indique se o produto é comercializado com marca.', tipo: 'unica', opcoes: opc('Sim, marca própria', 'Sim, marca própria e marca coletiva', 'Sim, marca coletiva', 'Em desenvolvimento', 'Não possui') },
      { id: 'adequacao_embalagem', label: 'Como está a adequação da embalagem para conservação, transporte e venda?', orientacao: 'Avalie a embalagem considerando proteção do produto, conservação, transporte e exigências do mercado aplicáveis.', tipo: 'unica', opcoes: [
        { valor: '1', label: '1 — Não há embalagem definida para o produto.' },
        { valor: '2', label: '2 — Há embalagem utilizada, mas não houve avaliação específica de sua adequação à conservação e ao transporte.' },
        { valor: '3', label: '3 — A embalagem foi definida considerando as necessidades conhecidas de conservação e transporte do produto.' },
        { valor: '4', label: '4 — Além das necessidades de conservação e transporte, a embalagem foi verificada em relação às exigências aplicáveis ao mercado pretendido.' },
        { valor: 'N/A', label: 'N/A — Não se aplica.' },
      ] },
      { id: 'possui_codigo_barras', label: 'Possui código de barras?', orientacao: 'Indique se o produto possui código de barras.', tipo: 'unica', opcoes: opc('Sim', 'Não', 'Não se aplica') },
      { id: 'certificacao_selo', label: 'Possui certificação, selo ou reconhecimento formal?', orientacao: 'Registre certificações, selos ou reconhecimentos formais já obtidos ou em processo, quando aplicáveis.', tipo: 'multipla', permiteOutro: true, opcoes: opc('Não possui', 'Em processo de obtenção', 'Orgânico', 'Selo Arte', 'Serviço/selo de inspeção', 'Indicação Geográfica', 'Certificação de origem', 'Certificação socioambiental', 'Outro', 'Não se aplica') },
      { id: 'diferenciais_produto', label: 'Diferenciais do produto a comunicar', orientacao: 'Registre atributos de origem, território, qualidade, biodiversidade ou modo de fazer que agreguem valor.', tipo: 'texto' },
    ],
  },
];
