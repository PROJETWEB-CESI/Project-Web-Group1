const { hashPassword, comparePassword } = require('../common/utils/bcrypt.util');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../common/utils/jwt.util');
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

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    campusId: user.campusId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const { passwordHash: _ph, ...safeUser } = user.toJSON();
  return { accessToken, refreshToken, user: safeUser };
}

async function refreshTokens(refreshToken) {
  if (!refreshToken) {
    throw new Error('No refresh token provided');
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    throw new Error('Invalid refresh token');
  }

  // Optionally, you could check against a stored list of refresh tokens for revocation (e.g. in Redis)
  const payload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    campusId: decoded.campusId,
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload); // rotate for better security

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
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

async function updateProfile(userId, data) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const { firstName, lastName, email } = data;

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error('Email already in use');
    }
  }

  await user.update({
    firstName: firstName !== undefined ? firstName : user.firstName,
    lastName: lastName !== undefined ? lastName : user.lastName,
    email: email !== undefined ? email : user.email,
  });

  const { passwordHash: _ph, ...safe } = user.toJSON();
  return safe;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return true;
}

module.exports = { register, login, refreshTokens, getMe, updateProfile, changePassword };
