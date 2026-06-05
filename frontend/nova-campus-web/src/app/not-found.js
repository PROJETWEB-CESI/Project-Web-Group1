'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/shared/Button';

export default function NotFound() {
  const { translate } = useLanguage();

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[var(--color-bg)]">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="text-[120px] font-bold tracking-[-8px] text-[var(--color-primary)] leading-none mb-2 select-none">
            404
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-text)] mb-4">
            {translate('pageNotFound')}
          </h1>
          <p className="text-lg text-[var(--color-text-muted)] max-w-sm mx-auto">
            {translate('pageNotFoundDesc')}
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button variant="primary" size="lg" className="w-full">
              {translate('backToLogin')}
            </Button>
          </Link>

          <Link href="/" className="block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-4">
            {translate('returnHome')}
          </Link>
        </div>

        <p className="mt-8 text-xs text-[var(--color-text-muted)]">
          {translate('contactSupport')}
        </p>
      </div>
    </div>
  );
}
