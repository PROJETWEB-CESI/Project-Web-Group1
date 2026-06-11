'use client';

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
    if (minutesAway < bestMinutesAway) {
      bestMinutesAway = minutesAway;
      best = { ...t, minutesAway, daysAway };
    }
  }
  return best;
}

export default function TeacherNextCourse({ timetables }) {
  const { translate } = useLanguage();
  const next = getNextCourse(timetables);
  if (!next) return null;

  const roomChanged = next.status && next.status !== 'Active';

  const formatTimeUntil = (min) => {
    if (min < 60)          return translate('inMin',  { n: min });
    if (min < 24 * 60)     return translate('inH',    { n: Math.floor(min / 60) });
    if (min < 2 * 24 * 60) return translate('tomorrow');
    return translate('inDays', { n: Math.floor(min / (24 * 60)) });
  };

  const courseInitials = (name, id) => {
    const s = name || id || '?';
    const words = s.split(' ').filter(Boolean);
    return words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : s.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-[var(--color-text)]">{translate('nextCourse')}</span>
        </div>
        <div className="flex items-center gap-2">
          {roomChanged && (
            <span className="text-xs font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-1">
              ⚠ {translate('roomChanged')}
            </span>
          )}
          <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
            {formatTimeUntil(next.minutesAway)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-sm font-bold text-blue-600 select-none">
          {courseInitials(next.course?.course_name, next.course_id)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--color-text)] truncate text-base">
            {next.course?.course_name || next.course_id}
            <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">({next.course_id})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {(next.start_time || '').slice(0, 5)} – {(next.end_time || '').slice(0, 5)}
            </span>
            {next.room && (
              <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 border ${
                roomChanged
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {next.room.room_name}
              </span>
            )}
            {next.course?.course_type && (
              <span className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                {next.course.course_type}
              </span>
            )}
            {next.course?.credits && (
              <span className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                {next.course.credits} ECTS
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
