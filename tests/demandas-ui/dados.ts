// Dados sintéticos. Nunca importa cliente, credenciais ou banco da aplicação.
export const orgId = "11111111-1111-4111-8111-111111111111";
export const org = {
  id: orgId,
  nome: "Cooperativa de Demonstração (DEMO)",
  codigo: "ORG-TESTE",
  code: "ORG-TESTE",
  tipo: "Cooperativa",
  categoria: "Agricultura Familiar",
  status: "Ativa",
  eixo: "Produção",
  municipio: "Belém",
  uf: "PA",
  localizacao: "Localidade de teste",
  territorio: "Território de teste",
  responsavelTecnico: "Equipe de teste",
  pessoas: [{ id: "pessoa", nome: "Pessoa fictícia", funcao: "Referência", contato: "" }],
  projetos: [{ id: 1, nome: "Projeto de demonstração", codigo: "DEMO-01" }],
  registros: [],
  encaminhamentos: [],
  notas: [],
  pendentes: 0,
};
export const projeto = {
  id: 1,
  name: "Projeto de demonstração",
  code: "DEMO-01",
  financier: "Financiador sintético",
  status: "Em andamento",
  org: org.nome,
  organizacao: { id: orgId, nome: org.nome },
  startDate: "2026-01-01",
  endDate: "2026-12-31",
  objective: "Estruturar a comercialização",
  plano: {
    problematica: "Problemática\n\n(Instrução: Descreva o problema central da proposta).\n\nExemplo sintético: as famílias encontram dificuldades para organizar a produção\ne acessar os canais de comercialização da região. A ausência de equipamentos       adequados\ne de formação técnica limita as oportunidades de geração de renda.\n\nA proposta considera o planejamento coletivo e a participação das comunidades,\nrespeitando os ciclos de produção e as condições de acesso ao território.",
    justificativa: "Exemplo sintético: a proposta prevê formação e organização coletiva para melhorar\no planejamento da produção e o acesso aos mercados locais, respeitando as características\nde cada comunidade.\n\nA participação de jovens e mulheres deve orientar as ações previstas e a troca de\nconhecimentos entre gerações. As atividades serão acompanhadas pela equipe responsável.\n\nO fortalecimento das parcerias locais pretende ampliar as oportunidades de comercialização\ne apoiar a continuidade das ações após o período de execução. Este conteúdo é fictício e\nserve exclusivamente para avaliar a leitura de textos com diferentes tamanhos.",
    localizacaoAbrangencia: "Comunidades fictícias da região de demonstração.",
    diversidade: "Participação de diferentes grupos e gerações nas ações propostas.",
    saberesLocais: "Valorização dos conhecimentos compartilhados pelas famílias e adaptação das atividades à realidade local. Dados exclusivamente sintéticos para testar a apresentação.",
    resultadosImpactos: "Resultados previstos neste exemplo:\n\n● Formação de grupos para planejar a produção\ne compartilhar experiências entre as comunidades.\n\n● Organização de canais locais de comercialização.\n\n● Fortalecimento dos conhecimentos tradicionais.\n\nEstes resultados são previstos, não entregas realizadas.",
    metasTexto: "1. Realizar oficinas de formação\ncom participação das famílias.\n2. Organizar o planejamento da produção.\n3. Acompanhar as ações previstas.",
  },
  budgetApproved: 1000,
  budgetExecuted: 250,
  financialItems: [],
  changes: [],
  risks: [
    {
      id: "r1",
      title: "Risco de demonstração",
      description: "Exemplo fictício",
      category: "Técnico",
      status: "Aberto",
      probability: 2,
      impact: 3,
      severity: 6,
      goalId: "m1",
      stageId: "e1",
      responseStrategy: "Acompanhar",
      responsible: "Equipe",
      budgetImpact: false,
    },
  ],
  goals: [
    {
      id: "m1",
      name: "Meta de demonstração",
      description: "Resultado proposto",
      order: 1,
      deliverables: [
        {
          id: "e1",
          name: "Etapa de demonstração",
          plannedStart: "2026-01-01",
          plannedEnd: "2026-12-31",
          actualStart: null,
          actualEnd: null,
          order: 1,
          activities: [
            {
              id: "a1",
              name: "Oficina de demonstração",
              status: "Em andamento",
              progress: 40,
              plannedStart: "2026-01-01",
              plannedEnd: "2026-10-30",
              actualStart: null,
              actualEnd: null,
              order: 1,
              delayJustification: "",
              budgetLink: "Não informado",
              observations: "Observação sintética",
              nextStep: "",
              nextStepOwner: "",
              nextStepDue: null,
              tasks: [],
            },
          ],
        },
      ],
    },
  ],
  orcamentoItens: [],
  orcamentoNotas: [],
};
// Reprodução dos números visuais da referência; continua sem acessar dados reais.
if (typeof window !== "undefined" && new URLSearchParams(location.search).has("referencia")) {
  const metaBase = structuredClone(projeto.goals[0]);
  const etapaBase = metaBase.deliverables[0];
  const atividadeBase = etapaBase.activities[0];
  org.nome = "AASFLOR";
  projeto.org = org.nome;
  projeto.organizacao.nome = org.nome;
  projeto.code = "18-2026";
  projeto.name = "Conservando a floresta através da produção sustentável comunitária";
  org.projetos[0].nome = projeto.name;
  org.projetos[0].codigo = projeto.code;
  projeto.budgetExecuted = 80244.69;
  projeto.budgetApproved = 164285.71;
  let etapaNumero = 0, atividadeNumero = 0;
  projeto.goals = Array.from({ length: 3 }, (_, m) => ({ ...structuredClone(metaBase), id: `m${m + 1}`, name: `Meta sintética ${m + 1}`, order: m + 1,
    deliverables: Array.from({ length: m === 0 ? 4 : 3 }, () => {
      const e = etapaNumero++;
      return { ...structuredClone(etapaBase), id: `e${e + 1}`, name: `Etapa sintética ${e + 1}`, order: e + 1,
        activities: Array.from({ length: e < 3 ? 3 : 2 }, () => {
          const a = ++atividadeNumero;
          return { ...structuredClone(atividadeBase), id: `a${a}`, name: `Atividade sintética ${a}`, order: a, progress: 73 };
        }),
      };
    }),
  }));
  projeto.risks = Array.from({ length: 14 }, (_, i) => ({ ...projeto.risks[0], id: `r${i + 1}`, title: `Risco sintético ${i + 1}`, goalId: "m1", stageId: "e1" }));
}

export const diagnostico = {
  id: "diag-demo",
  comunidadeId: orgId,
  dataAplicacao: "2026-10-19",
  versao: 1,
  status: "em_edicao",
  criadoEm: "2026-10-19T12:00:00Z",
  atualizadoEm: "2026-10-19T12:00:00Z",
};
const documentos: Record<string, unknown>[] = [];
const matriz: Record<string, unknown>[] = [];
export async function call(name: string, args?: { data?: Record<string, unknown> }) {
  const d = args?.data ?? {};
  if (name === 'listarRespostasMatriz') return matriz.filter(r=>r.diagnosticoId===d.diagnosticoId);
  if (name === 'salvarMatrizPrototipo') {
    if(d.organizacaoId!==orgId || d.diagnosticoId!==diagnostico.id) throw new Error('Aplicação de outra organização.');
    if(new URLSearchParams(location.search).has('falha')) throw new Error('Falha simulada ao salvar a Matriz.');
    const row={...d,atuacao:d.atuacao?[d.atuacao]:[],quemExecuta:null,abrangencia:null,atualizadoEm:new Date().toISOString()};
    const i=matriz.findIndex(r=>r.diagnosticoId===d.diagnosticoId&&r.funcaoId===d.funcaoId);
    if(i<0) matriz.push(row); else matriz[i]=row;
    return row;
  }
  if (name === "listarComunidades") return [org];
  if (name === "listarVisaoGeralDiagnosticos") return [{comunidadeId:orgId,code:org.code,nome:org.nome,classificacao:org.categoria,
    dataAplicacaoMaisRecente:diagnostico.dataAplicacao,ultimaEdicao:diagnostico.atualizadoEm,statusMaisRecente:diagnostico.status,totalDiagnosticos:1}];
  if (name === "listarDiagnosticosPorComunidade") return [diagnostico];
  if (name === "getDiagnostico") return diagnostico;
  if (name === "listarProdutos")
    return [
      {
        id: "produto-demo",
        diagnosticoId: diagnostico.id,
        nome: "Produto de demonstração com descrição extensa para verificar a quebra de linha",
        cadeia: "Cadeia de demonstração",
        statusPreenchimento: "em_preenchimento",
        respostas: {},
        atualizadoEm: "2026-10-19T12:00:00Z",
      },
    ];
  if (name === "getDadosCompletosDiagnostico")
    return {
      diagnostico,
      comunidade: { nome: org.nome, code: org.code, classificacao: org.categoria },
      matriz,
      ieo: [],
      produtos: [],
      parecer: {
        diagnosticoId: diagnostico.id,
        respostasComplementares: {},
        evidenciasVinculadas: [],
        sintese: null,
      },
    };
  if (name === "getParecer")
    return {
      diagnosticoId: diagnostico.id,
      respostasComplementares: {},
      evidenciasVinculadas: [],
      sintese: null,
    };
  if (name === "listarDocumentosRegistro")
    return documentos.filter(
      (x) =>
        x.area === d.area && x.projetoId === d.projetoId && x.organizacaoId === d.organizacaoId,
    );
  if (name === "enviarDocumentoRegistro") {
    const doc = {
      ...d,
      id: "doc-" + (documentos.length + 1),
      tamanhoBytes: 200,
      criadoEm: "2026-10-19",
    };
    documentos.push(doc);
    return doc;
  }
  if (name === "excluirDocumentoRegistro") {
    const i = documentos.findIndex((x) => x.id === d.id);
    if (i >= 0) documentos.splice(i, 1);
    return;
  }
  if (name.startsWith("listar") || name.startsWith("buscar")) return [];
  return {};
}

if(typeof window!=='undefined' && new URLSearchParams(location.search).has('movimentacao')) {
  projeto.goals.push({...structuredClone(projeto.goals[0]),id:'m2',name:'Meta de destino',order:2,deliverables:[]});
}
