'use client';

import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';
import { Users, Building2, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] shadow-md px-3 py-2 text-sm">
      <div className="font-semibold text-[var(--color-text)] mb-0.5">{label}</div>
      <div className="text-[var(--color-primary)] font-medium">{formatEuro(payload[0].value)}</div>
    </div>
  );
}

function RevenueChart({ data, noDataLabel }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{noDataLabel}</p>;
  }
  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-primary)', opacity: 0.06 }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill="var(--color-primary)" fillOpacity={i === maxIdx ? 1 : 0.45} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function KpiCard({ label, value, icon: Icon, accent, valueClass = '' }) {
  return (
    <div className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4 overflow-hidden hover:shadow-sm transition-shadow">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `var(--color-${accent})` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide leading-tight pr-2">{label}</div>
        <div
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `color-mix(in oklch, var(--color-${accent}) 12%, transparent)` }}
        >
          <Icon className="w-4 h-4" style={{ color: `var(--color-${accent})` }} />
        </div>
      </div>
      <div className={`text-3xl font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

export default function DashboardTab({ campus, kpis, byProgram, overduePayments, revenueData }) {
  const { translate } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          {translate('adminDashboardTitle')}{campus?.campusName ? ` — ${campus.campusName}` : ''}
        </h1>
        <p className="text-[var(--color-text-muted)] mt-1">{translate('adminDashboardSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label={translate('kpiEnrolledStudents')}
          value={kpis.totalStudents ?? '—'}
          icon={Users}
          accent="primary"
        />
        <KpiCard
          label={translate('kpiRoomOccupancy')}
          value={kpis.occupancyRate !== null ? `${kpis.occupancyRate}%` : '—'}
          icon={Building2}
          accent="accent"
        />
        <KpiCard
          label={translate('kpiOverduePayments')}
          value={kpis.overdueCount ?? '—'}
          icon={AlertTriangle}
          accent="error"
          valueClass={kpis.overdueCount > 0 ? 'text-[var(--color-error)]' : ''}
        />
        <KpiCard
          label={translate('kpiSuccessRate')}
          value={kpis.successRate !== null ? `${kpis.successRate}%` : '—'}
          icon={TrendingUp}
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{translate('campusProgramsTitle')}</span>
          </div>
          {(!byProgram || byProgram.length === 0) ? (
            <p className="text-sm text-[var(--color-text-muted)] py-6 text-center">{translate('noActiveEnrollments')}</p>
          ) : (
            <div className="space-y-4">
              {byProgram.map((p) => {
                const pct = p.maxStudents ? Math.min(100, Math.round((p.studentCount / p.maxStudents) * 100)) : null;
                return (
                  <div key={p.programId}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-[var(--color-text)] font-medium truncate pr-2">{p.programName}</span>
                      <span className="text-[var(--color-text-muted)] text-xs flex-shrink-0">
                        {p.studentCount}{p.maxStudents ? ` / ${p.maxStudents}` : ''}
                        {pct !== null && <span className="ml-2 font-semibold text-[var(--color-primary)]">{pct}%</span>}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                        style={{ width: `${pct !== null ? pct : 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-text)]">{translate('revenueBySemesterTitle')}</span>
          </div>
          <RevenueChart data={revenueData} noDataLabel={translate('noPaymentData')} />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        <div className="px-3 py-1.5 sm:px-5 sm:py-3.5 border-b border-[var(--color-border)] flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[var(--color-error)]" />
          <span className="text-sm font-semibold text-[var(--color-text)]">{translate('paymentsToProcessTitle')}</span>
        </div>
        {(!overduePayments || overduePayments.length === 0) ? (
          <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">{translate('noOverduePayments')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-sunken)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-medium">{translate('colStudent')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colDueDate')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colAmount')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colDelay')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {overduePayments.map((p) => (
                  <tr key={p.payment_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3">
                      <div className="font-medium text-[var(--color-text)]">{p.first_name} {p.last_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{p.payment_id}</div>
                    </td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 text-[var(--color-text-muted)] whitespace-nowrap">{p.due_date}</td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 font-medium whitespace-nowrap">{formatEuro(p.amount)}</td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold ${p.daysOverdue > 30 ? 'text-[var(--color-error)]' : 'text-[var(--color-text-muted)]'}`}>
                        {p.daysOverdue} {translate('daysSuffix')}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STAGE_STYLES[p.dunningStage] || STAGE_STYLES.PENDING}`}>
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
