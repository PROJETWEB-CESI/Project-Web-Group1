'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/**
 * LogoLink
 * Top-left brand link in the global header.
 * Matches mockup format: "Novacampus" (Instrument Serif) + "Alliance" (Geist, smaller).
 * Icon mark + wordmark. Links to role dashboard if authed, else /login.
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
      className="flex items-center gap-2 no-underline focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] rounded group"
    >
      {/* Small mark icon (from mockup) */}
      <div
        className="w-5 h-5 rounded-[5px] flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--color-primary)' }}
      >
        <svg
          viewBox="0 0 24 24"
          width={13}
          height={13}
          fill="none"
          stroke="white"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-95"
        >
          <path d="M4 20V8l8-5 8 5v12M9 20v-6h6v6" />
        </svg>
      </div>

      {/* Wordmark: Novacampus (display/Instrument) + Alliance (body/Geist, smaller) */}
      <div className="flex flex-col leading-[0.85] -space-y-px">
        <span
          className="text-[13px] font-semibold tracking-[-0.015em] text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Novacampus
        </span>
        <span
          className="text-[9px] text-[var(--color-text-muted)] tracking-[0.01em]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Alliance
        </span>
      </div>
    </Link>
  );
}
