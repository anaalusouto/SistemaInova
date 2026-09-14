// Server functions do módulo Diagnóstico (RF-02) para a entidade "Organização"
// (tabela `comunidades`, onda 2 — schema já existia, mas nunca teve CRUD real
// ligado; o frontend usava só o seed local em src/app/data/comunidades.ts).
// Mesmo padrão de src/app/projetos.server.ts: createServerFn + getAdmin() via
// dynamic import + throw new Error(error.message).
//
// Escopo desta rodada: só leitura, o suficiente para o módulo Diagnóstico
// listar/selecionar organizações. CRUD completo de Organização (criar, editar
// pessoas/fornecedores/capacitações etc.) não foi pedido pelo RF-02 e não é
// necessário aqui — quem ainda gerencia esses dados é o seed local existente.
import { createServerFn } from '@tanstack/react-start';

async function getAdmin() {
  const { supabaseAdmin } = await import('../integrations/supabase/client.server');
  return supabaseAdmin;
}

export interface ComunidadeResumo {
  id: string;
  code: string;
  nome: string;
  /** "Classificação" (Indígena/Quilombola/Tradicional/Agricultura Familiar) — mora em segmento_social. */
  classificacao: string;
  municipio: string | null;
  uf: string | null;
  status: string;
}

function mapComunidade(row: any): ComunidadeResumo {
  return {
    id: row.id, code: row.code, nome: row.nome,
    classificacao: row.segmento_social ?? '', municipio: row.municipio ?? null, uf: row.uf ?? null,
    status: row.status,
  };
}

export const listarComunidades = createServerFn({ method: 'GET' }).handler(async (): Promise<ComunidadeResumo[]> => {
  const supabaseAdmin = await getAdmin();
  const { data, error } = await supabaseAdmin.from('comunidades').select('*').order('nome');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapComunidade);
});
