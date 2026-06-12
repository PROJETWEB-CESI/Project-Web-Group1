'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function TeacherKpiCards({ loading, weeklyCoursesCount, studentsCount, avgAttendanceRate, specialty, department, campusName }) {
  const { translate } = useLanguage();
  const dash = '—';

  const cards = [
    {
      key: 'courses',
      label: translate('kpiCoursesPerWeek'),
      accent: 'text-blue-600 bg-blue-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      ),
    },
    {
      key: 'students',
      label: translate('kpiStudentsSupervised'),
      accent: 'text-violet-600 bg-violet-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      key: 'attendance',
      label: translate('kpiAvgAttendance'),
      accent: 'text-emerald-600 bg-emerald-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      key: 'specialty',
      label: translate('kpiSpecialty'),
      accent: 'text-amber-600 bg-amber-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      ),
    },
  ];

  const values = {
    courses:    loading ? null : weeklyCoursesCount,
    students:   loading ? null : studentsCount,
    attendance: loading ? null : avgAttendanceRate,
    specialty,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map(({ key, label, accent, icon }) => (
        <div
          key={key}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
              {icon}
            </span>
          </div>

          {key === 'specialty' ? (
            specialty ? (
              <div>
                <div className="text-lg font-bold text-[var(--color-text)] leading-tight">{specialty}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {[department ? translate('kpiDept', { name: department }) : null, campusName].filter(Boolean).join(' · ')}
                </div>
              </div>
            ) : (
              <div className="text-3xl font-bold text-[var(--color-text)]">{dash}</div>
            )
          ) : (
            <div className="text-3xl font-bold text-[var(--color-text)]">
              {values[key] == null ? dash : key === 'attendance' ? `${values[key]}%` : values[key]}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
