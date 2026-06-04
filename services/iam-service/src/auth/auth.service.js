const { hashPassword, comparePassword } = require('../common/utils/bcrypt.util');
const { generateToken } = require('../common/utils/jwt.util');
const User = require('../models/User');

async function register(email, password, opts = {}) {
  if (!email || !password) {
    throw new Error('email and password are required');
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);
  const newUser = await User.create({
    email,
    passwordHash,
    role: 'student',
    campusId: opts.campusId || null,
    firstName: opts.firstName || null,
    lastName: opts.lastName || null,
  });

  const { passwordHash: _ph, ...safe } = newUser.toJSON();
  return safe;
}

async function login(email, password) {
  if (!email || !password) {
    throw new Error('email and password are required');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
    campusId: user.campusId,
  });

  const { passwordHash: _ph, ...safeUser } = user.toJSON();
  return { token, user: safeUser };
}

async function getMe(payload) {
  if (!payload || !payload.id) {
    throw new Error('Invalid token payload');
  }

  const user = await User.findByPk(payload.id, {
    attributes: { exclude: ['passwordHash'] },
  });
  if (!user) {
    throw new Error('User not found');
  }
  return user.toJSON();
}

module.exports = { register, login, getMe };
