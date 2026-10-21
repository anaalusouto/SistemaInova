export type NivelPlano = 'meta' | 'etapa' | 'atividade';
export interface ItemOrdemPlano { id: string; order: number }
export interface ReordenarPlanoInput {
  nivel: NivelPlano;
  paiId: string | number;
  antes: ItemOrdemPlano[];
  ids: string[];
}
export interface MoverEtapaInput {
  projetoId: number;
  etapaId: string;
  origemId: string;
  destinoId: string;
  posicao: number;
  antesOrigem: ItemOrdemPlano[];
  antesDestino: ItemOrdemPlano[];
}
export function validarMovimentoEtapa(d: MoverEtapaInput): void {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!d || !Number.isSafeInteger(d.projetoId) || d.projetoId <= 0 || ![d.etapaId,d.origemId,d.destinoId].every(id => typeof id === 'string' && uuid.test(id)) || d.origemId === d.destinoId)
    throw new Error('Escolha a etapa e outra meta do mesmo projeto.');
  for (const lista of [d.antesOrigem,d.antesDestino]) {
    if (!Array.isArray(lista) || lista.some(i => !i || !uuid.test(i.id) || !Number.isFinite(i.order)) || new Set(lista.map(i => i.id)).size !== lista.length)
      throw new Error('Atualize a estrutura antes de mover a etapa.');
  }
  if (!d.antesOrigem.some(i => i.id === d.etapaId) || d.antesDestino.some(i => i.id === d.etapaId) || !Number.isInteger(d.posicao) || d.posicao < 1 || d.posicao > d.antesDestino.length + 1)
    throw new Error('Posição ou origem da etapa inválida.');
}

export function moverParaPosicao(lista: readonly ItemOrdemPlano[], id: string, posicao: number): string[] {
  const atual = lista.findIndex(i => i.id === id);
  if (atual < 0 || !Number.isInteger(posicao) || posicao < 1 || posicao > lista.length) throw new Error('Posição inválida.');
  const ids = lista.map(i => i.id);
  ids.splice(atual, 1);
  ids.splice(posicao - 1, 0, id);
  return ids;
}

export function validarReordenacao(d: ReordenarPlanoInput): void {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!d || !['meta', 'etapa', 'atividade'].includes(d.nivel)) throw new Error('Nível do plano inválido.');
  if (d.nivel === 'meta' ? !Number.isSafeInteger(d.paiId) || Number(d.paiId) <= 0 : typeof d.paiId !== 'string' || !uuid.test(d.paiId)) throw new Error('Vínculo de origem inválido.');
  if (!Array.isArray(d.antes) || !Array.isArray(d.ids) || !d.ids.length || d.antes.length !== d.ids.length) throw new Error('Informe a lista completa de itens.');
  if (d.antes.some(i => !i || typeof i.id !== 'string' || !uuid.test(i.id) || typeof i.order !== 'number' || !Number.isFinite(i.order)) || d.ids.some(id => typeof id !== 'string' || !uuid.test(id))) throw new Error('Item ou índice inválido.');
  const antes = new Set(d.antes.map(i => i.id));
  if (antes.size !== d.antes.length || new Set(d.ids).size !== d.ids.length || d.ids.some(id => !antes.has(id))) throw new Error('A reordenação deve manter os mesmos itens, sem duplicações.');
}
