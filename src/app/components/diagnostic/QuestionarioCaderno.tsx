import { useState } from 'react';
import { QUESTIONARIO_CADERNO, COMPLEMENTARES_CADERNO } from '../../diagnostic/catalog/cadernoCria';
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

  const niveis = [
    { chave: '1', rotulo: 'Nível 1' }, { chave: '2', rotulo: 'Nível 2' },
    { chave: '3', rotulo: 'Nível 3' }, { chave: '4', rotulo: 'Nível 4' },
    { chave: 'NA', rotulo: 'N/A' }, { chave: 'NS', rotulo: 'NS' },
    { chave: 'NC', rotulo: 'NC' }, { chave: 'D', rotulo: 'Divergência' },
    { chave: 'vazia', rotulo: 'Sem resposta' }, { chave: 'outro', rotulo: 'A conferir' },
  ];
  const perguntasDoPainel = dimensaoId
    ? DIMENSOES_IEO_CADERNO.find(d => d.id === dimensaoId)?.perguntas ?? []
    : DIMENSOES_IEO_CADERNO.flatMap(d => d.perguntas);
  const distribuicao = niveis.map(n => ({
    ...n,
    quantidade: perguntasDoPainel.filter(q => {
      const v = valorResposta(q.codigo);
      if (n.chave === 'vazia') return !v;
      if (n.chave === 'outro') return typeof v === 'string' && v.length > 0 && !/^(?:[1-4]|NA|NS|NC|D)$/.test(v);
      return v === n.chave;
    }).length,
  }));
  const relatos = perguntasDoPainel.flatMap(q => {
    const relato = respostas.get(q.codigo)?.relato?.trim();
    const d = DIMENSOES_IEO_CADERNO.find(dim => dim.codigos.includes(q.codigo));
    return relato ? [{ codigo: q.codigo, dimensaoId: d?.id, dimensao: d?.titulo, relato }] : [];
  });
  const completo = avaliadasGerais === aplicaveisGerais && resultado.invalidas === 0;

  return <div className="space-y-5 min-w-0">
    <p className="text-sm text-muted-foreground">Índice de Estruturação Organizacional — IEO · 25 perguntas. N/A exige justificativa de não pertinência.</p>

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
      <p className="text-xs text-muted-foreground" role="status">Cobertura: {resultado.respondidas}/{resultado.total} respostas válidas · {resultado.pontuadas} com nota · {resultado.semNota} sem nota · {resultado.divergencias} divergências · {resultado.naoAplicaveis} não aplicáveis · {resultado.ausentes} ausentes{resultado.invalidas > 0 ? ` · ${resultado.invalidas} valores inválidos a conferir` : ''}.</p>
    </section>

    <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
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

      <aside className="min-w-0 rounded-xl border bg-card p-4 sm:p-5" aria-label="Painel de síntese do IEO">
        <p className="diagnostico-sobretitulo">DIMENSÃO SELECIONADA</p><h3 className="text-lg font-semibold">{dimensaoId ? DIMENSOES_IEO_CADERNO.find(d => d.id === dimensaoId)?.titulo : 'Análise geral'}</h3>
        <p className="mt-3 text-3xl font-bold">{fmtScore(dimensaoId ? resumoSelecionado?.media ?? null : resultado.geral)}<span className="text-sm font-normal text-muted-foreground"> / 4</span></p>
        <p className="text-xs text-muted-foreground">Média simples dos níveis válidos</p>
        <p className="mt-3 text-xs text-muted-foreground">{avaliadasFoco}/{aplicaveisFoco} indicadores avaliados · {fmtPercentual(avaliadasFoco, aplicaveisFoco)}% de cobertura · {resumoSelecionado?.naoAplicaveis ?? resultado.naoAplicaveis} N/A</p>
        <div className="mt-5 space-y-2"><h4 className="text-sm font-semibold">Resumo da dimensão</h4>{distribuicao.map(n => <div key={n.chave} className="grid grid-cols-[minmax(0,1fr)_minmax(40px,1fr)_22px] items-center gap-2 text-xs"><span>{n.rotulo}</span><span className="h-2 overflow-hidden rounded bg-muted"><i className="block h-full rounded bg-primary" style={{ width: `${perguntasDoPainel.length ? n.quantidade / perguntasDoPainel.length * 100 : 0}%` }} /></span><strong className="text-right">{n.quantidade}</strong></div>)}</div>
        <div className="mt-5 space-y-2"><h4 className="text-sm font-semibold">Relatos associados</h4>{relatos.length ? <ul className="max-h-64 space-y-3 overflow-y-auto">{relatos.map(r => <li key={r.codigo} className="break-words border-t pt-2 text-xs"><strong>{r.codigo}</strong>{!dimensaoId && <span> · dimensão {r.dimensaoId}</span>}<p className="mt-1 whitespace-pre-wrap text-muted-foreground">{r.relato}</p></li>)}</ul> : <p className="text-xs text-muted-foreground">Sem relatos registrados para {dimensaoId ? 'esta dimensão' : 'as perguntas do IEO'}.</p>}</div>
        {dimensaoId && <button type="button" className="diagnostico-filtro mt-5 w-full" onClick={() => selecionarDimensao(null)}>Voltar à análise geral</button>}
        <p className="mt-5 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">O IEO é apresentado como média simples dos níveis válidos de 1 a 4. A normalização por pergunta é usada somente no cálculo final de priorização do Resumo.</p>
      </aside>
    </div>

    <section className="space-y-3" aria-label="Perguntas e respostas do IEO"><div><p className="diagnostico-sobretitulo">Perguntas e relatos</p><h3 className="text-lg font-semibold">Detalhes por dimensão</h3><p className="text-xs text-muted-foreground">Abra uma dimensão e, em seguida, uma pergunta. Os códigos oficiais Q01–Q25 permanecem associados aos enunciados.</p></div>
      {DIMENSOES_IEO_CADERNO.map(d => {
        const resumo = resultado.porDimensao.find(r => r.dimensaoId === d.id)!;
        const aplicaveis = Math.max(0, resumo.total - resumo.naoAplicaveis);
        const aberta = dimensoesAbertas.has(d.id);
        const perguntas = d.perguntas.filter(q => publico === 'Todos' || q.grupo === publico);
        return <details key={d.id} open={aberta} onToggle={e => alterarAbertura(d.id, e.currentTarget.open)} className={`scroll-mt-4 overflow-hidden rounded-xl border bg-card ${dimensaoId === d.id ? 'border-primary ring-1 ring-primary/20' : ''}`}>
          <summary className="cursor-pointer list-none p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary sm:p-4"><span className="flex flex-wrap items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{d.id}</span><span className="min-w-0"><strong className="block break-words text-sm">Dimensão {d.id} · {d.titulo}</strong><span className="mt-1 block text-xs text-muted-foreground">{resumo.respondidas}/{resumo.total} respondidas · média {fmtScore(resumo.media)} · {resumo.pontuadas}/{aplicaveis} aplicáveis avaliados</span></span></span><span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full border font-semibold">{aberta ? '−' : '+'}</span></span></summary>
          <div className="space-y-2 border-t p-2 sm:p-3">{perguntas.map(q => <div key={q.codigo} className="min-w-0"><CadernoItens {...props} itens={[q]} compact/><p className="px-3 pt-1 text-[10px] text-muted-foreground">Público responsável: {q.grupo}</p></div>)}{!perguntas.length && <p className="p-3 text-sm text-muted-foreground">Nenhuma pergunta desta dimensão corresponde ao público selecionado.</p>}</div>
        </details>;
      })}
    </section>

    <section className="space-y-3"><h3 className="text-lg font-semibold">Informações complementares e fechamento estratégico</h3><p className="text-sm text-muted-foreground">Não repetir relatos: indicar o código onde a resposta pode ser encontrada. Ouvir gestão e membros. Prioridades são pactuadas e não derivam automaticamente de notas.</p><CadernoItens {...props} itens={COMPLEMENTARES_CADERNO}/></section>
  </div>;
}
