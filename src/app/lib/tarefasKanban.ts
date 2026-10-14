import type { TarefaGestao, TarefaGestaoStatus } from '../tarefasGestao.server';
import type { GanttBloco, GanttActivity } from '../data/cronogramaExecutivo';

export interface OrigemTarefa {
  tipo: 'atividade' | 'subtarefa' | 'acao' | 'risco' | 'encaminhamento' | 'mensagem' | 'administrativo';
  registroId: string;
  caminho: string;
  projetoId?: number;
  organizacaoId?: string;
  atividadeId?: string;
}
const texto = (v: unknown) => typeof v === 'string' ? v.trim() : '';
const normalizar = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export const statusNoQuadro = (s: string): TarefaGestaoStatus => ['Concluído', 'Entregue', 'Encerrado'].includes(s)
  ? 'concluido' : ['A iniciar', 'Não iniciado', 'nao_iniciado'].includes(s) ? 'nao_iniciado' : 'em_andamento';

function card(i: { id: string; titulo: string; responsavel: string; login?: string; criador?: string;
  criadorLogin?: string; criadoEm?: string; inicio?: string; fim?: string; status: string; origem: OrigemTarefa;
  projeto?: { id: number; nome: string; code: string } }): TarefaGestao | null {
  if (!texto(i.responsavel) && !texto(i.login)) return null;
  return { id: `${i.origem.tipo}:${i.id}`, titulo: i.titulo,
    atribuidoParaLogin: i.login || `nome:${normalizar(i.responsavel)}`, atribuidoParaNome: i.responsavel || i.login || '',
    atribuidoPorLogin: i.criadorLogin || '', atribuidoPorNome: i.criador || 'Não informado',
    dataEntrada: i.inicio || i.criadoEm?.slice(0,10) || '', dataLimite: i.fim || '', criticidade: 0,
    status: statusNoQuadro(i.status), concluidaEm: null, projetos: i.projeto ? [i.projeto] : [],
    criadoEm: i.criadoEm || '', atualizadoEm: '', origem: i.origem };
}

/** Projeção dos registros originais: sem criar cópias ou sincronizar dois estados. */
export function tarefasVinculadas(fontes: { atividades?: any[]; encaminhamentos?: any[]; riscos?: any[]; atribuicoes?: any[] }): TarefaGestao[] {
  const resultado: TarefaGestao[] = [];
  const incluir = (dados: Parameters<typeof card>[0]) => { const c = card(dados); if (c) resultado.push(c); };
  for (const a of fontes.atividades ?? []) {
    if (a.excluido_em) continue;
    const etapa = a.etapas ?? {}; const meta = etapa.metas ?? {}; const projeto = meta.projetos;
    const caminho = [projeto?.nome, meta.nome, etapa.nome, a.nome].filter(Boolean).join(' › ');
    const base = { id: a.id, titulo: a.nome, responsavel: a.responsavel, criador: a.criado_por,
      criadorLogin: a.criado_por_login, criadoEm: a.criado_em, inicio: a.inicio_previsto, fim: a.fim_previsto, status: a.status, projeto };
    incluir({ ...base, origem: { tipo: 'atividade', registroId: a.id, atividadeId: a.id, caminho, projetoId: projeto?.id } });
    for (const t of a.tarefas ?? []) incluir({ ...base, id: t.id, titulo: t.titulo, criador: t.criado_por,
      criadorLogin: t.criado_por_login, criadoEm: t.criado_em, origem: { tipo: 'subtarefa', registroId: t.id, caminho: `${caminho} › ${t.titulo}`, projetoId: projeto?.id } });
    if (texto(a.proximo_passo)) incluir({ ...base, titulo: a.proximo_passo, responsavel: a.proximo_passo_responsavel,
      criador: a.proximo_passo_criado_por, criadorLogin: a.proximo_passo_criado_por_login,
      fim: a.proximo_passo_prazo, origem: { tipo: 'acao', registroId: a.id, caminho, projetoId: projeto?.id } });
  }
  for (const e of fontes.encaminhamentos ?? []) incluir({ id: e.id, titulo: e.descricao,
    responsavel: e.responsavel, criador: e.criado_por, criadoEm: e.criado_em,
    inicio: e.data_inicio, fim: e.data_fim, status: e.status,
    origem: { tipo: 'encaminhamento', registroId: e.id, caminho: `${e.comunidades?.nome ?? 'Organização'} › Encaminhamento`, organizacaoId: e.comunidade_id } });
  for (const r of fontes.riscos ?? []) {
    if (!texto(r.estrategia_mitigacao)) continue;
    incluir({ id: r.id, titulo: r.estrategia_mitigacao, responsavel: r.responsavel, criador: r.resposta_criada_por,
      criadorLogin: r.resposta_criada_por_login, criadoEm: r.criado_em, status: r.status, projeto: r.projetos,
      origem: { tipo: 'risco', registroId: r.id, projetoId: r.projeto_id, caminho: `${r.projetos?.nome ?? 'Projeto'} › Risco: ${r.titulo ?? r.descricao}` } });
  }
  for (const a of fontes.atribuicoes ?? []) {
    if (!a.atividades || a.atividades.excluido_em) continue;
    const projeto = a.atividades.etapas?.metas?.projetos;
    incluir({ id: a.id, titulo: a.atividades.nome, responsavel: a.atribuido_para_nome, login: a.atribuido_para_login,
      criador: a.atribuido_por_nome, criadorLogin: a.atribuido_por_login, criadoEm: a.criado_em,
      fim: a.atividades.fim_previsto, status: a.concluida_em ? 'Concluído' : a.atividades.status, projeto,
      origem: { tipo: 'mensagem', registroId: a.id, atividadeId: a.atividade_id, projetoId: projeto?.id, caminho: `Mensagem › ${a.mensagens?.texto ?? ''}` } });
  }
  return resultado;
}

export function tarefasAdministrativas(blocos: GanttBloco[]): TarefaGestao[] {
  const resultado: TarefaGestao[] = [];
  function visitar(a: GanttActivity, caminho: string, responsavel = '') {
    const c = card({ id: String(a.id), titulo: a.atividade, responsavel: a.responsavel || responsavel,
      criador: a.criadoPor, criadorLogin: a.criadoPorLogin, criadoEm: a.criadoEm,
      inicio: a.inicio, fim: a.fim, status: a.status,
      origem: { tipo: 'administrativo', registroId: String(a.id), caminho: `${caminho} › ${a.atividade}` } });
    if (c) resultado.push(c);
    if (a.plano?.nextStep && a.plano.nextStepOwner) {
      const acao = card({ id: `acao:${a.id}`, titulo: a.plano.nextStep, responsavel: a.plano.nextStepOwner,
        criador: a.plano.nextStepCreatedBy, criadorLogin: a.plano.nextStepCreatedByLogin, criadoEm: a.criadoEm,
        fim: a.plano.nextStepDue ?? '', status: a.status,
        origem: { tipo: 'administrativo', registroId: String(a.id), caminho: `${caminho} › ${a.atividade} › Ação` } });
      if (acao) resultado.push(acao);
    }
    for (const s of a.subatividades ?? []) visitar(s, `${caminho} › ${a.atividade}`, a.responsavel || responsavel);
  }
  for (const b of blocos) for (const e of b.entregas) for (const a of e.atividades) visitar(a, `${b.bloco} › ${e.entrega}`);
  return resultado;
}

/** Nome só é associado a uma conta quando a correspondência é inequívoca. */
export function resolverPessoasDoQuadro(tarefas: TarefaGestao[], pessoas: { login: string; name: string }[]) {
  const resolvidas = tarefas.map(t => {
    if (pessoas.some(p => p.login === t.atribuidoParaLogin)) return t;
    const candidatas = pessoas.filter(p => normalizar(p.name) === normalizar(t.atribuidoParaNome));
    return candidatas.length === 1 ? { ...t, atribuidoParaLogin: candidatas[0].login } : t;
  });
  const vistos = new Set<string>();
  return resolvidas.filter(t => {
    const atividade = t.origem?.atividadeId;
    if (!atividade) return true;
    const chave = `${atividade}:${t.atribuidoParaLogin}`;
    if (vistos.has(chave)) return false;
    vistos.add(chave); return true;
  });
}
