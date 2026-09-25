/**
 * Painel da etapa (RF-022).
 *
 * É AQUI que moram criar atividade, criar risco e editar período — e só aqui
 * (RF-014). A tabela, o Gantt e o Kanban mostram dados e levam para cá.
 *
 * Perfil de consulta (SEMAS) vê tudo e não recebe nenhum botão de escrita. A
 * ocultação é cortesia com quem lê; quem de fato impede a escrita é o servidor
 * (RN-001) — ver sessao.server.ts.
 */
import { useState } from 'react';
import { Plus, CalendarRange, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { useStore } from '../../store';
import { useAuth } from '../../auth/authStore';
import { estaAtrasada, faixaRisco, riscoEmAberto, validarPeriodoDaEtapa } from '../../lib/planoTrabalho';
import { Painel, Linha, Periodo, BotaoAcao } from './PainelBase';
import { Campo, Data, Erros, Acoes } from './camposFormulario';
import { FormularioAtividade } from './FormularioAtividade';
import { FormularioRisco } from './FormularioRisco';

type Modo = 'ver' | 'periodo' | 'novaAtividade' | 'novoRisco';

/** Edição do período previsto e realizado da etapa (RN-014, RN-016, CA-08). */
function FormularioPeriodo({ etapa, aoFechar }: { etapa: Deliverable; aoFechar: () => void }) {
  const { savePeriodoEtapa } = useStore();
  const [inicioPrevisto, setInicioPrevisto] = useState(etapa.plannedStart);
  const [fimPrevisto, setFimPrevisto] = useState(etapa.plannedEnd);
  const [inicioRealizado, setInicioRealizado] = useState(etapa.actualStart);
  const [fimRealizado, setFimRealizado] = useState(etapa.actualEnd);
  const [erros, setErros] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    const validacao = validarPeriodoDaEtapa(
      { inicio: inicioPrevisto, fim: fimPrevisto },
      etapa.activities.map(a => ({ name: a.name, plannedStart: a.plannedStart, plannedEnd: a.plannedEnd })),
    );
    if (!validacao.ok) { setErros(validacao.erros); return; }

    setSalvando(true);
    try {
      await savePeriodoEtapa({
        etapaId: etapa.id,
        inicioPrevisto, fimPrevisto, inicioRealizado, fimRealizado,
      });
      toast.success('Período da etapa atualizado.');
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

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-3" style={{ borderColor: 'var(--line-1)' }}>
        <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>Previsto</legend>
        <Campo rotulo="Início previsto"><Data valor={inicioPrevisto} aoMudar={setInicioPrevisto} max={fimPrevisto} /></Campo>
        <Campo rotulo="Fim previsto"><Data valor={fimPrevisto} aoMudar={setFimPrevisto} min={inicioPrevisto} /></Campo>
      </fieldset>

      {/* RN-016: é estendendo o realizado da etapa que se registra um atraso de
          verdade. Sem este campo, a validação da atividade obrigaria a
          descartar a ocorrência do atraso. */}
      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3 border rounded-lg p-3" style={{ borderColor: 'var(--line-1)' }}>
        <legend style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-4)', padding: '0 6px' }}>
          Realizado — estenda aqui quando a execução passar do previsto
        </legend>
        <Campo rotulo="Início"><Data valor={inicioRealizado} aoMudar={setInicioRealizado} max={fimRealizado} /></Campo>
        <Campo rotulo="Fim"><Data valor={fimRealizado} aoMudar={setFimRealizado} min={inicioRealizado} /></Campo>
      </fieldset>

      <Acoes aoCancelar={aoFechar} aoSalvar={salvar} salvando={salvando} />
    </div>
  );
}

export function PainelEtapa({
  etapa, meta, riscos, codigo, projetoId, aoFechar, aoAbrirRisco, aoAbrirAtividade,
}: {
  etapa: Deliverable; meta: Goal; riscos: Risk[]; codigo: string; projetoId: number;
  aoFechar: () => void;
  aoAbrirRisco: (r: Risk) => void;
  aoAbrirAtividade: (a: Activity) => void;
}) {
  const { readOnly } = useAuth();
  const [modo, setModo] = useState<Modo>('ver');

  const daEtapa = riscos.filter(r => r.stageId === etapa.id);
  const abertos = daEtapa.filter(riscoEmAberto);
  const semPeriodo = !etapa.plannedStart || !etapa.plannedEnd;

  const titulo =
    modo === 'periodo' ? 'Editar período' :
    modo === 'novaAtividade' ? 'Nova atividade' :
    modo === 'novoRisco' ? 'Novo risco' :
    etapa.name;

  const acoes = !readOnly && modo === 'ver' ? (
    <>
      <BotaoAcao aoClicar={() => setModo('periodo')}><CalendarRange size={12} /> Editar período</BotaoAcao>
      <BotaoAcao aoClicar={() => setModo('novaAtividade')}><Plus size={12} /> Criar atividade</BotaoAcao>
      <BotaoAcao aoClicar={() => setModo('novoRisco')}><ShieldAlert size={12} /> Criar risco</BotaoAcao>
    </>
  ) : undefined;

  return (
    <Painel titulo={titulo} caminho={`${meta.name} › Etapa ${codigo}`} aoFechar={aoFechar} acoes={acoes}>
      {modo === 'periodo' && <FormularioPeriodo etapa={etapa} aoFechar={() => setModo('ver')} />}

      {modo === 'novaAtividade' && <FormularioAtividade etapa={etapa} aoFechar={() => setModo('ver')} />}

      {modo === 'novoRisco' && (
        <FormularioRisco projetoId={projetoId} etapa={etapa} aoFechar={() => setModo('ver')} />
      )}

      {modo === 'ver' && (
        <>
          {/* CA-07: sem período previsto a etapa não aceita atividade — dizer
              isso aqui evita que a pessoa descubra só ao tentar criar. */}
          {semPeriodo && !readOnly && (
            <div
              className="rounded-lg border px-3 py-2 mb-3"
              style={{ borderColor: 'var(--border)', background: 'var(--warning-soft)', fontSize: '0.75rem', color: 'var(--ink-2)' }}
            >
              Esta etapa ainda não tem início e fim previstos. Preencha o período antes de criar atividades.
            </div>
          )}

          <Linha rotulo="Período previsto"><Periodo inicio={etapa.plannedStart} fim={etapa.plannedEnd} /></Linha>
          <Linha rotulo="Período realizado"><Periodo inicio={etapa.actualStart} fim={etapa.actualEnd} /></Linha>
          {etapa.expectedResult && <Linha rotulo="Resultado esperado">{etapa.expectedResult}</Linha>}

          <Linha rotulo={`Atividades (${etapa.activities.length})`}>
            {etapa.activities.length === 0 ? (
              <span style={{ color: 'var(--ink-5)' }}>Nenhuma atividade nesta etapa.</span>
            ) : (
              <ul className="flex flex-col gap-1 mt-1">
                {etapa.activities.map(a => (
                  <li key={a.id}>
                    <button
                      onClick={() => aoAbrirAtividade(a)}
                      className="text-left hover:underline flex items-center gap-2 w-full"
                      style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}
                    >
                      <span className="truncate">{a.name}</span>
                      <span style={{ fontSize: '0.7rem', color: estaAtrasada(a) ? 'var(--danger)' : 'var(--ink-5)', whiteSpace: 'nowrap' }}>
                        {estaAtrasada(a) ? 'Atrasada' : a.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Linha>

          <Linha rotulo={`Riscos (${daEtapa.length}${daEtapa.length ? `, ${abertos.length} em aberto` : ''})`}>
            {daEtapa.length === 0 ? (
              <span style={{ color: 'var(--ink-5)' }}>Nenhum risco cadastrado nesta etapa.</span>
            ) : (
              <ul className="flex flex-col gap-1 mt-1">
                {daEtapa.map(r => (
                  <li key={r.id}>
                    <button
                      onClick={() => aoAbrirRisco(r)}
                      className="text-left hover:underline flex items-center gap-2 w-full"
                      style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}
                    >
                      <ShieldAlert size={11} color="var(--danger)" style={{ flexShrink: 0 }} />
                      <span className="truncate">{r.title || r.description}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', whiteSpace: 'nowrap' }}>
                        {faixaRisco(r.severity)} · {r.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Linha>
        </>
      )}
    </Painel>
  );
}
