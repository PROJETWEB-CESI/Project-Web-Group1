'use client';

import { useLanguage } from '@/context/LanguageContext';

const DAY_MAP = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

// Course color palette built from theme tokens so it follows light/dark/high-contrast themes
const PALETTE = [
  { bg: 'bg-[var(--color-primary)]/10',      border: 'border-l-[var(--color-primary)]',      text: 'text-[var(--color-primary)]'      },
  { bg: 'bg-[var(--color-accent)]/10',       border: 'border-l-[var(--color-accent)]',       text: 'text-[var(--color-accent)]'       },
  { bg: 'bg-[var(--color-success)]/10',      border: 'border-l-[var(--color-success)]',      text: 'text-[var(--color-success)]'      },
  { bg: 'bg-[var(--color-primary-soft)]/20', border: 'border-l-[var(--color-primary-soft)]', text: 'text-[var(--color-primary)]'      },
  { bg: 'bg-[var(--color-accent-soft)]/20',  border: 'border-l-[var(--color-accent-soft)]',  text: 'text-[var(--color-accent)]'       },
];

function buildColorMap(timetables) {
  const map = new Map();
  let i = 0;
  for (const t of timetables) {
    if (!map.has(t.course_id)) {
      map.set(t.course_id, PALETTE[i % PALETTE.length]);
      i++;
    }
  }
  return map;
}

function formatHour(timeStr) {
  return (timeStr || '').slice(0, 5);
}

const ROOM_STATUS_STYLES = {
  Available:   'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  Maintenance: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  Unavailable: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
};

export default function PlanningTab({ rooms, timetables, conflicts }) {
  const { translate } = useLanguage();
  const DAY_LABELS = [translate('dayMon'), translate('dayTue'), translate('dayWed'), translate('dayThu'), translate('dayFri')];
  const colorMap = buildColorMap(timetables);
  const conflictedIds = new Set(conflicts.flatMap((c) => [c.a.schedule_id, c.b.schedule_id]));

  const byDay = Array.from({ length: 5 }, () => []);
  for (const t of timetables) {
    const idx = DAY_MAP[t.day_of_week];
    if (idx !== undefined) byDay[idx].push(t);
  }
  for (const day of byDay) {
    day.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('adminPlanningTitle')}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        {timetables.length} {translate('scheduledCourses')} · {conflicts.length} {translate('conflictsDetected')}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
            <div className="text-sm font-medium text-[var(--color-text)] mb-3">{translate('conflictsTitle')}</div>
            {conflicts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{translate('noConflicts')}</p>
            ) : (
              <div className="space-y-3">
                {conflicts.map((c, i) => (
                  <div key={i} className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-2.5">
                    <div className="text-xs font-semibold text-[var(--color-error)] mb-1">
                      ⚠ {c.type === 'room' ? translate('roomConflict') : translate('instructorConflict')}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {c.a.course?.course_name || c.a.course_id} {translate('andLabel')} {c.b.course?.course_name || c.b.course_id}
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {c.a.day_of_week} · {formatHour(c.a.start_time)}–{formatHour(c.a.end_time)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
            <div className="text-sm font-medium text-[var(--color-text)] mb-3">{translate('campusRoomsTitle')}</div>
            {rooms.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{translate('noRooms')}</p>
            ) : (
              <div className="space-y-2">
                {rooms.map((r) => (
                  <div key={r.room_id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <div className="text-[var(--color-text)] truncate">{r.room_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{r.building} · {r.capacity} {translate('seatsLabel')}</div>
                    </div>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0 ${ROOM_STATUS_STYLES[r.status] || 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          {timetables.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">{translate('noCoursesPlanned')}</p>
          ) : (
            <div className="grid grid-cols-5 divide-x divide-[var(--color-border)]">
              {DAY_LABELS.map((label, i) => (
                <div key={label} className="p-2 sm:p-3 min-h-[200px]">
                  <div className="text-xs font-semibold tracking-wide mb-2 text-[var(--color-text-muted)]">{label}</div>
                  <div className="flex flex-col gap-1.5">
                    {byDay[i].length === 0 ? (
                      <span className="text-xs text-[var(--color-text-muted)] opacity-30">—</span>
                    ) : byDay[i].map((t) => {
                      const v = colorMap.get(t.course_id) || PALETTE[0];
                      const inConflict = conflictedIds.has(t.schedule_id);
                      return (
                        <div
                          key={t.schedule_id}
                          className={`${v.bg} border-l-4 ${inConflict ? 'border-l-[var(--color-error)] ring-1 ring-[var(--color-error)]/40' : v.border} rounded-r-md px-2 py-1.5`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-xs text-[var(--color-text-muted)]">{formatHour(t.start_time)}–{formatHour(t.end_time)}</span>
                            {inConflict && <span className="text-xs font-bold text-[var(--color-error)]">⚠</span>}
                          </div>
                          <div className={`text-xs font-medium ${v.text} leading-tight`}>
                            {t.course?.course_name || t.course_id}
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {t.room?.room_name || t.room_id}
                            {t.instructor && ` · ${t.instructor.first_name} ${t.instructor.last_name}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
