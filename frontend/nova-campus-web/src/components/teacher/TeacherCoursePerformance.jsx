export default function TeacherCoursePerformance({ coursePerformance }) {
  if (!coursePerformance.length) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elev)] mt-6 overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <span className="text-sm font-semibold text-[var(--color-text)]">Performance par cours</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[400px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2 text-xs font-medium text-[var(--color-text-muted)]">Cours</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-text-muted)]">Moyenne</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-text-muted)]">Taux de réussite</th>
              <th className="text-center px-4 py-2 text-xs font-medium text-[var(--color-text-muted)]">Étudiants notés</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {coursePerformance.map(({ courseId, courseName, average, passRate, studentsCount }) => {
              const avg = average ?? null;
              const avgColor = avg === null ? '' : avg >= 14 ? 'text-green-600' : avg >= 10 ? 'text-[var(--color-text)]' : 'text-red-500';
              const passColor = passRate === null ? '' : passRate >= 75 ? 'text-green-600' : passRate >= 50 ? 'text-amber-600' : 'text-red-500';
              return (
                <tr key={courseId}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[var(--color-text)]">{courseName}</span>
                    <span className="ml-2 text-xs text-[var(--color-text-muted)]">({courseId})</span>
                  </td>
                  <td className={`px-4 py-3 text-center font-semibold ${avgColor}`}>
                    {avg !== null ? `${avg}/20` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-center font-semibold ${passColor}`}>
                    {passRate !== null ? `${passRate}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-[var(--color-text-muted)]">
                    {studentsCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
