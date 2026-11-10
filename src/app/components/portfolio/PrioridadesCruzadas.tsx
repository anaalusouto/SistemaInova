import { useQuery } from '@tanstack/react-query';
import type { ProjectExt } from '../../store';
import { listarDiagnosticosPorComunidade, listarRespostasMatriz } from '../../diagnosticos.server';
import { listarRespostasCaderno } from '../../caderno.server';
import { diagnosticoAtual } from '../../diagnostic/navegacaoDiagnostico';
import { FUNCOES_MATRIZ } from '../../diagnostic/catalog/matrizPrototipo';
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
  return <section className="min-w-0 space-y-4" aria-labelledby="prioridades-cruzadas-titulo">
    <div><h2 id="prioridades-cruzadas-titulo" className="text-lg font-semibold">Matriz × IEO: pontos de atenção</h2>
      <p className="mt-1 text-sm text-muted-foreground">Triagem orientativa: primeiro mais lacunas críticas na matriz; em empate, menor média de dimensão do IEO. As funções e dimensões são evidências independentes, não uma nota combinada. Prioridades devem ser validadas com a organização.</p>
      <p className="mt-1 text-xs text-muted-foreground">Inclui organizações vinculadas aos projetos deste filtro e a aplicação mais recente em edição ou, se não houver, a última concluída. Notas parciais e informações ausentes são identificadas.</p></div>
    <div className="min-w-0 rounded-xl border bg-card">
      <table className="w-full table-fixed text-left text-xs" aria-label="Sinais de atenção por organização">
        <thead><tr className="border-b bg-muted/40"><th scope="col" className="w-1/4 break-words p-2">Organização / aplicação</th><th scope="col" className="break-words p-2">IEO · dimensões com menor média</th><th scope="col" className="break-words p-2">Matriz · lacunas identificadas</th></tr></thead>
        <tbody>{linhas.map(({org, atual, sinais, erro, falhaIeo, falhaMatriz}) => <tr key={org.id} className="border-b align-top last:border-0">
          <th scope="row" className="break-words p-2 font-medium">{onOpenProject ? <button type="button" className="text-left text-primary underline" onClick={() => onOpenProject(org.projetoId)}>{org.nome}</button> : org.nome}
            <span className="mt-1 block font-normal text-muted-foreground">{erro ?? (!atual ? 'Sem aplicação encontrada' : `${atual.status === 'em_edicao' ? 'Em andamento' : 'Concluída'} · v${atual.versao} · ${formatDateOnly(atual.dataAplicacao)}`)}</span></th>
          <td className="break-words p-2">{falhaIeo ? 'Falha ao consultar IEO' : !sinais ? 'Não disponível' : sinais.aguardando ? 'IEO aguardando reavaliação' : sinais.dimensoes.length ? <><ul className="space-y-1">{sinais.dimensoes.map(d => <li key={d.dimensaoId}>{d.dimensaoTitulo}: <strong>{d.media!.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}/4</strong> <span className="text-muted-foreground">({d.pontuadas}/{d.total} pontuadas)</span></li>)}</ul><p className="mt-2 text-muted-foreground">{sinais.ieo.respondidas}/{sinais.ieo.total} respondidas · {sinais.ieo.pontuadas} pontuadas{(sinais.ieo.ausentes || sinais.ieo.semNota || sinais.ieo.invalidas) ? ' · parcial' : ''}</p></> : 'Sem nota calculável'}</td>
          <td className="break-words p-2">{falhaMatriz ? 'Falha ao consultar matriz' : !sinais ? 'Não disponível' : sinais.matrizAvaliadas === 0 ? 'Sem avaliação calculável' : <><p>{sinais.criticas} crítica(s) · {sinais.funcoes.length - sinais.criticas} relevante(s)</p>{sinais.funcoes.length > 0 && <ul className="mt-1 space-y-1">{sinais.funcoes.map(f => <li key={f.id}><strong>{f.leitura}</strong> · {f.id} {f.nome}</li>)}</ul>}<p className="mt-2 text-muted-foreground">{sinais.matrizAvaliadas}/{FUNCOES_MATRIZ.length} funções com leitura calculável{sinais.matrizAvaliadas < FUNCOES_MATRIZ.length ? ' · incompleta' : ''}</p></>}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {linhas.some(l => l.erro || l.falhaIeo || l.falhaMatriz) && <button type="button" className="text-sm underline" onClick={() => void consulta.refetch()}>Tentar novamente as consultas</button>}
  </section>;
}
