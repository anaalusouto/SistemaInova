import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProjectExt } from '../../store';
import { listarNotasMapeamentos } from '../../diagnosticos.server';
import { pontosMapeamento, type NotaMapeamentoGrafico } from '../../lib/cruzamentoMapeamento';
import { formatDateOnly } from '../../lib/dateOnly';
import { conclusaoEtapas } from '../../lib/resumoPlanoPortfolio';
import { notasMapeamentoDemo } from '../../data/portfolioDemo';

const formatar = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const moeda = (n: number | null) => n == null ? 'Não informado' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const percentual = (n: number | null) => n == null ? 'Não informado' : `${formatar(n)}%`;

export function GraficosMapeamento({ projects, demonstrativo = false, organizacaoAtiva, onSelecionarOrganizacao }: { projects: ProjectExt[]; demonstrativo?: boolean; organizacaoAtiva: string | null; onSelecionarOrganizacao: (id: string) => void }) {
  const organizacaoIds = [...new Set(projects.flatMap(p => p.organizacao?.id ? [p.organizacao.id] : []))].sort();
  const consulta = useQuery<NotaMapeamentoGrafico[]>({
    queryKey: ['portfolio-notas-mapeamento', demonstrativo, organizacaoIds],
    queryFn: () => demonstrativo ? Promise.resolve(notasMapeamentoDemo.filter(n=>organizacaoIds.includes(n.organizacaoId))) : listarNotasMapeamentos({ data: { organizacaoIds } }),
    enabled: organizacaoIds.length > 0,
  });
  const pendentes = consulta.data?.filter(n => n.ieoAguardandoReavaliacao).length ?? 0;
  return <div className="grid min-w-0 gap-5 xl:grid-cols-2">{(['etapas', 'orcamento'] as const).map(eixo => {
    const tituloY = eixo === 'etapas' ? 'Avanço de Etapas (%)' : 'Execução financeira (%)';
    const pontos = pontosMapeamento(projects, consulta.data ?? [], eixo);
    const idsPontos = new Set(pontos.map(p => p.id));
    const excluidos = projects.filter(p => !idsPontos.has(p.id)).map(p => {
      const nota = consulta.data?.find(n => n.organizacaoId === p.organizacao?.id);
      const motivos = [!p.organizacao?.id ? 'organização sem ID' : !nota ? 'mapeamento não encontrado' : nota.ieoAguardandoReavaliacao ? 'IEO aguardando reavaliação' : nota.nota == null || !Number.isFinite(nota.nota) || nota.nota < 1 || nota.nota > 4 ? 'nota indisponível' : null,
        eixo === 'etapas' && !conclusaoEtapas(p).total ? 'etapas não informadas' : null,
        eixo === 'orcamento' && (p.budgetApprovedInformado === false || p.budgetExecutedInformado === false || !Number.isFinite(p.budgetApproved) || !Number.isFinite(p.budgetExecuted) || p.budgetApproved <= 0) ? 'orçamento ou execução insuficiente' : null].filter(Boolean);
      return { p, motivos };
    });
    const descricaoEixo = eixo === 'etapas' ? 'etapas concluídas / total de etapas' : 'valor executado / valor aprovado';
    return <section key={eixo} className="h-full min-w-0 rounded-xl border bg-card p-4 sm:p-5" aria-label={`Nota consolidada do mapeamento × ${tituloY}`}>
      <h2 className="text-base font-semibold">Nota consolidada do mapeamento × {eixo === 'etapas' ? 'Avanço de Etapas' : 'execução financeira'}</h2>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">Um ponto corresponde a um projeto; a nota do diagnóstico é vinculada à organização e pode se repetir quando ela possui vários projetos. {descricaoEixo}. Notas indisponíveis e valores ausentes ficam fora do cálculo.</p>
      {!consulta.isLoading && !consulta.error && excluidos.length > 0 && <details className="mb-3 text-xs"><summary className="cursor-pointer">Ver motivos de exclusão ({excluidos.length} projetos)</summary><ul className="mt-2 list-disc space-y-1 pl-4">{excluidos.map(({p,motivos})=><li key={p.id}>{p.name} · {p.organizacao?.nome || p.org || 'Organização não informada'}: {motivos.join('; ') || 'dados indisponíveis'}.</li>)}</ul></details>}
      {consulta.isLoading ? <p role="status">Carregando notas do mapeamento…</p> : consulta.error ? <p role="alert">Não foi possível carregar as notas. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p> : !pontos.length ? <p className="py-12 text-center text-sm text-muted-foreground">Sem pontos calculáveis para este recorte. Confira os dados de diagnóstico, etapas e orçamento.</p> : <>
        <p className="mb-3 text-xs text-muted-foreground">{pontos.length} projeto(s) com os dois eixos disponíveis · {pontos.filter(p => p.parcial).length} com nota consolidada parcial{pendentes ? ` · ${pendentes} organização(ões) excluída(s): IEO aguarda reavaliação` : ''}.</p>
        <ResponsiveContainer width="100%" height={330}><ScatterChart margin={{ top: 15, right: 25, bottom: 35, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
          <XAxis type="number" dataKey="x" domain={[1, 4]} name="Nota consolidada do mapeamento" tickFormatter={formatar} label={{ value: 'Nota consolidada do mapeamento (1–4)', position: 'bottom', fontSize: 11 }}/>
          <YAxis type="number" dataKey="y" domain={[0, 'dataMax']} name={tituloY} tickFormatter={n => `${formatar(n)}%`} width={65} label={{ value: tituloY, angle: -90, position: 'insideLeft', fontSize: 10 }}/>
          <Tooltip content={({ active, payload }) => {
            const p = payload?.[0]?.payload;
            return active && p ? <div className="max-w-80 rounded-lg border bg-card p-3 text-xs shadow-lg">
              <strong>{p.projeto}</strong><p>Organização: {p.organizacao}</p>
              <p>Nota do mapeamento: {formatar(p.x)} / 4{p.parcial ? ' · parcial' : ''}</p>
              <p>Etapas: {p.etapasConcluidas}/{p.etapasTotal} · conclusão {percentual(p.percentualEtapas)}</p>
              <p>Orçamento aprovado: {moeda(p.valorAprovado)}</p><p>Executado: {moeda(p.valorExecutado)} · execução {percentual(p.percentualFinanceiro)}</p>
              <p>Aplicação {formatDateOnly(p.dataAplicacao)} · versão {p.versao}</p>
            </div> : null;
          }}/>
          <Scatter name="Projetos vinculados à organização" data={pontos} fill="var(--brand)">{pontos.map(p=><Cell key={p.id} fillOpacity={organizacaoAtiva && p.organizacaoId !== organizacaoAtiva ? 0.18 : 1} onClick={()=>p.organizacaoId && onSelecionarOrganizacao(p.organizacaoId)} style={{cursor:'pointer'}}/>)}</Scatter>
        </ScatterChart></ResponsiveContainer>
        <details className="mt-3 text-xs"><summary className="cursor-pointer">Consultar detalhes e valores usados</summary><div className="mt-3 grid gap-3 lg:grid-cols-2">{pontos.map(p=><article key={p.id} className="min-w-0 rounded-lg border p-3"><h4 className="font-semibold">{p.projeto}</h4><dl className="mt-2 grid gap-2 sm:grid-cols-2">{[['Organiza??o',p.organizacao],['Nota / 4',formatar(p.x)+(p.parcial?' ? parcial':'')],['Etapas conclu?das',`${p.etapasConcluidas}/${p.etapasTotal}`],['Avan?o de etapas',percentual(p.percentualEtapas)],['Or?amento aprovado',moeda(p.valorAprovado)],['Valor executado',moeda(p.valorExecutado)],['Execu??o financeira',percentual(p.percentualFinanceiro)],['Aplica??o',`${formatDateOnly(p.dataAplicacao)} ? v${p.versao}`]].map(([nome,valor])=><div key={nome} className="min-w-0 rounded bg-muted/30 p-2"><dt className="font-semibold text-muted-foreground">{nome}</dt><dd className="mt-1 break-words">{valor}</dd></div>)}</dl></article>)}</div></details>
      </>}
    </section>;
  })}</div>;
}
