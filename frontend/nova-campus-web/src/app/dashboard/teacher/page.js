'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import WeekSchedule from '@/components/student/WeekSchedule';

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

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const { translate } = useLanguage();

  const [weeklyCoursesCount, setWeeklyCoursesCount] = useState(null);
  const [studentsCount, setStudentsCount]           = useState(null);
  const [avgAttendanceRate, setAvgAttendanceRate]   = useState(null);
  const [campusName, setCampusName]                 = useState(null);
  const [timetables, setTimetables]                 = useState([]);
  const [pendingGrades, setPendingGrades]           = useState([]);
  const [publishing, setPublishing]                 = useState({});
  const [loading, setLoading]                       = useState(true);

  const fetchJson = useCallback(async (url) => {
    try {
      const res = await apiFetch(url);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  }, [apiFetch]);

  useEffect(() => {
    if (!user || user.role !== 'teacher') return;

    const instructorId = user.instructorId;
    const campusId     = user.campusId;

    const loadData = async () => {
      const [campusData, rawTimetables] = await Promise.all([
        campusId ? fetchJson(`/api/students/campuses/${campusId}`) : null,
        instructorId ? fetchJson(`/api/timetables/?instructor_id=${instructorId}`) : null,
      ]);

      if (campusData?.campusName) setCampusName(campusData.campusName);

      if (Array.isArray(rawTimetables)) {
        setTimetables(rawTimetables);
        const courseIds = [...new Set(rawTimetables.map(t => t.course_id))];
        setWeeklyCoursesCount(courseIds.length);

        if (courseIds.length > 0 && campusId) {
          const qs = `courseIds=${courseIds.join(',')}&campusId=${campusId}`;
          const [stats, pending] = await Promise.all([
            fetchJson(`/api/teacher/courses/stats?${qs}`),
            fetchJson(`/api/teacher/courses/pending-grades?${qs}`),
          ]);
          if (stats) {
            setStudentsCount(stats.studentsCount);
            setAvgAttendanceRate(stats.avgAttendanceRate);
          }
          if (Array.isArray(pending)) setPendingGrades(pending);
        } else {
          setStudentsCount(0);
        }
      } else {
        setWeeklyCoursesCount(0);
        setStudentsCount(0);
      }

      setLoading(false);
    };

    loadData();
  }, [user, fetchJson]);

  const handlePublish = async (courseId) => {
    const campusId = user?.campusId;
    if (!campusId) return;
    setPublishing(prev => ({ ...prev, [courseId]: true }));
    try {
      const res = await apiFetch(`/api/grades/course/${courseId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId }),
      });
      if (res.ok) {
        setPendingGrades(prev => prev.filter(c => c.courseId !== courseId));
      }
    } finally {
      setPublishing(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const specialty   = user?.specialty  || null;
  const department  = user?.department || null;
  const dash        = '—';
  const nextCourse  = getNextCourse(timetables);
  const roomChanged = nextCourse?.status && nextCourse.status !== 'Active';

  const formatTimeUntil = (minutesAway) => {
    if (minutesAway < 60)          return translate('inMin',  { n: minutesAway });
    if (minutesAway < 24 * 60)     return translate('inH',    { n: Math.floor(minutesAway / 60) });
    if (minutesAway < 2 * 24 * 60) return translate('tomorrow');
    return translate('inDays', { n: Math.floor(minutesAway / (24 * 60)) });
  };

  const kpiClass   = 'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4';
  const labelClass = 'text-xs text-[var(--color-text-muted)]';
  const valueClass = 'text-3xl font-semibold mt-1';

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        {user?.firstName ? `${translate('hello', { name: user.firstName })} 👋` : null}
      </h1>
      {specialty && (
        <p className="text-[var(--color-text-muted)] mb-6">
          Prof. {specialty}
        </p>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={kpiClass}>
          <div className={labelClass}>MES COURS HEBDO</div>
          <div className={valueClass}>{loading ? dash : weeklyCoursesCount ?? dash}</div>
        </div>
        <div className={kpiClass}>
          <div className={labelClass}>ÉTUDIANTS ENCADRÉS</div>
          <div className={valueClass}>{loading ? dash : studentsCount ?? dash}</div>
        </div>
        <div className={kpiClass}>
          <div className={labelClass}>PRÉSENCE MOYENNE</div>
          <div className={valueClass}>
            {loading ? dash : avgAttendanceRate != null ? `${avgAttendanceRate}%` : dash}
          </div>
        </div>
        <div className={kpiClass}>
          <div className={labelClass}>SPÉCIALITÉ</div>
          {specialty ? (
            <>
              <div className="text-lg font-semibold mt-1">{specialty}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {[department ? `Dépt. ${department}` : null, campusName].filter(Boolean).join(' · ')}
              </div>
            </>
          ) : (
            <div className={valueClass}>{dash}</div>
          )}
        </div>
      </div>

      {/* Next course */}
      {nextCourse && (
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
      )}

      <WeekSchedule timetables={timetables} viewAllHref={null} />

      {/* Pending grades */}
      {!loading && pendingGrades.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mt-6 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
            <span className="text-sm font-semibold text-[var(--color-text)]">Notes en attente de publication</span>
            <span className="text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
              {pendingGrades.length}
            </span>
          </div>
          <ul className="divide-y divide-[var(--color-border)]">
            {pendingGrades.map(({ courseId, courseName, unpublishedCount }) => (
              <li key={courseId} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-[var(--color-text)] truncate block">{courseName}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {unpublishedCount} note{unpublishedCount > 1 ? 's' : ''} non publiée{unpublishedCount > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={() => handlePublish(courseId)}
                  disabled={publishing[courseId]}
                  className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elev)] text-[var(--color-text)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {publishing[courseId] ? 'Publication…' : 'Publier'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
