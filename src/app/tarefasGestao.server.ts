// Quadro de gestão interna (estilo Trello) — ver supabase/migrations/0008_tarefas_gestao.sql.
// O quadro reúne tarefas próprias e projeções de tarefas atribuídas nos outros
// módulos. As projeções mantêm os IDs, o estado e a autoria da origem.
import { createServerFn } from '@tanstack/react-start';
import { tarefasVinculadas, type OrigemTarefa } from './lib/tarefasKanban';

export type TarefaGestaoStatus = 'nao_iniciado' | 'em_andamento' | 'concluido';

export interface TarefaGestaoProjeto {
  id: number;
  nome: string;
  code: string;
}

export interface TarefaGestao {
  responsaveisDoQuadro?: { login: string; name: string }[];
  origem?: OrigemTarefa;
  id: string;
  titulo: string;
  atribuidoParaLogin: string;
  atribuidoParaNome: string;
  atribuidoPorLogin: string;
  atribuidoPorNome: string;
  dataEntrada: string;
  dataLimite: string;
  criticidade: number;
  status: TarefaGestaoStatus;
  concluidaEm: string | null;
  projetos: TarefaGestaoProjeto[];
  criadoEm: string;
  atualizadoEm: string;
}

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

async function exigirEscrita() {
  const { exigirEscrita } = await import('./sessao.server');
  return exigirEscrita();
}

/** Paginação explícita: o limite padrão da API não pode esconder tarefas. */
async function lerTodas(db: Awaited<ReturnType<typeof getAdmin>>, tabela: string, select: string): Promise<any[]> {
  const resultado: any[] = [];
  for (let inicio = 0; ; inicio += 500) {
    const { data, error } = await db.from(tabela).select(select).order('id').range(inicio, inicio + 499);
    if (error) throw new Error(`Não foi possível carregar as tarefas de ${tabela}: ${error.message}`);
    resultado.push(...(data ?? []));
    if (!data || data.length < 500) return resultado;
  }
}

const SELECT = `
  id, titulo, atribuido_para_login, atribuido_para_nome, atribuido_por_login, atribuido_por_nome,
  data_entrada, data_limite, criticidade, status, concluida_em, criado_em, atualizado_em,
  tarefas_gestao_projetos(projetos(id, nome, code))
`;

function toTarefa(row: any): TarefaGestao {
  const projetos: TarefaGestaoProjeto[] = (row.tarefas_gestao_projetos ?? [])
    .map((j: any) => j.projetos)
    .filter(Boolean)
    .map((p: any) => ({ id: p.id, nome: p.nome, code: p.code }));
  return {
    id: row.id,
    titulo: row.titulo,
    atribuidoParaLogin: row.atribuido_para_login,
    atribuidoParaNome: row.atribuido_para_nome,
    atribuidoPorLogin: row.atribuido_por_login,
    atribuidoPorNome: row.atribuido_por_nome,
    dataEntrada: row.data_entrada,
    dataLimite: row.data_limite,
    criticidade: Number(row.criticidade ?? 0),
    status: row.status,
    concluidaEm: row.concluida_em ?? null,
    projetos,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  };
}

async function setProjetos(tarefaId: string, projetoIds: number[]) {
  const supabaseAdmin = await getAdmin();
  const { error: delError } = await supabaseAdmin.from('tarefas_gestao_projetos').delete().eq('tarefa_id', tarefaId);
  if (delError) throw new Error(delError.message);
  if (projetoIds.length === 0) return;
  const rows = projetoIds.map(projeto_id => ({ tarefa_id: tarefaId, projeto_id }));
  const { error: insError } = await supabaseAdmin.from('tarefas_gestao_projetos').insert(rows);
  if (insError) throw new Error(insError.message);
}

/** Todas as tarefas do quadro (o cliente agrupa por coluna/pessoa). */
export const listarTarefasGestao = createServerFn({ method: 'GET' })
  .handler(async (): Promise<TarefaGestao[]> => {
    const { exigirSessao } = await import('./sessao.server');
    await exigirSessao();
    const supabaseAdmin = await getAdmin();
    const hierarquia = 'etapas(nome,metas(nome,projetos(id,nome,code)))';
    const [nativas, atividades, encaminhamentos, riscos, atribuicoes] = await Promise.all([
      lerTodas(supabaseAdmin, 'tarefas_gestao', SELECT),
      lerTodas(supabaseAdmin, 'atividades', `*,tarefas(*),${hierarquia}`),
      lerTodas(supabaseAdmin, 'encaminhamentos', '*,comunidades(nome)'),
      lerTodas(supabaseAdmin, 'plano_riscos', '*,projetos(id,nome,code)'),
      lerTodas(supabaseAdmin, 'mensagem_atribuicoes', `*,mensagens(texto),atividades(nome,status,excluido_em,fim_previsto,${hierarquia})`),
    ]);
    // Resolve por UUID antes de projetar o quadro: nomes iguais e renomeações
    // não podem trocar o responsável de um encaminhamento vinculado.
    const ids = [...new Set(encaminhamentos.map(e => e.responsavel_usuario_id).filter(Boolean))];
    const pessoas = ids.length ? await supabaseAdmin.from('usuarios').select('id,login,nome_exibicao').in('id', ids) : { data: [], error: null };
    if (pessoas.error) throw new Error(pessoas.error.message);
    const porId = new Map((pessoas.data ?? []).map((p: any) => [p.id, p]));
    const encaminhamentosVinculados = encaminhamentos.map(e => {
      const p = porId.get(e.responsavel_usuario_id) as { login: string; nome_exibicao: string } | undefined;
      return p ? { ...e, responsavel: p.nome_exibicao, responsavel_login: p.login } : e;
    });
    return [...nativas.map(toTarefa), ...tarefasVinculadas({ atividades, encaminhamentos: encaminhamentosVinculados, riscos, atribuicoes })];
  });

export const criarTarefaGestao = createServerFn({ method: 'POST' })
  .validator((d: {
    titulo: string;
    atribuidoParaLogin: string;
    atribuidoParaNome: string;
    atribuidoPorLogin: string;
    atribuidoPorNome: string;
    dataEntrada: string;
    dataLimite: string;
    criticidade: number;
    projetoIds: number[];
  }) => d)
  .handler(async ({ data }): Promise<{ id: string }> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('tarefas_gestao')
      .insert({
        titulo: data.titulo,
        atribuido_para_login: data.atribuidoParaLogin,
        atribuido_para_nome: data.atribuidoParaNome,
        atribuido_por_login: sessao.login,
        atribuido_por_nome: sessao.displayName,
        data_entrada: data.dataEntrada,
        data_limite: data.dataLimite,
        criticidade: data.criticidade,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    await setProjetos(row.id, data.projetoIds);
    return { id: row.id };
  });

/** Edição completa (título, datas, criticidade, projetos) — não mexe em status/coluna. */
export const editarTarefaGestao = createServerFn({ method: 'POST' })
  .validator((d: {
    id: string;
    titulo: string;
    dataEntrada: string;
    dataLimite: string;
    criticidade: number;
    projetoIds: number[];
  }) => d)
  .handler(async ({ data }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('tarefas_gestao')
      .update({
        titulo: data.titulo,
        data_entrada: data.dataEntrada,
        data_limite: data.dataLimite,
        criticidade: data.criticidade,
      })
      .eq('id', data.id);
    if (error) throw new Error(error.message);
    await setProjetos(data.id, data.projetoIds);
  });

/** Move o card para a coluna de outra pessoa (arrastar/soltar ou o menu "Mover para"). */
export const moverTarefaGestao = createServerFn({ method: 'POST' })
  .validator((d: { id: string; atribuidoParaLogin: string; atribuidoParaNome: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('tarefas_gestao')
      .update({ atribuido_para_login: data.atribuidoParaLogin, atribuido_para_nome: data.atribuidoParaNome })
      .eq('id', data.id);
    if (error) throw new Error(error.message);
  });

/** Troca a cor/coluna de progresso do card (cinza/amarelo/verde — vermelho é calculado no cliente pela data). */
export const atualizarStatusTarefaGestao = createServerFn({ method: 'POST' })
  .validator((d: { id: string; status: TarefaGestaoStatus }) => d)
  .handler(async ({ data }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('tarefas_gestao')
      .update({ status: data.status, concluida_em: data.status === 'concluido' ? new Date().toISOString() : null })
      .eq('id', data.id);
    if (error) throw new Error(error.message);
  });

export const excluirTarefaGestao = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('tarefas_gestao').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
  });
