/**
 * Lista de Organizações (RC-01).
 *
 * Tabela simples, ordenável clicando no cabeçalho; o clique na linha abre a
 * ficha. O nome entra como primeira coluna além de categoria e tipo — sem ele
 * a tabela não serve para encontrar ninguém.
 */
import { useMemo, useState } from 'react';
import { Building2, ChevronDown, ChevronUp, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useListaOrganizacoes } from './useOrganizacoes';
import { NAO_INFORMADO, type OrganizacaoResumo } from '../../lib/organizacoes';

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

export function ListaOrganizacoes({ aoAbrir }: { aoAbrir: (id: string) => void }) {
  const { data: organizacoes = [], isLoading, error } = useListaOrganizacoes();
  const [coluna, setColuna] = useState<Coluna>('nome');
  const [asc, setAsc] = useState(true);

  const linhas = useMemo(() => ordenar(organizacoes, coluna, asc), [organizacoes, coluna, asc]);

  const alternar = (c: Coluna) => {
    if (c === coluna) setAsc(!asc);
    else { setColuna(c); setAsc(true); }
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-7 overflow-y-auto h-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-soft)' }}>
          <Building2 size={18} color="var(--brand)" />
        </div>
        <div className="min-w-0">
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--ink-1)' }}>
            Organizações
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.8rem', marginTop: 2 }}>
            {isLoading ? 'Carregando…' : `${organizacoes.length} organizações`}
          </p>
        </div>
      </div>

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
                    Nenhuma organização cadastrada.
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
                    {(o.municipio || o.pendentes > 0) && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginTop: 2 }}>
                        {[o.municipio && `${o.municipio}${o.uf ? `/${o.uf}` : ''}`,
                          o.pendentes > 0 && `${o.pendentes} ${o.pendentes === 1 ? 'encaminhamento pendente' : 'encaminhamentos pendentes'}`]
                          .filter(Boolean).join(' · ')}
                      </div>
                    )}
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
