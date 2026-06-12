'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/lib/api';

const StudentDashboardContext = createContext(null);

// Fetches and derives all data shared across /dashboard/student/* tabs once,
// so navigating between tabs (separate routes/mounts) doesn't re-trigger
// the full set of API calls on every transition (was hitting rate limits
// when switching tabs quickly).
export function StudentDashboardProvider({ children }) {
  const { clearNotifications, markOneRead, setNotificationCount } = useNotifications();
  const { user } = useAuth();
  const { apiFetch } = useApi();

  const [gradesData,       setGradesData]       = useState([]);
  const [absences,         setAbsences]         = useState([]);
  const [enrollments,      setEnrollments]      = useState([]);
  const [payments,         setPayments]         = useState([]);
  const [billingSummary,   setBillingSummary]   = useState(null);
  const [semesterAverages, setSemesterAverages] = useState(null);
  const [timetables,       setTimetables]       = useState([]);
  const [studentProfile,   setStudentProfile]   = useState(null);
  const [gradeStats,       setGradeStats]       = useState(null);
  const [attStats,         setAttStats]         = useState(null);
  const [kpis, setKpis] = useState({
    average: null, attendanceRate: null, tuition: null,
    credits: null, totalCredits: null, currentSemesterLabel: null,
  });
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const studentId = user?.studentId;
    const campusId  = user?.campusId;
    if (!studentId || !campusId) return;

    const fetchJson = async (url) => {
      try {
        const res = await apiFetch(url);
        return res.ok ? await res.json() : [];
      } catch {
        return [];
      }
    };

    Promise.all([
      fetchJson(`/api/grades/student/${studentId}?campusId=${campusId}`),
      fetchJson(`/api/attendance/student/${studentId}?campusId=${campusId}`),
      fetchJson(`/api/students/${studentId}/enrollments?campusId=${campusId}`),
      fetchJson(`/api/payments/student/${studentId}/summary`),
      fetchJson(`/api/timetables/?campusId=${campusId}`),
      fetchJson(`/api/attendance/student/${studentId}/stats?campusId=${campusId}`),
      fetchJson(`/api/students/${studentId}?campusId=${campusId}`),
      fetchJson(`/api/grades/student/${studentId}/stats?campusId=${campusId}`),
      fetchJson('/api/notifications'),
      fetchJson(`/api/grades/student/${studentId}/semester-class-averages?campusId=${campusId}`),
    ]).then(([grades, att, enr, paymentSummary, allTimetables, attStats, profile, stats, notifications, semClassAvgs]) => {
      if (profile?.firstName) setStudentProfile(profile);
      if (stats?.rank != null) setGradeStats(stats);
      if (attStats) setAttStats(attStats);
      setGradesData(grades);
      setAbsences(att);
      setEnrollments(enr);
      if (paymentSummary && !Array.isArray(paymentSummary)) {
        setBillingSummary(paymentSummary);
        setPayments(Array.isArray(paymentSummary.payments) ? paymentSummary.payments : []);
      } else {
        setPayments([]);
      }

      if (enr.length > 0 && grades.length > 0) {
        const semMap = new Map();
        for (const e of enr) {
          const key = `${e.academicYear || '?'}-S${e.semester || '?'}`;
          if (!semMap.has(key)) semMap.set(key, { label: `S${e.semester}`, year: e.academicYear, semester: e.semester, courseIds: [] });
          semMap.get(key).courseIds.push(e.courseId);
        }
        const sorted = [...semMap.values()].sort((a, b) => {
          if (a.year !== b.year) return (a.year || '').localeCompare(b.year || '');
          return (a.semester || 0) - (b.semester || 0);
        });

        const classAvgByLabel = Array.isArray(semClassAvgs)
          ? Object.fromEntries(semClassAvgs.map(s => [s.label, s.classAverage]))
          : {};

        const points = sorted.map(sem => {
          const sg = grades.filter(g => sem.courseIds.includes(g.courseId));
          if (!sg.length) return null;
          const wSum   = sg.reduce((s, g) => s + parseFloat(g.score || 0) * (g.coefficient || 1), 0);
          const wCoeff = sg.reduce((s, g) => s + (g.coefficient || 1), 0);
          const value = wCoeff > 0 ? Math.round((wSum / wCoeff) * 10) / 10 : null;
          if (value === null) return null;
          return {
            label: sem.label,
            value,
            classAverage: classAvgByLabel[sem.label] ?? null,
          };
        }).filter(p => p !== null);
        if (points.length > 0) setSemesterAverages(points);
      }

      if (enr.length > 0) {
        const sorted     = [...enr].sort((a, b) => {
          if (a.academicYear !== b.academicYear) return (a.academicYear || '').localeCompare(b.academicYear || '');
          return (a.semester || 0) - (b.semester || 0);
        });
        const lastYear   = sorted[sorted.length - 1].academicYear;
        const lastSem    = sorted[sorted.length - 1].semester;
        const current    = sorted.filter(e => e.academicYear === lastYear && e.semester === lastSem);
        const currentIds = new Set(current.map(e => e.courseId));
        const sg         = grades.filter(g => currentIds.has(g.courseId));
        const wSum       = sg.reduce((s, g) => s + parseFloat(g.score || 0) * (g.coefficient || 1), 0);
        const wCoeff     = sg.reduce((s, g) => s + (g.coefficient || 1), 0);
        setKpis({
          average:              wCoeff > 0 ? Math.round((wSum / wCoeff) * 10) / 10 : null,
          attendanceRate:       attStats?.attendanceRate ?? null,
          tuition:              paymentSummary?.totalInvoiced ?? null,
          credits:              current.reduce((s, e) => s + (e.course?.credits || 0), 0),
          totalCredits:         enr.reduce((s, e) => s + (e.course?.credits || 0), 0),
          currentSemesterLabel: `S${lastSem} ${lastYear}`,
        });
      }

      const enrolledIds = new Set(enr.map(e => e.courseId));
      setTimetables(allTimetables.filter(t => enrolledIds.has(t.course_id)));

      if (Array.isArray(notifications)) {
        setNotifs(notifications);
        setNotificationCount(notifications.filter(n => !n.read).length);
      }
    });
  }, [user]);

  const markNotifRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
    markOneRead();
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    apiFetch('/api/notifications/read-all', { method: 'PUT' }).catch(() => {});
    clearNotifications();
  };

  const justifyAbsence = (id) => {
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, pendingJustification: true } : a));
  };

  const payEcheance = (index) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, status: 'Paid' } : p));
  };

  const value = {
    user,
    gradesData, absences, enrollments, payments, billingSummary,
    semesterAverages, timetables, studentProfile, gradeStats, attStats, kpis, notifs,
    markNotifRead, markAllRead, justifyAbsence, payEcheance,
  };

  return (
    <StudentDashboardContext.Provider value={value}>
      {children}
    </StudentDashboardContext.Provider>
  );
}

export function useStudentDashboardData() {
  const ctx = useContext(StudentDashboardContext);
  if (!ctx) {
    throw new Error('useStudentDashboardData must be used within StudentDashboardProvider');
  }
  return ctx;
}
