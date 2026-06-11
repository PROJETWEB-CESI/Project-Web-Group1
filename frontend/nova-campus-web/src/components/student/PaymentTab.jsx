'use client';

import { useLanguage } from '@/context/LanguageContext';

const LABELS = [
  "Acompte d'inscription",
  'Frais T1',
  'Frais T2',
  'Frais T3 — solde de scolarité',
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatEuro(value) {
  if (value === null || value === undefined) return '—';
  return `${Number(value).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00'); due.setHours(0, 0, 0, 0);
  return Math.ceil((due - now) / 86400000);
}

function getLabel(p, idx) {
  const notes = (p.notes || '').replace(/\[R[1-3]\]|\[PENDING\]/g, '').trim();
  if (notes) return notes;
  return LABELS[idx] ?? `Frais T${idx + 1}`;
}

function isPaid(status) {
  return (status || '').toLowerCase() === 'paid';
}

function isDelay(status) {
  return (status || '').toLowerCase() === 'delay';
}

export default function PaymentTab({ payments, billingSummary, payEcheance }) {
  const { translate } = useLanguage();
  const paidCount = payments.filter(p => isPaid(p.status)).length;
  const nextUnpaid = payments.find(p => !isPaid(p.status));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{translate('paymentsScolarite')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] p-4">
          <div className="text-xs font-semibold tracking-widest opacity-80">{translate('outstandingBalance')}</div>
          <div className="text-3xl font-semibold mt-1">
            {billingSummary ? formatEuro(billingSummary.outstanding) : '—'}
          </div>
          {nextUnpaid?.dueDate && (
            <div className="text-xs mt-1 opacity-75">
              {translate('nextInstalment')} · {formatDate(nextUnpaid.dueDate)}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]">
          <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)]">
            {translate('paidYear', { year: billingSummary?.academicYear ?? '' })}
          </div>
          <div className="text-3xl font-semibold mt-1">
            {billingSummary ? formatEuro(billingSummary.totalPaid) : '—'}
          </div>
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {translate('instalmentHonored', { n: paidCount })}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]">
          <div className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)]">
            {translate('overdueLabel')}
          </div>
          <div
            className="text-3xl font-semibold mt-1"
            style={{ color: billingSummary?.totalOverdue > 0 ? 'var(--color-error)' : undefined }}
          >
            {billingSummary ? formatEuro(billingSummary.totalOverdue) : '—'}
          </div>
        </div>
      </div>

      <h3 className="font-semibold mb-3">{translate('echeancierLabel')}</h3>
      <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[140px_1fr_110px_160px] px-4 py-2.5 bg-[var(--color-bg-sunken)] border-b border-[var(--color-border)]">
          {[
            translate('colDueDate').toUpperCase(),
            translate('colDescription'),
            translate('colAmount').toUpperCase(),
            translate('colStatus').toUpperCase(),
          ].map(h => (
            <div key={h} className="text-xs font-semibold tracking-wider text-[var(--color-text-muted)]">
              {h}
            </div>
          ))}
        </div>

        {payments.length === 0 ? (
          <div className="px-4 py-6 text-sm text-center text-[var(--color-text-muted)] bg-[var(--color-bg-elev)]">
            {translate('noPaymentsAvailable')}
          </div>
        ) : payments.map((p, idx) => {
          const paid    = isPaid(p.status);
          const delayed = isDelay(p.status);
          const days    = !paid ? daysUntil(p.dueDate) : null;
          const upcoming = !paid && !delayed;

          return (
            <div
              key={p.paymentId || idx}
              className={[
                'grid grid-cols-[140px_1fr_110px_160px] items-center px-4 py-3.5',
                'border-b border-[var(--color-border)] last:border-b-0',
                upcoming
                  ? 'bg-[var(--color-course-1-soft)]'
                  : 'bg-[var(--color-bg-elev)]',
              ].join(' ')}
            >
              <div className={`text-sm ${upcoming ? 'font-semibold' : 'text-[var(--color-text)]'}`}>
                {formatDate(p.dueDate)}
              </div>

              <div className="text-sm text-[var(--color-text)]">
                {getLabel(p, idx)}
              </div>

              <div className="text-sm font-semibold text-[var(--color-text)]">
                {formatEuro(p.amount)}
              </div>

              <div className="flex items-center gap-2">
                {paid ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
                    {translate('paymentStatusPaid')}
                  </span>
                ) : delayed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)]">
                    {translate('paymentStatusDelay')}
                  </span>
                ) : (
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-course-1)' }}
                  >
                    {translate('paymentStatusToPay')}{days !== null ? ` · ${translate('inXDays', { n: days })}` : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
