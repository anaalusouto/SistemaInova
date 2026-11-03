import type { ProjectExt } from '../store';
import { conclusaoEtapas } from './resumoPlanoPortfolio';

export interface NotaMapeamentoGrafico { organizacaoId: string; diagnosticoId: string; nota: number | null; parcial: boolean; dataAplicacao: string; versao: number }

export function pontosMapeamento(projetos: ProjectExt[], notas: NotaMapeamentoGrafico[], eixo: 'etapas' | 'orcamento') {
  const porOrganizacao = new Map(notas.map(n => [n.organizacaoId, n]));
  return projetos.flatMap(p => {
    const nota = p.organizacao?.id ? porOrganizacao.get(p.organizacao.id) : undefined;
    const y = eixo === 'etapas' ? conclusaoEtapas(p).percentual
      : Number.isFinite(p.budgetApproved) && p.budgetApproved > 0 && Number.isFinite(p.budgetExecuted) ? p.budgetExecuted / p.budgetApproved * 100 : null;
    if (nota?.nota == null || !Number.isFinite(nota.nota) || nota.nota < 1 || nota.nota > 4 || y === null) return [];
    return [{ id: p.id, name: `${p.org || p.organizacao!.nome} · ${p.code}`, x: nota.nota, y, diagnosticoId: nota.diagnosticoId, dataAplicacao: nota.dataAplicacao, versao: nota.versao, parcial: nota.parcial }];
  });
}
