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
import { useAuth } from '../auth/authStore';

type DataSource = 'demo' | 'real';

export function PortfolioView({ onOpenProject }: { onOpenProject?: (id: number) => void }) {
  const { projects: realProjects, projectsLoading } = useStore();
  const { user } = useAuth();
  const [source, setSource] = useState<DataSource>('real');
  const projects = source === 'demo' ? portfolioDemo : realProjects;
  const [filters, setFilters] = useState<PortfolioFilterValues>(emptyPortfolioFilters);

  const exercicios = useMemo(() => getExercicios(projects), [projects]);
  const orgOptions = useMemo(() => getOrgOptions(projects), [projects]);
  const classificacaoOptions = useMemo(() => getClassificacaoOptions(projects), [projects]);

  const changeSource = (next: DataSource) => {
    setSource(next);
    setFilters(emptyPortfolioFilters());
  };

  const clearFilters = () => {
    setFilters(emptyPortfolioFilters());
  };

  const filteredProjects = useMemo(() => applyPortfolioFilters(projects, filters), [projects, filters]);
  const resumoPlano = useMemo(() => resumoPlanoPortfolio(filteredProjects), [filteredProjects]);

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
          Dados simulados para visualizar cenários de decisão · referência: 02/10/2026 · um projeto por organização.
        </p>
      )}

      <PortfolioFilters
        exercicios={exercicios}
        statusOptions={STATUS_OPTIONS}
        orgOptions={orgOptions}
        classificacaoOptions={classificacaoOptions}
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
      />

      {source === 'real' && projectsLoading ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--ink-4)' }}>Carregando dados reais…</p>
      ) : <>
      {filteredProjects.length === 0 && <p className="py-6 text-center text-sm" style={{ color: 'var(--ink-4)' }}>Nenhum projeto encontrado para os filtros selecionados.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Conclusão do plano de trabalho">
        {resumoPlano.map(resumo => <section key={resumo.rotulo} className="rounded-xl border bg-card p-4" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm" style={{ color: 'var(--ink-4)' }}>{resumo.rotulo}</h2>
          <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--success)' }}>{resumo.concluidas} <span className="text-sm font-normal" style={{ color: 'var(--ink-4)' }}>de {resumo.total}</span></p>
        </section>)}
      </div>

      <VisualizacoesPersonalizadas key={user?.login ?? 'sessao'} projects={filteredProjects} login={user?.login}
        onOpenProject={source === 'real' ? onOpenProject : undefined}/>

      </>}
    </div>
  );
}
