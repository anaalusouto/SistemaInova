/**
 * Registro consolidado de riscos (RF-035, RN-028).
 *
 * Matriz 5×5 de probabilidade × impacto com a contagem de cada célula, ao lado
 * da lista de todos os riscos por pontuação decrescente.
 *
 * A distinção que o RN-028 cobra e que é fácil perder: a contagem GERAL do
 * projeto não muda com filtro. Clicar numa célula ou marcar um status reduz a
 * lista e destaca o recorte, mas o "N riscos · M críticos" do topo continua
 * falando do projeto inteiro. Sem isso, filtrar daria a impressão de que o
 * projeto ficou menos arriscado.
 *
 * A matriz agrega SOMENTE riscos cadastrados — atividade nunca é contada como
 * risco, nem a ação de resposta, que é atividade comum com referência à
 * origem (RN-020).
 */
import { useMemo, useState } from 'react';
import { X, Search, ShieldAlert, AlertTriangle } from 'lucide-react';
import { type Risk, type Goal, type RiskStatus } from '../../data/mockData';
import {
  matrizDeRiscos, resumoDeRiscos, filtrarRiscos, faixaRisco,
  CRITERIOS_RISCO_VAZIOS, temFiltroDeRiscoAtivo,
  type CriteriosRisco,
} from '../../lib/planoTrabalho';

const STATUS: RiskStatus[] = ['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'];

const CORES: Record<string, { cor: string; fundo: string; forte: string }> = {
  'Baixo':   { cor: 'var(--success)', fundo: 'var(--success-soft)', forte: 'var(--success)' },
  'Médio':   { cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)', forte: 'var(--warning-strong-text)' },
  'Alto':    { cor: 'var(--danger)', fundo: 'var(--danger-soft)', forte: 'var(--danger)' },
  'Crítico': { cor: 'var(--danger)', fundo: 'var(--danger-soft)', forte: 'var(--danger)' },
  '—':       { cor: 'var(--ink-4)', fundo: 'var(--surface-2)', forte: 'var(--ink-4)' },
};

export function RegistroDeRiscos({
  riscos, metas, codigos, aoFechar, aoAbrirRisco,
}: {
  riscos: Risk[];
  metas: Goal[];
  codigos: Map<string, string>;
  aoFechar: () => void;
  aoAbrirRisco: (r: Risk) => void;
}) {
  const [criterios, setCriterios] = useState<CriteriosRisco>(CRITERIOS_RISCO_VAZIOS);

  // Onde cada risco mora, para exibir meta/etapa na linha (CA-24).
  const localizacao = useMemo(() => {
    const mapa = new Map<string, { etapa: string; meta: string; codigo: string }>();
    for (const meta of metas) {
      for (const etapa of meta.deliverables) {
        mapa.set(etapa.id, { etapa: etapa.name, meta: meta.name, codigo: codigos.get(etapa.id) ?? '' });
      }
    }
    return mapa;
  }, [metas, codigos]);

  const nomeDaEtapa = (stageId: string | undefined) =>
    (stageId && localizacao.get(stageId)?.etapa) || '';

  // Geral: projeto inteiro, imune a filtro. Lista e células: filtradas.
  const resumo = useMemo(() => resumoDeRiscos(riscos), [riscos]);
  const filtrados = useMemo(
    () => filtrarRiscos(riscos, criterios, nomeDaEtapa),
    [riscos, criterios, localizacao],
  );
  const matriz = useMemo(() => {
    // A célula selecionada não deve zerar as outras células da matriz: a
    // matriz mostra a distribuição sob busca e status, e a seleção de célula
    // é um recorte da LISTA. Senão, clicar numa célula apagaria o desenho que
    // permitiu clicar nela.
    const paraMatriz = filtrarRiscos(riscos, { ...criterios, celula: null }, nomeDaEtapa);
    return matrizDeRiscos(paraMatriz);
  }, [riscos, criterios.busca, criterios.status, localizacao]);

  const filtroAtivo = temFiltroDeRiscoAtivo(criterios);

  const alternarStatus = (s: RiskStatus) =>
    setCriterios(c => ({
      ...c,
      status: c.status.includes(s) ? c.status.filter(x => x !== s) : [...c.status, s],
    }));

  const selecionarCelula = (prob: number, imp: number) =>
    setCriterios(c => ({
      ...c,
      celula: c.celula && c.celula[0] === prob && c.celula[1] === imp ? null : [prob, imp],
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.55)' }} onClick={aoFechar}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border w-full max-w-6xl flex flex-col"
        style={{ borderColor: 'var(--border)', maxHeight: '92vh' }}
        role="dialog"
        aria-label="Registro de riscos"
      >
        {/* Cabeçalho com a contagem GERAL do projeto */}
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
              Registro de riscos
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap" style={{ fontSize: '0.74rem', color: 'var(--ink-4)' }}>
              <span><strong style={{ color: 'var(--ink-2)' }}>{resumo.total}</strong> no projeto</span>
              <span style={{ color: resumo.totalCritico > 0 ? 'var(--danger)' : undefined }}>
                <strong>{resumo.totalCritico}</strong> crítico{resumo.totalCritico === 1 ? '' : 's'}
              </span>
              {STATUS.map(s => (
                <span key={s}>{s.toLowerCase()}: <strong style={{ color: 'var(--ink-2)' }}>{resumo.porStatus[s]}</strong></span>
              ))}
            </div>
          </div>
          <button onClick={aoFechar} aria-label="Fechar registro de riscos"><X size={16} color="var(--ink-4)" /></button>
        </div>

        {/* Aviso de riscos legados sem etapa — some assim que forem reconciliados. */}
        {resumo.semEtapa > 0 && (
          <div
            className="mx-5 mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 flex-shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)' }}
          >
            <AlertTriangle size={14} color="var(--warning-strong-text)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: '0.74rem', color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {resumo.semEtapa} risco{resumo.semEtapa === 1 ? '' : 's'} do modelo anterior ainda não
              {resumo.semEtapa === 1 ? ' está vinculado' : ' estão vinculados'} a uma etapa. Continuam
              contando na matriz, mas a coluna Meta / Etapa aparece vazia até a conciliação.
            </span>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
            {/* Matriz 5×5 */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Probabilidade × Impacto
              </div>
              <div className="flex gap-1.5">
                {/* Eixo vertical: impacto, do 5 no topo ao 1 embaixo. */}
                <div className="flex flex-col justify-between items-center pr-1" style={{ fontSize: '0.64rem', color: 'var(--ink-5)' }}>
                  <span
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 600, letterSpacing: '0.04em' }}
                  >
                    IMPACTO
                  </span>
                </div>
                <div>
                  <div className="flex flex-col gap-1">
                    {matriz.celulas.map(linha => (
                      <div key={linha[0].impacto} className="flex items-center gap-1">
                        <span style={{ width: 14, fontSize: '0.64rem', color: 'var(--ink-5)', textAlign: 'right' }}>
                          {linha[0].impacto}
                        </span>
                        {linha.map(celula => {
                          const cor = CORES[celula.faixa] ?? CORES['—'];
                          const selecionada =
                            criterios.celula?.[0] === celula.probabilidade &&
                            criterios.celula?.[1] === celula.impacto;
                          const vazia = celula.quantidade === 0;
                          return (
                            <button
                              key={celula.probabilidade}
                              onClick={() => !vazia && selecionarCelula(celula.probabilidade, celula.impacto)}
                              disabled={vazia}
                              aria-pressed={selecionada}
                              aria-label={`Probabilidade ${celula.probabilidade}, impacto ${celula.impacto}, ${celula.quantidade} risco(s), faixa ${celula.faixa}`}
                              title={`${celula.faixa} · pontuação ${celula.pontuacao} · ${celula.quantidade} risco(s)`}
                              className="rounded-md flex items-center justify-center"
                              style={{
                                width: 46, height: 40,
                                // Célula vazia continua tingida da sua faixa, de
                                // leve: é assim que se lê onde fica a zona
                                // crítica e onde fica a baixa. Pintá-las todas
                                // de cinza apagaria o desenho da matriz e
                                // deixaria a legenda sem referência na grade.
                                background: cor.fundo,
                                color: vazia ? 'var(--ink-5)' : cor.forte,
                                border: selecionada ? '2px solid var(--primary)' : '1px solid var(--line-1)',
                                fontSize: '0.9rem', fontWeight: vazia ? 400 : 700,
                                cursor: vazia ? 'default' : 'pointer',
                                opacity: vazia ? 0.35 : 1,
                              }}
                            >
                              {celula.quantidade || '·'}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span style={{ width: 14 }} />
                    {[1, 2, 3, 4, 5].map(n => (
                      <span key={n} style={{ width: 46, textAlign: 'center', fontSize: '0.64rem', color: 'var(--ink-5)' }}>
                        {n}
                      </span>
                    ))}
                  </div>
                  <div className="text-center mt-0.5" style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--ink-5)', letterSpacing: '0.04em', paddingLeft: 14 }}>
                    PROBABILIDADE
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 mt-3 flex-wrap" style={{ fontSize: '0.66rem', color: 'var(--ink-4)' }}>
                {(['Baixo', 'Médio', 'Alto', 'Crítico'] as const).map(f => (
                  <span key={f} className="inline-flex items-center gap-1">
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: CORES[f].fundo, border: `1px solid ${CORES[f].forte}`, display: 'inline-block' }} />
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {/* Lista */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={13} color="var(--ink-5)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="search"
                    className="w-full border rounded-lg pl-7 pr-2 py-1.5"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.76rem' }}
                    placeholder="Buscar risco, etapa, responsável ou categoria"
                    value={criterios.busca}
                    onChange={e => setCriterios(c => ({ ...c, busca: e.target.value }))}
                  />
                </div>
                {STATUS.map(s => {
                  const ativo = criterios.status.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => alternarStatus(s)}
                      aria-pressed={ativo}
                      className="px-2 py-1 rounded-md border text-[11.5px]"
                      style={{
                        borderColor: ativo ? 'var(--primary)' : 'var(--border)',
                        background: ativo ? 'var(--brand-soft)' : 'transparent',
                        color: ativo ? 'var(--brand)' : 'var(--ink-3)',
                        fontWeight: ativo ? 600 : 400,
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
                {filtroAtivo && (
                  <button
                    onClick={() => setCriterios(CRITERIOS_RISCO_VAZIOS)}
                    className="px-2 py-1 rounded-md border text-[11.5px]"
                    style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--ink-5)', marginBottom: 6 }} aria-live="polite">
                {filtroAtivo ? `${filtrados.length} de ${resumo.total} riscos` : `${resumo.total} riscos`}
                {criterios.celula && ` · célula ${criterios.celula[0]}×${criterios.celula[1]}`}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 620 }}>
                  <thead>
                    <tr>
                      {['Risco', 'Pontuação', 'Categoria', 'Status', 'Responsável', 'Meta / Etapa'].map(c => (
                        <th
                          key={c}
                          className="text-left px-2 py-1.5"
                          style={{
                            fontSize: '0.64rem', fontWeight: 600, color: 'var(--ink-5)',
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                          }}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-2 py-6 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.78rem' }}>
                          Nenhum risco corresponde aos filtros aplicados.
                        </td>
                      </tr>
                    )}
                    {filtrados.map(r => {
                      const faixa = faixaRisco(r.severity);
                      const cor = CORES[faixa] ?? CORES['—'];
                      const onde = r.stageId ? localizacao.get(r.stageId) : undefined;
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--line-1)' }}>
                          <td className="px-2 py-1.5" style={{ maxWidth: 240 }}>
                            <button
                              onClick={() => aoAbrirRisco(r)}
                              className="text-left hover:underline flex items-center gap-1.5 min-w-0 w-full"
                              style={{ fontSize: '0.76rem', color: 'var(--ink-1)' }}
                            >
                              <ShieldAlert size={11} color={cor.forte} style={{ flexShrink: 0 }} />
                              <span className="truncate">{r.title || r.description}</span>
                            </button>
                          </td>
                          <td className="px-2 py-1.5" style={{ whiteSpace: 'nowrap' }}>
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
                              style={{ background: cor.fundo, color: cor.forte, fontSize: '0.68rem', fontWeight: 700 }}
                            >
                              {r.severity} · {faixa}
                            </span>
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.74rem', color: 'var(--ink-3)' }}>
                            {r.category || <span style={{ color: 'var(--ink-5)' }}>—</span>}
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.74rem', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                            {r.status}
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.74rem', color: 'var(--ink-3)' }}>
                            {r.responsible || <span style={{ color: 'var(--ink-5)' }}>—</span>}
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.72rem', color: 'var(--ink-4)', maxWidth: 200 }}>
                            {onde ? (
                              <span className="block truncate" title={`${onde.meta} › ${onde.etapa}`}>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-5)' }}>{onde.codigo}</span>{' '}
                                {onde.etapa}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--ink-5)', fontStyle: 'italic' }}>sem etapa vinculada</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
