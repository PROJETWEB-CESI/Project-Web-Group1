'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';

const STATUS_STYLES = {
  Active:    'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  Suspended: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  Graduated: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  Withdrawn: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
};

const STATUS_LABELS = {
  Active: 'statusActive',
  Suspended: 'statusSuspended',
  Graduated: 'statusGraduated',
  Withdrawn: 'statusWithdrawn',
};

const PAYMENT_STYLES = {
  'Up to date': 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  Delay:        'bg-[var(--color-error)]/10 text-[var(--color-error)]',
};

const PAYMENT_LABELS = {
  'Up to date': 'paymentUpToDate',
  Delay: 'paymentDelay',
};

function initials(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

export default function StudentsTab({ students }) {
  const { translate } = useLanguage();
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const programs = useMemo(() => {
    const map = new Map();
    for (const s of students) {
      if (s.program?.programId) map.set(s.program.programId, s.program.programName);
    }
    return [...map.entries()];
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (programFilter !== 'all' && s.programId !== programFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (q) {
        const haystack = `${s.firstName} ${s.lastName} ${s.email} ${s.studentId}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [students, search, programFilter, statusFilter]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight mb-1">{translate('adminStudentsTitle')}</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        {filtered.length} {translate('studentsOutOf')} {students.length}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={translate('searchStudentsPlaceholder')}
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">{translate('allPrograms')}</option>
          {programs.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">{translate('allStatuses')}</option>
          <option value="Active">{translate('statusActive')}</option>
          <option value="Suspended">{translate('statusSuspended')}</option>
          <option value="Graduated">{translate('statusGraduated')}</option>
          <option value="Withdrawn">{translate('statusWithdrawn')}</option>
        </select>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">{translate('noStudentsMatch')}</p>
        ) : (
          <ScrollShadow>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <th className="px-4 py-2 font-normal">{translate('colStudent')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colId')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colProgram')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colEntryYear')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colPayment')}</th>
                  <th className="px-4 py-2 font-normal">{translate('colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.studentId} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xs font-semibold">
                          {initials(s.firstName, s.lastName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--color-text)] truncate">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-[var(--color-text-muted)] truncate">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{s.studentId}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{s.program?.programName || s.programId}</td>
                    <td className="px-4 py-2.5 text-[var(--color-text-muted)] whitespace-nowrap">{s.enrollmentYear || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${PAYMENT_STYLES[s.paymentStatus] || 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                        {PAYMENT_LABELS[s.paymentStatus] ? translate(PAYMENT_LABELS[s.paymentStatus]) : (s.paymentStatus || '—')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${STATUS_STYLES[s.status] || 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                        {STATUS_LABELS[s.status] ? translate(STATUS_LABELS[s.status]) : (s.status || '—')}
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
