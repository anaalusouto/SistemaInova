// Atribuições de tarefa nascidas de uma mensagem (ver supabase/migrations/0007_atribuicoes.sql
// e extractAssignments em src/app/mensagens/mentionUtils.tsx). Alimentam a Agenda
// (src/app/agenda/useAgenda.ts) — sem exigir senha, mesmo padrão de leitura/escrita
// pública deste app (o login já vem da sessão local do cliente).
import { createServerFn } from '@tanstack/react-start';

export interface Atribuicao {
  id: string;
  mensagemId: string;
  mensagemTexto: string;
  atividadeId: string;
  atividadeNome: string;
  atividadeStatus: string;
  atividadeProgresso: number;
  dataPlanejada: string | null;
  dataConclusao: string | null;
  entregaNome: string;
  metaNome: string;
  projetoId: number | null;
  projetoNome: string;
  projetoCode: string;
  atribuidoParaLogin: string;
  atribuidoParaNome: string;
  atribuidoPorLogin: string;
  atribuidoPorNome: string;
  concluidaEm: string | null;
  criadoEm: string;
}

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

const SELECT = `
  id, mensagem_id, atividade_id, atribuido_para_login, atribuido_para_nome,
  atribuido_por_login, atribuido_por_nome, concluida_em, criado_em,
  mensagens(texto),
  atividades(nome, status, progresso, data_planejada, data_conclusao,
    entregas(nome, metas(nome, projetos(id, nome, code))))
`;

function toAtribuicao(row: any): Atribuicao {
  const atividade = row.atividades ?? {};
  const entrega = atividade.entregas ?? {};
  const meta = entrega.metas ?? {};
  const projeto = meta.projetos ?? {};
  return {
    id: row.id,
    mensagemId: row.mensagem_id,
    mensagemTexto: row.mensagens?.texto ?? '',
    atividadeId: row.atividade_id,
    atividadeNome: atividade.nome ?? '(tarefa removida)',
    atividadeStatus: atividade.status ?? '—',
    atividadeProgresso: Number(atividade.progresso ?? 0),
    dataPlanejada: atividade.data_planejada ?? null,
    dataConclusao: atividade.data_conclusao ?? null,
    entregaNome: entrega.nome ?? '',
    metaNome: meta.nome ?? '',
    projetoId: projeto.id ?? null,
    projetoNome: projeto.nome ?? '',
    projetoCode: projeto.code ?? '',
    atribuidoParaLogin: row.atribuido_para_login,
    atribuidoParaNome: row.atribuido_para_nome,
    atribuidoPorLogin: row.atribuido_por_login,
    atribuidoPorNome: row.atribuido_por_nome,
    concluidaEm: row.concluida_em ?? null,
    criadoEm: row.criado_em,
  };
}

/** Agenda de um usuário: tarefas atribuídas a ele e tarefas que ele atribuiu a outros. */
export const listarAtribuicoes = createServerFn({ method: 'POST' })
  .validator((d: { login: string }) => d)
  .handler(async ({ data }): Promise<{ paraMim: Atribuicao[]; porMim: Atribuicao[] }> => {
    const supabaseAdmin = await getAdmin();
    const [paraRes, porRes] = await Promise.all([
      supabaseAdmin.from('mensagem_atribuicoes').select(SELECT).eq('atribuido_para_login', data.login).order('criado_em', { ascending: false }),
      supabaseAdmin.from('mensagem_atribuicoes').select(SELECT).eq('atribuido_por_login', data.login).order('criado_em', { ascending: false }),
    ]);
    if (paraRes.error) throw new Error(paraRes.error.message);
    if (porRes.error) throw new Error(porRes.error.message);
    return { paraMim: (paraRes.data ?? []).map(toAtribuicao), porMim: (porRes.data ?? []).map(toAtribuicao) };
  });

const MAX_ITENS = 20;

/** Registra as atribuições extraídas de uma mensagem recém-enviada (uma por par tarefa×pessoa). */
export const criarAtribuicoes = createServerFn({ method: 'POST' })
  .validator((d: {
    mensagemId: string;
    atribuidoPorLogin: string;
    atribuidoPorNome: string;
    itens: { atividadeId: string; pessoaLogin: string; pessoaNome: string }[];
  }) => d)
  .handler(async ({ data }): Promise<void> => {
    if (!data.itens.length) return;
    const supabaseAdmin = await getAdmin();
    const rows = data.itens.slice(0, MAX_ITENS).map(it => ({
      mensagem_id: data.mensagemId,
      atividade_id: it.atividadeId,
      atribuido_para_login: it.pessoaLogin,
      atribuido_para_nome: it.pessoaNome,
      atribuido_por_login: data.atribuidoPorLogin,
      atribuido_por_nome: data.atribuidoPorNome,
    }));
    const { error } = await supabaseAdmin.from('mensagem_atribuicoes').insert(rows);
    if (error) throw new Error(error.message);
  });

/** Marca/desmarca como concluída — só quem recebeu a atribuição pode alterá-la. */
export const concluirAtribuicao = createServerFn({ method: 'POST' })
  .validator((d: { id: string; login: string; concluida: boolean }) => d)
  .handler(async ({ data }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error: findError } = await supabaseAdmin
      .from('mensagem_atribuicoes').select('atribuido_para_login').eq('id', data.id).maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!row || row.atribuido_para_login !== data.login) throw new Error('Você não pode alterar esta tarefa.');
    const { error } = await supabaseAdmin
      .from('mensagem_atribuicoes')
      .update({ concluida_em: data.concluida ? new Date().toISOString() : null })
      .eq('id', data.id);
    if (error) throw new Error(error.message);
  });
