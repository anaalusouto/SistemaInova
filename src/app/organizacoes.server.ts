/**
 * Organizações (RC-01 a RC-04): lista, ficha, registros de contato e
 * encaminhamentos.
 *
 * Mesmo padrão de projetos.server.ts: service-role no servidor e papel
 * conferido pela sessão (RN-001, CA-02), nunca pelo que o cliente declara.
 * A leitura exige só sessão — a SEMAS consulta; a escrita exige papel de
 * escrita.
 */
import { createServerFn } from '@tanstack/react-start';
import {
  categoriaDe, tipoDe, ordenarRegistros, ordenarEncaminhamentos,
  validarRegistro, validarEncaminhamento, juntarErros,
  type OrganizacaoResumo, type OrganizacaoFicha, type RegistroContato, type Encaminhamento,
  type RegistroContatoInput, type EncaminhamentoInput, type PessoaReferencia,
  LIMITE_NOTA,
} from './lib/organizacoes';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}
// Importadas sob demanda pelo mesmo motivo de projetos.server.ts: um import
// estático de sessao.server.ts levaria os helpers de cookie para o navegador.
async function exigirSessao() {
  const m = await import('./sessao.server');
  return m.exigirSessao();
}
async function exigirEscrita() {
  const m = await import('./sessao.server');
  return m.exigirEscrita();
}

const vazioParaNulo = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
const BUCKET_ANEXOS = 'projeto-anexos';

// ---------------------------------------------------------------------------
// Mapeamento
// ---------------------------------------------------------------------------

function mapResumo(row: any, pendentes: number): OrganizacaoResumo {
  return {
    id: row.id,
    codigo: row.code,
    nome: row.nome,
    categoria: categoriaDe(row.segmento_social),
    tipo: tipoDe(row.tipo),
    municipio: row.municipio ?? null,
    uf: row.uf ?? null,
    pendentes,
  };
}

export function mapRegistro(r: any): RegistroContato {
  // Um arquivo por registro (RF-009): substituir apaga o anterior.
  const anexos = (r.projeto_anexos ?? []) as any[];
  const a = anexos.length ? anexos[anexos.length - 1] : null;
  return {
    id: r.id,
    data: r.data,
    hora: r.hora ?? null,
    participantes: (r.participantes ?? []) as string[],
    assunto: r.assunto ?? null,
    resumo: r.resumo ?? '',
    meio: r.meio ?? null,
    projetoId: r.projeto_id ?? null,
    anexo: a
      ? {
          id: a.id, fileName: a.nome_arquivo, mimeType: a.tipo_mime ?? null,
          sizeBytes: a.tamanho_bytes ?? null, uploadedBy: a.enviado_por ?? '', uploadedAt: a.criado_em,
        }
      : null,
    criadoEm: r.criado_em,
    atualizadoEm: r.atualizado_em ?? r.criado_em,
  };
}

function mapEncaminhamento(e: any): Encaminhamento {
  return {
    id: e.id,
    descricao: e.descricao,
    responsavel: e.responsavel ?? null,
    dataInicio: e.data_inicio ?? null,
    dataFim: e.data_fim ?? null,
    status: e.status,
    origem: e.log_comunicacao_id
      ? { tipo: 'contato', registroId: e.log_comunicacao_id }
      : e.origem_texto
        ? { tipo: 'texto', texto: e.origem_texto }
        : null,
    criadoPor: e.criado_por ?? null,
    atualizadoPor: e.atualizado_por ?? null,
    criadoEm: e.criado_em,
    atualizadoEm: e.atualizado_em,
  };
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

export const listarOrganizacoes = createServerFn({ method: 'GET' })
  .handler(async (): Promise<OrganizacaoResumo[]> => {
    await exigirSessao();
    const supabaseAdmin = await getAdmin();
    const [orgs, pend] = await Promise.all([
      supabaseAdmin.from('comunidades').select('id, code, nome, segmento_social, tipo, municipio, uf').order('nome'),
      supabaseAdmin.from('encaminhamentos').select('comunidade_id').neq('status', 'Concluído'),
    ]);
    if (orgs.error) throw new Error(orgs.error.message);
    if (pend.error) throw new Error(pend.error.message);
    const contagem = new Map<string, number>();
    for (const r of pend.data ?? []) contagem.set(r.comunidade_id, (contagem.get(r.comunidade_id) ?? 0) + 1);
    return (orgs.data ?? []).map(o => mapResumo(o, contagem.get(o.id) ?? 0));
  });

export const obterOrganizacao = createServerFn({ method: 'GET' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data: { id } }): Promise<OrganizacaoFicha> => {
    await exigirSessao();
    const supabaseAdmin = await getAdmin();

    const [org, pessoas, projetos, registros, encaminhamentos, nota] = await Promise.all([
      supabaseAdmin.from('comunidades').select('*').eq('id', id).maybeSingle(),
      supabaseAdmin.from('comunidade_pessoas').select('*').eq('comunidade_id', id).order('nome'),
      supabaseAdmin.from('projetos').select('id, code, nome').eq('comunidade_id', id).order('code'),
      supabaseAdmin.from('logs_comunicacao').select('*, projeto_anexos(*)').eq('comunidade_id', id),
      supabaseAdmin.from('encaminhamentos').select('*').eq('comunidade_id', id),
      supabaseAdmin.from('organizacao_notas').select('*').eq('comunidade_id', id).maybeSingle(),
    ]);
    for (const r of [org, pessoas, projetos, registros, encaminhamentos, nota]) {
      if (r.error) throw new Error(r.error.message);
    }
    if (!org.data) throw new Error('Organização não encontrada.');

    const encs = (encaminhamentos.data ?? []).map(mapEncaminhamento);
    const o = org.data;
    return {
      ...mapResumo(o, encs.filter(e => e.status !== 'Concluído').length),
      eixo: o.eixo_principal ?? null,
      localizacao: o.localizacao ?? null,
      territorio: o.territorio ?? null,
      status: o.status ?? null,
      responsavelTecnico: o.responsavel_tecnico ?? null,
      pessoas: (pessoas.data ?? []).map((p: any): PessoaReferencia => ({
        id: p.id, nome: p.nome, funcao: p.funcao ?? null, contato: p.contato ?? null,
      })),
      projetos: (projetos.data ?? []).map((p: any) => ({ id: p.id, codigo: p.code, nome: p.nome })),
      registros: ordenarRegistros((registros.data ?? []).map(mapRegistro)),
      encaminhamentos: ordenarEncaminhamentos(encs),
      nota: nota.data
        ? { conteudo: nota.data.conteudo, versao: nota.data.versao, atualizadoPor: nota.data.atualizado_por ?? null, atualizadoEm: nota.data.atualizado_em }
        : null,
    };
  });

// ---------------------------------------------------------------------------
// Registros de contato (RC-03)
// ---------------------------------------------------------------------------

function linhaRegistro(d: RegistroContatoInput) {
  return {
    comunidade_id: d.organizacaoId,
    data: d.data,
    hora: vazioParaNulo(d.hora),
    participantes: d.participantes.map(p => p.trim()).filter(Boolean),
    assunto: d.assunto.trim(),
    resumo: d.resumo.trim(),
    meio: vazioParaNulo(d.meio),
  };
}

export const criarRegistroContato = createServerFn({ method: 'POST' })
  .validator((d: RegistroContatoInput) => d)
  .handler(async ({ data }): Promise<string> => {
    await exigirEscrita();
    const erros = validarRegistro(data);
    if (erros.length) throw new Error(juntarErros(erros));
    const supabaseAdmin = await getAdmin();
    const { data: criado, error } = await supabaseAdmin
      .from('logs_comunicacao').insert(linhaRegistro(data)).select('id').single();
    if (error) throw new Error(error.message);
    return criado.id as string;
  });

export const atualizarRegistroContato = createServerFn({ method: 'POST' })
  .validator((d: { registroId: string; dados: RegistroContatoInput }) => d)
  .handler(async ({ data: { registroId, dados } }): Promise<void> => {
    await exigirEscrita();
    const erros = validarRegistro(dados);
    if (erros.length) throw new Error(juntarErros(erros));
    const supabaseAdmin = await getAdmin();
    // A organização não muda na edição: o registro não troca de dono, e
    // trocar quebraria a origem dos encaminhamentos que apontam para ele.
    const { comunidade_id: _org, ...campos } = linhaRegistro(dados);
    void _org;
    const { error } = await supabaseAdmin
      .from('logs_comunicacao').update(campos).eq('id', registroId).eq('comunidade_id', dados.organizacaoId);
    if (error) throw new Error(error.message);
  });

/**
 * Exclui o registro e o arquivo anexado a ele.
 *
 * Encaminhamentos que tinham este registro como origem continuam existindo —
 * só perdem a origem (a FK é SET NULL). A tela avisa antes de confirmar.
 */
export const excluirRegistroContato = createServerFn({ method: 'POST' })
  .validator((d: { registroId: string }) => d)
  .handler(async ({ data: { registroId } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const { data: anexos } = await supabaseAdmin
      .from('projeto_anexos').select('storage_path').eq('log_comunicacao_id', registroId);
    if (anexos?.length) {
      const { error: erroStorage } = await supabaseAdmin.storage
        .from(BUCKET_ANEXOS).remove(anexos.map(a => a.storage_path as string));
      if (erroStorage) {
        console.error('[organizacoes] anexo não removido do storage:',
          { caminhos: anexos.map(a => a.storage_path), erro: erroStorage.message });
      }
    }

    const { error } = await supabaseAdmin.from('logs_comunicacao').delete().eq('id', registroId);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Encaminhamentos (RC-04)
// ---------------------------------------------------------------------------

async function linhaEncaminhamento(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  d: EncaminhamentoInput,
) {
  const erros = validarEncaminhamento(d);
  if (erros.length) throw new Error(juntarErros(erros));

  // O banco já recusa origem de outra organização (FK composta); conferir
  // aqui antes é só para devolver uma mensagem que a pessoa entenda.
  if (d.origem?.tipo === 'contato') {
    const { data: reg } = await supabaseAdmin
      .from('logs_comunicacao').select('id')
      .eq('id', d.origem.registroId).eq('comunidade_id', d.organizacaoId).maybeSingle();
    if (!reg) throw new Error('O registro de contato escolhido como origem não pertence a esta organização.');
  }

  return {
    comunidade_id: d.organizacaoId,
    descricao: d.descricao.trim(),
    responsavel: vazioParaNulo(d.responsavel),
    data_inicio: d.dataInicio || null,
    data_fim: d.dataFim || null,
    status: d.status,
    log_comunicacao_id: d.origem?.tipo === 'contato' ? d.origem.registroId : null,
    origem_texto: d.origem?.tipo === 'texto' ? d.origem.texto.trim() : null,
  };
}

export const criarEncaminhamento = createServerFn({ method: 'POST' })
  .validator((d: EncaminhamentoInput) => d)
  .handler(async ({ data }): Promise<string> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const linha = await linhaEncaminhamento(supabaseAdmin, data);
    const { data: criado, error } = await supabaseAdmin
      .from('encaminhamentos')
      .insert({ ...linha, criado_por: sessao.displayName, atualizado_por: sessao.displayName })
      .select('id').single();
    if (error) throw new Error(error.message);
    return criado.id as string;
  });

export const atualizarEncaminhamento = createServerFn({ method: 'POST' })
  .validator((d: { encaminhamentoId: string; dados: EncaminhamentoInput }) => d)
  .handler(async ({ data: { encaminhamentoId, dados } }): Promise<void> => {
    const sessao = await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { comunidade_id: _org, ...linha } = await linhaEncaminhamento(supabaseAdmin, dados);
    void _org;
    const { error } = await supabaseAdmin
      .from('encaminhamentos')
      .update({ ...linha, atualizado_por: sessao.displayName })
      .eq('id', encaminhamentoId).eq('comunidade_id', dados.organizacaoId);
    if (error) throw new Error(error.message);
  });

export const excluirEncaminhamento = createServerFn({ method: 'POST' })
  .validator((d: { encaminhamentoId: string }) => d)
  .handler(async ({ data: { encaminhamentoId } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('encaminhamentos').delete().eq('id', encaminhamentoId);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Notas da organização (Anotações, opção 1)
// ---------------------------------------------------------------------------

export class NotaDesatualizada extends Error {
  constructor() {
    super('Outra pessoa salvou esta nota depois que você a abriu. Copie o seu texto, recarregue a nota e salve de novo.');
    this.name = 'NotaDesatualizada';
  }
}

/**
 * Grava a nota se ninguém salvou desde que a pessoa a abriu.
 *
 * `versaoAberta` é 0 quando a nota ainda não existia. A troca só acontece
 * se a versão no banco ainda for a que a pessoa viu; senão, recusa. Última
 * gravação vence em silêncio seria o pior resultado possível num texto
 * compartilhado: alguém perde o que escreveu sem saber.
 */
export const salvarNotaOrganizacao = createServerFn({ method: 'POST' })
  .validator((d: { organizacaoId: string; conteudo: string; versaoAberta: number }) => d)
  .handler(async ({ data: { organizacaoId, conteudo, versaoAberta } }): Promise<number> => {
    const sessao = await exigirEscrita();
    if (conteudo.length > LIMITE_NOTA) {
      throw new Error(`A nota passou de ${LIMITE_NOTA.toLocaleString('pt-BR')} caracteres.`);
    }
    const supabaseAdmin = await getAdmin();

    if (versaoAberta === 0) {
      const { error } = await supabaseAdmin.from('organizacao_notas').insert({
        comunidade_id: organizacaoId, conteudo, versao: 1, atualizado_por: sessao.displayName,
      });
      // Chave duplicada: alguém criou a nota enquanto esta pessoa escrevia.
      if (error?.code === '23505') throw new NotaDesatualizada();
      if (error) throw new Error(error.message);
      return 1;
    }

    const { data, error } = await supabaseAdmin
      .from('organizacao_notas')
      .update({ conteudo, versao: versaoAberta + 1, atualizado_por: sessao.displayName })
      .eq('comunidade_id', organizacaoId)
      .eq('versao', versaoAberta)
      .select('versao');
    if (error) throw new Error(error.message);
    if (!data?.length) throw new NotaDesatualizada();
    return versaoAberta + 1;
  });
