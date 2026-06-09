import React from 'react';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-full">
      {/* Left sidebar ~300px wide */}
      <aside className="w-[300px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border)]">
          <div className="font-semibold text-lg">Dashboard</div>
          <div className="text-sm text-[var(--color-text-muted)]">Navigation</div>
        </div>
        <nav className="flex-1 p-2 text-sm overflow-auto">
          <div className="px-3 py-2 rounded hover:bg-[var(--color-surface-hover)] cursor-pointer">Overview</div>
          <div className="px-3 py-2 rounded hover:bg-[var(--color-surface-hover)] cursor-pointer">Schedule</div>
          <div className="px-3 py-2 rounded hover:bg-[var(--color-surface-hover)] cursor-pointer">Reports</div>
          <div className="px-3 py-2 rounded hover:bg-[var(--color-surface-hover)] cursor-pointer">Settings</div>
        </nav>
        <div className="p-4 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
          Base sidebar (same for all users)
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-auto bg-[var(--color-bg)] p-6">
        {children}
      </main>
    </div>
  );
}
