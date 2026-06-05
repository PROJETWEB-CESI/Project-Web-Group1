require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database.config');
const authRoutes = require('./auth/auth.route');
const userRoutes = require('./users/user.route');

const app = express();
const port = process.env.API_PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Helper: test credentials default to OFF (false) if the env var is not found, empty, or any non-truthy value.
// Only "true", "1", "yes" (case-insensitive) enable seeding of dev accounts.
// This ensures no test data is seeded in production or when .env omits the key.
function isTestCredentialsEnabled() {
  const val = process.env.ENABLE_TEST_CREDENTIALS;
  if (val == null || val === '') {
    return false; // not found or empty in .env → default false, no seeding
  }
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes';
}

const rawTestCreds = process.env.ENABLE_TEST_CREDENTIALS;
const testCredsOn = isTestCredentialsEnabled();
console.log(`[IAM] ENABLE_TEST_CREDENTIALS=${rawTestCreds} (effective: ${testCredsOn ? 'ON (will seed if needed)' : 'OFF (default when not found/empty/falsy)'})`);

// Auth endpoints are reached via gateway /api/auth/* which strips prefix,
// so mount at root to match incoming /login, /register, /validate etc.
app.use(authRoutes);

// User management mounted at /users so that gateway /api/auth/users
// (prefix-stripped) reaches here.
app.use('/users', userRoutes);

async function seedTestUsersIfEnabled() {
  if (!isTestCredentialsEnabled()) {
    return;
  }

  const { hashPassword } = require('./common/utils/bcrypt.util');
  const User = require('./models/User');

  const testUsers = [
    {
      email: 'student@test.com',
      password: 'student123',
      role: 'student',
      campusId: 'CAMP001',
      firstName: 'Test',
      lastName: 'Student',
    },
    {
      email: 'teacher@test.com',
      password: 'teacher123',
      role: 'teacher',
      campusId: 'CAMP001',
      firstName: 'Test',
      lastName: 'Teacher',
    },
    {
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
      campusId: 'CAMP001',
      firstName: 'Test',
      lastName: 'Admin',
    },
    {
      email: 'executive@test.com',
      password: 'executive123',
      role: 'executive',
      campusId: 'CAMP001',
      firstName: 'Test',
      lastName: 'Executive',
    },
  ];

  for (const tu of testUsers) {
    const existing = await User.findOne({ where: { email: tu.email } });
    if (existing) continue;

    const passwordHash = await hashPassword(tu.password);
    await User.create({
      email: tu.email,
      passwordHash,
      role: tu.role,
      campusId: tu.campusId,
      firstName: tu.firstName,
      lastName: tu.lastName,
    });
    console.log(`[DEV] Seeded test user: ${tu.email} / ${tu.password} (role: ${tu.role})`);
  }
}

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