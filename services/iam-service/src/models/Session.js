const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.config');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  refreshTokenHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'refresh_token_hash',
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'user_agent',
  },
  ipAddress: {
    type: DataTypes.STRING(64),
    allowNull: true,
    field: 'ip_address',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'last_used_at',
  },
}, {
  tableName: 'sessions',
  timestamps: false,
});

module.exports = Session;
