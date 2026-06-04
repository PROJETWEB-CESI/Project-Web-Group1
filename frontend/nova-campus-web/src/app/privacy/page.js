'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyPage() {
  const { t, language } = useLanguage();

  // Note: metadata can't be dynamic easily here without more setup, so title stays in English for now.
  // For full i18n, consider route groups or next-intl later.

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">{t('privacyPolicy')}</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Last updated: {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">{t('yourDataRights')}</h2>
      <p className="mb-4">
        {t('privacyDataProcessing')}
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">{t('legalBasis')}</h2>
      <ul className="list-disc pl-6 space-y-1 mb-4">
        <li>{t('basisContract')}</li>
        <li>{t('basisLegal')}</li>
        <li>{t('basisInterest')}</li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">{t('yourRights')}</h2>
      <p className="mb-4">
        {t('rightsText')}
      </p>

      <p className="text-sm text-[var(--color-text-muted)] mt-8">
        {t('placeholderPolicy')}
      </p>
    </main>
  );
}
