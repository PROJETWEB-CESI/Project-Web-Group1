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

        app.listen(port, () => {
            console.log(`Billing service running on port ${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

startServer();
