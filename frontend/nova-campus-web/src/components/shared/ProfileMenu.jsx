'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';
import {
  Home,
  Calendar,
  BookOpen,
  AlertCircle,
  Users,
  CreditCard,
  Building,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Bell,
  Sparkles,
  User,
  FolderOpen,
  HelpCircle,
} from 'lucide-react';

export default function ProfileMenu() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { translate } = useLanguage();
  const { clearNotifications } = useNotifications();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Close on outside click - must be called unconditionally (before any early returns)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeMenu]);

  if (loading || !isAuthenticated || !user) {
    return null;
  }

  const role = (user.role || 'student').toLowerCase();
  const dashboardHref = `/dashboard/${role}`;

  const iconClass = "w-4 h-4 mr-2 flex-shrink-0 text-[var(--color-text-muted)]";

  // Role-specific pages + tools based on Deliverable1 mockups (sidebars + profile menu per persona/role).
  // Includes main nav, Aria assistant, Profile (outils), Settings, and Logout last.
  // Privacy and Accessibility are public static pages (footer), not role menu items.
  // Icons from lucide-react. Menu links have no underline.
  const getRoleMenuItems = () => {
    const items = [
      {
        label: translate('myDashboard') || 'My Dashboard',
        href: dashboardHref,
        icon: <Home className={iconClass} />,
      },
    ];

    if (role === 'student') {
      items.push(
        { label: translate('timetable') || 'Timetable', href: '/dashboard/student?tab=schedule', icon: <Calendar className={iconClass} /> },
        { label: translate('grades') || 'Grades & Evaluations', href: '/dashboard/student?tab=grades', icon: <BookOpen className={iconClass} /> },
        { label: translate('absences') || 'Absences', href: '/dashboard/student?tab=absences', icon: <AlertCircle className={iconClass} /> },
        { label: translate('academicHistory') || 'Academic History', href: '/dashboard/student?tab=history', icon: <FolderOpen className={iconClass} /> },
        { label: translate('payments') || 'Payments', href: '/dashboard/student?tab=payment', icon: <CreditCard className={iconClass} /> },
        { label: translate('notifications') || 'Notifications', href: '/dashboard/student?tab=notifications', icon: <Bell className={iconClass} /> }
      );
    } else if (role === 'teacher') {
      items.push(
        { label: translate('myCourses') || 'My Courses', href: '/dashboard/teacher/courses', icon: <BookOpen className={iconClass} /> },
        { label: translate('gradeEntry') || 'Grade Entry', href: '/dashboard/teacher/grades', icon: <FileText className={iconClass} /> },
        { label: translate('attendance') || 'Attendance & Absences', href: '/dashboard/teacher/attendance', icon: <Users className={iconClass} /> },
        { label: translate('roomReservations') || 'Room Reservations', href: '/dashboard/teacher/rooms', icon: <Building className={iconClass} /> },
        { label: translate('studentHistory') || 'Student History', href: '/dashboard/teacher/history', icon: <Users className={iconClass} /> }
      );
    } else if (role === 'admin') {
      items.push(
        { label: translate('studentsEnrollments') || 'Students & Enrollments', href: '/dashboard/admin/students', icon: <Users className={iconClass} /> },
        { label: translate('planningConflicts') || 'Planning & Conflicts', href: '/dashboard/admin/planning', icon: <Calendar className={iconClass} /> },
        { label: translate('paymentsScolarite') || 'Payments & Tuition', href: '/dashboard/admin/finance', icon: <CreditCard className={iconClass} /> }
      );
    } else if (role === 'executive') {
      items.push(
        { label: translate('campusIndicators') || 'Campus Indicators', href: '/dashboard/executive/indicators', icon: <BarChart3 className={iconClass} /> },
        { label: translate('programIndicators') || 'Program Indicators', href: '/dashboard/executive/programs', icon: <BarChart3 className={iconClass} /> },
        { label: translate('strategicReports') || 'Strategic Reports', href: '/dashboard/executive/reports', icon: <FileText className={iconClass} /> },
        { label: translate('campusComparison') || 'Campus Comparison', href: '/dashboard/executive/comparison', icon: <BarChart3 className={iconClass} /> }
      );
    }

    // Tools / Aria + Profile (from mockup OUTILS section, merged profile/settings into one under dashboard layout) — before Logout
    items.push(
      { label: translate('assistantAria') || 'Aria Assistant (AI)', href: '/dashboard/assistant', icon: <Sparkles className={iconClass} />, dividerBefore: true },
      { label: translate('profile') || 'Profile', href: '/dashboard/profile', icon: <User className={iconClass} /> }
    );
    
    // Help center above Logout
    items.push(
      { label: translate('helpCenter') || 'Help Center', href: '/dashboard/help', icon: <HelpCircle className={iconClass} />, dividerBefore: true }
    );
    
    // Logout always absolutely last (red)
    items.push({
      label: translate('logout') || 'Logout',
      href: '#',
      isLogout: true,
      icon: <LogOut className={`${iconClass} stroke-[var(--color-error)]`} />,
      className: '!text-[var(--color-error)] hover:!bg-[var(--red-hoverlay)] hover:!text-[var(--color-error)]',
    });

    return items;
  };

  const menuItems = getRoleMenuItems();

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
        <div className="absolute right-0 mt-2 w-56 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] p-1 shadow-lg z-[60] text-sm">
          {/* User info header */}
          <div className="px-4 py-2 border-b border-[var(--color-border)]">
            <div className="font-medium text-[var(--color-text)]">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] capitalize">
              {role}
            </div>
          </div>

          <nav className="pt-1 space-y-0.5" role="menu">
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
                    // underline-offset-2 moves the underline (global + any hover) 2px lower than default. Only applied in ProfileMenu and Sidebar.
                    className="block w-full rounded-md px-3 py-1.5 text-left !text-[var(--color-error)] underline-offset-2 hover:!bg-[var(--red-hoverlay)] hover:!text-[var(--color-error)] focus:bg-[var(--color-surface)] focus:outline-none"
                    role="menuitem"
                  >
                    {content}
                  </button>
                );
              }

              return (
                <>
                  {item.dividerBefore && index > 0 && (
                    <hr key={`divider-${index}`} className="my-1 border-[var(--color-border)] mx-3" />
                  )}
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => {
                      // Clear live notification badge (if this is the notifications entry) — works from dropdown too.
                      if (item.label.toLowerCase().includes('notification') || item.href.includes('/notifications')) {
                        clearNotifications();
                      }
                      closeMenu();
                    }}
                    // underline-offset-2 moves the underline (global + any hover) 2px lower than default. Only applied in ProfileMenu and Sidebar.
                    className="fakeLink block w-full rounded-md px-3 py-1.5 text-left !text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] hover:!text-[var(--color-link-hover)] focus:bg-[var(--color-surface)] focus:outline-none"
                    role="menuitem"
                  >
                    {content}
                  </Link>
                </>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
