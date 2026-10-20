import { ArrowLeft } from "lucide-react";

export function TituloNavegacao({ nome, aoVoltar, rotulo = "Organizações" }: {
  nome: string; aoVoltar: () => void; rotulo?: string;
}) {
  return <h1 className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-3 sm:px-7"
    style={{ background: "var(--surface-0)", color: "var(--ink-1)" }}>
    <button type="button" onClick={aoVoltar} className="flex shrink-0 items-center gap-1 text-xs font-normal text-muted-foreground hover:underline focus-visible:outline-2">
      <ArrowLeft size={14} aria-hidden />{rotulo}
    </button>
    <span className="h-6 w-px shrink-0 bg-border" aria-hidden />
    <span className="min-w-0 text-xl font-bold [overflow-wrap:anywhere]">{nome}</span>
  </h1>;
}
