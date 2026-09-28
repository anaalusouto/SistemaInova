/**
 * Visão Riscos do Plano de Trabalho (RF01, RF02, RF03; antes RF-035, RN-028).
 *
 * Substitui o modal "Registro de riscos" e a gaveta do cabeçalho: todos os
 * riscos na mesma tela, com o detalhamento já aberto — descrição, etapa,
 * especificação, estratégia e ações de resposta —, sem abrir item por item.
 * O painel do risco continua existindo, mas só para editar.
 *
 * Texto nunca é cortado (RF02): as células quebram linha e crescem na altura.
 * Abaixo de lg a tabela vira cartões, porque nove colunas de texto corrido
 * num celular só seriam legíveis rolando de lado.
 *
 * RN-028 continua valendo: a contagem GERAL do topo é do projeto inteiro e não
 * muda com filtro; célula e status recortam a lista, não o projeto. A matriz
 * agrega SOMENTE riscos cadastrados — atividade nunca conta como risco (RN-020).
 */
import { useMemo, useState } from 'react';
import { Search, ShieldAlert, AlertTriangle, Pencil } from 'lucide-react';
import { type Risk, type Goal, type RiskStatus, type Activity } from '../../data/mockData';
import {
  matrizDeRiscos, resumoDeRiscos, filtrarRiscos, faixaRisco, textoDoRisco,
  CRITERIOS_RISCO_VAZIOS, temFiltroDeRiscoAtivo,
  type CriteriosRisco,
} from '../../lib/planoTrabalho';
import { useAuth } from '../../auth/authStore';

const STATUS: RiskStatus[] = ['Aberto', 'Em mitigação', 'Monitorando', 'Encerrado'];

const CORES: Record<string, { cor: string; fundo: string; forte: string }> = {
  'Baixo':   { cor: 'var(--success)', fundo: 'var(--success-soft)', forte: 'var(--success)' },
  'Médio':   { cor: 'var(--warning-strong-text)', fundo: 'var(--warning-soft)', forte: 'var(--warning-strong-text)' },
  'Alto':    { cor: 'var(--danger)', fundo: 'var(--danger-soft)', forte: 'var(--danger)' },
  'Crítico': { cor: 'var(--danger)', fundo: 'var(--danger-soft)', forte: 'var(--danger)' },
  '—':       { cor: 'var(--ink-4)', fundo: 'var(--surface-2)', forte: 'var(--ink-4)' },
};

const quebra: React.CSSProperties = { whiteSpace: 'pre-line', overflowWrap: 'anywhere', lineHeight: 1.5 };

interface Local { etapa: string; meta: string; codigo: string }

export function VisaoRiscos({
  riscos, metas, codigos, atividades, aoAbrirRisco, aoAbrirAtividade,
}: {
  riscos: Risk[];
  metas: Goal[];
  codigos: Map<string, string>;
  /** Todas as atividades do projeto, para listar as ações de resposta de cada risco. */
  atividades: Activity[];
  aoAbrirRisco: (r: Risk) => void;
  aoAbrirAtividade: (a: Activity) => void;
}) {
  const { readOnly } = useAuth();
  const [criterios, setCriterios] = useState<CriteriosRisco>(CRITERIOS_RISCO_VAZIOS);

  // RF03: a hierarquia é Meta › Etapa, a especificação é a atividade ou
  // resultado a que o risco se refere, e o risco é o próprio registro. Cada
  // um na sua coluna — antes o título do risco guardava a especificação.
  const localizacao = useMemo(() => {
    const mapa = new Map<string, Local>();
    for (const meta of metas) {
      for (const etapa of meta.deliverables) {
        mapa.set(etapa.id, { etapa: etapa.name, meta: meta.name, codigo: codigos.get(etapa.id) ?? '' });
      }
    }
    return mapa;
  }, [metas, codigos]);

  const respostas = useMemo(() => {
    const mapa = new Map<string, Activity[]>();
    for (const a of atividades) {
      if (!a.riskOriginId) continue;
      mapa.set(a.riskOriginId, [...(mapa.get(a.riskOriginId) ?? []), a]);
    }
    return mapa;
  }, [atividades]);

  const nomeDaEtapa = (stageId: string | undefined) => (stageId && localizacao.get(stageId)?.etapa) || '';

  const resumo = useMemo(() => resumoDeRiscos(riscos), [riscos]);
  const filtrados = useMemo(
    () => filtrarRiscos(riscos, criterios, nomeDaEtapa),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [riscos, criterios, localizacao],
  );
  // A célula selecionada recorta a LISTA, não a matriz — senão clicar numa
  // célula apagaria o desenho que permitiu clicar nela.
  const matriz = useMemo(
    () => matrizDeRiscos(filtrarRiscos(riscos, { ...criterios, celula: null }, nomeDaEtapa)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [riscos, criterios.busca, criterios.status, localizacao],
  );
  const filtroAtivo = temFiltroDeRiscoAtivo(criterios);

  const alternarStatus = (s: RiskStatus) =>
    setCriterios(c => ({ ...c, status: c.status.includes(s) ? c.status.filter(x => x !== s) : [...c.status, s] }));
  const selecionarCelula = (prob: number, imp: number) =>
    setCriterios(c => ({ ...c, celula: c.celula && c.celula[0] === prob && c.celula[1] === imp ? null : [prob, imp] }));

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Resumo GERAL do projeto — imune a filtro (RN-028) */}
      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap" style={{ fontSize: '0.76rem', color: 'var(--ink-4)' }}>
        <span><strong style={{ color: 'var(--ink-2)' }}>{resumo.total}</strong> riscos no projeto</span>
        <span style={{ color: resumo.totalCritico > 0 ? 'var(--danger)' : undefined }}>
          <strong>{resumo.totalCritico}</strong> crítico{resumo.totalCritico === 1 ? '' : 's'}
        </span>
        {STATUS.map(s => (
          <span key={s}>{s.toLowerCase()}: <strong style={{ color: 'var(--ink-2)' }}>{resumo.porStatus[s]}</strong></span>
        ))}
      </div>

      {resumo.semEtapa > 0 && (
        <div className="flex items-start gap-2 rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)' }}>
          <AlertTriangle size={14} color="var(--warning-strong-text)" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: '0.74rem', color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {resumo.semEtapa} risco{resumo.semEtapa === 1 ? '' : 's'} do modelo anterior ainda não
            {resumo.semEtapa === 1 ? ' está vinculado' : ' estão vinculados'} a uma etapa. Continuam contando na matriz;
            a coluna Meta / Etapa mostra a etapa registrada na planilha antiga até a conciliação.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-start">
        <Matriz matriz={matriz} celula={criterios.celula} aoSelecionar={selecionarCelula} />

        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={13} color="var(--ink-5)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="search"
                className="w-full border rounded-lg pl-7 pr-2 py-1.5"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.78rem' }}
                placeholder="Buscar risco, etapa, especificação, estratégia ou responsável"
                value={criterios.busca}
                onChange={e => setCriterios(c => ({ ...c, busca: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
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
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }} aria-live="polite">
            {filtroAtivo ? `${filtrados.length} de ${resumo.total} riscos` : `${resumo.total} riscos, da maior para a menor pontuação`}
            {criterios.celula && ` · célula probabilidade ${criterios.celula[0]} × impacto ${criterios.celula[1]}`}
          </div>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="py-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.8rem' }}>
          Nenhum risco corresponde aos filtros aplicados.
        </div>
      ) : (
        <>
          {/* Desktop: tabela, todas as colunas com texto inteiro */}
          <div className="hidden lg:block">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '8%' }} />
              </colgroup>
              <thead>
                <tr>
                  {['Risco', 'Meta / Etapa', 'Especificação', 'P × I', 'Categoria · Status', 'Responsável', 'Estratégia de resposta', 'Ações de resposta'].map(c => (
                    <th
                      key={c}
                      className="text-left px-2.5 py-2"
                      style={{
                        fontSize: '0.64rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase',
                        letterSpacing: '0.04em', borderBottom: '1px solid var(--border)', verticalAlign: 'bottom',
                      }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(r => (
                  <LinhaRisco
                    key={r.id} risco={r} onde={r.stageId ? localizacao.get(r.stageId) : undefined}
                    respostas={respostas.get(r.id) ?? []} podeEditar={!readOnly}
                    aoAbrirRisco={aoAbrirRisco} aoAbrirAtividade={aoAbrirAtividade}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular e tablet: um cartão por risco, mesmo conteúdo */}
          <ul className="lg:hidden flex flex-col gap-3">
            {filtrados.map(r => (
              <CartaoRisco
                key={r.id} risco={r} onde={r.stageId ? localizacao.get(r.stageId) : undefined}
                respostas={respostas.get(r.id) ?? []} podeEditar={!readOnly}
                aoAbrirRisco={aoAbrirRisco} aoAbrirAtividade={aoAbrirAtividade}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface ItemProps {
  risco: Risk;
  onde: Local | undefined;
  respostas: Activity[];
  podeEditar: boolean;
  aoAbrirRisco: (r: Risk) => void;
  aoAbrirAtividade: (a: Activity) => void;
}

function Vazio({ texto = '—' }: { texto?: string }) {
  return <span style={{ color: 'var(--ink-5)', fontStyle: texto === '—' ? undefined : 'italic' }}>{texto}</span>;
}

function Pontuacao({ risco }: { risco: Risk }) {
  const faixa = faixaRisco(risco.severity);
  const cor = CORES[faixa] ?? CORES['—'];
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex px-1.5 py-0.5 rounded self-start" style={{ background: cor.fundo, color: cor.forte, fontSize: '0.7rem', fontWeight: 700 }}>
        {risco.severity} · {faixa}
      </span>
      <span style={{ fontSize: '0.66rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
        {risco.probability} × {risco.impact}
      </span>
    </span>
  );
}

function OndeTexto({ onde, risco }: { onde: Local | undefined; risco: Risk }) {
  if (onde) {
    // Muitas etapas já trazem o número no nome ("3.3 Contratação do PJ");
    // repetir o código calculado na frente daria "3.3 3.3 …".
    const jaNumerada = !!onde.codigo && onde.etapa.trim().startsWith(onde.codigo);
    return (
      <span style={quebra}>
        <span style={{ color: 'var(--ink-5)' }}>{onde.meta}</span>
        {' › '}
        {!jaNumerada && onde.codigo && (
          <><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-5)' }}>{onde.codigo}</span>{' '}</>
        )}
        {onde.etapa}
      </span>
    );
  }
  // Risco legado sem etapa: mostra o que a planilha antiga dizia, marcado como tal.
  return risco.stage
    ? <span style={quebra}><Vazio texto="sem vínculo · " />{risco.stage}</span>
    : <Vazio texto="sem etapa vinculada" />;
}

function Respostas({ respostas, aoAbrirAtividade }: { respostas: Activity[]; aoAbrirAtividade: (a: Activity) => void }) {
  if (respostas.length === 0) return <Vazio />;
  return (
    <ul className="flex flex-col gap-1">
      {respostas.map(a => (
        <li key={a.id}>
          <button onClick={() => aoAbrirAtividade(a)} className="text-left hover:underline" style={{ ...quebra, color: 'var(--info)' }}>
            {a.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function CabecaRisco({ risco, podeEditar, aoAbrirRisco }: { risco: Risk; podeEditar: boolean; aoAbrirRisco: (r: Risk) => void }) {
  const { titulo, detalhe } = textoDoRisco(risco);
  const cor = (CORES[faixaRisco(risco.severity)] ?? CORES['—']).forte;
  return (
    <div className="flex items-start gap-1.5">
      <ShieldAlert size={12} color={cor} style={{ flexShrink: 0, marginTop: 3 }} />
      <div className="min-w-0 flex-1">
        <div style={{ ...quebra, fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-1)' }}>{titulo}</div>
        {detalhe && <div style={{ ...quebra, fontSize: '0.76rem', color: 'var(--ink-3)', marginTop: 2 }}>{detalhe}</div>}
        <button
          onClick={() => aoAbrirRisco(risco)}
          className="inline-flex items-center gap-1 mt-1 hover:underline"
          style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}
        >
          {podeEditar ? <><Pencil size={10} /> Abrir para editar</> : 'Abrir'}
        </button>
      </div>
    </div>
  );
}

function LinhaRisco({ risco, onde, respostas, podeEditar, aoAbrirRisco, aoAbrirAtividade }: ItemProps) {
  const td: React.CSSProperties = { padding: '10px', borderBottom: '1px solid var(--line-1)', verticalAlign: 'top', fontSize: '0.76rem', color: 'var(--ink-2)' };
  return (
    <tr>
      <td style={td}><CabecaRisco risco={risco} podeEditar={podeEditar} aoAbrirRisco={aoAbrirRisco} /></td>
      <td style={td}><OndeTexto onde={onde} risco={risco} /></td>
      <td style={td}>{risco.specification ? <span style={quebra}>{risco.specification}</span> : <Vazio />}</td>
      <td style={td}><Pontuacao risco={risco} /></td>
      <td style={td}>
        <div style={quebra}>{risco.category || <Vazio />}</div>
        <div style={{ color: 'var(--ink-4)', marginTop: 2 }}>{risco.status}</div>
      </td>
      <td style={td}>{risco.responsible ? <span style={quebra}>{risco.responsible}</span> : <Vazio />}</td>
      <td style={td}>{risco.responseStrategy ? <span style={quebra}>{risco.responseStrategy}</span> : <Vazio />}</td>
      <td style={td}><Respostas respostas={respostas} aoAbrirAtividade={aoAbrirAtividade} /></td>
    </tr>
  );
}

function CartaoRisco({ risco, onde, respostas, podeEditar, aoAbrirRisco, aoAbrirAtividade }: ItemProps) {
  const Campo = ({ rotulo, children }: { rotulo: string; children: React.ReactNode }) => (
    <div>
      <div style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{rotulo}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--ink-2)', marginTop: 1 }}>{children}</div>
    </div>
  );
  return (
    <li className="rounded-xl border p-3 flex flex-col gap-2.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-0)' }}>
      <div className="flex items-start justify-between gap-2">
        <CabecaRisco risco={risco} podeEditar={podeEditar} aoAbrirRisco={aoAbrirRisco} />
        <Pontuacao risco={risco} />
      </div>
      <Campo rotulo="Meta / Etapa"><OndeTexto onde={onde} risco={risco} /></Campo>
      <Campo rotulo="Especificação">{risco.specification ? <span style={quebra}>{risco.specification}</span> : <Vazio />}</Campo>
      <div className="grid grid-cols-2 gap-2">
        <Campo rotulo="Categoria">{risco.category || <Vazio />}</Campo>
        <Campo rotulo="Status">{risco.status}</Campo>
      </div>
      <Campo rotulo="Responsável">{risco.responsible || <Vazio />}</Campo>
      <Campo rotulo="Estratégia de resposta">{risco.responseStrategy ? <span style={quebra}>{risco.responseStrategy}</span> : <Vazio />}</Campo>
      <Campo rotulo="Ações de resposta"><Respostas respostas={respostas} aoAbrirAtividade={aoAbrirAtividade} /></Campo>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Matriz 5×5
// ---------------------------------------------------------------------------

function Matriz({
  matriz, celula, aoSelecionar,
}: {
  matriz: ReturnType<typeof matrizDeRiscos>;
  celula: [number, number] | null;
  aoSelecionar: (prob: number, imp: number) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        Probabilidade × Impacto
      </div>
      <div className="flex gap-1.5">
        <div className="flex flex-col justify-center items-center pr-1" style={{ fontSize: '0.64rem', color: 'var(--ink-5)' }}>
          <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 600, letterSpacing: '0.04em' }}>IMPACTO</span>
        </div>
        <div>
          <div className="flex flex-col gap-1">
            {matriz.celulas.map(linha => (
              <div key={linha[0].impacto} className="flex items-center gap-1">
                <span style={{ width: 14, fontSize: '0.64rem', color: 'var(--ink-5)', textAlign: 'right' }}>{linha[0].impacto}</span>
                {linha.map(c => {
                  const cor = CORES[c.faixa] ?? CORES['—'];
                  const selecionada = celula?.[0] === c.probabilidade && celula?.[1] === c.impacto;
                  const vazia = c.quantidade === 0;
                  return (
                    <button
                      key={c.probabilidade}
                      onClick={() => !vazia && aoSelecionar(c.probabilidade, c.impacto)}
                      disabled={vazia}
                      aria-pressed={selecionada}
                      aria-label={`Probabilidade ${c.probabilidade}, impacto ${c.impacto}, ${c.quantidade} risco(s), faixa ${c.faixa}`}
                      title={`${c.faixa} · pontuação ${c.pontuacao} · ${c.quantidade} risco(s)`}
                      className="rounded-md flex items-center justify-center"
                      style={{
                        width: 44, height: 38,
                        // Célula vazia continua tingida da sua faixa, de leve: é
                        // assim que se lê onde fica a zona crítica.
                        background: cor.fundo,
                        color: vazia ? 'var(--ink-5)' : cor.forte,
                        border: selecionada ? '2px solid var(--primary)' : '1px solid var(--line-1)',
                        fontSize: '0.88rem', fontWeight: vazia ? 400 : 700,
                        cursor: vazia ? 'default' : 'pointer',
                        opacity: vazia ? 0.35 : 1,
                      }}
                    >
                      {c.quantidade || '·'}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span style={{ width: 14 }} />
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} style={{ width: 44, textAlign: 'center', fontSize: '0.64rem', color: 'var(--ink-5)' }}>{n}</span>
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
  );
}
