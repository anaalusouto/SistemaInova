import { useQuery } from '@tanstack/react-query';
import { listarRespostasMatriz, listarRespostasIeo } from '../../diagnosticos.server';
import { useFichaOrganizacao } from '../organizacoes/useOrganizacoes';
import { DocumentosRegistro } from '../DocumentosRegistro';
import { formatDateOnly } from '../../lib/dateOnly';

/** Reúne informações já existentes; não cria outro instrumento de mapeamento. */
export function ResumoDiagnostico({ diagnosticoId, organizacaoId }: { diagnosticoId: string; organizacaoId: string }) {
  const ficha = useFichaOrganizacao(organizacaoId);
  const matriz = useQuery({ queryKey: ['diagnostico-matriz', diagnosticoId], queryFn: () => listarRespostasMatriz({ data: { diagnosticoId } }) });
  const ieo = useQuery({ queryKey: ['diagnostico-ieo', diagnosticoId], queryFn: () => listarRespostasIeo({ data: { diagnosticoId } }) });
  const org = ficha.data;
  if (ficha.isLoading || matriz.isLoading || ieo.isLoading) return <p role="status">Carregando resumo…</p>;
  if (ficha.error || matriz.error || ieo.error || !org) return <p role="alert">Não foi possível carregar o resumo. <button type="button" className="underline" onClick={() => { void ficha.refetch(); void matriz.refetch(); void ieo.refetch(); }}>Tentar novamente</button></p>;
  const observacoes = [
    ...(matriz.data ?? []).filter(r => r.observacoes?.trim()).map(r => ({ id: `matriz-${r.funcaoId}`, origem: `Matriz Funcional · função ${r.funcaoId}`, texto: r.observacoes })),
    ...(ieo.data ?? []).filter(r => r.observacao?.trim()).map(r => ({ id: `ieo-${r.perguntaId}`, origem: `IEO · pergunta ${r.perguntaId}`, texto: r.observacao })),
    ...(org.notas ?? []).map(n => ({ id: `nota-${n.id}`, origem: 'Nota da organização', texto: n.conteudo })),
  ];
  return <div className="space-y-6 min-w-0">
    <h3 className="font-semibold text-lg">Resumo · {org.nome}</h3>
    <section aria-label="Documentos do mapeamento"><h4 className="font-semibold mb-3">Documentos</h4>
      <DocumentosRegistro area="mapeamento" organizacaoId={organizacaoId} relatorioUrl={org.mapeamentoRelatorioUrl} />
    </section>
    <section aria-label="Registros da organização"><h4 className="font-semibold mb-3">Registros</h4>
      {org.registros.length ? <ul className="space-y-2">{org.registros.map(r => <li key={r.id} className="rounded-lg border bg-card p-3 text-sm">
        <p className="font-medium">{formatDateOnly(r.data)} · {r.assunto || 'Registro de contato'}</p><p className="whitespace-pre-wrap break-words">{r.resumo}</p>
      </li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum registro disponível.</p>}
    </section>
    <section aria-label="Observações de campo"><h4 className="font-semibold mb-3">Observações de campo</h4>
      {observacoes.length ? <ul className="space-y-2">{observacoes.map(o => <li key={o.id} className="rounded-lg border bg-card p-3 text-sm">
        <p className="font-medium">{o.origem}</p><p className="whitespace-pre-wrap break-words">{o.texto}</p>
      </li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma observação registrada.</p>}
    </section>
    <section aria-label="Vínculos da organização"><h4 className="font-semibold mb-3">Vínculos</h4>
      {org.projetos.length ? <ul className="space-y-2">{org.projetos.map(p => <li key={p.id} className="text-sm">
        <a className="underline text-primary" href={`/?area=organizations&org=${encodeURIComponent(organizacaoId)}&secao=projeto&projeto=${p.id}`}>{p.codigo} · {p.nome}</a>
      </li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhum projeto vinculado.</p>}
    </section>
  </div>;
}
