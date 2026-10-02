/**
 * Navegação centrada na Organização (alteracoes-inova.pptx, 29/09/2026).
 *
 * A organização é o hub: o menu lateral abre, embaixo dela, as seções e os
 * projetos dela; o cabeçalho da organização fica fixo e só o conteúdo muda.
 * O menu "Projetos" saiu — projeto se acessa pela organização.
 */

export type SecaoOrg = 'dados' | 'projetos' | 'projeto' | 'encaminhamentos' | 'registros';

export interface RotaOrg {
  /** null = lista de organizações. */
  orgId: string | null;
  secao: SecaoOrg;
  /** Só na seção 'projeto'. */
  projetoId: number | null;
  /**
   * Registro de contato em foco, na navegação cruzada registro ⇄
   * encaminhamento (destaca o item ao chegar).
   */
  foco?: string | null;
}

export const ROTA_INICIO: RotaOrg = { orgId: null, secao: 'dados', projetoId: null };

export const SECOES_ORG: { id: Exclude<SecaoOrg, 'projeto'>; rotulo: string }[] = [
  { id: 'dados', rotulo: 'Dados cadastrais' },
  { id: 'projetos', rotulo: 'Projeto' },
  { id: 'encaminhamentos', rotulo: 'Encaminhamentos e notas' },
  { id: 'registros', rotulo: 'Registros de contato' },
];

/**
 * Nome curto para o menu: a sigla entre parênteses quando houver
 * ("Cooperativa … (COOPAVISEU)" → "COOPAVISEU"), senão o nome até o travessão
 * ("ACREPAF — Jacundá" → "ACREPAF").
 */
export function nomeCurtoOrg(nome: string): string {
  const sigla = nome.match(/\(([^()]+)\)\s*$/)?.[1]?.trim();
  if (sigla) return sigla;
  return nome.split(/\s+[—–-]\s+/)[0].trim() || nome;
}
