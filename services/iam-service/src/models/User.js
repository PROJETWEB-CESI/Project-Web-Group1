const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const NOTIFICATION_CATEGORIES = ['schedule', 'grades', 'payments', 'messages', 'announcements'];

const DEFAULT_NOTIFICATION_PREFERENCES = {
  schedule: { email: true, inApp: true, push: true },
  grades: { email: true, inApp: true, push: false },
  payments: { email: true, inApp: false, push: false },
  messages: { email: true, inApp: true, push: true },
  announcements: { email: true, inApp: false, push: false },
};

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
  instructorId: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'instructor_id',
  },
  specialty: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  department: {
    type: DataTypes.STRING(60),
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
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  notificationPreferences: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: DEFAULT_NOTIFICATION_PREFERENCES,
    field: 'notification_preferences',
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;
module.exports.NOTIFICATION_CATEGORIES = NOTIFICATION_CATEGORIES;
module.exports.DEFAULT_NOTIFICATION_PREFERENCES = DEFAULT_NOTIFICATION_PREFERENCES;
