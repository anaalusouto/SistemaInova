/**
 * Anexos de atividade e de registro de contato (RF-009, RF-026, RF-032, RN-002).
 *
 * O bucket `projeto-anexos` é PRIVADO. Nenhuma URL pública é gerada em momento
 * algum: a leitura sai sempre por URL assinada de vida curta, emitida aqui
 * depois de checar a sessão. É isso que atende o RN-002 — "um link direto para
 * arquivo não deve permitir acesso não autorizado". Guardar o arquivo em bucket
 * público e confiar na obscuridade do caminho não seria controle de acesso.
 *
 * Mesmo padrão já usado pelo Diagnóstico (ver diagnosticos.server.ts), com uma
 * diferença que o RF-032 exige: se a gravação da linha falhar depois do upload,
 * o arquivo é apagado do storage. Uma referência quebrada é pior do que um
 * upload que não aconteceu, porque a tela passa a prometer um arquivo que não
 * existe.
 */
import { createServerFn } from '@tanstack/react-start';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}
async function exigirEscrita() {
  const m = await import('./sessao.server');
  return m.exigirEscrita();
}
/** Leitura de anexo exige sessão, de qualquer papel — a SEMAS consulta (seção 2). */
async function exigirSessao() {
  const m = await import('./sessao.server');
  return m.exigirSessao();
}

const BUCKET = 'projeto-anexos';

/**
 * Limites iniciais, tratados como configuráveis (RF-009). Ficam nomeados aqui
 * para que a mudança seja num lugar só, e não uma caçada por comparações
 * soltas pela interface.
 */
export const LIMITE_BYTES = 20 * 1024 * 1024;
export const TIPOS_ACEITOS = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const;

/** Extensões correspondentes, para o atributo accept do seletor de arquivo. */
export const EXTENSOES_ACEITAS = '.png,.jpg,.jpeg,.webp,.gif,.pdf,.doc,.docx,.odt,.xls,.xlsx,.txt';

export class AnexoInvalido extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'AnexoInvalido';
  }
}

export interface AnexoInput {
  projetoId: number;
  /** Exatamente um dos dois — o CHECK da tabela recusa o contrário. */
  atividadeId?: string | null;
  logComunicacaoId?: string | null;
  nomeArquivo: string;
  tipoMime: string;
  /** Conteúdo como data URL base64, mesmo transporte já usado no Diagnóstico. */
  dataUrl: string;
}

function decodificar(dataUrl: string): Buffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Buffer.from(base64, 'base64');
}

/** Caminho seguro: nome do arquivo saneado, nunca interpolado cru. */
function caminho(projetoId: number, pasta: string, parentId: string, nome: string): string {
  const seguro = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]/g, '_').slice(-80);
  return `${projetoId}/${pasta}/${parentId}/${Date.now()}-${seguro}`;
}

/**
 * Envia o anexo e substitui o anterior, se houver.
 *
 * Atividade e registro de contato aceitam UM arquivo por vez (RF-009, RF-026):
 * enviar outro substitui. A remoção do antigo acontece depois do novo estar
 * gravado — se a ordem fosse inversa, uma falha no meio deixaria o registro sem
 * anexo nenhum.
 */
export const enviarAnexo = createServerFn({ method: 'POST' })
  .validator((d: AnexoInput) => d)
  .handler(async ({ data }): Promise<string> => {
    const sessao = await exigirEscrita();

    if (!data.atividadeId && !data.logComunicacaoId) {
      throw new AnexoInvalido('O anexo precisa pertencer a uma atividade ou a um registro de contato.');
    }
    if (data.atividadeId && data.logComunicacaoId) {
      throw new AnexoInvalido('O anexo pertence a um único registro.');
    }
    if (!TIPOS_ACEITOS.includes(data.tipoMime as (typeof TIPOS_ACEITOS)[number])) {
      throw new AnexoInvalido(
        'Tipo de arquivo não aceito. Use imagem, PDF, DOC, DOCX, ODT, XLS, XLSX ou TXT.',
      );
    }

    const conteudo = decodificar(data.dataUrl);
    if (conteudo.byteLength === 0) throw new AnexoInvalido('O arquivo está vazio.');
    if (conteudo.byteLength > LIMITE_BYTES) {
      throw new AnexoInvalido(`O arquivo tem ${(conteudo.byteLength / 1048576).toFixed(1)} MB e o limite é 20 MB.`);
    }

    const supabaseAdmin = await getAdmin();
    const pasta = data.atividadeId ? 'atividades' : 'contatos';
    const parentId = (data.atividadeId ?? data.logComunicacaoId)!;
    const storagePath = caminho(data.projetoId, pasta, parentId, data.nomeArquivo);

    const { error: erroUpload } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, conteudo, { contentType: data.tipoMime, upsert: false });
    if (erroUpload) throw new Error(`Falha no envio do arquivo: ${erroUpload.message}`);

    const { data: linha, error: erroLinha } = await supabaseAdmin
      .from('projeto_anexos')
      .insert({
        projeto_id: data.projetoId,
        atividade_id: data.atividadeId ?? null,
        log_comunicacao_id: data.logComunicacaoId ?? null,
        storage_path: storagePath,
        nome_arquivo: data.nomeArquivo,
        tipo_mime: data.tipoMime,
        tamanho_bytes: conteudo.byteLength,
        enviado_por: sessao.displayName,
      })
      .select('id')
      .single();

    if (erroLinha) {
      // RF-032: registrar a falha SEM deixar referência quebrada. O arquivo já
      // subiu, então precisa sair — senão fica órfão no storage, cobrando
      // espaço e sem nada apontando para ele.
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
      throw new Error(`Falha ao registrar o anexo: ${erroLinha.message}`);
    }

    // Substituição: só agora o anterior sai, com o novo já garantido.
    const coluna = data.atividadeId ? 'atividade_id' : 'log_comunicacao_id';
    const { data: antigos } = await supabaseAdmin
      .from('projeto_anexos')
      .select('id, storage_path')
      .eq(coluna, parentId)
      .neq('id', linha.id);

    if (antigos?.length) {
      const { error: erroLimpeza } = await supabaseAdmin.storage
        .from(BUCKET).remove(antigos.map(a => a.storage_path as string));
      // Falha na limpeza NÃO derruba a substituição: o anexo novo já está
      // válido e recusar aqui deixaria a pessoa sem entender o que aconteceu.
      // Mas precisa ficar registrado — um arquivo órfão no storage é invisível
      // até alguém ir procurar, e sem log ninguém vai.
      if (erroLimpeza) {
        console.error('[anexos] arquivo antigo não removido do storage:',
          { caminhos: antigos.map(a => a.storage_path), erro: erroLimpeza.message });
      }
      await supabaseAdmin.from('projeto_anexos').delete().in('id', antigos.map(a => a.id));
    }

    return linha.id as string;
  });

/**
 * URL assinada de vida curta para abrir o anexo.
 *
 * Exige sessão: é o ponto que impede um link direto de virar acesso público
 * (RN-002). A URL vale 10 minutos — tempo de abrir o arquivo, não de
 * compartilhá-lo por aí.
 */
export const urlDoAnexo = createServerFn({ method: 'POST' })
  .validator((d: { anexoId: string }) => d)
  .handler(async ({ data: { anexoId } }): Promise<{ url: string; nomeArquivo: string; tipoMime: string | null }> => {
    await exigirSessao();
    const supabaseAdmin = await getAdmin();

    const { data: anexo, error } = await supabaseAdmin
      .from('projeto_anexos')
      .select('storage_path, nome_arquivo, tipo_mime')
      .eq('id', anexoId)
      .single();
    if (error || !anexo) throw new Error('Anexo não encontrado.');

    const { data: assinada, error: erroUrl } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(anexo.storage_path as string, 60 * 10);
    if (erroUrl || !assinada) throw new Error('Não foi possível gerar o acesso ao arquivo.');

    return {
      url: assinada.signedUrl,
      nomeArquivo: anexo.nome_arquivo as string,
      tipoMime: (anexo.tipo_mime as string) ?? null,
    };
  });

/** Remove o anexo do storage e do banco. Sem arquivo órfão, sem linha órfã. */
export const removerAnexo = createServerFn({ method: 'POST' })
  .validator((d: { anexoId: string }) => d)
  .handler(async ({ data: { anexoId } }): Promise<void> => {
    await exigirEscrita();
    const supabaseAdmin = await getAdmin();

    const { data: anexo } = await supabaseAdmin
      .from('projeto_anexos').select('storage_path').eq('id', anexoId).single();
    if (!anexo) return;

    const { error: erroStorage } = await supabaseAdmin.storage
      .from(BUCKET).remove([anexo.storage_path as string]);
    if (erroStorage) {
      console.error('[anexos] arquivo não removido do storage:',
        { caminho: anexo.storage_path, erro: erroStorage.message });
    }
    const { error } = await supabaseAdmin.from('projeto_anexos').delete().eq('id', anexoId);
    if (error) throw new Error(error.message);
  });
