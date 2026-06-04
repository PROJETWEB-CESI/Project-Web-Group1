'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute
 * 
 * Client component wrapper to protect pages that require authentication.
 * Redirects unauthenticated users to /login.
 * 
 * Usage example in a dashboard page:
 *   export default function StudentDashboard() {
 *     return (
 *       <ProtectedRoute>
 *         <div>...</div>
 *       </ProtectedRoute>
 *     );
 *   }
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }

    // Optional role-based protection (example for future use)
    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole) {
      // Redirect to their actual dashboard or show forbidden
      router.push(`/dashboard/${user.role}`);
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
          <p className="mt-4 text-sm text-[var(--color-text-muted)]">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
