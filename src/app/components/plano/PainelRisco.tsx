/**
 * Painel do risco (RF-027, RF-028).
 *
 * Mostra hierarquia, matriz, estratégia e as atividades de resposta — e
 * permite editar, para a equipe PMO. Todo risco é editável: o legado sem
 * etapa vinculada (a migration 0011 só vinculou o que casava sem ambiguidade)
 * pode manter o vínculo atual ou ganhar a etapa que a pessoa escolher.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { useAuth } from '../../auth/authStore';
import { faixaRisco } from '../../lib/planoTrabalho';
import { Painel, Linha, Ausente, BotaoAcao } from './PainelBase';
import { FormularioRisco } from './FormularioRisco';
import { ConfirmarExclusao } from './camposFormulario';
import { useStore } from '../../store';
import { useEscritaOrganizacao, useFichaOrganizacao } from '../organizacoes/useOrganizacoes';
import { FormularioEncaminhamento } from '../organizacoes/AbaEncaminhamentos';
import type { EncaminhamentoInput } from '../../lib/organizacoes';

function NovoEncaminhamentoRisco({ organizacaoId, risco, texto, aoFechar }: { organizacaoId: string; risco: Risk; texto: string; aoFechar: () => void }) {
  const ficha = useFichaOrganizacao(organizacaoId);
  const escrita = useEscritaOrganizacao();
  const [form, setForm] = useState<EncaminhamentoInput>({
    organizacaoId, descricao: texto, responsavel: '', responsavelUsuarioId: null,
    dataInicio: null, dataFim: null, status: 'A iniciar',
    origem: { tipo: 'risco', registroId: risco.id, texto: risco.title || risco.description, excluido: false },
  });
  if (ficha.isLoading) return <div role="status">Carregando organização…</div>;
  if (!ficha.data) return <div role="alert">Não foi possível carregar a organização. <button type="button" onClick={aoFechar}>Fechar</button></div>;
  return <FormularioEncaminhamento origemFixa form={form} aoMudar={setForm} org={ficha.data} aoFechar={aoFechar} aoSalvar={async () => {
    await escrita.criarEncaminhamento(form);
    toast.success('Encaminhamento registrado.');
    aoFechar();
  }} />;
}

export function PainelRisco({
  risco, etapa, meta, codigoEtapa, projetoId, organizacaoId, metas, codigos, acoesDeResposta, aoFechar, aoAbrirAtividade, lateral, bloqueado,
}: {
  risco: Risk; etapa?: Deliverable; meta?: Goal; codigoEtapa?: string; projetoId: number;
  organizacaoId?: string;
  /** Metas do projeto, para escolher (ou trocar) a etapa ao editar. */
  metas: Goal[];
  codigos: Map<string, string>;
  acoesDeResposta: Activity[];
  aoFechar: () => void;
  aoAbrirAtividade: (a: Activity) => void;
  lateral?: ReactNode; bloqueado?: boolean;
}) {
  const { readOnly } = useAuth();
  const { deleteRisco } = useStore();
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const emRemocao = useRef(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [textoEncaminhamento, setTextoEncaminhamento] = useState<string | null>(null);
  const faixa = faixaRisco(risco.severity);

  const caminho = etapa && meta
    ? `${meta.name} › ${etapa.name}${codigoEtapa ? ` (${codigoEtapa})` : ''}`
    : 'Etapa não vinculada';

  // Riscos antigos podem manter o vínculo atual ao editar outros campos.
  const podeEditar = !readOnly;

  const acoes = podeEditar && !editando ? (
    <>
      <BotaoAcao aoClicar={() => setEditando(true)}><Pencil size={12} /> Editar risco</BotaoAcao>
      {organizacaoId && <BotaoAcao aoClicar={() => setTextoEncaminhamento('')}>Novo encaminhamento</BotaoAcao>}
      <BotaoAcao aoClicar={() => { if (!emRemocao.current) { setErroExclusao(null); setExcluindo(true); } }} perigo>
        <Trash2 size={12} /> {removendo ? 'Excluindo…' : 'Excluir risco'}
      </BotaoAcao>
    </>
  ) : undefined;

  return (
    <>
    <Painel
      titulo={editando ? 'Editar risco' : (risco.title || risco.description)}
      caminho={caminho}
      aoFechar={aoFechar}
      acoes={acoes}
      lateral={!editando ? lateral : undefined}
      bloqueado={bloqueado || removendo}
      largo
    >
      {editando ? (
        <FormularioRisco
          projetoId={projetoId}
          etapa={etapa}
          risco={risco}
          metas={metas}
          codigos={codigos}
          aoFechar={() => setEditando(false)}
        />
      ) : (
        <>
          {!etapa && (
            <div
              className="rounded-lg border px-3 py-2 mb-3"
              style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)', fontSize: '0.75rem', color: 'var(--ink-2)' }}
            >
              Este risco ainda não está vinculado a uma etapa. Você pode editar seus campos mantendo esse
              vínculo ou escolher uma etapa.
              {risco.stage && <> O registro antigo indicava: <strong>{risco.stage}</strong>.</>}
            </div>
          )}

          <Linha rotulo="Descrição">{risco.description || <Ausente />}</Linha>
          <Linha rotulo="Categoria">{risco.category || <Ausente />}</Linha>
          <Linha rotulo="Responsável">{risco.responsible || <Ausente />}</Linha>
          <Linha rotulo="Status">{risco.status}</Linha>

          <Linha rotulo="Matriz">
            <span className="inline-flex items-center gap-2 flex-wrap">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem' }}>
                probabilidade {risco.probability} × impacto {risco.impact} = {risco.severity}
              </span>
              <span
                className="px-2 py-0.5 rounded-md"
                style={{
                  fontSize: '0.7rem', fontWeight: 600,
                  background: faixa === 'Baixo' ? 'var(--success-soft)' : faixa === 'Médio' ? 'var(--warning-soft)' : 'var(--danger-soft)',
                  color: faixa === 'Baixo' ? 'var(--success)' : faixa === 'Médio' ? 'var(--warning-strong-text)' : 'var(--danger)',
                }}
              >
                {faixa}
              </span>
            </span>
          </Linha>

          <Linha rotulo="Ações para Encaminhamento (texto registrado)">{risco.responseStrategy || <Ausente />}</Linha>
          {podeEditar && organizacaoId && risco.responseStrategy && <button type="button" className="text-sm underline" onClick={() => setTextoEncaminhamento(risco.responseStrategy)}>Criar encaminhamento a partir deste texto</button>}
          {risco.responseStrategyHistorica && <Linha rotulo="Histórico: estratégia de resposta">{risco.responseStrategyHistorica}{podeEditar && organizacaoId && <button type="button" className="ml-2 text-xs underline" onClick={() => setTextoEncaminhamento(risco.responseStrategyHistorica!)}>Criar encaminhamento</button>}</Linha>}
          <Linha rotulo="Especificação / resultado vinculado">{risco.specification || <Ausente />}</Linha>

          <Linha rotulo={`Atividades de resposta (${acoesDeResposta.length})`}>
            {acoesDeResposta.length === 0 ? (
              <span style={{ color: 'var(--ink-5)' }}>Nenhuma ação de resposta cadastrada.</span>
            ) : (
              <ul className="flex flex-col gap-1 mt-1">
                {acoesDeResposta.map(a => (
                  <li key={a.id}>
                    <button
                      onClick={() => aoAbrirAtividade(a)}
                      className="text-left hover:underline"
                      style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}
                    >
                      {a.name}
                    </button>
                    {podeEditar && organizacaoId && <button type="button" className="ml-2 text-xs underline" onClick={() => setTextoEncaminhamento(a.name)}>Criar encaminhamento</button>}
                  </li>
                ))}
              </ul>
            )}
          </Linha>
        </>
      )}
    </Painel>
    {organizacaoId && textoEncaminhamento !== null && <NovoEncaminhamentoRisco organizacaoId={organizacaoId} risco={risco} texto={textoEncaminhamento} aoFechar={() => setTextoEncaminhamento(null)} />}
    {excluindo && (
      <ConfirmarExclusao
        titulo="Excluir risco"
        descricao={`O risco "${risco.title || risco.description}" será removido do projeto e da matriz. Os encaminhamentos serão preservados com a identificação do risco excluído. As atividades de resposta e os itens de orçamento serão preservados sem o vínculo com este risco.`}
        aoCancelar={() => setExcluindo(false)}
        ocupado={removendo}
        erro={erroExclusao}
        aoConfirmar={async () => {
          if (readOnly || emRemocao.current) return;
          emRemocao.current = true;
          setErroExclusao(null);
          setRemovendo(true);
          try {
            await deleteRisco(risco.id);
            toast.success('Risco excluído.');
            setExcluindo(false);
            aoFechar();
          } catch (e) {
            setErroExclusao(e instanceof Error ? e.message : 'Não foi possível excluir o risco.');
          } finally {
            emRemocao.current = false;
            setRemovendo(false);
          }
        }}
      />
    )}
    </>
  );
}
