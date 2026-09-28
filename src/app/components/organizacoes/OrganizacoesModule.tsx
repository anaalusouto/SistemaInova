import { useState } from 'react';
import { ListaOrganizacoes } from './ListaOrganizacoes';
import { FichaOrganizacao } from './FichaOrganizacao';

export function OrganizacoesModule() {
  const [aberta, setAberta] = useState<string | null>(null);
  if (aberta) return <FichaOrganizacao organizacaoId={aberta} aoVoltar={() => setAberta(null)} />;
  return <ListaOrganizacoes aoAbrir={setAberta} />;
}
