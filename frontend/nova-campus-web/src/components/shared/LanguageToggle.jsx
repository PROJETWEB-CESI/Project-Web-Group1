'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage, toggleLanguage, translate } = useLanguage();

  // Always show native names for language choices (standard UX)
  const langDisplay = {
    en: 'EN',
    fr: 'FR',
  };

  const langFull = {
    en: 'English',
    fr: 'Français',
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-sm">
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 font-medium hover:bg-white/50 dark:hover:bg-black/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        title={`${translate('language')}: ${langFull[language]}. Click to switch.`}
      >
        <span aria-hidden="true">🌐</span>
        <span className="hidden sm:inline font-mono">{langDisplay[language]}</span>
      </button>

      {/* Direct selectors - always visible on md+ for quick access */}
      <div className="hidden md:flex gap-1 border-l border-[var(--color-border)] pl-2">
        {['en', 'fr'].map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={`rounded px-2 py-0.5 text-xs font-mono transition-colors ${
              language === l 
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' 
                : 'hover:bg-[var(--color-border)]'
            }`}
            aria-label={`Switch to ${langFull[l]}`}
            aria-pressed={language === l}
          >
            {langDisplay[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
