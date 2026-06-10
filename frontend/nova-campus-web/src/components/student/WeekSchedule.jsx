'use client';

import Link from 'next/link';
import { getCourseColor, EXAM_COLOR } from '@/lib/courseColors';

const DAY_LABELS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN'];
const DAY_MAP = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

function getWeekDays() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatHour(timeStr) {
  return (timeStr || '').slice(0, 2) + 'h';
}

function shortName(name, id) {
  const s = name || id || '';
  return s.length > 16 ? s.slice(0, 15) + '…' : s;
}

export default function WeekSchedule({ timetables }) {
  if (!timetables || timetables.length === 0) return null;

  const weekDays = getWeekDays();
  const today = new Date();

  const byDay = Array.from({ length: 5 }, () => []);
  for (const t of timetables) {
    const idx = DAY_MAP[t.day_of_week];
    if (idx !== undefined) byDay[idx].push(t);
  }
  for (const day of byDay) {
    day.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }

  const hasAnyCourse = byDay.some(d => d.length > 0);
  if (!hasAnyCourse) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mb-6 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 sm:px-4 sm:py-3 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">Cette semaine</span>
        <Link href="?tab=schedule" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          Voir tout →
        </Link>
      </div>
      <div className="grid grid-cols-5 divide-x divide-[var(--color-border)]">
        {weekDays.map((date, i) => {
          const isToday = date.toDateString() === today.toDateString();
          const courses = byDay[i];
          return (
            <div key={i} className={`p-1 sm:p-3 min-h-[130px] ${isToday ? 'bg-[var(--color-surface)]' : ''}`}>
              <div className={`text-xs font-semibold tracking-wide mb-0.5 ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                {DAY_LABELS[i]}
              </div>
              <div className={`text-2xl font-light mb-3 ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                {date.getDate()}
              </div>
              <div className="flex flex-col gap-1.5">
                {courses.length === 0 ? (
                  <span className="text-xs text-[var(--color-text-muted)] opacity-30">—</span>
                ) : courses.map((t, j) => {
                  const isExam = t.status === 'Exam' || t.course?.course_type === 'Exam';
                  const v = isExam ? EXAM_COLOR : getCourseColor(t.course_id);
                  return (
                    <div key={j} className={`${v.bg} border-l-4 ${v.border} rounded-r-md px-2 py-1.5`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs text-[var(--color-text-muted)]">{formatHour(t.start_time)}–{formatHour(t.end_time)}</span>
                        {isExam && <span className={`text-xs font-bold ${v.text}`}>· EXAM</span>}
                      </div>
                      <div className={`text-xs font-medium ${v.text} leading-tight`}>
                        {shortName(t.course?.course_name, t.course_id)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
