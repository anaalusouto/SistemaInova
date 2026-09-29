/**
 * Lançar ou editar uma nota fiscal / comprovante (RF04.3).
 *
 * O item do orçamento é opcional (decisão da equipe, 29/09/2026): nenhum
 * projeto tem planilha importada ainda, e a nota precisa poder entrar já.
 * Nota sem item conta no executado do projeto e pode ser vinculada depois.
 *
 * O comprovante segue a regra de todo anexo do sistema: só depois do registro
 * gravado. Ao lançar, o diálogo continua aberto já em modo de edição, com o
 * campo de anexo liberado — a pessoa não precisa reabrir a nota para anexar.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { Campo, Texto, AreaTexto, Data, Erros, Acoes } from '../plano/camposFormulario';
import { CampoAnexo } from '../plano/CampoAnexo';
import {
  lerValor, moeda, validarNota, type ItemOrcamento, type NotaOrcamento,
} from '../../lib/orcamento';

const baseInput: React.CSSProperties = {
  borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem',
};

export function FormularioNota({
  projetoId, itens, nota, itemInicial, aoFechar,
}: {
  projetoId: number;
  itens: ItemOrcamento[];
  /** Nota existente (edição). Ausente = nova nota. */
  nota?: NotaOrcamento;
  /** Item pré-selecionado ao lançar a partir da linha do item. */
  itemInicial?: string | null;
  aoFechar: () => void;
}) {
  const { createNota, updateNota, getProject } = useStore();
  const [notaId, setNotaId] = useState<string | null>(nota?.id ?? null);
  const [itemId, setItemId] = useState<string | null>(nota?.itemId ?? itemInicial ?? null);
  const [numero, setNumero] = useState(nota?.numero ?? '');
  const [fornecedor, setFornecedor] = useState(nota?.fornecedor ?? '');
  const [dataEmissao, setDataEmissao] = useState<string | null>(nota?.dataEmissao ?? null);
  const [valorTexto, setValorTexto] = useState(nota ? String(nota.valor).replace('.', ',') : '');
  const [descricao, setDescricao] = useState(nota?.descricao ?? '');
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  // Só item ativo recebe nota; o da própria nota continua na lista mesmo se
  // tiver sido excluído depois, para a edição não trocar o vínculo sozinha.
  const opcoes = useMemo(
    () => itens.filter(i => i.situacao === 'Ativo' || i.id === nota?.itemId),
    [itens, nota?.itemId],
  );
  const valor = lerValor(valorTexto);

  // O anexo vem da store, não da prop: depois de enviar, a nota recarregada
  // já traz o comprovante — inclusive a que acabou de ser lançada.
  const anexoAtual = notaId
    ? getProject(projetoId)?.orcamentoNotas?.find(n => n.id === notaId)?.anexo ?? null
    : null;

  const salvar = async () => {
    const problemas = validarNota({ dataEmissao, valor: Number.isNaN(valor) ? NaN : valor });
    if (problemas.length) { setErros(problemas); return; }
    const input = { projetoId, itemId, numero, fornecedor, dataEmissao, valor, descricao };
    setSalvando(true);
    setErros([]);
    try {
      if (notaId) {
        await updateNota(notaId, input);
        toast.success('Nota atualizada.');
        aoFechar();
      } else {
        const id = await createNota(input);
        setNotaId(id);
        toast.success('Nota lançada. Anexe o comprovante, se tiver.');
      }
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
        aria-label={notaId ? 'Editar nota' : 'Nova nota'}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
          {notaId ? 'Nota fiscal / comprovante' : 'Nova nota'}
        </div>

        <Erros erros={erros} />

        <Campo rotulo="Item do orçamento" dica={opcoes.length === 0 ? 'Este projeto ainda não tem itens de orçamento: a nota entra sem item e pode ser vinculada depois.' : 'Opcional. Sem item, a nota conta só no total do projeto.'}>
          <select
            className="w-full border rounded-lg px-2.5 py-1.5"
            style={baseInput}
            value={itemId ?? ''}
            onChange={e => setItemId(e.target.value || null)}
            disabled={opcoes.length === 0}
          >
            <option value="">Sem item vinculado</option>
            {opcoes.map(i => (
              <option key={i.id} value={i.id}>
                {[i.grupo, i.descricao].filter(Boolean).join(' · ')} ({moeda(i.valorProposto)})
              </option>
            ))}
          </select>
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo rotulo="Data da nota" obrigatorio><Data valor={dataEmissao} aoMudar={setDataEmissao} /></Campo>
          <Campo rotulo="Valor" obrigatorio>
            <input
              type="text"
              inputMode="decimal"
              className="w-full border rounded-lg px-2.5 py-1.5"
              style={{ ...baseInput, fontFamily: 'var(--font-mono)' }}
              placeholder="0,00"
              value={valorTexto}
              onChange={e => setValorTexto(e.target.value)}
            />
          </Campo>
          <Campo rotulo="Número da nota"><Texto valor={numero} aoMudar={setNumero} placeholder="Ex.: 000123" /></Campo>
          <Campo rotulo="Fornecedor"><Texto valor={fornecedor} aoMudar={setFornecedor} /></Campo>
        </div>

        <Campo rotulo="Descrição"><AreaTexto valor={descricao} aoMudar={setDescricao} linhas={2} placeholder="O que foi comprado ou pago" /></Campo>

        <CampoAnexo
          projetoId={projetoId}
          orcamentoNotaId={notaId ?? undefined}
          anexo={anexoAtual}
          rotulo="Anexar comprovante (PDF ou foto)"
        />

        <Acoes
          aoCancelar={aoFechar}
          aoSalvar={salvar}
          salvando={salvando}
          rotuloSalvar={notaId ? 'Salvar' : 'Lançar nota'}
        />
      </div>
    </div>
  );
}
