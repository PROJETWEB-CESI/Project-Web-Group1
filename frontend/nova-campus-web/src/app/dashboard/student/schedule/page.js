'use client';

import { useStudentDashboardData } from '@/context/StudentDashboardContext';
import ScheduleTab from '@/components/student/ScheduleTab';

export default function StudentSchedulePage() {
  const { timetables } = useStudentDashboardData();

  return <ScheduleTab timetables={timetables} />;
}
