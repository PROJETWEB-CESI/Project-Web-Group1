'use client';

import { useStudentDashboardData } from '@/context/StudentDashboardContext';
import HistoryTab from '@/components/student/HistoryTab';

export default function StudentHistoryPage() {
  const { enrollments, studentProfile } = useStudentDashboardData();

  return <HistoryTab enrollments={enrollments} studentProfile={studentProfile} />;
}
