'use client';

export default function HistoryTab({ enrollments }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Historique académique</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
          <div className="text-xs text-[var(--color-text-muted)]">ANNÉE D'ENTRÉE</div>
          <div className="text-2xl font-semibold mt-1">2023</div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
          <div className="text-xs text-[var(--color-text-muted)]">SEMESTRES VALIDÉS</div>
          <div className="text-2xl font-semibold mt-1">0 <span className="text-base">/6</span></div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
          <div className="text-xs text-[var(--color-text-muted)]">COURS SUIVIS</div>
          <div className="text-2xl font-semibold mt-1">{enrollments.length}</div>
        </div>
        <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
          <div className="text-xs text-[var(--color-text-muted)]">STATUT</div>
          <div className="text-2xl font-semibold mt-1 text-[var(--color-success)]">Actif</div>
        </div>
      </div>

      <h3 className="font-medium mb-2">Inscriptions semestrielles</h3>
      <table className="w-full text-sm border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">
        <thead className="bg-[var(--color-surface)]">
          <tr>
            <th className="p-3 text-left">Cours</th>
            <th className="p-3 text-left">Semestre</th>
            <th className="p-3 text-left">Présence</th>
            <th className="p-3 text-left">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y text-[var(--color-text)]">
          {enrollments.length > 0 ? enrollments.map((e, i) => (
            <tr key={i}>
              <td className="p-3">{e.courseId}</td>
              <td className="p-3">S{e.semester}</td>
              <td className="p-3">{e.attendanceRate || 0}%</td>
              <td className="p-3">{e.status}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="4" className="p-3 text-[var(--color-text-muted)]">Aucune inscription.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
