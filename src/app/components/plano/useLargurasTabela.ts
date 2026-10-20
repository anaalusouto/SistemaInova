import { useRef, useState, type HTMLAttributes } from "react";
import type { ColunaPlano } from "../../lib/formatoPlano";

type Larguras = Partial<Record<ColunaPlano, number>>;
const MIN = 40;
const MAX = 1200;
const minimo = (coluna: ColunaPlano) => coluna === "Atividade" ? 160 : MIN;
const limitar = (n: number, coluna: ColunaPlano) => Math.round(Math.max(minimo(coluna), Math.min(MAX, n)));
export const larguraInicialColuna = (c: ColunaPlano) => {
  if (c === "Atividade") return 260;
  if (c === "Observações / resultado esperado") return 220;
  if (c === "Justificativa de atraso") return 200;
  if (c === "Responsável" || c === "Vínculo orçamentário") return 140;
  if (c === "Status" || c === "Nível risco") return 130;
  if (c === "Progresso (%)") return 100;
  if (c === "Anexo") return 90;
  return 110;
};

/** Congela as medidas atuais ao iniciar o arraste: só a coluna escolhida muda. */
export function useLargurasTabela(colunas: readonly ColunaPlano[]) {
  const tabelaRef = useRef<HTMLTableElement>(null);
  const [larguras, setLarguras] = useState<Larguras | null>(null);
  const arraste = useRef<{
    coluna: ColunaPlano; x: number; base: Larguras; anterior: Larguras | null;
  } | null>(null);
  const medir = (): Larguras => Object.fromEntries(colunas.map((c, i) => [
    c, tabelaRef.current?.tHead?.rows[0]?.cells[i]?.getBoundingClientRect().width ?? MIN,
  ]));
  const cancelar = () => {
    if (arraste.current) setLarguras(arraste.current.anterior);
    arraste.current = null;
  };
  const controles = (coluna: ColunaPlano): HTMLAttributes<HTMLDivElement> => ({
    role: "separator",
    tabIndex: 0,
    "aria-label": `Redimensionar coluna ${coluna}`,
    "aria-orientation": "vertical",
    "aria-valuemin": minimo(coluna),
    "aria-valuemax": MAX,
    "aria-valuenow": larguras?.[coluna] === undefined ? undefined : Math.round(larguras[coluna]!),
    title: "Arraste para ajustar a largura. Use ← e → pelo teclado.",
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const base = medir();
      arraste.current = { coluna, x: e.clientX, base, anterior: larguras };
      setLarguras(base);
    },
    onPointerMove: (e) => {
      const atual = arraste.current;
      if (!atual || atual.coluna !== coluna) return;
      setLarguras({ ...atual.base, [coluna]: limitar((atual.base[coluna] ?? MIN) + e.clientX - atual.x, coluna) });
    },
    onPointerUp: () => { arraste.current = null; },
    onPointerCancel: cancelar,
    onLostPointerCapture: () => { arraste.current = null; },
    onKeyDown: (e) => {
      if (e.key === "Escape") { cancelar(); return; }
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const base = medir();
      const passo = e.shiftKey ? 40 : 16;
      const valor = e.key === "Home" ? minimo(coluna) : e.key === "End" ? MAX
        : (base[coluna] ?? MIN) + (e.key === "ArrowLeft" ? -passo : passo);
      setLarguras({ ...base, [coluna]: limitar(valor, coluna) });
    },
  });
  return {
    tabelaRef, larguras, controles,
    larguraInicialTotal: colunas.reduce((s, c) => s + larguraInicialColuna(c), 0),
    larguraTotal: larguras ? colunas.reduce((s, c) => s + (larguras[c] ?? MIN), 0) : undefined,
    restaurar: () => { arraste.current = null; setLarguras(null); },
  };
}
