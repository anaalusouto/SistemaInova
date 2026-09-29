/**
 * Painel da meta (RF04.1 — "Adicionar possibilidade de editar meta").
 *
 * Editar meta = título, responsável e prazo previsto próprio, mais adicionar,
 * renomear e remover etapas. A edição é direta para quem tem escrita (sem fila
 * de aprovação) e fica registrada no histórico da meta (log_alteracoes_meta).
 *
 * O prazo próprio pode divergir das etapas: o painel mostra o aviso, mas não
 * bloqueia — ver divergenciaDaMeta em lib/planoTrabalho.ts.
 *
 * Perfil de consulta (SEMAS) vê tudo e não recebe botão de escrita; quem de
 * fato impede a escrita é o servidor (RN-001).
 */
import { useState } from 'react';
import { AlertTriangle, Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { type Goal, type Deliverable, type Risk } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { divergenciaDaMeta, motivoParaNaoRemoverEtapa, prazoDaMeta, validarMeta } from '../../lib/planoTrabalho';
import { Painel, Linha, Periodo, BotaoAcao, Ausente } from './PainelBase';
import { Campo, Texto, Data, Erros, Acoes, ConfirmarExclusao } from './camposFormulario';

const mensagem = (e: unknown) => (e instanceof Error ? e.message : 'Não foi possível salvar.');

function FormularioMeta({ meta, aoFechar }: { meta: Goal; aoFechar: () => void }) {
  const { saveMeta } = useStore();
  const [nome, setNome] = useState(meta.name);
  const [responsavel, setResponsavel] = useState(meta.responsible ?? '');
  const [inicio, setInicio] = useState<string | null>(meta.plannedStart ?? null);
  const [fim, setFim] = useState<string | null>(meta.plannedEnd ?? null);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const calculado = prazoDaMeta({ ...meta, plannedStart: null, plannedEnd: null });

  const salvar = async () => {
    const input = { nome, responsavel: responsavel || null, inicioPrevisto: inicio, fimPrevisto: fim };
    const validacao = validarMeta(input);
    if (!validacao.ok) { setErros(validacao.erros); return; }
    setSalvando(true);
    try {
      await saveMeta({ metaId: meta.id, ...input });
      toast.success('Meta atualizada.');
      aoFechar();
    } catch (e) {
      setErros([mensagem(e)]);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Erros erros={erros} />
      <Campo rotulo="Título da meta" obrigatorio><Texto valor={nome} aoMudar={setNome} /></Campo>
      <Campo rotulo="Responsável"><Texto valor={responsavel} aoMudar={setResponsavel} placeholder="Nome de quem responde pela meta" /></Campo>
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-3" style={{ borderColor: 'var(--line-1)' }}>
        <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>Prazo previsto</legend>
        <Campo rotulo="Início previsto"><Data valor={inicio} aoMudar={setInicio} max={fim} /></Campo>
        <Campo rotulo="Fim previsto"><Data valor={fim} aoMudar={setFim} min={inicio} /></Campo>
        <p className="sm:col-span-2" style={{ fontSize: '0.7rem', color: 'var(--ink-5)', lineHeight: 1.5 }}>
          Deixe em branco para usar o período das etapas
          {calculado.inicio || calculado.fim ? ' (hoje: ' : ''}
          {(calculado.inicio || calculado.fim) && <Periodo inicio={calculado.inicio} fim={calculado.fim} />}
          {calculado.inicio || calculado.fim ? ')' : ''}.
        </p>
      </fieldset>
      <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} />
    </div>
  );
}

/** Uma etapa na lista do painel: abrir, renomear na linha, remover. */
function LinhaEtapa({
  etapa, codigo, podeEditar, aoAbrir, aoRemover,
}: {
  etapa: Deliverable; codigo: string; podeEditar: boolean;
  aoAbrir: () => void; aoRemover: () => void;
}) {
  const { renameEtapa } = useStore();
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState(etapa.name);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!nome.trim()) { toast.error('Informe o nome da etapa.'); return; }
    setSalvando(true);
    try {
      await renameEtapa(etapa.id, nome);
      setEditando(false);
    } catch (e) {
      toast.error(mensagem(e));
    } finally {
      setSalvando(false);
    }
  };

  if (editando) {
    return (
      <li className="flex items-center gap-1.5">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-5)' }}>{codigo}</span>
        <input
          autoFocus
          aria-label="Nome da etapa"
          className="flex-1 min-w-0 border rounded-md px-2 py-1"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.78rem' }}
          value={nome}
          onChange={e => setNome(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') void salvar();
            if (e.key === 'Escape') { e.stopPropagation(); setNome(etapa.name); setEditando(false); }
          }}
        />
        <button onClick={() => void salvar()} disabled={salvando} aria-label="Salvar nome" className="p-1 rounded hover:bg-accent">
          <Check size={13} color="var(--success)" />
        </button>
        <button onClick={() => { setNome(etapa.name); setEditando(false); }} aria-label="Cancelar" className="p-1 rounded hover:bg-accent">
          <X size={13} color="var(--ink-4)" />
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-1.5 group">
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--ink-5)' }}>{codigo}</span>
      <button onClick={aoAbrir} className="flex-1 min-w-0 text-left hover:underline" style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>
        <span className="truncate block">{etapa.name}</span>
      </button>
      <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', whiteSpace: 'nowrap' }}>
        {etapa.activities.length} ativ.
      </span>
      {podeEditar && (
        <>
          <button onClick={() => setEditando(true)} aria-label={`Renomear etapa ${etapa.name}`} className="p-1 rounded hover:bg-accent">
            <Pencil size={12} color="var(--ink-4)" />
          </button>
          <button onClick={aoRemover} aria-label={`Remover etapa ${etapa.name}`} className="p-1 rounded hover:bg-accent">
            <Trash2 size={12} color="var(--danger)" />
          </button>
        </>
      )}
    </li>
  );
}

export function PainelMeta({
  meta, riscos, codigo, codigos, aoFechar, aoAbrirEtapa,
}: {
  meta: Goal; riscos: Risk[]; codigo: string; codigos: Map<string, string>;
  aoFechar: () => void;
  aoAbrirEtapa: (etapa: Deliverable) => void;
}) {
  const { readOnly } = useAuth();
  const { createEtapa, deleteEtapa } = useStore();
  const [editando, setEditando] = useState(false);
  const [novaEtapa, setNovaEtapa] = useState('');
  const [criando, setCriando] = useState(false);
  const [remover, setRemover] = useState<Deliverable | null>(null);

  const prazo = prazoDaMeta(meta);
  const avisos = divergenciaDaMeta(meta);

  // Etapa com conteúdo não sai: diz o motivo em vez de oferecer um "Excluir"
  // que o servidor recusaria.
  const pedirRemocao = (e: Deliverable) => {
    const motivo = motivoParaNaoRemoverEtapa(e.name, e.activities.length, riscos.filter(r => r.stageId === e.id).length);
    if (motivo) toast.error(motivo);
    else setRemover(e);
  };

  const adicionar = async () => {
    if (!novaEtapa.trim()) return;
    setCriando(true);
    try {
      await createEtapa(meta.id, novaEtapa);
      setNovaEtapa('');
      toast.success('Etapa adicionada. Defina o período dela antes de criar atividades.');
    } catch (e) {
      toast.error(mensagem(e));
    } finally {
      setCriando(false);
    }
  };

  const confirmarRemocao = async () => {
    if (!remover) return;
    const alvo = remover;
    setRemover(null);
    try {
      await deleteEtapa(alvo.id);
      toast.success(`Etapa "${alvo.name}" removida.`);
    } catch (e) {
      toast.error(mensagem(e));
    }
  };

  const acoes = !readOnly && !editando ? (
    <BotaoAcao aoClicar={() => setEditando(true)}><Pencil size={12} /> Editar meta</BotaoAcao>
  ) : undefined;

  return (
    <Painel titulo={editando ? 'Editar meta' : meta.name} caminho={`Meta ${codigo}`} aoFechar={aoFechar} acoes={acoes}>
      {editando ? (
        <FormularioMeta meta={meta} aoFechar={() => setEditando(false)} />
      ) : (
        <>
          {avisos.length > 0 && (
            <div
              className="flex items-start gap-2 rounded-lg border px-3 py-2 mb-3"
              style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)' }}
              role="status"
            >
              <AlertTriangle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-2)', lineHeight: 1.5 }}>
                <strong>Prazo da meta diverge das etapas.</strong>
                <ul>{avisos.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            </div>
          )}

          <Linha rotulo={prazo.proprio ? 'Prazo previsto' : 'Prazo previsto (calculado das etapas)'}>
            <Periodo inicio={prazo.inicio} fim={prazo.fim} />
          </Linha>
          <Linha rotulo="Responsável">{meta.responsible || <Ausente />}</Linha>

          <Linha rotulo={`Etapas (${meta.deliverables.length})`}>
            {meta.deliverables.length === 0 ? (
              <span style={{ color: 'var(--ink-5)' }}>Nenhuma etapa nesta meta.</span>
            ) : (
              <ul className="flex flex-col gap-1 mt-1">
                {meta.deliverables.map(e => (
                  <LinhaEtapa
                    key={e.id}
                    etapa={e}
                    codigo={codigos.get(e.id) ?? ''}
                    podeEditar={!readOnly}
                    aoAbrir={() => aoAbrirEtapa(e)}
                    aoRemover={() => pedirRemocao(e)}
                  />
                ))}
              </ul>
            )}
            {!readOnly && (
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  aria-label="Nome da nova etapa"
                  placeholder="Nova etapa…"
                  className="flex-1 min-w-0 border rounded-md px-2 py-1"
                  style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.78rem' }}
                  value={novaEtapa}
                  onChange={e => setNovaEtapa(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void adicionar(); }}
                />
                <button
                  onClick={() => void adicionar()}
                  disabled={criando || !novaEtapa.trim()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[12px] font-medium disabled:opacity-40"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>
            )}
          </Linha>
        </>
      )}

      {remover && (
        <ConfirmarExclusao
          titulo={`Remover a etapa "${remover.name}"?`}
          descricao="A etapa sai do Plano de Trabalho. A remoção fica registrada no histórico da meta."
          aoCancelar={() => setRemover(null)}
          aoConfirmar={() => void confirmarRemocao()}
        />
      )}
    </Painel>
  );
}
