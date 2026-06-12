'use client';

import { useState } from 'react';
import { getCourseColor } from '@/lib/courseColors';
import ScrollShadow from '@/components/shared/ScrollShadow';
import { useLanguage } from '@/context/LanguageContext';

const HOUR_HEIGHT = 64;
const START_HOUR = 8;
const END_HOUR = 19;
const SCH_HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
const SCH_DAY_KEYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SCH_DAY_TRANS_KEYS = ['dayMon', 'dayTue', 'dayWed', 'dayThu', 'dayFri'];

const schToMin = (ts) => {
  const p = (ts || `${START_HOUR}:00`).split(':').map(Number);
  return p[0] * 60 + (p[1] || 0) - START_HOUR * 60;
};

export default function ScheduleTab({ timetables }) {
  const { translate, language } = useLanguage();
  const [weekOffset, setWeekOffset] = useState(0);

  const schByDay = {};
  for (const k of SCH_DAY_KEYS) schByDay[k] = [];
  for (const t of timetables) {
    if (schByDay[t.day_of_week]) schByDay[t.day_of_week].push(t);
  }

  const schNow    = new Date();
  const schTarget = new Date(schNow);
  schTarget.setDate(schNow.getDate() + weekOffset * 7);
  const schDayIdx = schTarget.getDay();
  const schMonday = new Date(schTarget);
  schMonday.setDate(schTarget.getDate() - (schDayIdx === 0 ? 6 : schDayIdx - 1));
  const schWeekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(schMonday);
    d.setDate(schMonday.getDate() + i);
    return d;
  });

  const schSOY     = new Date(schTarget.getFullYear(), 0, 1);
  const schWeekNum = Math.ceil(((schTarget - schSOY) / 86400000 + schSOY.getDay() + 1) / 7);

  const schFmt  = (d, opts) => d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', opts);
  const schStart = schWeekDays[0];
  const schEnd   = schWeekDays[4];
  const schDateRange = schStart.getMonth() === schEnd.getMonth()
    ? `${schStart.getDate()} – ${schFmt(schEnd, { day: 'numeric', month: 'long', year: 'numeric' })}`
    : `${schFmt(schStart, { day: 'numeric', month: 'long' })} – ${schFmt(schEnd, { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 select-none text-sm">
        <button
          onClick={() => setWeekOffset(v => v - 1)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg leading-none"
        >‹</button>
        <span className="font-medium italic text-[var(--color-text)] min-w-[80px]">{translate('weekLabel', { n: schWeekNum })}</span>
        <span className="text-[var(--color-text-muted)]">{schDateRange}</span>
        <button
          onClick={() => setWeekOffset(v => v + 1)}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg leading-none"
        >›</button>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="ml-3 px-3 py-1 border border-[var(--color-border)] rounded text-sm hover:bg-[var(--color-surface)] text-[var(--color-text)]"
          >{translate('todayButton')}</button>
        )}
      </div>

      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">
        <ScrollShadow>
        <div className="grid" style={{ gridTemplateColumns: '56px repeat(5, minmax(140px, 1fr))', minWidth: '756px' }}>

          <div className="border-b border-r border-[var(--color-border)] bg-[var(--color-surface)]" />
          {SCH_DAY_KEYS.map((dayKey, i) => {
            const date    = schWeekDays[i];
            const isToday = weekOffset === 0 && date.toDateString() === schNow.toDateString();
            return (
              <div key={`hdr-${dayKey}`}
                className={`text-center py-3 border-b border-l border-[var(--color-border)] ${isToday ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-surface)]'}`}>
                <div className={`text-xs font-semibold tracking-widest ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                  {translate(SCH_DAY_TRANS_KEYS[i])}
                </div>
                <div className={`text-2xl font-light mt-0.5 ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}

          <div className="border-r border-[var(--color-border)]">
            {SCH_HOURS.map(h => (
              <div key={h} style={{ height: `${HOUR_HEIGHT}px` }} className="relative border-t border-[var(--color-border)]">
                <span className="absolute right-2 top-0.5 text-xs text-[var(--color-text-muted)] tabular-nums">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {SCH_DAY_KEYS.map((dayKey, i) => {
            const courses = schByDay[dayKey];
            const isToday = weekOffset === 0 && schWeekDays[i].toDateString() === schNow.toDateString();
            return (
              <div key={dayKey}
                className={`border-l border-[var(--color-border)] relative ${isToday ? 'bg-[var(--color-primary)]/5' : ''}`}
                style={{ height: `${SCH_HOURS.length * HOUR_HEIGHT}px` }}>

                {SCH_HOURS.map(h => (
                  <div key={h}
                    className="absolute w-full border-t border-[var(--color-border)]"
                    style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {courses.map((t, j) => {
                  const startMin = schToMin(t.start_time);
                  const endMin   = schToMin(t.end_time);
                  if (startMin < 0 || startMin >= (END_HOUR - START_HOUR) * 60) return null;
                  const topPx    = (startMin / 60) * HOUR_HEIGHT + 2;
                  const heightPx = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT - 4, 26);
                  const v        = getCourseColor(t.course_id);
                  return (
                    <div key={j}
                      className={`absolute left-1 right-1 overflow-hidden rounded-r-md border-l-4 px-2 py-1.5 ${v.bg} ${v.border}`}
                      style={{ top: `${topPx}px`, height: `${heightPx}px` }}>
                      <div className="text-xs text-[var(--color-text-muted)] leading-none mb-0.5">
                        {(t.start_time || '').slice(0, 5)} – {(t.end_time || '').slice(0, 5)}
                      </div>
                      <div className={`text-xs font-semibold leading-snug ${v.text}`}>
                        {t.course?.course_name || t.course_id}
                        {t.course_id && ` (${t.course_id})`}
                      </div>
                      {heightPx > 52 && t.instructor && (
                        <div className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-none">
                          {translate('profAbbrev')} {t.instructor.first_name} {t.instructor.last_name}
                          {t.course?.course_type ? ` · ${t.course.course_type}` : ''}
                        </div>
                      )}
                      {heightPx > 76 && t.room && (
                        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5 leading-none">
                          <span className="text-[var(--color-error)] text-[10px]">●</span>
                          {t.room.room_name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

        </div>
        </ScrollShadow>
      </div>
    </div>
  );
}
