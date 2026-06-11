const crypto = require('crypto');
const geoip = require('geoip-lite');
const { hashPassword, comparePassword } = require('../common/utils/bcrypt.util');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../common/utils/jwt.util');
const User = require('../models/User');
const { NOTIFICATION_CATEGORIES } = require('../models/User');
const Session = require('../models/Session');
const sseHub = require('../events/sseHub');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function locateIp(ip) {
  if (!ip) return null;
  const normalized = ip.replace('::ffff:', '');
  const geo = geoip.lookup(normalized);
  if (!geo) return null;
  return [geo.city, geo.country].filter(Boolean).join(', ') || null;
}

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

async function login(email, password, meta = {}) {
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

  const session = await Session.create({
    userId: user.id,
    refreshTokenHash: '',
    userAgent: meta.userAgent || null,
    ipAddress: meta.ip || null,
  });

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    campusId: user.campusId,
    sid: session.id,
    instructorId: user.instructorId || null,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await session.update({ refreshTokenHash: hashToken(refreshToken) });

  sseHub.broadcastToUser(user.id, 'sessions-changed');

  const { passwordHash: _ph, ...safeUser } = user.toJSON();
  return { accessToken, refreshToken, user: safeUser };
}

async function refreshTokens(refreshToken, meta = {}) {
  if (!refreshToken) {
    throw new Error('No refresh token provided');
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    throw new Error('Invalid refresh token');
  }

  const session = await Session.findOne({
    where: { id: decoded.sid, userId: decoded.id, refreshTokenHash: hashToken(refreshToken) },
  });
  if (!session) {
    throw new Error('Session has been revoked');
  }

  const payload = {
    id: decoded.id,
    email: decoded.email,
    role: decoded.role,
    campusId: decoded.campusId,
    sid: session.id,
    instructorId: decoded.instructorId || null,
  };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload); // rotate for better security

  await session.update({
    refreshTokenHash: hashToken(newRefreshToken),
    lastUsedAt: new Date(),
    userAgent: meta.userAgent || session.userAgent,
    ipAddress: meta.ip || session.ipAddress,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

async function revokeSessionByRefreshToken(refreshToken) {
  if (!refreshToken) return;
  const hash = hashToken(refreshToken);
  const session = await Session.findOne({ where: { refreshTokenHash: hash } });
  if (!session) return;
  await session.destroy();
  sseHub.broadcastToUser(session.userId, 'sessions-changed');
}

async function listSessions(userId, currentRefreshToken) {
  const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
  const sessions = await Session.findAll({
    where: { userId },
    order: [['lastUsedAt', 'DESC']],
  });

  return sessions.map((session) => ({
    id: session.id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    location: locateIp(session.ipAddress),
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    isCurrent: !!currentHash && session.refreshTokenHash === currentHash,
  }));
}

async function revokeSession(userId, sessionId) {
  const session = await Session.findOne({ where: { id: sessionId, userId } });
  if (!session) {
    throw new Error('Session not found');
  }
  await session.destroy();
  sseHub.notifySessionRevoked(sessionId);
  sseHub.broadcastToUser(userId, 'sessions-changed');
  return true;
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

  const { firstName, lastName, email, phone, address, notificationPreferences } = data;

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new Error('Email already in use');
    }
  }

  let mergedPreferences = user.notificationPreferences;
  if (notificationPreferences && typeof notificationPreferences === 'object') {
    mergedPreferences = { ...user.notificationPreferences };
    for (const category of NOTIFICATION_CATEGORIES) {
      if (notificationPreferences[category]) {
        mergedPreferences[category] = {
          ...mergedPreferences[category],
          ...notificationPreferences[category],
        };
      }
    }
  }

  await user.update({
    firstName: firstName !== undefined ? firstName : user.firstName,
    lastName: lastName !== undefined ? lastName : user.lastName,
    email: email !== undefined ? email : user.email,
    phone: phone !== undefined ? phone : user.phone,
    address: address !== undefined ? address : user.address,
    notificationPreferences: mergedPreferences,
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

module.exports = {
  register,
  login,
  refreshTokens,
  getMe,
  updateProfile,
  changePassword,
  revokeSessionByRefreshToken,
  listSessions,
  revokeSession,
};
