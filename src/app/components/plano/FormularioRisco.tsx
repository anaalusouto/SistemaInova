/**
 * Cadastro e edição de risco (RF-028).
 *
 * O risco nasce preso a uma ETAPA (RN-028) — não existe caminho neste
 * formulário para criar risco solto. A matriz 5×5 fica visível enquanto se
 * escolhe probabilidade e impacto, porque a faixa resultante (Baixo a Crítico)
 * é consequência da multiplicação, não um campo que alguém escolhe: ver o
 * número mudar evita que a pessoa "mire" numa faixa.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { type Risk, type Deliverable, type RiskStatus } from '../../data/mockData';
import { useStore } from '../../store';
import { usePeople } from '../../auth/authStore';
import { type RiscoInput } from '../../planoTrabalho.server';
import { pontuacaoRisco, faixaRisco } from '../../lib/planoTrabalho';
import { Campo, Texto, AreaTexto, Selecao, Erros, Acoes } from './camposFormulario';

const STATUS: readonly RiskStatus[] = ['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'];
const CATEGORIAS = [
  'Técnico', 'Financeiro', 'Operacional', 'Ambiental',
  'Institucional', 'Social', 'Logístico', 'Outro',
] as const;

const CORES_FAIXA: Record<string, { cor: string; fundo: string }> = {
  'Baixo':   { cor: 'var(--success)', fundo: 'var(--success-soft)' },
  'Médio':   { cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)' },
  'Alto':    { cor: 'var(--danger)', fundo: 'var(--danger-soft)' },
  'Crítico': { cor: 'var(--danger)', fundo: 'var(--danger-soft)' },
};

function inicial(projetoId: number, etapa: Deliverable, risco?: Risk): RiscoInput {
  return {
    projetoId,
    etapaId: etapa.id,
    titulo: risco?.title ?? '',
    descricao: risco?.description ?? '',
    categoria: risco?.category ?? '',
    responsavel: risco?.responsible ?? '',
    probabilidade: risco?.probability ?? 3,
    impacto: risco?.impact ?? 3,
    status: (risco?.status as RiscoInput['status']) ?? 'Aberto',
    estrategiaResposta: risco?.responseStrategy ?? '',
    especificacao: risco?.specification ?? '',
  };
}

/** Seletor 1–5 apresentado como botões: cinco opções não merecem um menu. */
function Escala({
  valor, aoMudar, rotuloAcessivel,
}: { valor: number; aoMudar: (v: number) => void; rotuloAcessivel: string }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={rotuloAcessivel}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          onClick={() => aoMudar(n)}
          className="w-9 h-8 rounded-md border text-[12.5px]"
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

export function FormularioRisco({
  projetoId, etapa, risco, aoFechar,
}: { projetoId: number; etapa: Deliverable; risco?: Risk; aoFechar: () => void }) {
  const { createRisco, updateRisco } = useStore();
  const pessoas = usePeople();
  const [form, setForm] = useState<RiscoInput>(() => inicial(projetoId, etapa, risco));
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const alterar = <K extends keyof RiscoInput>(campo: K, valor: RiscoInput[K]) =>
    setForm(f => ({ ...f, [campo]: valor }));

  const pontuacao = pontuacaoRisco(form.probabilidade, form.impacto);
  const faixa = faixaRisco(pontuacao);
  const cfg = CORES_FAIXA[faixa] ?? { cor: 'var(--ink-4)', fundo: 'var(--surface-2)' };

  const salvar = async () => {
    const problemas: string[] = [];
    if (!form.titulo.trim()) problemas.push('Informe o título do risco.');
    if (!form.categoria.trim()) problemas.push('Informe a categoria.');
    if (!form.responsavel.trim()) problemas.push('Informe o responsável.');
    if (!form.descricao.trim()) problemas.push('Informe a descrição.');
    if (problemas.length) { setErros(problemas); return; }

    setSalvando(true);
    try {
      if (risco) {
        await updateRisco(risco.id, form);
        toast.success('Risco atualizado.');
      } else {
        await createRisco(form);
        toast.success('Risco criado.');
      }
      aoFechar();
    } catch (e) {
      setErros([e instanceof Error ? e.message : 'Não foi possível salvar.']);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Erros erros={erros} />

      <div
        className="rounded-lg px-3 py-2"
        style={{ background: 'var(--surface-2)', fontSize: '0.74rem', color: 'var(--ink-3)' }}
      >
        Risco da etapa <strong style={{ color: 'var(--ink-2)' }}>{etapa.name}</strong>. Todo risco pertence a uma
        etapa — a meta é derivada dela.
      </div>

      <Campo rotulo="Título" obrigatorio>
        <Texto valor={form.titulo} aoMudar={v => alterar('titulo', v)} placeholder="Resumo curto do risco" />
      </Campo>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo rotulo="Categoria" obrigatorio>
          <select
            className="w-full border rounded-lg px-2.5 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
            value={form.categoria}
            onChange={e => alterar('categoria', e.target.value)}
          >
            <option value="">Selecione…</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Campo>

        <Campo rotulo="Responsável" obrigatorio>
          <select
            className="w-full border rounded-lg px-2.5 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
            value={form.responsavel}
            onChange={e => alterar('responsavel', e.target.value)}
          >
            <option value="">Selecione…</option>
            {pessoas.map(p => <option key={p.login} value={p.name}>{p.name}</option>)}
          </select>
        </Campo>
      </div>

      <Campo rotulo="Descrição" obrigatorio>
        <AreaTexto valor={form.descricao} aoMudar={v => alterar('descricao', v)} linhas={3} />
      </Campo>

      <fieldset className="border rounded-lg p-3 flex flex-col gap-3" style={{ borderColor: 'var(--line-1)' }}>
        <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>
          Matriz
        </legend>
        <Campo rotulo="Probabilidade" obrigatorio>
          <Escala valor={form.probabilidade} aoMudar={v => alterar('probabilidade', v)} rotuloAcessivel="Probabilidade de 1 a 5" />
        </Campo>
        <Campo rotulo="Impacto" obrigatorio>
          <Escala valor={form.impacto} aoMudar={v => alterar('impacto', v)} rotuloAcessivel="Impacto de 1 a 5" />
        </Campo>
        <div className="flex items-center gap-2" aria-live="polite">
          <span style={{ fontSize: '0.74rem', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
            {form.probabilidade} × {form.impacto} = {pontuacao}
          </span>
          <span
            className="px-2 py-0.5 rounded-md"
            style={{ background: cfg.fundo, color: cfg.cor, fontSize: '0.72rem', fontWeight: 700 }}
          >
            {faixa}
          </span>
        </div>
      </fieldset>

      <Campo rotulo="Status">
        <Selecao valor={form.status} opcoes={STATUS} aoMudar={v => alterar('status', v)} />
      </Campo>

      <Campo rotulo="Estratégia de resposta">
        <AreaTexto valor={form.estrategiaResposta} aoMudar={v => alterar('estrategiaResposta', v)} linhas={2} />
      </Campo>

      <Campo rotulo="Especificação / resultado vinculado">
        <Texto valor={form.especificacao} aoMudar={v => alterar('especificacao', v)} />
      </Campo>

      <Acoes
        aoCancelar={aoFechar}
        aoSalvar={salvar}
        salvando={salvando}
        rotuloSalvar={risco ? 'Salvar alterações' : 'Criar risco'}
      />
    </div>
  );
}
