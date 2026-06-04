'use client';

import { useEffect, useState } from 'react';

export default function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference
    const stored = localStorage.getItem('highContrast') === 'true';
    const systemPrefers = window.matchMedia('(prefers-contrast: high)').matches;
    
    const shouldEnable = stored || systemPrefers;
    setIsHighContrast(shouldEnable);
    
    if (shouldEnable) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const toggle = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('highContrast', 'false');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={isHighContrast}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
      title={isHighContrast ? 'Disable high contrast mode' : 'Enable high contrast mode for better visibility'}
    >
      <span aria-hidden="true">◐</span>
      <span className="hidden sm:inline">
        {isHighContrast ? 'High contrast on' : 'High contrast'}
      </span>
    </button>
  );
}
