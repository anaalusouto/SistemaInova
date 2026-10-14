import { createServerFn } from '@tanstack/react-start';
import { camposPlanejados, validarPlanejado, type PlanejadoInput } from './lib/orcamentoRevisao';
import { chaveDeOrigem } from './lib/orcamento';

export const salvarPlanejado = createServerFn({ method: 'POST' })
  .validator((d: { projetoId: number; itemId: string | null; item: PlanejadoInput; anterior: PlanejadoInput | null }) => d)
  .handler(async ({ data }): Promise<void> => {
    const { exigirEscrita } = await import('./sessao.server');
    const sessao = await exigirEscrita();
    const problemas = validarPlanejado(data.item);
    if (problemas.length) throw new Error(problemas.join(' '));
    const { supabaseAdmin: db } = await import('../integrations/supabase/client.server');
    const { data: rows, error } = await db.from('orcamento_itens').select('*')
      .eq('projeto_id', data.projetoId).eq('vigente', true).order('id');
    if (error) throw new Error(`Não foi possível ler o orçamento. Verifique a migração 0022. ${error.message}`);
    const existentes = rows ?? [];
    const campos = camposPlanejados(data.item);
    if (data.itemId) {
      const atual = existentes.find(i => i.id === data.itemId);
      if (!atual) throw new Error('Item não pertence ao orçamento vigente deste projeto.');
      const atualPlanejado = camposPlanejados({ metaId: atual.meta_id ?? null, grupo: atual.grupo ?? '',
        categoria: atual.categoria ?? '', descricao: atual.item ?? '', qtd: Number(atual.qtd ?? 0),
        unidade: atual.unidade ?? '', qtdUnidades: Number(atual.qtd_unidades ?? 0),
        valorUnitario: Number(atual.valor_unitario ?? 0), valorProposto: Number(atual.valor_proposto ?? 0) });
      const anterior = data.anterior && camposPlanejados(data.anterior);
      if (!anterior || (Object.keys(anterior) as (keyof typeof atualPlanejado)[]).some(k => atualPlanejado[k] !== anterior[k])) {
        throw new Error('Este item foi alterado. Reabra a edição para carregar os valores atuais.');
      }
    }
    if (existentes.some(i => i.id !== data.itemId && i.chave_origem === campos.chave_origem)) {
      throw new Error('Já existe um item com este grupo, categoria e descrição. Edite o item existente.');
    }
    const itens = [...existentes].sort((a, b) => Number(a.ordem) - Number(b.ordem) || a.id.localeCompare(b.id)).map(i => ({ id: i.id, meta_id: i.meta_id, grupo: i.grupo ?? '',
      categoria: i.categoria ?? '', item: i.item ?? '', qtd: Number(i.qtd ?? 0), unidade: i.unidade ?? '',
      qtd_unidades: Number(i.qtd_unidades ?? 0), valor_unitario: Number(i.valor_unitario ?? 0),
      valor_proposto: Number(i.valor_proposto ?? 0), chave_origem: i.chave_origem || chaveDeOrigem(i.grupo ?? '', i.categoria ?? '', i.item ?? ''),
      ...(i.id === data.itemId ? campos : {}),
    }));
    if (!data.itemId) itens.push({ id: null, ...campos });
    const { error: falha } = await db.rpc('salvar_versao_orcamento', {
      p_projeto: data.projetoId, p_antes: existentes, p_itens: itens, p_autor: sessao.displayName,
    });
    if (falha) throw new Error(`Não foi possível salvar o orçamento. Verifique a migração 0022. ${falha.message}`);
  });
