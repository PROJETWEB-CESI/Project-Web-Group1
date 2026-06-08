'use client';

import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sun, Moon, Contrast } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { translate } = useLanguage();

  const labels = {
    light: translate('light'),
    dark: translate('dark'),
    'high-contrast': translate('highContrast'),
  };

  const icons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    'high-contrast': <Contrast className="w-4 h-4" />,
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-sunken)] p-1 text-sm">
      <button
        onClick={toggleTheme}
        className="flex items-center gap-1.5 rounded-full px-3 font-medium hover:bg-[var(--color-bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        title={`Current: ${labels[theme]}. Click to cycle themes.`}
      >
        <span aria-hidden="true">{icons[theme]}</span>
        <span className="hidden sm:inline">{labels[theme]}</span>
      </button>

      {/* Optional direct selectors for power users / accessibility */}
      <div className="hidden md:flex gap-1 border-l border-[var(--color-border)] pl-2">
        {['light', 'dark', 'high-contrast'].map((t) => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
              theme === t 
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' 
                : 'hover:bg-[var(--color-bg-hover)]'
            }`}
            aria-label={`Switch to ${labels[t]} mode`}
            aria-pressed={theme === t}
          >
            <span aria-hidden="true">{icons[t]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
