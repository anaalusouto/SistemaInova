/**
 * Painel do risco (RF-027, RF-028).
 *
 * Mostra hierarquia, matriz, estratégia e as atividades de resposta — e
 * permite editar, para a equipe PMO. Risco legado sem etapa vinculada diz isso
 * em vez de exibir um vínculo que não existe: a migration 0011 só vinculou
 * automaticamente o que casava sem ambiguidade.
 */
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { useAuth } from '../../auth/authStore';
import { faixaRisco } from '../../lib/planoTrabalho';
import { Painel, Linha, Ausente, BotaoAcao } from './PainelBase';
import { FormularioRisco } from './FormularioRisco';

export function PainelRisco({
  risco, etapa, meta, codigoEtapa, projetoId, acoesDeResposta, aoFechar, aoAbrirAtividade,
}: {
  risco: Risk; etapa?: Deliverable; meta?: Goal; codigoEtapa?: string; projetoId: number;
  acoesDeResposta: Activity[];
  aoFechar: () => void;
  aoAbrirAtividade: (a: Activity) => void;
}) {
  const { readOnly } = useAuth();
  const [editando, setEditando] = useState(false);
  const faixa = faixaRisco(risco.severity);

  const caminho = etapa && meta
    ? `${meta.name} › ${etapa.name}${codigoEtapa ? ` (${codigoEtapa})` : ''}`
    : 'Etapa não vinculada';

  // Sem etapa não há o que editar com segurança: o formulário exige etapa
  // (RN-028) e escolher uma por chute reescreveria o histórico do registro.
  const podeEditar = !readOnly && !!etapa;

  const acoes = podeEditar && !editando ? (
    <BotaoAcao aoClicar={() => setEditando(true)}><Pencil size={12} /> Editar risco</BotaoAcao>
  ) : undefined;

  return (
    <Painel
      titulo={editando ? 'Editar risco' : (risco.title || risco.description)}
      caminho={caminho}
      aoFechar={aoFechar}
      acoes={acoes}
    >
      {editando && etapa ? (
        <FormularioRisco projetoId={projetoId} etapa={etapa} risco={risco} aoFechar={() => setEditando(false)} />
      ) : (
        <>
          {!etapa && (
            <div
              className="rounded-lg border px-3 py-2 mb-3"
              style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)', fontSize: '0.75rem', color: 'var(--ink-2)' }}
            >
              Este risco veio do modelo anterior e ainda não está vinculado a uma etapa, então não pode ser
              editado por aqui.
              {risco.stage && <> O registro antigo indicava: <strong>{risco.stage}</strong>.</>}
            </div>
          )}

          <Linha rotulo="Descrição">{risco.description || <Ausente />}</Linha>
          <Linha rotulo="Categoria">{risco.category || <Ausente />}</Linha>
          <Linha rotulo="Responsável">{risco.responsible || <Ausente />}</Linha>
          <Linha rotulo="Status">{risco.status}</Linha>

          <Linha rotulo="Matriz">
            <span className="inline-flex items-center gap-2 flex-wrap">
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
        </>
      )}
    </Painel>
  );
}
