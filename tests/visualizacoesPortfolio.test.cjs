const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const mod = { exports: {} };
const codigo = ts.transpileModule(
  fs.readFileSync("src/app/lib/visualizacoesPortfolio.ts", "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
new Function("require", "module", "exports", codigo)(require, mod, mod.exports);
const {
  preferenciasPadrao,
  lerPreferencias,
  chavePreferencias,
  agruparVisualizacao,
  pontosDispersao,
  valorMetrica,
} = mod.exports;
const config = () => preferenciasPadrao().graficos[0];
const projeto = (id, extra = {}) => ({
  id,
  code: `P${id}`,
  name: `Projeto ${id}`,
  org: "Org A",
  segmento: "Tradicional",
  status: "Em andamento",
  progress: 50,
  budgetApproved: 100,
  budgetExecuted: 20,
  risks: [],
  goals: [],
  ...extra,
});

test("agrupa valores por organização e cruza status sem perder projetos nem alterar a origem", () => {
  const projetos = [
    projeto(1),
    projeto(2, { status: "Concluído", budgetApproved: 200 }),
    projeto(3, { org: "Org B", budgetApproved: 300 }),
  ];
  const antes = structuredClone(projetos);
  const dados = agruparVisualizacao(projetos, { ...config(), cruzamento: "status" });
  assert.deepEqual(dados.series, [
    { chave: "serie0", nome: "Em andamento" },
    { chave: "serie1", nome: "Concluído" },
  ]);
  assert.deepEqual(dados.linhas, [
    { name: "Org A", serie0: 100, serie1: 200 },
    { name: "Org B", serie0: 300, serie1: null },
  ]);
  assert.deepEqual(projetos, antes);
});
test("percentuais usam média por projeto e excluem orçamento zero, ausentes e números inválidos", () => {
  const projetos = [
    projeto(1),
    projeto(2, { budgetApproved: 200, budgetExecuted: 200 }),
    projeto(3, { budgetApproved: 0 }),
    projeto(4, { budgetExecuted: NaN }),
  ];
  const dados = agruparVisualizacao(projetos, {
    ...config(),
    metrica: "execucao",
    agregacao: "soma",
  });
  assert.equal(dados.linhas[0].serie0, 60);
  assert.equal(dados.ausentes, 2);
  assert.equal(valorMetrica(projeto(1, { progress: null }), "avanco"), null);
  assert.equal(valorMetrica(projeto(1, { progress: 0 }), "avanco"), 0);
  assert.equal(
    agruparVisualizacao(projetos.slice(0, 2), { ...config(), agregacao: "media" }).linhas[0].serie0,
    150,
  );
});
test("dispersão mantém identidade dos projetos e exclui pontos sem um dos eixos", () => {
  const c = { ...config(), metricaX: "avanco", metrica: "execucao", tipo: "dispersao" };
  const pontos = pontosDispersao(
    [projeto(1), projeto(2, { budgetApproved: 0 }), projeto(3, { progress: null })],
    c,
  );
  assert.deepEqual(pontos, [{ id: 1, name: "P1 · Projeto 1", x: 50, y: 20 }]);
});
test("riscos encerrados ficam fora da contagem e atividades vêm do plano atual", () => {
  const p = projeto(1, {
    risks: [{ status: "Aberto" }, { status: "Encerrado" }],
    goals: [{ deliverables: [{ activities: [{ status: "Concluído" }, { status: "A iniciar" }] }] }],
  });
  assert.equal(valorMetrica(p, "riscos"), 1);
  assert.equal(valorMetrica(p, "atividades"), 1);
});
test("preferências validam versão, opções, IDs duplicados e limite; painel vazio é uma escolha válida", () => {
  for (const raw of [
    "{",
    "{}",
    JSON.stringify({ versao: 2, graficos: [] }),
    JSON.stringify({ versao: 1, graficos: [{ ...config(), tipo: "sql" }] }),
    JSON.stringify({ versao: 1, graficos: [config(), config()] }),
    JSON.stringify({
      versao: 1,
      graficos: Array.from({ length: 9 }, (_, i) => ({ ...config(), id: String(i) })),
    }),
  ])
    assert.deepEqual(lerPreferencias(raw), preferenciasPadrao());
  assert.deepEqual(lerPreferencias(JSON.stringify({ versao: 1, graficos: [] })), {
    versao: 1,
    graficos: [],
  });
  const p = preferenciasPadrao();
  p.graficos[0].cruzamento = "status";
  assert.deepEqual(lerPreferencias(JSON.stringify(p)), p);
  assert.notEqual(chavePreferencias("usuario-a"), chavePreferencias("usuario-b"));
  assert.notEqual(chavePreferencias("a:b"), chavePreferencias("a%3Ab"));
});
test("rosca não mistura séries e categorias com nome especial não viram propriedades de objetos", () => {
  const dados = agruparVisualizacao(
    [projeto(1, { org: "__proto__" }), projeto(2, { org: "__proto__", status: "Concluído" })],
    { ...config(), tipo: "rosca", cruzamento: "status" },
  );
  assert.equal(dados.series.length, 1);
  assert.deepEqual(dados.linhas, [{ name: "__proto__", serie0: 200 }]);
});
