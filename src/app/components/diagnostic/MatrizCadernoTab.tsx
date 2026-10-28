import { MatrizFuncionalTab } from './MatrizFuncionalTab';
import { CadernoItens, useCaderno, type ContextoCaderno } from './CadernoItens';
import { AVALIACAO_MATRIZ_CADERNO } from '../../diagnostic/catalog/cadernoCria';
export function MatrizCadernoTab(props: ContextoCaderno) {
  const consulta = useCaderno(props);
  if (consulta.isLoading) return <p role="status">Carregando avaliações da Matriz…</p>;
  if (consulta.error) return <p role="alert">{consulta.error.message} <button type="button" className="underline" onClick={() => void consulta.refetch()}>Tentar novamente</button></p>;
  const avaliacoes = Object.fromEntries((consulta.data ?? []).filter(r => /^F\d{2}$/.test(r.codigo)).map(r => {
    const item = AVALIACAO_MATRIZ_CADERNO.find(i => i.codigo === r.codigo);
    const valor = r.resposta.valor;
    const descricao = valor ? item?.opcoes?.find(o => o.valor === valor)?.descricao : null;
    return [r.codigo, descricao ?? (valor ? 'Opção não reconhecida' : 'Sem avaliação registrada')];
  }));
  return <MatrizFuncionalTab {...props} caderno={{ avaliacoes, renderAvaliacao: id => <CadernoItens {...props} itens={AVALIACAO_MATRIZ_CADERNO.filter(i => i.codigo === id)}/> }}/>;
}
