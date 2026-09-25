/**
 * Visão Kanban do Plano de Trabalho (RF-019, RF-020, RF-021).
 *
 * Cartões representam ATIVIDADES — nunca riscos nem tarefas (RF-021). O risco
 * pertence à etapa e aparece no cartão como indicação, levando ao painel da
 * etapa; transformá-lo em cartão faria o quadro contar risco como trabalho a
 * executar, que é uma leitura errada do projeto.
 *
 * Sobre a hierarquia no quadro: um Kanban agrupa por status ou por pessoa, e
 * meta/etapa não podem ser o eixo principal sem duplicar cartões. A solução
 * que o RF-021 pede — hierarquia "sem duplicar cartões" — é o cartão carregar
 * "Etapa: Atividade" com acesso ao painel da etapa, e o recolhimento vindo das
 * outras visões valer aqui: recolher uma meta na Tabela tira os cartões dela
 * do quadro. É o mesmo estado, não uma cópia (RF-011).
 *
 * O arraste usa a API nativa de drag-and-drop do navegador, sem biblioteca
 * nova. Para perfil de consulta o arraste é desligado (RF-020) — e o servidor
 * recusa a escrita de qualquer forma (CA-02), porque desabilitar na interface
 * é cortesia, não autorização.
 */
import { useMemo, useState } from 'react';
import { Paperclip, ShieldAlert, AlertTriangle, DollarSign, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { type Goal, type Activity, type Risk, type Deliverable } from '../../data/mockData';
import { useAuth } from '../../auth/authStore';
import { formatDateOnly } from '../../lib/dateOnly';
import { estaAtrasada, hojeISO, riscoDaEtapa } from '../../lib/planoTrabalho';

export type AgrupamentoKanban = 'status' | 'responsavel';

const STATUS: Activity['status'][] = ['A iniciar', 'Em andamento', 'Concluído'];
const SEM_RESPONSAVEL = '__sem_responsavel__';

const CORES_FAIXA: Record<string, string> = {
  'Baixo': 'var(--success)',
  'Médio': 'var(--warning-strong-text)',
  'Alto': 'var(--danger)',
  'Crítico': 'var(--danger)',
};

interface CartaoDados {
  atividade: Activity;
  etapa: Deliverable;
  meta: Goal;
}

function Cartao({
  dados, codigo, risco, arrastavel, aoAbrir, aoAbrirEtapa, aoAbrirAnexo, aoIniciarArraste,
}: {
  dados: CartaoDados;
  codigo: string;
  risco: ReturnType<typeof riscoDaEtapa>;
  arrastavel: boolean;
  aoAbrir: () => void;
  aoAbrirEtapa: () => void;
  aoAbrirAnexo: () => void;
  aoIniciarArraste: (e: React.DragEvent) => void;
}) {
  const { atividade, etapa } = dados;
  const atrasada = estaAtrasada(atividade);

  return (
    <div
      draggable={arrastavel}
      onDragStart={aoIniciarArraste}
      className="rounded-lg border p-2.5 flex flex-col gap-1.5"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--surface-0)',
        cursor: arrastavel ? 'grab' : 'default',
      }}
    >
      <div className="flex items-start gap-1.5">
        {arrastavel && <GripVertical size={12} color="var(--ink-5)" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />}
        <div className="min-w-0 flex-1">
          {/* "Etapa: Atividade" (RF-019). A etapa leva ao painel dela — é a
              hierarquia acessível sem duplicar cartão (RF-021). */}
          <button
            onClick={aoAbrirEtapa}
            className="block text-left truncate hover:underline w-full"
            style={{ fontSize: '0.68rem', color: 'var(--ink-4)' }}
            title={`Abrir etapa ${etapa.name}`}
          >
            {etapa.name}
          </button>
          <button
            onClick={aoAbrir}
            className="block text-left hover:underline w-full"
            style={{ fontSize: '0.78rem', color: 'var(--ink-1)', lineHeight: 1.35 }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--ink-5)', marginRight: 5 }}>
              {codigo}
            </span>
            {atividade.name}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-x-2 gap-y-1 flex-wrap" style={{ fontSize: '0.68rem' }}>
        <span style={{ color: 'var(--ink-4)' }}>
          {atividade.responsible || 'sem responsável'}
        </span>
        <span style={{ color: atrasada ? 'var(--danger)' : 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
          {atividade.plannedEnd ? formatDateOnly(atividade.plannedEnd) : 'sem prazo'}
        </span>
        {atrasada && (
          <span className="inline-flex items-center gap-0.5" style={{ color: 'var(--danger)', fontWeight: 600 }}>
            <AlertTriangle size={9} /> Atrasada
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap" style={{ fontSize: '0.66rem' }}>
        <span style={{ color: 'var(--ink-5)' }}>{atividade.status}</span>
        {risco && (
          <button
            onClick={aoAbrirEtapa}
            className="inline-flex items-center gap-0.5"
            style={{ color: CORES_FAIXA[risco.faixa] ?? 'var(--ink-4)' }}
            title={`Risco da etapa · ${risco.faixa}`}
          >
            <ShieldAlert size={9} /> {risco.faixa}
          </button>
        )}
        {atividade.budgetLink !== 'Não informado' && (
          <span className="inline-flex items-center gap-0.5" style={{ color: 'var(--ink-4)' }} title={`Vínculo orçamentário: ${atividade.budgetLink}`}>
            <DollarSign size={9} /> {atividade.budgetLink}
          </span>
        )}
        {atividade.attachment && (
          <button
            onClick={aoAbrirAnexo}
            className="inline-flex items-center gap-0.5"
            style={{ color: 'var(--info)' }}
            aria-label={`Anexo de ${atividade.name}`}
          >
            <Paperclip size={9} /> anexo
          </button>
        )}
      </div>
    </div>
  );
}

export interface VisaoKanbanProps {
  metas: Goal[];
  riscos: Risk[];
  agrupamento: AgrupamentoKanban;
  recolhidos: Set<string>;
  codigos: Map<string, string>;
  aoAbrirEtapa: (etapa: Deliverable, meta: Goal) => void;
  aoAbrirAtividade: (atividade: Activity, etapa: Deliverable, meta: Goal) => void;
  aoAbrirAnexo: (atividade: Activity) => void;
  aoMoverStatus: (atividade: Activity, status: Activity['status']) => void;
  aoMoverResponsavel: (atividade: Activity, responsavel: string) => void;
}

export function VisaoKanban({
  metas, riscos, agrupamento, recolhidos, codigos,
  aoAbrirEtapa, aoAbrirAtividade, aoAbrirAnexo, aoMoverStatus, aoMoverResponsavel,
}: VisaoKanbanProps) {
  const { readOnly } = useAuth();
  const [sobre, setSobre] = useState<string | null>(null);
  const hoje = hojeISO();

  // RF-021 / RF-011: o recolhimento vem das outras visões. Meta ou etapa
  // recolhida some do quadro, em vez de duplicar hierarquia aqui.
  const cartoes = useMemo(() => {
    const lista: CartaoDados[] = [];
    for (const meta of metas) {
      if (recolhidos.has(meta.id)) continue;
      for (const etapa of meta.deliverables) {
        if (recolhidos.has(etapa.id)) continue;
        for (const atividade of etapa.activities) {
          lista.push({ atividade, etapa, meta });
        }
      }
    }
    return lista;
  }, [metas, recolhidos]);

  const colunas = useMemo(() => {
    if (agrupamento === 'status') {
      return STATUS.map(s => ({
        chave: s,
        rotulo: s,
        cartoes: cartoes.filter(c => c.atividade.status === s),
      }));
    }
    // Uma coluna por responsável PRESENTE (RF-019) — não a lista inteira de
    // pessoas do sistema, que encheria o quadro de colunas vazias.
    const nomes = [...new Set(cartoes.map(c => c.atividade.responsible.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const colunasPessoas = nomes.map(n => ({
      chave: n, rotulo: n, cartoes: cartoes.filter(c => c.atividade.responsible.trim() === n),
    }));
    const semDono = cartoes.filter(c => !c.atividade.responsible.trim());
    return semDono.length
      ? [...colunasPessoas, { chave: SEM_RESPONSAVEL, rotulo: 'Sem responsável', cartoes: semDono }]
      : colunasPessoas;
  }, [cartoes, agrupamento]);

  const soltar = (chaveColuna: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setSobre(null);
    if (readOnly) return;

    const atividadeId = e.dataTransfer.getData('text/plain');
    const alvo = cartoes.find(c => c.atividade.id === atividadeId);
    if (!alvo) return;

    if (agrupamento === 'status') {
      if (alvo.atividade.status === chaveColuna) return;
      aoMoverStatus(alvo.atividade, chaveColuna as Activity['status']);
    } else {
      const novo = chaveColuna === SEM_RESPONSAVEL ? '' : chaveColuna;
      if (alvo.atividade.responsible.trim() === novo) return;
      aoMoverResponsavel(alvo.atividade, novo);
    }
  };

  if (metas.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>
        Nenhuma atividade corresponde aos filtros aplicados.
      </div>
    );
  }

  if (colunas.length === 0) {
    return (
      <div className="p-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.82rem', lineHeight: 1.6 }}>
        Nenhuma atividade tem responsável informado, então não há colunas a montar.
        <br />
        Agrupe por status ou atribua responsáveis no painel de cada atividade.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-3">
      <div className="flex gap-3" style={{ minWidth: colunas.length * 250 }}>
        {colunas.map(coluna => (
          <div
            key={coluna.chave}
            onDragOver={e => { if (!readOnly) { e.preventDefault(); setSobre(coluna.chave); } }}
            onDragLeave={() => setSobre(s => (s === coluna.chave ? null : s))}
            onDrop={soltar(coluna.chave)}
            // Área de soltar precisa ser identificável por leitor de tela —
            // sem rótulo, quem navega por teclado não sabe onde está.
            role="group"
            aria-label={`Coluna ${coluna.rotulo}, ${coluna.cartoes.length} atividade(s)`}
            data-coluna={coluna.chave}
            className="flex-1 rounded-xl border flex flex-col"
            style={{
              minWidth: 236,
              borderColor: sobre === coluna.chave ? 'var(--primary)' : 'var(--line-1)',
              background: sobre === coluna.chave ? 'var(--brand-soft)' : 'var(--surface-1)',
            }}
          >
            <div
              className="px-3 py-2 flex items-center justify-between gap-2"
              style={{ borderBottom: '1px solid var(--line-1)' }}
            >
              <span className="truncate" style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink-2)' }}>
                {coluna.rotulo}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', fontFamily: 'var(--font-mono)' }}>
                {coluna.cartoes.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 p-2 flex-1">
              {coluna.cartoes.length === 0 && (
                <span className="text-center py-4" style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>
                  {readOnly ? 'Vazia' : 'Arraste um cartão para cá'}
                </span>
              )}
              {coluna.cartoes.map(dados => (
                <Cartao
                  key={dados.atividade.id}
                  dados={dados}
                  codigo={codigos.get(dados.atividade.id) ?? ''}
                  risco={riscoDaEtapa(riscos, dados.etapa.id)}
                  arrastavel={!readOnly}
                  aoIniciarArraste={e => e.dataTransfer.setData('text/plain', dados.atividade.id)}
                  aoAbrir={() => aoAbrirAtividade(dados.atividade, dados.etapa, dados.meta)}
                  aoAbrirEtapa={() => aoAbrirEtapa(dados.etapa, dados.meta)}
                  aoAbrirAnexo={() => aoAbrirAnexo(dados.atividade)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {readOnly && (
        <p className="mt-3 px-1" style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
          Seu perfil tem acesso de consulta: os cartões abrem os detalhes, mas não podem ser movidos.
        </p>
      )}
      {!readOnly && hoje && (
        <p className="mt-3 px-1" style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>
          {agrupamento === 'status'
            ? 'Arrastar um cartão entre colunas altera o status e ajusta o progresso.'
            : 'Arrastar um cartão entre colunas reatribui o responsável.'}
        </p>
      )}
    </div>
  );
}
