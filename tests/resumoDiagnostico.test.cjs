const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function carregar(arquivo, mocks = {}, cache = new Map()) {
  arquivo = path.resolve(arquivo);
  if (!path.extname(arquivo)) arquivo += fs.existsSync(arquivo + ".tsx") ? ".tsx" : ".ts";
  if (cache.has(arquivo)) return cache.get(arquivo).exports;
  const m = { exports: {} };
  cache.set(arquivo, m);
  const code = ts.transpileModule(fs.readFileSync(arquivo, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (r) =>
      r in mocks
        ? mocks[r]
        : r.startsWith(".")
          ? carregar(path.resolve(path.dirname(arquivo), r), mocks, cache)
          : require(r),
    m,
    m.exports,
  );
  return m.exports;
}
const helpers = carregar("src/app/diagnostic/resumoDiagnostico.ts");
const registro = (codigo, valor, relato = "", contexto = "") => ({
  codigo,
  contexto,
  resposta: { valor, relato, fonte: "", respondentes: "", selecoes: [] },
});

function resumo({ registros = [], historico = [], parecer = {}, falha = false, reactMock = React } = {}) {
  const consultas = {
    "diagnostico-matriz": [],
    "diagnostico-ieo": historico,
    "diagnostico-parecer": parecer,
  };
  const { ResumoDiagnostico } = carregar("src/app/components/diagnostic/ResumoDiagnostico.tsx", {
    react: reactMock,
    "../../diagnosticos.server": {},
    "@tanstack/react-query": {
      useQuery: ({ queryKey }) => ({
        data: consultas[queryKey[0]],
        error: falha && queryKey[0] === "diagnostico-parecer",
        refetch() {},
      }),
    },
    "./CadernoItens": { useCaderno: () => ({ data: registros, refetch() {} }) },
    "../organizacoes/useOrganizacoes": {
      useFichaOrganizacao: () => ({
        data: { nome: "Organização de teste", notas: [], registros: [], projetos: [] },
        refetch() {},
      }),
    },
    "../DocumentosRegistro": { DocumentosRegistro: () => null },
  });
  return renderToStaticMarkup(
    React.createElement(ResumoDiagnostico, { diagnosticoId: "d1", organizacaoId: "o1" }),
  );
}

test("IEO anterior com nota não é apresentado como resultado atual", () => {
  const html = resumo({ historico: [{ perguntaId: "1.1.1", nivel: 4 }] });
  assert.match(html, /Diagnóstico em revisão/);
  assert.match(html, /IEO atual está sem nota calculável/);
  assert.match(html, /Histórico — instrumento anterior/);
  const atual = html.split("Consultar IEO histórico")[0];
  assert.doesNotMatch(atual, /4,0/);
  assert.match(atual, /Sem nota calculável/);
  assert.doesNotMatch(atual, /0,0/);
});

test("pendência de remapeamento sai das prioridades e acompanha resultados históricos", () => {
  const html = resumo({
    registros: [
      registro("PRIO1", "Remapeamento dimensional pendente — referência R93bb0b3b"),
      registro("PRIO2", "Capital de giro"),
    ],
    historico: [{ perguntaId: "1.1.1", nivel: 2 }],
  });
  const prioridades = html
    .split('aria-label="Prioridades estratégicas"')[1]
    .split('aria-label="Prioridades por dimensão"')[0];
  assert.match(prioridades, /Capital de giro/);
  assert.doesNotMatch(prioridades, /R93bb0b3b/);
  assert.match(prioridades, /Aguardando confirmação/);
  assert.match(html, /Histórico — remapeamento pendente/);
  assert.match(html, /referência do caderno: PRIO1/);
  assert.match(html, /R93bb0b3b/);
});

test("nota parcial mantém cobertura explícita e não cria faixas de classificação", () => {
  const html = resumo({ registros: [registro("Q01", "3"), registro("Q02", "NC")] });
  assert.match(html, /3,0/);
  assert.match(html, /Parcial/);
  assert.match(html, /não certificam a validação técnica/);
  assert.doesNotMatch(html, /Diagnóstico em revisão|Histórico — instrumento anterior/);
});

test("síntese abreviada mantém todos os parágrafos na conclusão completa", () => {
  const texto = "Potencial documentado. ".repeat(25) + "\n\nSegundo parágrafo integral.";
  const html = resumo({
    parecer: {
      sintese: texto,
      capacidades: "Capacidade registrada",
      fragilidades: "Fragilidade registrada",
    },
  });
  assert.match(html, /Ler conclusão completa/);
  assert.ok(html.includes(texto));
  assert.ok(
    html.indexOf("Prioridades estratégicas identificadas") < html.indexOf("Ler conclusão completa"),
  );
  assert.ok(html.includes(helpers.trechoExecutivo(texto)));
});

test("empates compartilham ordem e dimensões sem nota não recebem posição", () => {
  const origem = [{ media: null }, { media: 3 }, { media: 1 }, { media: 1 }];
  assert.deepEqual(
    helpers.ordenarDimensoes(origem).map((d) => [d.media, d.ordem]),
    [
      [1, 1],
      [1, 1],
      [3, 3],
      [null, null],
    ],
  );
  assert.equal(origem[0].media, null);
});

test("campos da prioridade exigem rótulos explícitos e preservam texto multilinha", () => {
  assert.deepEqual(
    helpers.camposDaPrioridade("Capital de giro para atender público e superar obstáculo."),
    {},
  );
  assert.deepEqual(
    helpers.camposDaPrioridade(
      "Mudança desejada: Ampliar vendas\ncom regularidade\nObstáculo: Caixa\nApoio necessário: Crédito\nPúblico beneficiado: Cooperados",
    ),
    {
      resultado: "Ampliar vendas\ncom regularidade",
      obstaculo: "Caixa",
      apoio: "Crédito",
      publico: "Cooperados",
    },
  );
  assert.equal(
    helpers.pendenciaDeRemapeamento("Tratar remapeamento dimensional pendente junto com crédito"),
    false,
  );
  assert.deepEqual(
    helpers
      .prioridadesDoCaderno([
        registro("PRIO1", "Crédito"),
        registro("PRIO2", null),
        registro("PRIO3", "Produto", "", "produto-1"),
        registro("Q01", "2"),
      ])
      .map((r) => r.codigo),
    ["PRIO1"],
  );
});

test("falha ao buscar parecer não é exibida como ausência de análise", () => {
  const html = resumo({ falha: true });
  assert.match(html, /role="alert"/);
  assert.match(html, /Tentar novamente/);
  assert.doesNotMatch(html, /Síntese executiva/);
});

test("impressão abre detalhes fechados e depois restaura o estado escolhido", () => {
  const eventos = new Map();
  const detalhes = [{ open: false }, { open: true }];
  const janelaAnterior = global.window;
  let limpar;
  global.window = {
    addEventListener: (nome, fn) => eventos.set(nome, fn),
    removeEventListener: nome => eventos.delete(nome),
  };
  try {
    resumo({ reactMock: { ...React,
      useEffect: fn => { limpar = fn(); },
      useRef: () => ({ current: { querySelectorAll: () => detalhes.filter(d => !d.open) } }),
    } });
    eventos.get('beforeprint')();
    assert.deepEqual(detalhes.map(d => d.open), [true, true]);
    eventos.get('beforeprint')();
    eventos.get('afterprint')();
    assert.deepEqual(detalhes.map(d => d.open), [false, true]);
    limpar();
    assert.equal(eventos.size, 0);
  } finally {
    if (janelaAnterior === undefined) delete global.window;
    else global.window = janelaAnterior;
  }
});
