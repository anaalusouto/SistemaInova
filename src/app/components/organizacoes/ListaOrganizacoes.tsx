/**
 * Lista de Organizações (RC-01).
 *
 * Tabela simples, ordenável clicando no cabeçalho; o clique na linha abre a
 * ficha. O nome entra como primeira coluna além de categoria e tipo — sem ele
 * a tabela não serve para encontrar ninguém.
 *
 * Busca e Filtros (RF01.3) seguem o padrão da lista de Projetos: painel
 * embutido que abre abaixo da busca. Os filtros moram no OrganizacoesModule
 * para sobreviver a abrir e fechar uma ficha.
 */
import { useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronUp, ChevronsUpDown, Filter, Loader2, Search } from 'lucide-react';
import { useListaOrganizacoes } from './useOrganizacoes';
import { Chip, FilterGroup } from '../portfolio/PortfolioFilters';
import {
  CATEGORIAS_ORGANIZACAO, FILTRO_NAO_INFORMADO, FILTROS_VAZIOS, NAO_INFORMADO, TIPOS_ORGANIZACAO,
  contagemOrganizacoes, filtrarOrganizacoes,
  type FiltrosOrganizacao, type OrganizacaoResumo,
} from '../../lib/organizacoes';

type Coluna = 'nome' | 'categoria' | 'tipo';
const COLUNAS: { id: Coluna; rotulo: string }[] = [
  { id: 'nome', rotulo: 'Organização' },
  { id: 'categoria', rotulo: 'Categoria' },
  { id: 'tipo', rotulo: 'Tipo' },
];

/** "Não informado" vai sempre para o fim, nas duas direções: não é um valor
 *  que se compare com os outros, é a falta dele. */
function ordenar(lista: OrganizacaoResumo[], coluna: Coluna, asc: boolean): OrganizacaoResumo[] {
  return [...lista].sort((a, b) => {
    const va = a[coluna];
    const vb = b[coluna];
    if (!va && !vb) return a.nome.localeCompare(b.nome, 'pt-BR');
    if (!va) return 1;
    if (!vb) return -1;
    const c = va.localeCompare(vb, 'pt-BR', { sensitivity: 'base' });
    if (c !== 0) return asc ? c : -c;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

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
  /** Dentro de outra página (abaixo da Visão Geral): sem rolagem própria. */
  embutido?: boolean;
  filtros: FiltrosOrganizacao;
  aoMudarFiltros: (f: FiltrosOrganizacao) => void;
}

export function ListaOrganizacoes({ aoAbrir, filtros, aoMudarFiltros, embutido = false }: ListaOrganizacoesProps) {
  const { data: organizacoes = [], isLoading, error } = useListaOrganizacoes();
  const [coluna, setColuna] = useState<Coluna>('nome');
  const [asc, setAsc] = useState(true);
  const ativos = filtros.categorias.length + filtros.tipos.length + filtros.ufs.length + filtros.situacoes.length;
  const [painelAberto, setPainelAberto] = useState(ativos > 0);

  const filtradas = useMemo(() => filtrarOrganizacoes(organizacoes, filtros), [organizacoes, filtros]);
  const linhas = useMemo(() => ordenar(filtradas, coluna, asc), [filtradas, coluna, asc]);

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

  const alternar = (c: Coluna) => {
    if (c === coluna) setAsc(!asc);
    else { setColuna(c); setAsc(true); }
  };

  return (
    <div className={embutido ? 'flex flex-col gap-5 p-4 sm:p-7' : 'flex flex-col gap-5 p-4 sm:p-7 overflow-y-auto h-full'}>
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
            placeholder="Buscar projeto, comunidade, coordenador..."
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

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 520 }}>
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {COLUNAS.map(c => {
                  const ativa = c.id === coluna;
                  const Icone = !ativa ? ChevronsUpDown : asc ? ChevronUp : ChevronDown;
                  return (
                    <th
                      key={c.id}
                      aria-sort={ativa ? (asc ? 'ascending' : 'descending') : 'none'}
                      className="text-left"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <button
                        type="button"
                        onClick={() => alternar(c.id)}
                        className="w-full flex items-center gap-1 px-4 py-2.5 hover:bg-accent"
                        style={{
                          fontSize: '0.71rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                          color: ativa ? 'var(--ink-2)' : 'var(--ink-5)',
                        }}
                      >
                        {c.rotulo}
                        <Icone size={12} style={{ opacity: ativa ? 1 : 0.5 }} />
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center">
                    <Loader2 size={20} className="animate-spin mx-auto" color="var(--ink-5)" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center" style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>
                    Não foi possível carregar as organizações. {(error as Error).message}
                  </td>
                </tr>
              ) : linhas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.82rem' }}>
                    {filtrando ? 'Nenhuma organização encontrada com essa busca ou esses filtros.' : 'Nenhuma organização cadastrada.'}
                  </td>
                </tr>
              ) : linhas.map(o => (
                <tr
                  key={o.id}
                  onClick={() => aoAbrir(o.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); aoAbrir(o.id); } }}
                  tabIndex={0}
                  role="link"
                  aria-label={`Abrir ficha de ${o.nome}`}
                  className="cursor-pointer hover:bg-accent focus:outline-none focus-visible:bg-accent"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="px-4 py-3">
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--ink-1)' }}>{o.nome}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginTop: 2 }}>
                      {o.municipio
                        ? `${o.municipio}${o.uf ? `/${o.uf}` : ''}`
                        : <span style={{ fontStyle: 'italic' }}>Município não informado</span>}
                      {o.pendentes > 0 && ` · ${o.pendentes} ${o.pendentes === 1 ? 'encaminhamento pendente' : 'encaminhamentos pendentes'}`}
                    </div>
                  </td>
                  <Celula valor={o.categoria} />
                  <Celula valor={o.tipo} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Celula({ valor }: { valor: string | null }) {
  return (
    <td className="px-4 py-3">
      <span style={{ fontSize: '0.8rem', color: valor ? 'var(--ink-2)' : 'var(--ink-5)', fontStyle: valor ? undefined : 'italic' }}>
        {valor ?? NAO_INFORMADO}
      </span>
    </td>
  );
}
