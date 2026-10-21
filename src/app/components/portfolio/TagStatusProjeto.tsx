import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import type { ProjectStatus } from '../../data/mockData';
import { STATUS_OPTIONS } from '../../lib/portfolioFilters';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';

const cores: Record<ProjectStatus, { color: string; background: string }> = {
  'Não iniciado': { color: 'var(--ink-3)', background: 'var(--surface-2)' },
  'Em andamento': { color: 'var(--brand-text)', background: 'var(--brand-soft)' },
  'Atrasado': { color: 'var(--alert)', background: 'var(--alert-soft)' },
  'Concluído': { color: 'var(--success)', background: 'var(--success-soft)' },
  'Suspenso': { color: 'var(--warning-strong-text)', background: 'var(--warning-soft)' },
};
const classeTag = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap';

export function TagStatusProjeto({ status, nomeProjeto, aoAlterar }: {
  status: ProjectStatus;
  nomeProjeto: string;
  aoAlterar?: (status: ProjectStatus) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const emGravacao = useRef(false);

  const salvar = async (novoStatus: ProjectStatus) => {
    if (!aoAlterar || emGravacao.current) return;
    if (novoStatus === status) { setAberto(false); return; }
    emGravacao.current = true;
    setSalvando(true);
    try {
      await aoAlterar(novoStatus);
      setAberto(false);
      toast.success(`${nomeProjeto}: ${novoStatus}.`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Não foi possível salvar o status do projeto.');
    } finally {
      emGravacao.current = false;
      setSalvando(false);
    }
  };

  if (!aoAlterar) return <span className={classeTag} style={cores[status]}>{status}</span>;

  return <Popover open={aberto} onOpenChange={setAberto}>
    <PopoverTrigger asChild>
      <button type="button" className={`${classeTag} border border-transparent focus-visible:outline-2 focus-visible:outline-offset-2`}
        style={cores[status]} aria-label={`Alterar status de ${nomeProjeto}: ${status}`} disabled={salvando}>
        {salvando ? 'Salvando…' : status}<ChevronDown size={12} aria-hidden />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-72 p-3" aria-label={`Status de ${nomeProjeto}`}>
      <p className="text-sm font-medium">Status do projeto</p>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">Selecione a situação atual de {nomeProjeto}. A Visão Geral usa esta classificação.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Selecionar status do projeto" aria-busy={salvando}>
        {STATUS_OPTIONS.map(opcao => <button key={opcao} type="button" disabled={salvando}
          aria-pressed={opcao === status} onClick={() => void salvar(opcao)}
          className={`${classeTag} border-2 focus-visible:outline-2 focus-visible:outline-offset-2`}
          style={{ ...cores[opcao], borderColor: opcao === status ? 'currentColor' : 'transparent' }}>
          {opcao}
        </button>)}
      </div>
    </PopoverContent>
  </Popover>;
}
