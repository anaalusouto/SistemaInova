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
import { Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, usePeople } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  STATUS_ENCAMINHAMENTO, rotuloRegistro, validarEncaminhamento,
  type OrganizacaoFicha, type Encaminhamento, type EncaminhamentoInput,
} from '../../lib/organizacoes';
import { Campo, Texto, AreaTexto, Data, Selecao, Erros, Acoes, ConfirmarExclusao } from '../plano/camposFormulario';
import { useEscritaOrganizacao } from './useOrganizacoes';
import { BotaoNovo } from '../BotaoNovo';
import { TabelaEncaminhamentos } from './TabelaEncaminhamentos';
import { PopupDetalhe } from '../PopupDetalhe';
import { usePopupChave } from '../PopupNavegacao';
import { Linha, BotaoAcao } from '../plano/PainelBase';


type Form = EncaminhamentoInput & { id?: string };
type TipoOrigem = 'nenhuma' | 'contato' | 'texto' | 'risco';

export function AbaEncaminhamentos({
  org, foco, aoVerRegistro,
}: {
  org: OrganizacaoFicha;
  /** Registro de contato em foco: os encaminhamentos que nasceram dele ficam destacados. */
  foco: string | null;
  aoVerRegistro: (registroId: string) => void;
}) {
  const { user, readOnly } = useAuth();
  const pessoas = usePeople();
  const { log: audit } = useAudit();
  const escrita = useEscritaOrganizacao();
  const [mostrarConcluidos, setMostrarConcluidos] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [excluindo, setExcluindo] = useState<Encaminhamento | null>(null);
  const [consulta, setConsulta] = usePopupChave(`enc-${org.id}`);
  const visto = consulta?.startsWith('enc:') ? org.encaminhamentos.find(e => e.id === consulta.slice(4)) : undefined;
  const contatoVisto = consulta?.startsWith('contato:') ? org.registros.find(r => r.id === consulta.slice(8)) : undefined;

  const registros = useMemo(() => new Map(org.registros.map(r => [r.id, r])), [org.registros]);
  const linhas = mostrarConcluidos ? org.encaminhamentos : org.encaminhamentos.filter(e => e.status !== 'Concluído');
  const concluidos = org.encaminhamentos.filter(e => e.status === 'Concluído').length;

  const registrar = (action: string, detail: string) =>
    audit({ userLogin: user?.login ?? '—', area: 'organizações', action, detail: `${org.nome} · ${detail}`, kind: 'alteracao' });

  const novo = () => setForm({
    organizacaoId: org.id, descricao: '', responsavel: '', responsavelUsuarioId: null, dataInicio: null, dataFim: null,
    status: 'A iniciar', origem: null, classificacaoOrigem: 'Outros',
  });

  const editar = (e: Encaminhamento) => setForm({
    id: e.id, organizacaoId: org.id, descricao: e.descricao, responsavel: e.responsavel ?? '', responsavelUsuarioId: e.responsavelUsuarioId,
    dataInicio: e.dataInicio, dataFim: e.dataFim, status: e.status, origem: e.origem, classificacaoOrigem: e.classificacaoOrigem ?? (e.origem?.tipo === 'risco' ? 'Riscos' : 'Outros'),
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
    if (e.origem.tipo === 'risco') return { texto: `Risco: ${e.origem.texto}${e.origem.excluido ? ` (excluído${e.origem.referencia ? ` · ${e.origem.referencia}` : ''})` : ''}`, contato: false };
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
          {(
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

      <TabelaEncaminhamentos org={org} foco={foco} linhas={linhas} mostrarConcluidos={mostrarConcluidos} readOnly={readOnly} pessoas={pessoas} textoOrigem={textoOrigem} aoConsultar={id => setConsulta(`enc:${id}`)} aoContato={id => setConsulta(`contato:${id}`)} aoEditar={editar} aoExcluir={setExcluindo} />

      {visto && <PopupDetalhe titulo="Encaminhamento" descricao={org.nome} aoFechar={() => setConsulta(null)}
        acoes={!readOnly ? <BotaoAcao aoClicar={() => { setConsulta(null); editar(visto); }}><Pencil size={12} /> Editar encaminhamento</BotaoAcao> : undefined}>
        <Linha rotulo="Descrição">{visto.descricao}</Linha>
        <Linha rotulo="Responsável">{pessoas.find(p => p.id === visto.responsavelUsuarioId)?.name ?? visto.responsavel ?? 'Não informado'}</Linha>
        <Linha rotulo="Status">{visto.status}</Linha>
        <Linha rotulo="Período">{formatDateOnly(visto.dataInicio)} — {formatDateOnly(visto.dataFim)}</Linha>
        <Linha rotulo="Origem">{visto.classificacaoOrigem ?? (visto.origem?.tipo === 'risco' ? 'Riscos' : 'Outros')}</Linha>
        <Linha rotulo="Vínculo">{visto.origem?.tipo === 'contato' ? <button className="underline" onClick={() => { if (visto.origem?.tipo === 'contato') setConsulta(`contato:${visto.origem.registroId}`); }}>{textoOrigem(visto)?.texto ?? 'Ver registro de contato'}</button> : textoOrigem(visto)?.texto ?? 'Não informado'}</Linha>
      </PopupDetalhe>}
      {contatoVisto && <PopupDetalhe titulo={contatoVisto.assunto ?? 'Registro de contato'} descricao={org.nome} aoFechar={() => setConsulta(null)}>
        <Linha rotulo="Data">{formatDateOnly(contatoVisto.data)} {contatoVisto.hora ?? ''}</Linha>
        <Linha rotulo="Participantes">{contatoVisto.participantes.join(', ') || 'Não informados'}</Linha>
        <Linha rotulo="Meio">{contatoVisto.meio ?? 'Não informado'}</Linha>
        <Linha rotulo="Resumo">{contatoVisto.resumo}</Linha>
        <button className="text-sm underline mt-4" onClick={() => aoVerRegistro(contatoVisto.id)}>Ir para registros de contato</button>
      </PopupDetalhe>}
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

export function FormularioEncaminhamento({
  form, aoMudar, org, aoFechar, aoSalvar, origemFixa = false,
}: {
  form: Form;
  aoMudar: (f: Form) => void;
  org: OrganizacaoFicha;
  aoFechar: () => void;
  aoSalvar: () => Promise<void>;
  origemFixa?: boolean;
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
        role="dialog" data-inova-form="encaminhamento"
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
          <Campo rotulo="Responsável" obrigatorio={form.origem?.tipo === 'risco'}>
            <select aria-label="Responsável cadastrado"
              className="w-full border rounded-lg px-2.5 py-1.5" style={baseInput}
              value={form.responsavelUsuarioId ?? (form.responsavel ? '__legado__' : '')}
              onChange={e => {
                const pessoa = pessoas.find(p => p.id === e.target.value);
                aoMudar({ ...form, responsavelUsuarioId: pessoa?.id ?? null, responsavel: pessoa?.name ?? '' });
              }}>
              <option value="">Não informado</option>
              {!form.responsavelUsuarioId && form.responsavel && <option value="__legado__">{form.responsavel} (registro antigo sem vínculo)</option>}
              {form.responsavelUsuarioId && !pessoas.some(p => p.id === form.responsavelUsuarioId) && <option value={form.responsavelUsuarioId}>{form.responsavel} (cadastro indisponível)</option>}
              {pessoas.filter(p => p.id).map(p => <option key={p.id} value={p.id}>{p.name} ({p.login})</option>)}
            </select>
          </Campo>
          <Campo rotulo="Status" obrigatorio>
            <Selecao valor={form.status} opcoes={STATUS_ENCAMINHAMENTO} aoMudar={v => alterar('status', v)} />
          </Campo>
          <Campo rotulo="Data inicial">
            <Data valor={form.dataInicio} aoMudar={v => alterar('dataInicio', v)} max={form.dataFim} />
          </Campo>
          <Campo rotulo="Data final" obrigatorio={form.origem?.tipo === 'risco'}>
            <Data valor={form.dataFim} aoMudar={v => alterar('dataFim', v)} min={form.dataInicio} />
          </Campo>
        </div>

        <Campo rotulo="Origem" obrigatorio>
          <select className="w-full border rounded-lg px-2.5 py-1.5" style={baseInput} value={form.classificacaoOrigem ?? (form.origem?.tipo === 'risco' ? 'Riscos' : 'Outros')} onChange={e => alterar('classificacaoOrigem', e.target.value as NonNullable<Form['classificacaoOrigem']>)}>
            <option>Plano de trabalho</option><option>Riscos</option><option>Outros</option>
          </select>
        </Campo>
        <Campo rotulo="Vínculo">
          <select disabled={origemFixa || form.origem?.tipo === 'risco'} className="w-full border rounded-lg px-2.5 py-1.5" style={baseInput} value={tipoOrigem} onChange={e => mudarTipoOrigem(e.target.value as TipoOrigem)}>
            <option value="nenhuma">Sem origem</option>
            <option value="contato" disabled={org.registros.length === 0}>
              Registro de contato{org.registros.length === 0 ? ' (nenhum registrado)' : ''}
            </option>
            <option value="texto">Outra origem (descrever)</option>
            {form.origem?.tipo === 'risco' && <option value="risco">Risco: {form.origem.texto}{form.origem.excluido ? ' (excluído)' : ''}</option>}
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
              placeholder="Ex.: Mapeamento de 12/08/2026, parecer técnico do projeto 04-2026"
            />
          </Campo>
        )}

        <Erros erros={erros} />
        <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} rotuloSalvar={form.id ? 'Salvar alterações' : 'Registrar encaminhamento'} />
      </div>
    </div>
  );
}
