/**
 * Visão Tabela do Plano de Trabalho (RF-015, RF-016).
 *
 * As dez colunas são as que o documento lista, nesta ordem e sem acréscimos:
 * Atividade · Responsável · Início previsto · Fim previsto · Início · Fim ·
 * Status · Justificativa de atraso · Nível risco · Anexo.
 *
 * "Início" e "Fim" (sem qualificador) são as datas REALIZADAS. Elas ficam
 * vazias até que a equipe PMO as informe — nunca são preenchidas a partir das
 * previstas (RN-013). Essa é a distinção central da tela: o que estava
 * planejado versus o que de fato aconteceu.
 *
 * Nenhuma ação de criar/editar aparece nas linhas (RF-014). Criar atividade,
 * criar risco e editar período vivem no painel da etapa, que abre ao clicar no
 * nome dela. Linha de tabela com três botões vira ruído e faz o olho perder a
 * informação, que é o que a tabela existe para mostrar.
 */
import { Fragment } from 'react';
import { ChevronDown, ChevronRight, Paperclip, AlertTriangle, ShieldAlert, CornerDownRight } from 'lucide-react';
import { type Goal, type Activity, type Risk, type Deliverable } from '../../data/mockData';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  estaAtrasada, riscoDaEtapa, hojeISO,
  type RiscoDaLinha,
} from '../../lib/planoTrabalho';

const COLUNAS = [
  'Atividade', 'Responsável', 'Início previsto', 'Fim previsto',
  'Início', 'Fim', 'Status', 'Justificativa de atraso', 'Nível risco', 'Anexo',
];

const CORES_FAIXA: Record<string, { cor: string; fundo: string }> = {
  'Baixo':   { cor: 'var(--success)', fundo: 'var(--success-soft)' },
  'Médio':   { cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)' },
  'Alto':    { cor: 'var(--danger)', fundo: 'var(--danger-soft)' },
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
        style={{ background: 'var(--danger-soft)', color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 600 }}
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
  riscos: Risk[];
  /** Ids recolhidos (metas, etapas ou atividades). Estado vive no pai para sobreviver à troca de visão (RF-013). */
  recolhidos: Set<string>;
  alternarRecolhido: (id: string) => void;
  /** Numeração calculada sobre a lista COMPLETA — busca e filtro não renumeram (RN-004). */
  codigos: Map<string, string>;
  aoAbrirEtapa: (etapa: Deliverable, meta: Goal) => void;
  aoAbrirAtividade: (atividade: Activity, etapa: Deliverable, meta: Goal) => void;
  aoAbrirRisco: (risco: Risk) => void;
  aoAbrirAnexo: (atividade: Activity) => void;
}

export function VisaoTabela({
  metas, riscos, recolhidos, alternarRecolhido, codigos,
  aoAbrirEtapa, aoAbrirAtividade, aoAbrirRisco, aoAbrirAnexo,
}: VisaoTabelaProps) {
  const hoje = hojeISO();

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
            {COLUNAS.map(c => (
              <th
                key={c}
                className="text-left px-2.5 py-2 sticky top-0"
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
            return (
              <Fragment key={meta.id}>
                {/* Linha de meta */}
                <tr style={{ background: 'var(--surface-2)' }}>
                  <td colSpan={COLUNAS.length} className="px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <button
                      onClick={() => alternarRecolhido(meta.id)}
                      className="flex items-center gap-2 text-left"
                      aria-expanded={!metaRecolhida}
                    >
                      {metaRecolhida ? <ChevronRight size={14} color="var(--ink-4)" /> : <ChevronDown size={14} color="var(--ink-4)" />}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-4)' }}>
                        {codigos.get(meta.id)}.
                      </span>
                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--ink-1)' }}>
                        {meta.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
                        · {meta.deliverables.length} etapa{meta.deliverables.length === 1 ? '' : 's'}
                      </span>
                    </button>
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
                        <td colSpan={COLUNAS.length} className="px-3 py-1.5" style={{ borderBottom: '1px solid var(--line-1)' }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => alternarRecolhido(etapa.id)} aria-expanded={!etapaRecolhida} aria-label="Recolher etapa">
                              {etapaRecolhida ? <ChevronRight size={13} color="var(--ink-4)" /> : <ChevronDown size={13} color="var(--ink-4)" />}
                            </button>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-4)' }}>
                              {codigos.get(etapa.id)}
                            </span>
                            {/* RF-016: o nome da etapa abre o painel dela — é ali que
                                moram criar atividade, criar risco e editar período. */}
                            <button
                              onClick={() => aoAbrirEtapa(etapa, meta)}
                              className="text-left hover:underline"
                              style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--ink-2)' }}
                            >
                              {etapa.name}
                            </button>
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
                                      aria-label="Expandir tarefas"
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
                                      {atividade.name}
                                    </button>
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
                              <td className="px-3 py-2" style={{ fontSize: '0.75rem', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                                {atividade.responsible || <span style={{ color: 'var(--ink-5)' }}>—</span>}
                              </td>
                              <td className="px-3 py-2"><Data valor={atividade.plannedStart} /></td>
                              <td className="px-3 py-2"><Data valor={atividade.plannedEnd} /></td>
                              {/* Início e Fim = datas REALIZADAS (RF-015, RN-013). */}
                              <td className="px-3 py-2"><Data valor={atividade.actualStart} /></td>
                              <td className="px-3 py-2"><Data valor={atividade.actualEnd} /></td>
                              <td className="px-3 py-2"><Estado atividade={atividade} hoje={hoje} /></td>
                              <td className="px-3 py-2" style={{ maxWidth: 160 }}>
                                {atividade.delayJustification ? (
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
                                    style={{ fontSize: '0.72rem', color: 'var(--info)' }}
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
                                <td className="px-3 py-1.5" colSpan={COLUNAS.length}>
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
                          <td colSpan={COLUNAS.length} className="px-3 py-2" style={{ paddingLeft: 46, fontSize: '0.75rem', color: 'var(--ink-5)' }}>
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
