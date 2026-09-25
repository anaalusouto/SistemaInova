/**
 * Busca e filtros do Plano de Trabalho (RF-012).
 *
 * Filtros combinam por interseção e há um comando único para limpar todos.
 * Cada filtro ativo vira uma etiqueta removível: sem isso, é fácil esquecer um
 * filtro ligado e concluir que o projeto tem menos atividades do que tem —
 * o tipo de engano que uma tela de acompanhamento não pode induzir.
 *
 * O contador sempre diz quantas atividades estão visíveis de quantas existem,
 * pelo mesmo motivo.
 */
import { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { type Goal, type Activity } from '../../data/mockData';
import {
  type CriteriosFiltro, type FiltroRisco, CRITERIOS_VAZIOS, temFiltroAtivo, responsaveisDoPlano,
} from '../../lib/planoTrabalho';

const STATUS: (Activity['status'] | 'Atrasada')[] = ['A iniciar', 'Em andamento', 'Concluído', 'Atrasada'];
const VINCULOS: Activity['budgetLink'][] = ['Sim', 'Não', 'Não informado'];
const RISCOS: { valor: FiltroRisco; rotulo: string }[] = [
  { valor: 'qualquer', rotulo: 'Qualquer' },
  { valor: 'com', rotulo: 'Com risco' },
  { valor: 'sem', rotulo: 'Sem risco' },
  { valor: 'Baixo', rotulo: 'Baixo' },
  { valor: 'Médio', rotulo: 'Médio' },
  { valor: 'Alto', rotulo: 'Alto' },
  { valor: 'Crítico', rotulo: 'Crítico' },
];

const estiloCampo: React.CSSProperties = {
  borderColor: 'var(--border)', background: 'var(--surface-1)',
  color: 'var(--ink-1)', fontSize: '0.76rem',
};

/** Caixa de seleção múltipla compacta. */
function MultiSelecao<T extends string>({
  rotulo, opcoes, selecionados, aoMudar,
}: { rotulo: string; opcoes: { valor: T; rotulo: string }[]; selecionados: T[]; aoMudar: (v: T[]) => void }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {rotulo}
      </span>
      <select
        multiple
        className="border rounded-lg px-2 py-1"
        style={{ ...estiloCampo, minHeight: 68 }}
        value={selecionados}
        onChange={e => aoMudar([...e.target.selectedOptions].map(o => o.value as T))}
      >
        {opcoes.map(o => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
    </label>
  );
}

function Etiqueta({ texto, aoRemover }: { texto: string; aoRemover: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
      style={{ background: 'var(--brand-soft)', color: 'var(--brand)', fontSize: '0.7rem', fontWeight: 500 }}
    >
      {texto}
      <button onClick={aoRemover} aria-label={`Remover filtro ${texto}`}>
        <X size={10} />
      </button>
    </span>
  );
}

export function BarraFiltros({
  metas, criterios, aoMudar, visiveis, total,
}: {
  metas: Goal[];
  criterios: CriteriosFiltro;
  aoMudar: (c: CriteriosFiltro) => void;
  visiveis: number;
  total: number;
}) {
  const [aberto, setAberto] = useState(false);
  const ativo = temFiltroAtivo(criterios);

  const etapas = metas.flatMap(m => m.deliverables.map(e => ({ valor: e.id, rotulo: e.name })));
  const responsaveis = responsaveisDoPlano(metas);

  const alterar = <K extends keyof CriteriosFiltro>(campo: K, valor: CriteriosFiltro[K]) =>
    aoMudar({ ...criterios, [campo]: valor });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} color="var(--ink-5)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="search"
            className="w-full border rounded-lg pl-7 pr-2 py-1.5"
            style={estiloCampo}
            placeholder="Buscar atividade, tarefa, etapa, responsável ou risco"
            value={criterios.busca}
            onChange={e => alterar('busca', e.target.value)}
          />
        </div>

        <button
          onClick={() => setAberto(a => !a)}
          aria-expanded={aberto}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px]"
          style={{
            borderColor: aberto || ativo ? 'var(--primary)' : 'var(--border)',
            color: aberto || ativo ? 'var(--brand)' : 'var(--ink-3)',
            background: ativo ? 'var(--brand-soft)' : 'transparent',
          }}
        >
          <SlidersHorizontal size={13} /> Filtros
        </button>

        {ativo && (
          <button
            onClick={() => aoMudar(CRITERIOS_VAZIOS)}
            className="px-2.5 py-1.5 rounded-lg border text-[12px]"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
          >
            Limpar filtros
          </button>
        )}

        <span style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }} aria-live="polite">
          {ativo ? `${visiveis} de ${total} atividades` : `${total} atividades`}
        </span>
      </div>

      {/* Etiquetas do que está ativo — filtro esquecido distorce a leitura do projeto. */}
      {ativo && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {criterios.busca.trim() && (
            <Etiqueta texto={`busca: ${criterios.busca.trim()}`} aoRemover={() => alterar('busca', '')} />
          )}
          {criterios.metaIds.map(id => (
            <Etiqueta
              key={id}
              texto={metas.find(m => m.id === id)?.name ?? 'meta'}
              aoRemover={() => alterar('metaIds', criterios.metaIds.filter(x => x !== id))}
            />
          ))}
          {criterios.etapaIds.map(id => (
            <Etiqueta
              key={id}
              texto={etapas.find(e => e.valor === id)?.rotulo ?? 'etapa'}
              aoRemover={() => alterar('etapaIds', criterios.etapaIds.filter(x => x !== id))}
            />
          ))}
          {criterios.responsaveis.map(r => (
            <Etiqueta key={r} texto={r} aoRemover={() => alterar('responsaveis', criterios.responsaveis.filter(x => x !== r))} />
          ))}
          {criterios.status.map(s => (
            <Etiqueta key={s} texto={s} aoRemover={() => alterar('status', criterios.status.filter(x => x !== s))} />
          ))}
          {criterios.risco !== 'qualquer' && (
            <Etiqueta
              texto={`risco: ${RISCOS.find(r => r.valor === criterios.risco)?.rotulo ?? criterios.risco}`}
              aoRemover={() => alterar('risco', 'qualquer')}
            />
          )}
          {criterios.vinculoOrcamentario.map(v => (
            <Etiqueta
              key={v}
              texto={`orçamento: ${v}`}
              aoRemover={() => alterar('vinculoOrcamentario', criterios.vinculoOrcamentario.filter(x => x !== v))}
            />
          ))}
        </div>
      )}

      {aberto && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl border p-3"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
        >
          <MultiSelecao
            rotulo="Meta"
            opcoes={metas.map(m => ({ valor: m.id, rotulo: m.name }))}
            selecionados={criterios.metaIds}
            aoMudar={v => alterar('metaIds', v)}
          />
          <MultiSelecao
            rotulo="Etapa"
            opcoes={etapas}
            selecionados={criterios.etapaIds}
            aoMudar={v => alterar('etapaIds', v)}
          />
          <MultiSelecao
            rotulo="Responsável"
            opcoes={responsaveis.map(r => ({ valor: r, rotulo: r }))}
            selecionados={criterios.responsaveis}
            aoMudar={v => alterar('responsaveis', v)}
          />
          <MultiSelecao
            rotulo="Status"
            opcoes={STATUS.map(s => ({ valor: s, rotulo: s }))}
            selecionados={criterios.status}
            aoMudar={v => alterar('status', v)}
          />
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Risco
              </span>
              <select
                className="border rounded-lg px-2 py-1.5"
                style={estiloCampo}
                value={criterios.risco}
                onChange={e => alterar('risco', e.target.value as FiltroRisco)}
              >
                {RISCOS.map(r => <option key={r.valor} value={r.valor}>{r.rotulo}</option>)}
              </select>
            </label>
            <MultiSelecao
              rotulo="Vínculo orçamentário"
              opcoes={VINCULOS.map(v => ({ valor: v, rotulo: v }))}
              selecionados={criterios.vinculoOrcamentario}
              aoMudar={v => alterar('vinculoOrcamentario', v)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
