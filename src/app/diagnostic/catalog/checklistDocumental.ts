// Checklist documental do Parecer Técnico (RF-02.D / RF-02.50) — 8 itens fixos.

export interface ChecklistItemCatalogo {
  id: number;
  documento: string;
}

export const CHECKLIST_DOCUMENTAL: ChecklistItemCatalogo[] = [
  { id: 1, documento: 'Estatuto social vigente' },
  { id: 2, documento: 'Ata de eleição/posse da atual diretoria' },
  { id: 3, documento: 'Atas recentes de assembleias/reuniões' },
  { id: 4, documento: 'Cadastro/relação atualizada de associados ou cooperados' },
  { id: 5, documento: 'Planejamento, plano de trabalho ou documento equivalente' },
  { id: 6, documento: 'Prestação de contas aos membros' },
  { id: 7, documento: 'Registros de vendas/operações e repasses aos membros' },
  { id: 8, documento: 'Demonstrativos contábeis/financeiros recentes' },
];
