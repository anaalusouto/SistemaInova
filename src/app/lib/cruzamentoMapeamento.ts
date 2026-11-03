import type { ProjectExt } from '../store';
import { conclusaoEtapas } from './resumoPlanoPortfolio';

export interface NotaMapeamentoGrafico { organizacaoId: string; diagnosticoId: string; nota: number | null; parcial: boolean; dataAplicacao: string; versao: number; ieoAguardandoReavaliacao?: boolean }

export function pontosMapeamento(projetos: ProjectExt[], notas: NotaMapeamentoGrafico[], eixo: 'etapas' | 'orcamento') {
  const porOrganizacao = new Map(notas.map(n => [n.organizacaoId, n]));
  return projetos.flatMap(p => {
    const nota = p.organizacao?.id ? porOrganizacao.get(p.organizacao.id) : undefined;
    const conclusao = conclusaoEtapas(p);
    const percentualFinanceiro = p.budgetApprovedInformado !== false && p.budgetExecutedInformado !== false && p.budgetApproved > 0 && Number.isFinite(p.budgetExecuted) ? p.budgetExecuted / p.budgetApproved * 100 : null;
    const y = eixo === 'etapas' ? conclusao.percentual : percentualFinanceiro;
    if (nota?.nota == null || !Number.isFinite(nota.nota) || nota.nota < 1 || nota.nota > 4 || y === null) return [];
    return [{
      id: p.id,
      name: `${p.code} · ${p.name}`,
      projeto: `${p.code} · ${p.name}`,
      organizacao: p.organizacao?.nome || p.org || 'Não informado',
      organizacaoId: p.organizacao?.id ?? null,
      x: nota.nota,
      y,
      diagnosticoId: nota.diagnosticoId,
      dataAplicacao: nota.dataAplicacao,
      versao: nota.versao,
      parcial: nota.parcial,
      etapasConcluidas: conclusao.concluidas,
      etapasTotal: conclusao.total,
      percentualEtapas: conclusao.percentual,
      valorAprovado: p.budgetApprovedInformado === false ? null : p.budgetApproved,
      valorExecutado: p.budgetExecutedInformado === false ? null : p.budgetExecuted,
      percentualFinanceiro,
    }];
  });
}
