import { usePopupChave } from '../PopupNavegacao';
import { useStore } from '../../store';
import { atividadesDaOrganizacao, encaminhamentosDoPlano } from '../../lib/planoRelatorio';
import { codigosHierarquicos } from '../../lib/planoTrabalho';
import { formatDateOnly } from '../../lib/dateOnly';
import { PainelAtividade } from '../plano/PainelAtividade';
import { PainelRisco } from '../plano/PainelRisco';
import { useDestaque } from './useDestaque';

export function EncaminhamentosPlano({ orgId, foco, mostrarConcluidos }: { orgId: string; foco: string | null; mostrarConcluidos: boolean }) {
  const { projects, projectsLoading } = useStore();
  const [popup, mudarPopup] = usePopupChave(`acomp-${orgId}`);
  const selecionada = popup?.startsWith('atividade:') ? popup.slice(10) : null;
  const riscoId = popup?.startsWith('risco:') ? popup.slice(6) : null;
  const setSelecionada = (id: string | null) => mudarPopup(id ? `atividade:${id}` : null);
  const linhas = encaminhamentosDoPlano(projects, orgId);
  const visiveis = mostrarConcluidos ? linhas : linhas.filter(l => l.atividade.status !== 'Concluído');
  const alvo = selecionada ? atividadesDaOrganizacao(projects, orgId).find(l => l.atividade.id === selecionada) : undefined;
  const destaque = useDestaque(visiveis.find(l => l.atividade.id === foco)?.atividade.id ?? null);
  const projetoRisco = riscoId ? projects.find(p => p.organizacao?.id === orgId && p.risks.some(r => r.id === riscoId)) : undefined;
  const risco = projetoRisco?.risks.find(r => r.id === riscoId);
  const metaRisco = projetoRisco?.goals.find(m => m.deliverables.some(e => e.id === risco?.stageId));
  const etapaRisco = metaRisco?.deliverables.find(e => e.id === risco?.stageId);
  return <section className="border rounded-xl p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
    <h2 className="font-semibold text-sm">Acompanhamentos do plano de trabalho ({linhas.filter(l => l.atividade.status !== 'Concluído').length} pendentes)</h2>
    <p className="text-xs" style={{ color: 'var(--ink-4)' }}>Próximos passos das atividades vinculadas a esta organização. As alterações são salvas na atividade de origem; o status acompanha sua execução.</p>
    {projectsLoading ? <p className="text-sm">Carregando acompanhamentos…</p> : visiveis.length === 0 ? <p className="text-sm">Nenhuma ação de acompanhamento neste filtro.</p> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['Ação', 'Responsável', 'Prazo', 'Status da atividade', 'Origem'].map(c => <th key={c} className="text-left p-2">{c}</th>)}</tr></thead>
        <tbody>{visiveis.map(l => <tr key={l.atividade.id} ref={destaque.ref(l.atividade.id)} style={{ background: destaque.ativo(l.atividade.id) ? 'var(--brand-soft)' : undefined }}>
          <td className="p-2 whitespace-pre-wrap"><button className="text-left hover:underline" onClick={() => setSelecionada(l.atividade.id)}>{l.atividade.nextStep}</button></td>
          <td className="p-2">{l.atividade.nextStepOwner || 'Não informado'}</td>
          <td className="p-2">{l.atividade.nextStepDue ? formatDateOnly(l.atividade.nextStepDue) : 'Não informado'}</td>
          <td className="p-2">{l.atividade.status}</td>
          <td className="p-2"><button className="text-left hover:underline" onClick={() => setSelecionada(l.atividade.id)}>{l.projeto.code} / {l.meta.name} / {l.etapa.name} / {l.atividade.name}</button></td>
        </tr>)}</tbody></table></div>}
    {alvo && <PainelAtividade key={alvo.atividade.id} atividade={alvo.atividade} etapa={alvo.etapa} meta={alvo.meta} projetoId={alvo.projeto.id}
      codigo={codigosHierarquicos(alvo.projeto.goals).get(alvo.atividade.id) ?? ''}
      riscoOrigem={alvo.projeto.risks.find(r => r.id === alvo.atividade.riskOriginId)}
      aoFechar={() => mudarPopup(null)} aoAbrirRisco={r => mudarPopup(`risco:${r.id}`)} />}
    {risco && projetoRisco && <PainelRisco key={risco.id} risco={risco} etapa={etapaRisco} meta={metaRisco} projetoId={projetoRisco.id}
      metas={projetoRisco.goals} codigos={codigosHierarquicos(projetoRisco.goals)}
      acoesDeResposta={projetoRisco.goals.flatMap(m => m.deliverables.flatMap(e => e.activities)).filter(a => a.riskOriginId === risco.id)}
      aoFechar={() => mudarPopup(null)} aoAbrirAtividade={a => mudarPopup(`atividade:${a.id}`)} />}
  </section>;
}
