import { useState } from 'react';
import { QUESTIONARIO_CADERNO, COMPLEMENTARES_CADERNO, REVISAO_CADERNO } from '../../diagnostic/catalog/cadernoCria';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
import { calcularIeoCaderno, DIMENSOES_IEO_CADERNO } from '../../diagnostic/ieoCaderno';
import { IeoTab } from './IeoTab';
const fmtScore = (v: number | null) => v == null ? '—' : v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export function QuestionarioCaderno(props: ContextoCaderno) {
  const [dimensaoId, setDimensaoId] = useState('todas');
  const [publico, setPublico] = useState('Todos');
  const consulta = useCaderno(props);
  const resultado = calcularIeoCaderno(consulta.data ?? []);
  const respostas = new Map((consulta.data ?? []).filter(r => r.contexto === '').map(r => [r.codigo, r.resposta]));
  const selecionar = (id: string) => { setDimensaoId(id); setPublico('Todos'); };
  const grupos = [...new Set(QUESTIONARIO_CADERNO.map(q => q.grupo))];
  if (consulta.isLoading) return <p role="status">Carregando IEO…</p>;
  if (consulta.error) return <p role="alert">Não foi possível carregar o IEO. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  return <div className="space-y-6 min-w-0"><div><h3 className="text-2xl sm:text-3xl font-bold">Índice de Estruturação Organizacional — IEO</h3><p className="mt-2 text-sm text-muted-foreground">Questionário · Caderno CRIA · revisão {REVISAO_CADERNO} · 25 perguntas. N/A exige justificativa de não pertinência.</p></div>
    <div className="flex flex-wrap gap-2" aria-label="Dimensões do IEO"><button type="button" className="diagnostico-filtro" data-active={dimensaoId === 'todas'} aria-pressed={dimensaoId === 'todas'} onClick={() => selecionar('todas')}>Todas as dimensões</button>{DIMENSOES_IEO_CADERNO.map(d => <button type="button" key={d.id} className="diagnostico-filtro" data-active={dimensaoId === d.id} aria-pressed={dimensaoId === d.id} onClick={() => selecionar(d.id)}>{d.titulo}</button>)}</div>
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h4 className="font-semibold">Pontuações do IEO</h4><p className="text-sm text-muted-foreground">Resultados por dimensão · selecione para aprofundar</p></div><div className="text-right"><p className="text-3xl font-bold">{fmtScore(resultado.geral)}<span className="text-sm font-normal text-muted-foreground"> / 4</span></p><p className="text-xs text-muted-foreground">IEO geral · {resultado.respondidas}/{resultado.total} perguntas respondidas</p></div></div>
        <div className="grid gap-3 md:grid-cols-2">{resultado.porDimensao.map(d => <button type="button" key={d.dimensaoId} aria-pressed={dimensaoId === d.dimensaoId} onClick={() => selecionar(d.dimensaoId)} className={`rounded-xl border bg-card p-5 text-left hover:border-primary transition-colors ${dimensaoId === d.dimensaoId ? 'border-primary' : ''}`}>
          <h4 className="font-semibold text-sm min-h-12">{d.dimensaoTitulo}</h4><p className="text-2xl font-bold mt-4">{fmtScore(d.media)}<span className="text-xs font-normal text-muted-foreground"> / 4</span></p>
          <div className="diagnostico-termometro" role="img" aria-label={d.media == null ? 'Sem pontuação' : `Pontuação ${fmtScore(d.media)} de 4`}>{d.media != null && <span style={{ left: `${((d.media - 1) / 3) * 100}%` }}/>}</div>
          <p className="text-xs text-muted-foreground mt-3">{d.respondidas}/{d.total} perguntas respondidas · {d.pontuadas} com nota</p>
        </button>)}</div>
        <p className="text-xs text-muted-foreground">Síntese do sistema: média das notas 1–4 por dimensão; IEO geral é a média das dimensões com nota. NS, NC, N/A, divergência e perguntas vazias ficam fora da pontuação. Dimensões organizam a análise; públicos e descritores seguem o caderno. Prioridades são pactuadas e não derivam automaticamente das notas.</p>
      </div>
      <aside className="min-w-0 rounded-xl border bg-muted/30 p-5 space-y-5"><div><p className="diagnostico-sobretitulo">Visão geral</p><h4 className="font-semibold">Resumo geral de análise</h4><p className="text-sm text-muted-foreground mt-3">{resultado.respondidas} de {resultado.total} perguntas respondidas · {resultado.pontuadas} com nota.</p></div><h5 className="font-semibold text-sm">Relatos por dimensão</h5>{DIMENSOES_IEO_CADERNO.map(d => {
        const relatos = d.perguntas.filter(q => respostas.get(q.codigo)?.relato.trim());
        return <section key={d.id} className="border-t pt-4"><h5 className="text-sm font-semibold">{d.titulo}</h5>{relatos.length ? relatos.map(q => <p key={q.codigo} className="text-xs text-muted-foreground whitespace-pre-wrap break-words mt-2"><strong>{q.codigo}</strong> · {respostas.get(q.codigo)?.relato}</p>) : <p className="text-xs text-muted-foreground mt-2">Sem observações registradas.</p>}</section>;
      })}</aside>
    </div>
    <h4 className="font-semibold text-lg">{dimensaoId === 'todas' ? 'Perguntas por dimensão' : DIMENSOES_IEO_CADERNO.find(d => d.id === dimensaoId)?.titulo}</h4>
    <div className="flex flex-wrap gap-2" aria-label="Filtrar questionário por público">{['Todos', ...grupos].map(g => <button key={g} type="button" className="diagnostico-filtro" data-active={publico === g} aria-pressed={publico === g} onClick={() => setPublico(g)}>{g}</button>)}</div>
    {DIMENSOES_IEO_CADERNO.map(d => <section key={d.id} hidden={(dimensaoId !== 'todas' && dimensaoId !== d.id) || !d.perguntas.some(q => publico === 'Todos' || q.grupo === publico)} className="space-y-3 min-w-0"><h5 className="font-semibold">{d.titulo}</h5>{d.perguntas.map(q => <div key={q.codigo} hidden={publico !== 'Todos' && q.grupo !== publico}><p className="text-xs text-muted-foreground mb-1">{q.grupo}</p><CadernoItens {...props} itens={[q]}/></div>)}</section>)}
    {!DIMENSOES_IEO_CADERNO.some(d => (dimensaoId === 'todas' || dimensaoId === d.id) && d.perguntas.some(q => publico === 'Todos' || q.grupo === publico)) && <p className="text-sm text-muted-foreground">Não há perguntas deste público na dimensão selecionada.</p>}
    <section className="space-y-3"><h4 className="font-semibold text-lg">Informações complementares e fechamento estratégico</h4><p className="text-sm text-muted-foreground">Não repetir relatos: indicar o código onde a resposta pode ser encontrada. Ouvir gestão e membros. Prioridades são pactuadas e não derivam automaticamente de notas.</p><CadernoItens {...props} itens={COMPLEMENTARES_CADERNO}/></section>
    <details className="rounded-xl border p-4"><summary className="text-sm font-medium cursor-pointer">Histórico de respostas do instrumento anterior</summary><p className="text-xs text-muted-foreground my-3">Respostas preservadas para consulta, sem conversão para os códigos do caderno atual.</p><IeoTab diagnosticoId={props.diagnosticoId} readOnly/></details>
  </div>;
}
