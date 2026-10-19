/** Logos oficiais: arquivos originais preservados em LOGOS/. */
export function MarcaCria({
  compacta = false,
  adaptavel = false,
  className = "",
}: {
  compacta?: boolean;
  /** No menu móvel a marca continua completa, mesmo com o desktop recolhido. */
  adaptavel?: boolean;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="CRIA"
      className={`cria-brand ${compacta ? (adaptavel ? "cria-brand--compact-desktop" : "cria-brand--compact") : ""} ${className}`}
    >
      <img
        src="/logos/cria.png"
        alt=""
        aria-hidden
        className="cria-brand-full"
        width="640"
        height="420"
      />
      <img
        src="/logos/ca.png"
        alt=""
        aria-hidden
        className="cria-brand-short"
        width="400"
        height="400"
      />
    </span>
  );
}
