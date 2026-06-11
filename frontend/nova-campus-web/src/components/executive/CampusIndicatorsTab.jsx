'use client';

import { Building2, Table2, LineChart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';

const BORDER_COLORS = ['border-blue-500/40', 'border-violet-500/40', 'border-emerald-500/40', 'border-amber-500/40'];

function Dash() {
  return <span className="opacity-30">—</span>;
}

function formatPct(value) {
  return value !== null && value !== undefined ? `${value}%` : <Dash />;
}

export default function CampusIndicatorsTab({ campuses, groupAverages, trendYears, trendByCampus }) {
  const { translate } = useLanguage();

  const indicatorRows = [
    { key: 'enrolledStudentsLabel', field: 'totalStudents', format: (v) => (v !== null && v !== undefined ? v : <Dash />) },
    { key: 'successRateLabel', field: 'successRate', format: formatPct },
    { key: 'averageGradeLabel', field: 'averageGrade', format: (v) => (v !== null && v !== undefined ? `${v}/20` : <Dash />) },
    { key: 'attendanceRateLabel', field: 'attendanceRate', format: formatPct },
    { key: 'kpiDropoutRate', field: 'dropoutRate', format: formatPct },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('campusIndicatorsTitle')}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">{translate('campusIndicatorsSubtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {campuses.map((c, i) => (
          <div
            key={c.campusId}
            className={`rounded-xl border ${BORDER_COLORS[i % BORDER_COLORS.length]} bg-[var(--color-bg-elev)] p-4`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-semibold text-[var(--color-text)]">{c.campusName}</span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">{translate('enrolledStudentsLabel')}</span>
                <span className="font-medium">{c.totalStudents ?? <Dash />}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">{translate('successRateLabel')}</span>
                <span className="font-medium">{formatPct(c.successRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">{translate('averageGradeLabel')}</span>
                <span className="font-medium">{c.averageGrade !== null && c.averageGrade !== undefined ? `${c.averageGrade}/20` : <Dash />}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">{translate('attendanceRateLabel')}</span>
                <span className="font-medium">{formatPct(c.attendanceRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">{translate('kpiDropoutRate')}</span>
                <span className={`font-medium ${c.dropoutRate > (groupAverages.dropoutRate ?? 0) ? 'text-[var(--color-error)]' : ''}`}>
                  {formatPct(c.dropoutRate)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden mb-6">
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <Table2 size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">{translate('benchmarkTitle')}</span>
        </div>
        <ScrollShadow>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="px-4 py-2 font-normal">{translate('colIndicator')}</th>
                {campuses.map((c) => (
                  <th key={c.campusId} className="px-4 py-2 font-normal whitespace-nowrap">{c.campusName}</th>
                ))}
                <th className="px-4 py-2 font-normal whitespace-nowrap italic">{translate('colGroupAverage')}</th>
              </tr>
            </thead>
            <tbody>
              {indicatorRows.map((row) => (
                <tr key={row.key} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text)] whitespace-nowrap">{translate(row.key)}</td>
                  {campuses.map((c) => (
                    <td key={c.campusId} className="px-4 py-2.5 whitespace-nowrap">{row.format(c[row.field])}</td>
                  ))}
                  <td className="px-4 py-2.5 whitespace-nowrap text-[var(--color-text-muted)] italic">{row.format(groupAverages[row.field])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollShadow>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <LineChart size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">{translate('enrollmentTrendTitle')}</span>
        </div>
        {trendYears.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noActiveEnrollments')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-4 py-2 font-normal">{translate('colIndicator')}</th>
                  {campuses.map((c) => (
                    <th key={c.campusId} className="px-4 py-2 font-normal whitespace-nowrap">{c.campusName}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trendYears.map((year) => (
                  <tr key={year} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5 font-medium text-[var(--color-text)] whitespace-nowrap">{year}</td>
                    {campuses.map((c) => (
                      <td key={c.campusId} className="px-4 py-2.5 whitespace-nowrap">
                        {trendByCampus[c.campusId]?.[year] ?? <Dash />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollShadow>
        )}
      </div>
    </div>
  );
}
