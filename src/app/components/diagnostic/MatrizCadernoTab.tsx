import { MatrizFuncionalTab } from './MatrizFuncionalTab';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
import { AVALIACAO_MATRIZ_CADERNO } from '../../diagnostic/catalog/cadernoCria';
export function MatrizCadernoTab(props: ContextoCaderno) {
  const consulta = useCaderno(props);
  if (consulta.isLoading) return <p role="status">Carregando avaliações da Matriz…</p>;
  if (consulta.error) return <p role="alert">{consulta.error.message} <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  const avaliacoes = Object.fromEntries((consulta.data ?? []).filter(r => /^F\d{2}$/.test(r.codigo)).map(r => [r.codigo, AVALIACAO_MATRIZ_CADERNO.find(i => i.codigo === r.codigo)?.opcoes?.find(o => o.valor === r.resposta.valor)?.descricao ?? 'Não avaliado']));
  return <MatrizFuncionalTab {...props} caderno={{ avaliacoes, renderAvaliacao: id => <CadernoItens {...props} itens={AVALIACAO_MATRIZ_CADERNO.filter(i => i.codigo === id)}/> }}/>;
}
