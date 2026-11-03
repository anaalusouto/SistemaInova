import { useState } from 'react';
import { QUESTIONARIO_CADERNO, COMPLEMENTARES_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
import { calcularIeoCaderno, DIMENSOES_IEO_CADERNO } from '../../diagnostic/ieoCaderno';
const fmtScore = (v: number | null) => v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export function QuestionarioCaderno(props: ContextoCaderno) {
  const [dimensaoId, setDimensaoId] = useState('todas');
  const [publico, setPublico] = useState('Todos');
  const [dimensoesAbertas, setDimensoesAbertas] = useState<Set<string>>(() => new Set(['1']));
  const consulta = useCaderno(props);
  const resultado = calcularIeoCaderno(consulta.data ?? []);
  const respostas = new Map((consulta.data ?? []).filter(r => r.contexto === '').map(r => [r.codigo, r.resposta]));
  const selecionar = (id: string) => {
    setDimensaoId(id);
    setPublico('Todos');
    if (id !== 'todas') setDimensoesAbertas(atuais => new Set(atuais).add(id));
  };
  const alterarAbertura = (id: string, aberta: boolean) => setDimensoesAbertas(atuais => {
    const proxima = new Set(atuais);
    if (aberta) proxima.add(id); else proxima.delete(id);
    return proxima;
  });
  const grupos = [...new Set(QUESTIONARIO_CADERNO.map(q => q.grupo))];
  if (consulta.isLoading) return <p role="status">Carregando IEO…</p>;
  if (consulta.error) return <p role="alert">Não foi possível carregar o IEO. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  return <div className="space-y-6 min-w-0"><p className="text-sm text-muted-foreground">Índice de Estruturação Organizacional — IEO · 25 perguntas. N/A exige justificativa de não pertinência.</p>
    <p className="text-xs text-muted-foreground" role="status">Cobertura: {resultado.respondidas}/{resultado.total} respostas válidas · {resultado.pontuadas} com nota · {resultado.semNota} sem nota · {resultado.divergencias} divergências · {resultado.naoAplicaveis} não aplicáveis · {resultado.ausentes} ausentes{resultado.invalidas > 0 ? ` · ${resultado.invalidas} valores inválidos a conferir` : ''}.</p>
    <div className="flex flex-wrap gap-2" aria-label="Dimensões do IEO"><button type="button" className="diagnostico-filtro" data-active={dimensaoId === 'todas'} aria-pressed={dimensaoId === 'todas'} onClick={() => selecionar('todas')}>Todas as dimensões</button>{DIMENSOES_IEO_CADERNO.map(d => <button type="button" key={d.id} className="diagnostico-filtro" data-active={dimensaoId === d.id} aria-pressed={dimensaoId === d.id} onClick={() => selecionar(d.id)}>{d.id}. {d.titulo}</button>)}</div>
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h4 className="font-semibold">Pontuações do IEO</h4><p className="text-sm text-muted-foreground">Resultados por dimensão · selecione para aprofundar</p></div><div className="text-right"><p className="text-3xl font-bold">{fmtScore(resultado.geral)}<span className="text-sm font-normal text-muted-foreground"> / 4</span></p><p className="text-xs text-muted-foreground">IEO geral · {resultado.respondidas}/{resultado.total} perguntas respondidas</p></div></div>
        <p className="text-xs text-muted-foreground">Síntese do sistema: média das notas 1–4 por dimensão; IEO geral é a média das dimensões com nota. NS, NC, N/A, divergência e perguntas vazias ficam fora da pontuação. Dimensões organizam a análise; públicos e descritores seguem os critérios do instrumento. Prioridades são pactuadas e não derivam automaticamente das notas.</p>
        <section className="space-y-4 min-w-0" aria-label="Perguntas por dimensão">
          <h4 className="font-semibold text-lg">{dimensaoId === 'todas' ? 'Perguntas por dimensão' : `Dimensão ${dimensaoId} · ${DIMENSOES_IEO_CADERNO.find(d => d.id === dimensaoId)?.titulo}`}</h4>
          <div className="flex flex-wrap gap-2" aria-label="Filtrar questionário por público">{['Todos', ...grupos].map(g => <button key={g} type="button" className="diagnostico-filtro" data-active={publico === g} aria-pressed={publico === g} onClick={() => setPublico(g)}>{g}</button>)}</div>
          {DIMENSOES_IEO_CADERNO.map(d => {
            const resumo = resultado.porDimensao.find(r => r.dimensaoId === d.id)!;
            const perguntasVisiveis = d.perguntas.filter(q => publico === 'Todos' || q.grupo === publico);
            const visivel = (dimensaoId === 'todas' || d.id === dimensaoId) && perguntasVisiveis.length > 0;
            const aberta = dimensoesAbertas.has(d.id);
            return <details key={d.id} open={aberta} onToggle={e => alterarAbertura(d.id, e.currentTarget.open)} hidden={!visivel} className={`min-w-0 scroll-mt-4 overflow-hidden rounded-xl border bg-card ${aberta ? 'border-primary ring-1 ring-primary/20' : ''}`}>
              <summary className="cursor-pointer list-none p-4 sm:p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <span className="flex flex-wrap items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{d.id}</span><span className="min-w-0"><strong className="block text-sm sm:text-base">Dimensão {d.id} · {d.titulo}</strong><span className="mt-1 block text-xs text-muted-foreground">{d.perguntas.length} perguntas · {resumo.respondidas}/{resumo.total} respondidas · {resumo.pontuadas} com nota</span></span></span>
                  <span className="flex shrink-0 items-center gap-3 text-right"><span><strong className="block text-xl">{fmtScore(resumo.media)}<span className="text-xs font-normal text-muted-foreground"> / 4</span></strong><span className="diagnostico-termometro mt-2 block w-24" role="img" aria-label={resumo.media == null ? 'Sem pontuação' : `Pontuação ${fmtScore(resumo.media)} de 4`}>{resumo.media != null && <span style={{ left: `${((resumo.media - 1) / 3) * 100}%` }}/>}</span></span><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full border font-semibold">{aberta ? '−' : '+'}</span></span>
                </span>
              </summary>
              <div className="space-y-3 border-t p-3 sm:p-5">
                {perguntasVisiveis.map(q => <div key={q.codigo} className="min-w-0"><p className="mb-1 text-xs text-muted-foreground"><span className="font-semibold">Público responsável:</span> {q.grupo}</p><CadernoItens {...props} itens={[q]}/></div>)}
                {publico !== 'Todos' && <p className="text-xs text-muted-foreground">Exibindo {perguntasVisiveis.length} de {d.perguntas.length} perguntas desta dimensão para o público selecionado.</p>}
              </div>
            </details>;
          })}
          {!DIMENSOES_IEO_CADERNO.some(d => (dimensaoId === 'todas' || dimensaoId === d.id) && d.perguntas.some(q => publico === 'Todos' || q.grupo === publico)) && <p className="text-sm text-muted-foreground">Não há perguntas deste público na dimensão selecionada.</p>}
        </section>
      </div>
      <aside className="min-w-0 rounded-xl border bg-muted/30 p-5 space-y-5"><div><p className="diagnostico-sobretitulo">Visão geral</p><h4 className="font-semibold">Resumo geral de análise</h4><p className="text-sm text-muted-foreground mt-3">{resultado.respondidas} de {resultado.total} perguntas respondidas · {resultado.pontuadas} com nota.</p></div><h5 className="font-semibold text-sm">Relatos por dimensão</h5>{DIMENSOES_IEO_CADERNO.map(d => {
        const relatos = d.perguntas.filter(q => respostas.get(q.codigo)?.relato.trim());
        return <section key={d.id} className="border-t pt-4"><h5 className="text-sm font-semibold">{d.titulo}</h5>{relatos.length ? relatos.map(q => <p key={q.codigo} className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-2"><strong>{q.codigo}</strong> · {respostas.get(q.codigo)?.relato}</p>) : <p className="text-xs text-muted-foreground mt-2">Sem observações registradas.</p>}</section>;
      })}</aside>
    </div>
    <section className="space-y-3"><h4 className="font-semibold text-lg">Informações complementares e fechamento estratégico</h4><p className="text-sm text-muted-foreground">Não repetir relatos: indicar o código onde a resposta pode ser encontrada. Ouvir gestão e membros. Prioridades são pactuadas e não derivam automaticamente de notas.</p><CadernoItens {...props} itens={COMPLEMENTARES_CADERNO}/></section>
  </div>;
}
