// Server functions do módulo Diagnóstico (RF-02).
// Mesmo padrão de src/app/projetos.server.ts (createServerFn + getAdmin() via
// dynamic import + throw new Error(error.message)). Fase 1: cabeçalho do
// diagnóstico (Organização + Aplicação + versão) e versionamento. As funções
// de Matriz/IEO/Cesta/Parecer/Anexos entram nas fases seguintes.
import { createServerFn } from '@tanstack/react-start';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

export type DiagnosticoStatus = 'em_edicao' | 'concluido';

export interface DiagnosticoResumo {
  id: string;
  comunidadeId: string;
  dataAplicacao: string;
  versao: number;
  diagnosticoAnteriorId: string | null;
  status: DiagnosticoStatus;
  concluidoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface OrganizacaoDiagnosticoResumo {
  comunidadeId: string;
  code: string;
  nome: string;
  classificacao: string;
  dataAplicacaoMaisRecente: string | null;
  ultimaEdicao: string | null;
  statusMaisRecente: DiagnosticoStatus | null;
  totalDiagnosticos: number;
}

function mapDiagnostico(row: any): DiagnosticoResumo {
  return {
    id: row.id, comunidadeId: row.comunidade_id, dataAplicacao: row.data_aplicacao, versao: row.versao,
    diagnosticoAnteriorId: row.diagnostico_anterior_id ?? null, status: row.status,
    concluidoEm: row.concluido_em ?? null, criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
  };
}

/** Visão Geral: uma linha por Organização, com o resumo do diagnóstico mais recente. */
export const listarVisaoGeralDiagnosticos = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OrganizacaoDiagnosticoResumo[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from('comunidades')
      .select('id, code, nome, segmento_social, diagnosticos(id, data_aplicacao, status, criado_em, atualizado_em)')
      .order('nome');
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any): OrganizacaoDiagnosticoResumo => {
      const diags: any[] = row.diagnosticos ?? [];
      const maisRecente = diags.slice().sort((a, b) => (a.data_aplicacao < b.data_aplicacao ? 1 : -1))[0];
      const ultimaEdicaoRow = diags.slice().sort((a, b) => (a.atualizado_em < b.atualizado_em ? 1 : -1))[0];
      return {
        comunidadeId: row.id, code: row.code, nome: row.nome, classificacao: row.segmento_social ?? '',
        dataAplicacaoMaisRecente: maisRecente?.data_aplicacao ?? null,
        ultimaEdicao: ultimaEdicaoRow?.atualizado_em ?? null,
        statusMaisRecente: maisRecente?.status ?? null,
        totalDiagnosticos: diags.length,
      };
    });
  },
);

export const listarDiagnosticosPorComunidade = createServerFn({ method: 'GET' })
  .validator((d: { comunidadeId: string }) => d)
  .handler(async ({ data: { comunidadeId } }): Promise<DiagnosticoResumo[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from('diagnosticos')
      .select('*')
      .eq('comunidade_id', comunidadeId)
      .order('data_aplicacao', { ascending: false })
      .order('versao', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapDiagnostico);
  });

export const getDiagnostico = createServerFn({ method: 'GET' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data: { id } }): Promise<DiagnosticoResumo> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin.from('diagnosticos').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return mapDiagnostico(row);
  });

export const criarDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { comunidadeId: string; dataAplicacao: string }) => d)
  .handler(async ({ data: { comunidadeId, dataAplicacao } }): Promise<DiagnosticoResumo> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnosticos')
      .insert({ comunidade_id: comunidadeId, data_aplicacao: dataAplicacao })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapDiagnostico(row);
  });

export const concluirDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data: { id } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('diagnosticos')
      .update({ status: 'concluido', concluido_em: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Matriz Funcional (RF-02.A)
// ---------------------------------------------------------------------------
export interface MatrizResposta {
  funcaoId: string;
  atuacao: string[];
  quemExecuta: string | null;
  interesse: string | null;
  criticidade: string | null;
  abrangencia: string | null;
  observacoes: string | null;
  atualizadoEm: string;
}

function mapMatrizResposta(row: any): MatrizResposta {
  return {
    funcaoId: row.funcao_id, atuacao: row.atuacao ?? [], quemExecuta: row.quem_executa ?? null,
    interesse: row.interesse ?? null, criticidade: row.criticidade ?? null, abrangencia: row.abrangencia ?? null,
    observacoes: row.observacoes ?? null, atualizadoEm: row.atualizado_em,
  };
}

export const listarRespostasMatriz = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<MatrizResposta[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin.from('diagnostico_matriz').select('*').eq('diagnostico_id', diagnosticoId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapMatrizResposta);
  });

export const salvarRespostaMatriz = createServerFn({ method: 'POST' })
  .validator((d: {
    diagnosticoId: string; funcaoId: string; atuacao: string[]; quemExecuta: string | null;
    interesse: string | null; criticidade: string | null; abrangencia: string | null; observacoes: string | null;
  }) => d)
  .handler(async ({ data }): Promise<MatrizResposta> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_matriz')
      .upsert(
        {
          diagnostico_id: data.diagnosticoId, funcao_id: data.funcaoId, atuacao: data.atuacao,
          quem_executa: data.quemExecuta, interesse: data.interesse, criticidade: data.criticidade,
          abrangencia: data.abrangencia, observacoes: data.observacoes, atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'diagnostico_id,funcao_id' },
      )
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapMatrizResposta(row);
  });

// ---------------------------------------------------------------------------
// Índice de Estruturação Organizacional — IEO (RF-02.B)
// ---------------------------------------------------------------------------
export interface IeoResposta {
  perguntaId: string;
  nivel: number;
  observacao: string | null;
  atualizadoEm: string;
}

function mapIeoResposta(row: any): IeoResposta {
  return { perguntaId: row.pergunta_id, nivel: row.nivel, observacao: row.observacao ?? null, atualizadoEm: row.atualizado_em };
}

export const listarRespostasIeo = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<IeoResposta[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin.from('diagnostico_ieo').select('*').eq('diagnostico_id', diagnosticoId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapIeoResposta);
  });

export const salvarRespostaIeo = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; perguntaId: string; nivel: number; observacao: string | null }) => d)
  .handler(async ({ data }): Promise<IeoResposta> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_ieo')
      .upsert(
        {
          diagnostico_id: data.diagnosticoId, pergunta_id: data.perguntaId, nivel: data.nivel,
          observacao: data.observacao, atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'diagnostico_id,pergunta_id' },
      )
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapIeoResposta(row);
  });

// ---------------------------------------------------------------------------
// Cesta de Produtos (RF-02.C)
// ---------------------------------------------------------------------------
export type ProdutoStatusPreenchimento = 'completo' | 'em_preenchimento';

export interface Produto {
  id: string;
  diagnosticoId: string;
  nome: string;
  cadeia: string | null;
  statusPreenchimento: ProdutoStatusPreenchimento;
  respostas: Record<string, string | string[] | number | null>;
  criadoEm: string;
  atualizadoEm: string;
}

function mapProdutoRow(row: any): Produto {
  return {
    id: row.id, diagnosticoId: row.diagnostico_id, nome: row.nome, cadeia: row.cadeia ?? null,
    statusPreenchimento: row.status_preenchimento, respostas: row.respostas ?? {},
    criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
  };
}

export const listarProdutos = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<Produto[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin.from('diagnostico_produtos').select('*').eq('diagnostico_id', diagnosticoId).order('criado_em');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapProdutoRow);
  });

export const criarProduto = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; nome: string; cadeia: string | null }) => d)
  .handler(async ({ data }): Promise<Produto> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_produtos')
      .insert({ diagnostico_id: data.diagnosticoId, nome: data.nome, cadeia: data.cadeia, respostas: {} })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapProdutoRow(row);
  });

export const salvarRespostasProduto = createServerFn({ method: 'POST' })
  .validator((d: {
    produtoId: string; nome: string; cadeia: string | null;
    respostas: Record<string, string | string[] | number | null>; statusPreenchimento: ProdutoStatusPreenchimento;
  }) => d)
  .handler(async ({ data }): Promise<Produto> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_produtos')
      .update({
        nome: data.nome, cadeia: data.cadeia, respostas: data.respostas,
        status_preenchimento: data.statusPreenchimento, atualizado_em: new Date().toISOString(),
      })
      .eq('id', data.produtoId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapProdutoRow(row);
  });

export const excluirProduto = createServerFn({ method: 'POST' })
  .validator((d: { produtoId: string }) => d)
  .handler(async ({ data: { produtoId } }): Promise<void> => {
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('diagnostico_produtos').delete().eq('id', produtoId);
    if (error) throw new Error(error.message);
  });

// ---------------------------------------------------------------------------
// Parecer Técnico (RF-02.D)
// ---------------------------------------------------------------------------
export interface EvidenciaVinculada { tipo: string; referencia: string; nota: string; }

export interface Parecer {
  diagnosticoId: string;
  respostasComplementares: Record<string, string | string[] | null>;
  sintese: string | null;
  capacidades: string | null;
  fragilidades: string | null;
  pontosPrioritarios: string | null;
  consideracoesTecnicas: string | null;
  evidenciasVinculadas: EvidenciaVinculada[];
  atualizadoEm: string | null;
}

function mapParecer(row: any, diagnosticoId: string): Parecer {
  if (!row) {
    return {
      diagnosticoId, respostasComplementares: {}, sintese: null, capacidades: null, fragilidades: null,
      pontosPrioritarios: null, consideracoesTecnicas: null, evidenciasVinculadas: [], atualizadoEm: null,
    };
  }
  return {
    diagnosticoId: row.diagnostico_id, respostasComplementares: row.respostas_complementares ?? {},
    sintese: row.sintese ?? null, capacidades: row.capacidades ?? null, fragilidades: row.fragilidades ?? null,
    pontosPrioritarios: row.pontos_prioritarios ?? null, consideracoesTecnicas: row.consideracoes_tecnicas ?? null,
    evidenciasVinculadas: row.evidencias_vinculadas ?? [], atualizadoEm: row.atualizado_em ?? null,
  };
}

export const getParecer = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<Parecer> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin.from('diagnostico_parecer').select('*').eq('diagnostico_id', diagnosticoId).maybeSingle();
    if (error) throw new Error(error.message);
    return mapParecer(row, diagnosticoId);
  });

export const salvarParecer = createServerFn({ method: 'POST' })
  .validator((d: {
    diagnosticoId: string; respostasComplementares: Record<string, string | string[] | null>;
    sintese: string | null; capacidades: string | null; fragilidades: string | null;
    pontosPrioritarios: string | null; consideracoesTecnicas: string | null; evidenciasVinculadas: EvidenciaVinculada[];
  }) => d)
  .handler(async ({ data }): Promise<Parecer> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_parecer')
      .upsert(
        {
          diagnostico_id: data.diagnosticoId, respostas_complementares: data.respostasComplementares,
          sintese: data.sintese, capacidades: data.capacidades, fragilidades: data.fragilidades,
          pontos_prioritarios: data.pontosPrioritarios, consideracoes_tecnicas: data.consideracoesTecnicas,
          evidencias_vinculadas: data.evidenciasVinculadas, atualizado_em: new Date().toISOString(),
        },
        { onConflict: 'diagnostico_id' },
      )
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapParecer(row, data.diagnosticoId);
  });

// ---------------------------------------------------------------------------
// Checklist documental + anexos (RF-02.50)
// ---------------------------------------------------------------------------
export interface ChecklistItemResposta {
  itemId: number;
  disponivel: 'Sim' | 'Não' | 'N/A' | null;
  observacoes: string | null;
  anexoId: string | null;
}

export interface Anexo {
  id: string;
  diagnosticoId: string;
  checklistItemId: number | null;
  nomeArquivo: string;
  tipoMime: string | null;
  tamanhoBytes: number | null;
  criadoEm: string;
}

function mapChecklistItem(row: any): ChecklistItemResposta {
  return { itemId: row.item_id, disponivel: row.disponivel ?? null, observacoes: row.observacoes ?? null, anexoId: row.anexo_id ?? null };
}

function mapAnexo(row: any): Anexo {
  return {
    id: row.id, diagnosticoId: row.diagnostico_id, checklistItemId: row.checklist_item_id ?? null,
    nomeArquivo: row.nome_arquivo, tipoMime: row.tipo_mime ?? null, tamanhoBytes: row.tamanho_bytes ?? null, criadoEm: row.criado_em,
  };
}

export const listarChecklist = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<ChecklistItemResposta[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin.from('diagnostico_checklist_itens').select('*').eq('diagnostico_id', diagnosticoId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapChecklistItem);
  });

export const salvarChecklistItem = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; itemId: number; disponivel: 'Sim' | 'Não' | 'N/A' | null; observacoes: string | null }) => d)
  .handler(async ({ data }): Promise<ChecklistItemResposta> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_checklist_itens')
      .upsert(
        { diagnostico_id: data.diagnosticoId, item_id: data.itemId, disponivel: data.disponivel, observacoes: data.observacoes, atualizado_em: new Date().toISOString() },
        { onConflict: 'diagnostico_id,item_id' },
      )
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapChecklistItem(row);
  });

/**
 * Upload real de anexo — recebe o arquivo como data URL base64 (mesmo padrão já
 * usado pelo avatar em ConfiguracoesPage.tsx), decodifica no servidor e envia
 * pro bucket privado `diagnostico-anexos` do Supabase Storage. Evita depender
 * de suporte a FormData/multipart no RPC do createServerFn.
 */
export const uploadAnexoChecklist = createServerFn({ method: 'POST' })
  .validator((d: {
    diagnosticoId: string; itemId: number; nomeArquivo: string; tipoMime: string;
    conteudoBase64: string; enviadoPor: string;
  }) => d)
  .handler(async ({ data }): Promise<ChecklistItemResposta> => {
    const supabaseAdmin = await getAdmin();
    const base64 = data.conteudoBase64.includes(',') ? data.conteudoBase64.split(',')[1] : data.conteudoBase64;
    const buffer = Buffer.from(base64, 'base64');
    const storagePath = `${data.diagnosticoId}/${data.itemId}/${Date.now()}-${data.nomeArquivo}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('diagnostico-anexos')
      .upload(storagePath, buffer, { contentType: data.tipoMime || 'application/octet-stream' });
    if (uploadError) throw new Error(uploadError.message);

    const { data: anexoRow, error: anexoError } = await supabaseAdmin
      .from('diagnostico_anexos')
      .insert({
        diagnostico_id: data.diagnosticoId, checklist_item_id: data.itemId, storage_path: storagePath,
        nome_arquivo: data.nomeArquivo, tipo_mime: data.tipoMime || null, tamanho_bytes: buffer.length, enviado_por: data.enviadoPor,
      })
      .select('*')
      .single();
    if (anexoError) throw new Error(anexoError.message);

    const { data: itemRow, error: itemError } = await supabaseAdmin
      .from('diagnostico_checklist_itens')
      .upsert(
        { diagnostico_id: data.diagnosticoId, item_id: data.itemId, anexo_id: anexoRow.id, atualizado_em: new Date().toISOString() },
        { onConflict: 'diagnostico_id,item_id' },
      )
      .select('*')
      .single();
    if (itemError) throw new Error(itemError.message);
    return mapChecklistItem(itemRow);
  });

export const getAnexo = createServerFn({ method: 'GET' })
  .validator((d: { anexoId: string }) => d)
  .handler(async ({ data: { anexoId } }): Promise<{ anexo: Anexo; url: string }> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin.from('diagnostico_anexos').select('*').eq('id', anexoId).single();
    if (error) throw new Error(error.message);
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from('diagnostico-anexos')
      .createSignedUrl(row.storage_path, 60 * 10);
    if (signError) throw new Error(signError.message);
    return { anexo: mapAnexo(row), url: signed.signedUrl };
  });

// ---------------------------------------------------------------------------
// Relatórios > Diagnósticos (RF-03)
// ---------------------------------------------------------------------------
export interface DiagnosticoConcluidoResumo {
  diagnosticoId: string;
  comunidadeNome: string;
  comunidadeCode: string;
  classificacao: string;
  dataAplicacao: string;
  versao: number;
}

export const listarDiagnosticosConcluidosParaRelatorio = createServerFn({ method: 'GET' }).handler(
  async (): Promise<DiagnosticoConcluidoResumo[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from('diagnosticos')
      .select('id, data_aplicacao, versao, comunidades(nome, code, segmento_social)')
      .eq('status', 'concluido')
      .order('data_aplicacao', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((row: any) => ({
      diagnosticoId: row.id, dataAplicacao: row.data_aplicacao, versao: row.versao,
      comunidadeNome: row.comunidades?.nome ?? '—', comunidadeCode: row.comunidades?.code ?? '',
      classificacao: row.comunidades?.segmento_social ?? '',
    }));
  },
);

export interface DiagnosticoCompleto {
  diagnostico: DiagnosticoResumo;
  comunidade: { nome: string; code: string; classificacao: string };
  matriz: MatrizResposta[];
  ieo: IeoResposta[];
  produtos: Produto[];
  parecer: Parecer;
}

export const getDadosCompletosDiagnostico = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<DiagnosticoCompleto> => {
    const supabaseAdmin = await getAdmin();
    const [diagRes, matrizRes, ieoRes, produtosRes, parecerRes] = await Promise.all([
      supabaseAdmin.from('diagnosticos').select('*, comunidades(nome, code, segmento_social)').eq('id', diagnosticoId).single(),
      supabaseAdmin.from('diagnostico_matriz').select('*').eq('diagnostico_id', diagnosticoId),
      supabaseAdmin.from('diagnostico_ieo').select('*').eq('diagnostico_id', diagnosticoId),
      supabaseAdmin.from('diagnostico_produtos').select('*').eq('diagnostico_id', diagnosticoId).order('criado_em'),
      supabaseAdmin.from('diagnostico_parecer').select('*').eq('diagnostico_id', diagnosticoId).maybeSingle(),
    ]);
    if (diagRes.error) throw new Error(diagRes.error.message);
    if (matrizRes.error) throw new Error(matrizRes.error.message);
    if (ieoRes.error) throw new Error(ieoRes.error.message);
    if (produtosRes.error) throw new Error(produtosRes.error.message);
    if (parecerRes.error) throw new Error(parecerRes.error.message);

    const comunidadeRow: any = (diagRes.data as any).comunidades ?? {};
    return {
      diagnostico: mapDiagnostico(diagRes.data),
      comunidade: { nome: comunidadeRow.nome ?? '—', code: comunidadeRow.code ?? '', classificacao: comunidadeRow.segmento_social ?? '' },
      matriz: (matrizRes.data ?? []).map(mapMatrizResposta),
      ieo: (ieoRes.data ?? []).map(mapIeoResposta),
      produtos: (produtosRes.data ?? []).map(mapProdutoRow),
      parecer: mapParecer(parecerRes.data, diagnosticoId),
    };
  });

/** Copia uma tabela filha (chave composta diagnostico_id+campo) de um diagnóstico pra outro. */
async function copiarFilhaComposta(supabaseAdmin: any, tabela: string, deId: string, paraId: string) {
  const { data: linhas, error } = await supabaseAdmin.from(tabela).select('*').eq('diagnostico_id', deId);
  if (error) throw new Error(error.message);
  if (!linhas?.length) return;
  const copias = linhas.map((l: any) => ({ ...l, diagnostico_id: paraId }));
  const { error: insError } = await supabaseAdmin.from(tabela).insert(copias);
  if (insError) throw new Error(insError.message);
}

export const criarNovaVersaoDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoAnteriorId: string }) => d)
  .handler(async ({ data: { diagnosticoAnteriorId } }): Promise<DiagnosticoResumo> => {
    const supabaseAdmin = await getAdmin();
    const { data: anterior, error: getError } = await supabaseAdmin
      .from('diagnosticos')
      .select('*')
      .eq('id', diagnosticoAnteriorId)
      .single();
    if (getError) throw new Error(getError.message);

    const { data: nova, error: insError } = await supabaseAdmin
      .from('diagnosticos')
      .insert({
        comunidade_id: anterior.comunidade_id, data_aplicacao: anterior.data_aplicacao,
        versao: anterior.versao + 1, diagnostico_anterior_id: anterior.id, status: 'em_edicao',
      })
      .select('*')
      .single();
    if (insError) throw new Error(insError.message);

    await copiarFilhaComposta(supabaseAdmin, 'diagnostico_matriz', diagnosticoAnteriorId, nova.id);
    await copiarFilhaComposta(supabaseAdmin, 'diagnostico_ieo', diagnosticoAnteriorId, nova.id);
    await copiarFilhaComposta(supabaseAdmin, 'diagnostico_checklist_itens', diagnosticoAnteriorId, nova.id);

    const { data: produtos, error: prodError } = await supabaseAdmin
      .from('diagnostico_produtos')
      .select('*')
      .eq('diagnostico_id', diagnosticoAnteriorId);
    if (prodError) throw new Error(prodError.message);
    if (produtos?.length) {
      const copias = produtos.map(({ id: _id, ...rest }: any) => ({ ...rest, diagnostico_id: nova.id }));
      const { error } = await supabaseAdmin.from('diagnostico_produtos').insert(copias);
      if (error) throw new Error(error.message);
    }

    const { data: parecer, error: parecerError } = await supabaseAdmin
      .from('diagnostico_parecer')
      .select('*')
      .eq('diagnostico_id', diagnosticoAnteriorId)
      .maybeSingle();
    if (parecerError) throw new Error(parecerError.message);
    if (parecer) {
      const { error } = await supabaseAdmin.from('diagnostico_parecer').insert({ ...parecer, diagnostico_id: nova.id });
      if (error) throw new Error(error.message);
    }

    return mapDiagnostico(nova);
  });
