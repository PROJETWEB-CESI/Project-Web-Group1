'use client';

function CourseAvatar({ name, id }) {
  const words = (name || id || '?').split(' ').filter(Boolean);
  const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (name || id || '?').slice(0, 2).toUpperCase();
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-600 select-none">
      {initials}
    </div>
  );
}

export default function TeacherCoursePerformance({ coursePerformance }) {
  if (!coursePerformance.length) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mt-6 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-[var(--color-text-muted)]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <span className="text-sm font-semibold text-[var(--color-text)]">Performance par cours</span>
        <span className="text-xs text-[var(--color-text-muted)] ml-1">({coursePerformance.length} cours)</span>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {coursePerformance.map(({ courseId, courseName, average, passRate, studentsCount }) => {
          const avg = average ?? null;
          const avgTextColor = avg === null ? '' : avg >= 14 ? 'text-emerald-600' : avg >= 10 ? 'text-blue-600' : 'text-red-500';
          const passTextColor = passRate === null ? '' : passRate >= 75 ? 'text-emerald-600' : passRate >= 50 ? 'text-amber-600' : 'text-red-500';

          return (
            <li key={courseId} className="flex items-center gap-4 px-4 py-4">
              <CourseAvatar name={courseName} id={courseId} />

              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                {/* Course name */}
                <div className="sm:col-span-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--color-text)] truncate">{courseName}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{courseId} · {studentsCount} étudiant{studentsCount > 1 ? 's' : ''}</div>
                </div>

                {/* Average */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[var(--color-text-muted)]">Moyenne</span>
                  <span className={`text-lg font-bold ${avgTextColor}`}>{avg !== null ? `${avg}/20` : '—'}</span>
                </div>

                {/* Pass rate */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[var(--color-text-muted)]">Taux de réussite</span>
                  <span className={`text-lg font-bold ${passTextColor}`}>{passRate !== null ? `${passRate}%` : '—'}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
