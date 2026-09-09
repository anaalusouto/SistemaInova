import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'azul' | 'rosa' | 'verde' | 'amarelo';
export type FontScale = 'sm' | 'md' | 'lg' | 'xl';

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

export const FONT_SCALE_ORDER: FontScale[] = ['sm', 'md', 'lg', 'xl'];

export const FONT_SCALE_LABEL: Record<FontScale, string> = {
  sm: 'Pequeno',
  md: 'Padrão',
  lg: 'Grande',
  xl: 'Extra grande',
};

/**
 * Fator aplicado como `font-size` (percentual) no <html> — escala só o texto (que no app é
 * quase todo definido em `rem`, relativo à raiz). Botões, ícones, cards e espaçamentos usam a
 * escala `--spacing` do Tailwind, fixada em px em styles.css, então NÃO acompanham esse fator —
 * só as letras aumentam/diminuem, o layout fica do mesmo tamanho.
 */
export const FONT_SCALE_VALUE: Record<FontScale, number> = {
  sm: 0.925,
  md: 1,
  lg: 1.1,
  xl: 1.25,
};

const KEY = 'pp-theme-v1';

interface ThemePrefs { mode: ThemeMode; accent: AccentColor; fontScale: FontScale }
const DEFAULT_PREFS: ThemePrefs = { mode: 'light', accent: 'azul', fontScale: 'md' };

function readPrefs(): ThemePrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      mode: parsed.mode === 'dark' ? 'dark' : 'light',
      accent: (['azul', 'rosa', 'verde', 'amarelo'] as const).includes(parsed.accent) ? parsed.accent : 'azul',
      fontScale: FONT_SCALE_ORDER.includes(parsed.fontScale) ? parsed.fontScale : 'md',
    };
  } catch { return DEFAULT_PREFS; }
}

function applyToDocument(prefs: ThemePrefs) {
  const root = document.documentElement;
  root.classList.toggle('dark', prefs.mode === 'dark');
  root.dataset.accent = prefs.accent;
  root.style.fontSize = `${FONT_SCALE_VALUE[prefs.fontScale] * 100}%`;
}

interface Ctx {
  mode: ThemeMode;
  accent: AccentColor;
  fontScale: FontScale;
  setMode: (m: ThemeMode) => void;
  setAccent: (a: AccentColor) => void;
  setFontScale: (f: FontScale) => void;
  toggleMode: () => void;
  increaseFontScale: () => void;
  decreaseFontScale: () => void;
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
  const setFontScale = useCallback((f: FontScale) => setPrefs(p => ({ ...p, fontScale: f })), []);
  const toggleMode = useCallback(() => setPrefs(p => ({ ...p, mode: p.mode === 'dark' ? 'light' : 'dark' })), []);
  const increaseFontScale = useCallback(() => setPrefs(p => {
    const i = FONT_SCALE_ORDER.indexOf(p.fontScale);
    return { ...p, fontScale: FONT_SCALE_ORDER[Math.min(i + 1, FONT_SCALE_ORDER.length - 1)] };
  }), []);
  const decreaseFontScale = useCallback(() => setPrefs(p => {
    const i = FONT_SCALE_ORDER.indexOf(p.fontScale);
    return { ...p, fontScale: FONT_SCALE_ORDER[Math.max(i - 1, 0)] };
  }), []);

  const value = useMemo<Ctx>(() => ({
    mode: prefs.mode, accent: prefs.accent, fontScale: prefs.fontScale,
    setMode, setAccent, setFontScale, toggleMode, increaseFontScale, decreaseFontScale,
  }), [prefs, setMode, setAccent, setFontScale, toggleMode, increaseFontScale, decreaseFontScale]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
