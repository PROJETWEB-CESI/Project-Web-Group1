export default function TeacherPendingGrades({ pendingGrades, publishing, onPublish }) {
  if (!pendingGrades.length) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mt-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">Notes en attente de publication</span>
        <span className="text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
          {pendingGrades.length}
        </span>
      </div>
      <ul className="divide-y divide-[var(--color-border)]">
        {pendingGrades.map(({ courseId, courseName, unpublishedCount }) => (
          <li key={courseId} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <span className="text-sm font-medium text-[var(--color-text)] truncate block">{courseName}</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {unpublishedCount} note{unpublishedCount > 1 ? 's' : ''} non publiée{unpublishedCount > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => onPublish(courseId)}
              disabled={publishing[courseId]}
              className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-bg-elev)] text-[var(--color-text)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {publishing[courseId] ? 'Publication…' : 'Publier'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
