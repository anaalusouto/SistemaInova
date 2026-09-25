/**
 * Resumo compacto do projeto (RF-004, RF-005).
 *
 * Substitui a antiga aba Dashboard: o documento pede que o resumo viva no
 * cabeçalho e que a maior área da tela fique para o Plano de Trabalho num
 * desktop de ~1440 px. Por isso tudo aqui é uma faixa de números, não cartões
 * grandes.
 *
 * O que ele NÃO faz, de propósito: inventar valor. Execução sem registro
 * aparece como "Não informado" e não como R$ 0,00 — são coisas diferentes
 * (RF-002, RF-029). Projeto sem atividade mostra "Não calculado" em vez de 0%
 * (RN-018). Ação sem responsável ou prazo mostra a ausência, sem preencher
 * data fictícia (RF-005).
 */
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { type Project } from '../../data/mockData';
import { type ProjectExt } from '../../store';
import { formatDateOnly } from '../../lib/dateOnly';
import {
  andamentoDoProjeto, faixaRisco, proximoPassoDoProjeto,
  NAO_CALCULADO, NAO_INFORMADO,
} from '../../lib/planoTrabalho';

const moeda = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function Campo({ rotulo, children, destaque }: { rotulo: string; children: React.ReactNode; destaque?: boolean }) {
  return (
    <div className="min-w-0">
      <div
        style={{
          fontSize: '0.65rem', fontWeight: 600, color: 'var(--ink-5)',
          textTransform: 'uppercase', letterSpacing: '0.04em',
        }}
      >
        {rotulo}
      </div>
      <div
        className="truncate"
        style={{
          fontSize: destaque ? '0.95rem' : '0.85rem',
          fontWeight: destaque ? 700 : 500,
          fontFamily: destaque ? 'var(--font-mono)' : undefined,
          color: 'var(--ink-1)',
          marginTop: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Ausência com aparência própria: cinza e sem peso, para não se confundir com dado real. */
function Ausente() {
  return <span style={{ color: 'var(--ink-5)', fontWeight: 400, fontStyle: 'italic' }}>{NAO_INFORMADO}</span>;
}

export function ProjectSummaryHeader({ project }: { project: Project }) {
  const p = project as ProjectExt;

  const atividades = p.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));
  const andamento = andamentoDoProjeto(atividades);

  // RF-029: ausência de registro de execução não vira zero. Confere tanto o
  // total do projeto quanto os itens, porque um pode estar preenchido sem o outro.
  const temExecucao =
    p.budgetExecuted > 0 || (p.financialItems ?? []).some(i => i.executedValue > 0);

  const riscosAbertos = p.risks.filter(r => r.status !== 'Encerrado');
  const criticos = riscosAbertos.filter(r => faixaRisco(r.severity) === 'Crítico').length;

  const passo = proximoPassoDoProjeto(atividades);

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-3 px-1 py-3"
      style={{ borderTop: '1px solid var(--line-1)' }}
    >
      <Campo rotulo="Organização">
        {p.org || p.name}
        {p.segmento && (
          <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}> · {p.segmento}</span>
        )}
      </Campo>

      <Campo rotulo="Valor proposto" destaque>
        {/* RF-029: o proposto já é o aprovado — não existe cartão de "valor aprovado". */}
        {p.budgetApproved > 0 ? moeda(p.budgetApproved) : <Ausente />}
      </Campo>

      <Campo rotulo="Valor executado" destaque>
        {temExecucao ? moeda(p.budgetExecuted) : <Ausente />}
      </Campo>

      <Campo rotulo="Andamento" destaque>
        {andamento === NAO_CALCULADO ? (
          <span style={{ color: 'var(--ink-5)', fontWeight: 400, fontStyle: 'italic', fontFamily: 'inherit' }}>
            {NAO_CALCULADO}
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <span className="w-16 h-1.5 rounded-full inline-block" style={{ background: 'var(--line-1)' }}>
              <span
                className="h-full rounded-full block"
                style={{
                  width: `${andamento}%`,
                  background: andamento === 100 ? 'var(--success)' : 'var(--brand)',
                }}
              />
            </span>
            {andamento}%
          </span>
        )}
      </Campo>

      <Campo rotulo="Riscos">
        <span className="inline-flex items-center gap-1.5">
          <ShieldAlert size={13} color={criticos > 0 ? 'var(--danger)' : 'var(--ink-4)'} />
          {riscosAbertos.length} em aberto
          {criticos > 0 && (
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>· {criticos} crítico{criticos > 1 ? 's' : ''}</span>
          )}
        </span>
      </Campo>

      <div className="min-w-0 col-span-2 sm:col-span-3 lg:col-span-1">
        <div
          style={{
            fontSize: '0.65rem', fontWeight: 600, color: 'var(--ink-5)',
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}
        >
          Próximo passo
        </div>
        {passo ? (
          <div style={{ marginTop: 2 }}>
            <div className="truncate" style={{ fontSize: '0.85rem', color: 'var(--ink-1)' }} title={passo.acao}>
              {passo.acao}
            </div>
            {/* RF-005: responsável e prazo aparecem quando conhecidos; a ausência
                é dita, nunca preenchida com data inventada. */}
            <div className="truncate" style={{ fontSize: '0.72rem', color: 'var(--ink-4)' }}>
              {passo.responsavel ?? NAO_INFORMADO}
              {' · '}
              {passo.prazo ? formatDateOnly(passo.prazo) : NAO_INFORMADO}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', marginTop: 2 }}>
            <Ausente />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Aviso de inconsistência entre o término declarado na proposta e as
 * atividades previstas (RN-008).
 *
 * Só relata. O documento é explícito em não corrigir automaticamente nenhuma
 * das duas fontes — qual delas está errada é decisão de quem conduz o projeto.
 */
export function AvisoDivergenciaCronograma({
  fimDoProjeto, fimDoPlano, atividadesAlemDoPrazo,
}: { fimDoProjeto: string; fimDoPlano: string; atividadesAlemDoPrazo: number }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5"
      style={{
        borderColor: 'var(--warning-soft-border, var(--border))',
        background: 'var(--warning-soft)',
      }}
      role="status"
    >
      <AlertTriangle size={15} color="var(--warning-strong-text)" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ fontSize: '0.78rem', color: 'var(--ink-2)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--warning-strong-text)' }}>Divergência de cronograma.</strong>{' '}
        A proposta indica término em {formatDateOnly(fimDoProjeto)}, mas{' '}
        {atividadesAlemDoPrazo === 1
          ? 'há 1 atividade prevista'
          : `há ${atividadesAlemDoPrazo} atividades previstas`}{' '}
        até {formatDateOnly(fimDoPlano)}. As duas fontes foram preservadas como estão — a correção é decisão da equipe.
      </div>
    </div>
  );
}
