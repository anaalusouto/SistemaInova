/**
 * Lista de Organizações (RC-01).
 *
 * Lista com colunas Organização, Categoria e Tipo e ordenação alternável.
 * Busca e Filtros (RF01.3) seguem o padrão da lista de Projetos: painel
 * embutido que abre abaixo da busca. Os filtros moram no OrganizacoesModule
 * para sobreviver a abrir e fechar uma ficha.
 */
import { useMemo, useState } from 'react';
import { Building2, Filter, Loader2, Search } from 'lucide-react';
import { useListaOrganizacoes } from './useOrganizacoes';
import { Chip, FilterGroup } from '../portfolio/PortfolioFilters';
import {
  CATEGORIAS_ORGANIZACAO, FILTRO_NAO_INFORMADO, FILTROS_VAZIOS, NAO_INFORMADO, TIPOS_ORGANIZACAO,
  contagemOrganizacoes, filtrarOrganizacoes, ordenarOrganizacoes,
  type FiltrosOrganizacao, type ColunaOrganizacao,
} from '../../lib/organizacoes';
import { nomeCurtoOrg } from '../../lib/navegacaoOrg';
import './organizacoes.css';

/** Opções de um filtro: a lista fixa (ou o que aparece nos dados) e, se alguma
 *  organização estiver sem o campo, "Não informado" no fim. */
function opcoes(fixas: readonly string[] | null, valores: (string | null)[]): string[] {
  const presentes = valores.filter((v): v is string => !!v);
  const base = fixas ? [...fixas] : [...new Set(presentes)].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return valores.some(v => !v) ? [...base, FILTRO_NAO_INFORMADO] : base;
}

type GrupoFiltro = 'categorias' | 'tipos' | 'ufs' | 'situacoes';

interface ListaOrganizacoesProps {
  aoAbrir: (id: string) => void;
  /** Dentro de outra página: sem rolagem própria. */
  embutido?: boolean;
  filtros: FiltrosOrganizacao;
  aoMudarFiltros: (f: FiltrosOrganizacao) => void;
}

export function ListaOrganizacoes({ aoAbrir, filtros, aoMudarFiltros, embutido = false }: ListaOrganizacoesProps) {
  const { data: organizacoes = [], isLoading, error } = useListaOrganizacoes();


  const ativos = filtros.categorias.length + filtros.tipos.length + filtros.ufs.length + filtros.situacoes.length;
  const [painelAberto, setPainelAberto] = useState(ativos > 0);
  const [ordenacao, setOrdenacao] = useState<{ coluna: ColunaOrganizacao; direcao: 'asc' | 'desc' }>({ coluna: 'nome', direcao: 'asc' });
  const ordenar = (coluna: ColunaOrganizacao) => setOrdenacao(atual => ({
    coluna, direcao: atual.coluna === coluna && atual.direcao === 'asc' ? 'desc' : 'asc',
  }));

  const filtradas = useMemo(() => filtrarOrganizacoes(organizacoes, filtros), [organizacoes, filtros]);
  const linhas = useMemo(() => ordenarOrganizacoes(filtradas, ordenacao.coluna, ordenacao.direcao), [filtradas, ordenacao]);

  const grupos: { id: GrupoFiltro; rotulo: string; opcoes: string[] }[] = useMemo(() => [
    { id: 'categorias', rotulo: 'Categoria', opcoes: opcoes(CATEGORIAS_ORGANIZACAO, organizacoes.map(o => o.categoria)) },
    { id: 'tipos', rotulo: 'Tipo', opcoes: opcoes(TIPOS_ORGANIZACAO, organizacoes.map(o => o.tipo)) },
    { id: 'ufs', rotulo: 'UF', opcoes: opcoes(null, organizacoes.map(o => o.uf)) },
    { id: 'situacoes', rotulo: 'Situação', opcoes: opcoes(null, organizacoes.map(o => o.status)) },
  ], [organizacoes]);

  const alternarFiltro = (g: GrupoFiltro, v: string) => {
    const atual = filtros[g];
    aoMudarFiltros({ ...filtros, [g]: atual.includes(v) ? atual.filter(x => x !== v) : [...atual, v] });
  };

  const filtrando = filtros.busca.trim() !== '' || ativos > 0;

  return (
    <div className={embutido ? 'flex flex-col gap-5 p-4 sm:p-7' : 'flex flex-col gap-5 p-4 sm:p-7 overflow-y-auto h-full min-h-0 [&>*]:shrink-0'}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
          <Building2 size={18} color="var(--brand)" />
        </div>
        <div className="min-w-0">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--ink-1)' }}>
            Organizações
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.8rem', marginTop: 2 }}>
            {isLoading
              ? 'Carregando…'
              : filtrando
                ? `${contagemOrganizacoes(organizacoes.length)} · ${filtradas.length} ${filtradas.length === 1 ? 'exibida' : 'exibidas'}`
                : contagemOrganizacoes(organizacoes.length)}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:max-w-xl">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card flex-1 min-w-0" style={{ borderColor: 'var(--border)' }}>
          <Search size={14} color="var(--ink-5)" className="flex-shrink-0" />
          <input
            type="search"
            aria-label="Buscar organização"
            className="flex-1 min-w-0 outline-none text-[13px] bg-transparent"
            placeholder="Buscar organização, projeto ou coordenador..."
            value={filtros.busca}
            onChange={e => aoMudarFiltros({ ...filtros, busca: e.target.value })}
            style={{ color: 'var(--ink-1)' }}
          />
        </div>
        <button
          type="button"
          onClick={() => setPainelAberto(!painelAberto)}
          aria-expanded={painelAberto}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-medium flex-shrink-0"
          style={{
            borderColor: painelAberto ? 'var(--primary)' : 'var(--border)',
            color: painelAberto ? 'var(--primary)' : 'var(--ink-4)',
            background: painelAberto ? 'var(--brand-soft)' : 'var(--surface-0)',
          }}
        >
          <Filter size={12} /> Filtros{ativos > 0 ? ` (${ativos})` : ''}
        </button>
      </div>

      {painelAberto && (
        <div className="p-3 rounded-lg border bg-card flex flex-wrap items-start gap-5" style={{ borderColor: 'var(--border)' }}>
          {grupos.map(g => (
            <FilterGroup key={g.id} label={g.rotulo}>
              {g.opcoes.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>—</span>}
              {g.opcoes.map(v => (
                <Chip key={v} active={filtros[g.id].includes(v)} onClick={() => alternarFiltro(g.id, v)}>{v}</Chip>
              ))}
            </FilterGroup>
          ))}
          <button
            type="button"
            onClick={() => aoMudarFiltros(FILTROS_VAZIOS)}
            disabled={!filtrando}
            className="text-[12px] px-2 py-1.5 rounded border sm:ml-auto flex-shrink-0 disabled:opacity-40"
            style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
          >
            Limpar filtros
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center" role="status" aria-label="Carregando organizações">
          <Loader2 size={20} className="animate-spin mx-auto" color="var(--ink-5)" />
        </div>
      ) : error ? (
        <p className="py-12 text-center text-sm" role="alert" style={{ color: 'var(--danger)' }}>
          Não foi possível carregar as organizações. {(error as Error).message}
        </p>
      ) : linhas.length === 0 ? (
        <p className="py-12 text-center text-sm" style={{ color: 'var(--ink-5)' }}>
          {filtrando ? 'Nenhuma organização encontrada com essa busca ou esses filtros.' : 'Nenhuma organização cadastrada.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-left text-sm" aria-label="Organizações">
            <thead>
              <tr>
                {([{ coluna: 'nome', rotulo: 'Organização' }, { coluna: 'categoria', rotulo: 'Categoria' }, { coluna: 'tipo', rotulo: 'Tipo' }] as const).map(({ coluna, rotulo }) => (
                  <th key={coluna} scope="col" className="px-4 py-3" aria-sort={ordenacao.coluna === coluna ? (ordenacao.direcao === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => ordenar(coluna)} className="inline-flex items-center gap-2" aria-label={`Ordenar por ${rotulo}`}>
                      {rotulo} {ordenacao.coluna === coluna ? (ordenacao.direcao === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(o => (
                <tr key={o.id} onClick={() => aoAbrir(o.id)} className="cursor-pointer border-t hover:bg-accent" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3">
                    <button type="button" onClick={e => { e.stopPropagation(); aoAbrir(o.id); }} className="text-left hover:underline focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Abrir organização ${nomeCurtoOrg(o.nome)}, código ${o.codigo}`}>
                      <span className="block font-semibold">{nomeCurtoOrg(o.nome)}</span>
                      <span className="block text-xs" style={{ color: 'var(--ink-4)' }}>{o.codigo}</span>
                    </button>
                    {o.projetos.length > 1 && <span className="block text-xs" style={{ color: 'var(--danger)' }}>Conflito de projetos: {o.projetos.map(p => p.id).join(', ')}</span>}
                  </td>
                  <td className="px-4 py-3">{o.categoria ?? NAO_INFORMADO}</td>
                  <td className="px-4 py-3">{o.tipo ?? NAO_INFORMADO}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
