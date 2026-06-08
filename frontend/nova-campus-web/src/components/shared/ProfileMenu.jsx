'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfileMenu() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { translate } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // ALL hooks must be called before any early return
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  if (loading || !isAuthenticated || !user) return null;

  const role = (user.role || 'student').toLowerCase();

  const items = [
    { label: 'Assistant Aria (IA)', href: '/aria' },
    { label: translate('accessibility') || 'Accessibility', href: '/accessibility' },
    { label: translate('privacy') || 'Privacy', href: '/privacy' },
    { label: translate('settings') || 'Settings', href: '/settings' },
  ];

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsOpen(false);
    await logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
        aria-label="Open user menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1 shadow-lg z-[60] text-sm">
          <div className="px-4 py-2 border-b border-[var(--color-border)]">
            <p className="font-medium text-[var(--color-text)]">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-[var(--color-text-muted)] capitalize">{role}</p>
          </div>
          <nav role="menu" className="py-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center px-4 py-2 text-[var(--color-text)] hover:bg-[var(--color-surface)] focus:outline-none"
                role="menuitem"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-2 text-left text-[var(--color-error)] hover:bg-[var(--color-surface)] focus:outline-none"
              role="menuitem"
            >
              {translate('logout') || 'Logout'}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
