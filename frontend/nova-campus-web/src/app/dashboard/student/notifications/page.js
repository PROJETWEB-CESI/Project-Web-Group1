'use client';

import { useStudentDashboardData } from '@/context/StudentDashboardContext';
import NotificationsTab from '@/components/student/NotificationsTab';

export default function StudentNotificationsPage() {
  const { notifs, markNotifRead, markAllRead } = useStudentDashboardData();

  return <NotificationsTab notifs={notifs} markNotifRead={markNotifRead} markAllRead={markAllRead} />;
}
