'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function ProfileMenu() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { translate } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  if (loading || !isAuthenticated || !user) {
    return null;
  }

  const role = (user.role || 'student').toLowerCase();
  const dashboardHref = `/dashboard/${role}`;

  const iconClass = "w-[18px] h-[18px] mr-2.5 text-[var(--color-text-muted)] flex-shrink-0";

  // Role-specific pages based on Deliverable1 mockups (sidebars per persona/role).
  // Privacy and Accessibility are public static pages (footer), not role menu items.
  // Settings always 2nd-to-last, Logout always last.
  // Visual style matches reference: small left icon + label, no underline, logout red.
  const getRoleMenuItems = () => {
    const items = [
      {
        label: translate('myDashboard') || 'My Dashboard',
        href: dashboardHref,
        icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0v5" />
          </svg>
        ),
      },
    ];

    if (role === 'student') {
      items.push(
        { label: translate('timetable') || 'Timetable', href: '/dashboard/student/timetable', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ) },
        { label: translate('grades') || 'Grades & Evaluations', href: '/dashboard/student/grades', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h5.25" />
          </svg>
        ) },
        { label: translate('absences') || 'Absences', href: '/dashboard/student/absences', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ) },
        { label: translate('academicHistory') || 'Academic History', href: '/dashboard/student/history', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ) },
        { label: translate('payments') || 'Payments', href: '/dashboard/student/payments', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ) }
      );
    } else if (role === 'teacher') {
      items.push(
        { label: translate('myCourses') || 'My Courses', href: '/dashboard/teacher/courses', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ) },
        { label: translate('gradeEntry') || 'Grade Entry', href: '/dashboard/teacher/grades', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ) },
        { label: translate('attendance') || 'Attendance & Absences', href: '/dashboard/teacher/attendance', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
          </svg>
        ) },
        { label: translate('roomReservations') || 'Room Reservations', href: '/dashboard/teacher/rooms', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ) },
        { label: translate('studentHistory') || 'Student History', href: '/dashboard/teacher/history', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ) }
      );
    } else if (role === 'admin') {
      items.push(
        { label: translate('studentsEnrollments') || 'Students & Enrollments', href: '/dashboard/admin/students', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 01-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ) },
        { label: translate('planningConflicts') || 'Planning & Conflicts', href: '/dashboard/admin/planning', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        ) },
        { label: translate('paymentsScolarite') || 'Payments & Tuition', href: '/dashboard/admin/finance', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ) }
      );
    } else if (role === 'executive') {
      items.push(
        { label: translate('campusIndicators') || 'Campus Indicators', href: '/dashboard/executive/indicators', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2-2m-2 12h.01" />
          </svg>
        ) },
        { label: translate('programIndicators') || 'Program Indicators', href: '/dashboard/executive/programs', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01-2-2m-2 12h.01" />
          </svg>
        ) },
        { label: translate('strategicReports') || 'Strategic Reports', href: '/dashboard/executive/reports', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ) },
        { label: translate('campusComparison') || 'Campus Comparison', href: '/dashboard/executive/comparison', icon: (
          <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        ) }
      );
    }

    // Settings 2nd-to-last for all roles
    items.push({
      label: translate('settings') || 'Settings',
      href: '/settings',
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 002.572 1.065c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-2.572-1.065c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    });
    // Logout always absolutely last (red)
    items.push({
      label: translate('logout') || 'Logout',
      href: '#',
      isLogout: true,
      icon: (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    });

    return items;
  };

  const menuItems = getRoleMenuItems();

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
    router.replace('/login');
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
              const content = (
                <span className="flex items-center">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              );

              if (item.isLogout) {
                return (
                  <button
                    key={index}
                    onClick={handleLogout}
                    className="block w-full px-3 py-1.5 text-left !text-[var(--color-error)] no-underline hover:bg-[var(--color-surface)] hover:!text-[var(--color-error)] focus:bg-[var(--color-surface)] focus:outline-none"
                    role="menuitem"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.href}
                  onClick={closeMenu}
                  className="block w-full px-3 py-1.5 text-left !text-[var(--color-text)] no-underline hover:bg-[var(--color-surface)] hover:!text-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                  role="menuitem"
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
