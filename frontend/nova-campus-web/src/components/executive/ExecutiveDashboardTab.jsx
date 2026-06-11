'use client';

import { Users, Euro, TrendingUp, TrendingDown, BarChart3, AlertTriangle, Layers } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import KpiCard from './KpiCard';

function formatEuro(value) {
  if (value === null || value === undefined) return null;
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

function Dash() {
  return <span className="opacity-30">—</span>;
}

export default function ExecutiveDashboardTab({ kpis, campusPerformance, alerts, programMix }) {
  const { translate } = useLanguage();

  const maxStudents = Math.max(...campusPerformance.map((c) => c.totalStudents || 0), 1);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('execDashboardTitle')}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">{translate('execDashboardSubtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label={translate('kpiTotalStudents')}
          value={kpis.totalStudents}
          icon={Users}
          accent="text-blue-600 bg-blue-500/10"
        />
        <KpiCard
          label={translate('kpiTotalRevenue')}
          value={formatEuro(kpis.totalRevenue)}
          icon={Euro}
          accent="text-violet-600 bg-violet-500/10"
        />
        <KpiCard
          label={translate('kpiAvgSuccessRate')}
          value={kpis.avgSuccessRate !== null ? `${kpis.avgSuccessRate}%` : null}
          icon={TrendingUp}
          accent="text-emerald-600 bg-emerald-500/10"
          valueClassName="text-emerald-600"
        />
        <KpiCard
          label={translate('kpiDropoutRate')}
          value={kpis.avgDropoutRate !== null ? `${kpis.avgDropoutRate}%` : null}
          icon={TrendingDown}
          accent={kpis.avgDropoutRate > 10 ? 'text-red-500 bg-red-500/10' : 'text-amber-600 bg-amber-500/10'}
          valueClassName={kpis.avgDropoutRate > 10 ? 'text-red-500' : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <BarChart3 size={16} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{translate('campusPerformanceTitle')}</span>
          </div>
          <div className="p-4">
            {campusPerformance.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noActiveEnrollments')}</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {campusPerformance.map((c) => (
                  <div key={c.campusId} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-[var(--color-text)] truncate pr-2">{c.campusName}</span>
                      <span className="text-[var(--color-text-muted)] flex-shrink-0">
                        {c.totalStudents ?? <Dash />} {translate('studentsLabel')} · {c.successRate !== null ? `${c.successRate}%` : <Dash />}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${Math.max(4, Math.round(((c.totalStudents || 0) / maxStudents) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <AlertTriangle size={16} className="text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{translate('strategicAlertsTitle')}</span>
          </div>
          <div className="p-4">
            {alerts.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noAlerts')}</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/10 px-3 py-2 text-sm"
                  >
                    <AlertTriangle size={15} className="text-[var(--color-error)] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-[var(--color-error)]">{a.campusName}</span>
                      <span className="text-[var(--color-text)]"> · {a.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <Layers size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">{translate('programMixTitle')}</span>
        </div>
        <div className="p-4">
          {programMix.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {programMix.map((p) => {
                const pct = p.maxStudents ? Math.min(100, Math.round((p.studentCount / p.maxStudents) * 100)) : null;
                return (
                  <div key={p.programName} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-[var(--color-text)] truncate pr-2">{p.programName}</span>
                      <span className="text-[var(--color-text-muted)] flex-shrink-0">
                        {p.studentCount}{p.maxStudents ? ` / ${p.maxStudents}` : ''}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-accent)]"
                        style={{ width: `${pct !== null ? pct : 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
