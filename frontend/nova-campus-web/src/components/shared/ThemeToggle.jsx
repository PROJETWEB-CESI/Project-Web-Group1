'use client';

import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sun, Moon, Contrast } from 'lucide-react';

export default function ThemeToggle() {
  const { theme: currentTheme, setTheme, toggleTheme } = useTheme();
  const { translate } = useLanguage();

  const labels = {
    light: translate('light'),
    dark: translate('dark'),
    'high-contrast': translate('highContrast'),
  };

  const icons = {
    light: <Sun className="w-5 h-5 sm:w-4 sm:h-4" />,
    dark: <Moon className="w-5 h-5 sm:w-4 sm:h-4" />,
    'high-contrast': <Contrast className="w-5 h-5 sm:w-4 sm:h-4" />,
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-sunken)] md:p-1 text-sm">
      <button
        onClick={toggleTheme}
        className="flex items-center gap-1.5 rounded-full sm:px-1.5 md:py-0.25 px-3 py-1 font-medium hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        title={`Current: ${labels[currentTheme]}. Click to cycle themes.`}
      >
        <span aria-hidden="true">{icons[currentTheme]}</span>
        <span className="hidden sm:inline">{labels[currentTheme]}</span>
      </button>

      {/* Optional direct selectors for power users / accessibility */}
      <div className="hidden md:flex gap-1 border-l border-[var(--color-border)] pl-2">
        {['light', 'dark', 'high-contrast'].map((theme) => (
          <button
            key={theme}
            onClick={() => setTheme(theme)}
            className={`rounded-full px-2 py-0.5 text-xs transition-colors ${currentTheme === theme
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              : 'hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]'
              }`}
            aria-label={`Switch to ${labels[theme]} mode`}
            aria-pressed={currentTheme === theme}
          >
            <span aria-hidden="true">{icons[theme]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
