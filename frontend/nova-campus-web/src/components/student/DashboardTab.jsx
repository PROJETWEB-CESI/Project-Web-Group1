'use client';

import GradeEvolutionChart from './GradeEvolutionChart';
import WeekSchedule from './WeekSchedule';
import { useLanguage } from '@/context/LanguageContext';

const DAY_MAP = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function getNextCourse(timetables) {
  if (!timetables?.length) return null;
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let best = null;
  let bestMinutesAway = Infinity;
  for (const t of timetables) {
    const tDay = DAY_MAP[t.day_of_week];
    if (tDay === undefined) continue;
    const [sh, sm] = (t.start_time || '00:00').split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    let daysAway = (tDay - currentDay + 7) % 7;
    if (daysAway === 0 && startMinutes <= currentMinutes) daysAway = 7;
    const minutesAway = daysAway * 24 * 60 + startMinutes - currentMinutes;
    if (minutesAway < bestMinutesAway) { bestMinutesAway = minutesAway; best = { ...t, minutesAway, daysAway }; }
  }
  return best;
}

function courseInitials(name, id) {
  const s = name || id || '?';
  const words = s.split(' ').filter(Boolean);
  return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : s.slice(0, 2).toUpperCase();
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconStar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
);

const IconUserCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCreditCard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);

const IconTrophy = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
  </svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconPin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

export default function DashboardTab({ studentProfile, kpis, timetables, semesterAverages }) {
  const { translate } = useLanguage();
  const nextCourse = getNextCourse(timetables);
  const roomChanged = nextCourse?.status && nextCourse.status !== 'Active';

  const formatTimeUntil = (min) => {
    if (min < 60)          return translate('inMin',  { n: min });
    if (min < 24 * 60)     return translate('inH',    { n: Math.floor(min / 60) });
    if (min < 2 * 24 * 60) return translate('tomorrow');
    return translate('inDays', { n: Math.floor(min / (24 * 60)) });
  };

  const avg = kpis.average;
  const att = kpis.attendanceRate;
  const attGood = att !== null && att >= 80;

  const kpiCards = [
    {
      label: `${translate('kpiAverage')} ${kpis.currentSemesterLabel || ''}`.trim(),
      value: avg !== null ? avg.toFixed(1).replace('.', ',') : '—',
      suffix: avg !== null ? '/20' : null,
      icon: <IconStar />,
      accent: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10',
      valueColor: '',
    },
    {
      label: translate('kpiAttendanceRate'),
      value: att !== null ? `${att}%` : '—',
      suffix: null,
      icon: <IconUserCheck />,
      accent: attGood ? 'text-[var(--color-success)] bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)]' : att !== null ? 'text-[var(--color-error)] bg-[color-mix(in_oklch,var(--color-error)_10%,transparent)]' : 'text-[var(--color-text-muted)] bg-[var(--color-surface)]',
      valueColor: att !== null ? (attGood ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]') : '',
    },
    {
      label: translate('kpiTuitionFees'),
      value: kpis.tuition !== null ? `${kpis.tuition.toLocaleString('fr-FR')} €` : '—',
      suffix: null,
      icon: <IconCreditCard />,
      accent: 'text-[var(--color-course-2)] bg-[var(--color-course-2-soft)]',
      valueColor: '',
    },
    {
      label: `${translate('kpiCredits')} ${kpis.currentSemesterLabel || ''}`.trim(),
      value: kpis.credits !== null ? kpis.credits : '—',
      suffix: kpis.totalCredits > 0 ? `/${kpis.totalCredits}` : null,
      icon: <IconTrophy />,
      accent: 'text-[var(--color-course-7)] bg-[var(--color-course-7-soft)]',
      valueColor: '',
    },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
          {studentProfile ? `${translate('hello', { name: studentProfile.firstName })} 👋` : null}
        </h1>
        {studentProfile?.program?.programName && studentProfile?.campus?.campusName && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              {studentProfile.program.programName}
            </span>
            <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
              {studentProfile.campus.campusName}
            </span>
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {kpiCards.map(({ label, value, suffix, icon, accent, valueColor }) => (
          <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider leading-tight">{label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
                {icon}
              </span>
            </div>
            <div className={`text-3xl font-bold text-[var(--color-text)] ${valueColor}`}>
              {value}
              {suffix && <span className="text-base font-semibold align-super">{suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Next course */}
      {nextCourse && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <IconClock />
              <span className="text-sm font-medium text-[var(--color-text)]">{translate('nextCourse')}</span>
            </div>
            <div className="flex items-center gap-2">
              {roomChanged && (
                <span className="text-xs font-medium text-[var(--color-course-2)] bg-[var(--color-course-2-soft)] border border-[color-mix(in_oklch,var(--color-course-2)_20%,transparent)] rounded-full px-2.5 py-1">
                  ⚠ {translate('roomChanged')}
                </span>
              )}
              <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-full px-3 py-1">
                {formatTimeUntil(nextCourse.minutesAway)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-primary)] select-none">
              {courseInitials(nextCourse.course?.course_name, nextCourse.course_id)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--color-text)] truncate text-base">
                {nextCourse.course?.course_name || nextCourse.course_id}
                <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">({nextCourse.course_id})</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                  <IconClock />
                  {(nextCourse.start_time || '').slice(0, 5)} – {(nextCourse.end_time || '').slice(0, 5)}
                </span>
                {nextCourse.room && (
                  <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 border ${
                    roomChanged
                      ? 'bg-[var(--color-course-2-soft)] border-[color-mix(in_oklch,var(--color-course-2)_20%,transparent)] text-[var(--color-course-2)]'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                  }`}>
                    <IconPin />
                    {nextCourse.room.room_name || nextCourse.room_id}
                  </span>
                )}
                {nextCourse.instructor && (
                  <span className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                    {translate('profAbbrev')} {nextCourse.instructor.first_name} {nextCourse.instructor.last_name}
                  </span>
                )}
                {nextCourse.course?.course_type && (
                  <span className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                    {nextCourse.course.course_type}
                  </span>
                )}
                {nextCourse.course?.credits && (
                  <span className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                    {nextCourse.course.credits} ECTS
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <WeekSchedule timetables={timetables} />

      <div className="mt-6">
        <GradeEvolutionChart data={semesterAverages} />
      </div>
    </div>
  );
}
