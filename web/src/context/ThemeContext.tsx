/**
 * Theme / vibe switcher: default (slate+cyan), warm (stone+amber), ocean (navy+sky).
 * Persists to localStorage and sets data-theme on document.documentElement.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type ThemeId = 'default' | 'warm' | 'ocean';

const STORAGE_KEY = 'swimlive_theme';

const themes: { id: ThemeId; label: string; icon: string }[] = [
  { id: 'default', label: 'Default', icon: '◆' },
  { id: 'warm', label: 'Warm', icon: '◇' },
  { id: 'ocean', label: 'Ocean', icon: '○' },
];

function loadTheme(): ThemeId {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'warm' || s === 'ocean' || s === 'default') return s;
  } catch {}
  return 'default';
}

const ThemeContext = createContext<{
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: typeof themes;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(loadTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
