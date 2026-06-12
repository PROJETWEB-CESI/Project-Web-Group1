'use client';

import { useLanguage } from '@/context/LanguageContext';
import { getCourseColor } from '@/lib/courseColors';
import ScrollShadow from '@/components/shared/ScrollShadow';
import { AlertTriangle, Building2, CalendarDays } from 'lucide-react';

const DAY_MAP = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{translate('adminPlanningTitle')}</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          {timetables.length} {translate('scheduledCourses')}
          {conflicts.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-[var(--color-error)] font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {conflicts.length} {translate(conflicts.length > 1 ? 'conflictsDetected' : 'conflictDetected')}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className={`w-4 h-4 ${conflicts.length > 0 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'}`} />
              <span className="text-sm font-semibold text-[var(--color-text)]">{translate('conflictsTitle')}</span>
              {conflicts.length > 0 && (
                <span className="ml-auto text-xs font-semibold rounded-full px-2 py-0.5 bg-[var(--color-error)]/10 text-[var(--color-error)]">
                  {conflicts.length}
                </span>
              )}
            </div>
            {conflicts.length === 0 ? (
              <p className="text-sm text-[var(--color-success)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] inline-block" />
                {translate('noConflicts')}
              </p>
            ) : (
              <div className="space-y-2.5">
                {conflicts.map((c, i) => (
                  <div key={i} className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-2.5">
                    <div className="text-xs font-semibold text-[var(--color-error)] mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {c.type === 'room' ? translate('roomConflict') : translate('instructorConflict')}
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
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="text-sm font-semibold text-[var(--color-text)]">{translate('campusRoomsTitle')}</span>
            </div>
            {rooms.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">{translate('noRooms')}</p>
            ) : (
              <div className="space-y-1">
                {rooms.map((r) => (
                  <div key={r.room_id} className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm text-[var(--color-text)] font-medium truncate">{r.room_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{r.building} · {r.capacity} {translate('seatsLabel')}</div>
                    </div>
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 flex-shrink-0 ml-2 ${ROOM_STATUS_STYLES[r.status] || 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--color-border)] flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{translate('scheduledCourses')}</span>
          </div>
          {timetables.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">{translate('noCoursesPlanned')}</p>
          ) : (
            <ScrollShadow>
              <div className="grid grid-cols-5 min-w-[700px] divide-x divide-[var(--color-border)]">
                {DAY_LABELS.map((label, i) => (
                  <div key={label} className="p-3 min-h-[200px]">
                    <div className="text-xs font-semibold tracking-wide mb-3 text-[var(--color-text-muted)] uppercase">{label}</div>
                    <div className="flex flex-col gap-1.5">
                      {byDay[i].length === 0 ? (
                        <span className="text-xs text-[var(--color-text-muted)] opacity-30">—</span>
                      ) : byDay[i].map((t) => {
                        const v = getCourseColor(t.course_id);
                        const inConflict = conflictedIds.has(t.schedule_id);
                        return (
                          <div
                            key={t.schedule_id}
                            className={`${v.bg} border-l-4 ${inConflict ? 'border-l-[var(--color-error)] ring-1 ring-[var(--color-error)]/40' : v.border} rounded-r-md px-2 py-1.5 hover:brightness-95 transition-all cursor-default`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-xs text-[var(--color-text-muted)]">{formatHour(t.start_time)}–{formatHour(t.end_time)}</span>
                              {inConflict && <AlertTriangle className="w-3 h-3 text-[var(--color-error)]" />}
                            </div>
                            <div className={`text-xs font-semibold ${v.text} leading-tight`}>
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
            </ScrollShadow>
          )}
        </div>
      </div>
    </div>
  );
}
