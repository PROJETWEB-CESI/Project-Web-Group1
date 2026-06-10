'use client';

export default function AbsencesTab({ absences, justifyAbsence }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Mes absences — Semestre 1 2023/2024</h2>
      <div className="flex gap-4 mb-6">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4 flex-1">
          <div className="text-xs text-[var(--color-text-muted)]">TAUX DE PRÉSENCE</div>
          <div className="text-3xl font-semibold mt-1 text-green-600">96%</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4 flex-1">
          <div className="text-xs text-[var(--color-text-muted)]">ABSENCES TOTALES</div>
          <div className="text-3xl font-semibold mt-1">{absences.length}</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-2 sm:p-4 flex-1">
          <div className="text-xs text-[var(--color-text-muted)]">NON JUSTIFIÉES</div>
          <div className="text-3xl font-semibold mt-1 text-[var(--color-error)]">
            {absences.filter(a => !a.justified).length}{' '}
            <span className="text-base">(seuil alerte : 4)</span>
          </div>
        </div>
      </div>

      <h3 className="font-medium mb-2">Historique</h3>
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg-elev)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-surface)]">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Cours</th>
              <th className="p-3 text-left">Statut</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)] text-[var(--color-text)]">
            {absences.length > 0 ? absences.map(a => (
              <tr key={a.id}>
                <td className="p-3">{a.sessionDate}</td>
                <td className="p-3">{a.courseId}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${!a.justified ? 'bg-[var(--color-error)]/10 text-[var(--color-error)]' : 'bg-[var(--color-success)]/10 text-[var(--color-success)]'}`}>
                    {a.status}{a.justified ? ' (justifiée)' : ''}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {!a.justified && (
                    <button
                      onClick={() => justifyAbsence(a.id)}
                      className="text-sm px-3 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
                    >
                      Justifier
                    </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="p-3 text-[var(--color-text-muted)]">Aucune absence.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
