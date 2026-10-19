import { useEffect, useState } from "react";

/** Preferência visual local; não contém identidade nem dados da sessão. */
export function useMenuLateral() {
  const [recolhido, setRecolhido] = useState(false);
  const [carregado, setCarregado] = useState(false);
  useEffect(() => {
    try {
      setRecolhido(localStorage.getItem("cria:menu-recolhido:v1") === "true");
    } catch {
      /* preferência opcional */
    }
    setCarregado(true);
  }, []);
  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem("cria:menu-recolhido:v1", String(recolhido));
    } catch {
      /* preferência opcional */
    }
  }, [recolhido, carregado]);
  return { recolhido, alternar: () => setRecolhido((v) => !v) };
}
