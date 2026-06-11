'use client';

import GradeEvolutionChart from './GradeEvolutionChart';
import WeekSchedule from './WeekSchedule';
import { useLanguage } from '@/context/LanguageContext';

const DAY_MAP = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

function getNextCourse(timetables) {
  if (!timetables || !timetables.length) return null;
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
    if (minutesAway < bestMinutesAway) {
      bestMinutesAway = minutesAway;
      best = { ...t, minutesAway, daysAway };
    }
  }
  return best;
}

export default function DashboardTab({ studentProfile, kpis, timetables, semesterAverages }) {
  const { translate } = useLanguage();
  const nextCourse = getNextCourse(timetables);
  const roomChanged = nextCourse?.status && nextCourse.status !== 'Active';

  const formatTimeUntil = (minutesAway) => {
    if (minutesAway < 60) return translate('inMin', { n: minutesAway });
    if (minutesAway < 24 * 60) return translate('inH', { n: Math.floor(minutesAway / 60) });
    if (minutesAway < 2 * 24 * 60) return translate('tomorrow');
    return translate('inDays', { n: Math.floor(minutesAway / (24 * 60)) });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        {studentProfile ? `${translate('hello', { name: studentProfile.firstName })} 👋` : null}
      </h1>
      {studentProfile?.program?.programName && studentProfile?.campus?.campusName && (
        <p className="text-[var(--color-text-muted)] mb-6">
          {studentProfile.program.programName} · {studentProfile.campus.campusName}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiAverage')} {kpis.currentSemesterLabel || '—'}</div>
          <div className="text-3xl font-semibold mt-1">
            {kpis.average !== null ? kpis.average.toFixed(1).replace('.', ',') : '—'}
            {kpis.average !== null && <span className="text-base align-super">/20</span>}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiAttendanceRate')}</div>
          <div className={`text-3xl font-semibold mt-1 ${kpis.attendanceRate !== null ? (kpis.attendanceRate >= 80 ? 'text-green-600' : 'text-[var(--color-error)]') : ''}`}>
            {kpis.attendanceRate !== null ? `${kpis.attendanceRate}%` : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiTuitionFees')}</div>
          <div className="text-3xl font-semibold mt-1">
            {kpis.tuition !== null ? `${kpis.tuition.toLocaleString('fr-FR')} €` : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiCredits')} {kpis.currentSemesterLabel || '—'}</div>
          <div className="text-3xl font-semibold mt-1">
            {kpis.credits !== null ? kpis.credits : '—'}
            {kpis.totalCredits > 0 && <span className="text-base align-super">/{kpis.totalCredits}</span>}
          </div>
        </div>
      </div>

      {nextCourse && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-sm text-[var(--color-text-muted)]">
              {translate('nextCourse')} · <span className="font-medium text-[var(--color-text)]">{formatTimeUntil(nextCourse.minutesAway)}</span>
            </span>
            {roomChanged && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 flex items-center gap-1">
                ⚠ {translate('roomChanged')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-surface)] flex items-center justify-center text-sm font-semibold text-[var(--color-text-muted)]">
              {(nextCourse.start_time || '').slice(0, 2) + 'h' || '—'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[var(--color-text)] truncate">
                {nextCourse.course?.course_name || nextCourse.course_id}
                <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">({nextCourse.course_id})</span>
              </div>
              <div className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {nextCourse.instructor && `${translate('profAbbrev')} ${nextCourse.instructor.first_name} ${nextCourse.instructor.last_name} · `}
                {nextCourse.course?.course_type || 'CM'}
                {' · '}
                <span className={roomChanged ? 'text-amber-600 font-medium' : ''}>
                  {nextCourse.room?.room_name || nextCourse.room_id}
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                  {(nextCourse.start_time || '').slice(0, 5)} – {(nextCourse.end_time || '').slice(0, 5)}
                </span>
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
