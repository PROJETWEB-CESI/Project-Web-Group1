'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  FolderOpen,
  CreditCard,
  Bell,
  Sparkles,
  User,
  HelpCircle,
  LogOut,
  Users,
  FileText,
  BarChart3,
  GraduationCap,
  Building,
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

export default function DashboardSidebar() {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const { translate } = useLanguage();
  const { notificationCount, clearNotifications } = useNotifications();
  const { apiFetch } = useApi();
  const pathname = usePathname();
  const router = useRouter();

  const [adminBadges, setAdminBadges] = useState({ planning: 0, finance: 0 });

  const role = (user?.role || 'student').toLowerCase();
  const campusId = user?.campusId;

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

  const iconClass = 'w-4 h-4 mr-2.5 flex-shrink-0';
  const activeClasses = 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-medium';
  // underline-offset-2 moves any underline (from global styles) 2px lower than default for the nav items in the sidebar
  const baseItemClasses = 'fakeLink flex items-center w-full px-3 py-2 rounded-md text-sm hover:bg-[var(--color-surface-hover)] transition-colors text-[var(--color-text)] underline-offset-2';

  const isActive = (item) => {
    if (!pathname) return false;
    const href = item.href || '';

    if (href === dashboardHref) return pathname === href || pathname === `/dashboard/${role}`;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    router.replace('/login');
  };

  const getSidebarConfig = () => {
    const spaceTitle = {
      student: translate('studentSpace') || 'Student Space',
      teacher: translate('teacherSpace') || 'Teacher Space',
      admin: translate('adminSpace') || 'Campus Oversight',
      executive: translate('executiveSpace') || 'Executive Direction',
    }[role] || translate('studentSpace');

    const toolsLabel = translate('tools') || 'Tools';
    const ariaLabel = translate('assistantAria') || 'Aria Assistant (AI)';
    const profileLabel = translate('profile') || 'Profile';
    const helpLabel = translate('helpCenter') || 'Help Center';

    let mainItems = [];
    let toolsItems = [];

    if (role === 'student') {
      mainItems = [
        { label: translate('myDashboard') || 'My Dashboard', href: dashboardHref, icon: Home },
        { label: translate('schedule') || 'Schedule', href: '/dashboard/student/schedule', icon: Calendar },
        { label: translate('grades') || 'Grades', href: '/dashboard/student/grades', icon: BookOpen },
        { label: translate('absences') || 'Absences', href: '/dashboard/student/absences', icon: AlertCircle },
        { label: translate('academicHistory') || 'Academic History', href: '/dashboard/student/history', icon: FolderOpen },
        { label: translate('payments') || 'Payments', href: '/dashboard/student/payment', icon: CreditCard },
        // Live badge (functional + updates without page refresh)
        { label: translate('notifications') || 'Notifications', href: '/dashboard/student/notifications', icon: Bell, isLiveBadge: true },
      ];
      toolsItems = [
        { label: ariaLabel, href: '/dashboard/assistant', icon: Sparkles }, // fake references real /aria/ while inside dashboard shell
        { label: profileLabel, href: '/dashboard/profile', icon: User },
      ];
    } else if (role === 'teacher') {
      mainItems = [
        { label: translate('myDashboard') || 'My Dashboard', href: dashboardHref, icon: Home },
        { label: translate('schedule') || 'Schedule', href: '/dashboard/teacher/schedule', icon: Calendar },
        { label: translate('myCourses') || 'My Courses', href: '/dashboard/teacher/courses', icon: BookOpen },
        { label: translate('gradeEntry') || 'Grade Entry', href: '/dashboard/teacher/grades', icon: FileText },
        { label: translate('attendance') || 'Attendance & Absences', href: '/dashboard/teacher/attendance', icon: Users },
        { label: translate('roomReservations') || 'Room Reservations', href: '/dashboard/teacher/rooms', icon: Building },
      ];
      toolsItems = [
        { label: ariaLabel, href: '/dashboard/assistant', icon: Sparkles },
        { label: profileLabel, href: '/dashboard/profile', icon: User },
      ];
    } else if (role === 'admin') {
      mainItems = [
        { label: translate('myDashboard') || 'My Dashboard', href: dashboardHref, icon: Home },
        { label: translate('studentsEnrollments') || 'Students & Enrollments', href: '/dashboard/admin/students', icon: Users },
        { label: translate('planningConflicts') || 'Planning & Conflicts', href: '/dashboard/admin/planning', icon: Calendar, badge: adminBadges.planning },
        { label: translate('paymentsScolarite') || 'Payments & Tuition', href: '/dashboard/admin/finance', icon: CreditCard, badge: adminBadges.finance },
      ];
      toolsItems = [
        { label: ariaLabel, href: '/dashboard/assistant', icon: Sparkles },
        { label: profileLabel, href: '/dashboard/profile', icon: User },
      ];
    } else if (role === 'executive') {
      mainItems = [
        { label: translate('myDashboard') || 'My Dashboard', href: dashboardHref, icon: Home },
        { label: translate('campusIndicators') || 'Campus Indicators', href: '/dashboard/executive/indicators', icon: BarChart3 },
        { label: translate('programIndicators') || 'Programs Indicators', href: '/dashboard/executive/programs', icon: GraduationCap },
        { label: translate('strategicReports') || 'Strategic Reports', href: '/dashboard/executive/reports', icon: FileText },
      ];
      toolsItems = [
        { label: ariaLabel, href: '/dashboard/assistant', icon: Sparkles },
        { label: profileLabel, href: '/dashboard/profile', icon: User },
      ];
    }

    return { spaceTitle, mainItems, toolsItems, helpLabel };
  };

  const { spaceTitle, mainItems, toolsItems, helpLabel } = getSidebarConfig();

  const renderNavItem = (item, isTool = false) => {
    const active = isActive(item);
    const Icon = item.icon;

    // Live notification count (replaces static badge). Functional: clicking the item clears it (as if viewed).
    // Updates live via context (no page refresh needed). Number uses --color-on-primary per spec.
    const liveBadge = item.isLiveBadge ? notificationCount : null;
    const badgeValue = liveBadge ?? item.badge ?? 0;
    const showBadge = badgeValue > 0;

    const content = (
      <>
        <Icon className={`${iconClass} ${active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`} />
        <span className={`{'flex-1 truncate'} ${active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}`}>{item.label}</span>
        {showBadge && (
          <span className="ml-auto text-[12px] leading-none px-2 py-1 rounded-full bg-[var(--color-error)] text-[var(--color-on-primary)] font-medium">
            {badgeValue}
          </span>
        )}
      </>
    );

    const classes = `${baseItemClasses} ${active ? activeClasses : ''}`;

    // For the live notifications entry: clear the count on click (functional "mark as viewed").
    const handleClick = item.isLiveBadge
      ? () => {
          clearNotifications();
        }
      : undefined;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={handleClick}
        className={classes}
        aria-current={active ? 'page' : undefined}
      >
        {content}
      </Link>
    );
  };

  const initials = (user.firstName?.[0] || user.lastName?.[0] || 'U').toUpperCase();

  return (
    <div className="flex flex-col h-full text-sm">
      {/* User card (matches mockup sidebar header) */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-[var(--color-border)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-sm font-semibold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-[var(--color-text)] truncate">
            {user.firstName} {user.lastName}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] capitalize truncate">
            {role}
          </div>
        </div>
      </div>

      {/* Role space header */}
      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">
        {spaceTitle}
      </div>

      {/* Main navigation */}
      <nav className="px-1.5 space-y-0.5">
        {mainItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Outils section */}
      <div className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-[0.5px] text-[var(--color-text-muted)] uppercase">
        {translate('tools') || 'Tools'}
      </div>
      <nav className="px-1.5 space-y-0.5 pb-2">
        {toolsItems.map((item) => renderNavItem(item, true))}
      </nav>

      {/* Bottom actions (always visible, pushed to bottom) */}
      <div className="mt-auto px-1.5 py-2 border-t border-[var(--color-border)] space-y-0.5">
        <Link
          href="/help"
          className={`${baseItemClasses} text-[var(--color-text-muted)] hover:text-[var(--color-text)]`}
        >
          <HelpCircle className={`${iconClass} text-[var(--color-text-muted)]`} />
          <span>{helpLabel}</span>
        </Link>

        <button
          onClick={handleLogout}
          className={`${baseItemClasses} !text-[var(--color-error)] hover:bg-[var(--red-hoverlay)] hover:!text-[var(--color-error)]`}
        >
          <LogOut className={`${iconClass} text-[var(--color-error)]`} />
          <span>{translate('logout') || 'Logout'}</span>
        </button>
      </div>
    </div>
  );
}
