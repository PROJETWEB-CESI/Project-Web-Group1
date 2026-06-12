'use client';

import { usePathname } from 'next/navigation';
import PullToRefresh from './PullToRefresh';

// Adds swipe-down-to-refresh to every page except the dashboard, which
// manages its own scroll area and pull-to-refresh inside DashboardLayout.
export default function PullToRefreshShell({ children }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/dashboard')) {
    return children;
  }

  return (
    <PullToRefresh className="flex-1 flex flex-col min-h-0">
      {children}
    </PullToRefresh>
  );
}
