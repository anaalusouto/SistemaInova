import type { DiagnosticoResumo } from '../diagnosticos.server';

/** A versão atual segue a data de aplicação; editar uma versão antiga não a torna atual. */
export function diagnosticoAtual(diagnosticos: readonly DiagnosticoResumo[], comunidadeId: string): DiagnosticoResumo | null {
  return diagnosticos.filter(d => d.comunidadeId === comunidadeId).sort((a,b) =>
    b.dataAplicacao.localeCompare(a.dataAplicacao) || b.versao-a.versao ||
    b.criadoEm.localeCompare(a.criadoEm) || a.id.localeCompare(b.id),
  )[0] ?? null;
}
