const User = require('../models/User');
const { hashPassword } = require('../common/utils/bcrypt.util');
const { Op } = require('sequelize');

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function generateTempPassword(length = 12) {
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return pwd;
}

async function listUsers(filters = {}) {
  const where = {};
  if (filters.role) where.role = filters.role;
  if (filters.campusId) where.campusId = filters.campusId;
  if (filters.status) where.status = filters.status;

  return User.findAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    order: [['createdAt', 'DESC']],
  });
}

async function getUserById(id) {
  return User.findByPk(id, {
    attributes: { exclude: ['passwordHash'] },
  });
}

async function createUser(data) {
  const { email, password, role, campusId, firstName, lastName, studentId } = data;
  if (!email || !password) {
    throw new Error('email and password are required');
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    role: role || 'student',
    campusId: campusId || null,
    firstName: firstName || null,
    lastName: lastName || null,
    studentId: studentId || null,
  });

  const { passwordHash: _ph, ...safe } = user.toJSON();
  return safe;
}

async function updateUser(id, data) {
  const user = await User.findByPk(id);
  if (!user) return null;

  if (data.password) {
    data.passwordHash = await hashPassword(data.password);
    delete data.password;
  }

  await user.update(data);
  const { passwordHash: _ph, ...safe } = user.toJSON();
  return safe;
}

async function deleteUser(id) {
  const user = await User.findByPk(id);
  if (!user) return null;
  await user.destroy();
  return true;
}

async function resetPasswordByStudentId(studentId) {
  const user = await User.findOne({ where: { studentId } });
  if (!user) return null;

  const password = generateTempPassword();
  user.passwordHash = await hashPassword(password);
  await user.save();

  return { email: user.email, password };
}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetPasswordByStudentId,
};
