import { useState, type ReactNode } from 'react';
import { FUNCOES_MATRIZ, leituraMatriz } from '../../diagnostic/catalog/matrizPrototipo';
import { FUNCOES_GUIA_CRIA } from '../../diagnostic/catalog/cadernoCriaDados';
import type { RascunhoMatriz } from '../../diagnostic/importarMatriz';
import '../responsive-tables.css';
import { useLargurasTabela } from '../plano/useLargurasTabela';

interface Linha { id: string; valores: RascunhoMatriz; estado: string; descricao?: string; exemplo?: string }
interface Props { linhas: Linha[]; onSelecionar: (id: string) => void; desabilitado: boolean; renderEdicao?: (linha: Linha) => ReactNode; renderAvaliacao?: (id: string) => ReactNode; filtroBloqueado?: boolean }
const COLUNAS = ['Função', 'Atuação', 'Externo', 'Experiência', 'Interesse', 'Criticidade', 'Leitura', 'Avaliação', 'Exemplo de preenchimento', 'Observação'];
const LARGURAS = [280, 210, 220, 190, 170, 250, 180, 320, 300, 320, 220];
const INTERESSE = ['Sem interesse', 'Baixo', 'Médio', 'Alto'];
const CRITICIDADE = ['Baixo impacto', 'Limitações pontuais', 'Compromete resultados', 'Compromete atuação ou continuidade'];
const CORES = ['#64748b', '#528363', '#b27b24', '#c46b35', '#b44747'];
const grupos = [...new Set(FUNCOES_MATRIZ.map(f => f.grupo))];

export function PainelMatriz({ linhas, onSelecionar, desabilitado, renderEdicao, renderAvaliacao, filtroBloqueado }: Props) {
  const [grupo, setGrupo] = useState('Todos');
  const colunas = renderEdicao ? [...COLUNAS, 'Ações'] : COLUNAS;
  const { tabelaRef, larguras, larguraTotal, controles, restaurar } = useLargurasTabela(colunas);
  const largura = larguraTotal ?? colunas.reduce((s, _, i) => s + LARGURAS[i], 0);
  const indice = new Map(linhas.map(l => [l.id, l]));
  const visiveis = FUNCOES_MATRIZ.filter(f => grupo === 'Todos' || f.grupo === grupo);
  const semPosicao = visiveis.filter(f => {
    const v = indice.get(f.id)?.valores;
    return !v?.criticidade || !v.interesse;
  });
  return <div className="painel-matriz space-y-5">
    <div className="flex flex-wrap gap-2" aria-label="Filtrar funções por grupo">
      {['Todos', ...grupos].map(g => <button key={g} type="button" disabled={filtroBloqueado} aria-pressed={grupo === g} onClick={() => setGrupo(g)} className="diagnostico-filtro" data-active={grupo === g}>{g}</button>)}
    </div>
    <section aria-label="Funções por grupo" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{grupo === 'Todos' ? 'Todas as funções' : grupo}</h4><button type="button" className="text-xs underline" onClick={restaurar}>Restaurar larguras das colunas</button></div>
      <div className="inova-table-frame diagnostico-tabela-scroll matriz-tabela-scroll" tabIndex={0} role="region" aria-label="Tabela da Matriz Funcional, role para ver todas as colunas">
        <table ref={tabelaRef} style={{ width: largura, minWidth: largura }} className="diagnostico-tabela inova-table-cards"><caption className="sr-only">Funções por grupo — respostas desta organização e aplicação</caption>
          <colgroup>{colunas.map((c, i) => <col key={c} style={{ width: larguras?.[c] ?? LARGURAS[i] }}/>)}</colgroup>
          <thead><tr>{colunas.map(t => <th scope="col" key={t}>{t}<div {...controles(t)} className="plano-resize-handle"/></th>)}</tr></thead>
          {grupos.filter(g => grupo === 'Todos' || grupo === g).map(g => <tbody key={g}>
            <tr className="diagnostico-grupo"><th colSpan={colunas.length} scope="rowgroup">{g}</th></tr>
            {visiveis.filter(f => f.grupo === g).map(f => {
              const linha = indice.get(f.id)!;
              const v = linha.valores;
              const guia = FUNCOES_GUIA_CRIA.find(item => item.codigo === f.id);
              if (renderEdicao) return <tr key={f.id} data-inova-form="matriz-tabela" data-inova-field={f.id}>{renderEdicao({ ...linha, descricao: guia?.descricao, exemplo: guia?.exemplo })}</tr>;
              const leitura = leituraMatriz(v.criticidade, v.experiencia);
              const cor = leitura === 'Lacuna crítica' ? '#b44747' : leitura === 'Lacuna relevante' ? '#c46b35' : leitura === 'Acompanhar' ? '#528363' : '#b27b24';
              return <tr key={f.id}>
                <th scope="row" data-label="Função"><button type="button" disabled={desabilitado} onClick={() => onSelecionar(f.id)} className="diagnostico-funcao"><span>{f.id}</span>{f.nome}</button><small className="block mt-2 text-muted-foreground font-normal">{linha.estado}</small>{guia?.descricao && <details className="mt-2 max-w-64 text-left text-xs font-normal text-muted-foreground"><summary className="cursor-pointer">Como preencher</summary><p className="mt-2">{guia.descricao}</p></details>}</th>
                <td data-label="Atuação"><span className="diagnostico-atuacao">{v.atuacao || 'Não informado'}</span></td>
                <td data-label="Externo" className="whitespace-pre-wrap">{v.externo || '—'}</td>
                <td data-label="Experiência">{v.experiencia || 'Não informado'}</td>
                <td data-label="Interesse">{v.interesse ? INTERESSE[Number(v.interesse) - 1] : 'Não informado'}</td>
                <td data-label="Criticidade"><span className="diagnostico-nivel" style={{ color: CORES[Number(v.criticidade)] || CORES[0] }}>{v.criticidade ? `${v.criticidade} · ${CRITICIDADE[Number(v.criticidade) - 1]}` : 'Não informado'}</span></td>
                <td data-label="Leitura"><span className="diagnostico-leitura" style={{ color: cor, background: `${cor}12` }}>{leitura}</span></td>
                <td data-label="Avaliação">{renderAvaliacao?.(f.id) ?? 'Não avaliado'}</td>
                <td data-label="Exemplo de preenchimento" className="whitespace-pre-wrap">{guia?.exemplo || <span className="text-muted-foreground">Sem exemplo disponível.</span>}</td>
                <td data-label="Observação" className="whitespace-pre-wrap">{v.observacoes || <span className="text-muted-foreground">Sem observação registrada.</span>}</td>
              </tr>;
            })}
          </tbody>)}
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{renderEdicao ? 'Edite as células e salve ou cancele cada linha. Tab percorre os campos; Enter salva a linha; Escape cancela. Em textos, Enter insere uma nova linha.' : 'Clique no nome de uma função para consultar ou editar suas respostas em pop-up.'}</p>
    </section>
    <section className="space-y-3" aria-label="Matriz de criticidade e interesse">
      <h4 className="font-semibold text-lg">Matriz de criticidade e interesse</h4>
      <p className="text-sm text-muted-foreground">As posições e contagens acompanham as respostas e o filtro de grupo. Clique em um código para consultar a função.</p>
      <div className="diagnostico-tabela-scroll" tabIndex={0} role="region" aria-label="Quadro de criticidade e interesse">
        <table className="diagnostico-grade"><caption className="sr-only">Criticidade atual × interesse em desenvolvimento</caption>
          <thead><tr><th scope="col">Criticidade ↓<br/>Interesse →</th>{INTERESSE.map((n, i) => <th scope="col" key={n}>{i + 1}<small>{n}</small></th>)}</tr></thead>
          <tbody>{[4, 3, 2, 1].map(c => <tr key={c}><th scope="row">{c}<small>{CRITICIDADE[c - 1]}</small></th>{[1, 2, 3, 4].map(i => {
            const funcoes = visiveis.filter(f => { const v = indice.get(f.id)?.valores; return v?.criticidade === String(c) && v.interesse === String(i); });
            return <td key={i} style={{ background: `${CORES[c]}${i > 2 ? '16' : '09'}` }} aria-label={`Criticidade ${c}, interesse ${i}: ${funcoes.length} funções`}>
              <strong className="diagnostico-contagem">{funcoes.length}</strong><div className="flex flex-wrap gap-1.5">{funcoes.map(f => <button type="button" key={f.id} disabled={desabilitado} onClick={() => onSelecionar(f.id)} title={f.nome} aria-label={`${f.id} · ${f.nome}`} className="diagnostico-codigo">{f.id}</button>)}</div>
            </td>;
          })}</tr>)}</tbody>
        </table>
      </div>
      {semPosicao.length > 0 && <p className="text-xs text-muted-foreground">Sem posição no quadro (criticidade ou interesse não informado): {semPosicao.map(f => f.id).join(', ')}.</p>}
    </section>
  </div>;
}
