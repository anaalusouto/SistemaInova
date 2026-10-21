/** Remove só o prefixo de hierarquia na exibição. Não altera o título salvo. */
export function tituloSemNumeroLegado(nome: string, tipo: 'meta' | 'etapa' | 'atividade' | 'tarefa'): string {
  const niveis = { meta: 1, etapa: 2, atividade: 3, tarefa: 4 };
  const numero = `\\d{1,3}(?:\\.\\d+){${niveis[tipo] - 1}}`;
  const prefixo = new RegExp(`^(?:${tipo}\\s+)?${numero}(?:\\s*[-–—:]\\s*|[.)]?\\s+)(\\S[\\s\\S]*)$`, 'i');
  return nome.trim().match(prefixo)?.[1] ?? nome;
}
