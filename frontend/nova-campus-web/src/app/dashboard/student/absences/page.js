'use client';

import { useStudentDashboardData } from '@/context/StudentDashboardContext';
import AbsencesTab from '@/components/student/AbsencesTab';

export default function StudentAbsencesPage() {
  const { absences, timetables, attStats, studentProfile, kpis, justifyAbsence } = useStudentDashboardData();

  return (
    <AbsencesTab
      absences={absences}
      timetables={timetables}
      attStats={attStats}
      studentProfile={studentProfile}
      kpis={kpis}
      justifyAbsence={justifyAbsence}
    />
  );
}
