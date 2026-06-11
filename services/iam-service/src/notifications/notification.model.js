const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'user_id',
  },
  type: {
    type: DataTypes.ENUM('timetable', 'deadline', 'absence', 'announcement', 'grade'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(250),
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'notifications',
  timestamps: false,
});

module.exports = Notification;
