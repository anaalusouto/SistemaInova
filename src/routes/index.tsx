import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import App from "@/app/App";
import { validarBuscaApp } from '@/app/lib/navegacaoApp';

export const Route = createFileRoute("/")({
  validateSearch: validarBuscaApp,
  component: RootIndex,
});

function RootIndex() {
  // Recharts + localStorage-based store need the browser; render client-only to
  // avoid SSR hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-sm text-muted-foreground">Carregando portfólio…</div>
      </div>
    );
  }
  return <App />;
}
