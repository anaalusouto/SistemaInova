import type { Project } from '../data/mockData';
import { resumirConclusao } from './conclusaoPlano';

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
