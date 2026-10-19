import { useSyncExternalStore } from "react";
import { FORMATO_PADRAO, validarFormatoPlano, type FormatoPlano } from "../lib/formatoPlano";
const KEY = "cria:formato-plano:v1";
const EVENT = "cria:formato-plano";
const servidor = () => null;
const ler = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
const observar = (avisar: () => void) => {
  window.addEventListener(EVENT, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENT, avisar);
    window.removeEventListener("storage", avisar);
  };
};
export function useFormatoPlano() {
  const raw = useSyncExternalStore(observar, ler, servidor);
  let formato = FORMATO_PADRAO;
  try {
    formato = validarFormatoPlano(raw ? JSON.parse(raw) : null);
  } catch {
    /* padrão íntegro */
  }
  const salvar = (valor: FormatoPlano) => {
    localStorage.setItem(KEY, JSON.stringify(validarFormatoPlano(valor)));
    window.dispatchEvent(new Event(EVENT));
  };
  return { formato, salvar };
}
