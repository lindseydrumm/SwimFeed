/**
 * 3-way vibe/theme switcher: Default, Warm, Ocean. Uses useTheme().
 */
import React, { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../src/context/ThemeContext';

export function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-slate-300"
        title="Change vibe"
        aria-label="Theme"
      >
        <Palette className="w-4 h-4" />
          Theme
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 py-2 min-w-[140px] rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50">
          <p className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
            Vibes
          </p>
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2 ${
                theme === t.id
                  ? 'text-cyan-400 bg-cyan-500/10'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <span className="text-base opacity-80">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
