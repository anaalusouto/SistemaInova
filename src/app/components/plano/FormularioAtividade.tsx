/**
 * Cadastro e edição de atividade (RF-024).
 *
 * Valida no navegador com as MESMAS funções que o servidor usa
 * (src/app/lib/planoTrabalho.ts), então a mensagem exibida é literalmente a
 * regra que será aplicada ao salvar — sem duas versões da verdade que
 * divergem com o tempo. O servidor revalida de qualquer forma: a checagem
 * daqui é conveniência para quem digita, não barreira (RN-001).
 *
 * Os limites de data também vão para os atributos min/max dos campos, para que
 * o calendário do navegador já não ofereça data fora da etapa — evitar o erro
 * é melhor do que explicá-lo depois.
 */
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { type Activity, type Deliverable, type ActivityStatus, type BudgetLink } from '../../data/mockData';
import { useStore } from '../../store';
import { usePeople } from '../../auth/authStore';
import { type AtividadeInput } from '../../planoTrabalho.server';
import { validarDatasDaAtividade, temDivergenciaDeDatas, progressoParaStatus } from '../../lib/planoTrabalho';
import { Campo, Texto, AreaTexto, Data, Selecao, Erros, Acoes } from './camposFormulario';

const STATUS: readonly ActivityStatus[] = ['A iniciar', 'Em andamento', 'Concluído'];
const VINCULOS: readonly BudgetLink[] = ['Sim', 'Não', 'Não informado'];

function inicial(etapa: Deliverable, atividade?: Activity): AtividadeInput {
  return {
    etapaId: etapa.id,
    nome: atividade?.name ?? '',
    responsavel: atividade?.responsible ?? '',
    status: atividade?.status ?? 'A iniciar',
    progresso: atividade?.progress ?? 0,
    // RN-013: ao criar, o previsto começa no período da etapa e o realizado
    // começa VAZIO. Realizado só existe quando alguém informa.
    inicioPrevisto: atividade?.plannedStart ?? etapa.plannedStart,
    fimPrevisto: atividade?.plannedEnd ?? etapa.plannedEnd,
    inicioRealizado: atividade?.actualStart ?? null,
    fimRealizado: atividade?.actualEnd ?? null,
    justificativaAtraso: atividade?.delayJustification ?? '',
    vinculoOrcamentario: atividade?.budgetLink ?? 'Não informado',
    observacoes: atividade?.observations ?? '',
    proximoPasso: atividade?.nextStep ?? '',
    proximoPassoResponsavel: atividade?.nextStepOwner ?? '',
    proximoPassoPrazo: atividade?.nextStepDue ?? null,
    riscoOrigemId: atividade?.riskOriginId ?? null,
  };
}

export function FormularioAtividade({
  etapa, atividade, aoFechar,
}: { etapa: Deliverable; atividade?: Activity; aoFechar: () => void }) {
  const { createAtividade, updateAtividade } = useStore();
  const pessoas = usePeople();
  const [form, setForm] = useState<AtividadeInput>(() => inicial(etapa, atividade));
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const alterar = <K extends keyof AtividadeInput>(campo: K, valor: AtividadeInput[K]) =>
    setForm(f => ({ ...f, [campo]: valor }));

  // CA-07: etapa sem período previsto não aceita atividade. A mensagem orienta
  // a preencher o período em vez de só recusar.
  const semPeriodoDaEtapa = !etapa.plannedStart || !etapa.plannedEnd;

  const divergencia = useMemo(
    () => temDivergenciaDeDatas({
      plannedStart: form.inicioPrevisto, plannedEnd: form.fimPrevisto,
      actualStart: form.inicioRealizado, actualEnd: form.fimRealizado,
    } as Activity),
    [form.inicioPrevisto, form.fimPrevisto, form.inicioRealizado, form.fimRealizado],
  );

  const tetoRealizado = etapa.actualEnd ?? etapa.plannedEnd;

  const salvar = async () => {
    const problemas: string[] = [];
    if (!form.nome.trim()) problemas.push('Informe o título da atividade.');
    if (!form.inicioPrevisto || !form.fimPrevisto) problemas.push('Informe o início e o fim previstos.');

    const validacao = validarDatasDaAtividade(
      {
        plannedStart: form.inicioPrevisto, plannedEnd: form.fimPrevisto,
        actualStart: form.inicioRealizado, actualEnd: form.fimRealizado,
      },
      etapa,
    );
    problemas.push(...validacao.erros);

    // RN-010: divergência entre previsto e realizado exige justificativa.
    if (divergencia && !form.justificativaAtraso.trim()) {
      problemas.push('As datas realizadas divergem das previstas. Informe a justificativa.');
    }

    if (problemas.length) { setErros(problemas); return; }

    setSalvando(true);
    try {
      if (atividade) {
        await updateAtividade(atividade.id, form);
        toast.success('Atividade atualizada.');
      } else {
        await createAtividade(form);
        toast.success('Atividade criada.');
      }
      aoFechar();
    } catch (e) {
      // O servidor revalida e pode recusar por algo que o navegador não viu
      // (etapa alterada por outra pessoa no meio do caminho, por exemplo).
      setErros([e instanceof Error ? e.message : 'Não foi possível salvar.']);
    } finally {
      setSalvando(false);
    }
  };

  if (semPeriodoDaEtapa) {
    return (
      <div className="flex flex-col gap-3">
        <Erros erros={['A etapa ainda não tem início e fim previstos. Preencha o período da etapa antes de criar atividades.']} />
        <div className="flex justify-end">
          <button
            onClick={aoFechar}
            className="px-3 py-1.5 rounded-md border text-[12.5px]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Erros erros={erros} />

      <Campo rotulo="Título" obrigatorio>
        <Texto valor={form.nome} aoMudar={v => alterar('nome', v)} placeholder="O que será feito" />
      </Campo>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo rotulo="Responsável">
          <select
            className="w-full border rounded-lg px-2.5 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
            value={form.responsavel}
            onChange={e => alterar('responsavel', e.target.value)}
          >
            <option value="">Não informado</option>
            {pessoas.map(p => <option key={p.login} value={p.name}>{p.name}</option>)}
          </select>
        </Campo>

        <Campo rotulo="Status">
          <Selecao
            valor={form.status}
            opcoes={STATUS}
            aoMudar={v => setForm(f => ({ ...f, status: v, progresso: progressoParaStatus(v, f.progresso) }))}
          />
        </Campo>
      </div>

      {/* RN-009: percentual só é editável em "Em andamento" — os outros dois
          estados têm valor fixo, e deixar o campo livre convidaria a criar a
          incoerência que a constraint do banco recusa. */}
      <Campo
        rotulo="Progresso (%)"
        dica={form.status === 'Em andamento' ? '1 a 99' : `Fixo em ${form.progresso}% para o status "${form.status}".`}
      >
        <input
          type="number"
          min={1}
          max={99}
          className="w-full border rounded-lg px-2.5 py-1.5"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
          value={form.progresso}
          disabled={form.status !== 'Em andamento'}
          onChange={e => alterar('progresso', Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
        />
      </Campo>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-3" style={{ borderColor: 'var(--line-1)' }}>
        <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>
          Previsto — dentro do período da etapa
        </legend>
        <Campo rotulo="Início previsto" obrigatorio>
          <Data
            valor={form.inicioPrevisto}
            aoMudar={v => alterar('inicioPrevisto', v)}
            min={etapa.plannedStart}
            max={etapa.plannedEnd}
          />
        </Campo>
        <Campo rotulo="Fim previsto" obrigatorio>
          <Data
            valor={form.fimPrevisto}
            aoMudar={v => alterar('fimPrevisto', v)}
            min={form.inicioPrevisto ?? etapa.plannedStart}
            max={etapa.plannedEnd}
          />
        </Campo>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-3" style={{ borderColor: 'var(--line-1)' }}>
        <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>
          Realizado — preencher só quando acontecer
        </legend>
        <Campo rotulo="Início">
          <Data valor={form.inicioRealizado} aoMudar={v => alterar('inicioRealizado', v)} max={tetoRealizado} />
        </Campo>
        <Campo rotulo="Fim">
          <Data
            valor={form.fimRealizado}
            aoMudar={v => alterar('fimRealizado', v)}
            min={form.inicioRealizado}
            max={tetoRealizado}
          />
        </Campo>
      </fieldset>

      <Campo
        rotulo="Justificativa de atraso"
        obrigatorio={divergencia}
        dica={divergencia ? 'As datas realizadas divergem das previstas — a justificativa passa a ser obrigatória.' : undefined}
      >
        <AreaTexto valor={form.justificativaAtraso} aoMudar={v => alterar('justificativaAtraso', v)} linhas={2} />
      </Campo>

      <Campo rotulo="Vínculo orçamentário" dica='"Não informado" não é "Não" — a ausência é registrada como tal.'>
        <Selecao valor={form.vinculoOrcamentario} opcoes={VINCULOS} aoMudar={v => alterar('vinculoOrcamentario', v)} />
      </Campo>

      <Campo rotulo="Observação">
        <AreaTexto valor={form.observacoes} aoMudar={v => alterar('observacoes', v)} linhas={2} />
      </Campo>

      <fieldset className="flex flex-col gap-3 border rounded-lg p-3" style={{ borderColor: 'var(--line-1)' }}>
        <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>
          Próximo passo — ação a executar, não observação
        </legend>
        <Campo rotulo="Ação">
          <Texto valor={form.proximoPasso} aoMudar={v => alterar('proximoPasso', v)} placeholder="O que precisa ser feito a seguir" />
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo rotulo="Responsável pela ação">
            <Texto valor={form.proximoPassoResponsavel} aoMudar={v => alterar('proximoPassoResponsavel', v)} />
          </Campo>
          <Campo rotulo="Prazo">
            <Data valor={form.proximoPassoPrazo} aoMudar={v => alterar('proximoPassoPrazo', v)} />
          </Campo>
        </div>
      </fieldset>

      <Acoes
        aoCancelar={aoFechar}
        aoSalvar={salvar}
        salvando={salvando}
        rotuloSalvar={atividade ? 'Salvar alterações' : 'Criar atividade'}
      />
    </div>
  );
}
