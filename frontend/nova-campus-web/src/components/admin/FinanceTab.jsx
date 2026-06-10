'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

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
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('adminFinanceTitle')}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">{translate('adminFinanceSubtitle')}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiInvoiced')}</div>
          <div className="text-3xl font-semibold mt-1">{formatEuro(billingStats?.totalInvoiced)}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiCollected')}</div>
          <div className="text-3xl font-semibold mt-1 text-[var(--color-success)]">{formatEuro(billingStats?.totalCollected)}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiPending')}</div>
          <div className="text-3xl font-semibold mt-1 text-[var(--color-error)]">{formatEuro(billingStats?.totalOverdue)}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4">
          <div className="text-xs text-[var(--color-text-muted)]">{translate('kpiAvgRecovery')}</div>
          <div className="text-3xl font-semibold mt-1">
            {billingStats?.avgRecoveryDays !== null && billingStats?.avgRecoveryDays !== undefined ? `${billingStats.avgRecoveryDays} ${translate('daysSuffix')}` : '—'}
          </div>
        </div>
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
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-4 py-2 font-normal">{translate('colInvoiceNumber')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colStudent')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colDueDate')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colAmount')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.payment_id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{p.payment_id}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[var(--color-text)]">{p.first_name} {p.last_name}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">{p.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{p.due_date}</td>
                    <td className="px-4 py-2.5">{formatEuro(p.amount)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${STATUS_STYLES[statusLabel(p)] || STATUS_STYLES.PENDING}`}>
                        {statusLabel(p)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
