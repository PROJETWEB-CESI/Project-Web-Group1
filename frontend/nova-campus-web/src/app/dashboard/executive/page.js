'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function ExecutiveDashboard() {
  const { translate } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('myDashboard') || 'My Dashboard'}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Tableau de bord exécutif — Direction générale</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">ÉTUDIANTS TOTAL</div>
          <div className="text-3xl font-semibold mt-1">1 605</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">CA S1 2023-2024</div>
          <div className="text-3xl font-semibold mt-1">7.13 M€</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">TAUX DE RÉUSSITE</div>
          <div className="text-3xl font-semibold mt-1">87.6%</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">TAUX D'IMPAYÉS MOYEN</div>
          <div className="text-3xl font-semibold mt-1">7.4%</div>
        </div>
      </div>

      <div className="text-sm text-[var(--color-text-muted)]">
        Executive consolidated dashboard base. Populate with campus performance bars, strategic alerts, and program mix to match executive_dashboard.png.
      </div>
    </div>
  );
}
