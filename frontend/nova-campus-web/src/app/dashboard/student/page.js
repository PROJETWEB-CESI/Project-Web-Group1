'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function StudentDashboard() {
  const { translate } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('myDashboard') || 'My Dashboard'}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">Bachelor Business International — Campus Paris Center</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">MOYENNE S1</div>
          <div className="text-3xl font-semibold mt-1">14,2<span className="text-base align-super text-muted">/20</span></div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">TAUX DE PRÉSENCE</div>
          <div className="text-3xl font-semibold mt-1 text-green-600">96%</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">FRAIS DE SCOLARITÉ</div>
          <div className="text-3xl font-semibold mt-1">4 250 €</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">CRÉDITS S1</div>
          <div className="text-3xl font-semibold mt-1">11<span className="text-base align-super text-muted">/30</span></div>
        </div>
      </div>

      <div className="text-sm text-[var(--color-text-muted)]">
        This is the base student dashboard (layout + sidebar from mockups). Add KPI cards, next course, weekly schedule preview, tasks, and Aria suggestions here to match the full Student_dashboard.png.
      </div>
    </div>
  );
}
