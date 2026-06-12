'use client';

import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export default function HelpPage() {
  const { translate } = useLanguage();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">{translate('helpCenter')}</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        {translate('helpDescription')}
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">{translate('gettingStarted')}</h2>
          <p className="mb-4">{translate('gettingStartedDesc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Link href="/login" className="text-[var(--color-accent)] hover:underline">
                {translate('signIn')}
              </Link>{' '}
              {translate('toAccess')}
            </li>
            <li>{translate('navigateDashboard')}</li>
            <li>{translate('viewAcademicInfo')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">{translate('faq')}</h2>
          <p className="mb-4">{translate('faqDesc')}</p>
          <div className="space-y-4">
            <details className="border border-[var(--color-border)] rounded-lg p-4">
              <summary className="font-medium cursor-pointer">{translate('howViewGrades')}</summary>
              <p className="mt-2 text-[var(--color-text-muted)]">{translate('howViewGradesAnswer')}</p>
            </details>
            <details className="border border-[var(--color-border)] rounded-lg p-4">
              <summary className="font-medium cursor-pointer">{translate('howViewSchedule')}</summary>
              <p className="mt-2 text-[var(--color-text-muted)]">{translate('howViewScheduleAnswer')}</p>
            </details>
            <details className="border border-[var(--color-border)] rounded-lg p-4">
              <summary className="font-medium cursor-pointer">{translate('howMakePayment')}</summary>
              <p className="mt-2 text-[var(--color-text-muted)]">{translate('howMakePaymentAnswer')}</p>
            </details>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">{translate('technicalSupport')}</h2>
          <p className="mb-4">{translate('technicalSupportDesc')}</p>
          <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="font-medium mb-2">{translate('contactInfo')}</h3>
            <p>
              <span className="text-[var(--color-text-muted)]">{translate('supportEmail')}: </span>
              <a href="mailto:support@novacampus.fr" className="text-[var(--color-accent)] hover:underline">
                support@novacampus.fr
              </a>
            </p>
          </div>
        </section>
      </div>

      <div className="mt-12">
        <Link
          href="/dashboard"
          className="inline-flex fakeLink items-center gap-2 px-4 py-2 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-bg-subtle-hover)] transition-colors"
        >
          {translate('returnHome')}
        </Link>
      </div>
    </main>
  );
}
