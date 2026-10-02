import './organizacoes.css';

/** Pequeno rio em SVG: o peixe nada, salta e volta para a água. */
export function OrganizacaoEmConstrucao({ titulo }: { titulo: 'Mapeamento' | 'Parecer' }) {
  return (
    <section className="min-h-[320px] h-full flex flex-col items-center justify-center px-6 py-12 text-center">
      <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--ink-2)' }}>{titulo}</h2>
      <p className="text-xs mt-2" style={{ color: 'var(--ink-5)' }}>Em construção</p>
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
