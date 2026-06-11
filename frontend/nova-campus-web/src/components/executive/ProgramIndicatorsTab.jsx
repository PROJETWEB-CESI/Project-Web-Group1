'use client';

import { BookOpen, Users, Gauge, Table2, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';
import KpiCard from './KpiCard';

function Dash() {
  return <span className="opacity-30">—</span>;
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
          accent="text-blue-600 bg-blue-500/10"
        />
        <KpiCard
          label={translate('kpiProgramStudents')}
          value={kpis.totalStudents}
          icon={Users}
          accent="text-violet-600 bg-violet-500/10"
        />
        <KpiCard
          label={translate('kpiAvgFillRate')}
          value={kpis.avgFillRate !== null ? `${kpis.avgFillRate}%` : null}
          icon={Gauge}
          accent="text-emerald-600 bg-emerald-500/10"
        />
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden mb-6">
        <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <Table2 size={16} className="text-[var(--color-text-muted)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">{translate('programIndicatorsTitle')}</span>
        </div>
        {programs.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-4 py-2 font-normal">{translate('colProgram')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colCampus')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colStudentsCapacity')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colFillRate')}</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p, i) => (
                  <tr key={`${p.campusId}-${p.programId}-${i}`} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">{p.programName}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{p.campusName}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {p.studentCount}{p.maxStudents ? ` / ${p.maxStudents}` : ''}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
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
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <TrendingUp size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{translate('topFilledProgramsTitle')}</span>
          </div>
          <div className="p-4">
            {topFilled.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {topFilled.map((p, i) => (
                  <div key={`${p.campusId}-${p.programId}-${i}`} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-[var(--color-text)] truncate pr-2">{p.programName} <span className="text-[var(--color-text-muted)] font-normal">· {p.campusName}</span></span>
                      <span className="text-emerald-600 font-medium flex-shrink-0">{p.fillRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, p.fillRate)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
            <TrendingDown size={16} className="text-[var(--color-error)]" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{translate('programsToRecruitTitle')}</span>
          </div>
          <div className="p-4">
            {needsRecruitment.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noProgramData')}</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {needsRecruitment.map((p, i) => (
                  <div key={`${p.campusId}-${p.programId}-${i}`} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-[var(--color-text)] truncate pr-2">{p.programName} <span className="text-[var(--color-text-muted)] font-normal">· {p.campusName}</span></span>
                      <span className="text-[var(--color-error)] font-medium flex-shrink-0">{p.fillRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-error)]" style={{ width: `${Math.min(100, p.fillRate)}%` }} />
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
