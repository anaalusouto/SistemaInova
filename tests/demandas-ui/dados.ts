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
  budgetApproved: 1000,
  budgetExecuted: 250,
  financialItems: [],
  changes: [],
  risks: [
    {
      id: "r1",
      title: "Risco de demonstração",
      description: "Exemplo fictício",
      status: "Aberto",
      probability: 2,
      impact: 3,
      severity: 6,
      goalId: "m1",
      etapaId: "e1",
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
export async function call(name: string, args?: { data?: Record<string, unknown> }) {
  const d = args?.data ?? {};
  if (name === "listarComunidades") return [org];
  if (name === "listarDiagnosticosPorComunidade") return [diagnostico];
  if (name === "getDiagnostico") return diagnostico;
  if (name === "getDadosCompletosDiagnostico")
    return {
      diagnostico,
      comunidade: { nome: org.nome, code: org.code, classificacao: org.categoria },
      matriz: [],
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
