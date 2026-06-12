'use client';

import { Building2, Table2, LineChart } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';

const CAMPUS_THEME = [
  {
    gradient: 'from-[var(--color-course-6)] to-[var(--color-course-5)]',
    dot: 'var(--color-course-6)',
    iconBg: 'bg-[var(--color-course-6-soft)] text-[var(--color-course-6)]',
  },
  {
    gradient: 'from-[var(--color-course-7)] to-[var(--color-course-8)]',
    dot: 'var(--color-course-7)',
    iconBg: 'bg-[var(--color-course-7-soft)] text-[var(--color-course-7)]',
  },
  {
    gradient: 'from-[var(--color-success)] to-[var(--color-accent)]',
    dot: 'var(--color-success)',
    iconBg: 'bg-[var(--color-accent-soft)] text-[var(--color-success)]',
  },
  {
    gradient: 'from-[var(--color-course-2)] to-[var(--color-course-3)]',
    dot: 'var(--color-course-2)',
    iconBg: 'bg-[var(--color-course-2-soft)] text-[var(--color-course-2)]',
  },
];

const COLORABLE_FIELDS = ['successRate', 'averageGrade', 'attendanceRate', 'dropoutRate'];

function cellClass(field, value, avg) {
  if (!COLORABLE_FIELDS.includes(field)) return '';
  if (value === null || value === undefined || avg === null || avg === undefined) return '';
  const v = Number(value);
  const a = Number(avg);
  if (isNaN(v) || isNaN(a)) return '';
  const isGoodWhenLow = field === 'dropoutRate';
  if (isGoodWhenLow) return v <= a ? 'text-[var(--color-success)] font-semibold' : 'text-[var(--color-error)] font-semibold';
  return v >= a ? 'text-[var(--color-success)] font-semibold' : 'text-[var(--color-error)] font-semibold';
}

function Dash() {
  return <span className="opacity-30">—</span>;
}

function formatPct(value) {
  return value !== null && value !== undefined ? `${value}%` : <Dash />;
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
      <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0">
        <Icon size={15} />
      </span>
      <span className="font-semibold text-[var(--color-text)]">{title}</span>
    </div>
  );
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

      {/* Campus Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {campuses.map((c, i) => {
          const theme = CAMPUS_THEME[i % CAMPUS_THEME.length];
          return (
            <div
              key={c.campusId}
              className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden hover:shadow-md hover:border-[var(--color-border-strong)] transition-all duration-200"
            >
              <div className={`h-[3px] bg-gradient-to-r ${theme.gradient}`} />
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${theme.iconBg}`}>
                    <Building2 size={14} />
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text)] leading-tight">{c.campusName}</span>
                </div>

                {/* Featured metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl bg-[var(--color-bg-sunken)] px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                      {translate('enrolledStudentsLabel')}
                    </p>
                    <p className="text-2xl font-extrabold text-[var(--color-text)] leading-none">
                      {c.totalStudents ?? <span className="opacity-25 font-normal text-lg">—</span>}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-bg-sunken)] px-3 py-2.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                      {translate('successRateLabel')}
                    </p>
                    <p
                      className={`text-2xl font-extrabold leading-none ${
                        c.successRate !== null && c.successRate !== undefined
                          ? 'text-[var(--color-success)]'
                          : 'text-[var(--color-text)]'
                      }`}
                    >
                      {c.successRate !== null && c.successRate !== undefined ? (
                        `${c.successRate}%`
                      ) : (
                        <span className="opacity-25 font-normal text-lg">—</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Secondary metrics */}
                <div className="space-y-1 text-xs border-t border-[var(--color-border)] pt-3">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[var(--color-text-muted)]">{translate('averageGradeLabel')}</span>
                    <span className="font-semibold text-[var(--color-text)]">
                      {c.averageGrade !== null && c.averageGrade !== undefined ? `${c.averageGrade}/20` : <Dash />}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[var(--color-text-muted)]">{translate('attendanceRateLabel')}</span>
                    <span className="font-semibold text-[var(--color-text)]">{formatPct(c.attendanceRate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[var(--color-text-muted)]">{translate('kpiDropoutRate')}</span>
                    <span
                      className={`font-semibold ${
                        c.dropoutRate > (groupAverages.dropoutRate ?? 0)
                          ? 'text-[var(--color-error)]'
                          : 'text-[var(--color-text)]'
                      }`}
                    >
                      {formatPct(c.dropoutRate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Benchmark table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden mb-6">
        <SectionHeader icon={Table2} title={translate('benchmarkTitle')} />
        <ScrollShadow>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-bg-sunken)] text-left border-b border-[var(--color-border)]">
                <th className="px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)] whitespace-nowrap">
                  {translate('colIndicator')}
                </th>
                {campuses.map((c, i) => {
                  const theme = CAMPUS_THEME[i % CAMPUS_THEME.length];
                  return (
                    <th key={c.campusId} className="px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.dot }} />
                        {c.campusName}
                      </div>
                    </th>
                  );
                })}
                <th className="px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap italic">
                  {translate('colGroupAverage')}
                </th>
              </tr>
            </thead>
            <tbody>
              {indicatorRows.map((row, idx) => (
                <tr
                  key={row.key}
                  className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors ${
                    idx % 2 !== 0 ? 'bg-[var(--color-bg-sunken)]' : ''
                  }`}
                >
                  <td className="px-5 py-3 font-semibold text-[var(--color-text)] whitespace-nowrap text-xs">
                    {translate(row.key)}
                  </td>
                  {campuses.map((c) => (
                    <td
                      key={c.campusId}
                      className={`px-5 py-3 whitespace-nowrap ${cellClass(row.field, c[row.field], groupAverages[row.field])}`}
                    >
                      {row.format(c[row.field])}
                    </td>
                  ))}
                  <td className="px-5 py-3 whitespace-nowrap text-[var(--color-text-muted)] italic">
                    {row.format(groupAverages[row.field])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollShadow>
      </div>

      {/* Enrollment trend table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        <SectionHeader icon={LineChart} title={translate('enrollmentTrendTitle')} />
        {trendYears.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noActiveEnrollments')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-bg-sunken)] text-left border-b border-[var(--color-border)]">
                  <th className="px-5 py-3 text-xs font-semibold text-[var(--color-text-muted)]">
                    {translate('colIndicator')}
                  </th>
                  {campuses.map((c, i) => {
                    const theme = CAMPUS_THEME[i % CAMPUS_THEME.length];
                    return (
                      <th key={c.campusId} className="px-5 py-3 text-xs font-medium text-[var(--color-text-muted)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: theme.dot }} />
                          {c.campusName}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {trendYears.map((year, idx) => (
                  <tr
                    key={year}
                    className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors ${
                      idx % 2 !== 0 ? 'bg-[var(--color-bg-sunken)]' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-semibold text-[var(--color-text)] whitespace-nowrap">{year}</td>
                    {campuses.map((c) => (
                      <td key={c.campusId} className="px-5 py-3 whitespace-nowrap font-medium">
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
