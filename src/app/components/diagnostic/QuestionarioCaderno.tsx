import { useState } from 'react';
import { QUESTIONARIO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { useCaderno, type ContextoCaderno } from './CadernoItens';
import { calcularIeoCaderno, DIMENSOES_IEO_CADERNO } from '../../diagnostic/ieoCaderno';
import { CORES_ESCALA } from '../../theme/coresInstitucionais';

const fmtScore = (v: number | null) => v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtPercentual = (avaliadas: number, aplicaveis: number) => aplicaveis ? Math.round(avaliadas / aplicaveis * 100) : 0;
const gradienteEscala = 'linear-gradient(90deg, #b44747, #c46b35, #c5a542, #528363)';

function Termometro({ valor, rotulo }: { valor: number | null; rotulo: string }) {
  const posicao = valor == null ? 0 : Math.max(0, Math.min(100, (valor - 1) / 3 * 100));
  return <div>
    <div className="diagnostico-termometro" role="img" aria-label={valor == null ? `${rotulo}: sem pontuação` : `${rotulo}: ${fmtScore(valor)} de 4`} style={{ background: gradienteEscala }}>
      {valor != null && <span style={{ left: `${posicao}%` }} />}
    </div>
    <div className="mt-1 flex justify-between px-0.5 text-[10px] text-muted-foreground" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span></div>
  </div>;
}

export function QuestionarioCaderno(props: ContextoCaderno) {
  const [dimensaoId, setDimensaoId] = useState<string | null>(null);
  const [publico, setPublico] = useState('Todos');
  const consulta = useCaderno(props);
  const registros = consulta.data ?? [];
  const resultado = calcularIeoCaderno(registros);
  const respostas = new Map(registros.filter(r => r.contexto === '').map(r => [r.codigo, r.resposta]));
  const grupos = [...new Set(QUESTIONARIO_CADERNO.map(q => q.grupo))];
  const dimensoesExibidas = dimensaoId
    ? DIMENSOES_IEO_CADERNO.filter(d => d.id === dimensaoId)
    : DIMENSOES_IEO_CADERNO;
  const perguntasGrafico = dimensoesExibidas.flatMap(d => d.perguntas)
    .filter(q => publico === 'Todos' || q.grupo === publico);

  const selecionarDimensao = (id: string | null) => {
    setDimensaoId(id);
  };
  const valorResposta = (codigo: string) => respostas.get(codigo)?.valor ?? null;
  const avaliadasGerais = resultado.pontuadas;
  const aplicaveisGerais = Math.max(0, resultado.total - resultado.naoAplicaveis);
  const resumoSelecionado = dimensaoId ? resultado.porDimensao.find(d => d.dimensaoId === dimensaoId) : null;
  const mediaFoco = resumoSelecionado?.media ?? (dimensaoId ? null : resultado.geral);
  const avaliadasFoco = resumoSelecionado?.pontuadas ?? avaliadasGerais;
  const aplicaveisFoco = resumoSelecionado
    ? Math.max(0, resumoSelecionado.total - resumoSelecionado.naoAplicaveis)
    : aplicaveisGerais;

  if (consulta.isLoading) return <p role="status">Carregando IEO…</p>;
  if (consulta.error) return <p role="alert">Não foi possível carregar o IEO. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;

  const completo = avaliadasGerais === aplicaveisGerais && resultado.invalidas === 0;

  return <div className="min-w-0">
    <main className="min-w-0 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3" aria-label="Filtros do IEO">
      <div className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Filtrar dimensão do IEO">
        <span className="mr-1 text-xs font-semibold text-muted-foreground">Dimensão:</span>
        <button type="button" className="diagnostico-filtro" data-active={dimensaoId === null} aria-pressed={dimensaoId === null} onClick={() => selecionarDimensao(null)}>Todas</button>
        {DIMENSOES_IEO_CADERNO.map(d => <button type="button" key={d.id} className="diagnostico-filtro" data-active={dimensaoId === d.id} aria-pressed={dimensaoId === d.id} onClick={() => selecionarDimensao(d.id)}>{d.id}. {d.titulo}</button>)}
      </div>
      <label className="block min-w-44 text-xs font-semibold text-muted-foreground">Filtrar público
        <select className="mt-1 block w-full rounded-lg border bg-card px-3 py-2 text-sm text-foreground" value={publico} onChange={e => setPublico(e.target.value)}>
          {['Todos', ...grupos].map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </label>
    </div>

    <section className="space-y-4" aria-label="Pontuações do IEO">
      <div className="rounded-xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h3 className="text-xl font-bold">Pontuações do IEO</h3><p className="mt-1 text-sm text-muted-foreground">Resultados por dimensão · selecione para aprofundar</p></div>
          <div className="min-w-56 text-right">
            <p className="text-3xl font-bold">{fmtScore(resultado.geral)}<span className="text-sm font-normal text-muted-foreground"> / 4</span></p>
            <p className="text-xs text-muted-foreground">IEO geral · {completo ? 'Completo' : 'Parcial'}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(160px,1fr)_auto] sm:items-center">
          <div className="min-w-0"><Termometro valor={resultado.geral} rotulo="IEO geral"/><p className="mt-2 text-xs text-muted-foreground">Média simples dos níveis válidos</p></div>
          <p className="text-xs text-muted-foreground sm:text-right"><strong className="text-foreground">{avaliadasGerais}/{aplicaveisGerais}</strong> indicadores aplicáveis avaliados · {fmtPercentual(avaliadasGerais, aplicaveisGerais)}% de cobertura</p>
        </div>
      </div>

      <div className="min-w-0 rounded-xl border bg-card p-4 sm:p-6" aria-label="Régua das cinco dimensões do IEO">
        <h3 className="text-xl font-bold">Régua das dimensões</h3>
        <p className="mt-1 text-sm text-muted-foreground">A régua mostra a média de cada dimensão na mesma escala do IEO geral. Selecione uma dimensão para aprofundar.</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>1 · Inicial</span><span>2 · Em construção</span><span>3 · Estruturado</span><span>4 · Consolidado</span><span>Sem nota não é zero</span></div>
        <div className="mt-4 divide-y">{resultado.porDimensao.map(d => {
        const aplicaveis = Math.max(0, d.total - d.naoAplicaveis);
        const selecionada = dimensaoId === d.dimensaoId;
        return <button type="button" key={d.dimensaoId} aria-pressed={selecionada} aria-label={`${d.dimensaoTitulo}: ${fmtScore(d.media)} de 4, ${d.pontuadas} de ${aplicaveis} avaliados. Selecionar dimensão.`} onClick={() => selecionarDimensao(d.dimensaoId)} className={`grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:grid-cols-[minmax(160px,1fr)_minmax(0,1.6fr)_64px] ${selecionada ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
          <span className="min-w-0"><strong className="block text-sm">{d.dimensaoId}. {d.dimensaoTitulo}</strong><span className="text-xs text-muted-foreground">{d.pontuadas}/{aplicaveis} indicadores avaliados</span></span>
          <span className="col-start-2 text-right text-xl font-bold sm:col-start-3">{fmtScore(d.media)}<span className="text-xs font-normal text-muted-foreground"> / 4</span></span>
          <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1"><Termometro valor={d.media} rotulo={`Dimensão ${d.dimensaoId}`} /></div>
        </button>;
      })}</div></div>
    </section>

      <section className="min-w-0 space-y-4 rounded-xl border bg-card p-3 sm:p-5" aria-label="Detalhamento visual do IEO">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><p className="diagnostico-sobretitulo">{dimensaoId ? `Dimensão ${dimensaoId}` : 'Análise geral'}</p><h3 className="text-lg font-semibold">{dimensaoId ? DIMENSOES_IEO_CADERNO.find(d => d.id === dimensaoId)?.titulo : 'Respostas das cinco dimensões'}</h3><p className="text-sm text-muted-foreground">{fmtScore(mediaFoco)} / 4 · {avaliadasFoco}/{aplicaveisFoco} indicadores aplicáveis avaliados · {fmtPercentual(avaliadasFoco, aplicaveisFoco)}% de cobertura</p></div>
          {dimensaoId && <button type="button" className="diagnostico-filtro shrink-0" onClick={() => selecionarDimensao(null)}>Voltar à análise geral</button>}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legenda do gráfico"><span className="flex items-center gap-2"><i className="size-3 rounded-sm bg-primary"/>Resposta de 1 a 4</span><span className="flex items-center gap-2"><i className="h-4 border-l-2 border-amber-700"/>Média da dimensão</span><span>N/A aparece sem barra numérica</span></div>
        <div className="overflow-hidden rounded-lg border bg-card" role="table" aria-label="Gráfico horizontal das perguntas do IEO">
          <div className="grid grid-cols-1 items-end gap-x-4 border-b bg-muted/30 px-3 py-2 text-[11px] font-semibold text-muted-foreground sm:grid-cols-[minmax(0,1.15fr)_minmax(120px,0.85fr)_54px] sm:px-4" role="row">
            <span role="columnheader">Indicador</span><span role="columnheader"><span className="flex justify-between"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span></span></span><span role="columnheader" className="sm:text-right">Nota</span>
          </div>
          {perguntasGrafico.map(q => {
            const valor = valorResposta(q.codigo);
            const pontuacao = valor && /^[1-4]$/.test(valor) ? Number(valor) : null;
            const d = DIMENSOES_IEO_CADERNO.find(dim => dim.codigos.includes(q.codigo))!;
            const mediaDimensao = resultado.porDimensao.find(x => x.dimensaoId === d.id)?.media ?? null;
            const cor = pontuacao == null ? null : CORES_ESCALA[pontuacao as keyof typeof CORES_ESCALA].base;
            const estado = valor ? q.opcoes?.find(o => o.valor === valor)?.descricao ?? valor : 'Sem resposta';
            return <div key={q.codigo} className="grid min-w-0 grid-cols-1 items-stretch gap-x-4 gap-y-2 border-b px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1.15fr)_minmax(120px,0.85fr)_54px] sm:px-4" role="row">
              <div className="min-w-0" role="cell"><p className="text-xs font-semibold text-primary">{q.codigo} <span className="font-normal text-muted-foreground">· dimensão {d.id}</span></p><p className="mt-1 break-words text-sm">{q.texto}</p></div>
              <div className="relative flex min-w-0 items-center" role="cell"><div className="relative h-5 w-full overflow-visible rounded bg-muted" role="img" aria-label={`${q.codigo}: ${pontuacao == null ? estado : `${pontuacao} de 4`}; média da dimensão ${fmtScore(mediaDimensao)}`}>
                {pontuacao != null && <span className="absolute inset-y-0 left-0 rounded" style={{ width: `${pontuacao / 4 * 100}%`, backgroundColor: cor ?? undefined }} />}
                <span className="absolute inset-0 flex justify-between" aria-hidden="true">{[0, 1, 2, 3, 4].map(n => <i key={n} className="h-full border-l border-background/80" />)}</span>
              </div>{mediaDimensao != null && <span aria-hidden="true" className="pointer-events-none absolute -top-2 -bottom-2 z-10 border-l-2 border-amber-700" style={{ left: `${mediaDimensao / 4 * 100}%` }} />}</div>
              <span role="cell" className={`justify-self-start rounded-md px-2 py-1 text-xs font-semibold sm:justify-self-end ${pontuacao == null ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>{pontuacao ?? (valor === 'NA' ? 'N/A' : valor || '—')}</span>
              <details className="min-w-0 sm:col-span-3"><summary className="cursor-pointer text-xs font-medium text-primary">Ver resposta e relato</summary><div className="mt-2 space-y-1 border-t pt-2 text-sm"><p><strong>Resposta:</strong> {estado}</p><p className="whitespace-pre-wrap"><strong>Relato:</strong> {respostas.get(q.codigo)?.relato?.trim() || 'Não registrado para esta pergunta.'}</p></div></details>
            </div>;
          })}
          {!perguntasGrafico.length && <p className="p-6 text-center text-sm text-muted-foreground">Não há perguntas para este público nesta dimensão.</p>}
        </div>
      </section>
    </main>

  </div>;
}
