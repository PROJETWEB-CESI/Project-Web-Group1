'use client';

const STATUS_COLORS = {
  red:   'bg-red-50 text-red-600 border border-red-200',
  green: 'bg-green-50 text-green-700 border border-green-200',
};

function resolveStatus(a) {
  if (a.justified) return { label: 'Justifiée', color: 'green' };
  return { label: 'Non justifiée', color: 'red' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = String(dateStr).split('-');
  return `${d}/${m}/${y}`;
}

function formatTime(t) {
  return t ? String(t).slice(0, 5) : null;
}

function formatSemesterLabel(raw) {
  if (!raw) return null;
  // "S1 2025-2026" → "Semestre 1 2025/2026"
  const match = raw.match(/^S(\d+)\s+(\d{4})-(\d{4})$/);
  if (match) return `Semestre ${match[1]} ${match[2]}/${match[3]}`;
  return raw;
}

export default function AbsencesTab({ absences = [], timetables = [], attStats, studentProfile, kpis }) {
  // Build lookup by courseId → timetable entry (first match)
  const ttMap = {};
  for (const t of timetables) {
    if (t.course_id && !ttMap[t.course_id]) ttMap[t.course_id] = t;
  }

  // Only display absence and late records
  const records = absences.filter(a => a.status === 'absent' || a.status === 'late');

  const unjustifiedCount = records.filter(a => !a.justified && !a.pendingJustification).length;

  const programName   = studentProfile?.program?.programName ?? null;
  const semesterLabel = formatSemesterLabel(kpis?.currentSemesterLabel);
  const subtitle      = [programName, semesterLabel].filter(Boolean).join(' · ');

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-1">Mes absences</h1>
        {subtitle && (
          <p className="text-sm text-[var(--color-text-muted)]">{subtitle}</p>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Taux de présence</p>
          <p className="text-3xl font-bold mt-2 text-green-600">
            {attStats?.attendanceRate != null ? `${attStats.attendanceRate}%` : '—'}
          </p>
        </div>
        <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Absences totales</p>
          <p className="text-3xl font-bold mt-2 text-[var(--color-text)]">{records.length}</p>
        </div>
        <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">Non justifiées</p>
          <p className="text-3xl font-bold mt-2 text-red-500">{unjustifiedCount}</p>
        </div>
      </div>

      {/* History table */}
      <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-base text-[var(--color-text)]">Historique</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Date</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Créneau</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Cours</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Enseignant</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--color-text-muted)]">
                    Aucune absence enregistrée.
                  </td>
                </tr>
              ) : records.map(a => {
                const tt = ttMap[a.courseId];
                const courseName = a.course?.courseName ?? tt?.course?.course_name ?? a.courseId;
                const instructor = tt?.instructor;
                const instructorName = instructor
                  ? `${instructor.first_name} ${instructor.last_name}`
                  : '—';
                const start = formatTime(tt?.start_time);
                const end   = formatTime(tt?.end_time);
                const timeSlot = start && end ? `${start} – ${end}` : '—';
                const s = resolveStatus(a);

                return (
                  <tr key={a.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-5 py-4 text-[var(--color-text-muted)] whitespace-nowrap">
                      {formatDate(a.sessionDate)}
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)] whitespace-nowrap">
                      {timeSlot}
                    </td>
                    <td className="px-5 py-4 font-medium text-[var(--color-text)]">
                      {courseName}
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)]">
                      {instructorName}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.color]}`}>
                        {s.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
