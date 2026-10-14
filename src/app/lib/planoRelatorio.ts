import type { Goal, Project } from '../data/mockData';
import type { ProjectExt } from '../store';
import { formatDateOnly } from './dateOnly';

export type TipoRegistroPlano = 'meta' | 'etapa' | 'atividade' | 'tarefa' | 'risco' | 'parecer';
export type OrdemCamposPlano = Partial<Record<TipoRegistroPlano, string[]>>;
/** A área Parecer da organização é informativa; o plano não reabre os registros técnicos antigos. */
export const CAMPOS_RELATORIO_PLANO = ['cadastro', 'metas', 'riscos'] as const;
export interface CampoPlano { chave: string; rotulo: string; valor: string; preenchido: boolean }
export interface RegistroPlano { id: string; tipo: TipoRegistroPlano; titulo: string; campos: CampoPlano[] }

/** Índices iguais (inclusive legados) têm desempate permanente por ID, nunca por nome ou data de edição. */
export function ordenarIrmaos<T extends { id: string; order: number }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

export function ordenarPlano(metas: readonly Goal[]): Goal[] {
  return ordenarIrmaos(metas).map(m => ({ ...m, deliverables: ordenarIrmaos(m.deliverables).map(e => ({
    ...e, activities: ordenarIrmaos(e.activities).map(a => ({ ...a, tasks: ordenarIrmaos(a.tasks) })),
  })) }));
}

/** Todos os campos de negócio; IDs técnicos identificam o registro, sem substituir seus vínculos legíveis. */
export function registrosDoPlano(p: Project, selecionados = ['metas', 'riscos', 'pareceres'], ordem: OrdemCamposPlano = {}): RegistroPlano[] {
  const registros: RegistroPlano[] = [];
  const metas = ordenarPlano(p.goals);
  const etapas = new Map(metas.flatMap(m => m.deliverables.map(e => [e.id, `${m.name} / ${e.name}`] as const)));
  const nomesMetas = new Map(metas.map(m => [m.id, m.name]));
  const riscos = new Map(p.risks.map(r => [r.id, r.title || r.description]));
  const campo = (chave: string, rotulo: string, valor: string | number | null | undefined, data = false): CampoPlano => {
    const preenchido = valor !== null && valor !== undefined && String(valor).trim() !== '' && valor !== 'Não informado';
    return { chave, rotulo, preenchido, valor: preenchido ? (data ? formatDateOnly(String(valor)) : String(valor)) : 'Não informado' };
  };
  const periodo = (r: { plannedStart?: string | null; plannedEnd?: string | null; actualStart?: string | null; actualEnd?: string | null }) => [
    campo('plannedStart', 'Início previsto', r.plannedStart, true), campo('plannedEnd', 'Fim previsto', r.plannedEnd, true),
    campo('actualStart', 'Início realizado', r.actualStart, true), campo('actualEnd', 'Fim realizado', r.actualEnd, true),
  ];
  const adicionar = (id: string, tipo: TipoRegistroPlano, titulo: string, campos: CampoPlano[]) => {
    const preferencias = ordem[tipo] ?? [];
    const posicao = (c: CampoPlano) => { const i = preferencias.indexOf(c.chave); return i < 0 ? preferencias.length : i; };
    registros.push({ id, tipo, titulo, campos: [...campos].sort((a, b) => posicao(a) - posicao(b)) });
  };
  if (selecionados.includes('metas')) for (const m of metas) {
    adicionar(m.id, 'meta', `Meta: ${m.name}`, [campo('name', 'Nome', m.name), campo('responsible', 'Responsável', m.responsible), ...periodo(m).slice(0, 2)]);
    for (const e of m.deliverables) {
      adicionar(e.id, 'etapa', `Etapa: ${m.name} / ${e.name}`, [campo('name', 'Nome', e.name), campo('expectedResult', 'Resultado esperado', e.expectedResult), ...periodo(e)]);
      for (const a of e.activities) {
        adicionar(a.id, 'atividade', `Atividade: ${m.name} / ${e.name} / ${a.name}`, [
          campo('name', 'Título', a.name), campo('responsible', 'Responsável', a.responsible),
          campo('status', 'Status', a.status), campo('progress', 'Progresso (%)', a.progress), ...periodo(a),
          campo('delayJustification', 'Justificativa de atraso', a.delayJustification), campo('budgetLink', 'Vínculo orçamentário', a.budgetLink),
          campo('observations', 'Observação', a.observations), campo('nextStep', 'Ação de acompanhamento', a.nextStep),
          campo('nextStepOwner', 'Responsável pela ação', a.nextStepOwner), campo('nextStepDue', 'Prazo da ação', a.nextStepDue, true),
          campo('riskOriginId', 'Risco de origem', a.riskOriginId ? riscos.get(a.riskOriginId) ?? a.riskOriginId : null),
          campo('attachment', 'Anexo', a.attachment?.fileName),
        ]);
        for (const t of a.tasks) adicionar(t.id, 'tarefa', `Subtarefa: ${a.name}`, [campo('title', 'Título', t.title)]);
      }
    }
  }
  if (selecionados.includes('riscos')) for (const r of p.risks) {
    const respostas = metas.flatMap(m => m.deliverables.flatMap(e => e.activities)).filter(a => a.riskOriginId === r.id);
    adicionar(r.id, 'risco', `Risco: ${r.title || r.description}`, [
      campo('title', 'Título', r.title), campo('description', 'Descrição', r.description),
      campo('stageId', 'Meta / Etapa', (r.stageId && etapas.get(r.stageId)) || r.stage || (r.goalId && nomesMetas.get(r.goalId))),
      campo('specification', 'Especificação / resultado vinculado', r.specification || r.spec),
      campo('category', 'Categoria', r.category), campo('probability', 'Probabilidade', r.probability),
      campo('impact', 'Impacto', r.impact), campo('severity', 'Pontuação', r.severity),
      campo('status', 'Status', r.status), campo('responsible', 'Responsável', r.responsible),
      campo('responseStrategy', 'Estratégia de resposta', r.responseStrategy), campo('responses', 'Ações de resposta', respostas.map(a => a.name).join('\n')),
    ]);
  }
  if (selecionados.includes('pareceres')) for (const r of (p as ProjectExt).pareceres ?? []) {
    const contato = (p as ProjectExt).commLogs?.find(c => c.id === r.logComunicacaoId);
    adicionar(r.id, 'parecer', `Parecer: ${formatDateOnly(r.data)}`, [campo('data', 'Data', r.data, true), campo('origem', 'Origem', r.origem),
      campo('autor', 'Autor', r.autor), campo('pontosObservados', 'Pontos observados', r.pontosObservados), campo('itensCriticos', 'Itens críticos', r.itensCriticos),
      campo('limitacoesOrcamentarias', 'Limitações orçamentárias', r.limitacoesOrcamentarias), campo('recomendacao', 'Recomendação técnica', r.recomendacao),
      campo('logComunicacaoId', 'Registro de contato', contato ? `${formatDateOnly(contato.data)} · ${contato.assunto || contato.resumo}` : r.logComunicacaoId),
    ]);
  }
  return registros;
}

/** Projeção dos próximos passos: a edição sempre volta à atividade original, sem cópias divergentes. */
export function atividadesDaOrganizacao(projetos: readonly ProjectExt[], orgId: string) {
  return projetos.filter(p => p.organizacao?.id === orgId).flatMap(projeto => ordenarPlano(projeto.goals).flatMap(meta =>
    meta.deliverables.flatMap(etapa => etapa.activities.map(atividade => ({ projeto, meta, etapa, atividade }))),
  ));
}

export function encaminhamentosDoPlano(projetos: readonly ProjectExt[], orgId: string) {
  return atividadesDaOrganizacao(projetos, orgId).filter(l => l.atividade.nextStep.trim()).sort((a, b) => Number(a.atividade.status === 'Concluído') - Number(b.atividade.status === 'Concluído') ||
    (a.atividade.nextStepDue || '9999-12-31').localeCompare(b.atividade.nextStepDue || '9999-12-31') || a.atividade.id.localeCompare(b.atividade.id));
}
