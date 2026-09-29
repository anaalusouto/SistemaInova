/**
 * Aba Orçamento — tabela de execução (RF-038, RF-039, RF-040, RF-041).
 *
 * Os dados planejados são somente leitura (RF-030): a equipe PMO informa na
 * linha apenas valor executado, data da compra e a justificativa exigida pela
 * diferença. Corrigir o planejado é papel de uma nova versão da planilha, com
 * prévia e reconciliação — digitar por cima aqui faria a tela e o arquivo de
 * origem contarem histórias diferentes.
 *
 * Dois valores, e só dois (RF-029): proposto e executado. Não há cartão de
 * "valor aprovado", porque o proposto JÁ é o aprovado.
 *
 * RF04.3: o executado vem das notas fiscais. A lista de notas aparece mesmo
 * sem planilha importada — nota pode entrar sem item e ser vinculada depois.
 */
import { Fragment, useMemo, useState } from 'react';
import {
  ChevronDown, ChevronRight, Search, ShieldAlert, Info, Trash2, RotateCcw, History, Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type Goal } from '../../data/mockData';
import { useStore, type ProjectExt } from '../../store';
import { useAuth } from '../../auth/authStore';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  agruparPorGrupo, totaisDoOrcamento, diferencaDoItem, justificativaPendente, somaDasNotas,
  moeda, moedaComSinal, NAO_INFORMADO, type ItemOrcamento, type NotaOrcamento,
} from '../../lib/orcamento';
import { FormularioExecucao } from './FormularioExecucao';
import { FormularioNota } from './FormularioNota';
import { ComparativoExecucao, ListaNotas } from './NotasOrcamento';
import { DialogoExclusaoItem } from './DialogoExclusaoItem';
import { PainelHistoricoItem } from './PainelHistoricoItem';
import { DialogoImportacao } from './DialogoImportacao';

type FiltroSituacao = 'ativos' | 'excluidos' | 'todos';

function Cabecalho({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="text-left px-2 py-1.5"
      style={{
        fontSize: '0.62rem', fontWeight: 600, color: 'var(--ink-5)',
        textTransform: 'uppercase', letterSpacing: '0.03em',
        borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
        background: 'var(--surface-1)',
      }}
    >
      {children}
    </th>
  );
}

const COLUNAS = [
  'Categoria', 'Descrição', 'Qtd.', 'Un.', 'Qtd./un.', 'Valor unitário',
  'Total proposto', 'Valor executado', 'Data da compra', 'Diferença',
  'Situação', 'Justificativa', 'Risco', '',
];

export function TabOrcamento({ project }: { project: Project }) {
  const p = project as ProjectExt;
  const { readOnly } = useAuth();
  const { reverterItemOrcamento } = useStore();

  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState<FiltroSituacao>('ativos');
  const [comRisco, setComRisco] = useState(false);
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());
  const [editando, setEditando] = useState<ItemOrcamento | null>(null);
  const [excluindo, setExcluindo] = useState<ItemOrcamento | null>(null);
  const [historico, setHistorico] = useState<ItemOrcamento | null>(null);
  const [revertendo, setRevertendo] = useState<ItemOrcamento | null>(null);
  const [motivoReversao, setMotivoReversao] = useState('');
  const [importando, setImportando] = useState(false);
  // Diálogo da nota: nova (com item pré-escolhido ou não) ou existente.
  const [notaAberta, setNotaAberta] = useState<{ nota?: NotaOrcamento; itemId?: string | null } | null>(null);

  const itens = p.orcamentoItens ?? [];
  const notas = p.orcamentoNotas ?? [];
  const notasPorItem = useMemo(() => {
    const m = new Map<string, NotaOrcamento[]>();
    for (const n of notas) if (n.itemId) m.set(n.itemId, [...(m.get(n.itemId) ?? []), n]);
    return m;
  }, [notas]);

  // Totais do PROJETO: calculados sobre todos os itens, imunes ao filtro. O
  // mesmo princípio do registro de riscos — filtrar não pode fazer o
  // orçamento parecer menor do que é.
  const totaisProjeto = useMemo(() => totaisDoOrcamento(itens), [itens]);
  // Proposto: da planilha quando há itens, senão o aprovado do cadastro — o
  // mesmo que o cabeçalho do projeto mostra. Executado: todas as notas.
  const proposto = itens.length ? totaisProjeto.proposto : (p.budgetApproved || null);
  const executado = somaDasNotas(notas) ?? totaisProjeto.executadoConhecido;

  const dialogoNota = notaAberta && (
    <FormularioNota
      projetoId={p.id}
      itens={itens}
      nota={notaAberta.nota}
      itemInicial={notaAberta.itemId}
      aoFechar={() => setNotaAberta(null)}
    />
  );

  const filtrados = useMemo(() => {
    const termo = busca.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    return itens.filter(i => {
      if (situacao === 'ativos' && i.situacao !== 'Ativo') return false;
      if (situacao === 'excluidos' && i.situacao !== 'Excluído') return false;
      if (comRisco && !i.riscoId) return false;
      if (termo) {
        const alvo = [i.grupo, i.categoria, i.descricao]
          .join(' ').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [itens, busca, situacao, comRisco]);

  const grupos = useMemo(() => agruparPorGrupo(filtrados), [filtrados]);

  const etapas = useMemo(
    () => p.goals.flatMap((meta: Goal) => meta.deliverables.map(e => ({
      id: e.id, nome: e.name, meta: meta.name,
    }))),
    [p.goals],
  );

  const alternarGrupo = (g: string) =>
    setRecolhidos(atual => {
      const proximo = new Set(atual);
      if (proximo.has(g)) proximo.delete(g); else proximo.add(g);
      return proximo;
    });

  if (itens.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-6 flex flex-col gap-4">
        <ComparativoExecucao proposto={proposto} executado={executado} notas={notas} />
        <ListaNotas
          notas={notas}
          itens={itens}
          aoNovaNota={() => setNotaAberta({})}
          aoAbrirNota={n => setNotaAberta({ nota: n })}
        />
        <div
          className="flex items-start gap-2.5 rounded-lg border px-3.5 py-3 max-w-3xl"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
        >
          <Info size={15} color="var(--ink-4)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', lineHeight: 1.6 }}>
            Nenhum item de orçamento neste projeto. Os itens vêm da importação da planilha do
            orçamento. Enquanto ela não entra, as notas são lançadas sem item e contam no total
            do projeto; depois, cada nota pode ser vinculada ao item dela.
          </div>
        </div>

        {!readOnly && (
          <button
            onClick={() => setImportando(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12.5px] self-start"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
          >
            <Upload size={13} /> Importar planilha
          </button>
        )}

        {importando && (
          <DialogoImportacao projetoId={p.id} aoFechar={() => setImportando(false)} />
        )}
        {dialogoNota}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col gap-4">
      {/* RF-029 e RF04.3: proposto × executado (das notas). */}
      <ComparativoExecucao proposto={proposto} executado={executado} notas={notas} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            rotulo: 'Itens sem execução',
            valor: String(totaisProjeto.itensSemExecucao),
            nota: totaisProjeto.itensSemExecucao > 0 ? 'nenhuma nota vinculada' : 'todos os itens com nota',
          },
          { rotulo: 'Plano ativo', valor: moeda(totaisProjeto.ativo), nota: 'proposto menos itens excluídos' },
          {
            rotulo: 'Itens excluídos',
            valor: String(totaisProjeto.itensExcluidos),
            nota: totaisProjeto.itensExcluidos ? moeda(totaisProjeto.totalExcluido) : 'nenhum',
          },
        ].map(c => (
          <div key={c.rotulo} className="bg-card rounded-xl border p-3.5" style={{ borderColor: 'var(--border)' }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {c.rotulo}
            </div>
            <div
              className="truncate"
              style={{
                fontSize: c.valor === NAO_INFORMADO ? '0.9rem' : '1.05rem',
                fontWeight: 700,
                fontFamily: c.valor === NAO_INFORMADO ? undefined : 'var(--font-mono)',
                fontStyle: c.valor === NAO_INFORMADO ? 'italic' : undefined,
                color: c.valor === NAO_INFORMADO ? 'var(--ink-5)' : 'var(--ink-1)',
                marginTop: 3,
              }}
            >
              {c.valor}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--ink-5)' }}>{c.nota}</div>
          </div>
        ))}
      </div>

      {/* Busca e filtros (RF-038) */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} color="var(--ink-5)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="search"
            className="w-full border rounded-lg pl-7 pr-2 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.76rem' }}
            placeholder="Buscar grupo, categoria ou item"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {([['ativos', 'Ativos'], ['excluidos', 'Excluídos'], ['todos', 'Todos']] as const).map(([v, r], i) => (
            <button
              key={v}
              onClick={() => setSituacao(v)}
              className="px-2.5 py-1.5 text-[12px]"
              style={{
                background: situacao === v ? 'var(--brand-soft)' : 'transparent',
                color: situacao === v ? 'var(--brand)' : 'var(--ink-3)',
                fontWeight: situacao === v ? 600 : 400,
                borderRight: i < 2 ? '1px solid var(--border)' : undefined,
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={() => setComRisco(v => !v)}
          aria-pressed={comRisco}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px]"
          style={{
            borderColor: comRisco ? 'var(--primary)' : 'var(--border)',
            background: comRisco ? 'var(--brand-soft)' : 'transparent',
            color: comRisco ? 'var(--brand)' : 'var(--ink-3)',
          }}
        >
          <ShieldAlert size={13} /> Com risco
        </button>
        {!readOnly && (
          <button
            onClick={() => setImportando(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
          >
            <Upload size={13} /> Importar planilha
          </button>
        )}
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }} aria-live="polite">
          {filtrados.length} de {itens.length} itens
        </span>
      </div>

      {/* Tabela por grupo */}
      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 1180 }}>
            <thead>
              <tr>{COLUNAS.map(c => <Cabecalho key={c}>{c}</Cabecalho>)}</tr>
            </thead>
            <tbody>
              {grupos.length === 0 && (
                <tr>
                  <td colSpan={COLUNAS.length} className="px-3 py-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.8rem' }}>
                    Nenhum item corresponde aos filtros aplicados.
                  </td>
                </tr>
              )}

              {grupos.map(({ grupo, itens: doGrupo, totais }) => {
                const recolhido = recolhidos.has(grupo);
                return (
                  <Fragment key={grupo}>
                    <tr style={{ background: 'var(--surface-2)' }}>
                      <td colSpan={COLUNAS.length} className="px-2 py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => alternarGrupo(grupo)} aria-expanded={!recolhido} className="flex items-center gap-1.5">
                            {recolhido ? <ChevronRight size={13} color="var(--ink-4)" /> : <ChevronDown size={13} color="var(--ink-4)" />}
                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--ink-1)' }}>{grupo}</span>
                          </button>
                          <span style={{ fontSize: '0.7rem', color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
                            proposto {moeda(totais.proposto)} · executado {moeda(totais.executadoConhecido)}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
                            {/* "item" tem plural irregular: itens, não items. */}
                            {doGrupo.length === 1 ? '1 item' : `${doGrupo.length} itens`}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {!recolhido && doGrupo.map(item => {
                      const diferenca = diferencaDoItem(item);
                      const excluido = item.situacao === 'Excluído';
                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid var(--line-1)',
                            // Item excluído permanece na posição, visivelmente
                            // diferente — nunca some da lista (RF-040).
                            background: excluido ? 'var(--danger-soft)' : undefined,
                            opacity: excluido ? 0.85 : 1,
                          }}
                        >
                          <td className="px-2 py-1.5" style={{ fontSize: '0.73rem', color: 'var(--ink-3)' }}>{item.categoria || '—'}</td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.75rem', color: 'var(--ink-1)', maxWidth: 240 }}>
                            <span className="block truncate" title={item.descricao}>{item.descricao}</span>
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{item.qtd}</td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>{item.unidade || '—'}</td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{item.qtdUnidades}</td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{moeda(item.valorUnitario)}</td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.73rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-1)', fontWeight: 600, whiteSpace: 'nowrap' }}>{moeda(item.valorProposto)}</td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.73rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                            {item.valorExecutado === null ? (
                              <span style={{ color: 'var(--ink-5)', fontStyle: 'italic', fontFamily: 'inherit' }}>{NAO_INFORMADO}</span>
                            ) : (
                              <span style={{ color: 'var(--ink-1)', fontWeight: 600 }}>{moeda(item.valorExecutado)}</span>
                            )}
                            <span className="block" style={{ fontSize: '0.64rem', color: 'var(--ink-5)', fontFamily: 'inherit' }}>
                              {(() => {
                                const qtd = notasPorItem.get(item.id)?.length ?? 0;
                                return `${qtd} ${qtd === 1 ? 'nota' : 'notas'}${item.execucaoConcluida ? ' · concluído' : ''}`;
                              })()}
                            </span>
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                            {item.dataCompra ? formatDateOnly(item.dataCompra) : '—'}
                          </td>
                          <td
                            className="px-2 py-1.5"
                            style={{
                              fontSize: '0.73rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                              color: diferenca === null ? 'var(--ink-5)' : diferenca < 0 ? 'var(--danger)' : 'var(--success)',
                              fontWeight: diferenca === null ? 400 : 600,
                            }}
                            title={diferenca !== null && diferenca < 0 ? 'Execução acima do proposto' : undefined}
                          >
                            {moedaComSinal(diferenca)}
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{
                                background: excluido ? 'var(--danger-soft)' : 'var(--surface-2)',
                                color: excluido ? 'var(--danger)' : 'var(--ink-4)',
                                fontWeight: excluido ? 600 : 400,
                              }}
                            >
                              {item.situacao}
                            </span>
                          </td>
                          <td className="px-2 py-1.5" style={{ fontSize: '0.71rem', color: 'var(--ink-3)', maxWidth: 180 }}>
                            {justificativaPendente(item) ? (
                              <span style={{ color: 'var(--warning)', fontWeight: 600 }} title="O executado difere do proposto e ainda não há justificativa.">
                                justificativa pendente
                              </span>
                            ) : (
                              <span className="block truncate" title={item.motivoExclusao ?? item.justificativaDiferenca}>
                                {item.motivoExclusao ?? item.justificativaDiferenca ?? ''}
                                {!item.motivoExclusao && !item.justificativaDiferenca && <span style={{ color: 'var(--ink-5)' }}>—</span>}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            {item.riscoId ? (
                              <span className="inline-flex items-center gap-1" style={{ fontSize: '0.7rem', color: 'var(--danger)' }} title="Risco orçamentário vinculado">
                                <ShieldAlert size={11} /> vinculado
                              </span>
                            ) : (
                              <span style={{ color: 'var(--ink-5)' }}>—</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <button onClick={() => setHistorico(item)} aria-label={`Histórico de ${item.descricao}`} className="p-1 rounded">
                                <History size={12} color="var(--ink-4)" />
                              </button>
                              {!readOnly && !excluido && (
                                <>
                                  <button
                                    onClick={() => setEditando(item)}
                                    className="px-1.5 py-0.5 rounded text-[11px]"
                                    style={{ color: 'var(--brand)' }}
                                  >
                                    execução
                                  </button>
                                  <button onClick={() => setExcluindo(item)} aria-label={`Excluir ${item.descricao} do plano`} className="p-1 rounded">
                                    <Trash2 size={12} color="var(--danger)" />
                                  </button>
                                </>
                              )}
                              {!readOnly && excluido && (
                                <button
                                  onClick={() => { setRevertendo(item); setMotivoReversao(''); }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]"
                                  style={{ color: 'var(--ink-3)' }}
                                >
                                  <RotateCcw size={11} /> reverter
                                </button>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ListaNotas
        notas={notas}
        itens={itens}
        aoNovaNota={() => setNotaAberta({})}
        aoAbrirNota={n => setNotaAberta({ nota: n })}
      />

      {editando && !notaAberta && (
        <FormularioExecucao
          item={itens.find(i => i.id === editando.id) ?? editando}
          notas={notasPorItem.get(editando.id) ?? []}
          aoFechar={() => setEditando(null)}
          aoNovaNota={() => setNotaAberta({ itemId: editando.id })}
          aoAbrirNota={n => setNotaAberta({ nota: n })}
        />
      )}

      {dialogoNota}

      {excluindo && (
        <DialogoExclusaoItem item={excluindo} etapas={etapas} aoFechar={() => setExcluindo(null)} />
      )}

      {historico && (
        <PainelHistoricoItem item={historico} aoFechar={() => setHistorico(null)} />
      )}

      {importando && (
        <DialogoImportacao projetoId={p.id} aoFechar={() => setImportando(false)} />
      )}

      {revertendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.5)' }} onClick={() => setRevertendo(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-card rounded-2xl border p-5 w-full max-w-md" style={{ borderColor: 'var(--border)' }} role="dialog" aria-label="Reverter exclusão">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
              Reverter exclusão
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
              “{revertendo.descricao}” volta ao plano ativo. O risco criado na exclusão permanece e
              sua situação precisa de revisão explícita — ele registra algo que aconteceu.
            </p>
            <label className="flex flex-col gap-1 mt-3">
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-3)' }}>
                Motivo da reversão <span style={{ color: 'var(--danger)' }}>*</span>
              </span>
              <textarea
                className="w-full border rounded-lg px-2.5 py-1.5"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem', resize: 'vertical' }}
                rows={3}
                value={motivoReversao}
                onChange={e => setMotivoReversao(e.target.value)}
              />
            </label>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setRevertendo(null)} className="px-3 py-1.5 rounded-md border text-[12.5px]" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}>
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const alvo = revertendo;
                  try {
                    await reverterItemOrcamento(alvo.id, motivoReversao);
                    toast.success('Item reaberto no plano.');
                    setRevertendo(null);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Não foi possível reverter.');
                  }
                }}
                disabled={!motivoReversao.trim()}
                className="px-4 py-1.5 rounded-md text-[12.5px] font-medium text-white"
                style={{ background: 'var(--primary)', opacity: motivoReversao.trim() ? 1 : 0.5 }}
              >
                Reverter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
