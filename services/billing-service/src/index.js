require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const paymentRoutes = require('./payments/payment.route');
const dunningRoutes = require('./dunning/dunning.route');
const { authenticate, authorize } = require('./middleware/auth.middleware');
const { seedTestPaymentsIfEnabled } = require('./seed/seedTestPayments');

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

        // Add notes_en column without touching existing columns (safe with RLS policies)
        await sequelize.query(`ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes_en VARCHAR(160);`);

        // Seed demo payments for test student (used in /dashboard/student?tab=payment)
        await seedTestPaymentsIfEnabled();

        app.listen(port, () => {
            console.log(`Billing service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
