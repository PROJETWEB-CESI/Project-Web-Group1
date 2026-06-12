'use client';

import { useMemo, useState } from 'react';
import { Receipt, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';

const STATUS_STYLES = {
  Paid: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  R1:   'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  R2:   'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  R3:   'bg-[var(--color-error)]/10 text-[var(--color-error)]',
  PENDING: 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
};

function formatEuro(value) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

function statusLabel(p) {
  if (p.status === 'Paid') return 'Paid';
  return p.dunningStage || 'PENDING';
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

export default function FinanceTab({ payments, billingStats }) {
  const { translate } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const FILTERS = [
    { id: 'all',  label: translate('filterAll') },
    { id: 'Paid', label: translate('filterPaid') },
    { id: 'R1',   label: 'R1' },
    { id: 'R2',   label: 'R2' },
    { id: 'R3',   label: 'R3' },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const label = statusLabel(p);
      if (statusFilter !== 'all' && label !== statusFilter) return false;
      if (q) {
        const haystack = `${p.first_name} ${p.last_name} ${p.payment_id}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [payments, search, statusFilter]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{translate('adminFinanceTitle')}</h1>
        <p className="text-[var(--color-text-muted)] mt-1">{translate('adminFinanceSubtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label={translate('kpiInvoiced')}
          value={formatEuro(billingStats?.totalInvoiced)}
          icon={Receipt}
          accent="primary"
        />
        <KpiCard
          label={translate('kpiCollected')}
          value={formatEuro(billingStats?.totalCollected)}
          icon={CheckCircle2}
          accent="success"
          valueClass="text-[var(--color-success)]"
        />
        <KpiCard
          label={translate('kpiPending')}
          value={formatEuro(billingStats?.totalOverdue)}
          icon={AlertCircle}
          accent="error"
          valueClass="text-[var(--color-error)]"
        />
        <KpiCard
          label={translate('kpiAvgRecovery')}
          value={billingStats?.avgRecoveryDays != null ? `${billingStats.avgRecoveryDays} ${translate('daysSuffix')}` : '—'}
          icon={Clock}
          accent="accent"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={translate('searchInvoicesPlaceholder')}
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`text-xs font-medium rounded-full px-3 py-1.5 border transition-colors ${
                statusFilter === f.id
                  ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">{translate('noInvoicesMatch')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-sunken)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-medium">{translate('colInvoiceNumber')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colStudent')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colDueDate')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colAmount')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.payment_id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-hover)] transition-colors">
                    <td className="px-5 py-3 text-[var(--color-text-muted)] font-mono text-xs">{p.payment_id}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-[var(--color-text)]">{p.first_name} {p.last_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{p.email}</div>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-muted)] whitespace-nowrap">{p.due_date}</td>
                    <td className="px-5 py-3 font-medium whitespace-nowrap">{formatEuro(p.amount)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_STYLES[statusLabel(p)] || STATUS_STYLES.PENDING}`}>
                        {statusLabel(p)}
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
