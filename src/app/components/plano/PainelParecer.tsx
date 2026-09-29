/**
 * Parecer técnico do projeto (RF-033, RF-034).
 *
 * As "ações derivadas" (RF-036) saíram daqui: o RC-04 as substitui pelos
 * Encaminhamentos da organização, que valem para qualquer origem.
 *
 * Painel lateral acessível pelo cabeçalho, nas quatro seções. O documento é
 * explícito em NÃO criar uma quinta aba nem um cartão grande no resumo: o
 * parecer é registro de acompanhamento, não um módulo de primeira ordem da
 * navegação.
 *
 * RN-026 rege o tom da tela: o parecer registra análise e encaminhamento, e
 * nada nele altera orçamento, riscos ou percentuais. Por isso campo em branco
 * diz "sem registro" e nunca "sem problema" — afirmar que não há item crítico
 * porque ninguém preencheu o campo seria inventar uma conclusão.
 */
import { useMemo, useState } from 'react';
import { Pencil, Trash2, X, AlertTriangle, DollarSign, ChevronLeft, Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Project } from '../../data/mockData';
import {
  ORIGENS_PARECER, type OrigemParecer, type ParecerTecnico,
} from '../../data/projectExtras';
import { useStore, type ProjectExt } from '../../store';
import { useAuth } from '../../auth/authStore';
import { formatDateOnly } from '../../lib/dateOnly';
import { type ParecerInput } from '../../planoTrabalho.server';
import { rotuloRegistro } from '../../lib/organizacoes';
import { Campo, Texto, AreaTexto, Data, Selecao, Erros, Acoes, ConfirmarExclusao } from './camposFormulario';
import { BotaoNovo } from '../BotaoNovo';

/** Ausência de registro, dita como tal (RN-026). */
function SemRegistro() {
  return <span style={{ color: 'var(--ink-5)', fontStyle: 'italic' }}>Sem registro</span>;
}

function Bloco({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="py-2" style={{ borderBottom: '1px solid var(--line-1)' }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {rotulo}
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
        {children}
      </div>
    </div>
  );
}

/** Onde as tarefas que saem do parecer passam a ser registradas (RC-04). */
function AvisoEncaminhamentos({ organizacao }: { organizacao?: { id: string; nome: string } | null }) {
  return (
    <div
      className="rounded-lg border px-3 py-2"
      style={{ borderColor: 'var(--line-1)', background: 'var(--surface-1)', fontSize: '0.74rem', color: 'var(--ink-3)', lineHeight: 1.5 }}
    >
      Tarefas que saírem deste parecer são registradas como <strong>Encaminhamentos</strong>
      {organizacao ? <> na ficha de <strong>{organizacao.nome}</strong>, em Organizações</> : ' na ficha da organização, em Organizações'}.
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formulário
// ---------------------------------------------------------------------------

function paraInput(projetoId: number, parecer?: ParecerTecnico): ParecerInput {
  return {
    projetoId,
    data: parecer?.data ?? new Date().toISOString().slice(0, 10),
    origem: parecer?.origem ?? 'Visita técnica',
    autor: parecer?.autor ?? '',
    pontosObservados: parecer?.pontosObservados ?? '',
    itensCriticos: parecer?.itensCriticos ?? '',
    limitacoesOrcamentarias: parecer?.limitacoesOrcamentarias ?? '',
    recomendacao: parecer?.recomendacao ?? '',
    logComunicacaoId: parecer?.logComunicacaoId ?? null,
  };
}

function FormularioParecer({
  projeto, parecer, aoFechar,
}: { projeto: ProjectExt; parecer?: ParecerTecnico; aoFechar: () => void }) {
  const { createParecer, updateParecer } = useStore();
  const { user } = useAuth();
  const [form, setForm] = useState<ParecerInput>(() => {
    const base = paraInput(projeto.id, parecer);
    return parecer ? base : { ...base, autor: user?.displayName ?? '' };
  });
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const alterar = <K extends keyof ParecerInput>(campo: K, valor: ParecerInput[K]) =>
    setForm(f => ({ ...f, [campo]: valor }));

  const contatos = projeto.commLogs ?? [];

  const salvar = async () => {
    const problemas: string[] = [];
    if (!form.data) problemas.push('Informe a data da visita ou reunião.');
    if (!form.autor.trim()) problemas.push('Informe o responsável pelo registro.');
    if (!form.pontosObservados.trim()) problemas.push('Informe os pontos observados.');
    if (problemas.length) { setErros(problemas); return; }

    setSalvando(true);
    try {
      if (parecer) {
        await updateParecer(parecer.id, form);
        toast.success('Parecer atualizado.');
      } else {
        await createParecer(form);
        toast.success('Parecer registrado.');
      }
      aoFechar();
    } catch (e) {
      setErros([e instanceof Error ? e.message : 'Não foi possível salvar.']);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Erros erros={erros} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo rotulo="Data da visita / reunião" obrigatorio>
          <Data valor={form.data} aoMudar={v => alterar('data', v ?? '')} />
        </Campo>
        <Campo rotulo="Origem" obrigatorio>
          <Selecao
            valor={form.origem as OrigemParecer}
            opcoes={ORIGENS_PARECER}
            aoMudar={v => alterar('origem', v)}
          />
        </Campo>
      </div>

      <Campo rotulo="Responsável pelo registro" obrigatorio>
        <Texto valor={form.autor} aoMudar={v => alterar('autor', v)} />
      </Campo>

      <Campo rotulo="Pontos observados" obrigatorio>
        <AreaTexto valor={form.pontosObservados} aoMudar={v => alterar('pontosObservados', v)} linhas={4} />
      </Campo>

      <Campo
        rotulo="Itens críticos"
        dica="Deixar em branco registra ausência de anotação — não afirma que não há item crítico."
      >
        <AreaTexto valor={form.itensCriticos} aoMudar={v => alterar('itensCriticos', v)} linhas={3} />
      </Campo>

      <Campo
        rotulo="Limitações relacionadas ao orçamento"
        dica="Este texto não altera valores nem rubricas do Orçamento."
      >
        <AreaTexto valor={form.limitacoesOrcamentarias} aoMudar={v => alterar('limitacoesOrcamentarias', v)} linhas={3} />
      </Campo>

      <Campo rotulo="Recomendação técnica">
        <AreaTexto valor={form.recomendacao} aoMudar={v => alterar('recomendacao', v)} linhas={3} />
      </Campo>

      <Campo rotulo="Registro de contato relacionado" dica="Opcional — vincula a um registro de contato da organização.">
        <select
          className="w-full border rounded-lg px-2.5 py-1.5"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--ink-1)', fontSize: '0.8rem' }}
          value={form.logComunicacaoId ?? ''}
          onChange={e => alterar('logComunicacaoId', e.target.value || null)}
        >
          <option value="">Nenhum</option>
          {contatos.map(c => (
            <option key={c.id} value={c.id}>
              {rotuloRegistro(c)}
            </option>
          ))}
        </select>
      </Campo>

      <AvisoEncaminhamentos organizacao={projeto.organizacao} />

      <Acoes
        aoCancelar={aoFechar}
        aoSalvar={salvar}
        salvando={salvando}
        rotuloSalvar={parecer ? 'Salvar alterações' : 'Registrar parecer'}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Painel
// ---------------------------------------------------------------------------

type Modo = { tela: 'lista' } | { tela: 'novo' } | { tela: 'detalhe'; id: string } | { tela: 'editar'; id: string };

export function PainelParecer({ project, aoFechar }: { project: Project; aoFechar: () => void }) {
  const p = project as ProjectExt;
  const { deleteParecer } = useStore();
  const { readOnly } = useAuth();
  const [modo, setModo] = useState<Modo>({ tela: 'lista' });
  const [excluindo, setExcluindo] = useState<ParecerTecnico | null>(null);

  const pareceres = p.pareceres ?? [];
  const atual = useMemo(
    () => ('id' in modo ? pareceres.find(x => x.id === modo.id) : undefined),
    [modo, pareceres],
  );

  const contatoVinculado = (parecer: ParecerTecnico) =>
    (p.commLogs ?? []).find(c => c.id === parecer.logComunicacaoId);

  const titulo =
    modo.tela === 'novo' ? 'Novo parecer técnico' :
    modo.tela === 'editar' ? 'Editar parecer' :
    modo.tela === 'detalhe' ? 'Parecer técnico' :
    'Pareceres técnicos';

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(15,23,42,.5)' }} onClick={aoFechar}>
        <div
          onClick={e => e.stopPropagation()}
          className="bg-card h-full w-full max-w-2xl flex flex-col"
          role="dialog"
          aria-label="Pareceres técnicos"
        >
          <div className="px-5 py-3.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {modo.tela !== 'lista' && (
                  <button
                    onClick={() => setModo({ tela: 'lista' })}
                    className="inline-flex items-center gap-1 mb-1"
                    style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}
                  >
                    <ChevronLeft size={12} /> Todos os pareceres
                  </button>
                )}
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink-1)' }}>
                  {titulo}
                </div>
                {modo.tela === 'lista' && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink-4)', marginTop: 2 }}>
                    {pareceres.length} registro{pareceres.length === 1 ? '' : 's'} · {project.name}
                  </div>
                )}
              </div>
              <button onClick={aoFechar} aria-label="Fechar pareceres"><X size={16} color="var(--ink-4)" /></button>
            </div>

            {modo.tela === 'lista' && !readOnly && (
              <BotaoNovo onClick={() => setModo({ tela: 'novo' })} className="mt-3">Novo parecer</BotaoNovo>
            )}

            {modo.tela === 'detalhe' && atual && !readOnly && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => setModo({ tela: 'editar', id: atual.id })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium"
                  style={{ borderColor: 'var(--border)', color: 'var(--ink-2)' }}
                >
                  <Pencil size={12} /> Editar
                </button>
                <button
                  onClick={() => setExcluindo(atual)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium"
                  style={{ borderColor: 'var(--danger-soft-border)', color: 'var(--danger)', background: 'var(--danger-soft)' }}
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {modo.tela === 'lista' && (
              <>
                {pareceres.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-5)', lineHeight: 1.6 }}>
                    Nenhum parecer registrado para este projeto.
                    {!readOnly && ' Use “Novo parecer” para registrar uma visita ou reunião de acompanhamento.'}
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {pareceres.map(parecer => (
                      <li key={parecer.id}>
                        <button
                          onClick={() => setModo({ tela: 'detalhe', id: parecer.id })}
                          className="w-full text-left rounded-lg border p-3 hover:border-current"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-2)', fontWeight: 600 }}>
                              {formatDateOnly(parecer.data)}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{ background: 'var(--surface-2)', color: 'var(--ink-3)', fontSize: '0.68rem' }}
                            >
                              {parecer.origem}
                            </span>
                            {/* Indicação DISCRETA, como o RF-033 pede. */}
                            {parecer.itensCriticos.trim() && (
                              <span className="inline-flex items-center gap-1" style={{ color: 'var(--danger)', fontSize: '0.68rem' }} title="Tem itens críticos registrados">
                                <AlertTriangle size={10} /> críticos
                              </span>
                            )}
                            {parecer.limitacoesOrcamentarias.trim() && (
                              <span className="inline-flex items-center gap-1" style={{ color: 'var(--warning-strong-text)', fontSize: '0.68rem' }} title="Tem limitações de orçamento registradas">
                                <DollarSign size={10} /> orçamento
                              </span>
                            )}
                          </div>
                          <div className="truncate mt-1" style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>
                            {parecer.pontosObservados}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginTop: 2 }}>
                            {parecer.autor}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {modo.tela === 'novo' && (
              <FormularioParecer projeto={p} aoFechar={() => setModo({ tela: 'lista' })} />
            )}

            {modo.tela === 'editar' && atual && (
              <FormularioParecer projeto={p} parecer={atual} aoFechar={() => setModo({ tela: 'detalhe', id: atual.id })} />
            )}

            {modo.tela === 'detalhe' && atual && (
              <>
                <Bloco rotulo="Data e origem">
                  {formatDateOnly(atual.data)} · {atual.origem}
                </Bloco>
                <Bloco rotulo="Responsável pelo registro">{atual.autor}</Bloco>
                <Bloco rotulo="Pontos observados">{atual.pontosObservados}</Bloco>

                {/* RN-026: em branco = sem registro, nunca "sem problema". */}
                <Bloco rotulo="Itens críticos">
                  {atual.itensCriticos.trim() || <SemRegistro />}
                </Bloco>
                <Bloco rotulo="Limitações relacionadas ao orçamento">
                  {atual.limitacoesOrcamentarias.trim() || <SemRegistro />}
                </Bloco>
                <Bloco rotulo="Recomendação técnica">
                  {atual.recomendacao.trim() || <SemRegistro />}
                </Bloco>

                {contatoVinculado(atual) && (
                  <Bloco rotulo="Registro de contato relacionado">
                    <span className="inline-flex items-center gap-1.5">
                      <Link2 size={12} color="var(--ink-4)" />
                      {rotuloRegistro(contatoVinculado(atual)!)}
                    </span>
                  </Bloco>
                )}

                <div style={{ marginTop: 12 }}>
                  <AvisoEncaminhamentos organizacao={p.organizacao} />
                </div>

                <p style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginTop: 12, lineHeight: 1.5 }}>
                  Este parecer registra análise e encaminhamento. Nada nele altera aprovações, valores do
                  orçamento, percentuais de andamento ou a matriz de riscos.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {excluindo && (
        <ConfirmarExclusao
          titulo="Excluir parecer técnico"
          descricao={
            `O parecer de ${formatDateOnly(excluindo.data)} será removido. ` +
            'Orçamento, riscos, percentuais do projeto e encaminhamentos da organização não são afetados.'
          }
          aoCancelar={() => setExcluindo(null)}
          aoConfirmar={async () => {
            const alvo = excluindo;
            setExcluindo(null);
            try {
              await deleteParecer(alvo.id);
              toast.success('Parecer excluído.');
              setModo({ tela: 'lista' });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.');
            }
          }}
        />
      )}
    </>
  );
}
