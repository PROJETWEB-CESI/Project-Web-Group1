const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(120),
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin', 'executive'),
    allowNull: false,
    defaultValue: 'student',
  },
  campusId: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  studentId: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  firstName: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING(60),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
  },
  emailNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'email_notifications',
  },
  inAppNotifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'in_app_notifications',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
