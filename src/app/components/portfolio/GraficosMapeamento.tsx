import { useQuery } from '@tanstack/react-query';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProjectExt } from '../../store';
import { listarNotasMapeamentos } from '../../diagnosticos.server';
import { pontosMapeamento } from '../../lib/cruzamentoMapeamento';
import { formatDateOnly } from '../../lib/dateOnly';

const formatar = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

export function GraficosMapeamento({ projects }: { projects: ProjectExt[] }) {
  const organizacaoIds = [...new Set(projects.flatMap(p => p.organizacao?.id ? [p.organizacao.id] : []))].sort();
  const consulta = useQuery({
    queryKey: ['portfolio-notas-mapeamento', organizacaoIds],
    queryFn: () => listarNotasMapeamentos({ data: { organizacaoIds } }),
    enabled: organizacaoIds.length > 0,
  });
  return <>{(['etapas', 'orcamento'] as const).map(eixo => {
    const tituloY = eixo === 'etapas' ? 'Conclusão de etapas (%)' : 'Execução do orçamento (%)';
    const pontos = pontosMapeamento(projects, consulta.data ?? [], eixo);
    return <section key={eixo} className="rounded-xl border bg-card p-4 sm:p-5 min-w-0" aria-label={`Nota consolidada do mapeamento × ${tituloY}`}>
      <h2 className="text-base font-semibold">Nota consolidada do mapeamento × {eixo === 'etapas' ? 'conclusão de etapas' : 'execução do orçamento'}</h2>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">50% IEO + 25% Matriz + 25% Cesta; pesos redistribuídos entre componentes com nota. Cada ponto usa a aplicação atual da organização vinculada ao projeto. Ausências não viram zero.</p>
      {consulta.isLoading ? <p role="status">Carregando notas do mapeamento…</p> : consulta.error ? <p role="alert">Não foi possível carregar as notas. <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p> : !pontos.length ? <p className="py-12 text-center text-sm text-muted-foreground">Sem projetos com nota do mapeamento e {eixo === 'etapas' ? 'etapas registradas' : 'orçamento positivo'} neste recorte.</p> : <>
        <p className="mb-3 text-xs text-muted-foreground">{pontos.length} de {projects.length} projetos com os dois eixos disponíveis · {pontos.filter(p => p.parcial).length} com nota parcial.</p>
        <ResponsiveContainer width="100%" height={330}><ScatterChart margin={{ top: 15, right: 25, bottom: 35, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
          <XAxis type="number" dataKey="x" domain={[1, 4]} name="Nota consolidada do mapeamento" tickFormatter={formatar} label={{ value: 'Nota consolidada do mapeamento (1–4)', position: 'bottom', fontSize: 11 }}/>
          <YAxis type="number" dataKey="y" domain={[0, 'dataMax']} name={tituloY} tickFormatter={n => `${formatar(n)}%`} width={65} label={{ value: tituloY, angle: -90, position: 'insideLeft', fontSize: 10 }}/>
          <Tooltip content={({ active, payload }) => active && payload?.[0] ? <div className="rounded-lg border bg-card p-3 text-xs"><strong>{payload[0].payload.name}</strong><p>Nota: {formatar(payload[0].payload.x)} / 4{payload[0].payload.parcial ? ' · parcial' : ''}</p><p>{tituloY}: {formatar(payload[0].payload.y)}%</p><p>Aplicação {formatDateOnly(payload[0].payload.dataAplicacao)} · versão {payload[0].payload.versao}</p></div> : null}/>
          <Scatter name="Projetos por organização" data={pontos} fill="var(--brand)"/>
        </ScatterChart></ResponsiveContainer>
        <details className="mt-3 text-xs"><summary className="cursor-pointer">Consultar valores e aplicação de origem</summary><div className="overflow-x-auto"><table className="mt-3 w-full text-left"><thead><tr>{['Organização / projeto','Aplicação','Nota / 4',tituloY].map(t=><th scope="col" key={t} className="p-2">{t}</th>)}</tr></thead><tbody>{pontos.map(p=><tr key={p.id} className="border-t"><th scope="row" className="p-2">{p.name}</th><td className="p-2">{formatDateOnly(p.dataAplicacao)} · v{p.versao}</td><td className="p-2">{formatar(p.x)}{p.parcial ? ' · parcial' : ''}</td><td className="p-2">{formatar(p.y)}%</td></tr>)}</tbody></table></div></details>
      </>}
    </section>;
  })}</>;
}
