/**
 * Aba Plano de Trabalho — contêiner das visões e dos painéis.
 *
 * Guarda o estado que o RF-011 manda preservar ao trocar de visão: registro
 * selecionado e recolhimento. Tabela, Gantt e Kanban vão ler do MESMO conjunto
 * de dados e do mesmo estado — o documento é explícito em não criar cópias
 * distintas por visão, porque é assim que duas telas passam a discordar uma da
 * outra sobre o mesmo projeto.
 *
 * As três visões leem a mesma lista filtrada e a mesma numeração. Tabela e
 * Gantt, que são árvores, também compartilham o recolhimento; o Kanban não
 * tem hierarquia e mostra sempre todos os cartões que passam nos filtros.
 *
 * RC-05: a aba não tem rolagem própria. Busca, seletor de visão e a visão
 * rolam junto com a página do projeto, e só o topo do cabeçalho fica fixo.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Table2, GanttChartSquare, Columns3, ShieldAlert, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { useStore, type ProjectExt } from '../../store';
import {
  codigosHierarquicos, filtrarPlano, temFiltroAtivo,
  idsRecolhiveis, recolhidosDe, tudoExpandido,
  type CriteriosFiltro, CRITERIOS_VAZIOS, type EscalaGantt,
} from '../../lib/planoTrabalho';
import { BarraFiltros } from './BarraFiltros';
import { VisaoTabela } from './VisaoTabela';
import { VisaoGantt } from './VisaoGantt';
import { VisaoRiscos } from './VisaoRiscos';
import { abrirAnexo } from './CampoAnexo';
import { VisaoKanban, type AgrupamentoKanban } from './VisaoKanban';
import { PainelEtapa } from './PainelEtapa';
import { PainelMeta } from './PainelMeta';
import { PainelAtividade } from './PainelAtividade';
import { PainelRisco } from './PainelRisco';

type Visao = 'tabela' | 'gantt' | 'kanban' | 'riscos';

const VISOES: { id: Visao; rotulo: string; icone: typeof Table2; disponivel: boolean }[] = [
  { id: 'tabela', rotulo: 'Tabela', icone: Table2, disponivel: true },
  { id: 'gantt',  rotulo: 'Gantt',  icone: GanttChartSquare, disponivel: true },
  { id: 'kanban', rotulo: 'Kanban', icone: Columns3, disponivel: true },
  // RF01: a visão consolidada de riscos, no lugar do modal "Registro de riscos".
  { id: 'riscos', rotulo: 'Riscos', icone: ShieldAlert, disponivel: true },
];

/** Qual painel está aberto. Um de cada vez — abrir dois empilhados confunde a origem. */
type PainelAberto =
  | { tipo: 'meta'; metaId: string }
  | { tipo: 'etapa'; etapaId: string }
  | { tipo: 'atividade'; atividadeId: string }
  | { tipo: 'risco'; riscoId: string }
  | null;

export function TabPlanoTrabalho({ project, pedidoRiscos = 0 }: {
  project: Project;
  /** Muda quando o botão Riscos do cabeçalho do projeto é clicado. */
  pedidoRiscos?: number;
}) {
  const p = project as ProjectExt;
  const { updateActivityStatus, setResponsavel } = useStore();
  const [visao, setVisao] = useState<Visao>('tabela');
  // RC-06: tudo começa recolhido. Guarda-se o que foi aberto — ver recolhidosDe().
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [painel, setPainel] = useState<PainelAberto>(null);
  // Busca, filtros e recolhimento vivem aqui, e não dentro de cada visão:
  // é o que faz a troca Tabela → Gantt → Kanban preservar tudo (RF-011, CA-03).
  const [criterios, setCriterios] = useState<CriteriosFiltro>(CRITERIOS_VAZIOS);
  const [escala, setEscala] = useState<EscalaGantt>('mes');
  const [agrupamento, setAgrupamento] = useState<AgrupamentoKanban>('status');

  // O botão Riscos do cabeçalho abre esta visão e rola até ela.
  const seletorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (pedidoRiscos === 0) return;
    setVisao('riscos');
    seletorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pedidoRiscos]);

  const metas = p.goals;
  const riscos = p.risks;

  // RN-004: a numeração sai da lista COMPLETA do projeto. Quando busca e
  // filtros entrarem, eles filtram o que é exibido — nunca o que entra neste
  // cálculo, senão o código de cada registro mudaria a cada digitação.
  const codigos = useMemo(() => codigosHierarquicos(metas), [metas]);

  // A lista EXIBIDA é a filtrada; a numeração continua vindo da completa.
  const metasVisiveis = useMemo(
    () => filtrarPlano(metas, riscos, criterios),
    [metas, riscos, criterios],
  );

  const recolhiveis = useMemo(() => idsRecolhiveis(metas), [metas]);
  const recolhidos = useMemo(() => recolhidosDe(recolhiveis, expandidos), [recolhiveis, expandidos]);
  const expandidoPorInteiro = tudoExpandido(recolhiveis, expandidos);

  // A expansão individual continua disponível (RC-07).
  const alternarRecolhido = (id: string) =>
    setExpandidos(atual => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id); else proximo.add(id);
      return proximo;
    });

  const alternarTudo = () => setExpandidos(expandidoPorInteiro ? new Set() : new Set(recolhiveis));

  // Com tudo recolhido, um resultado de busca ficaria escondido dentro de uma
  // meta fechada e a busca pareceria não achar nada. Ao começar a filtrar,
  // abre tudo; a pessoa pode recolher de novo se quiser.
  const mudarCriterios = (c: CriteriosFiltro) => {
    if (!temFiltroAtivo(criterios) && temFiltroAtivo(c)) setExpandidos(new Set(recolhiveis));
    setCriterios(c);
  };

  // Índices para resolver o que o painel precisa sem varrer a árvore toda a
  // cada render.
  const indice = useMemo(() => {
    const etapas = new Map<string, { etapa: Deliverable; meta: Goal }>();
    const atividades = new Map<string, { atividade: Activity; etapa: Deliverable; meta: Goal }>();
    for (const meta of metas) {
      for (const etapa of meta.deliverables) {
        etapas.set(etapa.id, { etapa, meta });
        for (const atividade of etapa.activities) {
          atividades.set(atividade.id, { atividade, etapa, meta });
        }
      }
    }
    return { etapas, atividades };
  }, [metas]);

  const todasAtividades = useMemo(
    () => metas.flatMap(m => m.deliverables.flatMap(e => e.activities)),
    [metas],
  );

  const atividadesVisiveis = useMemo(
    () => metasVisiveis.flatMap(m => m.deliverables.flatMap(e => e.activities)).length,
    [metasVisiveis],
  );

  const abrirAnexoDaAtividade = (atividade: Activity) => {
    if (!atividade.attachment) { toast.info('Esta atividade não tem anexo.'); return; }
    void abrirAnexo(atividade.attachment.id);
  };

  const fechar = () => setPainel(null);

  // RN-009: mover o cartão atualiza status E progresso de forma consistente —
  // a normalização mora no servidor, então o quadro não pode produzir a
  // incoerência que a constraint do banco recusa.
  const moverStatus = async (atividade: Activity, status: Activity['status']) => {
    try {
      await updateActivityStatus(p.id, atividade.id, status);
      toast.success(`"${atividade.name}" agora está em ${status}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível mover o cartão.');
    }
  };

  const moverResponsavel = async (atividade: Activity, responsavel: string) => {
    try {
      await setResponsavel(atividade.id, responsavel);
      toast.success(responsavel ? `"${atividade.name}" atribuída a ${responsavel}.` : `"${atividade.name}" ficou sem responsável.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível reatribuir o cartão.');
    }
  };

  return (
    <div className="flex flex-col">
      {/* Busca e filtros (RF-012). Filtram atividades; a visão Riscos tem a
          própria busca, sobre os riscos. */}
      <div className="px-6 pt-4" hidden={visao === 'riscos'}>
        <BarraFiltros
          metas={metas}
          criterios={criterios}
          aoMudar={mudarCriterios}
          visiveis={atividadesVisiveis}
          total={todasAtividades.length}
        />
      </div>

      {/* RC-06: um único botão, logo abaixo da busca e antes da visão. Só nas
          visões em árvore — o Kanban não recolhe nada. */}
      {(visao === 'tabela' || visao === 'gantt') && recolhiveis.length > 0 && (
        <div className="px-6 pt-2">
          <button
            onClick={alternarTudo}
            aria-pressed={expandidoPorInteiro}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-2)', background: 'var(--surface-0)' }}
          >
            {expandidoPorInteiro ? <ChevronsDownUp size={13} /> : <ChevronsUpDown size={13} />}
            {expandidoPorInteiro ? 'Recolher tudo' : 'Expandir tudo'}
          </button>
        </div>
      )}

      {/* Seletor de visão (RF-011) */}
      <div ref={seletorRef} className="flex items-center gap-2 px-6 pt-3 pb-3 flex-wrap" style={{ scrollMarginTop: 8 }}>
        <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {VISOES.map((v, i) => {
            const Icone = v.icone;
            const ativa = visao === v.id;
            return (
              <button
                key={v.id}
                onClick={() => v.disponivel && setVisao(v.id)}
                disabled={!v.disponivel}
                title={v.disponivel ? undefined : 'Disponível na próxima entrega'}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px]"
                style={{
                  background: ativa ? 'var(--brand-soft)' : 'transparent',
                  color: !v.disponivel ? 'var(--ink-5)' : ativa ? 'var(--brand)' : 'var(--ink-3)',
                  fontWeight: ativa ? 600 : 400,
                  cursor: v.disponivel ? 'pointer' : 'not-allowed',
                  borderRight: i < VISOES.length - 1 ? '1px solid var(--border)' : undefined,
                }}
              >
                <Icone size={13} /> {v.rotulo}
              </button>
            );
          })}
        </div>

        {/* RF-018: escala só faz sentido no Gantt. */}
        {visao === 'gantt' && (
          <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {([['mes', 'Mês'], ['trimestre', 'Trimestre']] as const).map(([valor, rotulo], i) => (
              <button
                key={valor}
                onClick={() => setEscala(valor)}
                className="px-2.5 py-1.5 text-[12px]"
                style={{
                  background: escala === valor ? 'var(--brand-soft)' : 'transparent',
                  color: escala === valor ? 'var(--brand)' : 'var(--ink-3)',
                  fontWeight: escala === valor ? 600 : 400,
                  borderRight: i === 0 ? '1px solid var(--border)' : undefined,
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}

        {/* RF-019: agrupamento só faz sentido no Kanban. */}
        {visao === 'kanban' && (
          <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {([['status', 'Por status'], ['responsavel', 'Por responsável']] as const).map(([valor, rotulo], i) => (
              <button
                key={valor}
                onClick={() => setAgrupamento(valor)}
                className="px-2.5 py-1.5 text-[12px]"
                style={{
                  background: agrupamento === valor ? 'var(--brand-soft)' : 'transparent',
                  color: agrupamento === valor ? 'var(--brand)' : 'var(--ink-3)',
                  fontWeight: agrupamento === valor ? 600 : 400,
                  borderRight: i === 0 ? '1px solid var(--border)' : undefined,
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>
        )}

        <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
          {metas.length} meta{metas.length === 1 ? '' : 's'} ·{' '}
          {metas.flatMap(m => m.deliverables).length} etapas
        </span>
      </div>

      {/* Visão */}
      <div className="px-6 pb-6">
        <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {visao === 'tabela' && (
            <VisaoTabela
              metas={metasVisiveis}
              riscos={riscos}
              recolhidos={recolhidos}
              alternarRecolhido={alternarRecolhido}
              codigos={codigos}
              aoAbrirMeta={meta => setPainel({ tipo: 'meta', metaId: meta.id })}
              aoAbrirEtapa={etapa => setPainel({ tipo: 'etapa', etapaId: etapa.id })}
              aoAbrirAtividade={atividade => setPainel({ tipo: 'atividade', atividadeId: atividade.id })}
              aoAbrirRisco={risco => setPainel({ tipo: 'risco', riscoId: risco.id })}
              aoAbrirAnexo={abrirAnexoDaAtividade}
            />
          )}

          {visao === 'gantt' && (
            <VisaoGantt
              metas={metasVisiveis}
              riscos={riscos}
              escala={escala}
              recolhidos={recolhidos}
              alternarRecolhido={alternarRecolhido}
              codigos={codigos}
              aoAbrirEtapa={etapa => setPainel({ tipo: 'etapa', etapaId: etapa.id })}
              aoAbrirAtividade={atividade => setPainel({ tipo: 'atividade', atividadeId: atividade.id })}
              aoAbrirAnexo={abrirAnexoDaAtividade}
            />
          )}

          {visao === 'kanban' && (
            <VisaoKanban
              metas={metasVisiveis}
              riscos={riscos}
              agrupamento={agrupamento}
              codigos={codigos}
              aoAbrirEtapa={etapa => setPainel({ tipo: 'etapa', etapaId: etapa.id })}
              aoAbrirAtividade={atividade => setPainel({ tipo: 'atividade', atividadeId: atividade.id })}
              aoAbrirAnexo={abrirAnexoDaAtividade}
              aoMoverStatus={moverStatus}
              aoMoverResponsavel={moverResponsavel}
            />
          )}

          {visao === 'riscos' && (
            <VisaoRiscos
              riscos={riscos}
              metas={metas}
              codigos={codigos}
              atividades={todasAtividades}
              aoAbrirRisco={risco => setPainel({ tipo: 'risco', riscoId: risco.id })}
              aoAbrirAtividade={atividade => setPainel({ tipo: 'atividade', atividadeId: atividade.id })}
            />
          )}
        </div>
      </div>

      {/* Painéis (RF-022, RF-023, RF-027, RF04.1) */}
      {painel?.tipo === 'meta' && (() => {
        const meta = metas.find(m => m.id === painel.metaId);
        if (!meta) return null;
        return (
          <PainelMeta
            meta={meta}
            riscos={riscos}
            codigo={codigos.get(meta.id) ?? ''}
            codigos={codigos}
            aoFechar={fechar}
            aoAbrirEtapa={e => setPainel({ tipo: 'etapa', etapaId: e.id })}
          />
        );
      })()}

      {painel?.tipo === 'etapa' && (() => {
        const alvo = indice.etapas.get(painel.etapaId);
        if (!alvo) return null;
        return (
          <PainelEtapa
            etapa={alvo.etapa}
            meta={alvo.meta}
            riscos={riscos}
            codigo={codigos.get(alvo.etapa.id) ?? ''}
            projetoId={p.id}
            aoFechar={fechar}
            aoAbrirRisco={r => setPainel({ tipo: 'risco', riscoId: r.id })}
            aoAbrirAtividade={a => setPainel({ tipo: 'atividade', atividadeId: a.id })}
          />
        );
      })()}

      {painel?.tipo === 'atividade' && (() => {
        const alvo = indice.atividades.get(painel.atividadeId);
        if (!alvo) return null;
        const origem = alvo.atividade.riskOriginId
          ? riscos.find(r => r.id === alvo.atividade.riskOriginId)
          : undefined;
        return (
          <PainelAtividade
            atividade={alvo.atividade}
            etapa={alvo.etapa}
            meta={alvo.meta}
            codigo={codigos.get(alvo.atividade.id) ?? ''}
            projetoId={p.id}
            riscoOrigem={origem}
            aoFechar={fechar}
            aoAbrirRisco={r => setPainel({ tipo: 'risco', riscoId: r.id })}
          />
        );
      })()}

      {painel?.tipo === 'risco' && (() => {
        const risco = riscos.find(r => r.id === painel.riscoId);
        if (!risco) return null;
        const alvo = risco.stageId ? indice.etapas.get(risco.stageId) : undefined;
        return (
          <PainelRisco
            risco={risco}
            etapa={alvo?.etapa}
            meta={alvo?.meta}
            codigoEtapa={alvo ? codigos.get(alvo.etapa.id) : undefined}
            projetoId={p.id}
            acoesDeResposta={todasAtividades.filter(a => a.riskOriginId === risco.id)}
            aoFechar={fechar}
            aoAbrirAtividade={a => setPainel({ tipo: 'atividade', atividadeId: a.id })}
          />
        );
      })()}
    </div>
  );
}
