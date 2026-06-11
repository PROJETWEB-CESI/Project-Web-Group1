const { hashPassword } = require('../common/utils/bcrypt.util');
const User = require('../models/User');

const TEST_USERS = [
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

// Test credentials default to OFF (false) if the env var is not found, empty, or any non-truthy value.
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

async function seedTestUsersIfEnabled() {
  const isEnabled = isTestCredentialsEnabled();

  if (!isEnabled) {
    // Fully disable test credentials: remove any existing test accounts.
    // This ensures that after setting ENABLE_TEST_CREDENTIALS=false and recreating,
    // login with the test accounts will fail (as expected by the user).
    for (const tu of TEST_USERS) {
      const deleted = await User.destroy({ where: { email: tu.email } });
      if (deleted > 0) {
        console.log(`[DEV] Removed test user (ENABLE_TEST_CREDENTIALS disabled): ${tu.email}`);
      }
    }
    return;
  }

  // Enabled: seed if not already present (idempotent)
  for (const tu of TEST_USERS) {
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

module.exports = { isTestCredentialsEnabled, seedTestUsersIfEnabled };
