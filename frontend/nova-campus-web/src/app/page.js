'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Root page acts as an auth guard + role-based router.
 *
 * - If not authenticated (or no valid session): redirect to /login
 * - If authenticated: redirect to the role-specific dashboard
 *   (student → /dashboard/student, teacher → /dashboard/teacher, etc.)
 *
 * This ensures that visiting http://localhost:3000/ (or the proxied root)
 * always lands the user in the correct place without showing a placeholder.
 *
 * Uses the existing AuthContext (token persisted in localStorage, validated on load).
 * Shows a minimal loading state while auth is being determined to avoid flashes.
 */
export default function RootRedirector() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // still determining auth state
    }

    if (!isAuthenticated || !user) {
      logout();
      router.replace('/login');
      return;
    }

    // Determine target based on role (matches existing dashboard structure)
    const role = (user.role || 'student').toLowerCase();
    let target = '/dashboard/student';

    if (role === 'teacher') {
      target = '/dashboard/teacher';
    } else if (role === 'admin') {
      target = '/dashboard/admin';
    } else if (role === 'executive') {
      target = '/dashboard/executive';
    }
    // Unknown role falls back to student dashboard

    router.replace(target);
  }, [loading, isAuthenticated, user, router]);

  // While we check auth (or during the redirect), show a clean loading screen.
  // This is consistent with the loading state used in ProtectedRoute.
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
