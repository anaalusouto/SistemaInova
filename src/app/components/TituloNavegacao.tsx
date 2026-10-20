import { ArrowLeft } from "lucide-react";

export function TituloNavegacao({ nome, aoVoltar, rotulo = "Organizações" }: {
  nome: string; aoVoltar: () => void; rotulo?: string;
}) {
  return <h1 className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 border-b px-4 py-3 text-xl font-bold uppercase sm:px-7"
    style={{ background: "var(--surface-0)", color: "var(--ink-1)" }}>
    <button type="button" onClick={aoVoltar} className="shrink-0 uppercase hover:underline focus-visible:outline-2">{rotulo}</button>
    <ArrowLeft size={19} className="shrink-0 self-center" aria-hidden />
    <span className="min-w-0 [overflow-wrap:anywhere]">{nome}</span>
  </h1>;
}
