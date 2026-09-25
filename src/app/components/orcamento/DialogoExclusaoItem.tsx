/**
 * Exclusão lógica de item do plano, com risco obrigatório (RF-040, RF-041).
 *
 * Tirar um item do orçamento não é um ato administrativo neutro: significa que
 * algo previsto não vai acontecer, e isso é um risco para o projeto. Por isso o
 * documento exige, no mesmo passo, etapa real do Plano de Trabalho,
 * responsável, probabilidade e impacto — sem esses dados a exclusão é
 * impedida, e a tela diz quais campos faltam.
 *
 * A etapa é escolhida à mão de propósito: o grupo orçamentário da planilha NÃO
 * é automaticamente uma etapa do plano (RF-041), e adivinhar a correspondência
 * pelo nome produziria vínculo errado com aparência de certo.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { usePeople } from '../../auth/authStore';
import { pontuacaoRisco, faixaRisco } from '../../lib/planoTrabalho';
import { moeda, type ItemOrcamento } from '../../lib/orcamento';
import { Campo, AreaTexto, Erros, Acoes } from '../plano/camposFormulario';

const CORES: Record<string, { cor: string; fundo: string }> = {
  'Baixo': { cor: 'var(--success)', fundo: 'var(--success-soft)' },
  'Médio': { cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)' },
  'Alto': { cor: 'var(--danger)', fundo: 'var(--danger-soft)' },
  'Crítico': { cor: 'var(--danger)', fundo: 'var(--danger-soft)' },
};

function Escala({ valor, aoMudar, rotulo }: { valor: number; aoMudar: (v: number) => void; rotulo: string }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={rotulo}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          onClick={() => aoMudar(n)}
          className="w-8 h-7 rounded-md border text-[12px]"
          style={{
            borderColor: valor === n ? 'var(--primary)' : 'var(--border)',
            background: valor === n ? 'var(--brand-soft)' : 'var(--surface-1)',
            color: valor === n ? 'var(--brand)' : 'var(--ink-3)',
            fontWeight: valor === n ? 700 : 400,
          }}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function DialogoExclusaoItem({
  item, etapas, aoFechar,
}: {
  item: ItemOrcamento;
  etapas: { id: string; nome: string; meta: string }[];
  aoFechar: () => void;
}) {
  const { excluirItemOrcamento } = useStore();
  const pessoas = usePeople();
  const [motivo, setMotivo] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [probabilidade, setProbabilidade] = useState(3);
  const [impacto, setImpacto] = useState(3);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const pontuacao = pontuacaoRisco(probabilidade, impacto);
  const faixa = faixaRisco(pontuacao);
  const cfg = CORES[faixa] ?? { cor: 'var(--ink-4)', fundo: 'var(--surface-2)' };

  // RN-032: item com execução positiva não sai por aqui. Avisar antes evita
  // que a pessoa preencha o formulário inteiro para ser recusada no fim.
  const temExecucao = item.valorExecutado !== null && item.valorExecutado > 0;

  const semEtapas = etapas.length === 0;

  const salvar = async () => {
    const problemas: string[] = [];
    if (!motivo.trim()) problemas.push('Informe o motivo da exclusão.');
    if (!etapaId) problemas.push('Selecione a etapa do Plano de Trabalho à qual o risco pertence.');
    if (!responsavel.trim()) problemas.push('Informe o responsável pelo risco.');
    if (problemas.length) { setErros(problemas); return; }

    setSalvando(true);
    try {
      await excluirItemOrcamento({ itemId: item.id, motivo, etapaId, responsavel, probabilidade, impacto });
      toast.success('Item excluído do plano e risco registrado.');
      aoFechar();
    } catch (e) {
      setErros([e instanceof Error ? e.message : 'Não foi possível excluir.']);
    } finally {
      setSalvando(false);
    }
  };

  const conteudo = useMemo(() => {
    if (temExecucao) {
      return (
        <>
          <Erros erros={[
            'Este item já tem execução financeira registrada e não pode ser excluído diretamente.',
            'Trate a reversão ou a realocação contábil antes, registrando a decisão.',
          ]} />
          <div className="flex justify-end">
            <button onClick={aoFechar} className="px-3 py-1.5 rounded-md border text-[12.5px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
              Voltar
            </button>
          </div>
        </>
      );
    }

    if (semEtapas) {
      return (
        <>
          <Erros erros={[
            'Este projeto ainda não tem etapas no Plano de Trabalho.',
            'O risco da exclusão precisa pertencer a uma etapa real — cadastre a estrutura antes.',
          ]} />
          <div className="flex justify-end">
            <button onClick={aoFechar} className="px-3 py-1.5 rounded-md border text-[12.5px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
              Voltar
            </button>
          </div>
        </>
      );
    }

    return (
      <>
        <Erros erros={erros} />

        <Campo rotulo="Motivo da exclusão" obrigatorio dica="Vira a descrição do risco registrado.">
          <AreaTexto valor={motivo} aoMudar={setMotivo} linhas={3} />
        </Campo>

        <fieldset className="border rounded-lg p-3 flex flex-col gap-3" style={{ borderColor: 'var(--line-1)' }}>
          <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>
            Risco orçamentário
          </legend>

          <Campo
            rotulo="Etapa do Plano de Trabalho"
            obrigatorio
            dica="O grupo do orçamento não é automaticamente uma etapa — escolha a etapa real afetada."
          >
            <select
              className="w-full border rounded-lg px-2.5 py-1.5"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
              value={etapaId}
              onChange={e => setEtapaId(e.target.value)}
            >
              <option value="">Selecione…</option>
              {etapas.map(e => (
                <option key={e.id} value={e.id}>{e.meta} › {e.nome}</option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Responsável" obrigatorio>
            <select
              className="w-full border rounded-lg px-2.5 py-1.5"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
              value={responsavel}
              onChange={e => setResponsavel(e.target.value)}
            >
              <option value="">Selecione…</option>
              {pessoas.map(p => <option key={p.login} value={p.name}>{p.name}</option>)}
            </select>
          </Campo>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo rotulo="Probabilidade" obrigatorio>
              <Escala valor={probabilidade} aoMudar={setProbabilidade} rotulo="Probabilidade de 1 a 5" />
            </Campo>
            <Campo rotulo="Impacto" obrigatorio>
              <Escala valor={impacto} aoMudar={setImpacto} rotulo="Impacto de 1 a 5" />
            </Campo>
          </div>

          {/* A faixa sai da matriz, não de um padrão: nada aqui marca "Crítico"
              por ser uma exclusão (RF-041). */}
          <div className="flex items-center gap-2" aria-live="polite">
            <span style={{ fontSize: '0.74rem', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
              {probabilidade} × {impacto} = {pontuacao}
            </span>
            <span className="px-2 py-0.5 rounded-md" style={{ background: cfg.fundo, color: cfg.cor, fontSize: '0.72rem', fontWeight: 700 }}>
              {faixa}
            </span>
          </div>
        </fieldset>

        <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} rotuloSalvar="Excluir do plano" />
      </>
    );
  }, [temExecucao, semEtapas, erros, motivo, etapaId, responsavel, probabilidade, impacto, salvando, etapas, pessoas]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border p-5 w-full max-w-lg flex flex-col gap-3 max-h-[92vh] overflow-y-auto"
        style={{ borderColor: 'var(--border)' }}
        role="dialog"
        aria-label="Excluir item do plano"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div className="min-w-0">
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
              Excluir item do plano
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 2 }}>
              {item.descricao} · {moeda(item.valorProposto)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-5)', marginTop: 4, lineHeight: 1.5 }}>
              O item continua na tabela, na mesma posição, marcado como excluído. O valor proposto
              original não muda — o que muda é o plano ativo.
            </div>
          </div>
        </div>

        {conteudo}
      </div>
    </div>
  );
}
