'use client';

import { useState } from 'react';
import { X, RefreshCw, Copy, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApi } from '@/lib/api';
import useBackdropClose from '@/hooks/useBackdropClose';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generatePassword(length = 12) {
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return pwd;
}

const currentYear = new Date().getFullYear();

export default function CreateStudentModal({ campusId, programs, onClose, onCreated }) {
  const { translate } = useLanguage();
  const { apiFetch } = useApi();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [programId, setProgramId] = useState(programs[0]?.programId || '');
  const [enrollmentYear, setEnrollmentYear] = useState(currentYear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access denied — silently ignore.
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !password || !programId || !enrollmentYear) {
      setError(translate('createStudentMissingFields') || 'Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    let createdStudent = null;
    try {
      const studentRes = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campusId, programId, firstName, lastName, enrollmentYear: Number(enrollmentYear) }),
      });
      const studentData = await studentRes.json().catch(() => ({}));
      if (!studentRes.ok) {
        throw new Error(studentData.error || translate('createStudentRecordError') || 'Could not create the student record.');
      }
      createdStudent = studentData;

      const userRes = await apiFetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentData.email, password, role: 'student', campusId, firstName, lastName, studentId: studentData.studentId }),
      });
      const userData = await userRes.json().catch(() => ({}));
      if (!userRes.ok) {
        throw new Error(userData.error || translate('createStudentUserError') || 'Could not create the user account.');
      }

      onCreated({ ...studentData, program: programs.find((p) => p.programId === programId) });
    } catch (err) {
      // Roll back the student record if the IAM account could not be created.
      if (createdStudent) {
        await apiFetch(`/api/students/${createdStudent.studentId}?campusId=${campusId}`, { method: 'DELETE' }).catch(() => {});
      }
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const backdropProps = useBackdropClose(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" {...backdropProps}>
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{translate('newEnrollment') || 'New enrollment'}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={translate('close') || 'Close'}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={translate('firstName') || 'First name'}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label={translate('lastName') || 'Last name'}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {firstName && lastName && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {translate('emailAddress') || 'Email address'}: {`${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, '')}@novacampus.fr
              {' '}
              <span className="italic">({translate('generatedEmailHint') || 'generated automatically, a number is appended if already taken'})</span>
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
              {translate('temporaryPassword') || 'Temporary password'}
            </label>
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1" />
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopyPassword}
                aria-label={translate('copyPassword') || 'Copy password'}
                title={translate('copyPassword') || 'Copy password'}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPassword(generatePassword())}
                aria-label={translate('regeneratePassword') || 'Generate a new password'}
                title={translate('regeneratePassword') || 'Generate a new password'}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {translate('temporaryPasswordHint') || 'Share this password with the student so they can log in and change it.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                {translate('colProgram') || 'Program'}
              </label>
              <select
                value={programId}
                onChange={(e) => setProgramId(e.target.value)}
                required
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {programs.length === 0 && <option value="">{translate('allPrograms') || 'No programs available'}</option>}
                {programs.map((p) => (
                  <option key={p.programId} value={p.programId}>{p.programName}</option>
                ))}
              </select>
            </div>
            <Input
              label={translate('colEntryYear') || 'Entry year'}
              type="number"
              value={enrollmentYear}
              onChange={(e) => setEnrollmentYear(e.target.value)}
              min="2000"
              max="2100"
              required
            />
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              {translate('cancel') || 'Cancel'}
            </Button>
            <Button type="submit" loading={submitting} disabled={programs.length === 0}>
              {translate('createAccount') || 'Create account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
