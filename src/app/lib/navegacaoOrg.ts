/**
 * Navegação centrada na Organização (alteracoes-inova.pptx, 29/09/2026).
 *
 * A organização é o hub: o menu lateral abre, embaixo dela, as seções e os
 * projetos dela; o cabeçalho da organização fica fixo e só o conteúdo muda.
 * O menu "Projetos" saiu — projeto se acessa pela organização.
 */

export type SecaoOrg = 'dados' | 'projetos' | 'projeto' | 'encaminhamentos' | 'registros' | 'mapeamento' | 'parecer';

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

export const SECOES_ORG: { id: Exclude<SecaoOrg, 'projeto'>; rotulo: string; emConstrucao?: boolean }[] = [
  { id: 'dados', rotulo: 'Dados cadastrais' },
  { id: 'projetos', rotulo: 'Projeto' },
  { id: 'encaminhamentos', rotulo: 'Encaminhamentos e notas' },
  { id: 'registros', rotulo: 'Registros de contato' },
  { id: 'mapeamento', rotulo: 'Mapeamento', emConstrucao: true },
  { id: 'parecer', rotulo: 'Parecer', emConstrucao: true },
];

/**
 * Nome de exibição padronizado pelas abreviações já usadas nos projetos.
 * O nome completo cadastrado no banco continua preservado.
 */
const chaveNome = (nome: string) => nome.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
const ABREVIACOES = new Map([
  ['ADESC/PA', 'ADESC'],
  ['ATRT', 'TAUARI'],
  ['COPASMIG', 'COOPASMIG'],
  ['CAANP-AGROMEL', 'CAANP AGROMEL'],
  ['CAANP-AGROMEL (2ª rota)', 'CAANP AGROMEL'],
  ['Associação Mulheres Indígenas do Gurupi', 'AMIG'],
  ['Associação Mebengokre Yte Kayapo', 'MEBENKOKRE'],
  ['Associação Indígena Riktikô "Ronkô"', 'RIKTIKO'],
  ['Turiwara-Ka\'i', 'TURIWARA-KA\'I'],
  ['Nova Betel', 'NOVA BETEL'],
].map(([nome, sigla]) => [chaveNome(nome), sigla]));

export function nomeCurtoOrg(nome: string): string {
  const conhecida = ABREVIACOES.get(chaveNome(nome));
  if (conhecida) return conhecida;
  const sigla = nome.match(/\(([^()]+)\)\s*$/)?.[1]?.trim();
  const curto = sigla || nome.split(/\s+[—–-]\s+/)[0].trim() || nome;
  return ABREVIACOES.get(chaveNome(curto)) ?? curto;
}
