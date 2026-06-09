require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const paymentRoutes = require('./payments/payment.route');
const dunningRoutes = require('./dunning/dunning.route');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});

// Used by AI agent: GET /api/billing?userId=STU001&campusId=CAMP001
app.get('/api/billing', async (req, res) => {
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

// Full CRUD and reporting endpoints
app.use('/api/payments', paymentRoutes);
app.use('/api/dunning', dunningRoutes);

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        // La table payments est créée et possédée par le seeder (schema.sql).
        // On ne sync pas pour ne pas entrer en conflit avec les politiques RLS.

        // Seed demo payments for test student (used in /dashboard/student?tab=payment)
        if (process.env.ENABLE_TEST_CREDENTIALS === 'true' || process.env.ENABLE_TEST_CREDENTIALS === '1') {
          const Payment = require('./payments/payment.model');
          const demoStudentId = 'STU001';
          const payments = [
            { paymentId: 'PAY001', studentId: demoStudentId, amount: 1350, dueDate: '2025-10-15', status: 'paid', academicYear: '2025-2026' },
            { paymentId: 'PAY002', studentId: demoStudentId, amount: 1350, dueDate: '2025-12-15', status: 'paid', academicYear: '2025-2026' },
            { paymentId: 'PAY003', studentId: demoStudentId, amount: 1350, dueDate: '2026-03-15', status: 'paid', academicYear: '2025-2026' },
            { paymentId: 'PAY004', studentId: demoStudentId, amount: 1350, dueDate: '2026-06-15', status: 'pending', academicYear: '2025-2026' },
          ];
          for (const p of payments) {
            await Payment.findOrCreate({ where: { paymentId: p.paymentId }, defaults: p });
          }
          console.log('[DEV] Seeded demo billing data for test student STU001 (payments)');
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
