import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { salvarPlanejado } from '../../orcamentoRevisao.server';
import { planejadoDoItem, validarPlanejado, type PlanejadoInput } from '../../lib/orcamentoRevisao';
import { moeda, type ItemOrcamento } from '../../lib/orcamento';
import { ativarFocoMenu } from '../../lib/focoMenu';

export function FormularioPlanejado({ projetoId, metas, item, aoFechar }: {
  projetoId: number; metas: { id: string; name: string }[]; item?: ItemOrcamento; aoFechar: () => void;
}) {
  const query = useQueryClient();
  const [dados, setDados] = useState<PlanejadoInput>(() => item ? planejadoDoItem(item) : {
    metaId: metas.length === 1 ? metas[0].id : null, grupo: '', categoria: '', descricao: '',
    qtd: 1, unidade: 'un', qtdUnidades: 1, valorUnitario: 0, valorProposto: 0,
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const bloqueio = useRef(false);
  const dialogo = useRef<HTMLFormElement>(null);
  const fecharRef = useRef(aoFechar);
  fecharRef.current = aoFechar;
  useEffect(() => dialogo.current ? ativarFocoMenu(dialogo.current, () => {
    if (!bloqueio.current) fecharRef.current();
  }) : undefined, []);
  const alterar = (campo: keyof PlanejadoInput, valor: string | number) => setDados(d => {
    const novo = { ...d, [campo]: valor };
    if (['qtd', 'qtdUnidades', 'valorUnitario'].includes(campo)) {
      novo.valorProposto = Math.round(novo.qtd * novo.qtdUnidades * novo.valorUnitario * 100) / 100;
    }
    return novo;
  });
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bloqueio.current) return;
    const erros = validarPlanejado(dados);
    if (erros.length) { setErro(erros.join(' ')); return; }
    bloqueio.current = true; setSalvando(true); setErro('');
    try {
      await salvarPlanejado({ data: { projetoId, itemId: item?.id ?? null, item: dados,
        anterior: item ? planejadoDoItem(item) : null } });
      await Promise.all(['projetos', 'organizacoes', 'organizacao'].map(key => query.invalidateQueries({ queryKey: [key] })));
      toast.success('Orçamento atualizado.'); aoFechar();
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível atualizar o orçamento.'); }
    finally { bloqueio.current = false; setSalvando(false); }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }}>
    <form ref={dialogo} onSubmit={salvar} role="dialog" data-inova-form="planejado" aria-modal="true" aria-label={item ? 'Editar item do orçamento' : 'Novo item do orçamento'}
      className="bg-card rounded-xl border p-5 w-full max-w-xl max-h-[90dvh] overflow-y-auto flex flex-col gap-3">
      <h2 className="font-semibold">{item ? 'Editar item do orçamento' : 'Novo item do orçamento'}</h2>
      <p className="text-sm">Atualize os valores planejados. Notas, comprovantes e execução são preservados. Uma nova planilha substituirá esta proposta.</p>
      <fieldset disabled={salvando} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm" data-inova-field="Meta">Meta
          <select required value={dados.metaId ?? ''} onChange={e => alterar('metaId', e.target.value)} className="border rounded p-2 bg-card">
            <option value="">Selecione</option>{metas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        {(['grupo', 'categoria', 'descricao', 'unidade'] as const).map((campo, i) => <label key={campo} className="flex flex-col gap-1 text-sm" data-inova-field={['Grupo', 'Categoria', 'Descrição', 'Unidade'][i]}>
          {['Grupo', 'Categoria', 'Descrição', 'Unidade'][i]}
          <input required={campo === 'descricao'} value={dados[campo]} onChange={e => alterar(campo, e.target.value)} className="border rounded p-2 bg-card" />
        </label>)}
        {(['qtd', 'qtdUnidades', 'valorUnitario', 'valorProposto'] as const).map((campo, i) => <label key={campo} className="flex flex-col gap-1 text-sm" data-inova-field={['Quantidade', 'Quantidade de unidades', 'Valor unitário (R$)', 'Total proposto (R$)'][i]}>
          {['Quantidade', 'Quantidade de unidades', 'Valor unitário (R$)', 'Total proposto (R$)'][i]}
          <input required type="number" min="0" step="any" value={Number.isNaN(dados[campo]) ? '' : dados[campo]}
            onChange={e => alterar(campo, e.target.value === '' ? NaN : Number(e.target.value))} className="border rounded p-2 bg-card" />
        </label>)}
      </fieldset>
      <p className="text-sm">Total do item: {moeda(dados.valorProposto)}</p>
      {erro && <p role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>{erro}</p>}
      <div className="flex justify-end gap-3">
        <button type="button" disabled={salvando} onClick={aoFechar}>Cancelar</button>
        <button type="submit" disabled={salvando || metas.length === 0} className="rounded px-3 py-2 text-white" style={{ background: 'var(--primary)' }}>{salvando ? 'Salvando…' : 'Salvar orçamento'}</button>
      </div>
      {metas.length === 0 && <p role="alert">Cadastre uma meta no Plano de Trabalho para vincular o item.</p>}
    </form>
  </div>;
}
