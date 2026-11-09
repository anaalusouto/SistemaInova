import type { DiagnosticoResumo } from '../diagnosticos.server';

/** Prioriza a última versão em edição; na ausência, a última concluída. */
export function diagnosticoAtual(diagnosticos: readonly DiagnosticoResumo[], comunidadeId: string): DiagnosticoResumo | null {
  return diagnosticos.filter(d => d.comunidadeId === comunidadeId).sort((a,b) =>
    Number(b.status === 'em_edicao') - Number(a.status === 'em_edicao') || b.versao-a.versao ||
    b.dataAplicacao.localeCompare(a.dataAplicacao) ||
    b.criadoEm.localeCompare(a.criadoEm) || a.id.localeCompare(b.id),
  )[0] ?? null;
}
