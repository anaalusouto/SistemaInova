import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { PortfolioFilters } from './portfolio/PortfolioFilters';
import {
  applyPortfolioFilters,
  emptyPortfolioFilters,
  getClassificacaoOptions,
  getExercicios,
  getOrgOptions,
  STATUS_OPTIONS,
  type PortfolioFilterValues,
} from '../lib/portfolioFilters';
import { portfolioDemo } from '../data/portfolioDemo';
import { resumoPlanoPortfolio } from '../lib/resumoPlanoPortfolio';
import { VisualizacoesPersonalizadas } from './portfolio/VisualizacoesPersonalizadas';
import { GraficosAcompanhamento } from './portfolio/GraficosAcompanhamento';
import { GraficosMapeamento } from './portfolio/GraficosMapeamento';
import { useAuth } from '../auth/authStore';
import { NavegacaoModulo } from './NavegacaoModulo';
import { GraficosDiagnosticoPortfolio } from './portfolio/GraficosDiagnosticoPortfolio';

type DataSource = 'demo' | 'real';

export function PortfolioView({ onOpenProject }: { onOpenProject?: (id: number) => void }) {
  const { projects: realProjects, projectsLoading } = useStore();
  const { user } = useAuth();
  const [source, setSource] = useState<DataSource>('real');
  const [aba, setAba] = useState<'projetos' | 'mapeamento' | 'cruzadas'>('projetos');
  const projects = source === 'demo' ? portfolioDemo : realProjects;
  const [filters, setFilters] = useState<PortfolioFilterValues>(emptyPortfolioFilters);
  const [organizacaoAtiva, setOrganizacaoAtiva] = useState<string | null>(null);
  const [graficosAbertos, setGraficosAbertos] = useState(false);

  const exercicios = useMemo(() => getExercicios(projects), [projects]);
  const orgOptions = useMemo(() => getOrgOptions(projects), [projects]);
  const classificacaoOptions = useMemo(() => getClassificacaoOptions(projects), [projects]);

  const changeSource = (next: DataSource) => {
    setSource(next);
    setFilters(emptyPortfolioFilters());
    setOrganizacaoAtiva(null);
  };

  const clearFilters = () => {
    setFilters(emptyPortfolioFilters());
    setOrganizacaoAtiva(null);
  };

  const filteredProjects = useMemo(() => applyPortfolioFilters(projects, filters), [projects, filters]);
  const selecionados = useMemo(() => organizacaoAtiva ? filteredProjects.filter(p => p.organizacao?.id === organizacaoAtiva) : filteredProjects, [filteredProjects, organizacaoAtiva]);
  const resumoPlano = useMemo(() => resumoPlanoPortfolio(selecionados), [selecionados]);
  const selecionarOrganizacao = (id: string) => setOrganizacaoAtiva(atual => atual === id ? null : id);

  const selectedExercicio = exercicios.find(e => e.key === filters.exercicioKey);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)', lineHeight: 1.3 }}>
            Visão Geral
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
            Visão consolidada do portfólio{selectedExercicio ? ` · Exercício ${selectedExercicio.label}` : ''}
          </p>
        </div>
        <div className="flex rounded-lg border p-1 gap-1" style={{ borderColor: 'var(--border)' }} role="group" aria-label="Fonte dos gráficos">
          {([{ id: 'demo', label: 'Demonstrativo' }, { id: 'real', label: 'Dados reais' }] as const).map(option => (
            <button key={option.id} type="button" aria-pressed={source === option.id} onClick={() => changeSource(option.id)}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{ background: source === option.id ? 'var(--brand-soft)' : 'transparent', color: source === option.id ? 'var(--brand)' : 'var(--ink-4)' }}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {source === 'demo' && (
        <p className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--brand-soft)', color: 'var(--brand-text)' }}>
          Dados fictícios para visualizar os gráficos · prazos relativos à data atual · um projeto por organização.
        </p>
      )}

      <NavegacaoModulo abas={[{id:'projetos',label:'Projetos'},{id:'mapeamento',label:'Mapeamento'},{id:'cruzadas',label:'Informações Cruzadas'}]} atual={aba} aoMudar={setAba} rotulo="Visão Geral" />

      <PortfolioFilters
        exercicios={exercicios}
        statusOptions={STATUS_OPTIONS}
        orgOptions={orgOptions}
        classificacaoOptions={classificacaoOptions}
        filters={filters}
        onChange={f=>{setFilters(f);setOrganizacaoAtiva(null);}}
        onClear={clearFilters}
      />
      <div className="flex flex-wrap items-center gap-3 text-sm"><label htmlFor="destaque-organizacao">Destacar organização</label><select id="destaque-organizacao" className="rounded-md border bg-card px-2 py-1" value={organizacaoAtiva ?? ''} onChange={e=>setOrganizacaoAtiva(e.target.value || null)}><option value="">Todas as organizações</option>{[...new Map(filteredProjects.flatMap(p=>p.organizacao?.id?[[p.organizacao.id,p.organizacao.nome] as const]:[])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'pt-BR')).map(([id,nome])=><option key={id} value={id}>{nome}</option>)}</select>{organizacaoAtiva && <button type="button" className="underline" onClick={()=>setOrganizacaoAtiva(null)}>Limpar destaque</button>}</div>
      {organizacaoAtiva && <p role="status" className="text-xs text-muted-foreground">Organização selecionada: os gráficos agregados e os indicadores mostram seu recorte; as barras e os pontos comparam e destacam a seleção.</p>}

      {source === 'real' && projectsLoading ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--ink-4)' }}>Carregando dados reais…</p>
      ) : <>
      {filteredProjects.length === 0 && <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-4)' }}>Nenhum projeto encontrado para os filtros selecionados.</p>}

      {aba === 'projetos' && <><div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Conclusão do plano de trabalho">
        {resumoPlano.map(resumo => <section key={resumo.rotulo} className="rounded-xl border bg-card p-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm" style={{ color: 'var(--ink-4)' }}>{resumo.rotulo}</h2>
          <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--success)' }}>{resumo.concluidas} <span className="text-sm font-normal" style={{ color: 'var(--ink-4)' }}>de {resumo.total}</span></p>
        </section>)}
      </div>

      <details className="rounded-xl border bg-card p-4" open={graficosAbertos} onToggle={e => setGraficosAbertos(e.currentTarget.open)}>
        <summary className="cursor-pointer font-semibold">Gráficos de acompanhamento</summary>
        {graficosAbertos && <div className="mt-4 space-y-5">
        <GraficosAcompanhamento projects={filteredProjects} demonstrativo={source === 'demo'} organizacaoAtiva={organizacaoAtiva} onSelecionarOrganizacao={selecionarOrganizacao}/>
        </div>}
      </details>

      <VisualizacoesPersonalizadas key={user?.login ?? 'sessao'} projects={selecionados} login={user?.login} onSelecionarOrganizacao={selecionarOrganizacao}
        onOpenProject={source === 'real' ? onOpenProject : undefined}/>
      </>}
      {aba === 'mapeamento' && <GraficosDiagnosticoPortfolio projects={selecionados} demonstrativo={source === 'demo'} />}
      {aba === 'cruzadas' && <GraficosMapeamento projects={filteredProjects} demonstrativo={source === 'demo'} organizacaoAtiva={organizacaoAtiva} onSelecionarOrganizacao={selecionarOrganizacao}/>}

      </>}
    </div>
  );
}
