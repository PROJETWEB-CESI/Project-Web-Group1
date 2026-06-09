'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { useState } from 'react';

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

  // Functional local state (final UI; will back with real service data)
  const [absences, setAbsences] = useState([
    { id: 1, date: '22/11/2023', creneau: '09:00 – 11:00', course: 'Anglais professionnel', enseignant: 'Mme. Carter', status: 'Non justifiée' },
    { id: 2, date: '04/11/2023', creneau: '14:00 – 17:00', course: 'Économie Internationale', enseignant: 'Prof. Thomas Bernard', status: 'Justifiée (certificat médical)' },
    { id: 3, date: '12/10/2023', creneau: '10:00 – 12:00', course: 'Introduction au Business', enseignant: 'Prof. Jean Mercier', status: 'Justifiée (convocation administrative)' },
    { id: 4, date: '08/10/2023', creneau: '08:00 – 10:00', course: 'Anglais professionnel', enseignant: 'Mme. Carter', status: 'En attente' },
  ]);

  const [payments, setPayments] = useState([
    { echeance: '15 oct. 2025', desc: 'Acompte d\'inscription', montant: '1 350 €', status: 'Payé' },
    { echeance: '15 déc. 2025', desc: 'Frais T1', montant: '1 350 €', status: 'Payé' },
    { echeance: '15 mars 2026', desc: 'Frais T2', montant: '1 350 €', status: 'Payé' },
    { echeance: '15 juin 2026', desc: 'Frais T3 — solde de scolarité', montant: '1 350 €', status: 'À payer' },
  ]);

  const [notifs, setNotifs] = useState([
    { id: 1, type: 'Changement EDT', title: 'Introduction au Business lundi 4 déc. — salle modifiée', time: 'il y a 12 min', read: false },
    { id: 2, type: 'Échéance', title: 'Examen Économie Internationale dans 7 jours', time: 'il y a 1 h', read: false },
    { id: 3, type: 'Absence', title: 'Justificatif accepté — absence du 4 nov.', time: 'il y a 2 j', read: true },
  ]);

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
                    <th className="p-3 text-left">Lun 4 déc</th>
                    <th className="p-3 text-left">Mar 5 déc</th>
                    <th className="p-3 text-left">Mer 6 déc</th>
                    <th className="p-3 text-left">Jeu 7 déc</th>
                    <th className="p-3 text-left">Ven 8 déc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'].map((slot, i) => (
                    <tr key={i}>
                      <td className="p-3 font-medium text-[var(--color-text-muted)]">{slot}</td>
                      <td className="p-3 text-[var(--color-text)]">{i === 0 ? 'Introduction au Business (COM101) — Amphi Commerce A' : i === 2 ? 'Économie Internationale — Salle 204' : '-'}</td>
                      <td className="p-3 text-[var(--color-text)]">{i === 1 ? 'Anglais Pro — Salle 12' : '-'}</td>
                      <td className="p-3 text-[var(--color-text)]">{i === 0 ? 'Projet Entrepreneurial' : i === 3 ? 'Marketing Stratégique' : '-'}</td>
                      <td className="p-3 text-[var(--color-text)]">{i === 2 ? 'Introduction au Business (TD)' : '-'}</td>
                      <td className="p-3 text-[var(--color-text)]">{i === 1 ? 'Économie Internationale (TD)' : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">Source: scheduling service (demo data from seeding for test student).</p>
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

            <h3 className="font-medium mb-2">Détail par matière</h3>
            <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)] p-4 mb-4">
              <div className="font-medium mb-2">Introduction au Business (COM101)</div>
              <div className="text-sm">Votre moyenne: <span className="font-semibold">14.2</span></div>
              <table className="w-full text-sm mt-2">
                <thead><tr className="text-[var(--color-text-muted)]"><th className="text-left">Date</th><th className="text-left">Évaluation</th><th className="text-left">Coef.</th><th className="text-left">Note</th></tr></thead>
                <tbody className="text-[var(--color-text)]">
                  <tr><td>12/10</td><td>Quiz 1</td><td>1</td><td>15/20</td></tr>
                  <tr><td>06/11</td><td>Partiel intermédiaire</td><td>2</td><td>13/20</td></tr>
                  <tr><td>22/11</td><td>Cas d'entreprise</td><td>1</td><td>16/20</td></tr>
                  <tr><td>28/11</td><td>Présentation orale</td><td>2</td><td>13/20</td></tr>
                </tbody>
              </table>
            </div>
            <button onClick={() => alert('Export bulletin (demo)')} className="mt-2 px-3 py-1.5 text-sm rounded bg-[var(--color-primary)] text-[var(--color-on-primary)]">Exporter bulletin PDF</button>
          </div>
        );

      case 'absences':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Mes absences — Semestre 1 2023/2024</h2>
            <div className="flex gap-4 mb-6">
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 flex-1">
                <div className="text-xs text-[var(--color-text-muted)]">TAUX DE PRÉSENCE</div>
                <div className="text-3xl font-semibold mt-1 text-green-600">96%</div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 flex-1">
                <div className="text-xs text-[var(--color-text-muted)]">ABSENCES TOTALES</div>
                <div className="text-3xl font-semibold mt-1">4</div>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 flex-1">
                <div className="text-xs text-[var(--color-text-muted)]">NON JUSTIFIÉES</div>
                <div className="text-3xl font-semibold mt-1 text-[var(--color-error)]">1 <span className="text-base">(seuil alerte : 4)</span></div>
              </div>
            </div>

            <h3 className="font-medium mb-2">Historique</h3>
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface)]">
                  <tr>
                    <th className="p-3 text-left">Date</th><th className="p-3 text-left">Créneau</th><th className="p-3 text-left">Cours</th><th className="p-3 text-left">Enseignant</th><th className="p-3 text-left">Statut</th><th className="p-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
                  {absences.map(a => (
                    <tr key={a.id}>
                      <td className="p-3">{a.date}</td>
                      <td className="p-3">{a.creneau}</td>
                      <td className="p-3">{a.course}</td>
                      <td className="p-3">{a.enseignant}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${a.status.includes('Non') ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'}`}>{a.status}</span></td>
                      <td className="p-3 text-right">{a.status.includes('Non') && <button onClick={() => justifyAbsence(a.id)} className="text-sm px-3 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]">Justifier</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'history':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-2">Historique académique</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">{studentInfo}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">ANNÉE D'ENTRÉE</div><div className="text-2xl font-semibold mt-1">2023</div></div>
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">SEMESTRES VALIDÉS</div><div className="text-2xl font-semibold mt-1">0 <span className="text-base">/6</span></div></div>
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">COURS SUIVIS</div><div className="text-2xl font-semibold mt-1">2</div></div>
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">STATUT</div><div className="text-2xl font-semibold mt-1 text-[var(--color-success)]">Actif</div></div>
            </div>
            <h3 className="font-medium mb-2">Parcours — Bachelor Business International</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {['S1 2023-24 (En cours)', 'S2 2024', 'S3 2024-25', 'S4 2025', 'S5 2025-26', 'S6 2026'].map((s, i) => <div key={i} className={`px-3 py-1 rounded text-sm border ${i === 0 ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}>{s}</div>)}
            </div>
            <h3 className="font-medium mb-2">Inscriptions semestrielles</h3>
            <table className="w-full text-sm border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">
              <thead className="bg-[var(--color-surface)]"><tr><th className="p-3 text-left">Cours</th><th className="p-3 text-left">Semestre</th><th className="p-3 text-left">Présence</th><th className="p-3 text-left">Note finale</th><th className="p-3 text-left">Statut</th></tr></thead>
              <tbody className="divide-y text-[var(--color-text)]"><tr><td className="p-3">Introduction au Business</td><td className="p-3">S1</td><td className="p-3">96%</td><td className="p-3">-</td><td className="p-3">En cours</td></tr><tr><td className="p-3">Économie Internationale</td><td className="p-3">S1</td><td className="p-3">91%</td><td className="p-3">-</td><td className="p-3">En cours</td></tr></tbody>
            </table>
          </div>
        );

      case 'payment':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Paiements & Scolarité — Facturation 2025/2026</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] p-4"><div className="text-sm opacity-90">SOLDE RESTANT</div><div className="text-3xl font-semibold mt-1">1 350 €</div><div className="text-xs mt-1">Prochaine échéance : 15 juin 2026</div></div>
              <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">PAYÉ 2025-26</div><div className="text-3xl font-semibold mt-1">4 050 €</div><div className="text-xs">3 échéances honorées</div></div>
              <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]"><div className="text-xs text-[var(--color-text-muted)]">Bourse / Aide</div><div className="text-3xl font-semibold mt-1">800 €</div><div className="text-xs">CROUS échelon 2</div></div>
            </div>
            <h3 className="font-medium mb-2">Échéancier</h3>
            <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
              {payments.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div><div>{p.echeance} — {p.desc}</div><div className="text-sm text-[var(--color-text-muted)]">{p.montant}</div></div>
                  <div className="flex items-center gap-3"><span className={`text-sm px-2 py-0.5 rounded ${p.status === 'Payé' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>{p.status}</span>{p.status === 'À payer' && <button onClick={() => payEcheance(idx)} className="px-3 py-1 text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded">Payer maintenant</button>}</div>
                </div>
              ))}
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
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4"><div className="text-xs text-[var(--color-text-muted)]">MOYENNE S1</div><div className="text-3xl font-semibold mt-1">14,2<span className="text-base align-super">/20</span></div></div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4"><div className="text-xs text-[var(--color-text-muted)]">TAUX DE PRÉSENCE</div><div className="text-3xl font-semibold mt-1 text-green-600">96%</div></div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4"><div className="text-xs text-[var(--color-text-muted)]">FRAIS DE SCOLARITÉ</div><div className="text-3xl font-semibold mt-1">4 250 €</div></div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4"><div className="text-xs text-[var(--color-text-muted)]">CRÉDITS S1</div><div className="text-3xl font-semibold mt-1">11<span className="text-base align-super">/30</span></div></div>
            </div>
            <div className="text-sm text-[var(--color-text-muted)]">Prochain cours dans 42 min • Introduction au Business (COM101) — Amphi Commerce A.<br />Cette semaine: 4 cours, 1 évaluation, 2 tâches. (Final UI — demo data; real data from services after seeding.)</div>
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
