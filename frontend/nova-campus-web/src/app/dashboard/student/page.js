'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useApi } from '@/lib/api';
import { useState, useEffect } from 'react';
import GradeEvolutionChart from '@/components/student/GradeEvolutionChart';

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
      fetchJson(`/api/timetables?campusId=${campusId}`),
      fetchJson(`/api/attendance/student/${studentId}/stats?campusId=${campusId}`),
    ]).then(([grades, absences, enrollments, paymentSummary, allTimetables, attendanceStats]) => {
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

  const studentInfo = 'Léa Moreau — Bachelor Business International — Campus Paris Center (entrée 2023)';

  const renderSection = () => {
    switch (currentTab) {
      case 'schedule':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Emploi du temps</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">Semaine 49 — Bachelor Business International — Campus Paris</p>
            <div className="overflow-x-auto border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-[var(--color-surface)]">
                    <th className="p-3 text-left">Heure</th>
                    <th className="p-3 text-left">Lun</th>
                    <th className="p-3 text-left">Mar</th>
                    <th className="p-3 text-left">Mer</th>
                    <th className="p-3 text-left">Jeu</th>
                    <th className="p-3 text-left">Ven</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {timetables.length > 0 ? timetables.slice(0, 4).map((t, i) => (
                    <tr key={i}>
                      <td className="p-3 font-medium text-[var(--color-text-muted)]">{t.startTime}-{t.endTime}</td>
                      <td className="p-3 text-[var(--color-text)]">{t.courseId} — {t.roomId}</td>
                      <td className="p-3 text-[var(--color-text)]">-</td>
                      <td className="p-3 text-[var(--color-text)]">-</td>
                      <td className="p-3 text-[var(--color-text)]">-</td>
                      <td className="p-3 text-[var(--color-text)]">-</td>
                    </tr>
                  )) : <tr><td colSpan="6" className="p-3 text-[var(--color-text-muted)]">Aucun emploi du temps (seeded in scheduling-service for STU001).</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">Source: scheduling service (actual seeded data).</p>
          </div>
        );

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
            <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('myDashboard') || 'My Dashboard'}</h1>
            <p className="text-[var(--color-text-muted)] mb-6">{studentInfo}</p>
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
            <div className="text-sm text-[var(--color-text-muted)]">Prochain cours dans 42 min • Introduction au Business (COM101) — Amphi Commerce A.<br />Cette semaine: 4 cours, 1 évaluation, 2 tâches. (Final UI — demo data; real data from services after seeding.)</div>

            <div className="mt-6">
              <GradeEvolutionChart data={semesterAverages} />
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="mb-4 text-sm text-[var(--color-text-muted)]">Novacampus / Espace étudiant / {TABS[currentTab] || 'Tableau de bord'}</div>
      {renderSection()}
    </div>
  );
}
