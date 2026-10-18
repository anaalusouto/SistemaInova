/**
 * Painel da atividade (RF-023) e gestão de tarefas (RF-025).
 *
 * Edição e exclusão da atividade e o CRUD de tarefas vivem aqui, não nas
 * linhas das visões (RF-014). A exclusão pede confirmação e explica o que
 * acontece com o registro (RN-005): a linha não é apagada, é marcada como
 * excluída, para não deixar anexo órfão nem romper vínculo de risco.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Pencil, Trash2, Plus, Check, X as XIcon, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { formatDateOnly } from '../../lib/dateOnly';
import { estaAtrasada, NAO_INFORMADO } from '../../lib/planoTrabalho';
import { Painel, Linha, Periodo, Ausente, BotaoAcao } from './PainelBase';
import { ConfirmarExclusao } from './camposFormulario';
import { FormularioAtividade } from './FormularioAtividade';
import { CampoAnexo, abrirAnexo } from './CampoAnexo';
import { ConclusaoNoDetalhe } from './ConclusaoNoDetalhe';
import type { ItemOrcamento } from '../../lib/orcamento';

/** Lista de tarefas com adicionar, renomear e excluir no lugar (RF-025). */
function Tarefas({ atividade, codigo }: { atividade: Activity; codigo: string }) {
  const { createTarefa, renameTarefa, deleteTarefa } = useStore();
  const { readOnly } = useAuth();
  const [nova, setNova] = useState('');
  const [editando, setEditando] = useState<{ id: string; titulo: string } | null>(null);
  const [excluindo, setExcluindo] = useState<{ id: string; titulo: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const emExecucao = useRef(false);

  const executar = async (acao: () => Promise<void>, mensagem: string) => {
    if (emExecucao.current) return;
    emExecucao.current = true;
    setOcupado(true);
    try { await acao(); toast.success(mensagem); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível concluir.'); }
    finally { emExecucao.current = false; setOcupado(false); }
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 mt-1">
        <p className="text-xs" style={{ color: 'var(--ink-4)' }}>Subtarefas detalham a execução desta atividade. A ação de acompanhamento fica em Próximo passo e aparece em Encaminhamentos.</p>
        {atividade.tasks.length === 0 && (
          <span style={{ color: 'var(--ink-5)', fontSize: '0.78rem' }}>Nenhuma tarefa.</span>
        )}

        {atividade.tasks.map((t, i) => (
          <div key={t.id} className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-5)', flexShrink: 0 }}>
              {codigo}.{i + 1}
            </span>

            {editando?.id === t.id ? (
              <>
                <input
                  autoFocus
                  disabled={ocupado}
                  aria-label="Título da subtarefa"
                  className="flex-1 border rounded-md px-2 py-1 text-[0.78rem]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
                  value={editando.titulo}
                  onChange={e => setEditando({ ...editando, titulo: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Escape') { e.stopPropagation(); setEditando(null); }
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing && editando.titulo.trim()) {
                      e.preventDefault();
                      void executar(async () => { await renameTarefa(t.id, editando.titulo.trim()); setEditando(null); }, 'Tarefa renomeada.');
                    }
                  }}
                />
                <button
                  aria-label="Confirmar"
                  disabled={ocupado || !editando.titulo.trim()}
                  onClick={() => executar(
                    async () => { await renameTarefa(t.id, editando.titulo); setEditando(null); },
                    'Tarefa renomeada.',
                  )}
                >
                  <Check size={14} color="var(--success)" />
                </button>
                <button disabled={ocupado} aria-label="Cancelar" onClick={() => setEditando(null)}>
                  <XIcon size={14} color="var(--ink-4)" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1" style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{t.title}</span>
                {!readOnly && (
                  <>
                    <button disabled={ocupado} aria-label={`Renomear ${t.title}`} onClick={() => setEditando({ id: t.id, titulo: t.title })}>
                      <Pencil size={12} color="var(--ink-4)" />
                    </button>
                    <button disabled={ocupado} aria-label={`Excluir ${t.title}`} onClick={() => setExcluindo({ id: t.id, titulo: t.title })}>
                      <Trash2 size={12} color="var(--danger)" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        ))}

        {!readOnly && (
          <div className="flex items-center gap-2 mt-1">
            <input
              className="flex-1 border rounded-md px-2 py-1 text-[0.78rem]"
              style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
              placeholder="Nova tarefa"
              aria-label="Nova subtarefa"
              disabled={ocupado}
              value={nova}
              onChange={e => setNova(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing && nova.trim()) {
                  e.preventDefault();
                  executar(async () => { await createTarefa(atividade.id, nova.trim()); setNova(''); }, 'Tarefa adicionada.');
                }
              }}
            />
            <button
              aria-label="Adicionar tarefa"
              disabled={ocupado || !nova.trim()}
              onClick={() => executar(
                async () => { await createTarefa(atividade.id, nova); setNova(''); },
                'Tarefa adicionada.',
              )}
              className="px-2 py-1 rounded-md border"
              style={{ borderColor: 'var(--border)', opacity: nova.trim() ? 1 : 0.5 }}
            >
              <Plus size={13} color="var(--ink-3)" />
            </button>
          </div>
        )}
      </div>

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir tarefa"
          descricao={`A tarefa "${excluindo.titulo}" será removida da atividade. A numeração das demais é recalculada automaticamente.`}
          aoCancelar={() => setExcluindo(null)}
          aoConfirmar={() => {
            const alvo = excluindo;
            setExcluindo(null);
            executar(() => deleteTarefa(alvo.id), 'Tarefa excluída.');
          }}
        />
      )}
    </>
  );
}

export function PainelAtividade({
  atividade, etapa, meta, codigo, projetoId, riscoOrigem, aoFechar, aoAbrirRisco, aoEncaminhamentos, lateral, bloqueado, riscosDaEtapa = [], orcamentoDaMeta = [],
}: {
  atividade: Activity; etapa: Deliverable; meta: Goal; codigo: string; projetoId: number;
  riscoOrigem?: Risk;
  aoFechar: () => void;
  aoAbrirRisco: (r: Risk) => void;
  aoEncaminhamentos?: () => void;
  lateral?: ReactNode; bloqueado?: boolean;
  riscosDaEtapa?: Risk[]; orcamentoDaMeta?: ItemOrcamento[];
}) {
  const { deleteAtividade } = useStore();
  const { readOnly } = useAuth();
  const [editando, setEditando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const atrasada = estaAtrasada(atividade);

  const acoes = !readOnly && !editando ? (
    <>
      <BotaoAcao aoClicar={() => setEditando(true)}><Pencil size={12} /> Editar</BotaoAcao>
      <BotaoAcao aoClicar={() => setExcluindo(true)} perigo><Trash2 size={12} /> Excluir</BotaoAcao>
    </>
  ) : undefined;

  return (
    <>
      <Painel
        titulo={editando ? 'Editar atividade' : atividade.name}
        caminho={`${meta.name} › ${etapa.name} › ${codigo}`}
        aoFechar={aoFechar}
        acoes={acoes}
        lateral={!editando ? lateral : undefined}
        bloqueado={bloqueado}
      >
        {editando ? (
          <FormularioAtividade etapa={etapa} atividade={atividade} aoFechar={() => setEditando(false)} />
        ) : (
          <>

            {!lateral && <ConclusaoNoDetalhe key={atividade.id} tipo="atividade" id={atividade.id} nome={atividade.name} atividades={[atividade]} />}
            <Linha rotulo="Status e progresso">
              <span className="inline-flex items-center gap-2">
                <span style={{ color: atrasada ? 'var(--alert)' : 'var(--ink-2)', fontWeight: atrasada ? 600 : 400 }}>
                  {atrasada ? 'Atrasada' : atividade.status}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--ink-4)' }}>
                  {atividade.progress}%
                </span>
              </span>
            </Linha>

            <Linha rotulo="Período previsto"><Periodo inicio={atividade.plannedStart} fim={atividade.plannedEnd} /></Linha>
            <Linha rotulo="Período realizado"><Periodo inicio={atividade.actualStart} fim={atividade.actualEnd} /></Linha>
            <Linha rotulo="Justificativa de atraso">{atividade.delayJustification || <Ausente />}</Linha>

            <Linha rotulo="Vínculo orçamentário">
              {/* RN-022: trivalente — "Não informado" não é "Não". */}
              {atividade.budgetLink === 'Não informado' ? <Ausente /> : atividade.budgetLink}
            </Linha>
            {orcamentoDaMeta.length > 0 && <Linha rotulo={`Orçamento da meta (${orcamentoDaMeta.length} itens)`}>
              <p className="text-xs mb-2" style={{ color: 'var(--ink-4)' }}>Itens compartilhados com as demais atividades desta meta.</p>
              <ul className="space-y-2">{orcamentoDaMeta.map(item => <li key={item.id}>
                <span>{item.descricao}</span>
                <span className="block text-xs" style={{ color: 'var(--ink-4)' }}>Proposto: {item.valorProposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </li>)}</ul>
            </Linha>}

            <Linha rotulo="Observação">{atividade.observations || <Ausente />}</Linha>

            <Linha rotulo="Próximo passo">
              {atividade.nextStep ? (
                <>
                  <div>{atividade.nextStep}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)', marginTop: 2 }}>
                    {atividade.nextStepOwner || NAO_INFORMADO}
                    {' · '}
                    {atividade.nextStepDue ? formatDateOnly(atividade.nextStepDue) : NAO_INFORMADO}
                  </div>
                </>
              ) : <Ausente />}
            </Linha>

            {aoEncaminhamentos && <BotaoAcao aoClicar={aoEncaminhamentos}>{atividade.nextStep.trim() ? 'Ver encaminhamento desta atividade' : 'Ver encaminhamentos da organização'}</BotaoAcao>}

            <Linha rotulo={`Subtarefas (${atividade.tasks.length})`}>
              <Tarefas atividade={atividade} codigo={codigo} />
            </Linha>

            <Linha rotulo="Anexo">
              {(atividade.attachments ?? []).filter(a => a.id !== atividade.attachment?.id).map(a => <button
                key={a.id} type="button" className="block text-left underline mb-2" onClick={() => void abrirAnexo(a.id, a.fileName, a.mimeType ?? undefined)}>
                {a.fileName}
              </button>)}
              {/* RF-026: anexar, abrir, substituir e remover no painel. */}
              <CampoAnexo
                projetoId={projetoId}
                atividadeId={atividade.id}
                anexo={atividade.attachment}
                rotulo="Anexar foto ou documento"
              />
            </Linha>

            {riscoOrigem && (
              <Linha rotulo="Risco de origem">
                <button
                  onClick={() => aoAbrirRisco(riscoOrigem)}
                  className="inline-flex items-center gap-1.5 hover:underline text-left"
                  style={{ color: 'var(--danger)', fontSize: '0.78rem' }}
                >
                  <CornerDownRight size={12} /> {riscoOrigem.title || riscoOrigem.description}
                </button>
              </Linha>
            )}
            {riscosDaEtapa.length > 0 && <Linha rotulo={`Outros riscos da etapa (${riscosDaEtapa.length})`}>
              <ul className="space-y-1">{riscosDaEtapa.map(risco => <li key={risco.id}>
                <button type="button" onClick={() => aoAbrirRisco(risco)} className="text-left underline">{risco.title || risco.description}</button>
              </li>)}</ul>
            </Linha>}
          </>
        )}
      </Painel>

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir atividade"
          descricao={
            `A atividade "${atividade.name}" deixa de aparecer nas visões e nas contagens. ` +
            'O registro é preservado no banco, com a data da exclusão, para não deixar anexo órfão ' +
            'nem romper vínculo com risco.'
          }
          aoCancelar={() => setExcluindo(false)}
          aoConfirmar={async () => {
            setExcluindo(false);
            try {
              await deleteAtividade(atividade.id);
              toast.success('Atividade excluída.');
              aoFechar();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.');
            }
          }}
        />
      )}
    </>
  );
}
