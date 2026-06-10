'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

/**
 * LogoLink
 * Top-left brand link in the global header.
 * On the login page (large screens): uses light text (--color-on-primary) so it looks good over the blue panel.
 * Everywhere else: forces dark text (--color-text).
 */
export default function LogoLink() {
  const { user, isAuthenticated, loading } = useAuth();
  const pathname = usePathname();

  // Detect if we're on the login page
  const isLoginPage = pathname === '/login' || pathname?.startsWith('/login');

  let href = '/login';
  if (!loading && isAuthenticated && user) {
    const role = (user.role || 'student').toLowerCase();
    href = `/dashboard/${role}`;
  }

  // Color logic
  const textColor = isLoginPage
    ? "text-[var(--color-text)] lg:text-[var(--color-on-primary)]"
    : "text-[var(--color-text)]";

  const iconStroke = isLoginPage
    ? "stroke-[var(--color-text)] lg:stroke-[var(--color-on-primary)]"
    : "stroke-[var(--color-text)]";

  return (
    <Link
      href={href}
      className="flex LogoLink items-center gap-2 no-underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] rounded group"
      style={{ textDecoration: 'none' }}
      aria-label="NovaCampus Alliance - Home"
    >
      {/* Icon */}
      <div
        className="rounded-[5px] flex items-center justify-center flex-shrink-0"
        style={{
          background: 'var(--color-surface-lighter)',
          width: '42px',
          height: '42px',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={32}
          height={32}
          fill="none"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${iconStroke} opacity-95`}
        >
          <path d="M4 20V8l8-5 8 5v12M9 20v-6h6v6" />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-[0.85] -space-y-px">
        <span className={`text-[1.25em] sm:text-[2em] font-semibold tracking-[-0.015em] transition-colors ${textColor}`}>
          Novacampus
        </span>
        <span className={`text-[0.75em] sm:text-[1em] tracking-[0.01em] transition-colors ${textColor}`}>
          Alliance
        </span>
      </div>
    </Link>
  );
}