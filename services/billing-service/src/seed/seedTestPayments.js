// Test credentials default to OFF (false) if the env var is not found, empty, or any non-truthy value.
// Only "true" or "1" enable seeding of demo data.
function isTestCredentialsEnabled() {
  return process.env.ENABLE_TEST_CREDENTIALS === 'true' || process.env.ENABLE_TEST_CREDENTIALS === '1';
}

async function seedTestPaymentsIfEnabled() {
  if (!isTestCredentialsEnabled()) return;

  const Payment = require('../payments/payment.model');
  const demoStudentId = 'STU001';

  // upsert = create or update — allows fixing existing records on restart
  const payments = [
    // ── Année 2024-2025 : un impayé en retard (test badge "En retard") ──
    {
      paymentId: 'PAY005', studentId: demoStudentId, amount: 1350,
      invoiceDate: '2025-05-01', dueDate: '2025-06-15', status: 'Delay',
      academicYear: '2024-2025', semester: 2,
      notes: 'Solde de scolarité 2024-2025',
      notesEn: 'Tuition balance 2024-2025',
    },

    // ── Année 2025-2026 : 3 payés + 1 à venir ───────────────────────────
    {
      paymentId: 'PAY001', studentId: demoStudentId, amount: 1350,
      invoiceDate: '2025-09-01', dueDate: '2025-10-15', status: 'Paid',
      paymentDate: '2025-10-10', paymentMethod: 'Virement bancaire',
      academicYear: '2025-2026', semester: 1,
      notes: "Acompte d'inscription", notesEn: 'Registration deposit',
    },
    {
      paymentId: 'PAY002', studentId: demoStudentId, amount: 1350,
      invoiceDate: '2025-11-01', dueDate: '2025-12-15', status: 'Paid',
      paymentDate: '2025-12-12', paymentMethod: 'Prélèvement automatique',
      academicYear: '2025-2026', semester: 1,
      notes: 'Frais T1', notesEn: 'Term 1 fees',
    },
    {
      paymentId: 'PAY003', studentId: demoStudentId, amount: 1350,
      invoiceDate: '2026-02-01', dueDate: '2026-03-15', status: 'Paid',
      paymentDate: '2026-03-14', paymentMethod: 'Prélèvement automatique',
      academicYear: '2025-2026', semester: 2,
      notes: 'Frais T2', notesEn: 'Term 2 fees',
    },
    {
      paymentId: 'PAY004', studentId: demoStudentId, amount: 1350,
      invoiceDate: '2026-05-01', dueDate: '2026-06-15', status: 'Pending',
      academicYear: '2025-2026', semester: 2,
      notes: 'Frais T3 — solde de scolarité', notesEn: 'Term 3 — tuition balance',
    },
  ];

  for (const p of payments) {
    await Payment.upsert(p);
  }
  console.log('[DEV] Seeded demo billing data for STU001 (5 payments: Paid ×3, Pending ×1, Delay ×1)');
}

module.exports = { seedTestPaymentsIfEnabled };
