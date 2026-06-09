'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function RootRedirector() {
  const { user, loading, isAuthenticated } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(isAuthenticated && user ? '/aria' : '/login');
  }, [loading, isAuthenticated, user, router]);

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        <p className="mt-4 text-sm text-[var(--color-text-muted)]">
          {translate('checkingSession')}
        </p>
      </div>
    </div>
  );
}
