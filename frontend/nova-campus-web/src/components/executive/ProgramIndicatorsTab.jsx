'use client';

import { BookOpen, Users, Gauge, Table2, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';
import KpiCard from './KpiCard';

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

export default function ProgramIndicatorsTab({ kpis, programs, topFilled, needsRecruitment }) {
  const { translate } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('programIndicatorsTitle')}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">{translate('programIndicatorsSubtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label={translate('kpiTotalPrograms')}
          value={kpis.totalPrograms}
          icon={BookOpen}
          accent="text-[var(--color-course-6)] bg-[var(--color-course-6-soft)]"
          topBar="from-[var(--color-course-6)] to-[var(--color-course-5)]"
        />
        <KpiCard
          label={translate('kpiProgramStudents')}
          value={kpis.totalStudents}
          icon={Users}
          accent="text-[var(--color-course-7)] bg-[var(--color-course-7-soft)]"
          topBar="from-[var(--color-course-7)] to-[var(--color-course-6)]"
        />
        <KpiCard
          label={translate('kpiAvgFillRate')}
          value={kpis.avgFillRate !== null ? `${kpis.avgFillRate}%` : null}
          icon={Gauge}
          accent="text-[var(--color-success)] bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)]"
          topBar="from-[var(--color-success)] to-[var(--color-accent)]"
          valueClassName="text-[var(--color-success)]"
        />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden mb-6">
        <SectionHeader icon={Table2} title={translate('programIndicatorsTitle')} />
        {programs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--color-bg-sunken)] text-left border-b border-[var(--color-border)]">
                  <th className="px-3 py-1.5 sm:px-5 sm:py-3 text-xs font-semibold text-[var(--color-text-muted)]">{translate('colProgram')}</th>
                  <th className="px-3 py-1.5 sm:px-5 sm:py-3 text-xs font-medium text-[var(--color-text-muted)]">{translate('colCampus')}</th>
                  <th className="px-3 py-1.5 sm:px-5 sm:py-3 text-xs font-medium text-[var(--color-text-muted)]">{translate('colStudentsCapacity')}</th>
                  <th className="px-3 py-1.5 sm:px-5 sm:py-3 text-xs font-medium text-[var(--color-text-muted)]">{translate('colFillRate')}</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p, i) => (
                  <tr
                    key={`${p.campusId}-${p.programId}-${i}`}
                    className={`border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors ${
                      i % 2 !== 0 ? 'bg-[var(--color-bg-sunken)]' : ''
                    }`}
                  >
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 font-medium text-[var(--color-text)]">{p.programName}</td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 text-[var(--color-text-muted)]">{p.campusName}</td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 whitespace-nowrap font-medium">
                      {p.studentCount}{p.maxStudents ? ` / ${p.maxStudents}` : ''}
                    </td>
                    <td className={`px-3 py-1.5 sm:px-5 sm:py-3 whitespace-nowrap font-semibold ${
                      p.fillRate !== null
                        ? p.fillRate >= 80
                          ? 'text-[var(--color-success)]'
                          : p.fillRate < 50
                          ? 'text-[var(--color-error)]'
                          : ''
                        : ''
                    }`}>
                      {p.fillRate !== null ? `${p.fillRate}%` : <Dash />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollShadow>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top filled programs */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <SectionHeader
            icon={TrendingUp}
            title={translate('topFilledProgramsTitle')}
            iconAccent="bg-[color-mix(in_oklch,var(--color-success)_12%,transparent)] text-[var(--color-success)]"
          />
          <div className="p-5">
            {topFilled.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
            ) : (
              <div className="space-y-4">
                {topFilled.map((p, i) => (
                  <div key={`${p.campusId}-${p.programId}-${i}`}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-[var(--color-text)] truncate pr-2">
                        {p.programName}{' '}
                        <span className="text-[var(--color-text-muted)] font-normal">· {p.campusName}</span>
                      </span>
                      <span className="text-[var(--color-success)] font-bold flex-shrink-0">{p.fillRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-bg-sunken)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-success)] to-[var(--color-accent)] transition-all duration-700"
                        style={{ width: `${Math.min(100, p.fillRate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Programs needing recruitment */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <SectionHeader
            icon={TrendingDown}
            title={translate('programsToRecruitTitle')}
            iconAccent="bg-[color-mix(in_oklch,var(--color-error)_12%,transparent)] text-[var(--color-error)]"
          />
          <div className="p-5">
            {needsRecruitment.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
            ) : (
              <div className="space-y-4">
                {needsRecruitment.map((p, i) => (
                  <div key={`${p.campusId}-${p.programId}-${i}`}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-[var(--color-text)] truncate pr-2">
                        {p.programName}{' '}
                        <span className="text-[var(--color-text-muted)] font-normal">· {p.campusName}</span>
                      </span>
                      <span className="text-[var(--color-error)] font-bold flex-shrink-0">{p.fillRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-bg-sunken)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-error)] to-[var(--color-course-1)] transition-all duration-700"
                        style={{ width: `${Math.min(100, p.fillRate)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
