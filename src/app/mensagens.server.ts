// Mural de mensagens internas (ver supabase/migrations/0005_mensagens.sql).
// Mensagem pra todos, sem thread/destinatário. Igual a outras leituras públicas
// deste app (listarPessoas etc.), sem exigir senha — o login já vem da sessão
// local do cliente.
import { createServerFn } from '@tanstack/react-start';

export interface Mensagem {
  id: string;
  autorLogin: string;
  autorNome: string;
  texto: string;
  criadoEm: string;
}

const MAX_MENSAGENS = 200;
const MAX_TEXTO = 2000;

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

function toMensagem(row: any): Mensagem {
  return { id: row.id, autorLogin: row.autor_login, autorNome: row.autor_nome, texto: row.texto, criadoEm: row.criado_em };
}

/** Últimas mensagens do mural, em ordem cronológica (mais antiga primeiro). */
export const listarMensagens = createServerFn({ method: 'GET' }).handler(async (): Promise<Mensagem[]> => {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin
    .from('mensagens')
    .select('*')
    .order('criado_em', { ascending: false })
    .limit(MAX_MENSAGENS);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toMensagem).reverse();
});

/** Envia uma mensagem para o mural (visível a todos). */
export const enviarMensagem = createServerFn({ method: 'POST' })
  .validator((d: { autorLogin: string; autorNome: string; texto: string }) => d)
  .handler(async ({ data }): Promise<void> => {
    const texto = data.texto.trim();
    if (!texto) throw new Error('Mensagem vazia.');
    if (texto.length > MAX_TEXTO) throw new Error('Mensagem muito longa.');
    const supabaseAdmin = await getAdmin();
    const { error } = await supabaseAdmin.from('mensagens').insert({
      autor_login: data.autorLogin.trim(),
      autor_nome: data.autorNome.trim(),
      texto,
    });
    if (error) throw new Error(error.message);
  });
