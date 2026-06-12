'use client';

import { useStudentDashboardData } from '@/context/StudentDashboardContext';
import DashboardTab from '@/components/student/DashboardTab';

export default function StudentDashboard() {
  const { studentProfile, kpis, timetables, semesterAverages } = useStudentDashboardData();

  return (
    <DashboardTab
      studentProfile={studentProfile}
      kpis={kpis}
      timetables={timetables}
      semesterAverages={semesterAverages}
    />
  );
}
