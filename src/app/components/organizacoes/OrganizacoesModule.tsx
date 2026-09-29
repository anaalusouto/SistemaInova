import { useState } from 'react';
import { ListaOrganizacoes } from './ListaOrganizacoes';
import { FichaOrganizacao } from './FichaOrganizacao';
import { FILTROS_VAZIOS, type FiltrosOrganizacao } from '../../lib/organizacoes';

/** Busca e filtros preservados enquanto a sessão estiver aberta — abrir uma
 *  ficha, ir a um projeto e voltar não limpa (mesmo padrão da lista de Projetos). */
let filtrosMemoria: FiltrosOrganizacao = FILTROS_VAZIOS;

export function OrganizacoesModule({ aoAbrirProjeto }: { aoAbrirProjeto: (id: number) => void }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const [filtros, setFiltrosState] = useState<FiltrosOrganizacao>(filtrosMemoria);
  const setFiltros = (f: FiltrosOrganizacao) => { filtrosMemoria = f; setFiltrosState(f); };
  if (aberta) {
    return <FichaOrganizacao organizacaoId={aberta} aoVoltar={() => setAberta(null)} aoAbrirProjeto={aoAbrirProjeto} />;
  }
  return <ListaOrganizacoes aoAbrir={setAberta} filtros={filtros} aoMudarFiltros={setFiltros} />;
}
