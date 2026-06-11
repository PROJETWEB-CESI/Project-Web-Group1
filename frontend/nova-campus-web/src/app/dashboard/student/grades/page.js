'use client';

import { useStudentDashboardData } from '@/context/StudentDashboardContext';
import GradesTab from '@/components/student/GradesTab';

export default function StudentGradesPage() {
  const { user, gradesData, enrollments, kpis, gradeStats, studentProfile } = useStudentDashboardData();

  return (
    <GradesTab
      gradesData={gradesData}
      enrollments={enrollments}
      kpis={kpis}
      gradeStats={gradeStats}
      studentId={user?.studentId}
      campusId={user?.campusId}
      programName={studentProfile?.program?.programName}
    />
  );
}
