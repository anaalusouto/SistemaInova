/**
 * Registros de contato da organização (RC-03).
 *
 * Substitui a aba Contato do projeto: o histórico é da organização, e quem
 * volta a falar com ela precisa ver tudo o que já foi tratado, de qualquer
 * projeto. Cada registro mostra data, participantes, assunto, resumo e, quando
 * houver, o meio.
 */
import { useState } from 'react';
import { Plus, Pencil, Trash2, MessageSquare, Paperclip, X, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, usePeople } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  MEIOS_CONTATO, NAO_INFORMADO, validarRegistro,
  type OrganizacaoFicha, type RegistroContato, type RegistroContatoInput,
} from '../../lib/organizacoes';
import { CampoAnexo, abrirAnexo } from '../plano/CampoAnexo';
import { Campo, Texto, AreaTexto, Data, Erros, Acoes, ConfirmarExclusao } from '../plano/camposFormulario';
import { useEscritaOrganizacao } from './useOrganizacoes';

const hoje = () => new Date().toISOString().slice(0, 10);

type Form = RegistroContatoInput & { id?: string };

export function AbaRegistrosContato({ org }: { org: OrganizacaoFicha }) {
  const { user, readOnly } = useAuth();
  const { log: audit } = useAudit();
  const escrita = useEscritaOrganizacao();
  const [form, setForm] = useState<Form | null>(null);
  const [excluindo, setExcluindo] = useState<RegistroContato | null>(null);

  const registrar = (action: string, detail: string) =>
    audit({ userLogin: user?.login ?? '—', area: 'organizações', action, detail: `${org.nome} · ${detail}`, kind: 'alteracao' });

  const novo = () => setForm({
    organizacaoId: org.id, data: hoje(), hora: new Date().toTimeString().slice(0, 5),
    participantes: user?.displayName ? [user.displayName] : [], assunto: '', resumo: '', meio: 'Ligação',
  });

  const editar = (r: RegistroContato) => setForm({
    id: r.id, organizacaoId: org.id, data: r.data, hora: r.hora ?? '',
    participantes: r.participantes, assunto: r.assunto ?? '', resumo: r.resumo, meio: r.meio ?? '',
  });

  const origemDe = (registroId: string) =>
    org.encaminhamentos.filter(e => e.origem?.tipo === 'contato' && e.origem.registroId === registroId);

  const confirmarExclusao = async () => {
    if (!excluindo) return;
    const r = excluindo;
    setExcluindo(null);
    try {
      await escrita.excluirRegistro(r.id);
      registrar('excluir registro de contato', `${formatDateOnly(r.data)} · ${r.assunto ?? ''}`);
      toast.success('Registro excluído.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível excluir o registro.');
    }
  };

  const vinculados = excluindo ? origemDe(excluindo.id).length : 0;

  return (
    <div className="p-4 sm:p-7 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-4)' }}>
          {org.registros.length === 0
            ? 'Nenhum contato registrado com esta organização.'
            : `${org.registros.length} ${org.registros.length === 1 ? 'registro' : 'registros'}, do mais recente para o mais antigo.`}
        </p>
        {!readOnly && (
          <button
            onClick={novo}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white self-start sm:self-auto"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={12} /> Novo registro
          </button>
        )}
      </div>

      {org.registros.length === 0 ? (
        <div className="bg-card rounded-xl border py-12 text-center" style={{ borderColor: 'var(--border)' }}>
          <MessageSquare size={32} color="var(--line-2)" className="mx-auto mb-2" />
          <span style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>Nenhum contato registrado ainda.</span>
        </div>
      ) : (
        <ol className="space-y-3">
          {org.registros.map(r => {
            const encs = origemDe(r.id);
            return (
              <li key={r.id} className="bg-card rounded-xl border p-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatDateOnly(r.data)}{r.hora ? ` · ${r.hora}` : ''}
                      </span>
                      {r.meio && (
                        <span className="px-2 py-0.5 rounded-md" style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}>
                          {r.meio}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: r.assunto ? 'var(--ink-1)' : 'var(--ink-5)', marginTop: 4, fontStyle: r.assunto ? undefined : 'italic' }}>
                      {r.assunto || 'Assunto não informado'}
                    </h3>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => editar(r)} className="p-1.5 rounded hover:bg-accent" aria-label="Editar registro">
                        <Pencil size={13} color="var(--ink-3)" />
                      </button>
                      <button onClick={() => setExcluindo(r)} className="p-1.5 rounded hover:bg-accent" aria-label="Excluir registro">
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    </div>
                  )}
                </div>

                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-[110px_1fr] gap-x-3 gap-y-1.5" style={{ fontSize: '0.8rem' }}>
                  <dt style={{ color: 'var(--ink-5)', fontWeight: 600, fontSize: '0.72rem' }}>Participantes</dt>
                  <dd style={{ color: r.participantes.length ? 'var(--ink-2)' : 'var(--ink-5)' }}>
                    {r.participantes.length ? r.participantes.join(', ') : NAO_INFORMADO}
                  </dd>
                  <dt style={{ color: 'var(--ink-5)', fontWeight: 600, fontSize: '0.72rem' }}>Resumo</dt>
                  <dd style={{ color: 'var(--ink-1)', whiteSpace: 'pre-line' }}>{r.resumo}</dd>
                </dl>

                {(r.anexo || encs.length > 0) && (
                  <div className="mt-3 flex items-center gap-3 flex-wrap" style={{ fontSize: '0.72rem' }}>
                    {r.anexo && (
                      <button
                        onClick={() => abrirAnexo(r.anexo!.id)}
                        className="inline-flex items-center gap-1 hover:underline"
                        style={{ color: 'var(--info)' }}
                        title={r.anexo.fileName}
                      >
                        <Paperclip size={11} /> {r.anexo.fileName}
                      </button>
                    )}
                    {encs.length > 0 && (
                      <span className="inline-flex items-center gap-1" style={{ color: 'var(--ink-4)' }}>
                        <ListChecks size={11} />
                        {encs.length === 1 ? 'Origem de 1 encaminhamento' : `Origem de ${encs.length} encaminhamentos`}
                      </span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {form && (
        <FormularioRegistro
          form={form}
          aoMudar={setForm}
          anexo={form.id ? org.registros.find(r => r.id === form.id)?.anexo ?? null : null}
          aoFechar={() => setForm(null)}
          aoSalvar={async () => {
            if (form.id) {
              await escrita.atualizarRegistro(form.id, form);
              registrar('editar registro de contato', `${formatDateOnly(form.data)} · ${form.assunto}`);
              toast.success('Registro atualizado.');
            } else {
              await escrita.criarRegistro(form);
              registrar('novo registro de contato', `${formatDateOnly(form.data)} · ${form.assunto}`);
              toast.success('Registro adicionado.');
            }
            setForm(null);
          }}
        />
      )}

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir registro de contato?"
          descricao={
            `O registro de ${formatDateOnly(excluindo.data)}${excluindo.assunto ? ` ("${excluindo.assunto}")` : ''} ` +
            'e o arquivo anexado a ele serão excluídos.' +
            (vinculados
              ? ` ${vinculados === 1 ? '1 encaminhamento aponta' : `${vinculados} encaminhamentos apontam`} para este registro como origem: ` +
                `${vinculados === 1 ? 'ele continua' : 'eles continuam'} na lista, sem origem.`
              : '')
          }
          aoCancelar={() => setExcluindo(null)}
          aoConfirmar={confirmarExclusao}
        />
      )}
    </div>
  );
}

function FormularioRegistro({
  form, aoMudar, anexo, aoFechar, aoSalvar,
}: {
  form: Form;
  aoMudar: (f: Form) => void;
  anexo: RegistroContato['anexo'];
  aoFechar: () => void;
  aoSalvar: () => Promise<void>;
}) {
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const alterar = <K extends keyof Form>(campo: K, valor: Form[K]) => aoMudar({ ...form, [campo]: valor });

  const salvar = async () => {
    const e = validarRegistro(form);
    setErros(e);
    if (e.length) return;
    setSalvando(true);
    try {
      await aoSalvar();
    } catch (err) {
      setErros([err instanceof Error ? err.message : 'Não foi possível salvar o registro.']);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-3"
        style={{ borderColor: 'var(--border)' }}
        role="dialog"
        aria-label={form.id ? 'Editar registro de contato' : 'Novo registro de contato'}
      >
        <div className="flex items-center justify-between">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
            {form.id ? 'Editar registro de contato' : 'Novo registro de contato'}
          </h3>
          <button onClick={aoFechar} aria-label="Fechar"><X size={16} /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo rotulo="Data" obrigatorio>
            <Data valor={form.data} aoMudar={v => alterar('data', v ?? '')} />
          </Campo>
          <Campo rotulo="Hora">
            <input
              type="time"
              className="w-full border rounded-lg px-2.5 py-1.5"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
              value={form.hora}
              onChange={e => alterar('hora', e.target.value)}
            />
          </Campo>
          <Campo rotulo="Meio de contato">
            <select
              className="w-full border rounded-lg px-2.5 py-1.5"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
              value={form.meio}
              onChange={e => alterar('meio', e.target.value)}
            >
              <option value="">Não informado</option>
              {MEIOS_CONTATO.map(m => <option key={m} value={m}>{m}</option>)}
              {form.meio && !(MEIOS_CONTATO as readonly string[]).includes(form.meio) && (
                <option value={form.meio}>{form.meio}</option>
              )}
            </select>
          </Campo>
        </div>

        <Campo rotulo="Participantes" obrigatorio dica="Da equipe e da organização. Enter ou vírgula adiciona.">
          <CampoParticipantes valor={form.participantes} aoMudar={v => alterar('participantes', v)} />
        </Campo>

        <Campo rotulo="Assunto" obrigatorio>
          <Texto valor={form.assunto} aoMudar={v => alterar('assunto', v)} placeholder="Ex.: Planejamento da visita técnica" />
        </Campo>

        <Campo rotulo="Resumo do que foi tratado" obrigatorio>
          <AreaTexto valor={form.resumo} aoMudar={v => alterar('resumo', v)} linhas={4} />
        </Campo>

        {/* RF-009: um arquivo por registro. O anexo precisa de um registro já
            gravado a que se vincular, por isso só funciona na edição. */}
        <CampoAnexo projetoId={null} logComunicacaoId={form.id} anexo={anexo} rotulo="Anexar arquivo ao registro" />

        <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
          Tarefas que saíram deste contato vão para a aba Encaminhamentos, com este registro como origem.
        </p>

        <Erros erros={erros} />
        <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} rotuloSalvar={form.id ? 'Salvar alterações' : 'Registrar contato'} />
      </div>
    </div>
  );
}

/** Lista de nomes como etiquetas. Sugere as pessoas da equipe. */
function CampoParticipantes({ valor, aoMudar }: { valor: string[]; aoMudar: (v: string[]) => void }) {
  const pessoas = usePeople();
  const [texto, setTexto] = useState('');

  const adicionar = (bruto: string) => {
    const novos = bruto.split(',').map(s => s.trim()).filter(Boolean)
      .filter(n => !valor.some(v => v.toLowerCase() === n.toLowerCase()));
    if (novos.length) aoMudar([...valor, ...novos]);
    setTexto('');
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 border rounded-lg px-2 py-1.5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      {valor.map(nome => (
        <span
          key={nome}
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5"
          style={{ background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: '0.76rem' }}
        >
          {nome}
          <button type="button" onClick={() => aoMudar(valor.filter(v => v !== nome))} aria-label={`Remover ${nome}`}>
            <X size={11} color="var(--ink-4)" />
          </button>
        </span>
      ))}
      <input
        list="participantes-equipe"
        className="flex-1 min-w-[140px] bg-transparent outline-none"
        style={{ fontSize: '0.8rem', color: 'var(--ink-1)' }}
        value={texto}
        placeholder={valor.length ? '' : 'Nome do participante'}
        onChange={e => {
          const v = e.target.value;
          if (v.includes(',')) adicionar(v);
          else setTexto(v);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); adicionar(texto); }
          else if (e.key === 'Backspace' && !texto && valor.length) aoMudar(valor.slice(0, -1));
        }}
        onBlur={() => { if (texto.trim()) adicionar(texto); }}
      />
      <datalist id="participantes-equipe">
        {pessoas.map(p => <option key={p.login} value={p.name} />)}
      </datalist>
    </div>
  );
}
