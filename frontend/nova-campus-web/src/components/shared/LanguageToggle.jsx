'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const { language: currentLanguage, setLanguage, toggleLanguage, translate } = useLanguage();

  // Always show native names for language choices (standard UX)
  const langDisplay = {
    en: 'EN',
    fr: 'FR',
  };

  const langFull = {
    en: 'English ',
    fr: 'Français',
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-sunken)] md:p-1 text-sm">
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 rounded-full sm:px-1.5 md:py-0.25 px-3 py-1 font-medium hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        title={`${translate('language')}: ${langFull[currentLanguage]}. Click to switch.`}
      >
        <Globe className="hidden sm:inline w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
        <span className="sm:inline font-mono">{langDisplay[currentLanguage]}</span>
      </button>

      {/* Direct selectors - always visible on md+ for quick access */}
      <div className="hidden md:flex gap-1 border-l border-[var(--color-border)] pl-2">
        {['en', 'fr'].map((language) => (
          <button
            key={language}
            onClick={() => setLanguage(language)}
            className={`rounded-full px-2 py-0.5 text-xs transition-colors ${currentLanguage === language
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
              : 'hover:bg-[var(--color-bg-hover)] active:bg-[var(--color-bg-active)]'
              }`}
            aria-label={`Switch to ${langFull[language]}`}
            aria-pressed={currentLanguage === language}
          >
            {langDisplay[language]}
          </button>
        ))}
      </div>
    </div>
  );
}
