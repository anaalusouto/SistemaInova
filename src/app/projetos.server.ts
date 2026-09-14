// Server functions do módulo Projetos (onda 1 da migração para Supabase).
// Todo acesso usa a service-role key (bypassa RLS) — a checagem de papel
// (admin/estagiário) é feita aqui, no mesmo espírito do que store.tsx fazia
// no client antes da migração. Ver supabase/migrations/0001_init_schema.sql
// para o schema e C:\Users\luluk\.claude\plans\vast-watching-adleman.md para o plano.
//
// Vive em src/app/ (não em src/server/) de propósito: este projeto bloqueia
// import de **/server/** no bundle do client (vite.config.ts, importProtection)
// para garantir que código com credenciais cruas nunca vaze — mas os exports
// createServerFn() daqui PRECISAM ser importáveis do client (store.tsx roda no
// client) para o compilador do TanStack Start fazer o split client/server via
// RPC. O sufixo .server.ts (não a pasta) é o que aciona esse split.
import { createServerFn } from '@tanstack/react-start';
import type { ProjectExt, PlanoTrabalho, Aporte, EditAuthor } from './store';
import type {
  Project, Goal, Deliverable, Activity, Risk, Change, FinancialItem, ContrapartidaItem,
  Evidence, ActivityStatus,
} from './data/mockData';
import type { Contact, CommLog, MetaChangeLog, PendingApproval, ProjectOp } from './data/projectExtras';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

const num = (v: unknown, fb = 0) => (typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || fb);
const str = (v: unknown, fb = '') => (typeof v === 'string' ? v : fb);
const n2 = (v: unknown): number => (v == null ? 0 : Number(v));

// ---------------------------------------------------------------------------
// Mapeamento linha do banco (snake_case) -> ProjectExt (camelCase), o shape
// que os componentes de project-tabs já esperam.
// ---------------------------------------------------------------------------
function mapAtividade(a: any): Activity {
  return {
    id: a.id, name: a.nome, responsible: a.responsavel ?? '', plannedDate: a.data_planejada ?? '',
    startDate: a.data_inicio ?? null, conclusionDate: a.data_conclusao ?? null,
    progress: n2(a.progresso), status: a.status as ActivityStatus, observations: a.observacoes ?? '',
  };
}
function mapEntrega(e: any): Deliverable {
  return {
    id: e.id, name: e.nome, expectedResult: e.resultado_esperado ?? '',
    // Soft-deleted (excluido_em preenchido) não aparece mais na UI, mas continua no banco.
    activities: (e.atividades ?? []).filter((a: any) => !a.excluido_em).map(mapAtividade),
  };
}
function mapMeta(m: any): Goal {
  return { id: m.id, name: m.nome, deliverables: (m.entregas ?? []).map(mapEntrega) };
}
function mapRisco(r: any): Risk {
  return {
    id: r.id, description: r.descricao, category: r.categoria ?? '', probability: n2(r.probabilidade),
    impact: n2(r.impacto), severity: n2(r.severidade), responseStrategy: r.estrategia_mitigacao ?? '',
    responsible: r.responsavel ?? '', status: r.status, goalId: r.meta_id ?? undefined,
    stage: r.etapa_nome_legado ?? undefined, spec: r.especificacao_legado ?? undefined,
  };
}
function mapMudanca(c: any): Change {
  return {
    id: c.id, description: c.descricao, type: c.tipo, date: c.data ?? '', justification: c.justificativa ?? '',
    approval: c.aprovacao, responsible: c.responsavel ?? '', goalId: c.meta_id ?? undefined,
    nature: c.natureza ?? undefined,
  };
}
function mapFinanceiro(i: any): FinancialItem {
  return {
    id: i.id, meta: i.meta_texto ?? '', category: i.categoria ?? '', relatedGoal: i.meta_texto ?? '',
    item: i.item, qtd: n2(i.qtd), unidade: i.unidade ?? '', qtdUnidades: n2(i.qtd_unidades),
    valorUnitario: n2(i.valor_unitario), plannedValue: n2(i.valor_planejado), executedValue: n2(i.valor_executado),
    date: i.data ?? '', supplier: i.fornecedor ?? '', document: i.documento ?? '',
    executedFlag: i.executado_flag ?? undefined, accountability: i.prestacao_contas ?? undefined,
    changeRecord: i.registro_alteracao ?? undefined,
  };
}
function mapContrapartida(c: any): ContrapartidaItem {
  return {
    id: c.id, meta: c.meta_texto ?? '', descricao: c.descricao, tipo: c.tipo,
    quantidade: n2(c.quantidade), unidade: c.unidade ?? '', valorUnitario: n2(c.valor_unitario),
  };
}
function mapEvidencia(e: any): Evidence {
  return { id: e.id, name: e.nome, type: e.tipo, relatedActivity: e.atividade_relacionada ?? '', uploadDate: e.data_upload ?? '', size: e.tamanho ?? '' };
}
function mapAporte(a: any): Aporte {
  return { id: a.id, data: a.data, tipo: a.tipo, origem: a.origem ?? '', descricao: a.descricao ?? '', valor: n2(a.valor), registradoPor: a.registrado_por ?? undefined };
}
function mapContato(c: any): Contact {
  return { id: c.id, name: c.nome, role: c.cargo ?? '', org: c.organizacao ?? '', phone: c.telefone ?? '', email: c.email ?? '', notes: c.notas ?? '' };
}
function mapCommLog(c: any): CommLog {
  return { id: c.id, data: c.data, hora: c.hora ?? '', instituicao: c.instituicao ?? '', representante: c.representante ?? '', meio: c.meio ?? '', quemRealizou: c.quem_realizou ?? '', registro: c.registro ?? '', saida: c.retorno ?? '' };
}
function mapMetaLog(l: any): MetaChangeLog {
  return { id: l.id, entity: l.entidade, action: l.acao, targetId: l.target_id ?? undefined, parentId: l.parent_id ?? undefined, targetPath: l.target_path, field: l.campo ?? undefined, from: l.de_valor ?? undefined, to: l.para_valor ?? undefined, payload: l.payload ?? undefined, author: l.autor, authorRole: l.autor_papel, date: l.data, approvedBy: l.aprovado_por ?? null };
}
function mapAprovacao(a: any): PendingApproval {
  return { id: a.id, entity: a.entidade, action: a.acao, targetId: a.target_id ?? undefined, parentId: a.parent_id ?? undefined, targetPath: a.target_path, field: a.campo ?? undefined, from: a.de_valor ?? undefined, to: a.para_valor ?? undefined, payload: a.payload ?? undefined, author: a.autor, authorRole: a.autor_papel, date: a.data, status: a.status, reviewedBy: a.revisado_por ?? null };
}

function mapProjeto(row: any): ProjectExt {
  const metas: Goal[] = (row.metas ?? []).map(mapMeta);
  const financeiro: FinancialItem[] = (row.orcamento_itens ?? []).map(mapFinanceiro);
  const allActivities = metas.flatMap(g => g.deliverables.flatMap(d => d.activities));
  const progress = allActivities.length
    ? Math.round(allActivities.reduce((a, x) => a + x.progress, 0) / allActivities.length)
    : n2(row.progresso);
  const budgetExecuted = financeiro.length
    ? financeiro.reduce((a, i) => a + i.executedValue, 0)
    : n2(row.orcamento_executado);

  const plano: PlanoTrabalho = {
    problematica: row.problematica ?? undefined, justificativa: row.justificativa ?? undefined,
    localizacaoAbrangencia: row.localizacao_abrangencia ?? undefined, diversidade: row.diversidade ?? undefined,
    saberesLocais: row.saberes_locais ?? undefined, experienciaPrevia: row.experiencia_previa ?? undefined,
    capacidadeTecnica: row.capacidade_tecnica ?? undefined, estrategia: row.estrategia ?? undefined,
    cronogramaFisico: row.cronograma_fisico ?? undefined, detalhamentoRecursos: row.detalhamento_recursos ?? undefined,
    contrapartida: row.contrapartida ?? undefined, justificativaContrapartida: row.justificativa_contrapartida ?? undefined,
    resultadosImpactos: row.resultados_impactos ?? undefined, publicoAlvo: row.publico_alvo ?? undefined,
    beneficiadosDiretos: row.beneficiados_diretos ?? undefined, beneficiadosIndiretos: row.beneficiados_indiretos ?? undefined,
    formaAcompanhamento: row.forma_acompanhamento ?? undefined, potencialReplicabilidade: row.potencial_replicabilidade ?? undefined,
    potencialAmpliacao: row.potencial_ampliacao ?? undefined, pilares: row.pilares ?? undefined,
    metasTexto: row.metas_texto ?? undefined, detalhamentoPlano: row.detalhamento_plano ?? undefined,
    compradores: row.compradores ?? undefined, garantiaVenda: row.garantia_venda ?? undefined,
    destinacao: row.destinacao ?? undefined, ativacoes: row.ativacoes ?? undefined,
    oportunidades: row.oportunidades ?? undefined, receitaFaixa: row.receita_faixa ?? undefined,
    valorRepasse: row.valor_repasse ?? undefined, formaRepasse: row.forma_repasse ?? undefined,
    statusRepasse: row.status_repasse ?? undefined, dataRepasse: row.data_repasse ?? undefined,
    observacoes: row.observacoes ?? undefined, planoArquivo: row.plano_arquivo ?? undefined,
  };

  return {
    id: row.id, name: row.nome, code: row.code, coordinator: row.coordenador ?? '',
    team: (row.projeto_equipe ?? []).map((e: any) => e.nome),
    financier: row.financiador ?? '', objective: row.objetivo ?? '', startDate: row.data_inicio ?? '',
    endDate: row.data_fim ?? '', status: row.status, progress, budgetApproved: n2(row.orcamento_aprovado),
    budgetExecuted, riskLevel: row.nivel_risco,
    goals: metas, financialItems: financeiro,
    contrapartidas: (row.orcamento_contrapartidas ?? []).map(mapContrapartida),
    risks: (row.plano_riscos ?? []).map(mapRisco),
    changes: (row.mudancas ?? []).map(mapMudanca),
    evidences: (row.evidencias ?? []).map(mapEvidencia),
    communityId: null,
    org: row.org ?? undefined, segmento: row.segmento ?? undefined, plano,
    driveLink: row.drive_link ?? undefined, budgetLink: row.budget_link ?? undefined, termoFomentoLink: row.termo_fomento_link ?? undefined,
    contacts: (row.contatos ?? []).map(mapContato),
    metaLog: (row.log_alteracoes_meta ?? []).map(mapMetaLog),
    approvals: (row.aprovacoes_pendentes ?? []).map(mapAprovacao),
    aportes: (row.aportes ?? []).map(mapAporte),
    commLogs: (row.logs_comunicacao ?? []).map(mapCommLog),
  };
}

const SELECT_PROJETO = `
  *,
  projeto_equipe(nome),
  metas(id, nome, entregas(id, nome, resultado_esperado, atividades(*))),
  plano_riscos(*), mudancas(*), orcamento_itens(*), orcamento_contrapartidas(*),
  evidencias(*), aportes(*), contatos(*), logs_comunicacao(*),
  log_alteracoes_meta(*), aprovacoes_pendentes(*)
`;

export const listarProjetos = createServerFn({ method: 'GET' }).handler(async (): Promise<ProjectExt[]> => {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin
    .from('projetos')
    .select(SELECT_PROJETO)
    .order('id')
    .order('ordem', { referencedTable: 'metas' })
    .order('ordem', { referencedTable: 'metas.entregas' })
    .order('ordem', { referencedTable: 'metas.entregas.atividades' });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProjeto);
});

export const criarProjeto = createServerFn({ method: 'POST' })
  .validator((d: Partial<ProjectExt> & { team?: string[] }) => d)
  .handler(async ({ data }): Promise<ProjectExt> => {
    const supabaseAdmin = await getAdmin();
    const year = new Date().getFullYear();
    const { data: existing } = await supabaseAdmin.from('projetos').select('code').ilike('code', `%-${year}`);
    const seq = (existing?.length ?? 0) + 1;
    const code = `${String(seq).padStart(2, '0')}-${year}`;

    const { data: row, error } = await supabaseAdmin
      .from('projetos')
      .insert({
        nome: data.name ?? 'Novo projeto', code, org: data.org ?? null, segmento: data.segmento ?? null,
        coordenador: data.coordinator ?? null, financiador: data.financier ?? null, objetivo: data.objective ?? null,
        data_inicio: data.startDate ?? null, data_fim: data.endDate ?? null, status: data.status ?? 'Não iniciado',
        orcamento_aprovado: data.budgetApproved ?? 0, nivel_risco: data.riskLevel ?? '—',
        drive_link: data.driveLink ?? null, budget_link: data.budgetLink ?? null, termo_fomento_link: data.termoFomentoLink ?? null,
      })
      .select(SELECT_PROJETO)
      .single();
    if (error) throw new Error(error.message);

    if (data.team?.length) {
      const { error: eqError } = await supabaseAdmin.from('projeto_equipe').insert(data.team.map(nome => ({ projeto_id: row.id, nome })));
      if (eqError) throw new Error(eqError.message);
      row.projeto_equipe = data.team.map(nome => ({ nome }));
    }
    return mapProjeto(row);
  });

const PLANO_COLUMNS: Record<keyof PlanoTrabalho, string> = {
  problematica: 'problematica', justificativa: 'justificativa', localizacaoAbrangencia: 'localizacao_abrangencia',
  diversidade: 'diversidade', saberesLocais: 'saberes_locais', experienciaPrevia: 'experiencia_previa',
  capacidadeTecnica: 'capacidade_tecnica', estrategia: 'estrategia', cronogramaFisico: 'cronograma_fisico',
  detalhamentoRecursos: 'detalhamento_recursos', contrapartida: 'contrapartida',
  justificativaContrapartida: 'justificativa_contrapartida', resultadosImpactos: 'resultados_impactos',
  publicoAlvo: 'publico_alvo', beneficiadosDiretos: 'beneficiados_diretos', beneficiadosIndiretos: 'beneficiados_indiretos',
  formaAcompanhamento: 'forma_acompanhamento', potencialReplicabilidade: 'potencial_replicabilidade',
  potencialAmpliacao: 'potencial_ampliacao', pilares: 'pilares', metasTexto: 'metas_texto',
  detalhamentoPlano: 'detalhamento_plano', compradores: 'compradores', garantiaVenda: 'garantia_venda',
  destinacao: 'destinacao', ativacoes: 'ativacoes', oportunidades: 'oportunidades', receitaFaixa: 'receita_faixa',
  valorRepasse: 'valor_repasse', formaRepasse: 'forma_repasse', statusRepasse: 'status_repasse',
  dataRepasse: 'data_repasse', observacoes: 'observacoes', planoArquivo: 'plano_arquivo',
};

export const atualizarProjeto = createServerFn({ method: 'POST' })
  .validator((d: { id: number; patch: Partial<ProjectExt> }) => d)
  .handler(async ({ data: { id, patch } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.nome = patch.name;
    if (patch.org !== undefined) row.org = patch.org;
    if (patch.segmento !== undefined) row.segmento = patch.segmento;
    if (patch.coordinator !== undefined) row.coordenador = patch.coordinator;
    if (patch.financier !== undefined) row.financiador = patch.financier;
    if (patch.objective !== undefined) row.objetivo = patch.objective;
    if (patch.startDate !== undefined) row.data_inicio = patch.startDate;
    if (patch.endDate !== undefined) row.data_fim = patch.endDate;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.budgetApproved !== undefined) row.orcamento_aprovado = patch.budgetApproved;
    if (patch.riskLevel !== undefined) row.nivel_risco = patch.riskLevel;
    if (patch.driveLink !== undefined) row.drive_link = patch.driveLink;
    if (patch.budgetLink !== undefined) row.budget_link = patch.budgetLink;
    if (patch.termoFomentoLink !== undefined) row.termo_fomento_link = patch.termoFomentoLink;
    if (patch.plano) {
      for (const [key, col] of Object.entries(PLANO_COLUMNS)) {
        const v = (patch.plano as Record<string, unknown>)[key];
        if (v !== undefined) row[col] = v;
      }
    }
    if (Object.keys(row).length) {
      const { error } = await supabaseAdmin.from('projetos').update(row).eq('id', id);
      if (error) throw new Error(error.message);
    }
    if (patch.team !== undefined) {
      const { error: delError } = await supabaseAdmin.from('projeto_equipe').delete().eq('projeto_id', id);
      if (delError) throw new Error(delError.message);
      if (patch.team.length) {
        const { error: insError } = await supabaseAdmin.from('projeto_equipe').insert(patch.team.map(nome => ({ projeto_id: id, nome })));
        if (insError) throw new Error(insError.message);
      }
    }
  });

export const excluirProjeto = createServerFn({ method: 'POST' })
  .validator((d: { id: number }) => d)
  .handler(async ({ data: { id } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('projetos').delete().eq('id', id);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Metas / etapas / especificações / riscos / mudanças / financeiro — o
// "motor" genérico por trás de submitMetaEdit, portado de data/projectOps.ts
// (que operava em memória) para operações SQL diretas.
// ---------------------------------------------------------------------------
function lineTotal(qtd: number, qtdUnidades: number, valorUnitario: number) {
  return qtd * qtdUnidades * valorUnitario;
}

/**
 * Calcula a `ordem` de um novo irmão dentro de uma lista (Meta/Etapa/Atividade),
 * permitindo inserir "no meio" sem reindexar nada: usa o ponto médio entre o
 * irmão indicado (`afterId`) e o próximo, ou +1 se for o último/não houver
 * próximo. Sem `afterId`, insere no fim (max(ordem) + 1).
 */
async function computeOrdemInsercao(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  tabela: 'metas' | 'entregas' | 'atividades',
  colunaPai: 'projeto_id' | 'meta_id' | 'entrega_id',
  paiId: string | number,
  afterId?: string,
): Promise<number> {
  const { data: irmaos, error } = await supabaseAdmin.from(tabela).select('id, ordem').eq(colunaPai, paiId).order('ordem');
  if (error) throw new Error(error.message);
  const lista = irmaos ?? [];
  if (!afterId) return lista.length ? Math.max(...lista.map(i => Number(i.ordem))) + 1 : 1;
  const idx = lista.findIndex(i => i.id === afterId);
  if (idx === -1 || idx === lista.length - 1) {
    return lista.length ? Math.max(...lista.map(i => Number(i.ordem))) + 1 : 1;
  }
  return (Number(lista[idx].ordem) + Number(lista[idx + 1].ordem)) / 2;
}

async function aplicarOperacaoSql(supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>, projetoId: number, op: ProjectOp): Promise<void> {
  const field = op.field ?? 'nome';
  const to = op.to ?? '';
  const payload = (op.payload ?? {}) as Record<string, unknown>;

  switch (op.entity) {
    case 'meta': {
      if (op.action === 'criar') {
        const ordem = await computeOrdemInsercao(supabaseAdmin, 'metas', 'projeto_id', projetoId, str(payload.afterId, '') || undefined);
        const { error } = await supabaseAdmin.from('metas').insert({ projeto_id: projetoId, nome: str(payload.name, to || 'Nova meta'), ordem });
        if (error) throw new Error(error.message);
      } else if (op.action === 'excluir') {
        const { error } = await supabaseAdmin.from('metas').delete().eq('id', op.targetId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabaseAdmin.from('metas').update({ nome: to }).eq('id', op.targetId);
        if (error) throw new Error(error.message);
      }
      return;
    }
    case 'etapa': {
      if (op.action === 'criar') {
        const ordem = await computeOrdemInsercao(supabaseAdmin, 'entregas', 'meta_id', op.parentId!, str(payload.afterId, '') || undefined);
        const { error } = await supabaseAdmin.from('entregas').insert({
          meta_id: op.parentId, nome: str(payload.name, to || 'Nova etapa'), resultado_esperado: str(payload.expectedResult, ''), ordem,
        });
        if (error) throw new Error(error.message);
      } else if (op.action === 'excluir') {
        const { error } = await supabaseAdmin.from('entregas').delete().eq('id', op.targetId);
        if (error) throw new Error(error.message);
      } else {
        const col = field === 'resultado esperado' ? 'resultado_esperado' : 'nome';
        const { error } = await supabaseAdmin.from('entregas').update({ [col]: to }).eq('id', op.targetId);
        if (error) throw new Error(error.message);
      }
      return;
    }
    case 'especificacao': {
      if (op.action === 'criar') {
        const ordem = await computeOrdemInsercao(supabaseAdmin, 'atividades', 'entrega_id', op.parentId!, str(payload.afterId, '') || undefined);
        const { error } = await supabaseAdmin.from('atividades').insert({
          entrega_id: op.parentId, nome: str(payload.name, to || 'Nova atividade'), responsavel: str(payload.responsible, '') || null,
          data_planejada: str(payload.plannedDate, '') || null,
          data_inicio: payload.startDate ? String(payload.startDate) : null,
          data_conclusao: payload.conclusionDate ? String(payload.conclusionDate) : null,
          progresso: num(payload.progress, 0), status: str(payload.status, 'Não iniciado'),
          observacoes: str(payload.observations, '') || null, ordem,
        });
        if (error) throw new Error(error.message);
        return;
      }
      if (op.action === 'excluir') {
        // Soft delete: preserva o registro pra histórico/auditoria, some da UI (mapEntrega filtra excluido_em).
        const { error } = await supabaseAdmin.from('atividades').update({ excluido_em: new Date().toISOString() }).eq('id', op.targetId);
        if (error) throw new Error(error.message);
        return;
      }
      const patch: Record<string, unknown> = {};
      switch (field) {
        case 'status': {
          const status = to as ActivityStatus;
          const { data: current } = await supabaseAdmin.from('atividades').select('progresso, data_inicio, data_conclusao').eq('id', op.targetId).single();
          const curProgress = n2(current?.progresso);
          patch.status = status;
          patch.progresso = status === 'Concluído' ? 100 : status === 'Em andamento' ? (curProgress > 0 && curProgress < 100 ? curProgress : 50) : 0;
          patch.data_inicio = status === 'Não iniciado' ? null : (current?.data_inicio || new Date().toLocaleDateString('pt-BR'));
          patch.data_conclusao = status === 'Concluído' ? (current?.data_conclusao || new Date().toLocaleDateString('pt-BR')) : null;
          break;
        }
        case 'progresso': patch.progresso = Math.max(0, Math.min(100, Number(to) || 0)); break;
        case 'responsável': patch.responsavel = to; break;
        case 'início': patch.data_inicio = to || null; break;
        case 'conclusão': patch.data_conclusao = to || null; break;
        case 'previsto': patch.data_planejada = to; break;
        case 'observações': patch.observacoes = to; break;
        default: patch.nome = to; break;
      }
      const { error } = await supabaseAdmin.from('atividades').update(patch).eq('id', op.targetId);
      if (error) throw new Error(error.message);
      return;
    }
    case 'risco': {
      if (op.action === 'criar') {
        const prob = num(payload.probability, 3);
        const imp = num(payload.impact, 3);
        const { error } = await supabaseAdmin.from('plano_riscos').insert({
          projeto_id: projetoId, meta_id: payload.goalId ? String(payload.goalId) : null,
          descricao: str(payload.description), categoria: str(payload.category, 'Operacional'),
          probabilidade: prob, impacto: imp, estrategia_mitigacao: str(payload.responseStrategy),
          responsavel: str(payload.responsible), status: str(payload.status, 'Aberto'),
        });
        if (error) throw new Error(error.message);
        return;
      }
      if (op.action === 'excluir') {
        const { error } = await supabaseAdmin.from('plano_riscos').delete().eq('id', op.targetId);
        if (error) throw new Error(error.message);
        return;
      }
      const patch: Record<string, unknown> = {};
      switch (field) {
        case 'descrição': patch.descricao = to; break;
        case 'categoria': patch.categoria = to; break;
        case 'probabilidade': patch.probabilidade = Math.max(1, Math.min(5, Number(to) || 1)); break;
        case 'impacto': patch.impacto = Math.max(1, Math.min(5, Number(to) || 1)); break;
        case 'estratégia': patch.estrategia_mitigacao = to; break;
        case 'responsável': patch.responsavel = to; break;
        case 'status': patch.status = to; break;
        case 'meta': patch.meta_id = to || null; break;
        default: break;
      }
      const { error } = await supabaseAdmin.from('plano_riscos').update(patch).eq('id', op.targetId);
      if (error) throw new Error(error.message);
      return;
    }
    case 'mudanca': {
      if (op.action === 'criar') {
        const { error } = await supabaseAdmin.from('mudancas').insert({
          projeto_id: projetoId, meta_id: payload.goalId ? String(payload.goalId) : null,
          descricao: str(payload.description), tipo: str(payload.type, 'Escopo'),
          data: str(payload.date, new Date().toLocaleDateString('pt-BR')), justificativa: str(payload.justification),
          aprovacao: str(payload.approval, 'Pendente'), responsavel: str(payload.responsible),
          natureza: payload.nature ? String(payload.nature) : null,
        });
        if (error) throw new Error(error.message);
        return;
      }
      if (op.action === 'excluir') {
        const { error } = await supabaseAdmin.from('mudancas').delete().eq('id', op.targetId);
        if (error) throw new Error(error.message);
        return;
      }
      const patch: Record<string, unknown> = {};
      switch (field) {
        case 'descrição': patch.descricao = to; break;
        case 'tipo': patch.tipo = to; break;
        case 'data': patch.data = to; break;
        case 'justificativa': patch.justificativa = to; break;
        case 'aprovação': patch.aprovacao = to; break;
        case 'responsável': patch.responsavel = to; break;
        case 'natureza': patch.natureza = to; break;
        case 'meta': patch.meta_id = to || null; break;
        default: break;
      }
      const { error } = await supabaseAdmin.from('mudancas').update(patch).eq('id', op.targetId);
      if (error) throw new Error(error.message);
      return;
    }
    case 'financeiro': {
      if (op.action === 'criar') {
        const qtd = num(payload.qtd, 1);
        const qtdUnidades = num(payload.qtdUnidades, 1);
        const valorUnitario = num(payload.valorUnitario, 0);
        const total = lineTotal(qtd, qtdUnidades, valorUnitario);
        const flag = str(payload.executedFlag, 'Não');
        const { error } = await supabaseAdmin.from('orcamento_itens').insert({
          projeto_id: projetoId, meta_texto: str(payload.meta, 'Meta 1'), categoria: str(payload.category, 'Materiais de consumo'),
          item: str(payload.item), unidade: str(payload.unidade, 'unidade'), qtd, qtd_unidades: qtdUnidades, valor_unitario: valorUnitario,
          valor_executado: flag === 'Sim' ? total : num(payload.executedValue, 0), data: str(payload.date) || null,
          fornecedor: str(payload.supplier) || null, documento: str(payload.document) || null, executado_flag: flag,
          prestacao_contas: str(payload.accountability, 'Não enviado'), registro_alteracao: str(payload.changeRecord, 'Novo item'),
        });
        if (error) throw new Error(error.message);
        return;
      }
      if (op.action === 'excluir') {
        const { error } = await supabaseAdmin.from('orcamento_itens').delete().eq('id', op.targetId);
        if (error) throw new Error(error.message);
        return;
      }
      const patch: Record<string, unknown> = {};
      switch (field) {
        case 'categoria': patch.categoria = to; break;
        case 'descrição': patch.item = to; break;
        case 'meta': patch.meta_texto = to; break;
        case 'qtd': patch.qtd = Number(to) || 0; break;
        case 'unidade': patch.unidade = to; break;
        case 'qtd. de unidades': patch.qtd_unidades = Number(to) || 0; break;
        case 'valor unitário': patch.valor_unitario = Number(to) || 0; break;
        case 'valor executado': patch.valor_executado = Number(to) || 0; break;
        case 'executado': patch.executado_flag = to; break;
        case 'prestação de contas': patch.prestacao_contas = to; break;
        case 'registro de alterações': patch.registro_alteracao = to; break;
        case 'fornecedor': patch.fornecedor = to; break;
        case 'documento': patch.documento = to; break;
        case 'data': patch.data = to; break;
        default: break;
      }
      const { data: updated, error } = await supabaseAdmin.from('orcamento_itens').update(patch).eq('id', op.targetId).select('valor_planejado, executado_flag, valor_executado').single();
      if (error) throw new Error(error.message);
      if (field === 'executado') {
        const planejado = n2(updated?.valor_planejado);
        if (to === 'Sim') await supabaseAdmin.from('orcamento_itens').update({ valor_executado: planejado }).eq('id', op.targetId);
        if (to === 'Não') await supabaseAdmin.from('orcamento_itens').update({ valor_executado: 0 }).eq('id', op.targetId);
      } else if (field === 'valor executado' && updated?.executado_flag !== 'Parcial' && n2(updated?.valor_executado) !== n2(updated?.valor_planejado)) {
        await supabaseAdmin.from('orcamento_itens').update({ executado_flag: n2(updated?.valor_executado) === 0 ? 'Não' : 'Parcial' }).eq('id', op.targetId);
      }
      return;
    }
    default:
      return;
  }
}

function resumoOp(edit: ProjectOp): string {
  const acao = edit.action === 'criar' ? 'Criar' : edit.action === 'excluir' ? 'Excluir' : 'Editar';
  const campo = edit.field ? ` · ${edit.field}` : '';
  const valores = edit.action === 'editar' ? `: ${edit.from ?? '—'} → ${edit.to ?? '—'}` : '';
  return `${acao} · ${edit.entity}${campo} · ${edit.targetPath}${valores}`;
}

export const submeterEdicaoMeta = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; edit: ProjectOp; author: EditAuthor }) => d)
  .handler(async ({ data: { projectId, edit, author } }): Promise<'aplicado' | 'pendente'> => {
    const supabaseAdmin = await getAdmin();
    if (!author.isAdmin) {
      const { error } = await supabaseAdmin.from('aprovacoes_pendentes').insert({
        projeto_id: projectId, entidade: edit.entity, acao: edit.action, target_id: edit.targetId ?? null,
        parent_id: edit.parentId ?? null, target_path: edit.targetPath, campo: edit.field ?? null,
        de_valor: edit.from ?? null, para_valor: edit.to ?? null, payload: edit.payload ?? null,
        autor: author.name, autor_papel: author.role, status: 'Pendente',
      });
      if (error) throw new Error(error.message);
      try {
        const { data: proj } = await supabaseAdmin.from('projetos').select('nome').eq('id', projectId).single();
        const { avisarNovaSolicitacao } = await import('./usuarios.server');
        await avisarNovaSolicitacao({ data: { autorNome: author.name, projetoNome: proj?.nome ?? '—', resumo: resumoOp(edit) } });
      } catch (e) { console.error('[email] falha ao avisar admins:', e); }
      return 'pendente';
    }
    await aplicarOperacaoSql(supabaseAdmin, projectId, edit);
    const { error: logError } = await supabaseAdmin.from('log_alteracoes_meta').insert({
      projeto_id: projectId, entidade: edit.entity, acao: edit.action, target_id: edit.targetId ?? null,
      parent_id: edit.parentId ?? null, target_path: edit.targetPath, campo: edit.field ?? null,
      de_valor: edit.from ?? null, para_valor: edit.to ?? null, payload: edit.payload ?? null,
      autor: author.name, autor_papel: author.role, aprovado_por: author.name,
    });
    if (logError) throw new Error(logError.message);
    return 'aplicado';
  });

export const aprovarEdicaoMeta = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; approvalId: string; adminName: string }) => d)
  .handler(async ({ data: { projectId, approvalId, adminName } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { data: req, error: reqError } = await supabaseAdmin.from('aprovacoes_pendentes').select('*').eq('id', approvalId).single();
    if (reqError) throw new Error(reqError.message);
    const edit: ProjectOp = {
      entity: req.entidade, action: req.acao, targetId: req.target_id ?? undefined, parentId: req.parent_id ?? undefined,
      targetPath: req.target_path, field: req.campo ?? undefined, from: req.de_valor ?? undefined,
      to: req.para_valor ?? undefined, payload: req.payload ?? undefined,
    };
    await aplicarOperacaoSql(supabaseAdmin, projectId, edit);
    const { error: logError } = await supabaseAdmin.from('log_alteracoes_meta').insert({
      projeto_id: projectId, entidade: edit.entity, acao: edit.action, target_id: edit.targetId ?? null,
      parent_id: edit.parentId ?? null, target_path: edit.targetPath, campo: edit.field ?? null,
      de_valor: edit.from ?? null, para_valor: edit.to ?? null, payload: edit.payload ?? null,
      autor: req.autor, autor_papel: req.autor_papel, aprovado_por: adminName,
    });
    if (logError) throw new Error(logError.message);
    const { error: updError } = await supabaseAdmin.from('aprovacoes_pendentes').update({ status: 'Aprovado', revisado_por: adminName }).eq('id', approvalId);
    if (updError) throw new Error(updError.message);
    try {
      const { data: proj } = await supabaseAdmin.from('projetos').select('nome').eq('id', projectId).single();
      const { avisarSolicitacaoDecidida } = await import('./usuarios.server');
      await avisarSolicitacaoDecidida({ data: { autorNome: req.autor, aprovado: true, projetoNome: proj?.nome ?? '—', resumo: resumoOp(edit), revisadoPor: adminName } });
    } catch (e) { console.error('[email] falha ao avisar autor:', e); }
  });

export const rejeitarEdicaoMeta = createServerFn({ method: 'POST' })
  .validator((d: { approvalId: string; adminName: string }) => d)
  .handler(async ({ data: { approvalId, adminName } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { data: req, error: reqError } = await supabaseAdmin.from('aprovacoes_pendentes').select('*').eq('id', approvalId).single();
    if (reqError) throw new Error(reqError.message);
    const { error } = await supabaseAdmin.from('aprovacoes_pendentes').update({ status: 'Recusado', revisado_por: adminName }).eq('id', approvalId);
    if (error) throw new Error(error.message);
    try {
      const edit: ProjectOp = {
        entity: req.entidade, action: req.acao, targetPath: req.target_path, field: req.campo ?? undefined,
        from: req.de_valor ?? undefined, to: req.para_valor ?? undefined,
      };
      const { data: proj } = await supabaseAdmin.from('projetos').select('nome').eq('id', req.projeto_id).single();
      const { avisarSolicitacaoDecidida } = await import('./usuarios.server');
      await avisarSolicitacaoDecidida({ data: { autorNome: req.autor, aprovado: false, projetoNome: proj?.nome ?? '—', resumo: resumoOp(edit), revisadoPor: adminName } });
    } catch (e) { console.error('[email] falha ao avisar autor:', e); }
  });

// ---------------------------------------------------------------------------
// Mutadores diretos legados (sem fluxo de aprovação) — riscos/mudanças/
// financeiro criados fora do fluxo de metas, e status de atividade.
// ---------------------------------------------------------------------------
export const addRisco = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; risco: Omit<Risk, 'id' | 'severity'> }) => d)
  .handler(async ({ data: { projectId, risco } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('plano_riscos').insert({
      projeto_id: projectId, meta_id: risco.goalId ?? null, descricao: risco.description, categoria: risco.category,
      probabilidade: risco.probability, impacto: risco.impact, estrategia_mitigacao: risco.responseStrategy,
      responsavel: risco.responsible, status: risco.status, etapa_nome_legado: risco.stage ?? null, especificacao_legado: risco.spec ?? null,
    });
    if (error) throw new Error(error.message);
  });

export const deleteRisco = createServerFn({ method: 'POST' })
  .validator((d: { riskId: string }) => d)
  .handler(async ({ data: { riskId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('plano_riscos').delete().eq('id', riskId);
    if (error) throw new Error(error.message);
  });

export const addMudanca = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; mudanca: Omit<Change, 'id'> }) => d)
  .handler(async ({ data: { projectId, mudanca } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('mudancas').insert({
      projeto_id: projectId, meta_id: mudanca.goalId ?? null, descricao: mudanca.description, tipo: mudanca.type,
      data: mudanca.date, justificativa: mudanca.justification, aprovacao: mudanca.approval,
      responsavel: mudanca.responsible, natureza: mudanca.nature ?? null,
    });
    if (error) throw new Error(error.message);
  });

export const updateMudancaAprovacao = createServerFn({ method: 'POST' })
  .validator((d: { changeId: string; approval: Change['approval'] }) => d)
  .handler(async ({ data: { changeId, approval } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('mudancas').update({ aprovacao: approval }).eq('id', changeId);
    if (error) throw new Error(error.message);
  });

export const deleteMudanca = createServerFn({ method: 'POST' })
  .validator((d: { changeId: string }) => d)
  .handler(async ({ data: { changeId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('mudancas').delete().eq('id', changeId);
    if (error) throw new Error(error.message);
  });

export const addFinanceiro = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; item: Omit<FinancialItem, 'id'> }) => d)
  .handler(async ({ data: { projectId, item } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('orcamento_itens').insert({
      projeto_id: projectId, meta_texto: item.meta, categoria: item.category, item: item.item, qtd: item.qtd,
      unidade: item.unidade, qtd_unidades: item.qtdUnidades, valor_unitario: item.valorUnitario,
      valor_executado: item.executedValue, data: item.date || null, fornecedor: item.supplier || null,
      documento: item.document || null, executado_flag: item.executedFlag ?? null,
      prestacao_contas: item.accountability ?? null, registro_alteracao: item.changeRecord ?? null,
    });
    if (error) throw new Error(error.message);
  });

export const updateFinanceiroExecutado = createServerFn({ method: 'POST' })
  .validator((d: { itemId: string; executedValue: number; date?: string; supplier?: string; document?: string }) => d)
  .handler(async ({ data: { itemId, executedValue, date, supplier, document } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const patch: Record<string, unknown> = { valor_executado: executedValue };
    if (date !== undefined) patch.data = date;
    if (supplier !== undefined) patch.fornecedor = supplier;
    if (document !== undefined) patch.documento = document;
    const { error } = await supabaseAdmin.from('orcamento_itens').update(patch).eq('id', itemId);
    if (error) throw new Error(error.message);
  });

export const deleteFinanceiro = createServerFn({ method: 'POST' })
  .validator((d: { itemId: string }) => d)
  .handler(async ({ data: { itemId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('orcamento_itens').delete().eq('id', itemId);
    if (error) throw new Error(error.message);
  });

export const addContrapartida = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; item: Omit<ContrapartidaItem, 'id'> }) => d)
  .handler(async ({ data: { projectId, item } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('orcamento_contrapartidas').insert({
      projeto_id: projectId, meta_texto: item.meta, descricao: item.descricao, tipo: item.tipo,
      quantidade: item.quantidade, unidade: item.unidade, valor_unitario: item.valorUnitario,
    });
    if (error) throw new Error(error.message);
  });

export const deleteContrapartida = createServerFn({ method: 'POST' })
  .validator((d: { itemId: string }) => d)
  .handler(async ({ data: { itemId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('orcamento_contrapartidas').delete().eq('id', itemId);
    if (error) throw new Error(error.message);
  });

export const addEvidencia = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; evidencia: Omit<Evidence, 'id'> }) => d)
  .handler(async ({ data: { projectId, evidencia } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('evidencias').insert({
      projeto_id: projectId, nome: evidencia.name, tipo: evidencia.type,
      atividade_relacionada: evidencia.relatedActivity || null, data_upload: evidencia.uploadDate || null, tamanho: evidencia.size || null,
    });
    if (error) throw new Error(error.message);
  });

export const deleteEvidencia = createServerFn({ method: 'POST' })
  .validator((d: { evidenciaId: string }) => d)
  .handler(async ({ data: { evidenciaId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('evidencias').delete().eq('id', evidenciaId);
    if (error) throw new Error(error.message);
  });

export const updateAtividadeStatus = createServerFn({ method: 'POST' })
  .validator((d: { activityId: string; status: ActivityStatus; progress?: number }) => d)
  .handler(async ({ data: { activityId, status, progress } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const patch: Record<string, unknown> = {
      status, progresso: progress ?? (status === 'Concluído' ? 100 : status === 'Não iniciado' ? 0 : undefined),
    };
    if (status === 'Concluído') patch.data_conclusao = new Date().toLocaleDateString('pt-BR');
    if (patch.progresso === undefined) delete patch.progresso;
    const { error } = await supabaseAdmin.from('atividades').update(patch).eq('id', activityId);
    if (error) throw new Error(error.message);
  });

export const addAporte = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; aporte: Omit<Aporte, 'id'> }) => d)
  .handler(async ({ data: { projectId, aporte } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('aportes').insert({
      projeto_id: projectId, data: aporte.data, tipo: aporte.tipo, origem: aporte.origem || null,
      descricao: aporte.descricao || null, valor: aporte.valor, registrado_por: aporte.registradoPor ?? null,
    });
    if (error) throw new Error(error.message);
  });

export const deleteAporte = createServerFn({ method: 'POST' })
  .validator((d: { aporteId: string }) => d)
  .handler(async ({ data: { aporteId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('aportes').delete().eq('id', aporteId);
    if (error) throw new Error(error.message);
  });

export const addCommLog = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; log: Omit<CommLog, 'id'> }) => d)
  .handler(async ({ data: { projectId, log } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('logs_comunicacao').insert({
      projeto_id: projectId, data: log.data, hora: log.hora || null, instituicao: log.instituicao || null,
      representante: log.representante || null, meio: log.meio, quem_realizou: log.quemRealizou || null,
      registro: log.registro || null, retorno: log.saida || null,
    });
    if (error) throw new Error(error.message);
  });

export const updateCommLog = createServerFn({ method: 'POST' })
  .validator((d: { logId: string; patch: Partial<CommLog> }) => d)
  .handler(async ({ data: { logId, patch } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const row: Record<string, unknown> = {};
    if (patch.data !== undefined) row.data = patch.data;
    if (patch.hora !== undefined) row.hora = patch.hora;
    if (patch.instituicao !== undefined) row.instituicao = patch.instituicao;
    if (patch.representante !== undefined) row.representante = patch.representante;
    if (patch.meio !== undefined) row.meio = patch.meio;
    if (patch.quemRealizou !== undefined) row.quem_realizou = patch.quemRealizou;
    if (patch.registro !== undefined) row.registro = patch.registro;
    if (patch.saida !== undefined) row.retorno = patch.saida;
    const { error } = await supabaseAdmin.from('logs_comunicacao').update(row).eq('id', logId);
    if (error) throw new Error(error.message);
  });

export const deleteCommLog = createServerFn({ method: 'POST' })
  .validator((d: { logId: string }) => d)
  .handler(async ({ data: { logId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('logs_comunicacao').delete().eq('id', logId);
    if (error) throw new Error(error.message);
  });

export const addContato = createServerFn({ method: 'POST' })
  .validator((d: { projectId: number; contato: Omit<Contact, 'id'> }) => d)
  .handler(async ({ data: { projectId, contato } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('contatos').insert({
      projeto_id: projectId, nome: contato.name, cargo: contato.role || null, organizacao: contato.org || null,
      telefone: contato.phone || null, email: contato.email || null, notas: contato.notes || null,
    });
    if (error) throw new Error(error.message);
  });

export const updateContato = createServerFn({ method: 'POST' })
  .validator((d: { contatoId: string; patch: Partial<Contact> }) => d)
  .handler(async ({ data: { contatoId, patch } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const row: Record<string, unknown> = {};
    if (patch.name !== undefined) row.nome = patch.name;
    if (patch.role !== undefined) row.cargo = patch.role;
    if (patch.org !== undefined) row.organizacao = patch.org;
    if (patch.phone !== undefined) row.telefone = patch.phone;
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.notes !== undefined) row.notas = patch.notes;
    const { error } = await supabaseAdmin.from('contatos').update(row).eq('id', contatoId);
    if (error) throw new Error(error.message);
  });

export const deleteContato = createServerFn({ method: 'POST' })
  .validator((d: { contatoId: string }) => d)
  .handler(async ({ data: { contatoId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('contatos').delete().eq('id', contatoId);
    if (error) throw new Error(error.message);
  });
