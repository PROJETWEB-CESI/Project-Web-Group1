'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import GradeEvolutionChart from '@/components/student/GradeEvolutionChart';
import WeekSchedule from '@/components/student/WeekSchedule';

/**
 * SINGLE PATH ONLY: /dashboard/student
 * Only the content inside the main area of the dashboard layout changes (via ?tab=).
 * The layout (header + sidebar) stays mounted — no full page loads.
 * Uses current globals.css tokens for fidelity.
 * Final functional version (interactions, realistic data for the test student).
 * Backend data via services + updated seeding later.
 */

const TABS = {
  dashboard: 'Dashboard',
  schedule: 'Schedule',
  grades: 'Grades',
  absences: 'Absences',
  history: 'History',
  payment: 'Payment',
  notifications: 'Notifications',
};

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

function formatTimeUntil(minutesAway) {
  if (minutesAway < 60) return `dans ${minutesAway} min`;
  if (minutesAway < 24 * 60) return `dans ${Math.floor(minutesAway / 60)} h`;
  if (minutesAway < 2 * 24 * 60) return 'demain';
  return `dans ${Math.floor(minutesAway / (24 * 60))} jours`;
}

export default function StudentDashboard() {
  const { translate } = useLanguage();
  const searchParams = useSearchParams();
  const { notificationCount, clearNotifications } = useNotifications();

  const currentTab = (searchParams?.get('tab') || 'dashboard').toLowerCase();

  // Real data fetched from services (seeded in academic/scheduling/billing for test student STU001)
  const [gradesData, setGradesData] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [semesterAverages, setSemesterAverages] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [studentProfile, setStudentProfile] = useState(null);
  const [kpis, setKpis] = useState({ average: null, attendanceRate: null, tuition: null, credits: null, totalCredits: null, currentSemesterLabel: null });
  const [notifs, setNotifs] = useState([
    { id: 1, type: 'Changement EDT', title: 'Introduction au Business lundi 4 déc. — salle modifiée', time: 'il y a 12 min', read: false },
    { id: 2, type: 'Échéance', title: 'Examen Économie Internationale dans 7 jours', time: 'il y a 1 h', read: false },
  ]);

  const { apiFetch } = useApi();

  useEffect(() => {
    const campusId = 'CAMP001';
    const studentId = 'STU001'; // from seeding for student@test.com

    const fetchJson = async (url) => {
      try {
        const response = await apiFetch(url);
        return response.ok ? await response.json() : [];
      } catch {
        return [];
      }
    };

    // Fetch all data in parallel
    Promise.all([
      fetchJson(`/api/grades/student/${studentId}?campusId=${campusId}`),
      fetchJson(`/api/attendance/student/${studentId}?campusId=${campusId}`),
      fetchJson(`/api/students/${studentId}/enrollments?campusId=${campusId}`),
      fetchJson(`/api/payments/student/${studentId}/summary`),
      fetchJson(`/api/timetables/?campusId=${campusId}`),
      fetchJson(`/api/attendance/student/${studentId}/stats?campusId=${campusId}`),
      fetchJson(`/api/students/${studentId}?campusId=${campusId}`),
    ]).then(([grades, absences, enrollments, paymentSummary, allTimetables, attendanceStats, profile]) => {
      if (profile && profile.firstName) setStudentProfile(profile);
      setGradesData(grades);
      setAbsences(absences);
      setEnrollments(enrollments);
      setPayments(Array.isArray(paymentSummary) ? paymentSummary : []);

      // Build semester averages from enrollments + grades
      if (enrollments.length > 0 && grades.length > 0) {
        // Group enrollments by "academicYear-semester", sorted chronologically
        const semMap = new Map();
        for (const enr of enrollments) {
          const key = `${enr.academicYear || '?'}-S${enr.semester || '?'}`;
          if (!semMap.has(key)) semMap.set(key, { label: `S${enr.semester}`, year: enr.academicYear, semester: enr.semester, courseIds: [] });
          semMap.get(key).courseIds.push(enr.courseId);
        }

        const sorted = [...semMap.values()].sort((a, b) => {
          if (a.year !== b.year) return (a.year || '').localeCompare(b.year || '');
          return (a.semester || 0) - (b.semester || 0);
        });

        const points = sorted.map((sem) => {
          const semGrades = grades.filter((g) => sem.courseIds.includes(g.courseId));
          if (semGrades.length === 0) return null;
          const weightedSum = semGrades.reduce((s, g) => s + (parseFloat(g.score || 0) * (g.coefficient || 1)), 0);
          const totalCoeff = semGrades.reduce((s, g) => s + (g.coefficient || 1), 0);
          return { label: sem.label, value: totalCoeff > 0 ? Math.round((weightedSum / totalCoeff) * 10) / 10 : null };
        }).filter((p) => p !== null && p.value !== null);

        if (points.length > 0) setSemesterAverages(points);
      }

      // KPIs — semestre actuel = dernière entrée chronologique dans enrollments
      if (enrollments.length > 0) {
        const sorted = [...enrollments].sort((a, b) => {
          if (a.academicYear !== b.academicYear) return (a.academicYear || '').localeCompare(b.academicYear || '');
          return (a.semester || 0) - (b.semester || 0);
        });
        const lastYear = sorted[sorted.length - 1].academicYear;
        const lastSem  = sorted[sorted.length - 1].semester;
        const current  = sorted.filter(e => e.academicYear === lastYear && e.semester === lastSem);
        const currentCourseIds = new Set(current.map(e => e.courseId));

        // Moyenne pondérée du semestre actuel
        const semGrades = grades.filter(g => currentCourseIds.has(g.courseId));
        const wSum = semGrades.reduce((s, g) => s + parseFloat(g.score || 0) * (g.coefficient || 1), 0);
        const wCoeff = semGrades.reduce((s, g) => s + (g.coefficient || 1), 0);
        const average = wCoeff > 0 ? Math.round((wSum / wCoeff) * 10) / 10 : null;

        // Crédits : somme des crédits des cours du semestre actuel (validés ou en cours)
        const earnedCredits = current.reduce((s, e) => s + (e.course?.credits || 0), 0);
        // Total ECTS théoriques tous semestres confondus
        const totalCredits  = enrollments.reduce((s, e) => s + (e.course?.credits || 0), 0);

        setKpis({
          average,
          attendanceRate: attendanceStats?.attendanceRate ?? null,
          tuition: paymentSummary?.totalInvoiced ?? null,
          credits: earnedCredits,
          totalCredits,
          currentSemesterLabel: `S${lastSem} ${lastYear}`,
        });
      }

      // Filter timetables to only those for courses the student is enrolled in
      const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));
      const filteredTimetables = allTimetables.filter(t => enrolledCourseIds.has(t.course_id));
      setTimetables(filteredTimetables);
    });
  }, []);

  const markNotifRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (currentTab === 'notifications') clearNotifications();
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    clearNotifications();
  };

  const justifyAbsence = (id) => {
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: 'Justifiée (en attente de validation)' } : a));
    // In real: would call backend, then update notifs count via context
  };

  const payEcheance = (index) => {
    const updated = [...payments];
    updated[index].status = 'Payé';
    setPayments(updated);
  };


  const renderSection = () => {
    switch (currentTab) {
      case 'schedule': {
        const HOUR_HEIGHT  = 64; // px per hour
        const START_HOUR   = 8;
        const END_HOUR     = 19;
        const SCH_HOURS    = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
        const SCH_DAY_LABELS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN'];
        const SCH_DAY_KEYS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const SCH_PALETTE = [
          { bg: 'bg-blue-50',   border: 'border-l-blue-500',   text: 'text-blue-800'   },
          { bg: 'bg-green-50',  border: 'border-l-green-500',  text: 'text-green-800'  },
          { bg: 'bg-amber-50',  border: 'border-l-amber-500',  text: 'text-amber-800'  },
          { bg: 'bg-purple-50', border: 'border-l-purple-500', text: 'text-purple-800' },
          { bg: 'bg-pink-50',   border: 'border-l-pink-500',   text: 'text-pink-800'   },
          { bg: 'bg-teal-50',   border: 'border-l-teal-500',   text: 'text-teal-800'   },
        ];

        // Color map: one color per course
        const schColorMap = {};
        let schColorIdx = 0;
        for (const t of timetables) {
          if (!schColorMap[t.course_id]) {
            schColorMap[t.course_id] = SCH_PALETTE[schColorIdx % SCH_PALETTE.length];
            schColorIdx++;
          }
        }

        // Group courses by day
        const schByDay = {};
        for (const k of SCH_DAY_KEYS) schByDay[k] = [];
        for (const t of timetables) {
          if (schByDay[t.day_of_week]) schByDay[t.day_of_week].push(t);
        }

        // Week dates based on weekOffset
        const schNow         = new Date();
        const schTarget      = new Date(schNow);
        schTarget.setDate(schNow.getDate() + weekOffset * 7);
        const schDayIdx      = schTarget.getDay();
        const schMonday      = new Date(schTarget);
        schMonday.setDate(schTarget.getDate() - (schDayIdx === 0 ? 6 : schDayIdx - 1));
        const schWeekDays    = Array.from({ length: 5 }, (_, i) => {
          const d = new Date(schMonday);
          d.setDate(schMonday.getDate() + i);
          return d;
        });

        // Week number
        const schSOY     = new Date(schTarget.getFullYear(), 0, 1);
        const schWeekNum = Math.ceil(((schTarget - schSOY) / 86400000 + schSOY.getDay() + 1) / 7);

        // Header date range  e.g. "4 – 8 décembre 2023"
        const schFmt = (d, opts) => d.toLocaleDateString('fr-FR', opts);
        const schStart = schWeekDays[0];
        const schEnd   = schWeekDays[4];
        const schDateRange = schStart.getMonth() === schEnd.getMonth()
          ? `${schStart.getDate()} – ${schFmt(schEnd, { day: 'numeric', month: 'long', year: 'numeric' })}`
          : `${schFmt(schStart, { day: 'numeric', month: 'long' })} – ${schFmt(schEnd, { day: 'numeric', month: 'long', year: 'numeric' })}`;

        // Convert "HH:MM:SS" → minutes offset from START_HOUR
        const schToMin = (ts) => {
          const p = (ts || `${START_HOUR}:00`).split(':').map(Number);
          return p[0] * 60 + (p[1] || 0) - START_HOUR * 60;
        };

        return (
          <div>
            {/* ── Navigation ── */}
            <div className="flex items-center gap-2 mb-4 select-none text-sm">
              <button
                onClick={() => setWeekOffset(v => v - 1)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg leading-none"
              >‹</button>
              <span className="font-medium italic text-[var(--color-text)] min-w-[80px]">Semaine {schWeekNum}</span>
              <span className="text-[var(--color-text-muted)]">{schDateRange}</span>
              <button
                onClick={() => setWeekOffset(v => v + 1)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-lg leading-none"
              >›</button>
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="ml-3 px-3 py-1 border border-[var(--color-border)] rounded text-sm hover:bg-[var(--color-surface)] text-[var(--color-text)]"
                >Aujourd'hui</button>
              )}
            </div>

            {/* ── Calendar grid ── */}
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">

              {/* Headers + time grid — no scroll, full height */}
              <div>
                <div className="grid" style={{ gridTemplateColumns: '56px repeat(5, 1fr)' }}>

                  {/* ── Sticky day headers (6 cells, row 1) ── */}
                  <div className="border-b border-r border-[var(--color-border)] bg-[var(--color-surface)]" />
                  {SCH_DAY_KEYS.map((dayKey, i) => {
                    const date    = schWeekDays[i];
                    const isToday = weekOffset === 0 && date.toDateString() === schNow.toDateString();
                    return (
                      <div key={`hdr-${dayKey}`}
                        className={`text-center py-3 border-b border-l border-[var(--color-border)] ${isToday ? 'bg-blue-50' : 'bg-[var(--color-surface)]'}`}>
                        <div className={`text-xs font-semibold tracking-widest ${isToday ? 'text-blue-600' : 'text-[var(--color-text-muted)]'}`}>
                          {SCH_DAY_LABELS[i]}
                        </div>
                        <div className={`text-2xl font-light mt-0.5 ${isToday ? 'text-blue-600' : 'text-[var(--color-text)]'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    );
                  })}

                  {/* Hour labels column */}
                  <div className="border-r border-[var(--color-border)]">
                    {SCH_HOURS.map(h => (
                      <div key={h}
                        style={{ height: `${HOUR_HEIGHT}px` }}
                        className="relative border-t border-[var(--color-border)]">
                        <span className="absolute right-2 top-0.5 text-xs text-[var(--color-text-muted)] tabular-nums">
                          {String(h).padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {SCH_DAY_KEYS.map((dayKey, i) => {
                    const courses = schByDay[dayKey];
                    const isToday = weekOffset === 0 && schWeekDays[i].toDateString() === schNow.toDateString();
                    return (
                      <div key={dayKey}
                        className={`border-l border-[var(--color-border)] relative ${isToday ? 'bg-blue-50/30' : ''}`}
                        style={{ height: `${SCH_HOURS.length * HOUR_HEIGHT}px` }}>

                        {/* Horizontal hour lines */}
                        {SCH_HOURS.map(h => (
                          <div key={h}
                            className="absolute w-full border-t border-[var(--color-border)]"
                            style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                          />
                        ))}

                        {/* Course blocks */}
                        {courses.map((t, j) => {
                          const startMin = schToMin(t.start_time);
                          const endMin   = schToMin(t.end_time);
                          if (startMin < 0 || startMin >= (END_HOUR - START_HOUR) * 60) return null;
                          const topPx    = (startMin / 60) * HOUR_HEIGHT + 2;
                          const heightPx = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT - 4, 26);
                          const v        = schColorMap[t.course_id] || SCH_PALETTE[0];
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
                                  Prof. {t.instructor.first_name} {t.instructor.last_name}
                                  {t.course?.course_type ? ` · ${t.course.course_type}` : ''}
                                </div>
                              )}
                              {heightPx > 76 && t.room && (
                                <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-0.5 leading-none">
                                  <span className="text-red-400 text-[10px]">●</span>
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
              </div>
            </div>

          </div>
        );
      }

      case 'grades':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Notes & Évaluations — Semestre 1 2023/2024</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
                <div className="text-xs text-[var(--color-text-muted)]">MOYENNE GÉNÉRALE</div>
                <div className="text-3xl font-semibold mt-1">14,2 <span className="text-base">/20</span></div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
                <div className="text-xs text-[var(--color-text-muted)]">RANG DANS LA PROMO</div>
                <div className="text-3xl font-semibold mt-1">7 <span className="text-base">/64</span></div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
                <div className="text-xs text-[var(--color-text-muted)]">ECTS ACQUIS</div>
                <div className="text-3xl font-semibold mt-1">20 <span className="text-base">/30</span></div>
              </div>
            </div>

            <h3 className="font-medium mb-2">Détail par matière (actual data from academic-service)</h3>
            {gradesData.length > 0 ? gradesData.slice(0, 3).map((g, idx) => (
              <div key={idx} className="mb-4 border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-bg-elev)]">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">{g.courseId || g.evaluationName}</div>
                  <div className="text-sm">Score: <span className="font-semibold">{g.score}/{g.scoreMax}</span> (coef {g.coefficient})</div>
                </div>
              </div>
            )) : <p className="text-[var(--color-text-muted)]">Aucune note (seeded in academic-service for STU001).</p>}
            <button onClick={() => alert('Export bulletin (demo)')} className="mt-2 px-3 py-1.5 text-sm rounded bg-[var(--color-primary)] text-[var(--color-on-primary)]">Exporter bulletin PDF</button>
          </div>
        );

      case 'absences':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Mes absences — Semestre 1 2023/2024 (actual from academic-service)</h2>
            <div className="flex gap-4 mb-6">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 flex-1">
                <div className="text-xs text-[var(--color-text-muted)]">TAUX DE PRÉSENCE</div>
                <div className="text-3xl font-semibold mt-1 text-green-600">96%</div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 flex-1">
                <div className="text-xs text-[var(--color-text-muted)]">ABSENCES TOTALES</div>
                <div className="text-3xl font-semibold mt-1">{absences.length}</div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 flex-1">
                <div className="text-xs text-[var(--color-text-muted)]">NON JUSTIFIÉES</div>
                <div className="text-3xl font-semibold mt-1 text-[var(--color-error)]">{absences.filter(a => !a.justified).length} <span className="text-base">(seuil alerte : 4)</span></div>
              </div>
            </div>

            <h3 className="font-medium mb-2">Historique</h3>
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface)]">
                  <tr>
                    <th className="p-3 text-left">Date</th><th className="p-3 text-left">Cours</th><th className="p-3 text-left">Statut</th><th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                  {absences.length > 0 ? absences.map(a => (
                    <tr key={a.id}>
                      <td className="p-3">{a.sessionDate}</td>
                      <td className="p-3">{a.courseId}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${!a.justified ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'}`}>{a.status} {a.justified ? '(justified)' : ''}</span></td>
                      <td className="p-3 text-right">{!a.justified && <button onClick={() => justifyAbsence(a.id)} className="text-sm px-3 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]">Justifier</button>}</td>
                    </tr>
                  )) : <tr><td colSpan="4" className="p-3 text-[var(--color-text-muted)]">Aucune absence (seeded in academic-service).</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'history':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-2">Historique académique (actual from academic-service enrollments)</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">{studentInfo}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">ANNÉE D'ENTRÉE</div><div className="text-2xl font-semibold mt-1">2023</div></div>
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">SEMESTRES VALIDÉS</div><div className="text-2xl font-semibold mt-1">0 <span className="text-base">/6</span></div></div>
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">COURS SUIVIS</div><div className="text-2xl font-semibold mt-1">{enrollments.length}</div></div>
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">STATUT</div><div className="text-2xl font-semibold mt-1 text-[var(--color-success)]">Actif</div></div>
            </div>
            <h3 className="font-medium mb-2">Inscriptions semestrielles</h3>
            <table className="w-full text-sm border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">
              <thead className="bg-[var(--color-surface)]"><tr><th className="p-3 text-left">Cours</th><th className="p-3 text-left">Semestre</th><th className="p-3 text-left">Présence</th><th className="p-3 text-left">Statut</th></tr></thead>
              <tbody className="divide-y text-[var(--color-text)]">
                {enrollments.length > 0 ? enrollments.map((e, i) => <tr key={i}><td className="p-3">{e.courseId}</td><td className="p-3">S{e.semester}</td><td className="p-3">{e.attendanceRate || 0}%</td><td className="p-3">{e.status}</td></tr>) : <tr><td colSpan="4" className="p-3 text-[var(--color-text-muted)]">Aucune inscription (seeded).</td></tr>}
              </tbody>
            </table>
          </div>
        );

      case 'payment':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Paiements & Scolarité (actual from billing-service)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] p-4"><div className="text-sm opacity-90">SOLDE RESTANT</div><div className="text-3xl font-semibold mt-1">1 350 €</div><div className="text-xs mt-1">Prochaine échéance : 15 juin 2026</div></div>
              <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">PAYÉ 2025-26</div><div className="text-3xl font-semibold mt-1">4 050 €</div><div className="text-xs">3 échéances honorées</div></div>
              <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">Bourse / Aide</div><div className="text-3xl font-semibold mt-1">800 €</div><div className="text-xs">CROUS échelon 2</div></div>
            </div>
            <h3 className="font-medium mb-2">Échéancier</h3>
            <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
              {payments.length > 0 ? payments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div><div>{p.dueDate || p.echeance} — {p.description || p.desc || 'Frais'}</div><div className="text-sm text-[var(--color-text-muted)]">{p.amount} €</div></div>
                  <div className="flex items-center gap-3"><span className={`text-sm px-2 py-0.5 rounded ${p.status === 'paid' || p.status === 'Payé' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>{p.status}</span>{(p.status === 'pending' || p.status === 'À payer') && <button onClick={() => payEcheance(idx)} className="px-3 py-1 text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded">Payer maintenant</button>}</div>
                </div>
              )) : <div className="p-3 text-[var(--color-text-muted)]">Aucun paiement (seeded in billing-service for STU001).</div>}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Notifications</h2>
              <button onClick={markAllRead} className="text-sm px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-hover)]">Tout marquer comme lu</button>
            </div>
            <div className="space-y-2">
              {notifs.length === 0 && <p className="text-[var(--color-text-muted)]">Aucune notification.</p>}
              {notifs.map(n => (
                <div key={n.id} className={`p-3 rounded border ${n.read ? 'border-[var(--color-border)] bg-[var(--color-bg-elev)]' : 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'}`}>
                  <div className="flex justify-between"><div><div className="font-medium">{n.title}</div><div className="text-xs text-[var(--color-text-muted)]">{n.type} • {n.time}</div></div>{!n.read && <button onClick={() => markNotifRead(n.id)} className="text-sm text-[var(--color-primary)]">Marquer lu</button>}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">Live updates via NotificationContext (no page refresh needed). Badge in sidebar syncs automatically.</p>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              {studentProfile ? <>Bonjour {studentProfile.firstName} 👋</> : null}
            </h1>
            {studentProfile?.program?.programName && studentProfile?.campus?.campusName && (
              <p className="text-[var(--color-text-muted)] mb-6">
                {studentProfile.program.programName} · {studentProfile.campus.campusName}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
                <div className="text-xs text-[var(--color-text-muted)]">MOYENNE {kpis.currentSemesterLabel || '—'}</div>
                <div className="text-3xl font-semibold mt-1">
                  {kpis.average !== null ? kpis.average.toFixed(1).replace('.', ',') : '—'}
                  {kpis.average !== null && <span className="text-base align-super">/20</span>}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
                <div className="text-xs text-[var(--color-text-muted)]">TAUX DE PRÉSENCE</div>
                <div className={`text-3xl font-semibold mt-1 ${kpis.attendanceRate !== null ? (kpis.attendanceRate >= 80 ? 'text-green-600' : 'text-[var(--color-error)]') : ''}`}>
                  {kpis.attendanceRate !== null ? `${kpis.attendanceRate}%` : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
                <div className="text-xs text-[var(--color-text-muted)]">FRAIS DE SCOLARITÉ</div>
                <div className="text-3xl font-semibold mt-1">
                  {kpis.tuition !== null ? `${kpis.tuition.toLocaleString('fr-FR')} €` : '—'}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
                <div className="text-xs text-[var(--color-text-muted)]">CRÉDITS {kpis.currentSemesterLabel || '—'}</div>
                <div className="text-3xl font-semibold mt-1">
                  {kpis.credits !== null ? kpis.credits : '—'}
                  {kpis.totalCredits > 0 && <span className="text-base align-super">/{kpis.totalCredits}</span>}
                </div>
              </div>
            </div>
            {(() => {
              const nextCourse = getNextCourse(timetables);
              if (!nextCourse) return null;
              const roomChanged = nextCourse.status && nextCourse.status !== 'Active';
              return (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mb-6 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-muted)]">
                      Prochain cours · <span className="font-medium text-[var(--color-text)]">{formatTimeUntil(nextCourse.minutesAway)}</span>
                    </span>
                    {roomChanged && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 flex items-center gap-1">
                        ⚠ Salle changée
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
                        {nextCourse.instructor && `Prof. ${nextCourse.instructor.first_name} ${nextCourse.instructor.last_name} · `}
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
              );
            })()}

            <WeekSchedule timetables={timetables} />

            <div className="mt-6">
              <GradeEvolutionChart data={semesterAverages} />
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {renderSection()}
    </div>
  );
}
