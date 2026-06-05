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

  // Role-specific pages based on Deliverable1 mockups (sidebars per persona/role).
  // Privacy and Accessibility are public static pages (footer), not role menu items.
  // Settings always 2nd-to-last, Logout always last.
  const getRoleMenuItems = () => {
    const items = [
      { label: translate('myDashboard') || 'My Dashboard', href: dashboardHref },
    ];

    if (role === 'student') {
      items.push(
        { label: translate('timetable') || 'Timetable', href: '/dashboard/student/timetable' },
        { label: translate('grades') || 'Grades & Evaluations', href: '/dashboard/student/grades' },
        { label: translate('absences') || 'Absences', href: '/dashboard/student/absences' },
        { label: translate('academicHistory') || 'Academic History', href: '/dashboard/student/history' },
        { label: translate('payments') || 'Payments', href: '/dashboard/student/payments' }
      );
    } else if (role === 'teacher') {
      items.push(
        { label: translate('myCourses') || 'My Courses', href: '/dashboard/teacher/courses' },
        { label: translate('gradeEntry') || 'Grade Entry', href: '/dashboard/teacher/grades' },
        { label: translate('attendance') || 'Attendance & Absences', href: '/dashboard/teacher/attendance' },
        { label: translate('roomReservations') || 'Room Reservations', href: '/dashboard/teacher/rooms' },
        { label: translate('studentHistory') || 'Student History', href: '/dashboard/teacher/history' }
      );
    } else if (role === 'admin') {
      items.push(
        { label: translate('studentsEnrollments') || 'Students & Enrollments', href: '/dashboard/admin/students' },
        { label: translate('planningConflicts') || 'Planning & Conflicts', href: '/dashboard/admin/planning' },
        { label: translate('paymentsScolarite') || 'Payments & Tuition', href: '/dashboard/admin/finance' }
      );
    } else if (role === 'executive') {
      items.push(
        { label: translate('campusIndicators') || 'Campus Indicators', href: '/dashboard/executive/indicators' },
        { label: translate('programIndicators') || 'Program Indicators', href: '/dashboard/executive/programs' },
        { label: translate('strategicReports') || 'Strategic Reports', href: '/dashboard/executive/reports' },
        { label: translate('campusComparison') || 'Campus Comparison', href: '/dashboard/executive/comparison' }
      );
    }

    // Settings 2nd-to-last for all roles
    items.push({ label: translate('settings') || 'Settings', href: '/settings' });
    // Logout always absolutely last
    items.push({ label: translate('logout') || 'Logout', href: '#', isLogout: true });

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
