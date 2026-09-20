'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Light / dark theme, stamped as `data-theme` on <html>.
 *
 * The choice is remembered in localStorage when that is available, and every access is
 * wrapped — a blocked-storage browser simply starts light each time.
 */

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'elixihire-theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    let initial: Theme = 'light';
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        initial = stored;
      } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        initial = 'dark';
      }
    } catch {
      // No storage, no media query — light it is.
    }
    setThemeState(initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference simply will not survive the session.
    }
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [theme, setTheme],
  );

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/**
 * Chart colours resolved from the live CSS variables.
 *
 * Recharts needs real colour strings rather than classes, so we read the computed
 * custom properties and recompute them whenever the theme flips.
 */
export interface ChartPalette {
  jade: string;
  jadeSoft: string;
  ink: string;
  muted: string;
  hairline: string;
  surface: string;
  warn: string;
  danger: string;
  info: string;
  /** Fixed categorical order — assigned by entity, never cycled or re-assigned by rank. */
  series: string[];
}

function readVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `rgb(${raw})` : fallback;
}

export function useChartPalette(): ChartPalette {
  const { theme } = useTheme();

  return useMemo(() => {
    const jade = readVar('--jade', 'rgb(18 124 103)');
    const warn = readVar('--warn-fg', 'rgb(146 64 14)');
    const danger = readVar('--danger-fg', 'rgb(185 28 28)');
    const info = readVar('--info-fg', 'rgb(7 89 133)');
    const muted = readVar('--muted', 'rgb(107 122 120)');

    return {
      jade,
      jadeSoft: theme === 'dark' ? 'rgb(28 110 92)' : 'rgb(143 214 197)',
      ink: readVar('--ink', 'rgb(26 43 42)'),
      muted,
      hairline: readVar('--hairline', 'rgb(216 227 224)'),
      surface: readVar('--surface-raised', 'rgb(255 255 255)'),
      warn,
      danger,
      info,
      series: [
        jade,
        theme === 'dark' ? 'rgb(125 211 252)' : 'rgb(7 89 133)',
        theme === 'dark' ? 'rgb(252 211 77)' : 'rgb(180 83 9)',
        theme === 'dark' ? 'rgb(196 181 253)' : 'rgb(109 40 217)',
        theme === 'dark' ? 'rgb(244 164 164)' : 'rgb(159 18 57)',
        muted,
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
    };
  }, [theme]);
}
