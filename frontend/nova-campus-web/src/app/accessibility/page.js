'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function AccessibilityPage() {
  const { translate, language } = useLanguage();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">{translate('accessibilityStatement') || 'Accessibility Statement'}</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Last updated: {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">{translate('ourCommitment')}</h2>
      <p className="mb-4">
        {translate('commitmentText')}{' '}
        <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer" className="underline">WCAG 2.2</a>.
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">{translate('currentFeatures')}</h2>
      <ul className="list-disc pl-6 space-y-1 mb-4">
        <li>{translate('featureThemes')}</li>
        <li>{translate('featureContrast')}</li>
        <li>{translate('featureKeyboard')}</li>
        <li>{translate('featureLabels')}</li>
        <li>{translate('featureResponsive')}</li>
        <li>{translate('featureErrors')}</li>
      </ul>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">{translate('limitations')}</h2>
      <p className="mb-4">
        {translate('limitationsText')}
      </p>

      <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-3">{translate('feedback')}</h2>
      <p>
        {translate('feedbackText').split('support email').length > 1 ? (
          <>
            {translate('feedbackText').split('support email')[0]}
            <a href="mailto:support@novacampus.fr" className="underline">{translate('contact')}</a>
            {translate('feedbackText').split('support email')[1]}
          </>
        ) : translate('feedbackText')}
      </p>

      <p className="text-sm text-[var(--color-text-muted)] mt-8">
        {translate('placeholderAccessibility')}
      </p>
    </main>
  );
}
