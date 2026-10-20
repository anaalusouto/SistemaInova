/**
 * Aba Descrição (RF-010).
 *
 * Organiza o conteúdo da proposta na ordem que o documento define: contexto e
 * justificativa; objetivo e estratégia; resultados esperados e impactos
 * previstos; beneficiários; acompanhamento e avaliação; replicabilidade;
 * potencial de ampliação; e informações complementares.
 *
 * A regra que mais pesa aqui é a RN-007: **nada nesta tela é resultado
 * alcançado**. Tudo é o que a proposta prevê. "15 t/ano" e "30 cooperados
 * capacitados" são metas propostas, não entregas — e a tela precisa deixar
 * isso explícito, porque quem lê pode facilmente confundir as duas coisas e
 * tomar decisão em cima de número que ainda não aconteceu.
 */
import { Info, ChevronDown } from 'lucide-react';
import { type Project } from '../../data/mockData';
import { type ProjectExt } from '../../store';
import { divergenciaDeCronograma, NAO_INFORMADO } from '../../lib/planoTrabalho';
import { AvisoDivergenciaCronograma } from './ProjectSummaryHeader';
import { formatarTextoDescricao } from '../../lib/textoDescricao';

interface Item {
  rotulo: string;
  valor: string | number | undefined | null;
}

function TextoProposta({ valor, rotulo }: { valor: string | number; rotulo: string }) {
  const { orientacao, blocos } = formatarTextoDescricao(valor, rotulo);
  return (
    <div className="project-description-text">
      {orientacao && (
        <details className="project-description-guidance">
          <summary>Orientação do formulário original</summary>
          <p>{orientacao}</p>
        </details>
      )}
      {blocos.map((bloco, indice) => {
        if (bloco.tipo === 'paragrafo') return <p key={indice}>{bloco.texto}</p>;
        const Lista = bloco.ordenada ? 'ol' : 'ul';
        return <Lista key={indice}>{bloco.itens.map((item, i) => (
          <li key={i} value={item.numero}>{item.texto}</li>
        ))}</Lista>;
      })}
      {blocos.length === 0 && <p className="project-description-empty">{NAO_INFORMADO}</p>}
    </div>
  );
}

/** Um bloco de texto da proposta. Campo vazio aparece como ausência declarada (RF-002). */
function Secao({ titulo, itens }: { titulo: string; itens: Item[] }) {
  const preenchidos = itens.filter(item => item.valor !== null && item.valor !== undefined && String(item.valor).trim() !== '');
  const ausentes = itens.filter(item => !preenchidos.includes(item));
  // Seção inteira vazia continua visível: sumir com ela esconderia do leitor
  // que a proposta não trouxe aquela informação.
  return (
    <details open className="project-disclosure project-description-section min-w-0 bg-card rounded-xl border" style={{ borderColor: 'var(--border)' }}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 sm:p-5">
        <h3>{titulo}</h3><ChevronDown size={16} className="shrink-0" aria-hidden />
      </summary>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        {preenchidos.length > 0 && <div className="project-description-fields">
          {preenchidos.map(item => (
            <section className="project-description-field" key={item.rotulo} aria-label={item.rotulo}>
              <h4>{item.rotulo}</h4>
              <TextoProposta valor={item.valor!} rotulo={item.rotulo} />
            </section>
          ))}
        </div>}
        {ausentes.length > 0 && <dl className="project-description-missing" aria-label="Campos não informados">
          {ausentes.map(item => <div key={item.rotulo}>
            <dt>{item.rotulo}</dt><dd>{NAO_INFORMADO}</dd>
          </div>)}
        </dl>}
      </div>
    </details>
  );
}

export function TabDescricao({ project }: { project: Project }) {
  const p = project as ProjectExt;
  const plano = p.plano ?? {};

  const atividades = p.goals.flatMap(g => g.deliverables.flatMap(d => d.activities));
  const divergencia = divergenciaDeCronograma(p.endDate, atividades);

  const beneficiarios = (n: number | undefined, tipo: string) =>
    n === undefined || n === null ? undefined : `${n.toLocaleString('pt-BR')} ${tipo}`;

  return (
    <div className="min-w-0 p-4 sm:p-6">
      <div className="flex min-w-0 flex-col gap-4">
        {/* RN-007: o aviso vem antes do conteúdo, não depois. Quem lê precisa
            saber o que está lendo ANTES de ler os números. */}
        <div
          className="flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
          role="note"
        >
          <Info size={15} color="var(--ink-4)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Esta aba reproduz <strong style={{ color: 'var(--ink-2)' }}>a proposta aprovada</strong>. Os números e
            resultados descritos aqui são <strong style={{ color: 'var(--ink-2)' }}>previstos</strong>, não
            entregas realizadas. O que foi efetivamente executado aparece no Plano de Trabalho e no Orçamento.
          </div>
        </div>

        {divergencia && <AvisoDivergenciaCronograma {...divergencia} />}

        <Secao
          titulo="Contexto e justificativa"
          itens={[
            { rotulo: 'Problemática', valor: plano.problematica },
            { rotulo: 'Justificativa', valor: plano.justificativa },
            { rotulo: 'Localização e abrangência', valor: plano.localizacaoAbrangencia },
            { rotulo: 'Diversidade', valor: plano.diversidade },
            { rotulo: 'Saberes locais', valor: plano.saberesLocais },
          ]}
        />

        <Secao
          titulo="Objetivo e estratégia"
          itens={[
            { rotulo: 'Objetivo', valor: p.objective },
            { rotulo: 'Estratégia', valor: plano.estrategia },
            { rotulo: 'Pilares', valor: plano.pilares },
          ]}
        />

        <Secao
          titulo="Resultados esperados e impactos previstos"
          itens={[
            { rotulo: 'Resultados e impactos previstos', valor: plano.resultadosImpactos },
            { rotulo: 'Metas declaradas na proposta', valor: plano.metasTexto },
          ]}
        />

        <Secao
          titulo="Beneficiários"
          itens={[
            { rotulo: 'Público-alvo', valor: plano.publicoAlvo },
            { rotulo: 'Beneficiários diretos', valor: beneficiarios(plano.beneficiadosDiretos, 'pessoas') },
            { rotulo: 'Beneficiários indiretos', valor: beneficiarios(plano.beneficiadosIndiretos, 'pessoas') },
          ]}
        />

        <Secao
          titulo="Acompanhamento e avaliação"
          itens={[{ rotulo: 'Forma de acompanhamento', valor: plano.formaAcompanhamento }]}
        />

        <Secao
          titulo="Replicabilidade e potencial de ampliação"
          itens={[
            { rotulo: 'Potencial de replicabilidade', valor: plano.potencialReplicabilidade },
            { rotulo: 'Potencial de ampliação', valor: plano.potencialAmpliacao },
          ]}
        />

        <Secao
          titulo="Informações complementares"
          itens={[
            { rotulo: 'Coordenação', valor: p.coordinator },
            { rotulo: 'Equipe', valor: p.team?.length ? p.team.join(', ') : undefined },
            { rotulo: 'Financiador', valor: p.financier },
            { rotulo: 'Experiência prévia', valor: plano.experienciaPrevia },
            { rotulo: 'Capacidade técnica institucional', valor: plano.capacidadeTecnica },
            { rotulo: 'Observações', valor: plano.observacoes },
          ]}
        />
      </div>
    </div>
  );
}
