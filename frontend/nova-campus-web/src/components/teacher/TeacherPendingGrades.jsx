'use client';

import { useLanguage } from '@/context/LanguageContext';

function CourseAvatar({ name }) {
  const words = (name || '?').split(' ').filter(Boolean);
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (name || '?').slice(0, 2).toUpperCase();
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-xs font-bold text-amber-700 select-none">
      {initials}
    </div>
  );
}

export default function TeacherPendingGrades({ pendingGrades, publishing, onPublish }) {
  const { translate } = useLanguage();
  if (!pendingGrades.length) return null;

  const totalUnpublished = pendingGrades.reduce((sum, c) => sum + c.unpublishedCount, 0);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mt-6 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border-b border-[var(--color-border)]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-amber-600 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span className="text-sm font-semibold text-[var(--color-text)]">{translate('pendingGradesTitle')}</span>
        <span className="text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-500/20 rounded-full px-2.5 py-0.5 ml-auto">
          {translate(totalUnpublished === 1 ? 'pendingUnpublishedSingular' : 'pendingUnpublishedPlural', { n: totalUnpublished })}
        </span>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {pendingGrades.map(({ courseId, courseName, unpublishedCount }) => (
          <li key={courseId} className="flex items-center gap-3 px-4 py-3.5">
            <CourseAvatar name={courseName} />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-[var(--color-text)] truncate block">{courseName}</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {translate(unpublishedCount === 1 ? 'pendingUnpublishedSingular' : 'pendingUnpublishedPlural', { n: unpublishedCount })} · {courseId}
              </span>
            </div>
            <button
              onClick={() => onPublish(courseId)}
              disabled={publishing[courseId]}
              className="shrink-0 text-xs font-semibold px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {publishing[courseId] ? translate('pendingPublishing') : translate('pendingPublish')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
