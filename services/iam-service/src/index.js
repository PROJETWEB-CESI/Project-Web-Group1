require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const sequelize = require('./config/database.config');
const authRoutes = require('./auth/auth.route');
const userRoutes = require('./users/user.route');
const notificationRoutes = require('./notifications/notification.route');
require('./notifications/notification.model'); // register model for sequelize.sync
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
app.use('/notifications', notificationRoutes);

async function seedTestUsersIfEnabled() {
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
      studentId: 'STU001',
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

  const isEnabled = isTestCredentialsEnabled();

  if (!isEnabled) {
    // Fully disable test credentials: remove any existing test accounts.
    // This ensures that after setting ENABLE_TEST_CREDENTIALS=false and recreating,
    // login with the test accounts will fail (as expected by the user).
    for (const tu of testUsers) {
      const deleted = await User.destroy({ where: { email: tu.email } });
      if (deleted > 0) {
        console.log(`[DEV] Removed test user (ENABLE_TEST_CREDENTIALS disabled): ${tu.email}`);
      }
    }
    return;
  }

  // Enabled: seed if not already present (idempotent)
  for (const tu of testUsers) {
    const existing = await User.findOne({ where: { email: tu.email } });
    if (existing) {
      // Update fields that may have changed (e.g. studentId added after initial seed)
      const updates = {};
      if (tu.studentId && existing.studentId !== tu.studentId) updates.studentId = tu.studentId;
      if (Object.keys(updates).length) {
        await existing.update(updates);
        console.log(`[DEV] Updated test user: ${tu.email} (${JSON.stringify(updates)})`);
      }
      continue;
    }

    const passwordHash = await hashPassword(tu.password);
    await User.create({
      email: tu.email,
      passwordHash,
      role: tu.role,
      campusId: tu.campusId,
      firstName: tu.firstName,
      lastName: tu.lastName,
      studentId: tu.studentId || null,
    });
    console.log(`[DEV] Seeded test user: ${tu.email} / ${tu.password} (role: ${tu.role})`);
  }
}

async function seedTestNotificationsIfEnabled() {
  if (!isTestCredentialsEnabled()) return;

  const User = require('./models/User');
  const Notification = require('./notifications/notification.model');

  const student = await User.findOne({ where: { email: 'student@test.com' } });
  if (!student) return;

  const now = Date.now();
  const ago = (ms) => new Date(now - ms);
  const MIN = 60 * 1000;
  const H   = 60 * MIN;
  const D   = 24 * H;

  const samples = [
    {
      type: 'timetable',
      title:   "Introduction au Business du lundi 4 déc. — salle modifiée",
      titleEn: "Intro to Business Monday Dec. 4 — room changed",
      body:    "Le cours est déplacé de B-204 à l'Amphi Commerce A. Pensez à mettre à jour votre itinéraire.",
      bodyEn:  "The course has been moved from B-204 to Amphi Commerce A. Please update your schedule.",
      source: 'Service scolarité',
      read: false,
      createdAt: ago(12 * MIN),
    },
    {
      type: 'deadline',
      title:   'Examen Économie Internationale dans 7 jours',
      titleEn: 'International Economics exam in 7 days',
      body:    'DST le 11 décembre à 09h00. Souhaitez-vous une fiche de révision ciblée ?',
      bodyEn:  'Written test on December 11 at 09:00. Would you like a targeted revision sheet?',
      source: 'Aria · automatisé',
      read: false,
      createdAt: ago(1 * H),
    },
    {
      type: 'absence',
      title:   "Justificatif accepté — absence du 4 nov.",
      titleEn: "Justification accepted — absence on Nov. 4",
      body:    "Votre certificat médical pour l'absence en Économie Internationale a été validé.",
      bodyEn:  "Your medical certificate for the absence in International Economics has been validated.",
      source: 'Service scolarité',
      read: false,
      createdAt: ago(2 * D),
    },
    {
      type: 'announcement',
      title:   'Fermeture exceptionnelle du campus — 21 déc.',
      titleEn: 'Exceptional campus closure — Dec. 21',
      body:    'Le campus sera fermé pour les vacances de Noël. Reprise des cours le 8 janvier 2024.',
      bodyEn:  'The campus will be closed for the Christmas holidays. Classes resume on January 8, 2024.',
      source: 'Direction Paris Center',
      read: false,
      createdAt: ago(3 * D),
    },
    {
      type: 'grade',
      title:   'Note Quiz 1 — Introduction au Business',
      titleEn: 'Grade Quiz 1 — Introduction to Business',
      body:    'Votre note pour le Quiz 1 du 12 octobre est désormais disponible : 15 / 20.',
      bodyEn:  'Your grade for Quiz 1 on October 12 is now available: 15 / 20.',
      source: 'Prof. Jean Mercier',
      read: false,
      createdAt: ago(4 * D),
    },
    {
      type: 'deadline',
      title:   'Inscriptions S2 — ouverture le 8 janvier 2024',
      titleEn: 'S2 Enrollments — opening January 8, 2024',
      body:    'Choix des options à valider avant le 22 janvier. Les places en Marketing Stratégique sont limitées.',
      bodyEn:  'Option choices must be confirmed before January 22. Spots in Strategic Marketing are limited.',
      source: 'Service scolarité',
      read: false,
      createdAt: ago(5 * D),
    },
  ];

  await Notification.destroy({ where: { userId: student.id } });
  for (const n of samples) {
    await Notification.create({ ...n, userId: student.id });
  }
  console.log('[DEV] Seeded demo notifications for student@test.com (6 entries, all unread)');
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    await sequelize.sync({ alter: true });
    console.log('Database synced');

    await seedTestUsersIfEnabled();
    await seedTestNotificationsIfEnabled();

    app.listen(port, () => {
      console.log(`Auth service running on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

startServer();