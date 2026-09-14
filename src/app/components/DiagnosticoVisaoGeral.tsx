import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, ChevronRight, X } from 'lucide-react';
import { listarVisaoGeralDiagnosticos, type OrganizacaoDiagnosticoResumo, type DiagnosticoStatus } from '../diagnosticos.server';
import { Chip, FilterGroup } from './portfolio/PortfolioFilters';
import { formatDateOnly } from '../lib/dateOnly';

const STATUS_LABEL: Record<DiagnosticoStatus, string> = { em_edicao: 'Em edição', concluido: 'Concluído' };
const STATUS_OPTIONS: DiagnosticoStatus[] = ['em_edicao', 'concluido'];

const fmtDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
};

interface DiagnosticoVisaoGeralProps {
  onSelectOrganizacao: (comunidadeId: string) => void;
}

export function DiagnosticoVisaoGeral({ onSelectOrganizacao }: DiagnosticoVisaoGeralProps) {
  const { data: organizacoes = [], isLoading } = useQuery({
    queryKey: ['diagnostico-visao-geral'],
    queryFn: () => listarVisaoGeralDiagnosticos(),
  });

  const [search, setSearch] = useState('');
  const [classificacaoSelected, setClassificacaoSelected] = useState<string[]>([]);
  const [statusSelected, setStatusSelected] = useState<DiagnosticoStatus[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const classificacaoOptions = useMemo(
    () => Array.from(new Set(organizacoes.map(o => o.classificacao).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [organizacoes],
  );

  const normalized = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const filtered = organizacoes.filter(o => {
    const q = normalized(search);
    const matchSearch = !q || normalized(o.nome).includes(q);
    const matchClassificacao = classificacaoSelected.length === 0 || classificacaoSelected.includes(o.classificacao);
    const matchStatus = statusSelected.length === 0 || (o.statusMaisRecente != null && statusSelected.includes(o.statusMaisRecente));
    return matchSearch && matchClassificacao && matchStatus;
  });

  const toggleClassificacao = (c: string) =>
    setClassificacaoSelected(s => (s.includes(c) ? s.filter(x => x !== c) : [...s, c]));
  const toggleStatus = (s: DiagnosticoStatus) =>
    setStatusSelected(v => (v.includes(s) ? v.filter(x => x !== s) : [...v, s]));
  const clearFilters = () => { setSearch(''); setClassificacaoSelected([]); setStatusSelected([]); };
  const activeFilterCount = classificacaoSelected.length + statusSelected.length;

  return (
    <div className="flex flex-col gap-6 p-7 overflow-y-auto h-full">
      <div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)' }}>
          Diagnóstico
        </h1>
        <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
          {organizacoes.length} organizações · {filtered.length} exibidas
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card flex-1" style={{ borderColor: 'var(--border)' }}>
            <Search size={14} color="var(--ink-5)" />
            <input
              className="flex-1 outline-none text-[13px] bg-transparent"
              placeholder="Buscar organização..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ color: 'var(--ink-1)' }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-medium"
            style={{
              borderColor: showFilters ? 'var(--primary)' : 'var(--border)',
              color: showFilters ? 'var(--primary)' : 'var(--ink-4)',
              background: showFilters ? 'var(--brand-soft)' : 'var(--surface-0)',
            }}
          >
            Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="p-3 rounded-lg border bg-card flex flex-col gap-3" style={{ borderColor: 'var(--border)' }}>
          <div className="flex flex-wrap items-start gap-5">
            <FilterGroup label="Status">
              {STATUS_OPTIONS.map(s => (
                <Chip key={s} active={statusSelected.includes(s)} onClick={() => toggleStatus(s)}>{STATUS_LABEL[s]}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Classificação">
              {classificacaoOptions.map(c => (
                <Chip key={c} active={classificacaoSelected.includes(c)} onClick={() => toggleClassificacao(c)}>{c}</Chip>
              ))}
            </FilterGroup>
            <button
              onClick={clearFilters}
              disabled={activeFilterCount === 0 && !search}
              className="flex items-center gap-1 text-[12px] px-2 py-1.5 rounded border ml-auto disabled:opacity-40"
              style={{ borderColor: 'var(--border)', color: 'var(--ink-3)' }}
            >
              <X size={11} /> Limpar filtros
            </button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface-1)' }}>
                {['Organização', 'Classificação', 'Data da aplicação', 'Última edição', 'Status', 'Histórico'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left"
                    style={{ fontSize: '0.71rem', fontWeight: 600, color: 'var(--ink-5)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
                <th className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }} />
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr
                  key={o.comunidadeId}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onClick={() => onSelectOrganizacao(o.comunidadeId)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={13} color="var(--ink-5)" />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--ink-1)' }}>{o.nome}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ink-5)' }}>{o.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{o.classificacao || '—'}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{formatDateOnly(o.dataAplicacaoMaisRecente)}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{fmtDate(o.ultimaEdicao)}</span></td>
                  <td className="px-4 py-3">
                    {o.statusMaisRecente ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          color: o.statusMaisRecente === 'concluido' ? 'var(--success)' : 'var(--brand)',
                          background: o.statusMaisRecente === 'concluido' ? 'var(--success-soft)' : 'var(--brand-soft)',
                        }}
                      >
                        {STATUS_LABEL[o.statusMaisRecente]}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>Sem diagnóstico</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><span style={{ fontSize: '0.78rem', color: 'var(--ink-2)' }}>{o.totalDiagnosticos}</span></td>
                  <td className="px-4 py-3"><ChevronRight size={14} color="var(--ink-5)" /></td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--ink-5)', fontSize: '0.8rem' }}>
                    Nenhuma organização encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
