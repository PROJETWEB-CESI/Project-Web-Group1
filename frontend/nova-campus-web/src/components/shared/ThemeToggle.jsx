'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme, toggleTheme } = useTheme();

  const labels = {
    light: 'Light',
    dark: 'Dark',
    'high-contrast': 'High Contrast',
  };

  const icons = {
    light: '☀️',
    dark: '🌙',
    'high-contrast': '◐',
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm">
      <button
        onClick={toggleTheme}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 font-medium hover:bg-white/50 dark:hover:bg-black/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
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
            className={`rounded px-2 py-0.5 text-xs transition-colors ${
              theme === t 
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' 
                : 'hover:bg-[var(--color-border)]'
            }`}
            aria-label={`Switch to ${labels[t]} mode`}
            aria-pressed={theme === t}
          >
            {icons[t]}
          </button>
        ))}
      </div>
    </div>
  );
}
