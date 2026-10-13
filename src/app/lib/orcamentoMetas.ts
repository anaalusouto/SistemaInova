import type { LinhaLida } from './orcamentoPlanilha';

export interface MetaDoOrcamento { id: string; nome: string; numero: number }
export interface VinculoMeta { linhaPlanilha: number; metaId: string | null; metaNome: string | null; criarMeta: string | null; motivo: string | null }
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const chaveMetaNova = (nome: string) => {
  const referencia = normalizar(nome);
  const numero = referencia.match(/^meta\s*(\d+)(?:\s|[-.:–—]|$)/);
  return numero ? `meta:${Number(numero[1])}` : referencia;
};

export function vincularMetasDoOrcamento(itens: LinhaLida[], metas: MetaDoOrcamento[], escolhas: Record<string, string> = {}): VinculoMeta[] {
  const vinculos = itens.map(item => {
    const manual = escolhas[String(item.linhaPlanilha)];
    const original = (item.metaReferencia ?? item.grupo).trim();
    const referencia = normalizar(original);
    let candidatas: MetaDoOrcamento[];
    if (manual) candidatas = metas.filter(m => m.id === manual);
    else {
      candidatas = referencia ? metas.filter(m => normalizar(m.nome) === referencia || normalizar(m.id) === referencia) : [];
      if (!candidatas.length && referencia) {
        const numero = referencia.match(/^(?:meta\s*)?(\d+)(?:\s|[-.:–—]|$)/);
        if (numero) candidatas = metas.filter(m => m.numero === Number(numero[1]));
      }
      if (!referencia && metas.length === 1) candidatas = metas;
    }
    const meta = candidatas.length === 1 ? candidatas[0] : null;
    const criarMeta = !manual && !candidatas.length && original &&
      !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(original) &&
      (item.metaReferencia !== undefined || /^meta\s*\d+/i.test(original)) ? original : null;
    return { linhaPlanilha: item.linhaPlanilha, metaId: meta?.id ?? null,
      metaNome: meta ? `Meta ${meta.numero} — ${meta.nome}` : criarMeta,
      criarMeta,
      motivo: meta || criarMeta ? null : manual ? 'A meta selecionada não pertence a este projeto.' : candidatas.length > 1 ? 'Mais de uma meta corresponde à referência; selecione a correta.' : 'Meta não identificada na planilha; selecione a meta antes de importar.',
    };
  });
  const nomesPorChave = new Map<string, Set<string>>();
  for (const v of vinculos) if (v.criarMeta) {
    const chave = chaveMetaNova(v.criarMeta);
    const nomes = nomesPorChave.get(chave) ?? new Set<string>();
    nomes.add(normalizar(v.criarMeta)); nomesPorChave.set(chave, nomes);
  }
  for (const v of vinculos) if (v.criarMeta && (nomesPorChave.get(chaveMetaNova(v.criarMeta))?.size ?? 0) > 1) {
    v.motivo = 'A planilha indica nomes diferentes para o mesmo número de meta. Corrija a referência ou selecione uma meta existente.';
  }
  return vinculos;
}
