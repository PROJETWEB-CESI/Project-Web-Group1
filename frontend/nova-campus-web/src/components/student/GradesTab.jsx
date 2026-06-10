'use client';

export default function GradesTab({ gradesData }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Notes & Évaluations — Semestre 1 2023/2024</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">MOYENNE GÉNÉRALE</div>
          <div className="text-3xl font-semibold mt-1">14,2 <span className="text-base">/20</span></div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">RANG DANS LA PROMO</div>
          <div className="text-3xl font-semibold mt-1">7 <span className="text-base">/64</span></div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elev)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">ECTS ACQUIS</div>
          <div className="text-3xl font-semibold mt-1">20 <span className="text-base">/30</span></div>
        </div>
      </div>

      <h3 className="font-medium mb-2">Détail par matière</h3>
      {gradesData.length > 0 ? gradesData.slice(0, 3).map((g, idx) => (
        <div key={idx} className="mb-4 border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-bg-elev)]">
          <div className="flex justify-between items-center mb-2">
            <div className="font-medium">{g.courseId || g.evaluationName}</div>
            <div className="text-sm">Score : <span className="font-semibold">{g.score}/{g.scoreMax}</span> (coef {g.coefficient})</div>
          </div>
        </div>
      )) : (
        <p className="text-[var(--color-text-muted)]">Aucune note disponible.</p>
      )}
      <button
        onClick={() => alert('Export bulletin (demo)')}
        className="mt-2 px-3 py-1.5 text-sm rounded bg-[var(--color-primary)] text-[var(--color-on-primary)]"
      >
        Exporter bulletin PDF
      </button>
    </div>
  );
}
