require('dotenv').config();
const express = require('express');
const sequelize = require('./config/database.config');
const setupAssociations = require('./config/associations');

// Ensure all models are loaded so Sequelize syncs them
require('./audit/audit.model');

const invoiceRoutes = require('./invoices/invoices.route');
const paymentRoutes = require('./payments/payments.route');
const { startDunningJob } = require('./jobs/dunning.job');

const app = express();
const PORT = process.env.PORT || 3003;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Auth stub ────────────────────────────────────────────────────────────────
// The gateway validates the JWT and forwards user claims as HTTP headers.
// For local dev without the gateway, fall back to env vars or safe defaults.
app.use((req, _res, next) => {
  req.user = {
    id: parseInt(req.headers['x-user-id'] || process.env.DEV_USER_ID || '1', 10),
    role: req.headers['x-user-role'] || process.env.DEV_USER_ROLE || 'admin',
    campusId: parseInt(req.headers['x-campus-id'] || process.env.DEV_CAMPUS_ID || '1', 10),
  };
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/invoices', invoiceRoutes);
app.use('/payments', paymentRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', service: 'billing-service' }));

// ─── Database + server startup ────────────────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    console.log('[billing-service] Database connection established.');

    setupAssociations();

    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('[billing-service] Models synchronized.');

    // Start automated dunning scheduler (skipped in test environment)
    if (process.env.NODE_ENV !== 'test') {
      startDunningJob();
    }

    app.listen(PORT, () => {
      console.log(`[billing-service] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[billing-service] Failed to start:', err);
    process.exit(1);
  }
}

start();
