'use client';

import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function HelpPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const { translate } = useLanguage();

  // Auth guard - redirect if not authenticated
  if (loading) {
    return (
      <div className="flex flex-1 h-full min-h-0 items-center justify-center text-sm text-[var(--color-text-muted)]">
        Loading help center…
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-1 h-full min-h-0 items-center justify-center text-sm text-[var(--color-text-muted)]">
        Please log in to access the help center.
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">
          {translate('helpCenter') || 'Help Center'}
        </h1>

        <div className="space-y-6">
          <section className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              {translate('welcomeHelp') || 'Welcome to NovaCampus Alliance Help Center'}
            </h2>
            <p className="text-[var(--color-text-muted)] mb-4">
              {translate('helpDescription') || 'Find answers to your questions and learn how to use the platform effectively.'}
            </p>
          </section>

          <section className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              {translate('gettingStarted') || 'Getting Started'}
            </h2>
            <ul className="space-y-2 text-[var(--color-text-muted)]">
              <li>
                <strong className="text-[var(--color-text)]">Dashboard:</strong> {translate('helpDashboard') || 'View your personalized dashboard with quick access to your most important information.'}
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Profile:</strong> {translate('helpProfile') || 'Manage your personal information and settings.'}
              </li>
              <li>
                <strong className="text-[var(--color-text)]">Aria Assistant:</strong> {translate('helpAria') || 'Ask Aria, your AI assistant, for help with schedules, grades, and more.'}
              </li>
            </ul>
          </section>

          <section className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              {translate('roleSpecificHelp') || 'Role-Specific Help'}
            </h2>
            <div className="text-[var(--color-text-muted)]">
              <p className="mb-2">
                {translate('helpRoleIntro') || 'Select your role for specific guidance:'}
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{translate('helpStudent') || 'Students: View your schedule, grades, absences, and make payments.'}</li>
                <li>{translate('helpTeacher') || 'Teachers: Manage your courses, enter grades, and track attendance.'}</li>
                <li>{translate('helpAdmin') || 'Administrators: Oversee students, planning, and campus finances.'}</li>
                <li>{translate('helpExecutive') || 'Executives: Access strategic reports and campus indicators.'}</li>
              </ul>
            </div>
          </section>

          <section className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
              {translate('contactSupport') || 'Contact Support'}
            </h2>
            <p className="text-[var(--color-text-muted)]">
              {translate('helpContact') || 'If you need additional assistance, please contact your campus administrator or IT support team.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
