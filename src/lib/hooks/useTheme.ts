import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'paylance-theme';
const CLASS = 'theme-dark';

function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Stockage indisponible (navigation privée) : on suit le système.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Thème de l'espace pro. La classe est posée sur <html> (et non sur un conteneur) pour que
 * les menus rendus en portail et les fenêtres héritent des couleurs ; elle est retirée en
 * quittant l'espace pro, le site public restant toujours clair.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(CLASS, theme === 'dark');
    return () => root.classList.remove(CLASS);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignoré
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
