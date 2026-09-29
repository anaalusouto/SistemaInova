/**
 * Encaminhamentos da organização (RC-04).
 *
 * Lista geral das tarefas da organização, qualquer que seja a origem. Substitui
 * as "ações derivadas" que ficavam presas a um parecer técnico do projeto.
 *
 * A origem aponta para um registro de contato pelo id; o texto exibido é
 * montado na hora a partir do registro atual, então corrigir a data ou o
 * assunto do registro não quebra o vínculo.
 */
import { useMemo, useState } from 'react';
import { Pencil, Trash2, ListChecks, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, usePeople } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  STATUS_ENCAMINHAMENTO, rotuloRegistro, validarEncaminhamento,
  type OrganizacaoFicha, type Encaminhamento, type EncaminhamentoInput, type StatusEncaminhamento,
} from '../../lib/organizacoes';
import { Campo, Texto, AreaTexto, Data, Selecao, Erros, Acoes, ConfirmarExclusao } from '../plano/camposFormulario';
import { useEscritaOrganizacao } from './useOrganizacoes';
import { useDestaque } from './useDestaque';
import { BotaoNovo } from '../BotaoNovo';

const COR_STATUS: Record<StatusEncaminhamento, { cor: string; fundo: string }> = {
  'A iniciar': { cor: 'var(--ink-3)', fundo: 'var(--surface-2)' },
  'Em andamento': { cor: 'var(--brand)', fundo: 'var(--brand-soft)' },
  'Concluído': { cor: 'var(--success)', fundo: 'var(--success-soft)' },
};

const COLUNAS = ['Descrição', 'Responsável', 'Data inicial', 'Data final', 'Status', 'Origem'];

type Form = EncaminhamentoInput & { id?: string };
type TipoOrigem = 'nenhuma' | 'contato' | 'texto';

export function AbaEncaminhamentos({
  org, foco, aoVerRegistro,
}: {
  org: OrganizacaoFicha;
  /** Registro de contato em foco: os encaminhamentos que nasceram dele ficam destacados. */
  foco: string | null;
  aoVerRegistro: (registroId: string) => void;
}) {
  const doFoco = (e: Encaminhamento) => !!foco && e.origem?.tipo === 'contato' && e.origem.registroId === foco;
  const destaque = useDestaque(org.encaminhamentos.find(doFoco)?.id ?? null);
  const { user, readOnly } = useAuth();
  const { log: audit } = useAudit();
  const escrita = useEscritaOrganizacao();
  const [mostrarConcluidos, setMostrarConcluidos] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [excluindo, setExcluindo] = useState<Encaminhamento | null>(null);

  const registros = useMemo(() => new Map(org.registros.map(r => [r.id, r])), [org.registros]);
  const linhas = mostrarConcluidos ? org.encaminhamentos : org.encaminhamentos.filter(e => e.status !== 'Concluído');
  const concluidos = org.encaminhamentos.length - org.pendentes;

  const registrar = (action: string, detail: string) =>
    audit({ userLogin: user?.login ?? '—', area: 'organizações', action, detail: `${org.nome} · ${detail}`, kind: 'alteracao' });

  const novo = () => setForm({
    organizacaoId: org.id, descricao: '', responsavel: '', dataInicio: null, dataFim: null,
    status: 'A iniciar', origem: null,
  });

  const editar = (e: Encaminhamento) => setForm({
    id: e.id, organizacaoId: org.id, descricao: e.descricao, responsavel: e.responsavel ?? '',
    dataInicio: e.dataInicio, dataFim: e.dataFim, status: e.status, origem: e.origem,
  });

  const confirmarExclusao = async () => {
    if (!excluindo) return;
    const e = excluindo;
    setExcluindo(null);
    try {
      await escrita.excluirEncaminhamento(e.id);
      registrar('excluir encaminhamento', e.descricao);
      toast.success('Encaminhamento excluído.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível excluir o encaminhamento.');
    }
  };

  const textoOrigem = (e: Encaminhamento): { texto: string; contato: boolean } | null => {
    if (!e.origem) return null;
    if (e.origem.tipo === 'texto') return { texto: e.origem.texto, contato: false };
    const r = registros.get(e.origem.registroId);
    return r ? { texto: rotuloRegistro(r), contato: true } : null;
  };

  return (
    <div className="p-4 sm:p-7 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)' }}>
            {org.pendentes === 0 ? 'Nenhum encaminhamento pendente.' : `${org.pendentes} ${org.pendentes === 1 ? 'pendente' : 'pendentes'}`}
            {concluidos > 0 && ` · ${concluidos} ${concluidos === 1 ? 'concluído' : 'concluídos'}`}
          </p>
          {concluidos > 0 && (
            <label className="inline-flex items-center gap-1.5 cursor-pointer" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>
              <input type="checkbox" checked={mostrarConcluidos} onChange={e => setMostrarConcluidos(e.target.checked)} />
              Mostrar concluídos
            </label>
          )}
        </div>
        {!readOnly && (
          <BotaoNovo onClick={novo} className="self-start sm:self-auto">Novo encaminhamento</BotaoNovo>
        )}
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {[...COLUNAS, 'Ações'].map(h => (
                  <th
                    key={h}
                    className="px-3 py-2.5 text-left"
                    style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 ? (
                <tr>
                  <td colSpan={COLUNAS.length + 1} className="py-12 text-center">
                    <ListChecks size={30} color="var(--line-2)" className="mx-auto mb-2" />
                    <span style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>
                      {org.encaminhamentos.length === 0 ? 'Nenhum encaminhamento registrado.' : 'Todos os encaminhamentos estão concluídos.'}
                    </span>
                  </td>
                </tr>
              ) : linhas.map(e => {
                const origem = textoOrigem(e);
                const cor = COR_STATUS[e.status];
                return (
                  <tr
                    key={e.id}
                    ref={destaque.ref(e.id)}
                    style={{ borderBottom: '1px solid var(--border)', background: doFoco(e) ? 'var(--brand-soft)' : undefined }}
                  >
                    <td className="px-3 py-2.5" style={{ fontSize: '0.8rem', color: 'var(--ink-1)', minWidth: 260, whiteSpace: 'pre-line' }}>
                      {e.descricao}
                    </td>
                    <td className="px-3 py-2.5" style={{ fontSize: '0.78rem', color: e.responsavel ? 'var(--ink-2)' : 'var(--ink-5)' }}>
                      {e.responsavel || '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>
                      {formatDateOnly(e.dataInicio)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>
                      {formatDateOnly(e.dataFim)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ color: cor.cor, background: cor.fundo }}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" style={{ fontSize: '0.76rem', color: origem ? 'var(--ink-3)' : 'var(--ink-5)', minWidth: 180 }}>
                      {origem ? (
                        origem.contato && e.origem?.tipo === 'contato' ? (
                          <button
                            type="button"
                            onClick={() => aoVerRegistro((e.origem as { registroId: string }).registroId)}
                            className="inline-flex items-start gap-1 text-left hover:underline"
                            style={{ color: 'var(--brand-text)' }}
                            title="Abrir o registro de contato de origem"
                          >
                            <MessageSquare size={11} style={{ marginTop: 3, flexShrink: 0 }} />
                            {origem.texto}
                          </button>
                        ) : (
                          <span>{origem.texto}</span>
                        )
                      ) : '—'}
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap">
                      {!readOnly && (
                        <span className="flex items-center gap-1">
                          <button onClick={() => editar(e)} className="p-1.5 rounded hover:bg-accent" aria-label="Editar encaminhamento">
                            <Pencil size={12} color="var(--ink-3)" />
                          </button>
                          <button onClick={() => setExcluindo(e)} className="p-1.5 rounded hover:bg-accent" aria-label="Excluir encaminhamento">
                            <Trash2 size={12} color="var(--danger)" />
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <FormularioEncaminhamento
          form={form}
          aoMudar={setForm}
          org={org}
          aoFechar={() => setForm(null)}
          aoSalvar={async () => {
            if (form.id) {
              await escrita.atualizarEncaminhamento(form.id, form);
              registrar('editar encaminhamento', form.descricao);
              toast.success('Encaminhamento atualizado.');
            } else {
              await escrita.criarEncaminhamento(form);
              registrar('novo encaminhamento', form.descricao);
              toast.success('Encaminhamento registrado.');
            }
            setForm(null);
          }}
        />
      )}

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir encaminhamento?"
          descricao={`"${excluindo.descricao}" será removido da lista da organização. O registro de contato de origem, se houver, não é afetado.`}
          aoCancelar={() => setExcluindo(null)}
          aoConfirmar={confirmarExclusao}
        />
      )}
    </div>
  );
}

function FormularioEncaminhamento({
  form, aoMudar, org, aoFechar, aoSalvar,
}: {
  form: Form;
  aoMudar: (f: Form) => void;
  org: OrganizacaoFicha;
  aoFechar: () => void;
  aoSalvar: () => Promise<void>;
}) {
  const pessoas = usePeople();
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const alterar = <K extends keyof Form>(campo: K, valor: Form[K]) => aoMudar({ ...form, [campo]: valor });

  const tipoOrigem: TipoOrigem = form.origem?.tipo ?? 'nenhuma';
  // Origem apontando para registro que foi excluído entre abrir e salvar: o
  // servidor recusaria; melhor mostrar aqui do que falhar depois.
  const registroSumiu = form.origem?.tipo === 'contato' && !org.registros.some(r => r.id === (form.origem as { registroId: string }).registroId);

  const mudarTipoOrigem = (t: TipoOrigem) => {
    if (t === 'nenhuma') alterar('origem', null);
    else if (t === 'texto') alterar('origem', { tipo: 'texto', texto: '' });
    else alterar('origem', org.registros[0] ? { tipo: 'contato', registroId: org.registros[0].id } : null);
  };

  const salvar = async () => {
    const e = validarEncaminhamento(form);
    if (registroSumiu) e.push('O registro de contato escolhido como origem não existe mais. Escolha outro.');
    setErros(e);
    if (e.length) return;
    setSalvando(true);
    try {
      await aoSalvar();
    } catch (err) {
      setErros([err instanceof Error ? err.message : 'Não foi possível salvar o encaminhamento.']);
    } finally {
      setSalvando(false);
    }
  };

  const baseInput: React.CSSProperties = {
    borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border p-5 sm:p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col gap-3"
        style={{ borderColor: 'var(--border)' }}
        role="dialog"
        aria-label={form.id ? 'Editar encaminhamento' : 'Novo encaminhamento'}
      >
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
            {form.id ? 'Editar encaminhamento' : 'Novo encaminhamento'}
          </h3>
          <button onClick={aoFechar} aria-label="Fechar"><X size={16} /></button>
        </div>

        <Campo rotulo="Descrição" obrigatorio>
          <AreaTexto valor={form.descricao} aoMudar={v => alterar('descricao', v)} linhas={3} />
        </Campo>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Campo rotulo="Responsável">
            <input
              list="responsaveis-equipe"
              className="w-full border rounded-lg px-2.5 py-1.5"
              style={baseInput}
              value={form.responsavel}
              onChange={e => alterar('responsavel', e.target.value)}
            />
            <datalist id="responsaveis-equipe">
              {pessoas.map(p => <option key={p.login} value={p.name} />)}
            </datalist>
          </Campo>
          <Campo rotulo="Status" obrigatorio>
            <Selecao valor={form.status} opcoes={STATUS_ENCAMINHAMENTO} aoMudar={v => alterar('status', v)} />
          </Campo>
          <Campo rotulo="Data inicial">
            <Data valor={form.dataInicio} aoMudar={v => alterar('dataInicio', v)} max={form.dataFim} />
          </Campo>
          <Campo rotulo="Data final">
            <Data valor={form.dataFim} aoMudar={v => alterar('dataFim', v)} min={form.dataInicio} />
          </Campo>
        </div>

        <Campo rotulo="Origem">
          <select className="w-full border rounded-lg px-2.5 py-1.5" style={baseInput} value={tipoOrigem} onChange={e => mudarTipoOrigem(e.target.value as TipoOrigem)}>
            <option value="nenhuma">Sem origem</option>
            <option value="contato" disabled={org.registros.length === 0}>
              Registro de contato{org.registros.length === 0 ? ' (nenhum registrado)' : ''}
            </option>
            <option value="texto">Outra origem (descrever)</option>
          </select>
        </Campo>

        {form.origem?.tipo === 'contato' && (
          <Campo rotulo="Registro de contato" obrigatorio>
            <select
              className="w-full border rounded-lg px-2.5 py-1.5"
              style={baseInput}
              value={form.origem.registroId}
              onChange={e => alterar('origem', { tipo: 'contato', registroId: e.target.value })}
            >
              {registroSumiu && <option value={form.origem.registroId}>Registro excluído</option>}
              {org.registros.map(r => <option key={r.id} value={r.id}>{rotuloRegistro(r)}</option>)}
            </select>
          </Campo>
        )}
        {form.origem?.tipo === 'texto' && (
          <Campo rotulo="Descreva a origem" obrigatorio>
            <Texto
              valor={form.origem.texto}
              aoMudar={v => alterar('origem', { tipo: 'texto', texto: v })}
              placeholder="Ex.: Diagnóstico de 12/08/2026, parecer técnico do projeto 04-2026"
            />
          </Campo>
        )}

        <Erros erros={erros} />
        <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} rotuloSalvar={form.id ? 'Salvar alterações' : 'Registrar encaminhamento'} />
      </div>
    </div>
  );
}
