'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function BaseDashboardPage() {
  const { user } = useAuth();
  const role = (user?.role || 'student').toLowerCase();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Dashboard</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Shared layout shell (header + sidebar + main). The left sidebar is now role-aware and matches the mockups (sections, icons, badges, bottom logout + help).
      </p>

      <div className="p-4 border border-[var(--color-border)] rounded bg-[var(--color-bg-elev)] max-w-md">
        <p className="text-sm">Your role: <span className="font-medium capitalize">{role}</span></p>
        <p className="text-sm mt-1">Go to your home via sidebar or <Link href={`/dashboard/${role}`} className="underline">direct link</Link>.</p>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">Other nav items (timetable, grades, etc.) point to paths that will need dedicated pages matching the mockup views.</p>
      </div>
    </>
  );
}
