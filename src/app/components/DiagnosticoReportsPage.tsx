import { useMemo, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Download, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { listarDiagnosticosConcluidosParaRelatorio, getDadosCompletosDiagnostico } from '../diagnosticos.server';
import { buildDiagnosticoReportModel, exportDiagnosticoReportPdf, type ReportComponente } from '../lib/diagnosticReportExport';
import { Chip, FilterGroup } from './portfolio/PortfolioFilters';

interface ComponenteOption { id: ReportComponente; label: string; }
const COMPONENTES: ComponenteOption[] = [
  { id: 'identificacao', label: 'Identificação da organização e da aplicação' },
  { id: 'matriz', label: 'Matriz Funcional' },
  { id: 'ieo', label: 'Índice de Estruturação Organizacional (IEO)' },
  { id: 'cesta', label: 'Cesta de Produtos' },
  { id: 'parecer', label: 'Parecer Técnico' },
];

const fmtDate = (v: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
};

export function DiagnosticoReportsPage() {
  const { data: disponiveis = [] } = useQuery({
    queryKey: ['diagnosticos-concluidos-relatorio'],
    queryFn: () => listarDiagnosticosConcluidosParaRelatorio(),
  });

  const [classificacaoFiltro, setClassificacaoFiltro] = useState<string[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [componentes, setComponentes] = useState<ReportComponente[]>(COMPONENTES.map(c => c.id));
  const [titleInput, setTitleInput] = useState('');

  const classificacaoOptions = useMemo(
    () => Array.from(new Set(disponiveis.map(d => d.classificacao).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [disponiveis],
  );

  const filtrados = disponiveis.filter(d => classificacaoFiltro.length === 0 || classificacaoFiltro.includes(d.classificacao));

  const toggleSelecionado = (id: string) =>
    setSelecionados(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  const toggleComponente = (id: ReportComponente) =>
    setComponentes(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]));

  const title = titleInput.trim() || (selecionados.length > 1 ? 'Relatório Consolidado de Diagnósticos' : 'Relatório de Diagnóstico');

  const dadosQueries = useQueries({
    queries: selecionados.map(id => ({
      queryKey: ['diagnostico-completo-relatorio', id],
      queryFn: () => getDadosCompletosDiagnostico({ data: { diagnosticoId: id } }),
    })),
  });
  const dadosCompletos = dadosQueries.map(q => q.data).filter((d): d is NonNullable<typeof d> => !!d);
  const carregando = selecionados.length > 0 && dadosCompletos.length < selecionados.length;

  const model = useMemo(() => buildDiagnosticoReportModel(title, dadosCompletos, componentes), [title, dadosCompletos, componentes]);

  const handlePrint = () => {
    toast.success('Abrindo diálogo de impressão…');
    setTimeout(() => window.print(), 200);
  };

  const handleExportPdf = () => {
    if (selecionados.length === 0) { toast.error('Selecione ao menos um diagnóstico concluído.'); return; }
    if (carregando) { toast.error('Aguarde o carregamento dos dados dos diagnósticos selecionados.'); return; }
    exportDiagnosticoReportPdf(model);
    toast.success('PDF gerado.');
  };

  return (
    <div className="flex flex-col gap-6 p-7 overflow-y-auto h-full">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.375rem', color: 'var(--ink-1)' }}>
            Relatórios de Diagnóstico
          </h1>
          <p style={{ color: 'var(--ink-4)', fontSize: '0.825rem', marginTop: 2 }}>
            Componha um relatório a partir de diagnósticos concluídos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium border" style={{ borderColor: 'var(--border)', color: 'var(--ink-3)', background: 'var(--surface-0)' }}>
            <Printer size={13} /> Imprimir
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-white" style={{ background: 'var(--primary)' }}>
            <Download size={13} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Builder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)', marginBottom: 12 }}>Título</h3>
          <input
            className="ci"
            value={titleInput}
            onChange={e => setTitleInput(e.target.value)}
            placeholder={title}
          />
        </div>

        <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)', marginBottom: 12 }}>
            Diagnósticos concluídos ({selecionados.length}/{disponiveis.length})
          </h3>
          {classificacaoOptions.length > 0 && (
            <div className="mb-3">
              <FilterGroup label="Classificação">
                {classificacaoOptions.map(c => (
                  <Chip key={c} active={classificacaoFiltro.includes(c)} onClick={() => setClassificacaoFiltro(f => f.includes(c) ? f.filter(x => x !== c) : [...f, c])}>{c}</Chip>
                ))}
              </FilterGroup>
            </div>
          )}
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
            {filtrados.map(d => (
              <label key={d.diagnosticoId} className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.8rem', color: 'var(--ink-1)' }}>
                <input type="checkbox" checked={selecionados.includes(d.diagnosticoId)} onChange={() => toggleSelecionado(d.diagnosticoId)} />
                <span>{d.comunidadeNome}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--ink-5)', marginLeft: 'auto' }}>{fmtDate(d.dataAplicacao)}</span>
              </label>
            ))}
            {filtrados.length === 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--ink-5)' }}>Nenhum diagnóstico concluído encontrado.</p>
            )}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink-1)', marginBottom: 12 }}>Conteúdo do relatório</h3>
          <div className="flex flex-col gap-2">
            {COMPONENTES.map(c => (
              <label key={c.id} className="flex items-start gap-2 cursor-pointer" style={{ fontSize: '0.78rem', color: 'var(--ink-1)' }}>
                <input type="checkbox" checked={componentes.includes(c.id)} onChange={() => toggleComponente(c.id)} style={{ marginTop: 3 }} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-card rounded-xl border p-8 flex flex-col gap-6" id="report-preview" style={{ borderColor: 'var(--border)' }}>
        <header className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <FileText size={22} color="var(--brand)" />
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.15rem', color: 'var(--ink-1)' }}>{title}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--ink-5)' }}>
              Gerado em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())} · {selecionados.length} diagnóstico(s)
            </p>
          </div>
        </header>

        {carregando && <p style={{ fontSize: '0.82rem', color: 'var(--ink-5)' }}>Carregando dados dos diagnósticos selecionados…</p>}

        {!carregando && model.entries.map((entry, i) => (
          <section key={i} className="rounded-lg border p-5 flex flex-col gap-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
            <div className="flex items-baseline justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink-1)' }}>{entry.organizacao}</h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--ink-5)' }}>{entry.code} · {entry.classificacao}</p>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                Aplicação {entry.dataAplicacao} · v{entry.versao}
              </span>
            </div>

            {entry.matriz && (
              <div>
                <b style={{ fontSize: '0.82rem', color: 'var(--ink-1)' }}>Matriz Funcional</b>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-5)', marginTop: 2 }}>{entry.matriz.length} função(ões) avaliada(s)</p>
              </div>
            )}

            {entry.ieo && (
              <div>
                <b style={{ fontSize: '0.82rem', color: 'var(--ink-1)' }}>IEO</b>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-2)', marginTop: 2 }}>
                  Geral: {entry.ieo.geral?.toFixed(1) ?? '—'} · {entry.ieo.porDimensao.map(d => `${d.dimensao}: ${d.media?.toFixed(1) ?? '—'}`).join(' · ')}
                </p>
              </div>
            )}

            {entry.produtos && (
              <div>
                <b style={{ fontSize: '0.82rem', color: 'var(--ink-1)' }}>Cesta de Produtos</b>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-5)', marginTop: 2 }}>
                  {entry.produtos.length === 0 ? 'Nenhum produto cadastrado.' : entry.produtos.map(p => p.nome).join(', ')}
                </p>
              </div>
            )}

            {entry.parecer && (
              <div>
                <b style={{ fontSize: '0.82rem', color: 'var(--ink-1)' }}>Parecer Técnico</b>
                <p style={{ fontSize: '0.78rem', color: 'var(--ink-2)', marginTop: 2 }}>
                  <b>Síntese:</b> {entry.parecer.sintese}
                </p>
              </div>
            )}
          </section>
        ))}

        {!carregando && selecionados.length === 0 && (
          <div className="py-10 text-center" style={{ fontSize: '0.85rem', color: 'var(--ink-5)' }}>
            Selecione ao menos um diagnóstico concluído para compor o relatório.
          </div>
        )}
      </div>

      <style>{`.ci{border:1px solid var(--border);border-radius:8px;padding:8px 12px;font-size:13px;outline:none;width:100%;background:var(--surface-1);color:var(--ink-1)}
      .ci:focus{border-color:var(--primary);background:var(--surface-0)}
      @media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>
    </div>
  );
}
