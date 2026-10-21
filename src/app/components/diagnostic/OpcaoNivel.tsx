import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { CORES_ESCALA } from '../../theme/coresInstitucionais';

export function OpcaoNivel({ nivel, descricao, selecionado, aoSelecionar }: {
  nivel: keyof typeof CORES_ESCALA; descricao: string; selecionado: boolean; aoSelecionar: () => void;
}) {
  const cores = CORES_ESCALA[nivel];
  return <button type="button" aria-pressed={selecionado} onClick={aoSelecionar}
    className="escala-nivel overflow-hidden rounded-lg border text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    style={{ borderColor: selecionado ? cores.base : 'var(--border)',
      outline: selecionado ? `2px solid ${cores.base}` : undefined,
      '--nivel-base': cores.base, '--nivel-texto': cores.destaque, '--nivel-fundo': cores.fundo,
    } as CSSProperties}>
    <span className="escala-nivel-conteudo flex flex-col gap-1 px-3 py-3">
      <strong className="escala-nivel-titulo flex items-center gap-2 text-sm">Nível {nivel}{selecionado && <Check aria-hidden size={15} />}</strong>
      <span className="text-xs leading-relaxed">{descricao}</span>
    </span>
  </button>;
}
