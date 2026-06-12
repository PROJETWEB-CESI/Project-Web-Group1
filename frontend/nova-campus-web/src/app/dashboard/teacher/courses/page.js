'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';

const DAY_ORDER = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

const AVATAR_PALETTES = [
  'bg-blue-500/15 text-blue-700',
  'bg-violet-500/15 text-violet-700',
  'bg-emerald-500/15 text-emerald-700',
  'bg-amber-500/15 text-amber-700',
  'bg-rose-500/15 text-rose-700',
  'bg-cyan-500/15 text-cyan-700',
  'bg-orange-500/15 text-orange-700',
  'bg-teal-500/15 text-teal-700',
];

function paletteFor(str) {
  const hash = (str || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function initials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

function CourseAvatar({ name, id }) {
  const words = (name || id || '?').split(' ').filter(Boolean);
  const ini = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (name || id || '?').slice(0, 2).toUpperCase();
  return (
    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-primary)] select-none">
      {ini}
    </div>
  );
}

function StudentAvatar({ firstName, lastName }) {
  const palette = paletteFor((firstName || '') + (lastName || ''));
  return (
    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold select-none ${palette}`}>
      {initials(firstName, lastName)}
    </div>
  );
}

function AttBadge({ rate }) {
  if (rate == null) return <span className="text-[var(--color-text-muted)] text-sm">—</span>;
  const cls = rate >= 80
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
    : rate >= 60
    ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
    : 'bg-red-500/10 text-red-600 border-red-500/20';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{rate}%</span>;
}

function AvgBadge({ average }) {
  if (average == null) return <span className="text-[var(--color-text-muted)] text-sm">—</span>;
  const cls = average >= 14
    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
    : average >= 10
    ? 'bg-blue-500/10 text-blue-700 border-blue-500/20'
    : 'bg-red-500/10 text-red-600 border-red-500/20';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{average}/20</span>;
}

function MiniStat({ icon, label, value, colorClass = 'text-[var(--color-text)]' }) {
  return (
    <div className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex-1">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-bg-elev)] flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{label}</div>
        <div className={`text-sm font-bold mt-0.5 ${colorClass}`}>{value ?? '—'}</div>
      </div>
    </div>
  );
}

function StudentRow({ student, onExpand, expanded }) {
  const { translate, language } = useLanguage();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <div>
      <div
        className="flex items-center gap-2 px-4 py-3 hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
        onClick={() => onExpand(student.studentId)}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <StudentAvatar firstName={student.firstName} lastName={student.lastName} />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text)] truncate">
              {student.firstName} {student.lastName}
            </div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
              {student.program
                ? <>{student.program}{student.enrollmentYear ? <span className="opacity-60"> · {translate('classOf', { year: student.enrollmentYear })}</span> : null}</>
                : student.studentId}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <AttBadge rate={student.attendanceRate} />
          <AvgBadge average={student.average} />
          {student.grades.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] whitespace-nowrap">
              {translate(student.grades.length === 1 ? 'courseEvalSingular' : 'courseEvalPlural', { n: student.grades.length })}
            </span>
          )}
        </div>

        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
          className={`w-4 h-4 flex-shrink-0 text-[var(--color-text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {expanded && student.grades.length > 0 && (
        <div className="px-3 pb-3 pt-1 bg-[var(--color-surface)]">
          <div className="rounded-xl border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border)]">
            {student.grades.map((g, i) => {
              const scoreVal = g.score != null ? parseFloat(g.score) : null;
              const maxVal   = g.scoreMax != null ? parseFloat(g.scoreMax) : 20;
              const pct      = scoreVal != null ? Math.round((scoreVal / maxVal) * 100) : 0;
              const scoreColor = scoreVal == null ? 'text-[var(--color-text-muted)]'
                : scoreVal >= (maxVal * 0.7) ? 'text-emerald-600'
                : scoreVal >= (maxVal * 0.5) ? 'text-blue-600'
                : 'text-red-500';
              const barColor = scoreVal == null ? 'bg-[var(--color-border)]'
                : scoreVal >= (maxVal * 0.7) ? 'bg-emerald-500'
                : scoreVal >= (maxVal * 0.5) ? 'bg-blue-500'
                : 'bg-red-400';
              const dateStr = g.evaluationDate
                ? new Date(g.evaluationDate).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
                : null;

              return (
                <div key={i} className={`flex items-center gap-3 px-3 py-3 ${i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-black/[0.03] dark:bg-white/[0.03]'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[var(--color-text)] truncate">{g.evaluationName}</div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      {dateStr && <span className="text-xs text-[var(--color-text-muted)]">{dateStr}</span>}
                      <span className="text-xs text-[var(--color-text-muted)]">coeff. ×{g.coefficient}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 w-20 flex-shrink-0">
                    <div className={`text-base font-extrabold tracking-tight ${scoreColor}`}>
                      {scoreVal != null
                        ? <>{scoreVal}<span className="text-xs font-medium text-[var(--color-text-muted)]">/{Math.round(maxVal)}</span></>
                        : '—'}
                    </div>
                    {scoreVal != null && (
                      <div className="w-full h-1.5 rounded-full bg-[var(--color-border)]">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {g.publishedAt
                      ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
                          {translate('courseGradePublished')}
                        </span>
                      : <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" /></svg>
                          {translate('courseGradePending')}
                        </span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CourseStudents({ students, loading }) {
  const { translate } = useLanguage();
  const [expanded, setExpanded] = useState({});
  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--color-text-muted)]">
      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      {translate('courseLoadingStudents')}
    </div>
  );

  if (!students?.length) return (
    <div className="py-8 text-center text-sm text-[var(--color-text-muted)]">{translate('courseNoStudents')}</div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="flex-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{translate('courseStudentCol')}</div>
        <div className="w-16 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{translate('courseAttendanceCol')}</div>
        <div className="w-16 text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{translate('courseAverageCol')}</div>
        <div className="w-6" />
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {students.map(s => (
          <StudentRow key={s.studentId} student={s} expanded={!!expanded[s.studentId]} onExpand={toggle} />
        ))}
      </div>
    </div>
  );
}

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();
  const { translate } = useLanguage();

  const [courses, setCourses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [openCourse, setOpenCourse] = useState(null);
  const [studentsCache, setStudentsCache]     = useState({});
  const [studentsLoading, setStudentsLoading] = useState({});
  const loadedCourses = useRef(new Set());

  const fetchJson = useCallback(async (url) => {
    try {
      const res = await apiFetch(url);
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }, [apiFetch]);

  useEffect(() => {
    if (!user?.instructorId || !user?.campusId) return;

    let cancelled = false;
    const campusId     = user.campusId;
    const instructorId = user.instructorId;

    const load = async () => {
      const timetables = await fetchJson(`/api/timetables/?instructor_id=${instructorId}`);
      if (cancelled) return;
      if (!Array.isArray(timetables) || timetables.length === 0) {
        setLoading(false);
        return;
      }

      const courseMap = {};
      for (const t of timetables) {
        if (!courseMap[t.course_id]) {
          courseMap[t.course_id] = {
            courseId:   t.course_id,
            courseName: t.course?.course_name || t.course_id,
            courseType: t.course?.course_type || null,
            credits:    t.course?.credits     || null,
            slots: [],
          };
        }
        courseMap[t.course_id].slots.push({
          day:   t.day_of_week,
          start: t.start_time,
          end:   t.end_time,
          room:  t.room?.room_name || t.room_id || null,
        });
      }
      for (const c of Object.values(courseMap)) {
        c.slots.sort((a, b) => (DAY_ORDER[a.day] ?? 9) - (DAY_ORDER[b.day] ?? 9));
      }

      const courseIds = Object.keys(courseMap);
      const qs = `courseIds=${courseIds.join(',')}&campusId=${campusId}`;

      const [perf, pending, ...attResults] = await Promise.all([
        fetchJson(`/api/teacher/courses/performance?${qs}`),
        fetchJson(`/api/teacher/courses/pending-grades?${qs}`),
        ...courseIds.map(id => fetchJson(`/api/teacher/courses/stats?courseIds=${id}&campusId=${campusId}`)),
      ]);

      if (cancelled) return;

      if (Array.isArray(perf)) {
        for (const p of perf) {
          if (courseMap[p.courseId]) Object.assign(courseMap[p.courseId], {
            average: p.average, passRate: p.passRate, studentsCount: p.studentsCount,
          });
        }
      }
      if (Array.isArray(pending)) {
        for (const p of pending) {
          if (courseMap[p.courseId]) courseMap[p.courseId].pendingCount = p.unpublishedCount;
        }
      }
      courseIds.forEach((id, i) => {
        if (attResults[i] && courseMap[id]) {
          courseMap[id].attendanceRate = attResults[i].avgAttendanceRate;
          if (courseMap[id].studentsCount == null) courseMap[id].studentsCount = attResults[i].studentsCount;
        }
      });

      setCourses(Object.values(courseMap));
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [user, fetchJson]);

  const loadStudents = useCallback(async (courseId) => {
    if (loadedCourses.current.has(courseId)) return;
    loadedCourses.current.add(courseId);
    setStudentsLoading(prev => ({ ...prev, [courseId]: true }));
    const data = await fetchJson(`/api/teacher/courses/${courseId}/students?campusId=${user.campusId}`);
    setStudentsCache(prev => ({ ...prev, [courseId]: Array.isArray(data) ? data : [] }));
    setStudentsLoading(prev => ({ ...prev, [courseId]: false }));
  }, [fetchJson, user]);

  const toggleCourse = useCallback((courseId) => {
    setOpenCourse(prev => {
      const next = prev === courseId ? null : courseId;
      if (next) loadStudents(next);
      return next;
    });
  }, [loadStudents]);

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">{translate('loading')}</div>
  );

  if (courses.length === 0) return (
    <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--color-text-muted)]">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-30">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      <span className="text-sm">{translate('courseNoCoursesFound')}</span>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">{translate('coursesTitle')}</h1>
        <p className="text-[var(--color-text-muted)] mt-1">
          {translate(courses.length === 1 ? 'coursesCourseSingular' : 'coursesCoursePlural', { n: courses.length })} · {translate('coursesSemester')}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {courses.map((c) => {
          const avgColorClass  = c.average  == null ? 'text-[var(--color-text)]' : c.average  >= 14 ? 'text-emerald-600' : c.average  >= 10 ? 'text-blue-600' : 'text-red-500';
          const passColorClass = c.passRate == null ? 'text-[var(--color-text)]' : c.passRate >= 75 ? 'text-emerald-600' : c.passRate >= 50 ? 'text-amber-600' : 'text-red-500';
          const attColorClass  = c.attendanceRate == null ? 'text-[var(--color-text)]' : c.attendanceRate >= 80 ? 'text-emerald-600' : c.attendanceRate >= 60 ? 'text-amber-600' : 'text-red-500';
          const isOpen = openCourse === c.courseId;

          return (
            <div key={c.courseId} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden shadow-sm">

              <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 sm:py-5 bg-[var(--color-surface)]">
                <div className="flex items-start gap-3">
                  <CourseAvatar name={c.courseName} id={c.courseId} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[var(--color-text)] text-base leading-tight">{c.courseName}</span>
                      <span className="hidden sm:inline text-xs text-[var(--color-text-muted)] font-mono opacity-60">{c.courseId}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {c.courseType && (
                        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                          {c.courseType}
                        </span>
                      )}
                      {c.credits && (
                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--color-bg-elev)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                          {c.credits} ECTS
                        </span>
                      )}
                      {c.pendingCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M8 1a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5A.75.75 0 0 1 8 1ZM8 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" clipRule="evenodd" />
                          </svg>
                          {translate(c.pendingCount === 1 ? 'coursesGradeSingular' : 'coursesGradePlural', { n: c.pendingCount })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <a href={`/dashboard/teacher/grades?course=${c.courseId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/20 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                        <path fillRule="evenodd" d="M5 4a3 3 0 0 1 6 0v1h.5A1.5 1.5 0 0 1 13 6.5v6A1.5 1.5 0 0 1 11.5 14h-7A1.5 1.5 0 0 1 3 12.5v-6A1.5 1.5 0 0 1 4.5 5H5V4Zm1.5 0a1.5 1.5 0 0 1 3 0v1h-3V4ZM8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 1.5a2.5 2.5 0 0 0-2.236 1.382.75.75 0 0 0 .672 1.118h3.128a.75.75 0 0 0 .672-1.118A2.5 2.5 0 0 0 8 10.5Z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">{translate('coursesGradesBtn')}</span>
                    </a>
                    <a href={`/dashboard/teacher/attendance?course=${c.courseId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elev)] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                      </svg>
                      <span className="hidden sm:inline">{translate('coursesAttendanceBtn')}</span>
                    </a>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.slots.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-full px-2.5 py-1 text-[var(--color-text-muted)]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-50">
                        <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3A2 2 0 0 1 14 5v7.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75Z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-[var(--color-text)]">{s.day}</span>
                      {s.start && <span>{s.start.slice(0, 5)}–{s.end.slice(0, 5)}</span>}
                      {s.room && <span className="hidden sm:inline opacity-60">· {s.room}</span>}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 border-t border-[var(--color-border)]">
                <MiniStat
                  label={translate('courseStatStudents')}
                  value={c.studentsCount ?? '—'}
                  colorClass="text-[var(--color-text)]"
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-blue-500">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                    </svg>
                  }
                />
                <MiniStat
                  label={translate('courseStatAvgAtt')}
                  value={c.attendanceRate != null ? `${c.attendanceRate}%` : '—'}
                  colorClass={attColorClass}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-emerald-500">
                      <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                    </svg>
                  }
                />
                <MiniStat
                  label={translate('courseStatAverage')}
                  value={c.average != null ? `${c.average}/20` : '—'}
                  colorClass={avgColorClass}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-amber-500">
                      <path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.595a.75.75 0 0 1-1.12.814L8 11.989l-3.136 1.825a.75.75 0 0 1-1.12-.814l.853-3.595L1.806 7.215a.75.75 0 0 1 .428-1.317l3.664-.293L7.308 2.212A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" />
                    </svg>
                  }
                />
                <MiniStat
                  label={translate('courseStatPassRate')}
                  value={c.passRate != null ? `${c.passRate}%` : '—'}
                  colorClass={passColorClass}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-violet-500">
                      <path fillRule="evenodd" d="M5.25 1A2.25 2.25 0 0 0 3 3.25v9.5A2.25 2.25 0 0 0 5.25 15h5.5A2.25 2.25 0 0 0 13 12.75v-9.5A2.25 2.25 0 0 0 10.75 1h-5.5ZM8 10a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 10Zm2.28-5.22a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 0 1-1.06 0l-1-1a.75.75 0 0 1 1.06-1.06l.47.47 1.47-1.47a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
                    </svg>
                  }
                />
              </div>

              <div className="px-3 sm:px-5 pb-3 sm:pb-4">
                <button
                  onClick={() => toggleCourse(c.courseId)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors border ${
                    isOpen
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/15'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:bg-[var(--color-bg-elev)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                  {isOpen
                    ? translate('courseHideStudents')
                    : c.studentsCount
                      ? translate('courseViewStudentsN', { n: c.studentsCount })
                      : translate('courseViewStudents')}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>

              {isOpen && (
                <div className="border-t border-[var(--color-border)]">
                  <CourseStudents
                    students={studentsCache[c.courseId]}
                    loading={!!studentsLoading[c.courseId]}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
