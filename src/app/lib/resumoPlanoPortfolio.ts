import type { Project } from '../data/mockData';
import { resumirConclusao } from './conclusaoPlano';

/** A etapa é concluída quando todas as suas atividades estão com status Concluído. */
export function conclusaoEtapas(projeto: Pick<Project, 'goals'>) {
  const etapas = (projeto.goals ?? []).flatMap(m => m.deliverables);
  const concluidas = etapas.filter(e => resumirConclusao(e.activities).concluido).length;
  return { total: etapas.length, concluidas, percentual: etapas.length ? concluidas / etapas.length * 100 : null };
}

/** Mesma conclusão derivada do plano: um grupo vazio nunca conta como concluído. */
export function resumoPlanoPortfolio(projetos: Pick<Project, 'goals'>[]) {
  const metas = projetos.flatMap(p => p.goals);
  const etapas = metas.flatMap(m => m.deliverables);
  const atividades = etapas.flatMap(e => e.activities);
  return [
    { rotulo: 'Metas concluídas', total: metas.length, concluidas: metas.filter(m => resumirConclusao(m.deliverables.flatMap(e => e.activities)).concluido).length },
    { rotulo: 'Etapas concluídas', total: etapas.length, concluidas: etapas.filter(e => resumirConclusao(e.activities).concluido).length },
    { rotulo: 'Atividades concluídas', total: atividades.length, concluidas: resumirConclusao(atividades).concluidas },
  ];
}
