// Server functions do módulo Mapeamento (RF-02).
// Mesmo padrão de src/app/projetos.server.ts (createServerFn + getAdmin() via
// dynamic import + throw new Error(mensagemMapeamento(error))). Fase 1: cabeçalho do
// mapeamento (Organização + Aplicação + versão) e versionamento. As funções
// de Matriz/IEO/Cesta/Parecer/Anexos entram nas fases seguintes.
import { createServerFn } from '@tanstack/react-start';
import { nomeCurtoOrg } from './lib/navegacaoOrg';
import { validarDocumento, LIMITE_DOCUMENTO } from './lib/documentosRegistro';
import { diagnosticoAtual } from './diagnostic/navegacaoDiagnostico';
import { FUNCOES_MATRIZ, validarMatrizPrototipo, type MatrizPrototipoInput } from './diagnostic/catalog/matrizPrototipo';
import { interpretarTextoMatriz, validarConferencia, type ImportacaoSalva, type OrigemPdf } from './diagnostic/importarMatriz';
import type { RegistroCaderno } from './diagnostic/cadernoCria';
import { calcularNotaConsolidada } from './diagnostic/notaConsolidada';

const mensagemMapeamento=(erro:{message:string})=>erro.message.replace(/diagnóstico/gi,termo=>termo[0]==='D'?'Mapeamento':'mapeamento');

async function getAdmin() {
  await (await import('./sessao.server')).exigirSessao();
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}


async function exigirEscritaDiagnostico() { return (await import('./sessao.server')).exigirEscrita(); }
async function exigirDiagnosticoEditavel(id: string) {
  const usuario = await exigirEscritaDiagnostico();
  const db = await getAdmin();
  const {data, error} = await db.from('diagnosticos').select('status').eq('id',id).maybeSingle();
  if(error || !data) throw new Error('Mapeamento não encontrado.');
  if(data.status !== 'em_edicao') throw new Error('Mapeamento concluído é somente leitura. Crie uma nova versão para alterar.');
  return usuario;
}
async function exigirProdutoEditavel(id: string) {
  await exigirEscritaDiagnostico();
  const db = await getAdmin();
  const {data,error} = await db.from('diagnostico_produtos').select('diagnostico_id').eq('id',id).maybeSingle();
  if(error || !data) throw new Error('Produto não encontrado.');
  await exigirDiagnosticoEditavel(data.diagnostico_id);
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

/** Uma única aplicação atual por organização; nunca completa lacunas com versões anteriores. */
export const listarNotasMapeamentos = createServerFn({ method: 'GET' })
  .validator((d: { organizacaoIds: string[] }) => {
    if (!Array.isArray(d?.organizacaoIds) || d.organizacaoIds.length > 500 || d.organizacaoIds.some(id => !/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id))) throw new Error('Organizações inválidas para os gráficos de mapeamento.');
    return { organizacaoIds: [...new Set(d.organizacaoIds)] };
  })
  .handler(async ({ data }) => {
    if (!data.organizacaoIds.length) return [];
    const db = await getAdmin();
    const aplicacoes = await db.from('diagnosticos').select('*').in('comunidade_id', data.organizacaoIds);
    if (aplicacoes.error) throw new Error(mensagemMapeamento(aplicacoes.error));
    const diagnosticos = (aplicacoes.data ?? []).map(mapDiagnostico);
    const atuais = data.organizacaoIds.flatMap(id => { const d = diagnosticoAtual(diagnosticos, id); return d ? [d] : []; });
    if (!atuais.length) return [];
    const ids = atuais.map(d => d.id);
    const [caderno, produtos] = await Promise.all([
      db.from('diagnostico_caderno_respostas').select('*').in('diagnostico_id', ids),
      db.from('diagnostico_produtos').select('id,diagnostico_id').in('diagnostico_id', ids),
    ]);
    if (caderno.error || produtos.error) throw new Error(mensagemMapeamento(caderno.error ?? produtos.error!));
    return atuais.map(d => ({
      organizacaoId: d.comunidadeId, diagnosticoId: d.id, dataAplicacao: d.dataAplicacao, versao: d.versao,
      ...calcularNotaConsolidada((caderno.data ?? []).filter(r => r.diagnostico_id === d.id), (produtos.data ?? []).filter(p => p.diagnostico_id === d.id)),
    }));
  });

/** Visão Geral: uma linha por Organização, com o resumo do mapeamento mais recente. */
export const listarVisaoGeralDiagnosticos = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OrganizacaoDiagnosticoResumo[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin
      .from('comunidades')
      .select('id, code, nome, segmento_social, diagnosticos(id, data_aplicacao, versao, status, criado_em, atualizado_em)')
      .order('nome');
    if (error) throw new Error(mensagemMapeamento(error));

    return (data ?? []).map((row: any): OrganizacaoDiagnosticoResumo => {
      const diags: any[] = row.diagnosticos ?? [];
      const maisRecente = diagnosticoAtual(diags.map(d => mapDiagnostico({...d,comunidade_id:row.id})),row.id);
      const ultimaEdicaoRow = diags.slice().sort((a, b) => (a.atualizado_em < b.atualizado_em ? 1 : -1))[0];
      return {
        comunidadeId: row.id, code: row.code, nome: nomeCurtoOrg(row.nome), classificacao: row.segmento_social ?? '',
        dataAplicacaoMaisRecente: maisRecente?.dataAplicacao ?? null,
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
    if (error) throw new Error(mensagemMapeamento(error));
    return (data ?? []).map(mapDiagnostico);
  });

export const getDiagnostico = createServerFn({ method: 'GET' })
  .validator((d: { id: string; comunidadeId?: string }) => d)
  .handler(async ({ data: { id, comunidadeId } }): Promise<DiagnosticoResumo> => {
    const supabaseAdmin = await getAdmin();
    let consulta = supabaseAdmin.from('diagnosticos').select('*').eq('id', id);
    if (comunidadeId) consulta = consulta.eq('comunidade_id', comunidadeId);
    const { data: row, error } = await consulta.single();
    if (error) throw new Error(mensagemMapeamento(error));
    return mapDiagnostico(row);
  });

export const atualizarInformacoesGeraisDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; organizacaoId: string; nomeOrganizacao: string; classificacao: string; dataAplicacao: string; arquivoReferencia: string; estagioRegistrado: string }) => d)
  .handler(async ({ data }): Promise<DiagnosticoResumo> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(data.organizacaoId) || !/^\d{4}-\d{2}-\d{2}$/.test(data.dataAplicacao)) throw new Error('Organização ou data de aplicação inválida.');
    for (const [rotulo, valor, max] of [['Organização', data.nomeOrganizacao, 500], ['Classificação', data.classificacao, 200], ['Arquivo de referência', data.arquivoReferencia, 2000], ['Estágio registrado', data.estagioRegistrado, 500]] as const) {
      if (typeof valor !== 'string' || valor.length > max) throw new Error(`${rotulo} excede o limite permitido.`);
    }
    const db = await getAdmin();
    const atual = await db.from('diagnosticos').select('comunidade_id').eq('id', data.diagnosticoId).maybeSingle();
    if (atual.error || atual.data?.comunidade_id !== data.organizacaoId) throw new Error('O mapeamento não pertence à organização selecionada.');
    const organizacao = await db.from('comunidades').update({ nome: data.nomeOrganizacao.trim(), segmento_social: data.classificacao.trim() || null }).eq('id', data.organizacaoId).select('id').maybeSingle();
    if (organizacao.error || !organizacao.data) throw new Error(organizacao.error ? mensagemMapeamento(organizacao.error) : 'A organização não foi encontrada.');
    const diagnostico = await db.from('diagnosticos').update({ data_aplicacao: data.dataAplicacao }).eq('id', data.diagnosticoId).select('*').single();
    if (diagnostico.error) throw new Error(mensagemMapeamento(diagnostico.error));
    const parecer = await db.from('diagnostico_parecer').select('respostas_complementares').eq('diagnostico_id', data.diagnosticoId).maybeSingle();
    if (parecer.error) throw new Error(mensagemMapeamento(parecer.error));
    const respostas = { ...(parecer.data?.respostas_complementares ?? {}), __arquivoReferencia: data.arquivoReferencia || null, __estagioRegistrado: data.estagioRegistrado || null };
    const metadata = parecer.data
      ? await db.from('diagnostico_parecer').update({ respostas_complementares: respostas, atualizado_em: new Date().toISOString() }).eq('diagnostico_id', data.diagnosticoId)
      : await db.from('diagnostico_parecer').insert({ diagnostico_id: data.diagnosticoId, respostas_complementares: respostas });
    if (metadata.error) throw new Error(mensagemMapeamento(metadata.error));
    return mapDiagnostico(diagnostico.data);
  });

export const getInformacoesGeraisDiagnostico = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data }): Promise<{ nomeOrganizacao: string; classificacao: string; dataAplicacao: string; versao: number; arquivoReferencia: string; estagioRegistrado: string }> => {
    const db = await getAdmin();
    const [diag, parecer] = await Promise.all([
      db.from('diagnosticos').select('id,comunidade_id,data_aplicacao,versao,comunidades(nome,segmento_social)').eq('id', data.diagnosticoId).maybeSingle(),
      db.from('diagnostico_parecer').select('respostas_complementares').eq('diagnostico_id', data.diagnosticoId).maybeSingle(),
    ]);
    if (diag.error || !diag.data) throw new Error(diag.error ? mensagemMapeamento(diag.error) : 'Mapeamento não encontrado.');
    if (parecer.error) throw new Error(mensagemMapeamento(parecer.error));
    const comunidade: any = diag.data.comunidades ?? {};
    const respostas = parecer.data?.respostas_complementares ?? {};
    return { nomeOrganizacao: comunidade.nome ?? '', classificacao: comunidade.segmento_social ?? '', dataAplicacao: diag.data.data_aplicacao, versao: diag.data.versao, arquivoReferencia: respostas.__arquivoReferencia ?? '', estagioRegistrado: respostas.__estagioRegistrado ?? '' };
  });

export const criarDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { comunidadeId: string; dataAplicacao: string }) => d)
  .handler(async ({ data: { comunidadeId, dataAplicacao } }): Promise<DiagnosticoResumo> => {
    await exigirEscritaDiagnostico();
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnosticos')
      .insert({ comunidade_id: comunidadeId, data_aplicacao: dataAplicacao })
      .select('*')
      .single();
    if (error) throw new Error(mensagemMapeamento(error));
    return mapDiagnostico(row);
  });

export const concluirDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { id: string }) => d)
  .handler(async ({ data: { id } }): Promise<void> => {
    await exigirDiagnosticoEditavel(id);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin
      .from('diagnosticos')
      .update({ status: 'concluido', concluido_em: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(mensagemMapeamento(error));
  });

/** Exclui somente a aplicação confirmada. As filhas seguem as cascatas do banco. */
export const excluirDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { id: string; comunidadeId: string; atualizadoEm: string; confirmacao: string }) => {
    const uuid = /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
    if (!d || !uuid.test(d.id) || !uuid.test(d.comunidadeId) || typeof d.atualizadoEm !== 'string' || !Number.isFinite(Date.parse(d.atualizadoEm)) || d.confirmacao !== 'EXCLUIR') {
      throw new Error('Confirme o mapeamento e a organização antes de excluir.');
    }
    return d;
  })
  .handler(async ({ data }): Promise<{ arquivosPendentes: boolean }> => {
    await exigirEscritaDiagnostico();
    const db = await getAdmin();
    const atual = await db.from('diagnosticos').select('id').eq('id', data.id).eq('comunidade_id', data.comunidadeId).maybeSingle();
    if (atual.error) throw new Error(mensagemMapeamento(atual.error));
    if (!atual.data) throw new Error('Mapeamento não encontrado nesta organização.');
    const posteriores = await db.from('diagnosticos').select('id').eq('diagnostico_anterior_id', data.id).limit(1);
    if (posteriores.error) throw new Error(mensagemMapeamento(posteriores.error));
    if (posteriores.data?.length) throw new Error('Existe uma versão posterior vinculada a este mapeamento. Exclua as versões mais recentes primeiro.');
    const anexos = await db.from('diagnostico_anexos').select('id,storage_path').eq('diagnostico_id', data.id);
    if (anexos.error) throw new Error(mensagemMapeamento(anexos.error));
    if (anexos.data?.length) {
      const compartilhados = await db.from('diagnostico_checklist_itens').select('diagnostico_id').in('anexo_id', anexos.data.map(a => a.id)).neq('diagnostico_id', data.id).limit(1);
      if (compartilhados.error) throw new Error(mensagemMapeamento(compartilhados.error));
      if (compartilhados.data?.length) throw new Error('Há evidências deste mapeamento utilizadas em outra versão. A exclusão foi bloqueada para preservar esses vínculos.');
    }
    const removido = await db.from('diagnosticos').delete().eq('id', data.id).eq('comunidade_id', data.comunidadeId).eq('atualizado_em', data.atualizadoEm).select('id').maybeSingle();
    if (removido.error) throw new Error(mensagemMapeamento(removido.error));
    if (!removido.data) throw new Error('O mapeamento foi alterado ou excluído por outra pessoa. Recarregue a lista antes de tentar novamente.');
    // Storage não participa da transação SQL. Uma falha de limpeza não desfaz a exclusão.
    const caminhos = [...new Set((anexos.data ?? []).map(a => a.storage_path))];
    if (caminhos.length) {
      try {
        const restantes = await db.from('diagnostico_anexos').select('storage_path').in('storage_path', caminhos);
        if (restantes.error) return { arquivosPendentes: true };
        const usados = new Set(restantes.data?.map(a => a.storage_path));
        const livres = caminhos.filter(c => !usados.has(c));
        if (livres.length) {
          const limpeza = await db.storage.from('diagnostico-anexos').remove(livres);
          if (limpeza.error) return { arquivosPendentes: true };
        }
      } catch { return { arquivosPendentes: true }; }
    }
    return { arquivosPendentes: false };
  });

// ---------------------------------------------------------------------------
// Matriz Funcional (RF-02.A)
// ---------------------------------------------------------------------------
export interface MatrizResposta {
  funcaoId: string;
  nomeFuncao?: string | null;
  experiencia?: string | null;
  externo?: string | null;
  origemPdf?: {nomeArquivo:string;sha256:string;conferidoEm:string;conferidoPor:string;estado:string}|null;
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
    nomeFuncao: row.funcao_nome ?? null, experiencia: row.experiencia ?? null, externo: row.externo ?? null,
    origemPdf: row.origem_pdf ?? null,
    interesse: row.interesse ?? null, criticidade: row.criticidade ?? null, abrangencia: row.abrangencia ?? null,
    observacoes: row.observacoes ?? null, atualizadoEm: row.atualizado_em,
  };
}

export const listarRespostasMatriz = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string; organizacaoId?: string }) => d)
  .handler(async ({ data: { diagnosticoId, organizacaoId } }): Promise<MatrizResposta[]> => {
    const supabaseAdmin = await getAdmin();
    if(organizacaoId) {
      const {data: pai,error: falha}=await supabaseAdmin.from('diagnosticos').select('id').eq('id',diagnosticoId).eq('comunidade_id',organizacaoId).maybeSingle();
      if(falha || !pai) throw new Error('A aplicação não pertence à organização selecionada.');
    }
    const { data, error } = await supabaseAdmin.from('diagnostico_matriz').select('*').eq('diagnostico_id', diagnosticoId);
    if (error) throw new Error(mensagemMapeamento(error));
    return (data ?? []).filter((r:any)=>/^F(0[1-9]|1[0-9]|2[01])$/.test(r.funcao_id)).map(mapMatrizResposta);
  });

export const salvarMatrizPrototipo = createServerFn({method:'POST'})
  .validator((d: MatrizPrototipoInput)=>d)
  .handler(async({data:entrada}):Promise<MatrizResposta>=>{
    await exigirEscritaDiagnostico(); validarMatrizPrototipo(entrada);
    // O enunciado pertence ao catálogo, mesmo em requisições diretas ou importações.
    const data={...entrada,nomeFuncao:FUNCOES_MATRIZ.find(f=>f.id===entrada.funcaoId)!.nome};
    const db=await getAdmin();
    if(data.importacao){
      const {data: registro,error:falha}=await db.from('diagnostico_matriz_importacoes').select('*').eq('id',data.importacao.id).eq('diagnostico_id',data.diagnosticoId).eq('estado','pendente').maybeSingle();
      if(falha||!registro||!registro.pendentes.includes(data.funcaoId))throw new Error('Importação pendente não encontrada nesta aplicação.');
      validarConferencia(registro.dados.conferencia[data.funcaoId],data,data.importacao.decisoes,data.importacao.confirmado);
      const {data:linha,error:erro}=await db.rpc('confirmar_importacao_matriz',{p_organizacao:data.organizacaoId,p_diagnostico:data.diagnosticoId,
        p_importacao:data.importacao.id,p_funcao:data.funcaoId,p_resposta:data,p_decisoes:data.importacao.decisoes,p_confirmado:data.importacao.confirmado,
        p_autor:(await (await import('./sessao.server')).exigirSessao()).id});
      if(erro)throw new Error(mensagemMapeamento(erro));
      if(!linha)throw new Error('Não foi possível confirmar a gravação da Matriz.');
      return mapMatrizResposta(linha);
    }
    const {data: row,error}=await db.rpc('salvar_matriz_prototipo',{
      p_organizacao:data.organizacaoId,p_diagnostico:data.diagnosticoId,p_funcao:data.funcaoId,p_nome:data.nomeFuncao,
      p_atuacao:data.atuacao,p_experiencia:data.experiencia,p_criticidade:data.criticidade,p_interesse:data.interesse,
      p_observacao:data.observacoes,p_externo:data.externo,
    });
    if(error) throw new Error(['PGRST202','42883'].includes(error.code)?'A Matriz atualizada precisa da migração do protótipo no banco.':mensagemMapeamento(error));
    if(!row) throw new Error('Não foi possível confirmar a gravação da Matriz.');
    return mapMatrizResposta(row);
  });

function mapImportacao(r:any):ImportacaoSalva {return {id:r.id,dados:r.dados,origem:r.origem,pendentes:r.pendentes,estado:r.estado,criadoEm:r.criado_em};}
async function validarContextoImportacao(organizacaoId:string,diagnosticoId:string){
  const db=await getAdmin();
  const {data,error}=await db.from('diagnosticos').select('id').eq('id',diagnosticoId).eq('comunidade_id',organizacaoId).maybeSingle();
  if(error||!data)throw new Error('A aplicação não pertence à organização selecionada.');
  return db;
}
export const obterImportacaoMatrizPendente=createServerFn({method:'GET'})
  .validator((d:{organizacaoId:string;diagnosticoId:string})=>d)
  .handler(async({data}):Promise<ImportacaoSalva|null>=>{
    const db=await validarContextoImportacao(data.organizacaoId,data.diagnosticoId);
    const {data:r,error}=await db.from('diagnostico_matriz_importacoes').select('*').eq('diagnostico_id',data.diagnosticoId).eq('estado','pendente').maybeSingle();
    if(error)throw new Error('Não foi possível carregar a conferência do PDF. Verifique a migração de importações.');
    return r?mapImportacao(r):null;
  });
export const registrarImportacaoMatriz=createServerFn({method:'POST'})
  .validator((d:{organizacaoId:string;diagnosticoId:string;origem:OrigemPdf;texto:string})=>d)
  .handler(async({data}):Promise<ImportacaoSalva>=>{
    const autor=await exigirEscritaDiagnostico();
    if(!data.origem||typeof data.origem.nomeArquivo!=='string'||!data.origem.nomeArquivo.toLowerCase().endsWith('.pdf')||data.origem.nomeArquivo.length>255||!/^[a-f0-9]{64}$/.test(data.origem.sha256)||!Number.isInteger(data.origem.tamanho)||data.origem.tamanho<1||data.origem.tamanho>10485760)throw new Error('Origem do PDF inválida.');
    const dados=interpretarTextoMatriz(data.texto);
    if(!Object.keys(dados.conferencia).length)throw new Error('Nenhuma função oficial foi identificada no PDF.');
    const db=await getAdmin();
    const {data:r,error}=await db.rpc('registrar_importacao_matriz',{p_organizacao:data.organizacaoId,p_diagnostico:data.diagnosticoId,p_origem:data.origem,p_dados:dados,p_autor:autor.id});
    if(error)throw new Error(mensagemMapeamento(error));return mapImportacao(r);
  });
export const descartarImportacaoMatriz=createServerFn({method:'POST'})
  .validator((d:{organizacaoId:string;diagnosticoId:string;importacaoId:string})=>d)
  .handler(async({data}):Promise<void>=>{
    await exigirEscritaDiagnostico();const db=await getAdmin();
    const {error}=await db.rpc('descartar_importacao_matriz',{p_organizacao:data.organizacaoId,p_diagnostico:data.diagnosticoId,p_importacao:data.importacaoId});
    if(error)throw new Error(mensagemMapeamento(error));
  });

export const salvarRespostaMatriz = createServerFn({ method: 'POST' })
  .validator((d: {
    diagnosticoId: string; funcaoId: string; atuacao: string[]; quemExecuta: string | null;
    interesse: string | null; criticidade: string | null; abrangencia: string | null; observacoes: string | null;
  }) => d)
  .handler(async ({ data }): Promise<MatrizResposta> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    throw new Error('O catálogo anterior foi descontinuado. Reabra a Matriz de 21 funções para salvar.');
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
    if (error) throw new Error(mensagemMapeamento(error));
    return (data ?? []).map(mapIeoResposta);
  });

export const salvarRespostaIeo = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; perguntaId: string; nivel: number; observacao: string | null }) => d)
  .handler(async ({ data }): Promise<IeoResposta> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    if (!Number.isInteger(data.nivel) || data.nivel < 1 || data.nivel > 4) throw new Error('Nível do IEO deve ser inteiro de 1 a 4.');
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
    if (error) throw new Error(mensagemMapeamento(error));
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
  categoriaId: string | null;
  unidadeMedida: string | null;
  safra: SafraProduto;
  canaisComerciais: CanalComercialProduto[];
  etapasEconomicas: EtapaEconomicaProduto[];
  statusPreenchimento: ProdutoStatusPreenchimento;
  respostas: Record<string, string | string[] | number | null>;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CategoriaProduto { id: string; diagnosticoId: string; nome: string }
export interface SafraProduto { estado: 'nao_informada' | 'ano_inteiro' | 'sazonal'; intervalos: { inicio: number; fim: number }[] }
export interface CanalComercialProduto {
  canal: string; periodoReferencia: string; unidade: string;
  modelo: 'compra_revenda' | 'venda_repasse' | 'beneficiamento_servico' | '';
  valorCompra: number | null; valorVenda: number | null;
  repasse: number | null; tipoRepasse: 'valor' | 'percentual' | null;
  baseRepasse: string; parcelaOrganizacao: number | null;
  custos: { nome: string; valor: number | null }[];
}
export interface EtapaEconomicaProduto {
  etapa: string; executor: string; pagador: string; recebedor: string;
  valor: number | null; unidade: string;
  natureza: 'custo' | 'pagamento_produto' | 'receita_servico' | 'repasse' | '';
}

function mapProdutoRow(row: any): Produto {
  return {
    id: row.id, diagnosticoId: row.diagnostico_id, nome: row.nome, cadeia: row.cadeia ?? null,
    categoriaId: row.categoria_id ?? null, unidadeMedida: row.unidade_medida ?? null,
    safra: row.safra ?? { estado: 'nao_informada', intervalos: [] },
    canaisComerciais: row.canais_comerciais ?? [], etapasEconomicas: row.etapas_economicas ?? [],
    statusPreenchimento: row.status_preenchimento, respostas: row.respostas ?? {},
    criadoEm: row.criado_em, atualizadoEm: row.atualizado_em,
  };
}

export const listarProdutos = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<Produto[]> => {
    const supabaseAdmin = await getAdmin();
    const { data, error } = await supabaseAdmin.from('diagnostico_produtos').select('*').eq('diagnostico_id', diagnosticoId).order('criado_em');
    if (error) throw new Error(mensagemMapeamento(error));
    return (data ?? []).map(mapProdutoRow);
  });

export const listarCategoriasProduto = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<CategoriaProduto[]> => {
    const db = await getAdmin();
    const { data, error } = await db.from('diagnostico_cesta_categorias').select('id,diagnostico_id,nome').eq('diagnostico_id', diagnosticoId).order('nome');
    if (error) throw new Error(mensagemMapeamento(error));
    return (data ?? []).map((r: any) => ({ id: r.id, diagnosticoId: r.diagnostico_id, nome: r.nome }));
  });

export const criarCategoriaProduto = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; nome: string }) => d)
  .handler(async ({ data }): Promise<CategoriaProduto> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    const nome = data.nome.trim();
    if (!nome || nome.length > 120) throw new Error('Informe uma categoria com até 120 caracteres.');
    const db = await getAdmin();
    const { data: row, error } = await db.from('diagnostico_cesta_categorias').insert({ diagnostico_id: data.diagnosticoId, nome }).select('id,diagnostico_id,nome').single();
    if (error) throw new Error(mensagemMapeamento(error));
    return { id: row.id, diagnosticoId: row.diagnostico_id, nome: row.nome };
  });

export const salvarDadosCestaProduto = createServerFn({ method: 'POST' })
  .validator((d: { produtoId: string; nome?: string; cadeia?: string | null; categoriaId: string | null; unidadeMedida: string | null; safra: SafraProduto; canaisComerciais: CanalComercialProduto[]; etapasEconomicas: EtapaEconomicaProduto[] }) => d)
  .handler(async ({ data }): Promise<Produto> => {
    await exigirProdutoEditavel(data.produtoId);
    if (data.nome !== undefined && (typeof data.nome !== 'string' || !data.nome.trim() || data.nome.length > 500)) throw new Error('Informe um nome de produto/serviço com até 500 caracteres.');
    if (data.cadeia !== undefined && data.cadeia !== null && (typeof data.cadeia !== 'string' || data.cadeia.length > 500)) throw new Error('Revise a cadeia/tipo do produto.');
    if (!['nao_informada','ano_inteiro','sazonal'].includes(data.safra.estado) || !Array.isArray(data.safra.intervalos) || data.safra.intervalos.some(i => !Number.isInteger(i.inicio) || !Number.isInteger(i.fim) || i.inicio < 1 || i.inicio > 12 || i.fim < 1 || i.fim > 12)) throw new Error('Revise a safra e os meses informados.');
    if (data.safra.estado !== 'sazonal' && data.safra.intervalos.length) throw new Error('Informe intervalos somente para safra sazonal.');
    if (!Array.isArray(data.canaisComerciais) || !Array.isArray(data.etapasEconomicas) || JSON.stringify(data).length > 100000) throw new Error('Dados da Cesta invÃ¡lidos ou extensos demais.');
    if (data.canaisComerciais.some(c => !c || typeof c.canal !== 'string' || typeof c.periodoReferencia !== 'string' || typeof c.unidade !== 'string' || typeof c.baseRepasse !== 'string' || !Array.isArray(c.custos) || c.custos.some(k => !k || typeof k.nome !== 'string'))) throw new Error('Revise os canais e custos informados.');
    if (data.canaisComerciais.some(c => c.tipoRepasse === 'percentual' && (!c.baseRepasse.trim() || c.repasse !== null && c.repasse > 100))) throw new Error('Informe a base do percentual e use um repasse entre 0 e 100%.');
    if (data.canaisComerciais.some(c => [c.valorCompra,c.valorVenda,c.repasse,c.parcelaOrganizacao,...c.custos.map(k=>k.valor)].some(v=>v!==null) && !(c.unidade || data.unidadeMedida || '').trim())) throw new Error('Informe a unidade para comparar os valores do canal.');
    if (data.etapasEconomicas.some(e => !e || typeof e.etapa !== 'string' || typeof e.executor !== 'string' || typeof e.pagador !== 'string' || typeof e.recebedor !== 'string' || typeof e.unidade !== 'string' || !['','custo','pagamento_produto','receita_servico','repasse'].includes(e.natureza))) throw new Error('Revise as etapas e os participantes informados.');
    if (data.etapasEconomicas.some(e => e.valor !== null && !e.unidade.trim())) throw new Error('Informe a unidade do valor da etapa.');
    const finiteValues = [
      ...data.canaisComerciais.flatMap(c => [c.valorCompra,c.valorVenda,c.repasse,c.parcelaOrganizacao,...c.custos.map(k=>k.valor)]),
      ...data.etapasEconomicas.map(e=>e.valor),
    ];
    if (finiteValues.some(v => v !== null && (!Number.isFinite(v) || v < 0))) throw new Error('Valores devem ser não negativos ou permanecer não informados.');
    const db = await getAdmin();
    const { data: row, error } = await db.from('diagnostico_produtos').update({ ...(data.nome !== undefined ? { nome: data.nome.trim() } : {}), ...(data.cadeia !== undefined ? { cadeia: data.cadeia?.trim() || null } : {}), categoria_id: data.categoriaId, unidade_medida: data.unidadeMedida?.trim() || null, safra: data.safra, canais_comerciais: data.canaisComerciais, etapas_economicas: data.etapasEconomicas, atualizado_em: new Date().toISOString() }).eq('id', data.produtoId).select('*').single();
    if (error) throw new Error(mensagemMapeamento(error));
    return mapProdutoRow(row);
  });

export const criarProduto = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; nome: string; cadeia: string | null }) => d)
  .handler(async ({ data }): Promise<Produto> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_produtos')
      .insert({ diagnostico_id: data.diagnosticoId, nome: data.nome, cadeia: data.cadeia, respostas: {} })
      .select('*')
      .single();
    if (error) throw new Error(mensagemMapeamento(error));
    return mapProdutoRow(row);
  });

export const salvarRespostasProduto = createServerFn({ method: 'POST' })
  .validator((d: {
    produtoId: string; nome: string; cadeia: string | null;
    respostas: Record<string, string | string[] | number | null>; statusPreenchimento: ProdutoStatusPreenchimento;
  }) => d)
  .handler(async ({ data }): Promise<Produto> => {
    await exigirProdutoEditavel(data.produtoId);
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
    if (error) throw new Error(mensagemMapeamento(error));
    return mapProdutoRow(row);
  });

export const excluirProduto = createServerFn({ method: 'POST' })
  .validator((d: { produtoId: string }) => d)
  .handler(async ({ data: { produtoId } }): Promise<void> => {
    await exigirProdutoEditavel(produtoId);
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('diagnostico_produtos').delete().eq('id', produtoId);
    if (error) throw new Error(mensagemMapeamento(error));
  });

// ---------------------------------------------------------------------------
// Parecer Técnico (RF-02.D)
// ---------------------------------------------------------------------------
export type SituacaoEvidenciaDiagnostico = 'Consultado' | 'Não apresentado' | 'Relatado' | 'Pendente de conferência';
export interface DocumentoEvidenciaDiagnostico {
  id: string; nomeArquivo: string; tipoMime: string | null; tamanhoBytes: number | null; criadoEm: string;
}
export interface EvidenciaVinculada {
  id?: string; codigo?: string; codigosRelacionados?: string; titulo?: string;
  situacao?: SituacaoEvidenciaDiagnostico | string; referencia?: string;
  oQueComprova?: string; limiteDuvida?: string; pendencia?: string; responsavel?: string;
  fontePagina?: string; documentos?: DocumentoEvidenciaDiagnostico[];
  /** Campos antigos preservados ao editar registros anteriores. */
  tipo?: string; nota?: string;
}

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
    if (error) throw new Error(mensagemMapeamento(error));
    return mapParecer(row, diagnosticoId);
  });

export const salvarParecer = createServerFn({ method: 'POST' })
  .validator((d: {
    diagnosticoId: string; respostasComplementares: Record<string, string | string[] | null>;
    sintese: string | null; capacidades: string | null; fragilidades: string | null;
    pontosPrioritarios: string | null; consideracoesTecnicas: string | null; evidenciasVinculadas: EvidenciaVinculada[];
  }) => d)
  .handler(async ({ data }): Promise<Parecer> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
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
    if (error) throw new Error(mensagemMapeamento(error));
    return mapParecer(row, data.diagnosticoId);
  });

const SITUACOES_EVIDENCIA: SituacaoEvidenciaDiagnostico[] = ['Consultado', 'Não apresentado', 'Relatado', 'Pendente de conferência'];
const TAMANHO_MAXIMO_EVIDENCIA = 20 * 1024 * 1024;
const TIPOS_EVIDENCIA_ACEITOS = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain',
];

function validarEvidenciasDiagnostico(evidencias: EvidenciaVinculada[]) {
  if (!Array.isArray(evidencias) || evidencias.length > 500) throw new Error('Lista de evidências inválida ou extensa demais.');
  const codigos = new Set<string>();
  for (const e of evidencias) {
    if (!e || typeof e.codigo !== 'string' || !/^EV\d{3,}$/.test(e.codigo) || codigos.has(e.codigo)) throw new Error('Cada evidência precisa ter um código EV único, como EV001.');
    codigos.add(e.codigo);
    for (const campo of ['codigosRelacionados', 'titulo', 'referencia', 'oQueComprova', 'limiteDuvida', 'pendencia', 'responsavel', 'fontePagina'] as const) {
      const valor = e[campo];
      if (valor != null && (typeof valor !== 'string' || valor.length > 20000)) throw new Error(`Revise o campo ${campo} da evidência ${e.codigo}.`);
    }
    if (e.situacao && !SITUACOES_EVIDENCIA.includes(e.situacao as SituacaoEvidenciaDiagnostico)) throw new Error(`Situação inválida na evidência ${e.codigo}.`);
    if (e.documentos && !Array.isArray(e.documentos)) throw new Error(`Lista de documentos inválida na evidência ${e.codigo}.`);
  }
}

/** Atualiza somente a lista de evidências, sem sobrescrever campos do Parecer. */
export const salvarEvidenciasDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; evidencias: EvidenciaVinculada[] }) => d)
  .handler(async ({ data }): Promise<EvidenciaVinculada[]> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    validarEvidenciasDiagnostico(data.evidencias);
    const db = await getAdmin();
    const atuais = await db.from('diagnostico_parecer').select('evidencias_vinculadas').eq('diagnostico_id', data.diagnosticoId).maybeSingle();
    if (atuais.error) throw new Error(mensagemMapeamento(atuais.error));
    const antigas = (atuais.data?.evidencias_vinculadas ?? []) as EvidenciaVinculada[];
    const vinculacoesAntigas = new Map<string, string>();
    for (const e of antigas) for (const doc of e.documentos ?? []) vinculacoesAntigas.set(doc.id, e.codigo ?? e.id ?? '');
    const vinculacoesNovas = new Map<string, string>();
    for (const e of data.evidencias) for (const doc of e.documentos ?? []) {
      if (!doc?.id || vinculacoesNovas.has(doc.id)) throw new Error('Um documento não pode aparecer em mais de uma evidência.');
      vinculacoesNovas.set(doc.id, e.codigo!);
      if (vinculacoesAntigas.has(doc.id) && vinculacoesAntigas.get(doc.id) !== e.codigo) throw new Error('Um documento existente não pode ser transferido para outra evidência.');
      if (!vinculacoesAntigas.has(doc.id)) throw new Error('Use a ação de anexar documento para criar um novo vínculo.');
    }
    for (const id of vinculacoesAntigas.keys()) if (!vinculacoesNovas.has(id)) throw new Error('Remova documentos pela ação própria para preservar o vínculo do arquivo.');
    if (vinculacoesNovas.size) {
      const arquivos = await db.from('diagnostico_anexos').select('id,diagnostico_id').in('id', [...vinculacoesNovas.keys()]);
      if (arquivos.error || (arquivos.data ?? []).length !== vinculacoesNovas.size || arquivos.data?.some(a => a.diagnostico_id !== data.diagnosticoId)) throw new Error('Um documento não pertence a este mapeamento.');
    }
    const payload = { diagnostico_id: data.diagnosticoId, evidencias_vinculadas: data.evidencias, atualizado_em: new Date().toISOString() };
    const gravacao = atuais.data
      ? await db.from('diagnostico_parecer').update({ evidencias_vinculadas: payload.evidencias_vinculadas, atualizado_em: payload.atualizado_em }).eq('diagnostico_id', data.diagnosticoId)
      : await db.from('diagnostico_parecer').insert(payload);
    if (gravacao.error) throw new Error(mensagemMapeamento(gravacao.error));
    return data.evidencias;
  });

export const prepararUploadAnexoEvidencia = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; codigo: string; nomeArquivo: string; tipoMime: string; tamanhoBytes: number }) => d)
  .handler(async ({ data }): Promise<{ storagePath: string; token: string }> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    if (!/^EV\d{3,}$/.test(data.codigo) || typeof data.nomeArquivo !== 'string' || !data.nomeArquivo.trim() || data.nomeArquivo.length > 255 || [...data.nomeArquivo].some(c => c.charCodeAt(0) < 32)) throw new Error('Revise o código e o nome do documento.');
    if (!TIPOS_EVIDENCIA_ACEITOS.includes(data.tipoMime) || !Number.isSafeInteger(data.tamanhoBytes) || data.tamanhoBytes <= 0 || data.tamanhoBytes > TAMANHO_MAXIMO_EVIDENCIA) throw new Error('Use PDF, documento, planilha, texto ou imagem de até 20 MB.');
    const db = await getAdmin();
    const { data: parecer, error } = await db.from('diagnostico_parecer').select('evidencias_vinculadas').eq('diagnostico_id', data.diagnosticoId).maybeSingle();
    if (error) throw new Error(mensagemMapeamento(error));
    const evidencia = ((parecer?.evidencias_vinculadas ?? []) as EvidenciaVinculada[]).find(e => e.codigo === data.codigo);
    if (!evidencia) throw new Error('Salve a evidência antes de anexar um documento.');
    const seguro = data.nomeArquivo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w.\-]/g, '_').slice(-90);
    const { randomUUID } = await import('node:crypto');
    const storagePath = `${data.diagnosticoId}/evidencias/${data.codigo}/${randomUUID()}-${seguro}`;
    const { data: signed, error: uploadError } = await db.storage.from('diagnostico-anexos').createSignedUploadUrl(storagePath);
    if (uploadError || !signed?.token) throw new Error(uploadError?.message ?? 'Não foi possível preparar o envio do documento.');
    return { storagePath, token: signed.token };
  });

/** Registra no banco o arquivo já enviado pela URL assinada e o vincula ao EV. */
export const registrarAnexoEvidencia = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; codigo: string; storagePath: string; nomeArquivo: string; tipoMime: string; tamanhoBytes: number }) => d)
  .handler(async ({ data }): Promise<EvidenciaVinculada[]> => {
    const usuario = await exigirDiagnosticoEditavel(data.diagnosticoId);
    const prefixoEsperado = `${data.diagnosticoId}/evidencias/${data.codigo}/`;
    const nomeStorage = typeof data.storagePath === 'string' ? data.storagePath.slice(prefixoEsperado.length) : '';
    if (!/^EV\d{3,}$/.test(data.codigo) || !data.storagePath.startsWith(prefixoEsperado) || !/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}-[\w.-]{1,90}$/i.test(nomeStorage) || typeof data.nomeArquivo !== 'string' || !data.nomeArquivo.trim() || data.nomeArquivo.length > 255 || [...data.nomeArquivo].some(c => c.charCodeAt(0) < 32) || !TIPOS_EVIDENCIA_ACEITOS.includes(data.tipoMime) || !Number.isSafeInteger(data.tamanhoBytes) || data.tamanhoBytes <= 0 || data.tamanhoBytes > TAMANHO_MAXIMO_EVIDENCIA) throw new Error('Vínculo ou dados do documento inválidos.');
    const db = await getAdmin();
    const registro = await db.from('diagnostico_parecer').select('evidencias_vinculadas').eq('diagnostico_id', data.diagnosticoId).maybeSingle();
    if (registro.error || !registro.data) throw new Error('Salve a evidência antes de anexar um documento.');
    const evidencias = (registro.data.evidencias_vinculadas ?? []) as EvidenciaVinculada[];
    const index = evidencias.findIndex(e => e.codigo === data.codigo);
    if (index < 0) throw new Error('A evidência selecionada não pertence a este mapeamento.');
    const arquivoStorage = await db.storage.from('diagnostico-anexos').createSignedUrl(data.storagePath, 60);
    if (arquivoStorage.error) throw new Error('O arquivo não foi encontrado no armazenamento privado.');
    const { data: anexo, error: insertError } = await db.from('diagnostico_anexos').insert({
      diagnostico_id: data.diagnosticoId, checklist_item_id: null, storage_path: data.storagePath,
      nome_arquivo: data.nomeArquivo, tipo_mime: data.tipoMime || null, tamanho_bytes: data.tamanhoBytes, enviado_por: usuario.displayName,
    }).select('*').single();
    if (insertError) { await db.storage.from('diagnostico-anexos').remove([data.storagePath]); throw new Error(mensagemMapeamento(insertError)); }
    const atualizado = [...evidencias];
    const atual = atualizado[index];
    atualizado[index] = { ...atual, documentos: [...(atual.documentos ?? []), { id: anexo.id, nomeArquivo: anexo.nome_arquivo, tipoMime: anexo.tipo_mime, tamanhoBytes: anexo.tamanho_bytes, criadoEm: anexo.criado_em }] };
    const save = await db.from('diagnostico_parecer').update({ evidencias_vinculadas: atualizado, atualizado_em: new Date().toISOString() }).eq('diagnostico_id', data.diagnosticoId);
    if (save.error) {
      await db.from('diagnostico_anexos').delete().eq('id', anexo.id);
      await db.storage.from('diagnostico-anexos').remove([data.storagePath]);
      throw new Error(mensagemMapeamento(save.error));
    }
    return atualizado;
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
    if (error) throw new Error(mensagemMapeamento(error));
    return (data ?? []).map(mapChecklistItem);
  });

export const salvarChecklistItem = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoId: string; itemId: number; disponivel: 'Sim' | 'Não' | 'N/A' | null; observacoes: string | null }) => d)
  .handler(async ({ data }): Promise<ChecklistItemResposta> => {
    await exigirDiagnosticoEditavel(data.diagnosticoId);
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin
      .from('diagnostico_checklist_itens')
      .upsert(
        { diagnostico_id: data.diagnosticoId, item_id: data.itemId, disponivel: data.disponivel, observacoes: data.observacoes, atualizado_em: new Date().toISOString() },
        { onConflict: 'diagnostico_id,item_id' },
      )
      .select('*')
      .single();
    if (error) throw new Error(mensagemMapeamento(error));
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
    const usuario = await exigirDiagnosticoEditavel(data.diagnosticoId);
    const supabaseAdmin = await getAdmin();
    if(typeof data.conteudoBase64 !== 'string' || data.conteudoBase64.length > Math.ceil(LIMITE_DOCUMENTO * 4 / 3) + 256) throw new Error('O documento deve ter no máximo 3 MB.');
    const base64 = data.conteudoBase64.includes(',') ? data.conteudoBase64.split(',')[1] : data.conteudoBase64;
    const buffer = Buffer.from(base64, 'base64');
    validarDocumento(data.nomeArquivo,data.tipoMime,buffer.byteLength);
    const {randomUUID} = await import('node:crypto');
    const storagePath = `${data.diagnosticoId}/${data.itemId}/${randomUUID()}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('diagnostico-anexos')
      .upload(storagePath, buffer, { contentType: data.tipoMime || 'application/octet-stream' });
    if (uploadError) throw new Error(uploadError.message);

    const { data: anexoRow, error: anexoError } = await supabaseAdmin
      .from('diagnostico_anexos')
      .insert({
        diagnostico_id: data.diagnosticoId, checklist_item_id: data.itemId, storage_path: storagePath,
        nome_arquivo: data.nomeArquivo, tipo_mime: data.tipoMime || null, tamanho_bytes: buffer.length, enviado_por: usuario.displayName,
      })
      .select('*')
      .single();
    if (anexoError) {
      await supabaseAdmin.storage.from('diagnostico-anexos').remove([storagePath]);
      throw new Error(anexoError.message);
    }

    const { data: itemRow, error: itemError } = await supabaseAdmin
      .from('diagnostico_checklist_itens')
      .upsert(
        { diagnostico_id: data.diagnosticoId, item_id: data.itemId, anexo_id: anexoRow.id, atualizado_em: new Date().toISOString() },
        { onConflict: 'diagnostico_id,item_id' },
      )
      .select('*')
      .single();
    if (itemError) {
      await supabaseAdmin.from('diagnostico_anexos').delete().eq('id',anexoRow.id);
      await supabaseAdmin.storage.from('diagnostico-anexos').remove([storagePath]);
      throw new Error(itemError.message);
    }
    return mapChecklistItem(itemRow);
  });

export const getAnexo = createServerFn({ method: 'GET' })
  .validator((d: { anexoId: string }) => d)
  .handler(async ({ data: { anexoId } }): Promise<{ anexo: Anexo; url: string }> => {
    const supabaseAdmin = await getAdmin();
    const { data: row, error } = await supabaseAdmin.from('diagnostico_anexos').select('*').eq('id', anexoId).single();
    if (error) throw new Error(mensagemMapeamento(error));
    const { data: signed, error: signError } = await supabaseAdmin.storage
      .from('diagnostico-anexos')
      .createSignedUrl(row.storage_path, 60 * 10);
    if (signError) throw new Error(signError.message);
    return { anexo: mapAnexo(row), url: signed.signedUrl };
  });

// ---------------------------------------------------------------------------
// Relatórios > Mapeamentos (RF-03)
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
    if (error) throw new Error(mensagemMapeamento(error));
    return (data ?? []).map((row: any) => ({
      diagnosticoId: row.id, dataAplicacao: row.data_aplicacao, versao: row.versao,
      comunidadeNome: nomeCurtoOrg(row.comunidades?.nome ?? '—'), comunidadeCode: row.comunidades?.code ?? '',
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
  caderno?: RegistroCaderno[];
}

export const getDadosCompletosDiagnostico = createServerFn({ method: 'GET' })
  .validator((d: { diagnosticoId: string }) => d)
  .handler(async ({ data: { diagnosticoId } }): Promise<DiagnosticoCompleto> => {
    const supabaseAdmin = await getAdmin();
    const [diagRes, matrizRes, ieoRes, produtosRes, parecerRes, cadernoRes] = await Promise.all([
      supabaseAdmin.from('diagnosticos').select('*, comunidades(nome, code, segmento_social)').eq('id', diagnosticoId).single(),
      supabaseAdmin.from('diagnostico_matriz').select('*').eq('diagnostico_id', diagnosticoId),
      supabaseAdmin.from('diagnostico_ieo').select('*').eq('diagnostico_id', diagnosticoId),
      supabaseAdmin.from('diagnostico_produtos').select('*').eq('diagnostico_id', diagnosticoId).order('criado_em'),
      supabaseAdmin.from('diagnostico_parecer').select('*').eq('diagnostico_id', diagnosticoId).maybeSingle(),
      supabaseAdmin.from('diagnostico_caderno_respostas').select('*').eq('diagnostico_id', diagnosticoId).order('codigo'),
    ]);
    if (diagRes.error) throw new Error(mensagemMapeamento(diagRes.error));
    if (matrizRes.error) throw new Error(mensagemMapeamento(matrizRes.error));
    if (ieoRes.error) throw new Error(mensagemMapeamento(ieoRes.error));
    if (produtosRes.error) throw new Error(mensagemMapeamento(produtosRes.error));
    if (parecerRes.error) throw new Error(mensagemMapeamento(parecerRes.error));
    if (cadernoRes.error) throw new Error('Não foi possível carregar as respostas do Caderno CRIA para o relatório: ' + mensagemMapeamento(cadernoRes.error));

    const comunidadeRow: any = (diagRes.data as any).comunidades ?? {};
    return {
      diagnostico: mapDiagnostico(diagRes.data),
      comunidade: { nome: nomeCurtoOrg(comunidadeRow.nome ?? '—'), code: comunidadeRow.code ?? '', classificacao: comunidadeRow.segmento_social ?? '' },
      matriz: (matrizRes.data ?? []).filter((r:any)=>/^F(0[1-9]|1[0-9]|2[01])$/.test(r.funcao_id)).map(mapMatrizResposta),
      ieo: (ieoRes.data ?? []).map(mapIeoResposta),
      produtos: (produtosRes.data ?? []).map(mapProdutoRow),
      parecer: mapParecer(parecerRes.data, diagnosticoId),
      caderno: cadernoRes.data ?? [],
    };
  });

/** Copia uma tabela filha (chave composta diagnostico_id+campo) de um mapeamento pra outro. */
async function copiarFilhaComposta(supabaseAdmin: any, tabela: string, deId: string, paraId: string) {
  const { data: linhas, error } = await supabaseAdmin.from(tabela).select('*').eq('diagnostico_id', deId);
  if (error) throw new Error(mensagemMapeamento(error));
  if (!linhas?.length) return;
  const copias = linhas.map((l: any) => ({ ...l, diagnostico_id: paraId }));
  const { error: insError } = await supabaseAdmin.from(tabela).insert(copias);
  if (insError) throw new Error(insError.message);
}

export const criarNovaVersaoDiagnostico = createServerFn({ method: 'POST' })
  .validator((d: { diagnosticoAnteriorId: string }) => d)
  .handler(async ({ data: { diagnosticoAnteriorId } }): Promise<DiagnosticoResumo> => {
    await exigirEscritaDiagnostico();
    const supabaseAdmin = await getAdmin();
    const { data: anterior, error: getError } = await supabaseAdmin
      .from('diagnosticos')
      .select('*')
      .eq('id', diagnosticoAnteriorId)
      .single();
    if (getError) throw new Error(getError.message);
    if (anterior.status !== 'concluido') throw new Error('Conclua a versão atual antes de criar outra.');
    const caderno = await supabaseAdmin.from('diagnostico_caderno_respostas').select('*').eq('diagnostico_id', diagnosticoAnteriorId);
    if (caderno.error) throw new Error(mensagemMapeamento(caderno.error));

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
    const { data: categorias, error: catError } = await supabaseAdmin
      .from('diagnostico_cesta_categorias')
      .select('id,nome')
      .eq('diagnostico_id', diagnosticoAnteriorId);
    if (catError) throw new Error(mensagemMapeamento(catError));
    const categoriasNovas = new Map<string,string>();
    if (categorias?.length) {
      const copias = categorias.map((c: any) => { const id = crypto.randomUUID(); categoriasNovas.set(c.id,id); return { id, diagnostico_id: nova.id, nome: c.nome }; });
      const { error } = await supabaseAdmin.from('diagnostico_cesta_categorias').insert(copias);
      if (error) throw new Error(mensagemMapeamento(error));
    }
    const produtosNovos = new Map<string,string>();
    if (produtos?.length) {
      const copias = produtos.map(({ id: anteriorId, categoria_id: categoriaAnterior, ...rest }: any) => { const id = crypto.randomUUID(); produtosNovos.set(anteriorId,id); return { ...rest, id, diagnostico_id: nova.id, categoria_id: categoriaAnterior ? categoriasNovas.get(categoriaAnterior) ?? null : null }; });
      const { error } = await supabaseAdmin.from('diagnostico_produtos').insert(copias);
      if (error) throw new Error(mensagemMapeamento(error));
    }

    if (caderno.data?.length) {
      const copias = caderno.data.map((r:any) => {
        const produto = r.produto_id ? produtosNovos.get(r.produto_id) : null;
        if (r.produto_id && !produto) throw new Error('Vínculo do produto não encontrado ao copiar o caderno.');
        return { ...r, diagnostico_id: nova.id, produto_id: produto, contexto: produto ?? r.contexto, versao: 1 };
      });
      const escrita = await supabaseAdmin.from('diagnostico_caderno_respostas').insert(copias);
      if (escrita.error) throw new Error(mensagemMapeamento(escrita.error));
    }

    const { data: parecer, error: parecerError } = await supabaseAdmin
      .from('diagnostico_parecer')
      .select('*')
      .eq('diagnostico_id', diagnosticoAnteriorId)
      .maybeSingle();
    if (parecerError) throw new Error(parecerError.message);
    if (parecer) {
      const { error } = await supabaseAdmin.from('diagnostico_parecer').insert({ ...parecer, diagnostico_id: nova.id });
      if (error) throw new Error(mensagemMapeamento(error));
    }

    return mapDiagnostico(nova);
  });
