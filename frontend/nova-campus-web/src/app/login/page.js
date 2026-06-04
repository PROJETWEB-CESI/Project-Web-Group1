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
  const [loading, setLoading] = useState(false);

  const { login, user, loading: authLoading, isAuthenticated } = useAuth();
  const { t } = useLanguage();
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
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      
      // Role-based redirect (matches dashboard structure)
      const role = loggedInUser.role || 'student';
      const dashboardPath = `/dashboard/${role}`;
      
      router.push(dashboardPath);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left panel - Branding (general style, reusable pattern) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] text-[var(--color-on-primary)] flex-col justify-center px-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-full bg-white/20 border border-[var(--color-on-primary)]/30 flex items-center justify-center text-xl font-semibold">
              NC
            </div>
            <span className="text-3xl font-semibold tracking-tight">NovaCampus</span>
          </div>

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight mb-6">
            {t('shapingMinds')}
          </h1>
          <p className="text-xl opacity-80 max-w-sm">
            {t('secureAccess')}
          </p>

          <div className="mt-10 text-sm opacity-60">
            {t('gdprTagline')}
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="w-full lg:w-1/2 flex min-h-0 overflow-auto items-start lg:items-center justify-center px-6 py-8 lg:py-12 bg-[var(--color-bg)]">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-9 w-9 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center text-lg font-semibold">
              NC
            </div>
            <span className="text-2xl font-semibold text-[var(--color-text)]">NovaCampus</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">{t('welcomeBack')}</h2>
            <p className="text-[var(--color-text-muted)] mt-1">{t('signInToAccess')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              label={t('emailAddress')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@etu.novacampus.fr"
              autoComplete="email"
              required
            />

            <Input
              label={t('password')}
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
              loading={loading} 
              className="w-full mt-2"
            >
              {t('signIn')}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => alert(t('forgotPasswordHelp'))}
                className="text-[var(--color-link)] hover:underline focus:outline-none focus:underline"
              >
                {t('forgotPassword')}
              </button>
            </div>
          </form>

          {/* GDPR / Privacy notice - important for compliance */}
          <div className="mt-8 text-center text-xs text-[var(--color-text-muted)] leading-relaxed">
            {t('privacyNoticePrefix')}{' '}
            <a href="/privacy" className="underline hover:text-[var(--color-text)]">{t('privacyPolicy')}</a>.{' '}
            {t('privacyNoticeSuffix')}
          </div>

          <div className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
            {t('needAccount')}{' '}
            <span className="font-medium">{t('needAccountContact')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
