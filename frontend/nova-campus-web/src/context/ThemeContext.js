'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { logContrastVerification } from '@/lib/contrast';

const ThemeContext = createContext(null);

const THEMES = ['light', 'dark', 'high-contrast'];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');

  // Apply theme to document
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'high-contrast');

    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'high-contrast') {
      root.classList.add('high-contrast');
    }
    // 'light' is default, no extra class needed
  };

  // Load saved theme or system preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    let initialTheme = 'light';

    if (saved && THEMES.includes(saved)) {
      initialTheme = saved;
    } else {
      // Check system preferences
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initialTheme = 'dark';
      }
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        initialTheme = 'high-contrast';
      }
    }

    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // Verify chosen theme colors actually deliver good contrast (uses luminance calc)
    // Only logs in development; helps ensure high-contrast is not low-contrast pairs.
    setTimeout(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const primary = rootStyle.getPropertyValue('--color-primary').trim() || '#000000';
      const onPrimary = rootStyle.getPropertyValue('--color-on-primary').trim() || '#ffffff';
      const text = rootStyle.getPropertyValue('--color-text').trim() || '#000000';
      const bg = rootStyle.getPropertyValue('--color-bg').trim() || '#ffffff';
      logContrastVerification(initialTheme, primary, onPrimary, text, bg);
    }, 50);
  }, []);

  const setTheme = (newTheme) => {
    if (!THEMES.includes(newTheme)) return;

    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);

    // Re-verify after manual switch (calculation ensures we didn't pick bad pairs like white-on-yellow)
    setTimeout(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const primary = rootStyle.getPropertyValue('--color-primary').trim() || '#000000';
      const onPrimary = rootStyle.getPropertyValue('--color-on-primary').trim() || '#ffffff';
      const text = rootStyle.getPropertyValue('--color-text').trim() || '#000000';
      const bg = rootStyle.getPropertyValue('--color-bg').trim() || '#ffffff';
      logContrastVerification(newTheme, primary, onPrimary, text, bg);
    }, 30);
  };

  const toggleTheme = () => {
    const currentIndex = THEMES.indexOf(theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex]);
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isHighContrast: theme === 'high-contrast',
    isDark: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
