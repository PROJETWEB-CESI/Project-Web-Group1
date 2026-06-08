'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, user, loading: authLoading, isAuthenticated } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  // Already authenticated → go directly to Aria
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.replace('/aria');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.push('/aria');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] text-[var(--color-on-primary)] flex-col justify-center px-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-full bg-white/20 border border-[var(--color-on-primary)]/30 flex items-center justify-center text-xl font-semibold">
              NC
            </div>
            <span className="text-3xl font-semibold tracking-tight">NovaCampus</span>
          </div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight mb-6">
            {translate('shapingMinds')}
          </h1>
          <p className="text-xl opacity-80 max-w-sm">{translate('secureAccess')}</p>
          <div className="mt-10 text-sm opacity-60">{translate('gdprTagline')}</div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex min-h-0 overflow-auto items-start lg:items-center justify-center px-6 py-8 lg:py-12 bg-[var(--color-bg)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center text-lg font-semibold">NC</div>
            <span className="text-2xl font-semibold text-[var(--color-text)]">NovaCampus</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">{translate('welcomeBack')}</h2>
            <p className="text-[var(--color-text-muted)] mt-1">{translate('signInToAccess')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label={translate('emailAddress')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@etu.novacampus.fr"
              autoComplete="email"
              required
            />
            <Input
              label={translate('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {error && (
              <div className="error-message" role="alert" aria-live="polite">{error}</div>
            )}
            <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full mt-2">
              {translate('signIn')}
            </Button>
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => alert(translate('forgotPasswordHelp'))}
                className="text-[var(--color-link)] hover:underline focus:outline-none focus:underline"
              >
                {translate('forgotPassword')}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-xs text-[var(--color-text-muted)] leading-relaxed">
            {translate('privacyNoticePrefix')}{' '}
            <a href="/privacy" className="underline hover:text-[var(--color-text)]">{translate('privacyPolicy')}</a>.{' '}
            {translate('privacyNoticeSuffix')}
          </div>
          <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            {translate('needAccount')}{' '}
            <span className="font-medium">{translate('needAccountContact')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
