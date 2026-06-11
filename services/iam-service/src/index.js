require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database.config');
const authRoutes = require('./auth/auth.route');
const userRoutes = require('./users/user.route');
const { csrfProtection } = require('./middleware/csrf.middleware');
const { isTestCredentialsEnabled, seedTestUsersIfEnabled } = require('./seed/seedTestUsers');

const app = express();
app.disable('x-powered-by');
const port = process.env.API_PORT || 3000;

// Trust reverse proxy headers (X-Forwarded-Proto, etc.) - needed when behind nginx
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csrfProtection);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

const rawTestCreds = process.env.ENABLE_TEST_CREDENTIALS;
const testCredsOn = isTestCredentialsEnabled();
console.log(`[IAM] ENABLE_TEST_CREDENTIALS=${rawTestCreds} (effective: ${testCredsOn ? 'ON (will seed if needed)' : 'OFF (default when not found/empty/falsy)'})`);

// Auth endpoints are reached via gateway /api/auth/* which strips prefix,
// so mount at root to match incoming /login, /register, /validate etc.
app.use(authRoutes);

// User management mounted at /users so that gateway /api/auth/users
// (prefix-stripped) reaches here.
app.use('/users', userRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await seedTestUsersIfEnabled();

    app.listen(port, () => {
      console.log(`Auth service running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();