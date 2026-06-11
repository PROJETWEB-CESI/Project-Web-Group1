'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/shared/DashboardSidebar';
import AriaChatWidget from '@/components/shared/AriaChatWidget';
import PullToRefresh from '@/components/shared/PullToRefresh';

export default function DashboardLayout({ children }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Enforce that each user type only sees their own dashboard.
  // A student (for example) cannot access /dashboard/admin/* or /dashboard/teacher/* etc.
  // The sidebar + profile menu already only generate links for the current user's role.
  useEffect(() => {
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      logout();
      router.replace('/login');
      return;
    }

    const userRole = (user.role || 'student').toLowerCase();
    const segments = (pathname || '').split('/').filter(Boolean); // e.g. ['dashboard', 'admin', ...]
    const pathRole = segments[1]; // the segment right after 'dashboard'

    // Common pages accessible to all logged-in users (assistant, profile/settings, help etc.)
    const commonRoles = ['assistant', 'profile', 'settings', 'help'];
    if (commonRoles.includes(pathRole)) {
      return; // allow, will use dashboard layout
    }

    // Bare /dashboard or /dashboard/ -> bounce to the user's own role dashboard
    if (!pathRole || pathRole === 'dashboard') {
      router.replace(`/dashboard/${userRole}`);
      return;
    }

    // If the URL role segment does not match the logged-in user, redirect to their own.
    // This prevents manual URL access or bookmarking another role's dashboard.
    if (pathRole !== userRole) {
      router.replace(`/dashboard/${userRole}`);
    }
  }, [pathname, user, loading, isAuthenticated, router]);

  // While checking auth or during redirect, keep it minimal (sidebar will also be null if !auth).
  if (loading) {
    return (
      <div className="flex flex-1 h-full min-h-0 items-center justify-center text-sm text-[var(--color-text-muted)]">
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-screen overflow-hidden">
      {/* Left sidebar ~300px wide, hidden on small screens, appears at xl breakpoint (1280px) */}
      <aside className="hidden xl:flex w-[280px] xl:w-[300px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex-col overflow-auto">
        <DashboardSidebar />
      </aside>

      {/* Main content area (role pages render here). Guard above ensures only matching role content stays. */}
      <main className="flex-1 overflow-hidden bg-[var(--color-bg)]">
        <PullToRefresh className="h-full p-2 sm:p-6">
          {children}
        </PullToRefresh>
      </main>

      {/* Floating Aria chat widget — visible on all dashboard pages except /dashboard/assistant */}
      <AriaChatWidget />
    </div>
  );
}
