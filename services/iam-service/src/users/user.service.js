const User = require('../models/User');
const { hashPassword } = require('../common/utils/bcrypt.util');
const { Op } = require('sequelize');

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
  const { email, password, role, campusId, firstName, lastName } = data;
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

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
