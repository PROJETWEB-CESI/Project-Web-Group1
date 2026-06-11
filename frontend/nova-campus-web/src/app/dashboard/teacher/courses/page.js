'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

const DAY_FR = { Monday: 'Lun', Tuesday: 'Mar', Wednesday: 'Mer', Thursday: 'Jeu', Friday: 'Ven' };
const DAY_ORDER = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4 };

function CourseAvatar({ name, id }) {
  const words = (name || id || '?').split(' ').filter(Boolean);
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (name || id || '?').slice(0, 2).toUpperCase();
  return (
    <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--color-primary)] select-none">
      {initials}
    </div>
  );
}

function StudentAvatar({ firstName, lastName }) {
  const initials = ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-muted)] select-none">
      {initials}
    </div>
  );
}

function StatCell({ label, value, color = '' }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span className={`text-base font-bold text-[var(--color-text)] ${color}`}>{value ?? '—'}</span>
    </div>
  );
}

function AttendanceDot({ rate }) {
  if (rate == null) return <span className="text-[var(--color-text-muted)]">—</span>;
  const color = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-500';
  return <span className={`font-semibold ${color}`}>{rate}%</span>;
}

function GradeCell({ average }) {
  if (average == null) return <span className="text-[var(--color-text-muted)]">—</span>;
  const color = average >= 14 ? 'text-emerald-600' : average >= 10 ? 'text-blue-600' : 'text-red-500';
  return <span className={`font-semibold ${color}`}>{average}/20</span>;
}

function StudentRow({ student, onExpand, expanded }) {
  return (
    <>
      <tr
        className="hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
        onClick={() => onExpand(student.studentId)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <StudentAvatar firstName={student.firstName} lastName={student.lastName} />
            <div>
              <div className="text-sm font-medium text-[var(--color-text)]">
                {student.firstName} {student.lastName}
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">{student.studentId}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
          {student.program || '—'}
          {student.enrollmentYear && <span className="ml-1 opacity-60">· {student.enrollmentYear}</span>}
        </td>
        <td className="px-4 py-3 text-center">
          <AttendanceDot rate={student.attendanceRate} />
        </td>
        <td className="px-4 py-3 text-center">
          <GradeCell average={student.average} />
        </td>
        <td className="px-4 py-3 text-center text-xs text-[var(--color-text-muted)]">
          {student.grades.length > 0 ? `${student.grades.length} éval.` : '—'}
        </td>
        <td className="px-4 py-3 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2} stroke="currentColor"
            className={`w-4 h-4 mx-auto text-[var(--color-text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </td>
      </tr>

      {/* Expanded grades */}
      {expanded && student.grades.length > 0 && (
        <tr>
          <td colSpan={6} className="px-4 pb-3 pt-0 bg-[var(--color-surface)]">
            <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left px-3 py-2 text-[var(--color-text-muted)] font-medium">Évaluation</th>
                    <th className="text-center px-3 py-2 text-[var(--color-text-muted)] font-medium">Note</th>
                    <th className="text-center px-3 py-2 text-[var(--color-text-muted)] font-medium">Coeff.</th>
                    <th className="text-center px-3 py-2 text-[var(--color-text-muted)] font-medium">Date</th>
                    <th className="text-center px-3 py-2 text-[var(--color-text-muted)] font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {student.grades.map((g, i) => (
                    <tr key={i} className="bg-[var(--color-bg-elev)]">
                      <td className="px-3 py-2 text-[var(--color-text)]">{g.evaluationName}</td>
                      <td className="px-3 py-2 text-center font-semibold text-[var(--color-text)]">
                        {g.score != null ? `${g.score}/${g.scoreMax}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center text-[var(--color-text-muted)]">{g.coefficient}</td>
                      <td className="px-3 py-2 text-center text-[var(--color-text-muted)]">
                        {g.evaluationDate ? new Date(g.evaluationDate).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {g.publishedAt
                          ? <span className="text-emerald-600 font-medium">Publiée</span>
                          : <span className="text-amber-600 font-medium">En attente</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CourseStudents({ students, loading }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (studentId) =>
    setExpanded(prev => ({ ...prev, [studentId]: !prev[studentId] }));

  if (loading) {
    return (
      <div className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
        Chargement…
      </div>
    );
  }

  if (!students?.length) {
    return (
      <div className="px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
        Aucun étudiant inscrit.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)]">Étudiant</th>
            <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)]">Promotion</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)]">Présence</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)]">Moyenne</th>
            <th className="text-center px-4 py-2.5 text-xs font-medium text-[var(--color-text-muted)]">Évals.</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {students.map(s => (
            <StudentRow
              key={s.studentId}
              student={s}
              expanded={!!expanded[s.studentId]}
              onExpand={toggleExpand}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const { apiFetch } = useApi();

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
    <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]">Chargement…</div>
  );

  if (courses.length === 0) return (
    <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--color-text-muted)]">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-30">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      <span className="text-sm">Aucun cours trouvé</span>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Mes cours</h1>
        <p className="text-[var(--color-text-muted)] mt-1">{courses.length} cours · semestre en cours</p>
      </div>

      <div className="flex flex-col gap-4">
        {courses.map((c) => {
          const avgColor  = c.average  == null ? '' : c.average  >= 14 ? 'text-emerald-600' : c.average  >= 10 ? 'text-blue-600' : 'text-red-500';
          const passColor = c.passRate == null ? '' : c.passRate >= 75 ? 'text-emerald-600' : c.passRate >= 50 ? 'text-amber-600' : 'text-red-500';
          const attColor  = c.attendanceRate == null ? '' : c.attendanceRate >= 80 ? 'text-emerald-600' : 'text-red-500';
          const isOpen    = openCourse === c.courseId;

          return (
            <div key={c.courseId} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-4 px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                <CourseAvatar name={c.courseName} id={c.courseId} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--color-text)] text-base">{c.courseName}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">({c.courseId})</span>
                    {c.courseType && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        {c.courseType}
                      </span>
                    )}
                    {c.credits && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                        {c.credits} ECTS
                      </span>
                    )}
                    {c.pendingCount > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                        {c.pendingCount} note{c.pendingCount > 1 ? 's' : ''} à publier
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {c.slots.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5 text-[var(--color-text-muted)]">
                        <span className="font-medium text-[var(--color-text)]">{DAY_FR[s.day] || s.day}</span>
                        {s.start && <>{s.start.slice(0, 5)}–{s.end.slice(0, 5)}</>}
                        {s.room && <span className="opacity-60">· {s.room}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats + actions */}
              <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap border-b border-[var(--color-border)]">
                <div className="flex gap-6 flex-wrap">
                  <StatCell label="Étudiants" value={c.studentsCount ?? '—'} />
                  <StatCell label="Présence moy." value={c.attendanceRate != null ? `${c.attendanceRate}%` : '—'} color={attColor} />
                  <StatCell label="Moyenne" value={c.average != null ? `${c.average}/20` : '—'} color={avgColor} />
                  <StatCell label="Taux de réussite" value={c.passRate != null ? `${c.passRate}%` : '—'} color={passColor} />
                </div>
                <div className="flex gap-2">
                  <a href={`/dashboard/teacher/grades?course=${c.courseId}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elev)] text-[var(--color-text)] transition-colors">
                    Notes
                  </a>
                  <a href={`/dashboard/teacher/attendance?course=${c.courseId}`}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elev)] text-[var(--color-text)] transition-colors">
                    Présences
                  </a>
                </div>
              </div>

              {/* Toggle students */}
              <button
                onClick={() => toggleCourse(c.courseId)}
                className="w-full flex items-center justify-between px-5 py-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <span className="font-medium">
                  {isOpen ? 'Masquer les étudiants' : `Voir les étudiants${c.studentsCount ? ` (${c.studentsCount})` : ''}`}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Students table (lazy, cached) */}
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
