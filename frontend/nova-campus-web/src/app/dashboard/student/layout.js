'use client';

import { StudentDashboardProvider } from '@/context/StudentDashboardContext';

export default function StudentDashboardLayout({ children }) {
  return (
    <StudentDashboardProvider>
      {children}
    </StudentDashboardProvider>
  );
}
