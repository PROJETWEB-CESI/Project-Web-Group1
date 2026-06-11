require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const paymentRoutes = require('./payments/payment.route');
const dunningRoutes = require('./dunning/dunning.route');
const { authenticate, authorize } = require('./middleware/auth.middleware');

const app = express();
app.disable('x-powered-by');
const port = process.env.API_PORT || 3000;

// Trust reverse proxy headers (X-Forwarded-Proto, etc.) - needed when behind nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Used by AI agent: GET /billing?userId=STU001&campusId=CAMP001
app.get('/billing', authenticate, async (req, res) => {
    const { userId, campusId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'userId est obligatoire' });
    }
    try {
        const { getBillingForAgent } = require('./payments/payment.service');
        const data = await getBillingForAgent(userId, campusId);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Full CRUD and reporting endpoints - apply auth to all payment/dunning routes
app.use('/payments', authenticate, paymentRoutes);
app.use('/dunning', authenticate, dunningRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        const Payment = require('./payments/payment.model');

        // Add notes_en column without touching existing columns (safe with RLS policies)
        await sequelize.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes_en VARCHAR(160);`);

        // Seed demo payments for test student (used in /dashboard/student?tab=payment)
        if (process.env.ENABLE_TEST_CREDENTIALS === 'true' || process.env.ENABLE_TEST_CREDENTIALS === '1') {
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

        app.listen(port, () => {
            console.log(`Billing service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
