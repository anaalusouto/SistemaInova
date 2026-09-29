/**
 * Módulo Organizações — o hub da navegação (29/09/2026).
 *
 * Início: Visão Geral do portfólio e, abaixo, a lista de organizações.
 * Com uma organização aberta: a ficha dela, na seção que o menu lateral
 * escolheu (a rota vive no App porque o menu lateral também a lê).
 */
import { useState } from 'react';
import { ListaOrganizacoes } from './ListaOrganizacoes';
import { FichaOrganizacao } from './FichaOrganizacao';
import { PortfolioView } from '../PortfolioView';
import { FILTROS_VAZIOS, type FiltrosOrganizacao } from '../../lib/organizacoes';
import type { RotaOrg } from '../../lib/navegacaoOrg';

/** Busca e filtros preservados enquanto a sessão estiver aberta — abrir uma
 *  organização e voltar não limpa (mesmo padrão da Visão Geral). */
let filtrosMemoria: FiltrosOrganizacao = FILTROS_VAZIOS;

interface OrganizacoesModuleProps {
  rota: RotaOrg;
  aoNavegar: (rota: RotaOrg) => void;
  /** Abre um projeto dentro da organização dele (a partir da Visão Geral). */
  aoAbrirProjeto: (projetoId: number) => void;
}

export function OrganizacoesModule({ rota, aoNavegar, aoAbrirProjeto }: OrganizacoesModuleProps) {
  const [filtros, setFiltrosState] = useState<FiltrosOrganizacao>(filtrosMemoria);
  const setFiltros = (f: FiltrosOrganizacao) => { filtrosMemoria = f; setFiltrosState(f); };

  if (rota.orgId) {
    return <FichaOrganizacao rota={{ ...rota, orgId: rota.orgId }} aoNavegar={aoNavegar} />;
  }
  return (
    <div className="h-full overflow-y-auto">
      <PortfolioView embutido onSelectProject={p => aoAbrirProjeto(p.id)} />
      <div className="border-t" style={{ borderColor: 'var(--border)' }}>
        <ListaOrganizacoes
          embutido
          aoAbrir={id => aoNavegar({ orgId: id, secao: 'dados', projetoId: null })}
          filtros={filtros}
          aoMudarFiltros={setFiltros}
        />
      </div>
    </div>
  );
}
