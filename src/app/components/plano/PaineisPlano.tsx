/**
 * Painéis laterais de detalhe do Plano de Trabalho (RF-022, RF-023, RF-027).
 *
 * Esta entrega cobre a metade de LEITURA dos painéis: posição hierárquica,
 * períodos, contagens, tarefas, anexo, risco de origem e próximo passo. Os
 * controles de edição (criar atividade, criar risco, editar período) entram na
 * fase seguinte — e entram AQUI, não nas linhas das visões, porque o RF-014 é
 * explícito em concentrá-los no painel.
 *
 * Todos fecham por botão e por Escape (RF-006), e mostram a posição na
 * hierarquia para que ninguém perca de vista onde está.
 */
import { useEffect, type ReactNode } from 'react';
import { X, Paperclip, ShieldAlert, CornerDownRight } from 'lucide-react';
import { type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { formatDateOnly } from '../../lib/dateOnly';
import { estaAtrasada, faixaRisco, riscoEmAberto, NAO_INFORMADO } from '../../lib/planoTrabalho';

// ---------------------------------------------------------------------------
// Casca comum
// ---------------------------------------------------------------------------

function Painel({
  titulo, caminho, aoFechar, children,
}: { titulo: string; caminho: string; aoFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card h-full w-full max-w-xl flex flex-col"
        role="dialog"
        aria-label={titulo}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            {/* Posição hierárquica — RF-006 pede que o painel indique claramente onde o registro está. */}
            <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
              {caminho}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)', marginTop: 2 }}>
              {titulo}
            </div>
          </div>
          <button onClick={aoFechar} aria-label="Fechar painel" style={{ flexShrink: 0, marginTop: 2 }}>
            <X size={16} color="var(--ink-4)" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="py-2" style={{ borderBottom: '1px solid var(--line-1)' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {rotulo}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function Ausente() {
  return <span style={{ color: 'var(--ink-5)', fontStyle: 'italic' }}>{NAO_INFORMADO}</span>;
}

function Periodo({ inicio, fim }: { inicio: string | null; fim: string | null }) {
  if (!inicio && !fim) return <Ausente />;
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
      {formatDateOnly(inicio)} – {formatDateOnly(fim)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Painel da etapa (RF-022)
// ---------------------------------------------------------------------------

export function PainelEtapa({
  etapa, meta, riscos, codigo, aoFechar, aoAbrirRisco, aoAbrirAtividade,
}: {
  etapa: Deliverable; meta: Goal; riscos: Risk[]; codigo: string;
  aoFechar: () => void;
  aoAbrirRisco: (r: Risk) => void;
  aoAbrirAtividade: (a: Activity) => void;
}) {
  const daEtapa = riscos.filter(r => r.stageId === etapa.id);
  const abertos = daEtapa.filter(riscoEmAberto);

  return (
    <Painel titulo={etapa.name} caminho={`${meta.name} › Etapa ${codigo}`} aoFechar={aoFechar}>
      <Linha rotulo="Período previsto">
        <Periodo inicio={etapa.plannedStart} fim={etapa.plannedEnd} />
      </Linha>
      <Linha rotulo="Período realizado">
        <Periodo inicio={etapa.actualStart} fim={etapa.actualEnd} />
      </Linha>
      {etapa.expectedResult && <Linha rotulo="Resultado esperado">{etapa.expectedResult}</Linha>}

      <Linha rotulo={`Atividades (${etapa.activities.length})`}>
        {etapa.activities.length === 0 ? (
          <span style={{ color: 'var(--ink-5)' }}>Nenhuma atividade nesta etapa.</span>
        ) : (
          <ul className="flex flex-col gap-1 mt-1">
            {etapa.activities.map(a => (
              <li key={a.id}>
                <button
                  onClick={() => aoAbrirAtividade(a)}
                  className="text-left hover:underline flex items-center gap-2 w-full"
                  style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}
                >
                  <span className="truncate">{a.name}</span>
                  <span style={{ fontSize: '0.7rem', color: estaAtrasada(a) ? 'var(--danger)' : 'var(--ink-5)', whiteSpace: 'nowrap' }}>
                    {estaAtrasada(a) ? 'Atrasada' : a.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Linha>

      <Linha rotulo={`Riscos (${daEtapa.length}${daEtapa.length ? `, ${abertos.length} em aberto` : ''})`}>
        {daEtapa.length === 0 ? (
          <span style={{ color: 'var(--ink-5)' }}>Nenhum risco cadastrado nesta etapa.</span>
        ) : (
          <ul className="flex flex-col gap-1 mt-1">
            {daEtapa.map(r => (
              <li key={r.id}>
                <button
                  onClick={() => aoAbrirRisco(r)}
                  className="text-left hover:underline flex items-center gap-2 w-full"
                  style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}
                >
                  <ShieldAlert size={11} color="var(--danger)" style={{ flexShrink: 0 }} />
                  <span className="truncate">{r.title || r.description}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', whiteSpace: 'nowrap' }}>
                    {faixaRisco(r.severity)} · {r.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Linha>

      <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)', marginTop: 12, fontStyle: 'italic' }}>
        Criar atividade, criar risco e editar período entram neste painel na próxima entrega.
      </p>
    </Painel>
  );
}

// ---------------------------------------------------------------------------
// Painel da atividade (RF-023)
// ---------------------------------------------------------------------------

export function PainelAtividade({
  atividade, etapa, meta, codigo, riscoOrigem, aoFechar, aoAbrirRisco, aoAbrirAnexo,
}: {
  atividade: Activity; etapa: Deliverable; meta: Goal; codigo: string;
  riscoOrigem?: Risk;
  aoFechar: () => void;
  aoAbrirRisco: (r: Risk) => void;
  aoAbrirAnexo: (a: Activity) => void;
}) {
  const atrasada = estaAtrasada(atividade);

  return (
    <Painel titulo={atividade.name} caminho={`${meta.name} › ${etapa.name} › ${codigo}`} aoFechar={aoFechar}>
      <Linha rotulo="Responsável">{atividade.responsible || <Ausente />}</Linha>

      <Linha rotulo="Status e progresso">
        <span className="inline-flex items-center gap-2">
          <span style={{ color: atrasada ? 'var(--danger)' : 'var(--ink-2)', fontWeight: atrasada ? 600 : 400 }}>
            {atrasada ? 'Atrasada' : atividade.status}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--ink-4)' }}>
            {atividade.progress}%
          </span>
        </span>
      </Linha>

      {/* As quatro datas, previsto e realizado lado a lado (RF-023). */}
      <Linha rotulo="Período previsto"><Periodo inicio={atividade.plannedStart} fim={atividade.plannedEnd} /></Linha>
      <Linha rotulo="Período realizado"><Periodo inicio={atividade.actualStart} fim={atividade.actualEnd} /></Linha>

      <Linha rotulo="Justificativa de atraso">
        {atividade.delayJustification || <Ausente />}
      </Linha>

      <Linha rotulo="Vínculo orçamentário">
        {/* RN-022: trivalente — "Não informado" não é "Não". */}
        {atividade.budgetLink === 'Não informado' ? <Ausente /> : atividade.budgetLink}
      </Linha>

      <Linha rotulo="Observação">{atividade.observations || <Ausente />}</Linha>

      <Linha rotulo="Próximo passo">
        {atividade.nextStep ? (
          <>
            <div>{atividade.nextStep}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)', marginTop: 2 }}>
              {atividade.nextStepOwner || NAO_INFORMADO}
              {' · '}
              {atividade.nextStepDue ? formatDateOnly(atividade.nextStepDue) : NAO_INFORMADO}
            </div>
          </>
        ) : <Ausente />}
      </Linha>

      <Linha rotulo={`Tarefas (${atividade.tasks.length})`}>
        {atividade.tasks.length === 0 ? (
          <span style={{ color: 'var(--ink-5)' }}>Nenhuma tarefa.</span>
        ) : (
          <ol className="flex flex-col gap-1 mt-1" style={{ listStyle: 'none' }}>
            {atividade.tasks.map((t, i) => (
              <li key={t.id} style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-5)', marginRight: 6 }}>
                  {codigo}.{i + 1}
                </span>
                {t.title}
              </li>
            ))}
          </ol>
        )}
      </Linha>

      <Linha rotulo="Anexo">
        {atividade.attachment ? (
          <button
            onClick={() => aoAbrirAnexo(atividade)}
            className="inline-flex items-center gap-1.5 hover:underline"
            style={{ color: 'var(--info)', fontSize: '0.78rem' }}
          >
            <Paperclip size={12} /> {atividade.attachment.fileName}
          </button>
        ) : <Ausente />}
      </Linha>

      {riscoOrigem && (
        <Linha rotulo="Risco de origem">
          <button
            onClick={() => aoAbrirRisco(riscoOrigem)}
            className="inline-flex items-center gap-1.5 hover:underline text-left"
            style={{ color: 'var(--danger)', fontSize: '0.78rem' }}
          >
            <CornerDownRight size={12} /> {riscoOrigem.title || riscoOrigem.description}
          </button>
        </Linha>
      )}

      <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)', marginTop: 12, fontStyle: 'italic' }}>
        Edição da atividade e das tarefas entra neste painel na próxima entrega.
      </p>
    </Painel>
  );
}

// ---------------------------------------------------------------------------
// Painel do risco (RF-027)
// ---------------------------------------------------------------------------

export function PainelRisco({
  risco, etapa, meta, codigoEtapa, acoesDeResposta, aoFechar, aoAbrirAtividade,
}: {
  risco: Risk; etapa?: Deliverable; meta?: Goal; codigoEtapa?: string;
  acoesDeResposta: Activity[];
  aoFechar: () => void;
  aoAbrirAtividade: (a: Activity) => void;
}) {
  const faixa = faixaRisco(risco.severity);
  const caminho = etapa && meta
    ? `${meta.name} › ${etapa.name}${codigoEtapa ? ` (${codigoEtapa})` : ''}`
    : 'Etapa não vinculada';

  return (
    <Painel titulo={risco.title || risco.description} caminho={caminho} aoFechar={aoFechar}>
      {/* Riscos legados podem não ter etapa: a migration 0011 só vinculou o que
          casava sem ambiguidade. Dizer isso é melhor do que exibir um vínculo
          que não existe. */}
      {!etapa && (
        <div
          className="rounded-lg border px-3 py-2 mb-3"
          style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)', fontSize: '0.75rem', color: 'var(--ink-2)' }}
        >
          Este risco veio do modelo anterior e ainda não está vinculado a uma etapa.
          {risco.stage && <> O registro antigo indicava: <strong>{risco.stage}</strong>.</>}
        </div>
      )}

      <Linha rotulo="Descrição">{risco.description || <Ausente />}</Linha>
      <Linha rotulo="Categoria">{risco.category || <Ausente />}</Linha>
      <Linha rotulo="Responsável">{risco.responsible || <Ausente />}</Linha>
      <Linha rotulo="Status">{risco.status}</Linha>

      <Linha rotulo="Matriz">
        <span className="inline-flex items-center gap-2">
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
            probabilidade {risco.probability} × impacto {risco.impact} = {risco.severity}
          </span>
          <span
            className="px-2 py-0.5 rounded-md"
            style={{
              fontSize: '0.7rem', fontWeight: 600,
              background: faixa === 'Baixo' ? 'var(--success-soft)' : faixa === 'Médio' ? 'var(--warning-soft)' : 'var(--danger-soft)',
              color: faixa === 'Baixo' ? 'var(--success)' : faixa === 'Médio' ? 'var(--warning-strong-text)' : 'var(--danger)',
            }}
          >
            {faixa}
          </span>
        </span>
      </Linha>

      <Linha rotulo="Estratégia de resposta">{risco.responseStrategy || <Ausente />}</Linha>
      <Linha rotulo="Especificação / resultado vinculado">{risco.specification || <Ausente />}</Linha>

      <Linha rotulo={`Atividades de resposta (${acoesDeResposta.length})`}>
        {acoesDeResposta.length === 0 ? (
          <span style={{ color: 'var(--ink-5)' }}>Nenhuma ação de resposta cadastrada.</span>
        ) : (
          <ul className="flex flex-col gap-1 mt-1">
            {acoesDeResposta.map(a => (
              <li key={a.id}>
                <button
                  onClick={() => aoAbrirAtividade(a)}
                  className="text-left hover:underline"
                  style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}
                >
                  {a.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Linha>
    </Painel>
  );
}
