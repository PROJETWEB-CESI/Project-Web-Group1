'use client';

import { useMemo, useState } from 'react';
import { Plus, KeyRound, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ScrollShadow from '@/components/shared/ScrollShadow';
import Button from '@/components/shared/Button';
import CreateStudentModal from '@/components/admin/CreateStudentModal';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';

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

const AVATAR_COLORS = [
  'bg-[var(--color-primary)]/15 text-[var(--color-primary)]',
  'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  'bg-[var(--color-success)]/15 text-[var(--color-success)]',
];

function initials(firstName, lastName) {
  return `${(firstName || '?')[0]}${(lastName || '?')[0]}`.toUpperCase();
}

function avatarColor(studentId) {
  const n = (studentId || '').split('').reduce((acc, c) => (acc + c.charCodeAt(0)) & 0xffff, 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export default function StudentsTab({ students, campusId, allPrograms = [], onStudentCreated }) {
  const { translate } = useLanguage();
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetPasswordStudent, setResetPasswordStudent] = useState(null);

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
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-2xl font-bold tracking-tight">{translate('adminStudentsTitle')}</h1>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          {translate('newEnrollment') || 'New enrollment'}
        </Button>
      </div>
      <p className="text-[var(--color-text-muted)] mb-6">
        {filtered.length} {translate('studentsOutOf')} {students.length}
      </p>

      {showCreateModal && (
        <CreateStudentModal
          campusId={campusId}
          programs={allPrograms}
          onClose={() => setShowCreateModal(false)}
          onCreated={(student) => {
            setShowCreateModal(false);
            onStudentCreated?.(student);
          }}
        />
      )}

      {resetPasswordStudent && (
        <ResetPasswordModal
          student={resetPasswordStudent}
          onClose={() => setResetPasswordStudent(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translate('searchStudentsPlaceholder')}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] !pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
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
                <tr className="text-left text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-sunken)] border-b border-[var(--color-border)]">
                  <th className="px-5 py-2.5 font-medium">{translate('colStudent')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colId')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colProgram')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colEntryYear')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colPayment')}</th>
                  <th className="px-5 py-2.5 font-medium">{translate('colStatus')}</th>
                  <th className="px-5 py-2.5 font-medium w-0">{translate('colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.studentId} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColor(s.studentId)}`}>
                          {initials(s.firstName, s.lastName)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-[var(--color-text)] truncate">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-[var(--color-text-muted)] truncate">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 text-[var(--color-text-muted)]">{s.studentId}</td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 text-[var(--color-text-muted)]">{s.program?.programName || s.programId}</td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 text-[var(--color-text-muted)] whitespace-nowrap">{s.enrollmentYear || '—'}</td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3 whitespace-nowrap">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 whitespace-nowrap ${PAYMENT_STYLES[s.paymentStatus] || 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                        {PAYMENT_LABELS[s.paymentStatus] ? translate(PAYMENT_LABELS[s.paymentStatus]) : (s.paymentStatus || '—')}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3">
                      <span className={`text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_STYLES[s.status] || 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                        {STATUS_LABELS[s.status] ? translate(STATUS_LABELS[s.status]) : (s.status || '—')}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 sm:px-5 sm:py-3">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="!text-[var(--color-error)] hover:!bg-[var(--red-hoverlay)] hover:!text-[var(--color-error)] whitespace-nowrap"
                        onClick={() => setResetPasswordStudent(s)}
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                        {translate('resetPassword') || 'Reset password'}
                      </Button>
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
