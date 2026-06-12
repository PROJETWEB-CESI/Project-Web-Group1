'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useApi } from '@/lib/api';
import useBackdropClose from '@/hooks/useBackdropClose';
import Button from '@/components/shared/Button';

export default function ResetPasswordModal({ student, onClose }) {
  const { translate } = useLanguage();
  const { apiFetch } = useApi();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch(`/api/auth/users/reset-password/${student.studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || translate('resetPasswordError') || 'Could not reset the password.');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const backdropProps = useBackdropClose(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" {...backdropProps}>
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {translate('resetPassword') || 'Reset password'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={translate('close') || 'Close'}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text)]">
              {translate('resetPasswordSuccess') || 'New temporary password generated:'}
            </p>
            <p className="font-mono text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 break-all">
              {result.password}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {translate('temporaryPasswordHint') || 'Share this password with the student so they can log in and change it.'}
            </p>
            <div className="flex justify-end pt-2">
              <Button type="button" onClick={onClose}>
                {translate('close') || 'Close'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text)]">
              {translate('resetPasswordConfirm') || 'Reset the password for'}{' '}
              <span className="font-medium">{student.firstName} {student.lastName}</span>?
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {translate('resetPasswordWarning') || 'A new temporary password will be generated and the current one will stop working immediately.'}
            </p>

            {error && <p className="error-message" role="alert">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                {translate('cancel') || 'Cancel'}
              </Button>
              <Button
                type="button"
                loading={submitting}
                onClick={handleConfirm}
                className="!bg-[var(--color-error)] hover:!bg-[var(--color-error)]/90 !text-[var(--color-on-primary)]"
              >
                {translate('resetPassword') || 'Reset password'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
