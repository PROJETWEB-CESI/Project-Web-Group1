'use client';

import { useSearchParams } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useApi } from '@/lib/api';
import { useState, useEffect } from 'react';

import DashboardTab      from '@/components/student/DashboardTab';
import ScheduleTab       from '@/components/student/ScheduleTab';
import GradesTab         from '@/components/student/GradesTab';
import AbsencesTab       from '@/components/student/AbsencesTab';
import HistoryTab        from '@/components/student/HistoryTab';
import PaymentTab        from '@/components/student/PaymentTab';
import NotificationsTab  from '@/components/student/NotificationsTab';

export default function StudentDashboard() {
  const searchParams = useSearchParams();
  const { clearNotifications } = useNotifications();

  const currentTab = (searchParams?.get('tab') || 'dashboard').toLowerCase();

  const [gradesData,       setGradesData]       = useState([]);
  const [absences,         setAbsences]         = useState([]);
  const [enrollments,      setEnrollments]      = useState([]);
  const [payments,         setPayments]         = useState([]);
  const [semesterAverages, setSemesterAverages] = useState(null);
  const [timetables,       setTimetables]       = useState([]);
  const [studentProfile,   setStudentProfile]   = useState(null);
  const [kpis, setKpis] = useState({
    average: null, attendanceRate: null, tuition: null,
    credits: null, totalCredits: null, currentSemesterLabel: null,
  });
  const [notifs, setNotifs] = useState([
    { id: 1, type: 'Changement EDT', title: 'Introduction au Business lundi 4 déc. — salle modifiée', time: 'il y a 12 min', read: false },
    { id: 2, type: 'Échéance',       title: 'Examen Économie Internationale dans 7 jours',            time: 'il y a 1 h',   read: false },
  ]);

  const { apiFetch } = useApi();

  useEffect(() => {
    const campusId  = 'CAMP001';
    const studentId = 'STU001';

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
    ]).then(([grades, att, enr, paymentSummary, allTimetables, attStats, profile]) => {
      if (profile?.firstName) setStudentProfile(profile);
      setGradesData(grades);
      setAbsences(att);
      setEnrollments(enr);
      setPayments(Array.isArray(paymentSummary) ? paymentSummary : []);

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
        const points = sorted.map(sem => {
          const sg = grades.filter(g => sem.courseIds.includes(g.courseId));
          if (!sg.length) return null;
          const wSum   = sg.reduce((s, g) => s + parseFloat(g.score || 0) * (g.coefficient || 1), 0);
          const wCoeff = sg.reduce((s, g) => s + (g.coefficient || 1), 0);
          return { label: sem.label, value: wCoeff > 0 ? Math.round((wSum / wCoeff) * 10) / 10 : null };
        }).filter(p => p !== null && p.value !== null);
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
  };

  const payEcheance = (index) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, status: 'Payé' } : p));
  };

  const renderTab = () => {
    switch (currentTab) {
      case 'schedule':      return <ScheduleTab      timetables={timetables} />;
      case 'grades':        return <GradesTab        gradesData={gradesData} />;
      case 'absences':      return <AbsencesTab      absences={absences} justifyAbsence={justifyAbsence} />;
      case 'history':       return <HistoryTab       enrollments={enrollments} />;
      case 'payment':       return <PaymentTab       payments={payments} payEcheance={payEcheance} />;
      case 'notifications': return <NotificationsTab notifs={notifs} markNotifRead={markNotifRead} markAllRead={markAllRead} />;
      default:              return <DashboardTab     studentProfile={studentProfile} kpis={kpis} timetables={timetables} semesterAverages={semesterAverages} />;
    }
  };

  return <div>{renderTab()}</div>;
}
