import './organizacoes.css';
import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../auth/authStore';
import { useEscritaOrganizacao } from './useOrganizacoes';
import { normalizarLinkRelatorio, type AreaRelatorioOrg } from '../../lib/relatoriosOrg';

/** Pequeno rio em SVG: o peixe nada, salta e volta para a água. */
export function OrganizacaoEmConstrucao({ titulo, organizacaoId, relatorioUrl }: {
  titulo: 'Mapeamento' | 'Parecer'; organizacaoId: string; relatorioUrl?: string | null;
}) {
  const { user, readOnly } = useAuth();
  const { salvarLinkRelatorio } = useEscritaOrganizacao();
  const [editando, setEditando] = useState(false);
  const [url, setUrl] = useState(relatorioUrl ?? '');
  const [salvando, setSalvando] = useState(false);
  const area: AreaRelatorioOrg = titulo === 'Mapeamento' ? 'mapeamento' : 'parecer';
  let link: string | null = null;
  try { link = normalizarLinkRelatorio(relatorioUrl ?? ''); } catch { /* URL legada inválida não vira link clicável. */ }
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await salvarLinkRelatorio(organizacaoId, area, url);
      setEditando(false);
      toast.success('Link do relatório salvo.');
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Não foi possível salvar o link.');
    } finally { setSalvando(false); }
  };
  return (
    <section className="min-h-[320px] flex flex-col items-center justify-center px-6 py-12 text-center">
      <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-2)' }}>{titulo} (Em construção)</h2>
      <p className="text-sm mt-3 max-w-xl" style={{ color: 'var(--ink-4)' }}>Esta área está em preparação. Os documentos disponibilizados pela equipe podem ser consultados externamente.</p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 text-sm underline" style={{ color: 'var(--brand)' }}>
          <ExternalLink size={15} /> Abrir relatório de {titulo.toLowerCase()}
        </a>
      ) : <p className="text-sm mt-5" style={{ color: 'var(--ink-5)' }}>Nenhum relatório externo disponibilizado.</p>}
      {user && !readOnly && !editando && (
        <button type="button" className="mt-4 border rounded-lg px-3 py-2 text-sm" onClick={() => { setUrl(relatorioUrl ?? ''); setEditando(true); }}>
          {relatorioUrl ? 'Editar link do relatório' : 'Disponibilizar relatório externo'}
        </button>
      )}
      {user && !readOnly && editando && (
        <form onSubmit={salvar} className="mt-4 w-full max-w-lg text-left flex flex-col gap-3">
          <label className="text-sm flex flex-col gap-2">Link do relatório ou PDF
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." disabled={salvando} className="border rounded-lg px-3 py-2 bg-card" />
          </label>
          <p className="text-xs" style={{ color: 'var(--ink-5)' }}>Use o endereço externo do documento. Deixe em branco para retirar o link.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditando(false)} disabled={salvando} className="border rounded-lg px-3 py-2 text-sm">Cancelar</button>
            <button type="submit" disabled={salvando} className="border rounded-lg px-3 py-2 text-sm">{salvando ? 'Salvando…' : 'Salvar link'}</button>
          </div>
        </form>
      )}
      <svg className="org-river mt-6 w-60 max-w-full" viewBox="0 0 240 120" fill="none" aria-hidden="true" focusable="false">
        <path d="M18 64 Q35 60 52 64 T86 64 T120 64 T154 64 T188 64 T222 64" className="org-river-water" />
        <path d="M42 91 H65 M166 88 H191" className="org-river-current" />
        <ellipse cx="157" cy="64" rx="11" ry="2" className="org-river-ripple" />
        <g className="org-river-fish-path">
          <g className="org-river-fish-direction">
            <ellipse cx="0" cy="0" rx="7" ry="3.5" className="org-river-fish" />
            <path d="M-6 0 L-11 -4 L-11 4 Z" className="org-river-fish-tail" />
            <circle cx="3" cy="-1" r="0.8" fill="var(--surface-0)" />
          </g>
        </g>
      </svg>
    </section>
  );
}
