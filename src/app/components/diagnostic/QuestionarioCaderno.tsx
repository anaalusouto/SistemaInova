import { useState } from 'react';
import { QUESTIONARIO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
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
  const [dimensaoId, setDimensaoId] = useState<string | null>('1');
  const [publico, setPublico] = useState('Todos');
  const [dimensoesAbertas, setDimensoesAbertas] = useState<Set<string>>(() => new Set(['1']));
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
    if (id) setDimensoesAbertas(atuais => new Set(atuais).add(id));
  };
  const alterarAbertura = (id: string, aberta: boolean) => setDimensoesAbertas(atuais => {
    const proxima = new Set(atuais);
    if (aberta) proxima.add(id); else proxima.delete(id);
    return proxima;
  });
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

  const perguntasFoco = perguntasGrafico.map(q => ({
    codigo: q.codigo,
    texto: q.texto,
    resposta: valorResposta(q.codigo),
    relato: respostas.get(q.codigo)?.relato?.trim() ?? '',
  }));

  return <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
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

      <div className="grid min-w-0 gap-3 md:grid-cols-2">{resultado.porDimensao.map(d => {
        const aplicaveis = Math.max(0, d.total - d.naoAplicaveis);
        const selecionada = dimensaoId === d.dimensaoId;
        return <button type="button" key={d.dimensaoId} aria-pressed={selecionada} aria-label={`Selecionar dimensão ${d.dimensaoId}: ${d.dimensaoTitulo}`} onClick={() => selecionarDimensao(d.dimensaoId)} className={`min-w-0 rounded-xl border p-4 text-left transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selecionada ? 'border-primary bg-primary/10 ring-2 ring-primary/25' : 'border-border bg-card'}`}>
          <span className="flex items-start justify-between gap-3"><strong className="min-w-0 text-sm">{d.dimensaoId}. {d.dimensaoTitulo}</strong><span className="shrink-0 text-xl font-bold">{fmtScore(d.media)}<span className="text-xs font-normal text-muted-foreground"> / 4</span></span></span>
          <p className="mt-1 text-[11px] text-muted-foreground">Média simples dos níveis válidos</p>
          <div className="mt-2"><Termometro valor={d.media} rotulo={`Dimensão ${d.dimensaoId}`} /></div>
          <p className="mt-2 text-xs text-muted-foreground">{d.pontuadas}/{aplicaveis} indicadores avaliados · {fmtPercentual(d.pontuadas, aplicaveis)}% de cobertura</p>
        </button>;
      })}</div>
    </section>

      <section className="min-w-0 space-y-4 rounded-xl border bg-card p-3 sm:p-5" aria-label="Detalhamento visual do IEO">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0"><p className="diagnostico-sobretitulo">{dimensaoId ? `Dimensão ${dimensaoId}` : 'Análise geral'}</p><h3 className="text-lg font-semibold">{dimensaoId ? DIMENSOES_IEO_CADERNO.find(d => d.id === dimensaoId)?.titulo : 'Respostas das cinco dimensões'}</h3><p className="text-sm text-muted-foreground">{fmtScore(mediaFoco)} / 4 · {avaliadasFoco}/{aplicaveisFoco} indicadores aplicáveis avaliados · {fmtPercentual(avaliadasFoco, aplicaveisFoco)}% de cobertura</p></div>
          {dimensaoId && <button type="button" className="diagnostico-filtro shrink-0" onClick={() => selecionarDimensao(null)}>Voltar à análise geral</button>}
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legenda do gráfico"><span className="flex items-center gap-2"><i className="size-3 rounded-sm bg-primary"/>Resposta de 1 a 4</span><span className="flex items-center gap-2"><i className="h-4 border-l-2 border-dashed border-amber-700"/>Média da dimensão</span><span>N/A aparece sem barra numérica</span></div>
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
            return <div key={q.codigo} className="grid min-w-0 grid-cols-1 items-center gap-x-4 gap-y-2 border-b px-3 py-2 last:border-b-0 sm:grid-cols-[minmax(0,1.15fr)_minmax(120px,0.85fr)_54px] sm:px-4" role="row">
              <div className="min-w-0" role="cell"><p className="text-xs font-semibold text-primary">{q.codigo} <span className="font-normal text-muted-foreground">· dimensão {d.id}</span></p><p className="mt-1 break-words text-sm">{q.texto}</p></div>
              <div className="min-w-0" role="cell"><div className="relative h-5 overflow-visible rounded bg-muted" role="img" aria-label={`${q.codigo}: ${pontuacao == null ? estado : `${pontuacao} de 4`}; média da dimensão ${fmtScore(mediaDimensao)}`}>
                {pontuacao != null && <span className="absolute inset-y-0 left-0 rounded" style={{ width: `${pontuacao / 4 * 100}%`, backgroundColor: cor ?? undefined }} />}
                {mediaDimensao != null && <span className="absolute -top-1 bottom-[-4px] z-10 border-l-2 border-dashed border-amber-700" style={{ left: `${mediaDimensao / 4 * 100}%` }} />}
                <span className="absolute inset-0 flex justify-between" aria-hidden="true">{[0, 1, 2, 3, 4].map(n => <i key={n} className="h-full border-l border-background/80" />)}</span>
              </div></div>
              <span role="cell" className={`justify-self-start rounded-md px-2 py-1 text-xs font-semibold sm:justify-self-end ${pontuacao == null ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>{pontuacao ?? (valor === 'NA' ? 'N/A' : valor || '—')}</span>
            </div>;
          })}
          {!perguntasGrafico.length && <p className="p-6 text-center text-sm text-muted-foreground">Não há perguntas para este público nesta dimensão.</p>}
        </div>
      </section>
    </main>

      <div className="min-w-0 self-stretch">
      <aside className="min-w-0 rounded-xl border bg-card p-4 sm:p-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto" aria-label="Painel de síntese do IEO">
        <p className="diagnostico-sobretitulo">{dimensaoId ? 'DIMENSÃO SELECIONADA' : 'VISÃO GERAL DO IEO'}</p><h3 className="text-lg font-semibold">{dimensaoId ? DIMENSOES_IEO_CADERNO.find(d => d.id === dimensaoId)?.titulo : 'Análise geral'}</h3>
        <p className="mt-3 text-3xl font-bold">{fmtScore(dimensaoId ? resumoSelecionado?.media ?? null : resultado.geral)}<span className="text-sm font-normal text-muted-foreground"> / 4</span></p>
        <p className="text-xs text-muted-foreground">Média simples dos níveis válidos</p>
        <p className="mt-3 text-xs text-muted-foreground">{avaliadasFoco} indicadores avaliados · {aplicaveisFoco} aplicáveis · {fmtPercentual(avaliadasFoco, aplicaveisFoco)}% de cobertura · {resumoSelecionado?.naoAplicaveis ?? resultado.naoAplicaveis} N/A</p>
        <section className="mt-5 space-y-2" aria-label="Resumo da dimensão">
          <h4 className="font-semibold">Resumo da dimensão</h4>
          {perguntasFoco.length ? <ul className="space-y-2">{perguntasFoco.map(item => <li key={item.codigo} className="rounded-lg border bg-muted/20 p-3"><details><summary className="cursor-pointer text-sm"><strong className="mr-1 text-primary">{item.codigo}</strong>{item.texto}</summary><div className="mt-2 border-t pt-2 text-sm"><p><strong>Resposta:</strong> {item.resposta || 'Sem resposta'}</p><p className="mt-1 whitespace-pre-wrap"><strong>Relato:</strong> {item.relato || 'Não registrado para esta pergunta.'}</p></div></details></li>)}</ul> : <p className="text-sm text-muted-foreground">Não há perguntas vinculadas a esta seleção.</p>}
        </section>
        {dimensaoId && <button type="button" className="diagnostico-filtro mt-5 w-full" onClick={() => selecionarDimensao(null)}>Voltar à análise geral</button>}
      </aside>
      </div>

    <section className="col-span-1 space-y-3 xl:col-span-2" aria-label="Perguntas e respostas do IEO"><div><h3 className="text-lg font-semibold">Perguntas e relatos</h3></div>
      {DIMENSOES_IEO_CADERNO.map(d => {
        const resumo = resultado.porDimensao.find(r => r.dimensaoId === d.id)!;
        const aplicaveis = Math.max(0, resumo.total - resumo.naoAplicaveis);
        const aberta = dimensoesAbertas.has(d.id);
        const perguntas = d.perguntas.filter(q => publico === 'Todos' || q.grupo === publico);
        return <details key={d.id} open={aberta} onToggle={e => { const aberto = e.currentTarget.open; alterarAbertura(d.id, aberto); if (aberto && dimensaoId !== d.id) selecionarDimensao(d.id); }} className={`scroll-mt-4 overflow-hidden rounded-xl border bg-card ${dimensaoId === d.id ? 'border-primary ring-1 ring-primary/20' : ''}`}>
          <summary className="cursor-pointer list-none p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:p-4"><span className="flex flex-wrap items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{d.id}</span><span className="min-w-0"><strong className="block break-words text-sm">Dimensão {d.id} · {d.titulo}</strong><span className="mt-1 block text-xs text-muted-foreground">{resumo.respondidas}/{resumo.total} respondidas · média {fmtScore(resumo.media)} · {resumo.pontuadas}/{aplicaveis} aplicáveis avaliados</span></span></span><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border font-semibold">{aberta ? '−' : '+'}</span></span></summary>
          <div className="space-y-2 border-t p-2 sm:p-3">{perguntas.map(q => <div key={q.codigo} className="min-w-0"><CadernoItens {...props} itens={[q]} compact/><p className="px-3 pt-1 text-[10px] text-muted-foreground">Público responsável: {q.grupo}</p></div>)}{!perguntas.length && <p className="p-3 text-sm text-muted-foreground">Nenhuma pergunta desta dimensão corresponde ao público selecionado.</p>}</div>
        </details>;
      })}
    </section>

  </div>;
}
