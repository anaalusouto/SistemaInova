import { IEO_DIMENSOES } from './catalog/ieo';

/**
 * Cálculo do IEO — implementação isolada e deliberadamente simples: score de
 * cada dimensão é a média dos níveis (1-4) respondidos nas perguntas daquela
 * dimensão; perguntas sem resposta são ignoradas (não contam como 0). Geral =
 * média das dimensões que têm ao menos uma resposta.
 *
 * A metodologia oficial de ponderação/agregação ainda não está validada (ver
 * RF-02) — trocar a fórmula depois é editar só este arquivo.
 */
export interface IeoResultadoDimensao {
  dimensaoId: string;
  dimensaoTitulo: string;
  media: number | null;
  respondidas: number;
  total: number;
}

export interface IeoResultado {
  geral: number | null;
  porDimensao: IeoResultadoDimensao[];
}

export function calcularIeo(respostas: { perguntaId: string; nivel: number }[]): IeoResultado {
  const nivelPorPergunta = new Map(respostas.map(r => [r.perguntaId, r.nivel]));

  const porDimensao: IeoResultadoDimensao[] = IEO_DIMENSOES.map(d => {
    const perguntas = d.subdimensoes.flatMap(s => s.perguntas);
    const niveis = perguntas.map(p => nivelPorPergunta.get(p.id)).filter((n): n is number => typeof n === 'number');
    const media = niveis.length > 0 ? niveis.reduce((a, b) => a + b, 0) / niveis.length : null;
    return { dimensaoId: d.id, dimensaoTitulo: d.titulo, media, respondidas: niveis.length, total: perguntas.length };
  });

  const dimensoesComMedia = porDimensao.filter(d => d.media != null).map(d => d.media as number);
  const geral = dimensoesComMedia.length > 0 ? dimensoesComMedia.reduce((a, b) => a + b, 0) / dimensoesComMedia.length : null;

  return { geral, porDimensao };
}
