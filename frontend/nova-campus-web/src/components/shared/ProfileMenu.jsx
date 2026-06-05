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

  if (loading || !isAuthenticated || !user) {
    return null;
  }

  const role = (user.role || 'student').toLowerCase();
  const dashboardHref = `/dashboard/${role}`;

  const menuItems = [
    {
      label: translate('myDashboard') || 'My Dashboard',
      href: dashboardHref,
    },
    {
      label: translate('accessibility') || 'Accessibility',
      href: '/accessibility',
    },
    {
      label: translate('privacy') || 'Privacy',
      href: '/privacy',
    },
    // Settings is 2nd to last per spec
    {
      label: translate('settings') || 'Settings',
      href: '/settings',
    },
    // Logout is always last
    {
      label: translate('logout') || 'Logout',
      href: '#',
      isLogout: true,
    },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  const closeMenu = () => setIsOpen(false);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    closeMenu();
    await logout();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
        aria-label="Open user menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] py-1 shadow-lg z-[60] text-sm">
          {/* User info header */}
          <div className="px-4 py-2 border-b border-[var(--color-border)]">
            <div className="font-medium text-[var(--color-text)]">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] capitalize">
              {role}
            </div>
          </div>

          <nav className="py-1" role="menu">
            {menuItems.map((item, index) => {
              if (item.isLogout) {
                return (
                  <button
                    key={index}
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left !text-[var(--color-error)] no-underline hover:bg-[var(--color-surface)] hover:!text-[var(--color-error)] focus:bg-[var(--color-surface)] focus:outline-none"
                    role="menuitem"
                  >
                    {item.label}
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={closeMenu}
                  className="block w-full px-4 py-2 text-left !text-[var(--color-text)] no-underline hover:bg-[var(--color-surface)] hover:!text-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                  role="menuitem"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
