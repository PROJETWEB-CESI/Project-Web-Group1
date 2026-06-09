'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function TeacherDashboard() {
  const { translate } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('myDashboard') || 'My Dashboard'}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Prof. Commerce international — Bachelor Business International</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">MES COURS HEBDOMADAIRES</div>
          <div className="text-3xl font-semibold mt-1">2</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">ÉTUDIANTS ENCADRÉS</div>
          <div className="text-3xl font-semibold mt-1">4</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">PRÉSENCE MOYENNE</div>
          <div className="text-3xl font-semibold mt-1">94.1%</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">SPÉCIALITÉ</div>
          <div className="text-lg font-semibold mt-1">Commerce international</div>
          <div className="text-xs text-muted">Dépt. Business • Paris</div>
        </div>
      </div>

      <div className="text-sm text-[var(--color-text-muted)]">
        Base teacher dashboard shell. Expand with "Mes cours" list, quick attendance actions, and performance charts to match Teacher_dashboard.png.
      </div>
    </div>
  );
}
