'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/shared/DashboardSidebar';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Mobile sidebar state (hamburger for small devices)
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change (good UX)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Enforce that each user type only sees their own dashboard.
  // A student (for example) cannot access /dashboard/admin/* or /dashboard/teacher/* etc.
  // The sidebar + profile menu already only generate links for the current user's role.
  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;

    const userRole = (user.role || 'student').toLowerCase();
    const segments = (pathname || '').split('/').filter(Boolean); // e.g. ['dashboard', 'admin', ...]
    const pathRole = segments[1]; // the segment right after 'dashboard'

    // Common pages accessible to all logged-in users (assistant, profile/settings, etc.)
    const commonRoles = ['assistant', 'profile', 'settings'];
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
    <div className="flex flex-1 h-full min-h-0 relative">
      {/* Mobile hamburger (only on small screens, top of content area for simplicity) */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-[70] p-2 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Left sidebar: fixed 300px on md+, drawer on mobile */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 w-[280px] md:w-[300px] shrink-0 
          border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col overflow-hidden
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <DashboardSidebar />
      </aside>

      {/* Backdrop for mobile when open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main content area (role pages render here). Guard above ensures only matching role content stays. */}
      <main className="flex-1 overflow-auto bg-[var(--color-bg)] p-6 pt-14 md:pt-6">
        {children}
      </main>
    </div>
  );
}
