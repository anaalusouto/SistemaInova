import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Check, Pencil } from 'lucide-react';
import { IEO_DIMENSOES, type IeoPergunta } from '../../diagnostic/catalog/ieo';
import { calcularIeo } from '../../diagnostic/ieoCalculation';
import { listarRespostasIeo, salvarRespostaIeo, type IeoResposta } from '../../diagnosticos.server';
import { Campo } from './DiagnosticUI';
import { OpcaoNivel } from './OpcaoNivel';
import { CORES_ESCALA } from '../../theme/coresInstitucionais';

interface IeoTabProps {
  diagnosticoId: string;
  readOnly: boolean;
}

const fmtScore = (v: number | null) => (v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

export function IeoTab({ diagnosticoId, readOnly }: IeoTabProps) {
  const queryClient = useQueryClient();
  const [dimensaoId, setDimensaoId] = useState('todas');
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ nivel: string | null; observacao: string }>({ nivel: null, observacao: '' });

  const { data: respostas = [], isLoading, error, refetch } = useQuery({
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

  if (isLoading) return <p role="status">Carregando IEO…</p>;
  if (error) return <p role="alert">Não foi possível carregar o IEO. <button type="button" className="underline" onClick={() => void refetch()}>Tentar novamente</button></p>;
  if (dimensaoId === 'todas') {
    const respondidas = resultado.porDimensao.reduce((s, d) => s + d.respondidas, 0);
    const total = resultado.porDimensao.reduce((s, d) => s + d.total, 0);
    return <div className="space-y-6 min-w-0">
      <h3 className="text-2xl sm:text-3xl font-bold">Índice de Estruturação Organizacional — IEO</h3>
      <div className="flex flex-wrap gap-2" aria-label="Dimensões do IEO"><button type="button" className="diagnostico-filtro" data-active="true" aria-pressed="true">Todas as dimensões</button>{IEO_DIMENSOES.map(d => <button type="button" key={d.id} className="diagnostico-filtro" onClick={() => setDimensaoId(d.id)}>{d.titulo}</button>)}</div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4"><div><h4 className="font-semibold">Pontuações do IEO</h4><p className="text-sm text-muted-foreground">Resultados por dimensão · selecione para aprofundar</p></div><div className="text-right"><p className="text-3xl font-bold">{fmtScore(resultado.geral)}<span className="text-sm font-normal text-muted-foreground"> / 4</span></p><p className="text-xs text-muted-foreground">IEO geral · {respondidas}/{total} perguntas respondidas</p></div></div>
          <div className="grid gap-3 md:grid-cols-2">{resultado.porDimensao.map(d => <button type="button" key={d.dimensaoId} onClick={() => setDimensaoId(d.dimensaoId)} className="rounded-xl border bg-card p-5 text-left hover:border-primary transition-colors"><h4 className="font-semibold text-sm min-h-12">{d.dimensaoTitulo}</h4><p className="text-2xl font-bold mt-4">{fmtScore(d.media)}<span className="text-xs font-normal text-muted-foreground"> / 4</span></p><div className="diagnostico-termometro" role="img" aria-label={d.media == null ? 'Sem pontuação' : `Pontuação ${fmtScore(d.media)} de 4`}>{d.media != null && <span style={{ left: `${Math.max(0, Math.min(100, ((d.media - 1) / 3) * 100))}%` }}/>}</div><p className="text-xs text-muted-foreground mt-3">Média dos níveis respondidos</p><p className="text-xs text-muted-foreground mt-1">{d.respondidas}/{d.total} perguntas · {Math.round(d.respondidas / d.total * 100)}% de cobertura</p></button>)}</div>
          <p className="text-xs text-muted-foreground">O IEO geral é a média das dimensões com respostas. Perguntas sem resposta não contam como zero.</p>
        </div>
        <aside className="rounded-xl border bg-muted/30 p-5 space-y-5"><div><p className="diagnostico-sobretitulo">Visão geral</p><h4 className="font-semibold">Resumo geral de análise</h4><p className="text-sm text-muted-foreground mt-3">{respondidas} de {total} perguntas respondidas.</p></div><h5 className="font-semibold text-sm">Relatos por dimensão</h5>{IEO_DIMENSOES.map(d => {
          const relatos = d.subdimensoes.flatMap(s => s.perguntas).map(p => respostaMap.get(p.id)?.observacao).filter(Boolean);
          return <section key={d.id} className="border-t pt-4"><h5 className="text-sm font-semibold">{d.titulo}</h5>{relatos.length ? relatos.map((texto, i) => <p key={i} className="text-xs text-muted-foreground whitespace-pre-wrap mt-2">{texto}</p>) : <p className="text-xs text-muted-foreground mt-2">Sem observações registradas.</p>}</section>;
        })}</aside>
      </div>
    </div>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:gap-6 items-start max-w-6xl">
      <div className="grid w-full min-w-0 grid-cols-1 sm:grid-cols-2 gap-2 lg:flex lg:w-64 lg:shrink-0 lg:flex-col">
        <button type="button" onClick={() => { setDimensaoId('todas'); setOpenId(null); setEditingId(null); }} className="text-sm text-primary text-left underline mb-2">← Todas as dimensões</button>
        <div className="bg-card rounded-xl border p-4 mb-2 sm:col-span-2" style={{ borderColor: 'var(--border)' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>IEO Geral</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--ink-1)' }}>{fmtScore(resultado.geral)}</p>
        </div>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground sm:col-span-2 lg:hidden">Dimensão do IEO
          <select aria-label="Dimensão do IEO" value={dimensaoId} onChange={e=>{setDimensaoId(e.target.value);setOpenId(null);setEditingId(null);}} className="min-h-11 w-full min-w-0 rounded-lg border bg-card px-2 text-sm text-foreground">
            {IEO_DIMENSOES.map(d=><option key={d.id} value={d.id}>{d.titulo}</option>)}
          </select>
        </label>
        {IEO_DIMENSOES.map(d => {
          const r = resultado.porDimensao.find(x => x.dimensaoId === d.id)!;
          const active = d.id === dimensaoId;
          return (
            <button
              key={d.id}
              onClick={() => { setDimensaoId(d.id); setOpenId(null); setEditingId(null); }}
              className="hidden min-w-0 items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left lg:flex"
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

      <div className="w-full min-w-0 flex-1 flex flex-col gap-6">
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
              const cores = resposta && CORES_ESCALA[resposta.nivel as keyof typeof CORES_ESCALA];

              return (
                <div key={pergunta.id} data-inova-form="ieo" data-inova-field={pergunta.id} className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={() => toggleOpen(pergunta, resposta)} className="w-full min-w-0 flex flex-wrap items-start justify-between gap-2 px-3 sm:px-4 py-3 text-left">
                    <div className="flex min-w-0 flex-1 basis-full items-start gap-2 sm:basis-auto">
                      {open ? <ChevronDown size={14} color="var(--ink-5)" /> : <ChevronRight size={14} color="var(--ink-5)" />}
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>{pergunta.id}</span>
                      <span style={{ fontSize: '0.83rem', fontWeight: 500, color: 'var(--ink-1)' }}>{pergunta.texto}</span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                      style={{ color: cores ? cores.destaque : 'var(--ink-5)', background: cores ? `linear-gradient(${cores.fundo}, ${cores.fundo}), #FFFFFF` : 'var(--surface-2)' }}
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
                            <button onClick={() => startEdit(resposta)} className="inline-flex items-center gap-1 text-[12px] font-medium hover:underline w-fit mt-1" style={{ color: 'var(--primary)' }}>
                              <Pencil size={12} /> Editar
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 pt-3">
                          <div className="flex flex-col gap-1.5">
                            {pergunta.niveis.map(n => (
                              <OpcaoNivel key={n.valor} nivel={Number(n.valor) as keyof typeof CORES_ESCALA}
                                descricao={n.descricao} selecionado={draft.nivel === n.valor}
                                aoSelecionar={() => setDraft(d => ({ ...d, nivel: n.valor }))} />
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
