export default function TeacherKpiCards({ loading, weeklyCoursesCount, studentsCount, avgAttendanceRate, specialty, department, campusName }) {
  const dash = '—';
  const kpiClass   = 'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4';
  const labelClass = 'text-xs text-[var(--color-text-muted)]';
  const valueClass = 'text-3xl font-semibold mt-1';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className={kpiClass}>
        <div className={labelClass}>MES COURS HEBDO</div>
        <div className={valueClass}>{loading ? dash : weeklyCoursesCount ?? dash}</div>
      </div>
      <div className={kpiClass}>
        <div className={labelClass}>ÉTUDIANTS ENCADRÉS</div>
        <div className={valueClass}>{loading ? dash : studentsCount ?? dash}</div>
      </div>
      <div className={kpiClass}>
        <div className={labelClass}>PRÉSENCE MOYENNE</div>
        <div className={valueClass}>
          {loading ? dash : avgAttendanceRate != null ? `${avgAttendanceRate}%` : dash}
        </div>
      </div>
      <div className={kpiClass}>
        <div className={labelClass}>SPÉCIALITÉ</div>
        {specialty ? (
          <>
            <div className="text-lg font-semibold mt-1">{specialty}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">
              {[department ? `Dépt. ${department}` : null, campusName].filter(Boolean).join(' · ')}
            </div>
          </>
        ) : (
          <div className={valueClass}>{dash}</div>
        )}
      </div>
    </div>
  );
}
