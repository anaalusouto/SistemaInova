import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import {
  MATRIZ_FUNCOES, ATUACAO_OPCOES, QUEM_EXECUTA_OPCOES, INTERESSE_OPCOES, CRITICIDADE_OPCOES, ABRANGENCIA_OPCOES,
  type MatrizFuncaoCatalogo,
} from '../../diagnostic/catalog/matrizFuncional';
import { listarRespostasMatriz, salvarRespostaMatriz, type MatrizResposta } from '../../diagnosticos.server';
import { Campo, OpcaoGroup, Chip } from './DiagnosticUI';

interface Draft {
  atuacao: string[];
  quemExecuta: string | null;
  interesse: string | null;
  criticidade: string | null;
  abrangencia: string | null;
  observacoes: string;
}

const emptyDraft = (): Draft => ({ atuacao: [], quemExecuta: null, interesse: null, criticidade: null, abrangencia: null, observacoes: '' });

function draftFromResposta(r: MatrizResposta | undefined): Draft {
  if (!r) return emptyDraft();
  return {
    atuacao: r.atuacao, quemExecuta: r.quemExecuta, interesse: r.interesse,
    criticidade: r.criticidade, abrangencia: r.abrangencia, observacoes: r.observacoes ?? '',
  };
}

function hasResposta(r: MatrizResposta | undefined): boolean {
  if (!r) return false;
  return r.atuacao.length > 0 || !!r.quemExecuta || !!r.interesse || !!r.criticidade || !!r.abrangencia || !!r.observacoes;
}

interface MatrizFuncionalTabProps {
  diagnosticoId: string;
  readOnly: boolean;
}

export function MatrizFuncionalTab({ diagnosticoId, readOnly }: MatrizFuncionalTabProps) {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const { data: respostas = [] } = useQuery({
    queryKey: ['diagnostico-matriz', diagnosticoId],
    queryFn: () => listarRespostasMatriz({ data: { diagnosticoId } }),
  });
  const respostaMap = useMemo(() => new Map(respostas.map(r => [r.funcaoId, r])), [respostas]);

  const salvar = useMutation({
    mutationFn: (payload: Draft & { funcaoId: string }) =>
      salvarRespostaMatriz({
        data: {
          diagnosticoId, funcaoId: payload.funcaoId, atuacao: payload.atuacao, quemExecuta: payload.quemExecuta,
          interesse: payload.interesse, criticidade: payload.criticidade, abrangencia: payload.abrangencia,
          observacoes: payload.observacoes || null,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostico-matriz', diagnosticoId] });
      setEditingId(null);
      toast.success('Resposta salva.');
    },
    onError: (e: Error) => toast.error(e.message || 'Não foi possível salvar.'),
  });

  const respondidas = respostas.filter(r => hasResposta(r)).length;

  const toggleOpen = (funcao: MatrizFuncaoCatalogo, resposta: MatrizResposta | undefined) => {
    if (openId === funcao.id) { setOpenId(null); setEditingId(null); return; }
    setOpenId(funcao.id);
    setEditingId(!readOnly && !hasResposta(resposta) ? funcao.id : null);
    setDraft(draftFromResposta(resposta));
  };

  const startEdit = (resposta: MatrizResposta | undefined) => {
    setDraft(draftFromResposta(resposta));
    setEditingId(openId);
  };

  const toggleAtuacao = (opcao: string) =>
    setDraft(d => {
      const atuacao = d.atuacao.includes(opcao) ? d.atuacao.filter(x => x !== opcao) : [...d.atuacao, opcao];
      // "Quem executa" só faz sentido quando a organização marcou que não realiza a função.
      return { ...d, atuacao, quemExecuta: atuacao.includes('Não realiza') ? d.quemExecuta : null };
    });

  return (
    <div className="flex flex-col gap-3 max-w-4xl">
      <p style={{ fontSize: '0.8rem', color: 'var(--ink-4)' }}>
        {respondidas} de {MATRIZ_FUNCOES.length} funções preenchidas.
      </p>
      {MATRIZ_FUNCOES.map(funcao => {
        const resposta = respostaMap.get(funcao.id);
        const open = openId === funcao.id;
        const editing = editingId === funcao.id;
        const answered = hasResposta(resposta);

        return (
          <div key={funcao.id} className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => toggleOpen(funcao, resposta)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                {open ? <ChevronDown size={14} color="var(--ink-5)" /> : <ChevronRight size={14} color="var(--ink-5)" />}
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>{funcao.id}.</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-1)' }}>{funcao.funcao}</span>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                style={{
                  color: answered ? 'var(--success)' : 'var(--ink-5)',
                  background: answered ? 'var(--success-soft)' : 'var(--surface-2)',
                }}
              >
                {answered ? 'Preenchida' : 'Pendente'}
              </span>
            </button>

            {open && (
              <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="pt-3 pb-3 flex flex-col gap-1">
                  <p style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}><b>Descrição:</b> {funcao.descricao}</p>
                  {funcao.exemplo && <p style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}><b>Exemplo:</b> {funcao.exemplo}</p>}
                </div>

                {!editing ? (
                  <div className="flex flex-col gap-2">
                    {answered ? (
                      <>
                        <Campo label="Atuação" valor={resposta!.atuacao.join(', ') || '—'} />
                        {resposta!.atuacao.includes('Não realiza') && (
                          <Campo label="Quem executa" valor={resposta!.quemExecuta ?? '—'} />
                        )}
                        <Campo label="Interesse" valor={resposta!.interesse ?? '—'} />
                        <Campo label="Criticidade" valor={CRITICIDADE_OPCOES.find(o => o.valor === resposta!.criticidade)?.label ?? '—'} />
                        <Campo label="Abrangência" valor={ABRANGENCIA_OPCOES.find(o => o.valor === resposta!.abrangencia)?.label ?? resposta!.abrangencia ?? '—'} />
                        <Campo label="Observações" valor={resposta!.observacoes || '—'} />
                      </>
                    ) : (
                      <p style={{ fontSize: '0.78rem', color: 'var(--ink-5)' }}>Nenhuma resposta registrada ainda.</p>
                    )}
                    {!readOnly && (
                      <button
                        onClick={() => startEdit(resposta)}
                        className="text-[12px] font-medium hover:underline w-fit mt-1"
                        style={{ color: 'var(--primary)' }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <OpcaoGroup label="Atuação da organização nesta função (seleção múltipla)">
                      {ATUACAO_OPCOES.map(o => (
                        <Chip key={o} active={draft.atuacao.includes(o)} onClick={() => toggleAtuacao(o)}>{o}</Chip>
                      ))}
                    </OpcaoGroup>
                    {draft.atuacao.includes('Não realiza') && (
                      <OpcaoGroup label="Caso não execute, quem executa?">
                        {QUEM_EXECUTA_OPCOES.map(o => (
                          <Chip key={o} active={draft.quemExecuta === o} onClick={() => setDraft(d => ({ ...d, quemExecuta: d.quemExecuta === o ? null : o }))}>{o}</Chip>
                        ))}
                      </OpcaoGroup>
                    )}
                    <OpcaoGroup label="Interesse da organização na atuação desta função">
                      {INTERESSE_OPCOES.map(o => (
                        <Chip key={o} active={draft.interesse === o} onClick={() => setDraft(d => ({ ...d, interesse: d.interesse === o ? null : o }))}>{o}</Chip>
                      ))}
                    </OpcaoGroup>
                    <OpcaoGroup label="Criticidade da função para a organização">
                      {CRITICIDADE_OPCOES.map(o => (
                        <Chip key={o.valor} active={draft.criticidade === o.valor} onClick={() => setDraft(d => ({ ...d, criticidade: d.criticidade === o.valor ? null : o.valor }))}>
                          {o.label}
                        </Chip>
                      ))}
                    </OpcaoGroup>
                    <OpcaoGroup label="Abrangência em relação aos membros">
                      {ABRANGENCIA_OPCOES.map(o => (
                        <Chip key={o.valor} active={draft.abrangencia === o.valor} onClick={() => setDraft(d => ({ ...d, abrangencia: d.abrangencia === o.valor ? null : o.valor }))}>
                          {o.label}
                        </Chip>
                      ))}
                    </OpcaoGroup>
                    <label className="flex flex-col gap-1">
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-4)' }}>Observações</span>
                      <textarea
                        value={draft.observacoes}
                        onChange={e => setDraft(d => ({ ...d, observacoes: e.target.value }))}
                        className="border rounded-lg px-3 py-2 text-[13px] min-h-[70px]"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)' }}
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => salvar.mutate({ ...draft, funcaoId: funcao.id })}
                        disabled={salvar.isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-medium text-white disabled:opacity-60"
                        style={{ background: 'var(--primary)' }}
                      >
                        <Check size={13} /> Salvar
                      </button>
                      {answered && (
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 rounded-md border text-[13px]"
                          style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

