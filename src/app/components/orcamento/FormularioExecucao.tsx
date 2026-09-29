/**
 * Execução de um item (RF-030, RF-039, RF04.3).
 *
 * Desde a 0016 o executado do item é a soma das notas dele — não se digita.
 * Aqui a pessoa vê as notas, lança uma nova, marca a execução como concluída
 * e escreve a justificativa quando ela é exigida: soma acima do proposto, ou
 * item concluído com soma diferente do proposto (exigeJustificativa).
 *
 * Os dados planejados aparecem só para leitura (RF-030).
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Paperclip, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  moeda, moedaComSinal, arredondar, exigeJustificativa, somaDasNotas,
  type ItemOrcamento, type NotaOrcamento,
} from '../../lib/orcamento';
import { Campo, AreaTexto, Erros, Acoes } from '../plano/camposFormulario';
import { BotaoNovo } from '../BotaoNovo';

export function FormularioExecucao({
  item, notas, aoFechar, aoNovaNota, aoAbrirNota,
}: {
  item: ItemOrcamento;
  /** Notas deste item. */
  notas: NotaOrcamento[];
  aoFechar: () => void;
  aoNovaNota: () => void;
  aoAbrirNota: (n: NotaOrcamento) => void;
}) {
  const { saveExecucao } = useStore();
  const { readOnly } = useAuth();
  const [concluida, setConcluida] = useState(item.execucaoConcluida);
  const [justificativa, setJustificativa] = useState(item.justificativaDiferenca);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const executado = somaDasNotas(notas);
  const diferenca = executado === null ? null : arredondar(item.valorProposto - executado);
  const precisaJustificar = exigeJustificativa({
    valorProposto: item.valorProposto, valorExecutado: executado, execucaoConcluida: concluida,
  });

  const salvar = async () => {
    if (precisaJustificar && !justificativa.trim()) {
      setErros(['O executado difere do proposto. Informe a justificativa desta diferença.']);
      return;
    }
    setSalvando(true);
    try {
      await saveExecucao({ itemId: item.id, justificativa, execucaoConcluida: concluida });
      toast.success('Execução atualizada.');
      aoFechar();
    } catch (e) {
      setErros([e instanceof Error ? e.message : 'Não foi possível salvar.']);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border p-5 w-full max-w-lg flex flex-col gap-3 max-h-[92vh] overflow-y-auto"
        style={{ borderColor: 'var(--border)' }}
        role="dialog"
        aria-label="Execução do item"
      >
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
            Execução do item
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--ink-4)', marginTop: 2 }}>
            {item.grupo} · {item.categoria}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-2)', marginTop: 2 }}>{item.descricao}</div>
        </div>

        {/* Planejado — somente leitura (RF-030). */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)' }}>
          {[
            ['Qtd.', `${item.qtd} ${item.unidade}`.trim()],
            ['Qtd./un.', String(item.qtdUnidades)],
            ['Valor unitário', moeda(item.valorUnitario)],
            ['Total proposto', moeda(item.valorProposto)],
          ].map(([r, v]) => (
            <div key={r}>
              <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase' }}>{r}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>{v}</div>
            </div>
          ))}
        </div>

        <Erros erros={erros} />

        {/* Notas do item */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-3)' }}>
              Notas fiscais ({notas.length})
            </span>
            {!readOnly && (
              <BotaoNovo onClick={aoNovaNota}>Nova nota</BotaoNovo>
            )}
          </div>
          {notas.length === 0 ? (
            <span style={{ fontSize: '0.76rem', color: 'var(--ink-5)' }}>Nenhuma nota lançada neste item.</span>
          ) : (
            <ul className="flex flex-col rounded-lg border" style={{ borderColor: 'var(--line-1)' }}>
              {notas.map(n => (
                <li key={n.id} style={{ borderBottom: '1px solid var(--line-1)' }}>
                  <button
                    type="button"
                    onClick={() => aoAbrirNota(n)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-accent"
                    style={{ fontSize: '0.76rem' }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-4)' }}>{formatDateOnly(n.dataEmissao)}</span>
                    <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--ink-2)' }}>
                      {n.numero ? `NF ${n.numero}` : 'Sem número'}{n.fornecedor ? ` · ${n.fornecedor}` : ''}
                    </span>
                    {n.anexo
                      ? <Paperclip size={11} color="var(--ink-4)" aria-label="Com comprovante" />
                      : <span style={{ fontSize: '0.66rem', color: 'var(--warning)' }}>sem comprovante</span>}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ink-1)' }}>{moeda(n.valor)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)' }} aria-live="polite">
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase' }}>Executado (soma das notas)</div>
            <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink-1)' }}>{moeda(executado)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase' }}>Diferença (proposto − executado)</div>
            <div
              style={{
                fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: diferenca === null ? 'var(--ink-5)' : diferenca < 0 ? 'var(--danger)' : 'var(--success)',
              }}
            >
              {moedaComSinal(diferenca)}
            </div>
          </div>
        </div>
        {diferenca !== null && diferenca < 0 && (
          <div className="flex items-center gap-1.5" style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>
            <AlertTriangle size={12} /> Execução acima do proposto.
          </div>
        )}

        <label className="flex items-start gap-2" style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>
          <input
            type="checkbox"
            checked={concluida}
            disabled={readOnly}
            onChange={e => setConcluida(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span>
            Execução concluída
            <span className="block" style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>
              Marque quando não entra mais nota neste item. Concluído com valor diferente do proposto exige justificativa.
            </span>
          </span>
        </label>

        <Campo
          rotulo="Justificativa da diferença"
          obrigatorio={precisaJustificar}
          dica={precisaJustificar ? 'O executado difere do proposto — a justificativa é obrigatória.' : undefined}
        >
          <AreaTexto valor={justificativa} aoMudar={setJustificativa} linhas={3} desabilitado={readOnly} />
        </Campo>

        {readOnly ? (
          <div className="flex justify-end">
            <button onClick={aoFechar} className="px-3 py-1.5 rounded-md border text-[12.5px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
              Fechar
            </button>
          </div>
        ) : (
          <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} />
        )}
      </div>
    </div>
  );
}
