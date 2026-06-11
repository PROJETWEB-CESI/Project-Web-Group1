'use client';

import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';

const STAGE_STYLES = {
  R1:      'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20',
  R2:      'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20',
  R3:      'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20',
  PENDING: 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
};

function formatEuro(value) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

// Simple bar chart built with flex/divs, scaled to the largest value
function RevenueChart({ data, noDataLabel }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{noDataLabel}</p>;
  }
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-40 mt-2">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-[var(--color-text-muted)]">{formatEuro(d.value)}</span>
          <div
            className="w-full rounded-t-md bg-[var(--color-primary)]/70"
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
          />
          <span className="text-xs text-[var(--color-text-muted)] mt-1">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardTab({ campus, kpis, byProgram, overduePayments, revenueData }) {
  const { translate } = useLanguage();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">
        {translate('adminDashboardTitle')}{campus?.campusName ? ` — ${campus.campusName}` : ''}
      </h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        {translate('adminDashboardSubtitle')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiEnrolledStudents')}</div>
          <div className="text-3xl font-semibold mt-1">
            {kpis.totalStudents !== null ? kpis.totalStudents : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiRoomOccupancy')}</div>
          <div className="text-3xl font-semibold mt-1">
            {kpis.occupancyRate !== null ? `${kpis.occupancyRate}%` : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiOverduePayments')}</div>
          <div className={`text-3xl font-semibold mt-1 ${kpis.overdueCount > 0 ? 'text-[var(--color-error)]' : ''}`}>
            {kpis.overdueCount !== null ? kpis.overdueCount : '—'}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiSuccessRate')}</div>
          <div className="text-3xl font-semibold mt-1">
            {kpis.successRate !== null ? `${kpis.successRate}%` : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-sm font-medium text-[var(--color-text)] mb-3">{translate('campusProgramsTitle')}</div>
          {(!byProgram || byProgram.length === 0) ? (
            <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noActiveEnrollments')}</p>
          ) : (
            <div className="space-y-3">
              {byProgram.map((p) => {
                const pct = p.maxStudents ? Math.min(100, Math.round((p.studentCount / p.maxStudents) * 100)) : null;
                return (
                  <div key={p.programId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-[var(--color-text)] truncate pr-2">{p.programName}</span>
                      <span className="text-[var(--color-text-muted)] flex-shrink-0">
                        {p.studentCount}{p.maxStudents ? ` / ${p.maxStudents}` : ''}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-1000"
                        style={{ width: `${pct !== null ? pct : 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-sm font-medium text-[var(--color-text)] mb-3">{translate('revenueBySemesterTitle')}</div>
          <RevenueChart data={revenueData} noDataLabel={translate('noPaymentData')} />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium text-[var(--color-text)]">{translate('paymentsToProcessTitle')}</span>
        </div>
        {(!overduePayments || overduePayments.length === 0) ? (
          <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noOverduePayments')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-4 py-2 font-normal">{translate('colStudent')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colDueDate')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colAmount')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colDelay')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {overduePayments.map((p) => (
                  <tr key={p.payment_id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[var(--color-text)]">{p.first_name} {p.last_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{p.payment_id}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)] whitespace-nowrap">{p.due_date}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{formatEuro(p.amount)}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)] whitespace-nowrap">{p.daysOverdue} {translate('daysSuffix')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${STAGE_STYLES[p.dunningStage] || STAGE_STYLES.PENDING}`}>
                        {p.dunningStage || 'PENDING'}
                      </span>
                    </td>
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
