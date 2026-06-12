'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useNotifications } from '@/context/NotificationContext';
import { useApi } from '@/lib/api';
import {
  Home,
  Calendar,
  BookOpen,
  AlertCircle,
  Users,
  CreditCard,
  Building,
  BarChart3,
  GraduationCap,
  FileText,
  Settings,
  LogOut,
  Bell,
  Sparkles,
  User,
  FolderOpen,
  HelpCircle,
} from 'lucide-react';

// Two timetable entries overlap if they share the same day/semester/year
// and their time ranges intersect
function timesOverlap(a, b) {
  return a.day_of_week === b.day_of_week
    && a.semester === b.semester
    && a.academic_year === b.academic_year
    && a.start_time < b.end_time
    && b.start_time < a.end_time;
}

// Counts room/instructor double-bookings among a campus's timetables
function countConflicts(timetables) {
  let count = 0;
  for (let i = 0; i < timetables.length; i++) {
    for (let j = i + 1; j < timetables.length; j++) {
      const a = timetables[i];
      const b = timetables[j];
      if (a.schedule_id === b.schedule_id) continue;
      if (!timesOverlap(a, b)) continue;
      if ((a.room_id && a.room_id === b.room_id) || (a.instructor_id && a.instructor_id === b.instructor_id)) count++;
    }
  }
  return count;
}

export default function ProfileMenu() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { translate } = useLanguage();
  const { notificationCount, clearNotifications } = useNotifications();
  const { apiFetch } = useApi();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [adminBadges, setAdminBadges] = useState({ planning: 0, finance: 0 });
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

  const role = (user?.role || 'student').toLowerCase();
  const campusId = user?.campusId;

  // Same live "Planning & Conflicts" / "Payments & Tuition" badges as the sidebar
  useEffect(() => {
    if (role !== 'admin' || !campusId) return;

    const fetchJson = async (url) => {
      try {
        const res = await apiFetch(url);
        return res.ok ? await res.json() : null;
      } catch {
        return null;
      }
    };

    Promise.all([
      fetchJson(`/api/payments/stats?campusId=${campusId}`),
      fetchJson(`/api/rooms?campus_id=${campusId}`),
      fetchJson(`/api/timetables/`),
    ]).then(([billingStats, rooms, timetables]) => {
      const finance = billingStats?.overdueCount ?? 0;
      let planning = 0;
      if (Array.isArray(rooms) && Array.isArray(timetables)) {
        const roomIds = new Set(rooms.map((r) => r.room_id));
        planning = countConflicts(timetables.filter((t) => roomIds.has(t.room_id)));
      }
      setAdminBadges({ planning, finance });
    });
  }, [role, campusId]);

  if (loading || !isAuthenticated || !user) {
    return null;
  }

  const dashboardHref = `/dashboard/${role}`;

  const isActive = (item) => {
    if (!pathname || !item.href || item.href === '#') return false;

    if (item.href === dashboardHref) return pathname === item.href || pathname === `/dashboard/${role}`;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

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
        { label: translate('schedule') || 'Schedule', href: '/dashboard/student/schedule', icon: <Calendar className={iconClass} /> },
        { label: translate('grades') || 'Grades & Evaluations', href: '/dashboard/student/grades', icon: <BookOpen className={iconClass} /> },
        { label: translate('absences') || 'Absences', href: '/dashboard/student/absences', icon: <AlertCircle className={iconClass} /> },
        { label: translate('academicHistory') || 'Academic History', href: '/dashboard/student/history', icon: <FolderOpen className={iconClass} /> },
        { label: translate('payments') || 'Payments', href: '/dashboard/student/payment', icon: <CreditCard className={iconClass} /> },
        { label: translate('notifications') || 'Notifications', href: '/dashboard/student/notifications', icon: <Bell className={iconClass} />, isLiveBadge: true }
      );
    } else if (role === 'teacher') {
      items.push(
        { label: translate('schedule') || 'Schedule', href: '/dashboard/teacher/schedule', icon: <Calendar className={iconClass} /> },
        { label: translate('myCourses') || 'My Courses', href: '/dashboard/teacher/courses', icon: <BookOpen className={iconClass} /> },
        { label: translate('gradeEntry') || 'Grade Entry', href: '/dashboard/teacher/grades', icon: <FileText className={iconClass} /> },
        { label: translate('attendance') || 'Attendance & Absences', href: '/dashboard/teacher/attendance', icon: <Users className={iconClass} /> },
        { label: translate('roomReservations') || 'Room Reservations', href: '/dashboard/teacher/rooms', icon: <Building className={iconClass} /> }
      );
    } else if (role === 'admin') {
      items.push(
        { label: translate('studentsEnrollments') || 'Students & Enrollments', href: '/dashboard/admin/students', icon: <Users className={iconClass} /> },
        { label: translate('planningConflicts') || 'Planning & Conflicts', href: '/dashboard/admin/planning', icon: <Calendar className={iconClass} />, badge: adminBadges.planning },
        { label: translate('paymentsScolarite') || 'Payments & Tuition', href: '/dashboard/admin/finance', icon: <CreditCard className={iconClass} />, badge: adminBadges.finance }
      );
    } else if (role === 'executive') {
      items.push(
        { label: translate('campusIndicators') || 'Campus Indicators', href: '/dashboard/executive/indicators', icon: <BarChart3 className={iconClass} /> },
        { label: translate('programIndicators') || 'Programs Indicators', href: '/dashboard/executive/programs', icon: <GraduationCap className={iconClass} /> },
        { label: translate('strategicReports') || 'Strategic Reports', href: '/dashboard/executive/reports', icon: <FileText className={iconClass} /> }
      );
    }

    // Tools / Aria + Profile (from mockup OUTILS section, merged profile/settings into one under dashboard layout) — before Logout
    items.push(
      { label: translate('assistantAria') || 'Aria Assistant (AI)', href: '/dashboard/assistant', icon: <Sparkles className={iconClass} />, dividerBefore: true },
      { label: translate('profile') || 'Profile', href: '/dashboard/profile', icon: <User className={iconClass} /> }
    );
    
    // Help center above Logout
    items.push(
      { label: translate('helpCenter') || 'Help Center', href: '/help', icon: <HelpCircle className={iconClass} />, dividerBefore: true }
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
        <div className="absolute overflow-auto right-0 mt-2 w-56 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] p-1 shadow-lg z-[60] text-sm">
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
              const active = isActive(item);

              // Live notification count (student) or live conflict/overdue counts (admin),
              // matching the sidebar's badge behavior.
              const liveBadge = item.isLiveBadge ? notificationCount : null;
              const showBadge = (item.badge || liveBadge) && (liveBadge ?? item.badge) > 0;
              const badgeValue = liveBadge ?? item.badge;

              const content = (
                <span className="flex items-center w-full">
                  {item.icon}
                  <span className="flex-1 truncate">{item.label}</span>
                  {showBadge && (
                    <span className="ml-2 text-[12px] leading-none px-2 py-1 rounded-full bg-[var(--color-error)] text-[var(--color-on-primary)] font-medium">
                      {badgeValue}
                    </span>
                  )}
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
                    className={`fakeLink block w-full rounded-md px-3 py-1.5 text-left hover:bg-[var(--color-surface-hover)] focus:bg-[var(--color-surface)] focus:outline-none ${
                      active
                        ? 'bg-[var(--color-primary-soft)] !text-[var(--color-text)] font-medium'
                        : '!text-[var(--color-text-muted)] hover:!text-[var(--color-link-hover)]'
                    }`}
                    role="menuitem"
                    aria-current={active ? 'page' : undefined}
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
