import { useMemo } from 'react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ProjectExt } from '../../store';
import { faixaRisco, riscoEmAberto } from '../../lib/planoTrabalho';
import { resumirConclusao } from '../../lib/conclusaoPlano';

const PALETA = ['#426b9b', '#538566', '#cb8c38', '#b75959', '#816ba5', '#35969c', '#a5744a', '#6c7e93'];
const CRITICIDADES = ['Baixo', 'Médio', 'Alto', 'Crítico', 'Não informado'];
const CORES_CRITICIDADE: Record<string, string> = { Baixo: '#528363', Médio: '#b27b24', Alto: '#c46b35', Crítico: '#b44747', 'Não informado': '#8995a3' };
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const dinheiro = (v: number | null) => v == null ? 'Não informado' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = (v: number | null) => v == null ? 'Não informado' : `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const orgNome = (p: ProjectExt) => p.organizacao?.nome || p.org || 'Organização não informada';
const projectFinanceKnown = (p: ProjectExt, field: 'budgetApprovedInformado' | 'budgetExecutedInformado') => p[field] !== false;
const criticidadeRisco = (severity: number) => {
  if (!Number.isFinite(severity) || severity <= 0) return 'Não informado';
  const faixa = faixaRisco(severity);
  return faixa === '—' ? 'Não informado' : faixa;
};

export function dadosAvanco(projects: ProjectExt[]) {
  const grupos = new Map<string, { id: string; organizacao: string; projetos: number; atividadesConcluidas: number; atividadesTotal: number; projetosAtividades: number; aprovado: number; executado: number; projetosFinanceiro: number; projetosEstimados: number }>();
  for (const p of projects) {
    const id = p.organizacao?.id;
    if (!id) continue;
    const grupo = grupos.get(id) ?? { id, organizacao: orgNome(p), projetos: 0, atividadesConcluidas: 0, atividadesTotal: 0, projetosAtividades: 0, aprovado: 0, executado: 0, projetosFinanceiro: 0, projetosEstimados: 0 };
    grupo.projetos++;
    const atividades = resumirConclusao((p.goals ?? []).flatMap(meta => meta.deliverables.flatMap(etapa => etapa.activities)));
    if (atividades.total > 0) { grupo.atividadesConcluidas += atividades.concluidas; grupo.atividadesTotal += atividades.total; grupo.projetosAtividades++; }
    const executadoInformado = projectFinanceKnown(p, 'budgetExecutedInformado') && Number.isFinite(p.budgetExecuted) && p.budgetExecuted >= 0;
    if (projectFinanceKnown(p, 'budgetApprovedInformado') && Number.isFinite(p.budgetApproved) && p.budgetApproved >= 0 && executadoInformado) {
      grupo.aprovado += p.budgetApproved; grupo.executado += p.budgetExecuted; grupo.projetosFinanceiro++;
    } else grupo.projetosEstimados++;
    grupos.set(id, grupo);
  }
  return [...grupos.values()].flatMap(g => {
    const percentualAtividades = g.atividadesTotal > 0 ? g.atividadesConcluidas / g.atividadesTotal * 100 : null;
    const percentualFinanceiro = g.projetosEstimados === 0 && g.projetosFinanceiro > 0 && g.aprovado > 0 ? g.executado / g.aprovado * 100 : null;
    if (percentualAtividades === null && percentualFinanceiro === null) return [];
    const diferenca = percentualAtividades !== null && percentualFinanceiro !== null ? percentualAtividades - percentualFinanceiro : null;
    return [{
      id: g.id, nome: g.organizacao, organizacao: g.organizacao, organizacaoId: g.id,
      projetos: g.projetos, atividadesConcluidas: g.atividadesConcluidas, atividadesTotal: g.atividadesTotal,
      projetosAtividades: g.projetosAtividades, projetosFinanceiro: g.projetosFinanceiro, projetosEstimados: g.projetosEstimados,
      percentualAtividades, percentualFinanceiro, diferenca, magnitude: diferenca === null ? null : Math.abs(diferenca),
      aFrente: diferenca === null ? null : diferenca > 0 ? 'Avanço de atividades' : diferenca < 0 ? 'Valor financeiro' : 'Mesmo percentual',
    }];
  }).sort((a, b) => (b.magnitude ?? -1) - (a.magnitude ?? -1) || a.organizacao.localeCompare(b.organizacao, 'pt-BR'));
}

const FAIXAS_PRAZO = ['Vencidas', 'Até 30 dias', 'De 31 a 60 dias', 'De 61 a 90 dias', 'Após 90 dias', 'Sem prazo'];
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

export function dadosPrazos(projects: ProjectExt[], referencia: Date) {
  const data = FAIXAS_PRAZO.map(faixa => ({ faixa, quantidade: 0, etapas: [] as string[] }));
  const hoje = Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  let etapasNaoConcluidas = 0;
  for (const projeto of projects) {
    for (const etapa of projeto.goals.flatMap(meta => meta.deliverables)) {
      if (resumirConclusao(etapa.activities).concluido) continue;
      etapasNaoConcluidas++;
      const fim = dataFimUtc(etapa.plannedEnd ?? undefined);
      const dias = fim === null ? null : Math.ceil((fim - hoje) / 86_400_000);
      const indice = dias === null ? 5 : dias < 0 ? 0 : dias <= 30 ? 1 : dias <= 60 ? 2 : dias <= 90 ? 3 : 4;
      data[indice].quantidade++;
      if (projects.length === 1) data[indice].etapas.push(etapa.name);
    }
  }
  return { data, etapasNaoConcluidas };
}

export function dadosMensais(projects: ProjectExt[], demonstrativo: boolean) {
  const previstoPorAno = new Map<number, Map<number, number>>();
  const executadoPorAno = new Map<number, Map<number, number>>();
  let previstosAlocados = 0;
  let previstosSemPrazo = 0;
  const adicionar = (mapa: Map<number, Map<number, number>>, ano: number, mes: number, valor: number) => {
    const meses = mapa.get(ano) ?? new Map<number, number>();
    meses.set(mes, (meses.get(mes) ?? 0) + valor);
    mapa.set(ano, meses);
  };
  if (demonstrativo) {
    // Os registros demonstrativos já têm competência mensal explícita; não são usados nos dados reais.
    for (const p of projects) for (const item of p.financialItems ?? []) {
      const match = /^(\d{1,2})\/(\d{4})$/.exec(item.date ?? '');
      if (!match || !Number.isFinite(item.plannedValue)) continue;
      adicionar(previstoPorAno, Number(match[2]), Number(match[1]), item.plannedValue);
      previstosAlocados++;
    }
  } else {
    for (const p of projects) {
      if (!projectFinanceKnown(p, 'budgetApprovedInformado') || !Number.isFinite(p.budgetApproved) || p.budgetApproved < 0) continue;
      const inicio = dataFimUtc(p.startDate);
      const fim = dataFimUtc(p.endDate);
      if (inicio === null || fim === null || inicio > fim) { previstosSemPrazo++; continue; }
      const dataInicio = new Date(inicio), dataFim = new Date(fim);
      const primeiroMes = dataInicio.getUTCFullYear() * 12 + dataInicio.getUTCMonth();
      const ultimoMes = dataFim.getUTCFullYear() * 12 + dataFim.getUTCMonth();
      const meses = ultimoMes - primeiroMes + 1;
      for (let mes = primeiroMes; mes <= ultimoMes; mes++) {
        adicionar(previstoPorAno, Math.floor(mes / 12), mes % 12 + 1, p.budgetApproved / meses);
      }
      previstosAlocados++;
    }
  }
  let notasSemData = 0;
  for (const p of projects) for (const nota of p.orcamentoNotas ?? []) {
    const match = /^(\d{4})-(\d{2})-\d{2}$/.exec(nota.dataEmissao ?? '');
    if (!match) { notasSemData++; continue; }
    const ano = Number(match[1]); const mes = Number(match[2]);
    if (mes < 1 || mes > 12 || !Number.isFinite(nota.valor)) { notasSemData++; continue; }
    adicionar(executadoPorAno, ano, mes, nota.valor);
  }
  const anos = [...new Set([...previstoPorAno.keys(), ...executadoPorAno.keys()])].sort((a, b) => a - b);
  const acumulados: { mes: string; previsto: number | null; executado: number | null }[] = [];
  let totalPrevisto = 0, totalExecutado = 0;
  let inicioPrevisto = false, inicioExecutado = false;
  for (let ano = anos[0]; ano <= anos[anos.length - 1]; ano++) {
    for (let mes = 1; mes <= 12; mes++) {
      const previstoMes = previstoPorAno.get(ano)?.get(mes);
      const executadoMes = executadoPorAno.get(ano)?.get(mes);
      if (previstoMes !== undefined) { totalPrevisto += previstoMes; inicioPrevisto = true; }
      if (executadoMes !== undefined) { totalExecutado += executadoMes; inicioExecutado = true; }
      acumulados.push({ mes: `${MESES[mes - 1]}/${ano}`, previsto: inicioPrevisto ? totalPrevisto : null, executado: inicioExecutado ? totalExecutado : null });
    }
  }
  return { anos, acumulados, notasSemData, previstosAlocados, previstosSemPrazo };
}

export function dadosOrcamentoOrganizacao(projects: ProjectExt[]) {
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
  const todos = [...grupos.values()];
  const linhas = todos.filter(g => g.aprovadosN > 0 && g.aprovados !== 0).sort((a, b) => b.aprovados - a.aprovados || a.nome.localeCompare(b.nome, 'pt-BR'))
    .map(g => ({ ...g, aprovadoCompleto: g.aprovadosN === g.projetos, executadoCompleto: g.executadosN === g.projetos,
      aprovados: g.aprovadosN ? g.aprovados : null, executados: g.executadosN ? g.executados : null,
      percentualExecutado: g.aprovados > 0 && g.aprovadosN === g.projetos && g.executadosN === g.projetos ? g.executados / g.aprovados * 100 : null }));
  return { linhas, semOrganizacaoId, semOrcamento: todos.filter(g => g.aprovadosN === 0).length, orcamentoZero: todos.filter(g => g.aprovadosN > 0 && g.aprovados === 0).length };
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
    const atual = porOrg.get(chave) ?? { id: id ?? null, nome: id ? orgNome(p) : `${orgNome(p)} · ${p.name}`, projetoSemVinculo: id ? undefined : p.code, riscos: [] };
    atual.riscos.push(...abertos);
    porOrg.set(chave, atual);
  }
  const organizacoes = [...porOrg.values()].sort((a, b) => b.riscos.length - a.riscos.length || a.nome.localeCompare(b.nome, 'pt-BR') || (a.id ?? '').localeCompare(b.id ?? ''));
  const categorias = [...new Set(organizacoes.flatMap(o => o.riscos.map(r => r.category.trim() || 'Categoria não informada')))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const porOrganizacao = organizacoes.map(o => {
    const linha: Record<string, string | number | null> = { id: o.id ?? 'Não informado', name: o.nome, label: o.nome, total: o.riscos.length };
    for (const nivel of CRITICIDADES) linha[nivel] = o.riscos.filter(r => criticidadeRisco(r.severity) === nivel).length;
    return linha;
  });
  const porCategoria = categorias.map(name => ({ name, value: organizacoes.reduce((s, o) => s + o.riscos.filter(r => (r.category.trim() || 'Categoria não informada') === name).length, 0) }));
  const porCriticidade = CRITICIDADES.map(nivel => ({ nivel, quantidade: organizacoes.reduce((s, o) => s + o.riscos.filter(r => criticidadeRisco(r.severity) === nivel).length, 0) }));
  return { organizacoes, categorias, porOrganizacao, porCategoria, porCriticidade, semOrganizacaoId };
}

export function GraficosAcompanhamento({ projects, demonstrativo = false, organizacaoAtiva, onSelecionarOrganizacao }: { projects: ProjectExt[]; demonstrativo?: boolean; organizacaoAtiva: string | null; onSelecionarOrganizacao: (id: string) => void }) {
  const projetosAtivos = useMemo(() => organizacaoAtiva ? projects.filter(p=>p.organizacao?.id===organizacaoAtiva) : projects, [projects,organizacaoAtiva]);
  const avancoTodos = useMemo(() => dadosAvanco(projects), [projects]);
  const avanco = avancoTodos;
  const mensal = useMemo(() => dadosMensais(projetosAtivos, demonstrativo), [projetosAtivos, demonstrativo]);
  const orcamentoTodos = useMemo(() => dadosOrcamentoOrganizacao(projects), [projects]);
  const orcamento = orcamentoTodos;
  const riscos = useMemo(() => dadosRiscos(projects), [projects]);
  const riscosAtivos = useMemo(() => dadosRiscos(projetosAtivos), [projetosAtivos]);
  const prazos = useMemo(() => dadosPrazos(projetosAtivos, new Date()), [projetosAtivos]);
  const semVinculo = projects.filter(p => !p.organizacao?.id).length;
  const gruposAvanco = new Map<string, ProjectExt[]>();
  for (const p of projects) if (p.organizacao?.id) gruposAvanco.set(p.organizacao.id, [...(gruposAvanco.get(p.organizacao.id) ?? []), p]);
  const excluidosAvanco = [...gruposAvanco.values()].filter(grupo => !avancoTodos.some(l => l.id === grupo[0].organizacao?.id));
  return <section className="space-y-5" aria-labelledby="graficos-acompanhamento-titulo">
    <div><h2 id="graficos-acompanhamento-titulo" className="text-lg font-semibold">Gráficos de acompanhamento</h2><p className="mt-1 text-xs text-muted-foreground">Os filtros de exercício, organização e status acima se aplicam a estes gráficos. Valores ausentes ficam “Não informado” e não entram em somas ou percentuais.</p></div>

    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <article className="rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Avanço de atividades comparado à execução financeira">
      <div><h3 className="font-semibold">Avanço de Atividades × execução financeira</h3><p className="text-xs text-muted-foreground">Barras agrupadas por organização. Mostra todas as organizações com ao menos uma medida calculável; eixo percentual fixo de 0% a 100%. Quando falta orçamento ou execução de algum projeto da organização, a execução financeira aparece como N/A. A diferença não indica ineficiência por si só.</p></div>
      {organizacaoAtiva && <p className="text-xs text-muted-foreground">A seleção destaca a organização nos gráficos sem ocultar as demais.</p>}
      {avanco.length ? <><div className="min-w-0 overflow-x-auto"><div style={{height:Math.max(310,avanco.length*38+75)}} className="min-w-0 w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={avanco} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical/><XAxis type="number" domain={[0, 100]} ticks={[0,20,40,60,80,100]} tickFormatter={v => `${Number(v).toLocaleString('pt-BR',{maximumFractionDigits:0})}%`} tick={{ fontSize: 10 }}/><YAxis type="category" dataKey="nome" width={180} tick={{ fontSize: 9 }}/><Tooltip content={({ active, payload }) => { const d = payload?.[0]?.payload; return active && d ? <div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{d.organizacao}</strong><p>Projetos no grupo: {d.projetos}</p><p>Projetos com atividades registradas: {d.projetosAtividades}/{d.projetos}</p><p>Atividades concluídas: {d.atividadesTotal ? `${d.atividadesConcluidas}/${d.atividadesTotal}` : 'Não informado'}</p><p>Avanço de Atividades: {pct(d.percentualAtividades)}</p><p>Projetos com valor financeiro: {d.projetosFinanceiro}/{d.projetos}</p><p>Execução financeira: {d.percentualFinanceiro === null ? 'N/A' : pct(d.percentualFinanceiro)}{d.projetosEstimados > 0 ? ` · ${d.projetosEstimados} projeto(s) sem dados completos` : ''}</p><p>Diferença: {d.diferenca === null ? 'Não calculável · falta uma das medidas' : `${Math.abs(d.diferenca).toLocaleString('pt-BR',{maximumFractionDigits:1})} p.p. · ${d.aFrente} à frente`}</p></div> : null; }}/><Legend verticalAlign="bottom"/><Bar dataKey="percentualAtividades" name="Avanço de Atividades" fill="#4e7558">{avanco.map(d=><Cell key={d.id} fillOpacity={organizacaoAtiva && d.id!==organizacaoAtiva ? 0.18 : 1} onClick={()=>onSelecionarOrganizacao(d.id)} style={{cursor:"pointer"}}/>)}</Bar><Bar dataKey="percentualFinanceiro" name="Execução financeira" fill="#3b5687">{avanco.map(d=><Cell key={d.id} fillOpacity={organizacaoAtiva && d.id!==organizacaoAtiva ? 0.18 : 1} onClick={()=>onSelecionarOrganizacao(d.id)} style={{cursor:"pointer"}}/>)}</Bar>
      </BarChart></ResponsiveContainer></div></div>{avanco.some(d => d.percentualFinanceiro === null) && <p className="text-xs text-muted-foreground">Execução financeira N/A: {avanco.filter(d => d.percentualFinanceiro === null).map(d => d.nome).join(', ')}.</p>}</> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Não há projetos com total de atividades e percentual financeiro calculáveis neste recorte.</p>}
      <details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Ver organizações sem medidas calculáveis ({excluidosAvanco.length})</summary><p className="mt-2">Organizações com apenas uma medida aparecem no gráfico; a outra é N/A. Diferenças são ordenadas pela magnitude apenas quando ambas as medidas existem. {semVinculo} projeto(s) sem organização vinculada não foram agrupados.</p><ul className="mt-2 list-disc pl-4">{excluidosAvanco.map(g=><li key={g[0].organizacao!.id}>{orgNome(g[0])}: sem atividades concluídas/total e sem orçamento e execução calculáveis.</li>)}</ul></details>
    </article>

    <article className="rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Prazos e atraso das etapas não concluídas">
      <div><h3 className="font-semibold">Prazos e atraso das etapas não concluídas</h3><p className="text-xs text-muted-foreground">Unidade: etapas. Prazos só com mês/ano usam o último dia do mês; etapas sem data ficam em “Sem prazo”.</p></div>
      {prazos.etapasNaoConcluidas ? <div className="h-[300px] min-w-0 overflow-x-auto"><div className="h-full min-w-0 w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={prazos.data} margin={{top:18,right:20,bottom:8,left:8}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/><XAxis dataKey="faixa" interval={0} angle={-18} textAnchor="end" height={54} tick={{fontSize:9}}/><YAxis allowDecimals={false} label={{value:'Etapas não concluídas',angle:-90,position:'insideLeft',fontSize:10}}/><Tooltip content={({active,payload})=>{const faixa=payload?.[0]?.payload; return active && faixa ? <div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{faixa.faixa}</strong><p>{faixa.quantidade} etapa(s)</p>{projetosAtivos.length === 1 && faixa.etapas.length > 0 && <ul className="mt-2 list-disc pl-4">{faixa.etapas.map((nome: string, i: number)=><li key={i}>{nome}</li>)}</ul>}</div> : null;}}/><Bar dataKey="quantidade" name="Etapas não concluídas" radius={[4,4,0,0]}><LabelList dataKey="quantidade" position="top"/>{prazos.data.map((d,i)=><Cell key={d.faixa} fill={['#b44747','#c8833c','#557cad','#557cad','#557cad','#8995a3'][i]}/>)}</Bar></BarChart></ResponsiveContainer></div></div> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Não há etapas não concluídas neste recorte.</p>}
    </article>
    </div>

    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
    <article className="order-2 rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Execução financeira acumulada por mês">
      <div><h3 className="font-semibold">Execução financeira acumulada</h3><p className="text-xs text-muted-foreground">Os valores acumulados seguem a sequência dos meses e anos.</p></div>
      {mensal.anos.length ? <><div className="h-[320px] min-w-0 overflow-x-auto"><div className="h-full min-w-0 w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><AreaChart data={mensal.acumulados} margin={{ top: 12, right: 20, bottom: 4, left: 12 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="mes"/><YAxis tickFormatter={v => Number(v).toLocaleString('pt-BR',{notation:'compact',style:'currency',currency:'BRL'})} width={78}/><Tooltip content={({active,label})=>{const linha=mensal.acumulados.find(m=>m.mes===label);return active&&linha?<div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{label} · acumulado</strong><p>Previsto: {linha.previsto !== null ? dinheiro(linha.previsto) : 'Não informado'}</p><p>Executado: {linha.executado !== null ? dinheiro(linha.executado) : 'Não informado'}</p></div>:null}}/><Legend/><Area type="monotone" dataKey="previsto" name="Previsto" stroke="#8bb2d8" fill="#dbe8f4" fillOpacity={0.3} dot={false}/><Area type="monotone" dataKey="executado" name="Executado" stroke="#294d7a" fill="#294d7a" fillOpacity={0.12} dot={{r:3}} activeDot={{r:5}}/></AreaChart></ResponsiveContainer></div></div><p className="text-xs text-muted-foreground">O previsto distribui o orçamento proposto de cada projeto igualmente entre os meses de início e fim. O executado soma notas pela data de emissão. {mensal.previstosSemPrazo ? `${mensal.previstosSemPrazo} projeto(s) sem datas válidas de início e fim não entraram no previsto; ` : ''}{mensal.notasSemData ? `${mensal.notasSemData} lançamento(s) executado(s) sem data válida não entraram.` : ''}{demonstrativo ? ' No demonstrativo, ambas as séries são fictícias e estão claramente identificadas como simulação.' : ''}</p></> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Previsto mensal: Não informado para projetos sem orçamento e datas válidas. Executado mensal: não informado neste recorte.</p>}
    </article>

    <article className="order-1 rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-3" aria-label="Orçamento aprovado e executado por organização">
      <div><h3 className="font-semibold">Orçamento por organização</h3><p className="text-xs text-muted-foreground">Valores agrupados por organização e ordenados pelo orçamento aprovado.</p></div>
      {organizacaoAtiva && <p className="text-xs text-muted-foreground">A organização selecionada é incluída quando o orçamento aprovado está disponível.</p>}
      {orcamento.linhas.length ? <><div className="min-w-0 overflow-x-auto"><div style={{height:Math.max(320,orcamento.linhas.length*65+75)}} className="min-w-0 w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={orcamento.linhas} layout="vertical" barGap={-16} margin={{top:8,right:65,bottom:8,left:0}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical/><XAxis type="number" tickFormatter={v=>Number(v).toLocaleString('pt-BR',{notation:'compact',style:'currency',currency:'BRL'})} tick={{fontSize:9}}/><YAxis type="category" dataKey="nome" width={102} tick={{fontSize:9}}/><Tooltip content={({active,payload})=>{const g=payload?.[0]?.payload;return active&&g?<div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{g.nome}</strong><p>Orçamento aprovado{g.aprovadoCompleto?'':' · parcial'}: {dinheiro(g.aprovados)}</p><p>Valor executado{g.executadoCompleto?'':' · parcial'}: {dinheiro(g.executados)}</p><p>Percentual executado: {pct(g.percentualExecutado)}</p></div>:null}}/><Legend verticalAlign="bottom"/><Bar dataKey="aprovados" name="Orçamento aprovado" fill="#b8c7df" barSize={16}>{orcamento.linhas.map(d=><Cell key={d.id} fillOpacity={organizacaoAtiva && d.id!==organizacaoAtiva ? 0.18 : 1} onClick={()=>onSelecionarOrganizacao(d.id)} style={{cursor:"pointer"}}/>)}</Bar><Bar dataKey="executados" name="Valor executado" fill="#3b5687" barSize={16}><LabelList dataKey="executados" position="right" formatter={(v: number) => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} />{orcamento.linhas.map(d=><Cell key={d.id} fillOpacity={organizacaoAtiva && d.id!==organizacaoAtiva ? 0.18 : 1} onClick={()=>onSelecionarOrganizacao(d.id)} style={{cursor:"pointer"}}/>)}</Bar></BarChart></ResponsiveContainer></div></div><p className="text-xs text-muted-foreground">{orcamento.semOrganizacaoId ? `${orcamento.semOrganizacaoId} projeto(s) sem organização vinculada não foram agrupados. ` : ''}{orcamento.semOrcamento ? `${orcamento.semOrcamento} organização(ões) sem orçamento registrado; ` : ''}{orcamento.orcamentoZero ? `${orcamento.orcamentoZero} organização(ões) com orçamento registrado igual a R$ 0; ` : ''}Executados sem registro aparecem como “Não informado”; valores parciais são identificados no detalhe.</p></> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Orçamento aprovado: Não informado neste recorte.</p>}
    </article>

    </div>

    <article className="rounded-xl border bg-card p-4 sm:p-5 min-w-0 space-y-4" aria-label="Riscos em aberto por organização, categoria e criticidade">
      <section aria-label="Quantidade de riscos em aberto por criticidade" className="space-y-2">
        <div><h3 className="font-semibold">Quantidade de riscos em aberto por criticidade</h3><p className="text-xs text-muted-foreground">Contagem no recorte selecionado.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{['Crítico', 'Alto', 'Médio', 'Baixo', 'Não informado'].map(nivel => <div key={nivel} className="rounded-lg border p-3" style={{ borderTop: `4px solid ${CORES_CRITICIDADE[nivel]}` }}><span className="block text-xs font-medium">{nivel}</span><strong className="block text-2xl font-bold leading-tight">{riscosAtivos.porCriticidade.find(item => item.nivel === nivel)?.quantidade ?? 0}</strong></div>)}</div>
      </section>
      <div><h3 className="font-semibold">Riscos em aberto por organização</h3><p className="text-xs text-muted-foreground">Uma barra horizontal por organização, empilhada por criticidade e ordenada do maior para o menor total. Riscos encerrados são excluídos; os riscos são agrupados por organização.</p></div>
      {riscos.organizacoes.length ? <><div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(240px,.7fr)]">
        <div className="min-w-0 overflow-x-auto"><div className="min-w-0 w-full" style={{height:Math.max(280, riscos.organizacoes.length*34+80)}}><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={riscos.porOrganizacao} layout="vertical" margin={{top:8,right:16,bottom:8,left:4}}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical/><XAxis type="number" allowDecimals={false} label={{value:'Riscos em aberto',position:'insideBottom',offset:-4,fontSize:10}}/><YAxis type="category" dataKey="label" width={180} tick={{fontSize:9}}/><Tooltip content={({active,payload})=>{const o=payload?.[0]?.payload;return active&&o?<div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{o.name}</strong><p>Total de riscos em aberto: {o.total}</p><ul className="mt-1">{CRITICIDADES.map(nivel=><li key={nivel}>{nivel}: {o[nivel]}</li>)}</ul></div>:null}}/><Legend/>{CRITICIDADES.map(nivel=><Bar key={nivel} dataKey={nivel} name={nivel} stackId="criticidade" fill={CORES_CRITICIDADE[nivel]}>{riscos.porOrganizacao.map((o,i)=><Cell key={i} fillOpacity={organizacaoAtiva && o.id!==organizacaoAtiva ? 0.18 : 1} onClick={()=>o.id && o.id !== "Não informado" && onSelecionarOrganizacao(String(o.id))} style={{cursor:"pointer"}}/>)}</Bar>)}</BarChart></ResponsiveContainer></div></div>
        <div className="min-w-0"><h4 className="text-sm font-semibold">Categorias · total de riscos em aberto</h4>{!riscosAtivos.organizacoes.length && <p className="text-xs text-muted-foreground">Nenhum risco em aberto na organização selecionada.</p>}<div className="h-[260px]"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={riscosAtivos.porCategoria} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2}>{riscosAtivos.porCategoria.map((c,i)=><Cell key={c.name} fill={PALETA[i%PALETA.length]}/>)}</Pie><Tooltip content={({active,payload})=>{const d=payload?.[0]?.payload;const total=riscosAtivos.porCategoria.reduce((s,c)=>s+c.value,0);return active&&d?<div className="rounded-lg border bg-card p-3 text-xs shadow-lg"><strong>{d.name}</strong><p>Quantidade: {d.value} risco(s)</p><p>Percentual do total: {total?`${(d.value/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`:'Não informado'}</p></div>:null}}/><Legend wrapperStyle={{fontSize:10}}/></PieChart></ResponsiveContainer></div></div>
      </div><details><summary className="cursor-pointer text-sm font-medium">Ver dados detalhados</summary><div className="overflow-x-auto"><table className="min-w-[820px] w-full text-left text-xs"><caption className="mb-2 text-left font-semibold">Distribuição por criticidade · hierarquia por riscos em aberto</caption><thead><tr className="border-b">{['Organização','Riscos em aberto',...CRITICIDADES].map(t=><th key={t} scope="col" className="p-2">{t}</th>)}</tr></thead><tbody>{riscos.organizacoes.map(o=><tr key={o.id ?? o.projetoSemVinculo} className="border-b"><th scope="row" className="p-2 font-medium">{o.nome}</th><td className="p-2">{o.riscos.length}</td>{CRITICIDADES.map(nivel=><td key={nivel} className="p-2">{o.riscos.filter(r=>criticidadeRisco(r.severity)===nivel).length}</td>)}</tr>)}</tbody><tfoot><tr className="font-semibold"><th scope="row" className="p-2">Total do recorte</th><td className="p-2">{riscos.organizacoes.reduce((s,o)=>s+o.riscos.length,0)}</td>{CRITICIDADES.map(nivel=><td key={nivel} className="p-2">{riscos.porCriticidade.find(c=>c.nivel===nivel)?.quantidade ?? 0}</td>)}</tr></tfoot></table></div></details>{riscos.semOrganizacaoId ? <p className="text-xs text-muted-foreground">{riscos.semOrganizacaoId} projeto(s) com riscos em aberto sem organização vinculada aparecem em linhas separadas por projeto; não foram atribuídos a organizações.</p> : null}</> : <p role="status" className="py-8 text-center text-sm text-muted-foreground">Nenhum risco em aberto no recorte.</p>}
    </article>
  </section>;
}
