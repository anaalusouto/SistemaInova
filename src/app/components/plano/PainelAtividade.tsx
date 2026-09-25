/**
 * Painel da atividade (RF-023) e gestão de tarefas (RF-025).
 *
 * Edição e exclusão da atividade e o CRUD de tarefas vivem aqui, não nas
 * linhas das visões (RF-014). A exclusão pede confirmação e explica o que
 * acontece com o registro (RN-005): a linha não é apagada, é marcada como
 * excluída, para não deixar anexo órfão nem romper vínculo de risco.
 */
import { useState } from 'react';
import { Pencil, Trash2, Plus, Check, X as XIcon, Paperclip, CornerDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { formatDateOnly } from '../../lib/dateOnly';
import { estaAtrasada, NAO_INFORMADO } from '../../lib/planoTrabalho';
import { Painel, Linha, Periodo, Ausente, BotaoAcao } from './PainelBase';
import { ConfirmarExclusao } from './camposFormulario';
import { FormularioAtividade } from './FormularioAtividade';

/** Lista de tarefas com adicionar, renomear e excluir no lugar (RF-025). */
function Tarefas({ atividade, codigo }: { atividade: Activity; codigo: string }) {
  const { createTarefa, renameTarefa, deleteTarefa } = useStore();
  const { readOnly } = useAuth();
  const [nova, setNova] = useState('');
  const [editando, setEditando] = useState<{ id: string; titulo: string } | null>(null);
  const [excluindo, setExcluindo] = useState<{ id: string; titulo: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const executar = async (acao: () => Promise<void>, mensagem: string) => {
    setOcupado(true);
    try { await acao(); toast.success(mensagem); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Não foi possível concluir.'); }
    finally { setOcupado(false); }
  };

  return (
    <>
      <div className="flex flex-col gap-1.5 mt-1">
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
                  className="flex-1 border rounded-md px-2 py-1 text-[0.78rem]"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
                  value={editando.titulo}
                  onChange={e => setEditando({ ...editando, titulo: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Escape') setEditando(null); }}
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
                <button aria-label="Cancelar" onClick={() => setEditando(null)}>
                  <XIcon size={14} color="var(--ink-4)" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1" style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{t.title}</span>
                {!readOnly && (
                  <>
                    <button aria-label={`Renomear ${t.title}`} onClick={() => setEditando({ id: t.id, titulo: t.title })}>
                      <Pencil size={12} color="var(--ink-4)" />
                    </button>
                    <button aria-label={`Excluir ${t.title}`} onClick={() => setExcluindo({ id: t.id, titulo: t.title })}>
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
              value={nova}
              onChange={e => setNova(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && nova.trim()) {
                  executar(async () => { await createTarefa(atividade.id, nova); setNova(''); }, 'Tarefa adicionada.');
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
  atividade, etapa, meta, codigo, riscoOrigem, aoFechar, aoAbrirRisco, aoAbrirAnexo,
}: {
  atividade: Activity; etapa: Deliverable; meta: Goal; codigo: string;
  riscoOrigem?: Risk;
  aoFechar: () => void;
  aoAbrirRisco: (r: Risk) => void;
  aoAbrirAnexo: (a: Activity) => void;
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
      >
        {editando ? (
          <FormularioAtividade etapa={etapa} atividade={atividade} aoFechar={() => setEditando(false)} />
        ) : (
          <>
            <Linha rotulo="Responsável">{atividade.responsible || <Ausente />}</Linha>

            <Linha rotulo="Status e progresso">
              <span className="inline-flex items-center gap-2">
                <span style={{ color: atrasada ? 'var(--danger)' : 'var(--ink-2)', fontWeight: atrasada ? 600 : 400 }}>
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

            <Linha rotulo={`Tarefas (${atividade.tasks.length})`}>
              <Tarefas atividade={atividade} codigo={codigo} />
            </Linha>

            <Linha rotulo="Anexo">
              {atividade.attachment ? (
                <button
                  onClick={() => aoAbrirAnexo(atividade)}
                  className="inline-flex items-center gap-1.5 hover:underline"
                  style={{ color: 'var(--info)', fontSize: '0.78rem' }}
                >
                  <Paperclip size={12} /> {atividade.attachment.fileName}
                </button>
              ) : <Ausente />}
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
