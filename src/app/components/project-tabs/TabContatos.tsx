import { useMemo, useState } from 'react';
import { Plus, Trash2, X, Pencil, MessageSquare, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { type Project } from '../../data/mockData';
import { COMM_MEIOS, type CommLog } from '../../data/projectExtras';
import { useStore, type ProjectExt } from '../../store';
import { useAuth, usePeople } from '../../auth/authStore';
import { useAudit } from '../../audit/auditStore';
import { CampoAnexo, abrirAnexo } from '../plano/CampoAnexo';

const today = () => new Date().toISOString().slice(0, 10);
const br = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('pt-BR') : '—');

const emptyLog = (org: string): Omit<CommLog, 'id'> => ({
  data: today(),
  hora: new Date().toTimeString().slice(0, 5),
  instituicao: org,
  representante: '',
  meio: 'Ligação',
  quemRealizou: '',
  registro: '',
  saida: '',
});

const COLS = ['Data', 'Hora', 'Instituição', 'Representante', 'Meio', 'Quem realizou', 'Registro de Comunicação', 'Saída', 'Anexo', ''];

export function TabContatos({ project }: { project: Project }) {
  const { getProject, addCommLog, updateCommLog, deleteCommLog } = useStore();
  const { user, readOnly } = useAuth();
  const APP_PEOPLE = usePeople();
  const { log: audit } = useAudit();
  const p = (getProject(project.id) ?? project) as ProjectExt;
  const logs = useMemo(
    () => [...(p.commLogs ?? [])].sort((a, b) => `${b.data}${b.hora}`.localeCompare(`${a.data}${a.hora}`)),
    [p.commLogs],
  );

  const [form, setForm] = useState<(Omit<CommLog, 'id'> & { id?: string }) | null>(null);

  const record = (action: string, detail: string) =>
    audit({
      userLogin: user?.login ?? '—', area: 'contatos', action, detail,
      projectId: p.id, projectName: p.name, kind: 'alteracao',
    });

  const save = () => {
    if (!form) return;
    if (!form.registro.trim()) { toast.error('Descreva o registro de comunicação.'); return; }
    if (form.id != null) {
      updateCommLog(p.id, form.id, form);
      record('editar registro de comunicação', `${br(form.data)} · ${form.representante || form.instituicao}`);
      toast.success('Registro atualizado.');
    } else {
      const { id: _omit, ...data } = form;
      void _omit;
      addCommLog(p.id, data);
      record('novo registro de comunicação', `${br(form.data)} · ${form.representante || form.instituicao}`);
      toast.success('Registro adicionado.');
    }
    setForm(null);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>
            Contatos — Registro de Comunicação
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--ink-4)', marginTop: 2 }}>
            {logs.length} interações registradas com {p.org || p.name}
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setForm(emptyLog(p.org ?? p.name))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white shrink-0"
            style={{ background: 'var(--primary)' }}
          ><Plus size={12} /> Novo registro</button>
        )}
      </div>

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full" style={{ minWidth: 1180 }}>
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                {COLS.map(h => (
                  <th key={h} className="px-3 py-2 text-left"
                    style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} className="py-12 text-center">
                    <MessageSquare size={32} color="var(--line-2)" className="mx-auto mb-2" />
                    <span style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>Nenhuma comunicação registrada ainda.</span>
                  </td>
                </tr>
              ) : logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-accent">
                  <td className="px-3 py-2" style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{br(l.data)}</td>
                  <td className="px-3 py-2" style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{l.hora}</td>
                  <td className="px-3 py-2" style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--ink-1)' }}>{l.instituicao}</td>
                  <td className="px-3 py-2" style={{ fontSize: '0.76rem', color: 'var(--ink-3)' }}>{l.representante || '—'}</td>
                  <td className="px-3 py-2" style={{ fontSize: '0.72rem' }}>
                    <span className="px-2 py-0.5 rounded-md" style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}>{l.meio}</span>
                  </td>
                  <td className="px-3 py-2" style={{ fontSize: '0.76rem', color: 'var(--ink-3)' }}>{l.quemRealizou || '—'}</td>
                  <td className="px-3 py-2" style={{ fontSize: '0.76rem', color: 'var(--ink-1)', minWidth: 280 }}>{l.registro}</td>
                  <td className="px-3 py-2" style={{ fontSize: '0.74rem', color: 'var(--ink-4)', minWidth: 200 }}>{l.saida || '—'}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {l.anexo ? (
                      <button
                        onClick={() => abrirAnexo(l.anexo!.id)}
                        className="inline-flex items-center gap-1 hover:underline"
                        style={{ fontSize: '0.72rem', color: 'var(--info)' }}
                        title={l.anexo.fileName}
                      >
                        <Paperclip size={11} /> abrir
                      </button>
                    ) : (
                      <span style={{ color: 'var(--ink-5)' }}>—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap">
                    {!readOnly && (
                      <span className="flex items-center gap-1">
                        <button onClick={() => setForm({ ...l })} className="p-1 rounded hover:bg-accent" title="Editar">
                          <Pencil size={12} color="var(--ink-3)" />
                        </button>
                        <button
                          onClick={() => {
                            if (!window.confirm('Excluir este registro?')) return;
                            deleteCommLog(p.id, l.id);
                            record('excluir registro de comunicação', `${br(l.data)} · ${l.representante}`);
                            toast.success('Registro excluído.');
                          }}
                          className="p-1 rounded hover:bg-red-50" title="Excluir"
                        ><Trash2 size={12} color="var(--danger)" /></button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setForm(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
                {form.id != null ? 'Editar registro' : 'Novo registro de comunicação'}
              </h3>
              <button onClick={() => setForm(null)}><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Data">
                <input type="date" className="inp" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
              </Field>
              <Field label="Hora">
                <input type="time" className="inp" value={form.hora} onChange={e => setForm({ ...form, hora: e.target.value })} />
              </Field>
              <Field label="Instituição">
                <input className="inp" value={form.instituicao} onChange={e => setForm({ ...form, instituicao: e.target.value })} />
              </Field>
              <Field label="Representante">
                <input className="inp" value={form.representante} onChange={e => setForm({ ...form, representante: e.target.value })} placeholder="Nome(s)" />
              </Field>
              <Field label="Meio">
                <select className="inp" value={form.meio} onChange={e => setForm({ ...form, meio: e.target.value })}>
                  {COMM_MEIOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Quem realizou">
                <input list="pessoas-app" className="inp" value={form.quemRealizou} onChange={e => setForm({ ...form, quemRealizou: e.target.value })} />
                <datalist id="pessoas-app">
                  {APP_PEOPLE.map(pe => <option key={pe.login} value={pe.name} />)}
                </datalist>
              </Field>
              <Field label="Registro de Comunicação" full>
                <textarea className="inp min-h-[80px]" value={form.registro} onChange={e => setForm({ ...form, registro: e.target.value })} />
              </Field>
              <Field label="Saída / encaminhamento" full>
                <textarea className="inp min-h-[60px]" value={form.saida} onChange={e => setForm({ ...form, saida: e.target.value })} />
              </Field>
              <Field label="" full>
                {/* RF-009: um arquivo por registro. Só aparece na edição porque
                    o anexo precisa de um registro já gravado a que se vincular. */}
                <CampoAnexo
                  projetoId={p.id}
                  logComunicacaoId={form.id}
                  anexo={form.id ? logs.find(l => l.id === form.id)?.anexo : null}
                  rotulo="Anexar arquivo ao registro"
                />
              </Field>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={() => setForm(null)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>Cancelar</button>
              <button onClick={save} className="px-4 py-1.5 rounded-md text-[13px] font-medium text-white" style={{ background: 'var(--primary)' }}>Salvar</button>
            </div>
            <style>{`.inp{border:1px solid var(--border);border-radius:8px;padding:6px 10px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
.inp:focus{border-color:var(--primary);background:var(--surface-0)}`}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-[11px] font-medium" style={{ color: 'var(--ink-4)' }}>{label}</span>
      {children}
    </label>
  );
}
