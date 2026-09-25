/**
 * Aba Plano de Trabalho — contêiner das visões e dos painéis.
 *
 * Guarda o estado que o RF-011 manda preservar ao trocar de visão: registro
 * selecionado e recolhimento. Tabela, Gantt e Kanban vão ler do MESMO conjunto
 * de dados e do mesmo estado — o documento é explícito em não criar cópias
 * distintas por visão, porque é assim que duas telas passam a discordar uma da
 * outra sobre o mesmo projeto.
 *
 * Nesta entrega existe a visão Tabela; Gantt e Kanban entram nas próximas, e o
 * seletor já está montado para recebê-las.
 */
import { useMemo, useState } from 'react';
import { Table2, GanttChartSquare, Columns3 } from 'lucide-react';
import { toast } from 'sonner';
import { type Project, type Goal, type Deliverable, type Activity, type Risk } from '../../data/mockData';
import { type ProjectExt } from '../../store';
import {
  codigosHierarquicos, filtrarPlano,
  type CriteriosFiltro, CRITERIOS_VAZIOS, type EscalaGantt,
} from '../../lib/planoTrabalho';
import { BarraFiltros } from './BarraFiltros';
import { VisaoTabela } from './VisaoTabela';
import { VisaoGantt } from './VisaoGantt';
import { PainelEtapa } from './PainelEtapa';
import { PainelAtividade } from './PainelAtividade';
import { PainelRisco } from './PainelRisco';

type Visao = 'tabela' | 'gantt' | 'kanban';

const VISOES: { id: Visao; rotulo: string; icone: typeof Table2; disponivel: boolean }[] = [
  { id: 'tabela', rotulo: 'Tabela', icone: Table2, disponivel: true },
  { id: 'gantt',  rotulo: 'Gantt',  icone: GanttChartSquare, disponivel: true },
  { id: 'kanban', rotulo: 'Kanban', icone: Columns3, disponivel: false },
];

/** Qual painel está aberto. Um de cada vez — abrir dois empilhados confunde a origem. */
type PainelAberto =
  | { tipo: 'etapa'; etapaId: string }
  | { tipo: 'atividade'; atividadeId: string }
  | { tipo: 'risco'; riscoId: string }
  | null;

export function TabPlanoTrabalho({ project }: { project: Project }) {
  const p = project as ProjectExt;
  const [visao, setVisao] = useState<Visao>('tabela');
  const [recolhidos, setRecolhidos] = useState<Set<string>>(new Set());
  const [painel, setPainel] = useState<PainelAberto>(null);
  // Busca, filtros e recolhimento vivem aqui, e não dentro de cada visão:
  // é o que faz a troca Tabela → Gantt → Kanban preservar tudo (RF-011, CA-03).
  const [criterios, setCriterios] = useState<CriteriosFiltro>(CRITERIOS_VAZIOS);
  const [escala, setEscala] = useState<EscalaGantt>('mes');

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

  const alternarRecolhido = (id: string) =>
    setRecolhidos(atual => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id); else proximo.add(id);
      return proximo;
    });

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

  const abrirAnexo = (atividade: Activity) => {
    // O download por URL assinada entra junto com o upload (RF-026/RF-032).
    // Até lá, avisa em vez de abrir um link quebrado.
    toast.info(
      atividade.attachment
        ? `Anexo "${atividade.attachment.fileName}" — abertura de arquivo entra na próxima entrega.`
        : 'Esta atividade não tem anexo.',
    );
  };

  const fechar = () => setPainel(null);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Busca e filtros (RF-012) */}
      <div className="px-6 pt-4 flex-shrink-0">
        <BarraFiltros
          metas={metas}
          criterios={criterios}
          aoMudar={setCriterios}
          visiveis={atividadesVisiveis}
          total={todasAtividades.length}
        />
      </div>

      {/* Seletor de visão (RF-011) */}
      <div className="flex items-center gap-2 px-6 pt-3 pb-3 flex-shrink-0 flex-wrap">
        <div className="inline-flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {VISOES.map(v => {
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
                  borderRight: v.id !== 'kanban' ? '1px solid var(--border)' : undefined,
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

        <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
          {metas.length} meta{metas.length === 1 ? '' : 's'} ·{' '}
          {metas.flatMap(m => m.deliverables).length} etapas
        </span>
      </div>

      {/* Visão */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
        <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {visao === 'tabela' && (
            <VisaoTabela
              metas={metasVisiveis}
              riscos={riscos}
              recolhidos={recolhidos}
              alternarRecolhido={alternarRecolhido}
              codigos={codigos}
              aoAbrirEtapa={etapa => setPainel({ tipo: 'etapa', etapaId: etapa.id })}
              aoAbrirAtividade={atividade => setPainel({ tipo: 'atividade', atividadeId: atividade.id })}
              aoAbrirRisco={risco => setPainel({ tipo: 'risco', riscoId: risco.id })}
              aoAbrirAnexo={abrirAnexo}
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
              aoAbrirAnexo={abrirAnexo}
            />
          )}
        </div>
      </div>

      {/* Painéis (RF-022, RF-023, RF-027) */}
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
            riscoOrigem={origem}
            aoFechar={fechar}
            aoAbrirRisco={r => setPainel({ tipo: 'risco', riscoId: r.id })}
            aoAbrirAnexo={abrirAnexo}
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
