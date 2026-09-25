/**
 * Registro de execução de um item (RF-030, RF-039).
 *
 * Os dados planejados aparecem, mas só para leitura: a tela mostra contra o
 * que se está comparando sem permitir editar a origem. A justificativa vira
 * obrigatória assim que o valor digitado se afasta do proposto — em qualquer
 * direção, porque gastar menos também é desvio do plano e precisa de
 * explicação registrada (RF-039).
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { moeda, moedaComSinal, arredondar, type ItemOrcamento } from '../../lib/orcamento';
import { Campo, AreaTexto, Data, Erros, Acoes } from '../plano/camposFormulario';

export function FormularioExecucao({
  item, aoFechar,
}: { item: ItemOrcamento; aoFechar: () => void }) {
  const { saveExecucao } = useStore();
  const [valor, setValor] = useState(item.valorExecutado === null ? '' : String(item.valorExecutado));
  const [dataCompra, setDataCompra] = useState(item.dataCompra);
  const [justificativa, setJustificativa] = useState(item.justificativaDiferenca);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Campo vazio significa "sem registro de execução", não zero (RF-029).
  const executado = useMemo(() => {
    const limpo = valor.replace(/\./g, '').replace(',', '.').trim();
    if (limpo === '') return null;
    const n = Number(limpo);
    return Number.isFinite(n) ? arredondar(n) : NaN;
  }, [valor]);

  const invalido = typeof executado === 'number' && Number.isNaN(executado);
  const diferenca = executado === null || invalido ? null : arredondar(item.valorProposto - (executado as number));
  const precisaJustificar = executado !== null && !invalido && executado !== arredondar(item.valorProposto);

  const salvar = async () => {
    const problemas: string[] = [];
    if (invalido) problemas.push('O valor executado não é um número válido.');
    if (typeof executado === 'number' && executado < 0) problemas.push('O valor executado não pode ser negativo.');
    if (precisaJustificar && !justificativa.trim()) {
      problemas.push('O valor executado difere do proposto. Informe a justificativa desta diferença.');
    }
    if (problemas.length) { setErros(problemas); return; }

    setSalvando(true);
    try {
      await saveExecucao({
        itemId: item.id,
        valorExecutado: executado as number | null,
        dataCompra,
        justificativa,
      });
      toast.success('Execução registrada.');
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
        className="bg-card rounded-2xl border p-5 w-full max-w-lg flex flex-col gap-3"
        style={{ borderColor: 'var(--border)' }}
        role="dialog"
        aria-label="Registrar execução"
      >
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
            Registrar execução
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--ink-4)', marginTop: 2 }}>
            {item.grupo} · {item.categoria}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--ink-2)', marginTop: 2 }}>{item.descricao}</div>
        </div>

        {/* Planejado — somente leitura (RF-030). */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg px-3 py-2"
          style={{ background: 'var(--surface-2)' }}
        >
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

        <Campo rotulo="Valor executado" dica="Deixe em branco para registrar que ainda não há execução informada.">
          <input
            type="text"
            inputMode="decimal"
            className="w-full border rounded-lg px-2.5 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
            placeholder="Não informado"
            value={valor}
            onChange={e => setValor(e.target.value)}
          />
        </Campo>

        <Campo rotulo="Data da compra">
          <Data valor={dataCompra} aoMudar={setDataCompra} />
        </Campo>

        <div className="flex items-center gap-2" style={{ fontSize: '0.78rem' }} aria-live="polite">
          <span style={{ color: 'var(--ink-4)' }}>Diferença (proposto − executado):</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)', fontWeight: 600,
              color: diferenca === null ? 'var(--ink-5)' : diferenca < 0 ? 'var(--danger)' : 'var(--success)',
            }}
          >
            {moedaComSinal(diferenca)}
          </span>
          {diferenca !== null && diferenca < 0 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>execução acima do proposto</span>
          )}
        </div>

        <Campo
          rotulo="Justificativa da diferença"
          obrigatorio={precisaJustificar}
          dica={precisaJustificar ? 'O valor difere do proposto — a justificativa passa a ser obrigatória.' : undefined}
        >
          <AreaTexto valor={justificativa} aoMudar={setJustificativa} linhas={3} />
        </Campo>

        <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} />
      </div>
    </div>
  );
}
