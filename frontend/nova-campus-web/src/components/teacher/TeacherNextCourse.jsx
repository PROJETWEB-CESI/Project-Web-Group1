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
  const nextCourse = getNextCourse(timetables);

  if (!nextCourse) return null;

  const roomChanged = nextCourse?.status && nextCourse.status !== 'Active';

  const formatTimeUntil = (minutesAway) => {
    if (minutesAway < 60)          return translate('inMin',  { n: minutesAway });
    if (minutesAway < 24 * 60)     return translate('inH',    { n: Math.floor(minutesAway / 60) });
    if (minutesAway < 2 * 24 * 60) return translate('tomorrow');
    return translate('inDays', { n: Math.floor(minutesAway / (24 * 60)) });
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-sm text-[var(--color-text-muted)]">
          {translate('nextCourse')} · <span className="font-medium text-[var(--color-text)]">{formatTimeUntil(nextCourse.minutesAway)}</span>
        </span>
        {roomChanged && (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            ⚠ {translate('roomChanged')}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-surface)] flex items-center justify-center text-sm font-semibold text-[var(--color-text-muted)]">
          {(nextCourse.start_time || '').slice(0, 2) + 'h'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[var(--color-text)] truncate">
            {nextCourse.course?.course_name || nextCourse.course_id}
            <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">({nextCourse.course_id})</span>
          </div>
          <div className="text-sm text-[var(--color-text-muted)] mt-0.5">
            {nextCourse.course?.course_type || 'CM'}
            {nextCourse.room && (
              <span className={roomChanged ? 'text-amber-600 font-medium' : ''}>
                {' · '}{nextCourse.room.room_name}
              </span>
            )}
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
  );
}
