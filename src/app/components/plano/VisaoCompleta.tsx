import { ArrowUp, ArrowDown } from 'lucide-react';
import type { OrdemCamposPlano, RegistroPlano } from '../../lib/planoRelatorio';

export function VisaoCompleta({ registros, ordem, aoOrdenar }: {
  registros: RegistroPlano[]; ordem?: OrdemCamposPlano; aoOrdenar?: (ordem: OrdemCamposPlano) => void;
}) {
  const mover = (r: RegistroPlano, indice: number, delta: number) => {
    const chaves = r.campos.map(c => c.chave);
    [chaves[indice], chaves[indice + delta]] = [chaves[indice + delta], chaves[indice]];
    aoOrdenar?.({ ...ordem, [r.tipo]: chaves });
  };
  return <div className="space-y-4 p-4">
    {aoOrdenar && <p className="text-sm print:hidden">Todos os campos estão visíveis. Use as setas para mudar a ordem dos campos do mesmo tipo de registro; a exportação acompanha essa ordem.</p>}
    {registros.length === 0 && <p className="text-sm">Nenhum registro cadastrado nas seções selecionadas.</p>}
    {registros.map(r => <section key={`${r.tipo}-${r.id}`} className="border rounded-lg p-3" style={{ borderColor: 'var(--border)', breakInside: 'avoid' }}>
      <h3 className="font-semibold text-sm mb-2">{r.titulo}</h3>
      <p className="text-xs mb-2" style={{ color: 'var(--ink-4)' }}>{r.campos.filter(c => c.preenchido).length} de {r.campos.length} campos preenchidos</p>
      <dl className="space-y-2">{r.campos.map((c, i) => <div key={c.chave} className="flex gap-3 items-start">
        {aoOrdenar && <div className="flex shrink-0 print:hidden">
          <button type="button" disabled={i === 0} onClick={() => mover(r, i, -1)} aria-label={`Mover ${c.rotulo} para cima`} className="p-1 disabled:opacity-30"><ArrowUp size={13} /></button>
          <button type="button" disabled={i === r.campos.length - 1} onClick={() => mover(r, i, 1)} aria-label={`Mover ${c.rotulo} para baixo`} className="p-1 disabled:opacity-30"><ArrowDown size={13} /></button>
        </div>}
        <div className="min-w-0 text-sm"><dt className="font-medium">{c.rotulo}</dt><dd className="whitespace-pre-wrap break-words" style={{ color: c.preenchido ? 'var(--ink-2)' : 'var(--ink-5)' }}>{c.valor}</dd></div>
      </div>)}</dl>
    </section>)}
  </div>;
}
