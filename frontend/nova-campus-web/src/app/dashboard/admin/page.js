'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function AdminDashboard() {
  const { translate } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('myDashboard') || 'My Dashboard'}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Pilotage — Campus Paris</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">ÉTUDIANTS INSCRITS</div>
          <div className="text-3xl font-semibold mt-1">650</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">OCCUPATION SALLES</div>
          <div className="text-3xl font-semibold mt-1">78.5%</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">IMPAYÉS</div>
          <div className="text-3xl font-semibold mt-1">1</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">TAUX DE RÉUSSITE</div>
          <div className="text-3xl font-semibold mt-1 text-green-600">88.5%</div>
        </div>
      </div>

      <div className="text-sm text-[var(--color-text-muted)]">
        Admin / campus pilot dashboard base. Add programs list, unpaid students table, and finance widgets to match admin_dashboard.png.
      </div>
    </div>
  );
}
