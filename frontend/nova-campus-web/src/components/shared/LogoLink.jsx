'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/**
 * LogoLink
 * Top-left brand link in the global header.
 * - If authenticated: links to the user's role dashboard (e.g. /dashboard/student)
 * - If not authenticated (or loading): links to /login
 * Simple text name for now (per spec). Clickable from anywhere.
 */
export default function LogoLink() {
  const { user, isAuthenticated, loading } = useAuth();

  let href = '/login';
  if (!loading && isAuthenticated && user) {
    const role = (user.role || 'student').toLowerCase();
    href = `/dashboard/${role}`;
  }

  return (
    <Link
      href={href}
      className="text-base font-semibold tracking-tight text-[var(--color-text)] hover:text-[var(--color-primary)] no-underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] rounded"
    >
      NovaCampus
    </Link>
  );
}
