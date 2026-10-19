import { IEO_DIMENSOES } from "../diagnostic/catalog/ieo";
import { CESTA_BLOCOS } from "../diagnostic/catalog/cestaProdutos";
import { PARECER_GRUPOS } from "../diagnostic/catalog/parecerComplementar";
import { CHECKLIST_DOCUMENTAL } from "../diagnostic/catalog/checklistDocumental";
import {
  MATRIZ_FUNCOES,
  ATUACAO_OPCOES,
  QUEM_EXECUTA_OPCOES,
  INTERESSE_OPCOES,
  CRITICIDADE_OPCOES,
  ABRANGENCIA_OPCOES,
} from "../diagnostic/catalog/matrizFuncional";

const opcoes = (items?: { label: string }[]) =>
  items?.length ? `\nOpções disponíveis: ${items.map((i) => i.label).join("; ")}.` : "";
/** Catálogos canônicos: uma alteração no instrumento atualiza a ajuda automaticamente. */
export const ajudaDiagnostico = {
  ieo: {
    titulo: "IEO",
    fontes: ["src/app/diagnostic/catalog/ieo.ts", "src/app/diagnostic/ieoCalculation.ts"],
    orientacao:
      "Leia o enunciado e selecione o nível de 1 a 4 cuja descrição corresponde à situação observada. Registre evidências na observação; não atribua uma nota apenas para aumentar o índice.",
    campos: Object.fromEntries(
      IEO_DIMENSOES.flatMap((d) =>
        d.subdimensoes.flatMap((s) =>
          s.perguntas.map((p) => [
            p.id,
            `${d.titulo} → ${s.titulo}\n${p.id} — ${p.texto}\nCompare com a situação real:\n${p.niveis.map((n) => `${n.valor}. ${n.descricao}`).join("\n")}\nEscolha o nível sustentado pelos fatos e confira a observação antes de salvar.`,
          ]),
        ),
      ),
    ),
  },
  cesta: {
    titulo: "Cesta de Produtos",
    fontes: ["src/app/diagnostic/catalog/cestaProdutos.ts"],
    orientacao:
      "Preencha um produto ou subproduto por vez. Diferencie informações observadas de características desejadas; confirme opções e unidades antes de salvar.",
    campos: Object.fromEntries(
      CESTA_BLOCOS.flatMap((b) =>
        b.campos.map((c) => [
          c.id,
          `${b.titulo} · ${c.label}\n${c.orientacao ?? "Responda conforme a situação verificada deste produto."}\n${c.tipo === "multipla" ? "Selecione todas as alternativas aplicáveis." : c.tipo === "unica" ? "Selecione uma alternativa." : c.tipo === "numero" ? "Informe o número correspondente à unidade solicitada." : "Descreva a informação solicitada com base em fatos."}${opcoes(c.opcoes)}${c.permiteOutro ? "\nSe usar Outro, preencha o complemento apresentado na tela." : ""}`,
        ]),
      ),
    ),
  },
  parecerDiagnostico: {
    titulo: "Parecer Técnico do diagnóstico",
    fontes: [
      "src/app/diagnostic/catalog/parecerComplementar.ts",
      "src/app/diagnostic/catalog/checklistDocumental.ts",
    ],
    orientacao:
      "Responda as perguntas de caracterização e registre a situação documental. Essas perguntas complementares não recebem pontuação IEO.",
    campos: Object.fromEntries([
      ...PARECER_GRUPOS.flatMap((g) =>
        g.campos.map((c) => [
          c.id,
          `${g.titulo} · ${c.label}\n${c.tipo === "multipla" ? "Marque as alternativas aplicáveis à situação real." : c.tipo === "unica" ? "Escolha a alternativa que corresponde à situação real." : "Descreva como isso funciona na organização e acrescente fatos ou exemplos que sustentem o relato."}${opcoes(c.opcoes)}${c.permiteOutro ? "\nComplete a alternativa Outro quando utilizada." : ""}`,
        ]),
      ),
      ...CHECKLIST_DOCUMENTAL.map((c) => [
        `documento-${c.id}`,
        `${c.documento}\nConfira a existência e a situação do documento conforme as opções exibidas na tela; não declare regularidade que não foi verificada.`,
      ]),
    ]),
  },
  matriz: {
    titulo: "Matriz Funcional",
    fontes: [
      "src/app/diagnostic/catalog/matrizFuncional.ts",
      "src/app/components/diagnostic/MatrizFuncionalTab.tsx",
    ],
    orientacao:
      "Leia a função, descrição e exemplo; depois caracterize a atuação da organização, o interesse, a criticidade, a abrangência e a observação.",
    campos: {
      ...Object.fromEntries(
        MATRIZ_FUNCOES.map((f) => [
          f.id,
          `${f.funcao}\n${f.descricao}\nExemplo de referência do instrumento: ${f.exemplo}\nPreencha a atuação real da organização, sem copiar o exemplo como se fosse um fato observado.`,
        ]),
      ),
      Atuação: `Seleção múltipla: ${ATUACAO_OPCOES.join("; ")}. Descreva a situação atual da organização na função.`,
      "Quem executa": `Aplica-se quando a organização marca Não realiza. Opções: ${QUEM_EXECUTA_OPCOES.join("; ")}.`,
      Interesse: `Selecione a alternativa aplicável: ${INTERESSE_OPCOES.join("; ")}.`,
      Criticidade: CRITICIDADE_OPCOES.map((o) => `${o.label}: ${o.descricao}`).join("\n"),
      Abrangência: ABRANGENCIA_OPCOES.map((o) => `${o.label}: ${o.descricao}`).join("\n"),
      Observações: "Registre os fatos que contextualizam a resposta e as evidências disponíveis.",
    } as Record<string, string>,
  },
};
