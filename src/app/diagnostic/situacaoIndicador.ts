import type { ValoresCaderno } from './cadernoCria';

/** Um registro vazio é pendente; a ausência de registro é informada separadamente. */
export function situacaoIndicador(resposta?: Pick<ValoresCaderno, 'valor'>) {
  const valor = resposta?.valor;
  if (!resposta) return { texto: 'Ausente', simbolo: '—' };
  if (valor == null || valor === '') return { texto: 'Pendente', simbolo: '?' };
  if (/^[1-4]$/.test(valor)) return { texto: `Nível ${valor} registrado`, simbolo: valor };
  const especiais: Record<string, { texto: string; simbolo: string }> = {
    NA: { texto: 'Não aplicável', simbolo: 'N/A' },
    NC: { texto: 'Não coletado', simbolo: 'NC' },
    NS: { texto: 'Não sabe informar', simbolo: 'NS' },
    D: { texto: 'Divergência registrada', simbolo: 'D' },
    H: { texto: 'Práticas heterogêneas', simbolo: 'H' },
  };
  return especiais[valor] ?? { texto: 'Valor não reconhecido · conferir', simbolo: '?' };
}
