import { useState, type ReactNode } from 'react';
import { FUNCOES_MATRIZ, leituraMatriz } from '../../diagnostic/catalog/matrizPrototipo';
import type { RascunhoMatriz } from '../../diagnostic/importarMatriz';
import '../responsive-tables.css';
import { useLargurasTabela } from '../plano/useLargurasTabela';

interface Linha { id: string; valores: RascunhoMatriz; estado: string }
interface Props { cabecalho?: ReactNode; linhas: Linha[]; onSelecionar: (id: string) => void; desabilitado: boolean; renderEdicao?: (linha: Linha) => ReactNode; renderAvaliacao?: (id: string) => ReactNode; filtroBloqueado?: boolean }
const COLUNAS = ['Função', 'Avaliação', 'Atuação', 'Externo', 'Experiência', 'Interesse', 'Criticidade', 'Leitura', 'Observação'];
const INTERESSE = ['Sem interesse', 'Baixo', 'Médio', 'Alto'];
const CRITICIDADE = ['Baixo impacto', 'Limitações pontuais', 'Compromete resultados', 'Compromete atuação ou continuidade'];
const CORES = ['#64748b', '#528363', '#b27b24', '#c46b35', '#b44747'];
const grupos = [...new Set(FUNCOES_MATRIZ.map(f => f.grupo))];
const CATEGORIAS_LEITURA = ['Lacuna crítica', 'Lacuna relevante', 'Melhoria pontual', 'Acompanhar', 'Completar avaliação'];

export function PainelMatriz({ cabecalho, linhas, onSelecionar, desabilitado, renderEdicao, renderAvaliacao, filtroBloqueado }: Props) {
  const [grupo, setGrupo] = useState('Todos');
  const [campos, setCampos] = useState<'atuacao' | 'avaliacao' | 'detalhes'>('atuacao');
  const [leituraSelecionada, setLeituraSelecionada] = useState<string | null>(null);
  const camposPorGrupo = {
    atuacao: ['Função', 'Avaliação', 'Atuação', 'Externo', 'Experiência'],
    avaliacao: ['Função', 'Interesse', 'Criticidade', 'Leitura', 'Avaliação'],
    detalhes: ['Função', 'Avaliação', 'Observação'],
  };
  const colunas = [...COLUNAS.filter(c => camposPorGrupo[campos].includes(c)), ...(renderEdicao ? ['Ações'] : [])];
  const { tabelaRef, larguras, larguraTotal, controles, restaurar } = useLargurasTabela(colunas);
  const indice = new Map(linhas.map(l => [l.id, l]));
  const visiveis = FUNCOES_MATRIZ.filter(f => grupo === 'Todos' || f.grupo === grupo);
  const distribuicao = CATEGORIAS_LEITURA.map(leitura => ({
    leitura,
    funcoes: FUNCOES_MATRIZ.filter(f => leituraMatriz(indice.get(f.id)?.valores.criticidade ?? null, indice.get(f.id)?.valores.experiencia ?? null) === leitura),
  }));
  const maiorContagem = Math.max(1, ...distribuicao.map(item => item.funcoes.length));
  const funcoesLeituraSelecionada = distribuicao.find(item => item.leitura === leituraSelecionada)?.funcoes ?? [];
  return <div className="painel-matriz space-y-5">
    <section className="space-y-4" aria-label="Quantidade de funções por categoria de Leitura">
      <div><h4 className="font-semibold text-lg">Funções por categoria de Leitura</h4><p className="text-sm text-muted-foreground">Quantidade de funções em cada categoria. Selecione uma coluna para consultar todas as funções correspondentes.</p></div>
      <div className="overflow-x-auto rounded-xl border bg-card p-3 sm:p-5" tabIndex={0} role="region" aria-label="Gráfico de colunas da quantidade de funções por Leitura">
        <div className="min-w-[680px]">
          <div className="flex items-end gap-4 border-b" style={{ height: 230 }}>
            <div className="flex h-full w-10 shrink-0 flex-col justify-between pb-1 text-right text-[10px] text-muted-foreground" aria-hidden="true">{[4,3,2,1,0].map(i=><span key={i}>{Math.round(maiorContagem*i/4)}</span>)}</div>
            {distribuicao.map(({ leitura, funcoes }) => <button key={leitura} type="button" aria-pressed={leituraSelecionada === leitura} aria-label={`${leitura}: ${funcoes.length} funções. Consultar lista.`} onClick={() => setLeituraSelecionada(atual => atual === leitura ? null : leitura)} className={`flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2 rounded-t-lg px-2 pt-2 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${leituraSelecionada === leitura ? 'bg-primary/10' : 'hover:bg-muted/60'}`}>
              <span className="text-xs font-semibold">{funcoes.length}</span><span className="flex h-36 w-full items-end justify-center border-b border-l border-border bg-muted/20"><span className="w-1/2 rounded-t bg-primary transition-[height]" style={{height:`${funcoes.length/maiorContagem*100}%`}}/></span><span className="min-h-10 text-[11px] font-medium leading-tight">{leitura}</span>
            </button>)}
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">Leitura (categorias) · eixo vertical: quantidade de funções</p>
        </div>
      </div>
      {leituraSelecionada && <div className="rounded-xl border bg-card p-4" role="region" aria-label={`Funções classificadas como ${leituraSelecionada}`}>
        <div className="flex flex-wrap items-center justify-between gap-2"><h5 className="font-semibold">{leituraSelecionada} · {funcoesLeituraSelecionada.length} função(ões)</h5><button type="button" className="text-xs underline" onClick={() => setLeituraSelecionada(null)}>Fechar lista</button></div>
        {funcoesLeituraSelecionada.length ? <ul className="mt-3 grid gap-2 sm:grid-cols-2">{funcoesLeituraSelecionada.map(f => <li key={f.id}><button type="button" disabled={desabilitado} onClick={() => onSelecionar(f.id)} className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:border-primary disabled:opacity-60"><strong className="mr-2 text-primary">{f.id}</strong>{f.nome}</button></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">Nenhuma função classificada nesta categoria.</p>}
      </div>}
    </section>
    {cabecalho}
    <div className="flex flex-wrap gap-2" aria-label="Filtrar funções por grupo">
      {['Todos', ...grupos].map(g => <button key={g} type="button" disabled={filtroBloqueado} aria-pressed={grupo === g} onClick={() => setGrupo(g)} className="diagnostico-filtro" data-active={grupo === g}>{g}</button>)}
    </div>
    <section aria-label="Funções por grupo" className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs" role="group" aria-label="Colunas da tabela"><span>Colunas da tabela</span>{([['atuacao','Atuação'],['avaliacao','Avaliação'],['detalhes','Detalhes']] as const).map(([id, rotulo]) => <button type="button" key={id} aria-pressed={campos === id} onClick={() => { setCampos(id); restaurar(); }} className="rounded border bg-card px-2 py-1.5">{rotulo}</button>)}</div>
      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{grupo === 'Todos' ? 'Todas as funções' : grupo}</h4><button type="button" className="text-xs underline" onClick={restaurar}>Restaurar larguras das colunas</button></div>
      <div className="inova-table-frame diagnostico-tabela-scroll matriz-tabela-scroll" role="region" aria-label="Tabela da Matriz Funcional">
        <table ref={tabelaRef} data-campos={campos} style={{ width: larguraTotal ?? '100%', minWidth: 0 }} className="diagnostico-tabela matriz-grade"><caption className="sr-only">Funções por grupo — respostas desta organização e aplicação</caption>
          <colgroup>{colunas.map(c => <col key={c} style={{ width: larguras?.[c] ?? `${100 / colunas.length}%` }}/>)}</colgroup>
          <thead><tr>{colunas.map(t => <th scope="col" key={t}>{t}<div {...controles(t)} className="plano-resize-handle"/></th>)}</tr></thead>
          {grupos.filter(g => grupo === 'Todos' || grupo === g).map(g => <tbody key={g}>
            <tr className="diagnostico-grupo"><th colSpan={colunas.length} scope="rowgroup">{g}</th></tr>
            {visiveis.filter(f => f.grupo === g).map(f => {
              const linha = indice.get(f.id)!;
              const v = linha.valores;
              if (renderEdicao) return <tr key={f.id} data-inova-form="matriz-tabela" data-inova-field={f.id}>{renderEdicao(linha)}</tr>;
              const leitura = leituraMatriz(v.criticidade, v.experiencia);
              const cor = leitura === 'Lacuna crítica' ? '#b44747' : leitura === 'Lacuna relevante' ? '#c46b35' : leitura === 'Acompanhar' ? '#528363' : '#b27b24';
              return <tr key={f.id}>
                <th scope="row" data-label="Função"><button type="button" disabled={desabilitado} onClick={() => onSelecionar(f.id)} className="diagnostico-funcao"><span>{f.id}</span>{f.nome}</button><small className="block mt-2 text-muted-foreground font-normal">{linha.estado}</small></th>
                <td data-label="Avaliação">{renderAvaliacao?.(f.id) ?? 'Não avaliado'}</td>
                <td data-label="Atuação"><span className="diagnostico-atuacao">{v.atuacao || 'Não informado'}</span></td>
                <td data-label="Externo" className="whitespace-pre-wrap">{v.externo || '—'}</td>
                <td data-label="Experiência">{v.experiencia || 'Não informado'}</td>
                <td data-label="Interesse">{v.interesse ? INTERESSE[Number(v.interesse) - 1] : 'Não informado'}</td>
                <td data-label="Criticidade"><span className="diagnostico-nivel" style={{ color: CORES[Number(v.criticidade)] || CORES[0] }}>{v.criticidade ? `${v.criticidade} · ${CRITICIDADE[Number(v.criticidade) - 1]}` : 'Não informado'}</span></td>
                <td data-label="Leitura"><span className="diagnostico-leitura" style={{ color: cor, background: `${cor}12` }}>{leitura}</span></td>
                <td data-label="Observação" className="whitespace-pre-wrap">{v.observacoes || <span className="text-muted-foreground">Sem observação registrada.</span>}</td>
              </tr>;
            })}
          </tbody>)}
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{renderEdicao ? 'Edite as células e salve ou cancele cada linha. Tab percorre os campos; Enter salva a linha; Escape cancela. Em textos, Enter insere uma nova linha.' : 'Clique no nome de uma função para consultar ou editar suas respostas em pop-up.'}</p>
    </section>

  </div>;
}
