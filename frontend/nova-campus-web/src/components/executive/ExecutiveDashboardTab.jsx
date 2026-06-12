'use client';

import { Users, Euro, TrendingUp, TrendingDown, BarChart3, AlertTriangle, Layers } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import KpiCard from './KpiCard';

const CAMPUS_COLORS = [
  'var(--color-course-6)',
  'var(--color-course-7)',
  'var(--color-success)',
  'var(--color-course-2)',
];

function formatEuro(value) {
  if (value === null || value === undefined) return null;
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

function Dash() {
  return <span className="opacity-30">—</span>;
}

function SectionHeader({ icon: Icon, title, iconAccent = 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconAccent}`}>
        <Icon size={15} />
      </span>
      <span className="font-semibold text-[var(--color-text)]">{title}</span>
    </div>
  );
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
          accent="text-[var(--color-course-6)] bg-[var(--color-course-6-soft)]"
          topBar="from-[var(--color-course-6)] to-[var(--color-course-5)]"
        />
        <KpiCard
          label={translate('kpiTotalRevenue')}
          value={formatEuro(kpis.totalRevenue)}
          icon={Euro}
          accent="text-[var(--color-course-7)] bg-[var(--color-course-7-soft)]"
          topBar="from-[var(--color-course-7)] to-[var(--color-course-6)]"
        />
        <KpiCard
          label={translate('kpiAvgSuccessRate')}
          value={kpis.avgSuccessRate !== null ? `${kpis.avgSuccessRate}%` : null}
          icon={TrendingUp}
          accent="text-[var(--color-success)] bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)]"
          topBar="from-[var(--color-success)] to-[var(--color-accent)]"
          valueClassName="text-[var(--color-success)]"
        />
        <KpiCard
          label={translate('kpiDropoutRate')}
          value={kpis.avgDropoutRate !== null ? `${kpis.avgDropoutRate}%` : null}
          icon={TrendingDown}
          accent={kpis.avgDropoutRate > 10 ? 'text-[var(--color-error)] bg-[color-mix(in_oklch,var(--color-error)_10%,transparent)]' : 'text-[var(--color-course-2)] bg-[var(--color-course-2-soft)]'}
          topBar={kpis.avgDropoutRate > 10 ? 'from-[var(--color-error)] to-[var(--color-course-1)]' : 'from-[var(--color-course-2)] to-[var(--color-course-1)]'}
          valueClassName={kpis.avgDropoutRate > 10 ? 'text-[var(--color-error)]' : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Campus Performance */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <SectionHeader icon={BarChart3} title={translate('campusPerformanceTitle')} />
          <div className="p-5">
            {campusPerformance.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noActiveEnrollments')}</p>
            ) : (
              <div className="space-y-4">
                {campusPerformance.map((c, i) => (
                  <div key={c.campusId}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CAMPUS_COLORS[i % CAMPUS_COLORS.length] }}
                        />
                        <span className="font-medium text-[var(--color-text)] truncate">{c.campusName}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2 text-xs">
                        <span className="font-bold text-[var(--color-text)]">{c.totalStudents ?? '—'}</span>
                        <span className="text-[var(--color-text-muted)]">{translate('studentsLabel')}</span>
                        {c.successRate !== null && (
                          <span className="font-semibold text-[var(--color-success)]">· {c.successRate}%</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-bg-sunken)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(4, Math.round(((c.totalStudents || 0) / maxStudents) * 100))}%`,
                          backgroundColor: CAMPUS_COLORS[i % CAMPUS_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Strategic Alerts */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <SectionHeader
            icon={AlertTriangle}
            title={translate('strategicAlertsTitle')}
            iconAccent="bg-[color-mix(in_oklch,var(--color-error)_12%,transparent)] text-[var(--color-error)]"
          />
          <div className="p-5">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <span className="w-10 h-10 rounded-full bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)] flex items-center justify-center">
                  <TrendingUp size={20} className="text-[var(--color-success)]" />
                </span>
                <p className="text-sm text-[var(--color-text-muted)]">{translate('noAlerts')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-[color-mix(in_oklch,var(--color-error)_20%,transparent)] bg-gradient-to-r from-[color-mix(in_oklch,var(--color-error)_8%,transparent)] to-transparent px-4 py-3"
                  >
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[color-mix(in_oklch,var(--color-error)_15%,transparent)] flex-shrink-0 mt-0.5">
                      <AlertTriangle size={14} className="text-[var(--color-error)]" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-error)] text-sm truncate">{a.campusName}</p>
                      <p className="text-[var(--color-text)] text-xs mt-0.5">{a.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Program Mix */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        <SectionHeader
          icon={Layers}
          title={translate('programMixTitle')}
          iconAccent="bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
        />
        <div className="p-5">
          {programMix.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
          ) : (
            <div className="space-y-4">
              {programMix.map((p) => {
                const pct = p.maxStudents ? Math.min(100, Math.round((p.studentCount / p.maxStudents) * 100)) : null;
                return (
                  <div key={p.programName}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-[var(--color-text)] truncate pr-2">{p.programName}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="font-bold text-[var(--color-text)]">{p.studentCount}</span>
                        {p.maxStudents && (
                          <span className="text-[var(--color-text-muted)] text-xs">/ {p.maxStudents}</span>
                        )}
                        {pct !== null && (
                          <span
                            className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                              pct >= 80
                                ? 'bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)] text-[var(--color-success)]'
                                : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                            }`}
                          >
                            {pct}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-bg-sunken)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-primary)] transition-all duration-700"
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
