import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { IEO_DIMENSOES, type IeoPergunta } from '../../diagnostic/catalog/ieo';
import { calcularIeo } from '../../diagnostic/ieoCalculation';
import { listarRespostasIeo, salvarRespostaIeo, type IeoResposta } from '../../diagnosticos.server';
import { Campo, Chip } from './DiagnosticUI';

interface IeoTabProps {
  diagnosticoId: string;
  readOnly: boolean;
}

const fmtScore = (v: number | null) => (v == null ? '—' : v.toFixed(1));

export function IeoTab({ diagnosticoId, readOnly }: IeoTabProps) {
  const queryClient = useQueryClient();
  const [dimensaoId, setDimensaoId] = useState(IEO_DIMENSOES[0].id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ nivel: string | null; observacao: string }>({ nivel: null, observacao: '' });

  const { data: respostas = [] } = useQuery({
    queryKey: ['diagnostico-ieo', diagnosticoId],
    queryFn: () => listarRespostasIeo({ data: { diagnosticoId } }),
  });
  const respostaMap = useMemo(() => new Map(respostas.map(r => [r.perguntaId, r])), [respostas]);

  const resultado = useMemo(
    () => calcularIeo(respostas.map(r => ({ perguntaId: r.perguntaId, nivel: r.nivel }))),
    [respostas],
  );

  const salvar = useMutation({
    mutationFn: (payload: { perguntaId: string; nivel: number; observacao: string | null }) =>
      salvarRespostaIeo({ data: { diagnosticoId, ...payload } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico-ieo', diagnosticoId] });
      setEditingId(null);
      toast.success('Resposta salva.');
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível salvar.'),
  });

  const dimensaoAtiva = IEO_DIMENSOES.find(d => d.id === dimensaoId)!;

  const toggleOpen = (pergunta: IeoPergunta, resposta: IeoResposta | undefined) => {
    if (openId === pergunta.id) { setOpenId(null); setEditingId(null); return; }
    setOpenId(pergunta.id);
    setEditingId(!readOnly && !resposta ? pergunta.id : null);
    setDraft({ nivel: resposta?.nivel != null ? String(resposta.nivel) : null, observacao: resposta?.observacao ?? '' });
  };

  const startEdit = (resposta: IeoResposta | undefined) => {
    setDraft({ nivel: resposta?.nivel != null ? String(resposta.nivel) : null, observacao: resposta?.observacao ?? '' });
    setEditingId(openId);
  };

  return (
    <div className="flex gap-6 items-start max-w-6xl">
      <div className="flex flex-col gap-1 w-72 flex-shrink-0">
        <div className="bg-card rounded-xl border p-4 mb-2" style={{ borderColor: 'var(--border)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IEO Geral</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--ink-1)' }}>{fmtScore(resultado.geral)}</p>
        </div>
        {IEO_DIMENSOES.map(d => {
          const r = resultado.porDimensao.find(x => x.dimensaoId === d.id)!;
          const active = d.id === dimensaoId;
          return (
            <button
              key={d.id}
              onClick={() => { setDimensaoId(d.id); setOpenId(null); setEditingId(null); }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left"
              style={{ background: active ? 'var(--brand-soft)' : 'transparent', border: `1px solid ${active ? 'var(--primary)' : 'transparent'}` }}
            >
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: active ? 600 : 500, color: 'var(--ink-1)' }}>{d.titulo}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{r.respondidas}/{r.total} perguntas</div>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>{fmtScore(r.media)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col gap-6">
        {dimensaoAtiva.subdimensoes.map(sub => (
          <div key={sub.id} className="flex flex-col gap-3">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--ink-1)' }}>
              {sub.id} {sub.titulo}
            </h3>
            {sub.perguntas.map(pergunta => {
              const resposta = respostaMap.get(pergunta.id);
              const open = openId === pergunta.id;
              const editing = editingId === pergunta.id;
              const nivelSelecionado = pergunta.niveis.find(n => n.valor === resposta?.nivel?.toString());

              return (
                <div key={pergunta.id} className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleOpen(pergunta, resposta)} className="w-full flex items-center justify-between px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      {open ? <ChevronDown size={14} color="var(--ink-5)" /> : <ChevronRight size={14} color="var(--ink-5)" />}
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>{pergunta.id}</span>
                      <span style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--ink-1)' }}>{pergunta.texto}</span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                      style={{ color: resposta ? 'var(--success)' : 'var(--ink-5)', background: resposta ? 'var(--success-soft)' : 'var(--surface-2)' }}
                    >
                      {resposta ? `Nível ${resposta.nivel}` : 'Pendente'}
                    </span>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
                      {!editing ? (
                        <div className="flex flex-col gap-2 pt-3">
                          {resposta ? (
                            <>
                              <Campo label="Nível" valor={`${resposta.nivel} — ${nivelSelecionado?.descricao ?? ''}`} />
                              {resposta.observacao && <Campo label="Observação" valor={resposta.observacao} />}
                            </>
                          ) : (
                            <p style={{ fontSize: '0.78rem', color: 'var(--ink-5)' }}>Nenhuma resposta registrada ainda.</p>
                          )}
                          {!readOnly && (
                            <button onClick={() => startEdit(resposta)} className="text-[12px] font-medium hover:underline w-fit mt-1" style={{ color: 'var(--primary)' }}>
                              Editar
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 pt-3">
                          <div className="flex flex-col gap-1.5">
                            {pergunta.niveis.map(n => (
                              <Chip key={n.valor} active={draft.nivel === n.valor} onClick={() => setDraft(d => ({ ...d, nivel: n.valor }))}>
                                <span style={{ fontWeight: 700 }}>{n.valor}</span> — {n.descricao}
                              </Chip>
                            ))}
                          </div>
                          <label className="flex flex-col gap-1">
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-4)' }}>Observação (opcional)</span>
                            <textarea
                              value={draft.observacao}
                              onChange={e => setDraft(d => ({ ...d, observacao: e.target.value }))}
                              className="border rounded-lg px-3 py-2 text-[13px] min-h-[60px]"
                              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
                            />
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => draft.nivel && salvar.mutate({ perguntaId: pergunta.id, nivel: Number(draft.nivel), observacao: draft.observacao || null })}
                              disabled={!draft.nivel || salvar.isPending}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-medium text-white disabled:opacity-60"
                              style={{ background: 'var(--primary)' }}
                            >
                              <Check size={13} /> Salvar
                            </button>
                            {resposta && (
                              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-md border text-[13px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
                                Cancelar
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
