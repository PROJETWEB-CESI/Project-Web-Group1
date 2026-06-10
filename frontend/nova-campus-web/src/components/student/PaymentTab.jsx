'use client';

export default function PaymentTab({ payments, payEcheance }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Paiements & Scolarité</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg bg-[var(--color-primary)] text-[var(--color-on-primary)] p-4">
          <div className="text-sm opacity-90">SOLDE RESTANT</div>
          <div className="text-3xl font-semibold mt-1">1 350 €</div>
          <div className="text-xs mt-1">Prochaine échéance : 15 juin 2026</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]">
          <div className="text-xs text-[var(--color-text-muted)]">PAYÉ 2025-26</div>
          <div className="text-3xl font-semibold mt-1">4 050 €</div>
          <div className="text-xs">3 échéances honorées</div>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] p-4 bg-[var(--color-bg-elev)]">
          <div className="text-xs text-[var(--color-text-muted)]">Bourse / Aide</div>
          <div className="text-3xl font-semibold mt-1">800 €</div>
          <div className="text-xs">CROUS échelon 2</div>
        </div>
      </div>

      <h3 className="font-medium mb-2">Échéancier</h3>
      <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-elev)]">
        {payments.length > 0 ? payments.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 border-b last:border-b-0">
            <div>
              <div>{p.dueDate || p.echeance} — {p.description || p.desc || 'Frais'}</div>
              <div className="text-sm text-[var(--color-text-muted)]">{p.amount} €</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm px-2 py-0.5 rounded ${p.status === 'paid' || p.status === 'Payé' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'}`}>
                {p.status}
              </span>
              {(p.status === 'pending' || p.status === 'À payer') && (
                <button
                  onClick={() => payEcheance(idx)}
                  className="px-3 py-1 text-sm bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded"
                >
                  Payer maintenant
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="p-3 text-[var(--color-text-muted)]">Aucun paiement disponible.</div>
        )}
      </div>
    </div>
  );
}
