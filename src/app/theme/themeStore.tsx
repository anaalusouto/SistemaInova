import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'azul' | 'rosa' | 'verde' | 'amarelo';

export const ACCENT_LABEL: Record<AccentColor, string> = {
  azul: 'Azul',
  rosa: 'Rosa',
  verde: 'Verde',
  amarelo: 'Amarelo',
};

/** Amostra de cor sólida de cada opção — só para os "chips" de seleção na UI. */
export const ACCENT_SWATCH: Record<AccentColor, string> = {
  azul: '#2563EB',
  rosa: '#DB2777',
  verde: '#16A34A',
  amarelo: '#CA8A04',
};

const KEY = 'pp-theme-v1';

interface ThemePrefs { mode: ThemeMode; accent: AccentColor }
const DEFAULT_PREFS: ThemePrefs = { mode: 'light', accent: 'azul' };

function readPrefs(): ThemePrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      accent: (['azul', 'rosa', 'verde', 'amarelo'] as const).includes(parsed.accent) ? parsed.accent : 'azul',
    };
  } catch { return DEFAULT_PREFS; }
}

function applyToDocument(prefs: ThemePrefs) {
  const root = document.documentElement;
  root.classList.toggle('dark', prefs.mode === 'dark');
  root.dataset.accent = prefs.accent;
}

interface Ctx {
  mode: ThemeMode;
  accent: AccentColor;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentColor) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<Ctx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = readPrefs();
    setPrefs(initial);
    applyToDocument(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyToDocument(prefs);
    try { window.localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  }, [prefs, hydrated]);

  const setMode = useCallback((m: ThemeMode) => setPrefs(p => ({ ...p, mode: m })), []);
  const setAccent = useCallback((a: AccentColor) => setPrefs(p => ({ ...p, accent: a })), []);
  const toggleMode = useCallback(() => setPrefs(p => ({ ...p, mode: p.mode === 'dark' ? 'light' : 'dark' })), []);

  const value = useMemo<Ctx>(() => ({ mode: prefs.mode, accent: prefs.accent, setMode, setAccent, toggleMode }), [prefs, setMode, setAccent, toggleMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
