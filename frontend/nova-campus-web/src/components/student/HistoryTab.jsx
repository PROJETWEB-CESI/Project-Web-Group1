'use client';

import ScrollShadow from '@/components/shared/ScrollShadow';

function semesterLabel(sem) {
  if (sem.status === 'in_progress') return 'En cours';
  if (sem.status === 'validated') {
    const avg = sem.avg;
    return avg != null ? `${avg}/20` : 'Validé';
  }
  return '—';
}

function nextAcademicYear(year) {
  const [start, end] = year.split('-').map(Number);
  return `${start + 1}-${end + 1}`;
}

function buildSemesterCards(enrollments, totalSemesters) {
  const groups = new Map();
  for (const e of enrollments) {
    const key = `${e.academicYear}-S${e.semester}`;
    if (!groups.has(key)) {
      groups.set(key, { academicYear: e.academicYear, semester: e.semester, enrollments: [] });
    }
    groups.get(key).enrollments.push(e);
  }

  const sorted = [...groups.values()].sort((a, b) => {
    if (a.academicYear !== b.academicYear) return a.academicYear.localeCompare(b.academicYear);
    return a.semester - b.semester;
  });

  const cards = sorted.map((g, i) => {
    const anyInProgress = g.enrollments.some(e => e.status === 'In Progress');
    const allValidated  = g.enrollments.length > 0 && g.enrollments.every(e => e.status === 'Validated');
    const graded = g.enrollments.filter(e => e.finalGrade != null);
    const avg = graded.length > 0
      ? Math.round(graded.reduce((s, e) => s + parseFloat(e.finalGrade), 0) / graded.length * 10) / 10
      : null;
    return {
      number: i + 1,
      academicYear: g.academicYear,
      originalSemester: g.semester,
      status: anyInProgress ? 'in_progress' : allValidated ? 'validated' : 'partial',
      avg,
    };
  });

  // Fill future semesters up to totalSemesters
  while (cards.length < totalSemesters) {
    const prev = cards[cards.length - 1];
    const prevYear = prev?.academicYear ?? '2023-2024';
    // S1 → S2 same year, S2 → S1 next year
    const prevSemInYear = prev ? ((cards.length % 2 === 0) ? 1 : 2) : 2;
    const projectedYear = prevSemInYear === 1 ? nextAcademicYear(prevYear) : prevYear;
    cards.push({ number: cards.length + 1, academicYear: projectedYear, status: 'future', avg: null });
  }

  return cards.slice(0, totalSemesters);
}

const STATUS_BADGE = {
  'Validated':  { label: 'Validé',    cls: 'bg-green-50 text-green-700 border border-green-200' },
  'In Progress':{ label: 'En cours',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'Enrolled':   { label: 'Inscrit',   cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
};

export default function HistoryTab({ enrollments = [], studentProfile }) {
  const program = studentProfile?.program;
  const programName    = program?.programName ?? '—';
  const durationYears  = program?.durationYears ?? null;
  const annualTuition  = program?.annualTuition ?? null;
  const totalSemesters = durationYears ? durationYears * 2 : 6;

  const semCards = buildSemesterCards(enrollments, totalSemesters);

  const validatedCount = semCards.filter(s => s.status === 'validated').length;
  const currentSem     = semCards.find(s => s.status === 'in_progress');
  const currentEnrollments = currentSem
    ? enrollments.filter(e => e.semester === currentSem.originalSemester && e.academicYear === currentSem.academicYear)
    : enrollments.filter(e => e.status === 'In Progress');

  const firstYear = enrollments.length > 0
    ? enrollments.reduce((min, e) => e.academicYear < min ? e.academicYear : min, enrollments[0].academicYear).split('-')[0]
    : null;

  const enrollmentYear = studentProfile?.enrollmentYear ?? null;
  const studentStatus  = studentProfile?.status ?? null;

  return (
    <div className="space-y-6">

      {/* Page title + KPI cards */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-1">Historique académique</h1>
        {(programName !== '—' || enrollmentYear || studentStatus) && (
          <p className="text-sm text-[var(--color-text-muted)] mb-5">
            {[programName !== '—' ? programName : null, enrollmentYear ? `entrée ${enrollmentYear}` : null, studentStatus].filter(Boolean).join(' · ')}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Année d'entrée */}
          <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Année d'entrée</p>
            <p className="text-4xl font-bold mt-2 text-[var(--color-text)]">{enrollmentYear ?? '—'}</p>
            {programName !== '—' && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5 truncate">Promo {programName}</p>
            )}
          </div>

          {/* Semestres validés */}
          <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Semestres validés</p>
            <p className="text-4xl font-bold mt-2 text-[var(--color-text)]">
              {validatedCount}
              <span className="text-xl font-normal text-[var(--color-text-muted)]">/{totalSemesters}</span>
            </p>
            <div className="mt-3 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0f172a] rounded-full transition-all"
                style={{ width: totalSemesters > 0 ? `${(validatedCount / totalSemesters) * 100}%` : '0%' }}
              />
            </div>
          </div>

          {/* Cours suivis */}
          <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Cours suivis</p>
            <p className="text-4xl font-bold mt-2 text-[var(--color-text)]">{currentEnrollments.length}</p>
            {currentSem && (
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">Semestre {currentSem.number} en cours</p>
            )}
          </div>
        </div>
      </div>

      {/* Program header */}
      <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
            Parcours diplômant
          </p>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{programName}</h2>
        </div>

        {/* Semester cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {semCards.map(s => {
            const isActive = s.status === 'in_progress';
            return (
              <div
                key={s.number}
                className={`rounded-xl p-3 flex flex-col gap-1 text-center transition-colors
                  ${isActive
                    ? 'bg-[#0f172a] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
              >
                <p className={`text-[10px] font-semibold uppercase tracking-widest ${isActive ? 'text-blue-200' : 'text-[var(--color-text-muted)]'}`}>
                  Semestre {s.number}
                </p>
                <p className={`text-sm font-bold mt-0.5 ${isActive ? 'text-white' : 'text-[var(--color-text)]'}`}>
                  {semesterLabel(s)}
                </p>
                <p className={`text-[10px] mt-0.5 ${isActive ? 'text-blue-300' : 'text-[var(--color-text-muted)]'}`}>
                  {s.status !== 'future' ? s.academicYear : s.academicYear}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enrollments table */}
      <div className="bg-[var(--color-bg-elev)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-base text-[var(--color-text)]">Inscriptions semestrielles</h3>
          {firstYear && (
            <span className="text-sm text-[var(--color-text-muted)]">depuis {firstYear}</span>
          )}
        </div>

        <ScrollShadow>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Cours</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Semestre</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Présence</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Note finale</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {currentEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--color-text-muted)]">
                    Aucune inscription en cours.
                  </td>
                </tr>
              ) : currentEnrollments.map(e => {
                const badge = STATUS_BADGE[e.status] ?? { label: e.status, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };
                const rate  = e.attendanceRate != null ? parseFloat(e.attendanceRate) : null;
                const credits = e.course?.credits;
                return (
                  <tr key={e.enrollmentId} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="px-5 py-4 font-medium text-[var(--color-text)]">
                      {e.course?.courseName ?? e.courseId}
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)] font-mono text-xs">
                      {e.courseId}
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)] whitespace-nowrap">
                      S{e.semester}{credits ? ` · ${credits} crédits` : ''}
                    </td>
                    <td className="px-5 py-4">
                      {rate != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-[var(--color-text-muted)] text-xs">{rate}%</span>
                        </div>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[var(--color-text-muted)] whitespace-nowrap">
                      {e.finalGrade != null ? `${parseFloat(e.finalGrade).toFixed(2)}/20` : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ScrollShadow>
      </div>
    </div>
  );
}
