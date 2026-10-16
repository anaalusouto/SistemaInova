import { Fragment, useMemo, useState } from 'react';
import { indiceConclusao } from '../../lib/conclusaoPlano';
import { ChevronDown, ChevronRight, Paperclip, AlertTriangle, ShieldAlert, CornerDownRight, Pencil, Eye } from 'lucide-react';
import { type Goal, type Activity, type Risk, type Deliverable } from '../../data/mockData';
import { formatDateOnly } from '../../lib/dateOnly';
import { useAuth } from '../../auth/authStore';
import { useStore } from '../../store';
import { toast } from 'sonner';
import { dadosDaAtividade, errosDaEdicao } from '../../lib/edicaoLinhaPlano';
import type { AtividadeInput } from '../../planoTrabalho.server';
import { progressoParaStatus } from '../../lib/planoTrabalho';
import {
  estaAtrasada, riscoDaEtapa, hojeISO, prazoDaMeta, divergenciaDaMeta,
  type RiscoDaLinha,
} from '../../lib/planoTrabalho';

const COLUNAS = [
  'Atividade', 'Observações', 'Início previsto', 'Fim previsto',
  'Início', 'Fim', 'Status', 'Justificativa de atraso', 'Nível risco', 'Anexo',
];

const CORES_FAIXA: Record<string, { cor: string; fundo: string }> = {
  'Baixo':   { cor: 'var(--success)', fundo: 'var(--success-soft)' },
  'Médio':   { cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)' },
  'Alto':    { cor: 'var(--alert)', fundo: 'var(--alert-soft)' },
  'Crítico': { cor: 'var(--danger)', fundo: 'var(--danger-soft)' },
};

/** Célula de data. Vazio vira travessão — ausência explícita, não zero. */
function Data({ valor }: { valor: string | null }) {
  if (!valor) return <span style={{ color: 'var(--ink-5)' }}>—</span>;
  return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{formatDateOnly(valor)}</span>;
}

/**
 * Estado da atividade. RN-010 exige sinal textual ou ícone ALÉM da cor —
 * cor sozinha não chega a quem não distingue vermelho e verde, e some na
 * impressão em preto e branco.
 */
function Estado({ atividade, hoje }: { atividade: Activity; hoje: string }) {
  const atrasada = estaAtrasada(atividade, hoje);
  if (atrasada) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap"
        style={{ background: 'var(--alert-soft)', color: 'var(--alert)', fontSize: '0.7rem', fontWeight: 600 }}
        title={`Fim previsto em ${formatDateOnly(atividade.plannedEnd)}, ainda não concluída`}
      >
        <AlertTriangle size={11} /> Atrasada
      </span>
    );
  }
  const cfg =
    atividade.status === 'Concluído' ? { cor: 'var(--success)', fundo: 'var(--success-soft)' } :
    atividade.status === 'Em andamento' ? { cor: 'var(--brand)', fundo: 'var(--brand-soft)' } :
    { cor: 'var(--ink-4)', fundo: 'var(--surface-2)' };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-md whitespace-nowrap"
      style={{ background: cfg.fundo, color: cfg.cor, fontSize: '0.7rem', fontWeight: 500 }}
    >
      {atividade.status}
    </span>
  );
}

function NivelRisco({ risco }: { risco: RiscoDaLinha | null }) {
  if (!risco) return <span style={{ color: 'var(--ink-5)' }}>—</span>;
  const cfg = CORES_FAIXA[risco.faixa] ?? { cor: 'var(--ink-4)', fundo: 'var(--surface-2)' };
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md whitespace-nowrap"
      style={{ background: cfg.fundo, color: cfg.cor, fontSize: '0.7rem', fontWeight: 600 }}
      // RN-011: deixa explícito que o risco é da etapa, não da atividade.
      title={`Risco da etapa · ${risco.quantidade} em aberto · maior pontuação ${risco.pontuacao}`}
    >
      <ShieldAlert size={11} /> {risco.faixa}
    </span>
  );
}

export interface VisaoTabelaProps {
  metas: Goal[];
  metasCompletas?: Goal[];
  administrativo?: boolean;
  riscos: Risk[];
  /** Ids recolhidos (metas, etapas ou atividades). Estado vive no pai para sobreviver à troca de visão (RF-013). */
  recolhidos: Set<string>;
  alternarRecolhido: (id: string) => void;
  /** Numeração calculada sobre a lista COMPLETA — busca e filtro não renumeram (RN-004). */
  codigos: Map<string, string>;
  aoAbrirMeta: (meta: Goal) => void;
  aoAbrirEtapa: (etapa: Deliverable, meta: Goal) => void;
  aoAbrirAtividade: (atividade: Activity, etapa: Deliverable, meta: Goal) => void;
  aoAbrirRisco: (risco: Risk) => void;
  aoAbrirAnexo: (atividade: Activity) => void;
  aoEncaminhamentos?: (atividadeId?: string) => void;
}

export function VisaoTabela({
  metas, metasCompletas, riscos, administrativo = false, recolhidos, alternarRecolhido, codigos,
  aoAbrirMeta, aoAbrirEtapa, aoAbrirAtividade, aoAbrirRisco, aoAbrirAnexo, aoEncaminhamentos,
}: VisaoTabelaProps) {
  const colunas = administrativo ? COLUNAS.map(c => c === 'Observações' ? 'Responsável' : c) : COLUNAS;
  const hoje = hojeISO();
  const { readOnly } = useAuth();
  const { updateAtividade } = useStore();
  const conclusoes = useMemo(() => indiceConclusao(metasCompletas ?? metas), [metasCompletas, metas]);
  const [edicao, setEdicao] = useState<{ id: string; dados: AtividadeInput } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);
  const alterar = <K extends keyof AtividadeInput>(campo: K, valor: AtividadeInput[K]) => {
    setEdicao(atual => atual ? { ...atual, dados: { ...atual.dados, [campo]: valor } } : null);
    setErros([]);
  };
  const salvar = async (etapa: Deliverable) => {
    if (!edicao || readOnly || salvando) return;
    const problemas = errosDaEdicao(edicao.dados, etapa);
    setErros(problemas);
    if (problemas.length) return;
    setSalvando(true);
    try {
      await updateAtividade(edicao.id, edicao.dados);
      setEdicao(null);
      toast.success('Atividade atualizada.');
    } catch (e) { setErros([e instanceof Error ? e.message : 'Não foi possível salvar a atividade.']); }
    finally { setSalvando(false); }
  };
  const dataNaLinha = (a: Activity, campo: 'inicioPrevisto' | 'fimPrevisto' | 'inicioRealizado' | 'fimRealizado', rotulo: string, valor: string | null) =>
    edicao?.id === a.id && !readOnly
      ? <input type="date" aria-label={`${rotulo}: ${a.name}`} value={edicao.dados[campo] ?? ''}
          disabled={salvando} onChange={e => alterar(campo, e.target.value || null)}
          className="border rounded px-1 py-1 text-xs" style={{ background: 'var(--surface-0)', borderColor: 'var(--border)' }} />
      : <Data valor={valor} />;

  if (metas.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>
        Nenhuma atividade corresponde aos filtros aplicados.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 1060 }}>
        <thead>
          <tr>
            {colunas.map(c => (
              <th
                key={c}
                className="text-left px-2.5 py-2"
                style={{
                  fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  background: 'var(--surface-1)', borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metas.map(meta => {
            const metaRecolhida = recolhidos.has(meta.id);
            const prazo = prazoDaMeta(meta);
            const diverge = divergenciaDaMeta(meta).length > 0;
            return (
              <Fragment key={meta.id}>
                {/* Linha de meta */}
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td colSpan={colunas.length} className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => alternarRecolhido(meta.id)}
                      className="flex items-center gap-2 text-left"
                      aria-expanded={!metaRecolhida}
                      aria-label={metaRecolhida ? `Expandir meta: ${meta.name}` : `Recolher meta: ${meta.name}`}
                    >
                      {metaRecolhida ? <ChevronRight size={14} color="var(--ink-4)" /> : <ChevronDown size={14} color="var(--ink-4)" />}
                    </button>
                    <button type="button" onClick={() => aoAbrirMeta(meta)} aria-label={`Abrir meta: ${meta.name}`} className="flex items-center gap-2 text-left hover:underline">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-4)' }}>
                        {codigos.get(meta.id)}.
                      </span>
                      <span className={conclusoes.get(`meta:${meta.id}`)?.concluido ? 'line-through' : undefined} style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink-1)' }}>
                        {meta.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
                        · {meta.deliverables.length} etapa{meta.deliverables.length === 1 ? '' : 's'}
                      </span>
                    </button>
                    {!administrativo && <span className="text-xs" style={{ color: 'var(--ink-4)' }}>{conclusoes.get(`meta:${meta.id}`)?.concluidas ?? 0}/{conclusoes.get(`meta:${meta.id}`)?.total ?? 0} concluídas</span>}
                    {(prazo.inicio || prazo.fim || meta.responsible) && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>
                        {(prazo.inicio || prazo.fim) && (
                          <span style={{ fontFamily: 'var(--font-mono)' }} title={prazo.proprio ? 'Prazo da meta' : 'Calculado das etapas'}>
                            {formatDateOnly(prazo.inicio)} – {formatDateOnly(prazo.fim)}
                          </span>
                        )}
                        {meta.responsible && ` · ${meta.responsible}`}
                      </span>
                    )}
                    {diverge && (
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ fontSize: '0.7rem', color: 'var(--warning)' }}
                        title="Há etapas fora do prazo da meta — abra a meta para ver quais."
                      >
                        <AlertTriangle size={12} /> Etapas fora do prazo
                      </span>
                    )}
                    <button
                      onClick={() => aoAbrirMeta(meta)}
                      className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11.5px] font-medium hover:bg-accent"
                      style={{ borderColor: 'var(--border)', color: 'var(--ink-3)', background: 'var(--surface-0)' }}
                    >
                      {readOnly ? <><Eye size={11} /> Ver meta</> : <><Pencil size={11} /> Editar meta</>}
                    </button>
                    </div>
                  </td>
                </tr>

                {!metaRecolhida && meta.deliverables.map(etapa => {
                  const etapaRecolhida = recolhidos.has(etapa.id);
                  const riscoEtapa = riscoDaEtapa(riscos, etapa.id);
                  const riscosDaEtapa = riscos.filter(r => r.stageId === etapa.id);

                  return (
                    <Fragment key={etapa.id}>
                      {/* Linha de etapa */}
                      <tr style={{ background: 'var(--surface-1)' }}>
                        <td colSpan={colunas.length} className="px-3 py-1.5" style={{ borderBottom: '1px solid var(--line-1)' }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => alternarRecolhido(etapa.id)} aria-expanded={!etapaRecolhida} aria-label={etapaRecolhida ? 'Expandir etapa' : 'Recolher etapa'}>
                              {etapaRecolhida ? <ChevronRight size={13} color="var(--ink-4)" /> : <ChevronDown size={13} color="var(--ink-4)" />}
                            </button>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-4)' }}>
                              {codigos.get(etapa.id)}
                            </span>
                            {/* RF-016: o nome da etapa abre o painel dela — é ali que
                                moram criar atividade, criar risco e editar período. */}
                            <button
                              onClick={() => aoAbrirEtapa(etapa, meta)}
                              className={`text-left hover:underline ${conclusoes.get(`etapa:${etapa.id}`)?.concluido ? 'line-through' : ''}`}
                              style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--ink-2)' }}
                            >
                              {etapa.name}
                            </button>
                            {!administrativo && <span className="text-xs" style={{ color: 'var(--ink-4)' }}>{conclusoes.get(`etapa:${etapa.id}`)?.concluidas ?? 0}/{conclusoes.get(`etapa:${etapa.id}`)?.total ?? 0} concluídas</span>}
                            <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                              {etapa.plannedStart || etapa.plannedEnd
                                ? `${formatDateOnly(etapa.plannedStart)} – ${formatDateOnly(etapa.plannedEnd)}`
                                : 'período não informado'}
                            </span>
                            {/* Risco da etapa abre o painel do risco (RF-016). */}
                            {riscosDaEtapa.length > 0 && (
                              <button
                                onClick={() => aoAbrirRisco(riscosDaEtapa[0])}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                                style={{
                                  background: riscoEtapa ? (CORES_FAIXA[riscoEtapa.faixa]?.fundo ?? 'var(--surface-2)') : 'var(--surface-2)',
                                  color: riscoEtapa ? (CORES_FAIXA[riscoEtapa.faixa]?.cor ?? 'var(--ink-4)') : 'var(--ink-4)',
                                  fontSize: '0.68rem', fontWeight: 600,
                                }}
                                title="Abrir risco da etapa"
                              >
                                <ShieldAlert size={10} /> {riscosDaEtapa.length} risco{riscosDaEtapa.length === 1 ? '' : 's'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {!etapaRecolhida && etapa.activities.map(atividade => {
                        const atividadeRecolhida = recolhidos.has(atividade.id);
                        const riscoOrigem = atividade.riskOriginId
                          ? riscos.find(r => r.id === atividade.riskOriginId)
                          : undefined;

                        return (
                          <Fragment key={atividade.id}>
                            <tr style={{ borderBottom: '1px solid var(--line-1)' }}>
                              <td className="px-3 py-2" style={{ maxWidth: 290 }}>
                                <div className="flex items-start gap-1.5">
                                  {atividade.tasks.length > 0 ? (
                                    <button
                                      onClick={() => alternarRecolhido(atividade.id)}
                                      aria-expanded={!atividadeRecolhida}
                                      aria-label={atividadeRecolhida ? 'Expandir tarefas' : 'Recolher tarefas'}
                                      style={{ marginTop: 1 }}
                                    >
                                      {atividadeRecolhida ? <ChevronRight size={12} color="var(--ink-5)" /> : <ChevronDown size={12} color="var(--ink-5)" />}
                                    </button>
                                  ) : (
                                    <span style={{ width: 12, display: 'inline-block' }} />
                                  )}
                                  <div className="min-w-0">
                                    <button
                                      onClick={() => aoAbrirAtividade(atividade, etapa, meta)}
                                      className="text-left hover:underline"
                                      style={{ fontSize: '0.78rem', color: 'var(--ink-1)' }}
                                    >
                                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-4)', marginRight: 6 }}>
                                        {codigos.get(atividade.id)}
                                      </span>
                                      <span className={atividade.status === 'Concluído' ? 'line-through' : undefined}>{atividade.name}</span>
                                    </button>
                                    {!readOnly && !administrativo && (edicao?.id === atividade.id ? (
                                      <div className="flex gap-2 mt-2">
                                        <button disabled={salvando} onClick={() => void salvar(etapa)} className="text-xs underline">{salvando ? 'Salvando…' : 'Salvar linha'}</button>
                                        <button disabled={salvando} onClick={() => { setEdicao(null); setErros([]); }} className="text-xs underline">Cancelar</button>
                                      </div>
                                    ) : <button disabled={edicao !== null} onClick={() => { setEdicao({ id: atividade.id, dados: dadosDaAtividade(atividade, etapa.id) }); setErros([]); }}
                                      className="block text-xs underline mt-1" aria-label={`Editar datas e status: ${atividade.name}`}>Editar datas e status</button>)}
                                    {edicao?.id === atividade.id && erros.length > 0 && <div role="alert" className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{erros.join(' ')}</div>}
                                    {atividade.nextStep.trim() && <div className="text-xs mt-2 whitespace-pre-wrap" style={{ color: 'var(--ink-3)' }}>
                                      <strong>Encaminhamento: </strong>{atividade.nextStep}
                                      {atividade.nextStepOwner && <span> · {atividade.nextStepOwner}</span>}
                                      {aoEncaminhamentos && <button className="block underline mt-1" onClick={() => aoEncaminhamentos(atividade.id)}>Ver encaminhamento</button>}
                                    </div>}
                                    {/* RN-020: ação derivada de risco mostra de onde veio. */}
                                    {riscoOrigem && (
                                      <button
                                        onClick={() => aoAbrirRisco(riscoOrigem)}
                                        className="flex items-center gap-1 mt-0.5 hover:underline"
                                        style={{ fontSize: '0.68rem', color: 'var(--danger)' }}
                                        title="Ação de resposta a risco — abrir o risco de origem"
                                      >
                                        <CornerDownRight size={10} /> resposta ao risco: {riscoOrigem.title || riscoOrigem.description}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>
                                <span className="block whitespace-pre-wrap" style={{ minWidth: 150, maxWidth: 280 }}>{(administrativo ? atividade.responsible : atividade.observations) || '—'}</span>
                              </td>
                              <td className="px-3 py-2">{dataNaLinha(atividade, 'inicioPrevisto', 'Início previsto', atividade.plannedStart)}</td>
                              <td className="px-3 py-2">{dataNaLinha(atividade, 'fimPrevisto', 'Fim previsto', atividade.plannedEnd)}</td>
                              {/* Início e Fim = datas REALIZADAS (RF-015, RN-013). */}
                              <td className="px-3 py-2">{dataNaLinha(atividade, 'inicioRealizado', 'Início realizado', atividade.actualStart)}</td>
                              <td className="px-3 py-2">{dataNaLinha(atividade, 'fimRealizado', 'Fim realizado', atividade.actualEnd)}</td>
                              <td className="px-3 py-2">{edicao?.id === atividade.id && !readOnly
                                ? <select aria-label={`Status: ${atividade.name}`} value={edicao.dados.status} disabled={salvando}
                                    onChange={e => { const status = e.target.value as Activity['status']; setEdicao(atual => atual ? { ...atual, dados: { ...atual.dados, status, progresso: progressoParaStatus(status, atual.dados.progresso) } } : null); }}
                                    className="border rounded px-1 py-1 text-xs">
                                    {(['A iniciar', 'Em andamento', 'Concluído'] as const).map(s => <option key={s}>{s}</option>)}
                                  </select>
                                : <Estado atividade={atividade} hoje={hoje} />}</td>
                              <td className="px-3 py-2" style={{ maxWidth: 160 }}>
                                {edicao?.id === atividade.id && !readOnly ? <textarea aria-label={`Justificativa de atraso: ${atividade.name}`}
                                  value={edicao.dados.justificativaAtraso} disabled={salvando} onChange={e => alterar('justificativaAtraso', e.target.value)}
                                  className="border rounded p-1 text-xs" rows={3} /> : atividade.delayJustification ? (
                                  <span
                                    className="block truncate"
                                    style={{ fontSize: '0.73rem', color: 'var(--ink-3)' }}
                                    title={atividade.delayJustification}
                                  >
                                    {atividade.delayJustification}
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--ink-5)' }}>—</span>
                                )}
                              </td>
                              <td className="px-3 py-2"><NivelRisco risco={riscoEtapa} /></td>
                              <td className="px-3 py-2">
                                {atividade.attachment ? (
                                  <button
                                    onClick={() => aoAbrirAnexo(atividade)}
                                    className="inline-flex items-center gap-1 hover:underline"
                                    style={{ fontSize: '0.72rem', color: 'var(--brand-text)' }}
                                    title={atividade.attachment.fileName}
                                  >
                                    <Paperclip size={11} /> abrir
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--ink-5)' }}>—</span>
                                )}
                              </td>
                            </tr>

                            {/* Tarefas: expandem dentro da atividade, sem renumerar nada (RN-004). */}
                            {!atividadeRecolhida && atividade.tasks.map(tarefa => (
                              <tr key={tarefa.id} style={{ borderBottom: '1px solid var(--line-1)' }}>
                                <td className="px-3 py-1.5" colSpan={colunas.length}>
                                  <div className="flex items-center gap-2" style={{ paddingLeft: 34 }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-5)' }}>
                                      {codigos.get(tarefa.id)}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>{tarefa.title}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}

                      {!etapaRecolhida && etapa.activities.length === 0 && (
                        <tr style={{ borderBottom: '1px solid var(--line-1)' }}>
                          <td colSpan={colunas.length} className="px-3 py-2" style={{ paddingLeft: 46, fontSize: '0.75rem', color: 'var(--ink-5)' }}>
                            Nenhuma atividade nesta etapa.
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
