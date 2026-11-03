import { useMemo } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ProjectExt } from '../../store';
import { faixaRisco, riscoEmAberto } from '../../lib/planoTrabalho';
import { conclusaoEtapas } from '../../lib/resumoPlanoPortfolio';

const PALETA = ['#426b9b', '#538566', '#cb8c38', '#b75959', '#816ba5', '#35969c', '#a5744a', '#6c7e93'];
const CRITICIDADES = ['Baixo', 'Médio', 'Alto', 'Crítico', 'Não informado'];
const CORES_CRITICIDADE: Record<string, string> = { Baixo: '#528363', Médio: '#b27b24', Alto: '#c46b35', Crítico: '#b44747', 'Não informado': '#8995a3' };
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const dinheiro = (v: number | null) => v == null ? 'Não informado' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number | null) => v == null ? 'Não informado' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const orgNome = (p: ProjectExt) => p.organizacao?.nome || p.org || 'Organização não informada';
const projectFinanceKnown = (p: ProjectExt, field: 'budgetApprovedInformado' | 'budgetExecutedInformado') => p[field] !== false;
const criticidadeRisco = (severity: number) => {
  const faixa = faixaRisco(severity);
  return severity <= 0 ? 'Não informado' : faixa;
};

function dadosAvanco(projects: ProjectExt[]) {
  return projects.flatMap(p => {
    const etapas = conclusaoEtapas(p);
    const financeiro = projectFinanceKnown(p, 'budgetApprovedInformado') && projectFinanceKnown(p, 'budgetExecutedInformado') && p.budgetApproved > 0
      ? p.budgetExecuted / p.budgetApproved * 100 : null;
    if (etapas.percentual === null || financeiro === null || !Number.isFinite(financeiro)) return [];
    const diferenca = etapas.percentual - financeiro;
    return [{
      id: p.id,
      nome: `${p.code} · ${p.name}`,
      organizacao: orgNome(p),
      organizacaoId: p.organizacao?.id ?? null,
      etapasConcluidas: etapas.concluidas,
      etapasTotal: etapas.total,
      percentualEtapas: etapas.percentual,
      percentualFinanceiro: financeiro,
      diferenca,
      magnitude: Math.abs(diferenca),
    }];
  }).sort((a, b) => b.magnitude - a.magnitude || a.nome.localeCompare(b.nome, 'pt-BR')).slice(0, 8);
}

const FAIXAS_PRAZO = ['Vencido', 'Até 30 dias', '31–60 dias', '61–90 dias', 'Após 90 dias', 'Sem prazo'];
function dataFimUtc(raw: string | undefined): number | null {
  if (!raw) return null;
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(raw);
  const br = /^(?:(\d{2})\/)?(\d{2})\/(\d{4})$/.exec(raw);
  const brMonth = /^(\d{2})\/(\d{4})$/.exec(raw);
  if (!iso && !br && !brMonth) return null;
  const year = Number(iso?.[1] ?? br?.[3] ?? brMonth?.[2]);
  const month = Number(iso?.[2] ?? br?.[2] ?? brMonth?.[1]);
  const dayInput = iso?.[3] ?? br?.[1];
  if (month < 1 || month > 12) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = dayInput ? Number(dayInput) : lastDay;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getTime();
}

function dadosPrazos(projects: ProjectExt[], referencia: Date) {
  const data = FAIXAS_PRAZO.map(faixa => ({ faixa, quantidade: 0 }));
  const hoje = Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  let projetosAbertos = 0;
  for (const projeto of projects) {
    if (projeto.status === 'Concluído') continue;
    projetosAbertos++;
    const fim = dataFimUtc(projeto.endDate);
    const dias = fim === null ? null : Math.ceil((fim - hoje) / 86_400_000);
    const indice = dias === null ? 5 : dias < 0 ? 0 : dias <= 30 ? 1 : dias <= 60 ? 2 : dias <= 90 ? 3 : 4;
    data[indice].quantidade++;
  }
  return { data, projetosAbertos };
}

function dadosMensais(projects: ProjectExt[]) {
  const porAno = new Map<number, Map<number, number>>();
  let notasSemData = 0;
  for (const p of projects) for (const nota of p.orcamentoNotas ?? []) {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(nota.dataEmissao ?? '');
    if (!match) { notasSemData++; continue; }
    const ano = Number(match[1]); const mes = Number(match[2]);
    if (mes < 1 || mes > 12 || !Number.isFinite(nota.valor)) { notasSemData++; continue; }
    const meses = porAno.get(ano) ?? new Map<number, number>();
    meses.set(mes, (meses.get(mes) ?? 0) + nota.valor);
    porAno.set(ano, meses);
  }
  const anos = [...porAno.keys()].sort((a, b) => a - b);
  let acumulados: Record<string, string | number | null>[] = [];
  const totais = new Map(anos.map(ano => [ano, 0]));
  for (let mes = 1; mes <= 12; mes++) {
    const linha: Record<string, string | number | null> = { mes: MESES[mes - 1], previsto: null };
    for (const ano of anos) {
      const valorMes = porAno.get(ano)?.get(mes);
      if (valorMes === undefined) { linha[`executado_${ano}`] = null; continue; }
      const acumulado = (totais.get(ano) ?? 0) + valorMes;
      totais.set(ano, acumulado);
      linha[`executado_${ano}`] = acumulado;
    }
    acumulados.push(linha);
  }
  return { anos, acumulados, notasSemData };
}

function dadosOrcamentoOrganizacao(projects: ProjectExt[]) {
  const grupos = new Map<string, { id: string; nome: string; aprovados: number; executados: number; aprovadosN: number; executadosN: number; projetos: number }>();
  let semOrganizacaoId = 0;
  for (const p of projects) {
    const id = p.organizacao?.id;
    if (!id) { semOrganizacaoId++; continue; }
    const atual = grupos.get(id) ?? { id, nome: orgNome(p), aprovados: 0, executados: 0, aprovadosN: 0, executadosN: 0, projetos: 0 };
    atual.projetos++;
    if (projectFinanceKnown(p, 'budgetApprovedInformado') && Number.isFinite(p.budgetApproved)) { atual.aprovados += p.budgetApproved; atual.aprovadosN++; }
    if (projectFinanceKnown(p, 'budgetExecutedInformado') && Number.isFinite(p.budgetExecuted)) { atual.executados += p.budgetExecuted; atual.executadosN++; }
    grupos.set(id, atual);
  }
  const linhas = [...grupos.values()].filter(g => g.aprovadosN > 0).sort((a, b) => b.aprovados - a.aprovados || a.nome.localeCompare(b.nome, 'pt-BR')).slice(0, 8)
    .map(g => ({ ...g, aprovados: g.aprovadosN ? g.aprovados : null, executados: g.executadosN ? g.executados : null }));
  return { linhas, semOrganizacaoId };
}

function dadosRiscos(projects: ProjectExt[]) {
  const porOrg = new Map<string, { id: string | null; nome: string; projetoSemVinculo?: string; riscos: ProjectExt['risks'] }>();
  let semOrganizacaoId = 0;
  for (const p of projects) {
    const abertos = (p.risks ?? []).filter(riscoEmAberto);
    if (!abertos.length) continue;
    const id = p.organizacao?.id;
    const chave = id ?? `sem-organizacao:${p.id}`;
    if (!id) semOrganizacaoId++;
    const atual = porOrg.get(chave) ?? { id: id ?? null, nome: id ? orgNome(p) : `${orgNome(p)} · projeto ${p.code}`, projetoSemVinculo: id ? undefined : p.code, riscos: [] };
    atual.riscos.push(...abertos);
    porOrg.set(chave, atual);
  }
  const organizacoes = [...porOrg.values()].sort((a, b) => b.riscos.length - a.riscos.length || a.nome.localeCompare(b.nome, 'pt-BR') || (a.id ?? '').localeCompare(b.id ?? ''));
  const categorias = [...new Set(organizacoes.flatMap(o => o.riscos.map(r => r.category.trim() || 'Categoria não informada')))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const porOrganizacao = organizacoes.map(o => {
    const linha: Record<string, string | number | null> = { id: o.id ?? 'Não informado', name: o.nome, label: o.id ? `${o.nome} · ${o.id.slice(0, 6)}` : o.nome, total: o.riscos.length };
    for (const nivel of CRITICIDADES) linha[nivel] = o.riscos.filter(r => criticidadeRisco(r.severity) === nivel).length;
    return linha;
  });
  const porCategoria = categorias.map(name => ({ name, value: organizacoes.reduce((s, o) => s + o.riscos.filter(r => (r.category.trim() || 'Categoria não informada') === name).length, 0) }));
  const porCriticidade = CRITICIDADES.map(nivel => ({ nivel, quantidade: organizacoes.reduce((s, o) => s + o.riscos.filter(r => criticidadeRisco(r.severity) === nivel).length, 0) }));
  return { organizacoes, categorias, porOrganizacao, porCategoria, porCriticidade, semOrganizacaoId };
}

export function GraficosAcompanhamento({ projects }: { projects: ProjectExt[] }) {
  const avanco = useMemo(() => dadosAvanco(projects), [projects]);
  const mensal = useMemo(() => dadosMensais(projects), [projects]);
  const orcamento = useMemo(() => dadosOrcamentoOrganizacao(projects), [projects]);
  const riscos = useMemo(() => dadosRiscos(projects), [projects]);
  const prazos = useMemo(() => dadosPrazos(projects, new Date()), [projects]);
  return <section className="space-y-5" aria-labelledby="graficos-acompanhamento-titulo">
    <div><h2 id="graficos-acompanhamento-titulo" className="text-lg font-semibold">Gráficos de acompanhamento</h2><p className="mt-1 text-xs text-muted-foreground">Os filtros de exercício, organização e status acima se aplicam a estes gráficos. Valores ausentes ficam “Não informado” e não entram em somas ou percentuais.</p></div>

    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <article className="rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Avanço de etapas comparado à execução financeira">
      <div><h3 className="font-semibold">Avanço de Etapas × execução financeira</h3><p className="text-xs text-muted-foreground">Comparação percentual por projeto. O avanço é etapas concluídas / total; os oito maiores gaps absolutos aparecem primeiro. A diferença, sozinha, não indica ineficiência.</p></div>
      {avanco.length ? <><div className="h-[310px] min-w-0 overflow-x-auto"><div className="h-full min-w-[540px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={avanco} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 112 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical/><XAxis type="number" domain={[0, 100]} tickFormatter={v => `${Number(v)}%`} tick={{ fontSize: 10 }}/><YAxis type="category" dataKey="nome" width={108} tick={{ fontSize: 9 }}/><Tooltip content={({ active, payload }) => { const d = payload?.[0]?.payload; return active && d ? <div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{d.nome}</strong><p>Organização: {d.organizacao} · ID {d.organizacaoId ?? 'Não informado'}</p><p>Etapas concluídas: {d.etapasConcluidas}/{d.etapasTotal}</p><p>Avanço de etapas: {pct(d.percentualEtapas)}</p><p>Execução financeira: {pct(d.percentualFinanceiro)}</p><p>Diferença absoluta: {Math.abs(d.diferenca).toLocaleString('pt-BR',{maximumFractionDigits:1})} p.p.</p></div> : null; }}/><Legend/><Bar dataKey="percentualEtapas" name="Avanço de Etapas" fill="#4e7558"/><Bar dataKey="percentualFinanceiro" name="Execução financeira" fill="#3b5687"/>
      </BarChart></ResponsiveContainer></div></div></> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Não há projetos com total de etapas e percentual financeiro calculáveis neste recorte.</p>}
    </article>

    <article className="rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Prazos dos projetos não concluídos">
      <div><h3 className="font-semibold">Prazos dos projetos não concluídos</h3><p className="text-xs text-muted-foreground">Quantidade de projetos por vencimento. Prazos informados apenas por mês/ano usam o último dia do mês; sem data registrada ficam em “Sem prazo”.</p></div>
      {prazos.projetosAbertos ? <div className="h-[300px] min-w-0 overflow-x-auto"><div className="h-full min-w-[640px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={prazos.data} margin={{top:18,right:20,bottom:8,left:8}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/><XAxis dataKey="faixa" interval={0} angle={-18} textAnchor="end" height={42} tick={{fontSize:9}}/><YAxis allowDecimals={false}/><Tooltip formatter={(value:number)=>`${value} projeto(s)`}/><Bar dataKey="quantidade" name="Projetos por prazo" radius={[4,4,0,0]}><LabelList dataKey="quantidade" position="top"/>{prazos.data.map((d,i)=><Cell key={d.faixa} fill={['#9d3c32','#a45d28','#354d84','#51658b','#c9cdd5','#aeb5be'][i]}/>)}</Bar></BarChart></ResponsiveContainer></div></div> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Não há projetos não concluídos neste recorte.</p>}
    </article>
    </div>

    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <article className="order-2 rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Execução financeira acumulada por mês">
      <div><h3 className="font-semibold">Execução financeira acumulada · janeiro a dezembro</h3><p className="text-xs text-muted-foreground">O período está identificado por ano na legenda. A distribuição mensal do orçamento previsto não existe nos registros atuais; não é estimada.</p></div>
      {mensal.anos.length ? <><div className="h-[320px] min-w-0 overflow-x-auto"><div className="h-full min-w-[620px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={mensal.acumulados} margin={{ top: 12, right: 20, bottom: 4, left: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="mes"/><YAxis tickFormatter={v => Number(v).toLocaleString('pt-BR',{notation:'compact',style:'currency',currency:'BRL'})} width={78}/><Tooltip formatter={(v: any) => typeof v === 'number' ? dinheiro(v) : 'Não informado'} labelFormatter={m => `${m} · acumulado`}/><Legend/><Line type="monotone" dataKey="previsto" name="Previsto acumulado · Não informado" stroke="#cb8c38" strokeDasharray="5 4" connectNulls={false} dot={false}/>{mensal.anos.map((ano,i)=><Line key={ano} type="monotone" dataKey={`executado_${ano}`} name={`Executado acumulado · ${ano}`} stroke={PALETA[i%PALETA.length]} connectNulls={false} dot={{r:3}}/>)}</LineChart></ResponsiveContainer></div></div><p className="text-xs text-muted-foreground">O executado usa notas com data de emissão registrada; meses sem lançamento permanecem sem ponto. O previsto mensal está não informado e foi excluído. {mensal.notasSemData ? `${mensal.notasSemData} lançamento(s) sem data válida não entraram.` : ''}</p></> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Não há notas com data válida neste recorte. Previsto mensal: Não informado. Executado mensal: Não informado.</p>}
    </article>

    <article className="order-1 rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Orçamento aprovado e executado por organização">
      <div><h3 className="font-semibold">Orçamento por organização · oito maiores dotações</h3><p className="text-xs text-muted-foreground">Valores em reais, agrupados pelo identificador da organização. Só organizações com orçamento aprovado informado aparecem ordenadas pela maior dotação.</p></div>
      {orcamento.linhas.length ? <><div className="h-[320px] min-w-0 overflow-x-auto"><div className="h-full min-w-[560px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={orcamento.linhas} layout="vertical" margin={{top:8,right:16,bottom:8,left:105}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical/><XAxis type="number" tickFormatter={v=>Number(v).toLocaleString('pt-BR',{notation:'compact',style:'currency',currency:'BRL'})} tick={{fontSize:9}}/><YAxis type="category" dataKey="nome" width={102} tick={{fontSize:9}}/><Tooltip formatter={(v:any)=>typeof v==='number'?dinheiro(v):'Não informado'} labelFormatter={(nome,items)=>`${nome} · ID ${items?.[0]?.payload?.id ?? ''}`}/><Legend/><Bar dataKey="aprovados" name="Orçamento" fill="#b8c7df"/><Bar dataKey="executados" name="Executado" fill="#3b5687"/></BarChart></ResponsiveContainer></div></div><p className="text-xs text-muted-foreground">{orcamento.semOrganizacaoId ? `${orcamento.semOrganizacaoId} projeto(s) sem ID de organização não foram agrupados.` : ''} Oito maiores dotações aprovadas; execução sem registros permanece sem barra, não zero.</p></> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Orçamento aprovado: Não informado neste recorte.</p>}
    </article>

    </div>

    <article className="rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-4" aria-label="Riscos em aberto por organização, categoria e criticidade">
      <div><h3 className="font-semibold">Riscos em aberto por organização</h3><p className="text-xs text-muted-foreground">Uma barra horizontal por organização, empilhada por criticidade e ordenada do maior para o menor total. Riscos encerrados são excluídos; o vínculo usa o ID da organização.</p></div>
      {riscos.organizacoes.length ? <><div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(240px,.7fr)]">
        <div className="max-h-[560px] min-w-0 overflow-auto"><div className="min-w-[570px]" style={{height:Math.max(280, riscos.organizacoes.length*34)}}><ResponsiveContainer width="100%" height="100%"><BarChart data={riscos.porOrganizacao} layout="vertical" margin={{top:8,right:16,bottom:8,left:130}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical/><XAxis type="number" allowDecimals={false} label={{value:'Riscos em aberto',position:'insideBottom',offset:-4,fontSize:10}}/><YAxis type="category" dataKey="label" width={126} tick={{fontSize:9}}/><Tooltip content={({active,payload})=>{const o=payload?.[0]?.payload;return active&&o?<div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{o.name}</strong><p>ID da organização: {o.id}</p><p>Total de riscos em aberto: {o.total}</p><ul className="mt-1">{CRITICIDADES.map(nivel=><li key={nivel}>{nivel}: {o[nivel]}</li>)}</ul></div>:null}}/><Legend/>{CRITICIDADES.map(nivel=><Bar key={nivel} dataKey={nivel} name={nivel} stackId="criticidade" fill={CORES_CRITICIDADE[nivel]}/>)}</BarChart></ResponsiveContainer></div></div>
        <div className="min-w-0"><h4 className="text-sm font-semibold">Categorias · total de riscos em aberto</h4><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riscos.porCategoria} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>{riscos.porCategoria.map((c,i)=><Cell key={c.name} fill={PALETA[i%PALETA.length]}/>)}</Pie><Tooltip formatter={(v:number)=>`${v} risco(s)`}/><Legend wrapperStyle={{fontSize:10}}/></PieChart></ResponsiveContainer></div></div>
      </div><div className="overflow-x-auto"><table className="min-w-[820px] w-full text-left text-xs"><caption className="mb-2 text-left font-semibold">Distribuição por criticidade · hierarquia por riscos em aberto</caption><thead><tr className="border-b">{['Organização · ID','Riscos em aberto',...CRITICIDADES].map(t=><th key={t} scope="col" className="p-2">{t}</th>)}</tr></thead><tbody>{riscos.organizacoes.map(o=><tr key={o.id ?? o.projetoSemVinculo} className="border-b"><th scope="row" className="p-2 font-medium">{o.nome} · {o.id ?? 'ID não informado; linha separada por projeto'}</th><td className="p-2">{o.riscos.length}</td>{CRITICIDADES.map(nivel=><td key={nivel} className="p-2">{o.riscos.filter(r=>criticidadeRisco(r.severity)===nivel).length}</td>)}</tr>)}</tbody><tfoot><tr className="font-semibold"><th scope="row" className="p-2">Total do recorte</th><td className="p-2">{riscos.organizacoes.reduce((s,o)=>s+o.riscos.length,0)}</td>{CRITICIDADES.map(nivel=><td key={nivel} className="p-2">{riscos.porCriticidade.find(c=>c.nivel===nivel)?.quantidade ?? 0}</td>)}</tr></tfoot></table></div>{riscos.semOrganizacaoId ? <p className="text-xs text-muted-foreground">{riscos.semOrganizacaoId} projeto(s) com riscos em aberto sem ID de organização aparecem em linhas separadas por projeto; não foram atribuídos a organizações.</p> : null}</> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Nenhum risco em aberto no recorte.</p>}
    </article>
  </section>;
}
