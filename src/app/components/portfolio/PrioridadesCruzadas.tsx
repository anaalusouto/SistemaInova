import { useQuery } from '@tanstack/react-query';
import type { ProjectExt } from '../../store';
import { listarDiagnosticosPorComunidade, listarRespostasMatriz } from '../../diagnosticos.server';
import { listarRespostasCaderno } from '../../caderno.server';
import { diagnosticoAtual } from '../../diagnostic/navegacaoDiagnostico';
import { FUNCOES_MATRIZ } from '../../diagnostic/catalog/matrizPrototipo';
import { DIMENSOES_IEO_CADERNO } from '../../diagnostic/ieoCaderno';
import { sinaisPrioridade } from '../../lib/prioridadesCruzadas';
import { formatDateOnly } from '../../lib/dateOnly';

export function PrioridadesCruzadas({ projects, demonstrativo, onOpenProject }: {
  projects: ProjectExt[]; demonstrativo: boolean; onOpenProject?: (id: number) => void;
}) {
  const orgs = [...new Map(projects.flatMap(p => p.organizacao?.id
    ? [[p.organizacao.id, { id: p.organizacao.id, nome: p.organizacao.nome, projetoId: p.id }] as const] : [])).values()]
    .sort((a, b) => a.id.localeCompare(b.id));
  const consulta = useQuery({
    queryKey: ['prioridades-cruzadas', orgs.map(o => o.id)],
    enabled: !demonstrativo && orgs.length > 0,
    queryFn: () => Promise.all(orgs.map(async org => {
      try {
        const atual = diagnosticoAtual(await listarDiagnosticosPorComunidade({ data: { comunidadeId: org.id } }), org.id);
        if (!atual) return { org, atual: null, sinais: null, erro: null, falhaIeo: false, falhaMatriz: false };
        const [caderno, matriz] = await Promise.allSettled([
          listarRespostasCaderno({ data: { diagnosticoId: atual.id, organizacaoId: org.id } }),
          listarRespostasMatriz({ data: { diagnosticoId: atual.id, organizacaoId: org.id } }),
        ]);
        return { org, atual, sinais: sinaisPrioridade(org.id, caderno.status === 'fulfilled' ? caderno.value : [], matriz.status === 'fulfilled' ? matriz.value : []), erro: null,
          falhaIeo: caderno.status === 'rejected', falhaMatriz: matriz.status === 'rejected' };
      } catch {
        return { org, atual: null, sinais: null, erro: 'Não foi possível consultar esta organização.', falhaIeo: false, falhaMatriz: false };
      }
    })),
  });
  if (demonstrativo) return <p className="text-sm text-muted-foreground">Esta análise usa aplicações reais. Selecione Dados reais.</p>;
  if (!orgs.length) return <p role="status" className="text-sm text-muted-foreground">Nenhuma organização vinculada aos projetos deste filtro.</p>;
  if (consulta.isLoading) return <p role="status" className="text-sm">Carregando resultados da matriz e do IEO…</p>;
  if (consulta.error) return <p role="alert">Não foi possível carregar a análise. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  const linhas = [...(consulta.data ?? [])].sort((a, b) => {
    const dadosA = a.sinais && (a.sinais.matrizAvaliadas > 0 || a.sinais.dimensoes.length > 0);
    const dadosB = b.sinais && (b.sinais.matrizAvaliadas > 0 || b.sinais.dimensoes.length > 0);
    return Number(Boolean(dadosB)) - Number(Boolean(dadosA)) || (b.sinais?.criticas ?? 0) - (a.sinais?.criticas ?? 0)
      || (a.sinais?.dimensoes[0]?.media ?? Infinity) - (b.sinais?.dimensoes[0]?.media ?? Infinity)
      || a.org.nome.localeCompare(b.org.nome, 'pt-BR');
  });
  const ieos = linhas.filter(l => l.sinais && !l.falhaIeo && !l.sinais.aguardando && l.sinais.ieo.geral !== null);
  const matrizes = linhas.filter(l => l.sinais && !l.falhaMatriz && l.sinais.matrizAvaliadas > 0);
  const media = (valores: number[]) => valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
  const mostrar = (valor: number | null) => valor === null ? '—' : valor.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const ieoMedio = media(ieos.map(l => l.sinais!.ieo.geral!));
  const totalCriticas = matrizes.reduce((n, l) => n + l.sinais!.criticas, 0);
  const dimensoes = DIMENSOES_IEO_CADERNO.map(d => {
    const notas = ieos.flatMap(l => { const nota = l.sinais!.ieo.porDimensao.find(item => item.dimensaoId === d.id)?.media; return nota == null ? [] : [nota]; });
    return { ...d, nota: media(notas), quantidade: notas.length };
  });
  const funcoes = FUNCOES_MATRIZ.map(f => ({ ...f, quantidade: matrizes.filter(l => l.sinais!.funcoes.some(item => item.id === f.id && item.leitura === 'Lacuna crítica')).length }))
    .filter(f => f.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, 'pt-BR'));
  return <section className="min-w-0 space-y-4" aria-labelledby="prioridades-cruzadas-titulo">
    <div><h2 id="prioridades-cruzadas-titulo" className="text-xl font-semibold">Funções × estrutura organizacional</h2>
      <p className="mt-1 text-sm text-muted-foreground">Triagem orientativa: primeiro mais lacunas críticas na matriz; em empate, menor média de dimensão do IEO. As funções e dimensões são evidências independentes, não uma nota combinada. Prioridades devem ser validadas com a organização.</p>
      <p className="mt-1 text-xs text-muted-foreground">Inclui organizações vinculadas aos projetos deste filtro e a aplicação mais recente em edição ou, se não houver, a última concluída. Notas parciais e informações ausentes são identificadas.</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicadores do mapeamento">
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Organizações no recorte</p><strong className="text-2xl">{linhas.length}</strong></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">IEO médio</p><strong className="text-2xl">{mostrar(ieoMedio)}</strong><p className="text-xs text-muted-foreground">{ieos.length} com nota calculável</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Lacunas críticas</p><strong className="text-2xl">{matrizes.length ? totalCriticas : '—'}</strong><p className="text-xs text-muted-foreground">{matrizes.length} matrizes com leitura calculável</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Aplicações encontradas</p><strong className="text-2xl">{linhas.filter(l => l.atual).length}</strong><p className="text-xs text-muted-foreground">concluídas ou em andamento</p></div>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="min-w-0 rounded-xl border bg-card p-4"><h3 className="font-semibold">IEO por dimensão</h3><p className="mt-1 text-xs text-muted-foreground">Média das notas disponíveis por organização; avaliações parciais estão incluídas.</p><ul className="mt-4 space-y-3">{dimensoes.map(d => <li key={d.id}><div className="flex justify-between gap-2 text-sm"><span>{d.titulo}</span><strong>{mostrar(d.nota)} / 4</strong></div><div className="mt-1 h-2 rounded bg-muted" aria-hidden="true">{d.nota !== null && <div className="h-full rounded bg-primary" style={{width:`${d.nota / 4 * 100}%`}}/>}</div><p className="text-xs text-muted-foreground">{d.quantidade} organização(ões) com nota</p></li>)}</ul></section>
      <section className="min-w-0 rounded-xl border bg-card p-4"><h3 className="font-semibold">Funções com lacunas críticas</h3><p className="mt-1 text-xs text-muted-foreground">Quantidade de organizações com leitura crítica em cada função. A leitura segue a regra atual da matriz.</p>{funcoes.length ? <ol className="mt-4 space-y-3">{funcoes.map(f => <li key={f.id}><div className="flex justify-between gap-2 text-sm"><span>{f.id} · {f.nome}</span><strong>{f.quantidade}</strong></div><div className="mt-1 h-2 rounded bg-muted" aria-hidden="true"><div className="h-full rounded bg-destructive" style={{width:`${f.quantidade / matrizes.length * 100}%`}}/></div></li>)}</ol> : <p className="mt-4 text-sm text-muted-foreground">{matrizes.length ? 'Nenhuma lacuna crítica identificada nas respostas calculáveis.' : 'Sem respostas suficientes para calcular lacunas.'}</p>}</section>
    </div>
    <section className="min-w-0 rounded-xl border bg-card p-4"><h3 className="font-semibold">Mapa das organizações</h3><p className="mt-1 text-xs text-muted-foreground">Notas por dimensão do IEO e total de lacunas críticas aparecem lado a lado, sem associar funções a dimensões.</p><table className="mt-3 w-full table-fixed border-collapse text-left text-xs"><thead><tr className="border-b"><th scope="col" className="w-1/4 break-words p-1">Organização</th>{DIMENSOES_IEO_CADERNO.map(d => <th scope="col" key={d.id} className="break-words p-1" title={d.titulo}>D{d.id}</th>)}<th scope="col" className="break-words p-1">Lacunas críticas</th></tr></thead><tbody>{linhas.map(l => <tr key={l.org.id} className="border-b last:border-0"><th scope="row" className="break-words p-1 font-medium">{l.org.nome}</th>{DIMENSOES_IEO_CADERNO.map(d => { const resultado = l.sinais?.ieo.porDimensao.find(x => x.dimensaoId === d.id); const nota = l.falhaIeo || l.sinais?.aguardando ? null : resultado?.media ?? null; return <td key={d.id} className="p-1" title={`${d.titulo}: ${mostrar(nota)} · ${resultado?.pontuadas ?? 0}/${resultado?.total ?? 5} perguntas pontuadas`} style={nota === null ? undefined : { backgroundColor: `rgba(43, 106, 78, ${0.08 + (nota - 1) / 3 * 0.28})` }}>{mostrar(nota)}</td>; })}<td className="p-1">{l.falhaMatriz || !l.sinais?.matrizAvaliadas ? '—' : l.sinais.criticas}</td></tr>)}</tbody></table><p className="mt-2 text-xs text-muted-foreground">{DIMENSOES_IEO_CADERNO.map(d => `D${d.id}: ${d.titulo}`).join(' · ')}. Tons mais fortes indicam notas maiores; o traço indica dado indisponível ou sem nota calculável. Notas podem ser parciais.</p></section>
    <details className="min-w-0 rounded-xl border bg-card"><summary className="cursor-pointer p-4 font-semibold">Ver detalhes por organização</summary>
      <table className="w-full table-fixed text-left text-xs" aria-label="Sinais de atenção por organização">
        <thead><tr className="border-b bg-muted/40"><th scope="col" className="w-1/4 break-words p-2">Organização / aplicação</th><th scope="col" className="break-words p-2">IEO · dimensões com menor média</th><th scope="col" className="break-words p-2">Matriz · lacunas identificadas</th></tr></thead>
        <tbody>{linhas.map(({org, atual, sinais, erro, falhaIeo, falhaMatriz}) => <tr key={org.id} className="border-b align-top last:border-0">
          <th scope="row" className="break-words p-2 font-medium">{onOpenProject ? <button type="button" className="text-left text-primary underline" onClick={() => onOpenProject(org.projetoId)}>{org.nome}</button> : org.nome}
            <span className="mt-1 block font-normal text-muted-foreground">{erro ?? (!atual ? 'Sem aplicação encontrada' : `${atual.status === 'em_edicao' ? 'Em andamento' : 'Concluída'} · v${atual.versao} · ${formatDateOnly(atual.dataAplicacao)}`)}</span></th>
          <td className="break-words p-2">{falhaIeo ? 'Falha ao consultar IEO' : !sinais ? 'Não disponível' : sinais.aguardando ? 'IEO aguardando reavaliação' : sinais.dimensoes.length ? <><ul className="space-y-1">{sinais.dimensoes.map(d => <li key={d.dimensaoId}>{d.dimensaoTitulo}: <strong>{d.media!.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/4</strong> <span className="text-muted-foreground">({d.pontuadas}/{d.total} pontuadas)</span></li>)}</ul><p className="mt-2 text-muted-foreground">{sinais.ieo.respondidas}/{sinais.ieo.total} respondidas · {sinais.ieo.pontuadas} pontuadas{(sinais.ieo.ausentes || sinais.ieo.semNota || sinais.ieo.invalidas) ? ' · parcial' : ''}</p></> : 'Sem nota calculável'}</td>
          <td className="break-words p-2">{falhaMatriz ? 'Falha ao consultar matriz' : !sinais ? 'Não disponível' : sinais.matrizAvaliadas === 0 ? 'Sem avaliação calculável' : <><p>{sinais.criticas} crítica(s) · {sinais.funcoes.length - sinais.criticas} relevante(s)</p>{sinais.funcoes.length > 0 && <ul className="mt-1 space-y-1">{sinais.funcoes.map(f => <li key={f.id}><strong>{f.leitura}</strong> · {f.id} {f.nome}</li>)}</ul>}<p className="mt-2 text-muted-foreground">{sinais.matrizAvaliadas}/{FUNCOES_MATRIZ.length} funções com leitura calculável{sinais.matrizAvaliadas < FUNCOES_MATRIZ.length ? ' · incompleta' : ''}</p></>}</td>
        </tr>)}</tbody>
      </table>
    </details>
    {linhas.some(l => l.erro || l.falhaIeo || l.falhaMatriz) && <button type="button" className="text-sm underline" onClick={() => void consulta.refetch()}>Tentar novamente as consultas</button>}
  </section>;
}
