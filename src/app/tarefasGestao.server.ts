// Quadro de gestão interna (estilo Trello) — ver supabase/migrations/0008_tarefas_gestao.sql.
// Tarefas de gestão têm vida própria (título, prioridade, pode tocar mais de um
// projeto) e não devem ser confundidas com as atividades do plano de trabalho
// (src/app/projetos.server.ts) nem com as atribuições nascidas de menções no
// mural (src/app/atribuicoes.server.ts) — são conceitos independentes.
import { createServerFn } from '@tanstack/react-start';

export type TarefaGestaoStatus = 'nao_iniciado' | 'em_andamento' | 'concluido';

export interface TarefaGestaoProjeto {
  id: number;
  nome: string;
  code: string;
}

export interface TarefaGestao {
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
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin.from('tarefas_gestao').select(SELECT).order('criado_em', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toTarefa);
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
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('tarefas_gestao')
      .insert({
        titulo: data.titulo,
        atribuido_para_login: data.atribuidoParaLogin,
        atribuido_para_nome: data.atribuidoParaNome,
        atribuido_por_login: data.atribuidoPorLogin,
        atribuido_por_nome: data.atribuidoPorNome,
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
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('tarefas_gestao').delete().eq('id', data.id);
    if (error) throw new Error(error.message);
  });
