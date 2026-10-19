import { useState } from "react";
import { toast } from "sonner";
import { useStore } from "../../store";
import { useFormatoPlano } from "../../theme/useFormatoPlano";
import { FORMATO_PADRAO } from "../../lib/formatoPlano";
import { registrosDoPlano, CAMPOS_RELATORIO_PLANO } from "../../lib/planoRelatorio";
import { VisaoCompleta } from "./VisaoCompleta";

export function FormatoProjetoSection() {
  const { projects } = useStore();
  const { formato, salvar } = useFormatoPlano();
  const [id, setId] = useState<number | null>(null);
  const projeto = projects.find((p) => p.id === id) ?? projects[0];
  const persistir = (valor: typeof formato) => {
    try {
      salvar(valor);
    } catch {
      toast.error("Não foi possível guardar o formato neste navegador.");
    }
  };
  return (
    <section className="min-w-0 space-y-4">
      <h2 className="text-lg font-semibold">Formato do projeto</h2>
      <p className="text-sm text-muted-foreground">
        A ordem das colunas e dos campos vale para todos os projetos neste navegador. A tabela
        sempre mantém todas as informações; campos sem valor aparecem como travessão. Os relatórios
        acompanham a ordem dos campos.
      </p>
      <button
        type="button"
        className="border rounded px-3 py-2 text-sm"
        onClick={() => persistir(FORMATO_PADRAO)}
      >
        Restaurar formato padrão
      </button>
      <h3 className="font-semibold">Colunas da tabela</h3>
      <ol className="space-y-1 max-w-xl">
        {formato.colunas.map((c, i) => (
          <li
            key={c}
            className="flex items-center justify-between border rounded p-2 gap-3 text-sm"
          >
            <span>{c}</span>
            <span className="flex gap-2">
              {([-1, 1] as const).map((delta) => (
                <button
                  key={delta}
                  type="button"
                  disabled={i + delta < 0 || i + delta >= formato.colunas.length}
                  aria-label={`Mover coluna ${c} para ${delta < 0 ? "esquerda" : "direita"}`}
                  className="border rounded px-2 disabled:opacity-30"
                  onClick={() => {
                    const colunas = [...formato.colunas];
                    [colunas[i], colunas[i + delta]] = [colunas[i + delta], colunas[i]];
                    persistir({ ...formato, colunas });
                  }}
                >
                  {delta < 0 ? "↑" : "↓"}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ol>
      <h3 className="font-semibold">Todos os campos</h3>
      <label className="flex flex-col gap-1 text-sm max-w-xl">
        Projeto de referência
        <select
          className="border rounded p-2 bg-card"
          value={projeto?.id ?? ""}
          onChange={(e) => setId(Number(e.target.value))}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {projeto ? (
        <VisaoCompleta
          registros={registrosDoPlano(projeto, [...CAMPOS_RELATORIO_PLANO], formato.ordemCampos)}
          ordem={formato.ordemCampos}
          aoOrdenar={(ordemCampos) => persistir({ ...formato, ordemCampos })}
        />
      ) : (
        <p>Nenhum projeto disponível para mostrar os campos.</p>
      )}
    </section>
  );
}
