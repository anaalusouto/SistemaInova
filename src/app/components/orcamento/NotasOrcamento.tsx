/**
 * Notas fiscais do projeto e o comparativo Executado × Proposto (RF04.3).
 *
 * O comparativo usa o executado das NOTAS (todas, com ou sem item) contra o
 * proposto do projeto — o da planilha quando houver itens, senão o valor
 * aprovado do cadastro. É o mesmo par de números do cabeçalho do projeto.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  moeda, moedaComSinal, arredondar, percentualExecutado, NAO_INFORMADO,
  type ItemOrcamento, type NotaOrcamento,
} from '../../lib/orcamento';
import { ConfirmarExclusao } from '../plano/camposFormulario';

export function ComparativoExecucao({
  proposto, executado, notas,
}: { proposto: number | null; executado: number | null; notas: NotaOrcamento[] }) {
  const pct = percentualExecutado(executado, proposto);
  const acima = pct !== null && pct > 100;
  const saldo = executado === null || proposto === null ? null : arredondar(proposto - executado);
  const semComprovante = notas.filter(n => !n.anexo).length;

  return (
    <div className="bg-card rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Numero rotulo="Valor proposto" valor={moeda(proposto)} />
        <Numero
          rotulo="Valor executado"
          valor={moeda(executado)}
          nota={notas.length ? `${notas.length} ${notas.length === 1 ? 'nota' : 'notas'}${semComprovante ? ` · ${semComprovante} sem comprovante` : ''}` : 'nenhuma nota lançada'}
        />
        <Numero
          rotulo="Proposto − executado"
          valor={moedaComSinal(saldo)}
          cor={saldo === null ? undefined : saldo < 0 ? 'var(--danger)' : 'var(--success)'}
          nota={acima ? 'execução acima do proposto' : undefined}
        />
      </div>
      <div>
        <div className="flex items-center justify-between" style={{ fontSize: '0.7rem', color: 'var(--ink-4)', marginBottom: 4 }}>
          <span>Executado / proposto</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: acima ? 'var(--danger)' : 'var(--ink-2)' }}>
            {pct === null ? NAO_INFORMADO : `${pct.toLocaleString('pt-BR')}%`}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--surface-2)' }}
          role="progressbar"
          aria-label="Executado em relação ao proposto"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct === null ? undefined : Math.min(pct, 100)}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(pct ?? 0, 100)}%`, background: acima ? 'var(--danger)' : 'var(--brand)' }}
          />
        </div>
      </div>
    </div>
  );
}

function Numero({ rotulo, valor, nota, cor }: { rotulo: string; valor: string; nota?: string; cor?: string }) {
  const ausente = valor === NAO_INFORMADO || valor === '—';
  return (
    <div className="min-w-0">
      <div style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{rotulo}</div>
      <div
        className="truncate"
        style={{
          fontSize: ausente ? '0.9rem' : '1.05rem', fontWeight: 700, marginTop: 3,
          fontFamily: ausente ? undefined : 'var(--font-mono)', fontStyle: ausente ? 'italic' : undefined,
          color: ausente ? 'var(--ink-5)' : cor ?? 'var(--ink-1)',
        }}
      >
        {valor}
      </div>
      {nota && <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{nota}</div>}
    </div>
  );
}

export function ListaNotas({
  notas, itens, aoNovaNota, aoAbrirNota,
}: {
  notas: NotaOrcamento[];
  itens: ItemOrcamento[];
  aoNovaNota: () => void;
  aoAbrirNota: (n: NotaOrcamento) => void;
}) {
  const { deleteNota } = useStore();
  const { readOnly } = useAuth();
  const [excluindo, setExcluindo] = useState<NotaOrcamento | null>(null);
  const nomeItem = new Map(itens.map(i => [i.id, i.descricao]));

  const confirmar = async () => {
    const alvo = excluindo;
    setExcluindo(null);
    if (!alvo) return;
    try {
      await deleteNota(alvo.id);
      toast.success('Nota excluída.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível excluir a nota.');
    }
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b flex-wrap" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <Receipt size={14} color="var(--ink-4)" />
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.86rem', color: 'var(--ink-1)' }}>
            Notas fiscais e comprovantes
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>{notas.length}</span>
        </div>
        {!readOnly && (
          <button
            onClick={aoNovaNota}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={13} /> Nova nota
          </button>
        )}
      </div>

      {notas.length === 0 ? (
        <div className="px-3 py-6 text-center" style={{ fontSize: '0.8rem', color: 'var(--ink-5)' }}>
          Nenhuma nota lançada neste projeto.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 720 }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Data', 'Nº', 'Fornecedor', 'Item do orçamento', 'Valor', 'Comprovante', ''].map(c => (
                  <th
                    key={c}
                    className="text-left px-3 py-1.5"
                    style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid var(--border)' }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notas.map(n => (
                <tr key={n.id} style={{ borderBottom: '1px solid var(--line-1)' }}>
                  <td className="px-3 py-1.5" style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                    {formatDateOnly(n.dataEmissao)}
                  </td>
                  <td className="px-3 py-1.5" style={{ fontSize: '0.74rem', color: n.numero ? 'var(--ink-2)' : 'var(--ink-5)' }}>{n.numero ?? '—'}</td>
                  <td className="px-3 py-1.5" style={{ fontSize: '0.74rem', color: 'var(--ink-2)', maxWidth: 200 }}>
                    <span className="block truncate" title={n.fornecedor ?? undefined}>{n.fornecedor ?? <span style={{ color: 'var(--ink-5)' }}>—</span>}</span>
                  </td>
                  <td className="px-3 py-1.5" style={{ fontSize: '0.74rem', maxWidth: 240 }}>
                    {n.itemId
                      ? <span className="block truncate" style={{ color: 'var(--ink-2)' }} title={nomeItem.get(n.itemId)}>{nomeItem.get(n.itemId) ?? 'Item removido'}</span>
                      : <span style={{ color: 'var(--ink-5)', fontStyle: 'italic' }}>Sem item</span>}
                  </td>
                  <td className="px-3 py-1.5" style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-1)', whiteSpace: 'nowrap' }}>
                    {moeda(n.valor)}
                  </td>
                  <td className="px-3 py-1.5" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                    {n.anexo
                      ? <span className="inline-flex items-center gap-1" style={{ color: 'var(--ink-3)' }}><Paperclip size={11} /> anexado</span>
                      : <span style={{ color: 'var(--warning)', fontWeight: 600 }}>sem comprovante</span>}
                  </td>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    <span className="flex items-center gap-1 justify-end">
                      <button onClick={() => aoAbrirNota(n)} aria-label={readOnly ? 'Ver nota' : 'Editar nota'} className="p-1 rounded hover:bg-accent">
                        <Pencil size={12} color="var(--ink-4)" />
                      </button>
                      {!readOnly && (
                        <button onClick={() => setExcluindo(n)} aria-label="Excluir nota" className="p-1 rounded hover:bg-accent">
                          <Trash2 size={12} color="var(--danger)" />
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir esta nota?"
          descricao={`${excluindo.numero ? `NF ${excluindo.numero}` : 'Nota sem número'} · ${moeda(excluindo.valor)}. O valor sai do executado${excluindo.itemId ? ' do item e' : ''} do projeto${excluindo.anexo ? ', e o comprovante anexado é apagado' : ''}.${excluindo.itemId ? ' A exclusão fica no histórico do item.' : ''}`}
          aoCancelar={() => setExcluindo(null)}
          aoConfirmar={() => void confirmar()}
        />
      )}
    </div>
  );
}
