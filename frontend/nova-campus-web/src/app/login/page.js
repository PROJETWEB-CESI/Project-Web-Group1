'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Footer from "@/components/shared/Footer";
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

  // If already authenticated, redirect away from login (prevents seeing login form when logged in)
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const role = (user.role || 'student').toLowerCase();
      let target = '/dashboard/student';
      if (role === 'teacher') target = '/dashboard/teacher';
      else if (role === 'admin') target = '/dashboard/admin';
      else if (role === 'executive') target = '/dashboard/executive';
      router.replace(target);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedInUser = await login(email, password);

      // Role-based redirect (matches dashboard structure)
      const role = loggedInUser.role || 'student';
      const dashboardPath = `/dashboard/${role}`;

      router.push(dashboardPath);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen">
      {/* Left panel - Branding (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] text-[var(--color-on-primary)] flex-col justify-center px-12 min-h-screen">
        <div className="max-w-md">
          {/* <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-full bg-white/20 border border-[var(--color-on-primary)]/30 flex items-center justify-center text-xl font-semibold">
              NC
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Novacampus</span>
              <span className="text-xs -mt-0.5 opacity-80" style={{ fontFamily: 'var(--font-body)' }}>Alliance</span>
            </div>
          </div> */}

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight mb-6">
            {translate('shapingMinds')}
          </h1>
          <p className="text-xl opacity-90 max-w-sm">
            {translate('secureAccess')}
          </p>

          {/* <div className="mt-10 text-sm opacity-80">
            {translate('gdprTagline')}
          </div> */}
        </div>
      </div>

      {/* Right panel - Login form
          pt-20 + pb-14 ONLY on small screens (when left panel is hidden)
          lg:pt-0 + lg:pb-0 on large screens (two panels keep full "under" height) */}
      <div className="w-full lg:w-1/2 min-h-full flex overflow-auto items-start lg:items-center justify-center px-6 py-8 lg:py-12 pt-20 pb-20 lg:pb-20 bg-[var(--color-bg)]">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          {/* <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center text-lg font-semibold">
              NC
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Novacampus</span>
              <span className="text-[10px] -mt-0.5 text-[var(--color-text-muted)]" style={{ fontFamily: 'var(--font-body)' }}>Alliance</span>
            </div>
          </div> */}

          <div className="mb-8 mt-8">
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
              <div className="error-message" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={submitting}
              className="w-full mt-2 active:bg-[var(--color-primary-active)]"
            >
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

          {/* GDPR / Privacy notice */}
          <div className="mt-8 text-center text-xs text-[var(--color-text-muted)] leading-relaxed">
            {translate('privacyNoticePrefix')}{' '}
            <a href="/privacy" className="underline hover:text-[var(--color-text)]">{translate('privacyPolicy')}</a>.{' '}
            {translate('privacyNoticeSuffix')}
          </div>

          {/* Contact info for account issues */}
          <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            {translate('needAccount')}{' '}
            <span className="font-medium">{translate('needAccountContact')}</span>
          </div>
        </div>
        {/* Footer overlaid at the very bottom of the window.
                            The login panels will now extend behind/under it to the real viewport bottom. */}
        <div className="fixed bottom-0 w-full max-w-md">
          <Footer />
        </div>
      </div>
    </div>
  );
}