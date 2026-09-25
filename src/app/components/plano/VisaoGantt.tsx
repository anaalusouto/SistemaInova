/**
 * Visão Gantt do Plano de Trabalho (RF-017, RF-018, RN-012).
 *
 * UMA lista vertical: meta, etapa e atividade, cada uma em sua própria linha.
 * O documento é explícito em não duplicar nem colocar duas linhas hierárquicas
 * lado a lado — a coluna da esquerda e a linha do tempo pertencem à MESMA
 * linha da tabela, compartilhando altura e grade. Desenhar os dois lados como
 * listas independentes é como eles saem de registro quando uma rola e a outra
 * não.
 *
 * Previsto e realizado são visualmente distintos: previsto é uma faixa clara
 * com contorno; realizado é uma barra sólida mais estreita, desenhada dentro
 * dela. Assim dá para ver, na mesma linha, o quanto a execução se afastou do
 * plano — que é a pergunta que um Gantt de acompanhamento existe para
 * responder.
 *
 * Período que não existe NÃO vira barra (RN-012). Uma etapa com início e sem
 * fim não é desenhada "até hoje": fica sem barra, que é a informação
 * verdadeira.
 */
import { Fragment } from 'react';
import { ChevronDown, ChevronRight, Paperclip, AlertTriangle, ShieldAlert } from 'lucide-react';
import { type Goal, type Activity, type Risk, type Deliverable } from '../../data/mockData';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  estaAtrasada, hojeISO, periodoDaMeta, limitesDaLinhaDoTempo, colunasDaLinhaDoTempo,
  posicaoNaLinha, posicaoDeHoje, riscoDaEtapa,
  type EscalaGantt, type LimitesLinhaTempo, type PosicaoBarra,
} from '../../lib/planoTrabalho';

/** Largura mínima de cada coluna. Abaixo disso o rótulo do mês fica ilegível. */
const LARGURA_COLUNA = { mes: 74, trimestre: 96 } as const;
const LARGURA_ESQUERDA = 340;

interface Faixa {
  previsto: PosicaoBarra | null;
  realizado: PosicaoBarra | null;
}

/**
 * As duas barras de uma linha. `tom` diferencia o nível hierárquico sem
 * precisar de legenda: meta mais escura, atividade mais clara.
 */
function Barras({
  faixa, tom, titulo, atrasada, aoClicar,
}: {
  faixa: Faixa; tom: 'meta' | 'etapa' | 'atividade';
  titulo: string; atrasada?: boolean; aoClicar?: () => void;
}) {
  const cores = {
    meta:      { previsto: 'var(--ink-5)', realizado: 'var(--ink-3)' },
    etapa:     { previsto: 'var(--brand)', realizado: 'var(--brand)' },
    atividade: { previsto: 'var(--brand)', realizado: 'var(--brand)' },
  }[tom];

  const corRealizado = atrasada ? 'var(--danger)' : cores.realizado;

  return (
    <div className="relative h-full w-full" title={titulo}>
      {faixa.previsto && (
        <div
          onClick={aoClicar}
          className="absolute rounded"
          style={{
            left: `${faixa.previsto.esquerda}%`,
            width: `${faixa.previsto.largura}%`,
            top: 6, height: 14,
            // Previsto: faixa clara com contorno — é o plano, não o fato.
            background: 'transparent',
            border: `1px dashed ${cores.previsto}`,
            opacity: 0.85,
            cursor: aoClicar ? 'pointer' : undefined,
          }}
        />
      )}
      {faixa.realizado && (
        <div
          onClick={aoClicar}
          className="absolute rounded"
          style={{
            left: `${faixa.realizado.esquerda}%`,
            width: `${faixa.realizado.largura}%`,
            top: 10, height: 6,
            // Realizado: sólido e mais estreito, dentro da faixa prevista.
            background: corRealizado,
            cursor: aoClicar ? 'pointer' : undefined,
          }}
        />
      )}
    </div>
  );
}

function rotuloPeriodo(previstoI: string | null, previstoF: string | null, realI: string | null, realF: string | null): string {
  const p = previstoI && previstoF ? `previsto ${formatDateOnly(previstoI)}–${formatDateOnly(previstoF)}` : 'previsto não informado';
  const r = realI && realF ? `realizado ${formatDateOnly(realI)}–${formatDateOnly(realF)}` : 'realizado não informado';
  return `${p} · ${r}`;
}

export interface VisaoGanttProps {
  metas: Goal[];
  riscos: Risk[];
  escala: EscalaGantt;
  recolhidos: Set<string>;
  alternarRecolhido: (id: string) => void;
  codigos: Map<string, string>;
  aoAbrirEtapa: (etapa: Deliverable, meta: Goal) => void;
  aoAbrirAtividade: (atividade: Activity, etapa: Deliverable, meta: Goal) => void;
  aoAbrirAnexo: (atividade: Activity) => void;
}

export function VisaoGantt({
  metas, riscos, escala, recolhidos, alternarRecolhido, codigos,
  aoAbrirEtapa, aoAbrirAtividade, aoAbrirAnexo,
}: VisaoGanttProps) {
  const hoje = hojeISO();
  const limites: LimitesLinhaTempo | null = limitesDaLinhaDoTempo(metas);

  if (metas.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>
        Nenhuma atividade corresponde aos filtros aplicados.
      </div>
    );
  }

  // Sem nenhuma data de etapa não há escala possível. Dizer isso é melhor do
  // que desenhar uma grade arbitrária com barras que não significam nada.
  if (!limites) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.82rem', lineHeight: 1.6 }}>
        Nenhuma etapa tem período informado, então não há linha do tempo a montar.
        <br />
        Preencha o período das etapas no painel de cada uma para ver o Gantt.
      </div>
    );
  }

  const colunas = colunasDaLinhaDoTempo(limites, escala);
  const larguraLinha = Math.max(colunas.length * LARGURA_COLUNA[escala === 'mes' ? 'mes' : 'trimestre'], 320);
  const marcadorHoje = posicaoDeHoje(limites, hoje);

  /** Uma linha da grade: esquerda fixa + faixa de tempo, mesma altura. */
  const Linha = ({
    fundo, indentacao, conteudo, faixa, tom, titulo, atrasada, aoClicar,
  }: {
    fundo?: string; indentacao: number; conteudo: React.ReactNode;
    faixa: Faixa; tom: 'meta' | 'etapa' | 'atividade';
    titulo: string; atrasada?: boolean; aoClicar?: () => void;
  }) => (
    <div className="flex" style={{ background: fundo, borderBottom: '1px solid var(--line-1)', minHeight: 26 }}>
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1"
        style={{ width: LARGURA_ESQUERDA, paddingLeft: 12 + indentacao }}
      >
        {conteudo}
      </div>
      <div className="relative" style={{ width: larguraLinha, flexShrink: 0 }}>
        {/* Grade vertical igual à do cabeçalho — mesma origem, mesmas colunas. */}
        <div className="absolute inset-0 flex" aria-hidden>
          {colunas.map(c => (
            <div key={c.chave} className="flex-1" style={{ borderRight: '1px solid var(--line-1)' }} />
          ))}
        </div>
        <Barras faixa={faixa} tom={tom} titulo={titulo} atrasada={atrasada} aoClicar={aoClicar} />
      </div>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: LARGURA_ESQUERDA + larguraLinha }}>
        {/* Cabeçalho */}
        <div
          className="flex sticky top-0 z-10"
          style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="flex-shrink-0 px-3 py-2"
            style={{
              width: LARGURA_ESQUERDA, fontSize: '0.66rem', fontWeight: 600,
              color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
          >
            Meta · Etapa · Atividade
          </div>
          <div className="relative flex" style={{ width: larguraLinha, flexShrink: 0 }}>
            {colunas.map(c => (
              <div
                key={c.chave}
                className="flex-1 px-1 py-2 text-center"
                style={{
                  fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)',
                  borderRight: '1px solid var(--line-1)', whiteSpace: 'nowrap',
                }}
              >
                {c.rotulo}
              </div>
            ))}
            {marcadorHoje !== null && (
              <div
                className="absolute top-0 bottom-0"
                style={{ left: `${marcadorHoje}%`, width: 1, background: 'var(--danger)', opacity: 0.7 }}
                title={`Hoje · ${formatDateOnly(hoje)}`}
                aria-hidden
              />
            )}
          </div>
        </div>

        {/* Linhas */}
        {metas.map(meta => {
          const metaRecolhida = recolhidos.has(meta.id);
          const per = periodoDaMeta(meta.deliverables);

          return (
            <Fragment key={meta.id}>
              <Linha
                fundo="var(--surface-2)"
                indentacao={0}
                tom="meta"
                titulo={rotuloPeriodo(per.previsto.inicio, per.previsto.fim, per.realizado.inicio, per.realizado.fim)}
                faixa={{
                  previsto: posicaoNaLinha(per.previsto.inicio, per.previsto.fim, limites),
                  realizado: posicaoNaLinha(per.realizado.inicio, per.realizado.fim, limites),
                }}
                conteudo={
                  <button
                    onClick={() => alternarRecolhido(meta.id)}
                    className="flex items-center gap-1.5 text-left min-w-0"
                    aria-expanded={!metaRecolhida}
                  >
                    {metaRecolhida ? <ChevronRight size={13} color="var(--ink-4)" /> : <ChevronDown size={13} color="var(--ink-4)" />}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-4)' }}>
                      {codigos.get(meta.id)}.
                    </span>
                    <span className="truncate" style={{ fontWeight: 700, fontSize: '0.76rem', color: 'var(--ink-1)' }}>
                      {meta.name}
                    </span>
                  </button>
                }
              />

              {!metaRecolhida && meta.deliverables.map(etapa => {
                const etapaRecolhida = recolhidos.has(etapa.id);
                const risco = riscoDaEtapa(riscos, etapa.id);

                return (
                  <Fragment key={etapa.id}>
                    <Linha
                      fundo="var(--surface-1)"
                      indentacao={14}
                      tom="etapa"
                      titulo={rotuloPeriodo(etapa.plannedStart, etapa.plannedEnd, etapa.actualStart, etapa.actualEnd)}
                      faixa={{
                        // RN-012: a etapa usa as datas DELA, não as das atividades.
                        previsto: posicaoNaLinha(etapa.plannedStart, etapa.plannedEnd, limites),
                        realizado: posicaoNaLinha(etapa.actualStart, etapa.actualEnd, limites),
                      }}
                      aoClicar={() => aoAbrirEtapa(etapa, meta)}
                      conteudo={
                        <>
                          <button onClick={() => alternarRecolhido(etapa.id)} aria-expanded={!etapaRecolhida} aria-label="Recolher etapa">
                            {etapaRecolhida ? <ChevronRight size={12} color="var(--ink-4)" /> : <ChevronDown size={12} color="var(--ink-4)" />}
                          </button>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-4)' }}>
                            {codigos.get(etapa.id)}
                          </span>
                          <button
                            onClick={() => aoAbrirEtapa(etapa, meta)}
                            className="truncate text-left hover:underline min-w-0"
                            style={{ fontWeight: 600, fontSize: '0.74rem', color: 'var(--ink-2)' }}
                          >
                            {etapa.name}
                          </button>
                          {risco && (
                            <ShieldAlert
                              size={11}
                              color={risco.faixa === 'Crítico' || risco.faixa === 'Alto' ? 'var(--danger)' : 'var(--warning-strong-text)'}
                              aria-label={`Risco ${risco.faixa}`}
                            />
                          )}
                        </>
                      }
                    />

                    {!etapaRecolhida && etapa.activities.map(atividade => {
                      const atrasada = estaAtrasada(atividade, hoje);
                      return (
                        <Linha
                          key={atividade.id}
                          indentacao={30}
                          tom="atividade"
                          atrasada={atrasada}
                          titulo={rotuloPeriodo(atividade.plannedStart, atividade.plannedEnd, atividade.actualStart, atividade.actualEnd)}
                          faixa={{
                            previsto: posicaoNaLinha(atividade.plannedStart, atividade.plannedEnd, limites),
                            realizado: posicaoNaLinha(atividade.actualStart, atividade.actualEnd, limites),
                          }}
                          aoClicar={() => aoAbrirAtividade(atividade, etapa, meta)}
                          conteudo={
                            <>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--ink-5)' }}>
                                {codigos.get(atividade.id)}
                              </span>
                              <button
                                onClick={() => aoAbrirAtividade(atividade, etapa, meta)}
                                className="truncate text-left hover:underline min-w-0 flex-1"
                                style={{ fontSize: '0.74rem', color: 'var(--ink-2)' }}
                              >
                                {atividade.name}
                              </button>
                              {/* RN-010: sinal textual além da cor da barra. */}
                              {atrasada ? (
                                <span
                                  className="inline-flex items-center gap-0.5 flex-shrink-0"
                                  style={{ fontSize: '0.64rem', color: 'var(--danger)', fontWeight: 600 }}
                                >
                                  <AlertTriangle size={9} /> Atrasada
                                </span>
                              ) : (
                                <span className="flex-shrink-0" style={{ fontSize: '0.64rem', color: 'var(--ink-5)' }}>
                                  {atividade.status}
                                </span>
                              )}
                              {atividade.attachment && (
                                <button
                                  onClick={() => aoAbrirAnexo(atividade)}
                                  aria-label={`Anexo de ${atividade.name}`}
                                  className="flex-shrink-0"
                                >
                                  <Paperclip size={10} color="var(--info)" />
                                </button>
                              )}
                            </>
                          }
                        />
                      );
                    })}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        })}

        {/* Legenda — previsto e realizado precisam ser distinguíveis sem tooltip. */}
        <div className="flex items-center gap-4 px-3 py-2 flex-wrap" style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}>
          <span className="inline-flex items-center gap-1.5">
            <span style={{ width: 22, height: 10, border: '1px dashed var(--brand)', borderRadius: 2, display: 'inline-block' }} />
            previsto
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span style={{ width: 22, height: 6, background: 'var(--brand)', borderRadius: 2, display: 'inline-block' }} />
            realizado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span style={{ width: 22, height: 6, background: 'var(--danger)', borderRadius: 2, display: 'inline-block' }} />
            atrasada
          </span>
          {marcadorHoje !== null && (
            <span className="inline-flex items-center gap-1.5">
              <span style={{ width: 1, height: 12, background: 'var(--danger)', display: 'inline-block' }} />
              hoje
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
